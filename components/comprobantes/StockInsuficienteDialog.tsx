'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, PackageX } from "lucide-react"

export interface ProblemaStock {
    tipo: 'STOCK_INSUFICIENTE' | 'SIN_STOCK_EN_KARDEX' | string
    codigo: string
    nombre: string
    cant_pedido: number | string
    stock_disponible: number | string
    cant_faltante: number | string
    mensaje: string
}

export interface ResumenStock {
    total_productos?: number
    productos_ok?: number
    productos_stock_insuf?: number
    productos_sin_kardex?: number
    codigo_almacen?: number | null
}

interface StockInsuficienteDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mensaje: string
    resumen?: ResumenStock | null
    detalle: ProblemaStock[]
    nombreAlmacen?: string
}

const num = (v: number | string | undefined) => {
    const n = Number(v)
    return Number.isFinite(n) ? n.toLocaleString('es-PE', { maximumFractionDigits: 2 }) : '—'
}

export function StockInsuficienteDialog({
    open, onOpenChange, mensaje, resumen, detalle, nombreAlmacen,
}: StockInsuficienteDialogProps) {
    const orden = [...detalle].sort((a, b) => {
        if (a.tipo !== b.tipo) return a.tipo === 'SIN_STOCK_EN_KARDEX' ? -1 : 1
        return a.nombre.localeCompare(b.nombre)
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-700">
                        <PackageX className="h-5 w-5" /> No se emitió el comprobante
                    </DialogTitle>
                    <DialogDescription>
                        {mensaje}
                        {nombreAlmacen && <> Almacén: <span className="font-medium">{nombreAlmacen}</span>.</>}
                    </DialogDescription>
                </DialogHeader>

                {resumen && (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {[
                            { n: resumen.total_productos,       t: 'Productos' },
                            { n: resumen.productos_ok,          t: 'Con stock' },
                            { n: resumen.productos_stock_insuf, t: 'Sin suficiente' },
                            { n: resumen.productos_sin_kardex,  t: 'Sin kardex' },
                        ].map(c => (
                            <div key={c.t} className="rounded-md border border-border p-2 text-center">
                                <p className="text-lg font-bold tabular-nums">{c.n ?? '—'}</p>
                                <p className="text-[11px] text-muted-foreground">{c.t}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    <table className="hidden w-full text-sm sm:table">
                        <thead className="bg-muted sticky top-0">
                            <tr>
                                {['Producto', 'Necesita', 'Disponible', 'Faltan'].map((h, i) => (
                                    <th key={h} className={`px-3 py-2 text-xs font-medium uppercase text-muted-foreground ${i === 0 ? 'text-left' : 'text-right'}`}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {orden.map((p, i) => (
                                <tr key={`${p.codigo}-${i}`}>
                                    <td className="px-3 py-2">
                                        <div className="font-medium">{p.nombre}</div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            {p.codigo}
                                            {p.tipo === 'SIN_STOCK_EN_KARDEX' && (
                                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                                                    <AlertTriangle className="mr-1 h-3 w-3" /> Sin kardex
                                                </Badge>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-right tabular-nums">{num(p.cant_pedido)}</td>
                                    <td className="px-3 py-2 text-right tabular-nums">{num(p.stock_disponible)}</td>
                                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-red-600">
                                        {num(p.cant_faltante)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="space-y-2 sm:hidden">
                        {orden.map((p, i) => (
                            <div key={`${p.codigo}-${i}`} className="rounded-md border border-border p-3">
                                <p className="text-sm font-medium">{p.nombre}</p>
                                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                    {p.codigo}
                                    {p.tipo === 'SIN_STOCK_EN_KARDEX' && (
                                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                                            Sin kardex
                                        </Badge>
                                    )}
                                </div>
                                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                                    <div>
                                        <p className="font-semibold tabular-nums">{num(p.cant_pedido)}</p>
                                        <p className="text-muted-foreground">Necesita</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold tabular-nums">{num(p.stock_disponible)}</p>
                                        <p className="text-muted-foreground">Disponible</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold tabular-nums text-red-600">{num(p.cant_faltante)}</p>
                                        <p className="text-muted-foreground">Faltan</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {orden.length === 0 && (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            No se recibió el desglose por producto.
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
