'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    ChevronDown, ChevronRight,
    RefreshCw, Search, Loader2, MapPin,
} from 'lucide-react'
import DetalleAdmin from './DetalleAdmin'
import EstadoPill from './EstadoPill'
import {
    AdminInfo,
    CatalogosBanco,
    PlanillaCabecera,
    PlanillaDetalle, ResumenDia,
    TipoComprobante,
} from "@/app/types/planilla-types";
import {fmtFecha, fmtMoney, fmtRel, getInitials} from "@/lib/planilla.helper";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    tiposComprobante:     TipoComprobante[]
    bancos:               CatalogosBanco[]
    planillasAdmin:       PlanillaCabecera[]
    resumenDia:           ResumenDia | null
    loadingAdmin:         boolean
    adminInfo:            AdminInfo
    onFetchAdmin:         (params?: any) => void
    onFetchResumen:       (fecha?: string) => void
    onFetchDetalle:       (id: number) => Promise<{ planilla: any; detalle: PlanillaDetalle[] } | null>
    onValidar:            (id: number, admin: AdminInfo, accion: 'validado' | 'rechazado', obs?: string) => Promise<any>
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function SeccionAdmin({
                                         tiposComprobante, bancos,
                                         planillasAdmin, resumenDia, loadingAdmin,
                                         adminInfo,
                                         onFetchAdmin, onFetchResumen, onFetchDetalle, onValidar,
                                     }: Props) {

    const [busqueda,     setBusqueda]     = useState('')
    const [filtroEstado, setFiltroEstado] = useState('all')
    const [fechaDesde,   setFechaDesde]   = useState('')
    const [fechaHasta,   setFechaHasta]   = useState('')

    const [openRows,     setOpenRows]     = useState<Set<number>>(new Set())
    const [detalleCache, setDetalleCache] = useState<Record<number, PlanillaDetalle[]>>({})
    const [loadingDet,   setLoadingDet]   = useState<number | null>(null)
    const [procesando,   setProcesando]   = useState<number | null>(null)

    useEffect(() => {
        onFetchAdmin()
        onFetchResumen()
    }, [])

    const handleBuscar = () => {
        onFetchAdmin({
            estado:      filtroEstado !== 'all' ? filtroEstado : undefined,
            fecha_desde: fechaDesde || undefined,
            fecha_hasta: fechaHasta || undefined,
            busqueda:    busqueda   || undefined,
        })
    }

    const toggleRow = async (planilla: PlanillaCabecera) => {
        const id      = planilla.id_planilla
        const wasOpen = openRows.has(id)
        setOpenRows(prev => { const n = new Set(prev); wasOpen ? n.delete(id) : n.add(id); return n })
        if (!wasOpen && !detalleCache[id]) {
            setLoadingDet(id)
            const res = await onFetchDetalle(id)
            if (res?.detalle) setDetalleCache(prev => ({ ...prev, [id]: res.detalle }))
            setLoadingDet(null)
        }
    }

    const handleValidar = async (id: number) => {
        setProcesando(id)
        await onValidar(id, adminInfo, 'validado')
        setProcesando(null)
    }

    const handleRechazar = async (id: number, obs: string) => {
        setProcesando(id)
        await onValidar(id, adminInfo, 'rechazado', obs)
        setProcesando(null)
    }

    const colorBorde = (estado: string) =>
        estado === 'validado'  ? 'border-l-emerald-500' :
            estado === 'rechazado' ? 'border-l-red-500'     :
                estado === 'enviado'   ? 'border-l-sky-500'     : 'border-l-slate-300'

    const avatarCls = (estado: string) =>
        estado === 'validado'  ? 'bg-emerald-50 text-emerald-700' :
            estado === 'rechazado' ? 'bg-amber-50 text-amber-600'     : 'bg-sky-50 text-sky-700'

    return (
        <div className="space-y-4">

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'Planillas hoy',   value: resumenDia?.total_planillas ?? '—', color: 'text-sky-700',     bg: 'bg-sky-50 border-sky-200' },
                    { label: 'Total cobrado',   value: fmtMoney(resumenDia?.total_cobrado), color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
                    { label: 'Validadas',       value: resumenDia?.validadas ?? '—',        color: 'text-slate-700',   bg: 'bg-slate-50 border-slate-200' },
                    { label: 'Con observación', value: resumenDia?.rechazadas ?? '—',       color: 'text-red-700',     bg: 'bg-red-50 border-red-200' },
                ].map(c => (
                    <Card key={c.label} className={`shadow-sm border ${c.bg}`}>
                        <CardContent className="p-4">
                            <p className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">{c.label}</p>
                            <p className={`font-mono text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filtros */}
            <Card className="shadow-sm">
                <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="relative lg:col-span-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Vendedor, zona, N° planilla..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                                className="pl-9 bg-slate-50"
                                onKeyDown={e => e.key === 'Enter' && handleBuscar()}
                            />
                        </div>
                        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                            <SelectTrigger className="bg-slate-50"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los estados</SelectItem>
                                <SelectItem value="enviado">Enviado — pendiente</SelectItem>
                                <SelectItem value="validado">Validado</SelectItem>
                                <SelectItem value="rechazado">Con observación</SelectItem>
                                <SelectItem value="borrador">Borrador</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="bg-slate-50" />
                        <Input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="bg-slate-50" />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-slate-400">
                            {planillasAdmin.length} planilla{planillasAdmin.length !== 1 ? 's' : ''} encontrada{planillasAdmin.length !== 1 ? 's' : ''}
                        </p>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleBuscar} disabled={loadingAdmin} className="bg-sky-600 hover:bg-sky-700 gap-1.5">
                                {loadingAdmin ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                                Buscar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { onFetchAdmin(); onFetchResumen() }} className="gap-1.5">
                                <RefreshCw className="h-3.5 w-3.5" /> Actualizar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Lista de planillas */}
            {loadingAdmin ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
            ) : planillasAdmin.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <div className="text-3xl mb-3 opacity-40">📋</div>
                        <p className="text-slate-400">No se encontraron planillas.</p>
                    </CardContent>
                </Card>
            ) : planillasAdmin.map(planilla => {
                const isOpen    = openRows.has(planilla.id_planilla)
                const isLoading = loadingDet === planilla.id_planilla
                const dets      = detalleCache[planilla.id_planilla] ?? []

                return (
                    <Card key={planilla.id_planilla} className={`shadow-sm overflow-hidden border-l-4 ${colorBorde(planilla.estado)}`}>
                        {/* Cabecera */}
                        <div
                            className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => toggleRow(planilla)}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${avatarCls(planilla.estado)}`}>
                                    {getInitials(planilla.nombre_vendedor)}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-bold font-mono text-slate-800">
                                            {planilla.numero_planilla}
                                        </p>
                                        <EstadoPill estado={planilla.estado} />
                                    </div>
                                    <p className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                                        {planilla.nombre_vendedor} · <MapPin className="h-3 w-3" />{planilla.zona} · {fmtRel(planilla.fecha_envio)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                    <p className="font-mono font-semibold text-slate-800">
                                        {fmtMoney(planilla.total_cobrado ?? dets.reduce((s, r) => s + Number(r.importe_cobrado), 0))}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                        {planilla.total_registros ?? dets.length} reg.
                                    </p>
                                </div>
                                {isLoading
                                    ? <Loader2 className="h-4 w-4 text-slate-400 animate-spin shrink-0" />
                                    : isOpen
                                        ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                                        : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                                }
                            </div>
                        </div>

                        {/* Detalle expandible */}
                        {isOpen && (
                            <DetalleAdmin
                                planilla={planilla}
                                detalle={dets}
                                loadingDet={isLoading}
                                tiposComprobante={tiposComprobante}
                                bancos={bancos}
                                adminInfo={adminInfo}
                                procesando={procesando === planilla.id_planilla}
                                onValidar={handleValidar}
                                onRechazar={handleRechazar}
                            />
                        )}
                    </Card>
                )
            })}
        </div>
    )
}