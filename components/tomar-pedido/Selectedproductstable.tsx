'use client'
import React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow, TableFooter } from "@/components/ui/table"
import { Trash, Package, Pencil } from "lucide-react"
import { ISelectedProduct } from "@/app/types/order/product-interface"
import { format, parseISO } from "date-fns"
import { ProductoConLotes } from "@/app/types/order/order-interface";
import {getCurrencySymbol, parseLoteString} from "@/app/utils/order-helpers";

interface SelectedProductsTableProps {
    selectedProducts: ISelectedProduct[]
    productosConLotes: ProductoConLotes[]
    currencyValue?: string
    onRemoveItem: (index: number) => void
    onChangeLote?: (items: ISelectedProduct[]) => void
    onEditClick?: (index: number) => void
    showActions?: boolean
}

export default function SelectedProductsTable({
                                                  selectedProducts, productosConLotes, currencyValue,
                                                  onRemoveItem, onChangeLote, onEditClick, showActions = true,
                                              }: SelectedProductsTableProps) {
    const sym = getCurrencySymbol(currencyValue)

    const total = selectedProducts.reduce((sum, item) => {
        const pu = item.isBonification ? 0 : item.appliedScale?.precio_escala ?? item.finalPrice
        return sum + pu * item.quantity
    }, 0)

    const renderBadges = (item: ISelectedProduct) => (
        <>
            {item.isBonification && <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Bonificado</Badge>}
            {item.appliedScale && <Badge variant="outline" className="bg-purple-50 text-purple-700">Escala {item.appliedScale.porcentaje_descuento}% desc.</Badge>}
            {(item.isEdit && Number(item.finalPrice || 0) > 0) && <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">Editado</Badge>}
            {(item.isEdit && item.finalPrice === 0) && <Badge variant="outline" className="bg-pink-100 text-pink-700 border-pink-300">REGALO</Badge>}
            {item.isAuthorize && <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">Por Autorizar</Badge>}
        </>
    )

    const renderPrice = (item: ISelectedProduct) => {
        const precioOriginal = item.finalPrice
        const precioEscala = item.appliedScale?.precio_escala
        return (
            <div className="flex flex-col items-end">
                <span className={item.appliedScale ? "line-through text-gray-400 text-xs" : ""}>
                    {sym}{Number(precioOriginal).toFixed(2)}
                </span>
                {item.appliedScale && (
                    <span className="text-purple-600 font-medium text-sm">{sym}{Number(precioEscala).toFixed(2)}</span>
                )}
                {item.isBonification && (
                    <span className="text-green-600 text-sm">{sym}0.00</span>
                )}
            </div>
        )
    }

    return (
        <>
            <div className="hidden sm:block border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Laboratorio</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lote - Fec.Venc</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                            {showActions && <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>}
                        </tr>
                        </thead>
                        <tbody>
                        {selectedProducts.map((item, index) => {
                            const pu = item.isBonification ? 0 : item.appliedScale?.precio_escala ?? item.finalPrice
                            const subtotal = pu * item.quantity
                            const { cod, fec, stk } = parseLoteString(
                                productosConLotes.find(x => x.prod_codigo === item.product.Codigo_Art)?.loteSeleccionado || '||'
                            )

                            let rowBgClass = index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            if (item.isAuthorize) rowBgClass = "bg-blue-50 border-l-4 border-l-blue-500"
                            else if (item.isEdit) rowBgClass = "bg-green-50 border-l-4 border-l-green-500"

                            return (
                                <tr key={index} className={rowBgClass}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        <div className="flex items-center flex-wrap gap-1">
                                            {renderBadges(item)}
                                            <span>{item.product.NombreItem}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-left">{item.product.Descripcion}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-left">
                                        {cod} - Vence: {fec.length > 0 && format(parseISO(fec), "dd/MM/yyyy")}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{stk}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right font-medium">{item.quantity}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{renderPrice(item)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                        {sym}{subtotal.toFixed(2)}
                                    </td>
                                    {showActions && (
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-center gap-1.5">
                                                {onEditClick && (
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => onEditClick(index)} className="h-8 w-8 p-0 text-amber-600 hover:text-amber-800 hover:bg-amber-50" title="Editar Cantidad">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {onChangeLote && (
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => onChangeLote([item])} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50" title="Cambiar Lote">
                                                        <Package className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveItem(index)} className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50" title="Eliminar">
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            )
                        })}
                        </tbody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={5}></TableCell>
                                <TableCell className="px-4 py-3 text-right text-sm font-medium text-gray-900">Total:</TableCell>
                                <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                    {sym}{total.toFixed(2)}
                                </TableCell>
                                {showActions && <TableCell></TableCell>}
                            </TableRow>
                        </TableFooter>
                    </table>
                </div>
            </div>

            <div className="block sm:hidden space-y-3">
                {selectedProducts.map((item, index) => {
                    const pu = item.isBonification ? 0 : item.appliedScale?.precio_escala ?? item.finalPrice
                    const subtotal = pu * item.quantity
                    const { cod, fec, stk } = parseLoteString(
                        productosConLotes.find(x => x.prod_codigo === item.product.Codigo_Art)?.loteSeleccionado || '||'
                    )

                    let cardBgClass = "bg-white"
                    let borderClass = ""
                    if (item.isAuthorize) { cardBgClass = "bg-blue-50"; borderClass = "border-l-4 border-l-blue-500" }
                    else if (item.isEdit) { cardBgClass = "bg-green-50"; borderClass = "border-l-4 border-l-green-500" }

                    return (
                        <Card key={index} className={`p-4 relative ${cardBgClass} ${borderClass}`}>
                            {showActions && (
                                <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/80 rounded-md backdrop-blur-sm p-1">
                                    {onEditClick && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500 hover:text-amber-700 hover:bg-amber-50" onClick={() => onEditClick(index)} type="button">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    )}
                                    {onChangeLote && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={() => onChangeLote([item])} type="button">
                                            <Package className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onRemoveItem(index)} type="button">
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                            <div className="space-y-3 pt-6 sm:pt-0">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0 pr-16">
                                        <div className="flex flex-wrap gap-1 mb-2">{renderBadges(item)}</div>
                                        <h4 className="font-medium text-sm line-clamp-2">{item.product.NombreItem}</h4>
                                        <p className="text-xs text-gray-500 mt-1">Cód: {item.product.Codigo_Art}</p>
                                        <p className="text-xs text-gray-500 line-clamp-1">{item.product.Descripcion}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm bg-gray-50/50 p-3 rounded-md border border-gray-100">
                                    <div className="col-span-2 sm:col-span-1">
                                        <Label className="text-[10px] uppercase text-gray-500 font-semibold">Lote - Vencimiento</Label>
                                        <p className="font-medium text-xs mt-0.5">{cod}</p>
                                        <p className="text-xs text-gray-600">{fec.length > 0 ? format(parseISO(fec), "dd/MM/yyyy") : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-[10px] uppercase text-gray-500 font-semibold">Stock</Label>
                                        <p className="font-medium text-xs mt-0.5">{stk}</p>
                                    </div>
                                    <div>
                                        <Label className="text-[10px] uppercase text-gray-500 font-semibold">Cantidad</Label>
                                        <p className="font-medium text-sm text-blue-700 mt-0.5">{item.quantity}</p>
                                    </div>
                                    <div>
                                        <Label className="text-[10px] uppercase text-gray-500 font-semibold">Precio Unit.</Label>
                                        <div className="mt-0.5">{renderPrice(item)}</div>
                                    </div>
                                    <div>
                                        <Label className="text-[10px] uppercase text-gray-500 font-semibold">Subtotal</Label>
                                        <p className="font-bold text-sm mt-0.5">{sym}{subtotal.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )
                })}

                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">Total Pedido:</span>
                        <span className="font-bold text-xl text-blue-700">{sym}{total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </>
    )
}