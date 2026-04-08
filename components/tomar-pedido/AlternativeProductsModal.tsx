import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Package, ArrowRight } from "lucide-react"
import { IProduct } from "@/app/types/order/product-interface"

interface AlternativeProductsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    originalProduct: IProduct | null
    alternatives: IProduct[]
    currency: { value: string; label: string } | null
    onSelectAlternative: (product: IProduct) => void
    onProceedWithOriginal: (product: IProduct) => void
}

export default function AlternativeProductsModal({
                                                     open,
                                                     onOpenChange,
                                                     originalProduct,
                                                     alternatives,
                                                     currency,
                                                     onSelectAlternative,
                                                     onProceedWithOriginal
                                                 }: AlternativeProductsModalProps) {
    if (!originalProduct) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <AlertCircle className="h-5 w-5" />
                        Producto sin stock
                    </DialogTitle>
                    <DialogDescription className="text-gray-700 mt-2">
                        El producto <strong>{originalProduct.NombreItem}</strong> (Código: {originalProduct.Codigo_Art}) no tiene stock en este momento.
                        {originalProduct.principioActivo && (
                            <span> Su principio activo es <strong className="text-blue-600">{originalProduct.principioActivo}</strong>.</span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-4">
                    <h4 className="font-semibold text-gray-900">
                        {alternatives.length > 0
                            ? "Alternativas disponibles con el mismo Principio Activo:"
                            : "No se encontraron alternativas con stock para este principio activo."}
                    </h4>

                    {alternatives.length > 0 && (
                        <div className="border rounded-md overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead>Laboratorio</TableHead>
                                        <TableHead className="text-right">Stock</TableHead>
                                        <TableHead className="text-right">P. Contado</TableHead>
                                        <TableHead className="text-right">Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {alternatives.map((alt) => (
                                        <TableRow key={alt.Codigo_Art}>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{alt.NombreItem}</span>
                                                    <span className="text-xs text-gray-500">{alt.Codigo_Art} | {alt.presentacion}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">{alt.Descripcion}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                                    {Number(alt.Stock).toFixed(2)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">
                                                {currency?.value === "PEN" ? "S/." : "$"} {Number(alt.PUContado).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    onClick={() => onSelectAlternative(alt)}
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                >
                                                    Elegir
                                                    <ArrowRight className="ml-2 h-3 w-3" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-6 flex sm:justify-end">
                    {/*<Button*/}
                    {/*    variant="outline"*/}
                    {/*    onClick={() => onProceedWithOriginal(originalProduct)}*/}
                    {/*    className="text-gray-500"*/}
                    {/*>*/}
                    {/*    Continuar sin stock (Backorder)*/}
                    {/*</Button>*/}
                    <Button variant="default" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}