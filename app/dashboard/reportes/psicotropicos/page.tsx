'use client'

import React, { useState, useMemo, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/app/hooks/useToast"
import apiClient from "@/app/api/client"
import { FileText, RefreshCcw, Download, FlaskConical, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import * as XLSX from 'xlsx'
import { ExportLibroPsicotropicosPdf } from "@/components/reporte/exportLibroPsicotropicosPdf"
import { DocumentoPdfLink } from "@/components/reporte/DocumentoPdfLink"

const MAX_FOLIO = 8

// ── Types ────────────────────────────────────────────────────────────────────

interface Producto {
    id: string
    dci: string
    conc: string
    forma: string
    lista: string
    unidad: string
    laboratorio: string
    saldoIni: number
}

interface Movimiento {
    id: string
    fecha: string
    tipo: 'INGRESO' | 'EGRESO'
    prodId: string
    serie: string
    corr: string
    estab: string
    cant: number
}

interface LibroConfig {
    razon: string
    ruc: string
    dir: string
    dt: string
    anio: number
    folio: string
}

interface LibroData {
    config: LibroConfig
    productos: Producto[]
    movimientos: Movimiento[]
}

interface KardexRow extends Movimiento {
    saldoCorriente: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function prodLabel(p: Producto) { return `${p.dci} ${p.conc}` }
function fmt(n: number): string { return n.toLocaleString('es-PE') }

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PsicotropicosPage() {
    const currentYear = new Date().getFullYear()

    const [loading,      setLoading]      = useState(false)
    const [data,         setData]         = useState<LibroData | null>(null)
    const [selectedYear, setSelectedYear] = useState(String(currentYear))

    const [vista,       setVista]       = useState<'diario' | 'folio'>('diario')
    const [desde,       setDesde]       = useState('')
    const [hasta,       setHasta]       = useState('')
    const [tipoFiltro,  setTipoFiltro]  = useState('all')
    const [prodDiario,  setProdDiario]  = useState('all')
    const [buscar,      setBuscar]      = useState('')
    const [visiblesSet, setVisiblesSet] = useState<Set<string>>(new Set())

    const [showKardex,   setShowKardex]   = useState(false)
    const [showSaldos,   setShowSaldos]   = useState(false)
    const [kardexProdId, setKardexProdId] = useState('')

    // ── Derived ───────────────────────────────────────────────────────────

    const movsOrdenados = useMemo<Movimiento[]>(() => {
        if (!data) return []
        return [...data.movimientos].sort((a, b) =>
            a.fecha === b.fecha
                ? a.id.localeCompare(b.id)
                : a.fecha.localeCompare(b.fecha)
        )
    }, [data])

    const mapaSaldos = useMemo<Record<string, number>>(() => {
        if (!data) return {}
        const acc: Record<string, number> = {}
        const out: Record<string, number> = {}
        data.productos.forEach(p => { acc[p.id] = p.saldoIni })
        movsOrdenados.forEach(m => {
            acc[m.prodId] = (acc[m.prodId] ?? 0) + (m.tipo === 'INGRESO' ? m.cant : -m.cant)
            out[m.id] = acc[m.prodId]
        })
        return out
    }, [data, movsOrdenados])

    const saldoActual = useCallback((id: string): number => {
        if (!data) return 0
        const p = data.productos.find(pr => pr.id === id)
        if (!p) return 0
        let s = p.saldoIni
        data.movimientos
            .filter(m => m.prodId === id)
            .forEach(m => { s += m.tipo === 'INGRESO' ? m.cant : -m.cant })
        return s
    }, [data])

    const filtroFila = useCallback((m: Movimiento): boolean => {
        if (desde && m.fecha < desde) return false
        if (hasta && m.fecha > hasta) return false
        if (tipoFiltro !== 'all' && m.tipo !== tipoFiltro) return false
        if (buscar) {
            const hay = `${m.serie}-${m.corr} ${m.estab}`.toLowerCase()
            if (!hay.includes(buscar.toLowerCase())) return false
        }
        return true
    }, [desde, hasta, tipoFiltro, buscar])

    const movsDiario = useMemo(
        () => movsOrdenados.filter(m => filtroFila(m) && (prodDiario === 'all' || m.prodId === prodDiario)),
        [movsOrdenados, filtroFila, prodDiario]
    )

    const movsFolio = useMemo(
        () => movsOrdenados.filter(filtroFila),
        [movsOrdenados, filtroFila]
    )

    const prodsVisibles = useMemo<Producto[]>(() => {
        if (!data) return []
        return data.productos.filter(p => visiblesSet.has(p.id)).slice(0, MAX_FOLIO)
    }, [data, visiblesSet])

    const productosPorLaboratorio = useMemo(() => {
        if (!data) return [] as { laboratorio: string; productos: Producto[] }[]
        const map = new Map<string, Producto[]>()
        data.productos.forEach(p => {
            const key = p.laboratorio || 'Sin Laboratorio'
            if (!map.has(key)) map.set(key, [])
            map.get(key)!.push(p)
        })
        return Array.from(map.entries())
            .map(([laboratorio, productos]) => ({ laboratorio, productos }))
            .sort((a, b) => a.laboratorio.localeCompare(b.laboratorio))
    }, [data])

    const kardexProd = data?.productos.find(p => p.id === kardexProdId) ?? null

    const kardexRows = useMemo<KardexRow[]>(() => {
        if (!data || !kardexProd) return []
        let saldo = kardexProd.saldoIni
        return data.movimientos
            .filter(m => m.prodId === kardexProdId)
            .sort((a, b) => a.fecha === b.fecha ? a.id.localeCompare(b.id) : a.fecha.localeCompare(b.fecha))
            .map(m => {
                saldo += m.tipo === 'INGRESO' ? m.cant : -m.cant
                return { ...m, saldoCorriente: saldo }
            })
    }, [data, kardexProd, kardexProdId])

    const years = Array.from({ length: 6 }, (_, i) => String(currentYear - i))
    const hayDatos = !!data && data.productos.length > 0

    // ── Actions ───────────────────────────────────────────────────────────

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await apiClient.get(`/reportes/libro-psicotropicos?anio=${selectedYear}`)
            const libro: LibroData = res.data?.data
            if (!libro) {
                toast({ description: 'No se encontraron datos para el año seleccionado.', variant: 'warning' })
                setData(null)
                return
            }
            setData(libro)
            const defaultVisible = new Set(libro.productos.slice(0, MAX_FOLIO).map(p => p.id))
            setVisiblesSet(defaultVisible)
            setVista(libro.productos.length > MAX_FOLIO ? 'diario' : 'folio')
            if (libro.productos.length > 0) setKardexProdId(libro.productos[0].id)
        } catch (err) {
            console.error(err)
            toast({ title: 'Error', description: 'No se pudo cargar el libro de control.', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }, [selectedYear])

    useEffect(() => { fetchData() }, [])

    const toggleVisible = (id: string) => {
        setVisiblesSet(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else if (next.size < MAX_FOLIO) next.add(id)
            return next
        })
    }

    const limpiarFiltros = () => {
        setDesde(''); setHasta(''); setTipoFiltro('all'); setProdDiario('all'); setBuscar('')
    }

    const exportExcel = () => {
        if (!data) return
        const movsFiltrados = movsOrdenados.filter(m =>
            filtroFila(m) && (vista !== 'diario' || prodDiario === 'all' || m.prodId === prodDiario)
        )

        // Hoja 1: Movimientos
        const encabezado = [
            ['LIBRO DE CONTROL DE PSICOTRÓPICOS Y ESTUPEFACIENTES'],
            [`Empresa: ${data.config.razon}  |  RUC: ${data.config.ruc}  |  Año: ${selectedYear}`],
            [`Director Técnico: ${data.config.dt || '—'}  |  Folio: ${data.config.folio || '—'}`],
            [],
            ['Mes', 'Día', 'Fecha', 'DCI', 'Concentración', 'Comprobante', 'Establecimiento', 'Debe', 'Haber', 'Saldo']
        ]

        const filas = movsFiltrados.map(m => {
            const [, mes, dia] = m.fecha.split('-')
            const p = data.productos.find(pr => pr.id === m.prodId)
            return [
                Number(mes),
                Number(dia),
                m.fecha,
                p?.dci || m.prodId,
                p?.conc || '',
                `${m.serie}-${m.corr}`,
                m.estab,
                m.tipo === 'INGRESO' ? m.cant : '',
                m.tipo === 'EGRESO'  ? m.cant : '',
                mapaSaldos[m.id] ?? ''
            ]
        })

        const wsMovs = XLSX.utils.aoa_to_sheet([...encabezado, ...filas])
        wsMovs['!cols'] = [
            { wch: 6 }, { wch: 6 }, { wch: 12 }, { wch: 28 }, { wch: 18 },
            { wch: 16 }, { wch: 35 }, { wch: 10 }, { wch: 10 }, { wch: 10 }
        ]

        // Hoja 2: Saldos actuales
        const hdrSaldos = [['DCI', 'Concentración', 'Forma', 'Clasificación', 'Unidad', 'Saldo Inicial', 'Saldo Actual']]
        const filasSaldos = data.productos.map(p => [
            p.dci, p.conc, p.forma, p.lista, p.unidad, p.saldoIni, saldoActual(p.id)
        ])
        const wsSaldos = XLSX.utils.aoa_to_sheet([...hdrSaldos, ...filasSaldos])
        wsSaldos['!cols'] = [
            { wch: 28 }, { wch: 18 }, { wch: 14 }, { wch: 22 },
            { wch: 8 }, { wch: 14 }, { wch: 14 }
        ]

        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, wsMovs, 'Movimientos')
        XLSX.utils.book_append_sheet(wb, wsSaldos, 'Saldos')
        XLSX.writeFile(wb, `libro-psicotropicos-${selectedYear}.xlsx`)
    }

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <div className="grid gap-4 p-3 md:p-6">

            {/* Title */}
            <div className="flex flex-col gap-1">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">
                    Libro de Control · Psicotrópicos y Estupefacientes
                </h1>
                <p className="text-xs md:text-sm text-gray-500">
                    Registro oficial de movimientos de sustancias fiscalizadas.
                </p>
            </div>

            {/* Main card */}
            <Card className="shadow-md min-w-0">
                <CardHeader className="bg-slate-50 border-b border-slate-200 p-3 md:p-5 space-y-3">

                    {/* Toolbar */}
                    <div className="flex flex-wrap items-end gap-2">
                        <div className="flex items-end gap-2">
                            <div className="flex flex-col gap-1">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Año</Label>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="w-24 h-9 bg-white text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                onClick={fetchData}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 h-9 px-4 text-sm"
                            >
                                <RefreshCcw className={cn("mr-1.5 h-3.5 w-3.5", loading && "animate-spin")} />
                                {loading ? 'Cargando…' : 'Consultar'}
                            </Button>
                        </div>

                        {hayDatos && (
                            <div className="flex flex-wrap gap-2 ml-auto">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 text-xs"
                                    onClick={() => setShowKardex(true)}
                                >
                                    <Activity className="h-3.5 w-3.5 mr-1.5" />
                                    <span className="hidden sm:inline">Kardex por producto</span>
                                    <span className="sm:hidden">Kardex</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 text-xs"
                                    onClick={() => setShowSaldos(true)}
                                >
                                    <FlaskConical className="h-3.5 w-3.5 mr-1.5" />
                                    <span className="hidden sm:inline">Saldo actual</span>
                                    <span className="sm:hidden">Saldos</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 text-xs bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                    onClick={exportExcel}
                                >
                                    <Download className="h-3.5 w-3.5 mr-1.5" />
                                    <span className="hidden sm:inline">Exportar Excel</span>
                                    <span className="sm:hidden">Excel</span>
                                </Button>
                                <ExportLibroPsicotropicosPdf
                                    config={data.config}
                                    productos={data.productos}
                                    movimientos={data.movimientos}
                                    anio={selectedYear}
                                />
                            </div>
                        )}
                    </div>

                    {/* View toggle */}
                    {hayDatos && (
                        <div className="inline-flex border border-slate-300 rounded-md overflow-hidden w-full sm:w-auto">
                            <button
                                onClick={() => setVista('diario')}
                                className={cn(
                                    "flex-1 sm:flex-none px-4 py-2 text-sm font-semibold transition-colors",
                                    vista === 'diario'
                                        ? "bg-blue-600 text-white"
                                        : "bg-white text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                Diario (lista)
                            </button>
                            <button
                                onClick={() => setVista('folio')}
                                className={cn(
                                    "flex-1 sm:flex-none px-4 py-2 text-sm font-semibold transition-colors border-l border-slate-300",
                                    vista === 'folio'
                                        ? "bg-blue-600 text-white"
                                        : "bg-white text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                Folio (matriz)
                            </button>
                        </div>
                    )}

                    {/* Filters */}
                    {hayDatos && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                            <div className="flex flex-col gap-1">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Desde</Label>
                                <Input
                                    type="date"
                                    value={desde}
                                    onChange={e => setDesde(e.target.value)}
                                    className="h-9 bg-white w-full text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Hasta</Label>
                                <Input
                                    type="date"
                                    value={hasta}
                                    onChange={e => setHasta(e.target.value)}
                                    className="h-9 bg-white w-full text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Tipo</Label>
                                <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                                    <SelectTrigger className="h-9 bg-white w-full text-sm">
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="INGRESO">Ingresos (Debe)</SelectItem>
                                        <SelectItem value="EGRESO">Egresos (Haber)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {vista === 'diario' && (
                                <div className="flex flex-col gap-1">
                                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Producto</Label>
                                    <Select value={prodDiario} onValueChange={setProdDiario}>
                                        <SelectTrigger className="h-9 bg-white w-full text-sm">
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los productos</SelectItem>
                                            {data.productos.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{prodLabel(p)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="flex flex-col gap-1 col-span-2 sm:col-span-2 lg:col-span-1 xl:col-span-1">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Buscar</Label>
                                <Input
                                    value={buscar}
                                    onChange={e => setBuscar(e.target.value)}
                                    placeholder="Comprobante, establecimiento…"
                                    className="h-9 bg-white w-full text-sm"
                                />
                            </div>
                            <div className="flex items-end col-span-2 sm:col-span-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 w-full text-xs"
                                    onClick={limpiarFiltros}
                                >
                                    Limpiar filtros
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Folio chips */}
                    {hayDatos && vista === 'folio' && (
                        <div className="border border-slate-200 rounded-lg bg-white p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                    Sustancias en folio
                                </span>
                                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                                    {visiblesSet.size} / {MAX_FOLIO} seleccionadas
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {data.productos.map(p => {
                                    const activo = visiblesSet.has(p.id)
                                    const lleno = !activo && visiblesSet.size >= MAX_FOLIO
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => toggleVisible(p.id)}
                                            disabled={lleno}
                                            title={prodLabel(p)}
                                            className={cn(
                                                "border rounded-md px-2.5 py-1 text-xs font-medium transition-all truncate max-w-[160px]",
                                                activo
                                                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                                    : lleno
                                                        ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                                                        : "bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:text-blue-700"
                                            )}
                                        >
                                            {prodLabel(p)}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </CardHeader>

                <CardContent className="p-0 bg-slate-100/30">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 bg-white">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
                            <p className="text-slate-500 font-medium">Cargando libro de control…</p>
                        </div>
                    ) : !hayDatos ? (
                        <div className="flex flex-col items-center justify-center py-24 bg-white">
                            <FileText className="h-16 w-16 text-slate-200 mb-4" />
                            <p className="text-slate-500 font-medium text-center px-4 max-w-sm">
                                Selecciona el año y presiona <strong>Consultar</strong> para cargar el libro de control.
                            </p>
                        </div>
                    ) : vista === 'diario' ? (
                        <DiarioView
                            movs={movsDiario}
                            totalMovs={data.movimientos.length}
                            productos={data.productos}
                            prodDiario={prodDiario}
                            mapaSaldos={mapaSaldos}
                        />
                    ) : (
                        <FolioView
                            movs={movsFolio}
                            productos={data.productos}
                            prodsVisibles={prodsVisibles}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Legend */}
            {hayDatos && (
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-3 flex flex-wrap gap-5 items-center text-xs text-slate-600">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Leyenda</span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded bg-emerald-600 shrink-0" />
                        <b>Debe</b> — ingreso (compra / devolución que aumenta el stock)
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded bg-red-600 shrink-0" />
                        <b>Haber</b> — egreso (despacho / venta que disminuye el stock)
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded bg-slate-800 shrink-0" />
                        <b>Saldo</b> — existencia corriente tras cada movimiento
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded border border-red-400 bg-red-100 shrink-0" />
                        Valor en <b className="mx-1">rojo</b> — stock bajo (≤ 5 unidades) o saldo negativo
                    </span>
                </div>
            )}

            {/* ── Kardex Modal ───────────────────────────────────────────────────── */}
            <Dialog open={showKardex} onOpenChange={setShowKardex}>
                <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-0 p-0">
                    <DialogHeader className="px-5 pt-5 pb-4 border-b border-slate-200 shrink-0">
                        <div className="flex flex-wrap items-center gap-3">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700 mb-0.5">
                                    Trazabilidad
                                </p>
                                <DialogTitle>Kardex por producto</DialogTitle>
                            </div>
                            {data && (
                                <Select value={kardexProdId} onValueChange={setKardexProdId}>
                                    <SelectTrigger className="w-56 h-8 ml-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {data.productos.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{prodLabel(p)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-5 py-4">
                        {kardexProd && (
                            <p className="text-xs text-slate-500 mb-3">
                                {prodLabel(kardexProd)} — {kardexProd.forma} · {kardexProd.lista} ·
                                Saldo inicial: <strong>{fmt(kardexProd.saldoIni)}</strong> {kardexProd.unidad}
                            </p>
                        )}
                        {kardexRows.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                <FileText className="h-10 w-10 mb-3 text-slate-200" />
                                <p>Sin movimientos para este producto.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                <table className="w-full text-sm">
                                    <thead className="text-[10px] text-white uppercase bg-slate-800">
                                        <tr>
                                            <th className="px-3 py-2.5 text-left font-semibold">Fecha</th>
                                            <th className="px-3 py-2.5 text-left font-semibold">Comprobante</th>
                                            <th className="px-3 py-2.5 text-left font-semibold">Establecimiento</th>
                                            <th className="px-3 py-2.5 text-right font-semibold text-emerald-300">Debe</th>
                                            <th className="px-3 py-2.5 text-right font-semibold text-red-300">Haber</th>
                                            <th className="px-3 py-2.5 text-right font-semibold">Saldo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {kardexProd && (
                                            <tr className="bg-amber-50 font-semibold">
                                                <td className="px-3 py-2 text-center text-slate-400 text-xs">—</td>
                                                <td className="px-3 py-2 text-slate-600 text-xs">Saldo Inicial</td>
                                                <td />
                                                <td className="px-3 py-2 text-right font-mono text-emerald-700 tabular-nums text-xs">
                                                    {fmt(kardexProd.saldoIni)}
                                                </td>
                                                <td />
                                                <td className="px-3 py-2 text-right font-mono font-bold text-slate-800 tabular-nums text-xs">
                                                    {fmt(kardexProd.saldoIni)}
                                                </td>
                                            </tr>
                                        )}
                                        {kardexRows.map((m, idx) => (
                                            <tr
                                                key={m.id}
                                                className={cn(
                                                    "hover:bg-slate-50 transition-colors",
                                                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                                                )}
                                            >
                                                <td className="px-3 py-2 text-xs text-slate-600">{m.fecha}</td>
                                                <td className="px-3 py-2 font-mono text-xs font-semibold text-blue-900">
                                                    <DocumentoPdfLink numeroComprobante={m.serie && m.corr ? `${m.serie}-${m.corr}` : null} />
                                                </td>
                                                <td className="px-3 py-2 text-xs text-slate-600">{m.estab}</td>
                                                <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-700 tabular-nums text-xs">
                                                    {m.tipo === 'INGRESO' ? fmt(m.cant) : ''}
                                                </td>
                                                <td className="px-3 py-2 text-right font-mono font-semibold text-red-700 tabular-nums text-xs">
                                                    {m.tipo === 'EGRESO' ? fmt(m.cant) : ''}
                                                </td>
                                                <td className={cn(
                                                    "px-3 py-2 text-right font-mono font-bold tabular-nums text-xs",
                                                    m.saldoCorriente < 0 ? "text-red-700 bg-red-50" : "text-slate-800"
                                                )}>
                                                    {fmt(m.saldoCorriente)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Saldo actual Modal ────────────────────────────────────────────── */}
            <Dialog open={showSaldos} onOpenChange={setShowSaldos}>
                <DialogContent className="max-w-xl max-h-[85vh] flex flex-col gap-0 p-0">
                    <DialogHeader className="px-5 pt-5 pb-4 border-b border-slate-200 shrink-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700 mb-0.5">
                            Existencias
                        </p>
                        <DialogTitle>Saldo actual por sustancia</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-5 py-4">
                        {data && (
                            <div className="space-y-3">
                                {productosPorLaboratorio.map(grupo => (
                                    <LaboratorioGroup
                                        key={grupo.laboratorio}
                                        laboratorio={grupo.laboratorio}
                                        productos={grupo.productos}
                                        saldoActual={saldoActual}
                                        fmt={fmt}
                                    />
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                            El saldo actual es la existencia vigente: saldo inicial + ingresos − egresos.
                            En <strong>rojo</strong>, stock bajo (≤ 5 unidades) o negativo.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LaboratorioGroup({
    laboratorio, productos, saldoActual, fmt
}: {
    laboratorio: string
    productos: Producto[]
    saldoActual: (id: string) => number
    fmt: (n: number) => string
}) {
    const [expanded, setExpanded] = useState(true)

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
                type="button"
                onClick={() => setExpanded(e => !e)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
                <span className="text-xs font-bold uppercase tracking-wide truncate">{laboratorio}</span>
                <span className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-semibold bg-white/10 rounded-full px-2 py-0.5">
                        {productos.length}
                    </span>
                    <svg
                        className={cn("w-4 h-4 transition-transform duration-200", expanded && "rotate-180")}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </button>

            {expanded && (
                <table className="w-full text-sm">
                    <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-3 py-2 text-left font-semibold">Sustancia</th>
                            <th className="px-3 py-2 text-left font-semibold">Clasificación</th>
                            <th className="px-3 py-2 text-center font-semibold">Unidad</th>
                            <th className="px-3 py-2 text-right font-semibold">Saldo actual</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {productos.map((p, idx) => {
                            const s = saldoActual(p.id)
                            const low = s <= 5
                            return (
                                <tr
                                    key={p.id}
                                    className={cn(
                                        "hover:bg-slate-50 transition-colors",
                                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                                    )}
                                >
                                    <td className="px-3 py-2 text-sm">
                                        <strong>{p.dci}</strong>{' '}{p.conc}
                                    </td>
                                    <td className="px-3 py-2 text-xs text-slate-600">{p.lista}</td>
                                    <td className="px-3 py-2 text-center text-xs">{p.unidad}</td>
                                    <td className={cn(
                                        "px-3 py-2 text-right font-mono font-bold tabular-nums text-xs",
                                        low ? "text-red-700 bg-red-50" : "text-slate-800"
                                    )}>
                                        {fmt(s)}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            )}
        </div>
    )
}

function DiarioView({
    movs, totalMovs, productos, prodDiario, mapaSaldos
}: {
    movs: Movimiento[]
    totalMovs: number
    productos: Producto[]
    prodDiario: string
    mapaSaldos: Record<string, number>
}) {
    const prodFiltro = (prodDiario && prodDiario !== 'all') ? productos.find(p => p.id === prodDiario) ?? null : null

    if (movs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white">
                <FileText className="h-12 w-12 text-slate-200 mb-3" />
                <p className="font-medium text-slate-500">Ningún movimiento coincide con los filtros.</p>
                <p className="text-xs text-slate-400 mt-1">Intenta ajustar el rango de fechas o el tipo.</p>
            </div>
        )
    }

    return (
        <div className="w-full min-w-0">
            <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium">
                <span>{movs.length} de {totalMovs} movimientos · {productos.length} sustancias</span>
                {prodFiltro && (
                    <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
                        {prodLabel(prodFiltro)}
                    </Badge>
                )}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto min-w-0">
                <table className="w-full text-sm text-left">
                    <thead className="text-[10px] text-white uppercase bg-slate-800">
                        <tr>
                            <th className="px-3 py-3 text-center font-semibold border-r border-slate-700">Mes</th>
                            <th className="px-3 py-3 text-center font-semibold border-r border-slate-700">Día</th>
                            <th className="px-3 py-3 font-semibold border-r border-slate-700">Especificación</th>
                            <th className="px-3 py-3 font-semibold border-r border-slate-700">Producto</th>
                            <th className="px-3 py-3 text-right font-semibold text-emerald-300 border-r border-slate-700">Debe</th>
                            <th className="px-3 py-3 text-right font-semibold text-red-300 border-r border-slate-700">Haber</th>
                            <th className="px-3 py-3 text-right font-semibold">Saldo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {prodFiltro && (
                            <tr className="bg-amber-50 font-semibold border-b border-amber-200">
                                <td className="px-3 py-2 text-center text-slate-400 border-r border-slate-200">—</td>
                                <td className="px-3 py-2 text-center text-slate-400 border-r border-slate-200">—</td>
                                <td className="px-3 py-2 text-amber-900 border-r border-slate-200">Saldo Inicial</td>
                                <td className="px-3 py-2 border-r border-slate-200">
                                    <span className="inline-block text-xs font-bold text-blue-800 bg-blue-100 rounded px-2 py-0.5">
                                        {prodLabel(prodFiltro)}
                                    </span>
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-emerald-700 tabular-nums border-r border-slate-200">
                                    {fmt(prodFiltro.saldoIni)}
                                </td>
                                <td className="px-3 py-2 border-r border-slate-200" />
                                <td className="px-3 py-2 text-right font-mono font-bold text-slate-800 tabular-nums">
                                    {fmt(prodFiltro.saldoIni)}
                                </td>
                            </tr>
                        )}
                        {movs.map((m, idx) => {
                            const [, mes, dia] = m.fecha.split('-')
                            const p = productos.find(pr => pr.id === m.prodId)
                            const sal = mapaSaldos[m.id]
                            const negativo = sal != null && sal < 0
                            return (
                                <tr
                                    key={m.id}
                                    className={cn(
                                        "hover:bg-slate-50 transition-colors",
                                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                                    )}
                                >
                                    <td className="px-3 py-2 text-center text-xs text-slate-500 tabular-nums border-r border-slate-100">{mes}</td>
                                    <td className="px-3 py-2 text-center text-xs text-slate-500 tabular-nums border-r border-slate-100">{dia}</td>
                                    <td className="px-3 py-2 border-r border-slate-100">
                                        <span className="font-mono text-xs font-semibold text-blue-900">
                                            <DocumentoPdfLink numeroComprobante={m.serie && m.corr ? `${m.serie}-${m.corr}` : null} />
                                        </span>
                                        <span className="text-xs text-slate-500 ml-1">/ {m.estab}</span>
                                    </td>
                                    <td className="px-3 py-2 border-r border-slate-100">
                                        {p && (
                                            <span className="inline-block text-xs font-bold text-blue-800 bg-blue-100 rounded px-2 py-0.5">
                                                {prodLabel(p)}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-700 tabular-nums border-r border-slate-100 text-xs">
                                        {m.tipo === 'INGRESO' ? fmt(m.cant) : ''}
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono font-semibold text-red-700 tabular-nums border-r border-slate-100 text-xs">
                                        {m.tipo === 'EGRESO' ? fmt(m.cant) : ''}
                                    </td>
                                    <td className={cn(
                                        "px-3 py-2 text-right font-mono font-bold tabular-nums text-xs",
                                        negativo ? "text-red-700 bg-red-50" : "text-slate-800"
                                    )}>
                                        {sal != null ? fmt(sal) : ''}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden p-4 space-y-3">
                {movs.map(m => {
                    const p = productos.find(pr => pr.id === m.prodId)
                    const sal = mapaSaldos[m.id]
                    return (
                        <div key={m.id} className="bg-white border border-slate-200 rounded-lg shadow-sm p-3 space-y-2">
                            <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                    <span className="font-mono text-sm font-bold text-blue-900">
                                        <DocumentoPdfLink numeroComprobante={m.serie && m.corr ? `${m.serie}-${m.corr}` : null} />
                                    </span>
                                    <p className="text-xs text-slate-500 mt-0.5 truncate">{m.fecha} · {m.estab}</p>
                                </div>
                                <Badge className={cn(
                                    "shrink-0 text-xs",
                                    m.tipo === 'INGRESO'
                                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                                        : 'bg-red-100 text-red-800 hover:bg-red-100'
                                )}>
                                    {m.tipo}
                                </Badge>
                            </div>
                            {p && (
                                <span className="inline-block text-xs font-bold text-blue-800 bg-blue-100 rounded px-2 py-0.5">
                                    {prodLabel(p)}
                                </span>
                            )}
                            <div className="flex gap-6 pt-1 border-t border-slate-100">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Cantidad</p>
                                    <p className={cn(
                                        "font-bold font-mono text-sm",
                                        m.tipo === 'INGRESO' ? 'text-emerald-700' : 'text-red-700'
                                    )}>
                                        {m.tipo === 'INGRESO' ? '+' : '−'}{m.cant}
                                    </p>
                                </div>
                                {sal != null && (
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Saldo</p>
                                        <p className={cn(
                                            "font-bold font-mono text-sm",
                                            sal < 0 ? 'text-red-700' : 'text-slate-800'
                                        )}>
                                            {sal}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function FolioView({
    movs, productos, prodsVisibles
}: {
    movs: Movimiento[]
    productos: Producto[]
    prodsVisibles: Producto[]
}) {
    if (prodsVisibles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white">
                <FileText className="h-12 w-12 text-slate-200 mb-3" />
                <p className="font-medium text-slate-500">
                    Selecciona qué sustancias ver en <strong>Mostrar sustancias</strong> (máx. {MAX_FOLIO}).
                </p>
            </div>
        )
    }

    const movsFiltrados = movs.filter(m => prodsVisibles.some(p => p.id === m.prodId))

    return (
        <div className="w-full min-w-0">
            {/* Info bar */}
            <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="text-xs text-slate-500 font-medium">
                    {prodsVisibles.length} de {productos.length} sustancias · {movsFiltrados.length} movimientos
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">
                    Mes / Día / Especificación fijos al desplazar →
                </span>
            </div>

            {/* Scroll hint mobile */}
            <div className="sm:hidden px-4 py-1.5 bg-blue-50 border-b border-blue-100 text-[11px] text-blue-600 font-medium">
                ← Desliza horizontalmente para ver todas las columnas →
            </div>

            <div className="overflow-x-auto min-w-0">
                <table className="text-sm border-collapse" style={{ minWidth: `${80 + 220 + prodsVisibles.length * 130}px` }}>
                    <thead>
                        <tr className="bg-slate-800 text-white">
                            <th
                                rowSpan={2}
                                className="px-2 py-2.5 text-center text-xs font-semibold sticky left-0 z-20 bg-slate-800 border-r border-slate-700 w-[40px] min-w-[40px]"
                            >
                                Mes
                            </th>
                            <th
                                rowSpan={2}
                                className="px-2 py-2.5 text-center text-xs font-semibold sticky left-[40px] z-20 bg-slate-800 border-r border-slate-700 w-[40px] min-w-[40px]"
                            >
                                Día
                            </th>
                            <th
                                rowSpan={2}
                                className="px-3 py-2.5 text-left text-xs font-semibold sticky left-[80px] z-20 bg-slate-800 border-r border-slate-600 shadow-[3px_0_8px_rgba(0,0,0,.25)] min-w-[220px]"
                            >
                                Especificación
                            </th>
                            {prodsVisibles.map(p => (
                                <th
                                    key={p.id}
                                    colSpan={2}
                                    className="px-3 py-2.5 text-center text-xs font-semibold border-l border-slate-700"
                                >
                                    <span className="block truncate max-w-[200px]" title={prodLabel(p)}>
                                        {prodLabel(p)}
                                    </span>
                                </th>
                            ))}
                        </tr>
                        <tr className="bg-slate-700 text-white">
                            {prodsVisibles.map(p => (
                                <React.Fragment key={p.id}>
                                    <th className="px-3 py-1.5 text-right text-xs font-semibold text-emerald-300 border-l border-slate-600 w-[65px] min-w-[65px]">
                                        Debe
                                    </th>
                                    <th className="px-3 py-1.5 text-right text-xs font-semibold text-red-300 w-[65px] min-w-[65px]">
                                        Haber
                                    </th>
                                </React.Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Saldo inicial */}
                        <tr className="bg-amber-50 font-semibold border-b border-amber-200">
                            <td className="px-2 py-2 text-center text-slate-400 text-xs sticky left-0 bg-amber-50 border-r border-amber-200 w-[40px]">—</td>
                            <td className="px-2 py-2 text-center text-slate-400 text-xs sticky left-[40px] bg-amber-50 border-r border-amber-200 w-[40px]">—</td>
                            <td className="px-3 py-2 sticky left-[80px] bg-amber-50 border-r border-amber-200 shadow-[3px_0_6px_rgba(0,0,0,.08)] text-sm font-semibold text-amber-900">
                                Saldo Inicial
                            </td>
                            {prodsVisibles.map(p => (
                                <React.Fragment key={p.id}>
                                    <td className="px-3 py-2 text-right font-mono text-emerald-700 tabular-nums border-l border-amber-200 text-sm">
                                        {p.saldoIni > 0 ? fmt(p.saldoIni) : '—'}
                                    </td>
                                    <td className="px-3 py-2" />
                                </React.Fragment>
                            ))}
                        </tr>

                        {movsFiltrados.map((m, idx) => {
                            const [, mes, dia] = m.fecha.split('-')
                            const bgRow = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                            return (
                                <tr
                                    key={m.id}
                                    className={cn("border-b border-slate-100 hover:bg-blue-50/40 transition-colors group", bgRow)}
                                >
                                    <td className={cn("px-2 py-1.5 text-center text-xs text-slate-500 tabular-nums sticky left-0 border-r border-slate-200 w-[40px] group-hover:bg-blue-50/40", bgRow)}>
                                        {mes}
                                    </td>
                                    <td className={cn("px-2 py-1.5 text-center text-xs text-slate-500 tabular-nums sticky left-[40px] border-r border-slate-200 w-[40px] group-hover:bg-blue-50/40", bgRow)}>
                                        {dia}
                                    </td>
                                    <td className={cn("px-3 py-1.5 sticky left-[80px] border-r border-slate-300 shadow-[3px_0_6px_rgba(0,0,0,.06)] group-hover:bg-blue-50/40", bgRow)}>
                                        <span className="font-mono text-xs font-semibold text-blue-900 whitespace-nowrap">
                                            <DocumentoPdfLink numeroComprobante={m.serie && m.corr ? `${m.serie}-${m.corr}` : null} />
                                        </span>
                                        <span className="block text-[11px] text-slate-400 truncate max-w-[190px]" title={m.estab}>{m.estab}</span>
                                    </td>
                                    {prodsVisibles.map(p => (
                                        <React.Fragment key={p.id}>
                                            <td className="px-3 py-1.5 text-right font-mono font-semibold text-emerald-700 tabular-nums border-l border-slate-100 text-xs">
                                                {p.id === m.prodId && m.tipo === 'INGRESO' ? fmt(m.cant) : ''}
                                            </td>
                                            <td className="px-3 py-1.5 text-right font-mono font-semibold text-red-700 tabular-nums text-xs">
                                                {p.id === m.prodId && m.tipo === 'EGRESO' ? fmt(m.cant) : ''}
                                            </td>
                                        </React.Fragment>
                                    ))}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
