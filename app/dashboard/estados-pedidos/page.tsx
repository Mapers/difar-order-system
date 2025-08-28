'use client'

import { Button } from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Search,
  Eye,
  Package,
  Home,
  XCircle,
  Truck,
  MapPin, CheckCircle, Clock, Edit, FileText, MoreHorizontal, Download, Printer, Receipt
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {useEffect, useRef, useState} from "react"
import { Skeleton } from "@/components/ui/skeleton"
import apiClient from "@/app/api/client"
import {format, parseISO} from "date-fns";
import {fetchGetConditions, fetchGetStatus, fetchUpdateStatus, fetchUpdateStatusConfirm} from "@/app/api/takeOrders";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {Label} from "@/components/ui/label";
import {useAuth} from "@/context/authContext";
import Link from "next/link";
import {generateOrderPdf} from "@/lib/pdf";
import {TimelineModal} from "@/app/dashboard/estados-pedidos/timeline-modal";

export interface Pedido {
  idPedidocab: number
  nroPedido: string
  fechaPedido: string
  nombreCliente: string
  nombreVendedor: string
  condicionPedido: string
  monedaPedido: string
  estadodePedido: number
  totalPedido: string
  notaPedido: string
  contactoPedido: string
  telefonoPedido: string
  direccionEntrega?: string
  referenciaDireccion?: string
  codigoCliente: string
}

export interface PedidoDet {
  idPedidodet: number
  idPedidocab: number
  codigoitemPedido: string
  iditemPedido?: string
  cantPedido: string
  precioPedido: string
  productoNombre: string
  productoUnidad: string
  isBonification?: boolean
  isEscale?: boolean
  appliedScale?: any
}

interface Status {
  nombre_estado: string
  id_estado_pedido: number
}

const ORDER_STATES = [
  {
    id: 1,
    name: "Pendiente",
    description: "Pedido registrado, sin validación ni asignación de stock.",
    documents: "Ninguno",
    icon: Clock,
    color: "bg-gray-100 text-gray-800",
    borderColor: "border-gray-300",
  },
  {
    id: 2,
    name: "Validado / Confirmado",
    description: "Se valida stock, cliente y condiciones de venta.",
    documents: "Ninguno",
    icon: CheckCircle,
    color: "bg-blue-100 text-blue-800",
    borderColor: "border-blue-300",
  },
  {
    id: 3,
    name: "En Preparación",
    description: "Se separa el stock y se alista el pedido físicamente.",
    documents: "Ninguno (solo preparación)",
    icon: Package,
    color: "bg-yellow-100 text-yellow-800",
    borderColor: "border-yellow-300",
  },
  {
    id: 4,
    name: "Listo para Despacho",
    description: "El pedido está completamente preparado y aquí se generan los documentos:",
    documents: "Guía → primero / Factura/Boleta → después de la guía",
    icon: Truck,
    color: "bg-orange-100 text-orange-800",
    borderColor: "border-orange-300",
  },
  {
    id: 5,
    name: "Enviado a Reparto",
    description: "El pedido se entrega al transportista. El repartidor lleva la guía y la factura.",
    documents: "Ya emitidos antes",
    icon: MapPin,
    color: "bg-purple-100 text-purple-800",
    borderColor: "border-purple-300",
  },
  {
    id: 6,
    name: "En Reparto / En Camino",
    description: "Pedido en tránsito.",
    documents: "Ya emitidos antes",
    icon: Truck,
    color: "bg-indigo-100 text-indigo-800",
    borderColor: "border-indigo-300",
  },
  {
    id: 7,
    name: "Entregado",
    description: "Pedido entregado al cliente.",
    documents: "Ya emitidos antes",
    icon: Home,
    color: "bg-green-100 text-green-800",
    borderColor: "border-green-300",
  },
  {
    id: 8,
    name: "Devuelto / Anulado",
    description: "Si el cliente no recibe o rechaza el pedido.",
    documents: "Nota de crédito, si aplica",
    icon: XCircle,
    color: "bg-red-100 text-red-800",
    borderColor: "border-red-300",
  },
]

