import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Receipt, Loader2, Truck, AlertTriangle, Check } from "lucide-react"
import { Pedido, TipoComprobante, SunatTransaccion, TipoDocSunat, GuiaReferencia } from "@/interface/order/order-interface"
import { GuidesSelectorModal } from "./GuidesSelectorModal"
import { Badge } from "@/components/ui/badge"

interface InvoiceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedOrder: Pedido | null
    tiposComprobante: TipoComprobante[]
    sunatTransacciones: SunatTransaccion[]
    tipoDocsSunat: TipoDocSunat[]
    invoiceType: string
    setInvoiceType: (v: string) => void
    sunatTransaction: string
    setSunatTransaction: (v: string) => void
    tipoSunat: string
    setTipoSunat: (v: string) => void
    isProcessing: boolean
    onConfirm: (guiasSeleccionadas: GuiaReferencia[]) => void
}

export function InvoiceModal({
                                 open, onOpenChange, selectedOrder, tiposComprobante, sunatTransacciones, tipoDocsSunat,
                                 invoiceType, setInvoiceType, sunatTransaction, setSunatTransaction, tipoSunat, setTipoSunat,
                                 isProcessing, onConfirm
                             }: InvoiceModalProps) {
    const [showGuidesModal, setShowGuidesModal] = useState(false)
    const [selectedGuides, setSelectedGuides] = useState<GuiaReferencia[]>([])

    useEffect(() => {
        if (!open) {
            setSelectedGuides([])
        }
    }, [open, selectedOrder])

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" /> Confirmar Facturación</DialogTitle>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">Datos del Pedido</h4>
                                <div className="text-sm space-y-1">
                                    <p><strong>Pedido:</strong> {selectedOrder.nroPedido}</p>
                                    <p><strong>Cliente:</strong> {selectedOrder.nombreCliente}</p>
                                    <p><strong>Documento:</strong> {selectedOrder.codigoCliente}</p>
                                    <p><strong>Total:</strong> {selectedOrder.monedaPedido === 'PEN' ? 'S/ ' : '$ '} {Number(selectedOrder.totalPedido).toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="tipoComprobante" className="text-sm font-medium mb-2 block">Tipo de Comprobante</Label>
                                    <Select value={invoiceType} onValueChange={setInvoiceType} disabled={isProcessing}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar tipo"/></SelectTrigger>
                                        <SelectContent>
                                            {tiposComprobante.map((tipo) => (
                                                <SelectItem key={tipo.idTipoComprobante} value={tipo.idTipoComprobante.toString()}>{tipo.prefijoSerie} - {tipo.descripcion}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="sunatTransaccion" className="text-sm font-medium mb-2 block">Transacción SUNAT</Label>
                                    <Select value={sunatTransaction} onValueChange={setSunatTransaction} disabled={isProcessing}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar transacción"/></SelectTrigger>
                                        <SelectContent>
                                            {sunatTransacciones.map((trans) => (
                                                <SelectItem key={trans.idTransaction} value={trans.idTransaction.toString()}>{trans.descripcion}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="tipoDocSunat" className="text-sm font-medium mb-2 block">Tipo Doc.</Label>
                                    <Select value={tipoSunat} onValueChange={setTipoSunat} disabled={isProcessing}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar tipo documento"/></SelectTrigger>
                                        <SelectContent>
                                            {tipoDocsSunat.map((trans) => (
                                                <SelectItem key={trans.codigo} value={trans.codigo}>{trans.descripcion}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label className="text-sm font-medium mb-2 block">Referencias (Guías)</Label>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowGuidesModal(true)}
                                        disabled={isProcessing}
                                        className="flex items-center gap-2 border-dashed border-gray-400"
                                    >
                                        <Truck className="h-4 w-4" />
                                        {selectedGuides.length > 0 ? 'Modificar Guías' : 'Seleccionar Guías'}
                                    </Button>
                                    {selectedGuides.length > 0 ? (
                                        <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                                            <Check className="h-3 w-3 mr-1" /> {selectedGuides.length} Seleccionada(s)
                                        </Badge>
                                    ) : (
                                        <span className="text-xs text-amber-600 flex items-center">
                           <AlertTriangle className="h-3 w-3 mr-1" /> No se han seleccionado guías (Opcional)
                        </span>
                                    )}
                                </div>
                                {selectedGuides.length > 0 && (
                                    <div className="mt-2 text-xs text-gray-500">
                                        Series: {selectedGuides.map(g => `${g.serie}-${g.numero}`).join(', ')}
                                    </div>
                                )}
                            </div>

                            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                <p className="text-sm text-yellow-800">
                                    <strong>¿Confirmas la facturación?</strong><br/>
                                    Se generará el comprobante electrónico para este pedido. Esta acción no se puede deshacer.
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing} className="w-full sm:w-auto">Cancelar</Button>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                                onClick={() => onConfirm(selectedGuides)}
                                disabled={isProcessing || !invoiceType || !sunatTransaction}
                                className="bg-green-600 hover:bg-green-700 flex-1"
                            >
                                {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</> : <><Receipt className="mr-2 h-4 w-4" /> Confirmar Facturación</>}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {selectedOrder && (
                <GuidesSelectorModal
                    open={showGuidesModal}
                    onOpenChange={setShowGuidesModal}
                    nroPedido={selectedOrder.nroPedido}
                    selectedGuides={selectedGuides}
                    onConfirmSelection={setSelectedGuides}
                />
            )}
        </>
    )
}