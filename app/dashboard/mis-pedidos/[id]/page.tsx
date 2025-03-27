import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Printer, FileDown } from "lucide-react"
import Link from "next/link"

// Mock data for order details
const orderDetails = {
  id: "PED-001",
  fecha: "2023-05-15",
  cliente: {
    nombre: "Cliente 1",
    codigo: "C001",
    direccion: "Av. Principal 123, Chimbote",
  },
  condicion: "Factura",
  moneda: "NSO",
  estado: "Entregado",
  items: [
    { id: 1, producto: "Producto 1", cantidad: 2, precio: 100.0, total: 200.0 },
    { id: 2, producto: "Producto 2", cantidad: 5, precio: 150.0, total: 750.0 },
    { id: 3, producto: "Producto 3", cantidad: 2, precio: 150.0, total: 300.0 },
  ],
  subtotal: 1250.0,
  igv: 225.0,
  total: 1475.0,
}

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/mis-pedidos">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Pedido #{params.id}</h1>
        </div>
        <p className="text-gray-500">Información completa del pedido y sus productos.</p>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          <span className="hidden sm:inline">Imprimir</span>
        </Button>
        <Button variant="outline" className="gap-2">
          <FileDown className="h-4 w-4" />
          <span className="hidden sm:inline">Descargar PDF</span>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md bg-white">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="text-xl font-semibold text-teal-700">Información del Pedido</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Número de Pedido:</p>
                <p className="text-gray-900 font-medium">{orderDetails.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Fecha:</p>
                <p className="text-gray-900">{new Date(orderDetails.fecha).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Condición:</p>
                <p className="text-gray-900">{orderDetails.condicion}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Moneda:</p>
                <p className="text-gray-900">{orderDetails.moneda === "NSO" ? "Soles (S/.)" : "Dólares ($)"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Estado:</p>
                <Badge
                  variant="default"
                  className={
                    orderDetails.estado === "Entregado"
                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                      : orderDetails.estado === "En proceso"
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                        : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                  }
                >
                  {orderDetails.estado}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-white">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="text-xl font-semibold text-teal-700">Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Cliente:</p>
                <p className="text-gray-900 font-medium">{orderDetails.cliente.nombre}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Código:</p>
                <p className="text-gray-900">{orderDetails.cliente.codigo}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Dirección:</p>
                <p className="text-gray-900">{orderDetails.cliente.direccion}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md bg-white">
        <CardHeader className="border-b bg-gray-50">
          <CardTitle className="text-xl font-semibold text-teal-700">Productos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Tabla para pantallas medianas y grandes */}
          <div className="rounded-md border m-4 hidden md:block">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Precio Unitario</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderDetails.items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell>{item.producto}</TableCell>
                    <TableCell className="text-right">{item.cantidad}</TableCell>
                    <TableCell className="text-right">
                      {item.precio.toFixed(2)} {orderDetails.moneda === "NSO" ? "S/." : "$"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.total.toFixed(2)} {orderDetails.moneda === "NSO" ? "S/." : "$"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Vista de tarjetas para móviles */}
          <div className="m-4 space-y-4 md:hidden">
            {orderDetails.items.map((item) => (
              <div key={item.id} className="border rounded-md p-3 bg-gray-50">
                <div className="font-medium mb-2">{item.producto}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Cantidad:</p>
                    <p className="font-medium">{item.cantidad}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Precio:</p>
                    <p className="font-medium">
                      {item.precio.toFixed(2)} {orderDetails.moneda === "NSO" ? "S/." : "$"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Total:</p>
                    <p className="font-medium text-teal-700">
                      {item.total.toFixed(2)} {orderDetails.moneda === "NSO" ? "S/." : "$"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t bg-gray-50 p-4">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Subtotal:</span>
              <span>
                {orderDetails.subtotal.toFixed(2)} {orderDetails.moneda === "NSO" ? "S/." : "$"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">IGV (18%):</span>
              <span>
                {orderDetails.igv.toFixed(2)} {orderDetails.moneda === "NSO" ? "S/." : "$"}
              </span>
            </div>
            <div className="flex justify-between font-bold text-lg text-teal-900">
              <span>Total:</span>
              <span>
                {orderDetails.total.toFixed(2)} {orderDetails.moneda === "NSO" ? "S/." : "$"}
              </span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

