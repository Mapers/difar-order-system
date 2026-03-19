'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { IItemDashboard } from "@/app/types/metas-types"
import { fmtMoney, getStatusColor } from "@/app/utils/metas-helpers"
import MiniDonut from "./MiniDonut"
import MiniGauge from "./MiniGauge"
import ProgressBar from "./ProgressBar"
import StatusChip from "./StatusChip"

export type ItemWithComputed = IItemDashboard & { avPct: number; uPct: number; contrib: number }
export type ItemModalType = 'unidades' | 'avance'

interface ItemDetailModalProps {
    item: ItemWithComputed | null;
    type: ItemModalType;
    labColor: string;
    open: boolean;
    onClose: () => void;
}

export default function ItemDetailModal({ item, type, labColor, open, onClose }: ItemDetailModalProps) {
    if (!item) return null;

    const [avColor] = getStatusColor(item.avPct);
    const [uColor] = getStatusColor(item.uPct);
    const montoFaltante = Math.max(0, Number(item.meta_monto) - Number(item.venta_real));
    const unidadesFaltantes = Math.max(0, Number(item.meta_cantidad) - Number(item.u_vendidas));

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-sm font-bold leading-snug">
                        {item.nombre_articulo || item.cod_articulo}
                    </DialogTitle>
                    <p className="text-xs text-slate-400">{item.cod_articulo}{item.nombre_lab ? ` · ${item.nombre_lab}` : ''}</p>
                </DialogHeader>

                {type === 'unidades' ? (
                    <div className="flex flex-col items-center gap-4 py-2">
                        <MiniDonut pct={item.uPct} size={120} strokeWidth={12} />
                        <p className="text-2xl font-bold" style={{ color: uColor }}>{item.uPct}%</p>
                        <div className="w-full space-y-2.5">
                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                <span className="text-sm text-slate-500">Unidades vendidas</span>
                                <span className="text-sm font-bold text-slate-800">{Number(item.u_vendidas).toLocaleString()} uds</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                <span className="text-sm text-slate-500">Meta de unidades</span>
                                <span className="text-sm font-bold text-slate-800">{Number(item.meta_cantidad).toLocaleString()} uds</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-slate-500">Por vender para la meta</span>
                                <span className="text-sm font-bold" style={{ color: uColor }}>
                                    {unidadesFaltantes > 0 ? `${unidadesFaltantes.toLocaleString()} uds` : '✓ Alcanzado'}
                                </span>
                            </div>
                        </div>
                        <div className="w-full"><ProgressBar pct={item.uPct} height="h-2.5" /></div>
                        <StatusChip pct={item.uPct} />
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 py-2">
                        <MiniGauge pct={item.avPct} width={140} height={85} />
                        <p className="text-2xl font-bold" style={{ color: avColor }}>{item.avPct}%</p>
                        <div className="w-full space-y-2.5">
                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                <span className="text-sm text-slate-500">Venta real</span>
                                <span className="text-sm font-bold text-slate-800">{fmtMoney(Number(item.venta_real))}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                <span className="text-sm text-slate-500">Meta de venta</span>
                                <span className="text-sm font-bold text-slate-800">{fmtMoney(Number(item.meta_monto))}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-slate-500">Por vender para la meta</span>
                                <span className="text-sm font-bold" style={{ color: avColor }}>
                                    {montoFaltante > 0 ? fmtMoney(montoFaltante) : '✓ Alcanzado'}
                                </span>
                            </div>
                        </div>
                        <div className="w-full"><ProgressBar pct={item.avPct} height="h-2.5" /></div>
                        <StatusChip pct={item.avPct} />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
