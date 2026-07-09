'use client'
import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog"
import { DialogTitle } from "@radix-ui/react-dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Package, CheckSquare, Loader2, CalendarDays, Boxes } from "lucide-react"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { ProductoConLotes } from "@/app/types/order/order-interface"

interface LotesModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingLotes: ProductoConLotes[]
    loadingLotes: boolean
    onLoteChange: (productIndex: number, value: string) => void
    onConfirm: () => void
}

export default function LotesModal({ open, onOpenChange, editingLotes, loadingLotes, onLoteChange, onConfirm }: LotesModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" /> Seleccionar Lotes
                    </DialogTitle>
                    {editingLotes.length <= 0 ? (
                        <DialogDescription>No hay lotes disponibles o ya fueron seleccionados todos</DialogDescription>
                    ) : (
                        <DialogDescription>Seleccione un lote para cada producto</DialogDescription>
                    )}
                </DialogHeader>

                {loadingLotes ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {editingLotes.map((producto, productIndex) => {
                            const split = (lote: { value: string }) => lote.value.split('|')
                            return (
                                <Card key={productIndex}>
                                    <CardHeader className="bg-muted py-3">
                                        <CardTitle className="text-sm font-medium">
                                            {producto.prod_codigo} — {producto.prod_descripcion}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <RadioGroup
                                            value={producto.loteSeleccionado}
                                            onValueChange={(value) => onLoteChange(productIndex, value)}
                                            className="gap-2"
                                        >
                                            {producto.lotes.map((lote, loteIndex) => {
                                                const [codigo, fechaISO, stock] = split(lote)
                                                const isSelected = producto.loteSeleccionado === lote.value
                                                return (
                                                    <Label
                                                        key={loteIndex}
                                                        htmlFor={`lote-${productIndex}-${loteIndex}`}
                                                        className={cn(
                                                            "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                                                            isSelected
                                                                ? "border-blue-500 bg-blue-50"
                                                                : "border-border hover:bg-muted"
                                                        )}
                                                    >
                                                        <RadioGroupItem
                                                            id={`lote-${productIndex}-${loteIndex}`}
                                                            value={lote.value}
                                                            className="shrink-0"
                                                        />
                                                        <div className="flex flex-1 flex-wrap gap-x-4 gap-y-1 text-sm">
                                                            <span className={cn("font-semibold", isSelected ? "text-blue-700" : "text-foreground")}>
                                                                {codigo}
                                                            </span>
                                                            <span className={cn("flex items-center gap-1", isSelected ? "text-blue-700" : "text-muted-foreground")}>
                                                                <CalendarDays className="h-3.5 w-3.5" />
                                                                Vence: {format(parseISO(fechaISO), "dd/MM/yyyy")}
                                                            </span>
                                                            <span className={cn("flex items-center gap-1", isSelected ? "text-blue-700" : "text-muted-foreground")}>
                                                                <Boxes className="h-3.5 w-3.5" />
                                                                Stock: {stock}
                                                            </span>
                                                        </div>
                                                    </Label>
                                                )
                                            })}
                                        </RadioGroup>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}

                <DialogFooter>
                    <Button onClick={onConfirm} disabled={loadingLotes || editingLotes.length === 0}>
                        <CheckSquare className="mr-2 h-4 w-4" /> Confirmar Lotes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
