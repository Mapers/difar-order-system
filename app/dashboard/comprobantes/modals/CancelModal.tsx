import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { XCircle, AlertTriangle, Loader2 } from "lucide-react"
import {Comprobante, TipoComprobante} from "@/interface/order/order-interface";

interface CancelModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    comprobante: Comprobante | null
    tiposComprobante: TipoComprobante[]
    isCancelling: boolean
    onConfirm: () => void
}

export function CancelModal({ open, onOpenChange, comprobante, tiposComprobante, isCancelling, onConfirm }: CancelModalProps) {

    const getTipoDesc = (tipo: number) => {
        const t = tiposComprobante.find(tc => tc.idTipoComprobante === tipo)
        return t ? t.descripcion : "Desconocido"
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><XCircle className="h-5 w-5 text-red-600" /> Confirmar Anulación</DialogTitle>
                </DialogHeader>

                {comprobante && (
                    <div className="space-y-4">
                        <div className="bg-red-50 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Datos del Comprobante</h4>
                            <div className="text-sm space-y-1">
                                <p><strong>Tipo:</strong> {getTipoDesc(comprobante.tipo_comprobante)}</p>
                                <p><strong>Serie/Número:</strong> {comprobante.serie}-{comprobante.numero}</p>
                                <p><strong>Cliente:</strong> {comprobante.cliente_denominacion}</p>
                                <p><strong>Total:</strong> {comprobante.moneda === 1 ? 'S/ ' : '$ '} {Number(comprobante.total).toFixed(2)}</p>
                            </div>
                        </div>

                        {comprobante.tieneGuia === 0 && (
                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 flex gap-3 items-start">
                                <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-orange-800">Guía de Remisión Asociada</p>
                                    <p className="text-sm text-orange-700">Este comprobante tiene una Guía de Remisión vinculada. Tenga en cuenta que al anularlo, deberá revisar el estado de la guía.</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                            <p className="text-sm text-red-800">
                                <strong>¿Estás seguro de anular este comprobante?</strong><br />
                                Esta acción no se puede deshacer y generará una nota de crédito si es necesario.
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCancelling} className="w-full sm:w-auto">Cancelar</Button>
                    <Button onClick={onConfirm} disabled={isCancelling} variant="destructive" className="w-full sm:w-auto">
                        {isCancelling ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Anulando...</> : <><XCircle className="mr-2 h-4 w-4" /> Confirmar Anulación</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}