'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    AlertCircle, ArrowLeft, CalendarDays, FlaskConical, Lock, Loader2, Save, Search, UserRound, Warehouse,
} from "lucide-react"
import { toast } from "@/app/hooks/useToast"
import { TomaInventarioService } from "@/app/services/inventario/TomaInventarioService"
import { TomaCombo, TomaDetalle, TomaLinea, TomaLoteRef } from "@/app/types/toma-inventario-types"
import { ComboSelect } from "@/components/ui/combo-select"
import { CeldaConteoLotes, EstadoGuardadoLotes, lineaContada, resumenLinea, useConteoLotes } from "./ConteoLotes"
import { ExportComisionPdf } from "@/components/contabilidad/comisiones/ExportComisionPdf"
import { ReportePdf } from "@/components/contabilidad/comisiones/pdfComision"
import { fechaDMY, Th } from "@/components/contabilidad/comisiones/ui"
import { LoteBadge, LotesBadges, loteVencido, lotesTexto } from "./LoteBadge"
import { Avance, EstadoBadge, fechaHora, ModoBadge } from "./HistorialTomas"

const LINEA = '________________'
const TODOS_LAB = '__todos__'
const PASO = 60

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
 * Toma de inventario de un usuario: por cada línea ingresa stock + lote + vencimiento (una o varias filas),
 * ve al costado el nuevo saldo, se guarda solo (y con el botón), se cierra y se exporta a PDF.
 */
