'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Loader2, Package, Save, Search, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/app/hooks/useToast'
import { ArticulosService } from '@/app/services/contabilidad/DatosGeneralesService'
import { CatalogosArticulos, FichaArticulo, FilaArticulo, GrupoCuenta, Opcion, Uso } from '@/app/types/datos-generales-types'
import { AlertaUso, AvisoAmbar, Campo, claseInput, Combo, Confirmar, Seccion, texto, textoError } from '../comunes'
import { BuscarOsceDialog } from './BuscarOsceDialog'

export const fichaArticuloVacia = (): FichaArticulo => ({
    id: null, subGrupo: '', codigo: '', nombre: '', unidad: '', tipoExistencia: '',
    medida: '', tipo: '', modelo: '', marca: '', otros1: '', otros2: '',
    precio1: '', precio2: '', precio3: '', precio4: '', icbper: false,
    equivalencia: '1', fiscalizado: '', abreviado: '', osce: '', osceTexto: '', control: '', itemRelacionado: '',
    ctaCargoCosto: '', ctaAbonoCosto: '', ctaCostoVentas: '', ctaExistencias: '', ctaProduccion: '', ctaVentas: '',
})

const num = (v: unknown) => (v === null || v === undefined || v === '' ? '' : String(Number(v)))
/** Fila de la lista -> ficha (modificación). Conserva también los campos que no se ven (item relacionado). */
export const fichaArticuloDe = (a: FilaArticulo): FichaArticulo => ({
    id: a.IdArticulo, subGrupo: texto(a.SubLinea), codigo: texto(a.Codigo_Art), nombre: texto(a.NombreItem), unidad: texto(a.Unidad), tipoExistencia: texto(a.TipoExistencia),
    medida: texto(a.Medida), tipo: texto(a.Presentacion), modelo: texto(a.PrincipioAdictivo), marca: texto(a.idMarca), otros1: texto(a.otros1), otros2: texto(a.otros2),
    precio1: num(a.precio1), precio2: num(a.precio2), precio3: num(a.precio3), precio4: num(a.precio4), icbper: Number(a.icbper) === 1,
    equivalencia: texto(a.Equivalencia), fiscalizado: texto(a.Id_Fiscalizado), abreviado: texto(a.AbreviadoRelacionado),
    osce: texto(a.osce), osceTexto: a.osce ? `${texto(a.CodigoOsce)} ${texto(a.DescripcionOsce)}`.trim() : '', control: texto(a.CodigoAsisa),
    itemRelacionado: texto(a.Item_Relacionado),
    ctaCargoCosto: texto(a.CtaCargoCosto), ctaAbonoCosto: texto(a.CtaAbonoCosto), ctaCostoVentas: texto(a.CtaCargoCostoVtas),
    ctaExistencias: texto(a.CtaExistencias), ctaProduccion: texto(a.CtaProduccion), ctaVentas: texto(a.ctaVentas),
})

/** Valores ya usados en las "listas abiertas" de Access (Medida, Tipo, Modelo, Marca, Otros, Control). */
export type ListasAbiertas = Record<'medida' | 'tipo' | 'modelo' | 'marca' | 'otros1' | 'otros2' | 'control', string[]>

interface Props {
    abierta: boolean
    ficha: FichaArticulo | null
    /** Fila original (para mostrar el código de una cuenta que ya no está en su lista). */
    fila: FilaArticulo | null
    catalogos: CatalogosArticulos | null
    listas: ListasAbiertas
    onCerrar: () => void
    onCambio: () => void
}

const CUENTAS: { campo: keyof FichaArticulo; grupo: GrupoCuenta; label: string; codigo: keyof FilaArticulo }[] = [
    { campo: 'ctaCargoCosto', grupo: 'cargoCosto', label: 'Cuenta Contable Cargos', codigo: 'CodCtaCargoCosto' },
    { campo: 'ctaAbonoCosto', grupo: 'abonoCosto', label: 'Cuenta Contable Abonos', codigo: 'CodCtaAbonoCosto' },
    { campo: 'ctaCostoVentas', grupo: 'costoVentas', label: 'CtaContab Costo Ventas', codigo: 'CodCtaCostoVentas' },
    { campo: 'ctaExistencias', grupo: 'existencias', label: 'CtaContab Existencias', codigo: 'CodCtaExistencias' },
    { campo: 'ctaProduccion', grupo: 'produccion', label: 'CtaContab Produccion', codigo: 'CodCtaProduccion' },
    { campo: 'ctaVentas', grupo: 'ventas', label: 'CtaContab Ventas', codigo: 'CodCtaVentas' },
]

