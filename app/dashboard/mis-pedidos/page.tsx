'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Eye, Printer, FileDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import apiClient from "@/app/api/client"

interface Pedido {
  idPedidocab: number
  nroPedido: string
  fechaPedido: string
  clienteNombre: string
  condicionNombre: string
  monedaPedido: string
  estadodePedido: number
  detalles?: {
    cantPedido: number
    precioPedido: number
  }[]
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    estado: "todos",
    fechaDesde: "",
    fechaHasta: "",
    condicion: ""
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const fetchOrders = async () => {
    try {
      setLoading(true)

      let url
      if (searchQuery) {
        url = `/pedidos/search?query=${encodeURIComponent(searchQuery)}&page=${currentPage}`
      } else {
        url = `/pedidos?page=${currentPage}&estado=${filters.estado}&condicion=${filters.condicion}`

        if (filters.fechaDesde && filters.fechaHasta) {
          url += `&fechaDesde=${filters.fechaDesde}&fechaHasta=${filters.fechaHasta}`
        }
      }

      const response = await apiClient.get(url)
      const { data: { data, pagination } } = response.data

      setOrders(data)
      setTotalPages(pagination.totalPages)
      setTotalItems(pagination.totalItems)
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [currentPage, searchQuery, filters])

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
    setCurrentPage(1)
  }

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOrders()
  }

  const calculateTotal = (pedido: Pedido) => {
    if (!pedido.detalles) return 0
    return pedido.detalles.reduce((sum, item) => sum + (item.cantPedido * item.precioPedido), 0)
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

  const mapEstadoPedido = (estado: number): string => {
    switch(estado) {
      case 1: return "En proceso"
      case 2: return "Pendiente"
      case 3: return "Entregado"
      default: return "Desconocido"
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mis Pedidos</h1>
        <p className="text-gray-500">Historial de pedidos enviados y su estado actual.</p>
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center border-b bg-gray-50">
          <CardTitle className="text-xl font-semibold text-teal-700">Historial de Pedidos</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar pedidos..."
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
                  setFilters(prev => ({ ...prev, estado: value }))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Entregado">Entregados</SelectItem>
                  <SelectItem value="En proceso">En proceso</SelectItem>
                  <SelectItem value="Pendiente">Pendientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleFilterSubmit} className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaDesde" className="text-gray-700">
                Desde
              </Label>
              <Input
                id="fechaDesde"
                type="date"
                className="bg-white"
                name="fechaDesde"
                value={filters.fechaDesde}
                onChange={handleFilterChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaHasta" className="text-gray-700">
                Hasta
              </Label>
              <Input
                id="fechaHasta"
                type="date"
                className="bg-white"
                name="fechaHasta"
                value={filters.fechaHasta}
                onChange={handleFilterChange}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 w-full">
                Filtrar
              </Button>
            </div>
          </form>

          {/* Tabla para pantallas medianas y grandes */}
          <div className="rounded-md border bg-white mx-4 mb-4 hidden md:block">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Condición</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : orders.length > 0 ? (
                  orders.map((order) => (
                    <TableRow key={order.idPedidocab} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{order.idPedidocab}</TableCell>
                      <TableCell>{new Date(order.fechaPedido).toLocaleDateString()}</TableCell>
                      <TableCell>{order.clienteNombre}</TableCell>
                      <TableCell>{order.condicionNombre}</TableCell>
                      <TableCell className="text-right">
                        {calculateTotal(order).toFixed(2)} {order.monedaPedido === "PEN" ? "S/." : "$"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            mapEstadoPedido(order.estadodePedido) === "Entregado"
                              ? "default"
                              : mapEstadoPedido(order.estadodePedido) === "En proceso"
                                ? "secondary"
                                : "outline"
                          }
                          className={
                            mapEstadoPedido(order.estadodePedido) === "Entregado"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : mapEstadoPedido(order.estadodePedido) === "En proceso"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                          }
                        >
                          {mapEstadoPedido(order.estadodePedido)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/dashboard/mis-pedidos/${order.idPedidocab}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Ver detalles</span>
                            </Button>
                          </Link>
                          <Button
                            disabled
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Printer className="h-4 w-4" />
                            <span className="sr-only">Imprimir</span>
                          </Button>
                          <Button
                            disabled
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          >
                            <FileDown className="h-4 w-4" />
                            <span className="sr-only">Descargar</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No se encontraron pedidos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Vista de tarjetas para móviles */}
          <div className="px-4 pb-4 space-y-4 md:hidden">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="p-4 bg-gray-50 border-b">
                    <Skeleton className="h-6 w-[120px]" />
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><Skeleton className="h-4 w-[80px]" /></div>
                      <div><Skeleton className="h-4 w-[100px]" /></div>
                      <div><Skeleton className="h-4 w-[80px]" /></div>
                      <div><Skeleton className="h-4 w-[100px]" /></div>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <Skeleton className="h-8 w-[80px]" />
                      <Skeleton className="h-8 w-[80px]" />
                      <Skeleton className="h-8 w-[80px]" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <Card key={order.idPedidocab} className="overflow-hidden">
                  <CardHeader className="p-4 bg-gray-50 border-b">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base font-medium">{order.nroPedido}</CardTitle>
                      <Badge
                        variant={
                          order.estadodePedido === "Entregado"
                            ? "default"
                            : order.estadodePedido === "En proceso"
                              ? "secondary"
                              : "outline"
                        }
                        className={
                          order.estadodePedido === "Entregado"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : order.estadodePedido === "En proceso"
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                              : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                        }
                      >
                        {order.estadodePedido}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Fecha:</p>
                        <p className="font-medium">{new Date(order.fechaPedido).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Cliente:</p>
                        <p className="font-medium">{order.clienteNombre}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Condición:</p>
                        <p className="font-medium">{order.condicionNombre}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total:</p>
                        <p className="font-medium text-teal-700">
                          {calculateTotal(order).toFixed(2)} {order.monedaPedido === "PEN" ? "S/." : "$"}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <Link href={`/dashboard/mis-pedidos/${order.idPedidocab}`}>
                        <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        <Printer className="h-4 w-4 mr-1" />
                        Imprimir
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                      >
                        <FileDown className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No se encontraron pedidos
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-4 pb-4">
            <div className="text-sm text-gray-500">
              Mostrando {orders.length} de {totalItems} pedidos
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={handlePreviousPage}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="px-4 py-2 text-sm font-medium">
                    Página {currentPage} de {totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={handleNextPage}
                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}