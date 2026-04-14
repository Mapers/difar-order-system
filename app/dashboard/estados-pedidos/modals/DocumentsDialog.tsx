'use client'
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { Pedido } from "@/app/dashboard/estados-pedidos/page"

interface DocumentsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    order: Pedido | null
    getStateInfo: (stateId: number, porAutorizar: string, isAutorizado: string) => any
}

export function DocumentsDialog({
                                    open, onOpenChange, order, getStateInfo
                                }: DocumentsDialogProps) {
    const stateInfo = order
        ? getStateInfo(order.estadodePedido, order.por_autorizar, order.is_autorizado)
        : null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Documentos del Pedido {order?.idPedidocab}
                    </DialogTitle>
                    <DialogDescription>
                        Cliente: {order?.nombreCliente} - Estado: {stateInfo?.name}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}