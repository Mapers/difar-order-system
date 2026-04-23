'use client'

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Receipt, Loader2, Truck, AlertTriangle, Check, FileText, CreditCard, Package } from "lucide-react"
import { Pedido, SunatTransaccion, TipoDocSunat, GuiaReferencia } from "@/app/types/order/order-interface"
import { GuidesSelectorModal } from "./GuidesSelectorModal"
import { Badge } from "@/components/ui/badge"
import { InstallmentModal, Cuota } from "./InstallmentModal"
import { ContactConfirmModal } from "@/app/dashboard/comprobantes/modals/ContactConfirmModal"
import { Sequential } from "@/app/types/config-types"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import apiClient from "@/app/api/client"

interface InvoiceModalProps {
    open:                boolean
    onOpenChange:        (open: boolean) => void
    selectedOrder:       Pedido | null
    tiposComprobante:    Sequential[]
    sunatTransacciones:  SunatTransaccion[]
    tipoDocsSunat:       TipoDocSunat[]
    invoiceType:         string
    setInvoiceType:      (v: string) => void
    sunatTransaction:    string
    setSunatTransaction: (v: string) => void
    tipoSunat:           string
    setTipoSunat:        (v: string) => void
    isProcessing:        boolean
    onConfirm:           (
        guiasSeleccionadas: GuiaReferencia[],
        cuotas: Cuota[],
        email: string,
        phone: string,
        idAlmacen: number,
        flete: { activo: boolean; monto: number }
    ) => void
}

