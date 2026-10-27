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
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
    CheckCircle2, XCircle, Loader2,
    PlayCircle, AlertTriangle, CheckCheck, Trash2,
} from 'lucide-react'
import { toast } from '@/app/hooks/useToast'
import apiClient from '@/app/api/client'
import {
    AdminInfo, CatalogosBanco,
    PlanillaCabecera, PlanillaDetalle, TipoComprobante,
} from "@/app/types/planilla-types"
import { TipoAmortizacion, EmpresaOption } from "@/app/types/amortizacion-types"
import { fmtHora, fmtMoney } from "@/lib/planilla.helper"
import MiniTabla from "@/components/contabilidad/planilla-cobranza/Minitabla"
import { ExportarPlanillaFormato } from "@/components/contabilidad/planilla-cobranza/ExportarPlanillaFormato"

/** Identifica un documento cobrado: cliente, tipo, serie y número. */
const claveDoc = (cliente: unknown, tipo: unknown, serie: unknown, numero: unknown) =>
    [cliente, tipo, serie, Number(numero) || numero]
        .map(v => String(v ?? '').trim().toUpperCase())
        .join('|')

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
    onEliminar:       (planilla: PlanillaCabecera) => Promise<boolean>
}

export default function DetalleAdmin({
                                         planilla, detalle, loadingDet,
                                         tiposComprobante, bancos,
                                         tiposAmort, empresas,
                                         adminInfo, procesando,
                                         onValidar, onRechazar, onEliminar,
                                     }: Props) {

    const [obsTexto,     setObsTexto]     = useState('')
    const [isProcesando, setIsProcesando] = useState(false)

    const [modalOpen,       setModalOpen]       = useState(false)
    const [tipoAmortSel,    setTipoAmortSel]    = useState<string>('')
    const [empresaSel,      setEmpresaSel]      = useState<string>(
        () => empresas[0]?.CodigoEmpresa ?? ''
    )

    // Filas de la planilla que todavía no tienen su amortización registrada.
    // null mientras se consulta o si la consulta falló.
    const [pendientes,   setPendientes]   = useState<PlanillaDetalle[] | null>(null)
    const [verificando,  setVerificando]  = useState(false)
    // Avance del procesamiento: cuántas van de cuántas.
    const [progreso,     setProgreso]     = useState<{ hechas: number; total: number } | null>(null)

    const yaGestionada = planilla.estado === 'validado' || planilla.estado === 'rechazado'
    const tDocs = detalle.reduce((s, r) => s + Number(r.importe), 0)
    const tCbza = detalle.reduce((s, r) => s + Number(r.importe_cobrado), 0)
    // Solo las filas con importe cobrado se convierten en amortización; las que están en 0 no hubo pago.
    const conCobro  = detalle.filter(r => Number(r.importe_cobrado) > 0)
    const sinCobro  = detalle.length - conCobro.length

    const handleAbrirModal = () => {
        setTipoAmortSel(tiposAmort[0]?.Cod_Tipo_Amort ?? '')
        setEmpresaSel(empresas[0]?.CodigoEmpresa ?? '')
        setModalOpen(true)
    }

    /**
     * Consulta las amortizaciones ya registradas con el número de esta planilla
     * y devuelve las filas que faltan. Si un documento aparece dos veces en la
     * planilla, cada registro encontrado descuenta una sola fila.
     */
    const consultarPendientes = async (): Promise<PlanillaDetalle[]> => {
        const res = await apiClient.get('/amortizacion/buscar', { params: { nroPlanilla: planilla.numero_planilla } })
        const registradas: any[] = res.data?.data?.data ?? []
        const cuenta = new Map<string, number>()
        for (const r of registradas) {
            const k = claveDoc(r.Cod_Clie, r.TipoDoc, r.SerieDoc, r.NumeroDoc)
            cuenta.set(k, (cuenta.get(k) ?? 0) + 1)
        }
        return conCobro.filter(item => {
            const k = claveDoc(item.codigo_cliente, item.tipo_documento, item.serie, item.numero_doc)
            const n = cuenta.get(k) ?? 0
            if (n === 0) return true
            cuenta.set(k, n - 1)
            return false
        })
    }

    useEffect(() => {
        if (planilla.estado !== 'validado' || loadingDet || conCobro.length === 0) {
            setPendientes(null)
            return
        }
        let vivo = true
        setVerificando(true)
        consultarPendientes()
            .then(p => { if (vivo) setPendientes(p) })
            .catch(() => { if (vivo) setPendientes(null) })
            .finally(() => { if (vivo) setVerificando(false) })
        return () => { vivo = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planilla.id_planilla, planilla.estado, planilla.numero_planilla, detalle, loadingDet])

    // Mientras se procesa, el navegador pide confirmación antes de cerrar o recargar la página.
    useEffect(() => {
        if (!isProcesando) return
        const avisar = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
        window.addEventListener('beforeunload', avisar)
        return () => window.removeEventListener('beforeunload', avisar)
    }, [isProcesando])

    const procesada = pendientes !== null && conCobro.length > 0 && pendientes.length === 0
    const puedeEliminar = planilla.estado !== 'validado' || conCobro.length === 0
        || (pendientes !== null && pendientes.length === conCobro.length)

    const [eliminarOpen, setEliminarOpen] = useState(false)
    const [eliminando,   setEliminando]   = useState(false)

    const handleEliminar = async () => {
        setEliminando(true)
        const ok = await onEliminar(planilla)
        setEliminando(false)
        if (ok) setEliminarOpen(false)
    }
    const parcial   = pendientes !== null && pendientes.length > 0 && pendientes.length < conCobro.length

    // DEUDA TÉCNICA: la fecha de depósito, el N° de operación y el N° de cheque del
    // registro (lo que ahora se lee del voucher) no llegan al cobro: sp_ws_amortizacion_guardar
    // no tiene parámetros para ellos y fecha_mvto recibe la fecha de ruta. Validar en la base
    // de datos qué soporta el SP (o usar p_Fecha_Mvto / p_Observaciones) antes de cambiarlo.
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
        if (conCobro.length === 0) {
            toast({ title: 'Sin cobros', description: 'No hay registros con importe cobrado para procesar.', variant: 'warning' })
            return
        }

        setModalOpen(false)
        setIsProcesando(true)
        try {
            // Se vuelve a consultar justo antes: otro usuario pudo procesarla mientras tanto.
            let porRegistrar: PlanillaDetalle[]
            try {
                porRegistrar = await consultarPendientes()
            } catch {
                toast({
                    title:       'No se pudo verificar',
                    description: 'No se pudo revisar qué documentos ya están registrados. Intenta de nuevo.',
                    variant:     'destructive',
                })
                return
            }
            if (porRegistrar.length === 0) {
                setPendientes([])
                toast({ title: 'Planilla ya procesada', description: 'Todos los documentos ya tienen su amortización registrada.' })
                return
            }

            // Uno por uno, para saber exactamente cuáles se registraron y cuáles no.
            let registradas = 0
            const fallas: string[] = []
            setProgreso({ hechas: 0, total: porRegistrar.length })
            for (const [i, item] of porRegistrar.entries()) {
                setProgreso({ hechas: i + 1, total: porRegistrar.length })
                try {
                    await apiClient.post('/amortizacion', buildPayload(item))
                    registradas++
                } catch (error: any) {
                    const doc = `${item.serie ?? ''}-${item.numero_doc ?? ''}`
                    fallas.push(`${doc} (${error?.response?.data?.message || 'error'})`)
                }
            }

            if (fallas.length === 0) {
                toast({
                    title:       'Procesado',
                    description: `${registradas} amortización(es) registradas correctamente.`,
                })
            } else {
                toast({
                    title:       registradas > 0 ? 'Procesado con errores' : 'Error al procesar',
                    description: `${registradas} registrada(s), ${fallas.length} con error: ${fallas.join(', ')}. Vuelve a procesar para reintentar solo las que faltan.`,
                    variant:     'destructive',
                })
            }

            setPendientes(await consultarPendientes().catch(() => null))
        } finally {
            setIsProcesando(false)
            setProgreso(null)
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
                    {puedeEliminar && !loadingDet && !verificando && !isProcesando && (
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
                            Tiene cobros registrados: para eliminarla, primero revierte la planilla en Cliente Cobranza.
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
                                Sin cobros para procesar
                            </div>
                        ) : planilla.estado === 'validado' && (procesada ? (
                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">
                                <CheckCheck className="h-3.5 w-3.5" />
                                Procesada · {conCobro.length} amortización(es) registradas
                            </div>
                        ) : (
                            <Button
                                size="sm"
                                className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
                                onClick={handleAbrirModal}
                                disabled={isProcesando || verificando}
                            >
                                {isProcesando || verificando
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <PlayCircle className="h-3.5 w-3.5" />}
                                {isProcesando ? (progreso ? `Procesando ${progreso.hechas} de ${progreso.total}...` : 'Procesando...')
                                    : verificando ? 'Verificando...'
                                    : parcial ? `Procesar pendientes (${pendientes!.length} de ${conCobro.length})`
                                    : 'Procesar'}
                            </Button>
                        ))}
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

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Confirmar procesamiento
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground pt-1">
                            {parcial
                                ? <>Se registrarán las {pendientes!.length} amortización(es) que faltan (de {conCobro.length}) para</>
                                : <>Se registrarán {conCobro.length} amortización(es) para</>}
                            {' '}la planilla <span className="font-mono font-semibold text-foreground">{planilla.numero_planilla}</span>.
                            {sinCobro > 0 && <> {sinCobro} documento(s) sin importe cobrado no se registran.</>}{' '}
                            Completa los campos requeridos antes de continuar.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">

                        <div className="bg-muted border border-border rounded-lg px-4 py-3 grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <p className="text-muted-foreground uppercase tracking-wider text-[10px]">Vendedor</p>
                                <p className="font-medium text-foreground mt-0.5 truncate">{planilla.nombre_vendedor}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground uppercase tracking-wider text-[10px]">Total cobrado</p>
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