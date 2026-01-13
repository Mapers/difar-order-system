import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import {GuiaRemision} from "@/interface/order/order-interface";

interface ErrorModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    guia: GuiaRemision | null
}

export function ErrorModal({ open, onOpenChange, guia }: ErrorModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-5 w-5" /> Error en Envío a SUNAT
                    </DialogTitle>
                    <DialogDescription>
                        Detalles del error reportado por SUNAT para la guía {guia?.serie}-{guia?.numero}
                    </DialogDescription>
                </DialogHeader>

                {guia && (
                    <div className="space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="space-y-3">
                                {guia.sunat_description && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-red-900 mb-1">Descripción:</h4>
                                        <p className="text-sm text-red-800">{guia.sunat_description}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}