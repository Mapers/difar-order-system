import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Eye, Printer, FileDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import Link from "next/link"

// Mock data for orders
const orders = [
  {
    id: "PED-001",
    fecha: "2023-05-15",
    cliente: "Cliente 1",
    condicion: "Factura",
    total: 1250.0,
    estado: "Entregado",
    moneda: "NSO",
  },
  {
    id: "PED-002",
    fecha: "2023-05-18",
    cliente: "Cliente 3",
    condicion: "Crédito",
    total: 850.5,
    estado: "En proceso",
    moneda: "NSO",
  },
  {
    id: "PED-003",
    fecha: "2023-05-20",
    cliente: "Cliente 2",
    condicion: "Boleta",
    total: 320.75,
    estado: "Entregado",
    moneda: "NSO",
  },
  {
    id: "PED-004",
    fecha: "2023-05-22",
    cliente: "Cliente 5",
    condicion: "Factura",
    total: 1500.0,
    estado: "Pendiente",
    moneda: "USD",
  },
  {
    id: "PED-005",
    fecha: "2023-05-25",
    cliente: "Cliente 4",
    condicion: "Crédito",
    total: 980.25,
    estado: "Entregado",
    moneda: "NSO",
  },
]

export default function MyOrdersPage() {
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
              <Input type="search" placeholder="Buscar pedidos..." className="pl-8 bg-white" />
            </div>
            <div className="w-full sm:w-40">
              <Select defaultValue="todos">
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entregado">Entregados</SelectItem>
                  <SelectItem value="proceso">En proceso</SelectItem>
                  <SelectItem value="pendiente">Pendientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-from" className="text-gray-700">
                Desde
              </Label>
              <Input id="date-from" type="date" className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to" className="text-gray-700">
                Hasta
              </Label>
              <Input id="date-to" type="date" className="bg-white" />
            </div>
            <div className="flex items-end">
              <Button className="bg-teal-600 hover:bg-teal-700 w-full">Filtrar</Button>
            </div>
          </div>

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
                {orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{new Date(order.fecha).toLocaleDateString()}</TableCell>
                    <TableCell>{order.cliente}</TableCell>
                    <TableCell>{order.condicion}</TableCell>
                    <TableCell className="text-right">
                      {order.total.toFixed(2)} {order.moneda === "NSO" ? "S/." : "$"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.estado === "Entregado"
                            ? "default"
                            : order.estado === "En proceso"
                              ? "secondary"
                              : "outline"
                        }
                        className={
                          order.estado === "Entregado"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : order.estado === "En proceso"
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                              : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                        }
                      >
                        {order.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/mis-pedidos/${order.id}`}>
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
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Printer className="h-4 w-4" />
                          <span className="sr-only">Imprimir</span>
                        </Button>
                        <Button
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
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Vista de tarjetas para móviles */}
          <div className="px-4 pb-4 space-y-4 md:hidden">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="p-4 bg-gray-50 border-b">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-medium">{order.id}</CardTitle>
                    <Badge
                      variant={
                        order.estado === "Entregado"
                          ? "default"
                          : order.estado === "En proceso"
                            ? "secondary"
                            : "outline"
                      }
                      className={
                        order.estado === "Entregado"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : order.estado === "En proceso"
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                            : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                      }
                    >
                      {order.estado}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Fecha:</p>
                      <p className="font-medium">{new Date(order.fecha).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Cliente:</p>
                      <p className="font-medium">{order.cliente}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Condición:</p>
                      <p className="font-medium">{order.condicion}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total:</p>
                      <p className="font-medium text-teal-700">
                        {order.total.toFixed(2)} {order.moneda === "NSO" ? "S/." : "$"}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <Link href={`/dashboard/mis-pedidos/${order.id}`}>
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
            ))}
          </div>

          <div className="flex items-center justify-between px-4 pb-4">
            <div className="text-sm text-gray-500">Mostrando 5 de 24 pedidos</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
              <Button variant="outline" size="sm">
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

