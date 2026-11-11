'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
    CheckCircle2, XCircle, Loader2,
    Send, CheckCheck, Trash2, Clock,
} from 'lucide-react'
import { toast } from '@/app/hooks/useToast'
import apiClient from '@/app/api/client'
import {
    AdminInfo, CatalogosBanco,
    PlanillaCabecera, PlanillaCajaEstado, PlanillaDetalle, TipoComprobante,
} from "@/app/types/planilla-types"
import { fmtFecha, fmtHora, fmtMoney } from "@/lib/planilla.helper"
import MiniTabla from "@/components/contabilidad/planilla-cobranza/Minitabla"
import { ExportarPlanillaFormato } from "@/components/contabilidad/planilla-cobranza/ExportarPlanillaFormato"

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
    onEliminar:       (planilla: PlanillaCabecera) => Promise<boolean>
}

export default function DetalleAdmin({
                                         planilla, detalle, loadingDet,
                                         tiposComprobante, bancos,
                                         adminInfo, procesando,
                                         onValidar, onRechazar, onEliminar,
                                     }: Props) {

    const [obsTexto, setObsTexto] = useState('')

    const yaGestionada = planilla.estado === 'validado' || planilla.estado === 'rechazado'
    const tDocs = detalle.reduce((s, r) => s + Number(r.importe), 0)
    const tCbza = detalle.reduce((s, r) => s + Number(r.importe_cobrado), 0)
    // Solo las filas con importe cobrado van a caja; las que están en 0 no hubo pago.
    const conCobro  = detalle.filter(r => Number(r.importe_cobrado) > 0)
    const sinCobro  = detalle.length - conCobro.length

    // Estado en Libro Caja de cada registro enviado. null mientras se consulta o si falló.
    const [estadoCaja,  setEstadoCaja]  = useState<PlanillaCajaEstado[] | null>(null)
    const [consultando, setConsultando] = useState(false)
    const [enviarOpen,  setEnviarOpen]  = useState(false)
    const [enviando,    setEnviando]    = useState(false)

    const cargarEstadoCaja = async () => {
        setConsultando(true)
        try {
            const res = await apiClient.get(`/planilla/${planilla.id_planilla}/caja`)
            setEstadoCaja(res.data?.data?.data ?? [])
        } catch {
            setEstadoCaja(null)
        } finally {
            setConsultando(false)
        }
    }

    useEffect(() => {
        if (planilla.estado !== 'validado') { setEstadoCaja(null); return }
        cargarEstadoCaja()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planilla.id_planilla, planilla.estado])

    const porId = new Map((estadoCaja ?? []).map(e => [e.id_detalle, e]))
    const pendientesCaja = (estadoCaja ?? []).filter(e => e.estado === 'pendiente').length
    const aceptadosCaja  = (estadoCaja ?? []).filter(e => e.estado === 'aceptado').length
    const rechazadosCaja = (estadoCaja ?? []).filter(e => e.estado === 'rechazado')
    // Lo que se mandaría al pulsar el botón: lo nunca enviado más lo rechazado.
    const porEnviar = conCobro.filter(r => {
        const e = porId.get(r.id_detalle)
        return !e || e.estado === 'rechazado'
    })
    const todoEnLibro = conCobro.length > 0 && aceptadosCaja === conCobro.length

    const puedeEliminar = planilla.estado !== 'validado' || (estadoCaja !== null && aceptadosCaja === 0)

    const [eliminarOpen, setEliminarOpen] = useState(false)
    const [eliminando,   setEliminando]   = useState(false)

    const handleEliminar = async () => {
        setEliminando(true)
        const ok = await onEliminar(planilla)
        setEliminando(false)
        if (ok) setEliminarOpen(false)
    }

    const handleEnviarCaja = async () => {
        setEnviando(true)
        try {
            const res = await apiClient.put(`/planilla/${planilla.id_planilla}/enviar-caja`, { id_admin: adminInfo.id_admin })
            const r = res.data?.data?.resumen ?? {}
            toast({
                title:       'Enviada a Libro Caja',
                description: `${Number(r.pendientes ?? 0)} cobro(s) esperan que contabilidad los acepte en Libro Caja y Bancos > Planillas de cobranza.`,
            })
            setEnviarOpen(false)
        } catch (error: any) {
            toast({
                title:       'No se pudo enviar',
                description: error?.response?.data?.message || error?.response?.data?.error || 'Error al enviar la planilla a caja.',
                variant:     'destructive',
            })
        } finally {
            setEnviando(false)
            cargarEstadoCaja()
        }
    }

    const handleRechazar = () => {
        if (!obsTexto.trim()) {
            toast({ title: 'Observación requerida', description: 'Escribe una observación antes de rechazar.', variant: 'warning' })
            return
        }
        onRechazar(planilla.id_planilla, obsTexto)
        setObsTexto('')
    }

    return (
        <>
            <div className="border-t border-border p-4 bg-muted/30 space-y-3 animate-in slide-in-from-top-2 duration-200">

                <div className="flex flex-wrap items-center justify-end gap-2">
                    {puedeEliminar && !loadingDet && !consultando && !enviando && (
                        <Button
                            variant="ghost" size="sm"
                            className="mr-auto gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                            onClick={() => setEliminarOpen(true)}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Eliminar planilla
                        </Button>
                    )}
                    {!puedeEliminar && planilla.estado === 'validado' && (
                        <span className="mr-auto text-[11px] text-muted-foreground">
                            Tiene cobros aceptados en Libro Caja: para eliminarla, primero revierte esos cobros en Libro Caja y Bancos &gt; Planillas de cobranza &gt; Historial.
                        </span>
                    )}
                    <ExportarPlanillaFormato planilla={planilla} detalle={detalle} disabled={loadingDet}
                                             tiposComprobante={tiposComprobante} bancos={bancos} />
                </div>

                {yaGestionada && (
                    <div className="flex items-center gap-2 flex-wrap">
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

                        {planilla.estado === 'validado' && !loadingDet && conCobro.length === 0 ? (
                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                                Sin cobros para enviar a caja
                            </div>
                        ) : planilla.estado === 'validado' && (
                            <>
                                {todoEnLibro && (
                                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">
                                        <CheckCheck className="h-3.5 w-3.5" />
                                        En el libro · {aceptadosCaja} cobro(s) aceptados en caja
                                    </div>
                                )}
                                {!todoEnLibro && pendientesCaja > 0 && (
                                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                                        <Clock className="h-3.5 w-3.5" />
                                        En caja · {pendientesCaja} pendiente(s){aceptadosCaja > 0 && ` · ${aceptadosCaja} aceptado(s)`}
                                    </div>
                                )}
                                {porEnviar.length > 0 && (
                                    <Button
                                        size="sm"
                                        className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
                                        onClick={() => setEnviarOpen(true)}
                                        disabled={enviando || consultando || estadoCaja === null}
                                    >
                                        {enviando || consultando
                                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            : <Send className="h-3.5 w-3.5" />}
                                        {consultando ? 'Verificando...'
                                            : rechazadosCaja.length > 0 && porEnviar.length === rechazadosCaja.length
                                                ? `Reenviar rechazados a caja (${rechazadosCaja.length})`
                                                : 'Enviar a caja'}
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                )}

                {yaGestionada && planilla.observacion_admin && (
                    <div className={`rounded-lg p-3 text-sm leading-relaxed
                        ${planilla.estado === 'validado'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-red-50 border border-red-200 text-red-700'}`}>
                        {planilla.observacion_admin}
                    </div>
                )}

                {rechazadosCaja.length > 0 && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                        <p className="font-semibold">Contabilidad rechazó {rechazadosCaja.length} cobro(s) en Libro Caja:</p>
                        <ul className="mt-1.5 space-y-1 text-xs">
                            {rechazadosCaja.map(e => {
                                const r = detalle.find(d => d.id_detalle === e.id_detalle)
                                return (
                                    <li key={e.id_detalle}>
                                        <span className="font-mono font-semibold">{r ? `${r.serie ?? ''}-${r.numero_doc ?? ''}` : e.id_detalle}</span>
                                        {r && <> · {r.nombre_cliente} · {fmtMoney(r.importe_cobrado)}</>}
                                        {' — '}{e.motivo}
                                    </li>
                                )
                            })}
                        </ul>
                        <p className="mt-2 text-xs">Revísalos y vuelve a enviarlos con el botón de arriba.</p>
                    </div>
                )}

                {aceptadosCaja > 0 && (
                    <details className="rounded-lg border bg-background p-3 text-xs">
                        <summary className="cursor-pointer font-semibold text-foreground">
                            Ver en qué voucher entró cada cobro ({aceptadosCaja})
                        </summary>
                        <ul className="mt-2 space-y-1 text-muted-foreground">
                            {(estadoCaja ?? []).filter(e => e.estado === 'aceptado').map(e => {
                                const r = detalle.find(d => d.id_detalle === e.id_detalle)
                                return (
                                    <li key={e.id_detalle}>
                                        <span className="font-mono font-semibold text-foreground">{r ? `${r.serie ?? ''}-${r.numero_doc ?? ''}` : e.id_detalle}</span>
                                        {' · '}{e.caja} · voucher {e.voucher} · {fmtFecha(e.fecha_mvto)}
                                    </li>
                                )
                            })}
                        </ul>
                    </details>
                )}

                {loadingDet ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 rounded" />)}
                    </div>
                ) : (
                    <MiniTabla
                        registros={detalle}
                        tiposComprobante={tiposComprobante}
                        bancos={bancos}
                        mostrarTotales={false}
                    />
                )}

                <div className="hidden lg:grid grid-cols-3 gap-3">
                    <div className="rounded-xl border bg-background px-4 py-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total documentos</p>
                        <p className="mt-0.5 font-mono text-lg font-bold text-blue-700 dark:text-blue-400">{fmtMoney(tDocs)}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 dark:border-emerald-900 dark:bg-emerald-950/40">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total cobrado</p>
                        <p className="mt-0.5 font-mono text-lg font-bold text-emerald-700 dark:text-emerald-400">{fmtMoney(tCbza)}</p>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 dark:border-amber-900 dark:bg-amber-950/40">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pendiente</p>
                        <p className="mt-0.5 font-mono text-lg font-bold text-amber-700 dark:text-amber-400">{fmtMoney(Math.max(0, tDocs - tCbza))}</p>
                    </div>
                </div>

                {!yaGestionada && (
                    <div className="space-y-3 pt-1">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Observaciones (opcional)
                            </label>
                            <Textarea
                                placeholder="Escribe alguna observación antes de validar o rechazar..."
                                value={obsTexto}
                                onChange={e => setObsTexto(e.target.value)}
                                rows={3}
                                className="resize-none text-sm bg-background"
                            />
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                            <Button
                                variant="outline" size="sm"
                                className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100 gap-1.5 dark:border-red-900 dark:bg-red-950/40"
                                onClick={handleRechazar}
                                disabled={procesando}
                            >
                                {procesando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                                Rechazar / observar
                            </Button>
                            <Button
                                size="sm"
                                className="bg-emerald-600 text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 gap-1.5"
                                onClick={() => onValidar(planilla.id_planilla)}
                                disabled={procesando}
                            >
                                {procesando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                Validar planilla
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={enviarOpen} onOpenChange={v => { if (!enviando) setEnviarOpen(v) }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <Send className="h-5 w-5 text-indigo-600" />
                            Enviar a Libro Caja
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground pt-1">
                            Se enviarán {porEnviar.length} cobro(s) de la planilla{' '}
                            <span className="font-mono font-semibold text-foreground">{planilla.numero_planilla}</span>{' '}
                            por {fmtMoney(porEnviar.reduce((s, r) => s + Number(r.importe_cobrado), 0))}.
                            {sinCobro > 0 && <> {sinCobro} documento(s) sin importe cobrado no se envían.</>}{' '}
                            Contabilidad los aceptará en Libro Caja y Bancos: recién ahí baja la deuda de cada cliente.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setEnviarOpen(false)} disabled={enviando}>
                            Cancelar
                        </Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 gap-1.5" onClick={handleEnviarCaja} disabled={enviando}>
                            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Enviar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={eliminarOpen} onOpenChange={v => { if (!eliminando) setEliminarOpen(v) }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <Trash2 className="h-5 w-5 text-red-600" />
                            Eliminar planilla
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground pt-1">
                            Se eliminará la planilla <span className="font-mono font-semibold text-foreground">{planilla.numero_planilla}</span> de {planilla.nombre_vendedor}, con
                            sus {planilla.total_registros ?? detalle.length} registro(s) y vouchers. Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setEliminarOpen(false)} disabled={eliminando}>
                            Cancelar
                        </Button>
                        <Button className="bg-red-600 hover:bg-red-700 gap-1.5" onClick={handleEliminar} disabled={eliminando}>
                            {eliminando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}