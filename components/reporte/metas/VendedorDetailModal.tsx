'use client'

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { IVendedorDashboard, IItemDashboard, ICiclo } from "@/app/types/metas-types"
import { fmtMoney, getInitials, getLabColor, getStatusColor, capPct } from "@/app/utils/metas-helpers"
import StatusChip from "@/components/reporte/metas/StatusChip"
import ProgressBar from "@/components/reporte/metas/ProgressBar"
import VisitasSemanaCard from "@/components/reporte/metas/VisitasSemanaCard"
import VisitasDetallePanel from "@/components/reporte/metas/VisitasDetallePanel"
import ClientesAtendidosModal from "@/components/reporte/metas/ClientesAtendidosModal"
import { useVisitasSemana } from "@/app/hooks/useVisitasSemana"

interface VendedorDetailModalProps {
    open: boolean;
    onClose: () => void;
    vendedor: IVendedorDashboard | null;
    allItems: IItemDashboard[];
    ciclo: ICiclo | null;
}

export default function VendedorDetailModal({ open, onClose, vendedor, allItems, ciclo }: VendedorDetailModalProps) {
    const [visitasPanelOpen, setVisitasPanelOpen] = useState(false);
    const [clientesOpen, setClientesOpen] = useState(false);
    const { data: visitasData, loading: visitasLoading, semana } = useVisitasSemana(
        open ? (vendedor?.cod_vendedor ?? null) : null,
        ciclo
    );

    const vendItems = useMemo(() => {
        if (!vendedor) return [];
        return allItems
            .filter(i => i.cod_vendedor === vendedor.cod_vendedor && (vendedor.esAgrupado || i.id_linea_ge === vendedor.id_linea_ge))
            .map(item => ({
                ...item,
                avPct: Number(item.pct_avance_monto || 0),
                uPct: Number(item.pct_cumplimiento_unidades || 0),
                contrib: Number(vendedor.venta_real) > 0
                    ? Math.round(Number(item.venta_real) / Number(vendedor.venta_real) * 100)
                    : 0
            }))
            .sort((a, b) => b.avPct - a.avPct);
    }, [vendedor, allItems]);

    if (!vendedor) return null;

    const avPct = Number(vendedor.pct_avance_monto || 0);
    const [c1] = getStatusColor(avPct);
    const color = getLabColor(0);

    const totalUnidades = vendItems.reduce((s, i) => s + Number(i.u_vendidas || 0), 0);
    const totalMetaCant = vendItems.reduce((s, i) => s + Number(i.meta_cantidad || 0), 0);

    const cobPct = Number(vendedor.meta_clientes) > 0
        ? Math.round(Number(vendedor.clientes_atendidos) / Number(vendedor.meta_clientes) * 100)
        : 0;
    const [cobColor] = getStatusColor(cobPct);

    return (
        <>
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                <div className="p-5 pb-4 border-b border-border">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                                 style={{ background: `${color}22`, color }}>
                                {getInitials(vendedor.nombre_vendedor || vendedor.cod_vendedor)}
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-foreground">
                                    {vendedor.nombre_vendedor || vendedor.cod_vendedor}
                                </DialogTitle>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">
                                        Cod: {vendedor.cod_vendedor}
                                    </Badge>
                                    {vendedor.esAgrupado ? (
                                        <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground border-border">
                                            {vendedor.labs?.length ?? 0} laboratorio{(vendedor.labs?.length ?? 0) === 1 ? '' : 's'}
                                        </Badge>
                                    ) : vendedor.nombre_lab ? (
                                        <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground border-border">
                                            {vendedor.nombre_lab}
                                        </Badge>
                                    ) : null}
                                    <span className="text-[10px] text-muted-foreground">
                                        {vendItems.length} ítem{vendItems.length === 1 ? '' : 's'} asignado{vendItems.length === 1 ? '' : 's'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <StatusChip pct={avPct} />
                    </div>
                </div>

                <div className={`grid gap-3 p-4 bg-muted border-b border-border ${(visitasLoading || visitasData?.tiene_rutas) ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
                    <div className="bg-background rounded-lg p-3 border border-border">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Venta Total</p>
                        <p className="text-lg font-bold mt-0.5" style={{ color: c1 }}>
                            {fmtMoney(Number(vendedor.venta_real))}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                            Meta {fmtMoney(Number(vendedor.meta_monto))} · avance {capPct(avPct)}%
                        </p>
                        <ProgressBar pct={avPct} height="h-1" className="mt-1.5" />
                    </div>

                    <button type="button"
                            onClick={() => { if (!vendedor.esAgrupado) setClientesOpen(true) }}
                            disabled={vendedor.esAgrupado}
                            className={`bg-background rounded-lg p-3 border border-border text-left transition-all ${vendedor.esAgrupado ? 'cursor-default' : 'hover:border-sky-300 hover:shadow-sm cursor-pointer'}`}>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Cobertura Clientes</p>
                        <p className="text-lg font-bold mt-0.5" style={{ color: cobColor }}>
                            {capPct(cobPct)}%
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                            {Number(vendedor.clientes_atendidos)} atendidos / meta {Number(vendedor.meta_clientes)}
                        </p>
                        <ProgressBar pct={cobPct} height="h-1" className="mt-1.5" />
                        {!vendedor.esAgrupado && (
                            <p className="text-[9px] text-sky-600 font-semibold mt-1">Ver clientes →</p>
                        )}
                    </button>

                    <div className="bg-background rounded-lg p-3 border border-border">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Unidades Totales</p>
                        <p className="text-lg font-bold mt-0.5 text-foreground">
                            {totalUnidades.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                            {vendItems.length} producto{vendItems.length === 1 ? '' : 's'} · meta {totalMetaCant.toLocaleString()} uds
                        </p>
                    </div>

                    {(visitasLoading || visitasData?.tiene_rutas) && (
                        <VisitasSemanaCard
                            data={visitasData ?? { tiene_rutas: false, asignados: 0, visitados: 0, pct: 0, detalle: [] }}
                            loading={visitasLoading}
                            onClick={() => setVisitasPanelOpen(true)}
                        />
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <div className="grid grid-cols-[2fr_80px_65px_70px_65px] gap-2 px-3 py-1.5 text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                        <span>Ítem</span>
                        <span className="text-right">Venta S/</span>
                        <span className="text-right">Cuota S/</span>
                        <span className="text-center">Uds</span>
                        <span className="text-center">Contrib.</span>
                    </div>

                    {vendItems.length === 0 ? (
                        <div className="text-center text-muted-foreground text-sm py-8">
                            No hay ítems asignados a este vendedor en este laboratorio
                        </div>
                    ) : (
                        vendItems.map((item) => {
                            const [sc1] = getStatusColor(item.avPct);
                            const [uc1] = getStatusColor(item.uPct);
                            const contribColor = item.contrib >= 25 ? "#0284c7" : item.contrib >= 15 ? "#d97706" : "#94a3b8";

                            return (
                                <div key={item.id_meta_item}
                                     className="grid grid-cols-[2fr_80px_65px_70px_65px] gap-2 px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/70 items-center transition-colors"
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-foreground truncate">
                                            {item.nombre_articulo || item.cod_articulo}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[9px] text-muted-foreground">
                                                P.ref: {fmtMoney(Number(item.precio_ref_meta))}
                                            </span>
                                            <span className="text-[9px] text-muted-foreground">
                                                Meta: {Number(item.meta_cantidad).toLocaleString()} uds
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs font-semibold">{fmtMoney(Number(item.venta_real))}</p>
                                        <ProgressBar pct={item.avPct} height="h-[3px]" className="mt-0.5" />
                                    </div>

                                    <div className="text-right text-[11px] text-muted-foreground">
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
                                                <span className="text-[8px] font-bold" style={{ color: uc1 }}>{capPct(item.uPct)}%</span>
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-muted-foreground">{Number(item.u_vendidas).toLocaleString()}</p>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-sm font-bold" style={{ color: contribColor }}>{capPct(item.contrib)}%</p>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {vendItems.length > 0 && (
                        <div className="grid grid-cols-[2fr_80px_65px_70px_65px] gap-2 px-3 py-2.5 bg-muted rounded-lg border border-border items-center mt-2">
                            <span className="text-[11px] font-semibold text-muted-foreground">
                                TOTAL · {vendItems.length} ítems
                            </span>
                            <span className="text-right text-xs font-bold" style={{ color: c1 }}>
                                {fmtMoney(Number(vendedor.venta_real))}
                            </span>
                            <span className="text-right text-[11px] text-muted-foreground">
                                {fmtMoney(Number(vendedor.meta_monto))}
                            </span>
                            <span className="text-center text-[10px] font-semibold text-muted-foreground">
                                {totalUnidades.toLocaleString()}
                            </span>
                            <span className="text-center text-xs font-bold text-muted-foreground">100%</span>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>

        {visitasData?.tiene_rutas && semana && (
            <VisitasDetallePanel
                open={visitasPanelOpen}
                onClose={() => setVisitasPanelOpen(false)}
                nombreVendedor={vendedor.nombre_vendedor || vendedor.cod_vendedor}
                semanaLabel={semana.label}
                data={visitasData}
                esCicloActivo={ciclo?.estado === 'ABIERTO'}
            />
        )}

        {ciclo && (
            <ClientesAtendidosModal
                open={clientesOpen}
                onClose={() => setClientesOpen(false)}
                codVendedor={vendedor.cod_vendedor}
                idCiclo={ciclo.id_ciclo}
                idLineaGe={vendedor.id_linea_ge}
                nombreVendedor={vendedor.nombre_vendedor || vendedor.cod_vendedor}
            />
        )}
        </>
    );
}
