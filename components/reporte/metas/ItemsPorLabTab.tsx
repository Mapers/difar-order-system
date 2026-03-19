'use client'

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, Search } from "lucide-react"
import { ILabDashboard, IItemDashboard, FilterStatus, ItemSortMode } from "@/app/types/metas-types"
import { fmtMoney, getStatusColor, getLabColor, calcPct } from "@/app/utils/metas-helpers"
import ProgressBar from "@/components/reporte/metas/ProgressBar";
import StatusChip from "@/components/reporte/metas/StatusChip";
import MiniDonut from "@/components/reporte/metas/MiniDonut";
import MiniGauge from "@/components/reporte/metas/MiniGauge";
import ItemDetailModal, { ItemWithComputed, ItemModalType } from "@/components/reporte/metas/ItemDetailModal";

interface ItemsPorLabTabProps {
    laboratorios: ILabDashboard[];
    items: IItemDashboard[];
}

export default function ItemsPorLabTab({ laboratorios, items }: ItemsPorLabTabProps) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterStatus>("todos");
    const [sort, setSort] = useState<ItemSortMode>("contribucion");
    const [openLabs, setOpenLabs] = useState<Set<number>>(new Set());
    const [modalItem, setModalItem] = useState<ItemWithComputed | null>(null);
    const [modalType, setModalType] = useState<ItemModalType>('unidades');
    const [modalLabColor, setModalLabColor] = useState<string>("");

    const toggleLab = (id: number) => {
        setOpenLabs(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const labGroups = useMemo(() => {
        const groups = laboratorios.map(lab => {
            const labItems = items
                .filter(i => {
                    return i.id_meta_lab === lab.id_meta_lab;
                })
                .map(item => ({
                    ...item,
                    avPct: Number(item.pct_avance_monto || 0),
                    uPct: Number(item.pct_cumplimiento_unidades || 0),
                    contrib: Number(lab.venta_real) > 0
                        ? Math.round(Number(item.venta_real) / Number(lab.venta_real) * 100)
                        : 0
                }));

            return {
                ...lab,
                pct: Number(lab.pct_avance_monto || 0),
                labItems,
            };
        });

        let filtered = groups;
        if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(g => (g.nombre_lab || String(g.id_linea_ge)).toLowerCase().includes(q));
        }
        if (filter === "verde") filtered = filtered.filter(g => g.pct >= 80);
        if (filter === "amarillo") filtered = filtered.filter(g => g.pct >= 50 && g.pct < 80);
        if (filter === "rojo") filtered = filtered.filter(g => g.pct < 50);

        return filtered.sort((a, b) => b.pct - a.pct);
    }, [laboratorios, items, search, filter]);

    const filterBtns: { key: FilterStatus; label: string; activeClass: string }[] = [
        { key: "todos", label: "Todos", activeClass: "bg-sky-600 text-white border-sky-600" },
        { key: "verde", label: "✓ En meta", activeClass: "bg-emerald-600 text-white border-emerald-600" },
        { key: "amarillo", label: "⚠ Riesgo", activeClass: "bg-amber-500 text-white border-amber-500" },
        { key: "rojo", label: "✗ Bajo", activeClass: "bg-red-600 text-white border-red-600" },
    ];

    const sortBtns: { key: ItemSortMode; label: string }[] = [
        { key: "contribucion", label: "% Contribución" },
        { key: "avance", label: "% Avance S/" },
        { key: "unidades", label: "Unidades" },
    ];

    return (
        <div className="space-y-4">
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
                            <span className="text-[11px] text-slate-400">Ordenar ítems:</span>
                            {sortBtns.map(btn => (
                                <Button key={btn.key} variant="outline" size="sm"
                                        className={`text-[11px] h-7 px-3 ${sort === btn.key ? "bg-sky-600 text-white border-sky-600" : "text-slate-500"}`}
                                        onClick={() => setSort(btn.key)}>
                                    {btn.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-400">{labGroups.length} de {laboratorios.length} laboratorios</p>
                </CardContent>
            </Card>

            <div className="space-y-3">
                {labGroups.map((group, gIdx) => {
                    const isOpen = openLabs.has(group.id_meta_lab);
                    const [c1, c2] = getStatusColor(group.pct);
                    const color = getLabColor(gIdx);

                    const sortedItems = [...group.labItems].sort((a, b) => {
                        if (sort === "contribucion") return b.contrib - a.contrib;
                        if (sort === "unidades") return Number(b.u_vendidas) - Number(a.u_vendidas);
                        return b.avPct - a.avPct;
                    });

                    return (
                        <Card key={group.id_meta_lab} className="shadow-sm overflow-hidden">
                            <div
                                className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
                                style={{ borderLeft: `4px solid ${color}` }}
                                onClick={() => toggleLab(group.id_meta_lab)}
                            >
                                <div className="flex items-center gap-2">
                                    {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                                    <span className="font-semibold text-sm" style={{ color }}>{group.nombre_lab || `Lab ${group.id_linea_ge}`}</span>
                                    <span className="text-[11px] text-slate-400">{sortedItems.length} ítems</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="hidden sm:flex flex-col items-end gap-0.5">
                                        <span className="text-[10px] text-slate-400">Avance S/</span>
                                        <span className="text-xs font-bold" style={{ color: c1 }}>{group.pct}%</span>
                                    </div>
                                    <div className="w-24 hidden sm:block">
                                        <ProgressBar pct={group.pct} height="h-1.5" />
                                    </div>
                                    <StatusChip pct={group.pct} />
                                </div>
                            </div>

                            {isOpen && (
                                <div>
                                    <div className="grid grid-cols-[2fr_90px_90px_80px_70px_70px_70px] gap-2 px-4 py-2 border-t border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                                        <span>Ítem / Producto</span>
                                        <span className="text-right">Venta S/</span>
                                        <span className="text-right">Cuota S/</span>
                                        <span className="text-center">Unidades</span>
                                        <span className="text-center">Contrib.</span>
                                        <span className="text-center">Avance</span>
                                        <span className="text-center">Estado</span>
                                    </div>

                                    {sortedItems.map((item, idx) => {
                                        const [sc1] = getStatusColor(item.avPct);
                                        const [uc1] = getStatusColor(item.uPct);
                                        return (
                                            <div key={item.id_meta_item}
                                                 className="grid grid-cols-[2fr_90px_90px_80px_70px_70px_70px] gap-2 px-4 py-2.5 border-b border-slate-50 hover:bg-slate-50 items-center transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold shrink-0"
                                                         style={{ background: `${color}15`, color }}>
                                                        {idx + 1}
                                                    </div>
                                                    <span className="text-xs font-medium truncate">{item.nombre_articulo || item.cod_articulo}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-semibold">{fmtMoney(Number(item.venta_real))}</p>
                                                    <ProgressBar pct={item.avPct} height="h-[3px]" className="mt-0.5" />
                                                </div>
                                                <div className="text-right text-xs text-slate-400">{fmtMoney(Number(item.meta_monto))}</div>
                                                <div
                                                    className="flex flex-col items-center gap-0.5 cursor-pointer hover:opacity-70 transition-opacity"
                                                    onClick={e => { e.stopPropagation(); setModalItem(item); setModalType('unidades'); setModalLabColor(color); }}
                                                >
                                                    <MiniDonut pct={item.uPct} size={36} strokeWidth={4} />
                                                    <p className="text-[9px] text-slate-400">{Number(item.u_vendidas).toLocaleString()} / {Number(item.meta_cantidad).toLocaleString()}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-bold" style={{ color }}>{item.contrib}%</p>
                                                    <p className="text-[9px] text-slate-400">del lab</p>
                                                </div>
                                                <div
                                                    className="flex justify-center cursor-pointer hover:opacity-70 transition-opacity"
                                                    onClick={e => { e.stopPropagation(); setModalItem(item); setModalType('avance'); setModalLabColor(color); }}
                                                >
                                                    <MiniGauge pct={item.avPct} width={56} height={34} />
                                                </div>
                                                <div className="text-center">
                                                    <StatusChip pct={item.avPct} />
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <div className="grid grid-cols-[2fr_90px_90px_80px_70px_70px_70px] gap-2 px-4 py-2.5 bg-slate-50 border-t border-slate-200 items-center">
                                        <span className="text-[11px] text-slate-500 font-semibold">TOTAL · {sortedItems.length} ítems</span>
                                        <span className="text-right text-xs font-bold" style={{ color }}>{fmtMoney(Number(group.venta_real))}</span>
                                        <span className="text-right text-xs text-slate-400">{fmtMoney(Number(group.meta_monto))}</span>
                                        <span className="text-center text-[11px] text-slate-500 font-semibold">{group.pct}% cumpl.</span>
                                        <span className="text-center text-xs font-bold text-slate-400">100%</span>
                                        <span className="text-center text-xs font-bold" style={{ color }}>{group.pct}%</span>
                                        <span className="text-center"><StatusChip pct={group.pct} /></span>
                                    </div>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

            <ItemDetailModal
                item={modalItem}
                type={modalType}
                labColor={modalLabColor}
                open={!!modalItem}
                onClose={() => setModalItem(null)}
            />
        </div>
    );
}
