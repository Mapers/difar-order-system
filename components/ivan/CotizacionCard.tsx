'use client'

import { Package, AlertTriangle, Gift } from 'lucide-react'

export interface LineaCotizacion {
    codigo: string
    producto: string
    cantidad: number
    precio_unitario: number
    precio_lista?: number
    escala_aplicada?: string
    subtotal: number
    lote?: string
    vence?: string
    aviso_stock?: string
    aviso?: string
    bonificaciones?: {
        compra: number
        lleva: number
        total_gratis: number
        producto: string
        descripcion?: string | null
    }[]
}

export interface Cotizacion {
    es_cotizacion: true
    almacen: number
    cliente?: { codigo: string; ruc: string; nombre: string }
    tipo_precio: string
    lineas: LineaCotizacion[]
    total: number
    problemas?: { producto: string; motivo: string; opciones?: string[] }[]
    afectacion_mixta?: string
}

const soles = (n: number) =>
    `S/ ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtFecha = (f?: string) => {
    if (!f) return ''
    const [a, m, d] = String(f).slice(0, 10).split('-')
    return a && m && d ? `${d}/${m}/${a}` : f
}

export function CotizacionCard({ cotizacion }: { cotizacion: Cotizacion }) {
    const c = cotizacion

    return (
        <div className="rounded-lg border border-border bg-background text-sm">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <Package className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Cotización
                </span>
            </div>

            <div className="space-y-1 px-3 py-2">
                {c.cliente && (
                    <>
                        <p className="font-semibold leading-tight">{c.cliente.nombre}</p>
                        <p className="text-xs text-muted-foreground">{c.cliente.ruc}</p>
                    </>
                )}
                <p className="text-xs text-muted-foreground">
                    Almacén {c.almacen} · precio {c.tipo_precio}
                </p>
            </div>

            <div className="divide-y divide-border border-t border-border">
                {c.lineas.map((l, i) => (
                    <div key={`${l.codigo}-${i}`} className="px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="font-medium leading-tight">{l.producto}</p>
                                <p className="text-xs text-muted-foreground">
                                    {l.cantidad} × {soles(l.precio_unitario)}
                                    {/* El precio de lista tachado solo aparece cuando una escala
                                        lo bajó: así se ve que el descuento se aplicó. */}
                                    {l.precio_lista !== undefined && (
                                        <> · <span className="line-through">{soles(l.precio_lista)}</span>
                                            {l.escala_aplicada && <> escala {l.escala_aplicada}</>}
                                        </>
                                    )}
                                </p>
                                {l.lote && (
                                    <p className="text-xs text-muted-foreground">
                                        lote {l.lote}{l.vence && <> · vence {fmtFecha(l.vence)}</>}
                                    </p>
                                )}
                                {l.bonificaciones?.map((b, j) => (
                                    <p key={j} className="mt-0.5 flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                                        <Gift className="h-3 w-3 shrink-0" />
                                        {b.total_gratis} gratis ({b.compra}+{b.lleva}, {b.producto})
                                    </p>
                                ))}
                                {(l.aviso_stock || l.aviso) && (
                                    <p className="mt-0.5 flex items-start gap-1 text-xs text-amber-700 dark:text-amber-400">
                                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                                        <span>{l.aviso_stock || l.aviso}</span>
                                    </p>
                                )}
                            </div>
                            <span className="shrink-0 font-semibold tabular-nums">{soles(l.subtotal)}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between border-t border-border px-3 py-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Total</span>
                <span className="text-base font-bold tabular-nums">{soles(c.total)}</span>
            </div>

            {c.afectacion_mixta && (
                <p className="border-t border-border px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                    {c.afectacion_mixta}
                </p>
            )}

            {c.problemas && c.problemas.length > 0 && (
                <div className="border-t border-border px-3 py-2">
                    <p className="text-xs font-semibold text-muted-foreground">No se pudieron cotizar:</p>
                    {c.problemas.map((p, i) => (
                        <p key={i} className="mt-0.5 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{p.producto}</span> — {p.motivo}
                            {p.opciones && <>: {p.opciones.join(' · ')}</>}
                        </p>
                    ))}
                </div>
            )}

            <p className="border-t border-border px-3 py-1.5 text-center text-xs text-muted-foreground">
                Cotización — no se ha creado ningún pedido
            </p>
        </div>
    )
}
