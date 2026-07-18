'use client'

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
    Receipt,
    Loader2,
    Truck,
    AlertTriangle,
    Check,
    FileText,
    CreditCard,
    Package,
    RefreshCw,
    Tag
} from "lucide-react"
import { Pedido, SunatTransaccion, TipoDocSunat, GuiaReferencia } from "@/app/types/order/order-interface"
import { GuidesSelectorModal } from "./GuidesSelectorModal"
import { Badge } from "@/components/ui/badge"
import { InstallmentModal, Cuota } from "./InstallmentModal"
import { ContactConfirmModal } from "@/app/dashboard/comprobantes/modals/ContactConfirmModal"
import { Sequential } from "@/app/types/config-types"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import apiClient from "@/app/api/client"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { addDays, format, parseISO } from "date-fns"

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
        flete: { activo: boolean; monto: number },
        descuento: { activo: boolean; monto: number },
        fechaEmision: string
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
    const [fechaEmisionOpcion,   setFechaEmisionOpcion]   = useState<'hoy' | 'pedido'>('pedido')
    const [fleteActivo,          setFleteActivo]          = useState(false)
    const [fleteMonto,           setFleteMonto]           = useState<string>("")
    const [fleteError,           setFleteError]           = useState<string>("")
    const [selectedAlmacen,      setSelectedAlmacen]      = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [previewExistente, setPreviewExistente] = useState<{
        serie: string
        numero: string
        tipo_cpe: string
    } | null>(null)
    const [loadingPreviewData, setLoadingPreviewData] = useState(false)

    const [descuentoActivo,  setDescuentoActivo]  = useState(false)
    const [descuentoMonto,   setDescuentoMonto]   = useState<string>("")
    const [descuentoError,   setDescuentoError]   = useState<string>("")
    const [tipoDocError,     setTipoDocError]     = useState<string>("")

    const valorDescuento = descuentoActivo ? Number(descuentoMonto) || 0 : 0

    const valorFlete = fleteActivo ? Number(fleteMonto) || 0 : 0
    const isCredit   = selectedOrder?.condicionCredito === '1'

    // Fecha de emisión elegida (yyyy-MM-dd): hoy o la fecha de generación del pedido.
    const hoyStr         = format(new Date(), 'yyyy-MM-dd')
    const fechaPedidoStr = selectedOrder?.fechaPedido
        ? format(parseISO(selectedOrder.fechaPedido), 'yyyy-MM-dd')
        : hoyStr
    const fechaEmisionElegida = fechaEmisionOpcion === 'pedido' ? fechaPedidoStr : hoyStr
    const mismasFechas = fechaPedidoStr === hoyStr

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
            setFechaEmisionOpcion('pedido')
            return
        }

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

    }, [open, selectedOrder])

    useEffect(() => {
        if (!open || !isCredit || !selectedOrder?.condicionPedido) return

        const fetchDiasCredito = async () => {
            let dias = 0
            try {
                // condicionPedido en esta lista es la DESCRIPCIÓN (ej. "1 Dias Credito"),
                // no el código; por eso se busca en la lista completa por Descripcion/código.
                const res = await apiClient.get('/tomarPedido/condiciones')
                const lista = res.data?.data?.data || []
                const cond = lista.find(
                    (c: { CodigoCondicion: string; Descripcion: string; DiasCdto: number }) =>
                        c.Descripcion === selectedOrder.condicionPedido ||
                        c.CodigoCondicion === selectedOrder.condicionPedido
                )
                dias = Number(cond?.DiasCdto) || 0
            } catch {
                dias = 0
            }
            setCuotas([{
                fecha: format(addDays(parseISO(fechaEmisionElegida), dias), 'yyyy-MM-dd'),
                monto: Number(selectedOrder?.totalPedido)
            }])
        }

        fetchDiasCredito()
    }, [open, isCredit, selectedOrder?.condicionPedido, fechaEmisionElegida])

    useEffect(() => {
        if (!open || !selectedOrder) return

        const fetchPreview = async () => {
            setLoadingPreviewData(true)
            try {
                const res = await apiClient.get(
                    `/pedidos/getPreviewCompr?nroPedido=${selectedOrder.nroPedido}`
                )
                const data = res.data?.data
                if (data?.idPreview) {
                    setPreviewExistente({
                        serie:    data.serie    || '',
                        numero:   data.numero   || '',
                        tipo_cpe: data.tipo_cpe || '',
                    })
                    const matchTipo = tiposComprobante.find(t => t.prefijo === data.serie)
                    if (matchTipo) {
                        setInvoiceType(`${matchTipo.prefijo}|${matchTipo.tipo}`)
                    }
                    if (data.tipo_cpe === '01') setTipoSunat('6')
                    else if (data.tipo_cpe === '03') setTipoSunat('1')
                    if (data.idTransaction) {
                        setSunatTransaction(data.idTransaction)
                    }
                    if (data.idAlmacen) {
                        setSelectedAlmacen(data.idAlmacen)
                    }
                } else {
                    setPreviewExistente(null)
                }
            } catch {
                setPreviewExistente(null)
            } finally {
                setLoadingPreviewData(false)
            }
        }

        fetchPreview()
    }, [open, selectedOrder?.nroPedido])

    const handleInitialConfirm = () => {
        if (tipoSunat === '1' && selectedOrder?.RUC?.length !== 8) {
            setTipoDocError("El cliente tiene RUC (11 dígitos). Para tipo documento DNI el cliente debe tener exactamente 8 dígitos.")
            return
        }
        if (fleteActivo && (!fleteMonto || Number(fleteMonto) <= 0)) {
            setFleteError("Ingrese un monto válido para el flete")
            return
        }
        if (descuentoActivo && (!descuentoMonto || Number(descuentoMonto) <= 0)) {
            setDescuentoError("Ingrese un monto válido para el descuento")
            return
        }
        setTipoDocError("")
        setFleteError("")
        setDescuentoError("")
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
            { activo: fleteActivo, monto: valorFlete },
            { activo: descuentoActivo, monto: valorDescuento },
            fechaEmisionElegida
        )
    }

    const canConfirm =handleFinalConfirm
        !isProcessing &&
        !!invoiceType &&
        !!sunatTransaction &&
        !!selectedAlmacen &&
        (!isCredit || cuotas.length > 0) &&
        (!fleteActivo || (!!fleteMonto && Number(fleteMonto) > 0)) &&
        (!descuentoActivo || (!!descuentoMonto && Number(descuentoMonto) > 0))

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
                                <h4 className="font-medium text-blue-900 mb-2">Datos del Pedido</h4>
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
                                    <div className="flex items-center gap-3 pt-1">
                                        <span className="text-xs font-medium text-blue-900">Emisión:</span>
                                        {mismasFechas ? (
                                            <span className="text-xs">Hoy ({format(parseISO(hoyStr), 'dd/MM/yyyy')})</span>
                                        ) : (
                                            <RadioGroup
                                                value={fechaEmisionOpcion}
                                                onValueChange={(v) => setFechaEmisionOpcion(v as 'hoy' | 'pedido')}
                                                className="flex flex-row gap-4"
                                                disabled={isProcessing}
                                            >
                                                <Label htmlFor="fe-pedido" className="flex items-center gap-1.5 text-xs cursor-pointer font-normal">
                                                    <RadioGroupItem id="fe-pedido" value="pedido" className="h-3.5 w-3.5" />
                                                    Fecha pedido ({format(parseISO(fechaPedidoStr), 'dd/MM/yyyy')})
                                                </Label>
                                                <Label htmlFor="fe-hoy" className="flex items-center gap-1.5 text-xs cursor-pointer font-normal">
                                                    <RadioGroupItem id="fe-hoy" value="hoy" className="h-3.5 w-3.5" />
                                                    Hoy ({format(parseISO(hoyStr), 'dd/MM/yyyy')})
                                                </Label>
                                            </RadioGroup>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">
                                        Tipo de Comprobante
                                        {previewExistente && (
                                            <span className="ml-1 text-amber-600">(bloqueado)</span>
                                        )}
                                    </Label>
                                    <Select
                                        value={invoiceType}
                                        onValueChange={setInvoiceType}
                                        disabled={isProcessing || !!previewExistente || loadingPreviewData}
                                    >
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
                                    <Select
                                        value={sunatTransaction}
                                        onValueChange={setSunatTransaction}
                                        disabled={isProcessing || loadingPreviewData}
                                    >
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
                                    <Select
                                        value={tipoSunat}
                                        onValueChange={(v) => { setTipoSunat(v); setTipoDocError("") }}
                                        disabled={isProcessing || loadingPreviewData}
                                    >
                                        <SelectTrigger className={tipoDocError ? 'border-red-400' : ''}>
                                            <SelectValue placeholder="Seleccionar tipo documento" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {tipoDocsSunat.map((trans) => (
                                                <SelectItem key={trans.codigo} value={trans.codigo}>
                                                    {trans.descripcion}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {tipoDocError && <p className="text-xs text-red-500 mt-1">{tipoDocError}</p>}
                                </div>
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">Almacén Afectado</Label>
                                    <Select
                                        value={selectedAlmacen}
                                        onValueChange={setSelectedAlmacen}
                                        disabled={isProcessing || almacenesDisponibles.length === 0 || loadingPreviewData}
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
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                        Incluir Cargo por Flete
                                    </Label>
                                </div>
                                {fleteActivo && (
                                    <div className="space-y-2 pl-6">
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-xs text-muted-foreground">
                                                Monto Flete <span className="text-muted-foreground">(sin IGV)</span>
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">S/</span>
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

                            <div className="border rounded-md p-3 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="chk-descuento"
                                        checked={descuentoActivo}
                                        onCheckedChange={(v) => {
                                            setDescuentoActivo(!!v)
                                            if (!v) { setDescuentoMonto(""); setDescuentoError("") }
                                        }}
                                        disabled={isProcessing}
                                    />
                                    <Label htmlFor="chk-descuento" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                                        <Tag className="h-4 w-4 text-muted-foreground" />
                                        Incluir Descuento Global
                                    </Label>
                                </div>
                                {descuentoActivo && (
                                    <div className="space-y-2 pl-6">
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-xs text-muted-foreground">
                                                Monto Descuento <span className="text-muted-foreground">(sobre el total)</span>
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">S/</span>
                                                <Input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    value={descuentoMonto}
                                                    onChange={(e) => { setDescuentoMonto(e.target.value); setDescuentoError("") }}
                                                    className={`pl-9 ${descuentoError ? 'border-red-400' : ''}`}
                                                    placeholder="0.00"
                                                    disabled={isProcessing}
                                                />
                                            </div>
                                            {descuentoError && <p className="text-xs text-red-500">{descuentoError}</p>}
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
                                                <span className="text-xs text-muted-foreground">
                                                    Último vencimiento: {format(parseISO(cuotas[cuotas.length - 1].fecha), 'dd/MM/yyyy')}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1 max-h-[60px] overflow-y-auto">
                                                {cuotas.map((c, i) => (
                                                    <div key={i} className="flex justify-between w-[90%]">
                                                        <span>Cuota {i + 1} ({format(parseISO(c.fecha), 'dd/MM/yyyy')}):</span>
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
                                        className="flex items-center gap-2 border-dashed border-border"
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
                                    <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
                                        <FileText className="h-4 w-4" /> Observaciones
                                    </Label>
                                    <div className="bg-muted border border-border rounded-md p-3 text-sm text-muted-foreground italic">
                                        {selectedOrder.observaciones}
                                    </div>
                                </div>
                            )}

                            {loadingPreviewData ? (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                                    <Loader2 className="h-3 w-3 animate-spin" /> Verificando correlativo existente...
                                </div>
                            ) : previewExistente && (
                                <div className="p-3 bg-amber-50 border border-amber-300 rounded-md flex gap-2 items-start">
                                    <RefreshCw className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                    <div className="text-sm text-amber-800">
                                        <span className="font-semibold block">
                                            Correlativo asociado: {previewExistente.serie}-{previewExistente.numero}
                                        </span>
                                        Al confirmar la facturación se generará con estos datos el comprobante.
                                    </div>
                                </div>
                            )}
                            {(!previewExistente && !loadingPreviewData) && <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                <p className="text-sm text-yellow-800">
                                    <strong>¿Confirmas la facturación?</strong><br/>
                                    Se generará el comprobante electrónico para este pedido. Esta acción no se puede
                                    deshacer.
                                </p>
                            </div>}
                        </div>
                    )}

                    <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => onOpenChange(false)}
                                disabled={isProcessing} className="w-full sm:w-auto">
                            Cancelar
                        </Button>
                        <Button onClick={handleInitialConfirm} disabled={!canConfirm || loadingPreviewData}
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