'use client'

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ComboSelect } from "@/components/ui/combo-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    AlertCircle, AlertTriangle, Boxes, CalendarClock, ClipboardList, ClipboardPlus, FlaskConical, History, Layers, Loader2, Package, Search, Warehouse,
} from "lucide-react"
import { toast } from "@/app/hooks/useToast"
import { TomaInventarioService } from "@/app/services/inventario/TomaInventarioService"
import { TomaCombo, TomaListado, TomaListadoFila, TomaLoteFila, TomaLotes } from "@/app/types/toma-inventario-types"
import { ExportComisionPdf } from "@/components/contabilidad/comisiones/ExportComisionPdf"
import { ReportePdf } from "@/components/contabilidad/comisiones/pdfComision"
import { fechaDMY, KpiCard, Th } from "@/components/contabilidad/comisiones/ui"
import { LoteBadge, LotesBadges, lotesTexto } from "@/components/inventario/toma/LoteBadge"
import { HistorialTomas } from "@/components/inventario/toma/HistorialTomas"
import { EditorToma } from "@/components/inventario/toma/EditorToma"

type Modo = 'listado' | 'lotes' | 'historial'

const TODOS: TomaCombo = { valor: '', codigo: '', texto: 'Todos los laboratorios' }
const LINEA = '________________'
const hoyISO = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const cant = (v: number) => Number(v ?? 0).toLocaleString('es-PE', { maximumFractionDigits: 2 })

/** Agrupa filas por una clave conservando el orden en que llegan del SP. */
function agrupar<T>(filas: T[], clave: (f: T) => string): [string, T[]][] {
    const m = new Map<string, T[]>()
    for (const f of filas) {
        const k = clave(f)
        if (!m.has(k)) m.set(k, [])
        m.get(k)!.push(f)
    }
    return [...m.entries()]
}

/**
 * Toma de inventario. Reemplaza en la web a los reportes Access
 * "ListadoToma Inventarios" (hoja para contar, por laboratorio y sublínea)
 * y "SALDO_itemsxlab" (saldo del sistema por almacén, lote y vencimiento).
 */
