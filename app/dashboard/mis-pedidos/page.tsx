'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Eye,
  Printer,
  User,
  Package,
  Calendar,
  Check,
  ChevronsUpDown,
  DollarSign,
  Clock,
  CheckCircle, Truck, MapPin, Home, XCircle, UserCog, UserSearch
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import apiClient from "@/app/api/client"
import {format, parseISO} from "date-fns";
import {useAuth} from "@/context/authContext";
import {IClient} from "@/interface/order/client-interface";
import {cn} from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {fetchGetClients} from "@/app/api/takeOrders";

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

interface Pedido {
  idPedidocab: number
  nroPedido: string
  fechaPedido: string
  nombreCliente: string
  nombreVendedor: string
  condicionPedido: string
  monedaPedido: string
  estadodePedido: number
  totalPedido: string
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    cliente: "",
    fechaDesde: format(new Date(), 'yyyy-MM-dd'),
    fechaHasta: format(new Date(), 'yyyy-MM-dd')
  })
  const [clientSearch, setClientSearch] = useState("")
  const [clients, setClients] = useState<IClient[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const auth = useAuth();

  const fetchOrders = async () => {
    try {
      setLoading(true)

      let url
      if (searchQuery) {
        url = `/pedidos/search?query=${encodeURIComponent(searchQuery)}&page=${currentPage}`
      } else {
        url = `/pedidos?cliente=${filters.cliente}`

        if (filters.fechaDesde && filters.fechaHasta) {
          url += `&fechaDesde=${filters.fechaDesde}&fechaHasta=${filters.fechaHasta}`
        }

        if (auth.user?.idRol === 1) {
          url += `&vendedor=${auth.user?.codigo}`;
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

  useEffect(() => {
    if (clientSearch.length > 2) {
      const timer = setTimeout(() => {
        fetchClients(clientSearch)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [clientSearch])

  const fetchClients = async (search: string) => {
    try {
      const response = await fetchGetClients(encodeURIComponent(search), auth.user?.codigo || '')
      if (response.data?.data?.data.length === 0) {
        setClients([]);
      } else {
        setClients(response.data?.data?.data || []);
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
    setCurrentPage(1)
  }

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOrders()
  }

  const handleClientSelect = (client: IClient | null) => {
    setFilters(prev => ({
      ...prev,
      cliente: client?.codigo || ""
    }))
    setCurrentPage(1)
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

  const getStateInfo = (stateId: number) => {
    return ORDER_STATES.find(state => state.id === stateId)
  }

  const getStatusText = (stateId: number) => {
    return ORDER_STATES.find(state => state.id === stateId)
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mis Pedidos</h1>
        <p className="text-gray-500">Historial de pedidos enviados y su estado actual.</p>
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center border-b bg-gray-50">
          <CardTitle className="text-xl font-semibold text-teal-700">Filtros de Búsqueda</CardTitle>
          {/*<div className="flex flex-col sm:flex-row gap-4 sm:items-center">*/}
          {/*  <div className="relative">*/}
          {/*    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500"/>*/}
          {/*    <Input*/}
          {/*      type="search"*/}
          {/*      placeholder="Buscar pedidos..."*/}
          {/*      className="pl-8 bg-white"*/}
          {/*      value={searchQuery}*/}
          {/*      onChange={(e) => {*/}
          {/*        setSearchQuery(e.target.value)*/}
          {/*        setCurrentPage(1)*/}
          {/*      }}*/}
          {/*    />*/}
          {/*  </div>*/}
            {/*<div className="w-full sm:w-40">*/}
            {/*  <Select*/}
            {/*    value={filters.estado}*/}
            {/*    onValueChange={(value) => {*/}
            {/*      setFilters(prev => ({...prev, estado: value}))*/}
            {/*      setCurrentPage(1)*/}
            {/*    }}*/}
            {/*  >*/}
            {/*    <SelectTrigger className="bg-white">*/}
            {/*      <SelectValue placeholder="Estado"/>*/}
            {/*    </SelectTrigger>*/}
            {/*    <SelectContent>*/}
            {/*      <SelectItem value="todos">Todos</SelectItem>*/}
            {/*      <SelectItem value="Entregado">Entregados</SelectItem>*/}
            {/*      <SelectItem value="En proceso">En proceso</SelectItem>*/}
            {/*      <SelectItem value="Pendiente">Pendientes</SelectItem>*/}
            {/*    </SelectContent>*/}
            {/*  </Select>*/}
            {/*</div>*/}
          {/*</div>*/}
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
            <div className="space-y-2">
              <Label htmlFor="cliente" className="text-gray-700">
                Cliente
              </Label>
              <Combobox<IClient>
                items={clients}
                value={filters.cliente}
                onSearchChange={setClientSearch}
                onSelect={handleClientSelect}
                getItemKey={(client) => client.codigo}
                getItemLabel={(client) => client.Nombre}
                placeholder="Buscar cliente..."
                emptyText="No se encontraron clientes"
                searchText="Escribe al menos 3 caracteres..."
                loadingText="Buscando clientes..."
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          Array.from({length: 5}).map((_, index) => (
            <Card key={index} className="bg-white shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <Skeleton className="h-6 w-24"/>
                      <Skeleton className="h-5 w-20"/>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4"/>
                        <Skeleton className="h-4 w-16"/>
                        <Skeleton className="h-4 w-24"/>
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4"/>
                        <Skeleton className="h-4 w-16"/>
                        <Skeleton className="h-4 w-24"/>
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4"/>
                        <Skeleton className="h-4 w-16"/>
                        <Skeleton className="h-4 w-24"/>
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4"/>
                        <Skeleton className="h-4 w-16"/>
                        <Skeleton className="h-4 w-24"/>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Skeleton className="h-9 w-24"/>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : orders.length > 0 ? (
          orders.map((pedido) => {
            const stateInfo = getStateInfo(pedido.estadodePedido)
            const StateIcon = stateInfo?.icon || Clock

            return (
              <Card key={pedido.idPedidocab} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <h3 className="text-lg font-semibold text-gray-900">Pedido #{pedido.nroPedido}</h3>
                        <div className="flex items-center gap-2">
                          <Badge className={`${stateInfo?.color} flex items-center gap-1 text-xs`}>
                            <StateIcon className="h-3 w-3" />
                            {stateInfo?.name || 'Desconocido'}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500"/>
                          <span className="text-gray-600">Fecha:</span>
                          <span className="font-medium">{format(parseISO(pedido.fechaPedido), "dd/MM/yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500"/>
                          <span className="text-gray-600">Cliente:</span>
                          <span className="font-medium truncate">{pedido.nombreCliente}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-500"/>
                          <span className="text-gray-600">Total:</span>
                          <span className="font-bold text-green-600">
                          {pedido.monedaPedido === "PEN" ? "S/ " : "$ "}
                            {Number(pedido.totalPedido).toFixed(2)}
                        </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-500"/>
                          <span className="text-gray-600">Condición:</span>
                          <span className="font-medium">{pedido.condicionPedido}</span>
                        </div>
                        {auth.user?.idRol !== 1 && (
                          <div className="flex items-center gap-2">
                            <UserSearch className="h-4 w-4 text-gray-500"/>
                            <span className="text-gray-600">Vendedor:</span>
                            <span className="font-medium">{pedido.nombreVendedor}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link href={`/dashboard/mis-pedidos/${pedido.nroPedido}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4"/>
                          Ver Detalle
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        disabled
                      >
                        <Printer className="h-4 w-4"/>
                        Imprimir
                      </Button>
                    </div>
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

      {/*<div className="flex items-center justify-between px-4 pb-4">*/}
      {/*  <div className="text-sm text-gray-500">*/}
      {/*    Mostrando {orders.length} de {totalItems} pedidos*/}
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
  )
}

interface ComboboxProps<T> {
  items: T[]
  value: string
  onSearchChange: (search: string) => void
  onSelect: (item: T | null) => void
  getItemKey: (item: T) => string
  getItemLabel: (item: T) => string
  placeholder?: string
  emptyText?: string
  searchText?: string
  loadingText?: string
  className?: string
}

export function Combobox<T>({
                              items,
                              value,
                              onSearchChange,
                              onSelect,
                              getItemKey,
                              getItemLabel,
                              placeholder = "Select item...",
                              emptyText = "No items found.",
                              searchText = "Type to search...",
                              loadingText = "Loading...",
                              className,
                            }: ComboboxProps<T>) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const selectedItem = items.find(item => getItemKey(item) === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedItem ? getItemLabel(selectedItem) : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchText}
            value={search}
            onValueChange={(value) => {
              setSearch(value)
              onSearchChange(value)
            }}
          />
          <CommandList>
            <CommandEmpty>
              {items.length === 0 && search ? emptyText : search ? emptyText : searchText}
            </CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={getItemKey(item)}
                  value={getItemKey(item)}
                  onSelect={() => {
                    onSelect(item)
                    setOpen(false)
                    setSearch("")
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === getItemKey(item) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {getItemLabel(item)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}