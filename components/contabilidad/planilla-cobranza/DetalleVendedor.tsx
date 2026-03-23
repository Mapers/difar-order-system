'use client'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    CheckCircle2, AlertCircle, Edit2, Send, Loader2,
} from 'lucide-react'
import ExportPlanillaPdfButton from './ExportPlanillaPdfButton'
import {CatalogosBanco, PlanillaCabecera, PlanillaDetalle, TipoComprobante} from "@/app/types/planilla-types";
import {fmtFecha, fmtHora, fmtMoney} from "@/lib/planilla.helper";
import MiniTabla from "@/components/contabilidad/planilla-cobranza/Minitabla";

interface Props {
    planilla:         PlanillaCabecera
    detalle:          PlanillaDetalle[]
    loadingDet:       boolean
    tiposComprobante: TipoComprobante[]
    bancos:           CatalogosBanco[]
    // edición
    editId:           number | null
    editRegs:         PlanillaDetalle[]
    setEditRegs:      (regs: PlanillaDetalle[]) => void
    onIniciarEdicion: () => void
    onCancelarEdicion: () => void
    onReenviar:       () => void
    reenviando:       boolean
    // borrador
    onEditarBorrador?: () => void
}

export default function DetalleVendedor({
                                            planilla, detalle, loadingDet,
                                            tiposComprobante, bancos,
                                            editId, editRegs, setEditRegs,
                                            onIniciarEdicion, onCancelarEdicion, onReenviar, reenviando,
                                            onEditarBorrador,
                                        }: Props) {

    const isEditing  = editId === planilla.id_planilla
    const registros  = isEditing ? editRegs : detalle
    const tDocs      = registros.reduce((s, r) => s + Number(r.importe), 0)
    const tCbza      = registros.reduce((s, r) => s + Number(r.importe_cobrado), 0)

    return (
        <div className="border-t border-slate-100 p-4 bg-[#FAFAF8] space-y-3 animate-in slide-in-from-top-2 duration-200">

            {/* Meta grid */}
            <div className="grid grid-cols-3 gap-2">
                {[
                    { label: 'Fecha',   val: fmtFecha(planilla.fecha_ruta) },
                    { label: 'Zona',    val: planilla.zona || '—' },
                    { label: 'Enviada', val: planilla.fecha_envio ? fmtHora(planilla.fecha_envio) : '—' },
                ].map(item => (
                    <div key={item.label} className="bg-white border border-slate-100 rounded-lg px-3 py-2">
                        <p className="text-[10px] uppercase text-slate-400 tracking-wide">{item.label}</p>
                        <p className="text-xs font-medium text-slate-700 mt-0.5">{item.val}</p>
                    </div>
                ))}
            </div>

            {/* Banner observación rechazado */}
            {planilla.estado === 'rechazado' && planilla.observacion_admin && (
                <div className="flex gap-2.5 bg-red-50 border border-red-200 rounded-lg p-3">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-1">
                            Observación del administrador
                        </p>
                        <p className="text-sm text-red-700">{planilla.observacion_admin}</p>
                    </div>
                </div>
            )}

            {/* Banner nota validado */}
            {planilla.estado === 'validado' && planilla.observacion_admin && (
                <div className="flex gap-2.5 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1">
                            Nota del administrador
                        </p>
                        <p className="text-sm text-emerald-700">{planilla.observacion_admin}</p>
                    </div>
                </div>
            )}

            {/* Barra modo edición */}
            {isEditing && (
                <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                        <Edit2 className="h-3.5 w-3.5 text-amber-600" />
                        <p className="text-xs font-semibold text-amber-700">
                            Modo edición activo — modifica los campos y reenvía
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline" size="sm" className="h-7 text-xs"
                            onClick={onCancelarEdicion}
                        >
                            Cancelar
                        </Button>
                        <Button
                            size="sm"
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 gap-1"
                            onClick={onReenviar}
                            disabled={reenviando}
                        >
                            {reenviando
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <Send className="h-3 w-3" />}
                            Reenviar planilla
                        </Button>
                    </div>
                </div>
            )}

            {/* Tabla de registros */}
            {loadingDet ? (
                <div className="space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 rounded" />)}
                </div>
            ) : (
                <MiniTabla
                    registros={registros}
                    tiposComprobante={tiposComprobante}
                    bancos={bancos}
                    editando={isEditing}
                    onCambiar={(id, campo, valor) =>
                        setEditRegs(editRegs.map(r =>
                            r.id_detalle === id ? { ...r, [campo]: valor } : r
                        ))
                    }
                />
            )}

            {/* Totales inline (desktop) */}
            <div className="hidden lg:flex gap-2">
                <div className="flex-1 bg-white border border-slate-100 rounded-lg px-4 py-2">
                    <p className="text-[10px] uppercase text-slate-400 tracking-wider">Total documentos</p>
                    <p className="font-mono text-base font-medium text-blue-800 mt-0.5">{fmtMoney(tDocs)}</p>
                </div>
                <div className="flex-1 bg-white border border-slate-100 rounded-lg px-4 py-2">
                    <p className="text-[10px] uppercase text-slate-400 tracking-wider">Total cobrado</p>
                    <p className="font-mono text-base font-medium text-emerald-600 mt-0.5">{fmtMoney(tCbza)}</p>
                </div>
            </div>

            {/* Acciones por estado */}
            {planilla.estado === 'borrador' && !isEditing && onEditarBorrador && (
                <div className="flex flex-wrap gap-2">
                    <Button
                        size="sm"
                        className="bg-sky-600 hover:bg-sky-700 gap-1.5"
                        onClick={onEditarBorrador}
                    >
                        <Edit2 className="h-3.5 w-3.5" /> Editar planilla
                    </Button>
                </div>
            )}

            {planilla.estado === 'rechazado' && !isEditing && (
                <div className="flex flex-wrap gap-2">
                    <Button
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 gap-1.5"
                        onClick={onIniciarEdicion}
                    >
                        <Edit2 className="h-3.5 w-3.5" /> Editar y reenviar
                    </Button>
                </div>
            )}

            {planilla.estado === 'validado' && (
                <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700
                      bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Planilla aprobada · {fmtHora(planilla.fecha_revision)}
                    </div>
                    <ExportPlanillaPdfButton planilla={planilla} detalle={registros} />
                </div>
            )}
        </div>
    )
}