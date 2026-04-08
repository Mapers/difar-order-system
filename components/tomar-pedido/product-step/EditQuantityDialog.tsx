'use client'
import React from "react"
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogHeader, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Minus, Plus } from "lucide-react"
import { ISelectedProduct } from "@/app/types/order/product-interface"

interface EditQuantityDialogProps {
    isOpen: boolean
    onClose: () => void
    selectedItem: ISelectedProduct | null
    editQuantity: number | ""
    setEditQuantity: (val: number | "") => void
    onSave: () => void
}

export default function EditQuantityDialog({
                                               isOpen, onClose, selectedItem, editQuantity, setEditQuantity, onSave
                                           }: EditQuantityDialogProps) {
    if (!selectedItem) return null;

    const maxStock = Number(selectedItem.product.Stock) || Infinity;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[95vw] sm:max-w-[425px] rounded-xl sm:rounded-lg p-4 sm:p-6">
                <DialogHeader className="text-left">
                    <DialogTitle>Editar Cantidad</DialogTitle>
                    <DialogDescription>
                        Modifica la cantidad del producto seleccionado.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2 sm:py-4">
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                                {selectedItem.product.NombreItem}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                                Stock disponible: <span className="font-medium text-gray-700">{maxStock.toFixed(0)}</span>
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-quantity">Nueva Cantidad</Label>
                            <div className={`flex items-center h-12 sm:h-11 rounded-lg border overflow-hidden transition-colors ${typeof editQuantity === 'number' && editQuantity >= maxStock ? 'bg-red-50/50 border-red-300' : 'bg-gray-50 border-gray-200'}`}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const currentVal = typeof editQuantity === 'number' ? editQuantity : 1;
                                        if (currentVal > 1) setEditQuantity(currentVal - 1);
                                    }}
                                    className="h-full px-4 sm:px-3 flex items-center justify-center transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-200 active:bg-gray-300"
                                >
                                    <Minus className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>

                                <input
                                    id="edit-quantity"
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={editQuantity}
                                    onChange={(e) => {
                                        const val = e.target.value
                                        if (val === "") setEditQuantity("")
                                        else {
                                            const num = parseInt(val, 10)
                                            if (!isNaN(num) && num > 0) setEditQuantity(Math.min(num, maxStock))
                                        }
                                    }}
                                    onBlur={() => { if (editQuantity === "" || editQuantity < 1) setEditQuantity(1) }}
                                    onKeyDown={(e) => { if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault() }}
                                    className="w-full bg-transparent outline-none text-center text-lg sm:text-base font-semibold text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />

                                <button
                                    type="button"
                                    disabled={typeof editQuantity === 'number' && editQuantity >= maxStock}
                                    onClick={() => {
                                        const currentVal = typeof editQuantity === 'number' ? editQuantity : 1;
                                        setEditQuantity(Math.min(currentVal + 1, maxStock))
                                    }}
                                    className="h-full px-4 sm:px-3 flex items-center justify-center transition-colors text-gray-500 hover:text-blue-600 hover:bg-blue-100 active:bg-blue-200 disabled:text-gray-300 disabled:bg-transparent"
                                >
                                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-2 sm:mt-0">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="w-full sm:w-auto order-1 sm:order-none"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={editQuantity === "" || editQuantity < 1}
                        className="w-full sm:w-auto"
                    >
                        Guardar Cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}