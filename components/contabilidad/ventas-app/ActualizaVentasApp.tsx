'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    AlertTriangle, ArrowRight, BookOpen, CalendarDays, CheckCircle2, CircleDashed, Clock, CloudUpload, Database,
    Eye, FileMinus2, FileText, Filter, Layers, ListChecks, Loader2, RefreshCw, Search, Sigma, TableProperties, Upload, Users, XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { AvisoAmbar, AvisoExito, Combo, claseInput, textoError, useSacudir } from '@/components/contabilidad/datos-generales/comunes'
import { ComprobanteApp, EstadoCarga, Origen, ResumenMes, TablasAfectadas, VentasAppService } from '@/app/services/contabilidad/VentasAppService'

// ------------------------------------------------------------------ utilidades
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const soles = (v: unknown) => `S/ ${Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const num = (v: unknown) => Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const dmy = (v: unknown) => { if (!v) return ''; const s = String(v).slice(0, 10); return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` }
const clave = (f: { origen: Origen; id: number }) => `${f.origen}-${f.id}`
const doc = (f: ComprobanteApp) => `${f.serie}-${String(f.numero).padStart(8, '0')}`
const TIPO: Record<string, { corto: string; largo: string; clase: string }> = {
    '01': { corto: 'FAC', largo: 'Factura', clase: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200' },
    '03': { corto: 'BOL', largo: 'Boleta', clase: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200' },
    '07': { corto: 'NC', largo: 'Nota de crédito', clase: 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-200' },
}
const MOTIVO: Record<string, string> = {
    '01': 'Anulación de la operación', '02': 'Anulación por error en el RUC', '03': 'Corrección por error en la descripción',
    '04': 'Descuento global', '05': 'Descuento por ítem', '06': 'Devolución total', '07': 'Devolución por ítem', '13': 'Ajuste de montos y/o fechas',
}
const ESTADO: Record<EstadoCarga, { texto: string; fila: string; punto: string; chip: string }> = {
    CARGADO: { texto: 'Cargado', fila: 'bg-emerald-50/70 hover:bg-emerald-100/70 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40', punto: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-200' },
    PENDIENTE: { texto: 'Pendiente', fila: 'bg-amber-50/80 hover:bg-amber-100/80 dark:bg-amber-950/20 dark:hover:bg-amber-950/40', punto: 'bg-amber-500 animate-pulse', chip: 'bg-amber-100 text-amber-900 ring-amber-600/25 dark:bg-amber-950/60 dark:text-amber-200' },
    PARCIAL: { texto: 'Parcial', fila: 'bg-rose-50/80 hover:bg-rose-100/80 dark:bg-rose-950/20 dark:hover:bg-rose-950/40', punto: 'bg-rose-500', chip: 'bg-rose-100 text-rose-800 ring-rose-600/20 dark:bg-rose-950/60 dark:text-rose-200' },
}
const pausa = (ms: number) => new Promise(r => setTimeout(r, ms))

type FiltroTipo = 'todos' | '01' | '03' | '07'
type FiltroEstado = 'todos' | EstadoCarga
type EstadoItem = 'espera' | 'cargando' | 'ok' | 'error'
interface ItemCola { fila: ComprobanteApp; estado: EstadoItem; mensaje?: string; tablas?: TablasAfectadas }

// ================================================================== pantalla
export function ActualizaVentasApp() {
    const hoy = new Date()
    const [anio, setAnio] = useState(String(hoy.getFullYear()))
    const [mes, setMes] = useState(String(hoy.getMonth() + 1))
    const [tipo, setTipo] = useState<FiltroTipo>('todos')
    const [estado, setEstado] = useState<FiltroEstado>('todos')
    const [buscar, setBuscar] = useState('')
    const [filas, setFilas] = useState<ComprobanteApp[]>([])
    const [resumen, setResumen] = useState<ResumenMes | null>(null)
    const [cargando, setCargando] = useState(false)
    const [aviso, setAviso] = useState<string | null>(null)
    const [golpe, setGolpe] = useState(0)
    const [exito, setExito] = useState<string | null>(null)
    const [sel, setSel] = useState<Set<string>>(new Set())
    const [recien, setRecien] = useState<Set<string>>(new Set())
    const [cola, setCola] = useState<ItemCola[] | null>(null)
    const [ver, setVer] = useState<{ fila: ComprobanteApp; tablas?: TablasAfectadas; previa: boolean; cargando: boolean; error?: string } | null>(null)
    const refAviso = useSacudir(!!aviso, golpe)

    const anios = useMemo(() => Array.from({ length: hoy.getFullYear() - 2023 }, (_, i) => String(hoy.getFullYear() - i)).map(a => ({ id: a, nombre: a })), [])
    const meses = useMemo(() => MESES.map((m, i) => ({ id: String(i + 1), nombre: m })), [])

    // Cada consulta lleva un número: si el usuario cambia de mes rápido, solo se pinta la última respuesta.
    const consulta = useRef(0)
    const consultar = useCallback(async () => {
        const yo = ++consulta.current
        setCargando(true); setAviso(null); setSel(new Set())
        try {
            const r = await VentasAppService.listado(Number(anio), Number(mes))
            if (yo !== consulta.current) return
            setFilas(r.filas); setResumen(r.resumen)
        } catch (e) {
            if (yo !== consulta.current) return
            setAviso(await textoError(e, 'No se pudo leer las ventas del mes.')); setGolpe(g => g + 1)
        } finally { if (yo === consulta.current) setCargando(false) }
    }, [anio, mes])
    useEffect(() => { consultar() }, [consultar])

    const visibles = useMemo(() => {
        const t = buscar.trim().toLowerCase()
        return filas.filter(f =>
            (tipo === 'todos' || f.tipo_doc === tipo) &&
            (estado === 'todos' || f.estado_carga === estado) &&
            (!t || `${doc(f)} ${f.serie}-${f.numero} ${f.ruc ?? ''} ${f.cliente ?? ''} ${f.doc_ref ?? ''}`.toLowerCase().includes(t)))
    }, [filas, tipo, estado, buscar])

    const cargable = (f: ComprobanteApp) => f.estado_carga === 'PENDIENTE' && !f.problema
    const pendientesVisibles = visibles.filter(cargable)
    const seleccionadas = filas.filter(f => sel.has(clave(f)))
    const todasSel = pendientesVisibles.length > 0 && pendientesVisibles.every(f => sel.has(clave(f)))
    const alternar = (f: ComprobanteApp) => setSel(s => { const n = new Set(s); n.has(clave(f)) ? n.delete(clave(f)) : n.add(clave(f)); return n })
    const alternarTodas = () => setSel(s => {
        const n = new Set(s)
        if (todasSel) pendientesVisibles.forEach(f => n.delete(clave(f))); else pendientesVisibles.forEach(f => n.add(clave(f)))
        return n
    })

    const conteo = (t: FiltroTipo) => filas.filter(f => t === 'todos' || f.tipo_doc === t).length
    const ncPendientes = filas.filter(f => f.tipo_doc === '07' && f.estado_carga === 'PENDIENTE').length
    // Suma total del mes: ventas (facturas y boletas) + notas de crédito (en negativo).
    const sumaVentas = filas.filter(f => f.tipo_doc !== '07').reduce((s, f) => s + f.total, 0)
    const sumaNC = filas.filter(f => f.tipo_doc === '07').reduce((s, f) => s + f.total, 0)

    // ------------------------------------------------------------ carga (cola con animación)
    const abrirCola = (lista: ComprobanteApp[]) => {
        const validas = lista.filter(cargable)
        if (!validas.length) { setAviso('No hay comprobantes pendientes para cargar con esos filtros.'); setGolpe(g => g + 1); return }
        setCola(validas.map(fila => ({ fila, estado: 'espera' })))
    }
    const alTerminarCola = (cargados: string[]) => {
        if (cargados.length) {
            setRecien(new Set(cargados))
            setExito(`${cargados.length} comprobante${cargados.length === 1 ? '' : 's'} cargado${cargados.length === 1 ? '' : 's'} al Registro de Ventas y al Mayor.`)
            consultar()
        }
    }

    // ------------------------------------------------------------ ver detalle / vista previa
    const abrirVer = async (f: ComprobanteApp) => {
        const previa = f.estado_carga === 'PENDIENTE'
        setVer({ fila: f, previa, cargando: true })
        try {
            const [tablas, actuales] = previa
                ? await Promise.all([VentasAppService.previsualizar(f.origen, f.id), VentasAppService.detalle(f.origen, f.id)])
                : [await VentasAppService.detalle(f.origen, f.id), null]
            setVer({ fila: f, previa, cargando: false, tablas: previa ? { ...tablas, kardexClientes: actuales?.kardexClientes ?? [] } : tablas })
        } catch (e) { setVer({ fila: f, previa, cargando: false, error: await textoError(e, 'No se pudo leer el detalle.') }) }
    }

    const avance = resumen && resumen.total ? Math.round((resumen.cargados / resumen.total) * 100) : 0

    return (
        <div className="space-y-4 p-3 sm:p-5">
            {/* Cabecera (estilo Contabilidad) */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25"><CloudUpload className="h-5 w-5" /></span>
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Contabilidad · Datos de movimientos</p>
                        <h1 className="text-xl font-bold leading-tight sm:text-2xl">Actualiza Ventas APP</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">Ventas y notas de crédito de la web hacia el Registro de Ventas y el Mayor (libro 14).</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={consultar} disabled={cargando}>
                        <RefreshCw className={cn('mr-2 h-4 w-4', cargando && 'animate-spin')} /> Actualizar
                    </Button>
                    <Button onClick={() => abrirCola(seleccionadas.length ? seleccionadas : filas)} disabled={cargando || !filas.some(cargable)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 hover:from-blue-700 hover:to-indigo-700">
                        <Upload className="mr-2 h-4 w-4" />
                        {seleccionadas.length ? `Cargar seleccionados (${seleccionadas.length})` : `Cargar pendientes (${filas.filter(cargable).length})`}
                    </Button>
                </div>
            </div>

            {aviso && <div ref={refAviso}><AvisoAmbar mensaje={aviso} onCerrar={() => setAviso(null)} /></div>}
            {exito && <AvisoExito mensaje={exito} onCerrar={() => setExito(null)} />}

            {/* Filtros */}
            <div className="rounded-2xl border bg-card p-3 shadow-md shadow-slate-900/5 dark:shadow-black/30 sm:p-4">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-[140px_180px_1fr]">
                    <div className="space-y-1"><p className="text-xs font-medium text-muted-foreground">Año</p><Combo items={anios} valor={anio} onCambio={v => v && setAnio(v)} icono={CalendarDays} /></div>
                    <div className="space-y-1"><p className="text-xs font-medium text-muted-foreground">Mes</p><Combo items={meses} valor={mes} onCambio={v => v && setMes(v)} icono={CalendarDays} /></div>
                    <div className="col-span-2 space-y-1 md:col-span-1">
                        <p className="text-xs font-medium text-muted-foreground">Buscar</p>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Serie-número, RUC, cliente o documento de referencia" className={cn(claseInput, 'pl-9')} />
                        </div>
                    </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    {([['todos', 'Todos'], ['01', 'Facturas'], ['03', 'Boletas'], ['07', 'Notas de crédito']] as [FiltroTipo, string][]).map(([v, t]) => (
                        <Chip key={v} activo={tipo === v} onClick={() => setTipo(v)} texto={t} cuenta={conteo(v)} />
                    ))}
                    <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
                    {([['todos', 'Todos'], ['PENDIENTE', 'Pendientes'], ['CARGADO', 'Cargados'], ['PARCIAL', 'Parciales']] as [FiltroEstado, string][]).map(([v, t]) => (
                        <Chip key={v} activo={estado === v} onClick={() => setEstado(v)} texto={t} punto={v === 'todos' ? undefined : ESTADO[v].punto}
                              cuenta={filas.filter(f => v === 'todos' || f.estado_carga === v).length} />
                    ))}
                </div>
            </div>

            {/* Aviso animado mientras se leen las ventas del mes elegido */}
            {cargando && (
                <div role="status" aria-live="polite"
                     className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 px-4 py-3 shadow-md shadow-blue-600/10 animate-in fade-in-0 slide-in-from-top-1 dark:border-blue-900 dark:from-blue-950/50 dark:via-indigo-950/40 dark:to-blue-950/50">
                    <div className="flex items-center gap-3">
                        <span className="ventasapp-latido flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30">
                            <Database className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                Leyendo las ventas de {MESES[Number(mes) - 1]} {anio}
                                <span className="ventasapp-puntos ml-0.5"><i>.</i><i>.</i><i>.</i></span>
                            </p>
                            <p className="text-xs text-blue-700/80 dark:text-blue-300/80">Facturas, boletas y notas de crédito, y su estado en el Registro de Ventas y el Mayor.</p>
                        </div>
                        <div className="relative hidden h-8 w-40 overflow-hidden sm:block" style={{ ['--ventasapp-dist' as any]: '150px' }}>
                            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-blue-300 dark:border-blue-800" />
                            {[0, 1, 2].map(i => (
                                <span key={i} className="ventasapp-viaje absolute left-0 top-1/2 -mt-2.5 flex h-5 w-4 items-center justify-center rounded-sm bg-white text-[8px] font-bold text-blue-700 shadow ring-1 ring-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:ring-blue-700"
                                      style={{ animationDelay: `${i * 0.45}s` }}>{i === 1 ? 'NC' : 'F'}</span>
                            ))}
                        </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-1 overflow-hidden bg-blue-100 dark:bg-blue-950">
                        <div className="ventasapp-indeterminado h-full w-1/3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                    </div>
                </div>
            )}

            {/* Estado del mes */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                <Tarjeta icono={FileText} titulo="Comprobantes" valor={resumen?.total ?? '—'} sub={`${MESES[Number(mes) - 1]} ${anio}`} color="from-blue-500 to-indigo-600" cargando={cargando} />
                <Tarjeta icono={CheckCircle2} titulo="Cargados" valor={resumen?.cargados ?? '—'} sub={resumen ? soles(resumen.montoCargado) : ''} color="from-emerald-500 to-teal-600" cargando={cargando} />
                <Tarjeta icono={Clock} titulo="Pendientes" valor={resumen?.pendientes ?? '—'} sub={resumen ? soles(resumen.montoPendiente) : ''} color="from-amber-500 to-orange-500" cargando={cargando} />
                <Tarjeta icono={FileMinus2} titulo="NC pendientes" valor={cargando ? '—' : ncPendientes} sub="Notas de crédito sin cargar" color="from-violet-500 to-fuchsia-600" cargando={cargando} />
                <Tarjeta icono={AlertTriangle} titulo="Con observación" valor={resumen ? resumen.conProblema + resumen.parciales : '—'} sub="Parciales o sin ficha/cuenta" color="from-rose-500 to-red-500" cargando={cargando} />
                <Tarjeta icono={Sigma} titulo="Suma total" valor={resumen ? soles(sumaVentas + sumaNC) : '—'}
                         sub={resumen ? `Ventas ${soles(sumaVentas)} · NC ${soles(sumaNC)}` : ''} color="from-cyan-500 to-sky-600" cargando={cargando}
                         className="ring-1 ring-cyan-500/30" />
            </div>
            {!cargando && resumen && resumen.total > 0 && (
                <div className="rounded-2xl border bg-card p-3 shadow-sm">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-medium">Avance de carga del mes</span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{avance}%</span>
                    </div>
                    <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700" style={{ width: `${(resumen.cargados / resumen.total) * 100}%` }} />
                        <div className="bg-rose-400 transition-all duration-700" style={{ width: `${(resumen.parciales / resumen.total) * 100}%` }} />
                        <div className="bg-[repeating-linear-gradient(45deg,theme(colors.amber.400)_0_6px,theme(colors.amber.300)_6px_12px)] transition-all duration-700" style={{ width: `${(resumen.pendientes / resumen.total) * 100}%` }} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-500" /> Cargado</span>
                        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-amber-400" /> Pendiente</span>
                        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-rose-400" /> Parcial</span>
                    </div>
                </div>
            )}

            {/* Tabla de comprobantes */}
            <div className="relative overflow-hidden rounded-2xl border bg-card shadow-md shadow-slate-900/5 dark:shadow-black/30">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    <span><b className="text-foreground">{visibles.length}</b> comprobante{visibles.length === 1 ? '' : 's'} · clic en una fila para ver sus tablas</span>
                    {sel.size > 0 && <span className="font-medium text-blue-700 dark:text-blue-300">{sel.size} seleccionado{sel.size === 1 ? '' : 's'} · <button className="underline" onClick={() => setSel(new Set())}>quitar</button></span>}
                </div>
                {cargando && filas.length > 0 && (
                    <div className="absolute inset-0 top-9 z-20 flex items-start justify-center bg-background/55 pt-16 backdrop-blur-[2px] animate-in fade-in-0">
                        <div className="flex items-center gap-2.5 rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-lg shadow-blue-600/10">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> Cargando {MESES[Number(mes) - 1]} {anio}…
                        </div>
                    </div>
                )}
                <div className="max-h-[62vh] overflow-auto">
                    <table className="w-full min-w-[980px] text-sm">
                        <thead className="sticky top-0 z-10 bg-card text-xs uppercase tracking-wide text-muted-foreground shadow-sm">
                            <tr>
                                <th className="w-10 px-3 py-2 text-left"><Checkbox checked={todasSel} onCheckedChange={alternarTodas} disabled={!pendientesVisibles.length} aria-label="Seleccionar pendientes" /></th>
                                <th className="px-2 py-2 text-left">Estado</th>
                                <th className="px-2 py-2 text-left">Comprobante</th>
                                <th className="px-2 py-2 text-left">Fecha</th>
                                <th className="px-2 py-2 text-left">Cliente</th>
                                <th className="px-2 py-2 text-right">Valor venta</th>
                                <th className="px-2 py-2 text-right">IGV</th>
                                <th className="px-2 py-2 text-right">Total</th>
                                <th className="px-2 py-2 text-center">Tablas</th>
                                <th className="px-3 py-2 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cargando && filas.length === 0 && Array.from({ length: 8 }).map((_, i) => (
                                <tr key={i}><td colSpan={10} className="px-3 py-2"><div className="h-6 animate-pulse rounded bg-muted" /></td></tr>
                            ))}
                            {!cargando && visibles.length === 0 && (
                                <tr><td colSpan={10} className="px-3 py-12 text-center text-muted-foreground">
                                    <ListChecks className="mx-auto mb-2 h-8 w-8 opacity-50" /> No hay comprobantes con esos filtros.
                                </td></tr>
                            )}
                            {visibles.map(f => {
                                const e = ESTADO[f.estado_carga], t = TIPO[f.tipo_doc] ?? TIPO['01']
                                return (
                                    <tr key={clave(f)} onClick={() => abrirVer(f)}
                                        className={cn('cursor-pointer border-b border-l-4 transition-colors', e.fila,
                                            f.estado_carga === 'CARGADO' ? 'border-l-emerald-500' : f.estado_carga === 'PARCIAL' ? 'border-l-rose-500' : 'border-l-amber-400',
                                            recien.has(clave(f)) && 'ventasapp-recien', cargando && 'opacity-60')}>
                                        <td className="px-3 py-2" onClick={ev => ev.stopPropagation()}>
                                            <Checkbox checked={sel.has(clave(f))} onCheckedChange={() => alternar(f)} disabled={!cargable(f)} aria-label={`Seleccionar ${doc(f)}`} />
                                        </td>
                                        <td className="px-2 py-2">
                                            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset', e.chip)}>
                                                <i className={cn('h-1.5 w-1.5 rounded-full', e.punto)} /> {e.texto}
                                            </span>
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex items-center gap-2">
                                                <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold', t.clase)}>{t.corto}</span>
                                                <span className="font-mono font-semibold">{doc(f)}</span>
                                            </div>
                                            {f.doc_ref && <p className="mt-0.5 text-[11px] text-violet-700 dark:text-violet-300">Modifica {f.doc_ref}{f.motivo ? ` · ${MOTIVO[f.motivo] ?? `motivo ${f.motivo}`}` : ''}</p>}
                                        </td>
                                        <td className="whitespace-nowrap px-2 py-2">{dmy(f.fecha)}</td>
                                        <td className="max-w-[260px] px-2 py-2">
                                            <p className="truncate font-medium">{f.cliente}</p>
                                            <p className="font-mono text-[11px] text-muted-foreground">{f.ruc}</p>
                                            {f.problema && <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300"><AlertTriangle className="h-3 w-3" />{f.problema}</p>}
                                        </td>
                                        <td className="whitespace-nowrap px-2 py-2 text-right font-mono">{num(f.valor_venta)}</td>
                                        <td className="whitespace-nowrap px-2 py-2 text-right font-mono">{num(f.igv)}</td>
                                        <td className={cn('whitespace-nowrap px-2 py-2 text-right font-mono font-bold', f.total < 0 && 'text-violet-700 dark:text-violet-300')}>{soles(f.total)}</td>
                                        <td className="px-2 py-2">
                                            <div className="flex justify-center gap-1">
                                                <Pastilla titulo="Registro de ventas" corto="RV" n={f.rv_filas} />
                                                <Pastilla titulo="Mayor auxiliar (libro 14)" corto="MA" n={f.ma_filas} />
                                                <Pastilla titulo="Kardex clientes (lo graba la web al emitir)" corto="KC" n={f.kc_filas} neutro />
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-right" onClick={ev => ev.stopPropagation()}>
                                            {cargable(f) ? (
                                                <Button size="sm" className="h-7 bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 text-xs text-white shadow-sm hover:from-amber-600 hover:to-orange-600" onClick={() => abrirCola([f])}>
                                                    <Upload className="mr-1 h-3.5 w-3.5" /> Cargar
                                                </Button>
                                            ) : (
                                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => abrirVer(f)}><Eye className="mr-1 h-3.5 w-3.5" /> Ver</Button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {cola && <ModalCarga items={cola} onCerrar={(cargados) => { setCola(null); alTerminarCola(cargados) }} onVer={(fila, tablas) => setVer({ fila: { ...fila, estado_carga: 'CARGADO' }, tablas, previa: false, cargando: false })} />}
            {ver && <ModalTablas ver={ver} onCerrar={() => setVer(null)}
                                 onCargar={ver.previa && cargable(ver.fila) ? () => { const f = ver.fila; setVer(null); abrirCola([f]) } : undefined} />}
        </div>
    )
}

// ================================================================== piezas
function Chip({ activo, onClick, texto, cuenta, punto }: { activo: boolean; onClick: () => void; texto: string; cuenta: number; punto?: string }) {
    return (
        <button type="button" onClick={onClick}
                className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150',
                    activo ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'bg-background hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30')}>
            {punto && <i className={cn('h-1.5 w-1.5 rounded-full', punto)} />}
            {texto}
            <span className={cn('rounded-full px-1.5 text-[10px] font-bold', activo ? 'bg-white/25' : 'bg-muted text-muted-foreground')}>{cuenta}</span>
        </button>
    )
}

function Tarjeta({ icono: Icono, titulo, valor, sub, color, cargando, className }: { icono: React.ElementType; titulo: string; valor: React.ReactNode; sub: string; color: string; cargando?: boolean; className?: string }) {
    return (
        <div className={cn('group relative overflow-hidden rounded-2xl border bg-card p-3 shadow-md shadow-slate-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:shadow-black/30', className)}>
            <span className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', color)} />
            <div className="flex items-center gap-3">
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition-transform group-hover:scale-110', color)}><Icono className="h-4 w-4" /></span>
                <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{titulo}</p>
                    {cargando ? (<>
                        <span className="my-1 block h-5 w-14 animate-pulse rounded-md bg-muted" />
                        <span className="block h-3 w-24 animate-pulse rounded bg-muted/70" />
                    </>) : (<>
                        <p className="text-xl font-bold leading-tight animate-in fade-in-0 zoom-in-95">{valor}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{sub}</p>
                    </>)}
                </div>
            </div>
        </div>
    )
}

function Pastilla({ titulo, corto, n, neutro }: { titulo: string; corto: string; n: number; neutro?: boolean }) {
    return (
        <span title={`${titulo}: ${n} fila${n === 1 ? '' : 's'}`}
              className={cn('rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold ring-1 ring-inset',
                  n > 0 ? (neutro ? 'bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700' : 'bg-emerald-100 text-emerald-800 ring-emerald-600/25 dark:bg-emerald-950/60 dark:text-emerald-200')
                        : 'bg-background text-muted-foreground/60 ring-border')}>
            {corto} {n}
        </span>
    )
}

// ------------------------------------------------------------------ modal de carga (cola animada)
function ModalCarga({ items: inicial, onCerrar, onVer }: { items: ItemCola[]; onCerrar: (cargados: string[]) => void; onVer: (fila: ComprobanteApp, tablas: TablasAfectadas) => void }) {
    const [items, setItems] = useState(inicial)
    const [fase, setFase] = useState<'confirmar' | 'cargando' | 'fin'>('confirmar')
    const detener = useRef(false)
    const actual = items.find(i => i.estado === 'cargando')
    const ok = items.filter(i => i.estado === 'ok'), mal = items.filter(i => i.estado === 'error')
    const hechos = ok.length + mal.length
    const pct = Math.round((hechos / items.length) * 100)
    const ncs = inicial.filter(i => i.fila.tipo_doc === '07').length
    const total = inicial.reduce((s, i) => s + i.fila.total, 0)
    const listaRef = useRef<HTMLDivElement>(null)

    const iniciar = async () => {
        setFase('cargando'); detener.current = false
        for (let k = 0; k < inicial.length; k++) {
            if (detener.current) break
            setItems(xs => xs.map((x, j) => j === k ? { ...x, estado: 'cargando' } : x))
            listaRef.current?.querySelector(`[data-i="${k}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
            try {
                const r = await VentasAppService.cargar(inicial[k].fila.origen, inicial[k].fila.id)
                await pausa(180)
                setItems(xs => xs.map((x, j) => j === k ? { ...x, estado: 'ok', tablas: r } : x))
            } catch (e) {
                const mensaje = await textoError(e, 'No se pudo cargar.'); setItems(xs => xs.map((x, j) => j === k ? { ...x, estado: 'error', mensaje } : x))
            }
        }
        setFase('fin')
    }
    const cerrar = () => { if (fase === 'cargando') { detener.current = true; return } onCerrar(items.filter(i => i.estado === 'ok').map(i => clave(i.fila))) }
    const filasRV = ok.reduce((s, i) => s + (i.tablas?.registroVentas.length ?? 0), 0)
    const filasMA = ok.reduce((s, i) => s + (i.tablas?.mayorAuxiliar.length ?? 0), 0)

    return (
        <Dialog open onOpenChange={o => { if (!o) cerrar() }}>
            <DialogContent className="flex max-h-[92vh] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl" closeClassName="text-white opacity-90 hover:opacity-100">
                <DialogHeader className="shrink-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-5 py-4 text-left text-white">
                    <DialogTitle className="text-base font-bold">Cargar a Registro de Ventas y Mayor</DialogTitle>
                    <DialogDescription className="text-xs text-blue-100">
                        {inicial.length} comprobante{inicial.length === 1 ? '' : 's'}{ncs ? ` (${ncs} nota${ncs === 1 ? '' : 's'} de crédito)` : ''} · {soles(total)}
                    </DialogDescription>
                    {/* Animación: documentos viajando hacia la base */}
                    <div className="relative mt-3 flex items-center justify-between rounded-xl bg-white/10 px-4 py-3">
                        <div className="flex flex-col items-center gap-1 text-[10px] text-blue-100">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><FileText className="h-5 w-5" /></span> Ventas web
                        </div>
                        <div className="relative mx-3 h-10 flex-1 overflow-hidden" style={{ ['--ventasapp-dist' as any]: '220px' }}>
                            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 border-t border-dashed border-white/40" />
                            {fase === 'cargando' && [0, 1, 2].map(i => (
                                <span key={i} className="ventasapp-viaje absolute left-0 top-1/2 -mt-2.5 flex h-5 w-4 items-center justify-center rounded-sm bg-white text-[8px] font-bold text-blue-700 shadow"
                                      style={{ animationDelay: `${i * 0.45}s` }}>{actual?.fila.tipo_doc === '07' ? 'NC' : 'F'}</span>
                            ))}
                            {fase !== 'cargando' && <ArrowRight className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-white/70" />}
                        </div>
                        <div className="flex flex-col items-center gap-1 text-[10px] text-blue-100">
                            <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-white/15', fase === 'cargando' && 'ventasapp-latido', fase === 'fin' && mal.length === 0 && 'almacen-brillo bg-emerald-400/40')}>
                                {fase === 'fin' && mal.length === 0 ? <CheckCircle2 className="almacen-exito h-5 w-5" /> : <Database className="h-5 w-5" />}
                            </span> Contabilidad
                        </div>
                    </div>
                    {fase !== 'confirmar' && (
                        <div className="mt-3">
                            <div className="h-2 overflow-hidden rounded-full bg-white/20">
                                <div className={cn('h-full rounded-full transition-all duration-500', mal.length ? 'bg-amber-300' : 'bg-emerald-300')} style={{ width: `${pct}%` }} />
                            </div>
                            <div className="mt-1 flex justify-between text-[11px] text-blue-100">
                                <span>{fase === 'fin' ? 'Terminado' : actual ? `Cargando ${actual.fila.serie}-${actual.fila.numero}…` : 'Preparando…'}</span>
                                <span className="font-mono">{hechos}/{items.length} · {pct}%</span>
                            </div>
                        </div>
                    )}
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
                    {fase === 'confirmar' && (
                        <div className="grid gap-2 sm:grid-cols-3">
                            <Afectada icono={BookOpen} titulo="Registro de ventas" texto={`+${inicial.length} fila${inicial.length === 1 ? '' : 's'}`} tono="blue" />
                            <Afectada icono={Layers} titulo="Mayor auxiliar (libro 14)" texto={`+${inicial.length * 3} filas (3 por comprobante)`} tono="blue" />
                            <Afectada icono={Users} titulo="Kardex clientes" texto="Sin cambios (ya lo grabó la web)" tono="slate" />
                        </div>
                    )}
                    {fase === 'fin' && (
                        <div className={cn('almacen-exito rounded-xl border p-3 text-sm', mal.length ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30' : 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30')}>
                            <p className="font-semibold">{ok.length} cargado{ok.length === 1 ? '' : 's'}{mal.length ? ` · ${mal.length} con observación` : ''}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">Tablas afectadas: Registro de ventas +{filasRV} · Mayor auxiliar +{filasMA} · Kardex clientes sin cambios. Clic en un comprobante en verde para ver sus registros.</p>
                        </div>
                    )}
                    <div ref={listaRef} className="space-y-1.5">
                        {items.map((it, k) => (
                            <button key={clave(it.fila)} data-i={k} type="button" disabled={it.estado !== 'ok'}
                                    onClick={() => it.tablas && onVer(it.fila, it.tablas)}
                                    className={cn('flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition-all duration-300',
                                        it.estado === 'espera' && 'bg-amber-50/60 dark:bg-amber-950/20',
                                        it.estado === 'cargando' && 'scale-[1.01] border-blue-400 bg-blue-50 shadow-md shadow-blue-600/10 dark:bg-blue-950/30',
                                        it.estado === 'ok' && 'cursor-pointer border-emerald-300 bg-emerald-50 hover:shadow-md dark:border-emerald-800 dark:bg-emerald-950/30',
                                        it.estado === 'error' && 'border-amber-400 bg-amber-50 dark:bg-amber-950/30')}>
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center">
                                    {it.estado === 'espera' && <CircleDashed className="h-5 w-5 text-amber-500" />}
                                    {it.estado === 'cargando' && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
                                    {it.estado === 'ok' && <CheckCircle2 className="almacen-exito h-6 w-6 text-emerald-600" />}
                                    {it.estado === 'error' && <XCircle className="almacen-exito h-6 w-6 text-amber-600" />}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-2">
                                        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold', (TIPO[it.fila.tipo_doc] ?? TIPO['01']).clase)}>{(TIPO[it.fila.tipo_doc] ?? TIPO['01']).corto}</span>
                                        <span className="font-mono font-semibold">{doc(it.fila)}</span>
                                        <span className="truncate text-xs text-muted-foreground">{it.fila.cliente}</span>
                                    </span>
                                    {it.mensaje && <span className="mt-0.5 block text-xs font-medium text-amber-800 dark:text-amber-200">{it.mensaje}</span>}
                                    {it.estado === 'ok' && <span className="mt-0.5 block text-[11px] text-emerald-700 dark:text-emerald-300">RV +{it.tablas?.registroVentas.length ?? 0} · Mayor +{it.tablas?.mayorAuxiliar.length ?? 0} · ver registros</span>}
                                </span>
                                <span className={cn('shrink-0 font-mono text-xs font-bold', it.fila.total < 0 && 'text-violet-700 dark:text-violet-300')}>{soles(it.fila.total)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex shrink-0 gap-2 border-t bg-muted/30 px-5 py-3 sm:justify-end">
                    {fase === 'confirmar' && <>
                        <Button variant="outline" className="flex-1 sm:flex-none" onClick={cerrar}>Cancelar</Button>
                        <Button className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 hover:from-blue-700 hover:to-indigo-700 sm:flex-none" onClick={iniciar}>
                            <Upload className="mr-2 h-4 w-4" /> Iniciar carga
                        </Button>
                    </>}
                    {fase === 'cargando' && <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => { detener.current = true }}>Detener después del actual</Button>}
                    {fase === 'fin' && <Button className="flex-1 sm:flex-none" onClick={cerrar}>Cerrar</Button>}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function Afectada({ icono: Icono, titulo, texto, tono }: { icono: React.ElementType; titulo: string; texto: string; tono: 'blue' | 'slate' }) {
    return (
        <div className={cn('rounded-xl border p-3', tono === 'blue' ? 'border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/30' : 'bg-muted/40')}>
            <Icono className={cn('mb-1 h-4 w-4', tono === 'blue' ? 'text-blue-600' : 'text-muted-foreground')} />
            <p className="text-xs font-semibold">{titulo}</p>
            <p className="text-[11px] text-muted-foreground">{texto}</p>
        </div>
    )
}

// ------------------------------------------------------------------ modal de tablas afectadas / vista previa
/** Nombre corto de la cuenta según su elemento (para leer el asiento sin buscar el plan contable). */
const nombreCuenta = (cta: unknown) => {
    const c = String(cta ?? '')
    if (c.startsWith('12')) return 'Cuentas por cobrar · clientes'
    if (c.startsWith('40')) return 'Tributos · IGV'
    if (c.startsWith('70')) return 'Ventas'
    return 'Cuenta contable'
}

/** Dato de una tarjeta: etiqueta pequeña arriba y valor abajo. */
function Dato({ etiqueta, valor, mono, className }: { etiqueta: string; valor: React.ReactNode; mono?: boolean; className?: string }) {
    if (valor === null || valor === undefined || valor === '') return null
    return (
        <div className={cn('min-w-0 rounded-lg bg-muted/40 px-2.5 py-1.5', className)}>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{etiqueta}</p>
            <p className={cn('truncate text-sm font-semibold', mono && 'font-mono')}>{valor}</p>
        </div>
    )
}

/** Envoltura de tarjeta con franja de color, sombra y entrada escalonada. */
function TarjetaRegistro({ i, franja, previa, children }: { i: number; franja: string; previa: boolean; children: React.ReactNode }) {
    return (
        <div style={{ animationDelay: `${i * 70}ms` }}
             className={cn('relative overflow-hidden rounded-2xl border bg-card shadow-md shadow-slate-900/5 transition-all duration-200 animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both hover:-translate-y-0.5 hover:shadow-lg dark:shadow-black/30',
                 previa && 'border-dashed border-amber-300 dark:border-amber-800')}>
            <span className={cn('absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b', franja)} />
            <div className="space-y-3 py-3 pl-5 pr-4">{children}</div>
        </div>
    )
}

const IdRegistro = ({ id, previa }: { id: unknown; previa: boolean }) => (
    <span className={cn('shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold', id == null && previa ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' : 'bg-muted text-muted-foreground')}>
        {id == null ? (previa ? 'NUEVO' : '—') : `Id ${id}`}
    </span>
)

function TarjetaRegistroVentas({ r, i, previa }: { r: Record<string, any>; i: number; previa: boolean }) {
    const total = Number(r.Total ?? 0), nc = r.TipoDoc === '07'
    return (
        <TarjetaRegistro i={i} previa={previa} franja={nc ? 'from-violet-500 to-fuchsia-500' : 'from-blue-500 to-indigo-600'}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', nc ? 'from-violet-500 to-fuchsia-600' : 'from-blue-500 to-indigo-600')}><BookOpen className="h-5 w-5" /></span>
                    <div className="min-w-0">
                        <p className="font-mono text-base font-bold leading-tight">{r.Serie}-{r.Numero}</p>
                        <p className="text-[11px] text-muted-foreground">{(TIPO[r.TipoDoc] ?? TIPO['01']).largo} · {dmy(r.Fecha)}</p>
                    </div>
                </div>
                <IdRegistro id={r.idregvtas} previa={previa} />
            </div>
            <div className="flex flex-wrap items-end justify-between gap-2 rounded-xl bg-gradient-to-r from-muted/60 to-transparent px-3 py-2">
                <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Total</p>
                    <p className={cn('font-mono text-2xl font-bold', total < 0 ? 'text-violet-700 dark:text-violet-300' : 'text-foreground')}>{soles(total)}</p>
                </div>
                <div className="flex gap-4 text-right">
                    <div><p className="text-[10px] uppercase text-muted-foreground">Valor venta</p><p className="font-mono text-sm font-semibold">{num(r.ValorVta)}</p></div>
                    <div><p className="text-[10px] uppercase text-muted-foreground">IGV</p><p className="font-mono text-sm font-semibold">{num(r.IGV)}</p></div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Dato etiqueta="Cliente" valor={r.CodCliente} mono />
                <Dato etiqueta="Vence" valor={dmy(r.VctoDoc)} />
                <Dato etiqueta="Moneda" valor={r.Moneda} />
                {Number(r.Exonerado) !== 0 && <Dato etiqueta="Exonerado" valor={num(r.Exonerado)} mono />}
                {Number(r.Inafecto) !== 0 && <Dato etiqueta="Inafecto" valor={num(r.Inafecto)} mono />}
                {r.SerieDocOriginal && <Dato etiqueta="Documento original" valor={`${r.TipoDocOriginal ?? ''} ${r.SerieDocOriginal}-${r.NumeroDocOriginal ?? ''}`} mono className="col-span-2 sm:col-span-1" />}
                <Dato etiqueta="Origen" valor={r.transf_v ?? 'Access / manual'} />
            </div>
        </TarjetaRegistro>
    )
}

function TarjetaMayor({ r, i, previa }: { r: Record<string, any>; i: number; previa: boolean }) {
    const cargo = Number(r.Cargo ?? 0), abono = Number(r.Abono ?? 0), esCargo = cargo !== 0 || abono === 0
    return (
        <TarjetaRegistro i={i} previa={previa} franja={esCargo ? 'from-sky-500 to-blue-600' : 'from-emerald-500 to-teal-600'}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', esCargo ? 'from-sky-500 to-blue-600' : 'from-emerald-500 to-teal-600')}><Layers className="h-5 w-5" /></span>
                    <div className="min-w-0">
                        <p className="font-mono text-base font-bold leading-tight">{r.CtaContable}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{nombreCuenta(r.CtaContable)}</p>
                    </div>
                </div>
                <IdRegistro id={r.IdLibroMayor} previa={previa} />
            </div>
            <div className="flex items-end justify-between gap-2">
                <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold', esCargo ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200')}>
                    {esCargo ? 'DEBE · Cargo' : 'HABER · Abono'}
                </span>
                <p className="font-mono text-xl font-bold">{soles(esCargo ? cargo : abono)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <Dato etiqueta="Fecha" valor={dmy(r.Fecha)} />
                <Dato etiqueta="Libro" valor={r.LibroContab ? `Libro ${r.LibroContab}` : ''} />
                <Dato etiqueta="Concepto" valor={r.Concepto} className="col-span-2" />
            </div>
        </TarjetaRegistro>
    )
}

function TarjetaKardex({ r, i }: { r: Record<string, any>; i: number }) {
    const prov = Number(r.Provision ?? 0), amort = Number(r.Amortizacion ?? 0), esProv = prov !== 0 || amort === 0
    const monto = esProv ? prov : amort
    return (
        <TarjetaRegistro i={i} previa={false} franja={esProv ? 'from-slate-400 to-slate-600' : 'from-teal-500 to-cyan-600'}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', esProv ? 'from-slate-500 to-slate-700' : 'from-teal-500 to-cyan-600')}><Users className="h-5 w-5" /></span>
                    <div className="min-w-0">
                        <p className="text-sm font-bold leading-tight">{esProv ? 'Provisión' : 'Amortización'}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{r.SerieDoc}-{r.NumeroDoc} · cliente {r.Cod_Clie}</p>
                    </div>
                </div>
                <IdRegistro id={r.IdKardexClientes} previa={false} />
            </div>
            <p className={cn('text-right font-mono text-xl font-bold', monto < 0 && 'text-violet-700 dark:text-violet-300')}>{soles(monto)}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Dato etiqueta="Emisión" valor={dmy(r.Fecha_Emision)} />
                <Dato etiqueta="Vence" valor={dmy(r.Fecha_Vcto)} />
                <Dato etiqueta="Módulo" valor={r.ModuloTrabajo} />
                <Dato etiqueta="Tipo amort." valor={r.Tipo_Amortizacion} />
                <Dato etiqueta="Observación" valor={r.Observaciones} className="col-span-2 sm:col-span-4" />
            </div>
        </TarjetaRegistro>
    )
}

function ModalTablas({ ver, onCerrar, onCargar }: {
    ver: { fila: ComprobanteApp; tablas?: TablasAfectadas; previa: boolean; cargando: boolean; error?: string }
    onCerrar: () => void; onCargar?: () => void
}) {
    const [tab, setTab] = useState<'registroVentas' | 'mayorAuxiliar' | 'kardexClientes'>('registroVentas')
    const f = ver.fila, t = TIPO[f.tipo_doc] ?? TIPO['01']
    const tabs: { k: typeof tab; titulo: string; icono: React.ElementType; filas: Record<string, any>[] }[] = [
        { k: 'registroVentas', titulo: 'Registro de ventas', icono: BookOpen, filas: ver.tablas?.registroVentas ?? [] },
        { k: 'mayorAuxiliar', titulo: 'Mayor auxiliar', icono: Layers, filas: ver.tablas?.mayorAuxiliar ?? [] },
        { k: 'kardexClientes', titulo: 'Kardex clientes', icono: Users, filas: ver.tablas?.kardexClientes ?? [] },
    ]
    const actual = tabs.find(x => x.k === tab)!
    const cargo = (ver.tablas?.mayorAuxiliar ?? []).reduce((s, r) => s + Number(r.Cargo ?? 0), 0)
    const abono = (ver.tablas?.mayorAuxiliar ?? []).reduce((s, r) => s + Number(r.Abono ?? 0), 0)
    return (
        <Dialog open onOpenChange={o => { if (!o) onCerrar() }}>
            <DialogContent className="z-[70] flex max-h-[92vh] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl" closeClassName="text-white opacity-90 hover:opacity-100">
                <DialogHeader className={cn('shrink-0 bg-gradient-to-br px-5 py-4 text-left text-white', ver.previa ? 'from-amber-500 via-orange-500 to-orange-600' : 'from-emerald-600 via-emerald-700 to-teal-800')}>
                    <div className="flex items-center gap-3">
                        <span className="almacen-exito flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/10">
                            {ver.previa ? <Eye className="h-5 w-5" /> : <TableProperties className="h-5 w-5" />}
                        </span>
                        <div className="min-w-0 pr-6">
                            <DialogTitle className="text-base font-bold">{t.largo} {doc(f)}</DialogTitle>
                            <DialogDescription className="text-xs text-white/85">
                                {ver.previa ? 'Vista previa: estas filas se crearían al cargar (todavía no se graba nada).' : 'Tablas afectadas y sus registros actuales.'}
                                {' '}{f.cliente} · {soles(f.total)}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                    {ver.cargando ? (
                        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Leyendo tablas…</div>
                    ) : ver.error ? (
                        <AvisoAmbar mensaje={ver.error} />
                    ) : (<>
                        <div className="mb-3 flex flex-wrap gap-2">
                            {tabs.map(x => (
                                <button key={x.k} type="button" onClick={() => setTab(x.k)}
                                        className={cn('inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all',
                                            tab === x.k ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'bg-background hover:border-blue-300')}>
                                    <x.icono className="h-4 w-4" /> {x.titulo}
                                    <span className={cn('rounded-full px-1.5 text-[10px]', tab === x.k ? 'bg-white/25' : x.filas.length ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-muted text-muted-foreground')}>
                                        {ver.previa && x.k !== 'kardexClientes' ? '+' : ''}{x.filas.length}
                                    </span>
                                </button>
                            ))}
                        </div>
                        {tab === 'kardexClientes' && <p className="mb-2 text-xs text-muted-foreground">El kardex de clientes lo graba la web al emitir el comprobante; esta carga no lo modifica.</p>}
                        {tab === 'mayorAuxiliar' && actual.filas.length > 0 && (() => {
                            const cuadra = Math.abs(cargo - abono) < 0.01
                            return (
                                <div className="mb-3 grid grid-cols-3 gap-2">
                                    <div className="rounded-xl border bg-sky-50 px-3 py-2 dark:bg-sky-950/30"><p className="text-[10px] font-medium uppercase text-sky-700 dark:text-sky-300">Total debe</p><p className="font-mono text-base font-bold">{soles(cargo)}</p></div>
                                    <div className="rounded-xl border bg-emerald-50 px-3 py-2 dark:bg-emerald-950/30"><p className="text-[10px] font-medium uppercase text-emerald-700 dark:text-emerald-300">Total haber</p><p className="font-mono text-base font-bold">{soles(abono)}</p></div>
                                    <div className={cn('flex items-center gap-2 rounded-xl border px-3 py-2', cuadra ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-amber-50 dark:bg-amber-950/30')}>
                                        {cuadra ? <CheckCircle2 className="almacen-exito h-6 w-6 shrink-0 text-emerald-600" /> : <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" />}
                                        <p className="text-xs font-bold">{cuadra ? 'Asiento cuadrado' : 'Asiento descuadrado'}</p>
                                    </div>
                                </div>
                            )
                        })()}
                        {actual.filas.length === 0 ? (
                            <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">Sin registros en {actual.titulo.toLowerCase()}.</div>
                        ) : (
                            <div className={cn('grid gap-3', tab === 'mayorAuxiliar' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2')}>
                                {actual.filas.map((r, i) =>
                                    tab === 'registroVentas' ? <div key={i} className={cn(actual.filas.length === 1 && 'sm:col-span-2')}><TarjetaRegistroVentas r={r} i={i} previa={ver.previa} /></div>
                                    : tab === 'mayorAuxiliar' ? <TarjetaMayor key={i} r={r} i={i} previa={ver.previa} />
                                    : <TarjetaKardex key={i} r={r} i={i} />)}
                            </div>
                        )}
                    </>)}
                </div>
                <div className="flex shrink-0 gap-2 border-t bg-muted/30 px-5 py-3 sm:justify-end">
                    <Button variant="outline" className="flex-1 sm:flex-none" onClick={onCerrar}>Cerrar</Button>
                    {onCargar && !ver.cargando && !ver.error && (
                        <Button className="flex-[2] bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-600/25 hover:from-amber-600 hover:to-orange-600 sm:flex-none" onClick={onCargar}>
                            <Upload className="mr-2 h-4 w-4" /> Cargar este comprobante
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
