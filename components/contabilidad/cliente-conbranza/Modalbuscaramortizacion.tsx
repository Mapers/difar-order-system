'use client'

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import { Search, Loader2, Eye, BookOpen, BookMarked, Trash2, X, AlertCircle, RefreshCw, Undo2, ClipboardList, CalendarDays, UserRound, Landmark, ChevronDown, Inbox } from "lucide-react"
import apiClient from "@/app/api/client"
import { toast } from "@/app/hooks/useToast"
import { AmortizacionListItem } from "@/app/types/amortizacion-types"
import {fmtFecha, fmtMoney} from "@/lib/planilla.helper";

interface Props {
    open: boolean
    onClose: () => void
    onSelectEditar: (record: AmortizacionListItem) => void
    onOpenKardex: (record: AmortizacionListItem) => void
    onOpenMayor: (record: AmortizacionListItem) => void
}

const POR_PAGINA = 50

/** Importe con su moneda: S/ para soles; en otra moneda se muestra el código. */
function importe(r: AmortizacionListItem): string {
    const m = (r.Moneda || 'NSO').toUpperCase()
    return m === 'NSO' || m === 'PEN' || m === 'S' ? fmtMoney(r.Importe_Amortiz) : `${fmtMoney(r.Importe_Amortiz).replace('S/ ', '')} ${m}`
}

function vendedor(r: AmortizacionListItem): string {
    return r.NombreVendedor ? `${r.NombreVendedor} ${r.ApellidoVendedor || ''}`.trim() : r.Cod_Vend || '—'
}

