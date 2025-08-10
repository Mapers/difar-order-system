'use client'

import { useState, useEffect } from "react"
import {
  Search,
  Download,
  Eye,
  FileText,
  Plus,
  MoreHorizontal,
  Receipt,
  Package,
  User,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Mail,
  MessageSquare,
  AlertTriangle,
  Loader2, Truck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, parseISO } from "date-fns"
import apiClient from "@/app/api/client"
import {useAuth} from "@/context/authContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { DatePicker } from "@/components/ui/date-picker"
import {GenerarGuiasModal} from "@/app/dashboard/comprobantes/generar-guias-modal";

interface Comprobante {
  idComprobanteCab: number
  nroPedido: number
  fecha_emision: string
  serie: string
  numero: string
  cliente_numdoc: string
  cliente_denominacion: string
  moneda: number
  total: string
  tipo_comprobante: number
  anulado: boolean
  enlace: string
  enlace_pdf: string
  enlace_cdr: string
  enlace_xml: string
}

interface GuiaRemision {
  idGuiaRemCab: number
  nroPedido: number
  fecha_emision: string
  serie: string
  numero: string
  cliente_num_doc: string
  cliente_denominacion: string
  peso_bruto_total: string
  tipo_comprobante: number
  anulado: boolean
  enlace: string
  enlace_pdf: string
  enlace_cdr: string
  enlace_xml: string
}

interface TipoComprobante {
  idTipoComprobante: number;
  descripcion: string;
  prefijoSerie: string;
}

interface SunatTransaccion {
  idTransaction: number;
  descripcion: string;
}

interface TipoDocSunat {
  codigo: string;
  descripcion: string;
}

export interface Pedido {
  idPedidocab: number
  nroPedido: string
  fechaPedido: string
  codigoCliente: string
  nombreCliente: string
  condicionPedido: string
  RUC: string
  codigoVendedor: string
  is_migrado: string
  estadodePedido: number
  nombreVendedor: string
  totalPedido: string
  monedaPedido: string
  cantidadPedidos: number
  direccionCliente: string
}