export default function OrderStatusManagementPage() {
  const [orders, setOrders] = useState<Pedido[]>([])
  const [detalle, setDetalle] = useState<PedidoDet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    estado: -1,
  })
  const auth = useAuth()
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [states, setStates] = useState<Status[]>([])
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Pedido>(null)
  const [isChangeStateModalOpen, setIsChangeStateModalOpen] = useState(false)
  const [stateChangeNotes, setStateChangeNotes] = useState("")
  const [newState, setNewState] = useState<number>(1)
  const [showDocumentAlert, setShowDocumentAlert] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string>("")
  const objectUrlRef = useRef<string | null>(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      let url = `/pedidos/filter?busqueda=${encodeURIComponent(searchQuery)}`

      if (filters.estado !== -1) {
        url += `&estado=${filters.estado}`;
      }

      const response = await apiClient.get(url)
      const { data: { data, pagination } } = response.data

      setOrders(data)
      // setTotalPages(pagination.totalPages)
      // setTotalItems(pagination.totalItems)
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPedidoDetalle = async (id: string) => {
    try {
      const resDet = await apiClient.get(`/pedidosDetalles/${id}/detalles?vendedor=${auth.user?.codigo}`)
      const detallesData = resDet.data.data
      setDetalle(detallesData)
    } catch (err) {
    }
  }

  const fetchEstados = async () => {
    try {
      const response = await fetchGetStatus()
      setStates(response.data?.data?.data || [])
    } catch (error) {
      console.error("Error fetching status:", error)
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchEstados()
  }, [currentPage, searchQuery, filters])

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
    setCurrentPage(1)
  }

  const getStateCount = (stateId: number) => {
    return orders.filter(order => order.estadodePedido === stateId).length
  }

  const handleStateChange = async (order: Pedido) => {
    await fetchPedidoDetalle(order.nroPedido);
    setSelectedOrder(order)
    setNewState(order.estadodePedido + 1)
    setIsChangeStateModalOpen(true)
  }

  const handleViewDocuments = (order: any) => {
    setSelectedOrder(order)
    setIsDocumentsModalOpen(true)
  }

  const getStateInfo = (stateId: number) => {
    return ORDER_STATES.find(state => state.id === stateId)
  }

  const confirmStateChange = async () => {
    try {
      if (!selectedOrder) return;

      const nextState = selectedOrder.estadodePedido + 1;
      if (newState !== nextState) {
        alert('Solo puedes avanzar al siguiente estado en la secuencia');
        return;
      }

      if (selectedOrder.estadodePedido === 1 && newState === 2) {
        setLoading(true);
        await fetchUpdateStatusConfirm(selectedOrder.nroPedido);
      }
      await fetchUpdateStatus(selectedOrder.nroPedido, nextState);

      await apiClient.post(`/pedidos/state`, {
        nroPedido: selectedOrder.nroPedido,
        estadoAnterior: selectedOrder.estadodePedido,
        estadoNuevo: nextState,
        usuario: auth.user?.nombreCompleto || 'Usuario desconocido',
        nota: stateChangeNotes,
      })

      await fetchOrders();

      setIsChangeStateModalOpen(false);
      setStateChangeNotes("");
      if (newState === 4) {
        setShowDocumentAlert(true);
      }

    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar el estado del pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return
    const a = document.createElement("a")
    a.href = pdfUrl
    a.download = `boleta_${selectedOrder.nroPedido}.pdf`
    a.click()
  }

  useEffect(() => {
    if (selectedOrder) {
      const build = async () => {
        const blob = await generateOrderPdf(selectedOrder, detalle)
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
        const url = URL.createObjectURL(blob)
        objectUrlRef.current = url
        setPdfUrl(url)
      }
      build()
      return () => {
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current)
          objectUrlRef.current = null
        }
      }
    }
  }, [selectedOrder])

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gestión de Estados de Pedidos</h1>
        <p className="text-gray-500">Controla y gestiona el flujo de estados de todos los pedidos del sistema</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-4">
        {ORDER_STATES.map((state) => {
          const Icon = state.icon
          const count = getStateCount(state.id)

          return (
            <Card key={state.id} className={`${state.borderColor} border-2`}>
              <CardContent className="p-2 sm:p-4 text-center">
                <div
                  className={`inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full ${state.color} mb-1 sm:mb-2`}
                >
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4"/>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-xs text-gray-600 truncate">{state.name}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center border-b bg-gray-50">
          <CardTitle className="text-xl font-semibold text-teal-700">Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500"/>
              <Input
                type="search"
                placeholder="Buscar por Id, RUC, cliente, vendedor..."
                className="pl-8 bg-white"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
            <div className="w-full sm:w-40">
              <Select
                value={filters.estado}
                onValueChange={(value) => {
                  setFilters(prev => ({...prev, estado: value}))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Estado"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={-1}>Todos</SelectItem>
                  {states.map(item => (
                    <SelectItem key={item.id_estado_pedido} value={item.id_estado_pedido}>{item.nombre_estado}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Lista de Pedidos ({orders.length})</CardTitle>
          <CardDescription>Gestiona el estado de cada pedido y visualiza su progreso</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-4 font-medium text-sm">ID Pedido</th>
                <th className="text-left p-4 font-medium text-sm">Cliente</th>
                <th className="text-left p-4 font-medium text-sm">Fecha</th>
                <th className="text-left p-4 font-medium text-sm">Total</th>
                <th className="text-left p-4 font-medium text-sm">Estado Actual</th>
                <th className="text-left p-4 font-medium text-sm">Vendedor</th>
                <th className="text-left p-4 font-medium text-sm">Acciones</th>
              </tr>
              </thead>
              <tbody>
              {loading ? (
                Array.from({length: 5}).map((_, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-4"><Skeleton className="h-4 w-[80px]" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-[120px]" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-[80px]" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-[80px]" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-[100px]" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-[100px]" /></td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-[80px]" />
                        <Skeleton className="h-8 w-[80px]" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : orders.length > 0 ? (
                orders.map((order, index) => {
                  const stateInfo = getStateInfo(order.estadodePedido)
                  const StateIcon = stateInfo?.icon || Clock

                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium text-sm">{order.nroPedido}</td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-sm">{order.nombreCliente}</div>
                          <div className="text-xs text-gray-500">{order.codigoCliente || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="p-4 text-sm">{format(parseISO(order.fechaPedido), "dd/MM/yyyy")}</td>
                      <td className="p-4 font-medium text-sm">
                        {order.monedaPedido === "PEN" ? "S/ " : "$ "}
                        {Number(order.totalPedido).toFixed(2)}
                      </td>
                      <td className="p-4">
                        <Badge className={`${stateInfo?.color} flex items-center gap-1 text-xs`}>
                          <StateIcon className="h-3 w-3" />
                          {stateInfo?.name || 'Desconocido'}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm">{order.nombreVendedor || 'N/A'}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStateChange(order)}
                            disabled={order.estadodePedido >= 8}
                            className="text-xs"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Cambiar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 bg-transparent text-xs"
                          >
                            <Link href={`/dashboard/estados-pedidos/${order.nroPedido}`} className='flex'>
                              <Eye className="h-3 w-3 mr-1" />
                              Ver detalle
                            </Link>
                          </Button>
                          <TimelineModal pedido={order} />
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No se encontraron pedidos
                  </td>
                </tr>
              )}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden space-y-3 p-4">
            {loading ? (
              Array.from({length: 3}).map((_, index) => (
                <Card key={index} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <Skeleton className="h-5 w-24 mb-1" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-5 w-20" />
                    </div>

                    <div className="space-y-2 mb-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>

                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : orders.length > 0 ? (
              orders.map((order, index) => {
                const stateInfo = getStateInfo(order.estadodePedido)
                const StateIcon = stateInfo?.icon || Clock

                return (
                  <Card key={index} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-blue-600 text-sm">{order.nroPedido}</h3>
                          <p className="text-xs text-gray-500">
                            {format(parseISO(order.fechaPedido), "dd/MM/yyyy")}
                          </p>
                        </div>
                        <Badge className={`${stateInfo?.color} flex items-center gap-1 text-xs`}>
                          <StateIcon className="h-3 w-3" />
                          {stateInfo?.name || 'Desconocido'}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div>
                          <p className="font-medium text-sm truncate">{order.nombreCliente}</p>
                          <p className="text-xs text-gray-500">{order.codigoCliente || 'N/A'}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Total:</span>
                          <span className="font-bold text-sm">
                            {order.monedaPedido === "PEN" ? "S/ " : "$ "}
                            {Number(order.totalPedido).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Vendedor:</span>
                          <span className="text-xs">{order.nombreVendedor || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStateChange(order)}
                          disabled={order.estadodePedido >= 8}
                          className="flex-1 text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Cambiar Estado
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 bg-transparent text-xs"
                        >
                          <Link href={`/dashboard/estados-pedidos/${order.nroPedido}`} className='flex'>
                            <Eye className="h-3 w-3 mr-1" />
                            Ver detalle
                          </Link>
                        </Button>
                        <TimelineModal pedido={order} />
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                No se encontraron pedidos
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Leyenda: Estados y Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {ORDER_STATES.map((state) => {
              const Icon = state.icon
              return (
                <div key={state.id} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50">
                  <div
                    className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full ${state.color} flex-shrink-0`}
                  >
                    <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-xs sm:text-sm truncate">
                      {state.id}. {state.name}
                    </div>
                    <div className="text-xs text-gray-600 line-clamp-2 hidden sm:block">{state.description}</div>
                    <div className="text-xs font-medium text-blue-600 mt-1">📄 {state.documents}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDocumentsModalOpen} onOpenChange={setIsDocumentsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos del Pedido {selectedOrder?.idPedidocab}
            </DialogTitle>
            <DialogDescription>
              Cliente: {selectedOrder?.nombreCliente} - Estado: {getStateInfo(selectedOrder?.estadodePedido || 0)?.name}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDocumentsModalOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isChangeStateModalOpen} onOpenChange={setIsChangeStateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Estado del Pedido</DialogTitle>
            <DialogDescription>
              Pedido: {selectedOrder?.nroPedido} - {selectedOrder?.nombreCliente}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Estado Actual</Label>
              <div className="mt-1">
                <Badge className={getStateInfo(selectedOrder?.estadodePedido || 0)?.color}>
                  {getStateInfo(selectedOrder?.estadodePedido || 0)?.name}
                </Badge>
              </div>
            </div>

            <div>
              <Label htmlFor="new-state">Nuevo Estado</Label>
              <div className="mt-2 p-3 border rounded-md bg-gray-50">
                <div className="flex items-center gap-2">
                  <Badge className={getStateInfo((selectedOrder?.estadodePedido || 0) + 1)?.color}>
                    {getStateInfo((selectedOrder?.estadodePedido || 0) + 1)?.name}
                  </Badge>
                  <span className="text-sm text-gray-600">
              (Siguiente estado)
            </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {getStateInfo((selectedOrder?.estadodePedido || 0) + 1)?.description}
              </p>
            </div>
          </div>

          {selectedOrder && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsChangeStateModalOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              {(detalle.length > 0 && selectedOrder.estadodePedido ===  1) && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 bg-transparent text-xs"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Ver PDF
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] w-[1000px] max-h-[90vh] p-0 overflow-hidden">
                    <DialogHeader className="px-4 py-3 border-b">
                      <div className="flex items-center justify-between">
                        <DialogTitle>PDF — {selectedOrder.nroPedido}</DialogTitle>
                        <Button size="sm" onClick={handleDownload}>
                          <Download className="w-4 h-4 mr-2" />
                          Descargar
                        </Button>
                      </div>
                    </DialogHeader>
                    <div className="w-full h-[60vh]">
                      {pdfUrl ? (
                        <iframe title="Recibo PDF" src={pdfUrl} className="w-full h-full" />
                      ) : (
                        <div className="p-6">Generando PDF…</div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <Button
                onClick={confirmStateChange}
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Confirmar Cambio'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}