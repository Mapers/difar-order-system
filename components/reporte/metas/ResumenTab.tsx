'use client'

import { Card, CardContent } from "@/components/ui/card"
import KpiCard from "@/components/reporte/metas/KpiCard"
import ProgressBar from "@/components/reporte/metas/ProgressBar"
import StatusChip from "@/components/reporte/metas/StatusChip"
import { IDashboardData, IVendedorDashboard } from "@/app/types/metas-types"
import { fmtMoney, getStatusColor, getInitials, getLabColor } from "@/app/utils/metas-helpers"
import { MedalIcon } from "lucide-react"

interface ResumenTabProps {
    data: IDashboardData;
    kpis: any;
    onVendedorClick?: (vendedor: IVendedorDashboard) => void;
    isVendedorView?: boolean;
}

export default function ResumenTab({ data, kpis, onVendedorClick, isVendedorView = false }: ResumenTabProps) {
    const labs  = data.laboratorios || [];
    const vends = data.vendedores   || [];

    const labsAlert = [...labs]
        .filter(l => Number(l.pct_avance_monto) < 80)
        .sort((a, b) => Number(a.pct_avance_monto) - Number(b.pct_avance_monto))
        .slice(0, 5);

    const top3 = [...vends]
        .sort((a, b) => Number(b.pct_avance_monto) - Number(a.pct_avance_monto))
        .slice(0, 3);

    const vendBajos = [...vends]
        .filter(v => Number(v.pct_avance_monto) < 80)
        .sort((a, b) => Number(a.pct_avance_monto) - Number(b.pct_avance_monto));

    const medalBg = [
        "bg-gradient-to-br from-yellow-100 to-amber-100",
        "bg-gradient-to-br from-slate-100 to-slate-200",
        "bg-gradient-to-br from-orange-50 to-orange-100",
    ];

    return (
        <div className="space-y-4">
            {/* KPIs globales */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <KpiCard
                    label="Avance Global S/"
                    value={`${kpis.avanceGlobal}%`}
                    subtitle={`${fmtMoney(kpis.totalVendido)} de ${fmtMoney(kpis.totalCuota)}`}
                    accentColor="#0284c7"
                    delta="Ciclo activo"
                    deltaType="success"
                />
                <KpiCard
                    label="Cobertura Clientes"
                    value={`${kpis.pctCobertura}%`}
                    subtitle={`${kpis.clientesAtendidos} de ${kpis.totalClientes} clientes`}
                    useSemaphore pct={kpis.pctCobertura}
                    delta={kpis.pctCobertura >= 80 ? "✓ Buena cobertura" : "⚠ Mejorar cobertura"}
                    deltaType={kpis.pctCobertura >= 80 ? "success" : "warning"}
                />
                <KpiCard
                    label="Cumplimiento Unidades"
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
                {/* Tarjeta de vendedores solo en vista admin */}
                {!isVendedorView && (
                    <KpiCard
                        label="Vendedores en Meta"
                        value={`${kpis.vendEnMeta} / ${kpis.totalVendedores}`}
                        subtitle={`${kpis.totalVendedores - kpis.vendEnMeta} por debajo del 80%`}
                        accentColor="#d97706"
                        delta={(kpis.totalVendedores - kpis.vendEnMeta) > 0 ? "⚠ Requiere acción" : "✓ Todos en meta"}
                        deltaType={(kpis.totalVendedores - kpis.vendEnMeta) > 0 ? "warning" : "success"}
                    />
                )}
            </div>

            {/* Barra de progreso global */}
            <Card className="shadow-sm">
                <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-slate-700">Progreso global del ciclo</span>
                        <span className="text-xs text-slate-400">
                            {fmtMoney(kpis.totalVendido)} vendido · {fmtMoney(kpis.totalCuota - kpis.totalVendido)} restante
                        </span>
                    </div>
                    <ProgressBar pct={kpis.avanceGlobal} height="h-2.5" showLabel />
                </CardContent>
            </Card>

            <div className={`grid gap-4 ${isVendedorView ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
                {/* Labs que requieren atención */}
                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <h3 className="text-sm font-semibold text-slate-700">Labs que requieren atención</h3>
                        </div>
                        {labsAlert.length === 0 ? (
                            <p className="text-center text-emerald-600 text-sm py-4">✓ Todos los labs están en meta</p>
                        ) : (
                            <div className="space-y-2.5">
                                {labsAlert.map((lab, i) => {
                                    const av = Number(lab.pct_avance_monto || 0);
                                    const [c1] = getStatusColor(av);
                                    const color = getLabColor(i);
                                    return (
                                        <div key={lab.id_meta_lab} className="flex flex-col gap-1.5 p-2.5 bg-slate-50 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                                                         style={{ background: `${color}18`, color }}>
                                                        {getInitials(lab.nombre_lab || String(lab.id_linea_ge))}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800">{lab.nombre_lab || `Lab ${lab.id_linea_ge}`}</p>
                                                        <p className="text-[10px] text-slate-400">Falta {fmtMoney(Number(lab.monto_pendiente || 0))}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold" style={{ color: c1 }}>{av}%</span>
                                                    <StatusChip pct={av} />
                                                </div>
                                            </div>
                                            <ProgressBar pct={av} height="h-1.5" />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Secciones de vendedores: solo en vista admin */}
                {!isVendedorView && (
                    <div className="space-y-4">
                        {/* Top 3 vendedores */}
                        <Card className="shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    <h3 className="text-sm font-semibold text-slate-700">Top 3 Vendedores del Ciclo</h3>
                                </div>
                                <div className="space-y-2.5">
                                    {top3.map((v, i) => {
                                        const av = Number(v.pct_avance_monto || 0);
                                        const [c1] = getStatusColor(av);
                                        return (
                                            <div key={v.id_meta_lab_vend}
                                                 className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer hover:opacity-90 transition-opacity ${medalBg[i]}`}
                                                 onClick={() => onVendedorClick?.(v)}
                                            >
                                                <span className="text-xl shrink-0"><MedalIcon className="h-4 w-4" /></span>
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                                                     style={{ background: `${getLabColor(i)}22`, color: getLabColor(i) }}>
                                                    {getInitials(v.nombre_vendedor || v.cod_vendedor)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-bold text-slate-800 truncate">{v.nombre_vendedor || v.cod_vendedor}</span>
                                                        <span className="text-sm font-bold shrink-0" style={{ color: c1 }}>{av}%</span>
                                                    </div>
                                                    <div className="flex justify-between mt-0.5">
                                                        <span className="text-[10px] text-slate-400">{fmtMoney(Number(v.venta_real))}</span>
                                                        <span className="text-[10px] text-slate-400">Meta {fmtMoney(Number(v.meta_monto))}</span>
                                                    </div>
                                                    <ProgressBar pct={av} height="h-1" className="mt-1" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    <h3 className="text-sm font-semibold text-slate-700">Vendedores bajo meta</h3>
                                </div>
                                {vendBajos.length === 0 ? (
                                    <p className="text-center text-emerald-600 text-sm py-3">✓ Todos en meta</p>
                                ) : (
                                    <div className="space-y-2">
                                        {vendBajos.map((v, i) => {
                                            const av = Number(v.pct_avance_monto || 0);
                                            const [c1] = getStatusColor(av);
                                            const falta = Number(v.monto_pendiente || 0);
                                            return (
                                                <div key={v.id_meta_lab_vend}
                                                     className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                                                     onClick={() => onVendedorClick?.(v)}
                                                >
                                                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                                                         style={{ background: `${getLabColor(i)}18`, color: getLabColor(i) }}>
                                                        {getInitials(v.nombre_vendedor || v.cod_vendedor)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between">
                                                            <span className="text-xs font-semibold truncate">{v.nombre_vendedor || v.cod_vendedor}</span>
                                                            <span className="text-xs font-bold shrink-0" style={{ color: c1 }}>{av}%</span>
                                                        </div>
                                                        <ProgressBar pct={av} height="h-1" className="mt-1" />
                                                        <div className="flex justify-between mt-0.5">
                                                            <span className="text-[10px] text-slate-400">Cod: {v.cod_vendedor}</span>
                                                            <span className="text-[10px] font-medium" style={{ color: c1 }}>Falta {fmtMoney(falta)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}