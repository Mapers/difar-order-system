'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Save, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/app/hooks/useToast'
import { ArticulosService } from '@/app/services/contabilidad/DatosGeneralesService'
import { CatalogosArticulos, FilaArticuloOsce, Opcion } from '@/app/types/datos-generales-types'
import { AvisoAmbar, Buscador, Campo, claseInput, Combo, texto, textoError, VerMas } from '../comunes'
import { BuscarOsceDialog } from './BuscarOsceDialog'

const PASO = 100

/**
 * Bienes y Servicios OSCE (form Access [BienesYServicios_OSCE] + subformulario [marticulososce]):
 * lista de artículos con su código OSCE, unidad y tipo de existencia; se asigna o quita el código
 * (botón Actualiza de Access). No hay alta ni baja en este formulario.
 */
export function PestanaOsce({ catalogos }: { catalogos: CatalogosArticulos | null }) {
    const [buscar, setBuscar] = useState('')
    const [soloSin, setSoloSin] = useState(false)
    const [filas, setFilas] = useState<FilaArticuloOsce[]>([])
    const [cargando, setCargando] = useState(false)
    const [aviso, setAviso] = useState('')
    const [mostrar, setMostrar] = useState(PASO)
    const [sel, setSel] = useState<FilaArticuloOsce | null>(null)
    const [form, setForm] = useState({ osce: '', osceTexto: '', unidad: '', tipoExistencia: '' })
    const [avisoForm, setAvisoForm] = useState('')
    const [guardando, setGuardando] = useState(false)
    const [buscarOsce, setBuscarOsce] = useState(false)

    const cargar = useCallback(async () => {
        setCargando(true); setAviso('')
        try { setFilas(await ArticulosService.osceListar(buscar, soloSin)); setMostrar(PASO) } catch (e) { setAviso(await textoError(e, 'No se pudo cargar la lista OSCE.')) } finally { setCargando(false) }
    }, [buscar, soloSin])
    useEffect(() => { cargar() }, [soloSin]) // eslint-disable-line react-hooks/exhaustive-deps

    const unidades = useMemo<Opcion[]>(() => (catalogos?.unidades ?? []).map((u) => ({ id: u.id, nombre: `${u.nombre}${u.abreviatura ? ` (${u.abreviatura})` : ''}` })), [catalogos])
    const visibles = useMemo(() => filas.slice(0, mostrar), [filas, mostrar])

    function abrir(a: FilaArticuloOsce) {
        setSel(a); setAvisoForm('')
        setForm({ osce: texto(a.osce), osceTexto: a.osce ? `${texto(a.CodigoOsce)} ${texto(a.DescripcionOsce)}`.trim() : '', unidad: texto(a.Unidad), tipoExistencia: texto(a.TipoExistencia) })
    }

    async function guardar() {
        if (!sel) return
        setGuardando(true)
        try {
            await ArticulosService.osceGuardar(sel.IdArticulo, form.osce ? Number(form.osce) : null, form.unidad, form.tipoExistencia)
            toast({ title: 'Código OSCE actualizado', description: `${texto(sel.Codigo_Art)} ${texto(sel.NombreItem)}` })
            setSel(null); cargar()
        } catch (e) { setAvisoForm(await textoError(e)) } finally { setGuardando(false) }
    }

    const cambiaUnidad = sel && (form.unidad !== texto(sel.Unidad) || form.tipoExistencia !== texto(sel.TipoExistencia))

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Buscador valor={buscar} onCambio={setBuscar} onBuscar={cargar} cargando={cargando} placeholder="Código o nombre del artículo" />
                <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                    <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={soloSin} onChange={(e) => setSoloSin(e.target.checked)} /> Solo sin código OSCE
                </label>
            </div>
            <AvisoAmbar mensaje={aviso} onCerrar={() => setAviso('')} />
            {cargando && !filas.length ? (
                <p className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</p>
            ) : (
                <ul className="divide-y divide-border rounded-md border border-border">
                    {visibles.map((a) => (
                        <li key={a.IdArticulo}>
                            <button className="grid w-full grid-cols-1 gap-0.5 px-3 py-2 text-left hover:bg-blue-50/60 sm:grid-cols-[7rem_1fr_16rem_6rem] sm:items-center sm:gap-3 dark:hover:bg-blue-950/30" onClick={() => abrir(a)}>
                                <span className="font-mono text-xs text-muted-foreground">{a.Codigo_Art}</span>
                                <span className="truncate text-sm text-foreground">{a.NombreItem || '(sin descripción)'}</span>
                                <span className={`truncate text-xs ${a.osce ? 'text-foreground' : 'text-muted-foreground'}`}>{a.osce ? `${a.CodigoOsce} · ${a.DescripcionOsce}` : 'Sin código OSCE'}</span>
                                <span className="text-xs text-muted-foreground">{a.AbrevUnidMed ?? a.Unidad} · {a.TipoExistencia}</span>
                            </button>
                        </li>
                    ))}
                    {!filas.length && <li className="p-8 text-center text-sm text-muted-foreground">Sin artículos.</li>}
                </ul>
            )}
            <VerMas mostrados={mostrar} total={filas.length} onMas={() => setMostrar((n) => n + PASO)} />

            <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
                <DialogContent className="max-h-[94vh] max-w-lg overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="pr-6">{texto(sel?.Codigo_Art)} {texto(sel?.NombreItem)}</DialogTitle>
                        <DialogDescription>Asigna el código OSCE del artículo (Actualiza).</DialogDescription>
                    </DialogHeader>
                    <AvisoAmbar mensaje={avisoForm} onCerrar={() => setAvisoForm('')} />
                    <Campo label="Osce">
                        <div className="flex gap-1">
                            <button type="button" onClick={() => setBuscarOsce(true)} className={`${claseInput} flex min-w-0 items-center gap-2 text-left`}>
                                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className={`truncate ${form.osceTexto ? '' : 'text-muted-foreground'}`}>{form.osceTexto || 'Buscar código OSCE…'}</span>
                            </button>
                            {form.osce && <Button type="button" variant="ghost" size="icon" className="h-9 w-8 shrink-0" title="Quitar" onClick={() => setForm((x) => ({ ...x, osce: '', osceTexto: '' }))}><X className="h-4 w-4" /></Button>}
                        </div>
                    </Campo>
                    <div className="grid grid-cols-2 gap-3">
                        <Campo label="Unidad"><Combo items={unidades} valor={form.unidad} onCambio={(v) => setForm((x) => ({ ...x, unidad: v }))} /></Campo>
                        <Campo label="TipoExistencia"><Combo items={catalogos?.tiposExistencia} valor={form.tipoExistencia} onCambio={(v) => setForm((x) => ({ ...x, tipoExistencia: v }))} /></Campo>
                    </div>
                    {cambiaUnidad && <AvisoAmbar mensaje="Cambias la unidad o el tipo de existencia: la app de ventas los usa en los comprobantes electrónicos." />}
                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1" onClick={() => setSel(null)}>Cerrar</Button>
                        <Button className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 text-white" disabled={guardando} onClick={guardar}>
                            {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Actualiza
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <BuscarOsceDialog abierto={buscarOsce} textoInicial={texto(sel?.NombreItem).split(' ')[0]} onCerrar={() => setBuscarOsce(false)}
                              onElegir={(c) => { setForm((x) => ({ ...x, osce: String(c.id), osceTexto: `${c.codigo} ${c.descripcion}` })); setBuscarOsce(false) }} />
        </div>
    )
}
