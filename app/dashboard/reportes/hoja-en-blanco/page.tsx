'use client'

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { MonthYearPicker } from "@/components/ui/month-year-picker"
import {
    Calendar as CalendarIcon, Check, ChevronDown, FileText,
    Loader2, Package, Search, User, Users, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/app/hooks/useToast"
import { useAuth } from "@/context/authContext"
import apiClient from "@/app/api/client"
import { hojaEnBlancoRequest, searchClientsRequest } from "@/app/api/reports"

/**
 * Una fila por documento 0800, con las columnas de la exportación a PDF
 * de Gestión de Comprobantes → Facturas y Boletas (Exportregistrobutton,
 * "Registro Ventas"). El 0800 no tiene comprobante: F.Vcto. va en "—" y
 * el bloque "Comprobante Original" no aplica.
 */
interface DocumentoHB {
    Fecha:         string
    Doc:           string
    Serie:         string
    Numero:        number | string
    CodCliente:    string
    Cliente:       string
    DI:            string
    NroDI:         string
    CodVendedor:   string
    Vendedor:      string
    Representante: string | null
    NoGravado:     number
    BImponible:    number
    IGV:           number
    Total:         number
}

interface HojaEnBlancoData {
    Anio: string
    Mes:  string
    TotalDocumentos: number
    TotalNoGravado:  number
    TotalBImponible: number
    TotalIGV:        number
    TotalTotal:      number
    Documentos:      DocumentoHB[]
}

const fmt     = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = (d: string) => d ? String(d).slice(0, 10).split('-').reverse().join('/') : '—'

/** Mismo acento azul de montos que Ventas Totales, con variante oscura. */
const ACENTO_MONTO = 'text-blue-700 dark:text-blue-400'
const TINTE_MONTO  = 'bg-blue-50/30 dark:bg-blue-950/20'

export default function HojaEnBlancoPage() {
    const auth = useAuth()
    const isManagerOrAdmin = auth.isAdmin()
    const isRepresentative = auth.isRepresentante()
    const isVendor         = auth.isVendedor()

    const [selectedDate, setSelectedDate] = useState<Date>(new Date())

    const [catVendedores, setCatVendedores] = useState<any[]>([])
    const [selectedVends, setSelectedVends] = useState<string[]>([])
    const [openVend, setOpenVend] = useState(false)

    const [searchQuery, setSearchQuery]           = useState('')
    const [clientOptions, setClientOptions]       = useState<any[]>([])
    const [loadingOptions, setLoadingOptions]     = useState(false)
    const [openClient, setOpenClient]             = useState(false)
    const [selectedClientRuc, setSelectedClientRuc]   = useState('')
    const [selectedClientName, setSelectedClientName] = useState('')

    const [data, setData]       = useState<HojaEnBlancoData | null>(null)
    const [loading, setLoading] = useState(false)
    const [buscado, setBuscado] = useState(false)

    useEffect(() => {
        if (!isManagerOrAdmin) return
        apiClient.get('/usuarios/listar/vendedores')
            .then(res => setCatVendedores(res.data?.data?.data || []))
            .catch(() => toast({
                title: "Error",
                description: "No se pudo cargar la lista de vendedores.",
                variant: "destructive",
            }))
    }, [isManagerOrAdmin])

    // Autocomplete de cliente, mismo criterio que Saldos por Cobrar:
    // recién busca a partir de 3 caracteres y con debounce.
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length <= 2) { setClientOptions([]); return }
            setLoadingOptions(true)
            try {
                const vendedorCode = isVendor ? (auth.user?.codigo || null) : null
                const represCode   = isRepresentative ? (auth.user?.codRepres || null) : null
                const res = await searchClientsRequest(searchQuery, vendedorCode, represCode)
                if (res.status === 200) setClientOptions(res.data.data || [])
            } catch {
                setClientOptions([])
            } finally {
                setLoadingOptions(false)
            }
        }, 400)
        return () => clearTimeout(timer)
    }, [searchQuery, isVendor, isRepresentative, auth.user])

    const toggleVend = (cod: string) =>
        setSelectedVends(prev => prev.includes(cod) ? prev.filter(x => x !== cod) : [...prev, cod])

    async function handleBuscar() {
        // Alcance por rol: un vendedor solo ve lo suyo y un representante lo
        // de sus vendedores, aunque no exista el selector en pantalla.
        let vendorsToQuery: string[] = []
        if (selectedVends.length > 0) {
            vendorsToQuery = selectedVends
        } else if (isRepresentative) {
            vendorsToQuery = auth.user?.vendedores?.map(v => v.codigo) || []
            if (vendorsToQuery.length === 0) vendorsToQuery = ['SIN_VENDEDORES']
        } else if (isVendor) {
            vendorsToQuery = auth.user?.codigo ? [auth.user.codigo] : []
        }

        setLoading(true)
        try {
            const res = await hojaEnBlancoRequest({
                anio: String(selectedDate.getFullYear()),
                mes:  String(selectedDate.getMonth() + 1).padStart(2, '0'),
                vendedores: vendorsToQuery,
                cliente:    selectedClientRuc || null,
            })
            const payload: HojaEnBlancoData | null = res.data?.data ?? null
            setData(payload)
        } catch (error: any) {
            setData(null)
            toast({
                title: "Error",
                description: error?.response?.data?.message || "No se pudo generar el reporte.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
            setBuscado(true)
        }
    }

    return (
        <div className="grid gap-6 p-4 md:p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Hoja en Blanco</h1>
                <p className="text-sm text-muted-foreground md:text-base">
                    Despachos de la serie 0800: mercadería entregada a un cliente sin comprobante electrónico.
                </p>
            </div>

            {/* ── Filtros ── */}
            <Card className="shadow-md">
                <CardHeader className="border-b border-border bg-muted p-4 md:p-5">
                    <div className="flex flex-col gap-4">
                        <div className={cn(
                            "grid grid-cols-1 gap-4 sm:grid-cols-2",
                            isManagerOrAdmin && "lg:grid-cols-3"
                        )}>
                            <div className="flex min-w-0 flex-col gap-1.5">
                                <Label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <CalendarIcon className="h-4 w-4 shrink-0" /> Periodo (Mes y Año)
                                </Label>
                                <MonthYearPicker value={selectedDate} onChange={setSelectedDate} />
                            </div>

                            {/* Cliente */}
                            <div className="flex min-w-0 flex-col gap-1.5">
                                <Label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <User className="h-4 w-4 shrink-0" /> Cliente (opcional)
                                </Label>
                                <Popover open={openClient} onOpenChange={setOpenClient}>
                                    <div className="relative w-full">
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" role="combobox"
                                                    className={cn("h-10 w-full justify-between overflow-hidden bg-background font-normal", selectedClientName && "pr-8")}>
                                                <span className="truncate text-sm">
                                                    {selectedClientName ? `${selectedClientRuc} - ${selectedClientName}` : "Todos los clientes..."}
                                                </span>
                                                {!selectedClientName && <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                                            </Button>
                                        </PopoverTrigger>
                                        {selectedClientName && (
                                            <div
                                                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                                                onClick={e => { e.preventDefault(); e.stopPropagation(); setSelectedClientRuc(''); setSelectedClientName(''); setSearchQuery('') }}
                                            >
                                                <X className="h-4 w-4" />
                                            </div>
                                        )}
                                    </div>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                        <Command shouldFilter={false}>
                                            <CommandInput placeholder="Escriba nombre o RUC..." value={searchQuery} onValueChange={setSearchQuery} />
                                            <CommandList>
                                                {loadingOptions && (
                                                    <div className="p-4 text-center text-sm text-muted-foreground">Buscando...</div>
                                                )}
                                                {!loadingOptions && clientOptions.length === 0 && searchQuery.length > 2 && (
                                                    <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                                                )}
                                                <CommandGroup>
                                                    {clientOptions.map(client => (
                                                        <CommandItem key={client.RUC} value={client.Nombre}
                                                                     onSelect={() => {
                                                                         setSelectedClientRuc(client.RUC)
                                                                         setSelectedClientName(client.Nombre)
                                                                         setOpenClient(false)
                                                                     }}>
                                                            <Check className={cn("mr-2 h-4 w-4 shrink-0", selectedClientRuc === client.RUC ? "opacity-100" : "opacity-0")} />
                                                            <span className="truncate">{client.RUC} - {client.Nombre}</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Vendedores (solo admin) */}
                            {isManagerOrAdmin && (
                                <div className="flex min-w-0 flex-col gap-1.5">
                                    <Label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <Users className="h-4 w-4 shrink-0" /> Vendedores
                                    </Label>
                                    <Popover open={openVend} onOpenChange={setOpenVend}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" role="combobox" className="h-10 w-full justify-between bg-background px-3 font-normal">
                                                {selectedVends.length > 0
                                                    ? <span className="truncate text-sm font-semibold text-orange-700 dark:text-orange-400">{selectedVends.length} seleccionado(s)</span>
                                                    : <span className="text-sm text-muted-foreground">Todos...</span>}
                                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="z-50 w-[--radix-popover-trigger-width] min-w-[260px] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Buscar vendedor..." />
                                                <CommandList>
                                                    <CommandEmpty>No se encontró vendedor.</CommandEmpty>
                                                    <CommandGroup>
                                                        {catVendedores.map(v => {
                                                            const cod = v.Codigo_Vend || v.codigo
                                                            return (
                                                                <CommandItem key={cod} onSelect={() => toggleVend(cod)}>
                                                                    <Check className={cn("mr-2 h-4 w-4", selectedVends.includes(cod) ? "opacity-100" : "opacity-0")} />
                                                                    {cod} · {v.Nombres || v.nombres} {v.Apellidos || v.apellidos}
                                                                </CommandItem>
                                                            )
                                                        })}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {selectedVends.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedVends.map(cod => (
                                                <Badge key={cod} variant="secondary" className="border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-700 hover:bg-orange-100 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300 dark:hover:bg-orange-900/50 md:text-xs">
                                                    {cod}
                                                    <X className="ml-1.5 h-3 w-3 shrink-0 cursor-pointer rounded-full hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-950/50 dark:hover:text-red-400" onClick={() => toggleVend(cod)} />
                                                </Badge>
                                            ))}
                                            <span className="ml-1 cursor-pointer self-center text-xs font-medium text-muted-foreground hover:text-foreground hover:underline" onClick={() => setSelectedVends([])}>
                                                Limpiar
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Button onClick={handleBuscar} disabled={loading} className="h-10 w-full bg-blue-600 shadow-sm hover:bg-blue-700 sm:w-auto">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                Buscar
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* ── Resultados ── */}
            <Card className="shadow-md">
                <CardContent className="bg-muted p-4 md:p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
                            <p className="font-medium text-muted-foreground">Generando reporte, por favor espera...</p>
                        </div>
                    ) : !buscado ? (
                        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
                            <FileText className="h-10 w-10 opacity-40" />
                            <p className="text-sm">Elige un periodo y pulsa <b>Buscar</b> para generar el reporte.</p>
                        </div>
                    ) : !data || data.Documentos.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
                            <Package className="h-10 w-10 opacity-40" />
                            <p className="text-sm">No hay despachos de la serie 0800 para los filtros seleccionados.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Totales */}
                            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                <TotalCard label="Documentos"  valor={String(data.TotalDocumentos)} />
                                <TotalCard label="B.Imponible" valor={`S/ ${fmt(data.TotalBImponible)}`} acento={ACENTO_MONTO} />
                                <TotalCard label="IGV (18%)"   valor={`S/ ${fmt(data.TotalIGV)}`}        acento={ACENTO_MONTO} />
                                <TotalCard label="Total"       valor={`S/ ${fmt(data.TotalTotal)}`}      acento={ACENTO_MONTO} />
                            </div>

                            {/* Escritorio: mismas columnas que el PDF de Facturas y Boletas */}
                            <div className="hidden overflow-x-auto rounded-lg border border-border bg-background shadow-sm md:block">
                                <table className="w-full text-left text-xs text-muted-foreground">
                                    <thead className="border-b border-border bg-muted text-[10px] uppercase md:text-xs">
                                        <tr>
                                            <th className="px-3 py-2.5 font-bold">F.Emision</th>
                                            <th className="px-3 py-2.5 font-bold">Doc</th>
                                            <th className="px-3 py-2.5 font-bold">Serie</th>
                                            <th className="px-3 py-2.5 font-bold">NroDesde</th>
                                            <th className="px-3 py-2.5 font-bold">F.Vcto.</th>
                                            <th className="px-3 py-2.5 font-bold">Cliente</th>
                                            <th className="px-3 py-2.5 font-bold">Vendedor</th>
                                            <th className="px-3 py-2.5 font-bold">Repres</th>
                                            <th className="px-3 py-2.5 text-center font-bold">D.I.</th>
                                            <th className="px-3 py-2.5 font-bold">Nº D.I.</th>
                                            <th className="px-3 py-2.5 text-center font-bold">T/C</th>
                                            <th className="px-3 py-2.5 text-right font-bold">No Grabado</th>
                                            <th className={cn("px-3 py-2.5 text-right font-bold", ACENTO_MONTO)}>B.Imponible</th>
                                            <th className={cn("px-3 py-2.5 text-right font-bold", ACENTO_MONTO)}>IGV</th>
                                            <th className={cn("px-3 py-2.5 text-right font-bold", ACENTO_MONTO)}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.Documentos.map(doc => (
                                            <tr key={`${doc.Serie}-${doc.Numero}-${doc.Fecha}-${doc.CodCliente}`} className="border-b border-border transition-colors last:border-0 hover:bg-muted">
                                                <td className="px-3 py-2 font-mono">{fmtDate(doc.Fecha)}</td>
                                                <td className="px-3 py-2 font-mono">{doc.Doc}</td>
                                                <td className="px-3 py-2 font-mono">{doc.Serie}</td>
                                                <td className="px-3 py-2 font-mono font-bold text-foreground">{doc.Numero}</td>
                                                <td className="px-3 py-2 text-center">—</td>
                                                <td className="px-3 py-2 font-medium text-foreground">{doc.Cliente}</td>
                                                <td className="px-3 py-2">{doc.Vendedor}</td>
                                                <td className="px-3 py-2">{doc.Representante || '—'}</td>
                                                <td className="px-3 py-2 text-center">{doc.DI || '—'}</td>
                                                <td className="px-3 py-2 font-mono">{doc.NroDI}</td>
                                                <td className="px-3 py-2 text-center">S/</td>
                                                <td className="px-3 py-2 text-right font-mono">{fmt(doc.NoGravado)}</td>
                                                <td className={cn("px-3 py-2 text-right font-mono font-bold", ACENTO_MONTO, TINTE_MONTO)}>{fmt(doc.BImponible)}</td>
                                                <td className="px-3 py-2 text-right font-mono">{fmt(doc.IGV)}</td>
                                                <td className={cn("px-3 py-2 text-right font-mono font-bold", ACENTO_MONTO)}>{fmt(doc.Total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-border bg-muted font-bold text-foreground">
                                            <td className="px-3 py-2.5" colSpan={11}>TOTALES · {data.TotalDocumentos} documento{data.TotalDocumentos === 1 ? '' : 's'}</td>
                                            <td className="px-3 py-2.5 text-right font-mono">{fmt(data.TotalNoGravado)}</td>
                                            <td className={cn("px-3 py-2.5 text-right font-mono", ACENTO_MONTO)}>{fmt(data.TotalBImponible)}</td>
                                            <td className={cn("px-3 py-2.5 text-right font-mono", ACENTO_MONTO)}>{fmt(data.TotalIGV)}</td>
                                            <td className={cn("px-3 py-2.5 text-right font-mono", ACENTO_MONTO)}>{fmt(data.TotalTotal)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Móvil */}
                            <div className="grid grid-cols-1 gap-3 md:hidden">
                                {data.Documentos.map(doc => (
                                    <div key={`${doc.Serie}-${doc.Numero}-${doc.Fecha}-${doc.CodCliente}`} className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4 shadow-sm">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-mono text-sm font-bold text-foreground">{doc.Serie}-{doc.Numero}</span>
                                            <Badge variant="outline" className="text-[10px]">{fmtDate(doc.Fecha)}</Badge>
                                            <Badge variant="outline" className="border-slate-300 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-400">
                                                Sin comprobante
                                            </Badge>
                                        </div>
                                        <div className="truncate text-xs text-muted-foreground">
                                            {doc.DI ? `${doc.DI} ${doc.NroDI}` : doc.NroDI} · {doc.Cliente}
                                        </div>
                                        <div className="mt-1 border-t border-border pt-2">
                                            <FilaMovil label="Vendedor"    valor={doc.Vendedor} />
                                            <FilaMovil label="Repres."     valor={doc.Representante || '—'} />
                                            <FilaMovil label="B.Imponible" valor={`S/ ${fmt(doc.BImponible)}`} acento={ACENTO_MONTO} />
                                            <FilaMovil label="IGV (18%)"   valor={`S/ ${fmt(doc.IGV)}`} />
                                            <FilaMovil label="Total"       valor={`S/ ${fmt(doc.Total)}`} acento={ACENTO_MONTO} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* De dónde salen los números, para que nadie los compare mal. */}
                            <div className="rounded-lg border border-border bg-background p-3 text-[11px] leading-relaxed text-muted-foreground">
                                <p>
                                    <b className="text-foreground">IGV calculado.</b> La serie 0800 no emite comprobante y registra
                                    la base imponible sin impuesto: el IGV se calcula al 18% y el Total es base + IGV. F.Vcto. y
                                    No Grabado no existen para esta serie.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function FilaMovil({ label, valor, acento }: { label: string; valor: string; acento?: string }) {
    return (
        <div className="flex items-center justify-between gap-2 py-0.5">
            <span className="text-[11px] font-bold uppercase text-muted-foreground">{label}</span>
            <span className={cn("font-mono text-sm font-semibold text-foreground", acento)}>{valor}</span>
        </div>
    )
}

function TotalCard({ label, valor, acento }: { label: string; valor: string; acento?: string }) {
    return (
        <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className={cn("mt-0.5 font-mono text-lg font-bold text-foreground md:text-xl", acento)}>{valor}</div>
        </div>
    )
}
