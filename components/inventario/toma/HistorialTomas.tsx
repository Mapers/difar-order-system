'use client'

import { useCallback, useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CalendarDays, ChevronRight, ClipboardCheck, FlaskConical, History, Layers, ListChecks, Loader2, RefreshCw, Warehouse } from "lucide-react"
import { TomaInventarioService } from "@/app/services/inventario/TomaInventarioService"
import { TomaCabecera } from "@/app/types/toma-inventario-types"
import { fechaDMY } from "@/components/contabilidad/comisiones/ui"

export const fechaHora = (v: string | null | undefined) => {
    if (!v) return ''
    const d = new Date(String(v).replace(' ', 'T'))
    if (Number.isNaN(d.getTime())) return String(v)
    return d.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function EstadoBadge({ estado }: { estado: TomaCabecera['Estado'] }) {
    return estado === 'CERRADA'
        ? <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300"><ClipboardCheck className="h-3 w-3" />Cerrada</span>
        : <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />En curso</span>
}

export function ModoBadge({ modo }: { modo: TomaCabecera['Modo'] }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300">
            {modo === 'LOTE' ? <Layers className="h-3 w-3" /> : <ListChecks className="h-3 w-3" />}
            {modo === 'LOTE' ? 'Por lote' : 'Por artículo'}
        </span>
    )
}

export function Avance({ contadas, lineas }: { contadas: number; lineas: number }) {
    const p = lineas ? Math.round((contadas / lineas) * 100) : 0
    return (
        <div>
            <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                <span>{contadas} de {lineas} contadas</span><span className="font-semibold text-foreground">{p}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full transition-all ${p === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${p}%` }} />
            </div>
        </div>
    )
}

/** Pestaña "Mis tomas": historial de tomas del usuario conectado (solo las propias). */
export function HistorialTomas({ onAbrir }: { onAbrir: (idToma: number) => void }) {
    const [tomas, setTomas] = useState<TomaCabecera[] | null>(null)
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const cargar = useCallback(async () => {
        setCargando(true)
        setError(null)
        try { setTomas(await TomaInventarioService.historial()) }
        catch (e: any) { setError(e?.response?.data?.message || 'No se pudo cargar el historial.') }
        finally { setCargando(false) }
    }, [])

    useEffect(() => { cargar() }, [cargar])

    return (
        <div className="grid gap-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="flex items-center gap-2 text-base font-semibold"><History className="h-4 w-4 text-blue-600" /> Mis tomas de inventario</h2>
                    <p className="text-xs text-muted-foreground">Solo ves las tomas creadas con tu usuario.</p>
                </div>
                <Button variant="outline" size="sm" onClick={cargar} disabled={cargando} className="gap-1.5">
                    {cargando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Actualizar
                </Button>
            </div>

            {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span>
                </div>
            )}

            {tomas && tomas.length === 0 && (
                <Card className="shadow-sm">
                    <div className="flex flex-col items-center justify-center py-14 text-center text-muted-foreground">
                        <History className="mb-3 h-12 w-12 opacity-20" />
                        <p className="text-sm font-medium">Aún no tienes tomas de inventario</p>
                        <p className="mt-1 text-xs">Genera el listado o el reporte por lote y pulsa <b>Crear toma de inventario</b>.</p>
                    </div>
                </Card>
            )}

            {!tomas && cargando && (
                <div className="flex justify-center py-14 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
            )}

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {tomas?.map(t => (
                    <button key={t.IdToma} type="button" onClick={() => onAbrir(t.IdToma)}
                            className="group rounded-xl border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-xs text-muted-foreground">Toma N.º</p>
                                <p className="font-mono text-lg font-bold leading-tight">{String(t.IdToma).padStart(5, '0')}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1"><EstadoBadge estado={t.Estado} /><ModoBadge modo={t.Modo} /></div>
                        </div>
                        <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5 truncate"><FlaskConical className="h-3.5 w-3.5 shrink-0" />{t.Laboratorio || 'Todos los laboratorios'}</span>
                            {t.Modo === 'LOTE' && <span className="flex items-center gap-1.5"><Warehouse className="h-3.5 w-3.5 shrink-0" />{t.Almacen || 'Todos los almacenes'}</span>}
                            <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 shrink-0" />Corte {fechaDMY(t.FechaCorte)} · creada {fechaHora(t.CreadoEn)}</span>
                        </div>
                        {t.Observacion && <p className="mt-2 line-clamp-2 text-xs italic text-muted-foreground">“{t.Observacion}”</p>}
                        <div className="mt-3"><Avance contadas={t.Contadas} lineas={t.Lineas} /></div>
                        <div className="mt-3 flex items-center justify-end gap-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
                            {t.Estado === 'BORRADOR' ? 'Continuar conteo' : 'Ver y exportar'} <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}
