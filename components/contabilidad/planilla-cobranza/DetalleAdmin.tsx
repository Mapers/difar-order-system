'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2, AlertCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from '@/app/hooks/use-toast'
import {
    AdminInfo,
    CatalogosBanco,
    PlanillaCabecera,
    PlanillaDetalle,
    TipoComprobante
} from "@/app/types/planilla-types";
import {fmtFecha, fmtHora, fmtMoney} from "@/lib/planilla.helper";
import MiniTabla from "@/components/contabilidad/planilla-cobranza/Minitabla";
import ExportPlanillaPdfButton from "@/components/contabilidad/planilla-cobranza/ExportPlanillaPdfButton";

interface Props {
    planilla:         PlanillaCabecera
    detalle:          PlanillaDetalle[]
    loadingDet:       boolean
    tiposComprobante: TipoComprobante[]
    bancos:           CatalogosBanco[]
    adminInfo:        AdminInfo
    procesando:       boolean
    onValidar:        (id: number) => void
    onRechazar:       (id: number, obs: string) => void
}

export default function DetalleAdmin({
                                         planilla, detalle, loadingDet,
                                         tiposComprobante, bancos,
                                         adminInfo, procesando,
                                         onValidar, onRechazar,
                                     }: Props) {

    const [obsTexto, setObsTexto] = useState('')
    const yaGestionada = planilla.estado === 'validado' || planilla.estado === 'rechazado'
    const tDocs = detalle.reduce((s, r) => s + Number(r.importe), 0)
    const tCbza = detalle.reduce((s, r) => s + Number(r.importe_cobrado), 0)

    const handleRechazar = () => {
        if (!obsTexto.trim()) {
            toast({ title: 'Observación requerida', description: 'Escribe una observación antes de rechazar.', variant: 'warning' })
            return
        }
        onRechazar(planilla.id_planilla, obsTexto)
        setObsTexto('')
    }

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

            {/* Tag de estado para planillas ya gestionadas */}
            {yaGestionada && (
                <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border
          ${planilla.estado === 'validado'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {planilla.estado === 'validado'
                        ? <CheckCircle2 className="h-3.5 w-3.5" />
                        : <XCircle className="h-3.5 w-3.5" />}
                    {planilla.estado === 'validado'
                        ? `Planilla validada · ${fmtHora(planilla.fecha_revision)}`
                        : `Observación registrada · ${fmtHora(planilla.fecha_revision)}`}
                </div>
            )}

            {planilla.estado === 'validado' && <span className='ml-2'>
              <ExportPlanillaPdfButton planilla={planilla} detalle={detalle} />
            </span>}

            {/* Nota/observación registrada */}
            {yaGestionada && planilla.observacion_admin && (
                <div className={`rounded-lg p-3 text-sm leading-relaxed
          ${planilla.estado === 'validado'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border border-red-200 text-red-700'}`}>
                    {planilla.observacion_admin}
                </div>
            )}

            {/* Tabla de registros */}
            {loadingDet ? (
                <div className="space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 rounded" />)}
                </div>
            ) : (
                <MiniTabla
                    registros={detalle}
                    tiposComprobante={tiposComprobante}
                    bancos={bancos}
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

            {/* Acciones (solo planillas pendientes de gestionar) */}
            {!yaGestionada && (
                <div className="space-y-3 pt-1">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                            Observaciones (opcional)
                        </label>
                        <Textarea
                            placeholder="Escribe alguna observación antes de validar o rechazar..."
                            value={obsTexto}
                            onChange={e => setObsTexto(e.target.value)}
                            rows={3}
                            className="resize-none text-sm"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
                            onClick={handleRechazar}
                            disabled={procesando}
                        >
                            {procesando
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <XCircle className="h-3.5 w-3.5" />}
                            Rechazar / observar
                        </Button>
                        <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                            onClick={() => onValidar(planilla.id_planilla)}
                            disabled={procesando}
                        >
                            {procesando
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <CheckCircle2 className="h-3.5 w-3.5" />}
                            Validar planilla
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}