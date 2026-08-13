import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { MonthYearPicker } from "@/components/ui/month-year-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calculator, Save, AlertTriangle, RefreshCw, Search, Package, FlaskConical, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/app/hooks/useToast"
import { useAuth } from "@/context/authContext"
import apiClient from "@/app/api/client"
import { Laboratorio } from "@/app/types/user-types"
import { PricePagination } from "@/components/lista-precios-lote/PricePagination"
import { CostosService, CostoArticulo, CostoGuardar } from "@/app/services/costos/CostosService"

const fmt     = (n: number) => Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtCant = (n: number) => Number(n || 0).toLocaleString('es-PE', { maximumFractionDigits: 2 })

const periodoDe = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`

interface CostosSectionProps {
    /** El hub inyecta acá el handler del botón "Nuevo Registro"; esta sección no lo usa. */
    onOpenModalChange: (fn: (() => void) | null) => void;
}

export default function CostosSection({ onOpenModalChange }: CostosSectionProps) {
    const { user } = useAuth()

    // Sin botón "Nuevo Registro" en la cabecera: acá no se crean artículos, se
    // les carga el costo. El alta masiva es "Cargar laboratorio".
    useEffect(() => { onOpenModalChange(null) }, [onOpenModalChange])

    const [fecha, setFecha]                 = useState<Date>(new Date())
    const [busqueda, setBusqueda]           = useState("")
    const [soloPendientes, setSoloPendientes] = useState(false)

    const [laboratorios, setLaboratorios]   = useState<Laboratorio[]>([])
    const [labSeleccionado, setLabSeleccionado] = useState<string>("")
    const [cargandoLab, setCargandoLab]     = useState(false)
    // Se enciende al cargar un laboratorio: sus artículos pueden no haberse
    // movido en el mes y sin esto no aparecerían en la grilla.
    const [verSinMovimiento, setVerSinMovimiento] = useState(false)

    const [currentPage, setCurrentPage]   = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(20)

    const [filas, setFilas]         = useState<CostoArticulo[]>([])
    const [editadas, setEditadas]   = useState<Record<string, number>>({})
    const [loading, setLoading]     = useState(false)
    const [guardando, setGuardando] = useState(false)
    const [recalculando, setRecalculando] = useState(false)

    const periodo = periodoDe(fecha)
    const fechaVigencia = `${periodo.slice(0, 4)}-${periodo.slice(4, 6)}-01`

    useEffect(() => {
        apiClient.get('/price/laboratories')
            .then(res => setLaboratorios(res.data?.data || []))
            .catch(() => toast({
                title: "Error",
                description: "No se pudo cargar la lista de laboratorios.",
                variant: "destructive",
            }))
    }, [])

    const cargar = useCallback(async () => {
        setLoading(true)
        try {
            const res = await CostosService.listar(
                periodo,
                labSeleccionado || undefined,
                soloPendientes,
                verSinMovimiento,
            )
            setFilas(res?.data?.data || [])
            setEditadas({})
        } catch (error: any) {
            setFilas([])
            toast({
                title: "Error",
                description: error?.response?.data?.message || "No se pudieron cargar los costos.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }, [periodo, labSeleccionado, soloPendientes, verSinMovimiento])

    useEffect(() => { cargar() }, [cargar])

    /** Editar a mano marca la fila como manual: ese costo ya no lo pisa el recálculo. */
    const editarCosto = (codigo: string, valor: string) => {
        const num = parseFloat(valor)
        setEditadas(prev => ({ ...prev, [codigo]: isNaN(num) ? 0 : num }))
        setFilas(prev => prev.map(f =>
            f.Codigo_Art === codigo
                ? { ...f, Costo_Unit: isNaN(num) ? 0 : num, Origen: 'M' as const }
                : f
        ))
    }

    const usarSugerido = (fila: CostoArticulo) => {
        if (fila.Costo_Sugerido == null) return
        editarCosto(fila.Codigo_Art, String(fila.Costo_Sugerido))
    }

    /**
     * Crea las filas del periodo para todo el catálogo del laboratorio, se
     * haya movido o no. Los que tienen de dónde salen con su sugerido y el
     * resto en 0, visibles como pendientes.
     */
    const handleCargarLaboratorio = async () => {
        if (!labSeleccionado) return
        setCargandoLab(true)
        try {
            const res = await CostosService.cargarLaboratorio(periodo, Number(labSeleccionado), user?.nombreCompleto)
            const info = Array.isArray(res?.data) ? res.data[0] : res?.data
            toast({
                title: "Productos traídos",
                description: info
                    ? `${info.articulos_cargados} artículo(s) agregado(s). ${info.pendientes_de_costear} sin costo aún.`
                    : "Artículos cargados.",
            })
            setVerSinMovimiento(true)
            await cargar()
        } catch (error: any) {
            toast({
                title: "No se pudo cargar",
                description: error?.response?.data?.message || "Error al cargar el laboratorio.",
                variant: "destructive",
            })
        } finally {
            setCargandoLab(false)
        }
    }

    const handleRecalcular = async () => {
        setRecalculando(true)
        try {
            const res = await CostosService.recalcular(periodo, user?.nombreCompleto)
            const info = Array.isArray(res?.data) ? res.data[0] : res?.data
            toast({
                title: "Costos sugeridos",
                description: info
                    ? `${info.articulos_con_costo} artículo(s) con costo. ${info.manuales_respetados} manual(es) respetado(s).`
                    : "Costos recalculados.",
            })
            await cargar()
        } catch (error: any) {
            toast({
                title: "No se pudieron sugerir los costos",
                description: error?.response?.data?.message || "Error al recalcular los costos.",
                variant: "destructive",
            })
        } finally {
            setRecalculando(false)
        }
    }

    const handleGuardar = async () => {
        const cambios: CostoGuardar[] = filas
            .filter(f => editadas[f.Codigo_Art] !== undefined)
            .map(f => ({
                Codigo_Art: f.Codigo_Art,
                Fecha_Vigencia: fechaVigencia,
                Costo_Unit: Number(f.Costo_Unit || 0),
                Moneda: f.Moneda || 'PEN',
                Incluye_IGV: Number(f.Incluye_IGV) === 1,
                Fuente: f.Fuente,
                Estado: f.Estado ?? 1,
            }))

        if (cambios.length === 0) return

        setGuardando(true)
        try {
            const res = await CostosService.guardar(cambios, user?.nombreCompleto)
            const info = res?.data
            if (info?.errores?.length > 0) {
                toast({
                    title: "Guardado con observaciones",
                    description: `${info.guardados} de ${info.total} guardados. Revisa: ${info.errores[0].Codigo_Art}.`,
                    variant: "warning",
                })
            } else {
                toast({ title: "Guardado", description: `${cambios.length} costo(s) actualizado(s).` })
            }
            await cargar()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.response?.data?.message || "No se pudieron guardar los costos.",
                variant: "destructive",
            })
        } finally {
            setGuardando(false)
        }
    }

    const filtradas = useMemo(() => {
        if (!busqueda.trim()) return filas
        const q = busqueda.toLowerCase()
        return filas.filter(f =>
            f.Codigo_Art?.toLowerCase().includes(q) ||
            f.Descripcion?.toLowerCase().includes(q) ||
            f.Laboratorio?.toLowerCase().includes(q)
        )
    }, [filas, busqueda])

    // Al cambiar de filtro se vuelve a la primera pagina: si no, con menos
    // resultados que paginas quedaria una vista vacia.
    useEffect(() => { setCurrentPage(1) }, [busqueda, periodo, labSeleccionado, soloPendientes, verSinMovimiento])

    const totalPages = Math.ceil(filtradas.length / itemsPerPage) || 1
    const paginadas  = useMemo(
        () => filtradas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
        [filtradas, currentPage, itemsPerPage]
    )

    const pendientes = filas.filter(f => Number(f.Pendiente) === 1).length
    const sinGuardar = Object.keys(editadas).length

    return (
        <div className="grid gap-6">
            <Card className="shadow-md">
                <CardHeader className="border-b border-border bg-muted p-4 md:p-5">
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="flex min-w-0 flex-col gap-1.5">
                                <Label className="text-sm font-semibold text-foreground">Periodo</Label>
                                <MonthYearPicker value={fecha} onChange={setFecha} />
                            </div>
                            <div className="flex min-w-0 flex-col gap-1.5">
                                <Label className="text-sm font-semibold text-foreground">Buscar</Label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={busqueda}
                                        onChange={e => setBusqueda(e.target.value)}
                                        placeholder="Código, producto o laboratorio"
                                        className="h-10 pl-8"
                                    />
                                </div>
                            </div>
                            <div className="flex min-w-0 flex-col gap-1.5">
                                <Label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <FlaskConical className="h-4 w-4 shrink-0" /> Laboratorio
                                </Label>
                                <Select value={labSeleccionado} onValueChange={setLabSeleccionado}>
                                    <SelectTrigger className="h-10 bg-background">
                                        <SelectValue placeholder="Todos los laboratorios" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {laboratorios.map(l => (
                                            <SelectItem key={l.IdLineaGe} value={String(l.IdLineaGe)}>
                                                {l.Descripcion}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3">
                                <Checkbox
                                    checked={soloPendientes}
                                    onCheckedChange={v => setSoloPendientes(Boolean(v))}
                                />
                                <span className="text-sm">Solo pendientes de costear</span>
                            </label>
                            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3">
                                <Checkbox
                                    checked={verSinMovimiento}
                                    onCheckedChange={v => setVerSinMovimiento(Boolean(v))}
                                />
                                <span className="text-sm">Incluir artículos sin movimiento</span>
                            </label>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button onClick={handleCargarLaboratorio}
                                    disabled={cargandoLab || loading || !labSeleccionado}
                                    variant="outline" className="h-10"
                                    title={!labSeleccionado
                                        ? "Elige un laboratorio primero"
                                        : "Trae todos los productos del laboratorio al periodo, incluso los que no se movieron"}>
                                {cargandoLab
                                    ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    : <Download className="mr-2 h-4 w-4" />}
                                Traer productos del laboratorio
                            </Button>
                            <Button onClick={handleRecalcular} disabled={recalculando || loading} variant="outline" className="h-10"
                                    title="Calcula el costo de cada producto desde las compras del mes. No pisa los costos escritos a mano.">
                                {recalculando
                                    ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    : <Calculator className="mr-2 h-4 w-4" />}
                                Sugerir costos del mes
                            </Button>
                            <Button onClick={handleGuardar} disabled={guardando || sinGuardar === 0}
                                    className="h-10 bg-blue-600 hover:bg-blue-700">
                                {guardando
                                    ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    : <Save className="mr-2 h-4 w-4" />}
                                Guardar cambios{sinGuardar > 0 ? ` (${sinGuardar})` : ''}
                            </Button>

                            <div className="ml-auto flex items-center gap-3 text-sm">
                                <span className="text-muted-foreground">
                                    {filtradas.length} de {filas.length} artículos
                                </span>
                                <Badge variant={pendientes > 0 ? "destructive" : "secondary"}>
                                    {pendientes} pendiente{pendientes === 1 ? '' : 's'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="space-y-2 p-4">
                            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                        </div>
                    ) : filtradas.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
                            <Package className="h-10 w-10 opacity-40" />
                            <p className="text-sm">No hay artículos con movimiento en este periodo.</p>
                        </div>
                    ) : (
                        <>
                        <div className="hidden overflow-x-auto lg:block">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-border bg-muted text-[10px] uppercase text-muted-foreground md:text-xs">
                                    <tr>
                                        <th className="px-3 py-3 font-bold">Artículo</th>
                                        <th className="px-3 py-3 font-bold">Laboratorio</th>
                                        <th className="px-3 py-3 text-right font-bold">Compra mes</th>
                                        <th className="px-3 py-3 text-right font-bold">Vendido</th>
                                        <th className="px-3 py-3 text-right font-bold">Venta S/</th>
                                        <th className="px-3 py-3 text-right font-bold">Sugerido</th>
                                        <th className="px-3 py-3 text-right font-bold">Costo unitario</th>
                                        <th className="px-3 py-3 font-bold">Origen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginadas.map(f => {
                                        const pendiente = Number(f.Costo_Unit || 0) === 0
                                        const tocada    = editadas[f.Codigo_Art] !== undefined
                                        return (
                                            <tr key={f.Codigo_Art}
                                                className={cn(
                                                    "border-b border-border transition-colors last:border-0 hover:bg-muted",
                                                    pendiente && "bg-amber-50/60 dark:bg-amber-950/20",
                                                    tocada && "bg-blue-50/60 dark:bg-blue-950/20"
                                                )}>
                                                <td className="px-3 py-2">
                                                    <div className="font-medium text-foreground">{f.Descripcion || f.Codigo_Art}</div>
                                                    <div className="font-mono text-[11px] text-muted-foreground">
                                                        {f.Codigo_Art} · {f.AbrevUnidMed || '—'}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 text-muted-foreground">{f.Laboratorio || '—'}</td>
                                                <td className="px-3 py-2 text-right font-mono">{fmtCant(f.Cant_Compra)}</td>
                                                <td className="px-3 py-2 text-right font-mono">{fmtCant(f.Cant_Vendida)}</td>
                                                <td className="px-3 py-2 text-right font-mono">{fmt(f.Venta_Total)}</td>
                                                <td className="px-3 py-2 text-right">
                                                    {f.Costo_Sugerido != null ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => usarSugerido(f)}
                                                            title="Usar este valor"
                                                            className="font-mono text-blue-700 underline-offset-2 hover:underline dark:text-blue-400"
                                                        >
                                                            {fmt(f.Costo_Sugerido)}
                                                        </button>
                                                    ) : <span className="text-muted-foreground">—</span>}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <Input
                                                        type="number"
                                                        step="0.0001"
                                                        min="0"
                                                        value={f.Costo_Unit ?? 0}
                                                        onChange={e => editarCosto(f.Codigo_Art, e.target.value)}
                                                        className={cn(
                                                            "h-8 w-28 text-right font-mono",
                                                            pendiente && "border-amber-400"
                                                        )}
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    {f.Origen === 'C' && (
                                                        <Badge variant="secondary" className="text-[10px]" title={f.Base_Calculo || ''}>
                                                            Calculado
                                                        </Badge>
                                                    )}
                                                    {f.Origen === 'M' && (
                                                        <Badge className="border border-blue-200 bg-blue-50 text-[10px] text-blue-700 hover:bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-400">
                                                            Manual
                                                        </Badge>
                                                    )}
                                                    {!f.Origen && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-500">
                                                            <AlertTriangle className="h-3 w-3" /> Sin costo
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Móvil y tablet: una tarjeta por producto. Ocho columnas
                            no entran en un teléfono ni con scroll horizontal. */}
                        <div className="grid grid-cols-1 gap-3 p-3 lg:hidden">
                            {paginadas.map(f => {
                                const pendiente = Number(f.Costo_Unit || 0) === 0
                                const tocada    = editadas[f.Codigo_Art] !== undefined
                                return (
                                    <div key={f.Codigo_Art}
                                         className={cn(
                                             "flex flex-col gap-2 rounded-lg border border-border bg-background p-4 shadow-sm",
                                             pendiente && "border-amber-300 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20",
                                             tocada && "border-blue-300 bg-blue-50/50 dark:border-blue-900/60 dark:bg-blue-950/20"
                                         )}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold leading-tight text-foreground">
                                                    {f.Descripcion || f.Codigo_Art}
                                                </p>
                                                <p className="font-mono text-[11px] text-muted-foreground">
                                                    {f.Codigo_Art} · {f.AbrevUnidMed || '—'}
                                                </p>
                                            </div>
                                            {f.Origen === 'C' && <Badge variant="secondary" className="shrink-0 text-[10px]">Calculado</Badge>}
                                            {f.Origen === 'M' && (
                                                <Badge className="shrink-0 border border-blue-200 bg-blue-50 text-[10px] text-blue-700 hover:bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-400">
                                                    Manual
                                                </Badge>
                                            )}
                                            {!f.Origen && (
                                                <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-amber-700 dark:text-amber-500">
                                                    <AlertTriangle className="h-3 w-3" /> Sin costo
                                                </span>
                                            )}
                                        </div>

                                        <p className="truncate text-xs text-muted-foreground">{f.Laboratorio || '—'}</p>

                                        <div className="grid grid-cols-3 gap-2 border-t border-border pt-2 text-center">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Compra mes</p>
                                                <p className="font-mono text-xs">{fmtCant(f.Cant_Compra)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Vendido</p>
                                                <p className="font-mono text-xs">{fmtCant(f.Cant_Vendida)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Venta S/</p>
                                                <p className="font-mono text-xs">{fmt(f.Venta_Total)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-end justify-between gap-3 border-t border-border pt-2">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Sugerido</p>
                                                {f.Costo_Sugerido != null ? (
                                                    <button type="button" onClick={() => usarSugerido(f)}
                                                            className="font-mono text-sm text-blue-700 underline-offset-2 hover:underline dark:text-blue-400">
                                                        {fmt(f.Costo_Sugerido)}
                                                    </button>
                                                ) : <span className="text-sm text-muted-foreground">—</span>}
                                            </div>
                                            <div className="text-right">
                                                <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">Costo unitario</p>
                                                <Input
                                                    type="number"
                                                    step="0.0001"
                                                    min="0"
                                                    inputMode="decimal"
                                                    value={f.Costo_Unit ?? 0}
                                                    onChange={e => editarCosto(f.Codigo_Art, e.target.value)}
                                                    className={cn("h-9 w-32 text-right font-mono", pendiente && "border-amber-400")}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        </>
                    )}
                </CardContent>

                {filtradas.length > 0 && (
                    <PricePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(val: number) => { setItemsPerPage(val); setCurrentPage(1) }}
                    />
                )}
            </Card>

            <div className="rounded-lg border border-border bg-background p-3 text-[11px] leading-relaxed text-muted-foreground">
                <p>
                    <b className="text-foreground">Sugerir costos del mes</b> propone el costo desde las compras del mes
                    (promedio ponderado). Si el artículo no se compró, arrastra su último costo vigente; y si
                    nunca tuvo, usa el promedio de todo lo comprado hasta la fecha. El origen de cada fila se
                    ve al pasar el mouse sobre la etiqueta <i>Calculado</i>. <b className="text-foreground">Traer
                    productos del laboratorio</b> agrega al periodo el catálogo completo del laboratorio elegido,
                    incluidos los que no se movieron en el mes.
                </p>
                <p className="mt-1">
                    <b className="text-foreground">Un costo manual nunca se pisa</b> al recalcular. Los costos
                    se guardan por periodo, así que corregir el de este mes no altera los reportes de meses
                    anteriores.
                </p>
            </div>
        </div>
    )
}
