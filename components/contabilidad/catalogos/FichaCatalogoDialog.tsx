'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Eye, Loader2, Lock, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ComboSelect } from '@/components/ui/combo-select'
import { cn } from '@/lib/utils'
import { toast } from '@/app/hooks/useToast'
import { mensajeError } from '@/app/services/contabilidad/InformesContablesService'
import { DatosControlService } from '@/app/services/contabilidad/DatosControlService'
import { CombosDatosControl, FilaCatalogo, OpcionCombo, UsoRegistro } from '@/app/types/datos-control-types'
import { AvisoAmbar } from './AvisoAmbar'
import { CampoDef, CatalogoDef, datosDe, revisar, valoresDe } from './definiciones'

interface Props {
    def: CatalogoDef
    /** null = registro nuevo. */
    fila: FilaCatalogo | null
    abierta: boolean
    combos: CombosDatosControl | null
    onCerrar: () => void
    onCambio: () => void
    onEliminar: (f: FilaCatalogo) => void
}

interface Opcion { clave: string; etiqueta: string; sub?: string }

const opcionesCombo = (c: CampoDef, combos: CombosDatosControl | null): Opcion[] =>
    ((c.combo && combos ? (combos[c.combo] as OpcionCombo[] | undefined) : undefined) ?? []).map(o => ({
        clave: String(c.porId ? o.id : o.codigo),
        etiqueta: o.cuenta ? `${o.cuenta} ${o.descripcion ?? ''}`.trim() : String(o.descripcion ?? o.codigo ?? ''),
        sub: o.cuenta ? undefined : String(o.codigo ?? ''),
    }))

