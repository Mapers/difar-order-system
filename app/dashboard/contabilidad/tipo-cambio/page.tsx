'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { DollarSign, Eraser, Loader2, Pencil, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from '@/app/hooks/useToast'
import { cn } from '@/lib/utils'
import { TipoCambioService } from '@/app/services/contabilidad/DatosGeneralesService'
import { FechaFaltante, FilaTipoCambio, Uso } from '@/app/types/datos-generales-types'
import {
    AlertaUso, AvisoAmbar, CabeceraMantenimiento, Campo, claseInput, Confirmar, fechaCorta, hoy, textoError, VerMas,
} from '@/components/contabilidad/datos-generales/comunes'

const PASO = 100
const inicioAnio = () => `${new Date().getFullYear()}-01-01`
const tc = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 3, maximumFractionDigits: 4 })

interface Formulario { fecha: string; compra: string; venta: string; editando: boolean }
const vacio = (): Formulario => ({ fecha: hoy(), compra: '', venta: '', editando: false })

/**
 * Tipo de Cambio (Access: Datos Fijos › Datos Generales › TipoCambio, form [Tipo de Cambio]).
 * Igual que Access: Fecha, Compra y Venta arriba y la lista abajo; Guardar y nuevo, Modificar y
 * Eliminar Registro. Además avisa las fechas con documentos en dólares que no tienen tipo de cambio.
 */
