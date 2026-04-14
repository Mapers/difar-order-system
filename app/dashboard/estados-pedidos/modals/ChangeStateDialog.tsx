'use client'
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { FileText, Download, OctagonAlert, Link2 } from "lucide-react"
import { Pedido, PedidoDet } from "@/app/dashboard/estados-pedidos/page"

interface ChangeStateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedOrder: Pedido | null
    pedidoHermano: Pedido | null
    detalle: PedidoDet[]
    loading: boolean
    pdfUrl: string
    getNextState: (state: number) => number
    getStateInfo: (stateId: number, porAutorizar: string, isAutorizado: string) => any
    onConfirm: () => void
    onCancel: () => void
    onDownload: () => void
}

export function ChangeStateDialog({
                                      open, onOpenChange, selectedOrder, pedidoHermano,
                                      detalle, loading, pdfUrl, getNextState, getStateInfo,
                                      onConfirm, onCancel, onDownload
                                  }: ChangeStateDialogProps) {
    if (!selectedOrder) return null

    const currentStateInfo = getStateInfo(
        selectedOrder.estadodePedido,
        selectedOrder.por_autorizar,
        selectedOrder.is_autorizado
    )
    const nextStateInfo = getStateInfo(
        getNextState(selectedOrder.estadodePedido),
        selectedOrder.por_autorizar,
        selectedOrder.is_autorizado
    )
    const hermanoNextStateInfo = pedidoHermano
        ? getStateInfo(
            getNextState(pedidoHermano.estadodePedido),
            pedidoHermano.por_autorizar,
            pedidoHermano.is_autorizado
        )
        : null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Cambiar Estado del Pedido</DialogTitle>
                    <DialogDescription>
                        Pedido: {selectedOrder.nroPedido} - {selectedOrder.nombreCliente}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label>Estado Actual</Label>
                        <div className="mt-1">
                            <Badge className={currentStateInfo?.color}>
                                {currentStateInfo?.name}
                            </Badge>
                        </div>
                    </div>

                    <div>
                        <Label>Nuevo Estado</Label>
                        <div className="mt-2 p-3 border rounded-md bg-gray-50">
                            <div className="flex items-center gap-2">
                                <Badge className={nextStateInfo?.color}>
                                    {nextStateInfo?.name}
                                </Badge>
                                <span className="text-sm text-gray-600">(Siguiente estado)</span>
                            </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">{nextStateInfo?.description}</p>
                    </div>

                    {pedidoHermano && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex gap-3 items-start">
                            <Link2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-800">
                                <span className="font-semibold block mb-1">Pedido vinculado detectado</span>
                                El pedido <b>#{pedidoHermano.nroPedido}</b>{' '}
                                ({pedidoHermano.tipo_afectacion || 'GRAVADO'}) también cambiará
                                a <b>{hermanoNextStateInfo?.name}</b> automáticamente.
                            </div>
                        </div>
                    )}

                    {selectedOrder.continue === 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex gap-3 items-start">
                            <OctagonAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-800">
                                <span className="font-semibold block mb-1">Acción requerida</span>
                                El pedido no tiene su comprobante generado o enlazado.
                                Por favor, genere el comprobante y <b>refresque la página</b>.
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onCancel} disabled={loading}>
                        Cancelar
                    </Button>

                    {detalle.length > 0 && [1, 2, 4].includes(selectedOrder.estadodePedido) && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline"
                                        className="text-red-600 hover:text-red-700 bg-transparent text-xs">
                                    <FileText className="h-3 w-3 mr-1" /> Ver PDF
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="min-w-[90vw] h-[95vh] p-0 overflow-hidden">
                                <DialogHeader className="px-4 py-3 border-b w-full absolute bg-white">
                                    <div className="flex items-center justify-between">
                                        <DialogTitle>
                                            PDF — {String(selectedOrder.nroPedido).padStart(10, '0')}
                                        </DialogTitle>
                                        <Button size="sm" onClick={onDownload}>
                                            <Download className="w-4 h-4 mr-2" /> Descargar
                                        </Button>
                                    </div>
                                </DialogHeader>
                                <div className="w-full h-full mt-16">
                                    {pdfUrl
                                        ? <iframe title="Recibo PDF" src={pdfUrl} className="w-full h-full" />
                                        : <div className="p-6">Generando PDF…</div>
                                    }
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}

                    <Button
                        onClick={onConfirm}
                        disabled={loading || selectedOrder.continue === 0}
                    >
                        {loading
                            ? 'Procesando...'
                            : pedidoHermano
                                ? 'Confirmar (2 pedidos)'
                                : 'Confirmar Cambio'
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}