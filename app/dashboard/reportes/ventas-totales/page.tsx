'use client'

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { MonthYearPicker } from "@/components/ui/month-year-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Calendar as CalendarIcon, Check, ChevronDown, ChevronRight, FlaskConical,
    Loader2, Package, Search, TrendingUp, Users, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/app/hooks/useToast"
import { useAuth } from "@/context/authContext"
import apiClient from "@/app/api/client"
import { ventasTotalesRequest } from "@/app/api/reports"
import { Laboratorio } from "@/app/types/user-types"

interface ProductoVenta {
    Codigo_Art:   string
    Producto:     string
    AbrevUnidMed: string
    Cantidad:     number
    Ventas:       number
    Costo:        number
    Utilidad:     number
}

interface LaboratorioVenta {
    Laboratorio:   string
    TotalCantidad: number
    TotalVentas:   number
    TotalCosto:    number
    TotalUtilidad: number
    productos:     ProductoVenta[]
}

interface VentasTotalesData {
    Anio:    string
    Mes:     string
    Empresa: { NombreRazSocial: string; RUC: string }
    TotalCantidad: number
    TotalVentas:   number
    TotalCosto:    number
    TotalUtilidad: number
    Laboratorios:  LaboratorioVenta[]
}

const fmt     = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtCant = (n: number) => n.toLocaleString('es-PE', { maximumFractionDigits: 2 })

/**
 * Acentos de las tres magnitudes del reporte.
 *
 * Los tonos 700 se leen bien en claro pero quedan demasiado oscuros sobre
 * fondo oscuro, así que cada uno lleva su variante dark. El resto de la
 * página usa tokens semánticos (bg-background, bg-muted, border-border),
 * que ya se adaptan solos.
 */
const ACENTO = {
    ventas:   'text-blue-700 dark:text-blue-400',
    costo:    'text-red-700 dark:text-red-400',
    utilidad: 'text-green-700 dark:text-green-400',
} as const

/** Tinte de fondo de las celdas de importe, como en Saldos por Cobrar. */
const TINTE = {
    ventas:   'bg-blue-50/30 dark:bg-blue-950/20',
    costo:    'bg-red-50/30 dark:bg-red-950/20',
    utilidad: 'bg-green-50/30 dark:bg-green-950/20',
} as const

/** Margen sobre ventas. Null cuando no hay ventas: no es 0%, es "no aplica". */
function margen(utilidad: number, ventas: number): number | null {
    if (!ventas) return null
    return (utilidad / ventas) * 100
}