/** Ficha contable del artículo (form Access [Bienes y Servicios 2]): Guardar y nuevo / Modificar / Eliminar Registro. */
export function FichaArticuloDialog({ abierta, ficha, fila, catalogos, listas, onCerrar, onCambio }: Props) {
    const [f, setF] = useState<FichaArticulo>(fichaArticuloVacia())
    const [guardando, setGuardando] = useState(false)
    const [aviso, setAviso] = useState('')
    const [avisos, setAvisos] = useState<string[] | null>(null)
    const [preguntaEliminar, setPreguntaEliminar] = useState(false)
    const [usos, setUsos] = useState<Uso[] | null>(null)
    const [buscarOsce, setBuscarOsce] = useState(false)
    useEffect(() => { if (abierta) { setF(ficha ?? fichaArticuloVacia()); setAviso('') } }, [abierta, ficha])
    const set = (p: Partial<FichaArticulo>) => { setF((x) => ({ ...x, ...p })); setAviso('') }

    const subGrupos = useMemo<Opcion[]>(() => (catalogos?.subGrupos ?? []).map((s) => ({ id: s.id, codigo: s.codigo, nombre: `${s.nombre}${s.grupo ? ` · ${s.grupo}` : ''}` })), [catalogos])
    const unidades = useMemo<Opcion[]>(() => (catalogos?.unidades ?? []).map((u) => ({ id: u.id, nombre: `${u.nombre}${u.abreviatura ? ` (${u.abreviatura})` : ''}` })), [catalogos])

    const faltantes = [!f.subGrupo && 'SubGrupo', !f.nombre.trim() && 'Descripción del item', !f.unidad && 'Unidad Medida', !f.tipoExistencia && 'TipoExistencia'].filter(Boolean) as string[]

    async function guardar(confirmado = false) {
        if (faltantes.length) { setAviso(`Complete la información, luego guardar: ${faltantes.join(', ')}.`); return }
        if (f.codigo.trim() && (!/^\d{1,9}$/.test(f.codigo.trim()) || Number(f.codigo) === 0)) { setAviso('El código del item debe ser numérico, mayor a 0 y de hasta 9 dígitos (o déjalo vacío para que se genere).'); return }
        for (const [k, v] of [['% Precio 1', f.precio1], ['% Precio 2', f.precio2], ['% Precio 3', f.precio3], ['% Precio 4', f.precio4], ['Equivalencia', f.equivalencia], ['Marca', f.marca]] as const) {
            if (v.trim() && !Number.isFinite(Number(v.replace(',', '.')))) { setAviso(`${k} debe ser un número.`); return }
        }
        if (!confirmado) {
            const a: string[] = []
            if (f.id && ficha && ficha.codigo && f.codigo.trim() !== ficha.codigo) a.push(`Cambias el código ${ficha.codigo} → ${f.codigo.trim() || '(automático)'}: la app de ventas y los comprobantes usan el código. Si el artículo tiene movimientos no se podrá cambiar.`)
            if (f.id && ficha && f.nombre.trim() !== ficha.nombre) a.push('Cambias la descripción: también la verán la lista de precios y los pedidos de la app de ventas.')
            if (a.length) { setAvisos(a); return }
        }
        setGuardando(true)
        try {
            const r = await ArticulosService.guardar({ ...f, precio1: f.precio1.replace(',', '.'), precio2: f.precio2.replace(',', '.'), precio3: f.precio3.replace(',', '.'), precio4: f.precio4.replace(',', '.') })
            toast({ title: f.id ? 'Artículo modificado' : 'Artículo guardado', description: `${r.codigo || f.codigo} ${f.nombre}` })
            onCambio()
            if (f.id) onCerrar(); else setF({ ...fichaArticuloVacia(), subGrupo: f.subGrupo, unidad: f.unidad, tipoExistencia: f.tipoExistencia })
        } catch (e) { setAviso(await textoError(e)) } finally { setGuardando(false) }
    }

    async function eliminar() {
        if (!f.id) return
        setPreguntaEliminar(false); setGuardando(true)
        try {
            const r = await ArticulosService.eliminar(f.id)
            if (!r.eliminado) { setUsos(r.usos); return }
            toast({ title: 'Artículo eliminado', description: `${f.codigo} ${f.nombre}` })
            onCambio(); onCerrar()
        } catch (e) { setAviso(await textoError(e)) } finally { setGuardando(false) }
    }

    const input = (campo: keyof FichaArticulo, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
        <input className={claseInput} value={String(f[campo] ?? '')} onChange={(e) => set({ [campo]: e.target.value } as Partial<FichaArticulo>)} {...props} />
    )
    /** Lista abierta de Access: se escribe libre o se elige un valor ya usado. */
    const abierta_ = (campo: keyof ListasAbiertas, max: number, label: string) => (
        <Campo label={label} className="col-span-1">
            {input(campo, { list: `dg-lista-${campo}`, maxLength: max })}
            <datalist id={`dg-lista-${campo}`}>{listas[campo].map((v) => <option key={v} value={v} />)}</datalist>
        </Campo>
    )
    const cuentaCombo = (c: (typeof CUENTAS)[number]) => {
        const items = catalogos?.cuentas[c.grupo] ?? []
        const valor = String(f[c.campo] ?? '')
        const fuera = valor && !items.some((i) => String(i.id) === valor)
        return (
            <Campo key={c.campo} label={c.label} ayuda={fuera ? `Actual: ${texto(fila?.[c.codigo]) || valor} (no está en la lista)` : !items.length ? 'No hay cuentas de registros con ese prefijo' : undefined}>
                <Combo items={items} valor={valor} onCambio={(v) => set({ [c.campo]: v } as Partial<FichaArticulo>)} conCodigo vaciable placeholder={fuera ? texto(fila?.[c.codigo]) : 'Seleccionar…'} />
            </Campo>
        )
    }

    return (
        <>
            <Dialog open={abierta} onOpenChange={(o) => !o && onCerrar()}>
                <DialogContent className="flex max-h-[94vh] max-w-5xl flex-col gap-0 overflow-hidden p-0" closeClassName="text-white opacity-90 hover:opacity-100 z-10">
                    <DialogHeader className="shrink-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-4 py-4 text-left text-white sm:px-6">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100">
                            <Package className="h-3.5 w-3.5" /> {f.id ? 'Bienes y servicios' : 'Nuevo bien o servicio'}
                        </p>
                        <DialogTitle className="mt-1 flex flex-wrap items-baseline gap-x-3 pr-8 text-xl font-bold">
                            <span className="font-mono tracking-wider">{f.codigo || (f.id ? '—' : 'Código automático')}</span>
                            <span className="max-w-full truncate text-base font-medium text-blue-50/90">{f.nombre || 'Sin descripción'}</span>
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-xs text-blue-100">{f.id ? `Id Item ${f.id}` : 'Los campos con (*) son obligatorios. Si dejas el código vacío se genera con el sub-grupo.'}</DialogDescription>
                    </DialogHeader>

                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/30 px-3 py-4 sm:px-5">
                        <AvisoAmbar mensaje={aviso} onCerrar={() => setAviso('')} />
                        <Seccion titulo="Item">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                                <Campo label="SubGrupo" obligatorio className="sm:col-span-6"><Combo items={subGrupos} valor={f.subGrupo} onCambio={(v) => set({ subGrupo: v })} conCodigo /></Campo>
                                <Campo label="Id Item" className="sm:col-span-2"><input className={claseInput} value={f.id ?? ''} disabled /></Campo>
                                <Campo label="Codigo Item" obligatorio className="sm:col-span-4" ayuda={f.id ? undefined : 'Vacío = automático'}>
                                    {input('codigo', { maxLength: 9, inputMode: 'numeric', placeholder: f.id ? '' : 'Automático', className: `${claseInput} font-mono` })}
                                </Campo>
                                <Campo label="Descripcion del Item" obligatorio className="sm:col-span-6">{input('nombre', { maxLength: 255 })}</Campo>
                                <Campo label="Unidad Medida" obligatorio className="sm:col-span-3"><Combo items={unidades} valor={f.unidad} onCambio={(v) => set({ unidad: v })} /></Campo>
                                <Campo label="TipoExistencia" obligatorio className="sm:col-span-3"><Combo items={catalogos?.tiposExistencia} valor={f.tipoExistencia} onCambio={(v) => set({ tipoExistencia: v })} /></Campo>
                            </div>
                        </Seccion>

                        <Seccion titulo="Caracteristicas del items">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                                {abierta_('medida', 50, 'Medida')}
                                {abierta_('tipo', 255, 'Tipo')}
                                {abierta_('modelo', 255, 'Modelo')}
                                {abierta_('marca', 11, 'Marca')}
                                {abierta_('otros1', 255, 'Otros 1')}
                                {abierta_('otros2', 255, 'Otros 2')}
                            </div>
                        </Seccion>

                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                            <Seccion titulo="Procentajes para calculo de precios">
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:items-end">
                                    {(['precio1', 'precio2', 'precio3', 'precio4'] as const).map((p, i) => (
                                        <Campo key={p} label={`% Precio ${i + 1}`}>{input(p, { inputMode: 'decimal', className: `${claseInput} text-right font-mono` })}</Campo>
                                    ))}
                                    <label className="col-span-2 flex h-9 cursor-pointer items-center gap-2 text-sm sm:col-span-1">
                                        <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={f.icbper} onChange={(e) => set({ icbper: e.target.checked })} /> ICBPER
                                    </label>
                                </div>
                            </Seccion>
                            <Seccion titulo="Otras caracteristicas del items">
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    <Campo label="Equivalencia">{input('equivalencia', { inputMode: 'numeric', className: `${claseInput} text-right` })}</Campo>
                                    <Campo label="Fiscalizado"><Combo items={catalogos?.fiscalizados} valor={f.fiscalizado} onCambio={(v) => set({ fiscalizado: v })} vaciable /></Campo>
                                    <Campo label="Item Abreviado">{input('abreviado', { maxLength: 255 })}</Campo>
                                    <Campo label="Codigo OSCE" className="col-span-2">
                                        <div className="flex gap-1">
                                            <button type="button" onClick={() => setBuscarOsce(true)} title={f.osceTexto || 'Buscar código OSCE'}
                                                    className={`${claseInput} flex min-w-0 items-center gap-2 text-left`}>
                                                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                <span className={`truncate ${f.osceTexto ? '' : 'text-muted-foreground'}`}>{f.osceTexto || 'Buscar…'}</span>
                                            </button>
                                            {f.osce && <Button type="button" variant="ghost" size="icon" className="h-9 w-8 shrink-0" title="Quitar" onClick={() => set({ osce: '', osceTexto: '' })}><X className="h-4 w-4" /></Button>}
                                        </div>
                                    </Campo>
                                    {abierta_('control', 255, 'Control')}
                                </div>
                            </Seccion>
                        </div>

                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                            <Seccion titulo="Para registro del uso o consumo del item">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">{CUENTAS.slice(0, 2).map(cuentaCombo)}</div>
                            </Seccion>
                            <Seccion titulo="Para registro de costo de ventas del item" className="lg:col-span-2">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{CUENTAS.slice(2).map(cuentaCombo)}</div>
                            </Seccion>
                        </div>
                    </div>

                    <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div>{f.id && (
                            <Button variant="ghost" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto dark:hover:bg-red-950/40" disabled={guardando} onClick={() => setPreguntaEliminar(true)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar registro
                            </Button>
                        )}</div>
                        <div className="flex w-full gap-2 sm:w-auto">
                            <Button variant="outline" className="flex-1 sm:flex-none" onClick={onCerrar}>Cerrar</Button>
                            <Button disabled={guardando} className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md sm:flex-none" onClick={() => guardar()}>
                                {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {f.id ? 'Modificar' : 'Guardar y nuevo'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <BuscarOsceDialog abierto={buscarOsce} textoInicial={f.nombre.split(' ')[0]} onCerrar={() => setBuscarOsce(false)}
                              onElegir={(c) => { set({ osce: String(c.id), osceTexto: `${c.codigo} ${c.descripcion}` }); setBuscarOsce(false) }} />
            <Confirmar abierto={!!avisos} titulo="Revisa antes de guardar" avisos={avisos ?? []} textoAccion="Guardar igual"
                       onCancelar={() => setAvisos(null)} onAceptar={() => { setAvisos(null); guardar(true) }} />
            <Confirmar abierto={preguntaEliminar} titulo={`¿Eliminar ${f.codigo} ${f.nombre}?`} peligro textoAccion="Eliminar"
                       descripcion="Solo se elimina si no tiene compras, ventas, kardex, pedidos, comprobantes ni otros usos. También se borra su lista de precios."
                       onCancelar={() => setPreguntaEliminar(false)} onAceptar={eliminar} />
            <AlertaUso titulo={`No se puede eliminar ${f.codigo}`} usos={usos} onCerrar={() => setUsos(null)} />
        </>
    )
}
