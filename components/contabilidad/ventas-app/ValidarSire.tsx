'use client'

import React, { useMemo, useRef, useState } from 'react'
import {
    AlertTriangle, ArrowRight, BadgeCheck, Bot, CheckCircle2, FileSpreadsheet, Info, Loader2, RefreshCw, ShieldCheck, Sparkles, UploadCloud, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { textoError } from '@/components/contabilidad/datos-generales/comunes'
import { DocumentoSire, FilaSire, leerExcelSire, ResultadoSire, SireVentasService } from '@/app/services/contabilidad/SireVentasService'

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const soles = (v: unknown) => `S/ ${Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const num = (v: unknown) => Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const dmy = (v: unknown) => { if (!v) return ''; const s = String(v).slice(0, 10); return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` }
const nombrePeriodo = (p: string) => `${MESES[Number(p.slice(4)) - 1] ?? ''} ${p.slice(0, 4)}`
const TIPO: Record<string, string> = { '01': 'FAC', '03': 'BOL', '07': 'NC', '08': 'ND' }
const NIVEL = {
    aviso: { borde: 'border-amber-300 dark:border-amber-800', franja: 'from-amber-400 to-orange-500', chip: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200', icono: AlertTriangle, color: 'text-amber-600' },
    info: { borde: 'border-sky-200 dark:border-sky-900', franja: 'from-sky-400 to-cyan-500', chip: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200', icono: Info, color: 'text-sky-600' },
    ok: { borde: 'border-emerald-200 dark:border-emerald-900', franja: 'from-emerald-400 to-teal-500', chip: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200', icono: CheckCircle2, color: 'text-emerald-600' },
} as const
const PASOS = ['Leyendo el Excel de SUNAT', 'Comparando con el Registro de Ventas', 'La IA está revisando las diferencias']

type Fase = 'subir' | 'validando' | 'resultado'

/** Modal: arrastrar y soltar la propuesta SIRE de ventas, validarla contra la web y ver el resultado documento por documento. */
export function ValidarSire({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
    const [fase, setFase] = useState<Fase>('subir')
    const [arrastrando, setArrastrando] = useState(false)
    const [archivo, setArchivo] = useState<{ nombre: string; periodo: string; filas: FilaSire[] } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [paso, setPaso] = useState(0)
    const [res, setRes] = useState<ResultadoSire | null>(null)
    const [filtro, setFiltro] = useState<string>('problemas')
    const [mostrar, setMostrar] = useState(40)
    const input = useRef<HTMLInputElement>(null)

    const reiniciar = () => { setFase('subir'); setArchivo(null); setRes(null); setError(null); setFiltro('problemas'); setMostrar(40) }

    const tomarArchivo = async (f: File | undefined) => {
        if (!f) return
        setError(null)
        if (!/\.(xlsx|xls)$/i.test(f.name)) { setError('Sube el Excel (.xlsx) de la propuesta SIRE que descargas de SUNAT.'); return }
        try {
            const leido = await leerExcelSire(f)
            setArchivo({ nombre: f.name, periodo: leido.periodo, filas: leido.filas })
            validar(leido.periodo, leido.filas)
        } catch (e: any) { setError(e?.message ?? 'No se pudo leer el archivo.') }
    }

    const validar = async (periodo: string, filas: FilaSire[]) => {
        setFase('validando'); setPaso(0)
        const t1 = setTimeout(() => setPaso(1), 600), t2 = setTimeout(() => setPaso(2), 1800)
        try {
            const r = await SireVentasService.validar(periodo, filas)
            setRes(r); setFase('resultado'); setFiltro(r.documentos.some(d => d.nivel === 'aviso') ? 'problemas' : 'todos')
        } catch (e) { setError(await textoError(e, 'No se pudo validar el archivo.')); setFase('subir') }
        finally { clearTimeout(t1); clearTimeout(t2) }
    }

    const docs = useMemo(() => {
        if (!res) return []
        if (filtro === 'todos') return res.documentos
        if (filtro === 'problemas') return res.documentos.filter(d => d.nivel === 'aviso')
        return res.documentos.filter(d => d.categoria === filtro)
    }, [res, filtro])

    const cerrar = () => { if (fase !== 'validando') { onCerrar(); setTimeout(reiniciar, 300) } }

    return (
        <Dialog open={abierto} onOpenChange={o => { if (!o) cerrar() }}>
            <DialogContent className="flex max-h-[94vh] max-w-6xl flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl" closeClassName="text-white opacity-90 hover:opacity-100">
                <DialogHeader className="shrink-0 bg-gradient-to-br from-indigo-600 via-blue-700 to-cyan-700 px-5 py-4 text-left text-white">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-4 ring-white/10"><ShieldCheck className="h-5 w-5" /></span>
                        <div className="min-w-0 pr-6">
                            <DialogTitle className="text-base font-bold">Validar propuesta SIRE de ventas</DialogTitle>
                            <DialogDescription className="text-xs text-blue-100">
                                {archivo ? `${archivo.nombre} · ${nombrePeriodo(archivo.periodo)} · ${archivo.filas.length} comprobantes` : 'Compara el Excel de SUNAT con el Registro de Ventas, documento por documento, y la IA te explica cada diferencia.'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                    {/* ------------------------------------------------ subir */}
                    {fase === 'subir' && (
                        <div className="space-y-3">
                            <div role="button" tabIndex={0} onClick={() => input.current?.click()} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') input.current?.click() }}
                                 onDragOver={e => { e.preventDefault(); setArrastrando(true) }} onDragLeave={() => setArrastrando(false)}
                                 onDrop={e => { e.preventDefault(); setArrastrando(false); tomarArchivo(e.dataTransfer.files?.[0]) }}
                                 className={cn('group relative flex cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all duration-200',
                                     arrastrando ? 'scale-[1.01] border-blue-500 bg-blue-50 shadow-lg shadow-blue-600/15 dark:bg-blue-950/40' : 'border-muted-foreground/30 bg-muted/20 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20')}>
                                <span className={cn('flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 transition-transform duration-300',
                                    arrastrando ? 'ventasapp-latido scale-110' : 'group-hover:-translate-y-1')}>
                                    <UploadCloud className="h-8 w-8" />
                                </span>
                                <div>
                                    <p className="text-base font-semibold">{arrastrando ? 'Suelta el archivo aquí' : 'Arrastra aquí la propuesta SIRE de ventas'}</p>
                                    <p className="mt-0.5 text-sm text-muted-foreground">o haz clic para elegirla · Excel (.xlsx) que descargas de SUNAT</p>
                                </div>
                                <div className="flex flex-wrap justify-center gap-2 text-[11px] text-muted-foreground">
                                    <span className="rounded-full bg-background px-2 py-0.5 ring-1 ring-border">Detecta el periodo solo</span>
                                    <span className="rounded-full bg-background px-2 py-0.5 ring-1 ring-border">Compara uno a uno</span>
                                    <span className="rounded-full bg-background px-2 py-0.5 ring-1 ring-border">La IA explica cada diferencia</span>
                                </div>
                                <input ref={input} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => { tomarArchivo(e.target.files?.[0]); e.target.value = '' }} />
                            </div>
                            {error && (
                                <div className="almacen-sacudir flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> <span className="flex-1">{error}</span>
                                    <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ------------------------------------------------ validando */}
                    {fase === 'validando' && (
                        <div className="flex flex-col items-center gap-6 py-10">
                            <div className="relative flex w-full max-w-md items-center justify-between rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 dark:from-blue-950/40 dark:to-indigo-950/40" style={{ ['--ventasapp-dist' as any]: '230px' }}>
                                <div className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow dark:bg-slate-900"><FileSpreadsheet className="h-5 w-5 text-emerald-600" /></span>SUNAT</div>
                                <div className="relative mx-3 h-10 flex-1 overflow-hidden">
                                    <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-blue-300 dark:border-blue-800" />
                                    {[0, 1, 2].map(i => <span key={i} className="ventasapp-viaje absolute left-0 top-1/2 -mt-2.5 h-5 w-4 rounded-sm bg-white shadow ring-1 ring-blue-200 dark:bg-blue-900" style={{ animationDelay: `${i * 0.45}s` }} />)}
                                </div>
                                <div className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground"><span className="ventasapp-latido flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow"><Bot className="h-5 w-5" /></span>Registro + IA</div>
                            </div>
                            <ol className="w-full max-w-md space-y-2">
                                {PASOS.map((p, i) => (
                                    <li key={p} className={cn('flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm transition-all duration-300',
                                        i < paso ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30' : i === paso ? 'border-blue-300 bg-blue-50 shadow-sm dark:border-blue-800 dark:bg-blue-950/30' : 'opacity-50')}>
                                        {i < paso ? <CheckCircle2 className="almacen-exito h-4 w-4 text-emerald-600" /> : i === paso ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : <span className="h-4 w-4 rounded-full border-2" />}
                                        {p}{i === paso && <span className="ventasapp-puntos"><i>.</i><i>.</i><i>.</i></span>}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {/* ------------------------------------------------ resultado */}
                    {fase === 'resultado' && res && (
                        <div className="space-y-4">
                            {/* Veredicto */}
                            <div className={cn('almacen-exito flex items-start gap-3 rounded-2xl border p-4 shadow-sm',
                                res.resumen.cuadra ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 dark:border-emerald-800 dark:from-emerald-950/40 dark:to-teal-950/30' : 'border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-800 dark:from-amber-950/40 dark:to-orange-950/30')}>
                                <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md', res.resumen.cuadra ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-amber-500 to-orange-500')}>
                                    {res.resumen.cuadra ? <BadgeCheck className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-base font-bold">{res.resumen.cuadra ? `${nombrePeriodo(res.periodo)} cuadra con SUNAT` : `${nombrePeriodo(res.periodo)} no cuadra con SUNAT`}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {res.resumen.cuadra ? 'La base imponible y el IGV del Registro de Ventas son iguales a la propuesta SIRE.'
                                            : `Diferencia en base imponible ${soles(res.resumen.diferencia.base)} · IGV ${soles(res.resumen.diferencia.igv)} · ${res.documentos.filter(d => d.nivel === 'aviso').length} comprobante(s) por revisar.`}
                                    </p>
                                </div>
                            </div>

                            {/* Resumen de la IA */}
                            {(res.ia || res.iaError) && (
                                <div className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-4 shadow-sm dark:border-violet-900 dark:from-violet-950/40 dark:to-indigo-950/30">
                                    <div className="flex items-start gap-3">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md"><Sparkles className="h-4 w-4" /></span>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">Revisión de la IA</p>
                                            <p className="mt-0.5 text-sm leading-relaxed">{res.ia?.resumen ?? res.iaError}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Comparativo SUNAT vs Registro */}
                            <div className="grid gap-3 sm:grid-cols-3">
                                {([['Base imponible (O+P)', res.resumen.sunat.base, res.resumen.registro.base, res.resumen.diferencia.base],
                                   ['IGV (Q+R)', res.resumen.sunat.igv, res.resumen.registro.igv, res.resumen.diferencia.igv],
                                   ['Total CP (Z)', res.resumen.sunat.total, res.resumen.registro.total + res.resumen.sunat.otros, res.resumen.diferencia.total]] as [string, number, number, number][])
                                    .map(([t, s, r, d]) => {
                                        const ok = Math.abs(d) < 0.01
                                        return (
                                            <div key={t} className={cn('rounded-2xl border bg-card p-3 shadow-md shadow-slate-900/5 dark:shadow-black/30', !ok && 'ring-1 ring-amber-400/50')}>
                                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{t}</p>
                                                <div className="mt-1.5 space-y-0.5 text-xs">
                                                    <div className="flex justify-between"><span className="text-muted-foreground">SUNAT</span><span className="font-mono font-semibold">{soles(s)}</span></div>
                                                    <div className="flex justify-between"><span className="text-muted-foreground">Registro{t.startsWith('Total') ? ' + flete' : ''}</span><span className="font-mono font-semibold">{soles(r)}</span></div>
                                                    <div className={cn('mt-1 flex justify-between border-t border-dashed pt-1 font-bold', ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300')}>
                                                        <span className="flex items-center gap-1">{ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />} Diferencia</span><span className="font-mono">{soles(d)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                            </div>

                            {/* Filtros por categoría */}
                            <div className="flex flex-wrap gap-2">
                                {[['problemas', `Por revisar`, res.documentos.filter(d => d.nivel === 'aviso').length], ['todos', 'Todos', res.documentos.length],
                                  ...Object.entries(res.resumen.conteo).map(([k, n]) => [k, res.documentos.find(d => d.categoria === k)?.titulo ?? k, n])]
                                    .map(([k, t, n]) => (
                                        <button key={String(k)} type="button" onClick={() => { setFiltro(String(k)); setMostrar(40) }}
                                                className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all',
                                                    filtro === k ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'bg-background hover:border-blue-300')}>
                                            {t}<span className={cn('rounded-full px-1.5 text-[10px] font-bold', filtro === k ? 'bg-white/25' : 'bg-muted text-muted-foreground')}>{n}</span>
                                        </button>
                                    ))}
                            </div>

                            {/* Tarjetas por comprobante */}
                            {docs.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-10 text-sm text-muted-foreground"><CheckCircle2 className="h-8 w-8 text-emerald-500" /> Nada que revisar en este filtro.</div>
                            ) : (
                                <div className="grid gap-3 md:grid-cols-2">
                                    {docs.slice(0, mostrar).map((d, i) => <TarjetaDocumento key={d.clave} d={d} i={i} />)}
                                </div>
                            )}
                            {docs.length > mostrar && (
                                <div className="text-center"><Button variant="outline" size="sm" onClick={() => setMostrar(m => m + 40)}>Ver más ({docs.length - mostrar})</Button></div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex shrink-0 gap-2 border-t bg-muted/30 px-5 py-3 sm:justify-end">
                    {fase === 'resultado' && <Button variant="outline" className="flex-1 sm:flex-none" onClick={reiniciar}><RefreshCw className="mr-2 h-4 w-4" /> Validar otro archivo</Button>}
                    <Button className="flex-1 sm:flex-none" variant={fase === 'resultado' ? 'default' : 'outline'} disabled={fase === 'validando'} onClick={cerrar}>Cerrar</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function Montos({ titulo, m, otros }: { titulo: string; m: { base: number; igv: number; total: number } | null; otros?: number }) {
    return (
        <div className="min-w-0 rounded-lg bg-muted/40 px-2.5 py-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</p>
            {m ? (
                <div className="mt-0.5 space-y-0.5 font-mono text-[11px]">
                    <div className="flex justify-between gap-2"><span className="font-sans text-muted-foreground">Base</span>{soles(m.base)}</div>
                    <div className="flex justify-between gap-2"><span className="font-sans text-muted-foreground">IGV</span>{soles(m.igv)}</div>
                    {!!otros && <div className="flex justify-between gap-2"><span className="font-sans text-muted-foreground">Flete (Y)</span>{soles(otros)}</div>}
                    <div className="flex justify-between gap-2 font-bold"><span className="font-sans font-semibold text-muted-foreground">Total</span>{soles(m.total)}</div>
                </div>
            ) : <p className="mt-1 text-xs italic text-muted-foreground">No está</p>}
        </div>
    )
}

function TarjetaDocumento({ d, i }: { d: DocumentoSire; i: number }) {
    const n = NIVEL[d.nivel], Icono = n.icono
    return (
        <div style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
             className={cn('relative overflow-hidden rounded-2xl border bg-card shadow-md shadow-slate-900/5 transition-all duration-200 animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both hover:-translate-y-0.5 hover:shadow-lg dark:shadow-black/30', n.borde)}>
            <span className={cn('absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b', n.franja)} />
            <div className="space-y-2.5 py-3 pl-5 pr-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold">{TIPO[d.tipo] ?? d.tipo}</span>
                            <span className="font-mono text-sm font-bold">{d.serie}-{String(d.numero).padStart(8, '0')}</span>
                            <span className="text-[11px] text-muted-foreground">{dmy(d.fecha)}</span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{d.cliente ?? d.ruc}{d.docRef ? ` · modifica ${d.docRef}` : ''}</p>
                    </div>
                    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', n.chip)}><Icono className="h-3 w-3" />{d.titulo}</span>
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <Montos titulo="SUNAT" m={d.sunat} otros={d.sunat?.otros} />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Montos titulo="Registro de Ventas" m={d.registro} />
                </div>
                {d.nivel === 'aviso' && (
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                        {Math.abs(d.dif.base) >= 0.01 && <span className="rounded-md bg-amber-100 px-1.5 py-0.5 font-mono font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">Base {d.dif.base > 0 ? '+' : ''}{soles(d.dif.base)}</span>}
                        {Math.abs(d.dif.igv) >= 0.01 && <span className="rounded-md bg-amber-100 px-1.5 py-0.5 font-mono font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">IGV {d.dif.igv > 0 ? '+' : ''}{soles(d.dif.igv)}</span>}
                    </div>
                )}
                {d.explicacionIA ? (
                    <div className="rounded-xl border border-violet-200 bg-violet-50/70 px-3 py-2 text-xs dark:border-violet-900 dark:bg-violet-950/30">
                        <p className="flex items-start gap-1.5"><Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-600" /><span>{d.explicacionIA}</span></p>
                        {d.accionIA && <p className="mt-1 pl-5 font-semibold text-violet-800 dark:text-violet-200">→ {d.accionIA}</p>}
                    </div>
                ) : (d.causa || d.accion) ? (
                    <div className="rounded-xl bg-muted/40 px-3 py-2 text-xs">
                        <p className="flex items-start gap-1.5"><Icono className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', n.color)} /><span>{d.causa}</span></p>
                        {d.accion && <p className="mt-1 pl-5 font-semibold">→ {d.accion}</p>}
                    </div>
                ) : null}
            </div>
        </div>
    )
}
