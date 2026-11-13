'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, Save, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from '@/app/hooks/useToast'
import { mensajeError } from '@/app/services/contabilidad/InformesContablesService'
import { PlanCuentasService } from '@/app/services/contabilidad/PlanCuentasService'
import { CatalogosPlan, TipoMaestro } from '@/app/types/plan-cuentas-types'

/** Mantenimientos de los botones del form [Plan Contable]. */
export type ClaveMaestro = 'tipo-cuenta' | 'concepto-eeff' | 'cuenta-sunat' | 'amarre-cargo' | 'amarre-abono'

interface Registro { id: number | null; codigo: string; descripcion: string; extra: string }
interface Def {
    titulo: string; access: string; tipo: TipoMaestro; lado?: 'CARGO' | 'ABONO'
    /** Campos que se editan: código (si lo tiene), descripción y extra (cuenta principal de los amarres). */
    codigo?: string; extra?: string; idEditable?: boolean
    lista: (c: CatalogosPlan) => Registro[]
    cuerpo: (r: Registro, anterior: Registro | null) => Record<string, unknown>
}

const DEFS: Record<ClaveMaestro, Def> = {
    'tipo-cuenta': {
        titulo: 'Tipo de cuenta contable', access: 'Form [Tipo de Cuenta Contable] · tabla tipo_cta_contable', tipo: 'tipo-cuenta', idEditable: true,
        lista: (c) => c.tipos.map(t => ({ id: t.id, codigo: String(t.id), descripcion: t.nombre, extra: '' })),
        cuerpo: (r, ant) => ({ idAnterior: ant?.id ?? null, id: r.codigo, descripcion: r.descripcion }),
    },
    'concepto-eeff': {
        titulo: 'Conceptos de estados financieros', access: 'Form [Conceptos EEFF] · tabla mconceptos estados financieros', tipo: 'concepto-eeff',
        lista: (c) => c.conceptos.map(t => ({ id: t.id, codigo: String(t.id), descripcion: t.nombre, extra: '' })),
        cuerpo: (r) => ({ id: r.id, descripcion: r.descripcion }),
    },
    'cuenta-sunat': {
        titulo: 'Cuentas SUNAT', access: 'Form [Cuentas SUNAT] · tabla sunat_cuentas', tipo: 'cuenta-sunat', codigo: 'Código SUNAT',
        lista: (c) => c.sunat.map(t => ({ id: t.id, codigo: t.codigo ?? '', descripcion: t.nombre, extra: '' })),
        cuerpo: (r) => ({ id: r.id, codigo: r.codigo, descripcion: r.descripcion }),
    },
    'amarre-cargo': {
        titulo: 'Cuentas de destino — Cargos', access: 'Form [Plan Ctas Destino Cargos] · tabla mplanctasdestinocargos', tipo: 'destino', lado: 'CARGO',
        codigo: 'Cuenta (código)', extra: 'Cuenta principal',
        lista: (c) => c.destinosCargo.map(d => ({ id: d.id, codigo: d.codigo ?? '', descripcion: d.nombre ?? '', extra: d.cuentaPr ?? '' })),
        cuerpo: (r) => ({ lado: 'CARGO', id: r.id, codigo: r.codigo, descripcion: r.descripcion, cuentaPr: r.extra }),
    },
    'amarre-abono': {
        titulo: 'Cuentas de destino — Abonos', access: 'Form [Plan Ctas Destino Abonos] · tabla mplanctasdestinoabonos', tipo: 'destino', lado: 'ABONO',
        codigo: 'Cuenta (código)', extra: 'Cuenta principal',
        lista: (c) => c.destinosAbono.map(d => ({ id: d.id, codigo: d.codigo ?? '', descripcion: d.nombre ?? '', extra: d.cuentaPr ?? '' })),
        cuerpo: (r) => ({ lado: 'ABONO', id: r.id, codigo: r.codigo, descripcion: r.descripcion, cuentaPr: r.extra }),
    },
}

const vacio = (): Registro => ({ id: null, codigo: '', descripcion: '', extra: '' })

interface Props { clave: ClaveMaestro | null; catalogos: CatalogosPlan | null; onCerrar: () => void; onCambio: () => void }

