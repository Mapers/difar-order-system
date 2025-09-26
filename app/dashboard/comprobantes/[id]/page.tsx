'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {ArrowLeft, Printer, FileDown, Clock, Pen, ArrowBigDownDash} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import apiClient from "@/app/api/client"
import {useAuth} from "@/context/authContext";
import {ORDER_STATES} from "@/app/dashboard/mis-pedidos/page";
import { use } from 'react'
import {PedidoDet} from "@/app/dashboard/estados-pedidos/page";

interface PedidoCab {
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
  direccionEntrega: string
  referenciaDireccion?: string

}

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const [pedido, setPedido] = useState<PedidoCab | null>(null)
  const [detalles, setDetalles] = useState<PedidoDet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const auth = useAuth();
  const { id } = use(params)

  useEffect(() => {
    const fetchPedido = async () => {
      try {
        setLoading(true)

        // Obtener cabecera del pedido
        const resCab = await apiClient.get(`/pedidos/${id || ''}`)
        const pedidoData = resCab.data.data

        let url = `/pedidosDetalles/${id || ''}/detalles`
        if (auth.user?.idRol === 1) {
          url += `?vendedor=${auth.user?.codigo}`
        }
        const resDet = await apiClient.get(url)
        const detallesData = resDet.data.data

        setPedido(pedidoData)
        setDetalles(detallesData)
      } catch (err) {
        setError("Error al cargar los datos del pedido")
        console.error("Error fetching order details:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchPedido()
  }, [])

  const calculateTotals = () => {
    if (!detalles.length) return { subtotal: 0, igv: 0, total: 0 }

    const subtotal = detalles.reduce((sum, item) => sum + (item.cantPedido * Number(item.precioPedido)), 0)
    const igv = subtotal * 0.18
    const total = subtotal + igv

    return { subtotal, igv, total }
  }

  const { subtotal, igv, total } = calculateTotals()

  const getStateInfo = (stateId: number) => {
    return ORDER_STATES.find(state => state.id === stateId)
  }

  if (loading) {
    return (
      <div className="grid gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="flex justify-end gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-md p-4">
                  <Skeleton className="h-4 w-full mb-2" />
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <div className="space-y-2 w-full max-w-xs">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/comprobantes">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Volver</span>
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Error</h1>
          </div>
        </div>
        <Card className="text-center p-8">
          <p className="text-red-500">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </Button>
        </Card>
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="grid gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/comprobantes">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Volver</span>
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Pedido no encontrado</h1>
          </div>
          <p className="text-gray-500">El pedido solicitado no existe o no se pudo cargar.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/comprobantes">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            Pedido #{pedido.nroPedido}
          </h1>
        </div>
        <p className="text-gray-500">Información completa del pedido y sus productos.</p>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" className="gap-2" disabled>
          <Printer className="h-4 w-4" />
          <span className="hidden sm:inline">Imprimir</span>
        </Button>
        <Button variant="outline" className="gap-2" disabled>
          <FileDown className="h-4 w-4" />
          <span className="hidden sm:inline">Descargar PDF</span>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md bg-white">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="text-xl font-semibold text-teal-700">
              Información del Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Número de Pedido:</p>
                <p className="text-gray-900 font-medium">{pedido.nroPedido}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Fecha:</p>
                <p className="text-gray-900">
                  {new Date(pedido.fechaPedido).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Condición:</p>
                <p className="text-gray-900">{pedido.condicionPedido}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Moneda:</p>
                <p className="text-gray-900">
                  {pedido.monedaPedido === "PEN" ? "Soles (S/.)" : "Dólares ($)"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Vendedor:</p>
                <p className="text-gray-900">{pedido.nombreVendedor || "No especificado"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Forma de Pago:</p>
                <p className="text-gray-900">{pedido.monedaPedido || "No especificada"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Estado:</p>
                <Badge className={`${getStateInfo(pedido.estadodePedido)?.color} flex items-center gap-1 text-xs`}>
                  {getStateInfo(pedido.estadodePedido)?.name || 'Desconocido'}
                </Badge>
              </div>
              {pedido.notaPedido && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Notas:</p>
                  <p className="text-gray-900">{pedido.notaPedido}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-white">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="text-xl font-semibold text-teal-700">
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Cliente:</p>
                <p className="text-gray-900 font-medium">
                  {pedido.nombreCliente}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Contacto:</p>
                <p className="text-gray-900">{pedido.contactoPedido || "No especificado"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Teléfono:</p>
                <p className="text-gray-900">{pedido.telefonoPedido || "No especificado"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Dirección de Entrega:</p>
                <p className="text-gray-900">{pedido.direccionEntrega || "No especificada"}</p>
              </div>
              {pedido.referenciaDireccion && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Referencia:</p>
                  <p className="text-gray-900">{pedido.referenciaDireccion}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md bg-white">
        <CardHeader className="border-b bg-gray-50">
          <CardTitle className="text-xl font-semibold text-teal-700">Productos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border m-4 hidden md:block">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Lote - Fec.Venc</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Precio Unitario</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detalles.length > 0 ? (
                  detalles.map((item) => (
                    <TableRow key={item.idPedidodet} className="hover:bg-gray-50">
                      <TableCell>{item.codigoitemPedido}</TableCell>
                      <TableCell className='flex'>
                        {item.is_editado === 'S' && <Pen className="h-4 w-4 mr-2 text-blue-600" />}
                        {item.is_autorizado === 'S' && <ArrowBigDownDash className="h-5 w-5 mr-2 text-orange-600" />}
                        {item.productoNombre || "Producto no especificado"}
                      </TableCell>
                      <TableCell>{item.cod_lote || ''} - {item.fec_venc_lote || ''}</TableCell>
                      <TableCell className="text-right">
                        {Number(item.cantPedido)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.precioPedido} {pedido.monedaPedido === "PEN" ? "S/." : "$"}
                      </TableCell>
                      <TableCell className="text-right">
                        {(item.cantPedido * Number(item.precioPedido)).toFixed(2)}{" "}
                        {pedido.monedaPedido === "PEN" ? "S/." : "$"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No se encontraron productos en este pedido
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="m-4 space-y-4 md:hidden">
            {detalles.length > 0 ? (
              detalles.map((item) => (
                <div key={item.idPedidodet} className="border rounded-md p-3 bg-gray-50">
                  <div className="font-medium mb-2 flex">
                    {item.is_editado === 'S' && <Pen className="h-4 w-4 mr-2 text-blue-600" />}
                    {item.is_autorizado === 'S' && <ArrowBigDownDash className="h-5 w-5 mr-2 text-orange-600" />}
                    {item.productoNombre || "Producto no especificado"}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Código:</p>
                      <p className="font-medium">{item.codigoitemPedido}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Unidad:</p>
                      <p className="font-medium">{item.productoUnidad || "und"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-500">Lote - Fec.Venc</p>
                      <p>{item.cod_lote || ''} - {item.fec_venc_lote || ''}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Cantidad:</p>
                      <p className="font-medium">{item.cantPedido}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Precio:</p>
                      <p className="font-medium">
                        {item.precioPedido} {pedido.monedaPedido === "PEN" ? "S/." : "$"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Total:</p>
                      <p className="font-medium text-teal-700">
                        {(item.cantPedido * Number(item.precioPedido)).toFixed(2)}{" "}
                        {pedido.monedaPedido === "PEN" ? "S/." : "$"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No se encontraron productos en este pedido
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t bg-gray-50 p-4">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Subtotal:</span>
              <span>
                {subtotal.toFixed(2)} {pedido.monedaPedido === "PEN" ? "S/." : "$"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">IGV (18%):</span>
              <span>
                {igv.toFixed(2)} {pedido.monedaPedido === "PEN" ? "S/." : "$"}
              </span>
            </div>
            <div className="flex justify-between font-bold text-lg text-teal-900">
              <span>Total:</span>
              <span>
                {total.toFixed(2)} {pedido.monedaPedido === "PEN" ? "S/." : "$"}
              </span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}