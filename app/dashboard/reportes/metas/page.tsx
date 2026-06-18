'use client'

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { BarChart3, RefreshCw, Search } from "lucide-react"

import VendedorResumenModal from "@/components/reporte/metas/VendedorResumenModal"

import { IVendedorResumenDashboard } from "@/app/types/metas-types"
import { useMetasDashboard } from "@/app/hooks/useMetasDashboard"
import { MONTH_NAMES } from "@/app/utils/metas-helpers"
import { fmtMoney, getStatusColor, getInitials, getLabColor } from "@/app/utils/metas-helpers"
import StatusChip from "@/components/reporte/metas/StatusChip"
import ProgressBar from "@/components/reporte/metas/ProgressBar"

export default function MetasDashboardPage() {
    const [selectedVendedor, setSelectedVendedor] = useState<IVendedorResumenDashboard | null>(null)
    const [vendModalOpen, setVendModalOpen] = useState(false)
    const [search, setSearch] = useState("")

    const {
        ciclos,
        selectedCiclo,
        setSelectedCiclo,
        vendedores,
        loading,
        loadingDashboard,
        refreshDashboard,
    } = useMetasDashboard()

    const handleVendedorClick = (v: IVendedorResumenDashboard) => {
        setSelectedVendedor(v)
        setVendModalOpen(true)
    }

    const cicloLabel = selectedCiclo
        ? `${MONTH_NAMES[selectedCiclo.mes]} ${selectedCiclo.anio}`
        : "Sin ciclo"

    const filtered = vendedores.filter(v =>
        !search || (v.nombre_vendedor || v.cod_vendedor).toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => Number(b.pct_avance_global) - Number(a.pct_avance_global))

    if (loading) {
        return (
            <div className="grid gap-6 p-4 md:p-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
                </div>
            </div>
        )
    }

    return (
        <div className="grid gap-4">
            {/* Cabecera */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                    Metas por Vendedor
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                    <Select
                        value={selectedCiclo ? String(selectedCiclo.id_ciclo) : ""}
                        onValueChange={(val) => {
                            const ciclo = ciclos.find(c => String(c.id_ciclo) === val)
                            if (ciclo) setSelectedCiclo(ciclo)
                        }}
                    >
                        <SelectTrigger className="w-[200px] h-9 text-sm bg-white">
                            <SelectValue placeholder="Seleccionar ciclo" />
                        </SelectTrigger>
                        <SelectContent>
                            {ciclos.map(c => (
                                <SelectItem key={c.id_ciclo} value={String(c.id_ciclo)}>
                                    {MONTH_NAMES[c.mes]} {c.anio} {c.estado === 'ABIERTO' ? '🟢' : '🔴'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Badge variant="outline" className="text-xs bg-slate-50">
                        {cicloLabel}
                    </Badge>

                    {selectedCiclo && (
                        <Badge
                            variant={selectedCiclo.estado === 'ABIERTO' ? "default" : "secondary"}
                            className="text-xs"
                        >
                            {selectedCiclo.estado}
                        </Badge>
                    )}

                    <Button variant="outline" size="sm" onClick={refreshDashboard} disabled={loadingDashboard}>
                        <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loadingDashboard ? "animate-spin" : ""}`} />
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* Contenido */}
            {loadingDashboard ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600 mb-4" />
                    <p className="text-slate-500 font-medium">Cargando datos del ciclo...</p>
                </div>
            ) : vendedores.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <BarChart3 className="h-12 w-12 text-slate-300 mb-4" />
                        <p className="text-slate-500">No hay datos disponibles para este ciclo</p>
                        <p className="text-xs text-slate-400 mt-1">Selecciona un ciclo con metas configuradas</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Buscador */}
                    <Card className="shadow-sm">
                        <CardContent className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Buscar vendedor..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="pl-10 bg-slate-50"
                                />
                            </div>
                            <p className="text-[11px] text-slate-400 mt-2">{filtered.length} de {vendedores.length} vendedores</p>
                        </CardContent>
                    </Card>

                    {/* Tabla desktop */}
                    <Card className="shadow-sm overflow-hidden hidden lg:block">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs min-w-[560px]">
                                    <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Vendedor</th>
                                        <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Venta S/</th>
                                        <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Cuota S/</th>
                                        <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Labs</th>
                                        <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">%</th>
                                        <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold min-w-[130px]">Avance</th>
                                        <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Estado</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filtered.map((v, i) => {
                                        const pct = Number(v.pct_avance_global || 0);
                                        const [c1] = getStatusColor(pct);
                                        const color = getLabColor(i);
                                        return (
                                            <tr
                                                key={v.cod_vendedor}
                                                className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                                                onClick={() => handleVendedorClick(v)}
                                            >
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                                                             style={{ background: `${color}22`, color }}>
                                                            {getInitials(v.nombre_vendedor || v.cod_vendedor)}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-800">{v.nombre_vendedor || v.cod_vendedor}</p>
                                                            <p className="text-[10px] text-sky-600">Ver detalle por lab →</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 font-semibold">{fmtMoney(Number(v.venta_total))}</td>
                                                <td className="px-3 py-2.5 text-slate-400">{fmtMoney(Number(v.cuota_total))}</td>
                                                <td className="px-3 py-2.5">
                                                    <div className="flex gap-1 text-[10px]">
                                                        <span className="text-emerald-600 font-semibold">{v.labs_en_meta}✓</span>
                                                        <span className="text-amber-500">{v.labs_riesgo}⚠</span>
                                                        <span className="text-red-500">{v.labs_bajo}✗</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 font-bold" style={{ color: c1 }}>{pct}%</td>
                                                <td className="px-3 py-2.5">
                                                    <ProgressBar pct={pct} height="h-1.5" />
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <StatusChip pct={pct} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cards mobile */}
                    <div className="lg:hidden space-y-3">
                        {filtered.map((v, i) => {
                            const pct = Number(v.pct_avance_global || 0);
                            const [c1] = getStatusColor(pct);
                            const color = getLabColor(i);
                            return (
                                <Card
                                    key={v.cod_vendedor}
                                    className="shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
                                    onClick={() => handleVendedorClick(v)}
                                    style={{ borderLeft: `4px solid ${color}` }}
                                >
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                                                     style={{ background: `${color}22`, color }}>
                                                    {getInitials(v.nombre_vendedor || v.cod_vendedor)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 truncate">{v.nombre_vendedor || v.cod_vendedor}</p>
                                                    <p className="text-[10px] text-slate-400">Cod: {v.cod_vendedor}</p>
                                                </div>
                                            </div>
                                            <StatusChip pct={pct} />
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] text-slate-500">Avance global</span>
                                                <span className="text-sm font-bold" style={{ color: c1 }}>{pct}%</span>
                                            </div>
                                            <ProgressBar pct={pct} height="h-2" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Venta</p>
                                                <p className="text-sm font-bold text-slate-800">{fmtMoney(Number(v.venta_total))}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Cuota</p>
                                                <p className="text-sm font-semibold text-slate-500">{fmtMoney(Number(v.cuota_total))}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 text-[11px]">
                                            <span className="text-emerald-600 font-semibold">{v.labs_en_meta} en meta</span>
                                            <span className="text-amber-500">{v.labs_riesgo} riesgo</span>
                                            <span className="text-red-500">{v.labs_bajo} bajo</span>
                                        </div>

                                        <p className="text-[10px] text-sky-500 font-medium">Ver detalle por lab →</p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </>
            )}

            <VendedorResumenModal
                open={vendModalOpen}
                onClose={() => setVendModalOpen(false)}
                vendedor={selectedVendedor}
                idCiclo={selectedCiclo?.id_ciclo ?? 0}
            />
        </div>
    )
}
