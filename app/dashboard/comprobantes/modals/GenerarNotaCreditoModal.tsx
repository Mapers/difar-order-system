'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { FileDiff, ArrowRight, ArrowLeft, FileText, Loader2, CheckCircle, Package, Minus, Plus, Percent } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { format, addDays, parseISO } from "date-fns"
import { Comprobante } from "@/app/types/order/order-interface"
import { NotaCreditoForm } from "./NotaCreditoForm"
import apiClient from "@/app/api/client"
import { useAuth } from "@/context/authContext"

interface ItemSeleccionado {
    cod_item:    string
    descripcion: string
    cantidad:    number
    cantMax:     number
    precio:      number
    bloqueado:   boolean
}

interface DetallePedido {
    idPedidodet:        number
    codigoitemPedido:   string
    productoNombre:     string
    cantPedido:         number
    precioPedido:       number
    cod_lote?:          string
    fec_venc_lote?:     string
    tipo_afectacion_igv?: string
    tieneNC:              number
    cantidadNC:           number
}

interface GenerarNotaCreditoModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onGenerar: () => void
}

export function GenerarNotaCreditoModal({
                                            open, onOpenChange, onGenerar
                                        }: GenerarNotaCreditoModalProps) {
    const auth = useAuth()
    const [step, setStep] = useState(1)
    const [selectedComprobante, setSelectedComprobante] = useState<Comprobante | null>(null)
    const [tipoNC, setTipoNC] = useState<'total' | 'parcial' | 'descuento' | null>(null)
    const [itemsSeleccionados, setItemsSeleccionados] = useState<ItemSeleccionado[]>([])
    const [detallesPedido, setDetallesPedido] = useState<DetallePedido[]>([])
    const [loadingDetalles, setLoadingDetalles] = useState(false)

    const today = new Date()
    const [fechaDesde, setFechaDesde] = useState(format(today, 'yyyy-MM-dd'))
    const [fechaHasta, setFechaHasta] = useState(format(addDays(today, 1), 'yyyy-MM-dd'))

    const [comprobantes, setComprobantes] = useState<Comprobante[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open && step === 1) fetchComprobantes()
    }, [open, step])

    const fetchComprobantes = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (auth.user?.idRol === 1) params.append('vendedor', auth.user?.codigo || '')
            params.append('fechaDesde', fechaDesde)
            params.append('fechaHasta', fechaHasta)

            const response = await apiClient.get(`/pedidos/comprobantes?${params.toString()}`)
            const data = response.data.data.data || []
            setComprobantes(data.filter((item: Comprobante) => !item.anulado && item.tipoNC !== 'total'))
        } catch (error) {
            console.error("Error buscando comprobantes:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchDetallesPedido = async (nroPedido: number) => {
        setLoadingDetalles(true)
        try {
            let url = `/pedidosDetalles/${nroPedido}/detalles`
            if (auth.user?.idRol === 1) url += `?vendedor=${auth.user?.codigo}`
            const response = await apiClient.get(url)
            const data: DetallePedido[] = response.data.data || []
            setDetallesPedido(data)
            setItemsSeleccionados(
                data.map(d => {
                    const cantDisponible = Math.max(0, Number(d.cantPedido) - Number(d.cantidadNC || 0))
                    return {
                        cod_item:     d.codigoitemPedido,
                        descripcion:  d.productoNombre,
                        cantidad:     0,
                        cantMax:      cantDisponible,
                        precio:       Number(d.precioPedido),
                        bloqueado:   !!d.tieneNC,
                    }
                })
            )
        } catch (error) {
            console.error("Error cargando detalles:", error)
        } finally {
            setLoadingDetalles(false)
        }
    }

    const handleSelectComprobante = (item: Comprobante) => {
        setSelectedComprobante(item)
    }

    const handleNextStep1 = () => {
        if (selectedComprobante) setStep(2)
    }

    const handleSelectTipo = async (tipo: 'total' | 'parcial' | 'descuento') => {
        setTipoNC(tipo)
        if (tipo === 'parcial' && selectedComprobante?.nroPedido) {
            await fetchDetallesPedido(selectedComprobante.nroPedido)
        }
        setStep(3)
    }

    const handleCantidadChange = (index: number, delta: number) => {
        setItemsSeleccionados(prev => {
            const updated = [...prev]
            const item = updated[index]
            const nueva = Math.max(0, Math.min(item.cantMax, item.cantidad + delta))
            updated[index] = { ...item, cantidad: nueva }
            return updated
        })
    }

    const handleCantidadInput = (index: number, value: string) => {
        const num = parseInt(value) || 0
        setItemsSeleccionados(prev => {
            const updated = [...prev]
            const item = updated[index]
            updated[index] = { ...item, cantidad: Math.max(0, Math.min(item.cantMax, num)) }
            return updated
        })
    }

    const itemsConCantidad = itemsSeleccionados.filter(i => i.cantidad > 0)
    const canProceedParcial = itemsConCantidad.length > 0

    const handleBack = () => {
        if (step === 3) {
            setStep(2)
            setTipoNC(null)
            setItemsSeleccionados([])
            setDetallesPedido([])
        } else if (step === 2) {
            setStep(1)
            setSelectedComprobante(null)
        }
    }

    const handleSuccess = () => {
        onGenerar()
        onOpenChange(false)
        setStep(1)
        setSelectedComprobante(null)
        setTipoNC(null)
        setItemsSeleccionados([])
        setDetallesPedido([])
    }

    const getDialogSize = () => {
        if (step === 1) return "max-w-5xl h-[700px]"
        if (step === 2) return "max-w-3xl"
        if (step === 3 && tipoNC === 'parcial') return "max-w-3xl"
        return "max-w-4xl"
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`${getDialogSize()} flex flex-col transition-all duration-300`}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <FileDiff className="h-5 w-5 text-blue-600" />
                        {step === 1 && "Seleccionar Comprobante"}
                        {step === 2 && "Tipo de Nota de Crédito"}
                        {step === 3 && tipoNC === 'total' && `NC Total — ${selectedComprobante?.serie}-${selectedComprobante?.numero}`}
                        {step === 3 && tipoNC === 'parcial' && `NC Parcial — ${selectedComprobante?.serie}-${selectedComprobante?.numero}`}
                        {step === 3 && tipoNC === 'descuento' && `NC Descuento — ${selectedComprobante?.serie}-${selectedComprobante?.numero}`}
                    </DialogTitle>
                    {step === 1 && (
                        <DialogDescription>
                            Busque y seleccione la Factura o Boleta para aplicar la nota de crédito.
                        </DialogDescription>
                    )}
                </DialogHeader>

                {step === 1 && (
                    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-muted rounded-lg border">
                            <div className="md:col-span-3 space-y-1">
                                <Label className="text-xs">Fecha Desde</Label>
                                <Input type="date" value={fechaDesde}
                                       onChange={(e) => setFechaDesde(e.target.value)}
                                       className="bg-background h-8 text-xs" />
                            </div>
                            <div className="md:col-span-3 space-y-1">
                                <Label className="text-xs">Fecha Hasta</Label>
                                <Input type="date" value={fechaHasta}
                                       onChange={(e) => setFechaHasta(e.target.value)}
                                       className="bg-background h-8 text-xs" />
                            </div>
                            <div className="md:col-span-2 flex items-end">
                                <Button onClick={fetchComprobantes} disabled={loading}
                                        size="sm" className="w-full h-8 text-xs">
                                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Buscar"}
                                </Button>
                            </div>
                        </div>

                        <ScrollArea className="flex-1 border rounded-md p-4 bg-background">
                            {loading ? (
                                <div className="flex justify-center items-center h-40">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                </div>
                            ) : comprobantes.filter(item => item.idComprobanteCab != null).length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {comprobantes.filter(item => item.idComprobanteCab != null).map((item) => (
                                        <Card
                                            key={item.idComprobanteCab}
                                            className={`cursor-pointer transition-all hover:border-blue-400 ${
                                                selectedComprobante?.idComprobanteCab === item.idComprobanteCab
                                                    ? "border-blue-600 ring-1 ring-blue-600 bg-blue-50"
                                                    : "border-border"
                                            }`}
                                            onClick={() => handleSelectComprobante(item)}
                                        >
                                            <CardContent className="p-3">
                                                <div className="flex justify-between items-start mb-2">
                                                    <Badge variant="outline" className="bg-background font-bold text-xs">
                                                        {item.serie}-{item.numero}
                                                    </Badge>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {format(parseISO(item?.fecha_envio || ''), "dd/MM/yyyy")}
                                                        </span>
                                                        {selectedComprobante?.idComprobanteCab === item.idComprobanteCab && (
                                                            <CheckCircle className="h-4 w-4 text-blue-600" />
                                                        )}
                                                    </div>
                                                </div>
                                                <h4 className="font-semibold text-xs truncate mb-1">
                                                    {item.cliente_denominacion}
                                                </h4>
                                                <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <FileText className="h-3 w-3" />
                                                        <span>{item.tipo_comprobante === 1 ? 'Factura' : 'Boleta'}</span>
                                                    </div>
                                                    <span className={`font-bold ${
                                                        selectedComprobante?.idComprobanteCab === item.idComprobanteCab
                                                            ? "text-blue-900"
                                                            : "text-card-foreground"
                                                    }`}>
                                                        {item.moneda === 1 ? 'S/' : '$'} {Number(item.total).toFixed(2)}
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <FileText className="h-10 w-10 mb-2 opacity-50" />
                                    <p>No se encontraron comprobantes con esos filtros.</p>
                                </div>
                            )}
                        </ScrollArea>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button onClick={handleNextStep1} disabled={!selectedComprobante}
                                    className="bg-blue-600 hover:bg-blue-700">
                                Continuar <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {step === 2 && selectedComprobante && (
                    <div className="flex flex-col gap-6 py-4">
                        <p className="text-sm text-muted-foreground text-center">
                            Comprobante: <span className="font-semibold text-foreground">
                                {selectedComprobante.serie}-{selectedComprobante.numero}
                            </span> — {selectedComprobante.cliente_denominacion}
                        </p>

                        <div className="grid grid-cols-3 gap-4 px-4">
                            <button
                                onClick={() => handleSelectTipo('total')}
                                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-blue-500 hover:bg-blue-50 transition-all group"
                                disabled={selectedComprobante.tipoNC !== 'sin_nc'}
                            >
                                <div className="p-4 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                                    <FileText className="h-8 w-8 text-blue-600" />
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-foreground">NC Total</p>
                                    {selectedComprobante.tipoNC !== 'sin_nc' ? <p className="text-xs text-red-500 mt-1">
                                        No puedes realizar una NC Total, ya existe NC Parcial
                                    </p> : <p className="text-xs text-muted-foreground mt-1">
                                        Anula el comprobante completo por el monto total
                                    </p>}
                                </div>
                            </button>

                            <button
                                onClick={() => handleSelectTipo('parcial')}
                                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-green-500 hover:bg-green-50 transition-all group"
                                disabled={loadingDetalles}
                            >
                                <div className="p-4 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                                    <Package className="h-8 w-8 text-green-600" />
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-foreground">NC Parcial</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Seleccioná los items y cantidades a devolver
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={() => handleSelectTipo('descuento')}
                                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-amber-500 hover:bg-amber-50 transition-all group"
                            >
                                <div className="p-4 bg-amber-100 rounded-full group-hover:bg-amber-200 transition-colors">
                                    <Percent className="h-8 w-8 text-amber-600" />
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-foreground">Descuento Global</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Aplica un descuento al valor del comprobante, sin devolver productos
                                    </p>
                                </div>
                            </button>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={handleBack} disabled={loadingDetalles}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {step === 3 && tipoNC === 'total' && selectedComprobante && (
                    <>
                        <div className="flex items-center mb-2 px-1">
                            <Button variant="ghost" size="sm" onClick={handleBack}
                                    className="text-muted-foreground hover:text-blue-600 pl-0">
                                <ArrowLeft className="mr-1 h-4 w-4" /> Atrás
                            </Button>
                        </div>
                        <div className="flex-1 p-1">
                            <NotaCreditoForm
                                comprobante={selectedComprobante}
                                onClose={() => onOpenChange(false)}
                                onSuccess={handleSuccess}
                            />
                        </div>
                    </>
                )}

                {step === 3 && tipoNC === 'descuento' && selectedComprobante && (
                    <>
                        <div className="flex items-center mb-2 px-1">
                            <Button variant="ghost" size="sm" onClick={handleBack}
                                    className="text-muted-foreground hover:text-blue-600 pl-0">
                                <ArrowLeft className="mr-1 h-4 w-4" /> Atrás
                            </Button>
                        </div>
                        <div className="flex-1 p-1">
                            <NotaCreditoForm
                                comprobante={selectedComprobante}
                                modoDescuento
                                onClose={() => onOpenChange(false)}
                                onSuccess={handleSuccess}
                            />
                        </div>
                    </>
                )}

                {step === 3 && tipoNC === 'parcial' && selectedComprobante && (
                    <>
                        <div className="flex items-center mb-2 px-1">
                            <Button variant="ghost" size="sm" onClick={handleBack}
                                    className="text-muted-foreground hover:text-blue-600 pl-0">
                                <ArrowLeft className="mr-1 h-4 w-4" /> Atrás
                            </Button>
                        </div>

                        {loadingDetalles ? (
                            <div className="flex justify-center items-center h-40">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 overflow-hidden">
                                <p className="text-xs text-muted-foreground px-1">
                                    Indicá la cantidad a devolver por cada producto (0 = no incluir en la NC)
                                </p>

                                <ScrollArea className="h-[380px] w-full rounded-md border bg-background">
                                    <div className="min-w-full">
                                        <table className="min-w-full divide-y divide-border">
                                            <thead className="bg-muted sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Producto</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">P. Unit</th>
                                                <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">Cant. Max</th>
                                                <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">A Devolver</th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                            {itemsSeleccionados.map((item, index) => (
                                                <tr key={item.cod_item}
                                                    className={item.cantidad > 0 ? 'bg-green-50' : ''}>
                                                    <td className="px-3 py-2">
                                                        <p className="text-xs font-medium text-foreground">{item.descripcion}</p>
                                                        <p className="text-[10px] text-muted-foreground">{item.cod_item}</p>
                                                    </td>
                                                    <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                                                        S/ {item.precio.toFixed(2)}
                                                    </td>
                                                    <td className="px-3 py-2 text-center text-xs text-muted-foreground">
                                                        {item.cantMax}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {item.bloqueado ? (
                                                            <p className="text-center text-xs text-red-500 font-medium">
                                                                NC total emitida
                                                            </p>
                                                        ) : item.cantMax === 0 ? (
                                                            <p className="text-center text-xs text-muted-foreground">
                                                                Sin stock disponible
                                                            </p>
                                                        ) : (
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    onClick={() => handleCantidadChange(index, -1)}
                                                                    className="h-6 w-6 rounded-full flex items-center justify-center border border-border hover:border-red-400 hover:text-red-500 transition-colors"
                                                                >
                                                                    <Minus className="h-3 w-3" />
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    max={item.cantMax}
                                                                    value={item.cantidad}
                                                                    onChange={(e) => handleCantidadInput(index, e.target.value)}
                                                                    className="w-12 text-center text-sm font-semibold border rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                                />
                                                                <button
                                                                    onClick={() => handleCantidadChange(index, 1)}
                                                                    className="h-6 w-6 rounded-full flex items-center justify-center border border-border hover:border-green-400 hover:text-green-500 transition-colors"
                                                                >
                                                                    <Plus className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </ScrollArea>

                                {canProceedParcial && (
                                    <div className="bg-green-50 border border-green-200 rounded-md px-3 py-2 text-xs text-green-800">
                                        <span className="font-semibold">{itemsConCantidad.length} item(s) seleccionado(s)</span>
                                        {' '}— Total a devolver: S/{' '}
                                        {itemsConCantidad.reduce((s, i) => s + i.cantidad * i.precio, 0).toFixed(2)}
                                    </div>
                                )}

                                <DialogFooter>
                                    <Button variant="outline" onClick={handleBack}>
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                                    </Button>
                                    <Button
                                        disabled={!canProceedParcial}
                                        onClick={() => setStep(4)}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        Continuar <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </>
                )}

                {step === 4 && tipoNC === 'parcial' && selectedComprobante && (
                    <>
                        <div className="flex items-center mb-2 px-1">
                            <Button variant="ghost" size="sm" onClick={() => setStep(3)}
                                    className="text-muted-foreground hover:text-blue-600 pl-0">
                                <ArrowLeft className="mr-1 h-4 w-4" /> Atrás
                            </Button>
                        </div>
                        <div className="flex-1 p-1">
                            <NotaCreditoForm
                                comprobante={selectedComprobante}
                                itemsParciales={itemsConCantidad}
                                onClose={() => onOpenChange(false)}
                                onSuccess={handleSuccess}
                            />
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}