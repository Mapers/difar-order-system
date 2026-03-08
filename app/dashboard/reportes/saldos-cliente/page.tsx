'use client'

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Check, ChevronDown, Search, User, X, Calendar as CalendarIcon, MapPin, Building2, Phone } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/authContext"
import { searchClientsRequest, saldoPorCobrarClienteRequest } from "@/app/api/reports"

import { ExportSaldoCobrarPdf } from "@/components/reporte/exportSaldoCobrarPdf"
import {Badge} from "@/components/ui/badge";

interface IAutocompleteClient {
    RUC: string;
    Nombre: string;
}

export default function SaldoCobrarClientePage() {
    const auth = useAuth();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedClientRuc, setSelectedClientRuc] = useState<string>("");
    const [selectedClientName, setSelectedClientName] = useState<string>("");
    const [openClientAutocomplete, setOpenClientAutocomplete] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [clientOptions, setClientOptions] = useState<IAutocompleteClient[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length > 2) {
                setLoadingOptions(true);
                try {
                    const isSeller = auth.user?.idRol === 1;
                    const vendedorCode = isSeller ? (auth.user?.codigo || null) : null;
                    const res = await searchClientsRequest(searchQuery, vendedorCode);
                    if (res.status === 200) {
                        setClientOptions(res.data.data || []);
                    }
                } catch (error) {
                    console.error("Error buscando clientes:", error);
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
        if (!selectedClientRuc) {
            toast({ title: "Atención", description: "Debe seleccionar un cliente.", variant: "warning" });
            return;
        }

        setLoading(true);
        try {
            const formattedDate = format(selectedDate, 'yyyy-MM-dd');
            const response = await saldoPorCobrarClienteRequest(selectedClientRuc, formattedDate);

            if (response.data?.data) {
                setData(response.data.data);
            } else {
                setData(null);
                toast({ description: "No se encontraron saldos para este cliente en la fecha indicada." });
            }
        } catch (error) {
            console.error("Error buscando el reporte:", error);
            toast({ title: "Error", description: "No se pudo generar el reporte.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (amount: number) => {
        return amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDateToDDMMYYYY = (dateString: string): string => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            const day = date.getUTCDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (error) {
            return dateString;
        }
    };

    return (
        <div className="grid gap-6 p-4 md:p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Saldo de Documentos por Cobrar</h1>
                <p className="text-sm md:text-base text-gray-500">Consulta los saldos pendientes agrupados por vendedor y zona para un cliente específico.</p>
            </div>

            <Card className="shadow-md">
                <CardHeader className="bg-slate-50 border-b border-slate-200 p-4">
                    <div className="grid sm:grid-cols-12 gap-4 items-end">
                        <div className="flex flex-col gap-1 sm:col-span-6 relative">
                            <div className="flex items-center gap-1.5 mb-1">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <Label>Buscar Cliente</Label>
                            </div>
                            <Popover open={openClientAutocomplete} onOpenChange={setOpenClientAutocomplete}>
                                <div className="relative w-full">
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className={cn("w-full justify-between h-10 font-normal overflow-hidden", selectedClientName && "pr-8 bg-white")}>
                                            <span className="truncate">
                                                {selectedClientName ? `${selectedClientRuc} - ${selectedClientName}` : "Buscar por Nombre o RUC..."}
                                            </span>
                                            {!selectedClientName && <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                                        </Button>
                                    </PopoverTrigger>
                                    {selectedClientName && (
                                        <div
                                            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-md z-10"
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedClientRuc(""); setSelectedClientName(""); setSearchQuery(""); setData(null); }}
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
                        <div className="flex flex-col gap-1 sm:col-span-3">
                            <div className="flex items-center gap-1.5 mb-1">
                                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                <Label>Fecha</Label>
                            </div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-white h-10", !selectedDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                        {selectedDate ? format(selectedDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 z-50" align="start">
                                    <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} initialFocus locale={es} />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 sm:col-span-3 sm:justify-end">
                            <Button onClick={handleSearch} disabled={loading || !selectedClientRuc} className="bg-blue-600 hover:bg-blue-700 w-full shadow-sm h-10">
                                <Search className="mr-2 h-4 w-4" /> Buscar
                            </Button>
                            <ExportSaldoCobrarPdf data={data} disabled={loading || !data} />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4 md:p-6 bg-slate-50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-slate-500 font-medium">Buscando documentos, por favor espera...</p>
                        </div>
                    ) : data ? (
                        <div className="space-y-6">
                            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">{data.Cliente}</h2>
                                    <p className="text-sm text-slate-600 mt-1"><span className="font-semibold">RUC:</span> {data.RUC}</p>
                                    <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">{data.NombreComercial}</p>
                                </div>
                                <div className="md:text-right space-y-1">
                                    <p className="text-sm text-slate-600 flex items-center md:justify-end gap-1">{data.Direccion}</p>
                                    <p className="text-sm text-slate-600 flex items-center md:justify-end gap-1">{data.Telefono || 'N/A'}</p>
                                    <p className="text-sm font-semibold text-blue-700 mt-2">{format(new Date(data.FechaCorte), 'dd/MM/yyyy')}</p>
                                </div>
                            </div>

                            {data.vendedores.map((vend: any, vIdx: number) => (
                                <div key={vIdx} className="border border-slate-300 rounded-lg overflow-hidden shadow-sm bg-white">
                                    <div className="bg-slate-800 text-white p-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                        <span className="font-bold text-sm md:text-base">Vendedor: {vend.Vendedor}</span>
                                        <span className="text-xs bg-slate-700 px-3 py-1 rounded-full font-medium border border-slate-600 w-fit">
                                            Zona: {vend.NombreZona}
                                        </span>
                                    </div>

                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-xs text-left text-slate-600">
                                            <thead className="text-[10px] md:text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
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
                                            <tbody className="divide-y divide-slate-100">
                                            {vend.documentos.map((doc: any, dIdx: number) => {
                                                const isSoles = doc.Tipo_Moneda === 'NSO' || doc.Moneda === 'S/.';
                                                return (
                                                    <tr key={dIdx} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-3 py-2 whitespace-nowrap">{formatDateToDDMMYYYY(doc.Fecha_Emision)}</td>
                                                        <td className="px-3 py-2 whitespace-nowrap text-red-600 font-medium">{formatDateToDDMMYYYY(doc.Fecha_Vcto)}</td>
                                                        <td className="px-3 py-2 font-medium">{doc.TipoDocumento}</td>
                                                        <td className="px-3 py-2 font-mono font-semibold">{doc.SerieDoc}-{doc.NumeroDoc}</td>
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

                                    <div className="grid grid-cols-1 gap-3 p-3 md:hidden bg-slate-50">
                                        {vend.documentos.map((doc: any, dIdx: number) => {
                                            const isSoles = doc.Tipo_Moneda === 'NSO' || doc.Moneda === 'S/.';
                                            return (
                                                <div key={dIdx} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col gap-3">
                                                    <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                                                        <div>
                                                            <span className="text-[10px] uppercase font-bold text-slate-400">{doc.TipoDocumento}</span>
                                                            <p className="font-mono font-bold text-sm text-slate-800">{doc.SerieDoc}-{doc.NumeroDoc}</p>
                                                        </div>
                                                        <Badge variant="outline" className="font-bold">{doc.Moneda}</Badge>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div>
                                                            <span className="text-slate-500">Emisión:</span>
                                                            <p className="font-medium text-slate-700">{formatDateToDDMMYYYY(doc.Fecha_Emision)}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500">Vencimiento:</span>
                                                            <p className="font-medium text-red-600">{formatDateToDDMMYYYY(doc.Fecha_Vcto)}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500">Provisión:</span>
                                                            <p className="font-medium">{formatMoney(doc.SumaProvision)}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500">Amortización:</span>
                                                            <p className="font-medium">{formatMoney(doc.SumaAmortizacion)}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                                        <span className="text-xs font-bold uppercase text-slate-500">Saldo Final:</span>
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

                            <div className="bg-white border border-blue-200 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center shadow-md mt-4">
                                <span className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-2 sm:mb-0">Deuda Total Consolidada</span>
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
                        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border-2 border-dashed border-slate-200">
                            <p className="text-slate-500 font-medium text-center px-4">
                                Utiliza el buscador para seleccionar un cliente.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}