export function EditorToma({ idToma, onVolver }: { idToma: number; onVolver: () => void }) {
    const [toma, setToma] = useState<TomaDetalle | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [buscar, setBuscar] = useState('')
    const [laboratorio, setLaboratorio] = useState(TODOS_LAB)
    // Pendientes fijados al activar el filtro: la línea no desaparece mientras se cuenta.
    const [pendientesFijos, setPendientesFijos] = useState<Set<number> | null>(null)
    const soloPendientes = pendientesFijos !== null
    const [confirmarCierre, setConfirmarCierre] = useState(false)
    const [cerrando, setCerrando] = useState(false)
    // Saldo actual por lote (para "Nuevo saldo" vs sistema en tomas por artículo)
    const [saldos, setSaldos] = useState<Map<string, TomaLoteRef[]>>(new Map())

    const cargar = useCallback(async () => {
        setError(null)
        try {
            setToma(await TomaInventarioService.obtener(idToma))
        } catch (e: any) {
            setError(e?.response?.data?.message || 'No se pudo abrir la toma.')
        }
    }, [idToma])

    useEffect(() => { cargar() }, [cargar])

    const cab = toma?.cabecera
    const editable = cab?.Estado === 'BORRADOR'
    const corte = cab?.FechaCorte ?? ''

    useEffect(() => {
        if (!cab || cab.Modo !== 'LISTADO') return
        TomaInventarioService.listado(cab.IdLaboratorio ? String(cab.IdLaboratorio) : undefined)
            .then(l => setSaldos(new Map(l.filas.map(f => [f.Codigo, f.Lotes]))))
            .catch(() => { /* sin saldo: solo se muestra lo contado */ })
    }, [cab?.IdToma, cab?.Modo, cab?.IdLaboratorio]) // eslint-disable-line react-hooks/exhaustive-deps

    const claveDe = useCallback((id: number) => String(id), [])
    const idDe = useCallback((k: string) => Number(k) || undefined, [])
    const alGuardarError = useCallback((m: string) => toast({ title: 'No se pudo guardar', description: m, variant: 'destructive' }), [])
    const conteo = useConteoLotes({ idToma: toma ? idToma : null, editable: !!editable, claveDe, idDe, alGuardarError })

    const contadaLinea = useCallback((l: TomaLinea) => {
        const f = conteo.filas[String(l.IdLinea)]
        return f ? lineaContada(f) : !!(l.Conteo ?? '').trim()
    }, [conteo.filas])
    const contadas = useMemo(() => (toma?.lineas ?? []).filter(contadaLinea).length, [toma, contadaLinea])

    const guardar = async (silencioso = false) => {
        const ok = await conteo.guardar()
        if (ok && !silencioso) toast({ title: 'Conteo guardado' })
        return ok
    }

    const volver = async () => {
        if (conteo.sinGuardar && editable && !(await guardar(true))) return
        onVolver()
    }

    const cerrar = async () => {
        if (!toma) return
        if (conteo.conError) {
            toast({ title: 'Hay líneas por corregir', description: 'Corrige las líneas marcadas en ámbar antes de finalizar.' })
            setConfirmarCierre(false)
            return
        }
        setCerrando(true)
        try {
            if (!(await guardar(true))) return
            await TomaInventarioService.cerrar(toma.cabecera.IdToma)
            toast({ title: 'Toma cerrada', description: 'Ya no se puede modificar. Puedes exportarla a PDF.' })
            setConfirmarCierre(false)
            await cargar()
        } catch (e: any) {
            toast({ title: 'No se pudo cerrar', description: e?.response?.data?.message || 'Inténtalo de nuevo.', variant: 'destructive' })
        } finally {
            setCerrando(false)
        }
    }

    const laboratorios = useMemo<TomaCombo[]>(() => {
        const m = new Map<string, TomaCombo>()
        for (const l of toma?.lineas ?? []) {
            const k = l.CodigoLaboratorio ?? ''
            if (!m.has(k)) m.set(k, { valor: k, codigo: k, texto: l.Laboratorio ?? k })
        }
        return [{ valor: TODOS_LAB, codigo: '', texto: 'Todos los laboratorios' }, ...[...m.values()].sort((x, y) => x.texto.localeCompare(y.texto))]
    }, [toma])

    const q = buscar.trim().toUpperCase()
    const filas = useMemo(() => (toma?.lineas ?? []).filter(l =>
        (!q || l.Codigo.includes(q) || (l.Producto ?? '').toUpperCase().includes(q) || (l.Lote ?? '').toUpperCase().includes(q))
        && (laboratorio === TODOS_LAB || (l.CodigoLaboratorio ?? '') === laboratorio)
        && (!pendientesFijos || pendientesFijos.has(l.IdLinea))), [toma, q, pendientesFijos, laboratorio])

    const esLote = cab?.Modo === 'LOTE'
    // Se dibujan por tandas: con 2 000+ líneas el celular se ponía lento.
    const [mostrar, setMostrar] = useState(PASO)
    useEffect(() => { setMostrar(PASO) }, [q, laboratorio, pendientesFijos])
    const grupos = useMemo(() => agrupar(filas.slice(0, mostrar), l => esLote
        ? `${l.IdAlmacen}|${l.CodigoLaboratorio}`
        : `${l.CodigoLaboratorio}|${l.CodigoSublinea}`), [filas, esLote, mostrar])

    // ── PDF con el conteo escrito ───────────────────────────────────────────
    const pdf = useMemo<ReportePdf | null>(() => {
        if (!toma) return null
        const c = toma.cabecera
        const todas = toma.lineas
        const lote = c.Modo === 'LOTE'
        return {
            recuadroTitulo: `Toma de Inventario N.º ${String(c.IdToma).padStart(5, '0')}`,
            recuadroDetalle: [
                c.Laboratorio || 'Todos los laboratorios',
                lote ? (c.Almacen || 'Todos los almacenes') : null,
                `Corte ${fechaDMY(c.FechaCorte)}`,
                c.Usuario ? `Responsable: ${c.Usuario}` : null,
            ].filter(Boolean).join('  ·  '),
            periodo: c.Estado === 'CERRADA' ? `Cerrada ${fechaHora(c.CerradoEn)}` : 'En curso',
            tarjetas: [
                { etiqueta: 'Líneas', valor: String(todas.length) },
                { etiqueta: 'Contadas', valor: String(contadas), color: 'verde' },
                { etiqueta: 'Pendientes', valor: String(todas.length - contadas), color: todas.length - contadas ? 'ambar' : 'texto' },
                { etiqueta: 'Estado', valor: c.Estado === 'CERRADA' ? 'Cerrada' : 'En curso' },
            ],
            columnas: [
                { clave: 'cod', titulo: 'Código', ancho: 60 },
                { clave: 'prod', titulo: 'Producto', ancho: 0 },
                { clave: 'und', titulo: 'Und', ancho: 30 },
                ...(lote
                    ? [{ clave: 'lote', titulo: 'Lote', ancho: 70 }, { clave: 'vcto', titulo: 'Vence', ancho: 54 }]
                    : [{ clave: 'lote', titulo: 'Lote referencial (vence)', ancho: 150, opcional: true }]),
                { clave: 'conteo', titulo: 'Conteo', ancho: 120, negrita: true },
            ],
            filas: agrupar(todas, l => lote ? `${l.IdAlmacen}|${l.CodigoLaboratorio}` : `${l.CodigoLaboratorio}|${l.CodigoSublinea}`).flatMap(([, ls]) => [
                {
                    valores: lote
                        ? { cod: ls[0].CodigoLaboratorio ?? '', prod: `${ls[0].Laboratorio ?? ''} · Almacén ${ls[0].Almacen ?? ls[0].IdAlmacen ?? ''}` }
                        : { cod: ls[0].CodigoSublinea ?? '', prod: `${ls[0].Laboratorio ?? ''}${ls[0].Sublinea && ls[0].Sublinea !== ls[0].Laboratorio ? ' · ' + ls[0].Sublinea : ''}` },
                    colores: { cod: 'tema', prod: 'tema' } as const,
                },
                ...ls.map(l => {
                    const f = conteo.filas[String(l.IdLinea)]
                    const texto = (f ? resumenLinea(f) : (l.Conteo ?? '')).trim()
                    return {
                        valores: {
                            cod: l.Codigo, prod: l.Producto ?? '', und: l.Unidad ?? '',
                            lote: lote ? (l.Lote || '(sin lote)') : lotesTexto(l.Lotes),
                            vcto: fechaDMY(l.Vencimiento),
                            conteo: texto || LINEA,
                        },
                        colores: {
                            cod: 'gris', und: 'gris',
                            vcto: lote && loteVencido(l.Vencimiento, c.FechaCorte) ? 'rojo' : 'texto',
                            conteo: texto ? 'texto' : 'gris',
                        } as const,
                    }
                }),
            ]),
            pie: `Toma de inventario N.º ${c.IdToma} · ${c.Laboratorio || 'Todos los laboratorios'}`,
        }
    }, [toma, conteo.filas, contadas])

    if (error) {
        return (
            <div className="grid gap-4">
                <Button variant="ghost" className="w-fit gap-1.5" onClick={onVolver}><ArrowLeft className="h-4 w-4" /> Mis tomas</Button>
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span>
                </div>
            </div>
        )
    }
    if (!toma || !cab) return <div className="flex justify-center py-20 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>

    const estadoGuardado = !editable
        ? <span className="inline-flex items-center gap-1 text-muted-foreground"><Lock className="h-3.5 w-3.5" /> Solo lectura</span>
        : <EstadoGuardadoLotes conteo={conteo} editable={!!editable} />

    const lotesDe = (l: TomaLinea): TomaLoteRef[] => esLote
        ? [{ lote: l.Lote, vencimiento: l.Vencimiento, saldo: l.SaldoSistema ?? undefined }]
        : (saldos.get(l.Codigo) ?? l.Lotes)

    const casilla = (l: TomaLinea) => (
        <CeldaConteoLotes clave={String(l.IdLinea)} codigo={l.Codigo} producto={l.Producto} unidad={l.Unidad} conteo={conteo} lotesRef={lotesDe(l)}
                          corte={corte} editable={!!editable} conteoAnterior={conteo.filas[String(l.IdLinea)] ? null : l.Conteo} />
    )

    const etiquetas = (l: TomaLinea) => esLote
        ? <LoteBadge lote={l.Lote} vencimiento={l.Vencimiento} corte={corte} />
        : <LotesBadges lotes={l.Lotes} corte={corte} max={3} />

    return (
        <div className="grid gap-4 pb-20 md:pb-0">
            {/* Cabecera de la toma */}
            <Card className="overflow-hidden border-t-[3px] border-t-blue-600 shadow-sm">
                <div className="flex flex-col gap-4 p-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                        <button type="button" onClick={volver} className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-3.5 w-3.5" /> Mis tomas
                        </button>
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-bold tracking-tight">Toma N.º <span className="font-mono">{String(cab.IdToma).padStart(5, '0')}</span></h2>
                            <EstadoBadge estado={cab.Estado} /><ModoBadge modo={cab.Modo} />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><FlaskConical className="h-3.5 w-3.5" />{cab.Laboratorio || 'Todos los laboratorios'}</span>
                            {esLote && <span className="inline-flex items-center gap-1"><Warehouse className="h-3.5 w-3.5" />{cab.Almacen || 'Todos los almacenes'}</span>}
                            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Corte {fechaDMY(cab.FechaCorte)}</span>
                            {cab.Usuario && <span className="inline-flex items-center gap-1"><UserRound className="h-3.5 w-3.5" />{cab.Usuario}</span>}
                        </div>
                        {cab.Observacion && <p className="mt-2 text-xs italic text-muted-foreground">“{cab.Observacion}”</p>}
                    </div>
                    <div className="flex w-full flex-col gap-3 md:w-72">
                        <Avance contadas={contadas} lineas={toma.lineas.length} />
                        <div className="hidden flex-wrap justify-end gap-2 md:flex">
                            {editable && (
                                <Button variant="outline" size="sm" onClick={() => guardar()} disabled={conteo.guardando || !conteo.sinGuardar} className="gap-1.5">
                                    <Save className="h-3.5 w-3.5" /> Guardar
                                </Button>
                            )}
                            {pdf && <ExportComisionPdf reporte={pdf} tituloDefecto="TOMA DE INVENTARIO" archivoDefecto={`toma-inventario-${cab.IdToma}`}
                                                       descripcion={pdf.recuadroDetalle} columnasFijas="Se exporta el conteo escrito; las líneas sin contar salen en blanco." />}
                            {editable && (
                                <Button size="sm" onClick={() => setConfirmarCierre(true)} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
                                    <Lock className="h-3.5 w-3.5" /> Finalizar
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-2 border-t bg-muted/30 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative sm:w-72">
                            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input className="h-9 pl-8 text-sm" value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar código, producto o lote" />
                        </div>
                        {laboratorios.length > 2 && (
                            <div className="sm:w-72">
                                <ComboSelect<TomaCombo> value={laboratorio} onChange={x => setLaboratorio(x.valor)} items={laboratorios}
                                                        getKey={x => x.valor} getLabel={x => x.valor === TODOS_LAB ? x.texto : `${x.codigo} · ${x.texto}`}
                                                        placeholder="Todos los laboratorios" searchPlaceholder="Buscar laboratorio..." emptyText="Sin laboratorios" />
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-between gap-4 text-xs">
                        <label className="flex items-center gap-2"><Switch checked={soloPendientes} onCheckedChange={v => setPendientesFijos(v ? new Set((toma?.lineas ?? []).filter(l => !contadaLinea(l)).map(l => l.IdLinea)) : null)} /> Solo pendientes</label>
                        {estadoGuardado}
                    </div>
                </div>
            </Card>

            {/* Líneas */}
            <Card className="overflow-hidden shadow-sm">
                {grupos.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">{soloPendientes ? '¡Todo contado! No quedan líneas pendientes.' : 'Sin líneas que coincidan'}</p>}
                {grupos.map(([k, ls]) => (
                    <div key={k}>
                        <div className="flex flex-wrap items-center gap-2 border-b bg-blue-50/70 px-4 py-2 text-sm font-semibold text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
                            {esLote ? <Warehouse className="h-4 w-4" /> : <FlaskConical className="h-4 w-4" />}
                            {esLote && <>{ls[0].Almacen ?? `Almacén ${ls[0].IdAlmacen}`}<span className="text-muted-foreground">·</span></>}
                            <span className="font-mono">{ls[0].CodigoLaboratorio}</span> {ls[0].Laboratorio}
                            {!esLote && ls[0].Sublinea && ls[0].Sublinea !== ls[0].Laboratorio && <span className="font-normal text-muted-foreground">· {ls[0].CodigoSublinea} {ls[0].Sublinea}</span>}
                            <span className="ml-auto text-xs font-normal text-muted-foreground">{ls.length}</span>
                        </div>
                        {/* Celular */}
                        <div className="divide-y md:hidden">
                            {ls.map(l => (
                                <div key={l.IdLinea} className="px-4 py-3">
                                    <p className="text-sm font-medium leading-tight">{l.Producto}</p>
                                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{l.Codigo} · {l.Unidad}</p>
                                    <div className="mt-1.5">{etiquetas(l)}</div>
                                    <div className="mt-2">{casilla(l)}</div>
                                </div>
                            ))}
                        </div>
                        {/* Escritorio */}
                        <table className="hidden w-full text-xs md:table">
                            <thead>
                                <tr className="bg-muted/40">
                                    <Th className="w-28">Código</Th><Th>Producto</Th><Th className="w-14">Und</Th>
                                    <Th className="w-[22%]">{esLote ? 'Lote · vence' : 'Lote referencial · vence'}</Th><Th className="w-[34rem]">Inventario (stock · lote · vence) y nuevo saldo</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {ls.map(l => (
                                    <tr key={l.IdLinea} className="border-b border-border even:bg-muted/20">
                                        <td className="px-3 py-1.5 font-mono text-muted-foreground">{l.Codigo}</td>
                                        <td className="px-3 py-1.5">{l.Producto}</td>
                                        <td className="px-3 py-1.5 text-muted-foreground">{l.Unidad}</td>
                                        <td className="px-3 py-1.5">{etiquetas(l)}</td>
                                        <td className="px-3 py-1.5">{casilla(l)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
                {filas.length > mostrar && (
                    <div className="flex flex-col items-center gap-1 border-t px-4 py-3">
                        <Button variant="outline" size="sm" onClick={() => setMostrar(m => m + PASO * 2)}>Mostrar {Math.min(PASO * 2, filas.length - mostrar)} más</Button>
                        <span className="text-[11px] text-muted-foreground">Mostrando {mostrar} de {filas.length}. Usa el buscador o el filtro de laboratorio.</span>
                    </div>
                )}
                {editable && (
                    <div className="border-t bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
                        Ingresa el stock contado, el lote y su vencimiento; usa <b>Otro lote</b> si el artículo tiene varios. Un lote que no está en el kardex se marca como <b>Lote nuevo</b> y exige vencimiento. Se guarda solo; <b>Enter</b> pasa al siguiente campo.
                    </div>
                )}
            </Card>

            {/* Barra fija en celular */}
            <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t bg-background/95 px-4 py-2.5 backdrop-blur md:hidden">
                <div className="min-w-0 flex-1 text-xs">{estadoGuardado}</div>
                {editable && (
                    <Button variant="outline" size="sm" onClick={() => guardar()} disabled={conteo.guardando || !conteo.sinGuardar} aria-label="Guardar"><Save className="h-4 w-4" /></Button>
                )}
                {pdf && <ExportComisionPdf reporte={pdf} tituloDefecto="TOMA DE INVENTARIO" archivoDefecto={`toma-inventario-${cab.IdToma}`}
                                           descripcion={pdf.recuadroDetalle} etiqueta="PDF" />}
                {editable && (
                    <Button size="sm" onClick={() => setConfirmarCierre(true)} className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700"><Lock className="h-3.5 w-3.5" /> Finalizar</Button>
                )}
            </div>

            <AlertDialog open={confirmarCierre} onOpenChange={v => !cerrando && setConfirmarCierre(v)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Finalizar la toma N.º {String(cab.IdToma).padStart(5, '0')}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Llevas {contadas} de {toma.lineas.length} líneas contadas
                            {toma.lineas.length - contadas > 0 ? ` (${toma.lineas.length - contadas} quedarán en blanco)` : ''}.
                            Al finalizar ya no podrás modificar el conteo, pero sí verla y exportarla a PDF.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={cerrando}>Seguir contando</AlertDialogCancel>
                        <AlertDialogAction onClick={e => { e.preventDefault(); cerrar() }} disabled={cerrando} className="bg-emerald-600 hover:bg-emerald-700">
                            {cerrando && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Finalizar toma
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
