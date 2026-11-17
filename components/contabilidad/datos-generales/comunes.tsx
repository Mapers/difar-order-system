'use client'

import React from 'react'
import { AlertTriangle, CheckCircle2, Loader2, Search, X, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ComboSelect } from '@/components/ui/combo-select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { mensajeError } from '@/app/services/contabilidad/InformesContablesService'
import { Opcion, Uso } from '@/app/types/datos-generales-types'

/**
 * Piezas comunes de los mantenimientos de Datos Generales.
 * Regla del usuario: las validaciones y errores se muestran como AVISO ÁMBAR, nunca como toast rojo.
 */

export const texto = (v: unknown) => (v === null || v === undefined ? '' : String(v))
export const fechaCorta = (iso?: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '')
export const hoy = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
/**
 * "% Precio 1..4" de Bienes y Servicios: Access los muestra con formato Percent y la base guarda la FRACCIÓN
 * (18 % = 0.18; así están los artículos existentes). En pantalla se escribe el porcentaje (18) y se graba 0.18.
 */
export const pctDeFraccion = (v: unknown) => (v === null || v === undefined || v === '' ? '' : String(Number((Number(v) * 100).toFixed(2))))
export const fraccionDePct = (v: string) => (v.trim() === '' ? '' : String(Number((Number(v.trim().replace(',', '.')) / 100).toFixed(4))))
/** Aviso si un % Precio no es número de hasta 2 decimales (más decimales no caben en la fracción de 4 decimales). */
export const errorPct = (nombre: string, v: string) => {
    const t = v.trim().replace(',', '.')
    if (!t) return ''
    if (t.startsWith('-')) return `${nombre} no puede ser negativo.`
    if (!/^\d+(\.\d{1,2})?$/.test(t)) return `${nombre} debe ser un número con hasta 2 decimales (por ejemplo 18 o 7.05).`
    return ''
}
/** Mensaje del backend (400 de validación / SIGNAL del SP, 403, 500) para el aviso ámbar. */
export const textoError = (e: unknown, porDefecto = 'No se pudo completar la operación. Intenta nuevamente.') => mensajeError(e, porDefecto)

/**
 * Efecto "sacudir" del modal cuando hay un aviso (opcional, lo usa Almacén). Devuelve la ref para el DialogContent:
 * cada vez que cambia `disparador` (y no está vacío) vuelve a correr la animación sin desmontar el contenido.
 */
export function useSacudir(activo: boolean | undefined, disparador: unknown) {
    const ref = React.useRef<HTMLDivElement>(null)
    React.useEffect(() => {
        const el = ref.current
        if (!activo || !disparador || !el) return
        el.classList.remove('almacen-sacudir'); void el.offsetWidth; el.classList.add('almacen-sacudir')
    }, [activo, disparador])
    return ref
}

/** Aviso verde con check animado (guardado correcto). */
export function AvisoExito({ mensaje, onCerrar }: { mensaje: React.ReactNode; onCerrar?: () => void }) {
    if (!mensaje) return null
    return (
        <div role="status" className="flex items-center gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 animate-in fade-in-0 slide-in-from-top-1 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            <span className="almacen-exito almacen-brillo flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"><CheckCircle2 className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1 break-words font-medium">{mensaje}</span>
            {onCerrar && <button type="button" onClick={onCerrar} className="rounded p-0.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/40" aria-label="Cerrar aviso"><X className="h-4 w-4" /></button>}
        </div>
    )
}

