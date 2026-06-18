'use client'

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { IVendedorResumenDashboard, IVendedorLabDetalle } from "@/app/types/metas-types"
import { fmtMoney, getInitials, getLabColor, getStatusColor } from "@/app/utils/metas-helpers"
import StatusChip from "@/components/reporte/metas/StatusChip"
import ProgressBar from "@/components/reporte/metas/ProgressBar"
import { MetasService } from "@/app/services/reports/metasService"

interface VendedorResumenModalProps {
    open: boolean;
    onClose: () => void;
    vendedor: IVendedorResumenDashboard | null;
    idCiclo: number;
}

export default function VendedorResumenModal({ open, onClose, vendedor, idCiclo }: VendedorResumenModalProps) {
    const [labs, setLabs] = useState<IVendedorLabDetalle[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !vendedor) return;
        setLoading(true);
        MetasService.getDetalleVendedorPorLab(idCiclo, vendedor.cod_vendedor)
            .then(res => {
                setLabs(res?.data?.data || []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [open, vendedor, idCiclo]);

    if (!vendedor) return null;

    const pct = Number(vendedor.pct_avance_global || 0);
    const [c1] = getStatusColor(pct);
    const color = getLabColor(0);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0">
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
                                    <span className="text-[10px] text-slate-400">{vendedor.total_labs} laboratorio{vendedor.total_labs === 1 ? '' : 's'}</span>
                                </div>
                            </div>
                        </div>
                        <StatusChip pct={pct} />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border-b border-slate-200">
                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Venta Total</p>
                        <p className="text-lg font-bold mt-0.5" style={{ color: c1 }}>
                            {fmtMoney(Number(vendedor.venta_total))}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                            Cuota {fmtMoney(Number(vendedor.cuota_total))} · {pct}%
                        </p>
                        <ProgressBar pct={pct} height="h-1" className="mt-1.5" />
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Labs en meta</p>
                        <p className="text-lg font-bold mt-0.5 text-emerald-600">{vendedor.labs_en_meta}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">≥ 80% avance</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Labs bajo</p>
                        <p className="text-lg font-bold mt-0.5 text-red-500">{vendedor.labs_bajo}</p>
                        <p className="text-[10px] text-amber-500 mt-0.5">{vendedor.labs_riesgo} en riesgo</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <div className="grid grid-cols-[2fr_80px_80px_60px] gap-2 px-3 py-1.5 text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                        <span>Laboratorio</span>
                        <span className="text-right">Venta S/</span>
                        <span className="text-right">Cuota S/</span>
                        <span className="text-center">%</span>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-600" />
                        </div>
                    ) : labs.length === 0 ? (
                        <div className="text-center text-slate-400 text-sm py-8">
                            Sin detalle de laboratorios
                        </div>
                    ) : (
                        labs
                            .sort((a, b) => Number(b.pct_lab) - Number(a.pct_lab))
                            .map((lab, idx) => {
                                const labPct = Number(lab.pct_lab || 0);
                                const [lc] = getStatusColor(labPct);
                                const labColor = getLabColor(idx);
                                return (
                                    <div key={lab.id_lab}
                                         className="grid grid-cols-[2fr_80px_80px_60px] gap-2 px-3 py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 items-center transition-colors"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0"
                                                 style={{ background: `${labColor}22`, color: labColor }}>
                                                {getInitials(lab.nombre_lab || String(lab.id_lab))}
                                            </div>
                                            <p className="text-xs font-medium text-slate-800 truncate">
                                                {lab.nombre_lab || `Lab ${lab.id_lab}`}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-semibold">{fmtMoney(Number(lab.venta_real))}</p>
                                            <ProgressBar pct={Math.min(labPct, 100)} height="h-[3px]" className="mt-0.5" />
                                        </div>
                                        <div className="text-right text-[11px] text-slate-400">
                                            {fmtMoney(Number(lab.meta_monto))}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold" style={{ color: lc }}>{labPct}%</p>
                                        </div>
                                    </div>
                                );
                            })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
