'use client'
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { Pedido } from "@/app/dashboard/estados-pedidos/page"

interface DeleteOrderDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    order: Pedido | null
    loading: boolean
    onConfirm: () => void
}

export function DeleteOrderDialog({
                                      open, onOpenChange, order, loading, onConfirm
                                  }: DeleteOrderDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <Trash2 className="h-5 w-5" /> Eliminar Pedido
                    </DialogTitle>
                    <DialogDescription>
                        Esta acción no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2">
                    <p className="text-sm text-gray-700">
                        ¿Estás seguro que deseas eliminar el pedido{" "}
                        <span className="font-semibold">{order?.nroPedido}</span>?
                    </p>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? "Eliminando..." : "Sí, eliminar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}