/** Aviso ámbar (validaciones, errores del servidor). */
export function AvisoAmbar({ mensaje, onCerrar, className }: { mensaje: React.ReactNode; onCerrar?: () => void; className?: string }) {
    if (!mensaje) return null
    return (
        <div role="alert" className={cn('flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 animate-in fade-in-0 slide-in-from-top-1 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200', className)}>
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div className="min-w-0 flex-1 break-words">{mensaje}</div>
            {onCerrar && (
                <button type="button" onClick={onCerrar} className="shrink-0 rounded p-0.5 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40" aria-label="Cerrar aviso">
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}

/** Cabecera de la página del mantenimiento (título, descripción y botones). */
export function CabeceraMantenimiento({ icono, titulo, descripcion, children }: { icono: React.ReactNode; titulo: string; descripcion: string; children?: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25">{icono}</span>
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Datos generales</p>
                    <h1 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">{titulo}</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">{descripcion}</p>
                </div>
            </div>
            {children && <div className="flex flex-wrap gap-2">{children}</div>}
        </div>
    )
}

/** Caja de búsqueda con botón Buscar (Enter también busca). */
export function Buscador({ valor, onCambio, onBuscar, placeholder, cargando }: { valor: string; onCambio: (v: string) => void; onBuscar: () => void; placeholder: string; cargando?: boolean }) {
    return (
        <form className="flex w-full gap-2" onSubmit={(e) => { e.preventDefault(); onBuscar() }}>
            <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input value={valor} onChange={(e) => onCambio(e.target.value)} placeholder={placeholder}
                       className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500" />
            </div>
            <Button type="submit" variant="outline" size="sm" className="h-9 shrink-0" disabled={cargando}>
                {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
            </Button>
        </form>
    )
}

/** Tarjeta de sección de la ficha: ícono, título (como en Access) y ayuda opcional. */
export function Seccion({ titulo, ayuda, children, className, icono: Icono }: { titulo: string; ayuda?: string; children: React.ReactNode; className?: string; icono?: LucideIcon }) {
    return (
        <section className={cn('rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4', className)}>
            <header className="mb-3 flex items-start gap-2.5 border-b border-dashed border-border pb-2.5">
                {Icono && (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/15 to-indigo-500/15 text-blue-600 ring-1 ring-blue-500/20 dark:text-blue-300">
                        <Icono className="h-3.5 w-3.5" />
                    </span>
                )}
                <div className="min-w-0">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">{titulo}</h3>
                    {ayuda && <p className="mt-0.5 text-[11px] text-muted-foreground">{ayuda}</p>}
                </div>
            </header>
            {children}
        </section>
    )
}

/** Campo con etiqueta igual a la de Access; (*) = obligatorio. Con `error` parpadea en ámbar y dice "Requerido". */
export function Campo({ label, obligatorio, children, className, ayuda, error }: { label: string; obligatorio?: boolean; children: React.ReactNode; className?: string; ayuda?: string; error?: boolean | string }) {
    return (
        <div className={cn('flex min-w-0 flex-col gap-1', className)}>
            <Label className={cn('flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors', error && 'text-amber-700 dark:text-amber-400')}>
                {obligatorio && <span className="text-amber-600">(*)</span>}{label}
                {error && <span className="ml-auto rounded bg-amber-100 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-amber-800 animate-in fade-in-0 zoom-in-95 dark:bg-amber-900/50 dark:text-amber-200">{typeof error === 'string' ? error : 'Requerido'}</span>}
            </Label>
            <div className={cn('min-w-0 rounded-lg', error && 'almacen-campo-error ring-1 ring-amber-400')}>{children}</div>
            {ayuda && <span className="text-[10px] text-muted-foreground">{ayuda}</span>}
        </div>
    )
}

export const claseInput = 'h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-150 placeholder:text-muted-foreground/70 hover:border-blue-300 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-input dark:hover:border-blue-700'

/** Combo con buscador (estilo Contabilidad); con botón para dejarlo vacío si no es obligatorio. */
export function Combo({ items, valor, onCambio, placeholder = 'Seleccionar…', conCodigo, vaciable, disabled, icono: Icono, error }: {
    items: Opcion[] | undefined; valor: string; onCambio: (v: string) => void; placeholder?: string; conCodigo?: boolean; vaciable?: boolean; disabled?: boolean
    /** Ícono a la izquierda dentro del combo. */
    icono?: LucideIcon
    error?: boolean
}) {
    const elegido = !!valor && (items ?? []).some((i) => String(i.id) === String(valor))
    return (
        <div className="flex min-w-0 gap-1">
            <div className="relative min-w-0 flex-1">
                {Icono && <Icono className={cn('pointer-events-none absolute left-2.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2', elegido ? 'text-blue-600 dark:text-blue-300' : 'text-muted-foreground')} />}
                <ComboSelect<Opcion> value={valor} onChange={(i) => onCambio(String(i.id))} items={items ?? []} getKey={(i) => String(i.id)}
                                     getLabel={(i) => (conCodigo && i.codigo ? i.codigo : i.nombre)} getSub={conCodigo ? (i) => i.nombre : undefined}
                                     subEnBoton={conCodigo ? 'debajo' : true} placeholder={placeholder} disabled={disabled}
                                     triggerClassName={cn(
                                         'rounded-lg bg-background shadow-sm transition-all duration-150 hover:border-blue-300 hover:bg-background data-[state=open]:border-blue-500 data-[state=open]:ring-4 data-[state=open]:ring-blue-500/15 dark:hover:border-blue-700',
                                         conCodigo ? 'h-auto min-h-9' : 'h-9',
                                         Icono && 'pl-8',
                                         elegido ? 'border-blue-200 bg-blue-50/60 font-medium text-blue-950 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100' : 'text-muted-foreground',
                                         error && 'almacen-campo-error',
                                     )}
                                     contentClassName="min-w-[300px]" />
            </div>
            {vaciable && valor && !disabled && (
                <Button type="button" variant="ghost" size="icon" className="h-9 w-8 shrink-0" title="Quitar" onClick={() => onCambio('')}><X className="h-4 w-4" /></Button>
            )}
        </div>
    )
}

/** Alerta ámbar "no se puede eliminar" con el detalle de dónde se usa. */
export function AlertaUso({ titulo, usos, onCerrar }: { titulo: string; usos: Uso[] | null; onCerrar: () => void }) {
    const max = Math.max(...(usos ?? []).map((u) => u.cantidad), 1)
    return (
        <AlertDialog open={!!usos} onOpenChange={(o) => !o && onCerrar()}>
            <AlertDialogContent className="gap-0 overflow-hidden p-0">
                <div className="border-b border-amber-200 bg-amber-50 px-6 py-4 dark:border-amber-900 dark:bg-amber-950/40">
                    <AlertDialogHeader className="text-left">
                        <AlertDialogTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                            <AlertTriangle className="h-5 w-5 text-amber-500" /> {titulo}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-amber-800 dark:text-amber-300">Está en uso. Para eliminarlo no debe tener movimientos.</AlertDialogDescription>
                    </AlertDialogHeader>
                </div>
                <div className="max-h-[50vh] space-y-2 overflow-y-auto px-6 py-4">
                    {usos?.map((u) => (
                        <div key={u.tabla}>
                            <div className="flex justify-between gap-3 text-sm"><span className="font-medium text-foreground">{u.descripcion}</span>
                                <span className="font-mono tabular-nums text-muted-foreground">{u.cantidad.toLocaleString('es-PE')}</span></div>
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                                <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.max(4, (u.cantidad / max) * 100)}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
                <AlertDialogFooter className="px-6 pb-5"><AlertDialogAction onClick={onCerrar}>Entendido</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

/** Pregunta de confirmación (eliminar / guardar con avisos). */
export function Confirmar({ abierto, titulo, descripcion, avisos, textoAccion, peligro, onAceptar, onCancelar }: {
    abierto: boolean; titulo: string; descripcion?: string; avisos?: string[]; textoAccion: string; peligro?: boolean; onAceptar: () => void; onCancelar: () => void
}) {
    return (
        <AlertDialog open={abierto} onOpenChange={(o) => !o && onCancelar()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">{avisos?.length ? <AlertTriangle className="h-5 w-5 text-amber-500" /> : null}{titulo}</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-2 text-sm">
                            {descripcion && <p>{descripcion}</p>}
                            {avisos?.length ? <ul className="list-disc space-y-1 pl-5 text-amber-900 dark:text-amber-200">{avisos.map((a) => <li key={a}>{a}</li>)}</ul> : null}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Volver</AlertDialogCancel>
                    <AlertDialogAction className={peligro ? 'bg-red-600 hover:bg-red-700' : undefined} onClick={onAceptar}>{textoAccion}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

/** "Mostrando N de M" + Ver más (listas largas en el celular). */
export function VerMas({ mostrados, total, onMas }: { mostrados: number; total: number; onMas: () => void }) {
    if (total === 0) return null
    return (
        <div className="flex flex-col items-center gap-2 py-2 text-xs text-muted-foreground sm:flex-row sm:justify-between">
            <span>Mostrando {Math.min(mostrados, total).toLocaleString('es-PE')} de {total.toLocaleString('es-PE')}</span>
            {mostrados < total && <Button variant="outline" size="sm" onClick={onMas}>Ver {Math.min(100, total - mostrados)} más</Button>}
        </div>
    )
}
