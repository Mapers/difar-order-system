'use client'
import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog"
import { DialogTitle } from "@radix-ui/react-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, CheckSquare, Loader2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import {ProductoConLotes} from "@/app/types/order/order-interface";

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
                    <DialogDescription>Seleccione los lotes y cantidades para los productos</DialogDescription>
                </DialogHeader>

                {loadingLotes ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <div className="space-y-6 grid grid-cols-1 gap-4">
                        {editingLotes.map((producto, productIndex) => (
                            <Card key={productIndex}>
                                <CardHeader className="bg-gray-50 py-3">
                                    <CardTitle className="text-sm font-medium">
                                        {producto.prod_codigo} - {producto.prod_descripcion}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <Label htmlFor={`lote-${productIndex}`}>Seleccionar Lote</Label>
                                            <Select value={producto.loteSeleccionado} onValueChange={(value) => onLoteChange(productIndex, value)}>
                                                <SelectTrigger id={`lote-${productIndex}`}>
                                                    <SelectValue placeholder="Seleccione un lote" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {producto.lotes.map((lote, loteIndex) => {
                                                        const split = lote.value.split('|')
                                                        return (
                                                            <SelectItem key={loteIndex} value={lote.value}>
                                                                {split[0]} - Vence: {format(parseISO(split[1]), "dd/MM/yyyy")} - Stk: {split[2]}
                                                            </SelectItem>
                                                        )
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
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