'use client'
import React from "react"
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Package, Check, X } from "lucide-react"
import { ISelectedProduct } from "@/app/types/order/product-interface"

interface ConfirmOrderDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedProducts: ISelectedProduct[]
    onConfirm: () => void
    isLoading: boolean
}

const getTipoLabel = (product: ISelectedProduct["product"]) => {
    if (!product || product.afecto_igv === 1 || product.afecto_igv === undefined) return "GRAVADO"
    if (product.tipo_afectacion_igv === "20") return "EXONERADO"
    if (product.tipo_afectacion_igv === "30") return "INAFECTO"
    return "GRAVADO"
}

const TipoBadge = ({ tipo }: { tipo: string }) => {
    if (tipo === "GRAVADO") {
        return <Badge className="bg-green-50 text-green-700 border-green-300 text-[10px]">GRAVADO</Badge>
    }
    if (tipo === "EXONERADO") {
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-300 text-[10px]">EXONERADO</Badge>
    }
    return <Badge className="bg-blue-50 text-blue-700 border-blue-300 text-[10px]">INAFECTO</Badge>
}

export default function ConfirmOrderDialog({
                                               open, onOpenChange, selectedProducts, onConfirm, isLoading
                                           }: ConfirmOrderDialogProps) {

    const tiposPresentes = [...new Set(selectedProducts.map(p => getTipoLabel(p.product)))]
    const hayMixto = tiposPresentes.length > 1

    const gravados   = selectedProducts.filter(p => getTipoLabel(p.product) === "GRAVADO")
    const noGravados = selectedProducts.filter(p => getTipoLabel(p.product) !== "GRAVADO")

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {hayMixto
                            ? <><AlertTriangle className="h-5 w-5 text-amber-500" /> Pedido con productos mixtos</>
                            : <><Check className="h-5 w-5 text-green-500" /> Confirmar Pedido</>
                        }
                    </DialogTitle>
                    <DialogDescription>
                        {hayMixto
                            ? "Este pedido contiene productos afectos e inafectos al IGV. Para cumplir con la normativa tributaria, el pedido se dividirá automáticamente en dos:"
                            : "Revisa el resumen antes de confirmar."
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {hayMixto ? (
                        <>
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-green-50 border-b border-green-200 px-3 py-2 flex items-center gap-2">
                                    <Package className="h-4 w-4 text-green-600" />
                                    <span className="font-semibold text-green-800 text-sm">
                                        Pedido 1 — Productos GRAVADOS
                                    </span>
                                    <Badge className="ml-auto bg-green-100 text-green-700 border-green-300">
                                        {gravados.length} ítem{gravados.length !== 1 ? 's' : ''}
                                    </Badge>
                                </div>
                                <ul className="divide-y divide-gray-100">
                                    {gravados.map((item, i) => (
                                        <li key={i} className="px-3 py-2 flex items-center justify-between gap-2">
                                            <div className="flex-1 min-w-0 space-y-0.5">
                                                <p className="text-sm font-medium text-gray-800 break-words leading-snug truncate">
                                                    {item.product.NombreItem}
                                                </p>
                                                <p className="text-xs text-gray-400">{item.product.Codigo_Art}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs font-medium text-gray-600">x{item.quantity}</p>
                                                <TipoBadge tipo="GRAVADO" />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-blue-50 border-b border-blue-200 px-3 py-2 flex items-center gap-2">
                                    <Package className="h-4 w-4 text-blue-600" />
                                    <span className="font-semibold text-blue-800 text-sm">
                                        Pedido 2 — Productos SIN IGV
                                    </span>
                                    <Badge className="ml-auto bg-blue-100 text-blue-700 border-blue-300">
                                        {noGravados.length} ítem{noGravados.length !== 1 ? 's' : ''}
                                    </Badge>
                                </div>
                                <ul className="divide-y divide-gray-100">
                                    {noGravados.map((item, i) => (
                                        <li key={i} className="px-3 py-2 flex items-center justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">
                                                    {item.product.NombreItem}
                                                </p>
                                                <p className="text-xs text-gray-400">{item.product.Codigo_Art}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs font-medium text-gray-600">x{item.quantity}</p>
                                                <TipoBadge tipo={getTipoLabel(item.product)} />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                                Se generarán 2 pedidos vinculados para el mismo cliente. Ambos se despacharán juntos.
                            </p>
                        </>
                    ) : (
                        /* Un solo tipo — lista simple */
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-50 border-b px-3 py-2 flex items-center gap-2">
                                <Package className="h-4 w-4 text-gray-600" />
                                <span className="font-semibold text-gray-700 text-sm">
                                    Productos del pedido
                                </span>
                                <TipoBadge tipo={tiposPresentes[0]} />
                                <Badge className="ml-auto bg-gray-100 text-gray-600 border-gray-300">
                                    {selectedProducts.length} ítem{selectedProducts.length !== 1 ? 's' : ''}
                                </Badge>
                            </div>
                            <ul className="divide-y divide-gray-100">
                                {selectedProducts.map((item, i) => (
                                    <li key={i} className="px-3 py-2 flex items-center justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">
                                                {item.product.NombreItem}
                                            </p>
                                            <p className="text-xs text-gray-400">{item.product.Codigo_Art}</p>
                                        </div>
                                        <p className="text-xs font-medium text-gray-600 shrink-0">x{item.quantity}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        className="gap-1"
                    >
                        <X className="h-4 w-4" /> Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700 gap-1"
                    >
                        <Check className="h-4 w-4" />
                        {isLoading
                            ? "Enviando..."
                            : hayMixto
                                ? "Confirmar y generar 2 pedidos"
                                : "Confirmar Pedido"
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}