'use client'

import { useState, useEffect } from "react"
import { Search, FileText, AlertTriangle, Truck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { addDays, format } from "date-fns"
import apiClient from "@/app/api/client"
import { useAuth } from "@/context/authContext"
import { toast } from "@/components/ui/use-toast"
import {
  Comprobante, GuiaReferencia,
  GuiaRemision,
  Pedido,
  SunatTransaccion,
  TipoDocSunat
} from "@/interface/order/order-interface";
import {PendientesList} from "@/app/dashboard/comprobantes/PendientesList";
import {ComprobantesTable} from "@/app/dashboard/comprobantes/ComprobantesTable";
import {ComprobantesStats} from "@/app/dashboard/comprobantes/ComprobantesStats";
import {GuiasList} from "@/app/dashboard/comprobantes/GuiasList";
import {InvoiceModal} from "@/app/dashboard/comprobantes/modals/InvoiceModal";
import {CancelModal} from "@/app/dashboard/comprobantes/modals/CancelModal";
import {PdfViewerModal} from "@/app/dashboard/comprobantes/modals/PdfViewerModal";
import {ErrorModal} from "@/app/dashboard/comprobantes/modals/ErrorModal";
import {GenerarGuiasModal} from "@/app/dashboard/comprobantes/modals/generar-guias-modal";
import {Sequential} from "@/app/dashboard/configuraciones/page";

export default function ComprobantesPage() {
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([])
  const [pedidosPendientes, setPedidosPendientes] = useState<Pedido[]>([])
  const [guiasRemision, setGuiasRemision] = useState<GuiaRemision[]>([])

  const [loadingComprobantes, setLoadingComprobantes] = useState(false)
  const [loadingPedidos, setLoadingPedidos] = useState(false)
  const [loadingGuias, setLoadingGuias] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const today = new Date()
  const tomorrow = addDays(today, 1)
  const [filters, setFilters] = useState({
    tipo: "-1",
    estado: 4,
    fechaDesde: format(today, 'yyyy-MM-dd'),
    fechaHasta: format(tomorrow, 'yyyy-MM-dd')
  })
  const [filtersGuias, setFiltersGuias] = useState({
    fechaDesde: format(today, 'yyyy-MM-dd'),
    fechaHasta: format(tomorrow, 'yyyy-MM-dd')
  })

  const [showGuiasModal, setShowGuiasModal] = useState(false)
  const [isProcessingGuias, setIsProcessingGuias] = useState(false)

  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceType, setInvoiceType] = useState("1")
  const [isProcessingInvoice, setIsProcessingInvoice] = useState(false)

  const [isCancelling, setIsCancelling] = useState(false)
  const [comprobanteToCancel, setComprobanteToCancel] = useState<Comprobante | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)

  const [showPdfModal, setShowPdfModal] = useState(false)
  const [currentPdfUrl, setCurrentPdfUrl] = useState("")

  const [showErrorModal, setShowErrorModal] = useState(false)
  const [selectedGuiaError, setSelectedGuiaError] = useState<GuiaRemision | null>(null)

  const [tiposComprobante, setTiposComprobante] = useState<Sequential[]>([])
  const [sunatTransacciones, setSunatTransacciones] = useState<SunatTransaccion[]>([])
  const [tipoDocsSunat, setTipoDocsSunat] = useState<TipoDocSunat[]>([])
  const [sunatTransaction, setSunatTransaction] = useState("")
  const [tipoSunat, setTipoSunat] = useState("")

  const auth = useAuth()

  const fetchComprobantes = async () => {
    try {
      setLoadingComprobantes(true)
      let url = `/pedidos/comprobantes?`
      const params = new URLSearchParams()
      if (auth.user?.idRol === 1) params.append('vendedor', auth.user?.codigo || '')
      if (filters.tipo !== '-1') params.append('tipoDoc', filters.tipo)
      if (filters.fechaDesde) params.append('fechaDesde', filters.fechaDesde)
      if (filters.fechaHasta) params.append('fechaHasta', filters.fechaHasta)
      if (searchQuery) params.append('busqueda', searchQuery)
      url += params.toString()

      const response = await apiClient.get(url)
      setComprobantes(response.data.data.data)
    } catch (error) {
      console.error("Error fetching comprobantes:", error)
      toast({ title: "Error", description: "No se pudieron cargar los comprobantes", variant: "destructive" })
    } finally {
      setLoadingComprobantes(false)
    }
  }

  const fetchGuiasRemision = async () => {
    try {
      setLoadingGuias(true)
      let url = `/pedidos/guiasEmitidas?`
      const params = new URLSearchParams()
      if (auth.user?.idRol === 1) params.append('vendedor', auth.user?.codigo || '')
      if (filtersGuias.fechaDesde) params.append('fechaDesde', filtersGuias.fechaDesde)
      if (filtersGuias.fechaHasta) params.append('fechaHasta', filtersGuias.fechaHasta)
      if (searchQuery) params.append('busqueda', searchQuery)
      url += params.toString()

      const response = await apiClient.get(url)
      setGuiasRemision(response.data.data.data || [])
    } catch (error) {
      console.error("Error fetching guías:", error)
      toast({ title: "Error", description: "No se pudieron cargar las guías", variant: "destructive" })
    } finally {
      setLoadingGuias(false)
    }
  }

  const fetchPedidosPendientes = async () => {
    try {
      setLoadingPedidos(true)
      const response = await apiClient.get(`/pedidos/porFacturar?busqueda=${encodeURIComponent(searchQuery)}&estado=4`)
      setPedidosPendientes(response.data.data.data)
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({ title: "Error", description: "No se pudieron cargar los pedidos pendientes", variant: "destructive" })
    } finally {
      setLoadingPedidos(false)
    }
  }

  useEffect(() => {
    fetchComprobantes()
    fetchPedidosPendientes()
    if (filtersGuias.fechaDesde && filtersGuias.fechaHasta) fetchGuiasRemision()
  }, [searchQuery, filters, filtersGuias])

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [tiposResponse, transResponse, docsSunat] = await Promise.all([
          // apiClient.get('/pedidos/tiposCompr'),
          apiClient.get('/admin/listar/secuenciales'),
          apiClient.get('/pedidos/sunatTrans'),
          apiClient.get('/pedidos/tipoDocSunat'),
        ])

        setTiposComprobante(tiposResponse.data.data)
        setSunatTransacciones(transResponse.data.data.data)
        setTipoDocsSunat(docsSunat.data.data.data)

        if (tiposResponse.data.data?.length > 0) setInvoiceType(tiposResponse.data.data[0].tipo)
        if (transResponse.data.data.data?.length > 0) setSunatTransaction(transResponse.data.data.data[0].idTransaction.toString())
        if (docsSunat.data.data.data?.length > 0) handleInvoiceType(tiposResponse.data.data[0].tipo)
      } catch (error) {
        console.error("Error catalogs:", error)
        toast({ title: "Error", description: "Error cargando catálogos", variant: "destructive" })
      }
    }
    fetchCatalogs()
  }, [])

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleFilterGuiaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFiltersGuias(prev => ({ ...prev, [name]: value }))
  }

  const handleInvoiceOrder = (pedido: Pedido) => {
    setSelectedOrder(pedido)
    setShowInvoiceModal(true)
  }

  const handleInvoiceType = (tipo: string) => {
    setInvoiceType(tipo)
    if (tipo === '1') {
      setTipoSunat('6')
    } else if (tipo === '3') {
      setTipoSunat('1')
    }
  }

  const handleConfirmInvoice = async (guiasSeleccionadas: GuiaReferencia[] = []) => {
    setIsProcessingInvoice(true)
    try {
      const tipoComprobante = tiposComprobante.find(t => t.tipo === invoiceType)
      const transaccionSunat = sunatTransacciones.find(t => t.idTransaction.toString() === sunatTransaction)
      const tipoSunatT = tipoDocsSunat.find(t => t.codigo === tipoSunat)

      if(!selectedOrder) return

      const documentosReferenciados = guiasSeleccionadas.map(guia => ({
        COD_TIP_DOC_REF: guia.tipo_comprobante,
        NUM_SERIE_CPE_REF: guia.serie,
        NUM_CORRE_CPE_REF: guia.numero
      }))

      const response = await apiClient.post(
          `/pedidos/generateCompr?nroPedido=${selectedOrder.nroPedido}&tipoCompr=${tipoComprobante?.tipo}&sunatTrans=${transaccionSunat?.idTransaction}&tipoDocSunat=${tipoSunatT?.codigo}&prefijo=${tipoComprobante?.prefijo}`,
          {
            docs_referenciado: documentosReferenciados
          }
      )

      if (response.data.success) {
        toast({ title: "Éxito", description: "Comprobante generado correctamente", variant: "default" })
        fetchComprobantes()
        fetchPedidosPendientes()
      } else {
        toast({ title: "Error", description: response.data.message || "Error al generar", variant: "destructive" })
      }
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Error de servidor al generar comprobante", variant: "destructive" })
    } finally {
      setIsProcessingInvoice(false)
      setShowInvoiceModal(false)
    }
  }

  const handleCancelInvoice = (comprobante: Comprobante) => {
    setComprobanteToCancel(comprobante)
    setShowCancelModal(true)
  }

  const confirmCancelInvoice = async (motivo: string) => {
    if (!comprobanteToCancel) return
    setIsCancelling(true)
    try {
      const response = await apiClient.post(`/pedidos/anularCompr?idCabecera=${comprobanteToCancel.idComprobanteCab}&tipoCompr=${comprobanteToCancel.tipo_comprobante}&nroPedido=${comprobanteToCancel.nroPedido}`, {
        motivo: motivo
      })

      if (response.data.success) {
        toast({ title: "Éxito", description: "Comprobante anulado correctamente", variant: "default" })
        fetchComprobantes()
        setShowCancelModal(false)
      } else {
        toast({ title: "Error", description: response.data.message || "No se pudo anular", variant: "destructive" })
      }
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Error de servidor al anular", variant: "destructive" })
    } finally {
      setIsCancelling(false)
    }
  }

  const handleGenerarGuias = async () => {
    setIsProcessingGuias(true)
    try {
      toast({ title: "Éxito", description: "Guías generadas", variant: "default" })
      setShowGuiasModal(false)
    } catch (error) {
      toast({ title: "Error", description: "Error generando guías", variant: "destructive" })
    } finally {
      setIsProcessingGuias(false)
    }
  }

  const handleViewPdf = (url: string) => {
    setCurrentPdfUrl(url)
    setShowPdfModal(true)
  }

  const handleViewPdfGuia = (base64: string) => {
    setCurrentPdfUrl(`data:application/pdf;base64,${base64}`)
    setShowPdfModal(true)
  }

  const handleOpenErrorModal = (guia: GuiaRemision) => {
    setSelectedGuiaError(guia)
    setShowErrorModal(true)
  }

  return (
      <div className="grid gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gestión de Comprobantes</h1>
          <p className="text-gray-500">Administración de facturas, boletas y notas electrónicas</p>
        </div>

        <Tabs defaultValue={auth.user?.idRol !== 1 ? 'pendientes' : 'comprobantes'} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {auth.user?.idRol !== 1 && (
                <TabsTrigger value="pendientes" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Pedidos por Facturar</span>
                  <span className="sm:hidden">Por Facturar</span>
                  <Badge className="bg-red-100 text-red-800 text-xs ml-1">{pedidosPendientes.length}</Badge>
                </TabsTrigger>
            )}
            <TabsTrigger value="comprobantes" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Comprobantes Emitidos</span>
              <span className="sm:hidden">Comp. Emitidos</span>
            </TabsTrigger>
            <TabsTrigger value="guias" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Truck className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Guías</span>
              <span className="sm:hidden">Guías</span>
            </TabsTrigger>
          </TabsList>

          {auth.user?.idRol !== 1 && (
              <TabsContent value="pendientes" className="space-y-4">
                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg text-orange-600 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" /> Pendientes por Facturar
                    </CardTitle>
                    <CardDescription>Estos pedidos están completados y listos para ser facturados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PendientesList pedidos={pedidosPendientes} loading={loadingPedidos} onInvoice={handleInvoiceOrder} />
                  </CardContent>
                </Card>
              </TabsContent>
          )}

          <TabsContent value="comprobantes" className="space-y-4">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Fecha desde</Label>
                      <Input type="date" className="bg-white" name="fechaDesde" value={filters.fechaDesde} onChange={handleFilterChange} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Fecha hasta</Label>
                      <Input type="date" className="bg-white" name="fechaHasta" value={filters.fechaHasta} onChange={handleFilterChange} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Tipo de comprobante</Label>
                      <Select value={filters.tipo} onValueChange={(value) => setFilters(prev => ({ ...prev, tipo: value }))}>
                        <SelectTrigger className="text-xs sm:text-sm"><SelectValue placeholder="Todos los tipos" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-1">Todos los tipos</SelectItem>
                          {tiposComprobante.map((tipo) => (<SelectItem key={tipo.tipo} value={tipo.tipo}>{tipo.prefijo} - {tipo.descripcion}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Buscar</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
                        <Input placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 sm:pl-10 text-xs sm:text-sm" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={fetchComprobantes} disabled={loadingComprobantes} className="flex items-center gap-2">
                      {loadingComprobantes ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Buscar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ComprobantesTable
                comprobantes={comprobantes}
                loading={loadingComprobantes}
                tiposComprobante={tiposComprobante}
                onViewPdf={handleViewPdf}
                onCancel={handleCancelInvoice}
            />
            <ComprobantesStats comprobantes={comprobantes} />
          </TabsContent>

          <TabsContent value="guias" className="space-y-4">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Fecha desde</Label>
                      <Input type="date" className="bg-white" name="fechaDesde" value={filtersGuias.fechaDesde} onChange={handleFilterGuiaChange} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Fecha hasta</Label>
                      <Input type="date" className="bg-white" name="fechaHasta" value={filtersGuias.fechaHasta} onChange={handleFilterGuiaChange} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Buscar</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
                        <Input placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 sm:pl-10 text-xs sm:text-sm" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button onClick={() => { setSelectedOrder(null); setShowGuiasModal(true) }} variant="outline">
                      <Truck className="mr-2 h-4 w-4" /> Generar Guías
                    </Button>
                    <Button onClick={fetchGuiasRemision} disabled={loadingGuias} className="flex items-center gap-2">
                      {loadingGuias ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Buscar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <GuiasList
                guias={guiasRemision}
                loading={loadingGuias}
                onViewPdf={handleViewPdfGuia}
                onErrorView={handleOpenErrorModal}
            />
          </TabsContent>
        </Tabs>

        <InvoiceModal
            open={showInvoiceModal} onOpenChange={setShowInvoiceModal} selectedOrder={selectedOrder}
            tiposComprobante={tiposComprobante} sunatTransacciones={sunatTransacciones} tipoDocsSunat={tipoDocsSunat}
            invoiceType={invoiceType} setInvoiceType={handleInvoiceType} sunatTransaction={sunatTransaction} setSunatTransaction={setSunatTransaction}
            tipoSunat={tipoSunat} setTipoSunat={setTipoSunat} isProcessing={isProcessingInvoice} onConfirm={handleConfirmInvoice}
        />
        <CancelModal
            open={showCancelModal}
            onOpenChange={setShowCancelModal}
            comprobante={comprobanteToCancel}
            tiposComprobante={tiposComprobante}
            isCancelling={isCancelling}
            onConfirm={confirmCancelInvoice}
        />
        <PdfViewerModal open={showPdfModal} onOpenChange={setShowPdfModal} pdfUrl={currentPdfUrl} />
        <ErrorModal open={showErrorModal} onOpenChange={setShowErrorModal} guia={selectedGuiaError} />
        {showGuiasModal && (
            <GenerarGuiasModal
                open={showGuiasModal} onOpenChange={setShowGuiasModal} isProcessing={isProcessingGuias} onGenerarGuias={handleGenerarGuias}
                pedidoPreseleccionado={selectedOrder} pedidosDisponibles={pedidosPendientes}
            />
        )}
      </div>
  )
}