export default function TipoCambioPage() {
    const [desde, setDesde] = useState(inicioAnio())
    const [hasta, setHasta] = useState(hoy())
    const [filas, setFilas] = useState<FilaTipoCambio[]>([])
    const [faltantes, setFaltantes] = useState<FechaFaltante[]>([])
    const [cargando, setCargando] = useState(false)
    const [guardando, setGuardando] = useState(false)
    const [aviso, setAviso] = useState('')
    const [avisoForm, setAvisoForm] = useState('')
    const [form, setForm] = useState<Formulario>(vacio())
    const [mostrar, setMostrar] = useState(PASO)
    const [confirmarMayor, setConfirmarMayor] = useState(false)
    const [preguntaEliminar, setPreguntaEliminar] = useState(false)
    const [usos, setUsos] = useState<Uso[] | null>(null)

    const cargar = useCallback(async () => {
        if (desde && hasta && desde > hasta) { setAviso('La fecha desde no puede ser posterior a la fecha hasta.'); return }
        setCargando(true); setAviso('')
        try {
            const [l, f] = await Promise.all([TipoCambioService.listar(desde, hasta), TipoCambioService.faltantes(desde, hasta)])
            setFilas(l); setFaltantes(f); setMostrar(PASO)
        } catch (e) { setAviso(await textoError(e, 'No se pudo cargar el tipo de cambio.')) } finally { setCargando(false) }
    }, [desde, hasta])
    useEffect(() => { cargar() }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const set = (p: Partial<Formulario>) => { setForm((x) => ({ ...x, ...p })); setAvisoForm('') }
    const editar = (f: FilaTipoCambio) => { setForm({ fecha: f.Fecha, compra: String(f.Compra), venta: String(f.Venta), editando: true }); setAvisoForm('') }
    const visibles = useMemo(() => filas.slice(0, mostrar), [filas, mostrar])

    function validar(): string {
        const c = Number(form.compra.replace(',', '.')), v = Number(form.venta.replace(',', '.'))
        if (!form.fecha) return 'Ingrese la fecha.'
        if (!form.compra.trim() || !(c > 0)) return 'Ingrese el tipo de cambio de compra mayor a cero.'
        if (!form.venta.trim() || !(v > 0)) return 'Ingrese el tipo de cambio de venta mayor a cero.'
        if (!form.editando && filas.some((x) => x.Fecha === form.fecha)) return `Ya hay tipo de cambio para el ${fechaCorta(form.fecha)}: selecciónalo en la lista y usa Modificar.`
        return ''
    }

    async function guardar(confirmado = false) {
        const error = validar()
        if (error) { setAvisoForm(error); return }
        if (!confirmado && Number(form.compra.replace(',', '.')) > Number(form.venta.replace(',', '.'))) { setConfirmarMayor(true); return }
        setGuardando(true)
        try {
            await TipoCambioService.guardar(!form.editando, form.fecha, form.compra.replace(',', '.'), form.venta.replace(',', '.'))
            toast({ title: form.editando ? 'Tipo de cambio modificado' : 'Tipo de cambio guardado', description: `${fechaCorta(form.fecha)}: compra ${form.compra} · venta ${form.venta}` })
            setForm(vacio())
            cargar()
        } catch (e) { setAvisoForm(await textoError(e)) } finally { setGuardando(false) }
    }

    async function eliminar() {
        setPreguntaEliminar(false); setGuardando(true)
        try {
            const r = await TipoCambioService.eliminar(form.fecha)
            if (!r.eliminado) { setUsos(r.usos); return }
            toast({ title: 'Tipo de cambio eliminado', description: fechaCorta(form.fecha) })
            setForm(vacio()); cargar()
        } catch (e) { setAvisoForm(await textoError(e)) } finally { setGuardando(false) }
    }

    return (
        <div className="flex flex-col gap-4 p-0 md:p-2">
            <CabeceraMantenimiento icono={<DollarSign className="h-5 w-5" />} titulo="Tipo de Cambio"
                                   descripcion="Tipo de cambio del dólar por fecha (compra y venta). Se usa en compras, ventas y caja en dólares." />

            {/* ---------- ficha (como en Access: Fecha, Compra, Venta) */}
            <Card className="p-3 shadow-md sm:p-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:items-end">
                    <Campo label="Fecha:" obligatorio className="col-span-2 sm:col-span-1">
                        <input type="date" className={claseInput} value={form.fecha} disabled={form.editando} onChange={(e) => set({ fecha: e.target.value })} />
                    </Campo>
                    <Campo label="Compra:" obligatorio>
                        <input inputMode="decimal" placeholder="0.0000" className={`${claseInput} text-right font-mono`} value={form.compra} onChange={(e) => set({ compra: e.target.value })} />
                    </Campo>
                    <Campo label="Venta:" obligatorio>
                        <input inputMode="decimal" placeholder="0.0000" className={`${claseInput} text-right font-mono`} value={form.venta} onChange={(e) => set({ venta: e.target.value })} />
                    </Campo>
                    <div className="col-span-2 flex flex-wrap gap-2 sm:col-span-1">
                        <Button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white" disabled={guardando} onClick={() => guardar()}>
                            {guardando ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : form.editando ? <Pencil className="mr-1.5 h-4 w-4" /> : <Save className="mr-1.5 h-4 w-4" />}
                            {form.editando ? 'Modificar' : 'Guardar y nuevo'}
                        </Button>
                        {form.editando && (
                            <>
                                <Button variant="outline" size="icon" title="Eliminar registro" className="text-red-600" disabled={guardando} onClick={() => setPreguntaEliminar(true)}><Trash2 className="h-4 w-4" /></Button>
                                <Button variant="outline" size="icon" title="Limpiar" onClick={() => setForm(vacio())}><Eraser className="h-4 w-4" /></Button>
                            </>
                        )}
                    </div>
                </div>
                {form.editando && <p className="mt-2 text-xs text-muted-foreground">Modificando el {fechaCorta(form.fecha)}. La fecha no se cambia: para otra fecha usa Limpiar.</p>}
                <AvisoAmbar className="mt-3" mensaje={avisoForm} onCerrar={() => setAvisoForm('')} />
            </Card>

            <AvisoAmbar mensaje={aviso} onCerrar={() => setAviso('')} />
            {faltantes.length > 0 && (
                <AvisoAmbar mensaje={
                    <div>
                        <p className="font-medium">Hay {faltantes.length} fecha(s) con documentos en dólares sin tipo de cambio en el rango:</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {faltantes.map((f) => (
                                <button key={f.Fecha} onClick={() => setForm({ ...vacio(), fecha: f.Fecha })} title={`Compras: ${f.compras_usd} · Ventas: ${f.ventas_usd}`}
                                        className="rounded-full border border-amber-300 bg-white px-2 py-0.5 font-mono text-xs hover:bg-amber-100 dark:bg-transparent">
                                    {fechaCorta(f.Fecha)}
                                </button>
                            ))}
                        </div>
                        <p className="mt-1 text-xs">Toca una fecha para cargarla en la ficha.</p>
                    </div>
                } />
            )}

            {/* ---------- lista */}
            <Card className="overflow-hidden shadow-md">
                <form className="flex flex-wrap items-end gap-2 border-b border-border p-3 sm:p-4" onSubmit={(e) => { e.preventDefault(); cargar() }}>
                    <Campo label="Desde" className="w-[calc(50%-4px)] sm:w-40"><input type="date" className={claseInput} value={desde} onChange={(e) => setDesde(e.target.value)} /></Campo>
                    <Campo label="Hasta" className="w-[calc(50%-4px)] sm:w-40"><input type="date" className={claseInput} value={hasta} onChange={(e) => setHasta(e.target.value)} /></Campo>
                    <Button type="submit" variant="outline" className="h-9 w-full sm:w-auto" disabled={cargando}>{cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}</Button>
                </form>
                {!filas.length ? (
                    <p className="p-10 text-center text-sm text-muted-foreground">{cargando ? 'Cargando…' : 'No hay tipo de cambio en ese rango.'}</p>
                ) : (
                    <>
                        <table className="w-full text-sm">
                            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                <tr><th className="px-3 py-2">Fecha</th><th className="px-3 py-2 text-right">Compra</th><th className="px-3 py-2 text-right">Venta</th>
                                    <th className="hidden px-3 py-2 text-right sm:table-cell">Docs. USD</th></tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {visibles.map((f) => (
                                    <tr key={f.Fecha} onClick={() => editar(f)}
                                        className={cn('cursor-pointer hover:bg-blue-50/60 dark:hover:bg-blue-950/30', form.editando && form.fecha === f.Fecha && 'bg-blue-50 dark:bg-blue-950/40')}>
                                        <td className="px-3 py-1.5 font-mono text-xs">{fechaCorta(f.Fecha)}</td>
                                        <td className={cn('px-3 py-1.5 text-right font-mono tabular-nums', f.aviso_compra_mayor_venta && 'text-amber-600')} title={f.aviso_compra_mayor_venta ? 'Compra mayor que venta' : undefined}>{tc(f.Compra)}</td>
                                        <td className="px-3 py-1.5 text-right font-mono tabular-nums">{tc(f.Venta)}</td>
                                        <td className="hidden px-3 py-1.5 text-right text-xs text-muted-foreground sm:table-cell">{f.compras_usd + f.ventas_usd || ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="border-t border-border px-3"><VerMas mostrados={mostrar} total={filas.length} onMas={() => setMostrar((n) => n + PASO)} /></div>
                    </>
                )}
            </Card>

            <Confirmar abierto={confirmarMayor} titulo="Revisa antes de guardar" textoAccion="Guardar igual"
                       avisos={[`La compra (${form.compra}) es mayor que la venta (${form.venta}).`]}
                       onCancelar={() => setConfirmarMayor(false)} onAceptar={() => { setConfirmarMayor(false); guardar(true) }} />
            <Confirmar abierto={preguntaEliminar} titulo={`¿Eliminar el tipo de cambio del ${fechaCorta(form.fecha)}?`} peligro textoAccion="Eliminar"
                       descripcion="Solo se elimina si no hay compras ni ventas en dólares con esa fecha."
                       onCancelar={() => setPreguntaEliminar(false)} onAceptar={eliminar} />
            <AlertaUso titulo={`No se puede eliminar el ${fechaCorta(form.fecha)}`} usos={usos} onCerrar={() => setUsos(null)} />
        </div>
    )
}
