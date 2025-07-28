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
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import apiClient from "@/app/api/client"
import { Skeleton } from "@/components/ui/skeleton"
import {useAuth} from "@/context/authContext";

interface Comprobante {
  id: number
  fecha: string
  tipo: string
  serie: string
  numero: string
  rucDni: string
  cliente: string
  moneda: string
  total: number
  estado: string
  pagado: boolean
  enviado: boolean
  leido: boolean
  anulado: boolean
  productos: {
    descripcion: string
    cantidad: number
    precio: number
    total: number
  }[]
}

interface Pedido {
  idPedidocab: number
  nroPedido: string
  fechaPedido: string
  codigoCliente: string
  nombreCliente: string
  RUC: string
  codigoVendedor: string
  is_migrado: string
  estadodePedido: number
  nombreVendedor: string
  totalPedido: string
  monedaPedido: string
}

export default function ComprobantesPage() {
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([])
  const [pedidosPendientes, setPedidosPendientes] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    tipo: "todos",
    estado: 4,
    fechaDesde: "",
    fechaHasta: ""
  })
  const auth = useAuth();
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [monthFrom, setMonthFrom] = useState("01")
  const [yearFrom, setYearFrom] = useState("2024")
  const [monthTo, setMonthTo] = useState("12")
  const [yearTo, setYearTo] = useState("2024")

  const fetchComprobantes = async () => {
    try {
      setLoading(true)

      let url
      if (searchQuery) {
        url = `/comprobantes/search?query=${encodeURIComponent(searchQuery)}&page=${currentPage}`
      } else {
        url = `/comprobantes?page=${currentPage}&tipo=${filters.tipo}&estado=${filters.estado}`

        if (filters.fechaDesde && filters.fechaHasta) {
          url += `&fechaDesde=${filters.fechaDesde}&fechaHasta=${filters.fechaHasta}`
        }
      }

      const response = await apiClient.get(url)
      const { data: { data, pagination } } = response.data

      setComprobantes(data)
      setTotalPages(pagination.totalPages)
      setTotalItems(pagination.totalItems)
    } catch (error) {
      console.error("Error fetching comprobantes:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPedidosPendientes = async () => {
    try {
      setLoading(true)
      let url = `/pedidos/filter?busqueda=${encodeURIComponent(searchQuery)}&vendedor=${auth.user?.codigo}&estado=4`

      // if (filters.estado !== -1) {
      //   url += ``;
      // }

      const response = await apiClient.get(url)
      const { data: { data, pagination } } = response.data

      setPedidosPendientes(data)
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComprobantes()
    fetchPedidosPendientes()
  }, [currentPage, searchQuery, filters])

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
    setCurrentPage(1)
  }

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchComprobantes()
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const getTipoComprobante = (tipo: string) => {
    switch(tipo) {
      case "01": return "Factura"
      case "03": return "Boleta"
      case "07": return "Nota de Crédito"
      case "08": return "Nota de Débito"
      default: return "Desconocido"
    }
  }

  const getEstadoBadge = (comprobante: Comprobante) => {
    if (comprobante.anulado) {
      return <Badge className="bg-red-100 text-red-800">Anulado</Badge>
    }
    if (comprobante.leido) {
      return <Badge className="bg-green-100 text-green-800">Leído</Badge>
    }
    if (comprobante.enviado) {
      return <Badge className="bg-blue-100 text-blue-800">Enviado</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
  }

  const calculateTotals = () => {
    const facturas = comprobantes.filter(c => c.tipo === "01" && !c.anulado)
    const boletas = comprobantes.filter(c => c.tipo === "03" && !c.anulado)
    const notasCredito = comprobantes.filter(c => c.tipo === "07" && !c.anulado)
    const notasDebito = comprobantes.filter(c => c.tipo === "08" && !c.anulado)

    return {
      totalFacturas: facturas.reduce((sum, c) => sum + c.total, 0),
      totalBoletas: boletas.reduce((sum, c) => sum + c.total, 0),
      totalNotasCredito: notasCredito.reduce((sum, c) => sum + c.total, 0),
      totalNotasDebito: notasDebito.reduce((sum, c) => sum + c.total, 0),
    }
  }

  const totals = calculateTotals()

  const handleInvoiceOrder = (pedido: Pedido) => {
    // Implementar lógica de facturación
    console.log("Facturando pedido:", pedido.id)
  }

  // const clearFilters = () => {
  //   setSearchQuery("")
  //   setFilters({
  //     tipo: "todos",
  //     estado: "todos",
  //     fechaDesde: "",
  //     fechaHasta: ""
  //   })
  // }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gestión de Comprobantes</h1>
            <p className="text-gray-500">Administración de facturas, boletas y notas electrónicas</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Emitir comprobante</span>
              <span className="sm:hidden">Emitir</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-2 bg-transparent w-full sm:w-auto">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Descargar Excel</span>
              <span className="sm:hidden">Excel</span>
            </Button>
          </div>
        </div>

        {/*<div className="flex items-center justify-between">*/}
        {/*  <div className="text-sm text-gray-500">*/}
        {/*    Mostrando {comprobantes.length} de {totalItems} comprobantes*/}
        {/*  </div>*/}
        {/*  <Pagination>*/}
        {/*    <PaginationContent>*/}
        {/*      <PaginationItem>*/}
        {/*        <PaginationPrevious*/}
        {/*          onClick={handlePreviousPage}*/}
        {/*          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}*/}
        {/*        />*/}
        {/*      </PaginationItem>*/}
        {/*      <PaginationItem>*/}
        {/*        <span className="px-4 py-2 text-sm font-medium">*/}
        {/*          Página {currentPage} de {totalPages}*/}
        {/*        </span>*/}
        {/*      </PaginationItem>*/}
        {/*      <PaginationItem>*/}
        {/*        <PaginationNext*/}
        {/*          onClick={handleNextPage}*/}
        {/*          className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}*/}
        {/*        />*/}
        {/*      </PaginationItem>*/}
        {/*    </PaginationContent>*/}
        {/*  </Pagination>*/}
        {/*</div>*/}
      </div>

      <Tabs defaultValue="pendientes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pendientes" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Pedidos por Facturar</span>
            <span className="sm:hidden">Por Facturar</span>
            <Badge className="bg-red-100 text-red-800 text-xs ml-1">{pedidosPendientes.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="comprobantes" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Comprobantes Emitidos</span>
            <span className="sm:hidden">Emitidos</span>
          </TabsTrigger>
        </TabsList>

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
              {loading ? (
                Array.from({length: 3}).map((_, index) => (
                  <Card key={index} className="border border-gray-200 mb-4">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <Skeleton className="h-5 w-24 mb-1" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                          <Skeleton className="h-5 w-20" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                        <Skeleton className="h-8 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))
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
                              {/*<p className="text-xs text-gray-500 text-center">*/}
                              {/*  {pedido.. === "6" ? "Se generará Factura" : "Se generará Boleta"}*/}
                              {/*</p>*/}
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
                                {pedido.monedaPedido}
                                {Number(pedido.totalPedido).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                              <span className="text-gray-600">Productos:</span>
                              {/*<span className="font-medium">{pedido.productos}</span>*/}
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
                              {/*<span className="font-medium">{pedido.co}</span>*/}
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
                            S/{pedidosPendientes.reduce((sum, p) => sum + p.total, 0).toFixed(2)}
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

        <TabsContent value="comprobantes" className="space-y-4">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Desde</Label>
                    <Select value={monthFrom} onValueChange={setMonthFrom}>
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1).padStart(2, "0")}>
                            {format(new Date(2024, i, 1), "MMM")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Año</Label>
                    <Select value={yearFrom} onValueChange={setYearFrom}>
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Hasta</Label>
                    <Select value={monthTo} onValueChange={setMonthTo}>
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1).padStart(2, "0")}>
                            {format(new Date(2024, i, 1), "MMM")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Año</Label>
                    <Select value={yearTo} onValueChange={setYearTo}>
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 sm:col-span-1 lg:col-span-2 flex flex-col sm:flex-row gap-2">
                    <Button className="h-8 sm:h-9 bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm flex-1">
                      Filtrar
                    </Button>
                    <Button variant="outline" className="h-8 sm:h-9 bg-transparent text-xs sm:text-sm flex-1">
                      <Search className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">Buscar</span>
                      <span className="sm:hidden">Buscar</span>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Filtrar por tipo de Doc.</Label>
                    <Select
                      value={filters.tipo}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, tipo: value }))}
                    >
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue placeholder="Todos los tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los tipos</SelectItem>
                        <SelectItem value="01">01 - Factura</SelectItem>
                        <SelectItem value="03">03 - Boleta</SelectItem>
                        <SelectItem value="07">07 - Nota de Crédito</SelectItem>
                        <SelectItem value="08">08 - Nota de Débito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Buscar por entidad</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
                      <Input
                        placeholder="Buscar cliente..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 sm:pl-10 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Filtrar por estado</Label>
                    <Select
                      value={filters.estado}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, estado: value }))}
                    >
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue placeholder="Todos los estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los estados</SelectItem>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="enviado">Enviado</SelectItem>
                        <SelectItem value="leido">Leído</SelectItem>
                        <SelectItem value="anulado">Anulado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
                  {loading ? (
                    Array.from({length: 5}).map((_, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-4"><Skeleton className="h-4 w-[80px]" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-[80px]" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-[100px]" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-[150px]" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-[100px]" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-[80px]" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-[100px]" /></td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Skeleton className="h-8 w-8 rounded-md" />
                            <Skeleton className="h-8 w-8 rounded-md" />
                            <Skeleton className="h-8 w-8 rounded-md" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : comprobantes.length > 0 ? (
                    comprobantes.map((comprobante) => (
                      <tr key={comprobante.id} className="hover:bg-gray-50">
                        <td className="p-4 text-sm">
                          {format(parseISO(comprobante.fecha), "dd/MM/yyyy")}
                        </td>
                        <td className="p-4 text-sm">
                          {getTipoComprobante(comprobante.tipo)}
                        </td>
                        <td className="p-4 font-medium text-sm">
                          {comprobante.serie}-{comprobante.numero}
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-sm">{comprobante.cliente}</div>
                        </td>
                        <td className="p-4 text-sm">
                          {comprobante.rucDni}
                        </td>
                        <td className="p-4 font-medium text-sm">
                          {comprobante.moneda} {comprobante.total.toFixed(2)}
                        </td>
                        <td className="p-4">
                          {getEstadoBadge(comprobante)}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
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
                                <DropdownMenuItem className="text-blue-600">
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver Detalle
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-green-600">
                                  <Download className="mr-2 h-4 w-4" />
                                  Descargar PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-green-600">
                                  <Send className="mr-2 h-4 w-4" />
                                  Enviar al Cliente
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-blue-600">
                                  <Mail className="mr-2 h-4 w-4" />
                                  Enviar por Email
                                </DropdownMenuItem>
                                {!comprobante.anulado && (
                                  <DropdownMenuItem className="text-red-600">
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
            {loading ? (
              Array.from({length: 3}).map((_, index) => (
                <Card key={index} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <Skeleton className="h-5 w-24 mb-1" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-5 w-20" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : comprobantes.length > 0 ? (
              comprobantes.map((comprobante) => (
                <Card key={comprobante.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              {getTipoComprobante(comprobante.tipo)} {comprobante.serie}-{comprobante.numero}
                            </span>
                            {getEstadoBadge(comprobante)}
                          </div>
                          <p className="text-sm text-gray-600">
                            {format(parseISO(comprobante.fecha), "dd/MM/yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {comprobante.moneda} {comprobante.total.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">Total</p>
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <p className="font-medium text-gray-900 truncate">{comprobante.cliente}</p>
                        <p className="text-sm text-gray-600">{comprobante.rucDni}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Pagado:</span>
                          {comprobante.pagado ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Enviado:</span>
                          {comprobante.enviado ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" className="text-xs bg-transparent">
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
                              <DropdownMenuItem className="text-green-600">
                                <Send className="mr-2 h-4 w-4" />
                                Enviar al cliente
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-blue-600">
                                <Mail className="mr-2 h-4 w-4" />
                                Enviar por email
                              </DropdownMenuItem>
                              {!comprobante.anulado && (
                                <DropdownMenuItem className="text-red-600">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}