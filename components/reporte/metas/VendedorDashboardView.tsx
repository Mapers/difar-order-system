'use client'

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import KpiCard from "@/components/reporte/metas/KpiCard"
import ProgressBar from "@/components/reporte/metas/ProgressBar"
import StatusChip from "@/components/reporte/metas/StatusChip"
import MiniDonut from "@/components/reporte/metas/MiniDonut"
import MiniGauge from "@/components/reporte/metas/MiniGauge"
import ItemDetailModal, { ItemWithComputed, ItemModalType } from "@/components/reporte/metas/ItemDetailModal"
import { IDashboardData, IItemDashboard, ILabDashboard } from "@/app/types/metas-types"
import { fmtMoney, getStatusColor, getInitials, getLabColor } from "@/app/utils/metas-helpers"
import { ChevronDown, ChevronRight, Package } from "lucide-react"

interface VendedorDashboardViewProps {
    data: IDashboardData
    kpis: any
}

function DonutChart({ pct, color, size = 48 }: { pct: number; color: string; size?: number }) {
    const r    = (size - 8) / 2
    const circ = 2 * Math.PI * r
    const fill = Math.min(pct, 100) / 100 * circ
    const cx   = size / 2
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
             style={{ transform: "rotate(-90deg)" }}>
            <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
            <circle cx={cx} cy={cx} r={r} fill="none"
                    stroke={color} strokeWidth="6"
                    strokeDasharray={`${fill} ${circ - fill}`}
                    strokeLinecap="round"
            />
        </svg>
    )
}

function LabBarChart({ items, totalVenta }: {
    items: (IItemDashboard & { avPct: number; uPct: number })[]
    totalVenta: number
}) {
    const top      = [...items].sort((a, b) => Number(b.venta_real) - Number(a.venta_real)).slice(0, 6)
    const maxVenta = Math.max(...top.map(i => Number(i.venta_real)), 1)

    return (
        <div className="space-y-2">
            {top.map((item, i) => {
                const barPct  = Math.round(Number(item.venta_real) / maxVenta * 100)
                const contrib = totalVenta > 0 ? Math.round(Number(item.venta_real) / totalVenta * 100) : 0
                const [c1]    = getStatusColor(item.avPct)
                const color   = getLabColor(i)
                return (
                    <div key={item.id_meta_item} className="flex items-center gap-2">
                        <p className="text-[10px] text-slate-600 w-28 truncate shrink-0">
                            {item.nombre_articulo || item.cod_articulo}
                        </p>
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="h-2 rounded-full" style={{ width: `${barPct}%`, background: color }} />
                        </div>
                        <span className="text-[10px] font-semibold shrink-0 w-20 text-right" style={{ color: c1 }}>
                            {fmtMoney(Number(item.venta_real))}
                        </span>
                        <span className="text-[9px] text-slate-400 shrink-0 w-8 text-right">{contrib}%</span>
                    </div>
                )
            })}
        </div>
    )
}