export default function ModalBuscarAmortizacion({ open, onClose, onSelectEditar, onOpenKardex, onOpenMayor }: Props) {
    const [data, setData] = useState<AmortizacionListItem[]>([])
    const [loading, setLoading] = useState(false)

    const [fechaDesde, setFechaDesde] = useState("")
    const [fechaHasta, setFechaHasta] = useState("")
    const [textoBusqueda, setTextoBusqueda] = useState("")

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<AmortizacionListItem | null>(null)
    const [loadingDelete, setLoadingDelete] = useState(false)

    const [revertTarget, setRevertTarget] = useState<AmortizacionListItem | null>(null)
    const [loadingRevert, setLoadingRevert] = useState(false)

    const [hayMas, setHayMas] = useState(false)
    const [cargandoMas, setCargandoMas] = useState(false)

    /** Trae una página. Con `desde` = 0 reemplaza la lista; si no, la agrega al final ("Ver más"). */
    const cargar = useCallback(async (desde: number, filtros: { fechaDesde: string; fechaHasta: string; texto: string }) => {
        if (desde === 0) setLoading(true); else setCargandoMas(true)
        try {
            const params = new URLSearchParams()
            if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde)
            if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta)
            if (filtros.texto.trim()) params.append('texto', filtros.texto.trim())
            params.append('limite', String(POR_PAGINA))
            params.append('offset', String(desde))

            const response = await apiClient.get(`/amortizacion/listar?${params.toString()}`)
            const filas: AmortizacionListItem[] = response.data?.data?.data || []
            setHayMas(filas.length >= POR_PAGINA)
            setData(prev => desde === 0 ? filas : [...prev, ...filas.filter(f => !prev.some(p => p.Id_Amort_Clie === f.Id_Amort_Clie))])
        } catch {
            if (desde === 0) setData([])
            setHayMas(false)
        } finally {
            setLoading(false)
            setCargandoMas(false)
        }
    }, [])

    const fetchData = useCallback(
        () => cargar(0, { fechaDesde, fechaHasta, texto: textoBusqueda }),
        [cargar, fechaDesde, fechaHasta, textoBusqueda],
    )

    useEffect(() => {
        if (open) fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    const handleLimpiar = () => {
        setFechaDesde("")
        setFechaHasta("")
        setTextoBusqueda("")
        cargar(0, { fechaDesde: "", fechaHasta: "", texto: "" })
    }

    /** Cobros seguidos de la misma planilla, juntos bajo un encabezado. */
    const grupos = useMemo(() => {
        const lista: { clave: string; nro: string; filas: AmortizacionListItem[] }[] = []
        for (const r of data) {
            const nro = r.NroPlanilla || ""
            const ultimo = lista[lista.length - 1]
            if (ultimo && nro && ultimo.nro === nro) ultimo.filas.push(r)
            else lista.push({ clave: `${nro || 'sin'}-${r.Id_Amort_Clie}`, nro, filas: [r] })
        }
        return lista
    }, [data])

    const handleDeleteClick = (record: AmortizacionListItem) => {
        setDeleteTarget(record)
        setIsDeleteModalOpen(true)
    }

    const handleEliminar = async () => {
        if (!deleteTarget) return
        setLoadingDelete(true)
        try {
            await apiClient.delete(`/amortizacion/${deleteTarget.Id_Amort_Clie}`)
            toast({ title: "Eliminar", description: "Amortización eliminada correctamente." })
            setIsDeleteModalOpen(false)
            setDeleteTarget(null)
            fetchData()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.response?.data?.message || "No se pudo eliminar la amortización.",
                variant: "destructive"
            })
        } finally {
            setLoadingDelete(false)
        }
    }

    const handleRevertir = async () => {
        if (!revertTarget) return
        setLoadingRevert(true)
        try {
            const res = await apiClient.delete(`/amortizacion/planilla/${encodeURIComponent(revertTarget.NroPlanilla)}`)
            const total = res.data?.data?.resultado?.amortizaciones_eliminadas ?? 0
            toast({
                title: "Planilla revertida",
                description: `Se quitaron ${total} amortización(es) de la planilla ${revertTarget.NroPlanilla}. Ya puedes corregirla o procesarla de nuevo.`,
            })
            setRevertTarget(null)
            fetchData()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.response?.data?.error || error?.response?.data?.message || "No se pudo revertir la planilla.",
                variant: "destructive"
            })
        } finally {
            setLoadingRevert(false)
        }
    }

    const filasDePlanilla = revertTarget
        ? data.filter(r => r.NroPlanilla === revertTarget.NroPlanilla)
        : []

    return (
        <>
            <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
                <DialogContent className="max-w-[1060px] max-h-[90vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="px-5 pt-5 pb-3 border-b border-border flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div>
                                <DialogTitle className="text-[15px]">Buscar Cobranza</DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    Cobros ya registrados, agrupados por planilla. Filtra por fechas o por texto.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div data-guia="buscar-filtros" className="px-5 py-3 border-b border-border bg-muted flex-shrink-0">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="flex flex-col gap-1 w-[140px]">
                                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Fecha desde</Label>
                                <Input
                                    type="date"
                                    className="h-8 text-xs"
                                    value={fechaDesde}
                                    placeholder='Fecha inicio'
                                    onChange={e => setFechaDesde(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1 w-[140px]">
                                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Fecha hasta</Label>
                                <Input
                                    type="date"
                                    className="h-8 text-xs"
                                    value={fechaHasta}
                                    placeholder='Fecha fin'
                                    onChange={e => setFechaHasta(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Buscar texto</Label>
                                <Input
                                    className="h-8 text-xs"
                                    placeholder="Cliente, planilla, vendedor, N° doc..."
                                    value={textoBusqueda}
                                    onChange={e => setTextoBusqueda(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') fetchData() }}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={fetchData} disabled={loading}>
                                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                                    Filtrar
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleLimpiar}>
                                    <X className="h-3 w-3" /> Limpiar
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div data-guia="buscar-tabla" className="flex-1 overflow-auto bg-muted/30 px-5 py-4">
                        {loading ? (
                            <div className="py-16 text-center text-sm text-muted-foreground">
                                <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                                Cargando cobros...
                            </div>
                        ) : data.length === 0 ? (
                            <div className="py-16 text-center text-sm text-muted-foreground">
                                <Inbox className="mx-auto mb-2 h-8 w-8 opacity-40" />
                                No se encontraron cobros con esos filtros.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {grupos.map(g => {
                                    const total = g.filas.reduce((s, r) => s + Number(r.Importe_Amortiz || 0), 0)
                                    const mismaMoneda = g.filas.every(r => (r.Moneda || 'NSO') === (g.filas[0].Moneda || 'NSO'))
                                    const esWeb = g.filas.some(r => !!r.EsPlanillaCobranza)
                                    return (
                                        <section key={g.clave} className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                                            <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border bg-muted/60 px-3 py-2">
                                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                                                    <ClipboardList className="h-4 w-4" />
                                                </span>
                                                <span className="text-sm font-bold">{g.nro ? `Planilla ${g.nro}` : 'Cobro sin planilla'}</span>
                                                {esWeb && (
                                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">Planilla web</span>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    {g.filas.length} cobro{g.filas.length !== 1 ? 's' : ''} en esta lista
                                                    {mismaMoneda && <> · <b className="text-foreground">{importe({ ...g.filas[0], Importe_Amortiz: total })}</b></>}
                                                </span>
                                                {esWeb && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="ml-auto h-7 gap-1 border-amber-300 px-2.5 text-[11px] text-amber-700 hover:bg-amber-50 dark:border-amber-500/40 dark:text-amber-300 dark:hover:bg-amber-500/10"
                                                        onClick={() => setRevertTarget(g.filas.find(r => !!r.EsPlanillaCobranza) || g.filas[0])}
                                                        title="Quitar todo lo procesado de esta planilla"
                                                    >
                                                        <Undo2 className="h-3.5 w-3.5" /> Revertir planilla
                                                    </Button>
                                                )}
                                            </header>

                                            <div className="grid gap-2.5 p-2.5 md:grid-cols-2">
                                                {g.filas.map(r => (
                                                    <article key={r.Id_Amort_Clie} className="flex flex-col rounded-lg border border-border bg-card p-3 transition-shadow hover:shadow-md">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <p className="truncate text-[13px] font-bold leading-tight" title={r.NombreCliente || r.Cod_Clie}>{r.NombreCliente || r.Cod_Clie}</p>
                                                                <p className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">{r.Cod_Clie}</p>
                                                            </div>
                                                            <p className="shrink-0 whitespace-nowrap text-base font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{importe(r)}</p>
                                                        </div>

                                                        <div className="mb-2.5 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">{r.DescTipoDoc || r.TipoDoc}</span>
                                                                <span className="font-mono font-semibold text-foreground">{r.SerieDoc}-{r.NumeroDoc}</span>
                                                            </span>
                                                            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {fmtFecha(r.Fecha_Mvto)}</span>
                                                            <span className="inline-flex items-center gap-1"><UserRound className="h-3 w-3" /> {vendedor(r)}</span>
                                                            {(r.DescTipoAmort || r.DescripcionEntidadFinanciera) && (
                                                                <span className="inline-flex items-center gap-1">
                                                                    <Landmark className="h-3 w-3" />
                                                                    {[r.DescTipoAmort, r.DescripcionEntidadFinanciera, r.NroDocAmortiza ? `Op. ${r.NroDocAmortiza}` : ''].filter(Boolean).join(' · ')}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-border pt-2.5">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 gap-1 px-2.5 text-[11px] text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-500/40 dark:text-blue-300 dark:hover:bg-blue-500/10"
                                                                onClick={() => { onSelectEditar(r); onClose() }}
                                                                title="Abre el cobro en el formulario para ver todos sus datos (no se puede modificar)"
                                                            >
                                                                <Eye className="h-3.5 w-3.5" /> Ver cobro
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 gap-1 px-2.5 text-[11px] text-purple-600 border-purple-200 hover:bg-purple-50 dark:border-purple-500/40 dark:text-purple-300 dark:hover:bg-purple-500/10"
                                                                onClick={() => onOpenKardex(r)}
                                                                title="Movimiento de este cobro en la cuenta del cliente (solo consulta)"
                                                            >
                                                                <BookOpen className="h-3.5 w-3.5" /> Kardex
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 gap-1 px-2.5 text-[11px] text-cyan-600 border-cyan-200 hover:bg-cyan-50 dark:border-cyan-500/40 dark:text-cyan-300 dark:hover:bg-cyan-500/10"
                                                                onClick={() => onOpenMayor(r)}
                                                                title="Asiento contable de este cobro (solo consulta)"
                                                            >
                                                                <BookMarked className="h-3.5 w-3.5" /> L. Mayor
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="ml-auto h-7 gap-1 px-2.5 text-[11px] text-red-600 border-red-200 hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
                                                                onClick={() => handleDeleteClick(r)}
                                                                title="Borra el cobro con su kardex y su asiento"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" /> Eliminar
                                                            </Button>
                                                        </div>
                                                    </article>
                                                ))}
                                            </div>
                                        </section>
                                    )
                                })}

                                {hayMas && (
                                    <div className="flex justify-center pb-1">
                                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" disabled={cargandoMas}
                                                onClick={() => cargar(data.length, { fechaDesde, fechaHasta, texto: textoBusqueda })}>
                                            {cargandoMas ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                            Ver {POR_PAGINA} más
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="px-5 py-3 border-t border-border bg-muted flex items-center justify-between flex-shrink-0 rounded-b-lg">
                        <span className="text-xs text-muted-foreground">
                            {data.length} cobro{data.length !== 1 ? 's' : ''} mostrado{data.length !== 1 ? 's' : ''}{hayMas ? ` · hay más: pulsa «Ver ${POR_PAGINA} más»` : ''}
                        </span>
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={onClose}>Cerrar</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!revertTarget} onOpenChange={v => { if (!v && !loadingRevert) setRevertTarget(null) }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Undo2 className="h-5 w-5 text-amber-600" /> Revertir planilla {revertTarget?.NroPlanilla}
                        </DialogTitle>
                        <DialogDescription>
                            Se quitarán <strong>todas</strong> las amortizaciones de la planilla <strong>{revertTarget?.NroPlanilla}</strong>
                            {filasDePlanilla.length > 0 && <> ({filasDePlanilla.length} en esta lista, {fmtMoney(filasDePlanilla.reduce((s, r) => s + Number(r.Importe_Amortiz), 0))})</>}
                            , con sus registros de kardex y libro mayor. La planilla vuelve a quedar validada en Planilla de Cobranza y, si sus cobros se aceptaron en Libro Caja, vuelven a Pendientes allí para aceptarlos de nuevo.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setRevertTarget(null)} disabled={loadingRevert}>
                            Cancelar
                        </Button>
                        <Button onClick={handleRevertir} className="bg-amber-600 hover:bg-amber-700" disabled={loadingRevert}>
                            {loadingRevert ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Undo2 className="h-4 w-4 mr-2" />}
                            Revertir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600" /> Confirmar Eliminación
                        </DialogTitle>
                        <DialogDescription>
                            ¿Eliminar la amortización <strong>{deleteTarget?.NroPlanilla || `#${deleteTarget?.Id_Amort_Clie}`}</strong> del cliente <strong>{deleteTarget?.NombreCliente || deleteTarget?.Cod_Clie}</strong>? Se borrarán también los registros de kardex y libro mayor asociados. Si el cobro se aceptó en Libro Caja, vuelve a Pendientes allí. Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={loadingDelete}>
                            Cancelar
                        </Button>
                        <Button onClick={handleEliminar} className="bg-red-600 hover:bg-red-700" disabled={loadingDelete}>
                            {loadingDelete ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}