/** Ficha de un registro (Access: Guardar y nuevo / Modificar / Eliminar Registro). */
export function FichaCatalogoDialog({ def, fila, abierta, combos, onCerrar, onCambio, onEliminar }: Props) {
    const sugerido = def.sugerido && combos ? combos[def.sugerido] : null
    const [v, setV] = useState<Record<string, string>>({})
    const [aviso, setAviso] = useState<string | null>(null)
    const [guardando, setGuardando] = useState(false)
    const [usos, setUsos] = useState<UsoRegistro[] | null>(null)
    const [otros, setOtros] = useState<Record<string, FilaCatalogo[]>>({})

    useEffect(() => {
        if (!abierta) return
        setV(valoresDe(def, fila, sugerido)); setAviso(null); setUsos(null)
        if (fila && !def.sinUso) {
            DatosControlService.uso(def.clave, fila.id, def.usoPorCodigo ? fila.codigo : undefined)
                .then(setUsos).catch(() => setUsos(null))
        }
        // Combos que salen de otro catálogo (p. ej. tipo de documento de la serie)
        for (const c of def.campos) {
            if (c.tipo === 'catalogo' && c.catalogo && !otros[c.catalogo]) {
                const cat = c.catalogo
                DatosControlService.listar(cat).then(l => setOtros(o => ({ ...o, [cat]: l }))).catch(() => {})
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [abierta, def, fila])

    const enUso = !!usos && usos.length > 0
    const totalUso = useMemo(() => (usos ?? []).reduce((s, u) => s + u.cantidad, 0), [usos])
    const soloConsulta = !!def.soloLectura
    const set = (k: string, x: string) => setV(p => ({ ...p, [k]: x }))

    async function guardar() {
        const falta = revisar(def, v)
        if (falta) { setAviso(falta); return }
        setGuardando(true); setAviso(null)
        try {
            await DatosControlService.guardar(def.clave, fila ? fila.id : null, datosDe(def, v))
            toast({ title: fila ? 'Registro modificado' : 'Registro guardado', description: def.titulo })
            onCambio(); onCerrar()
        } catch (e) {
            setAviso(await mensajeError(e, 'No se pudo guardar. Intenta nuevamente.'))
        } finally { setGuardando(false) }
    }

    function campo(c: CampoDef) {
        const bloqueadoPorUso = !!fila && !!c.esCodigo && enUso
        const deshabilitado = soloConsulta || !!c.soloVista || bloqueadoPorUso || guardando
        const valor = v[c.clave] ?? ''
        let control: React.ReactNode
        if (c.tipo === 'combo' || c.tipo === 'catalogo') {
            const items: Opcion[] = c.tipo === 'combo'
                ? opcionesCombo(c, combos)
                : (otros[c.catalogo ?? ''] ?? []).map(f => ({ clave: String(f.codigo ?? ''), etiqueta: String(f.descripcion ?? ''), sub: String(f.codigo ?? '') }))
            control = (
                <ComboSelect<Opcion> value={valor} items={items} disabled={deshabilitado}
                                     getKey={o => o.clave} getLabel={o => o.etiqueta} getSub={o => o.sub ?? ''}
                                     onChange={o => set(c.clave, o.clave)} placeholder="Seleccionar..." triggerClassName="h-9" />
            )
        } else if (c.tipo === 'opciones' || c.tipo === 'sino') {
            const ops = c.tipo === 'sino' ? [{ valor: '1', etiqueta: 'Sí' }, { valor: '0', etiqueta: 'No' }] : (c.opciones ?? [])
            control = (
                <Select value={valor || undefined} onValueChange={x => set(c.clave, x)} disabled={deshabilitado}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>{ops.map(o => <SelectItem key={o.valor} value={o.valor}>{o.etiqueta}</SelectItem>)}</SelectContent>
                </Select>
            )
        } else {
            control = (
                <Input className={cn('h-9', c.esCodigo && 'font-mono', c.mayusculas && 'uppercase')} value={valor} disabled={deshabilitado}
                       type={c.tipo === 'fecha' ? 'date' : 'text'} maxLength={c.max}
                       inputMode={c.tipo === 'entero' ? 'numeric' : c.tipo === 'decimal' ? 'decimal' : undefined}
                       onChange={e => set(c.clave, e.target.value)} />
            )
        }
        return (
            <div key={c.clave} className={cn('flex min-w-0 flex-col gap-1', c.ancho === 'completo' && 'sm:col-span-2')}>
                <Label className="flex items-center gap-1 text-xs">
                    {c.etiqueta}{c.obligatorio && !soloConsulta && <span className="text-amber-600">*</span>}
                    {bloqueadoPorUso && <Lock className="h-3 w-3 text-amber-500" aria-label="Bloqueado: en uso" />}
                </Label>
                {control}
                {bloqueadoPorUso
                    ? <p className="text-[11px] text-amber-700 dark:text-amber-300">En uso: el código no se puede cambiar.</p>
                    : c.ayuda && !soloConsulta && <p className="text-[11px] text-muted-foreground">{c.ayuda}</p>}
            </div>
        )
    }

    const puedeEliminar = !!fila && !soloConsulta && !def.sinEliminar
    return (
        <Dialog open={abierta} onOpenChange={(o) => !o && !guardando && onCerrar()}>
            <DialogContent className="w-[calc(100vw-1rem)] max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                        {soloConsulta && <Eye className="h-4 w-4 text-blue-600" />}
                        {def.titulo} · {fila ? (soloConsulta ? 'Consulta' : 'Modificar') : 'Nuevo registro'}
                    </DialogTitle>
                    <DialogDescription className="text-xs">{def.access}</DialogDescription>
                </DialogHeader>

                {soloConsulta && <AvisoAmbar titulo="Solo consulta">{def.nota}</AvisoAmbar>}
                {fila && enUso && (
                    <AvisoAmbar titulo={`En uso en ${usos!.length} ${usos!.length === 1 ? 'tabla' : 'tablas'} (${totalUso.toLocaleString('es-PE')} registros)`}>
                        No se puede eliminar{def.campos.some(c => c.esCodigo) ? ' ni cambiar su código' : ''}.{' '}
                        {usos!.slice(0, 4).map(u => u.descripcion).join(', ')}{usos!.length > 4 ? '…' : ''}
                    </AvisoAmbar>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{def.campos.map(campo)}</div>

                {aviso && <AvisoAmbar titulo="Revisa antes de guardar">{aviso}</AvisoAmbar>}

                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
                    <div>
                        {puedeEliminar && (
                            <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 sm:w-auto"
                                    disabled={guardando || enUso} onClick={() => onEliminar(fila!)}>
                                <Trash2 className="mr-2 h-4 w-4" />Eliminar registro
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 sm:flex-none" disabled={guardando} onClick={onCerrar}>Cerrar</Button>
                        {!soloConsulta && (
                            <Button disabled={guardando} onClick={guardar}
                                    className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 sm:flex-none">
                                {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {fila ? 'Modificar' : 'Guardar'}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
