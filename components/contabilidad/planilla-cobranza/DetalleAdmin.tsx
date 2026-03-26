'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
    CheckCircle2, XCircle, Loader2,
    PlayCircle, AlertTriangle,
} from 'lucide-react'
import { toast } from '@/app/hooks/use-toast'
import apiClient from '@/app/api/client'
import {
    AdminInfo, CatalogosBanco,
    PlanillaCabecera, PlanillaDetalle, TipoComprobante,
} from "@/app/types/planilla-types"
import { TipoAmortizacion, EmpresaOption } from "@/app/types/amortizacion-types"
import { fmtFecha, fmtHora, fmtMoney } from "@/lib/planilla.helper"
import MiniTabla from "@/components/contabilidad/planilla-cobranza/Minitabla"

interface Props {
    planilla:         PlanillaCabecera
    detalle:          PlanillaDetalle[]
    loadingDet:       boolean
    tiposComprobante: TipoComprobante[]
    bancos:           CatalogosBanco[]
    tiposAmort:       TipoAmortizacion[]
    empresas:         EmpresaOption[]
    adminInfo:        AdminInfo
    procesando:       boolean
    onValidar:        (id: number) => void
    onRechazar:       (id: number, obs: string) => void
}

export default function DetalleAdmin({
                                         planilla, detalle, loadingDet,
                                         tiposComprobante, bancos,
                                         tiposAmort, empresas,
                                         adminInfo, procesando,
                                         onValidar, onRechazar,
                                     }: Props) {

    const [obsTexto,     setObsTexto]     = useState('')
    const [isProcesando, setIsProcesando] = useState(false)

    const [modalOpen,       setModalOpen]       = useState(false)
    const [tipoAmortSel,    setTipoAmortSel]    = useState<string>('')
    const [empresaSel,      setEmpresaSel]      = useState<string>(
        () => empresas[0]?.CodigoEmpresa ?? ''
    )

    const yaGestionada = planilla.estado === 'validado' || planilla.estado === 'rechazado'
    const tDocs = detalle.reduce((s, r) => s + Number(r.importe), 0)
    const tCbza = detalle.reduce((s, r) => s + Number(r.importe_cobrado), 0)

    const handleAbrirModal = () => {
        setTipoAmortSel(tiposAmort[0]?.Cod_Tipo_Amort ?? '')
        setEmpresaSel(empresas[0]?.CodigoEmpresa ?? '')
        setModalOpen(true)
    }

    const buildPayload = (item: PlanillaDetalle) => ({
        id_amort_clie:     null,
        nroPlanilla:       planilla.numero_planilla,
        cod_clie:          item.codigo_cliente     ?? "",
        tipo_doc:          item.tipo_documento,
        serie_doc:         item.serie              ?? "",
        numero_doc:        item.numero_doc         ?? "",
        fecha_mvto:        planilla.fecha_ruta,
        importe_amortiz:   Number(item.importe_cobrado),
        tipo_amort:        tipoAmortSel,
        nro_doc_amortiza:  item.numero_recibo       ?? "",
        entida_financiera: item.cod_banco           ?? "",
        observaciones:     planilla.observacion_admin ?? "",
        cod_vend:          planilla.codigo_vendedor,
        empresa:           empresaSel,
        moneda:            "NSO",
    })

    const handleConfirmarProcesar = async () => {
        if (!tipoAmortSel) {
            toast({ title: 'Campo requerido', description: 'Selecciona el tipo de amortización.', variant: 'warning' })
            return
        }
        if (!empresaSel) {
            toast({ title: 'Campo requerido', description: 'Selecciona la empresa.', variant: 'warning' })
            return
        }
        if (detalle.length === 0) {
            toast({ title: 'Sin detalle', description: 'No hay registros para procesar.', variant: 'warning' })
            return
        }

        setModalOpen(false)
        setIsProcesando(true)
        try {
            await Promise.all(
                detalle.map(item => apiClient.post('/amortizacion', buildPayload(item)))
            )
            toast({
                title:       'Procesado',
                description: `${detalle.length} amortización(es) registradas correctamente.`,
            })
        } catch (error: any) {
            toast({
                title:       'Error al procesar',
                description: error?.response?.data?.message || 'No se pudieron registrar las amortizaciones.',
                variant:     'destructive',
            })
        } finally {
            setIsProcesando(false)
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
            <div className="border-t border-slate-100 p-4 bg-[#FAFAF8] space-y-3 animate-in slide-in-from-top-2 duration-200">

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

                        {planilla.estado === 'validado' && (
                            <Button
                                size="sm"
                                className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
                                onClick={handleAbrirModal}
                                disabled={isProcesando}
                            >
                                {isProcesando
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <PlayCircle className="h-3.5 w-3.5" />}
                                {isProcesando ? 'Procesando...' : 'Procesar'}
                            </Button>
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
                                variant="outline" size="sm"
                                className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
                                onClick={handleRechazar}
                                disabled={procesando}
                            >
                                {procesando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                                Rechazar / observar
                            </Button>
                            <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
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

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Confirmar procesamiento
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500 pt-1">
                            Se registrará esta amortización para
                            la planilla <span className="font-mono font-semibold text-slate-700">{planilla.numero_planilla}</span>.
                            Completa los campos requeridos antes de continuar.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">

                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <p className="text-slate-400 uppercase tracking-wider text-[10px]">Vendedor</p>
                                <p className="font-medium text-slate-700 mt-0.5 truncate">{planilla.nombre_vendedor}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 uppercase tracking-wider text-[10px]">Total cobrado</p>
                                <p className="font-mono font-semibold text-emerald-600 mt-0.5">{fmtMoney(tCbza)}</p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm">
                                Tipo de amortización <span className="text-red-500">*</span>
                            </Label>
                            <Select value={tipoAmortSel} onValueChange={setTipoAmortSel}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {tiposAmort.map(t => (
                                        <SelectItem key={t.Cod_Tipo_Amort} value={t.Cod_Tipo_Amort}>
                                            {t.Descripcion}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm">
                                Empresa <span className="text-red-500">*</span>
                            </Label>
                            <Select value={empresaSel} onValueChange={setEmpresaSel} disabled>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar empresa..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {empresas.map(e => (
                                        <SelectItem key={e.CodigoEmpresa} value={e.CodigoEmpresa}>
                                            {e.NombreRazSocial}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setModalOpen(false)}
                            disabled={isProcesando}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 gap-1.5"
                            onClick={handleConfirmarProcesar}
                            disabled={isProcesando || !tipoAmortSel || !empresaSel}
                        >
                            {isProcesando
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <PlayCircle className="h-4 w-4" />}
                            Confirmar y procesar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}