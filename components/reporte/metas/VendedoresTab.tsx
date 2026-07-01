'use client'

import { useState, useMemo, Fragment } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ChevronDown, ChevronRight } from "lucide-react"
import ProgressBar from "@/components/reporte/metas/ProgressBar"
import StatusChip from "@/components/reporte/metas/StatusChip"
import { IVendedorDashboard } from "@/app/types/metas-types"
import { fmtMoney, getStatusColor, getInitials, getLabColor, agruparVendedores } from "@/app/utils/metas-helpers"
import { FilterStatus, SortMode } from "@/app/types/metas-types"

interface VendedoresTabProps {
    vendedores: IVendedorDashboard[];
    onVendedorClick?: (vendedor: IVendedorDashboard) => void;
    showSelector?: boolean;
    selectorOptions?: { value: string; label: string }[];
    selectorValue?: string;
    onSelectorChange?: (v: string) => void;
    allLabel?: string;
    // Selector de zona (filtra ventas/clientes del vendedor por zona del cliente)
    zonaOptions?: { value: string; label: string }[];
    zonaValue?: string;
    onZonaChange?: (v: string) => void;
}

export default function VendedoresTab({
    vendedores,
    onVendedorClick,
    showSelector,
    selectorOptions = [],
    selectorValue,
    onSelectorChange,
    allLabel = "Todos",
    zonaOptions,
    zonaValue,
    onZonaChange,
}: VendedoresTabProps) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterStatus>("todos");
    const [sort, setSort] = useState<SortMode>("pct");
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const toggleExpand = (cod: string) => setExpanded(prev => {
        const next = new Set(prev);
        if (next.has(cod)) next.delete(cod); else next.add(cod);
        return next;
    });

    // Una fila por vendedor (labs sumados); cada uno conserva sus labs en `labs`
    const agrupados = useMemo(() => agruparVendedores(vendedores), [vendedores]);

    const filtered = useMemo(() => {
        let rows = agrupados.map(v => ({
            ...v,
            pct: Number(v.pct_avance_monto || 0)
        }));

        if (search) {
            const q = search.toLowerCase();
            rows = rows.filter(v =>
                (v.nombre_vendedor || v.cod_vendedor).toLowerCase().includes(q)
            );
        }

        if (filter === "verde") rows = rows.filter(v => v.pct >= 80);
        if (filter === "amarillo") rows = rows.filter(v => v.pct >= 50 && v.pct < 80);
        if (filter === "rojo") rows = rows.filter(v => v.pct < 50);

        if (sort === "pct") rows.sort((a, b) => b.pct - a.pct);
        if (sort === "venta") rows.sort((a, b) => Number(b.venta_real) - Number(a.venta_real));
        if (sort === "nombre") rows.sort((a, b) => (a.nombre_vendedor || a.cod_vendedor).localeCompare(b.nombre_vendedor || b.cod_vendedor));

        return rows;
    }, [agrupados, search, filter, sort]);

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
            <Card className="shadow-sm">
                <CardContent className="p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar vendedor..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-10 bg-slate-50"
                            />
                        </div>
                        {showSelector && (
                            <Select
                                value={selectorValue || "__all__"}
                                onValueChange={v => onSelectorChange?.(v === "__all__" ? "" : v)}
                            >
                                <SelectTrigger className="h-10 text-sm bg-white sm:w-[200px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">{allLabel}</SelectItem>
                                    {selectorOptions.map(o => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {zonaOptions && (
                            <Select
                                value={zonaValue || "__all__"}
                                onValueChange={v => onZonaChange?.(v === "__all__" ? "" : v)}
                            >
                                <SelectTrigger className="h-10 text-sm bg-white sm:w-[200px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Todas las zonas</SelectItem>
                                    {zonaOptions.map(o => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] text-slate-400">Filtrar:</span>
                            {filterBtns.map(btn => (
                                <Button key={btn.key} variant="outline" size="sm"
                                        className={`text-[11px] h-7 px-3 ${filter === btn.key ? btn.activeClass : "text-slate-500"}`}
                                        onClick={() => setFilter(btn.key)}
                                >
                                    {btn.label}
                                </Button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] text-slate-400">Ordenar:</span>
                            {sortBtns.map(btn => (
                                <Button key={btn.key} variant="outline" size="sm"
                                        className={`text-[11px] h-7 px-3 ${sort === btn.key ? "bg-sky-600 text-white border-sky-600" : "text-slate-500"}`}
                                        onClick={() => setSort(btn.key)}
                                >
                                    {btn.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-400">{filtered.length} de {agrupados.length} vendedores</p>
                </CardContent>
            </Card>

            <div className="lg:hidden space-y-3">
                {filtered.length === 0 ? (
                    <Card><CardContent className="py-8 text-center text-slate-400 text-sm">Sin resultados</CardContent></Card>
                ) : filtered.map((v, i) => {
                    const [c1] = getStatusColor(v.pct);
                    const color = getLabColor(i);
                    const pendiente = Number(v.monto_pendiente || 0);
                    const labs = v.labs || [];
                    const isOpen = expanded.has(v.cod_vendedor);
                    return (
                        <Card
                            key={v.cod_vendedor}
                            className="shadow-sm overflow-hidden"
                            style={{ borderLeft: `4px solid ${color}` }}
                        >
                            <button
                                type="button"
                                className="w-full text-left active:scale-[0.99] transition-transform"
                                onClick={() => toggleExpand(v.cod_vendedor)}
                            >
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div
                                                className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                                                style={{ background: `${color}22`, color }}
                                            >
                                                {getInitials(v.nombre_vendedor || v.cod_vendedor)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-800 truncate">
                                                    {v.nombre_vendedor || v.cod_vendedor}
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                    Cod: {v.cod_vendedor} · {labs.length} lab{labs.length === 1 ? '' : 's'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <StatusChip pct={v.pct} />
                                            {isOpen
                                                ? <ChevronDown className="h-4 w-4 text-slate-400" />
                                                : <ChevronRight className="h-4 w-4 text-slate-400" />}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[11px] text-slate-500">Avance</span>
                                            <span className="text-sm font-bold" style={{ color: c1 }}>{v.pct}%</span>
                                        </div>
                                        <ProgressBar pct={v.pct} height="h-2" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Venta</p>
                                            <p className="text-sm font-bold text-slate-800">{fmtMoney(Number(v.venta_real))}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Cuota</p>
                                            <p className="text-sm font-semibold text-slate-500">{fmtMoney(Number(v.meta_monto))}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Clientes</p>
                                            <p className="text-sm font-semibold text-slate-700">
                                                {Number(v.clientes_atendidos || 0)}/{Number(v.meta_clientes || 0)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Pendiente</p>
                                            <p className="text-sm font-semibold" style={{ color: c1 }}>
                                                {pendiente > 0 ? fmtMoney(pendiente) : "✓ Logrado"}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-[10px] text-sky-500 font-medium">
                                        {isOpen
                                            ? "Toca un laboratorio para ver sus ítems"
                                            : `Ver ${labs.length} laboratorio${labs.length === 1 ? '' : 's'} →`}
                                    </p>
                                </CardContent>
                            </button>

                            {isOpen && labs.length > 0 && (
                                <div className="border-t border-slate-100 divide-y divide-slate-100 bg-slate-50/50">
                                    {labs.map((lab, li) => {
                                        const lpct = Number(lab.pct_avance_monto || 0);
                                        const [lc1] = getStatusColor(lpct);
                                        return (
                                            <button
                                                key={lab.id_linea_ge + '-' + li}
                                                type="button"
                                                className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-sky-50 transition-colors"
                                                onClick={() => onVendedorClick?.(lab)}
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-slate-700 truncate">{lab.nombre_lab}</p>
                                                    <div className="flex justify-between mt-0.5">
                                                        <span className="text-[10px] text-slate-400">
                                                            {fmtMoney(Number(lab.venta_real))} / {fmtMoney(Number(lab.meta_monto))}
                                                        </span>
                                                        <span className="text-[10px] text-sky-600">Ver ítems →</span>
                                                    </div>
                                                    <ProgressBar pct={lpct} height="h-1" className="mt-1" />
                                                </div>
                                                <span className="text-xs font-bold shrink-0" style={{ color: lc1 }}>{lpct}%</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

            <Card className="shadow-sm overflow-hidden hidden lg:block">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs min-w-[560px]">
                            <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Vendedor</th>
                                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Lab</th>
                                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Venta S/</th>
                                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Cuota S/</th>
                                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Clientes</th>
                                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">%</th>
                                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold min-w-[130px]">Avance</th>
                                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Estado</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center text-slate-400 py-8">Sin resultados</td>
                                </tr>
                            ) : filtered.map((v, i) => {
                                const [c1] = getStatusColor(v.pct);
                                const color = getLabColor(i);
                                const labs = v.labs || [];
                                const isOpen = expanded.has(v.cod_vendedor);
                                return (
                                    <Fragment key={v.cod_vendedor}>
                                        <tr
                                            className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                                            onClick={() => toggleExpand(v.cod_vendedor)}
                                        >
                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center gap-2">
                                                    {isOpen
                                                        ? <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                        : <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                                                    <div
                                                        className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                                                        style={{ background: `${color}22`, color }}
                                                    >
                                                        {getInitials(v.nombre_vendedor || v.cod_vendedor)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{v.nombre_vendedor || v.cod_vendedor}</p>
                                                        <p className="text-[10px] text-sky-600">
                                                            {isOpen ? 'Ocultar laboratorios' : 'Ver laboratorios'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-400">
                                                {labs.length} lab{labs.length === 1 ? '' : 's'}
                                            </td>
                                            <td className="px-3 py-2.5 font-semibold">{fmtMoney(Number(v.venta_real))}</td>
                                            <td className="px-3 py-2.5 text-slate-400">{fmtMoney(Number(v.meta_monto))}</td>
                                            <td className="px-3 py-2.5 text-slate-500">
                                                {Number(v.clientes_atendidos || 0)}/{Number(v.meta_clientes || 0)}
                                            </td>
                                            <td className="px-3 py-2.5 font-bold" style={{ color: c1 }}>{v.pct}%</td>
                                            <td className="px-3 py-2.5">
                                                <ProgressBar pct={v.pct} height="h-1.5" />
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <StatusChip pct={v.pct} />
                                            </td>
                                        </tr>

                                        {isOpen && labs.map((lab, li) => {
                                            const lpct = Number(lab.pct_avance_monto || 0);
                                            const [lc1] = getStatusColor(lpct);
                                            return (
                                                <tr
                                                    key={v.cod_vendedor + '-' + lab.id_linea_ge + '-' + li}
                                                    className="border-b border-slate-50 bg-slate-50/60 hover:bg-sky-50 cursor-pointer transition-colors"
                                                    onClick={() => onVendedorClick?.(lab)}
                                                >
                                                    <td className="px-3 py-2 pl-10">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                                                            <div>
                                                                <p className="font-medium text-slate-700">{lab.nombre_lab}</p>
                                                                <p className="text-[10px] text-sky-600">Ver ítems vendidos →</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-300">—</td>
                                                    <td className="px-3 py-2 font-semibold text-slate-600">{fmtMoney(Number(lab.venta_real))}</td>
                                                    <td className="px-3 py-2 text-slate-400">{fmtMoney(Number(lab.meta_monto))}</td>
                                                    <td className="px-3 py-2 text-slate-300">—</td>
                                                    <td className="px-3 py-2 font-bold" style={{ color: lc1 }}>{lpct}%</td>
                                                    <td className="px-3 py-2">
                                                        <ProgressBar pct={lpct} height="h-1.5" />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <StatusChip pct={lpct} />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </Fragment>
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