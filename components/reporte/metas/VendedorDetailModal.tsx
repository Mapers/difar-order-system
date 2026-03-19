'use client'

import { useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { IVendedorDashboard, IItemDashboard } from "@/app/types/metas-types"
import {fmtMoney, getInitials, getLabColor, getStatusColor} from "@/app/utils/metas-helpers";
import StatusChip from "@/components/reporte/metas/StatusChip";
import ProgressBar from "@/components/reporte/metas/ProgressBar";

interface VendedorDetailModalProps {
    open: boolean;
    onClose: () => void;
    vendedor: IVendedorDashboard | null;
    allItems: IItemDashboard[];
}

export default function VendedorDetailModal({ open, onClose, vendedor, allItems }: VendedorDetailModalProps) {
    if (!vendedor) return null;

    const avPct = Number(vendedor.pct_avance_monto || 0);
    const [c1] = getStatusColor(avPct);
    const color = getLabColor(0);

    const vendItems = useMemo(() => {
        return allItems
            .filter(i => i.id_meta_lab_vend === vendedor.id_meta_lab_vend)
            .map(item => ({
                ...item,
                avPct: Number(item.pct_avance_monto || 0),
                uPct: Number(item.pct_cumplimiento_unidades || 0),
                contrib: Number(vendedor.venta_real) > 0
                    ? Math.round(Number(item.venta_real) / Number(vendedor.venta_real) * 100)
                    : 0
            }))
            .sort((a, b) => b.contrib - a.contrib);
    }, [vendedor, allItems]);

    const totalUnidades = vendItems.reduce((s, i) => s + Number(i.u_vendidas || 0), 0);
    const totalMetaCant = vendItems.reduce((s, i) => s + Number(i.meta_cantidad || 0), 0);

    const cobPct = Number(vendedor.meta_clientes) > 0
        ? Math.round(Number(vendedor.clientes_atendidos) / Number(vendedor.meta_clientes) * 100)
        : 0;
    const [cobColor] = getStatusColor(cobPct);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                <div className="p-5 pb-4 border-b border-slate-200">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                                 style={{ background: `${color}22`, color }}>
                                {getInitials(vendedor.nombre_vendedor || vendedor.cod_vendedor)}
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-slate-800">
                                    {vendedor.nombre_vendedor || vendedor.cod_vendedor}
                                </DialogTitle>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">
                                        Cod: {vendedor.cod_vendedor}
                                    </Badge>
                                    <span className="text-[10px] text-slate-400">{vendItems.length} ítem{vendItems.length === 1 ? '' : 's'} asignado{vendItems.length === 1 ? '' : 's'}</span>
                                </div>
                            </div>
                        </div>
                        <StatusChip pct={avPct} />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border-b border-slate-200">
                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Venta Total</p>
                        <p className="text-lg font-bold mt-0.5" style={{ color: c1 }}>
                            {fmtMoney(Number(vendedor.venta_real))}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                            Meta {fmtMoney(Number(vendedor.meta_monto))} · avance {avPct}%
                        </p>
                        <ProgressBar pct={avPct} height="h-1" className="mt-1.5" />
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Cobertura Clientes</p>
                        <p className="text-lg font-bold mt-0.5" style={{ color: cobColor }}>
                            {cobPct}%
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                            {Number(vendedor.clientes_atendidos)} atendidos / meta {Number(vendedor.meta_clientes)}
                        </p>
                        <ProgressBar pct={cobPct} height="h-1" className="mt-1.5" />
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Unidades Totales</p>
                        <p className="text-lg font-bold mt-0.5 text-slate-700">
                            {totalUnidades.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                            {vendItems.length} producto{vendItems.length === 1 ? '' : 's'} · meta {totalMetaCant.toLocaleString()} uds
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <div className="grid grid-cols-[2fr_80px_65px_70px_65px] gap-2 px-3 py-1.5 text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                        <span>Ítem</span>
                        <span className="text-right">Venta S/</span>
                        <span className="text-right">Cuota S/</span>
                        <span className="text-center">Uds</span>
                        <span className="text-center">Contrib.</span>
                    </div>

                    {vendItems.length === 0 ? (
                        <div className="text-center text-slate-400 text-sm py-8">
                            No hay ítems asignados a este vendedor
                        </div>
                    ) : (
                        vendItems.map((item, idx) => {
                            const [sc1] = getStatusColor(item.avPct);
                            const [uc1] = getStatusColor(item.uPct);
                            const contribColor = item.contrib >= 25 ? "#0284c7" : item.contrib >= 15 ? "#d97706" : "#94a3b8";

                            return (
                                <div key={item.id_meta_item}
                                     className="grid grid-cols-[2fr_80px_65px_70px_65px] gap-2 px-3 py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 items-center transition-colors"
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-slate-800 truncate">
                                            {item.nombre_articulo || item.cod_articulo}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {item.nombre_lab && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-600 font-semibold">
                                                    {item.nombre_lab}
                                                </span>
                                            )}
                                            <span className="text-[9px] text-slate-400">
                                                P.ref: {fmtMoney(Number(item.precio_ref_meta))}
                                            </span>
                                            <span className="text-[9px] text-slate-400">
                                                Meta: {Number(item.meta_cantidad).toLocaleString()} uds
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs font-semibold">{fmtMoney(Number(item.venta_real))}</p>
                                        <ProgressBar pct={item.avPct} height="h-[3px]" className="mt-0.5" />
                                    </div>

                                    <div className="text-right text-[11px] text-slate-400">
                                        {fmtMoney(Number(item.meta_monto))}
                                    </div>

                                    <div className="flex flex-col items-center gap-0.5">
                                        <div className="relative w-8 h-8">
                                            <svg width="32" height="32" viewBox="0 0 32 32" style={{ transform: 'rotate(-90deg)' }}>
                                                <circle cx="16" cy="16" r="12" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                                                <circle cx="16" cy="16" r="12" fill="none"
                                                        stroke={uc1} strokeWidth="4"
                                                        strokeDasharray={`${Math.min(item.uPct, 100) / 100 * 75.4} ${75.4 - Math.min(item.uPct, 100) / 100 * 75.4}`}
                                                        strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-[8px] font-bold" style={{ color: uc1 }}>{item.uPct}%</span>
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-slate-500">{Number(item.u_vendidas).toLocaleString()}</p>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-sm font-bold" style={{ color: contribColor }}>{item.contrib}%</p>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {vendItems.length > 0 && (
                        <div className="grid grid-cols-[2fr_80px_65px_70px_65px] gap-2 px-3 py-2.5 bg-slate-100 rounded-lg border border-slate-200 items-center mt-2">
                            <span className="text-[11px] font-semibold text-slate-500">
                                TOTAL · {vendItems.length} ítems
                            </span>
                            <span className="text-right text-xs font-bold" style={{ color: c1 }}>
                                {fmtMoney(Number(vendedor.venta_real))}
                            </span>
                            <span className="text-right text-[11px] text-slate-400">
                                {fmtMoney(Number(vendedor.meta_monto))}
                            </span>
                            <span className="text-center text-[10px] font-semibold text-slate-500">
                                {totalUnidades.toLocaleString()}
                            </span>
                            <span className="text-center text-xs font-bold text-slate-400">100%</span>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
