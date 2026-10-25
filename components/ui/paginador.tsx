'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

const TAMANOS = [25, 50, 100]

type Props = {
    pagina: number
    totalPaginas: number
    total: number
    tamano: number
    onPagina: (p: number) => void
    onTamano: (t: number) => void
    /** Cómo se llaman los elementos: "facturas", "cobranzas"... */
    etiqueta?: string
}

// Páginas a mostrar: la primera, la última y las vecinas de la actual.
function paginasVisibles(actual: number, total: number): (number | '…')[] {
    const set = new Set([1, total, actual - 1, actual, actual + 1].filter(p => p >= 1 && p <= total))
    const orden = [...set].sort((a, b) => a - b)
    return orden.flatMap((p, i) => (i > 0 && p - orden[i - 1] > 1 ? ['…' as const, p] : [p]))
}

/** Paginador genérico: rango mostrado, páginas y filas por página. */
export function Paginador({ pagina, totalPaginas, total, tamano, onPagina, onTamano, etiqueta = 'registros' }: Props) {
    if (total === 0) return null
    const desde = (pagina - 1) * tamano + 1
    const hasta = Math.min(pagina * tamano, total)
    const boton = 'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm transition disabled:pointer-events-none disabled:opacity-40'

    return (
        <div className="flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
            <span className="tabular-nums">
                {desde.toLocaleString('es-PE')}–{hasta.toLocaleString('es-PE')} de <b className="text-foreground">{total.toLocaleString('es-PE')}</b> {etiqueta}
            </span>
            <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5">
                    <span className="hidden sm:inline">Por página</span>
                    <select
                        value={tamano}
                        onChange={e => onTamano(Number(e.target.value))}
                        className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                    >
                        {TAMANOS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </label>
                <nav className="flex items-center gap-1" aria-label="Paginación">
                    <button className={`${boton} hover:bg-muted`} disabled={pagina <= 1} onClick={() => onPagina(pagina - 1)} aria-label="Página anterior">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    {paginasVisibles(pagina, totalPaginas).map((p, i) => p === '…'
                        ? <span key={`s${i}`} className="px-1">…</span>
                        : (
                            <button
                                key={p}
                                onClick={() => onPagina(p)}
                                aria-current={p === pagina ? 'page' : undefined}
                                className={`${boton} tabular-nums ${p === pagina ? 'bg-foreground font-semibold text-background' : 'hover:bg-muted'}`}
                            >
                                {p}
                            </button>
                        ))}
                    <button className={`${boton} hover:bg-muted`} disabled={pagina >= totalPaginas} onClick={() => onPagina(pagina + 1)} aria-label="Página siguiente">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </nav>
            </div>
        </div>
    )
}
