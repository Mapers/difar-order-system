'use client'

import { ArrowDown, ArrowUp, ArrowUpDown, X } from 'lucide-react'
type DireccionOrden = 'asc' | 'desc'
import { fmtMontoCobranza, simboloMonedaCobranza } from '@/app/types/cobranza-types'

/* Piezas de presentación de la asignación de cobranzas: días al vencimiento,
   tarjetas de resumen, filtros rápidos, cabeceras ordenables y la barra de
   selección. Solo pintan; los datos y las acciones vienen de la sección. */

// ── Días al vencimiento ──────────────────────────────────────────────────────

/** Días que faltan para el vencimiento (negativo: días de atraso). */
export function diasParaVencer(fecha: string | null | undefined): number | null {
    if (!fecha) return null
    const [a, m, d] = fecha.slice(0, 10).split('-').map(Number)
    if (!a || !m || !d) return null
    const hoy = new Date()
    const base = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
    return Math.round((Date.UTC(a, m - 1, d) - base) / 86400000)
}

export function DiasVencimiento({ fecha }: { fecha: string | null | undefined }) {
    const dias = diasParaVencer(fecha)
    if (dias == null) return <span className="text-xs text-muted-foreground">—</span>
    const [texto, color] = dias < 0
        ? [`Vencida ${-dias} d`, -dias > 30 ? 'bg-red-100 text-red-700' : 'bg-red-50 text-red-700']
        : dias === 0
            ? ['Vence hoy', 'bg-amber-100 text-amber-800']
            : dias <= 7
                ? [`Vence en ${dias} d`, 'bg-amber-50 text-amber-700']
                : [`En ${dias} d`, 'bg-sky-50 text-sky-700']
    return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${color}`}>{texto}</span>
}

// ── Montos por moneda ────────────────────────────────────────────────────────

/** Montos por moneda tal como los resume el servidor. */
export type Montos = { PEN: number; USD: number }

/** "S/ 12,345.67 · US$ 890.00" (los dólares solo si hay). */
export function fmtMontos(m: Montos | undefined) {
    if (!m) return '—'
    const partes = [`S/ ${fmtMontoCobranza(m.PEN)}`]
    if (m.USD) partes.push(`US$ ${fmtMontoCobranza(m.USD)}`)
    return partes.join(' · ')
}

/** Suma por moneda: "S/ 12,345.67 · US$ 890.00". */
export function sumaPorMoneda<T>(filas: T[], monto: (f: T) => number | string | null | undefined, moneda: (f: T) => number | null | undefined) {
    const sumas = new Map<string, number>()
    for (const f of filas) {
        const s = simboloMonedaCobranza(moneda(f))
        sumas.set(s, (sumas.get(s) ?? 0) + (Number(monto(f)) || 0))
    }
    if (!sumas.size) return `${simboloMonedaCobranza(1)} 0.00`
    // Soles primero, luego las demás monedas.
    return [...sumas.entries()].sort(([a], [b]) => Number(b === simboloMonedaCobranza(1)) - Number(a === simboloMonedaCobranza(1))).map(([s, v]) => `${s} ${fmtMontoCobranza(v)}`).join(' · ')
}

// ── Tarjetas de resumen ──────────────────────────────────────────────────────

export type Tarjeta = {
    id: string
    titulo: string
    valor: string
    detalle?: string
    tono: 'neutro' | 'rojo' | 'ambar' | 'verde' | 'azul' | 'violeta'
    activa?: boolean
    onClick?: () => void
}

const TONOS: Record<Tarjeta['tono'], { valor: string; borde: string; punto: string }> = {
    neutro:  { valor: 'text-foreground',  borde: 'ring-slate-400', punto: 'bg-slate-400' },
    rojo:    { valor: 'text-red-700',     borde: 'ring-red-500',   punto: 'bg-red-500' },
    ambar:   { valor: 'text-amber-700',   borde: 'ring-amber-500', punto: 'bg-amber-500' },
    verde:   { valor: 'text-emerald-700', borde: 'ring-emerald-500', punto: 'bg-emerald-500' },
    azul:    { valor: 'text-blue-700',    borde: 'ring-blue-500',  punto: 'bg-blue-500' },
    violeta: { valor: 'text-purple-700',  borde: 'ring-purple-500', punto: 'bg-purple-500' },
}

export function TarjetasResumen({ tarjetas, cargando }: { tarjetas: Tarjeta[]; cargando?: boolean }) {
    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {tarjetas.map(t => {
                const tono = TONOS[t.tono]
                const Comp = t.onClick ? 'button' : 'div'
                return (
                    <Comp
                        key={t.id}
                        onClick={t.onClick}
                        className={`rounded-xl border bg-card p-3.5 text-left shadow-sm transition sm:p-4 ${
                            t.activa ? `border-transparent ring-2 ${tono.borde}` : 'border-border'
                        } ${t.onClick ? 'hover:border-foreground/20 hover:shadow' : ''}`}
                    >
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            <span className={`h-1.5 w-1.5 rounded-full ${tono.punto}`} />
                            {t.titulo}
                        </div>
                        {cargando
                            ? <div className="mt-2 h-7 w-24 animate-pulse rounded bg-muted" />
                            : <div className={`mt-1 text-xl font-bold tabular-nums sm:text-2xl ${tono.valor}`}>{t.valor}</div>}
                        {t.detalle && <div className="mt-0.5 truncate text-xs text-muted-foreground tabular-nums">{t.detalle}</div>}
                    </Comp>
                )
            })}
        </div>
    )
}

// ── Filtros rápidos ──────────────────────────────────────────────────────────

export type Chip = { valor: string; etiqueta: string; cantidad: number }

export function ChipsFiltro({ chips, activos, onCambiar }: { chips: Chip[]; activos: string[]; onCambiar: (valor: string) => void }) {
    return (
        // En celular, una sola fila con desplazamiento lateral; en pantallas grandes, varias filas.
        <div className="-mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {chips.map(c => {
                const activo = activos.includes(c.valor)
                return (
                    <button
                        key={c.valor}
                        onClick={() => onCambiar(c.valor)}
                        className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition ${
                            activo ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                        }`}
                    >
                        {c.etiqueta}
                        <span className={`rounded-full px-1.5 tabular-nums ${activo ? 'bg-background/20' : 'bg-muted'}`}>{c.cantidad}</span>
                    </button>
                )
            })}
        </div>
    )
}

