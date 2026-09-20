'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardList, User, Package, CreditCard } from 'lucide-react'
import { IClient, ICondicion, IMoneda } from '@/app/types/order/client-interface'
import { ISelectedProduct } from '@/app/types/order/product-interface'
import { calcularTotal, getCurrencySymbol } from '@/app/utils/order-helpers'

// Panel lateral fijo (solo desktop, columna derecha) con el estado actual
// del pedido — cliente, cantidad de productos y total — para no tener que
// scrollear hasta el widget de Producto solo para ver cuánto va el pedido.
// Aprovecha el espacio libre que queda en pantallas anchas al centrar la
// sección principal en max-w-4xl.
interface OrderSummarySidebarProps {
    selectedClient: IClient | null
    condition: ICondicion | null
    currency: IMoneda | null
    selectedProducts: ISelectedProduct[]
}

export default function OrderSummarySidebar({
    selectedClient, condition, currency, selectedProducts,
}: OrderSummarySidebarProps) {
    const sym = getCurrencySymbol(currency?.value)
    const total = calcularTotal(selectedProducts)

    return (
        <Card className="animate-pulse-glow shadow-md bg-background">
            <CardHeader className="border-b bg-muted py-4">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    Resumen del pedido
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 pt-4 text-sm">
                <div className="flex items-start gap-2">
                    <User className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="min-w-0">
                        <p className="text-xs uppercase font-semibold text-muted-foreground">Cliente</p>
                        {selectedClient ? (
                            <p className="font-medium text-foreground leading-snug line-clamp-2">{selectedClient.Nombre}</p>
                        ) : (
                            <p className="text-muted-foreground italic">Sin elegir</p>
                        )}
                    </div>
                </div>

                {condition && (
                    <div className="flex items-start gap-2">
                        <CreditCard className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                        <div className="min-w-0">
                            <p className="text-xs uppercase font-semibold text-muted-foreground">Condición</p>
                            <p className="font-medium text-foreground leading-snug line-clamp-2">{condition.Descripcion}</p>
                        </div>
                    </div>
                )}

                {selectedProducts.length > 0 && (
                    <div className="space-y-2 border-t border-border pt-3">
                        <p className="flex items-center gap-2 text-xs uppercase font-semibold text-muted-foreground">
                            <Package className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                            Productos ({selectedProducts.length})
                        </p>
                        <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                            {selectedProducts.map((item, i) => {
                                const pu = item.isBonification ? 0 : item.appliedScale?.precio_escala ?? item.finalPrice
                                const subtotal = pu * item.quantity
                                return (
                                    <li key={i} className="text-xs">
                                        <p className="text-foreground leading-snug">{item.product.NombreItem}</p>
                                        <div className="mt-0.5 flex items-center justify-between text-muted-foreground">
                                            <span>x{item.quantity}</span>
                                            <span className="font-medium text-foreground">{sym}{subtotal.toFixed(2)}</span>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                )}

                <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="font-medium text-foreground">Total</span>
                    <span className="text-lg font-bold text-foreground">{sym} {total.toFixed(2)}</span>
                </div>
            </CardContent>
        </Card>
    )
}
