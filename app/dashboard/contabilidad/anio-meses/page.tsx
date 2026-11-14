'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { CalendarDays, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from '@/app/hooks/useToast'
import { cn } from '@/lib/utils'
import { AnioMesesService } from '@/app/services/contabilidad/DatosGeneralesService'
import { FilaAnio, FilaMes, Uso } from '@/app/types/datos-generales-types'
import { AlertaUso, AvisoAmbar, CabeceraMantenimiento, Campo, claseInput, Confirmar, textoError } from '@/components/contabilidad/datos-generales/comunes'

const ANIO_ACTUAL = String(new Date().getFullYear())
const registros = (a: FilaAnio) => a.mayor_auxiliar + a.diario + a.compras + a.ventas

/**
 * Año y Meses (Access: Datos Fijos › Datos Generales › Año y Meses).
 *   Año: Guardar y nuevo y Eliminar Registro (solo si no tiene registros contables ni es el año en curso).
 *   Meses: solo Modificar el nombre y los días (no hay alta ni baja: los meses son la clave de 16 tablas).
 */
export default function AnioMesesPage() {
    const [anios, setAnios] = useState<FilaAnio[]>([])
    const [meses, setMeses] = useState<FilaMes[]>([])
    const [edicion, setEdicion] = useState<Record<string, { mes: string; dias: string }>>({})
    const [nuevo, setNuevo] = useState('')
    const [cargando, setCargando] = useState(false)
    const [ocupado, setOcupado] = useState('')
    const [aviso, setAviso] = useState('')
    const [avisoAnio, setAvisoAnio] = useState('')
    const [avisoMes, setAvisoMes] = useState('')
    const [eliminarAnio, setEliminarAnio] = useState<string | null>(null)
    const [usos, setUsos] = useState<{ anio: string; usos: Uso[] } | null>(null)

    const cargar = useCallback(async () => {
        setCargando(true); setAviso('')
        try {
            const [a, m] = await Promise.all([AnioMesesService.anios(), AnioMesesService.meses()])
            setAnios(a); setMeses(m)
            setEdicion(Object.fromEntries(m.map((x) => [x.Numero, { mes: x.Mes, dias: String(x.Dias) }])))
        } catch (e) { setAviso(await textoError(e, 'No se pudieron cargar los años y meses.')) } finally { setCargando(false) }
    }, [])
    useEffect(() => { cargar() }, [cargar])

    async function crearAnio() {
        const a = nuevo.trim()
        if (!/^20\d{2}$/.test(a)) { setAvisoAnio('Ingrese un año de 4 dígitos (2000-2099).'); return }
        if (anios.some((x) => x.Anio === a)) { setAvisoAnio(`El año ${a} ya existe.`); return }
        setOcupado('anio')
        try {
            await AnioMesesService.crearAnio(a)
            toast({ title: 'Año creado', description: a })
            setNuevo(''); cargar()
        } catch (e) { setAvisoAnio(await textoError(e)) } finally { setOcupado('') }
    }

    async function borrarAnio() {
        const a = eliminarAnio
        setEliminarAnio(null)
        if (!a) return
        setOcupado(a)
        try {
            const r = await AnioMesesService.eliminarAnio(a)
            if (!r.eliminado) { setUsos({ anio: a, usos: r.usos }); return }
            toast({ title: 'Año eliminado', description: a })
            cargar()
        } catch (e) { setAvisoAnio(await textoError(e)) } finally { setOcupado('') }
    }

    async function guardarMes(m: FilaMes) {
        const e = edicion[m.Numero]
        const dias = Number(e.dias)
        if (!e.mes.trim()) { setAvisoMes(`Ingrese el nombre del mes ${m.Numero}.`); return }
        if (!Number.isInteger(dias) || dias < 28 || dias > 31) { setAvisoMes(`Los días del mes ${m.Numero} deben estar entre 28 y 31.`); return }
        setOcupado(m.Numero)
        try {
            await AnioMesesService.guardarMes(m.Numero, e.mes.trim(), String(dias))
            toast({ title: 'Mes modificado', description: `${m.Numero} ${e.mes.trim()} (${dias} días)` })
            setAvisoMes(''); cargar()
        } catch (er) { setAvisoMes(await textoError(er)) } finally { setOcupado('') }
    }

    const cambiado = (m: FilaMes) => edicion[m.Numero] && (edicion[m.Numero].mes !== m.Mes || edicion[m.Numero].dias !== String(m.Dias))

    return (
        <div className="flex flex-col gap-4 p-0 md:p-2">
            <CabeceraMantenimiento icono={<CalendarDays className="h-5 w-5" />} titulo="Año y Meses"
                                   descripcion="Ejercicios (años) y meses que usan los libros y registros contables." />
            <AvisoAmbar mensaje={aviso} onCerrar={() => setAviso('')} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* ---------- Año */}
                <Card className="overflow-hidden shadow-md">
                    <div className="border-b border-border p-3 sm:p-4">
                        <h2 className="mb-2 text-sm font-semibold text-foreground">Año</h2>
                        <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); crearAnio() }}>
                            <Campo label="Año" obligatorio className="w-32">
                                <input inputMode="numeric" maxLength={4} placeholder="2035" className={`${claseInput} font-mono`} value={nuevo} onChange={(e) => { setNuevo(e.target.value.replace(/\D/g, '')); setAvisoAnio('') }} />
                            </Campo>
                            <Button type="submit" disabled={ocupado === 'anio'} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                {ocupado === 'anio' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />} Guardar y nuevo
                            </Button>
                        </form>
                        <AvisoAmbar className="mt-3" mensaje={avisoAnio} onCerrar={() => setAvisoAnio('')} />
                    </div>
                    <ul className="max-h-[60vh] divide-y divide-border overflow-y-auto">
                        {cargando && !anios.length && <li className="p-6 text-center text-sm text-muted-foreground">Cargando…</li>}
                        {anios.map((a) => {
                            const n = registros(a)
                            const actual = a.Anio === ANIO_ACTUAL
                            return (
                                <li key={a.Anio} className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4">
                                    <div className="min-w-0">
                                        <span className={cn('font-mono text-sm font-semibold', actual && 'text-blue-700 dark:text-blue-300')}>{a.Anio}</span>
                                        {actual && <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] text-blue-700 dark:bg-blue-950 dark:text-blue-300">en curso</span>}
                                        <p className="truncate text-[11px] text-muted-foreground">
                                            {n ? `Mayor ${a.mayor_auxiliar.toLocaleString('es-PE')} · Diario ${a.diario.toLocaleString('es-PE')} · Compras ${a.compras.toLocaleString('es-PE')} · Ventas ${a.ventas.toLocaleString('es-PE')}` : 'Sin registros'}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="shrink-0 text-red-600 disabled:text-muted-foreground" title={actual ? 'No se puede eliminar el año en curso' : n ? 'Tiene registros' : 'Eliminar registro'}
                                            disabled={actual || ocupado === a.Anio} onClick={() => setEliminarAnio(a.Anio)}>
                                        {ocupado === a.Anio ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </Button>
                                </li>
                            )
                        })}
                    </ul>
                </Card>

                {/* ---------- Meses */}
                <Card className="overflow-hidden shadow-md">
                    <div className="border-b border-border p-3 sm:p-4">
                        <h2 className="text-sm font-semibold text-foreground">Meses</h2>
                        <p className="text-xs text-muted-foreground">Solo se modifican el nombre y los días. Los meses no se crean ni se eliminan.</p>
                        <AvisoAmbar className="mt-3" mensaje={avisoMes} onCerrar={() => setAvisoMes('')} />
                    </div>
                    <div className="divide-y divide-border">
                        {meses.map((m) => (
                            <div key={m.Numero} className="grid grid-cols-[2.5rem_1fr_4.5rem_auto] items-center gap-2 px-3 py-1.5 sm:px-4">
                                <span className="font-mono text-sm text-muted-foreground">{m.Numero}</span>
                                <input aria-label={`Nombre del mes ${m.Numero}`} maxLength={50} className={claseInput} value={edicion[m.Numero]?.mes ?? ''}
                                       onChange={(e) => setEdicion((x) => ({ ...x, [m.Numero]: { ...x[m.Numero], mes: e.target.value } }))} />
                                <input aria-label={`Días del mes ${m.Numero}`} inputMode="numeric" maxLength={2} className={`${claseInput} text-right`} value={edicion[m.Numero]?.dias ?? ''}
                                       onChange={(e) => setEdicion((x) => ({ ...x, [m.Numero]: { ...x[m.Numero], dias: e.target.value.replace(/\D/g, '') } }))} />
                                <Button size="sm" variant={cambiado(m) ? 'default' : 'ghost'} disabled={!cambiado(m) || ocupado === m.Numero} title="Modificar" onClick={() => guardarMes(m)}>
                                    {ocupado === m.Numero ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                </Button>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <Confirmar abierto={!!eliminarAnio} titulo={`¿Eliminar el año ${eliminarAnio ?? ''}?`} peligro textoAccion="Eliminar"
                       descripcion="Solo se elimina si no tiene registros contables (mayor, diario, compras, ventas, caja, bancos, activos…)."
                       onCancelar={() => setEliminarAnio(null)} onAceptar={borrarAnio} />
            <AlertaUso titulo={`No se puede eliminar el año ${usos?.anio ?? ''}`} usos={usos?.usos ?? null} onCerrar={() => setUsos(null)} />
        </div>
    )
}
