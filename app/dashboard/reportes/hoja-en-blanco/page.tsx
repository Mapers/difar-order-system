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
    Calendar as CalendarIcon, Check, ChevronDown, ChevronRight, FileText,
    Loader2, Package, Search, User, Users, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/app/hooks/useToast"
import { useAuth } from "@/context/authContext"
import apiClient from "@/app/api/client"
import { hojaEnBlancoRequest, searchClientsRequest } from "@/app/api/reports"

interface ProductoHB {
    Codigo_Art:   string
    NombreItem:   string
    AbrevUnidMed: string
    Cantidad:     number
    Monto:        number
    Costo:        number
    Utilidad:     number
}

interface DocumentoHB {
    Clave:      string
    Serie:      string
    Numero:     number
    Fecha:      string
    CodCliente: string
    Cliente:    string
    CodAlmacen: number
    Almacen:    string
    TotalCantidad: number
    TotalMonto:    number
    TotalCosto:    number
    TotalUtilidad: number
    productos:  ProductoHB[]
}

interface VendedorHB {
    CodVendedor: string
    Vendedor:    string
    TotalDocumentos: number
    TotalCantidad:   number
    TotalMonto:      number
    TotalCosto:      number
    TotalUtilidad:   number
    documentos:  DocumentoHB[]
}

interface HojaEnBlancoData {
    Anio: string
    Mes:  string
    TotalDocumentos: number
    TotalCantidad:   number
    TotalMonto:      number
    TotalCosto:      number
    TotalUtilidad:   number
    Vendedores:      VendedorHB[]
}

const fmt     = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtCant = (n: number) => n.toLocaleString('es-PE', { maximumFractionDigits: 2 })
const fmtDate = (d: string) => d ? String(d).slice(0, 10).split('-').reverse().join('/') : '—'

/** Mismos acentos que Ventas Totales, con su variante para tema oscuro. */
const ACENTO = {
    monto:    'text-blue-700 dark:text-blue-400',
    costo:    'text-red-700 dark:text-red-400',
    utilidad: 'text-green-700 dark:text-green-400',
} as const