export function InvoiceModal({
                                 open, onOpenChange, selectedOrder, tiposComprobante, sunatTransacciones, tipoDocsSunat,
                                 invoiceType, setInvoiceType, sunatTransaction, setSunatTransaction, tipoSunat, setTipoSunat,
                                 isProcessing, onConfirm
                             }: InvoiceModalProps) {
    const [showGuidesModal,      setShowGuidesModal]      = useState(false)
    const [selectedGuides,       setSelectedGuides]       = useState<GuiaReferencia[]>([])
    const [loadingGuides,        setLoadingGuides]        = useState(false)
    const [showContactModal,     setShowContactModal]     = useState(false)
    const [showInstallmentModal, setShowInstallmentModal] = useState(false)
    const [cuotas,               setCuotas]               = useState<Cuota[]>([])
    const [fleteActivo,          setFleteActivo]          = useState(false)
    const [fleteMonto,           setFleteMonto]           = useState<string>("")
    const [fleteError,           setFleteError]           = useState<string>("")
    const [selectedAlmacen,      setSelectedAlmacen]      = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const valorFlete = fleteActivo ? Number(fleteMonto) || 0 : 0
    const isCredit   = selectedOrder?.condicionCredito === '1'

    const almacenesDisponibles = useMemo(() => {
        const seen = new Set<string>()
        return tiposComprobante
            .filter(t => t.id_almacen && t.desc_almacen)
            .reduce<{ id: string; desc: string }[]>((acc, t) => {
                const key = String(t.id_almacen)
                if (!seen.has(key)) {
                    seen.add(key)
                    acc.push({ id: key, desc: t.desc_almacen! })
                }
                return acc
            }, [])
    }, [tiposComprobante])

    useEffect(() => {
        if (!invoiceType) return
        const sequential = tiposComprobante.find(t => `${t.prefijo}|${t.tipo}` === invoiceType)
        if (sequential?.id_almacen) setSelectedAlmacen(String(sequential.id_almacen))
    }, [invoiceType, tiposComprobante])

    useEffect(() => {
        if (!isProcessing) {
            setIsSubmitting(false)
        }
    }, [isProcessing])

    useEffect(() => {
        if (!open) {
            setSelectedGuides([])
            setCuotas([])
            setSelectedAlmacen("")
            setFleteActivo(false)
            setFleteMonto("")
            setFleteError("")
            setIsSubmitting(false)
            return
        }

        // ✅ Cargar guías automáticamente al abrir
        if (selectedOrder?.nroPedido) {
            const fetchGuias = async () => {
                setLoadingGuides(true)
                try {
                    const response = await apiClient.get(
                        `/pedidos/guiasRelacionadas?nroPedido=${selectedOrder.nroPedido}`
                    )
                    const guias = response.data.data.data || []
                    setSelectedGuides(guias) // ✅ preselecciona todas
                } catch (error) {
                    console.error("Error cargando guías:", error)
                } finally {
                    setLoadingGuides(false)
                }
            }
            fetchGuias()
        }

        if (isCredit) {
            setCuotas([{
                fecha: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
                monto: Number(selectedOrder?.totalPedido)
            }])
        }
    }, [open, selectedOrder])

    const handleInitialConfirm = () => {
        if (fleteActivo && (!fleteMonto || Number(fleteMonto) <= 0)) {
            setFleteError("Ingrese un monto válido para el flete")
            return
        }
        setFleteError("")
        setShowContactModal(true)
    }

    const handleFinalConfirm = (email: string, phone: string) => {
        if (isSubmitting) return
        setIsSubmitting(true)
        onConfirm(
            selectedGuides,
            isCredit ? cuotas : [],
            email,
            phone,
            Number(selectedAlmacen) || 1,
            { activo: fleteActivo, monto: valorFlete }
        )
    }

    const canConfirm =
        !isProcessing &&
        !!invoiceType &&
        !!sunatTransaction &&
        !!selectedAlmacen &&
        (!isCredit || cuotas.length > 0) &&
        (!fleteActivo || (!!fleteMonto && Number(fleteMonto) > 0))

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5" /> Confirmar Facturación
                        </DialogTitle>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">Datos del Pedido</h4>
                                <div className="text-sm space-y-1">
                                    <p><strong>Pedido:</strong> {selectedOrder.nroPedido}</p>
                                    <p><strong>Cliente:</strong> {selectedOrder.nombreCliente}</p>
                                    <div className="flex justify-between items-center">
                                        <p>
                                            <strong>Total:</strong>{" "}
                                            {selectedOrder.monedaPedido === 'PEN' ? 'S/ ' : '$ '}
                                            {Number(selectedOrder.totalPedido).toFixed(2)}
                                        </p>
                                        {isCredit && (
                                            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                                                Venta al Crédito
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">Tipo de Comprobante</Label>
                                    <Select value={invoiceType} onValueChange={setInvoiceType} disabled={isProcessing}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                                        <SelectContent>
                                            {tiposComprobante
                                                .filter((s: Sequential) => s.tipo !== '8' && s.tipo !== '7')
                                                .map((tipo) => (
                                                    <SelectItem key={tipo.prefijo} value={`${tipo.prefijo}|${tipo.tipo}`}>
                                                        {tipo.prefijo} - {tipo.nombre}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">Transacción SUNAT</Label>
                                    <Select value={sunatTransaction} onValueChange={setSunatTransaction} disabled={isProcessing}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar transacción" /></SelectTrigger>
                                        <SelectContent>
                                            {sunatTransacciones.map((trans) => (
                                                <SelectItem key={trans.idTransaction} value={trans.idTransaction.toString()}>
                                                    {trans.descripcion}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">Tipo Doc.</Label>
                                    <Select value={tipoSunat} onValueChange={setTipoSunat} disabled={isProcessing}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar tipo documento" /></SelectTrigger>
                                        <SelectContent>
                                            {tipoDocsSunat.map((trans) => (
                                                <SelectItem key={trans.codigo} value={trans.codigo}>
                                                    {trans.descripcion}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">Almacén Afectado</Label>
                                    <Select
                                        value={selectedAlmacen}
                                        onValueChange={setSelectedAlmacen}
                                        disabled={isProcessing || almacenesDisponibles.length === 0}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Seleccionar almacén" /></SelectTrigger>
                                        <SelectContent>
                                            {almacenesDisponibles.map((alm) => (
                                                <SelectItem key={alm.id} value={alm.id}>{alm.desc}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="border rounded-md p-3 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="chk-flete"
                                        checked={fleteActivo}
                                        onCheckedChange={(v) => {
                                            setFleteActivo(!!v)
                                            if (!v) { setFleteMonto(""); setFleteError("") }
                                        }}
                                        disabled={isProcessing}
                                    />
                                    <Label htmlFor="chk-flete" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                                        <Package className="h-4 w-4 text-gray-600" />
                                        Incluir Cargo por Flete
                                    </Label>
                                </div>
                                {fleteActivo && (
                                    <div className="space-y-2 pl-6">
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-xs text-gray-500">
                                                Monto Flete <span className="text-gray-400">(sin IGV)</span>
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">S/</span>
                                                <Input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    value={fleteMonto}
                                                    onChange={(e) => { setFleteMonto(e.target.value); setFleteError("") }}
                                                    className={`pl-9 ${fleteError ? 'border-red-400' : ''}`}
                                                    placeholder="0.00"
                                                    disabled={isProcessing}
                                                />
                                            </div>
                                            {fleteError && <p className="text-xs text-red-500">{fleteError}</p>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {isCredit && (
                                <div className="border rounded-md p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-sm font-medium flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" /> Cuotas de Crédito
                                        </Label>
                                        <Button size="sm" variant="outline"
                                                onClick={() => setShowInstallmentModal(true)}
                                                className="h-7 text-xs border-purple-300">
                                            Configurar
                                        </Button>
                                    </div>
                                    {cuotas.length > 0 ? (
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Badge>{cuotas.length} Cuota(s)</Badge>
                                                <span className="text-xs text-gray-500">
                                                    Último vencimiento: {cuotas[cuotas.length - 1].fecha}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 max-h-[60px] overflow-y-auto">
                                                {cuotas.map((c, i) => (
                                                    <div key={i} className="flex justify-between w-[90%]">
                                                        <span>Cuota {i + 1} ({c.fecha}):</span>
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
                                        disabled={isProcessing || loadingGuides}
                                        className="flex items-center gap-2 border-dashed border-gray-400"
                                    >
                                        {loadingGuides
                                            ? <><Loader2 className="h-4 w-4 animate-spin" /> Cargando guías...</>
                                            : <><Truck className="h-4 w-4" /> {selectedGuides.length > 0 ? 'Modificar Guías' : 'Seleccionar Guías'}</>
                                        }
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
                                    <strong>¿Confirmas la facturación?</strong><br />
                                    Se generará el comprobante electrónico para este pedido. Esta acción no se puede deshacer.
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => onOpenChange(false)}
                                disabled={isProcessing} className="w-full sm:w-auto">
                            Cancelar
                        </Button>
                        <Button onClick={handleInitialConfirm} disabled={!canConfirm}
                                className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none">
                            {isProcessing
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
                                : <><Receipt className="mr-2 h-4 w-4" /> Confirmar Facturación</>
                            }
                        </Button>
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