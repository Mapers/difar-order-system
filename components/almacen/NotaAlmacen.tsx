'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { format, startOfMonth } from "date-fns"
import {
    ArrowRightLeft, Building2, CheckCircle2, ClipboardList, FilePlus2, ListX, Loader2, PackageMinus, PackagePlus,
    Plus, Printer, RefreshCw, Save, Search, Trash2, User, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/app/hooks/useToast"
import { cn } from "@/lib/utils"
import { AvisoAmbar, Campo, Combo, Confirmar, Seccion, claseInput } from "@/components/contabilidad/datos-generales/comunes"
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
const soles = (v: any) => `S/ ${fmt(v)}`
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
    const IconoTipo = esSalida ? PackageMinus : PackagePlus
    const [cat, setCat] = useState<CatalogosAlmacen | null>(null)
    const [avisoLista, setAvisoLista] = useState<string | null>(null)

    // ------------------------------------------------------------ listado
    const [desde, setDesde] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
    const [hasta, setHasta] = useState(hoy())
    const [buscar, setBuscar] = useState('')
    const [filas, setFilas] = useState<FilaListado[]>([])
    const [cargandoLista, setCargandoLista] = useState(false)

    const cargarLista = useCallback(async () => {
        setCargandoLista(true); setAvisoLista(null)
        try { setFilas(await AlmacenService.listar(tipo, { desde, hasta, buscar: buscar.trim() || undefined })) }
        catch (e) { setAvisoLista(mensajeError(e, 'No se pudo cargar el listado.')) }
        finally { setCargandoLista(false) }
    }, [tipo, desde, hasta, buscar])

    useEffect(() => {
        AlmacenService.catalogos(tipo).then(setCat).catch(e => setAvisoLista(mensajeError(e, 'No se pudieron cargar los catálogos.')))
        cargarLista()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tipo])

    // ------------------------------------------------------------ modal de la nota
    const [abierta, setAbierta] = useState(false)
    const [cab, setCab] = useState<Cabecera | null>(null)
    const [lineas, setLineas] = useState<LineaNota[]>([])
    const [aviso, setAviso] = useState<string | null>(null)
    const [errores, setErrores] = useState<Set<string>>(new Set())
    const [sacudir, setSacudir] = useState(0)
    const [exito, setExito] = useState<string | null>(null)
    const [guardando, setGuardando] = useState(false)
    const [abriendo, setAbriendo] = useState<number | null>(null)
    const [confirmar, setConfirmar] = useState<null | 'nota' | 'filas'>(null)
    const [lotes, setLotes] = useState<Record<string, LoteConSaldo[]>>({})
    const numeroManual = useRef(false)

    const centroDefecto = cat?.centrosCosto.find(c => c.PorDefecto)?.Cod_CC ?? cat?.centrosCosto[0]?.Cod_CC ?? ''
    const concepto = cat?.conceptos.find(c => c.Codigo_Op === cab?.concepto)
    const esTransferencia = esSalida && Number(concepto?.EsTransferencia) === 1
    const cerrado = !!(cab && cat?.fechaCierre && cab.fecha && cab.fecha <= soloFecha(cat.fechaCierre))

    // Opciones de los combos (mismo Combo con buscador de Contabilidad)
    const opConceptos = useMemo(() => (cat?.conceptos ?? []).map(c => ({ id: c.Codigo_Op, codigo: c.Codigo_Op, nombre: c.Operacion })), [cat])
    const opDocumentos = useMemo(() => (cat?.documentos ?? []).map(d => ({ id: d.Cod_Tipo, codigo: d.Cod_Tipo, nombre: d.Descripcion })), [cat])
    const opAlmacenes = useMemo(() => (cat?.almacenes ?? []).map(a => ({ id: String(a.IdAlmacen), codigo: a.Codigo_Alm, nombre: a.Descripcion })), [cat])
    const opCentros = useMemo(() => (cat?.centrosCosto ?? []).map(c => ({ id: c.Cod_CC, codigo: c.Cod_CC, nombre: c.Descripcion })), [cat])

    const fallar = (mensaje: string, campos: string[] = []) => {
        setAviso(mensaje); setErrores(new Set(campos)); setSacudir(s => s + 1); setExito(null)
    }
    const limpiarError = (campo: string) => setErrores(e => { if (!e.has(campo)) return e; const n = new Set(e); n.delete(campo); return n })

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
        setAviso(null); setErrores(new Set()); setExito(null); setAbierta(true)
    }

    const cargarNota = async (id: number) => {
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
    }

    const abrir = async (id: number) => {
        setAbriendo(id); setAvisoLista(null)
        try { await cargarNota(id); setAviso(null); setErrores(new Set()); setExito(null); setAbierta(true) }
        catch (e) { setAvisoLista(mensajeError(e, 'No se pudo abrir la nota.')) }
        finally { setAbriendo(null) }
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

    const set = (c: Partial<Cabecera>) => { setCab(x => (x ? { ...x, ...c } : x)); Object.keys(c).forEach(limpiarError) }
    const cambiar = (clave: string, cambios: Partial<LineaNota>) => {
        setLineas(ls => ls.map(l => (l.clave === clave ? { ...l, ...cambios } : l)))
        Object.keys(cambios).forEach(k => limpiarError(`${clave}:${k}`))
    }

    const guardar = async () => {
        if (!cab) return
        const faltan: [string, string][] = []
        if (!cab.fecha) faltan.push(['fecha', 'fecha'])
        if (!cab.concepto) faltan.push(['concepto', T.concepto.toLowerCase()])
        if (!cab.documento) faltan.push(['documento', 'documento'])
        if (!cab.serie.trim()) faltan.push(['serie', 'serie'])
        if (!cab.persona) faltan.push(['persona', T.persona.toLowerCase()])
        if (!cab.almacen) faltan.push(['almacen', 'almacén'])
        if (faltan.length) return fallar(`Completa: ${faltan.map(f => f[1]).join(', ')}.`, faltan.map(f => f[0]))
        if (cerrado) return fallar('EL REGISTRO ESTA FUERA DE FECHA DE CIERRE CONTABLE Y NO SE GUARDARA', ['fecha'])
        const conDatos = lineas.filter(l => l.codigoArt)
        if (conDatos.length === 0) return fallar('Agrega al menos un artículo.', lineas[0] ? [`${lineas[0].clave}:codigoArt`] : [])
        const malas = conDatos.filter(l => !(Number(l.cantidad) > 0))
        if (malas.length) return fallar(`La cantidad debe ser mayor que 0 (${malas.length} fila${malas.length === 1 ? '' : 's'}).`, malas.map(l => `${l.clave}:cantidad`))
        if (esTransferencia) {
            const sinDestino = conDatos.filter(l => !l.almacenDestino || l.almacenDestino === cab.almacen)
            if (sinDestino.length) return fallar('Elige el almacén de transferencia de cada fila (distinto del almacén de origen).', sinDestino.map(l => `${l.clave}:almacenDestino`))
        }
        setGuardando(true); setAviso(null); setErrores(new Set())
        try {
            const r = await AlmacenService.guardar(tipo, cab.id, {
                fecha: cab.fecha, concepto: cab.concepto, documento: cab.documento, serie: cab.serie.trim(),
                numero: cab.numero ? Number(cab.numero) : null,
                ...(esSalida ? { cliente: cab.persona } : { proveedor: cab.persona }),
                almacen: Number(cab.almacen), observaciones: cab.observaciones,
                detalle: conDatos.map(l => ({ ...l, almacenDestino: esTransferencia ? l.almacenDestino : '' })),
            })
            await cargarNota(Number(r.data?.Codigo_Mvto))
            setExito(r.message)
            toast({ title: 'Guardado', description: r.message })
            cargarLista()
        } catch (e) { fallar(mensajeError(e, 'No se pudo guardar la nota.')) }
        finally { setGuardando(false) }
    }

    const eliminar = async () => {
        if (!cab?.id) return
        const que = confirmar; setConfirmar(null); setAviso(null)
        try {
            if (que === 'nota') {
                const r = await AlmacenService.eliminar(tipo, cab.id)
                toast({ title: 'Eliminada', description: r.message })
                setAbierta(false); setCab(null); cargarLista()
            } else {
                const ids = lineas.filter(l => l.marcada && l.id).map(l => Number(l.id))
                const r = await AlmacenService.eliminarDetalle(tipo, cab.id, ids)
                await cargarNota(cab.id)
                setExito(r.message || 'Filas eliminadas.')
                cargarLista()
            }
        } catch (e) { fallar(mensajeError(e, 'No se pudo eliminar.')) }
    }

    const imprimir = async () => {
        if (!cab?.id) return
        try {
            const filasR = await AlmacenService.reporte(tipo, cab.id)
            if (!filasR.length) return fallar('La nota no tiene líneas para imprimir.')
            imprimirNota(T.nota, filasR, esSalida)
        } catch (e) { fallar(mensajeError(e, 'No se pudo preparar la impresión.')) }
    }

    const marcadas = lineas.filter(l => l.marcada && l.id).length
    const totales = useMemo(() => ({
        cantidad: lineas.reduce((a, l) => a + (Number(l.cantidad) || 0), 0),
        costo: lineas.reduce((a, l) => a + (Number(l.costoTotal) || 0), 0),
    }), [lineas])
    const totalLista = useMemo(() => filas.reduce((a, f) => a + num(f.CostoTotal), 0), [filas])
    const err = (c: string) => errores.has(c)

    // ------------------------------------------------------------ vista
    return (
        <div className="grid grid-cols-1 gap-4 p-4 md:p-6">
            {/* Cabecera de página (estilo Contabilidad) */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25"><IconoTipo className="h-5 w-5" /></span>
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Almacén</p>
                        <h1 className="text-xl font-bold leading-tight sm:text-2xl">{T.titulo}</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">{T.sub}</p>
                    </div>
                </div>
                <Button onClick={nueva} disabled={!cat} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 hover:from-blue-700 hover:to-indigo-700">
                    <FilePlus2 className="mr-2 h-4 w-4" /> Nueva {T.nota.toLowerCase()}
                </Button>
            </div>

            <AvisoAmbar mensaje={avisoLista} onCerrar={() => setAvisoLista(null)} />

            {/* Filtros */}
            <div className="rounded-xl border bg-card p-3 shadow-sm sm:p-4">
                <form className="grid grid-cols-1 gap-3 sm:grid-cols-[10rem_10rem_1fr_auto] sm:items-end" onSubmit={e => { e.preventDefault(); cargarLista() }}>
                    <Campo label="Desde"><input type="date" className={claseInput} value={desde} onChange={e => setDesde(e.target.value)} /></Campo>
                    <Campo label="Hasta"><input type="date" className={claseInput} value={hasta} onChange={e => setHasta(e.target.value)} /></Campo>
                    <Campo label="Buscar">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input className={cn(claseInput, 'pl-9')} placeholder={`Número, ${T.persona.toLowerCase()} u observación`} value={buscar} onChange={e => setBuscar(e.target.value)} />
                        </div>
                    </Campo>
                    <Button type="submit" variant="outline" className="h-9" disabled={cargandoLista}>
                        {cargandoLista ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Search className="mr-1.5 h-4 w-4" />} Buscar
                    </Button>
                </form>
            </div>

            {/* Listado */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                            <tr>
                                <th className="px-3 py-2.5">Fecha</th><th className="px-3 py-2.5">Documento</th><th className="px-3 py-2.5">Concepto</th>
                                <th className="px-3 py-2.5">{T.persona}</th><th className="px-3 py-2.5">Almacén</th>
                                <th className="px-3 py-2.5 text-right">Ítems</th><th className="px-3 py-2.5 text-right">Cantidad</th>
                                {!esSalida && <th className="px-3 py-2.5 text-right">Costo total</th>}
                                <th className="px-3 py-2.5">Observaciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {cargandoLista && filas.length === 0 && (
                                <tr><td colSpan={9} className="px-3 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
                            )}
                            {filas.map(f => (
                                <tr key={f.Codigo_Mvto} onClick={() => abrir(f.Codigo_Mvto)} className="cursor-pointer transition-colors hover:bg-blue-50/60 dark:hover:bg-blue-950/20">
                                    <td className="whitespace-nowrap px-3 py-2">{dmy(f.Fecha_Mvto)}</td>
                                    <td className="whitespace-nowrap px-3 py-2">
                                        <span className="font-mono font-semibold text-blue-700 dark:text-blue-300">{f.Serie_Doc}-{f.Nro_Doc}</span>
                                        <span className="ml-1.5 text-[10px] text-muted-foreground">{f.Codigo_Doc}</span>
                                        {abriendo === f.Codigo_Mvto && <Loader2 className="ml-1.5 inline h-3.5 w-3.5 animate-spin" />}
                                    </td>
                                    <td className="px-3 py-2">
                                        {f.Operacion}
                                        {f.Transferencia === '1' && <Badge variant="outline" className="ml-1.5 gap-1 border-indigo-300 text-[10px] text-indigo-700 dark:text-indigo-300"><ArrowRightLeft className="h-3 w-3" />{f.AlmacenesDestino ?? 'Transferencia'}</Badge>}
                                    </td>
                                    <td className="max-w-[16rem] truncate px-3 py-2">{f.Proveedor ?? f.Cliente}</td>
                                    <td className="px-3 py-2">{f.Almacen}</td>
                                    <td className="px-3 py-2 text-right">{f.Items ?? f.Lineas}</td>
                                    <td className="px-3 py-2 text-right font-mono">{fmt(f.CantidadTotal)}</td>
                                    {!esSalida && <td className="whitespace-nowrap px-3 py-2 text-right font-mono">{soles(f.CostoTotal)}</td>}
                                    <td className="max-w-[14rem] truncate px-3 py-2 text-muted-foreground">{f.Glosa}</td>
                                </tr>
                            ))}
                            {!cargandoLista && filas.length === 0 && (
                                <tr><td colSpan={9} className="px-3 py-12 text-center text-muted-foreground">
                                    <ClipboardList className="mx-auto mb-2 h-7 w-7 opacity-50" /> No hay notas en el rango elegido.
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
                    <span>{filas.length} nota{filas.length === 1 ? '' : 's'} · clic en una fila para abrirla</span>
                    {!esSalida && filas.length > 0 && <span>Costo total del periodo: <b className="font-mono text-foreground">{soles(totalLista)}</b></span>}
                </div>
            </div>

            {/* Modal de la nota */}
            <Dialog open={abierta} onOpenChange={o => { if (!o && !guardando) setAbierta(false) }}>
                {cab && cat && (
                    <DialogContent key={sacudir} className={cn("flex max-h-[94vh] max-w-6xl flex-col gap-0 overflow-hidden p-0", sacudir > 0 && "almacen-sacudir")}
                                   closeClassName="text-white opacity-90 hover:opacity-100 z-10">
                        <DialogHeader className="shrink-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-4 py-4 text-left text-white sm:px-6">
                            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100">
                                <IconoTipo className="h-3.5 w-3.5" /> {cab.id ? T.nota : `${T.nota} nueva`}
                            </p>
                            <DialogTitle className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pr-8 text-xl font-bold">
                                <span className="font-mono tracking-wider">{cab.serie || '—'}-{cab.numero || '…'}</span>
                                {esTransferencia && <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold"><ArrowRightLeft className="h-3.5 w-3.5" /> Transferencia entre almacenes</span>}
                                {cerrado && <span className="rounded-full bg-amber-400/90 px-2.5 py-0.5 text-xs font-semibold text-amber-950">Periodo cerrado</span>}
                            </DialogTitle>
                            <DialogDescription className="mt-1 text-xs text-blue-100">
                                {cab.id ? `${concepto?.Operacion ?? ''} · ${dmy(cab.fecha)}` : 'Los campos con (*) son obligatorios. El número se sugiere según el documento y la serie.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/30 px-3 py-4 sm:px-5">
                            {exito && (
                                <div className="flex items-center gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 animate-in fade-in-0 slide-in-from-top-1 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                                    <span className="almacen-exito almacen-brillo flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"><CheckCircle2 className="h-4 w-4" /></span>
                                    <span className="flex-1 font-medium">{exito}</span>
                                    <button type="button" onClick={() => setExito(null)} className="rounded p-0.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/40" aria-label="Cerrar"><X className="h-4 w-4" /></button>
                                </div>
                            )}
                            <AvisoAmbar mensaje={aviso} onCerrar={() => setAviso(null)} />

                            <Seccion titulo="Datos de la nota">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
                                    <Campo label="Fecha" obligatorio className="lg:col-span-2">
                                        <input type="date" className={cn(claseInput, err('fecha') && 'almacen-campo-error')} value={cab.fecha} onChange={e => set({ fecha: e.target.value })} />
                                    </Campo>
                                    <Campo label={T.concepto} obligatorio className="lg:col-span-4">
                                        <div className={cn('rounded-md', err('concepto') && 'almacen-campo-error ring-1 ring-amber-400')}><Combo items={opConceptos} valor={cab.concepto} onCambio={v => set({ concepto: v })} placeholder="Elige el concepto" /></div>
                                    </Campo>
                                    <Campo label="Documento" obligatorio className="lg:col-span-3">
                                        <div className={cn('rounded-md', err('documento') && 'almacen-campo-error ring-1 ring-amber-400')}><Combo items={opDocumentos} valor={cab.documento} onCambio={v => { numeroManual.current = !!cab.id; set({ documento: v }) }} /></div>
                                    </Campo>
                                    <Campo label="Serie" obligatorio className="lg:col-span-1">
                                        <input list={`series-${tipo}`} className={cn(claseInput, 'font-mono uppercase', err('serie') && 'almacen-campo-error')} value={cab.serie}
                                               onChange={e => { numeroManual.current = !!cab.id; set({ serie: e.target.value.toUpperCase() }) }} />
                                        <datalist id={`series-${tipo}`}>{cat.series.map(s => <option key={s.Serie_Doc} value={s.Serie_Doc} />)}</datalist>
                                    </Campo>
                                    <Campo label="Número" className="lg:col-span-2" ayuda={cab.id ? undefined : 'Sugerido'}>
                                        <input inputMode="numeric" className={cn(claseInput, 'text-right font-mono')} value={cab.numero}
                                               onChange={e => { numeroManual.current = true; set({ numero: e.target.value.replace(/\D/g, '') }) }} />
                                    </Campo>
                                    <Campo label={T.persona} obligatorio className="lg:col-span-6">
                                        <BuscadorRemoto<PersonaAlmacen>
                                            etiqueta={T.persona.toLowerCase()} placeholder={`Buscar ${T.persona.toLowerCase()}`} icono={esSalida ? User : Building2}
                                            descripcion="Por RUC, DNI, razón social o nombre comercial" error={err('persona')}
                                            valor={cab.persona ? cab.personaNombre : ''} subValor={cab.persona ? `RUC ${cab.persona}` : undefined}
                                            buscar={q => AlmacenService.personas(tipo, q)} getKey={p => p.Codigo}
                                            getLabel={p => (p.Nombre || '').trim()} getSub={p => [p.RUC || p.Codigo, (p.NombreComercial || '').trim()].filter(Boolean).join(' · ')}
                                            onElegir={p => set({ persona: p.Codigo, personaNombre: (p.Nombre || '').trim() })} />
                                    </Campo>
                                    <Campo label={esTransferencia ? 'Almacén de origen' : 'Almacén'} obligatorio className="lg:col-span-3">
                                        <div className={cn('rounded-md', err('almacen') && 'almacen-campo-error ring-1 ring-amber-400')}><Combo items={opAlmacenes} valor={cab.almacen} onCambio={v => set({ almacen: v })} /></div>
                                    </Campo>
                                    <Campo label="Observaciones" className="lg:col-span-3">
                                        <input className={claseInput} maxLength={255} value={cab.observaciones} onChange={e => set({ observaciones: e.target.value })} placeholder="Opcional" />
                                    </Campo>
                                </div>
                            </Seccion>

                            <Seccion titulo="Artículos" ayuda={esSalida ? 'El lote sugiere los que tienen saldo en el almacén de origen; si la cantidad lo supera se avisa, pero se puede grabar (igual que en Access).' : 'Las filas sin artículo no se guardan.'}>
                                <div className="overflow-x-auto rounded-lg border bg-background">
                                    <table className="w-full min-w-[60rem] text-sm">
                                        <thead className="border-b bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                                            <tr>
                                                <th className="w-9 px-2 py-2 text-center" title="Marcar para eliminar">E</th>
                                                <th className="px-2 py-2">Artículo</th>
                                                {esSalida && <th className="w-48 px-2 py-2">Lote</th>}
                                                <th className="w-28 px-2 py-2 text-right">Cantidad</th>
                                                {!esSalida && <th className="w-36 px-2 py-2 text-right">Costo total</th>}
                                                {!esSalida && <th className="w-32 px-2 py-2">Lote</th>}
                                                {!esSalida && <th className="w-40 px-2 py-2">Fecha vcto.</th>}
                                                <th className="w-48 px-2 py-2">Centro de costos</th>
                                                {esTransferencia && <th className="w-44 px-2 py-2">Almacén transferencia</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {lineas.map((l, i) => {
                                                const lotesArt = esSalida && l.codigoArt ? lotes[claveLotes(l.codigoArt)] : undefined
                                                const saldo = lotesArt?.find(x => x.Lote === l.lote)?.SumaDeSaldo
                                                const excede = esSalida && saldo !== undefined && Number(l.cantidad) > Number(saldo)
                                                return (
                                                    <tr key={l.clave} className={cn("align-top transition-colors animate-in fade-in-0", l.marcada && "bg-red-50/70 dark:bg-red-950/20")}>
                                                        <td className="px-2 py-2 text-center">
                                                            <input type="checkbox" className="mt-2 h-4 w-4 accent-red-600" checked={l.marcada} disabled={!l.id} title={l.id ? 'Marcar para eliminar' : 'Fila aún no guardada'}
                                                                   onChange={e => cambiar(l.clave, { marcada: e.target.checked })} aria-label={`Marcar fila ${i + 1}`} />
                                                        </td>
                                                        <td className="px-2 py-1.5">
                                                            <BuscadorRemoto<ArticuloAlmacen>
                                                                etiqueta="artículo" placeholder="Buscar artículo" error={err(`${l.clave}:codigoArt`)}
                                                                valor={l.codigoArt ? `${l.articulo}` : ''}
                                                                buscar={q => AlmacenService.articulos(tipo, q)} getKey={a => a.Codigo_Art}
                                                                getLabel={a => a.NombreItem} getSub={a => a.Codigo_Art} getExtra={a => a.AbrevUnidMed ?? ''}
                                                                onElegir={a => cambiar(l.clave, { codigoArt: a.Codigo_Art, articulo: a.NombreItem, unidad: a.AbrevUnidMed ?? '', lote: '' })} />
                                                            {l.codigoArt && <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">{l.codigoArt}{l.unidad ? ` · ${l.unidad}` : ''}</span>}
                                                        </td>
                                                        {esSalida && (
                                                            <td className="px-2 py-1.5">
                                                                <input list={`lotes-${l.clave}`} className={cn(claseInput, 'font-mono')} value={l.lote} placeholder={lotesArt?.length ? 'Elige o escribe' : 'Lote'}
                                                                       onChange={e => cambiar(l.clave, { lote: e.target.value })} />
                                                                <datalist id={`lotes-${l.clave}`}>
                                                                    {(lotesArt ?? []).map(x => <option key={x.Lote} value={x.Lote}>{`Saldo ${fmt(x.SumaDeSaldo, 0)}${x.MinVctoItem ? ' · vence ' + dmy(x.MinVctoItem) : ''}`}</option>)}
                                                                </datalist>
                                                                {saldo !== undefined && <span className="mt-0.5 block text-[10px] text-muted-foreground">Saldo del lote: {fmt(saldo, 0)}</span>}
                                                            </td>
                                                        )}
                                                        <td className="px-2 py-1.5">
                                                            <input inputMode="decimal" className={cn(claseInput, 'text-right font-mono', (excede || err(`${l.clave}:cantidad`)) && 'almacen-campo-error')}
                                                                   value={l.cantidad} onChange={e => cambiar(l.clave, { cantidad: e.target.value.replace(/[^\d.]/g, '') })} />
                                                            {excede && <span className="mt-0.5 block text-[10px] font-medium text-amber-700 dark:text-amber-400">Supera el saldo del lote</span>}
                                                        </td>
                                                        {!esSalida && (
                                                            <td className="px-2 py-1.5">
                                                                <div className="relative">
                                                                    <span className="pointer-events-none absolute left-2.5 top-2 text-sm text-muted-foreground">S/</span>
                                                                    <input inputMode="decimal" className={cn(claseInput, 'pl-8 text-right font-mono')} value={l.costoTotal}
                                                                           onChange={e => cambiar(l.clave, { costoTotal: e.target.value.replace(/[^\d.]/g, '') })} />
                                                                </div>
                                                            </td>
                                                        )}
                                                        {!esSalida && <td className="px-2 py-1.5"><input className={cn(claseInput, 'font-mono')} value={l.lote} onChange={e => cambiar(l.clave, { lote: e.target.value })} /></td>}
                                                        {!esSalida && <td className="px-2 py-1.5"><input type="date" className={claseInput} value={l.fechaVcto} onChange={e => cambiar(l.clave, { fechaVcto: e.target.value })} /></td>}
                                                        <td className="px-2 py-1.5"><Combo items={opCentros} valor={l.centroCostos} onCambio={v => cambiar(l.clave, { centroCostos: v })} /></td>
                                                        {esTransferencia && (
                                                            <td className="px-2 py-1.5">
                                                                <div className={cn('rounded-md', err(`${l.clave}:almacenDestino`) && 'almacen-campo-error ring-1 ring-amber-400')}>
                                                                    <Combo items={opAlmacenes.filter(a => a.id !== cab.almacen)} valor={l.almacenDestino} onCambio={v => cambiar(l.clave, { almacenDestino: v })} placeholder="Destino" />
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                        <tfoot className="border-t bg-muted/40 text-sm">
                                            <tr>
                                                <td colSpan={esSalida ? 3 : 2} className="px-2 py-2">
                                                    <Button size="sm" variant="outline" className="border-dashed" onClick={() => setLineas(ls => [...ls, lineaVacia(centroDefecto)])}><Plus className="mr-1 h-4 w-4" /> Agregar artículo</Button>
                                                </td>
                                                <td className="px-2 py-2 text-right font-mono font-semibold">{fmt(totales.cantidad)}</td>
                                                {!esSalida && <td className="whitespace-nowrap px-2 py-2 text-right font-mono font-semibold">{soles(totales.costo)}</td>}
                                                <td colSpan={9} />
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </Seccion>
                        </div>

                        {/* Botones abajo (estilo Contabilidad) */}
                        <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                            <div className="flex flex-wrap gap-1.5">
                                {cab.id && (
                                    <Button variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40" disabled={guardando || cerrado} onClick={() => setConfirmar('nota')}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar nota
                                    </Button>
                                )}
                                {cab.id && (
                                    <Button variant="ghost" disabled={guardando || cerrado || marcadas === 0} onClick={() => setConfirmar('filas')}>
                                        <ListX className="mr-2 h-4 w-4" /> Eliminar filas marcadas{marcadas ? ` (${marcadas})` : ''}
                                    </Button>
                                )}
                                {cab.id && <Button variant="ghost" disabled={guardando} onClick={imprimir}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>}
                                {cab.id && <Button variant="ghost" disabled={guardando} onClick={() => cargarNota(cab.id!).then(() => { setAviso(null); setExito(null) })}><RefreshCw className="mr-2 h-4 w-4" /> Actualizar</Button>}
                            </div>
                            <div className="flex w-full gap-2 sm:w-auto">
                                <Button variant="outline" className="flex-1 sm:flex-none" disabled={guardando} onClick={() => setAbierta(false)}>Cerrar</Button>
                                {cab.id && <Button variant="outline" className="flex-1 sm:flex-none" disabled={guardando} onClick={nueva}><FilePlus2 className="mr-2 h-4 w-4" /> Nueva</Button>}
                                <Button disabled={guardando || cerrado} onClick={guardar}
                                        className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 hover:from-blue-700 hover:to-indigo-700 sm:flex-none">
                                    {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    {guardando ? 'Guardando…' : cab.id ? 'Guardar cambios' : 'Guardar nota'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                )}
            </Dialog>

            <Confirmar abierto={confirmar === 'nota'} peligro textoAccion="Eliminar nota"
                       titulo={`¿Eliminar la ${T.nota.toLowerCase()} ${cab?.serie}-${cab?.numero}?`}
                       descripcion="Se borran la nota, su detalle y sus movimientos de kardex. No se puede deshacer."
                       onCancelar={() => setConfirmar(null)} onAceptar={eliminar} />
            <Confirmar abierto={confirmar === 'filas'} peligro textoAccion="Eliminar filas"
                       titulo={`¿Eliminar ${marcadas} fila${marcadas === 1 ? '' : 's'} marcada${marcadas === 1 ? '' : 's'}?`}
                       descripcion="Se borran las filas marcadas y se recalcula el kardex de la nota. No se puede deshacer."
                       onCancelar={() => setConfirmar(null)} onAceptar={eliminar} />
        </div>
    )
}

/** Impresión de la nota (informe Access "Nota Ingreso Almacen" / "Nota Salida Almacen"). */
function imprimirNota(titulo: string, filas: any[], esSalida: boolean) {
    const c = filas[0]
    const esc = (v: any) => String(v ?? '').replace(/[&<>"]/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[s] as string))
    const total = filas.reduce((a, f) => a + num(f.Cost_Tot), 0)
    const lineas = filas.map(f => `<tr><td>${esc(f.BienesServicios)}</td><td>${esc(f.AbrevUnidMed)}</td><td class="n">${fmt(esSalida ? f.Cantidad_Sal : f.Cantidad_Ing)}</td><td>${esc(f.Lote)}</td><td>${dmy(f.FechaVctoLote || f.VctoItemKardex)}</td>${esSalida ? '' : `<td class="n">${soles(f.Cost_Tot)}</td>`}</tr>`).join('')
    const w = window.open('', '_blank', 'width=900,height=700')
    if (!w) return
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(titulo)} ${esc(c.Documento)}</title>
<style>body{font-family:Arial,sans-serif;font-size:12px;margin:28px;color:#111}h1{font-size:16px;margin:14px 0 4px}table{width:100%;border-collapse:collapse;margin-top:12px}
th,td{border-bottom:1px solid #ccc;padding:5px 6px;text-align:left}th{background:#f1f5f9;font-size:11px;text-transform:uppercase}.n{text-align:right;white-space:nowrap}.g{display:grid;grid-template-columns:140px 1fr;gap:3px 10px;margin-top:8px}tfoot td{font-weight:bold;border-top:2px solid #333}</style></head><body>
<div><b>${esc(c.NombreRazSocial)}</b><br>RUC ${esc(c.RUC)}<br>${esc(c.Domicilio)}</div>
<h1>${esc(titulo.toUpperCase())} ${esc(c.Documento)}</h1>
<div class="g"><span>Fecha</span><b>${dmy(c.Fecha_Mvto)}</b><span>Motivo</span><span>${esc(c.Motivo)}</span><span>${esSalida ? 'Cliente' : 'Proveedor'}</span><span>${esc(c.ClienteProveedor)}</span><span>Almacén</span><span>${esc(c.Almacen)}</span><span>Observaciones</span><span>${esc(c.Glosa)}</span></div>
<table><thead><tr><th>Bienes y servicios</th><th>Und.</th><th class="n">Cantidad</th><th>Lote</th><th>Vence</th>${esSalida ? '' : '<th class="n">Costo total</th>'}</tr></thead><tbody>${lineas}</tbody>
${esSalida ? '' : `<tfoot><tr><td colspan="5" class="n">Total</td><td class="n">${soles(total)}</td></tr></tfoot>`}</table>
<script>window.onload=()=>window.print()</script></body></html>`)
    w.document.close()
}