export default function VentasTotalesPage() {
    const auth = useAuth()
    const isManagerOrAdmin = auth.isAdmin()
    const isRepresentative = auth.isRepresentante()
    const isVendor         = auth.isVendedor()

    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [catLaboratorios, setCatLaboratorios] = useState<Laboratorio[]>([])
    const [catVendedores, setCatVendedores]     = useState<any[]>([])
    const [selectedLabs, setSelectedLabs]   = useState<number[]>([])
    const [selectedVends, setSelectedVends] = useState<string[]>([])
    const [openLab, setOpenLab]   = useState(false)
    const [openVend, setOpenVend] = useState(false)

    const [data, setData]       = useState<VentasTotalesData | null>(null)
    const [loading, setLoading] = useState(false)
    const [buscado, setBuscado] = useState(false)
    const [expandidos, setExpandidos] = useState<Set<string>>(new Set())

    useEffect(() => {
        const cargarCatalogos = async () => {
            try {
                const resLabs = await apiClient.get('/price/laboratories')
                setCatLaboratorios(resLabs.data?.data || [])

                if (isManagerOrAdmin) {
                    const resVends = await apiClient.get('/usuarios/listar/vendedores')
                    setCatVendedores(resVends.data?.data?.data || [])
                }
            } catch {
                toast({
                    title: "Error",
                    description: "No se pudieron cargar los filtros.",
                    variant: "destructive",
                })
            }
        }
        cargarCatalogos()
    }, [isManagerOrAdmin])

    const toggleLab = (id: number) =>
        setSelectedLabs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

    const toggleVend = (cod: string) =>
        setSelectedVends(prev => prev.includes(cod) ? prev.filter(x => x !== cod) : [...prev, cod])

    const toggleLabExpand = (lab: string) =>
        setExpandidos(prev => {
            const next = new Set(prev)
            next.has(lab) ? next.delete(lab) : next.add(lab)
            return next
        })

    async function handleBuscar() {
        // El alcance de vendedores depende del rol: un vendedor solo ve lo
        // suyo y un representante lo de sus vendedores, aunque no exista el
        // selector en pantalla.
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
            const res = await ventasTotalesRequest({
                anio: String(selectedDate.getFullYear()),
                mes:  String(selectedDate.getMonth() + 1).padStart(2, '0'),
                laboratorios: selectedLabs,
                vendedores:   vendorsToQuery,
            })
            const payload: VentasTotalesData | null = res.data?.data ?? null
            setData(payload)
            setExpandidos(new Set(payload?.Laboratorios.map(l => l.Laboratorio) ?? []))
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

    const margenTotal = data ? margen(data.TotalUtilidad, data.TotalVentas) : null

    return (
        <div className="grid gap-6 p-4 md:p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Reporte de Ventas Totales</h1>
                <p className="text-sm text-muted-foreground md:text-base">
                    Ventas, costo y utilidad por laboratorio y producto, para el mes seleccionado.
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
                        <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <CalendarIcon className="h-4 w-4 shrink-0" /> Periodo (Mes y Año)
                        </label>
                        <MonthYearPicker value={selectedDate} onChange={setSelectedDate} />
                    </div>

                    <div className="flex min-w-0 flex-col gap-1.5">
                        <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <FlaskConical className="h-4 w-4 shrink-0" /> Laboratorios
                        </label>
                        <Popover open={openLab} onOpenChange={setOpenLab}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" className="h-10 w-full justify-between bg-background px-3 font-normal">
                                    {selectedLabs.length > 0
                                        ? <span className="truncate text-sm font-semibold text-blue-700 dark:text-blue-400">{selectedLabs.length} seleccionado(s)</span>
                                        : <span className="text-sm text-muted-foreground">Todos...</span>}
                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="z-50 w-[--radix-popover-trigger-width] min-w-[260px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Buscar laboratorio..." />
                                    <CommandList>
                                        <CommandEmpty>No se encontró laboratorio.</CommandEmpty>
                                        <CommandGroup>
                                            {catLaboratorios.map(lab => (
                                                <CommandItem key={lab.IdLineaGe} onSelect={() => toggleLab(lab.IdLineaGe)}>
                                                    <Check className={cn("mr-2 h-4 w-4", selectedLabs.includes(lab.IdLineaGe) ? "opacity-100" : "opacity-0")} />
                                                    {lab.Descripcion}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {selectedLabs.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {selectedLabs.map(id => {
                                    const found = catLaboratorios.find(l => l.IdLineaGe === id)
                                    return found ? (
                                        <Badge key={id} variant="secondary" className="max-w-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 md:text-xs">
                                            <span className="truncate">{found.Descripcion}</span>
                                            <X className="ml-1.5 h-3 w-3 shrink-0 cursor-pointer rounded-full hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-950/50 dark:hover:text-red-400" onClick={() => toggleLab(id)} />
                                        </Badge>
                                    ) : null
                                })}
                                <span className="ml-1 cursor-pointer self-center text-xs font-medium text-muted-foreground hover:text-foreground hover:underline" onClick={() => setSelectedLabs([])}>
                                    Limpiar
                                </span>
                            </div>
                        )}
                    </div>

                    {isManagerOrAdmin ? (
                        <div className="flex min-w-0 flex-col gap-1.5">
                            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Users className="h-4 w-4 shrink-0" /> Vendedores
                            </label>
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
                    ) : null}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Button onClick={handleBuscar} disabled={loading} className="h-10 w-full bg-blue-600 shadow-sm hover:bg-blue-700 sm:w-auto">
                            {loading
                                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                : <Search className="mr-2 h-4 w-4" />}
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
                            <TrendingUp className="h-10 w-10 opacity-40" />
                            <p className="text-sm">Elige un periodo y pulsa <b>Buscar</b> para generar el reporte.</p>
                        </div>
                    ) : !data || data.Laboratorios.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
                            <Package className="h-10 w-10 opacity-40" />
                            <p className="text-sm">No hay ventas para los filtros seleccionados.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Cabecera: empresa y periodo */}
                            <div className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-background p-4 shadow-sm md:grid-cols-2">
                                <div>
                                    <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                                        {data.Empresa.NombreRazSocial}
                                    </h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        <span className="font-semibold">RUC:</span> {data.Empresa.RUC}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        <span className="font-semibold">Periodo:</span> {data.Mes}/{data.Anio}
                                    </p>
                                </div>
                                <div className="flex gap-2 md:justify-end">
                                    <Button variant="outline" size="sm" className="flex-1 md:flex-none"
                                            onClick={() => setExpandidos(new Set(data.Laboratorios.map(l => l.Laboratorio)))}>
                                        Expandir todo
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1 md:flex-none"
                                            onClick={() => setExpandidos(new Set())}>
                                        Colapsar todo
                                    </Button>
                                </div>
                            </div>

                            {/* Totales */}
                            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                <TotalCard label="Cantidad vendida" valor={fmtCant(data.TotalCantidad)} />
                                <TotalCard label="Ventas"   valor={`S/ ${fmt(data.TotalVentas)}`}   acento={ACENTO.ventas} />
                                <TotalCard label="Costo"    valor={`S/ ${fmt(data.TotalCosto)}`}    acento={ACENTO.costo} />
                                <TotalCard label="Utilidad" valor={`S/ ${fmt(data.TotalUtilidad)}`} acento={ACENTO.utilidad}
                                           nota={margenTotal !== null ? `${margenTotal.toFixed(1)}% de margen` : undefined} />
                            </div>

                            {/* Un bloque por laboratorio */}
                            {data.Laboratorios.map(lab => {
                                const abierto = expandidos.has(lab.Laboratorio)
                                return (
                                    <div key={lab.Laboratorio} className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
                                        {/* Barra oscura, igual que la de vendedor en Saldos por Cobrar.
                                            slate-800 se ve igual en claro y oscuro: no necesita variante. */}
                                        <button
                                            type="button"
                                            onClick={() => toggleLabExpand(lab.Laboratorio)}
                                            className="flex w-full items-center gap-2 bg-slate-800 p-3 text-left text-white transition-colors hover:bg-slate-700"
                                        >
                                            {abierto
                                                ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-300" />
                                                : <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />}
                                            <span className="min-w-0 flex-1 text-sm font-bold md:text-base">{lab.Laboratorio}</span>
                                            <span className="w-fit whitespace-nowrap rounded-full border border-slate-600 bg-slate-700 px-3 py-1 text-xs font-medium">
                                                {lab.productos.length} producto{lab.productos.length === 1 ? '' : 's'}
                                            </span>
                                        </button>

                                        {/* Totales del laboratorio */}
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-b border-border bg-muted/50 px-4 py-2.5 md:grid-cols-4">
                                            <ResumenLab label="Cantidad" valor={fmtCant(lab.TotalCantidad)} />
                                            <ResumenLab label="Ventas"   valor={fmt(lab.TotalVentas)}   acento={ACENTO.ventas} />
                                            <ResumenLab label="Costo"    valor={fmt(lab.TotalCosto)}    acento={ACENTO.costo} />
                                            <ResumenLab label="Utilidad" valor={fmt(lab.TotalUtilidad)} acento={ACENTO.utilidad} />
                                        </div>

                                        {abierto && (
                                            <>
                                                {/* Escritorio: tabla */}
                                                <div className="hidden overflow-x-auto md:block">
                                                    <table className="w-full text-left text-xs text-muted-foreground">
                                                        <thead className="border-b border-border bg-muted text-[10px] uppercase text-muted-foreground md:text-xs">
                                                            <tr>
                                                                <th className="px-3 py-3 font-bold">Producto</th>
                                                                <th className="px-3 py-3 font-bold">Und.</th>
                                                                <th className="px-3 py-3 text-right font-bold">Cantidad</th>
                                                                <th className={cn("px-3 py-3 text-right font-bold", ACENTO.ventas)}>Ventas</th>
                                                                <th className={cn("px-3 py-3 text-right font-bold", ACENTO.costo)}>Costo</th>
                                                                <th className={cn("px-3 py-3 text-right font-bold", ACENTO.utilidad)}>Utilidad</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {lab.productos.map(p => (
                                                                <tr key={p.Codigo_Art} className="border-b border-border transition-colors last:border-0 hover:bg-muted">
                                                                    <td className="px-3 py-2 font-medium text-foreground">{p.Producto}</td>
                                                                    <td className="px-3 py-2">{p.AbrevUnidMed}</td>
                                                                    <td className="px-3 py-2 text-right font-mono">{fmtCant(p.Cantidad)}</td>
                                                                    <td className={cn("px-3 py-2 text-right font-mono font-bold", ACENTO.ventas, TINTE.ventas)}>
                                                                        {fmt(p.Ventas)}
                                                                    </td>
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

                                                {/* Móvil: cards */}
                                                <div className="grid grid-cols-1 gap-3 bg-muted p-3 md:hidden">
                                                    {lab.productos.map(p => (
                                                        <div key={p.Codigo_Art} className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4 shadow-sm">
                                                            <span className="pr-2 text-sm font-bold leading-tight text-foreground">{p.Producto}</span>
                                                            <div className="mt-1 border-t border-border pt-2">
                                                                <FilaMovil label={`Cantidad (${p.AbrevUnidMed})`} valor={fmtCant(p.Cantidad)} />
                                                                <FilaMovil label="Ventas"   valor={`S/ ${fmt(p.Ventas)}`} acento={ACENTO.ventas} />
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

                            {/* Total general */}
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/30">
                                <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                                    Total general
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 md:grid-cols-4">
                                    <ResumenLab label="Cantidad" valor={fmtCant(data.TotalCantidad)} />
                                    <ResumenLab label="Ventas"   valor={fmt(data.TotalVentas)}   acento={ACENTO.ventas} />
                                    <ResumenLab label="Costo"    valor={fmt(data.TotalCosto)}    acento={ACENTO.costo} />
                                    <ResumenLab label="Utilidad" valor={fmt(data.TotalUtilidad)} acento={ACENTO.utilidad} />
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

function ResumenLab({ label, valor, acento }: { label: string; valor: string; acento?: string }) {
    return (
        <div className="flex items-baseline justify-between gap-2 md:flex-col md:items-start md:gap-0">
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
            <span className={cn("font-mono text-sm font-bold text-foreground", acento)}>{valor}</span>
        </div>
    )
}

function TotalCard({ label, valor, acento, nota }: {
    label: string; valor: string; acento?: string; nota?: string
}) {
    return (
        <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className={cn("mt-0.5 font-mono text-lg font-bold text-foreground md:text-xl", acento)}>{valor}</div>
            {nota && <div className="mt-0.5 text-[11px] text-muted-foreground">{nota}</div>}
        </div>
    )
}