function LabCard({
                     lab, labItems, colorIdx, defaultOpen = false,
                     onOpenModal,
                 }: {
    lab: ILabDashboard
    labItems: (IItemDashboard & { avPct: number; uPct: number })[]
    colorIdx: number
    defaultOpen?: boolean
    onOpenModal: (item: ItemWithComputed, type: ItemModalType, color: string) => void
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    const av    = Number(lab.pct_avance_monto || 0)
    const [c1]  = getStatusColor(av)
    const color = getLabColor(colorIdx)

    const totalVenta   = labItems.reduce((s, i) => s + Number(i.venta_real), 0)
    const totalMeta    = labItems.reduce((s, i) => s + Number(i.meta_monto), 0)
    const totalUndVend = labItems.reduce((s, i) => s + Number(i.u_vendidas), 0)
    const totalUndMeta = labItems.reduce((s, i) => s + Number(i.meta_cantidad), 0)
    const itemsEnMeta  = labItems.filter(i => i.avPct >= 80).length

    const enrichedLabItems = labItems.map(item => ({
        ...item,
        contrib: totalVenta > 0
            ? Math.round(Number(item.venta_real) / totalVenta * 100)
            : 0,
    }))

    const sortedItems = [...enrichedLabItems].sort((a, b) => Number(b.venta_real) - Number(a.venta_real))

    return (
        <Card className="shadow-sm overflow-hidden" style={{ borderLeft: `4px solid ${color}` }}>
            <button className="w-full text-left" onClick={() => setIsOpen(o => !o)}>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                                 style={{ background: `${color}22`, color }}>
                                {getInitials(lab.nombre_lab || String(lab.id_linea_ge))}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold truncate" style={{ color }}>
                                    {lab.nombre_lab || `Lab ${lab.id_linea_ge}`}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    {labItems.length} ítem{labItems.length !== 1 ? "s" : ""} ·{" "}
                                    {itemsEnMeta} en meta · {fmtMoney(Number(lab.venta_real))} vendido
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <div className="relative hidden sm:block" style={{ width: 48, height: 48 }}>
                                <DonutChart pct={av} color={c1} size={48} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[9px] font-bold" style={{ color: c1 }}>{av}%</span>
                                </div>
                            </div>
                            <StatusChip pct={av} />
                            {isOpen
                                ? <ChevronDown className="h-4 w-4 text-slate-400" />
                                : <ChevronRight className="h-4 w-4 text-slate-400" />
                            }
                        </div>
                    </div>

                    <ProgressBar pct={av} height="h-1.5" className="mt-3" />

                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
                        <div>
                            <p className="text-[9px] text-slate-400 uppercase tracking-wide">Venta</p>
                            <p className="text-xs font-bold text-slate-800">{fmtMoney(Number(lab.venta_real))}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-400 uppercase tracking-wide">Cuota</p>
                            <p className="text-xs font-semibold text-slate-500">{fmtMoney(Number(lab.meta_monto))}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-400 uppercase tracking-wide">Pendiente</p>
                            <p className="text-xs font-semibold" style={{ color: c1 }}>
                                {Number(lab.monto_pendiente) > 0
                                    ? fmtMoney(Number(lab.monto_pendiente))
                                    : "✓ Logrado"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </button>

            {isOpen && (
                <div className="border-t border-slate-100">
                    {labItems.length === 0 ? (
                        <div className="px-4 py-8 text-center text-slate-400 text-sm">
                            Sin ítems asignados en este laboratorio
                        </div>
                    ) : (
                        <>
                            <div className="px-4 pt-4 pb-3">
                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                    Venta por producto (top {Math.min(labItems.length, 6)})
                                </p>
                                <LabBarChart items={labItems} totalVenta={totalVenta} />
                            </div>

                            <div className="px-4 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                    { label: "Ítems totales", val: String(labItems.length) },
                                    { label: "Ítems en meta", val: `${itemsEnMeta} / ${labItems.length}` },
                                    { label: "Uds vendidas",  val: totalUndVend.toLocaleString() },
                                    { label: "Uds meta",      val: totalUndMeta.toLocaleString() },
                                ].map(k => (
                                    <div key={k.label} className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                                        <p className="text-[9px] text-slate-400 uppercase tracking-wide">{k.label}</p>
                                        <p className="text-sm font-bold text-slate-700 mt-0.5">{k.val}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="hidden lg:block">
                                <div className="grid grid-cols-[2fr_90px_90px_80px_70px_70px_70px] gap-2 px-4 py-2
                                                border-t border-b border-slate-100
                                                text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                                    <span>Ítem / Producto</span>
                                    <span className="text-right">Venta S/</span>
                                    <span className="text-right">Cuota S/</span>
                                    <span className="text-center">Unidades</span>
                                    <span className="text-center">Contrib.</span>
                                    <span className="text-center">Avance</span>
                                    <span className="text-center">Estado</span>
                                </div>

                                {sortedItems.map((item, idx) => {
                                    const [sc1] = getStatusColor(item.avPct)
                                    const [uc1] = getStatusColor(item.uPct)
                                    return (
                                        <div
                                            key={item.id_meta_item}
                                            className="grid grid-cols-[2fr_90px_90px_80px_70px_70px_70px] gap-2
                                                       px-4 py-2.5 border-b border-slate-50
                                                       hover:bg-slate-50 items-center transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold shrink-0"
                                                     style={{ background: `${color}15`, color }}>
                                                    {idx + 1}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium truncate text-slate-800">
                                                        {item.nombre_articulo || item.cod_articulo}
                                                    </p>
                                                    <p className="text-[9px] text-slate-400">
                                                        P.ref: {fmtMoney(Number(item.precio_ref_meta))}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-xs font-semibold">{fmtMoney(Number(item.venta_real))}</p>
                                                <ProgressBar pct={item.avPct} height="h-[3px]" className="mt-0.5" />
                                            </div>

                                            <div className="text-right text-xs text-slate-400">
                                                {fmtMoney(Number(item.meta_monto))}
                                            </div>

                                            <div
                                                className="flex flex-col items-center gap-0.5 cursor-pointer hover:opacity-70 transition-opacity"
                                                onClick={e => {
                                                    e.stopPropagation()
                                                    onOpenModal(item, 'unidades', color)
                                                }}
                                            >
                                                <MiniDonut pct={item.uPct} size={36} strokeWidth={4} />
                                                <p className="text-[9px] text-slate-400">
                                                    {Number(item.u_vendidas).toLocaleString()} / {Number(item.meta_cantidad).toLocaleString()}
                                                </p>
                                            </div>

                                            <div className="text-center">
                                                <p className="text-sm font-bold" style={{ color }}>{item.contrib}%</p>
                                                <p className="text-[9px] text-slate-400">del lab</p>
                                            </div>

                                            <div
                                                className="flex justify-center cursor-pointer hover:opacity-70 transition-opacity"
                                                onClick={e => {
                                                    e.stopPropagation()
                                                    onOpenModal(item, 'avance', color)
                                                }}
                                            >
                                                <MiniGauge pct={item.avPct} width={56} height={34} />
                                            </div>

                                            <div className="text-center">
                                                <StatusChip pct={item.avPct} />
                                            </div>
                                        </div>
                                    )
                                })}

                                <div className="grid grid-cols-[2fr_90px_90px_80px_70px_70px_70px] gap-2
                                                px-4 py-2.5 bg-slate-50 border-t border-slate-200 items-center">
                                    <span className="text-[11px] text-slate-500 font-semibold">
                                        TOTAL · {sortedItems.length} ítems
                                    </span>
                                    <span className="text-right text-xs font-bold" style={{ color: c1 }}>
                                        {fmtMoney(totalVenta)}
                                    </span>
                                    <span className="text-right text-xs text-slate-400">
                                        {fmtMoney(totalMeta)}
                                    </span>
                                    <span className="text-center text-[11px] text-slate-500 font-semibold">
                                        {av}% cumpl.
                                    </span>
                                    <span className="text-center text-xs font-bold text-slate-400">100%</span>
                                    <span className="text-center text-xs font-bold" style={{ color: c1 }}>{av}%</span>
                                    <span className="text-center"><StatusChip pct={av} /></span>
                                </div>
                            </div>

                            <div className="lg:hidden divide-y divide-slate-100 border-t border-slate-100">
                                {sortedItems.map((item, idx) => {
                                    const [sc1] = getStatusColor(item.avPct)
                                    const [uc1] = getStatusColor(item.uPct)
                                    return (
                                        <div key={item.id_meta_item} className="p-3 space-y-2 bg-white">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold shrink-0"
                                                         style={{ background: `${color}15`, color }}>
                                                        {idx + 1}
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-800 line-clamp-2">
                                                        {item.nombre_articulo || item.cod_articulo}
                                                    </span>
                                                </div>
                                                <StatusChip pct={item.avPct} />
                                            </div>

                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pl-7">
                                                <div>
                                                    <p className="text-[9px] text-slate-400 uppercase">Venta S/</p>
                                                    <p className="text-xs font-semibold text-slate-800">
                                                        {fmtMoney(Number(item.venta_real))}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-slate-400 uppercase">Cuota S/</p>
                                                    <p className="text-xs text-slate-500">
                                                        {fmtMoney(Number(item.meta_monto))}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-slate-400 uppercase">Contrib.</p>
                                                    <p className="text-xs font-bold" style={{ color }}>{item.contrib}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-slate-400 uppercase">Avance S/</p>
                                                    <p className="text-xs font-bold" style={{ color: sc1 }}>{item.avPct}%</p>
                                                </div>
                                            </div>

                                            <div className="pl-7 flex items-center gap-3">
                                                <button
                                                    className="flex items-center gap-1.5 text-[10px] text-sky-600 hover:text-sky-700"
                                                    onClick={e => {
                                                        e.stopPropagation()
                                                        onOpenModal(item, 'unidades', color)
                                                    }}
                                                >
                                                    <MiniDonut pct={item.uPct} size={28} strokeWidth={3} />
                                                    <span>
                                                        {Number(item.u_vendidas).toLocaleString()}/{Number(item.meta_cantidad).toLocaleString()} uds
                                                    </span>
                                                </button>
                                                <button
                                                    className="text-[10px] text-sky-600 hover:text-sky-700"
                                                    onClick={e => {
                                                        e.stopPropagation()
                                                        onOpenModal(item, 'avance', color)
                                                    }}
                                                >
                                                    Ver avance S/ →
                                                </button>
                                            </div>

                                            <div className="pl-7">
                                                <ProgressBar pct={item.avPct} height="h-1.5" />
                                            </div>
                                        </div>
                                    )
                                })}

                                <div className="p-3 bg-slate-50 border-t border-slate-200">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-[9px] text-slate-400 uppercase">Total venta</p>
                                            <p className="text-sm font-bold" style={{ color }}>
                                                {fmtMoney(Number(lab.venta_real))}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-slate-400 uppercase">Cuota total</p>
                                            <p className="text-sm text-slate-500">{fmtMoney(Number(lab.meta_monto))}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <ProgressBar pct={av} height="h-2" />
                                            <div className="flex justify-between mt-1">
                                                <span className="text-[10px] text-slate-400">
                                                    {sortedItems.length} ítems · 100% contrib.
                                                </span>
                                                <span className="text-[10px] font-bold" style={{ color }}>
                                                    {av}% avance
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </Card>
    )
}

export default function VendedorDashboardView({ data, kpis }: VendedorDashboardViewProps) {
    const labs  = data.laboratorios || []
    const vends = data.vendedores   || []
    const items = data.items        || []

    const [modalItem, setModalItem]       = useState<ItemWithComputed | null>(null)
    const [modalType, setModalType]       = useState<ItemModalType>('unidades')
    const [modalLabColor, setModalLabColor] = useState<string>("")

    const handleOpenModal = (item: ItemWithComputed, type: ItemModalType, color: string) => {
        setModalItem(item)
        setModalType(type)
        setModalLabColor(color)
    }

    const vendedor = vends[0] ?? null
    const cobPct   = vendedor && Number(vendedor.meta_clientes) > 0
        ? Math.round(Number(vendedor.clientes_atendidos) / Number(vendedor.meta_clientes) * 100)
        : kpis.pctCobertura

    const enrichedItems = useMemo(() =>
            items.map(i => ({
                ...i,
                avPct: Number(i.pct_avance_monto || 0),
                uPct:  Number(i.pct_cumplimiento_unidades || 0),
            })),
        [items]
    )

    const itemsByLab = useMemo(() => {
        const map: Record<number, typeof enrichedItems> = {}
        for (const item of enrichedItems) {
            const key = Number(item.id_meta_lab)
            if (!map[key]) map[key] = []
            map[key].push(item)
        }
        return map
    }, [enrichedItems])

    const labsAlert = [...labs]
        .filter(l => Number(l.pct_avance_monto) < 80)
        .sort((a, b) => Number(a.pct_avance_monto) - Number(b.pct_avance_monto))
        .slice(0, 5)

    const labsSorted = [...labs].sort(
        (a, b) => Number(b.pct_avance_monto) - Number(a.pct_avance_monto)
    )

    return (
        <div className="space-y-4">

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <KpiCard
                    label="Mi Avance S/"
                    value={`${kpis.avanceGlobal}%`}
                    subtitle={`${fmtMoney(kpis.totalVendido)} de ${fmtMoney(kpis.totalCuota)}`}
                    accentColor="#0284c7"
                    delta="Ciclo activo"
                    deltaType="success"
                />
                <KpiCard
                    label="Cobertura Clientes"
                    value={`${cobPct}%`}
                    subtitle={`${kpis.clientesAtendidos} de ${kpis.totalClientes} clientes`}
                    useSemaphore pct={cobPct}
                    delta={cobPct >= 80 ? "✓ Buena cobertura" : "⚠ Mejorar cobertura"}
                    deltaType={cobPct >= 80 ? "success" : "warning"}
                />
                <KpiCard
                    label="Unidades Vendidas"
                    value={`${kpis.pctUnidades}%`}
                    subtitle={`${kpis.totalUndVendidas.toLocaleString()} de ${kpis.totalMetaCantidad.toLocaleString()} uds`}
                    useSemaphore pct={kpis.pctUnidades}
                    delta={kpis.pctUnidades >= 80 ? "✓ En meta" : "⚠ Bajo meta"}
                    deltaType={kpis.pctUnidades >= 80 ? "success" : "warning"}
                />
                <KpiCard
                    label="Labs en Meta ≥80%"
                    value={kpis.labsEnMeta}
                    subtitle={`de ${kpis.totalLabs} laboratorios`}
                    accentColor="#059669"
                    delta={`↑ ${kpis.totalLabs > 0 ? Math.round(kpis.labsEnMeta / kpis.totalLabs * 100) : 0}% del portafolio`}
                    deltaType="success"
                />
                <KpiCard
                    label="Labs en Alerta <50%"
                    value={kpis.labsBajo}
                    subtitle={`${kpis.labsRiesgo} en riesgo (50–79%)`}
                    accentColor="#dc2626"
                    delta="⚠ Requieren atención"
                    deltaType="warning"
                />
                <KpiCard
                    label="Mis Productos"
                    value={String(items.length)}
                    subtitle={`${enrichedItems.filter(i => i.avPct >= 80).length} en meta`}
                    accentColor="#7c3aed"
                    delta={enrichedItems.filter(i => i.avPct < 80).length > 0
                        ? `${enrichedItems.filter(i => i.avPct < 80).length} bajo meta`
                        : "✓ Todos en meta"}
                    deltaType={enrichedItems.filter(i => i.avPct < 80).length > 0 ? "warning" : "success"}
                />
            </div>

            <Card className="shadow-sm">
                <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-slate-700">Mi progreso del ciclo</span>
                        <span className="text-xs text-slate-400">
                            {fmtMoney(kpis.totalVendido)} vendido · {fmtMoney(kpis.totalCuota - kpis.totalVendido)} restante
                        </span>
                    </div>
                    <ProgressBar pct={kpis.avanceGlobal} height="h-2.5" showLabel />
                </CardContent>
            </Card>

            {labsAlert.length > 0 && (
                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <h3 className="text-sm font-semibold text-slate-700">Labs que requieren atención</h3>
                        </div>
                        <div className="space-y-2.5">
                            {labsAlert.map((lab, i) => {
                                const av    = Number(lab.pct_avance_monto || 0)
                                const [c1]  = getStatusColor(av)
                                const color = getLabColor(i)
                                return (
                                    <div key={lab.id_meta_lab} className="flex flex-col gap-1.5 p-2.5 bg-slate-50 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                                                     style={{ background: `${color}18`, color }}>
                                                    {getInitials(lab.nombre_lab || String(lab.id_linea_ge))}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800">
                                                        {lab.nombre_lab || `Lab ${lab.id_linea_ge}`}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        Falta {fmtMoney(Number(lab.monto_pendiente || 0))}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold" style={{ color: c1 }}>{av}%</span>
                                                <StatusChip pct={av} />
                                            </div>
                                        </div>
                                        <ProgressBar pct={av} height="h-1.5" />
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-sky-600" />
                    <h2 className="text-sm font-bold text-slate-700">Mis Laboratorios y Productos</h2>
                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                        — haz clic en un laboratorio para ver el detalle de sus ítems
                    </span>
                </div>

                {labsSorted.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-slate-400 text-sm">
                            Sin laboratorios asignados en este ciclo
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {labsSorted.map((lab, i) => (
                            <LabCard
                                key={lab.id_meta_lab}
                                lab={lab}
                                labItems={itemsByLab[Number(lab.id_meta_lab)] || []}
                                colorIdx={i}
                                defaultOpen={i === 0}
                                onOpenModal={handleOpenModal}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ItemDetailModal
                item={modalItem}
                type={modalType}
                labColor={modalLabColor}
                open={!!modalItem}
                onClose={() => setModalItem(null)}
            />

        </div>
    )
}