// ── Cabecera ordenable ───────────────────────────────────────────────────────

export function Th({ titulo, clave, orden, direccion, onOrdenar, derecha }: {
    titulo: string; clave?: string; orden?: string; direccion?: DireccionOrden; onOrdenar?: (c: string) => void; derecha?: boolean
}) {
    const base = `px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground ${derecha ? 'text-right' : 'text-left'}`
    if (!clave || !onOrdenar) return <th className={base}>{titulo}</th>
    const activo = orden === clave
    const Icono = !activo ? ArrowUpDown : direccion === 'asc' ? ArrowUp : ArrowDown
    return (
        <th className={base} aria-sort={activo ? (direccion === 'asc' ? 'ascending' : 'descending') : undefined}>
            <button onClick={() => onOrdenar(clave)} className={`inline-flex items-center gap-1 uppercase hover:text-foreground ${activo ? 'text-foreground' : ''}`}>
                {titulo}
                <Icono className={`h-3 w-3 ${activo ? '' : 'opacity-40'}`} />
            </button>
        </th>
    )
}

// ── Barra de selección ───────────────────────────────────────────────────────

export function BarraSeleccion({ cantidad, monto, onLimpiar, onAsignar }: {
    cantidad: number; monto: string; onLimpiar: () => void; onAsignar: () => void
}) {
    if (cantidad === 0) return null
    return (
        <div className="sticky bottom-20 z-20 lg:bottom-3 mx-auto flex w-full max-w-3xl items-center gap-3 rounded-2xl border border-teal-200 bg-card/95 px-4 py-3 shadow-xl backdrop-blur animate-in fade-in slide-in-from-bottom-2">
            <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{cantidad} {cantidad === 1 ? 'factura seleccionada' : 'facturas seleccionadas'}</div>
                <div className="truncate text-xs text-muted-foreground tabular-nums">Saldo: {monto}</div>
            </div>
            <button onClick={onLimpiar} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" /> <span className="hidden sm:inline">Quitar</span>
            </button>
            <button onClick={onAsignar} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
                Asignar a cobranza
            </button>
        </div>
    )
}
