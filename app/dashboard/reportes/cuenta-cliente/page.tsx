'use client'

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Check, ChevronDown, Search, User, X, Calendar as CalendarIcon, MapPin, Phone, Building2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/authContext"
import { searchClientsRequest, estadoCuentaClienteRequest } from "@/app/api/reports"

import { ExportEstadoCuentaPdf } from "@/components/reporte/exportEstadoCuentaPdf"

interface IAutocompleteClient {
    RUC: string;
    Nombre: string;
}

export default function EstadoCuentaClientePage() {
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
            const response = await estadoCuentaClienteRequest(selectedClientRuc, formattedDate);

            if (response.data?.data) {
                setData(response.data.data);
            } else {
                setData(null);
                toast({ description: "No se encontraron movimientos para este cliente en la fecha indicada." });
            }
        } catch (error) {
            console.error("Error buscando el estado de cuenta:", error);
            toast({ title: "Error", description: "No se pudo generar el estado de cuenta.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (amount: number) => amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const formatDateToDDMMYYYY = (dateString: string): string => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            return `${date.getUTCDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        } catch {
            return dateString;
        }
    };

    return (
        <div className="grid gap-6 p-4 md:p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Estado de Cuenta Cliente</h1>
                <p className="text-sm md:text-base text-gray-500">Consulta todos los movimientos detallados de los documentos y el cálculo de saldos.</p>
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
                            <ExportEstadoCuentaPdf data={data} disabled={loading || !data} />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4 md:p-6 bg-slate-100">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-slate-500 font-medium">Buscando movimientos, por favor espera...</p>
                        </div>
                    ) : data ? (
                        <div className="space-y-6">
                            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">{data.NombreComercial || data.Cliente}</h2>
                                    <p className="text-sm text-slate-600 mt-1 font-semibold">{data.RUC}   <span className="font-normal">{data.Cliente}</span></p>
                                    <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">{data.Direccion}</p>
                                </div>
                                <div className="md:text-right space-y-1">
                                    <p className="text-sm text-slate-600 flex items-center md:justify-end gap-1">{data.Telefono || 'N/A'}</p>
                                    <p className="text-sm font-semibold text-blue-700 mt-2">{formatDateToDDMMYYYY(data.FechaCorte)}</p>
                                </div>
                            </div>

                            {data.Documentos.map((doc: any, dIdx: number) => {
                                let sumProvision = 0;
                                let sumAmortizacion = 0;

                                return (
                                    <div key={dIdx} className="border border-slate-300 rounded-lg overflow-hidden shadow-sm bg-white">
                                        <div className="bg-slate-200 text-slate-800 p-3 flex flex-col sm:flex-row sm:items-center gap-4 text-xs md:text-sm">
                                            <div className="font-bold border-r border-slate-400 pr-4">Documento: {doc.Abreviatura}</div>
                                            <div className="font-bold border-r border-slate-400 pr-4">{doc.SerieNumero}</div>
                                            <div className="border-r border-slate-400 pr-4">Emisión: <span className="font-semibold">{formatDateToDDMMYYYY(doc.Emision)}</span></div>
                                            <div>Vencimiento: <span className="font-semibold">{formatDateToDDMMYYYY(doc.Vencimiento)}</span></div>
                                        </div>

                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full text-xs text-left text-slate-600">
                                                <thead className="text-[10px] md:text-xs text-slate-500 uppercase bg-white border-b border-slate-200">
                                                <tr>
                                                    <th className="px-3 py-2 font-bold whitespace-nowrap">Fecha</th>
                                                    <th className="px-3 py-2 font-bold">Descripción</th>
                                                    <th className="px-3 py-2 font-bold text-center">Moneda</th>
                                                    <th className="px-3 py-2 font-bold text-right">Provisión</th>
                                                    <th className="px-3 py-2 font-bold text-right">Amortización</th>
                                                    <th className="px-3 py-2 font-bold text-right">Saldo S/.</th>
                                                    <th className="px-3 py-2 font-bold text-right">Saldo US$</th>
                                                </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                {doc.Movimientos.map((mov: any, mIdx: number) => {
                                                    sumProvision += mov.Provision;
                                                    sumAmortizacion += mov.Amortizacion;
                                                    const isSoles = mov.Moneda === 'S/.' || mov.Moneda === 'NSO';

                                                    return (
                                                        <tr key={mIdx} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-3 py-2 whitespace-nowrap">{formatDateToDDMMYYYY(mov.Fecha)}</td>
                                                            <td className="px-3 py-2">{mov.Descripcion}</td>
                                                            <td className="px-3 py-2 text-center font-bold">{mov.Moneda}</td>
                                                            <td className="px-3 py-2 text-right">{formatMoney(mov.Provision)}</td>
                                                            <td className="px-3 py-2 text-right">{formatMoney(mov.Amortizacion)}</td>
                                                            <td className="px-3 py-2 text-right">{isSoles ? formatMoney(mov.SaldoSoles) : '0.00'}</td>
                                                            <td className="px-3 py-2 text-right">{!isSoles ? formatMoney(mov.SaldoDolares) : '0.00'}</td>
                                                        </tr>
                                                    )})}
                                                </tbody>
                                                <tfoot className="bg-slate-50 border-t border-slate-300 font-bold">
                                                <tr>
                                                    <td colSpan={3} className="px-3 py-3 text-right text-slate-700">SALDO: {doc.Abreviatura} Nro. {doc.SerieNumero}</td>
                                                    <td className="px-3 py-3 text-right text-slate-800">{formatMoney(sumProvision)}</td>
                                                    <td className="px-3 py-3 text-right text-slate-800">{formatMoney(sumAmortizacion)}</td>
                                                    <td className="px-3 py-3 text-right text-slate-800">{formatMoney(doc.SaldoFinalSoles)}</td>
                                                    <td className="px-3 py-3 text-right text-slate-800">{formatMoney(doc.SaldoFinalDolares)}</td>
                                                </tr>
                                                </tfoot>
                                            </table>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2 p-3 md:hidden bg-slate-50">
                                            {doc.Movimientos.map((mov: any, mIdx: number) => (
                                                <div key={mIdx} className="bg-white border border-slate-200 rounded-md p-3 shadow-sm flex flex-col gap-2">
                                                    <div className="flex justify-between items-start border-b border-slate-100 pb-1">
                                                        <span className="font-bold text-xs text-slate-600">{formatDateToDDMMYYYY(mov.Fecha)}</span>
                                                        <Badge variant="outline" className="font-bold">{mov.Moneda}</Badge>
                                                    </div>
                                                    <div className="text-xs text-slate-700 font-medium">
                                                        {mov.Descripcion}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                                                        <div className="bg-slate-50 p-1.5 rounded text-center">
                                                            <span className="text-slate-400 block text-[10px] uppercase">Provisión</span>
                                                            <span className="font-bold text-slate-800">{formatMoney(mov.Provision)}</span>
                                                        </div>
                                                        <div className="bg-slate-50 p-1.5 rounded text-center">
                                                            <span className="text-slate-400 block text-[10px] uppercase">Amortización</span>
                                                            <span className="font-bold text-slate-800">{formatMoney(mov.Amortizacion)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center pt-1">
                                                        <span className="text-xs font-bold text-slate-500">Saldo:</span>
                                                        <div className="text-right">
                                                            <span className="text-sm font-bold text-slate-800 block">{mov.Moneda} {(mov.Moneda === 'S/.' || mov.Moneda === 'NSO') ? formatMoney(mov.SaldoSoles) : formatMoney(mov.SaldoDolares)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="bg-slate-200 p-3 rounded-md flex justify-between items-center mt-2">
                                                <span className="text-xs font-bold text-slate-700">SALDO TOTAL DOC:</span>
                                                <span className="font-bold text-sm text-slate-900">{formatMoney(doc.SaldoFinalSoles)} S/. | {formatMoney(doc.SaldoFinalDolares)} US$</span>
                                            </div>
                                        </div>
                                    </div>
                                )})}

                            <div className="bg-white border border-blue-200 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center shadow-md mt-4">
                                <span className="text-sm font-bold tracking-wider text-slate-800 mb-2 sm:mb-0">SALDO Cliente:</span>
                                <div className="flex gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
                                    <div className="text-center sm:text-right flex-1 sm:flex-none">
                                        <p className="text-xs text-slate-500 font-semibold uppercase">Total Soles</p>
                                        <p className="text-lg sm:text-xl font-bold text-slate-800">{formatMoney(data.TotalSoles)}</p>
                                    </div>
                                    <div className="text-center sm:text-right flex-1 sm:flex-none">
                                        <p className="text-xs text-slate-500 font-semibold uppercase">Total Dólares</p>
                                        <p className="text-lg sm:text-xl font-bold text-slate-800">{formatMoney(data.TotalDolares)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border-2 border-dashed border-slate-200">
                            <p className="text-slate-500 font-medium text-center px-4">Utiliza el buscador para seleccionar un cliente.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}