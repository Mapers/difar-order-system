'use client'
import React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog"
import { DialogTitle } from "@radix-ui/react-dialog"
import { Info } from "lucide-react"

interface ClientDataConfirmModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSaveOrder: () => void
    onSaveOrderAndUpdateClient: () => void
}

export default function ClientDataConfirmModal({ open, onOpenChange, onSaveOrder, onSaveOrderAndUpdateClient }: ClientDataConfirmModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-blue-600" /> Confirmar Actualización de Datos
                    </DialogTitle>
                    <DialogDescription>Se detectaron cambios en los datos del cliente</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-800 font-medium mb-2">
                            ¿Desea guardar estos cambios permanentemente para futuras ventas?
                        </p>
                        <p className="text-xs text-blue-700">
                            Los nuevos datos del cliente se asociarán a su código y se utilizarán en próximos pedidos.
                        </p>
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onSaveOrder} className="flex-1">Confirmar Pedido</Button>
                    <Button onClick={onSaveOrderAndUpdateClient} className="flex-1 bg-blue-600 hover:bg-blue-700">
                        Guardar Datos y Confirmar Pedido
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}