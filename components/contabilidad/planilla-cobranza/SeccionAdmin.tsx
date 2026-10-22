'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    ChevronDown, RefreshCw, Search, Loader2, MapPin, Paperclip,
    ClipboardList, Banknote, CheckCircle2, AlertTriangle,
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
import {EmpresaOption, TipoAmortizacion} from "@/app/types/amortizacion-types";
import { VouchersModal, Voucher } from './VouchersModal'
import {publicApi} from "@/app/api/client";

interface Props {
    tiposComprobante:     TipoComprobante[]
    bancos:               CatalogosBanco[]
    tiposAmort:           TipoAmortizacion[]
    empresas:             EmpresaOption[]
    planillasAdmin:       PlanillaCabecera[]
    resumenDia:           ResumenDia | null
    loadingAdmin:         boolean
    adminInfo:            AdminInfo
    onFetchAdmin:         (params?: any) => void
    onFetchResumen:       (fecha?: string) => void
    onFetchDetalle:       (id: number) => Promise<{ planilla: any; detalle: PlanillaDetalle[] } | null>
    onValidar:            (id: number, admin: AdminInfo, accion: 'validado' | 'rechazado', obs?: string) => Promise<any>
}

export default function SeccionAdmin({
                                         tiposComprobante, bancos,
                                         planillasAdmin, resumenDia, loadingAdmin,
                                         adminInfo,
                                         onFetchAdmin, onFetchResumen, onFetchDetalle, onValidar,
                                         tiposAmort, empresas
                                     }: Props) {

    const [busqueda,     setBusqueda]     = useState('')
    const [filtroEstado, setFiltroEstado] = useState('all')
    const [fechaDesde,   setFechaDesde]   = useState('')
    const [fechaHasta,   setFechaHasta]   = useState('')

    const [openRows,     setOpenRows]     = useState<Set<number>>(new Set())
    const [detalleCache, setDetalleCache] = useState<Record<number, PlanillaDetalle[]>>({})
    const [loadingDet,   setLoadingDet]   = useState<number | null>(null)
    const [procesando,   setProcesando]   = useState<number | null>(null)

    const [vouchersModal, setVouchersModal] = useState<{ open: boolean; planilla: any }>({ open: false, planilla: null })

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

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'Planillas hoy',   value: resumenDia?.total_planillas ?? '—', sub: 'recibidas en el día',
                      icono: ClipboardList, color: 'text-foreground', iconoCls: 'bg-blue-50 text-blue-600 dark:bg-blue-950' },
                    { label: 'Total cobrado',   value: fmtMoney(resumenDia?.total_cobrado), sub: 'en las planillas de hoy',
                      icono: Banknote, color: 'text-emerald-700 dark:text-emerald-400', iconoCls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950', mono: true },
                    { label: 'Validadas',       value: resumenDia?.validadas ?? '—', sub: 'listas para contabilidad',
                      icono: CheckCircle2, color: 'text-foreground', iconoCls: 'bg-green-50 text-green-600 dark:bg-green-950' },
                    { label: 'Con observación', value: resumenDia?.rechazadas ?? '—', sub: 'devueltas al vendedor',
                      icono: AlertTriangle, color: 'text-red-700 dark:text-red-400', iconoCls: 'bg-red-50 text-red-600 dark:bg-red-950' },
                ].map(c => (
                    <div key={c.label} className="rounded-xl border bg-background p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">{c.label}</p>
                            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.iconoCls}`}>
                                <c.icono className="h-4 w-4" />
                            </span>
                        </div>
                        <p className={`text-xl sm:text-2xl font-bold mt-1 ${c.mono ? 'font-mono' : ''} ${c.color}`}>{c.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>
                    </div>
                ))}
            </div>

            <Card className="border-t-[3px] border-t-blue-600 bg-gradient-to-b from-background to-muted/30 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                        <div className="relative min-w-0 flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Vendedor, zona, N° planilla..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                                className="h-10 pl-9 bg-background"
                                onKeyDown={e => e.key === 'Enter' && handleBuscar()}
                            />
                        </div>
                        <div className="flex flex-wrap rounded-lg border bg-muted p-0.5 xl:h-10 xl:flex-nowrap" role="group" aria-label="Estado">
                            {[
                                ['all', 'Todos'], ['borrador', 'Borrador'], ['enviado', 'Enviada'],
                                ['validado', 'Validada'], ['rechazado', 'Observada'],
                            ].map(([valor, texto]) => (
                                <button
                                    key={valor}
                                    type="button"
                                    onClick={() => setFiltroEstado(valor)}
                                    aria-pressed={filtroEstado === valor}
                                    className={`rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${
                                        filtroEstado === valor
                                            ? 'bg-background font-semibold text-blue-700 shadow-sm dark:text-blue-400'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {texto}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 xl:flex">
                            <Input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                                   className="h-10 w-full min-w-0 bg-background xl:w-40" title="Desde" />
                            <Input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                                   className="h-10 w-full min-w-0 bg-background xl:w-40" title="Hasta" />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleBuscar}
                                disabled={loadingAdmin}
                                className="h-10 flex-1 gap-1.5 bg-blue-600 font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 xl:flex-none"
                            >
                                {loadingAdmin
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <Search className="h-4 w-4" />}
                                Buscar
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => { onFetchAdmin(); onFetchResumen() }}
                                className="h-10 gap-1.5"
                                title="Actualizar"
                            >
                                <RefreshCw className="h-4 w-4" />
                                <span className="xl:hidden">Actualizar</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <p className="-mb-1 px-0.5 text-xs text-muted-foreground">
                {planillasAdmin.length} planilla{planillasAdmin.length !== 1 ? 's' : ''} encontrada{planillasAdmin.length !== 1 ? 's' : ''}
            </p>

            {loadingAdmin ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
            ) : planillasAdmin.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <div className="text-3xl mb-3 opacity-40">📋</div>
                        <p className="text-muted-foreground">No se encontraron planillas.</p>
                    </CardContent>
                </Card>
            ) : planillasAdmin.map(planilla => {
                const isOpen    = openRows.has(planilla.id_planilla)
                const isLoading = loadingDet === planilla.id_planilla
                const dets      = detalleCache[planilla.id_planilla] ?? []
                const planillaVouchers: Voucher[] = (planilla as any).vouchers ?? []

                return (
                    <Card key={planilla.id_planilla} className={`shadow-sm overflow-hidden border-l-4 ${colorBorde(planilla.estado)}`}>
                        <div
                            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => toggleRow(planilla)}
                        >
                            <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${avatarCls(planilla.estado)}`}>
                                    {getInitials(planilla.nombre_vendedor)}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-[15px] font-extrabold font-mono text-card-foreground">
                                            {planilla.numero_planilla}
                                        </p>
                                        <EstadoPill estado={planilla.estado} />
                                    </div>
                                    <p className="text-xs font-semibold text-foreground/80 truncate">
                                        {planilla.nombre_vendedor}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                                        <MapPin className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{planilla.zona || '—'}</span>
                                        <span className="shrink-0">· {fmtFecha(planilla.fecha_ruta)}</span>
                                        {planilla.fecha_envio && (
                                            <span className="hidden shrink-0 sm:inline">· enviada {fmtRel(planilla.fecha_envio)}</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-5">
                                <div className="hidden md:block text-right">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Registros</p>
                                    <p className="text-sm font-bold">{planilla.total_registros ?? dets.length}</p>
                                </div>
                                {planilla.total_documentos != null && (
                                    <div className="hidden lg:block text-right">
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Documentos</p>
                                        <p className="font-mono text-sm font-bold text-blue-700 dark:text-blue-400">{fmtMoney(planilla.total_documentos)}</p>
                                    </div>
                                )}
                                <div className="text-right">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cobrado</p>
                                    <p className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                        {fmtMoney(planilla.total_cobrado ?? dets.reduce((s, r) => s + Number(r.importe_cobrado), 0))}
                                    </p>
                                </div>

                                {planillaVouchers.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setVouchersModal({ open: true, planilla })
                                        }}
                                        className="gap-1.5 text-sky-700 border-sky-200 bg-sky-50 hover:bg-sky-100 h-8 px-2.5 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300"
                                        title="Ver vouchers"
                                    >
                                        <Paperclip className="h-3.5 w-3.5" />
                                        <span className="text-xs font-semibold">
                                            {planillaVouchers.length}<span className="hidden sm:inline"> voucher{planillaVouchers.length !== 1 ? 's' : ''}</span>
                                        </span>
                                    </Button>
                                )}

                                {isLoading
                                    ? <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
                                    : <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                }
                            </div>
                        </div>

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
                                tiposAmort={tiposAmort}
                                empresas={empresas}
                            />
                        )}
                    </Card>
                )
            })}

            <VouchersModal
                open={vouchersModal.open}
                onOpenChange={(v) => setVouchersModal(prev => ({ ...prev, open: v }))}
                numeroPlanilla={vouchersModal.planilla?.numero_planilla ?? ''}
                vouchers={(vouchersModal.planilla as any)?.vouchers ?? []}
                subtitulo={vouchersModal.planilla?.nombre_vendedor}
                baseUrl={publicApi ?? ''}
            />
        </div>
    )
}