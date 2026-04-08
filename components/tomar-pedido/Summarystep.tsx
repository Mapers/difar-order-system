'use client'
import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    User,
    Phone,
    MapPin,
    Calendar,
    CreditCard,
    DollarSign,
    Coins,
    Package,
    FileText,
    ArrowLeft,
    Check,
    Save
} from "lucide-react"
import { IClient, ICondicion, IMoneda } from "@/app/types/order/client-interface"
import { ISelectedProduct } from "@/app/types/order/product-interface"
import {ProductoConLotes} from "@/app/types/order/order-interface";
import SelectedProductsTable from "@/components/tomar-pedido/Selectedproductstable";
import {calcularTotal, getCurrencySymbol} from "@/app/utils/order-helpers";

interface SummaryStepProps {
    selectedClient: IClient | null
    contactoPedido: string
    nameZone: string
    condition: ICondicion | null
    currency: IMoneda | null
    selectedProducts: ISelectedProduct[]
    productosConLotes: ProductoConLotes[]
    note: string
    onNoteChange: (val: string) => void
    onRemoveItem: (index: number) => void
    onPrev: () => void
    isLoadingSave: boolean
    handleSaveDraft: () => void
}

export default function SummaryStep({
                                        selectedClient, contactoPedido, nameZone, condition, currency,
                                        selectedProducts, productosConLotes, note, onNoteChange,
                                        onRemoveItem, onPrev, isLoadingSave, handleSaveDraft
                                    }: SummaryStepProps) {
    const sym = getCurrencySymbol(currency?.value)

    return (
        <Card className="shadow-md bg-white">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50 dark:border-gray-800">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-100 dark:bg-green-900/40 rounded-md">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-blue-700 dark:text-blue-400">Resumen del Pedido</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Información del Cliente</h3>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-xs text-gray-500">Cliente</Label>
                                        <p className="font-medium text-sm sm:text-base">{selectedClient?.Nombre}</p>
                                        <p className="text-xs text-gray-500">Documento: doc nro</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Phone className="w-4 h-4 text-blue-600 mt-0.5" />
                                        <div>
                                            <Label className="text-xs text-gray-500">Teléfono</Label>
                                            <p className="text-sm">{selectedClient?.telefono ?? '+52 ---------'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <User className="w-4 h-4 text-blue-600 mt-0.5" />
                                        <div>
                                            <Label className="text-xs text-gray-500">Contacto para el Pedido</Label>
                                            <p className="text-sm">{contactoPedido ?? '-----'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                                        <div>
                                            <Label className="text-xs text-gray-500">Dirección de Entrega</Label>
                                            <p className="text-sm">{selectedClient?.Dirección ?? 'Direccion entrega ----'}</p>
                                            {selectedClient?.referenciaDireccion && (
                                                <p className="text-xs text-gray-600 mt-1">Ref: {selectedClient.referenciaDireccion}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-purple-600 mt-0.5" />
                                        <div>
                                            <Label className="text-xs text-gray-500">Zona</Label>
                                            <p className="text-sm">{nameZone}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Condiciones de Pago</h3>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-start gap-2">
                                    <Calendar className="w-4 h-4 text-green-600 mt-0.5" />
                                    <div>
                                        <Label className="text-xs text-gray-500">Condición</Label>
                                        <p className="font-medium text-sm">{condition?.Descripcion}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    {currency?.value === "PEN" ? <Coins className="w-4 h-4 text-green-600 mt-0.5" /> : <DollarSign className="w-4 h-4 text-green-600 mt-0.5" />}
                                    <div>
                                        <Label className="text-xs text-gray-500">Moneda</Label>
                                        <p className="font-medium text-sm">{currency?.label}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Productos Seleccionados</h3>
                    </div>
                    <SelectedProductsTable
                        selectedProducts={selectedProducts}
                        productosConLotes={productosConLotes}
                        currencyValue={currency?.value}
                        onRemoveItem={onRemoveItem}
                        showActions={true}
                    />
                </div>

                <div className="rounded-lg bg-blue-50 p-4 flex justify-between items-center">
                    <div className="text-lg font-medium text-blue-900">Total del Pedido:</div>
                    <div className="text-xl font-bold text-blue-900">
                        {sym} {calcularTotal(selectedProducts).toFixed(2)}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Observaciones</h3>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200">
                        <Textarea
                            placeholder="Escribe aquí cualquier observación adicional para el pedido..."
                            className="min-h-[100px] resize-none border-0 focus-visible:ring-0"
                            value={note}
                            onChange={(e) => onNoteChange(e.target.value)}
                        />
                        <div className="border-t px-3 py-2 bg-gray-50 text-xs text-gray-500">
                            Esta información será incluida en el pedido.
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-gray-50 py-4">
                <div className="flex justify-start gap-2">
                    <Button type="button" variant="outline" onClick={onPrev}><ArrowLeft className="mr-2 h-4 w-4" />Anterior</Button>
                    <Button
                        type="button"
                        onClick={handleSaveDraft}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-medium"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Borrador
                    </Button>
                </div>
                <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isLoadingSave}>
                    <Check className="mr-2 h-4 w-4" />Confirmar Pedido
                </Button>
            </CardFooter>
        </Card>
    )
}