export default function ComprobantesPage() {
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([])
  const [pedidosPendientes, setPedidosPendientes] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingComprobantes, setLoadingComprobantes] = useState(false)
  const [loadingPedidos, setLoadingPedidos] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    tipo: "-1",
    estado: 4,
    fechaDesde: format(new Date(), 'yyyy-MM-dd'),
    fechaHasta: format(new Date(), 'yyyy-MM-dd')
  })
  const [guiasRemision, setGuiasRemision] = useState<GuiaRemision[]>([]);
  const [loadingGuias, setLoadingGuias] = useState(false);
  const [filtersGuias, setFiltersGuias] = useState({
    fechaDesde: format(new Date(), 'yyyy-MM-dd'),
    fechaHasta: format(new Date(), 'yyyy-MM-dd')
  });
  const auth = useAuth();
  const [showGuiasModal, setShowGuiasModal] = useState(false)
  const [isProcessingGuias, setIsProcessingGuias] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Pedido>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceType, setInvoiceType] = useState("01")
  const [isProcessingInvoice, setIsProcessingInvoice] = useState(false)
  const [tiposComprobante, setTiposComprobante] = useState<TipoComprobante[]>([])
  const [sunatTransacciones, setSunatTransacciones] = useState<SunatTransaccion[]>([])
  const [tipoDocsSunat, setTipoDocsSunat] = useState<TipoDocSunat[]>([])
  const [sunatTransaction, setSunatTransaction] = useState("")
  const [tipoSunat, setTipoSunat] = useState("")
  const [isCancelling, setIsCancelling] = useState(false)
  const [comprobanteToCancel, setComprobanteToCancel] = useState<Comprobante | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)

  const [showPdfModal, setShowPdfModal] = useState(false)
  const [currentPdfUrl, setCurrentPdfUrl] = useState("")

  const fetchComprobantes = async () => {
    try {
      setLoadingComprobantes(true)
      let url = `/pedidos/comprobantes?`

      const params = new URLSearchParams()

      if (auth.user?.idRol === 1) {
        params.append('vendedor', auth.user?.codigo || '')
      }
      if (filters.tipo !== '-1') {
        params.append('tipoDoc', filters.tipo)
      }
      if (filters.fechaDesde) {
        params.append('fechaDesde', filters.fechaDesde)
      }
      if (filters.fechaHasta) {
        params.append('fechaHasta', filters.fechaHasta)
      }
      if (searchQuery) {
        params.append('busqueda', searchQuery)
      }

      url += params.toString()

      const response = await apiClient.get(url)
      const { data: { data } } = response.data

      setComprobantes(data)
    } catch (error) {
      console.error("Error fetching comprobantes:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los comprobantes",
        variant: "destructive"
      })
    } finally {
      setLoadingComprobantes(false)
      setLoading(false)
    }
  }

  const fetchGuiasRemision = async () => {
    try {
      setLoadingGuias(true);
      let url = `/pedidos/guiasEmitidas?`;

      const params = new URLSearchParams();

      if (auth.user?.idRol === 1) {
        params.append('vendedor', auth.user?.codigo || '')
      }
      if (filtersGuias.fechaDesde) {
        params.append('fechaDesde', filtersGuias.fechaDesde);
      }
      if (filtersGuias.fechaHasta) {
        params.append('fechaHasta', filtersGuias.fechaHasta);
      }
      if (searchQuery) {
        params.append('busqueda', searchQuery);
      }

      url += params.toString();

      const response = await apiClient.get(url);
      setGuiasRemision(response.data.data.data || []);
    } catch (error) {
      console.error("Error fetching guías de remisión:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las guías de remisión",
        variant: "destructive"
      });
    } finally {
      setLoadingGuias(false);
    }
  };

  const fetchPedidosPendientes = async () => {
    try {
      setLoadingPedidos(true)
      let url = `/pedidos/filter?busqueda=${encodeURIComponent(searchQuery)}&estado=4`

      const response = await apiClient.get(url)
      const { data: { data } } = response.data

      setPedidosPendientes(data)
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los pedidos pendientes",
        variant: "destructive"
      })
    } finally {
      setLoadingPedidos(false)
      setLoading(false)
    }
  }

  const handleGenerarGuias = async () => {
    setIsProcessingGuias(true)
    try {
      // Lógica para generar guías
      // await apiClient.post(...)

      toast({
        title: "Éxito",
        description: "Guías generadas correctamente",
        variant: "default"
      })
      setShowGuiasModal(false)
    } catch (error) {
      console.error("Error generando guías:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al generar las guías",
        variant: "destructive"
      })
    } finally {
      setIsProcessingGuias(false)
    }
  }

  useEffect(() => {
    fetchComprobantes()
    fetchPedidosPendientes()
  }, [searchQuery, filters])

  useEffect(() => {
    if (filtersGuias.fechaDesde && filtersGuias.fechaHasta) {
      fetchGuiasRemision();
    }
  }, [searchQuery, filtersGuias.fechaDesde, filtersGuias.fechaHasta]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tiposResponse, transResponse, docsSunat] = await Promise.all([
          apiClient.get('/pedidos/tiposCompr'),
          apiClient.get('/pedidos/sunatTrans'),
          apiClient.get('/pedidos/tipoDocSunat'),
        ]);

        setTiposComprobante(tiposResponse.data.data.data);
        setSunatTransacciones(transResponse.data.data.data);
        setTipoDocsSunat(docsSunat.data.data.data);

        if (tiposResponse.data.data.data && tiposResponse.data.data.data.length > 0) {
          setInvoiceType(tiposResponse.data.data.data[0].idTipoComprobante.toString());
        }

        if (transResponse.data.data.data && transResponse.data.data.data.length > 0) {
          setSunatTransaction(transResponse.data.data.data[0].idTransaction.toString());
        }

        if (docsSunat.data.data.data && docsSunat.data.data.data.length > 0) {
          setTipoSunat(docsSunat.data.data.data[0].codigo);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los tipos de comprobante",
          variant: "destructive"
        })
      }
    };

    fetchData();
  }, []);

  const handleDateChange = (date: Date | undefined, field: 'fechaDesde' | 'fechaHasta') => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd')
      setFilters(prev => ({ ...prev, [field]: formattedDate }))
    } else {
      setFilters(prev => ({ ...prev, [field]: '' }))
    }
  }

  const getTipoComprobante = (tipo: number) => {
    const tipoObj = tiposComprobante.find(t => t.idTipoComprobante === tipo)
    return tipoObj ? tipoObj.descripcion : "Desconocido"
  }

  const handleViewPdf = (pdfUrl: string) => {
    setCurrentPdfUrl(pdfUrl)
    setShowPdfModal(true)
  }

  const getEstadoBadge = (comprobante: Comprobante) => {
    if (comprobante.anulado) {
      return <Badge variant="destructive">Anulado</Badge>
    }
    return <Badge variant="success">Activo</Badge>
  }

  const getEstadoGuiaBadge = (guia: GuiaRemision) => {
    if (guia.anulado) {
      return <Badge variant="destructive">Anulado</Badge>
    }
    return <Badge variant="success">Activo</Badge>
  }

  const calculateTotals = () => {
    const facturas = comprobantes.filter(c => c.tipo_comprobante === 1 && !c.anulado)
    const boletas = comprobantes.filter(c => c.tipo_comprobante === 2 && !c.anulado)
    const notasCredito = comprobantes.filter(c => c.tipo_comprobante === 3 && !c.anulado)
    const notasDebito = comprobantes.filter(c => c.tipo_comprobante === 4 && !c.anulado)

    return {
      totalFacturas: facturas.reduce((sum, c) => sum + Number(c.total), 0),
      totalBoletas: boletas.reduce((sum, c) => sum + Number(c.total), 0),
      totalNotasCredito: notasCredito.reduce((sum, c) => sum + Number(c.total), 0),
      totalNotasDebito: notasDebito.reduce((sum, c) => sum + Number(c.total), 0),
    }
  }

  const totals = calculateTotals()

  const handleInvoiceOrder = (pedido: Pedido) => {
    setSelectedOrder(pedido)
    setShowInvoiceModal(true)
  }

  const handleConfirmInvoice = async () => {
    setIsProcessingInvoice(true);
    try {
      const tipoComprobante = tiposComprobante.find(
        t => t.idTipoComprobante.toString() === invoiceType
      )

      const transaccionSunat = sunatTransacciones.find(
        t => t.idTransaction.toString() === sunatTransaction
      )

      const tipoSunatT = tipoDocsSunat.find(
        t => t.codigo === tipoSunat
      )

      const response = await apiClient.post(
        `/pedidos/generateCompr?nroPedido=${selectedOrder.nroPedido}&tipoCompr=${tipoComprobante?.idTipoComprobante}&sunatTrans=${transaccionSunat?.idTransaction}&tipoDocSunat=${tipoSunatT?.codigo}`
      )

      if (response.data.success) {
        toast({
          title: "Éxito",
          description: "Comprobante generado correctamente",
          variant: "default"
        })
        fetchComprobantes();
        fetchPedidosPendientes();
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Error al generar comprobante",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error al generar comprobante:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al generar el comprobante",
        variant: "destructive"
      })
    } finally {
      setIsProcessingInvoice(false);
      setShowInvoiceModal(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleFilterGuiaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFiltersGuias(prev => ({ ...prev, [name]: value }))
  }

  const handleCancelInvoice = (comprobante: Comprobante) => {
    setComprobanteToCancel(comprobante)
    setShowCancelModal(true)
  }

  const confirmCancelInvoice = async () => {
    if (!comprobanteToCancel) return

    setIsCancelling(true)
    try {
      const response = await apiClient.post(
        `/pedidos/anularCompr?idCabecera=${comprobanteToCancel.idComprobanteCab}&tipoCompr=${comprobanteToCancel.tipo_comprobante}`,

      )

      if (response.data.success) {
        toast({
          title: "Éxito",
          description: "Comprobante anulado correctamente",
          variant: "default"
        })
        fetchComprobantes()
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Error al anular comprobante",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error al anular comprobante:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al anular el comprobante",
        variant: "destructive"
      })
    } finally {
      setIsCancelling(false)
      setShowCancelModal(false)
      setComprobanteToCancel(null)
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gestión de Comprobantes</h1>
            <p className="text-gray-500">Administración de facturas, boletas y notas electrónicas</p>
          </div>
        </div>
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
            <span className="hidden sm:inline">Guías Emitidas</span>
            <span className="sm:hidden">Guías Emitidas</span>
          </TabsTrigger>
        </TabsList>

        {auth.user?.idRol !== 1 && (
          <TabsContent value="pendientes" className="space-y-4">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg text-orange-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Pedidos Completados Pendientes por Facturar</span>
                  <span className="sm:hidden">Pedidos por Facturar</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-600">
                  Estos pedidos están completados y listos para ser facturados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPedidos ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : pedidosPendientes.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">¡Excelente!</h3>
                    <p className="text-gray-600">No hay pedidos pendientes por facturar</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pedidosPendientes.map((pedido) => (
                      <Card key={pedido.idPedidocab} className="border border-orange-200 bg-orange-50">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">{pedido.nroPedido}</h3>
                                <Badge className="bg-green-100 text-green-800 text-xs w-fit">
                                  <span className="hidden sm:inline">Completado - Listo para facturar</span>
                                  <span className="sm:hidden">Listo</span>
                                </Badge>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button
                                  onClick={() => handleInvoiceOrder(pedido)}
                                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2 w-full sm:w-auto"
                                  size="sm"
                                >
                                  <Receipt className="h-4 w-4" />
                                  <span className="hidden sm:inline">Facturar Ahora</span>
                                  <span className="sm:hidden">Facturar</span>
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                                <span className="text-gray-600">Fecha:</span>
                                <span className="font-medium">{format(parseISO(pedido.fechaPedido), "dd/MM/yyyy")}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                                <span className="text-gray-600">Cliente:</span>
                                <span className="font-medium truncate">{pedido.nombreCliente}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                                <span className="text-gray-600">Total:</span>
                                <span className="font-bold text-green-600">
                                {pedido.monedaPedido === 'PEN' ? 'S/ ' : '$ '}
                                  {Number(pedido.totalPedido).toFixed(2)}
                              </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Package className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                                <span className="text-gray-600">Productos:</span>
                                {pedido.cantidadPedidos}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                              <div className="flex items-center gap-2">
                                <Receipt className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                                <span className="text-gray-600">Documento:</span>
                                <span className="font-medium">{pedido.codigoCliente}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                                <span className="text-gray-600">Condición:</span>
                                <span className="font-medium">{pedido.condicionPedido}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="font-medium text-blue-900 text-sm sm:text-base">
                              Total Pendiente por Facturar
                            </h4>
                            <p className="text-xs sm:text-sm text-blue-700">
                              {pedidosPendientes.length} pedidos completados
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-xl sm:text-2xl font-bold text-blue-900">
                              S/{pedidosPendientes.reduce((sum, p) => sum + Number(p.totalPedido), 0).toFixed(2)}
                            </p>
                            <p className="text-xs sm:text-sm text-blue-700">Valor total</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
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
                    <Input
                      id="fechaDesde"
                      type="date"
                      className="bg-white"
                      name="fechaDesde"
                      value={filters.fechaDesde}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Fecha hasta</Label>
                    <Input
                      id="fechaHasta"
                      type="date"
                      className="bg-white"
                      name="fechaHasta"
                      value={filters.fechaHasta}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Tipo de comprobante</Label>
                    <Select
                      value={filters.tipo}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, tipo: value }))}
                    >
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue placeholder="Todos los tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-1">Todos los tipos</SelectItem>
                        {tiposComprobante.map((tipo) => (
                          <SelectItem
                            key={tipo.idTipoComprobante}
                            value={tipo.idTipoComprobante.toString()}
                          >
                            {tipo.prefijoSerie} - {tipo.descripcion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Buscar cliente</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
                      <Input
                        placeholder="Buscar por nombre o documento..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 sm:pl-10 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={fetchComprobantes}
                    disabled={loadingComprobantes}
                    className="flex items-center gap-2"
                  >
                    {loadingComprobantes ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Buscar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {loadingComprobantes ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <div className="hidden lg:block">
                <Card className="bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Serie/Número
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Documento
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                      {comprobantes.length > 0 ? (
                        comprobantes.map((comprobante) => (
                          <tr key={comprobante.nroPedido} className="hover:bg-gray-50">
                            <td className="p-4 text-sm">
                              {format(parseISO(comprobante.fecha_emision), "dd/MM/yyyy")}
                            </td>
                            <td className="p-4 text-sm">
                              {getTipoComprobante(comprobante.tipo_comprobante)}
                            </td>
                            <td className="p-4 font-medium text-sm">
                              {comprobante.serie}-{comprobante.numero}
                            </td>
                            <td className="p-4">
                              <div className="font-medium text-sm">{comprobante.cliente_denominacion}</div>
                            </td>
                            <td className="p-4 text-sm">
                              {comprobante.cliente_numdoc}
                            </td>
                            <td className="p-4 font-medium text-sm">
                              {comprobante.moneda === 1 ? 'S/ ' : '$ '} {Number(comprobante.total).toFixed(2)}
                            </td>
                            <td className="p-4">
                              {getEstadoBadge(comprobante)}
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => handleViewPdf(comprobante.enlace)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50">
                                  <Download className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    {/*<DropdownMenuItem className="text-blue-600">*/}
                                    {/*  <Eye className="mr-2 h-4 w-4" />*/}
                                    {/*  Ver Detalle*/}
                                    {/*</DropdownMenuItem>*/}
                                    {/*<DropdownMenuItem className="text-green-600">*/}
                                    {/*  <Download className="mr-2 h-4 w-4" />*/}
                                    {/*  Descargar PDF*/}
                                    {/*</DropdownMenuItem>*/}
                                    {/*<DropdownMenuItem className="text-green-600">*/}
                                    {/*  <Send className="mr-2 h-4 w-4" />*/}
                                    {/*  Enviar al Cliente*/}
                                    {/*</DropdownMenuItem>*/}
                                    {/*<DropdownMenuItem className="text-blue-600">*/}
                                    {/*  <Mail className="mr-2 h-4 w-4" />*/}
                                    {/*  Enviar por Email*/}
                                    {/*</DropdownMenuItem>*/}
                                    {!comprobante.anulado && (
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => handleCancelInvoice(comprobante)}
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Anular Comprobante
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-gray-500">
                            No se encontraron comprobantes
                          </td>
                        </tr>
                      )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              <div className="lg:hidden space-y-3">
                {comprobantes.length > 0 ? (
                  comprobantes.map((comprobante) => (
                    <Card key={comprobante.idComprobanteCab} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900">
                                  {getTipoComprobante(comprobante.tipo_comprobante)} {comprobante.serie}-{comprobante.numero}
                                </span>
                                {getEstadoBadge(comprobante)}
                              </div>
                              <p className="text-sm text-gray-600">
                                {format(parseISO(comprobante.fecha_emision), "dd/MM/yyyy")}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                {comprobante.moneda === 1 ? 'S/ ' : '$ '} {Number(comprobante.total).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">Total</p>
                            </div>
                          </div>

                          <div className="border-t pt-3">
                            <p className="font-medium text-gray-900 truncate">{comprobante.cliente_denominacion}</p>
                            <p className="text-sm text-gray-600">{comprobante.cliente_numdoc}</p>
                          </div>

                          <div className="border-t pt-3">
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs bg-transparent"
                                onClick={() => handleViewPdf(comprobante.enlace)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Ver
                              </Button>
                              <Button variant="outline" size="sm" className="text-xs bg-transparent">
                                <Download className="h-3 w-3 mr-1" />
                                PDF
                              </Button>
                              <Button variant="outline" size="sm" className="text-xs bg-transparent">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                WhatsApp
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-xs bg-transparent">
                                    <MoreHorizontal className="h-3 w-3 mr-1" />
                                    Más
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  {/*<DropdownMenuItem className="text-green-600">*/}
                                  {/*  <Send className="mr-2 h-4 w-4" />*/}
                                  {/*  Enviar al cliente*/}
                                  {/*</DropdownMenuItem>*/}
                                  {/*<DropdownMenuItem className="text-blue-600">*/}
                                  {/*  <Mail className="mr-2 h-4 w-4" />*/}
                                  {/*  Enviar por email*/}
                                  {/*</DropdownMenuItem>*/}
                                  {!comprobante.anulado && (
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => handleCancelInvoice(comprobante)}
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Anular
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No se encontraron comprobantes
                  </div>
                )}
              </div>

              <Card className="bg-white shadow-sm">
                <CardContent className="p-3 sm:p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-blue-600 font-medium text-xs sm:text-sm">
                        TOTAL FACTURAS
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-700">
                        S/{totals.totalFacturas.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-green-600 font-medium text-xs sm:text-sm">
                        TOTAL BOLETAS
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-green-700">
                        S/{totals.totalBoletas.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-purple-600 font-medium text-xs sm:text-sm">
                        TOTAL NOTAS CRÉDITO
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-purple-700">
                        S/{totals.totalNotasCredito.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <p className="text-orange-600 font-medium text-xs sm:text-sm">
                        TOTAL NOTAS DÉBITO
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-orange-700">
                        S/{totals.totalNotasDebito.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="guias" className="space-y-4">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Fecha desde</Label>
                    <Input
                      id="fechaDesde"
                      type="date"
                      className="bg-white"
                      name="fechaDesde"
                      value={filtersGuias.fechaDesde}
                      onChange={handleFilterGuiaChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Fecha hasta</Label>
                    <Input
                      id="fechaHasta"
                      type="date"
                      className="bg-white"
                      name="fechaHasta"
                      value={filtersGuias.fechaHasta}
                      onChange={handleFilterGuiaChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Buscar cliente/guía</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
                      <Input
                        placeholder="Buscar por nombre, documento o número..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 sm:pl-10 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={fetchGuiasRemision}
                    disabled={loadingGuias}
                    className="flex items-center gap-2"
                  >
                    {loadingGuias ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Buscar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {loadingGuias ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <div className="hidden lg:block">
                <Card className="bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Guía
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Documento
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                      {guiasRemision.length > 0 ? (
                        guiasRemision.map((guia) => (
                          <tr key={guia.idGuiaRemCab} className="hover:bg-gray-50">
                            <td className="p-4 text-sm">
                              {format(parseISO(guia.fecha_emision), "dd/MM/yyyy")}
                            </td>
                            <td className="p-4 font-medium text-sm">
                              {guia.serie}-{guia.numero}
                            </td>
                            <td className="p-4">
                              <div className="font-medium text-sm">{guia.cliente_denominacion}</div>
                            </td>
                            <td className="p-4 text-sm">
                              {guia.cliente_num_doc}
                            </td>
                            <td className="p-4">
                              {getEstadoGuiaBadge(guia.tipo_comprobante)}
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => handleViewPdf(guia.enlace_pdf)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem
                                      className="text-blue-600"
                                      onClick={() => handleViewPdf(guia.enlace_pdf)}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      Ver PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-green-600"
                                      onClick={() => window.open(guia.enlace_pdf, '_blank')}
                                    >
                                      <Download className="mr-2 h-4 w-4" />
                                      Descargar PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-green-600"
                                      onClick={() => window.open(guia.enlace_xml, '_blank')}
                                    >
                                      <Download className="mr-2 h-4 w-4" />
                                      Descargar XML
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-gray-500">
                            No se encontraron guías de remisión
                          </td>
                        </tr>
                      )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              <div className="lg:hidden space-y-3">
                {guiasRemision.length > 0 ? (
                  guiasRemision.map((guia) => (
                    <Card key={guia.idGuiaRemCab} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {guia.serie}-{guia.numero}
                        </span>
                                <Badge variant={guia.estado === 'ACTIVO' ? 'success' : 'destructive'}>
                                  {guia.estado}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                {format(parseISO(guia.fecha_emision), "dd/MM/yyyy")}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">{guia.motivo_traslado}</p>
                            </div>
                          </div>

                          <div className="border-t pt-3">
                            <p className="font-medium text-gray-900 truncate">{guia.cliente_denominacion}</p>
                            <p className="text-sm text-gray-600">{guia.cliente_numdoc}</p>
                          </div>

                          <div className="border-t pt-3">
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs bg-transparent"
                                onClick={() => handleViewPdf(guia.enlace_pdf)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Ver PDF
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs bg-transparent"
                                onClick={() => window.open(guia.enlace_pdf, '_blank')}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Descargar
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-xs bg-transparent">
                                    <MoreHorizontal className="h-3 w-3 mr-1" />
                                    Más
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem
                                    className="text-green-600"
                                    onClick={() => window.open(guia.enlace_xml, '_blank')}
                                  >
                                    <Download className="mr-2 h-4 w-4" />
                                    Descargar XML
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No se encontraron guías de remisión
                  </div>
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Confirmar Facturación
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Datos del Pedido</h4>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Pedido:</strong> {selectedOrder.nroPedido}
                  </p>
                  <p>
                    <strong>Cliente:</strong> {selectedOrder.nombreCliente}
                  </p>
                  <p>
                    <strong>Documento:</strong> {selectedOrder.codigoCliente}
                  </p>
                  <p>
                    <strong>Total:</strong> {selectedOrder.monedaPedido === 'PEN' ? 'S/ ' : '$ '}
                    {Number(selectedOrder.totalPedido).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipoComprobante" className="text-sm font-medium mb-2 block">
                    Tipo de Comprobante
                  </Label>
                  <Select
                    value={invoiceType}
                    onValueChange={setInvoiceType}
                    disabled={isProcessingInvoice}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo"/>
                    </SelectTrigger>
                    <SelectContent>
                      {tiposComprobante.map((tipo) => (
                        <SelectItem
                          key={tipo.idTipoComprobante}
                          value={tipo.idTipoComprobante.toString()}
                        >
                          {tipo.prefijoSerie} - {tipo.descripcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sunatTransaccion" className="text-sm font-medium mb-2 block">
                    Transacción SUNAT
                  </Label>
                  <Select
                    value={sunatTransaction}
                    onValueChange={setSunatTransaction}
                    disabled={isProcessingInvoice}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar transacción"/>
                    </SelectTrigger>
                    <SelectContent>
                      {sunatTransacciones.map((trans) => (
                        <SelectItem
                          key={trans.idTransaction}
                          value={trans.idTransaction.toString()}
                        >
                          {trans.descripcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tipoDocSunat" className="text-sm font-medium mb-2 block">
                    Tipo Doc.
                  </Label>
                  <Select
                    value={tipoSunat}
                    onValueChange={setTipoSunat}
                    disabled={isProcessingInvoice}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo documento"/>
                    </SelectTrigger>
                    <SelectContent>
                      {tipoDocsSunat.map((trans) => (
                        <SelectItem
                          key={trans.codigo}
                          value={trans.codigo}
                        >
                          {trans.descripcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>¿Confirmas la facturación?</strong>
                  <br/>
                  Se generará el comprobante electrónico para este pedido. Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowInvoiceModal(false)}
              disabled={isProcessingInvoice}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={() => {
                  // setShowInvoiceModal(false)
                  setShowGuiasModal(true)
                }}
                variant="outline"
                className="flex-1"
              >
                <Truck className="mr-2 h-4 w-4" />
                Generar Guías
              </Button>
              <Button
                onClick={handleConfirmInvoice}
                disabled={isProcessingInvoice || !invoiceType || !sunatTransaction}
                className="bg-green-600 hover:bg-green-700 flex-1"
              >
                {isProcessingInvoice ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Receipt className="mr-2 h-4 w-4" />
                    Confirmar Facturación
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Confirmar Anulación
            </DialogTitle>
          </DialogHeader>

          {comprobanteToCancel && (
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Datos del Comprobante</h4>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Tipo:</strong> {getTipoComprobante(comprobanteToCancel.tipo_comprobante)}
                  </p>
                  <p>
                    <strong>Serie/Número:</strong> {comprobanteToCancel.serie}-{comprobanteToCancel.numero}
                  </p>
                  <p>
                    <strong>Cliente:</strong> {comprobanteToCancel.cliente_denominacion}
                  </p>
                  <p>
                    <strong>Total:</strong> {comprobanteToCancel.moneda === 1 ? 'S/ ' : '$ '}
                    {Number(comprobanteToCancel.total).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  <strong>¿Estás seguro de anular este comprobante?</strong>
                  <br />
                  Esta acción no se puede deshacer y generará una nota de crédito si es necesario.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              disabled={isCancelling}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmCancelInvoice}
              disabled={isCancelling}
              variant="destructive"
              className="w-full sm:w-auto"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Anulando...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Confirmar Anulación
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showGuiasModal && (
        <GenerarGuiasModal
          open={showGuiasModal}
          onOpenChange={setShowGuiasModal}
          pedido={selectedOrder}
          isProcessing={isProcessingGuias}
          onGenerarGuias={handleGenerarGuias}
        />
      )}

      <Dialog open={showPdfModal} onOpenChange={setShowPdfModal}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Visualizador de Comprobante</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {currentPdfUrl ? (
              <iframe
                src={currentPdfUrl}
                className="w-full h-full border-0"
                title="Visualizador de PDF"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPdfModal(false)}
            >
              Cerrar
            </Button>
            <Button
              onClick={() => {
                window.open(currentPdfUrl, '_blank')
                setShowPdfModal(false)
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}