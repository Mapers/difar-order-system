'use client'

import React from 'react'
import { AlertTriangle, Loader2, Search, X } from 'lucide-react'
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
/** Mensaje del backend (400 de validación / SIGNAL del SP, 403, 500) para el aviso ámbar. */
export const textoError = (e: unknown, porDefecto = 'No se pudo completar la operación. Intenta nuevamente.') => mensajeError(e, porDefecto)

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

/** Tarjeta de sección de la ficha, con título subrayado como en Access. */
export function Seccion({ titulo, ayuda, children, className }: { titulo: string; ayuda?: string; children: React.ReactNode; className?: string }) {
    return (
        <section className={cn('rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4', className)}>
            <header className="mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-700 underline underline-offset-4 dark:text-blue-300">{titulo}</h3>
                {ayuda && <p className="mt-1 text-[11px] text-muted-foreground">{ayuda}</p>}
            </header>
            {children}
        </section>
    )
}

/** Campo con etiqueta igual a la de Access; (*) = obligatorio. */
export function Campo({ label, obligatorio, children, className, ayuda }: { label: string; obligatorio?: boolean; children: React.ReactNode; className?: string; ayuda?: string }) {
    return (
        <div className={cn('flex min-w-0 flex-col gap-1', className)}>
            <Label className="text-[11px] font-medium text-muted-foreground">
                {obligatorio && <span className="text-amber-600">(*)</span>}{label}
            </Label>
            {children}
            {ayuda && <span className="text-[10px] text-muted-foreground">{ayuda}</span>}
        </div>
    )
}

export const claseInput = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60'

/** Combo con buscador; con botón para dejarlo vacío si no es obligatorio. */
export function Combo({ items, valor, onCambio, placeholder = 'Seleccionar…', conCodigo, vaciable, disabled }: {
    items: Opcion[] | undefined; valor: string; onCambio: (v: string) => void; placeholder?: string; conCodigo?: boolean; vaciable?: boolean; disabled?: boolean
}) {
    return (
        <div className="flex min-w-0 gap-1">
            <div className="min-w-0 flex-1">
                <ComboSelect<Opcion> value={valor} onChange={(i) => onCambio(String(i.id))} items={items ?? []} getKey={(i) => String(i.id)}
                                     getLabel={(i) => (conCodigo && i.codigo ? i.codigo : i.nombre)} getSub={conCodigo ? (i) => i.nombre : undefined}
                                     subEnBoton={conCodigo ? 'debajo' : true} placeholder={placeholder} disabled={disabled}
                                     triggerClassName={cn('bg-background', conCodigo ? 'h-auto min-h-9' : 'h-9')} contentClassName="min-w-[300px]" />
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
