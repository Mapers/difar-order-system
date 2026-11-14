'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Loader2, Percent, Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/app/hooks/useToast'
import { IgvService } from '@/app/services/contabilidad/DatosGeneralesService'
import { FichaIgv, FilaIgv, Opcion, Uso } from '@/app/types/datos-generales-types'
import {
    AlertaUso, AvisoAmbar, CabeceraMantenimiento, Campo, claseInput, Combo, Confirmar, fechaCorta, textoError,
} from '@/components/contabilidad/datos-generales/comunes'

const vacia = (): FichaIgv => ({ id: null, tasa: '', concepto: 'IGV', fechaInicio: '', fechaFinal: '', ctaDebito: '', ctaCredito: '' })
/** 0.18 -> "18" (Access muestra la tasa con formato porcentaje). */
const aPorcentaje = (t: number) => String(Math.round(t * 1000000) / 10000)
const fichaDe = (f: FilaIgv): FichaIgv => ({
    id: f.idIGV, tasa: aPorcentaje(f.Tasa), concepto: f.Concepto ?? '', fechaInicio: f.FechaInicio ?? '', fechaFinal: f.FechaFinal ?? '',
    ctaDebito: f.CtaContab ? String(f.CtaContab) : '', ctaCredito: f.CtaContabCredito ? String(f.CtaContabCredito) : '',
})
const docs = (f: FilaIgv) => f.compras + f.ventas_contables + f.guias + f.comprobantes_web

/**
 * IGV (Access: Datos Fijos › Datos Generales › IGV, form [IGV]): Tasa, Concepto, FechaInicio, FechaFinal,
 * CtaIGV Debito y CtaIGV Credito. Guardar y nuevo, Modificar y Eliminar Registro (solo si ningún documento usa la tasa).
 */
