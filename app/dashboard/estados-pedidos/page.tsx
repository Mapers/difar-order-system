'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Search, Eye, Clock, Edit, FileText, Download, Printer,
  OctagonAlert, Layers, Trash2, Link2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useEffect, useRef, useState, useMemo, Fragment } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import apiClient from "@/app/api/client"
import { format, parseISO } from "date-fns"
import { fetchGetStatus, fetchUpdateStatus, fetchUpdateStatusConfirm } from "@/app/api/takeOrders"
import { useAuth } from "@/context/authContext"
import Link from "next/link"
import { generateOrderPdf } from "@/lib/pdf"
import { TimelineModal } from "@/app/dashboard/estados-pedidos/timeline-modal"
import { ORDER_STATES } from "@/app/dashboard/mis-pedidos/page"
import {ChangeStateDialog} from "@/app/dashboard/estados-pedidos/modals/ChangeStateDialog";
import {DeleteOrderDialog} from "@/app/dashboard/estados-pedidos/modals/DeleteOrderDialog";
import {DocumentsDialog} from "@/app/dashboard/estados-pedidos/modals/DocumentsDialog";
import {Sequential} from "@/app/types/config-types";
import {SunatTransaccion, TipoDocSunat} from "@/app/types/order/order-interface";

export interface Pedido {
  idPedidocab: number
  nroPedido: string
  fechaPedido: string
  horaPedido: string
  nombreCliente: string
  nombreComercial: string
  nombreVendedor: string
  condicionPedido: string
  CodigoCondicion: string
  monedaPedido: string
  estadodePedido: number
  totalPedido: string
  notaPedido: string
  contactoPedido: string
  telefonoPedido: string
  direccionCliente?: string
  direccionEntrega?: string
  referenciaDireccion?: string
  codigoCliente: string
  por_autorizar: string
  is_autorizado: string
  continue: number
  correo?: string
  codigo_grupo?: string
  tipo_afectacion?: string
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
  fec_venc_lote?: string
  cod_lote?: string
  is_autorizado?: string
  is_editado?: string
  laboratorio: string
  tipo_afectacion_igv?: string
}

interface Status {
  nombre_estado: string
  id_estado_pedido: number
}

const AfectacionBadge = ({ tipo }: { tipo?: string }) => {
  if (!tipo || tipo === 'GRAVADO') {
    return (
        <Badge className="bg-green-50 text-green-700 border border-green-300 text-[10px] font-semibold px-1.5 py-0.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block mr-1" />
          GRAVADO
        </Badge>
    )
  }
  if (tipo === 'EXONERADO') {
    return (
        <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-300 text-[10px] font-semibold px-1.5 py-0.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block mr-1" />
          EXONERADO
        </Badge>
    )
  }
  return (
      <Badge className="bg-blue-50 text-blue-700 border border-blue-300 text-[10px] font-semibold px-1.5 py-0.5 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block mr-1" />
        INAFECTO
      </Badge>
  )
}

