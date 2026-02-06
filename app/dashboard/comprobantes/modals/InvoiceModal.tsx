import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Receipt, Loader2, Truck, AlertTriangle, Check, FileText, CreditCard, Calendar } from "lucide-react"
import { Pedido, SunatTransaccion, TipoDocSunat, GuiaReferencia } from "@/interface/order/order-interface"
import { GuidesSelectorModal } from "./GuidesSelectorModal"
import { Badge } from "@/components/ui/badge"
import { Sequential } from "@/app/dashboard/configuraciones/page"
import { InstallmentModal, Cuota } from "./InstallmentModal"
import {ContactConfirmModal} from "@/app/dashboard/comprobantes/modals/ContactConfirmModal";

interface InvoiceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedOrder: Pedido | null
    tiposComprobante: Sequential[]
    sunatTransacciones: SunatTransaccion[]
    tipoDocsSunat: TipoDocSunat[]
    invoiceType: string
    setInvoiceType: (v: string) => void
    sunatTransaction: string
    setSunatTransaction: (v: string) => void
    tipoSunat: string
    setTipoSunat: (v: string) => void
    isProcessing: boolean
    onConfirm: (guiasSeleccionadas: GuiaReferencia[], cuotas: Cuota[], email: string, phone: string) => void
}

export function InvoiceModal({
                                 open, onOpenChange, selectedOrder, tiposComprobante, sunatTransacciones, tipoDocsSunat,
                                 invoiceType, setInvoiceType, sunatTransaction, setSunatTransaction, tipoSunat, setTipoSunat,
                                 isProcessing, onConfirm
                             }: InvoiceModalProps) {
    const [showGuidesModal, setShowGuidesModal] = useState(false)
    const [selectedGuides, setSelectedGuides] = useState<GuiaReferencia[]>([])
    const [showContactModal, setShowContactModal] = useState(false)
    const [showInstallmentModal, setShowInstallmentModal] = useState(false)
    const [cuotas, setCuotas] = useState<Cuota[]>([])

    const isCredit = selectedOrder?.condicionCredito === '1'

    useEffect(() => {
        if (!open) {
            setSelectedGuides([])
            setCuotas([])
        } else if (selectedOrder && selectedOrder.condicionCredito === '1') {
            setCuotas([{
                fecha: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
                monto: Number(selectedOrder.totalPedido)
            }])
        }
    }, [open, selectedOrder])

    const handleInitialConfirm = () => {
        setShowContactModal(true)
    }

    const handleFinalConfirm = (email: string, phone: string) => {
        onConfirm(selectedGuides, isCredit ? cuotas : [], email, phone)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
                                    <div className="flex justify-between items-center">
                                        <p><strong>Total:</strong> {selectedOrder.monedaPedido === 'PEN' ? 'S/ ' : '$ '} {Number(selectedOrder.totalPedido).toFixed(2)}</p>
                                        {isCredit && <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">Venta al Crédito</Badge>}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">Tipo de Comprobante</Label>
                                    <Select value={invoiceType} onValueChange={setInvoiceType} disabled={isProcessing}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar tipo"/></SelectTrigger>
                                        <SelectContent>
                                            {tiposComprobante.filter((s: Sequential) => s.tipo !== '8' && s.tipo !== '7').map((tipo) => (
                                                <SelectItem key={tipo.prefijo} value={tipo.prefijo + '|' + tipo.tipo}>{tipo.prefijo} - {tipo.nombre}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">Transacción SUNAT</Label>
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
                                    <Label className="text-sm font-medium mb-2 block">Tipo Doc.</Label>
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

                            {isCredit && (
                                <div className="border rounded-md p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-sm font-medium flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" /> Cuotas de Crédito
                                        </Label>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setShowInstallmentModal(true)}
                                            className="h-7 text-xs border-purple-300"
                                        >
                                            Configurar
                                        </Button>
                                    </div>

                                    {cuotas.length > 0 ? (
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Badge className="">{cuotas.length} Cuota(s)</Badge>
                                                <span className="text-xs text-gray-500">
                                                    Último vencimiento: {cuotas[cuotas.length-1].fecha}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 max-h-[60px] overflow-y-auto">
                                                {cuotas.map((c, i) => (
                                                    <div key={i} className="flex justify-between w-[90%]">
                                                        <span>Cuota {i+1} ({c.fecha}):</span>
                                                        <span className="font-medium">{c.monto.toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-red-500 flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" /> Debe configurar las cuotas
                                        </div>
                                    )}
                                </div>
                            )}

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
                                    {selectedGuides.length > 0 && (
                                        <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                                            <Check className="h-3 w-3 mr-1" /> {selectedGuides.length} Seleccionada(s)
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {selectedOrder.observaciones && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                                        <FileText className="h-4 w-4" /> Observaciones
                                    </Label>
                                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-gray-600 italic">
                                        {selectedOrder.observaciones}
                                    </div>
                                </div>
                            )}

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
                                onClick={handleInitialConfirm}
                                disabled={isProcessing || !invoiceType || !sunatTransaction || (isCredit && cuotas.length === 0)}
                                className="bg-green-600 hover:bg-green-700 flex-1"
                            >
                                {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</> : <><Receipt className="mr-2 h-4 w-4" /> Confirmar Facturación</>}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {selectedOrder && (
                <>
                    <GuidesSelectorModal
                        open={showGuidesModal}
                        onOpenChange={setShowGuidesModal}
                        nroPedido={selectedOrder.nroPedido}
                        selectedGuides={selectedGuides}
                        onConfirmSelection={setSelectedGuides}
                    />

                    <InstallmentModal
                        open={showInstallmentModal}
                        onOpenChange={setShowInstallmentModal}
                        totalImporte={Number(selectedOrder.totalPedido)}
                        initialCuotas={cuotas}
                        onSave={setCuotas}
                    />
                </>
            )}

            {selectedOrder && (
                <ContactConfirmModal
                    open={showContactModal}
                    onOpenChange={setShowContactModal}
                    initialEmail={selectedOrder.email || ""}
                    initialPhone={selectedOrder.telefono || ""}
                    onConfirm={handleFinalConfirm}
                    isProcessing={isProcessing}
                />
            )}
        </>
    )
}