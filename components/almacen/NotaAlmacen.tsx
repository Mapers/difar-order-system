'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { format, startOfMonth } from "date-fns"
import { ArrowLeft, FilePlus2, Loader2, Printer, RefreshCw, Save, Search, Trash2, TriangleAlert, Plus, ListX, ArrowRightLeft } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/app/hooks/useToast"
import { cn } from "@/lib/utils"
import { BuscadorRemoto } from "./BuscadorRemoto"
import {
    AlmacenService, ArticuloAlmacen, CatalogosAlmacen, FilaListado, LineaNota, LoteConSaldo, PersonaAlmacen,
    TipoMovimiento, mensajeError,
} from "@/app/services/almacen/AlmacenService"

const EMPRESA_PROPIA = { codigo: '20481321892', nombre: 'DISTRIBUIDORA E IMP. FARMACÉUTICA S.A.C.' }
const hoy = () => format(new Date(), 'yyyy-MM-dd')
const soloFecha = (v: any) => (v ? String(typeof v === 'string' ? v : new Date(v).toISOString()).slice(0, 10) : '')
const dmy = (v: any) => { const f = soloFecha(v); return f ? `${f.slice(8, 10)}/${f.slice(5, 7)}/${f.slice(0, 4)}` : '' }
const num = (v: any) => Number(v ?? 0)
const fmt = (v: any, d = 2) => num(v).toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d })
let contador = 0
const nuevaClave = () => `n${++contador}`

const lineaVacia = (centro = ''): LineaNota => ({
    clave: nuevaClave(), id: null, marcada: false, codigoArt: '', articulo: '', unidad: '', cantidad: '', costoTotal: '',
    lote: '', fechaVcto: '', centroCostos: centro, almacenDestino: '',
})

interface Cabecera {
    id: number | null
    fecha: string
    concepto: string
    documento: string
    serie: string
    numero: string
    persona: string
    personaNombre: string
    almacen: string
    observaciones: string
}

/** Textos de cada lado (Access: "Formulario Ingreso Almacen" / "Formulario Salida Almacen"). */
const TEXTOS: Record<TipoMovimiento, { titulo: string; sub: string; nota: string; concepto: string; persona: string; docDefecto: string }> = {
    ingresos: {
        titulo: 'Ingresos de Almacén', sub: 'Notas de ingreso de mercadería al almacén. Al guardar se actualizan el kardex y los lotes.',
        nota: 'Nota de Ingreso', concepto: 'Concepto de ingreso', persona: 'Proveedor', docDefecto: 'NI',
    },
    salidas: {
        titulo: 'Salidas de Almacén', sub: 'Notas de egreso y transferencias entre almacenes. Al guardar se actualiza el kardex.',
        nota: 'Nota de Salida', concepto: 'Concepto de salida', persona: 'Cliente', docDefecto: 'NE',
    },
}

