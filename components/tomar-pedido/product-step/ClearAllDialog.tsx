'use client'
import React from "react"
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogHeader, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash } from "lucide-react"

interface ClearAllDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
}

export default function ClearAllDialog({ isOpen, onClose, onConfirm }: ClearAllDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-red-600 flex items-center">
                        <Trash className="h-5 w-5 mr-2" />
                        Limpiar Pedido
                    </DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro que deseas eliminar todos los productos seleccionados? Esta acción no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="button" variant="destructive" onClick={onConfirm}>Sí, limpiar todo</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}