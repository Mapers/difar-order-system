'use client'

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Check, ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Search, User, X, Calendar as CalendarIcon, MapPin, Phone, Building2 } from "lucide-react"
import { toast } from "@/app/hooks/useToast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/authContext"
import { estadoCuentaClienteRequest } from "@/app/api/reports"

import { ExportEstadoCuentaPdf } from "@/components/reporte/exportEstadoCuentaPdf"
import { DocumentoPdfLink } from "@/components/reporte/DocumentoPdfLink"
import { BuscadorClienteReporte, ClienteBusqueda } from "@/components/reporte/BuscadorClienteReporte"

export default function EstadoCuentaClientePage() {
    const auth = useAuth();

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    // Documentos abiertos en el acordeón: con cada búsqueda empiezan todos cerrados.
    const [docsAbiertos, setDocsAbiertos] = useState<Set<number>>(new Set());
    useEffect(() => { setDocsAbiertos(new Set()); }, [data]);
    const alternarDoc = (i: number) => setDocsAbiertos(prev => {
        const sig = new Set(prev);
        if (sig.has(i)) sig.delete(i); else sig.add(i);
        return sig;
    });
    const conSaldo = (data?.Documentos ?? []).filter((d: any) =>
        Math.abs(Number(d.SaldoFinalSoles || 0)) > 0.005 || Math.abs(Number(d.SaldoFinalDolares || 0)) > 0.005).length;

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedClientRuc, setSelectedClientRuc] = useState<string>("");
    const [selectedClientName, setSelectedClientName] = useState<string>("");

    const [clienteSel, setClienteSel] = useState<ClienteBusqueda | null>(null);

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
        <div className="grid grid-cols-1 gap-6 p-4 md:p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Estado de Cuenta Cliente</h1>
                <p className="text-sm md:text-base text-muted-foreground">Consulta todos los movimientos detallados de los documentos y el cálculo de saldos.</p>
            </div>

            <Card className="shadow-md">
                <CardHeader className="bg-muted border-b border-border p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                        <div className="flex flex-col gap-1 sm:col-span-12 lg:col-span-5 relative">
                            <div className="flex items-center gap-1.5 mb-1">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <Label>Buscar Cliente</Label>
                            </div>
                            <BuscadorClienteReporte
                                valor={clienteSel}
                                onChange={c => {
                                    setClienteSel(c);
                                    setSelectedClientRuc(c?.RUC ?? "");
                                    setSelectedClientName(c?.Nombre ?? "");
                                    if (!c) setData(null);
                                }}
                            />
                        </div>
                        <div className="flex flex-col gap-1 sm:col-span-12 lg:col-span-3">
                            <div className="flex items-center gap-1.5 mb-1">
                                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                <Label>Fecha</Label>
                            </div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-background h-10", !selectedDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                        {selectedDate ? format(selectedDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 z-50" align="start">
                                    <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} initialFocus locale={es} />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 sm:col-span-12 lg:col-span-4 sm:justify-end">
                            <Button onClick={handleSearch} disabled={loading || !selectedClientRuc} className="bg-blue-600 hover:bg-blue-700 w-full shadow-sm h-10">
                                <Search className="mr-2 h-4 w-4" /> Buscar
                            </Button>
                            <ExportEstadoCuentaPdf data={data} disabled={loading || !data} />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4 md:p-6 bg-muted">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-muted-foreground font-medium">Buscando movimientos, por favor espera...</p>
                        </div>
                    ) : data ? (
                        <div className="space-y-4">
                            {/* Cliente y resumen */}
                            <div className="rounded-xl border border-border bg-background p-4 shadow-sm sm:p-5">
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div className="flex min-w-0 gap-3">
                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-blue-600/30">
                                            <Building2 className="h-5 w-5" />
                                        </span>
                                        <div className="min-w-0">
                                            <h2 className="text-lg font-bold leading-tight text-foreground">{data.NombreComercial || data.Cliente}</h2>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                <span className="mr-1.5 rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">{data.RUC}</span>
                                                {data.Cliente}
                                            </p>
                                            {data.Direccion && (
                                                <p className="mt-1.5 flex items-start gap-1.5 text-sm text-muted-foreground">
                                                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {data.Direccion}
                                                </p>
                                            )}
                                            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                                                <Phone className="h-3.5 w-3.5 shrink-0" /> {data.Telefono || 'Sin teléfono'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
                                        <CalendarIcon className="h-3.5 w-3.5" /> Corte: {formatDateToDDMMYYYY(data.FechaCorte)}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                                    <Resumen etiqueta="Documentos" valor={String(data.Documentos.length)} />
                                    <Resumen etiqueta="Con saldo" valor={String(conSaldo)} tono={conSaldo > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'} />
                                    <Resumen etiqueta="Saldo S/" valor={formatMoney(data.TotalSoles)} tono={Math.abs(data.TotalSoles) > 0.005 ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'} />
                                    <Resumen etiqueta="Saldo US$" valor={formatMoney(data.TotalDolares)} tono={Math.abs(data.TotalDolares) > 0.005 ? 'text-red-700 dark:text-red-400' : ''} />
                                </div>
                            </div>

                            {data.Documentos.length > 1 && (
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-xs text-muted-foreground">
                                        {data.Documentos.length} documentos · {docsAbiertos.size} abierto{docsAbiertos.size !== 1 ? 's' : ''}
                                    </span>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="h-8 gap-1.5 bg-background text-xs"
                                                onClick={() => setDocsAbiertos(new Set(data.Documentos.map((_: any, i: number) => i)))}>
                                            <ChevronsUpDown className="h-3.5 w-3.5" /> Abrir todos
                                        </Button>
                                        <Button variant="outline" size="sm" className="h-8 gap-1.5 bg-background text-xs"
                                                onClick={() => setDocsAbiertos(new Set())}>
                                            <ChevronsDownUp className="h-3.5 w-3.5" /> Cerrar todos
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {data.Documentos.map((doc: any, dIdx: number) => {
                                let sumProvision = 0;
                                let sumAmortizacion = 0;
                                const abierto = docsAbiertos.has(dIdx);
                                const saldoS = Number(doc.SaldoFinalSoles || 0);
                                const saldoD = Number(doc.SaldoFinalDolares || 0);
                                const cancelado = Math.abs(saldoS) < 0.005 && Math.abs(saldoD) < 0.005;
                                const vencido = !cancelado && !!doc.Vencimiento && new Date(doc.Vencimiento) < new Date(data.FechaCorte);

                                return (
                                    <div key={dIdx} className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            aria-expanded={abierto}
                                            onClick={() => alternarDoc(dIdx)}
                                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternarDoc(dIdx) } }}
                                            className={cn(
                                                'flex cursor-pointer flex-col gap-2 p-3 transition-colors hover:bg-muted/60 sm:flex-row sm:items-center sm:justify-between',
                                                abierto && 'border-b border-border bg-muted/40',
                                            )}
                                        >
                                            <div className="flex min-w-0 items-center gap-2.5">
                                                <ChevronRight className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', abierto && 'rotate-90')} />
                                                <span className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                    {doc.Abreviatura}
                                                </span>
                                                <span className="font-mono text-sm font-bold" onClick={e => e.stopPropagation()}>
                                                    <DocumentoPdfLink numeroComprobante={doc.SerieNumero} existeComprobante={!!doc.existeComprobante} />
                                                </span>
                                                <span className="hidden text-xs text-muted-foreground md:inline">
                                                    Emisión {formatDateToDDMMYYYY(doc.Emision)} · Vence{' '}
                                                    <span className={cn('font-semibold', vencido ? 'text-red-600' : 'text-foreground')}>{formatDateToDDMMYYYY(doc.Vencimiento)}</span>
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 pl-6 sm:pl-0">
                                                <span className="text-xs text-muted-foreground md:hidden">
                                                    Vence <span className={cn('font-semibold', vencido ? 'text-red-600' : 'text-foreground')}>{formatDateToDDMMYYYY(doc.Vencimiento)}</span>
                                                </span>
                                                <span className="text-[11px] text-muted-foreground">
                                                    {doc.Movimientos.length} mov.
                                                </span>
                                                {cancelado ? (
                                                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Cancelado</span>
                                                ) : (
                                                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums',
                                                        vencido ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300')}>
                                                        {Math.abs(saldoS) > 0.005 && `S/ ${formatMoney(saldoS)}`}
                                                        {Math.abs(saldoS) > 0.005 && Math.abs(saldoD) > 0.005 && ' · '}
                                                        {Math.abs(saldoD) > 0.005 && `US$ ${formatMoney(saldoD)}`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {abierto && (<>
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full text-xs text-left text-muted-foreground">
                                                <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                                <tr className="border-b border-border bg-gradient-to-b from-muted/60 to-muted">
                                                    <th className="px-3 py-2 font-bold whitespace-nowrap">Fecha</th>
                                                    <th className="px-3 py-2 font-bold">Descripción</th>
                                                    <th className="px-3 py-2 font-bold text-center">Moneda</th>
                                                    <th className="px-3 py-2 font-bold text-right">Provisión</th>
                                                    <th className="px-3 py-2 font-bold text-right">Amortización</th>
                                                    <th className="px-3 py-2 font-bold text-right">Saldo S/.</th>
                                                    <th className="px-3 py-2 font-bold text-right">Saldo US$</th>
                                                </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                {doc.Movimientos.map((mov: any, mIdx: number) => {
                                                    sumProvision += mov.Provision;
                                                    sumAmortizacion += mov.Amortizacion;
                                                    const isSoles = mov.Moneda === 'S/.' || mov.Moneda === 'NSO';

                                                    return (
                                                        <tr key={mIdx} className="hover:bg-muted transition-colors">
                                                            <td className="px-3 py-2 whitespace-nowrap tabular-nums">{formatDateToDDMMYYYY(mov.Fecha)}</td>
                                                            <td className="px-3 py-2 text-foreground">{mov.Descripcion}</td>
                                                            <td className="px-3 py-2 text-center font-bold">{mov.Moneda}</td>
                                                            <td className="px-3 py-2 text-right tabular-nums">{formatMoney(mov.Provision)}</td>
                                                            <td className="px-3 py-2 text-right tabular-nums">{formatMoney(mov.Amortizacion)}</td>
                                                            <td className="px-3 py-2 text-right tabular-nums">{isSoles ? formatMoney(mov.SaldoSoles) : '0.00'}</td>
                                                            <td className="px-3 py-2 text-right tabular-nums">{!isSoles ? formatMoney(mov.SaldoDolares) : '0.00'}</td>
                                                        </tr>
                                                    )})}
                                                </tbody>
                                                <tfoot className="border-t-2 border-border bg-muted/60 font-bold">
                                                <tr>
                                                    <td colSpan={3} className="px-3 py-2.5 text-right text-foreground">Saldo {doc.Abreviatura} {doc.SerieNumero}</td>
                                                    <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{formatMoney(sumProvision)}</td>
                                                    <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{formatMoney(sumAmortizacion)}</td>
                                                    <td className="px-3 py-2.5 text-right tabular-nums text-blue-700 dark:text-blue-400">{formatMoney(doc.SaldoFinalSoles)}</td>
                                                    <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{formatMoney(doc.SaldoFinalDolares)}</td>
                                                </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 p-3 md:hidden bg-muted">
                                            {doc.Movimientos.map((mov: any, mIdx: number) => (
                                                <div key={mIdx} className="bg-background border border-border rounded-md p-3 shadow-sm flex flex-col gap-2">
                                                    <div className="flex justify-between items-start border-b border-border pb-1">
                                                        <span className="font-bold text-xs text-muted-foreground">{formatDateToDDMMYYYY(mov.Fecha)}</span>
                                                        <Badge variant="outline" className="font-bold">{mov.Moneda}</Badge>
                                                    </div>
                                                    <div className="text-xs text-foreground font-medium">
                                                        {mov.Descripcion}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                                                        <div className="bg-muted p-1.5 rounded text-center">
                                                            <span className="text-muted-foreground block text-[10px] uppercase">Provisión</span>
                                                            <span className="font-bold text-foreground">{formatMoney(mov.Provision)}</span>
                                                        </div>
                                                        <div className="bg-muted p-1.5 rounded text-center">
                                                            <span className="text-muted-foreground block text-[10px] uppercase">Amortización</span>
                                                            <span className="font-bold text-foreground">{formatMoney(mov.Amortizacion)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center pt-1">
                                                        <span className="text-xs font-bold text-muted-foreground">Saldo:</span>
                                                        <div className="text-right">
                                                            <span className="text-sm font-bold text-foreground block">{mov.Moneda} {(mov.Moneda === 'S/.' || mov.Moneda === 'NSO') ? formatMoney(mov.SaldoSoles) : formatMoney(mov.SaldoDolares)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="bg-muted p-3 rounded-md flex justify-between items-center mt-2">
                                                <span className="text-xs font-bold text-foreground">SALDO TOTAL DOC:</span>
                                                <span className="font-bold text-sm text-foreground">{formatMoney(doc.SaldoFinalSoles)} S/. | {formatMoney(doc.SaldoFinalDolares)} US$</span>
                                            </div>
                                        </div>
                                    </>)}
                                    </div>
                                )})}

                            <div className={cn('flex flex-col items-center justify-between gap-3 rounded-xl p-4 text-white shadow-md sm:flex-row',
                                Math.abs(data.TotalSoles) < 0.005 && Math.abs(data.TotalDolares) < 0.005
                                    ? 'bg-gradient-to-br from-emerald-700 to-emerald-500'
                                    : 'bg-gradient-to-br from-blue-700 to-violet-600')}>
                                <span className="text-sm font-bold uppercase tracking-wider">Saldo del cliente</span>
                                <div className="flex w-full justify-between gap-6 sm:w-auto sm:justify-end">
                                    <div className="text-center sm:text-right">
                                        <p className="text-[11px] font-semibold uppercase text-white/80">Total soles</p>
                                        <p className="font-mono text-lg font-bold tabular-nums sm:text-xl">S/ {formatMoney(data.TotalSoles)}</p>
                                    </div>
                                    <div className="text-center sm:text-right">
                                        <p className="text-[11px] font-semibold uppercase text-white/80">Total dólares</p>
                                        <p className="font-mono text-lg font-bold tabular-nums sm:text-xl">US$ {formatMoney(data.TotalDolares)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 bg-background rounded-lg border-2 border-dashed border-border">
                            <p className="text-muted-foreground font-medium text-center px-4">Utiliza el buscador para seleccionar un cliente.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function Resumen({ etiqueta, valor, tono = '' }: { etiqueta: string; valor: string; tono?: string }) {
    return (
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{etiqueta}</p>
            <p className={`font-mono text-base font-bold tabular-nums ${tono}`}>{valor}</p>
        </div>
    )
}
