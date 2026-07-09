'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, X, Clock, ShoppingBag } from "lucide-react"
import { IDiaVisitas, IVisitasSemana, EstadoVisita } from "@/app/types/metas-types"
import { fmtMoney, getStatusChip, capPct } from "@/app/utils/metas-helpers"

interface Props {
    open: boolean;
    onClose: () => void;
    nombreVendedor: string;
    semanaLabel: string;
    data: IVisitasSemana;
    esCicloActivo: boolean;
}

function fmtHora(iso: string | null): string {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

function fmtFecha(fechaStr: string): string {
    const [y, m, d] = fechaStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'short' });
}

function EstadoIcon({ estado, hora, monto }: { estado: EstadoVisita; hora: string | null; monto: number }) {
    if (estado === 'PROGRAMADO') {
        return <span className="text-muted-foreground/50 text-sm font-bold">—</span>;
    }
    if (estado === 'VISITADO_CON_PEDIDO') {
        return <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />;
    }
    if (estado === 'VISITADO_SIN_PEDIDO') {
        return <CheckCircle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />;
    }
    return <X className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />;
}

function DiaHeader({ dia, esCicloActivo }: { dia: IDiaVisitas; esCicloActivo: boolean }) {
    const hoy = new Date().toISOString().split('T')[0];
    const esHoy = esCicloActivo && dia.fecha === hoy;
    const visitados = dia.clientes.filter(c => c.estado_visita.startsWith('VISITADO')).length;
    const total = dia.clientes.length;
    const montoTotal = dia.clientes.reduce((s, c) => s + c.monto_pedido, 0);
    const completado = visitados === total && total > 0;

    return (
        <div className="flex items-center justify-between py-1.5 px-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
                {esHoy && (
                    <Badge className="text-[9px] bg-sky-600 text-white px-1.5 py-0 h-4">HOY</Badge>
                )}
                <span className="text-xs font-semibold text-foreground capitalize">
                    {fmtFecha(dia.fecha)}
                </span>
                {completado && !esHoy && (
                    <Badge className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0 h-4">✔ completado</Badge>
                )}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>{visitados}/{total} visitados</span>
                {montoTotal > 0 && <span>· {fmtMoney(montoTotal)}</span>}
            </div>
        </div>
    );
}

export default function VisitasDetallePanel({ open, onClose, nombreVendedor, semanaLabel, data, esCicloActivo }: Props) {
    const chip = getStatusChip(data.pct);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0">
                <div className="p-4 pb-3 border-b border-border">
                    <DialogTitle className="text-sm font-bold text-foreground uppercase tracking-wide">
                        {nombreVendedor}
                    </DialogTitle>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Semana {semanaLabel}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-muted-foreground font-medium">
                            Visitas: {data.visitados}/{data.asignados} · {capPct(data.pct)}% cumplimiento
                        </span>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${chip.className}`}>
                            {chip.label}
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {data.detalle.length === 0 ? (
                        <p className="text-center text-muted-foreground text-sm py-8">Sin datos de visitas</p>
                    ) : (
                        data.detalle.map(dia => (
                            <div key={dia.fecha} className="space-y-1">
                                <DiaHeader dia={dia} esCicloActivo={esCicloActivo} />
                                <div className="space-y-1 pl-2">
                                    {dia.clientes.map((cl, idx) => (
                                        <div key={`${cl.cod_cliente}-${idx}`}
                                             className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-muted transition-colors">
                                            <div className="mt-0.5">
                                                <EstadoIcon estado={cl.estado_visita} hora={cl.hora_visita} monto={cl.monto_pedido} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-medium truncate ${
                                                    cl.estado_visita === 'PROGRAMADO' ? 'text-muted-foreground/50'
                                                    : cl.estado_visita === 'PENDIENTE' ? 'text-red-600'
                                                    : 'text-foreground'
                                                }`}>
                                                    {cl.NombreComercial}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {cl.estado_visita === 'PROGRAMADO' && (
                                                        <span className="text-[9px] text-muted-foreground">Programado</span>
                                                    )}
                                                    {cl.estado_visita === 'PENDIENTE' && (
                                                        <span className="text-[9px] text-red-400">Pendiente</span>
                                                    )}
                                                    {cl.estado_visita.startsWith('VISITADO') && cl.hora_visita && (
                                                        <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                                            <Clock className="h-2.5 w-2.5" />
                                                            {fmtHora(cl.hora_visita)}
                                                        </span>
                                                    )}
                                                    {cl.monto_pedido > 0 && (
                                                        <span className="text-[9px] text-emerald-600 flex items-center gap-0.5">
                                                            <ShoppingBag className="h-2.5 w-2.5" />
                                                            {fmtMoney(cl.monto_pedido)}
                                                        </span>
                                                    )}
                                                    {cl.estado_visita === 'VISITADO_SIN_PEDIDO' && (
                                                        <span className="text-[9px] text-muted-foreground">sin pedido</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