const TINTE = {
    monto:    'bg-blue-50/30 dark:bg-blue-950/20',
    costo:    'bg-red-50/30 dark:bg-red-950/20',
    utilidad: 'bg-green-50/30 dark:bg-green-950/20',
} as const

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
    const [vendsAbiertos, setVendsAbiertos] = useState<Set<string>>(new Set())
    const [docsAbiertos, setDocsAbiertos]   = useState<Set<string>>(new Set())

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

    const toggleVendAbierto = (cod: string) =>
        setVendsAbiertos(prev => {
            const next = new Set(prev)
            next.has(cod) ? next.delete(cod) : next.add(cod)
            return next
        })

    const toggleDocAbierto = (clave: string) =>
        setDocsAbiertos(prev => {
            const next = new Set(prev)
            next.has(clave) ? next.delete(clave) : next.add(clave)
            return next
        })

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
            // Vendedores abiertos, documentos cerrados: el resumen por
            // documento se ve de una y el detalle se pide.
            setVendsAbiertos(new Set(payload?.Vendedores.map(v => v.CodVendedor) ?? []))
            setDocsAbiertos(new Set())
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
                    ) : !data || data.Vendedores.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
                            <Package className="h-10 w-10 opacity-40" />
                            <p className="text-sm">No hay despachos de la serie 0800 para los filtros seleccionados.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Totales */}
                            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                                <TotalCard label="Documentos" valor={String(data.TotalDocumentos)} />
                                <TotalCard label="Cantidad"   valor={fmtCant(data.TotalCantidad)} />
                                <TotalCard label="Monto"      valor={`S/ ${fmt(data.TotalMonto)}`}    acento={ACENTO.monto} />
                                <TotalCard label="Costo"      valor={`S/ ${fmt(data.TotalCosto)}`}    acento={ACENTO.costo} />
                                <TotalCard label="Utilidad"   valor={`S/ ${fmt(data.TotalUtilidad)}`} acento={ACENTO.utilidad} />
                            </div>

                            {data.Vendedores.map(vend => {
                                const vendAbierto = vendsAbiertos.has(vend.CodVendedor)
                                return (
                                    <div key={vend.CodVendedor} className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
                                        <button
                                            type="button"
                                            onClick={() => toggleVendAbierto(vend.CodVendedor)}
                                            className="flex w-full items-center gap-2 bg-slate-800 p-3 text-left text-white transition-colors hover:bg-slate-700"
                                        >
                                            {vendAbierto
                                                ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-300" />
                                                : <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />}
                                            <span className="min-w-0 flex-1 text-sm font-bold md:text-base">
                                                {vend.CodVendedor} · {vend.Vendedor}
                                            </span>
                                            <span className="w-fit whitespace-nowrap rounded-full border border-slate-600 bg-slate-700 px-3 py-1 text-xs font-medium">
                                                {vend.TotalDocumentos} doc{vend.TotalDocumentos === 1 ? '' : 's'}
                                            </span>
                                        </button>

                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-b border-border bg-muted/50 px-4 py-2.5 md:grid-cols-4">
                                            <Resumen label="Cantidad" valor={fmtCant(vend.TotalCantidad)} />
                                            <Resumen label="Monto"    valor={fmt(vend.TotalMonto)}    acento={ACENTO.monto} />
                                            <Resumen label="Costo"    valor={fmt(vend.TotalCosto)}    acento={ACENTO.costo} />
                                            <Resumen label="Utilidad" valor={fmt(vend.TotalUtilidad)} acento={ACENTO.utilidad} />
                                        </div>

                                        {vendAbierto && (
                                            <div className="divide-y divide-border">
                                                {vend.documentos.map(doc => {
                                                    const docAbierto = docsAbiertos.has(doc.Clave)
                                                    return (
                                                        <div key={doc.Clave}>
                                                            {/* Cabecera del documento */}
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleDocAbierto(doc.Clave)}
                                                                className="flex w-full flex-col gap-2 p-3 text-left transition-colors hover:bg-muted md:flex-row md:items-center"
                                                            >
                                                                <div className="flex min-w-0 flex-1 items-start gap-2">
                                                                    {docAbierto
                                                                        ? <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                                                        : <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                                                                    <div className="min-w-0">
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <span className="font-mono text-sm font-bold text-foreground">
                                                                                {doc.Serie}-{doc.Numero}
                                                                            </span>
                                                                            {/* Fijo: todo documento de la serie 0800 sale cancelado. */}
                                                                            <Badge className="border border-green-200 bg-green-50 text-[10px] font-semibold text-green-700 hover:bg-green-50 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-400 dark:hover:bg-green-950/40">
                                                                                Cancelado
                                                                            </Badge>
                                                                            <Badge variant="outline" className="text-[10px]">{fmtDate(doc.Fecha)}</Badge>
                                                                            <Badge variant="secondary" className="text-[10px]">{doc.Almacen}</Badge>
                                                                        </div>
                                                                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                                                                            {doc.CodCliente} · {doc.Cliente}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-1 pl-6 md:flex md:gap-5 md:pl-0">
                                                                    <Resumen label="Cant." valor={fmtCant(doc.TotalCantidad)} compacto />
                                                                    <Resumen label="Monto" valor={fmt(doc.TotalMonto)}    acento={ACENTO.monto} compacto />
                                                                    <Resumen label="Costo" valor={fmt(doc.TotalCosto)}    acento={ACENTO.costo} compacto />
                                                                    <Resumen label="Util." valor={fmt(doc.TotalUtilidad)} acento={ACENTO.utilidad} compacto />
                                                                </div>
                                                            </button>

                                                            {docAbierto && (
                                                                <>
                                                                    {/* Escritorio */}
                                                                    <div className="hidden overflow-x-auto border-t border-border md:block">
                                                                        <table className="w-full text-left text-xs text-muted-foreground">
                                                                            <thead className="border-b border-border bg-muted text-[10px] uppercase md:text-xs">
                                                                                <tr>
                                                                                    <th className="px-3 py-2.5 font-bold">Producto</th>
                                                                                    <th className="px-3 py-2.5 font-bold">Und.</th>
                                                                                    <th className="px-3 py-2.5 text-right font-bold">Cantidad</th>
                                                                                    <th className={cn("px-3 py-2.5 text-right font-bold", ACENTO.monto)}>Monto</th>
                                                                                    <th className={cn("px-3 py-2.5 text-right font-bold", ACENTO.costo)}>Costo</th>
                                                                                    <th className={cn("px-3 py-2.5 text-right font-bold", ACENTO.utilidad)}>Utilidad</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {doc.productos.map(p => (
                                                                                    <tr key={p.Codigo_Art} className="border-b border-border transition-colors last:border-0 hover:bg-muted">
                                                                                        <td className="px-3 py-2 font-medium text-foreground">
                                                                                            {p.Codigo_Art} · {p.NombreItem}
                                                                                        </td>
                                                                                        <td className="px-3 py-2">{p.AbrevUnidMed}</td>
                                                                                        <td className="px-3 py-2 text-right font-mono">{fmtCant(p.Cantidad)}</td>
                                                                                        <td className={cn("px-3 py-2 text-right font-mono font-bold", ACENTO.monto, TINTE.monto)}>{fmt(p.Monto)}</td>
                                                                                        <td className="px-3 py-2 text-right font-mono">{fmt(p.Costo)}</td>
                                                                                        <td className={cn(
                                                                                            "px-3 py-2 text-right font-mono font-bold",
                                                                                            p.Utilidad < 0 ? ACENTO.costo : ACENTO.utilidad,
                                                                                            p.Utilidad < 0 ? TINTE.costo : TINTE.utilidad
                                                                                        )}>
                                                                                            {fmt(p.Utilidad)}
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>

                                                                    {/* Móvil */}
                                                                    <div className="grid grid-cols-1 gap-3 border-t border-border bg-muted p-3 md:hidden">
                                                                        {doc.productos.map(p => (
                                                                            <div key={p.Codigo_Art} className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4 shadow-sm">
                                                                                <span className="pr-2 text-sm font-bold leading-tight text-foreground">
                                                                                    {p.Codigo_Art} · {p.NombreItem}
                                                                                </span>
                                                                                <div className="mt-1 border-t border-border pt-2">
                                                                                    <FilaMovil label={`Cantidad (${p.AbrevUnidMed})`} valor={fmtCant(p.Cantidad)} />
                                                                                    <FilaMovil label="Monto"    valor={`S/ ${fmt(p.Monto)}`} acento={ACENTO.monto} />
                                                                                    <FilaMovil label="Costo"    valor={`S/ ${fmt(p.Costo)}`} />
                                                                                    <FilaMovil label="Utilidad" valor={`S/ ${fmt(p.Utilidad)}`}
                                                                                               acento={p.Utilidad < 0 ? ACENTO.costo : ACENTO.utilidad} />
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}

                            {/* Total general */}
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/30">
                                <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                                    Total general · {data.TotalDocumentos} documento{data.TotalDocumentos === 1 ? '' : 's'}
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 md:grid-cols-4">
                                    <Resumen label="Cantidad" valor={fmtCant(data.TotalCantidad)} />
                                    <Resumen label="Monto"    valor={fmt(data.TotalMonto)}    acento={ACENTO.monto} />
                                    <Resumen label="Costo"    valor={fmt(data.TotalCosto)}    acento={ACENTO.costo} />
                                    <Resumen label="Utilidad" valor={fmt(data.TotalUtilidad)} acento={ACENTO.utilidad} />
                                </div>
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

function Resumen({ label, valor, acento, compacto }: {
    label: string; valor: string; acento?: string; compacto?: boolean
}) {
    return (
        <div className={cn(
            "flex items-baseline justify-between gap-2",
            !compacto && "md:flex-col md:items-start md:gap-0",
            compacto && "md:flex-col md:items-end md:gap-0"
        )}>
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
            <span className={cn("font-mono text-sm font-bold text-foreground", acento)}>{valor}</span>
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
