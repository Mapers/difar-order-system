'use client'

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import KpiCard from "@/components/reporte/metas/KpiCard"
import ProgressBar from "@/components/reporte/metas/ProgressBar"
import StatusChip from "@/components/reporte/metas/StatusChip"
import { ILabDashboard } from "@/app/types/metas-types"
import { fmtMoney, getStatusColor, getInitials, getLabColor } from "@/app/utils/metas-helpers"
import { FilterStatus, SortMode } from "@/app/types/metas-types"

interface LaboratoriosTabProps {
    laboratorios: ILabDashboard[];
}

export default function LaboratoriosTab({ laboratorios }: LaboratoriosTabProps) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterStatus>("todos");
    const [sort, setSort] = useState<SortMode>("pct");

    const top4 = useMemo(() =>
            [...laboratorios].sort((a, b) => Number(b.pct_avance_monto) - Number(a.pct_avance_monto)).slice(0, 4),
        [laboratorios]
    );

    const filtered = useMemo(() => {
        let rows = laboratorios.map(l => ({
            ...l,
            pct: Number(l.pct_avance_monto || 0)
        }));

        if (search) {
            const q = search.toLowerCase();
            rows = rows.filter(l => (l.nombre_lab || String(l.id_linea_ge)).toLowerCase().includes(q));
        }

        if (filter === "verde") rows = rows.filter(l => l.pct >= 80);
        if (filter === "amarillo") rows = rows.filter(l => l.pct >= 50 && l.pct < 80);
        if (filter === "rojo") rows = rows.filter(l => l.pct < 50);

        if (sort === "pct") rows.sort((a, b) => b.pct - a.pct);
        if (sort === "venta") rows.sort((a, b) => Number(b.venta_real) - Number(a.venta_real));
        if (sort === "nombre") rows.sort((a, b) => (a.nombre_lab || '').localeCompare(b.nombre_lab || ''));

        return rows;
    }, [laboratorios, search, filter, sort]);

    const filterBtns: { key: FilterStatus; label: string; activeClass: string }[] = [
        { key: "todos", label: "Todos", activeClass: "bg-sky-600 text-white border-sky-600" },
        { key: "verde", label: "✓ Meta", activeClass: "bg-emerald-600 text-white border-emerald-600" },
        { key: "amarillo", label: "⚠ Riesgo", activeClass: "bg-amber-500 text-white border-amber-500" },
        { key: "rojo", label: "✗ Bajo", activeClass: "bg-red-600 text-white border-red-600" },
    ];

    const sortBtns: { key: SortMode; label: string }[] = [
        { key: "pct", label: "% Avance" },
        { key: "venta", label: "Venta S/" },
        { key: "nombre", label: "Nombre" },
    ];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {top4.map((lab, i) => {
                    const av = Number(lab.pct_avance_monto || 0);
                    return (
                        <KpiCard
                            key={lab.id_meta_lab}
                            label={lab.nombre_lab || `Lab ${lab.id_linea_ge}`}
                            value={`${av}%`}
                            subtitle={`${fmtMoney(Number(lab.venta_real))} de ${fmtMoney(Number(lab.meta_monto))}`}
                            accentColor={getLabColor(i)}
                            delta={av >= 80 ? "↑ En meta" : "⚠ En riesgo"}
                            deltaType={av >= 80 ? "success" : "warning"}
                        />
                    );
                })}
            </div>

            <Card className="shadow-sm">
                <CardContent className="p-4 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Buscar laboratorio..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-slate-50" />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] text-slate-400">Filtrar:</span>
                            {filterBtns.map(btn => (
                                <Button key={btn.key} variant="outline" size="sm"
                                        className={`text-[11px] h-7 px-3 ${filter === btn.key ? btn.activeClass : "text-slate-500"}`}
                                        onClick={() => setFilter(btn.key)}>
                                    {btn.label}
                                </Button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] text-slate-400">Ordenar:</span>
                            {sortBtns.map(btn => (
                                <Button key={btn.key} variant="outline" size="sm"
                                        className={`text-[11px] h-7 px-3 ${sort === btn.key ? "bg-sky-600 text-white border-sky-600" : "text-slate-500"}`}
                                        onClick={() => setSort(btn.key)}>
                                    {btn.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-400">{filtered.length} de {laboratorios.length} laboratorios</p>
                </CardContent>
            </Card>

            <Card className="shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs min-w-[560px]">
                            <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Laboratorio</th>
                                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Clientes</th>
                                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Venta S/</th>
                                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Cuota S/</th>
                                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">%</th>
                                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold min-w-[130px]">Avance</th>
                                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Estado</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7} className="text-center text-slate-400 py-8">Sin resultados</td></tr>
                            ) : filtered.map((l, i) => {
                                const [c1] = getStatusColor(l.pct);
                                const color = getLabColor(i);
                                return (
                                    <tr key={l.id_meta_lab} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                                                     style={{ background: `${color}22`, color }}>
                                                    {getInitials(l.nombre_lab || String(l.id_linea_ge))}
                                                </div>
                                                <b style={{ color }}>{l.nombre_lab || `Lab ${l.id_linea_ge}`}</b>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-400">{Number(l.clientes_atendidos)}/{Number(l.meta_clientes)}</td>
                                        <td className="px-3 py-2.5 font-semibold">{fmtMoney(Number(l.venta_real))}</td>
                                        <td className="px-3 py-2.5 text-slate-400">{fmtMoney(Number(l.meta_monto))}</td>
                                        <td className="px-3 py-2.5 font-bold" style={{ color: c1 }}>{l.pct}%</td>
                                        <td className="px-3 py-2.5"><ProgressBar pct={l.pct} height="h-1.5" /></td>
                                        <td className="px-3 py-2.5"><StatusChip pct={l.pct} /></td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