export function NotaAlmacen({ tipo }: { tipo: TipoMovimiento }) {
    const T = TEXTOS[tipo]
    const esSalida = tipo === 'salidas'
    const [cat, setCat] = useState<CatalogosAlmacen | null>(null)
    const [aviso, setAviso] = useState<string | null>(null)

    // ------------------------------------------------------------ listado
    const [modo, setModo] = useState<'lista' | 'nota'>('lista')
    const [desde, setDesde] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
    const [hasta, setHasta] = useState(hoy())
    const [buscar, setBuscar] = useState('')
    const [filas, setFilas] = useState<FilaListado[]>([])
    const [cargandoLista, setCargandoLista] = useState(false)

    const cargarLista = useCallback(async () => {
        setCargandoLista(true); setAviso(null)
        try { setFilas(await AlmacenService.listar(tipo, { desde, hasta, buscar: buscar.trim() || undefined })) }
        catch (e) { setAviso(mensajeError(e, 'No se pudo cargar el listado.')) }
        finally { setCargandoLista(false) }
    }, [tipo, desde, hasta, buscar])

    useEffect(() => {
        AlmacenService.catalogos(tipo).then(setCat).catch(e => setAviso(mensajeError(e, 'No se pudieron cargar los catálogos.')))
        cargarLista()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tipo])

    // ------------------------------------------------------------ nota
    const [cab, setCab] = useState<Cabecera | null>(null)
    const [lineas, setLineas] = useState<LineaNota[]>([])
    const [guardando, setGuardando] = useState(false)
    const [confirmar, setConfirmar] = useState<null | 'nota' | 'filas'>(null)
    const [lotes, setLotes] = useState<Record<string, LoteConSaldo[]>>({})
    const numeroManual = useRef(false)

    const centroDefecto = cat?.centrosCosto.find(c => c.PorDefecto)?.Cod_CC ?? cat?.centrosCosto[0]?.Cod_CC ?? ''
    const concepto = cat?.conceptos.find(c => c.Codigo_Op === cab?.concepto)
    const esTransferencia = esSalida && Number(concepto?.EsTransferencia) === 1
    const cerrado = !!(cab && cat?.fechaCierre && cab.fecha && cab.fecha <= soloFecha(cat.fechaCierre))

    const nueva = () => {
        if (!cat) return
        numeroManual.current = false
        const doc = cat.documentos.find(d => d.Cod_Tipo === T.docDefecto) ?? cat.documentos.find(d => d.PorDefecto) ?? cat.documentos[0]
        const ultimaSerie = filas.find(f => f.Codigo_Doc === doc?.Cod_Tipo)?.Serie_Doc ?? cat.series[0]?.Serie_Doc ?? ''
        setCab({
            id: null, fecha: hoy(), concepto: '', documento: doc?.Cod_Tipo ?? '', serie: ultimaSerie, numero: '',
            persona: EMPRESA_PROPIA.codigo, personaNombre: EMPRESA_PROPIA.nombre,
            almacen: String(cat.almacenes[0]?.IdAlmacen ?? ''), observaciones: '',
        })
        setLineas([lineaVacia(centroDefecto)])
        setAviso(null); setModo('nota')
    }

    const abrir = async (id: number) => {
        setAviso(null)
        try {
            const { cabecera: c, detalle } = await AlmacenService.obtener(tipo, id)
            numeroManual.current = true
            setCab({
                id: c.Codigo_Mvto, fecha: soloFecha(c.Fecha_Mvto), concepto: c.Codigo_Op ?? '', documento: c.Codigo_Doc ?? '',
                serie: c.Serie_Doc ?? '', numero: String(c.Nro_Doc ?? ''), persona: c.Codigo_Prov_Clie ?? '',
                personaNombre: (esSalida ? c.Cliente : c.Proveedor) ?? c.Codigo_Prov_Clie ?? '',
                almacen: String((esSalida ? c.IdAlmacen : c.CodigoAlmacen) ?? ''), observaciones: c.Glosa ?? '',
            })
            setLineas(detalle.map((d: any) => ({
                clave: nuevaClave(), id: esSalida ? d.Id_Mvto_Salidas : d.Id_Detalle_Ingresos, marcada: false,
                codigoArt: d.Codigo_Art ?? '', articulo: d.NombreItem ?? d.Codigo_Art ?? '', unidad: d.AbrevUnidMed ?? '',
                cantidad: String(num(esSalida ? d.Cantidad_Sal : d.Cantidad_Ing)), costoTotal: esSalida ? '' : String(num(d.Cost_Tot)),
                lote: d.Lote ?? '', fechaVcto: soloFecha(d.FechaVctoLote), centroCostos: d.CentroCostos ?? '',
                almacenDestino: d.Almacen2 ? String(d.Almacen2) : '',
            })))
            setModo('nota')
        } catch (e) { setAviso(mensajeError(e, 'No se pudo abrir la nota.')) }
    }

    // Número correlativo (NumeroMax del Access) para notas nuevas, al elegir documento y serie.
    useEffect(() => {
        if (!cab || cab.id || numeroManual.current || !cab.documento || !cab.serie.trim()) return
        let vivo = true
        AlmacenService.siguienteNumero(tipo, cab.documento, cab.serie.trim())
            .then(n => { if (vivo) setCab(c => (c && !c.id ? { ...c, numero: String(n) } : c)) }).catch(() => {})
        return () => { vivo = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cab?.documento, cab?.serie, cab?.id])

    // Lotes con saldo (solo salidas): por artículo y almacén de origen.
    const claveLotes = (art: string) => `${art}|${cab?.almacen}`
    useEffect(() => {
        if (!esSalida || !cab?.almacen) return
        const faltan = [...new Set(lineas.map(l => l.codigoArt).filter(a => a && !lotes[claveLotes(a)]))]
        faltan.forEach(a => AlmacenService.lotes(a, Number(cab.almacen), cab.id)
            .then(r => setLotes(p => ({ ...p, [claveLotes(a)]: r }))).catch(() => setLotes(p => ({ ...p, [claveLotes(a)]: [] }))))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [esSalida, cab?.almacen, lineas.map(l => l.codigoArt).join(',')])

    const cambiar = (clave: string, cambios: Partial<LineaNota>) => setLineas(ls => ls.map(l => (l.clave === clave ? { ...l, ...cambios } : l)))

    const guardar = async () => {
        if (!cab) return
        const conDatos = lineas.filter(l => l.codigoArt)
        const faltan: string[] = []
        if (!cab.fecha) faltan.push('fecha')
        if (!cab.concepto) faltan.push('concepto')
        if (!cab.documento) faltan.push('documento')
        if (!cab.serie.trim()) faltan.push('serie')
        if (!cab.persona) faltan.push(T.persona.toLowerCase())
        if (!cab.almacen) faltan.push('almacén')
        if (faltan.length) { setAviso(`Completa: ${faltan.join(', ')}.`); return }
        if (cerrado) { setAviso('EL REGISTRO ESTA FUERA DE FECHA DE CIERRE CONTABLE Y NO SE GUARDARA'); return }
        if (conDatos.length === 0) { setAviso('Agrega al menos un artículo.'); return }
        const malCant = conDatos.findIndex(l => !(Number(l.cantidad) > 0))
        if (malCant >= 0) { setAviso(`Fila ${malCant + 1}: la cantidad debe ser mayor que 0.`); return }
        if (esTransferencia) {
            const sinDestino = conDatos.findIndex(l => !l.almacenDestino || l.almacenDestino === cab.almacen)
            if (sinDestino >= 0) { setAviso(`Fila ${sinDestino + 1}: elige el almacén de transferencia (distinto del almacén de origen).`); return }
        }
        setGuardando(true); setAviso(null)
        try {
            const r = await AlmacenService.guardar(tipo, cab.id, {
                fecha: cab.fecha, concepto: cab.concepto, documento: cab.documento, serie: cab.serie.trim(),
                numero: cab.numero ? Number(cab.numero) : null,
                ...(esSalida ? { cliente: cab.persona } : { proveedor: cab.persona }),
                almacen: Number(cab.almacen), observaciones: cab.observaciones,
                detalle: conDatos.map(l => ({ ...l, almacenDestino: esTransferencia ? l.almacenDestino : '' })),
            })
            toast({ title: 'Guardado', description: r.message })
            await abrir(Number(r.data?.Codigo_Mvto))
            cargarLista()
        } catch (e) { setAviso(mensajeError(e, 'No se pudo guardar la nota.')) }
        finally { setGuardando(false) }
    }

    const eliminar = async () => {
        if (!cab?.id) return
        const que = confirmar; setConfirmar(null); setAviso(null)
        try {
            if (que === 'nota') {
                const r = await AlmacenService.eliminar(tipo, cab.id)
                toast({ title: 'Eliminada', description: r.message })
                setModo('lista'); setCab(null); cargarLista()
            } else {
                const ids = lineas.filter(l => l.marcada && l.id).map(l => Number(l.id))
                const r = await AlmacenService.eliminarDetalle(tipo, cab.id, ids)
                toast({ title: 'Filas eliminadas', description: r.message })
                await abrir(cab.id)
            }
        } catch (e) { setAviso(mensajeError(e, 'No se pudo eliminar.')) }
    }

    const imprimir = async () => {
        if (!cab?.id) return
        try {
            const filasR = await AlmacenService.reporte(tipo, cab.id)
            if (!filasR.length) { setAviso('La nota no tiene líneas para imprimir.'); return }
            imprimirNota(T.nota, filasR, esSalida)
        } catch (e) { setAviso(mensajeError(e, 'No se pudo preparar la impresión.')) }
    }

    const marcadas = lineas.filter(l => l.marcada && l.id).length
    const totales = useMemo(() => ({
        cantidad: lineas.reduce((a, l) => a + (Number(l.cantidad) || 0), 0),
        costo: lineas.reduce((a, l) => a + (Number(l.costoTotal) || 0), 0),
    }), [lineas])

    // ------------------------------------------------------------ vista
    return (
        <div className="grid grid-cols-1 gap-5 p-4 md:p-6">
            <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{T.titulo}</h1>
                <p className="text-sm text-muted-foreground md:text-base">{T.sub}</p>
            </div>

            {aviso && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> <span>{aviso}</span>
                </div>
            )}

            {modo === 'lista' ? (
                <Card className="shadow-sm">
                    <CardHeader className="border-b bg-muted/60 p-4">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="grid gap-1"><Label className="text-xs">Desde</Label><Input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="h-9 w-40 bg-background" /></div>
                            <div className="grid gap-1"><Label className="text-xs">Hasta</Label><Input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="h-9 w-40 bg-background" /></div>
                            <div className="grid min-w-[12rem] flex-1 gap-1"><Label className="text-xs">Buscar</Label>
                                <Input placeholder={`Número, ${T.persona.toLowerCase()} u observación`} value={buscar} onChange={e => setBuscar(e.target.value)}
                                       onKeyDown={e => e.key === 'Enter' && cargarLista()} className="h-9 bg-background" /></div>
                            <Button variant="outline" onClick={cargarLista} disabled={cargandoLista} className="h-9">
                                {cargandoLista ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Search className="mr-1.5 h-4 w-4" />} Buscar
                            </Button>
                            <Button onClick={nueva} disabled={!cat} className="h-9 bg-blue-600 hover:bg-blue-700"><FilePlus2 className="mr-1.5 h-4 w-4" /> Nueva {T.nota.toLowerCase()}</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                                    <tr>
                                        <th className="px-3 py-2.5">Fecha</th><th className="px-3 py-2.5">Documento</th><th className="px-3 py-2.5">Concepto</th>
                                        <th className="px-3 py-2.5">{T.persona}</th><th className="px-3 py-2.5">Almacén</th>
                                        <th className="px-3 py-2.5 text-right">Ítems</th><th className="px-3 py-2.5 text-right">Cantidad</th>
                                        {!esSalida && <th className="px-3 py-2.5 text-right">Costo total</th>}
                                        <th className="px-3 py-2.5">Observaciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filas.map(f => (
                                        <tr key={f.Codigo_Mvto} onClick={() => abrir(f.Codigo_Mvto)} className="cursor-pointer hover:bg-muted/60">
                                            <td className="whitespace-nowrap px-3 py-2">{dmy(f.Fecha_Mvto)}</td>
                                            <td className="whitespace-nowrap px-3 py-2 font-mono font-semibold">{f.Codigo_Doc} {f.Serie_Doc}-{f.Nro_Doc}</td>
                                            <td className="px-3 py-2">
                                                {f.Operacion}
                                                {f.Transferencia === '1' && <Badge variant="outline" className="ml-1.5 gap-1 text-[10px]"><ArrowRightLeft className="h-3 w-3" />{f.AlmacenesDestino ?? 'Transferencia'}</Badge>}
                                            </td>
                                            <td className="max-w-[16rem] truncate px-3 py-2">{f.Proveedor ?? f.Cliente}</td>
                                            <td className="px-3 py-2">{f.Almacen}</td>
                                            <td className="px-3 py-2 text-right">{f.Items ?? f.Lineas}</td>
                                            <td className="px-3 py-2 text-right font-mono">{fmt(f.CantidadTotal)}</td>
                                            {!esSalida && <td className="px-3 py-2 text-right font-mono">{fmt(f.CostoTotal)}</td>}
                                            <td className="max-w-[14rem] truncate px-3 py-2 text-muted-foreground">{f.Glosa}</td>
                                        </tr>
                                    ))}
                                    {!cargandoLista && filas.length === 0 && (
                                        <tr><td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">No hay notas en el rango elegido.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <p className="border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">{filas.length} nota{filas.length === 1 ? '' : 's'} · clic en una fila para abrirla.</p>
                    </CardContent>
                </Card>
            ) : cab && cat && (
                <Card className="shadow-sm">
                    {/* Barra de botones, como la del formulario Access */}
                    <div className="flex flex-wrap items-center gap-2 border-b bg-blue-700 px-3 py-2 text-white">
                        <Button size="sm" variant="ghost" className="text-white hover:bg-white/15 hover:text-white" onClick={() => { setModo('lista'); setAviso(null) }}><ArrowLeft className="mr-1 h-4 w-4" /> Listado</Button>
                        <Button size="sm" variant="ghost" className="text-white hover:bg-white/15 hover:text-white" onClick={nueva}><FilePlus2 className="mr-1 h-4 w-4" /> Nuevo</Button>
                        <Button size="sm" className="bg-white text-blue-800 hover:bg-blue-50" onClick={guardar} disabled={guardando || cerrado}>
                            {guardando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} Guardar
                        </Button>
                        <Button size="sm" variant="ghost" className="text-white hover:bg-white/15 hover:text-white" disabled={!cab.id || marcadas === 0 || cerrado} onClick={() => setConfirmar('filas')}><ListX className="mr-1 h-4 w-4" /> Eliminar filas marcadas{marcadas ? ` (${marcadas})` : ''}</Button>
                        <Button size="sm" variant="ghost" className="text-white hover:bg-white/15 hover:text-white" disabled={!cab.id} onClick={imprimir}><Printer className="mr-1 h-4 w-4" /> Imprimir</Button>
                        <span className="ml-auto" />
                        {cab.id && <Button size="sm" variant="ghost" className="text-white hover:bg-white/15 hover:text-white" onClick={() => abrir(cab.id!)}><RefreshCw className="mr-1 h-4 w-4" /> Actualizar</Button>}
                        <Button size="sm" variant="ghost" className="text-white hover:bg-white/15 hover:text-white" disabled={!cab.id || cerrado} onClick={() => setConfirmar('nota')}><Trash2 className="mr-1 h-4 w-4" /> Eliminar nota</Button>
                    </div>

                    <CardContent className="grid gap-5 p-4 md:p-5">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-bold">{cab.id ? `${T.nota} ${cab.serie}-${cab.numero}` : `${T.nota} nueva`}</span>
                            {esTransferencia && <Badge className="gap-1 bg-indigo-600"><ArrowRightLeft className="h-3 w-3" /> Transferencia entre almacenes</Badge>}
                            {cerrado && <Badge variant="outline" className="border-amber-400 text-amber-700">Periodo cerrado (cierre contable {dmy(cat.fechaCierre)})</Badge>}
                        </div>

                        {/* Cabecera */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
                            <Campo etiqueta="Fecha" className="lg:col-span-2"><Input type="date" value={cab.fecha} onChange={e => setCab({ ...cab, fecha: e.target.value })} className="h-9" /></Campo>
                            <Campo etiqueta={T.concepto} className="lg:col-span-4">
                                <Select value={cab.concepto} onValueChange={v => setCab({ ...cab, concepto: v })}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Elige el concepto" /></SelectTrigger>
                                    <SelectContent>{cat.conceptos.map(c => <SelectItem key={c.Codigo_Op} value={c.Codigo_Op}>{c.Operacion}</SelectItem>)}</SelectContent>
                                </Select>
                            </Campo>
                            <Campo etiqueta="Documento" className="lg:col-span-3">
                                <Select value={cab.documento} onValueChange={v => { numeroManual.current = !!cab.id; setCab({ ...cab, documento: v }) }}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Documento" /></SelectTrigger>
                                    <SelectContent>{cat.documentos.map(d => <SelectItem key={d.Cod_Tipo} value={d.Cod_Tipo}>{d.Descripcion}</SelectItem>)}</SelectContent>
                                </Select>
                            </Campo>
                            <Campo etiqueta="Serie" className="lg:col-span-1">
                                <Input list={`series-${tipo}`} value={cab.serie} onChange={e => { numeroManual.current = !!cab.id; setCab({ ...cab, serie: e.target.value.toUpperCase() }) }} className="h-9" />
                                <datalist id={`series-${tipo}`}>{cat.series.map(s => <option key={s.Serie_Doc} value={s.Serie_Doc} />)}</datalist>
                            </Campo>
                            <Campo etiqueta="Número" className="lg:col-span-2">
                                <Input inputMode="numeric" value={cab.numero} onChange={e => { numeroManual.current = true; setCab({ ...cab, numero: e.target.value.replace(/\D/g, '') }) }} className="h-9 text-right font-mono" />
                            </Campo>
                            <Campo etiqueta={T.persona} className="lg:col-span-6">
                                <BuscadorRemoto<PersonaAlmacen>
                                    etiqueta={cab.persona ? `${cab.personaNombre}` : ''} placeholder={`Buscar ${T.persona.toLowerCase()} por RUC o nombre`}
                                    buscar={q => AlmacenService.personas(tipo, q)} getKey={p => p.Codigo}
                                    getLabel={p => (p.Nombre || '').trim()} getSub={p => [p.RUC || p.Codigo, p.NombreComercial].filter(Boolean).join(' · ')}
                                    onElegir={p => setCab({ ...cab, persona: p.Codigo, personaNombre: (p.Nombre || '').trim() })} />
                            </Campo>
                            <Campo etiqueta={esTransferencia ? 'Almacén de origen' : 'Almacén'} className="lg:col-span-3">
                                <Select value={cab.almacen} onValueChange={v => setCab({ ...cab, almacen: v })}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Almacén" /></SelectTrigger>
                                    <SelectContent>{cat.almacenes.map(a => <SelectItem key={a.IdAlmacen} value={String(a.IdAlmacen)}>{a.Descripcion}</SelectItem>)}</SelectContent>
                                </Select>
                            </Campo>
                            <Campo etiqueta="Observaciones" className="lg:col-span-3">
                                <Input value={cab.observaciones} maxLength={255} onChange={e => setCab({ ...cab, observaciones: e.target.value })} className="h-9" />
                            </Campo>
                        </div>

                        {/* Detalle */}
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full min-w-[56rem] text-sm">
                                <thead className="border-b bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                                    <tr>
                                        <th className="w-9 px-2 py-2 text-center" title="Marcar para eliminar">E</th>
                                        <th className="px-2 py-2">Artículo</th>
                                        {esSalida && <th className="w-48 px-2 py-2">Lote</th>}
                                        <th className="w-28 px-2 py-2 text-right">Cantidad</th>
                                        {!esSalida && <th className="w-28 px-2 py-2 text-right">Costo total</th>}
                                        {!esSalida && <th className="w-32 px-2 py-2">Lote</th>}
                                        {!esSalida && <th className="w-40 px-2 py-2">Fecha vcto.</th>}
                                        <th className="w-44 px-2 py-2">Centro de costos</th>
                                        {esTransferencia && <th className="w-40 px-2 py-2">Almacén transferencia</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {lineas.map((l, i) => {
                                        const lotesArt = esSalida && l.codigoArt ? lotes[claveLotes(l.codigoArt)] : undefined
                                        const saldo = lotesArt?.find(x => x.Lote === l.lote)?.SumaDeSaldo
                                        const excede = esSalida && saldo !== undefined && Number(l.cantidad) > Number(saldo)
                                        return (
                                            <tr key={l.clave} className={cn(l.marcada && "bg-red-50/60 dark:bg-red-950/20")}>
                                                <td className="px-2 py-1.5 text-center">
                                                    <Checkbox checked={l.marcada} disabled={!l.id} onCheckedChange={v => cambiar(l.clave, { marcada: !!v })} aria-label={`Marcar fila ${i + 1}`} />
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <BuscadorRemoto<ArticuloAlmacen>
                                                        etiqueta={l.codigoArt ? l.articulo : ''} placeholder="Buscar artículo"
                                                        buscar={q => AlmacenService.articulos(tipo, q)} getKey={a => a.Codigo_Art}
                                                        getLabel={a => a.NombreItem} getSub={a => `${a.Codigo_Art}${a.AbrevUnidMed ? ' · ' + a.AbrevUnidMed : ''}`}
                                                        onElegir={a => cambiar(l.clave, { codigoArt: a.Codigo_Art, articulo: a.NombreItem, unidad: a.AbrevUnidMed ?? '', lote: '' })} />
                                                </td>
                                                {esSalida && (
                                                    <td className="px-2 py-1.5">
                                                        <Input list={`lotes-${l.clave}`} value={l.lote} placeholder={lotesArt?.length ? 'Elige o escribe' : 'Lote'}
                                                               onChange={e => cambiar(l.clave, { lote: e.target.value })} className="h-9 font-mono" />
                                                        <datalist id={`lotes-${l.clave}`}>
                                                            {(lotesArt ?? []).map(x => <option key={x.Lote} value={x.Lote}>{`Saldo ${fmt(x.SumaDeSaldo, 0)}${x.MinVctoItem ? ' · vence ' + dmy(x.MinVctoItem) : ''}`}</option>)}
                                                        </datalist>
                                                        {saldo !== undefined && <span className="mt-0.5 block text-[10px] text-muted-foreground">Saldo {fmt(saldo, 0)}</span>}
                                                    </td>
                                                )}
                                                <td className="px-2 py-1.5">
                                                    <Input inputMode="decimal" value={l.cantidad} onChange={e => cambiar(l.clave, { cantidad: e.target.value.replace(/[^\d.]/g, '') })}
                                                           className={cn("h-9 text-right font-mono", excede && "border-amber-400")} />
                                                    {excede && <span className="mt-0.5 block text-[10px] font-medium text-amber-700">Supera el saldo del lote</span>}
                                                </td>
                                                {!esSalida && <td className="px-2 py-1.5"><Input inputMode="decimal" value={l.costoTotal} onChange={e => cambiar(l.clave, { costoTotal: e.target.value.replace(/[^\d.]/g, '') })} className="h-9 text-right font-mono" /></td>}
                                                {!esSalida && <td className="px-2 py-1.5"><Input value={l.lote} onChange={e => cambiar(l.clave, { lote: e.target.value })} className="h-9 font-mono" /></td>}
                                                {!esSalida && <td className="px-2 py-1.5"><Input type="date" value={l.fechaVcto} onChange={e => cambiar(l.clave, { fechaVcto: e.target.value })} className="h-9" /></td>}
                                                <td className="px-2 py-1.5">
                                                    <Select value={l.centroCostos} onValueChange={v => cambiar(l.clave, { centroCostos: v })}>
                                                        <SelectTrigger className="h-9"><SelectValue placeholder="Centro de costos" /></SelectTrigger>
                                                        <SelectContent>{cat.centrosCosto.map(c => <SelectItem key={c.Cod_CC} value={c.Cod_CC}>{c.Descripcion}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </td>
                                                {esTransferencia && (
                                                    <td className="px-2 py-1.5">
                                                        <Select value={l.almacenDestino} onValueChange={v => cambiar(l.clave, { almacenDestino: v })}>
                                                            <SelectTrigger className="h-9"><SelectValue placeholder="Destino" /></SelectTrigger>
                                                            <SelectContent>{cat.almacenes.filter(a => String(a.IdAlmacen) !== cab.almacen).map(a => <SelectItem key={a.IdAlmacen} value={String(a.IdAlmacen)}>{a.Descripcion}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                    </td>
                                                )}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                <tfoot className="border-t bg-muted/30 text-sm">
                                    <tr>
                                        <td colSpan={esSalida ? 3 : 2} className="px-2 py-2">
                                            <Button size="sm" variant="outline" onClick={() => setLineas(ls => [...ls, lineaVacia(centroDefecto)])}><Plus className="mr-1 h-4 w-4" /> Agregar artículo</Button>
                                        </td>
                                        <td className="px-2 py-2 text-right font-mono font-semibold">{fmt(totales.cantidad)}</td>
                                        {!esSalida && <td className="px-2 py-2 text-right font-mono font-semibold">{fmt(totales.costo)}</td>}
                                        <td colSpan={9} />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Las filas nuevas sin artículo no se guardan. Para quitar filas ya guardadas, márcalas en la columna <b>E</b> y pulsa <b>Eliminar filas marcadas</b>.
                            {esSalida && ' El lote sugiere los que tienen saldo en el almacén de origen; si la cantidad supera el saldo, se avisa pero se puede grabar (igual que en Access).'}
                        </p>
                    </CardContent>
                </Card>
            )}

            <AlertDialog open={confirmar !== null} onOpenChange={v => !v && setConfirmar(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirmar === 'nota' ? `¿Eliminar la ${T.nota.toLowerCase()} ${cab?.serie}-${cab?.numero}?` : `¿Eliminar ${marcadas} fila${marcadas === 1 ? '' : 's'}?`}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmar === 'nota' ? 'Se borran la nota, su detalle y sus movimientos de kardex.' : 'Se borran las filas marcadas y se recalcula el kardex de la nota.'} No se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={eliminar}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function Campo({ etiqueta, className, children }: { etiqueta: string; className?: string; children: React.ReactNode }) {
    return <div className={cn("grid gap-1", className)}><Label className="text-xs font-medium text-muted-foreground">{etiqueta}</Label>{children}</div>
}

/** Impresión de la nota (informe Access "Nota Ingreso Almacen" / "Nota Salida Almacen"). */
function imprimirNota(titulo: string, filas: any[], esSalida: boolean) {
    const c = filas[0]
    const esc = (v: any) => String(v ?? '').replace(/[&<>"]/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[s] as string))
    const lineas = filas.map(f => `<tr><td>${esc(f.BienesServicios)}</td><td>${esc(f.AbrevUnidMed)}</td><td class="n">${fmt(esSalida ? f.Cantidad_Sal : f.Cantidad_Ing)}</td><td>${esc(f.Lote)}</td><td>${dmy(f.FechaVctoLote || f.VctoItemKardex)}</td>${esSalida ? '' : `<td class="n">${fmt(f.Cost_Tot)}</td>`}</tr>`).join('')
    const w = window.open('', '_blank', 'width=900,height=700')
    if (!w) return
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(titulo)} ${esc(c.Documento)}</title>
<style>body{font-family:Arial,sans-serif;font-size:12px;margin:28px;color:#111}h1{font-size:16px;margin:14px 0 4px}table{width:100%;border-collapse:collapse;margin-top:12px}
th,td{border-bottom:1px solid #ccc;padding:5px 6px;text-align:left}th{background:#f1f5f9;font-size:11px;text-transform:uppercase}.n{text-align:right}.g{display:grid;grid-template-columns:140px 1fr;gap:3px 10px;margin-top:8px}</style></head><body>
<div><b>${esc(c.NombreRazSocial)}</b><br>RUC ${esc(c.RUC)}<br>${esc(c.Domicilio)}</div>
<h1>${esc(titulo.toUpperCase())} ${esc(c.Documento)}</h1>
<div class="g"><span>Fecha</span><b>${dmy(c.Fecha_Mvto)}</b><span>Motivo</span><span>${esc(c.Motivo)}</span><span>${esSalida ? 'Cliente' : 'Proveedor'}</span><span>${esc(c.ClienteProveedor)}</span><span>Almacén</span><span>${esc(c.Almacen)}</span><span>Observaciones</span><span>${esc(c.Glosa)}</span></div>
<table><thead><tr><th>Bienes y servicios</th><th>Und.</th><th class="n">Cantidad</th><th>Lote</th><th>Vence</th>${esSalida ? '' : '<th class="n">Costo total</th>'}</tr></thead><tbody>${lineas}</tbody></table>
<script>window.onload=()=>window.print()</script></body></html>`)
    w.document.close()
}