export default function TomaInventarioPage() {
    const [modo, setModo] = useState<Modo>('listado')
    const [laboratorios, setLaboratorios] = useState<TomaCombo[]>([TODOS])
    const [almacenes, setAlmacenes] = useState<TomaCombo[]>([])
    const [laboratorio, setLaboratorio] = useState('')
    const [almacen, setAlmacen] = useState('todos')
    const [fecha, setFecha] = useState(hoyISO())
    const [verSaldo, setVerSaldo] = useState(false)
    const [buscar, setBuscar] = useState('')

    const [listado, setListado] = useState<TomaListado | null>(null)
    const [lotes, setLotes] = useState<TomaLotes | null>(null)
    const [generando, setGenerando] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Tomas del usuario
    const [tomaAbierta, setTomaAbierta] = useState<number | null>(null)
    const [dialogoCrear, setDialogoCrear] = useState(false)
    const [observacion, setObservacion] = useState('')
    const [creando, setCreando] = useState(false)

    useEffect(() => {
        TomaInventarioService.combos()
            .then(c => { setLaboratorios([TODOS, ...c.laboratorios]); setAlmacenes(c.almacenes) })
            .catch(() => toast({ title: "Error", description: "No se pudieron cargar laboratorios y almacenes.", variant: "destructive" }))
    }, [])

    const generar = useCallback(async () => {
        if (modo === 'historial') return
        setGenerando(true)
        setError(null)
        try {
            if (modo === 'listado') setListado(await TomaInventarioService.listado(laboratorio))
            else setLotes(await TomaInventarioService.lotes({ fecha, laboratorio, almacen: almacen === 'todos' ? '' : almacen }))
        } catch (e: any) {
            if (modo === 'listado') setListado(null); else setLotes(null)
            setError(e?.response?.data?.message || "No se pudo generar el reporte.")
        } finally {
            setGenerando(false)
        }
    }, [modo, laboratorio, fecha, almacen])

    const q = buscar.trim().toUpperCase()
    const coincide = (f: { Codigo: string; Producto: string }) => !q || f.Codigo.includes(q) || f.Producto.toUpperCase().includes(q)
    const filasListado = useMemo(() => (listado?.filas ?? []).filter(coincide), [listado, q]) // eslint-disable-line react-hooks/exhaustive-deps
    const filasLotes = useMemo(() => (lotes?.filas ?? []).filter(coincide), [lotes, q]) // eslint-disable-line react-hooks/exhaustive-deps
    const corte = lotes?.fechaCorte ?? fecha
    const vencido = (f: TomaLoteFila) => !!f.Vencimiento && String(f.Vencimiento).slice(0, 10) < corte

    const nombreLab = laboratorios.find(l => l.valor === laboratorio)
    const tituloLab = nombreLab && nombreLab.valor ? `${nombreLab.codigo}  ${nombreLab.texto}` : 'Todos los laboratorios'
    const nombreAlm = almacen === 'todos' ? 'Todos los almacenes' : `Almacén ${almacenes.find(a => a.valor === almacen)?.texto ?? almacen}`

    /** Crea la toma con los mismos filtros del reporte generado y la abre para contar. */
    const crearToma = async () => {
        setCreando(true)
        try {
            const r = await TomaInventarioService.crear(modo === 'lotes'
                ? { modo: 'LOTE', laboratorio, almacen: almacen === 'todos' ? '' : almacen, fecha: lotes?.fechaCorte ?? fecha, observacion }
                : { modo: 'LISTADO', laboratorio, observacion })
            toast({ title: 'Toma de inventario creada', description: `N.º ${String(r.idToma).padStart(5, '0')} con ${r.lineas} líneas para contar.` })
            setDialogoCrear(false)
            setObservacion('')
            setModo('historial')
            setTomaAbierta(r.idToma)
        } catch (e: any) {
            toast({ title: 'No se pudo crear la toma', description: e?.response?.data?.message || 'Inténtalo de nuevo.', variant: 'destructive' })
        } finally {
            setCreando(false)
        }
    }
    const lineasACrear = modo === 'lotes' ? lotes?.filas.length ?? 0 : listado?.filas.length ?? 0
    const botonCrear = (
        <Button onClick={() => setDialogoCrear(true)} disabled={!lineasACrear}
                className="h-9 gap-1.5 bg-emerald-600 font-semibold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-700">
            <ClipboardPlus className="h-4 w-4" /> <span className="hidden sm:inline">Crear toma de inventario</span><span className="sm:hidden">Crear toma</span>
        </Button>
    )

    // ── PDF ──────────────────────────────────────────────────────────────────
    const pdfListado = useMemo<ReportePdf | null>(() => listado && ({
        recuadroTitulo: 'Listado Toma de Inventarios',
        recuadroDetalle: `${tituloLab}  ·  ${filasListado.length} artículos`,
        periodo: `Impreso ${fechaDMY(hoyISO())}`,
        tarjetas: [],
        columnas: [
            { clave: 'cod', titulo: 'Código', ancho: 66 },
            { clave: 'prod', titulo: 'Item', ancho: 0 },
            { clave: 'und', titulo: 'Und', ancho: 34 },
            { clave: 'lote', titulo: 'Lote referencial (vence)', ancho: 150, opcional: true },
            { clave: 'inv', titulo: 'Inventario', ancho: 110 },
        ],
        filas: agrupar(filasListado, f => `${f.CodigoLaboratorio}|${f.CodigoSublinea}`).flatMap(([, fs]) => [
            { valores: { cod: fs[0].CodigoSublinea, prod: `${fs[0].Laboratorio}${fs[0].Sublinea !== fs[0].Laboratorio ? ' · ' + fs[0].Sublinea : ''}` }, colores: { cod: 'tema', prod: 'tema' } as const },
            ...fs.map(f => ({ valores: { cod: f.Codigo, prod: f.Producto, und: f.Unidad, lote: lotesTexto(f.Lotes), inv: LINEA }, colores: { cod: 'gris', und: 'gris', lote: 'gris', inv: 'gris' } as const })),
        ]),
        pie: `Toma de inventario · ${tituloLab}`,
    }), [listado, filasListado, tituloLab])

    const pdfLotes = useMemo<ReportePdf | null>(() => lotes && ({
        recuadroTitulo: 'Toma de Inventario por Lote',
        recuadroDetalle: `${nombreAlm}  ·  ${tituloLab}  ·  Corte ${fechaDMY(lotes.fechaCorte)}  ·  ${filasLotes.length} lotes`,
        periodo: `Corte ${fechaDMY(lotes.fechaCorte)}`,
        tarjetas: verSaldo ? [
            { etiqueta: 'Lotes con saldo', valor: String(lotes.totales.lineas) },
            { etiqueta: 'Unidades en sistema', valor: cant(lotes.totales.unidades) },
            { etiqueta: 'Saldos negativos', valor: String(lotes.totales.negativos), color: 'rojo' },
            { etiqueta: 'Lotes vencidos', valor: String(lotes.totales.vencidos), color: 'ambar' },
        ] : [],
        columnas: [
            { clave: 'cod', titulo: 'Código', ancho: 62 },
            { clave: 'prod', titulo: 'Producto', ancho: 0 },
            { clave: 'und', titulo: 'Und', ancho: 30 },
            { clave: 'lote', titulo: 'Lote', ancho: 76 },
            { clave: 'vcto', titulo: 'Vence', ancho: 56 },
            ...(verSaldo ? [{ clave: 'saldo', titulo: 'Saldo sist.', ancho: 56, derecha: true }] : []),
            { clave: 'conteo', titulo: 'Conteo', ancho: 90 },
        ],
        filas: agrupar(filasLotes, f => `${f.IdAlmacen}|${f.IdLaboratorio}`).flatMap(([, fs]) => [
            { valores: { cod: fs[0].CodigoLaboratorio, prod: `${fs[0].Laboratorio} · Almacén ${fs[0].Almacen ?? fs[0].IdAlmacen}` }, colores: { cod: 'tema', prod: 'tema' } as const },
            ...fs.map(f => ({
                valores: { cod: f.Codigo, prod: f.Producto, und: f.Unidad, lote: f.Lote || '(sin lote)', vcto: fechaDMY(f.Vencimiento), saldo: cant(f.SaldoSistema), conteo: LINEA },
                colores: { cod: 'gris', und: 'gris', vcto: vencido(f) ? 'rojo' : 'texto', saldo: f.SaldoSistema < 0 ? 'rojo' : 'texto', conteo: 'gris' } as const,
            })),
        ]),
        pie: `Toma de inventario por lote · corte ${fechaDMY(lotes.fechaCorte)}`,
    }), [lotes, filasLotes, verSaldo, nombreAlm, tituloLab]) // eslint-disable-line react-hooks/exhaustive-deps

    const hayDatos = modo === 'listado' ? !!listado : !!lotes

    if (tomaAbierta) {
        return (
            <div className="grid grid-cols-1 gap-5 p-4 md:p-6">
                <EditorToma key={tomaAbierta} idToma={tomaAbierta} onVolver={() => { setTomaAbierta(null); setModo('historial') }} />
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-5 p-4 md:p-6">
            <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/30">
                    <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Toma de Inventario</h1>
                    <p className="text-sm md:text-base text-muted-foreground">
                        Hoja para el conteo físico por laboratorio y saldo del sistema por almacén, lote y vencimiento.
                    </p>
                </div>
            </div>

            <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
                <div className="flex h-10 w-fit rounded-lg border bg-muted p-0.5" role="tablist" aria-label="Modo">
                    {([['listado', 'Listado para contar', ClipboardList], ['lotes', 'Por lote', Layers], ['historial', 'Mis tomas', History]] as const).map(([v, t, Icono]) => (
                        <button key={v} type="button" role="tab" aria-selected={modo === v} onClick={() => { setModo(v); setError(null) }}
                                className={`inline-flex items-center gap-1.5 rounded-md px-3 text-sm whitespace-nowrap transition-colors md:px-3.5 ${
                                    modo === v ? 'bg-background font-semibold text-blue-700 shadow-sm dark:text-blue-400' : 'text-muted-foreground hover:text-foreground'}`}>
                            <Icono className="h-4 w-4" /> {t}
                        </button>
                    ))}
                </div>
            </div>

            {modo === 'historial' && <HistorialTomas onAbrir={setTomaAbierta} />}

            {modo !== 'historial' && <>
            <Card className="border-t-[3px] border-t-blue-600 bg-gradient-to-b from-background to-muted/30 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground">Laboratorio</Label>
                            <ComboSelect<TomaCombo>
                                value={laboratorio}
                                onChange={l => setLaboratorio(l.valor)}
                                items={laboratorios}
                                getKey={l => l.valor}
                                getLabel={l => l.valor ? `${l.codigo} · ${l.texto}` : l.texto}
                                placeholder="Todos los laboratorios"
                                searchPlaceholder="Buscar laboratorio..."
                                emptyText="No se encontraron laboratorios"
                            />
                        </div>
                        {modo === 'lotes' && (
                            <>
                                <div className="flex flex-col gap-1.5 xl:w-48">
                                    <Label className="text-xs font-semibold text-muted-foreground">Almacén</Label>
                                    <Select value={almacen} onValueChange={setAlmacen}>
                                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="todos">Todos</SelectItem>
                                            {almacenes.map(a => <SelectItem key={a.valor} value={a.valor}>{a.texto}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-1.5 xl:w-44">
                                    <Label className="text-xs font-semibold text-muted-foreground">Fecha de corte</Label>
                                    <Input type="date" className="h-10" value={fecha} max={hoyISO()} onChange={e => setFecha(e.target.value)} />
                                </div>
                                <label className="flex h-10 items-center gap-2 text-sm xl:pb-0">
                                    <Switch checked={verSaldo} onCheckedChange={setVerSaldo} />
                                    Mostrar saldo del sistema
                                </label>
                            </>
                        )}
                        <Button onClick={generar} disabled={generando}
                                className="h-10 gap-1.5 bg-blue-600 font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700">
                            {generando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            Generar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /><span>{error}</span>
                </div>
            )}

            {!hayDatos && !error && (
                <Card className="shadow-sm">
                    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                        <ClipboardList className="h-12 w-12 mb-3 opacity-20" />
                        <p className="text-sm font-medium">Elige el laboratorio y genera la hoja de toma de inventario</p>
                    </div>
                </Card>
            )}

            {modo === 'listado' && listado && (
                <>
                    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                        <KpiCard etiqueta="Laboratorios" icono={FlaskConical} iconoCls="bg-muted text-muted-foreground">
                            <p className="mt-1 font-mono text-lg font-bold sm:text-xl">{listado.totales.laboratorios}</p>
                        </KpiCard>
                        <KpiCard etiqueta="Artículos a contar" icono={Package} iconoCls="bg-blue-100 text-blue-700 dark:bg-blue-950">
                            <p className="mt-1 font-mono text-lg font-bold sm:text-xl text-blue-700 dark:text-blue-400">{listado.totales.articulos}</p>
                        </KpiCard>
                    </div>
                    <ListadoTabla filas={filasListado} buscar={buscar} setBuscar={setBuscar} titulo={tituloLab}
                                  pdf={pdfListado} corte={listado.fechaLotes ?? hoyISO()} accion={botonCrear} />
                </>
            )}

            {modo === 'lotes' && lotes && (
                <>
                    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                        <KpiCard etiqueta="Lotes con saldo" icono={Layers} iconoCls="bg-blue-100 text-blue-700 dark:bg-blue-950">
                            <p className="mt-1 font-mono text-lg font-bold sm:text-xl text-blue-700 dark:text-blue-400">{lotes.totales.lineas}</p>
                            <p className="text-xs text-muted-foreground">{lotes.totales.articulos} artículos</p>
                        </KpiCard>
                        <KpiCard etiqueta="Unidades en sistema" icono={Boxes} iconoCls="bg-violet-50 text-violet-600 dark:bg-violet-950">
                            <p className="mt-1 font-mono text-lg font-bold sm:text-xl">{verSaldo ? cant(lotes.totales.unidades) : '•••'}</p>
                            <p className="text-xs text-muted-foreground">{verSaldo ? `Al ${fechaDMY(lotes.fechaCorte)}` : 'Oculto: conteo a ciegas'}</p>
                        </KpiCard>
                        <KpiCard etiqueta="Saldos negativos" icono={AlertTriangle} iconoCls="bg-red-50 text-red-600 dark:bg-red-950">
                            <p className="mt-1 font-mono text-lg font-bold sm:text-xl text-red-700 dark:text-red-400">{lotes.totales.negativos}</p>
                            <p className="text-xs text-muted-foreground">Revisar en la toma</p>
                        </KpiCard>
                        <KpiCard etiqueta="Lotes vencidos" icono={CalendarClock} iconoCls="bg-amber-50 text-amber-600 dark:bg-amber-950">
                            <p className="mt-1 font-mono text-lg font-bold sm:text-xl text-amber-700 dark:text-amber-400">{lotes.totales.vencidos}</p>
                            <p className="text-xs text-muted-foreground">Con saldo al corte</p>
                        </KpiCard>
                    </div>
                    <LotesTabla filas={filasLotes} buscar={buscar} setBuscar={setBuscar} verSaldo={verSaldo} vencido={vencido}
                                titulo={`${nombreAlm} · ${tituloLab} · corte ${fechaDMY(lotes.fechaCorte)}`} pdf={pdfLotes}
                                corte={lotes.fechaCorte} accion={botonCrear} />
                </>
            )}
            </>}

            <Dialog open={dialogoCrear} onOpenChange={v => !creando && setDialogoCrear(v)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><ClipboardPlus className="h-5 w-5 text-emerald-600" /> Crear toma de inventario</DialogTitle>
                        <DialogDescription>
                            Se guarda con tu usuario y aparece en <b>Mis tomas</b>. Luego escribes el conteo de cada línea y la exportas a PDF.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
                        <div className="flex justify-between gap-3"><span className="text-muted-foreground">Tipo</span><b>{modo === 'lotes' ? 'Por lote' : 'Por artículo (listado)'}</b></div>
                        <div className="flex justify-between gap-3"><span className="text-muted-foreground">Laboratorio</span><b className="truncate text-right">{tituloLab}</b></div>
                        {modo === 'lotes' && <>
                            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Almacén</span><b>{nombreAlm}</b></div>
                            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Fecha de corte</span><b>{fechaDMY(lotes?.fechaCorte ?? fecha)}</b></div>
                        </>}
                        <div className="flex justify-between gap-3"><span className="text-muted-foreground">Líneas a contar</span><b className="font-mono">{lineasACrear}</b></div>
                    </div>
                    {buscar.trim() && <p className="text-xs text-amber-700 dark:text-amber-400">El buscador no filtra la toma: se incluyen todas las líneas del reporte.</p>}
                    <div className="grid gap-1.5">
                        <Label htmlFor="obs-toma" className="text-xs font-semibold text-muted-foreground">Observación (opcional)</Label>
                        <Textarea id="obs-toma" rows={2} maxLength={500} value={observacion} onChange={e => setObservacion(e.target.value)}
                                  placeholder="Ej: Inventario mensual almacén Chimbote" />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDialogoCrear(false)} disabled={creando}>Cancelar</Button>
                        <Button onClick={crearToma} disabled={creando} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
                            {creando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardPlus className="h-4 w-4" />} Crear y empezar a contar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function Cabecera({ titulo, sub, buscar, setBuscar, pdf, archivo, accion }: {
    titulo: string; sub: string; buscar: string; setBuscar: (v: string) => void; pdf: ReportePdf | null; archivo: string; accion?: React.ReactNode
}) {
    return (
        <div className="flex flex-col gap-3 border-b px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
                <h2 className="text-sm font-semibold">{titulo}</h2>
                <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[10rem] flex-1 md:w-64 md:flex-none">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input className="h-9 pl-8 text-sm" value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar código o producto" />
                </div>
                {pdf && (
                    <ExportComisionPdf reporte={pdf} tituloDefecto={pdf.recuadroTitulo.toUpperCase()} archivoDefecto={archivo}
                                       descripcion={pdf.recuadroDetalle} columnasFijas="La columna para anotar el conteo siempre se incluye." />
                )}
                {accion}
            </div>
        </div>
    )
}

function ListadoTabla({ filas, buscar, setBuscar, titulo, pdf, corte, accion }: {
    filas: TomaListadoFila[]; buscar: string; setBuscar: (v: string) => void; titulo: string; pdf: ReportePdf | null
    corte: string; accion?: React.ReactNode
}) {
    const grupos = agrupar(filas, f => `${f.CodigoLaboratorio}|${f.CodigoSublinea}`)
    return (
        <Card className="overflow-hidden shadow-sm">
            <Cabecera titulo="Listado Toma de Inventarios" sub={`${titulo} · ${filas.length} artículos · lotes con saldo al ${fechaDMY(corte)}`} buscar={buscar} setBuscar={setBuscar}
                      pdf={pdf} archivo="toma-inventario-listado" accion={accion} />
            {grupos.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">Sin artículos</p>}
            {grupos.map(([k, fs]) => (
                <div key={k}>
                    <div className="flex items-center gap-2 border-b bg-blue-50/70 px-4 py-2 text-sm font-semibold text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
                        <FlaskConical className="h-4 w-4" />
                        <span className="font-mono">{fs[0].CodigoLaboratorio}</span> {fs[0].Laboratorio}
                        {fs[0].Sublinea !== fs[0].Laboratorio && <span className="font-normal text-muted-foreground">· {fs[0].CodigoSublinea} {fs[0].Sublinea}</span>}
                        <span className="ml-auto text-xs font-normal text-muted-foreground">{fs.length}</span>
                    </div>
                    {/* Celular */}
                    <div className="divide-y md:hidden">
                        {fs.map(f => (
                            <div key={f.IdArticulo} className="flex items-start justify-between gap-3 px-4 py-2.5">
                                <div className="min-w-0">
                                    <p className="text-sm leading-tight">{f.Producto}</p>
                                    <p className="font-mono text-[11px] text-muted-foreground">{f.Codigo} · {f.Unidad}</p>
                                    <div className="mt-1.5"><LotesBadges lotes={f.Lotes} corte={corte} max={3} /></div>
                                </div>
                                <span className="mt-0.5 h-7 w-20 shrink-0 rounded border border-dashed border-muted-foreground/40" aria-label="Conteo" />
                            </div>
                        ))}
                    </div>
                    {/* Escritorio */}
                    <table className="hidden w-full text-xs md:table">
                        <thead>
                            <tr className="bg-muted/40"><Th className="w-32">Código</Th><Th>Item</Th><Th className="w-20">Und</Th><Th className="w-[30%]">Lote referencial · vence</Th><Th className="w-48">Inventario</Th></tr>
                        </thead>
                        <tbody>
                            {fs.map(f => (
                                <tr key={f.IdArticulo} className="border-b border-border even:bg-muted/20">
                                    <td className="py-2 px-3 font-mono text-muted-foreground">{f.Codigo}</td>
                                    <td className="py-2 px-3">{f.Producto}</td>
                                    <td className="py-2 px-3 text-muted-foreground">{f.Unidad}</td>
                                    <td className="py-1.5 px-3"><LotesBadges lotes={f.Lotes} corte={corte} max={3} /></td>
                                    <td className="py-2 px-3"><div className="h-5 border-b border-dashed border-muted-foreground/50" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </Card>
    )
}

function LotesTabla({ filas, buscar, setBuscar, verSaldo, vencido, titulo, pdf, corte, accion }: {
    filas: TomaLoteFila[]; buscar: string; setBuscar: (v: string) => void; verSaldo: boolean
    vencido: (f: TomaLoteFila) => boolean; titulo: string; pdf: ReportePdf | null; corte: string; accion?: React.ReactNode
}) {
    const grupos = agrupar(filas, f => `${f.IdAlmacen}|${f.IdLaboratorio}`)
    return (
        <Card className="overflow-hidden shadow-sm">
            <Cabecera titulo="Toma de inventario por lote" sub={`${titulo} · ${filas.length} lotes`} buscar={buscar} setBuscar={setBuscar}
                      pdf={pdf} archivo="toma-inventario-lotes" accion={accion} />
            {grupos.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">Sin lotes con saldo</p>}
            {grupos.map(([k, fs]) => (
                <div key={k}>
                    <div className="flex flex-wrap items-center gap-2 border-b bg-blue-50/70 px-4 py-2 text-sm font-semibold text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
                        <Warehouse className="h-4 w-4" /> {fs[0].Almacen ?? `Almacén ${fs[0].IdAlmacen}`}
                        <span className="text-muted-foreground">·</span>
                        <span className="font-mono">{fs[0].CodigoLaboratorio}</span> {fs[0].Laboratorio}
                        <span className="ml-auto text-xs font-normal text-muted-foreground">{fs.length} lotes</span>
                    </div>
                    {/* Celular */}
                    <div className="divide-y md:hidden">
                        {fs.map((f, i) => {
                            const neg = f.SaldoSistema < 0, ven = vencido(f)
                            return (
                                <div key={i} className={`px-4 py-2.5 ${neg ? 'shadow-[inset_3px_0_0_#ef4444]' : ven ? 'shadow-[inset_3px_0_0_#f59e0b]' : ''}`}>
                                    <p className="text-sm leading-tight">{f.Producto}</p>
                                    <p className="font-mono text-[11px] text-muted-foreground">{f.Codigo} · {f.Unidad}</p>
                                    <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px]">
                                        <LoteBadge lote={f.Lote} vencimiento={f.Vencimiento} corte={corte} />
                                        {verSaldo
                                            ? <span className={`font-mono font-semibold ${neg ? 'text-red-600' : ''}`}>{cant(f.SaldoSistema)} {f.Unidad}</span>
                                            : <span className="h-6 w-16 shrink-0 rounded border border-dashed border-muted-foreground/40" />}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    {/* Escritorio */}
                    <table className="hidden w-full text-xs md:table">
                        <thead>
                            <tr className="bg-muted/40">
                                <Th className="w-28">Código</Th><Th>Producto</Th><Th className="w-14">Und</Th><Th className="w-60">Lote · vence</Th>
                                {verSaldo && <Th right className="w-24">Saldo sist.</Th>}<Th className="w-44">Conteo</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {fs.map((f, i) => {
                                const neg = f.SaldoSistema < 0, ven = vencido(f)
                                return (
                                    <tr key={i} className="border-b border-border even:bg-muted/20">
                                        <td className={`py-2 px-3 font-mono text-muted-foreground ${neg ? 'shadow-[inset_3px_0_0_#ef4444]' : ven ? 'shadow-[inset_3px_0_0_#f59e0b]' : ''}`}>{f.Codigo}</td>
                                        <td className="py-2 px-3">{f.Producto}</td>
                                        <td className="py-2 px-3 text-muted-foreground">{f.Unidad}</td>
                                        <td className="py-1.5 px-3"><LoteBadge lote={f.Lote} vencimiento={f.Vencimiento} corte={corte} /></td>
                                        {verSaldo && <td className={`py-2 px-3 text-right font-mono font-semibold ${neg ? 'text-red-600' : ''}`}>{cant(f.SaldoSistema)}</td>}
                                        <td className="py-2 px-3"><div className="h-5 border-b border-dashed border-muted-foreground/50" /></td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            ))}
            <div className="flex items-start gap-2 border-t bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>Etiqueta roja = lote vencido al corte; ámbar = vence en 90 días o menos; verde = vigente. Borde rojo = saldo negativo en el sistema. Saldo = ingresos − salidas del kardex hasta la fecha de corte.</span>
            </div>
        </Card>
    )
}