/** Lista + ficha de un maestro: Buscar, Guardar y nuevo, Modificar, Eliminar Registro (igual que los forms Access). */
export function MaestroDialog({ clave, catalogos, onCerrar, onCambio }: Props) {
    const def = clave ? DEFS[clave] : null
    const [buscar, setBuscar] = useState('')
    const [actual, setActual] = useState<Registro | null>(null)
    const [r, setR] = useState<Registro>(vacio())
    const [ocupado, setOcupado] = useState(false)
    useEffect(() => { setBuscar(''); setActual(null); setR(vacio()) }, [clave])

    const lista = useMemo(() => {
        if (!def || !catalogos) return []
        const t = buscar.trim().toLowerCase()
        const todos = def.lista(catalogos)
        return (t ? todos.filter(x => `${x.codigo} ${x.descripcion} ${x.extra}`.toLowerCase().includes(t)) : todos).slice(0, 300)
    }, [def, catalogos, buscar])

    if (!def) return null
    const elegir = (x: Registro) => { setActual(x); setR({ ...x }) }
    const nuevo = () => { setActual(null); setR(vacio()) }

    async function guardar() {
        setOcupado(true)
        try {
            await PlanCuentasService.guardarMaestro(def!.tipo, def!.cuerpo(r, actual))
            toast({ title: actual ? 'Registro modificado' : 'Registro guardado' })
            onCambio(); nuevo()
        } catch (e) {
            toast({ title: 'No se pudo guardar', description: await mensajeError(e, 'Intenta nuevamente.'), variant: 'destructive' })
        } finally { setOcupado(false) }
    }

    async function eliminar() {
        if (!actual?.id && actual?.id !== 0) return
        if (!window.confirm(`¿Eliminar "${actual.codigo} ${actual.descripcion}"?`)) return
        setOcupado(true)
        try {
            await PlanCuentasService.eliminarMaestro(def!.tipo, actual.id as number, def!.lado)
            toast({ title: 'Registro eliminado' })
            onCambio(); nuevo()
        } catch (e) {
            toast({ title: 'No se puede eliminar', description: await mensajeError(e, 'Intenta nuevamente.'), variant: 'destructive' })
        } finally { setOcupado(false) }
    }

    const etiquetaCodigo = def.idEditable ? 'Código (Id)' : def.codigo
    return (
        <Dialog open={!!clave} onOpenChange={(o) => !o && onCerrar()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{def.titulo}</DialogTitle>
                    <DialogDescription>{def.access}</DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
                    <div className="flex flex-col gap-2 min-w-0">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-8 h-9" placeholder="Buscar" value={buscar} onChange={e => setBuscar(e.target.value)} />
                        </div>
                        <div className="border rounded-md max-h-[50vh] overflow-y-auto divide-y text-sm">
                            {lista.length === 0 && <p className="p-3 text-muted-foreground text-xs">Sin registros.</p>}
                            {lista.map(x => (
                                <button key={`${x.id}-${x.codigo}`} type="button" onClick={() => elegir(x)}
                                        className={cn('w-full text-left px-3 py-1.5 hover:bg-muted', actual?.id === x.id && 'bg-blue-50 dark:bg-blue-950/40')}>
                                    <span className="font-mono text-xs mr-2">{x.codigo}</span>{x.descripcion}
                                    {x.extra && <span className="block text-[11px] text-muted-foreground">{x.extra}</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">{actual ? 'Modificar' : 'Nuevo registro'}</p>
                        {(def.idEditable || def.codigo) && (
                            <div className="flex flex-col gap-1"><Label className="text-xs">{etiquetaCodigo}</Label>
                                <Input className="h-9 font-mono" value={r.codigo} onChange={e => setR({ ...r, codigo: e.target.value })} /></div>
                        )}
                        {!def.idEditable && !def.codigo && actual && (
                            <div className="flex flex-col gap-1"><Label className="text-xs">Id</Label><Input className="h-9" value={r.id ?? ''} disabled /></div>
                        )}
                        <div className="flex flex-col gap-1"><Label className="text-xs">Descripción</Label>
                            <Input className="h-9" value={r.descripcion} onChange={e => setR({ ...r, descripcion: e.target.value })} /></div>
                        {def.extra && (
                            <div className="flex flex-col gap-1"><Label className="text-xs">{def.extra}</Label>
                                <Input className="h-9" value={r.extra} onChange={e => setR({ ...r, extra: e.target.value })} /></div>
                        )}
                        <div className="flex flex-wrap gap-2 pt-1">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white" disabled={ocupado} onClick={guardar}>
                                {ocupado ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{actual ? 'Modificar' : 'Guardar y nuevo'}
                            </Button>
                            <Button variant="outline" onClick={nuevo}><Plus className="mr-2 h-4 w-4" />Nuevo</Button>
                            {actual && <Button variant="outline" className="text-red-600 border-red-200" disabled={ocupado} onClick={eliminar}><Trash2 className="mr-2 h-4 w-4" />Eliminar registro</Button>}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
