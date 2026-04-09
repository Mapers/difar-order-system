import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2, Loader2, FileX, PackageX } from "lucide-react"
import { Pedido } from "@/app/types/order/order-interface"

interface DeletePendienteModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    pedido: Pedido | null
    isDeleting: boolean
    onConfirm: () => void
}

export function DeletePendienteModal({ open, onOpenChange, pedido, isDeleting, onConfirm }: DeletePendienteModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-700">
                        <Trash2 className="h-5 w-5" />
                        Eliminar Pedido
                    </DialogTitle>
                    <DialogDescription>
                        Esta acción es irreversible. Lee con atención antes de continuar.
                    </DialogDescription>
                </DialogHeader>

                {pedido && (
                    <div className="flex flex-col space-y-4">

                        {/* Alerta principal */}
                        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                            <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-red-800">
                                    Se eliminará permanentemente el pedido <span className="underline">#{pedido.nroPedido}</span>
                                </p>
                                <p className="text-xs text-red-700 mt-1">
                                    Cliente: <strong>{pedido.nombreCliente}</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting
                            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Eliminando...</>
                            : <><Trash2 className="h-4 w-4 mr-2" /> Sí, eliminar todo</>
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}