export default function IgvPage() {
    const [filas, setFilas] = useState<FilaIgv[]>([])
    const [cuentas, setCuentas] = useState<Opcion[]>([])
    const [cargando, setCargando] = useState(false)
    const [aviso, setAviso] = useState('')
    const [abierta, setAbierta] = useState(false)
    const [f, setF] = useState<FichaIgv>(vacia())
    const [avisoFicha, setAvisoFicha] = useState('')
    const [guardando, setGuardando] = useState(false)
    const [preguntaEliminar, setPreguntaEliminar] = useState(false)
    const [usos, setUsos] = useState<Uso[] | null>(null)

    const cargar = useCallback(async () => {
        setCargando(true); setAviso('')
        try { setFilas(await IgvService.listar()) } catch (e) { setAviso(await textoError(e, 'No se pudo cargar el IGV.')) } finally { setCargando(false) }
    }, [])
    useEffect(() => {
        cargar()
        IgvService.cuentas().then(setCuentas).catch(async (e) => setAviso(await textoError(e, 'No se pudieron cargar las cuentas IGV.')))
    }, [cargar])

    const abrir = (x: FichaIgv) => { setF(x); setAvisoFicha(''); setAbierta(true) }
    const set = (p: Partial<FichaIgv>) => { setF((x) => ({ ...x, ...p })); setAvisoFicha('') }

    function validar(): string {
        const t = Number(f.tasa.replace(',', '.'))
        if (!f.tasa.trim() || !Number.isFinite(t) || t < 0 || t >= 100) return 'Ingrese la tasa en porcentaje, de 0 a menos de 100 (18 = 18 %).'
        if (f.fechaInicio && f.fechaFinal && f.fechaFinal < f.fechaInicio) return 'La fecha final no puede ser anterior a la fecha de inicio.'
        if (!f.ctaDebito || !f.ctaCredito) return 'Seleccione la CtaIGV Débito y la CtaIGV Crédito (40101, cuenta de registros).'
        return ''
    }

    async function guardar() {
        const e = validar()
        if (e) { setAvisoFicha(e); return }
        setGuardando(true)
        try {
            await IgvService.guardar(f)
            toast({ title: f.id ? 'IGV modificado' : 'IGV guardado', description: `${f.tasa} % ${f.concepto}` })
            cargar()
            if (f.id) setAbierta(false); else setF(vacia())
        } catch (er) { setAvisoFicha(await textoError(er)) } finally { setGuardando(false) }
    }

    async function eliminar() {
        if (!f.id) return
        setPreguntaEliminar(false); setGuardando(true)
        try {
            const r = await IgvService.eliminar(f.id)
            if (!r.eliminado) { setUsos(r.usos); return }
            toast({ title: 'IGV eliminado', description: `${f.tasa} %` })
            setAbierta(false); cargar()
        } catch (er) { setAvisoFicha(await textoError(er)) } finally { setGuardando(false) }
    }

    return (
        <div className="flex flex-col gap-4 p-0 md:p-2">
            <CabeceraMantenimiento icono={<Percent className="h-5 w-5" />} titulo="IGV" descripcion="Tasas de IGV con su vigencia y sus cuentas contables.">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white" onClick={() => abrir(vacia())}><Plus className="mr-1.5 h-4 w-4" /> Nueva tasa</Button>
            </CabeceraMantenimiento>
            <AvisoAmbar mensaje={aviso} onCerrar={() => setAviso('')} />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {cargando && !filas.length && <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</p>}
                {filas.map((x) => (
                    <Card key={x.idIGV} onClick={() => abrir(fichaDe(x))} className="cursor-pointer p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-2xl font-bold tabular-nums text-foreground">{aPorcentaje(x.Tasa)} %</p>
                                <p className="text-sm text-muted-foreground">{x.Concepto || 'Sin concepto'}</p>
                            </div>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{docs(x).toLocaleString('es-PE')} doc.</span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">Vigencia: {fechaCorta(x.FechaInicio) || '—'} → {fechaCorta(x.FechaFinal) || 'sin fin'}</p>
                        <p className="text-xs text-muted-foreground">Débito {x.CodCtaDebito ?? '—'} · Crédito {x.CodCtaCredito ?? '—'}</p>
                        {x.aviso_fechas_invertidas && <p className="mt-1 text-xs text-amber-600">La fecha final es anterior a la de inicio.</p>}
                        {(!x.CtaContab || !x.CtaContabCredito) && <p className="mt-1 text-xs text-amber-600">Sin cuentas IGV: al modificarla habrá que elegirlas.</p>}
                    </Card>
                ))}
            </div>

            <Dialog open={abierta} onOpenChange={(o) => !o && setAbierta(false)}>
                <DialogContent className="max-h-[94vh] max-w-lg overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{f.id ? `IGV ${f.tasa} %` : 'Nueva tasa de IGV'}</DialogTitle>
                        <DialogDescription>Los campos con (*) son obligatorios.</DialogDescription>
                    </DialogHeader>
                    <AvisoAmbar mensaje={avisoFicha} onCerrar={() => setAvisoFicha('')} />
                    <div className="grid grid-cols-2 gap-3">
                        <Campo label="Tasa (%)" obligatorio>
                            <input inputMode="decimal" className={`${claseInput} text-right font-mono`} placeholder="18" value={f.tasa} onChange={(e) => set({ tasa: e.target.value })} />
                        </Campo>
                        <Campo label="Concepto"><input maxLength={50} className={claseInput} value={f.concepto} onChange={(e) => set({ concepto: e.target.value })} /></Campo>
                        <Campo label="FechaInicio"><input type="date" className={claseInput} value={f.fechaInicio} onChange={(e) => set({ fechaInicio: e.target.value })} /></Campo>
                        <Campo label="FechaFinal"><input type="date" className={claseInput} value={f.fechaFinal} onChange={(e) => set({ fechaFinal: e.target.value })} /></Campo>
                        <Campo label="CtaIGV Debito" obligatorio className="col-span-2"><Combo items={cuentas} valor={f.ctaDebito} onCambio={(v) => set({ ctaDebito: v })} conCodigo /></Campo>
                        <Campo label="CtaIGV Credito" obligatorio className="col-span-2"><Combo items={cuentas} valor={f.ctaCredito} onCambio={(v) => set({ ctaCredito: v })} conCodigo /></Campo>
                    </div>
                    {f.id && <p className="text-xs text-muted-foreground">Si la tasa ya tiene documentos no se puede cambiar el porcentaje: cree una tasa nueva.</p>}
                    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
                        <div>{f.id && <Button variant="ghost" className="w-full text-red-600 sm:w-auto" disabled={guardando} onClick={() => setPreguntaEliminar(true)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar registro</Button>}</div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setAbierta(false)}>Cerrar</Button>
                            <Button className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 text-white" disabled={guardando} onClick={guardar}>
                                {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{f.id ? 'Modificar' : 'Guardar y nuevo'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Confirmar abierto={preguntaEliminar} titulo={`¿Eliminar la tasa de ${f.tasa} %?`} peligro textoAccion="Eliminar"
                       descripcion="Solo se elimina si ninguna compra, venta, guía o comprobante usa esa tasa."
                       onCancelar={() => setPreguntaEliminar(false)} onAceptar={eliminar} />
            <AlertaUso titulo={`No se puede eliminar la tasa de ${f.tasa} %`} usos={usos} onCerrar={() => setUsos(null)} />
        </div>
    )
}
