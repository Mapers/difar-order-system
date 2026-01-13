'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { FileText, Truck, ArrowRight, ArrowLeft, Search, CheckCircle, Calendar, Package } from "lucide-react"
import { Pedido } from "@/app/dashboard/comprobantes/page"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Remision } from "@/app/dashboard/comprobantes/remision"
import apiClient from "@/app/api/client"
import { useAuth } from "@/context/authContext"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"

interface GenerarGuiasModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pedidoPreseleccionado: Pedido | null
  pedidosDisponibles: Pedido[]
  isProcessing: boolean
  onGenerarGuias: () => Promise<void>
}

interface PedidoDet {
  idPedidodet: number
  idPedidocab: number
  codigoitemPedido: string
  cantPedido: string
  precioPedido: string
  productoNombre?: string
  productoUnidad?: string
}

export function GenerarGuiasModal({
                                    open,
                                    onOpenChange,
                                    isProcessing,
                                    pedidoPreseleccionado,
                                    pedidosDisponibles,
                                  }: GenerarGuiasModalProps) {
  const [step, setStep] = useState(1)
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const [activeTab, setActiveTab] = useState("remision")
  const [detalles, setDetalles] = useState<PedidoDet[]>([])
  const auth = useAuth()

  useEffect(() => {
    if (open) {
      if (pedidoPreseleccionado) {
        setSelectedPedido(pedidoPreseleccionado)
        setStep(2)
      } else {
        setSelectedPedido(null)
        setStep(1)
        setSearchQuery("")
        setDetalles([])
      }
    }
  }, [open, pedidoPreseleccionado])

  const fetchPedidoDetalles = async () => {
    if (!selectedPedido) return
    try {
      const resDet = await apiClient.get(`/pedidosDetalles/${selectedPedido.nroPedido || ''}/detalles?vendedor=${auth.user?.codigo}`)
      const detallesData = resDet.data.data
      setDetalles(detallesData)
    } catch (err) {
      console.error("Error fetching order details:", err)
    }
  }

  useEffect(() => {
    if (selectedPedido && step === 2) {
      fetchPedidoDetalles()
    }
  }, [selectedPedido, step])

  const filteredPedidos = pedidosDisponibles ? pedidosDisponibles.filter(p =>
      p.nroPedido === searchQuery ||
      p.nombreCliente.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.codigoCliente.includes(searchQuery)
  ) : []

  const handleNextStep = () => {
    if (selectedPedido) {
      setStep(2)
    }
  }

  const handleBack = () => {
    setStep(1)
    if (!pedidoPreseleccionado) {
      setSelectedPedido(null)
      setDetalles([])
    }
  }

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`${step === 1 ? "max-w-4xl h-[600px]" : "max-w-6xl h-[90vh]"} flex flex-col transition-all duration-300`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Truck className="h-5 w-5 text-blue-600" />
              {step === 1 ? "Seleccionar Pedido" : `Generar Guía - Pedido ${selectedPedido?.nroPedido}`}
            </DialogTitle>
            {step === 1 && (
                <DialogDescription>
                  Seleccione el pedido pendiente para generar su guía de remisión.
                </DialogDescription>
            )}
          </DialogHeader>

          {step === 1 && (
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                      placeholder="Buscar por número de pedido, cliente o RUC..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                  />
                </div>

                <ScrollArea className="flex-1 border rounded-md p-4 bg-gray-50">
                  {filteredPedidos.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredPedidos.map((pedidoItem) => (
                            <Card
                                key={pedidoItem.idPedidocab}
                                className={`cursor-pointer transition-all hover:border-blue-400 ${selectedPedido?.idPedidocab === pedidoItem.idPedidocab
                                    ? "border-blue-600 ring-1 ring-blue-600 bg-blue-50"
                                    : "border-gray-200"
                                }`}
                                onClick={() => setSelectedPedido(pedidoItem)}
                            >
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <Badge variant="outline" className="bg-white">
                                    {pedidoItem.nroPedido}
                                  </Badge>
                                  {selectedPedido?.idPedidocab === pedidoItem.idPedidocab && (
                                      <CheckCircle className="h-5 w-5 text-blue-600" />
                                  )}
                                </div>
                                <h4 className="font-semibold text-sm truncate mb-2">{pedidoItem.nombreCliente}</h4>
                                <div className="space-y-1 text-xs text-gray-500">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3" />
                                    {format(parseISO(pedidoItem.fechaPedido), "dd/MM/yyyy")}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Package className="h-3 w-3" />
                                    {pedidoItem.cantidadPedidos} items
                                  </div>
                                  <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-700">
                              {pedidoItem.monedaPedido === 'PEN' ? 'S/' : '$'} {Number(pedidoItem.totalPedido).toFixed(2)}
                            </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                        ))}
                      </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <Package className="h-10 w-10 mb-2 opacity-50" />
                        <p>No se encontraron pedidos pendientes.</p>
                      </div>
                  )}
                </ScrollArea>

                <DialogFooter>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button
                      onClick={handleNextStep}
                      disabled={!selectedPedido}
                      className="bg-blue-600 hover:bg-blue-700"
                  >
                    Continuar <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </DialogFooter>
              </div>
          )}

          {step === 2 && selectedPedido && (
              <>
                <div className="flex items-center justify-between mb-2 px-1">
                  {!pedidoPreseleccionado ? (
                      <Button variant="ghost" size="sm" onClick={handleBack} className="text-gray-500 hover:text-blue-600 pl-0">
                        <ArrowLeft className="mr-1 h-4 w-4" /> Cambiar Pedido
                      </Button>
                  ) : <div />}
                </div>

                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="flex-1 flex flex-col overflow-hidden"
                >
                  <div className="border-b">
                    <TabsList className="grid grid-cols-2 w-[400px] bg-transparent">
                      <TabsTrigger
                          value="remision"
                          className="flex items-center gap-2 py-4 px-4 data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
                      >
                        <FileText className="h-4 w-4" />
                        Guía de Remisión
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
                    {detalles.length > 0 ? (
                        <TabsContent value="remision" className="m-0 h-full">
                          <Remision
                              onOpenChange={onOpenChange}
                              detalles={detalles}
                              pedido={selectedPedido}
                          />
                        </TabsContent>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                          <p>No hay detalles del pedido...</p>
                        </div>
                    )}
                  </div>
                </Tabs>

                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                </DialogFooter>
              </>
          )}
        </DialogContent>
      </Dialog>
  )
}