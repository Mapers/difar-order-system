'use client'
import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog"
import { DialogTitle } from "@radix-ui/react-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, TrendingUp, Gift } from "lucide-react"
import { IProduct } from "@/app/types/order/product-interface"

interface ProductDetailsModalProps {
    open: boolean
    onOpenChange: (v: boolean) => void
    viewingProduct: IProduct | null
    escalas: any[]
    bonificaciones: any[]
}

export default function ProductDetailsModal({
                                                open, onOpenChange, viewingProduct, escalas, bonificaciones
                                            }: ProductDetailsModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" /> Detalles de Promociones - {viewingProduct?.NombreItem}
                    </DialogTitle>
                    <DialogDescription>
                        Código: {viewingProduct?.Codigo_Art} | Precio Base: S/ {Number(viewingProduct?.PUContado).toFixed(2)}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="escalas" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="escalas" className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Escalas de Precio ({escalas.length})
                        </TabsTrigger>
                        <TabsTrigger value="bonificaciones" className="flex items-center gap-2">
                            <Gift className="h-4 w-4" /> Bonificaciones ({bonificaciones.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="escalas" className="space-y-4">
                        <Card>
                            <CardContent className="pt-4">
                                {escalas.length > 0 ? (
                                    <div className="border rounded-lg divide-y">
                                        {escalas.map((escala, index) => (
                                            <div key={escala.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-purple-100 p-2 rounded-md">
                                                            <TrendingUp className="h-4 w-4 text-purple-600" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-sm">
                                                                Escala {index + 1}: {escala.desde} - {escala.hasta} unidades
                                                            </div>
                                                            <div className="text-sm text-gray-600">
                                                                Precio especial: <span className="font-semibold text-green-600">S/ {escala.precio.toFixed(2)}</span> c/u
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                Comparado con precio base: <span className="font-medium">S/ {Number(viewingProduct?.PUContado).toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                                    {(((Number(viewingProduct?.PUContado) - escala.precio) / Number(viewingProduct?.PUContado)) * 100).toFixed(1)}% desc.
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                                        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                        <h4 className="font-medium text-gray-900 mb-1">No hay escalas configuradas</h4>
                                        <p className="text-sm text-gray-500">Este producto no tiene escalas de precio configuradas</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="bonificaciones" className="space-y-4">
                        <Card>
                            <CardContent className="pt-4">
                                {bonificaciones.length > 0 ? (
                                    <div className="border rounded-lg divide-y">
                                        {bonificaciones.map((bonificacion, index) => (
                                            <div key={bonificacion.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-yellow-100 p-2 rounded-md">
                                                            <Gift className="h-4 w-4 text-yellow-600" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-sm">
                                                                Promoción {index + 1}: Compra {bonificacion.compra} lleva {bonificacion.lleva} gratis
                                                            </div>
                                                            <div className="text-sm text-gray-600">{bonificacion.descripcion}</div>
                                                            {!bonificacion.esMismoProducto && bonificacion.descripcionProducto && (
                                                                <div className="text-xs text-blue-600 mt-1">
                                                                    Producto bonificado: {bonificacion.descripcionProducto}
                                                                </div>
                                                            )}
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                Tipo: {bonificacion.esMismoProducto ? 'Mismo producto' : 'Producto diferente'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                                    {(bonificacion.lleva / bonificacion.compra * 100).toFixed(0)}% bonif.
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                                        <Gift className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                        <h4 className="font-medium text-gray-900 mb-1">No hay bonificaciones</h4>
                                        <p className="text-sm text-gray-500">Este producto no tiene bonificaciones configuradas</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}