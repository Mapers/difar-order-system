'use client'

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Check, ChevronDown, Search, User, X, Calendar as CalendarIcon, MapPin, Users } from "lucide-react"
import { toast } from "@/app/hooks/useToast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/authContext"
import { searchClientsRequest, fetchAvailableZones } from "@/app/api/reports"
import apiClient from "@/app/api/client"

import { ExportSaldoCobrarPdf } from "@/components/reporte/exportSaldoCobrarPdf"
import { DocumentoPdfLink } from "@/components/reporte/DocumentoPdfLink"
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface IAutocompleteClient {
    RUC: string;
    Nombre: string;
}

export default function SaldoCobrarClientePage() {
    const auth = useAuth();
    const isManagerOrAdmin = auth.isAdmin();
    const isRepresentative = auth.isRepresentante();
    const isVendor = auth.isVendedor();

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    type SearchMode = 'fecha' | 'mes'
    const [searchMode, setSearchMode] = useState<SearchMode>('fecha')
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
    const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
    const currentYear = new Date().getFullYear()
    const YEARS = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]

    const [selectedClientRuc, setSelectedClientRuc] = useState<string>("");
    const [selectedClientName, setSelectedClientName] = useState<string>("");
    const [selectedZone, setSelectedZone] = useState<string>("");
    const [selectedSeller, setSelectedSeller] = useState<string>("");

    const [openClientAutocomplete, setOpenClientAutocomplete] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [clientOptions, setClientOptions] = useState<IAutocompleteClient[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    const [zones, setZones] = useState<any[]>([]);
    const [sellers, setSellers] = useState<any[]>([]);
    const [openZone, setOpenZone] = useState(false);
    const [openSeller, setOpenSeller] = useState(false);

    useEffect(() => {
        const loadCatalogs = async () => {
            try {
                const resZones = await fetchAvailableZones();
                setZones(resZones.data?.data || []);
                if (isManagerOrAdmin) {
                    const resSellers = await apiClient.get('/usuarios/listar/vendedores');
                    const vendedoresTransformados = resSellers.data.data.data.map((v: any) => ({
                        idVendedor: String(v.idVendedor),
                        codigo: v.Codigo_Vend,
                        nombres: v.Nombres,
                        apellidos: v.Apellidos
                    }));
                    setSellers(vendedoresTransformados);
                } else if (isRepresentative) {
                    const repVends = auth.user?.vendedores?.map(v => ({
                        idVendedor: String(v.idVendedor),
                        codigo: v.codigo,
                        nombres: v.Nombres,
                        apellidos: ''
                    })) || [];
                    setSellers(repVends);
                } else if (isVendor) {
                    if (auth.user?.codigo) setSelectedSeller(auth.user.codigo);
                }
            } catch (error) {
                console.error("Error cargando catálogos", error);
            }
        };
        loadCatalogs();
    }, [isManagerOrAdmin, auth.user]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length > 2) {
                setLoadingOptions(true);
                try {
                    const vendedorCode = isVendor ? (auth.user?.codigo || null) : null;
                    const represCode = isRepresentative ? (auth.user?.codRepres || null) : null;
                    const res = await searchClientsRequest(searchQuery, vendedorCode, represCode);
                    if (res.status === 200) {
                        setClientOptions(res.data.data || []);
                    }
                } catch (error) {
                    console.error("Error buscando cliente-cobranza:", error);
                } finally {
                    setLoadingOptions(false);
                }
            } else {
                setClientOptions([]);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [searchQuery, auth.user]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const body: Record<string, any> = {
                doc_cliente: selectedClientRuc || null,
                idZona: selectedZone || null,
                codVendedor: selectedSeller || null
            };
            if (searchMode === 'fecha') {
                body.fecha = format(selectedDate, 'yyyy-MM-dd');
            } else {
                body.mes = selectedMonth;
                body.anio = selectedYear;
            }

            const response = await apiClient.post('/reportes/saldo-por-cobrar-cliente', body);

            let reportData = response.data?.data;

            if (reportData && reportData.Clientes) {
                let allowedVendors: string[] = [];

                if (isRepresentative && !selectedSeller) {
                    allowedVendors = auth.user?.vendedores?.map(v => v.codigo) || [];
                    if (allowedVendors.length === 0) allowedVendors = ['SIN_VENDEDORES'];
                } else if (isVendor && !selectedSeller) {
                    allowedVendors = auth.user?.codigo ? [auth.user.codigo] : [];
                } else if (selectedSeller) {
                    allowedVendors = [selectedSeller];
                }

                if (allowedVendors.length > 0) {
                    let newTotalSoles = 0;
                    let newTotalDolares = 0;

                    const filteredClientes = reportData.Clientes.map((cli: any) => {
                        const filteredVends = cli.vendedores.filter((v: any) => {
                            const codigoVendedor = v.CodigoVend || v.Vendedor.split(' ')[0];
                            return allowedVendors.includes(codigoVendedor);
                        });
                        return { ...cli, vendedores: filteredVends };
                    }).filter((cli: any) => cli.vendedores.length > 0);

                    filteredClientes.forEach((cli: any) => {
                        cli.vendedores.forEach((v: any) => {
                            v.documentos.forEach((doc: any) => {
                                if (doc.Tipo_Moneda === 'NSO' || doc.Moneda === 'S/.') {
                                    newTotalSoles += Number(doc.Saldo) || 0;
                                } else {
                                    newTotalDolares += Number(doc.Saldo) || 0;
                                }
                            });
                        });
                    });

                    reportData = {
                        ...reportData,
                        Clientes: filteredClientes,
                        TotalSoles: newTotalSoles,
                        TotalDolares: newTotalDolares
                    };
                }
            }

            if (reportData && reportData.Clientes && reportData.Clientes.length > 0) {
                setData(reportData);
            } else {
                setData(null);
                toast({ description: "No se encontraron saldos con los filtros indicados." });
            }
        } catch (error) {
            console.error("Error buscando el reporte:", error);
            toast({ title: "Error", description: "No se pudo generar el reporte.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (amount: number) => amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formatDateToDDMMYYYY = (dateString: string): string => {
        if (!dateString) return '-';
        try {
            const [y, m, d] = dateString.split('T')[0].split('-');
            if (y && m && d) return `${d}/${m}/${y}`;
            return dateString;
        } catch { return dateString; }
    };

    return (
        <div className="grid gap-6 p-4 md:p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Saldo de Documentos por Cobrar</h1>
                <p className="text-sm md:text-base text-muted-foreground">Consulta los saldos pendientes agrupados por vendedor y zona.</p>
            </div>

            <Card className="shadow-md">
                <CardHeader className="bg-muted border-b border-border p-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">

                        <div className="flex flex-col gap-1 md:col-span-4 relative">
                            <div className="flex items-center gap-1.5 mb-1">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <Label>Cliente (Opcional)</Label>
                            </div>
                            <Popover open={openClientAutocomplete} onOpenChange={setOpenClientAutocomplete}>
                                <div className="relative w-full">
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className={cn("w-full justify-between h-10 font-normal overflow-hidden", selectedClientName && "pr-8 bg-background")}>
                                            <span className="truncate">
                                                {selectedClientName ? `${selectedClientRuc} - ${selectedClientName}` : "Todos los cliente-cobranza..."}
                                            </span>
                                            {!selectedClientName && <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                                        </Button>
                                    </PopoverTrigger>
                                    {selectedClientName && (
                                        <div
                                            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-md z-10"
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedClientRuc(""); setSelectedClientName(""); setSearchQuery(""); }}
                                        >
                                            <X className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput placeholder="Escriba Nombre o RUC..." value={searchQuery} onValueChange={setSearchQuery} />
                                        <CommandList>
                                            {loadingOptions && <div className="p-4 text-sm text-center text-muted-foreground">Buscando...</div>}
                                            {!loadingOptions && clientOptions.length === 0 && searchQuery.length > 2 && <CommandEmpty>No se encontraron clientes.</CommandEmpty>}
                                            <CommandGroup>
                                                {clientOptions.map((client) => (
                                                    <CommandItem
                                                        key={client.RUC}
                                                        value={client.Nombre}
                                                        onSelect={() => {
                                                            setSelectedClientRuc(client.RUC);
                                                            setSelectedClientName(client.Nombre);
                                                            setOpenClientAutocomplete(false);
                                                        }}
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4 flex-shrink-0", selectedClientRuc === client.RUC ? "opacity-100" : "opacity-0")} />
                                                        <span className="truncate">{client.RUC} - {client.Nombre}</span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className={`flex flex-col gap-1 ${isManagerOrAdmin ? 'md:col-span-2' : 'md:col-span-3'}`}>
                            <div className="flex items-center gap-1.5 mb-1">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <Label>Zonas (Opcional)</Label>
                            </div>
                            <Popover open={openZone} onOpenChange={setOpenZone}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="justify-between w-full h-10 font-normal bg-background">
                                        <span className="truncate">
                                            {selectedZone ? zones.find(z => z.IdZona === selectedZone)?.NombreZona : "Todas las zonas..."}
                                        </span>
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Buscar zona..." />
                                        <CommandList>
                                            <CommandEmpty>No se encontraron zonas.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem onSelect={() => { setSelectedZone(""); setOpenZone(false); }}>
                                                    <Check className={cn("mr-2 h-4 w-4", selectedZone === "" ? "opacity-100" : "opacity-0")} />
                                                    Todas las zonas...
                                                </CommandItem>
                                                {zones.map((z) => (
                                                    <CommandItem key={z.IdZona} onSelect={() => { setSelectedZone(z.IdZona); setOpenZone(false); }}>
                                                        <Check className={cn("mr-2 h-4 w-4", selectedZone === z.IdZona ? "opacity-100" : "opacity-0")} />
                                                        {z.NombreZona}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {isManagerOrAdmin && (
                            <div className="flex flex-col gap-1 md:col-span-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <Label>Vendedor (Opcional)</Label>
                                </div>
                                <Popover open={openSeller} onOpenChange={setOpenSeller}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="justify-between w-full h-10 font-normal bg-background">
                                            <span className="truncate">
                                                {selectedSeller ? sellers.find(s => s.codigo === selectedSeller)?.nombres : "Todos los vendedores..."}
                                            </span>
                                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Buscar vendedor..." />
                                            <CommandList>
                                                <CommandEmpty>No se encontraron vendedores.</CommandEmpty>
                                                <CommandGroup>
                                                    <CommandItem onSelect={() => { setSelectedSeller(""); setOpenSeller(false); }}>
                                                        <Check className={cn("mr-2 h-4 w-4", selectedSeller === "" ? "opacity-100" : "opacity-0")} />
                                                        Todos los vendedores...
                                                    </CommandItem>
                                                    {sellers.map((s) => (
                                                        <CommandItem key={s.codigo} onSelect={() => { setSelectedSeller(s.codigo); setOpenSeller(false); }}>
                                                            <Check className={cn("mr-2 h-4 w-4", selectedSeller === s.codigo ? "opacity-100" : "opacity-0")} />
                                                            {s.nombres} {s.apellidos}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}

                        <div className={`flex flex-col gap-1 ${isManagerOrAdmin ? 'md:col-span-3' : 'md:col-span-5'}`}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                    <Label>{searchMode === 'fecha' ? 'Fecha Corte' : 'Mes / Año'}</Label>
                                </div>
                                <div className="flex rounded-md overflow-hidden border border-border text-xs">
                                    <button
                                        type="button"
                                        className={`px-2 py-0.5 transition-colors ${searchMode === 'fecha' ? 'bg-blue-600 text-white' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                                        onClick={() => setSearchMode('fecha')}
                                    >Corte</button>
                                    <button
                                        type="button"
                                        className={`px-2 py-0.5 transition-colors border-l border-border ${searchMode === 'mes' ? 'bg-blue-600 text-white' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                                        onClick={() => setSearchMode('mes')}
                                    >Mes</button>
                                </div>
                            </div>
                            {searchMode === 'fecha' ? (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-background h-10", !selectedDate && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                            {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: es }) : <span>Seleccionar</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 z-50" align="start">
                                        <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} initialFocus locale={es} />
                                    </PopoverContent>
                                </Popover>
                            ) : (
                                <div className="flex gap-2">
                                    <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                                        <SelectTrigger className="h-10 bg-background flex-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MONTHS.map((name, i) => (
                                                <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                                        <SelectTrigger className="h-10 bg-background w-[80px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {YEARS.map(y => (
                                                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 md:col-span-12 md:justify-end mt-2">
                            <Button onClick={handleSearch} disabled={loading} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto shadow-sm h-10">
                                <Search className="mr-2 h-4 w-4" /> Buscar
                            </Button>
                            <ExportSaldoCobrarPdf
                                data={data}
                                dateCorte={searchMode === 'fecha' ? selectedDate : undefined}
                                mes={searchMode === 'mes' ? selectedMonth : undefined}
                                anio={searchMode === 'mes' ? selectedYear : undefined}
                                disabled={loading || !data}
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4 md:p-6 bg-muted">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-muted-foreground font-medium">Buscando documentos, por favor espera...</p>
                        </div>
                    ) : data ? (
                        <div className="space-y-8">

                            {data.Clientes.map((cliente: any, cIdx: number) => (
                                <div key={cIdx} className="space-y-4">
                                    <div className="bg-background p-4 rounded-lg border border-border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">{cliente.Cliente}</h2>
                                            <p className="text-sm text-muted-foreground mt-1"><span className="font-semibold">RUC:</span> {cliente.RUC}</p>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">{cliente.NombreComercial}</p>
                                        </div>
                                        <div className="md:text-right space-y-1">
                                            <p className="text-sm text-muted-foreground flex items-center md:justify-end gap-1">{cliente.Direccion}</p>
                                            <p className="text-sm text-muted-foreground flex items-center md:justify-end gap-1">{cliente.Telefono || 'N/A'}</p>
                                        </div>
                                    </div>

                                    {cliente.vendedores.map((vend: any, vIdx: number) => (
                                        <div key={vIdx} className="border border-border rounded-lg overflow-hidden shadow-sm bg-background ml-0 md:ml-4">
                                            <div className="bg-slate-800 text-white p-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                                <span className="font-bold text-sm md:text-base">Vendedor: {vend.Vendedor}</span>
                                                <span className="text-xs bg-slate-700 px-3 py-1 rounded-full font-medium border border-slate-600 w-fit">
                                                    Zona: {vend.NombreZona}
                                                </span>
                                            </div>

                                            <div className="hidden md:block overflow-x-auto">
                                                <table className="w-full text-xs text-left text-muted-foreground">
                                                    <thead className="text-[10px] md:text-xs text-muted-foreground uppercase bg-muted border-b border-border">
                                                    <tr>
                                                        <th className="px-3 py-3 font-bold whitespace-nowrap">Emisión</th>
                                                        <th className="px-3 py-3 font-bold whitespace-nowrap">Vencimiento</th>
                                                        <th className="px-3 py-3 font-bold whitespace-nowrap">Documento</th>
                                                        <th className="px-3 py-3 font-bold whitespace-nowrap">Nro Doc</th>
                                                        <th className="px-3 py-3 font-bold text-center">M</th>
                                                        <th className="px-3 py-3 font-bold text-right">Provisión</th>
                                                        <th className="px-3 py-3 font-bold text-right">Amortización</th>
                                                        <th className="px-3 py-3 font-bold text-right text-blue-700">Saldo S/.</th>
                                                        <th className="px-3 py-3 font-bold text-right text-green-700">Saldo US$</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border">
                                                    {vend.documentos.map((doc: any, dIdx: number) => {
                                                        const isSoles = doc.Tipo_Moneda === 'NSO' || doc.Moneda === 'S/.';
                                                        return (
                                                            <tr key={dIdx} className="hover:bg-muted transition-colors">
                                                                <td className="px-3 py-2 whitespace-nowrap">{formatDateToDDMMYYYY(doc.Fecha_Emision)}</td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-red-600 font-medium">{formatDateToDDMMYYYY(doc.Fecha_Vcto)}</td>
                                                                <td className="px-3 py-2 font-medium">{doc.TipoDocumento}</td>
                                                                <td className="px-3 py-2 font-mono font-semibold">
                                                                    <DocumentoPdfLink numeroComprobante={doc.SerieDoc && doc.NumeroDoc ? `${doc.SerieDoc}-${doc.NumeroDoc}` : null} existeComprobante={!!doc.existeComprobante} />
                                                                </td>
                                                                <td className="px-3 py-2 text-center font-bold">{doc.Moneda}</td>
                                                                <td className="px-3 py-2 text-right">{formatMoney(doc.SumaProvision)}</td>
                                                                <td className="px-3 py-2 text-right">{formatMoney(doc.SumaAmortizacion)}</td>
                                                                <td className="px-3 py-2 text-right font-bold text-blue-700 bg-blue-50/30">
                                                                    {isSoles ? formatMoney(doc.Saldo) : '-'}
                                                                </td>
                                                                <td className="px-3 py-2 text-right font-bold text-green-700 bg-green-50/30">
                                                                    {!isSoles ? formatMoney(doc.Saldo) : '-'}
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3 p-3 md:hidden bg-muted">
                                                {vend.documentos.map((doc: any, dIdx: number) => {
                                                    const isSoles = doc.Tipo_Moneda === 'NSO' || doc.Moneda === 'S/.';
                                                    return (
                                                        <div key={dIdx} className="bg-background border border-border rounded-lg p-3 shadow-sm flex flex-col gap-3">
                                                            <div className="flex justify-between items-start border-b border-border pb-2">
                                                                <div>
                                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{doc.TipoDocumento}</span>
                                                                    <p className="font-mono font-bold text-sm text-foreground">
                                                                        <DocumentoPdfLink numeroComprobante={doc.SerieDoc && doc.NumeroDoc ? `${doc.SerieDoc}-${doc.NumeroDoc}` : null} existeComprobante={!!doc.existeComprobante} />
                                                                    </p>
                                                                </div>
                                                                <Badge variant="outline" className="font-bold">{doc.Moneda}</Badge>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                                <div>
                                                                    <span className="text-muted-foreground">Emisión:</span>
                                                                    <p className="font-medium text-foreground">{formatDateToDDMMYYYY(doc.Fecha_Emision)}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-muted-foreground">Vcto:</span>
                                                                    <p className="font-medium text-red-600">{formatDateToDDMMYYYY(doc.Fecha_Vcto)}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-muted-foreground">Prov:</span>
                                                                    <p className="font-medium">{formatMoney(doc.SumaProvision)}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-muted-foreground">Amort:</span>
                                                                    <p className="font-medium">{formatMoney(doc.SumaAmortizacion)}</p>
                                                                </div>
                                                            </div>

                                                            <div className="flex justify-between items-center pt-2 border-t border-border">
                                                                <span className="text-xs font-bold uppercase text-muted-foreground">Saldo Final:</span>
                                                                <span className={cn("text-base font-bold", isSoles ? "text-blue-700" : "text-green-700")}>
                                                                    {doc.Moneda} {formatMoney(doc.Saldo)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}

                            <div className="bg-background border border-blue-200 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center shadow-md mt-6 sticky bottom-4">
                                <span className="text-sm font-bold uppercase tracking-wider text-foreground mb-2 sm:mb-0">Deuda Total Global</span>
                                <div className="flex gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
                                    <div className="text-center sm:text-right bg-blue-50 p-2 rounded-md sm:bg-transparent sm:p-0 flex-1 sm:flex-none border border-blue-100 sm:border-none">
                                        <p className="text-xs text-blue-600 font-semibold uppercase">Total Soles</p>
                                        <p className="text-lg sm:text-xl font-bold text-blue-800">S/ {formatMoney(data.TotalSoles)}</p>
                                    </div>
                                    <div className="text-center sm:text-right bg-green-50 p-2 rounded-md sm:bg-transparent sm:p-0 flex-1 sm:flex-none border border-green-100 sm:border-none">
                                        <p className="text-xs text-green-600 font-semibold uppercase">Total Dólares</p>
                                        <p className="text-lg sm:text-xl font-bold text-green-800">US$ {formatMoney(data.TotalDolares)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 bg-background rounded-lg border-2 border-dashed border-border">
                            <p className="text-muted-foreground font-medium text-center px-4">
                                Utiliza los filtros para buscar el saldo por cobrar.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}