export default function OrderStatusManagementPage() {
  const [orders, setOrders] = useState<Pedido[]>([])
  const [detalle, setDetalle] = useState<PedidoDet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({ estado: 1 })
  const auth = useAuth()
  const [currentPage, setCurrentPage] = useState(1)
  const [states, setStates] = useState<Status[]>([])
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null)
  const [isChangeStateModalOpen, setIsChangeStateModalOpen] = useState(false)
  const [stateChangeNotes, setStateChangeNotes] = useState("")
  const [newState, setNewState] = useState<number>(1)
  const [showDocumentAlert, setShowDocumentAlert] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string>("")
  const objectUrlRef = useRef<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<Pedido | null>(null)
  const [pedidoHermano, setPedidoHermano] = useState<Pedido | null>(null)

  const [loadingPreview, setLoadingPreview] = useState(false)
  const [pdfPreviewBase64, setPdfPreviewBase64] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [tiposComprobante,   setTiposComprobante]   = useState<Sequential[]>([])
  const [sunatTransacciones, setSunatTransacciones] = useState<SunatTransaccion[]>([])
  const [tipoDocsSunat,      setTipoDocsSunat]      = useState<TipoDocSunat[]>([])


  const STATE_JUMPS: Record<number, number> = { 2: 4, 4: 7 }
  const getNextState = (currentState: number): number => STATE_JUMPS[currentState] ?? currentState + 1

  const pedidosAgrupados = useMemo(() => {
    const mapaGrupos = new Map<string, Pedido[]>()
    const gruposVistos = new Set<string>()
    const resultado: { codigo_grupo: string | null; pedidos: Pedido[] }[] = []

    for (const pedido of orders) {
      if (pedido.codigo_grupo) {
        if (!mapaGrupos.has(pedido.codigo_grupo)) {
          mapaGrupos.set(pedido.codigo_grupo, [])
        }
        mapaGrupos.get(pedido.codigo_grupo)!.push(pedido)

        if (!gruposVistos.has(pedido.codigo_grupo)) {
          gruposVistos.add(pedido.codigo_grupo)
          resultado.push({
            codigo_grupo: pedido.codigo_grupo,
            pedidos: mapaGrupos.get(pedido.codigo_grupo)!
          })
        }
      } else {
        resultado.push({ codigo_grupo: null, pedidos: [pedido] })
      }
    }

    return resultado
  }, [orders])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      let url = `/pedidos/filter?busqueda=${encodeURIComponent(searchQuery)}`
      if (filters.estado !== -1) url += `&estado=${filters.estado}`
      const response = await apiClient.get(url)
      setOrders(response.data.data.data)
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPedidoDetalle = async (id: string) => {
    try {
      const resDet = await apiClient.get(
          `/pedidosDetalles/${id}/detalles?${auth.user?.idRol === 1 ? `vendedor=${auth.user?.codigo || null}` : ''}`
      )
      setDetalle(resDet.data.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchEstados = async () => {
    try {
      const response = await fetchGetStatus()
      setStates(response.data?.data?.data || [])
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchEstados()
  }, [currentPage, searchQuery, filters])

  const handleCardClick = (stateId: number) => {
    setFilters(prev => ({ ...prev, estado: stateId }))
    setCurrentPage(1)
  }

  const handleStateChange = async (order: Pedido) => {
    await fetchPedidoDetalle(order.nroPedido)
    setSelectedOrder(order)
    setNewState(getNextState(order.estadodePedido))

    if (order.codigo_grupo) {
      const hermano = orders.find(
          o => o.codigo_grupo === order.codigo_grupo && o.nroPedido !== order.nroPedido
      ) || null
      setPedidoHermano(hermano)
    } else {
      setPedidoHermano(null)
    }

    setIsChangeStateModalOpen(true)
  }

  const getStateInfo = (stateId: number, porAutorizar: string, isAutorizado: string) => {
    if (porAutorizar === 'S' && isAutorizado === 'N') return ORDER_STATES.find(e => e.id === -2)
    if (porAutorizar === 'S' && (isAutorizado === '' || isAutorizado === null)) return ORDER_STATES.find(e => e.id === -1)
    return ORDER_STATES.find(state => state.id === stateId)
  }

  const confirmStateChange = async () => {
    try {
      if (!selectedOrder) return
      setLoading(true)

      const nextState = getNextState(selectedOrder.estadodePedido)

      if (selectedOrder.estadodePedido === 1 && newState === 2) {
        await fetchUpdateStatusConfirm(selectedOrder.nroPedido)
      }
      await fetchUpdateStatus(selectedOrder.nroPedido, nextState)
      await apiClient.post(`/pedidos/state`, {
        nroPedido:      selectedOrder.nroPedido,
        estadoAnterior: selectedOrder.estadodePedido,
        estadoNuevo:    nextState,
        usuario:        auth.user?.nombreCompleto || 'Usuario desconocido',
        nota:           stateChangeNotes,
      })

      if (pedidoHermano && pedidoHermano.estadodePedido === selectedOrder.estadodePedido) {
        const nextStateHermano = getNextState(pedidoHermano.estadodePedido)

        if (pedidoHermano.estadodePedido === 1 && nextStateHermano === 2) {
          await fetchUpdateStatusConfirm(pedidoHermano.nroPedido)
        }
        await fetchUpdateStatus(pedidoHermano.nroPedido, nextStateHermano)
        await apiClient.post(`/pedidos/state`, {
          nroPedido:      pedidoHermano.nroPedido,
          estadoAnterior: pedidoHermano.estadodePedido,
          estadoNuevo:    nextStateHermano,
          usuario:        auth.user?.nombreCompleto || 'Usuario desconocido',
          nota:           `Cambio automático por pedido vinculado #${selectedOrder.nroPedido}`,
        })
      }

      await fetchOrders()
      setIsChangeStateModalOpen(false)
      setStateChangeNotes("")
      setPedidoHermano(null)
      if (newState === 4) setShowDocumentAlert(true)

    } catch (error) {
      console.error('Error al cambiar estado:', error)
      alert('Error al cambiar el estado del pedido')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!pdfUrl) return
    const a = document.createElement("a")
    a.href = pdfUrl
    a.download = `boleta_${selectedOrder?.nroPedido}.pdf`
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
        if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null }
      }
    }
  }, [selectedOrder, detalle])

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [tiposRes, transRes, docsRes] = await Promise.all([
          apiClient.get('/admin/listar/secuenciales'),
          apiClient.get('/pedidos/sunatTrans'),
          apiClient.get('/pedidos/tipoDocSunat'),
        ])
        setTiposComprobante(tiposRes.data.data)
        setSunatTransacciones(transRes.data.data.data)
        setTipoDocsSunat(docsRes.data.data.data)
      } catch (error) {
        console.error('Error cargando catálogos preview:', error)
      }
    }
    fetchCatalogs()
  }, [])


  const handleDeleteOrder = async () => {
    if (!orderToDelete) return
    try {
      setLoading(true)
      await apiClient.delete(`/pedidos/soft/${orderToDelete.nroPedido}`, {
        data: { nroPedido: orderToDelete.nroPedido, usuario: auth.user?.nombreCompleto || 'Usuario desconocido' }
      })
      setIsDeleteModalOpen(false)
      setOrderToDelete(null)
      await fetchOrders()
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Error al eliminar el pedido')
    } finally {
      setLoading(false)
    }
  }

  const openDeleteModal = (order: Pedido) => {
    setOrderToDelete(order)
    setIsDeleteModalOpen(true)
  }

  const handlePreview = async (
      invoiceType: string,
      sunatTransaction: string,
      tipoSunat: string,
      selectedAlmacen: string
  ) => {
    if (!selectedOrder) return
    try {
      setLoadingPreview(true)
      const [prefijo, tipoCompr] = invoiceType.split('|')
      const response = await apiClient.post(
          `/pedidos/generatePreviewCompr?nroPedido=${selectedOrder.nroPedido}&tipoCompr=${tipoCompr}&sunatTrans=${sunatTransaction}&tipoDocSunat=${tipoSunat}&prefijo=${prefijo}`,
          { flete_monto: 0, id_almacen: selectedAlmacen, }
      )
      setPdfPreviewBase64(response.data.data.pdf_bytes)
      setIsPreviewOpen(true)
    } catch (error) {
      console.error('Error generando preview:', error)
      alert('Error al generar el preview del comprobante')
    } finally {
      setLoadingPreview(false)
    }
  }

  const renderTableRow = (order: Pedido, esGrupo = false) => {
    const stateInfo = getStateInfo(order.estadodePedido, order.por_autorizar, order.is_autorizado)
    const StateIcon = stateInfo?.icon || Clock

    return (
        <tr key={order.idPedidocab} className={`border-b hover:bg-gray-50 ${esGrupo ? 'bg-amber-50/30' : ''}`}>
          <td className="p-4 font-medium text-sm">
            <div className="flex items-center gap-1.5">
              {esGrupo && <Link2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
              {order.nroPedido}
            </div>
          </td>
          <td className="p-4">
            <div>
              <div className="font-medium text-sm">{order.nombreCliente}</div>
              <div className="text-xs text-gray-500">{order.codigoCliente || 'N/A'}</div>
            </div>
          </td>
          <td className="p-4 text-sm">{format(parseISO(order.fechaPedido), "dd/MM/yyyy")} {order.horaPedido}</td>
          <td className="p-4 font-medium text-sm">
            {order.monedaPedido === "PEN" ? "S/ " : "$ "}
            {Number(order.totalPedido).toFixed(2)}
          </td>
          <td className="p-4">
            <div className="flex flex-wrap items-center gap-1">
              <Badge className={`${stateInfo?.color} flex items-center gap-1 text-xs`}>
                <StateIcon className="h-3 w-3" />
                {stateInfo?.name || 'Desconocido'}
              </Badge>
              <AfectacionBadge tipo={order.tipo_afectacion} />
            </div>
          </td>
          <td className="p-4 text-sm">{order.nombreVendedor || 'N/A'}</td>
          <td className="p-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                  variant="outline" size="sm"
                  onClick={() => handleStateChange(order)}
                  disabled={order.estadodePedido >= 8 || (order.por_autorizar === 'S' && (order.is_autorizado === 'N' || order.is_autorizado === ''))}
                  className="text-xs"
              >
                <Edit className="h-3 w-3 mr-1" /> Cambiar
              </Button>
              <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700 bg-transparent text-xs">
                <Link href={`/dashboard/estados-pedidos/${order.nroPedido}`} className="flex">
                  <Eye className="h-3 w-3 mr-1" /> Ver detalle
                </Link>
              </Button>
              <TimelineModal pedido={order} />
              {order.estadodePedido === 1 && (
                  <Button variant="outline" size="sm" onClick={() => openDeleteModal(order)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs">
                    <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                  </Button>
              )}
            </div>
          </td>
        </tr>
    )
  }

  const renderMobileCard = (order: Pedido, esGrupo = false) => {
    const stateInfo = getStateInfo(order.estadodePedido, order.por_autorizar, order.is_autorizado)
    const StateIcon = stateInfo?.icon || Clock

    return (
        <Card key={order.idPedidocab} className={`border ${esGrupo ? 'border-amber-200 rounded-none border-x-amber-200' : 'border-gray-200'}`}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-1.5">
                  {esGrupo && <Link2 className="h-3.5 w-3.5 text-amber-500" />}
                  <h3 className="font-bold text-blue-600 text-sm">{order.nroPedido}</h3>
                </div>
                <p className="text-xs text-gray-500">
                  {format(parseISO(order.fechaPedido), "dd/MM/yyyy")} {order.horaPedido}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {(order.por_autorizar === 'S' && order.is_autorizado === 'N')
                    ? <Badge className="bg-teal-100 text-teal-800 flex items-center gap-1 text-xs">
                      <OctagonAlert className="h-3 w-3" /> POR AUTORIZAR
                    </Badge>
                    : <Badge className={`${stateInfo?.color} flex items-center gap-1 text-xs`}>
                      <StateIcon className="h-3 w-3" /> {stateInfo?.name || 'Desconocido'}
                    </Badge>
                }
                <AfectacionBadge tipo={order.tipo_afectacion} />
              </div>
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

            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm"
                      onClick={() => handleStateChange(order)}
                      disabled={order.estadodePedido >= 8 || (order.por_autorizar === 'S' && order.is_autorizado === 'N')}
                      className="flex-1 text-xs">
                <Edit className="h-3 w-3 mr-1" /> Cambiar Estado
              </Button>
              <Button variant="outline" size="sm" className="text-blue-600 bg-transparent text-xs">
                <Link href={`/dashboard/estados-pedidos/${order.nroPedido}`} className="flex">
                  <Eye className="h-3 w-3 mr-1" /> Ver
                </Link>
              </Button>
              <TimelineModal pedido={order} />
              {order.estadodePedido === 1 && (
                  <Button variant="outline" size="sm" onClick={() => openDeleteModal(order)}
                          className="text-red-600 hover:bg-red-50 text-xs">
                    <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                  </Button>
              )}
            </div>
          </CardContent>
        </Card>
    )
  }

  return (
      <div className="grid gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gestión de Estados de Pedidos</h1>
          <p className="text-gray-500">Controla y gestiona el flujo de estados de todos los pedidos del sistema</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2 sm:gap-4">
          <Card onClick={() => handleCardClick(-1)}
                className={`cursor-pointer transition-all duration-200 border-2 ${filters.estado === -1 ? 'border-gray-800 ring-2 ring-gray-400 ring-offset-2 scale-105' : 'border-transparent hover:border-gray-300 hover:scale-105 opacity-80 hover:opacity-100'}`}>
            <CardContent className="p-2 sm:p-4 text-center">
              <div className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-800 text-white mb-1 sm:mb-2">
                <Layers className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
              <div className="text-xs font-bold text-gray-600 mt-1">TODOS</div>
            </CardContent>
          </Card>
          {ORDER_STATES.filter(item => item.id !== -1 && item.id !== -2).map((state) => {
            const Icon = state.icon
            const isSelected = filters.estado === state.id
            return (
                <Card key={state.id} onClick={() => handleCardClick(state.id)}
                      className={`${state.borderColor} border-2 cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500 shadow-md scale-105 opacity-100' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}>
                  <CardContent className="p-2 sm:p-4 text-center">
                    <div className={`inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full ${state.color} mb-1 sm:mb-2`}>
                      <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                    <div className={`text-xs font-bold truncate ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>{state.name}</div>
                  </CardContent>
                </Card>
            )
          })}
        </div>

        <Card className="shadow-md">
          <CardHeader className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center border-b bg-gray-50">
            <CardTitle className="text-xl font-semibold text-teal-700">
              {filters.estado === -1 ? "Todos los Pedidos" : `Pedidos en estado: ${ORDER_STATES.find(s => s.id === filters.estado)?.name || 'Desconocido'}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4">
              <div className="relative w-full md:w-1/2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input type="search" placeholder="Buscar por Id, RUC, cliente, vendedor..."
                       className="pl-8 bg-white w-full" value={searchQuery}
                       onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }} />
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
                  <th className="text-left p-4 font-medium text-sm">Estado / Tipo</th>
                  <th className="text-left p-4 font-medium text-sm">Vendedor</th>
                  <th className="text-left p-4 font-medium text-sm">Acciones</th>
                </tr>
                </thead>
                <tbody>
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b">
                          {Array.from({ length: 7 }).map((_, j) => (
                              <td key={j} className="p-4"><Skeleton className="h-4 w-full" /></td>
                          ))}
                        </tr>
                    ))
                ) : orders.length > 0 ? (
                    pedidosAgrupados.map(({ codigo_grupo, pedidos }) => {
                      const esGrupo = !!codigo_grupo && pedidos.length > 1
                      if (esGrupo) {
                        return (
                            <Fragment key={`grp-${codigo_grupo}`}>
                              <tr key={codigo_grupo} className="bg-amber-50 border-b border-amber-200">
                                <td colSpan={7} className="px-4 py-1.5">
                                  <div className="flex items-center gap-2">
                                    <Link2 className="h-3.5 w-3.5 text-amber-600" />
                                    <span className="text-xs font-semibold text-amber-700">
                                                                    Pedidos vinculados · Grupo {codigo_grupo}
                                                                </span>
                                    <span className="text-xs text-amber-500 ml-auto">
                                                                    {pedidos.length} pedidos relacionados
                                                                </span>
                                  </div>
                                </td>
                              </tr>
                              {pedidos.map(p => renderTableRow(p, true))}
                            </Fragment>
                        )
                      }
                      return renderTableRow(pedidos[0], false)
                    })
                ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        No se encontraron pedidos en estado: <b>{ORDER_STATES.find(s => s.id === filters.estado)?.name || 'Seleccionado'}</b>
                      </td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden space-y-3 p-4">
              {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i} className="border border-gray-200">
                        <CardContent className="p-4 space-y-3">
                          <Skeleton className="h-5 w-24" />
                          <Skeleton className="h-4 w-full" />
                          <div className="flex gap-2">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                          </div>
                        </CardContent>
                      </Card>
                  ))
              ) : orders.length > 0 ? (
                  pedidosAgrupados.map(({ codigo_grupo, pedidos }) => {
                    const esGrupo = !!codigo_grupo && pedidos.length > 1
                    if (esGrupo) {
                      return (
                          <div key={`mgrp-${codigo_grupo}`} className="space-y-0">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-t-lg border-b-0">
                              <Link2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                              <span className="text-xs font-semibold text-amber-700 truncate flex-1">
                                                    Vinculados · {codigo_grupo}
                                                </span>
                              <span className="text-xs text-amber-500 shrink-0">{pedidos.length} pedidos</span>
                            </div>
                            <div className="border border-amber-200 border-t-0 rounded-b-lg overflow-hidden">
                              {pedidos.map(p => renderMobileCard(p, true))}
                            </div>
                          </div>
                      )
                    }
                    return renderMobileCard(pedidos[0], false)
                  })
              ) : (
                  <div className="text-center py-8 text-gray-500">No se encontraron pedidos</div>
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
              {ORDER_STATES.filter(item => item.id !== -1 && item.id !== -2).map((state) => {
                const Icon = state.icon
                return (
                    <div key={state.id} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50">
                      <div className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full ${state.color} flex-shrink-0`}>
                        <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-xs sm:text-sm truncate">{state.id}. {state.name}</div>
                        <div className="text-xs text-gray-600 line-clamp-2 hidden sm:block">{state.description}</div>
                        <div className="text-xs font-medium text-blue-600 mt-1">📄 {state.documents}</div>
                      </div>
                    </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <ChangeStateDialog
            open={isChangeStateModalOpen}
            onOpenChange={setIsChangeStateModalOpen}
            selectedOrder={selectedOrder}
            pedidoHermano={pedidoHermano}
            detalle={detalle}
            loading={loading}
            pdfUrl={pdfUrl}
            getNextState={getNextState}
            getStateInfo={getStateInfo}
            onConfirm={confirmStateChange}
            onCancel={() => { setIsChangeStateModalOpen(false); setPedidoHermano(null) }}
            onDownload={handleDownload}
            onPreview={handlePreview}
            loadingPreview={loadingPreview}
            pdfPreviewBase64={pdfPreviewBase64}
            isPreviewOpen={isPreviewOpen}
            onClosePreview={() => { setIsPreviewOpen(false); setPdfPreviewBase64(null) }}
            tiposComprobante={tiposComprobante}
            sunatTransacciones={sunatTransacciones}
            tipoDocsSunat={tipoDocsSunat}
        />

        <DeleteOrderDialog
            open={isDeleteModalOpen}
            onOpenChange={setIsDeleteModalOpen}
            order={orderToDelete}
            loading={loading}
            onConfirm={handleDeleteOrder}
        />

        <DocumentsDialog
            open={isDocumentsModalOpen}
            onOpenChange={setIsDocumentsModalOpen}
            order={selectedOrder}
            getStateInfo={getStateInfo}
        />
      </div>
  )
}