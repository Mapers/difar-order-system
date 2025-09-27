'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Printer,
  FileDown,
  Clock,
  Plus,
  Trash,
  Edit,
  X,
  Save,
  Pen,
  ArrowBigDownDash,
  OctagonAlert
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import apiClient from "@/app/api/client"
import { useAuth } from "@/context/authContext"
import { use } from 'react'
import { Pedido, PedidoDet } from "@/app/dashboard/estados-pedidos/page"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Package } from "lucide-react"
import {getBonificadosRequest, getEscalasRequest, getProductsRequest} from "@/app/api/products";
import {IPromocionRequest} from "@/interface/order/product-interface";
import ModalLoader from "@/components/modal/modalLoader";
import * as moment from "moment/moment";
import {ORDER_STATES} from "@/app/dashboard/mis-pedidos/page";

interface IProduct {
  IdArticulo: string
  Codigo_Art: string
  NombreItem: string
  PUContado: number
  Stock: number
  Descripcion: string
}

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [detalles, setDetalles] = useState<PedidoDet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [tempDetalles, setTempDetalles] = useState<PedidoDet[]>([])
  const [products, setProducts] = useState<IProduct[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [openProductDialog, setOpenProductDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [modalLoader, setModalLoader] = useState<'BONIFICADO' | 'ESCALA' | 'EVALUACION' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const auth = useAuth();
  const { id } = use(params)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const resCab = await apiClient.get(`/pedidos/${id || ''}`)
        const pedidoData = resCab.data.data

        let url = `/pedidosDetalles/${id || ''}/detalles`
        if (auth.user?.idRol === 1) {
          url += `?vendedor=${auth.user?.codigo}`
        }
        const resDet = await apiClient.get(url)
        const detallesData = resDet.data.data.map(item => ({
          ...item,
          cantPedido: Number(item.cantPedido)
        }))

        setPedido(pedidoData)
        setDetalles(detallesData)
        setTempDetalles(detallesData)
      } catch (err) {
        setError("Error al cargar los datos del pedido")
        console.error("Error fetching order details:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, auth.user])

  const calculateTotals = (items: PedidoDet[]) => {
    if (!items.length) return { subtotal: 0, igv: 0, total: 0 }

    const subtotal = items.reduce((sum, item) => sum + (item.cantPedido * Number(item.precioPedido)), 0)
    const igv = subtotal * 0.18

    return { subtotal: subtotal / 1.18, igv, total: subtotal }
  }

  const { subtotal, igv, total } = calculateTotals(isEditing ? tempDetalles : detalles)

  const getStateInfo = (stateId: number, porAutorizar: string, isAutorizado: string) => {
    if (porAutorizar === 'S' && isAutorizado === 'N') return ORDER_STATES.find(e => e.id === -2);
    if (porAutorizar === 'S' && (isAutorizado === '' || isAutorizado === null)) return ORDER_STATES.find(e => e.id === -1);
    return ORDER_STATES.find(state => state.id === stateId)
  }

  const canEdit = pedido?.estadodePedido === 1

  const handleEditToggle = async () => {
    if (isEditing) {
      setTempDetalles(detalles)
    } else {
      const resProducts = await getProductsRequest()
      const productsData = resProducts.data?.data?.data || []
      setProducts(productsData)
    }
    setIsEditing(!isEditing)
  }

  const handleSaveChanges = async () => {
    try {
      const pedidoData = {
        insertedId: pedido?.idPedidocab,
        usuario: 0,
        detalles: tempDetalles.map(item => ({
          iditemPedido: item.iditemPedido,
          codigoitemPedido: item.codigoitemPedido,
          cantPedido: item.cantPedido,
          precioPedido: item?.precioPedido,
          isbonificado: item.isBonification ? 1 : 0,
          isescala: item.isEscale ? 1 : 0
        })),
      }

      const response = await apiClient.post('/pedidosDetalles/detalles', pedidoData)

      if (response.status === 201) {
        const resDet = await apiClient.get(`/pedidosDetalles/${id || ''}/detalles`)
        setDetalles(resDet.data.data)
        setIsEditing(false)
      } else {

        setIsEditing(false)
      }
    } catch (error) {
      console.error("Error saving changes:", error)
      setError("Error al guardar los cambios")
    }
  }

  const handleRemoveItem = (index: number) => {
    if (isEditing) {
      const newItems = [...tempDetalles]
      newItems.splice(index, 1)
      setTempDetalles(newItems)
    }
  }

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (isEditing && newQuantity > 0) {
      const newItems = [...tempDetalles]
      newItems[index].cantPedido = String(newQuantity)
      setTempDetalles(newItems)
    }
  }

  // Lista escalas
  const getEscalas = async (idArticulo: string, cantidad: number) => {
    try {
      const requestEscala: IPromocionRequest = {
        idArticulo: idArticulo,
        cantidad: cantidad
      }
      const response = await getEscalasRequest(requestEscala)
      if (response.data.message === 404) return []
      return response?.data?.data?.data
    }
    catch (error) {
      console.error("Error fetching escalas:", error);
    }
  }

  // lista bonificados
  const getBonificados = async (idArticulo: string, cantidad: number) => {
    try {
      const requestBonificado: IPromocionRequest = {
        idArticulo: idArticulo,
        cantidad: cantidad
      }
      const response = await getBonificadosRequest(requestBonificado)
      if (response.data.message === 404) return []
      return response?.data?.data?.data
    }
    catch (error) {
      console.error("Error fetching bonificado:", error);
    }
  }

  const handleAddProduct = async () => {
    if (!selectedProduct) return;
    try {
      const idArticulo = selectedProduct.Codigo_Art;
      const cantidad = quantity;


      setModalLoader('BONIFICADO');
      setIsLoading(true);
      const bonificaciones = await getBonificados(idArticulo, cantidad);
      setIsLoading(false);

      setModalLoader('ESCALA');
      setIsLoading(true);
      const escalasProductos = await getEscalas(idArticulo, cantidad);
      setIsLoading(false);

      setTempDetalles([...tempDetalles, {
        idPedidodet: tempDetalles.length + 1,
        productoNombre: selectedProduct.NombreItem,
        codigoitemPedido: selectedProduct.Codigo_Art,
        iditemPedido: selectedProduct.IdArticulo,
        productoUnidad: selectedProduct.Descripcion,
        precioPedido: String(selectedProduct.PUContado),
        idPedidocab: id,
        cantPedido: String(quantity),
        isBonification: bonificaciones.length > 0,
        isEscale: escalasProductos.length > 0,
        appliedScale: '',
      },])
      setSelectedProduct(null)
      setQuantity(1)
      setOpenProductDialog(false)
    } catch (error) {
      console.error("Error al agregar producto:", error);
    } finally {
      setIsLoading(false);
      setModalLoader(null);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.Codigo_Art.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.NombreItem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.Descripcion.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="grid gap-6">
        {/* Loading skeleton... */}
      </div>
    )
  }

  if (error || !pedido) {
    return (
      <div className="grid gap-6">
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/estados-pedidos">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4"/>
              <span className="sr-only">Volver</span>
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            Pedido #{pedido.nroPedido}
          </h1>
          {canEdit && (
            <Button
              variant={isEditing ? "outline" : "default"}
              onClick={handleEditToggle}
              className="ml-auto gap-2"
            >
              {isEditing ? (
                <>
                  <X className="h-4 w-4"/>
                  Cancelar
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4"/>
                  Editar
                </>
              )}
            </Button>
          )}
        </div>
        <p className="text-gray-500">Información completa del pedido y sus productos.</p>
      </div>

      {/*<div className="flex justify-end gap-2">*/}
      {/*  <Button variant="outline" className="gap-2" disabled>*/}
      {/*    <Printer className="h-4 w-4"/>*/}
      {/*    <span className="hidden sm:inline">Imprimir</span>*/}
      {/*  </Button>*/}
      {/*  <Button variant="outline" className="gap-2" disabled>*/}
      {/*    <FileDown className="h-4 w-4"/>*/}
      {/*    <span className="hidden sm:inline">Descargar PDF</span>*/}
      {/*  </Button>*/}
      {/*</div>*/}

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
                  {pedido.monedaPedido === "PEN" ? "Soles (S/)" : "Dólares ($)"}
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
                <Badge className={`${getStateInfo(pedido.estadodePedido, pedido.por_autorizar, pedido.is_autorizado)?.color} flex items-center gap-1 text-xs`}>
                  {getStateInfo(pedido.estadodePedido, pedido.por_autorizar, pedido.is_autorizado)?.name || 'Desconocido'}
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
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold text-teal-700">Productos</CardTitle>
            {isEditing && (
              <Dialog open={openProductDialog} onOpenChange={setOpenProductDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4"/>
                    Agregar Producto
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Agregar Producto</DialogTitle>
                    <DialogDescription>
                      Selecciona un producto para agregar al pedido
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Buscar Producto</Label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500"/>
                        <Input
                          placeholder="Buscar por código, nombre o laboratorio..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto border rounded-md">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.IdArticulo}
                          className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                            selectedProduct?.IdArticulo === product.IdArticulo ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => setSelectedProduct(product)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium">{product.NombreItem}</h4>
                              <p className="text-sm text-gray-500">{product.Codigo_Art}</p>
                              <p className="text-sm text-gray-500">{product.Descripcion}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                S/ {Number(product.PUContado).toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-500">Stock: {product.Stock}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedProduct && (
                      <div className="space-y-2">
                        <Label>Cantidad</Label>
                        <Input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(Number(e.target.value))}
                        />
                      </div>
                    )}

                    <Button
                      onClick={handleAddProduct}
                      disabled={!selectedProduct || quantity <= 0}
                      className="w-full"
                    >
                      Agregar Producto
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
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
                  {isEditing && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isEditing ? tempDetalles : detalles).map((item, index) => (
                  <TableRow key={item.idPedidodet || index} className="hover:bg-gray-50">
                    <TableCell>{item.codigoitemPedido}</TableCell>
                    <TableCell className='flex'>
                      {item.is_editado === 'S' && <Pen className="h-4 w-4 mr-2 text-blue-600" />}
                      {item.is_autorizado === 'S' && <ArrowBigDownDash className="h-5 w-5 mr-2 text-orange-600" />}
                      {item.productoNombre || "Producto no especificado"}
                    </TableCell>
                    <TableCell>{item.cod_lote || ''} - {item.fec_venc_lote || ''}</TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          min="1"
                          value={item.cantPedido}
                          onChange={(e) => handleQuantityChange(index, Number(e.target.value))}
                          className="w-20 text-right"
                        />
                      ) : (
                        Number(item.cantPedido)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {pedido.monedaPedido === "PEN" ? "S/ " : "$"} {item.precioPedido}
                    </TableCell>
                    <TableCell className="text-right">
                      {pedido.monedaPedido === "PEN" ? "S/ " : "$"}
                      {(item.cantPedido * Number(item.precioPedido)).toFixed(2)}{" "}
                    </TableCell>
                    {isEditing && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash className="h-4 w-4"/>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="lg:hidden space-y-3 p-4">
            {(isEditing ? tempDetalles : detalles).map((item, index) => (
                <Card key={item.idPedidodet || index} className="shadow-sm border">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm text-gray-500">Código</p>
                          <p className="font-semibold">{item.codigoitemPedido}</p>
                        </div>
                        {isEditing && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-600 hover:text-red-800 h-8 w-8 p-0"
                            >
                              <Trash className="h-4 w-4"/>
                            </Button>
                        )}
                      </div>

                      <div>
                        <p className="font-medium text-sm text-gray-500">Producto</p>
                        <p className="font-semibold flex">
                          {item.is_editado === 'S' && <Pen className="h-4 w-4 mr-2 text-blue-600" />}
                          {item.is_autorizado === 'S' && <ArrowBigDownDash className="h-5 w-5 mr-2 text-orange-600" />}
                          {item.productoNombre || "Producto no especificado"}
                        </p>
                      </div>

                      <div>
                        <p className="font-medium text-sm text-gray-500">Lote - Fec.Venc</p>
                        <p>{item.cod_lote || ''} - {item.fec_venc_lote || ''}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium text-sm text-gray-500">Cantidad</p>
                          {isEditing ? (
                              <Input
                                  type="number"
                                  min="1"
                                  value={item.cantPedido}
                                  onChange={(e) => handleQuantityChange(index, Number(e.target.value))}
                                  className="w-full"
                              />
                          ) : (
                              <p className="font-semibold">{Number(item.cantPedido)}</p>
                          )}
                        </div>

                        <div>
                          <p className="font-medium text-sm text-gray-500">Precio Unitario</p>
                          <p className="font-semibold">
                            {pedido.monedaPedido === "PEN" ? "S/ " : "$"} {item.precioPedido}
                          </p>
                        </div>
                      </div>

                      <div className="border-t pt-2">
                        <p className="font-medium text-sm text-gray-500">Total</p>
                        <p className="font-bold text-lg text-teal-700">
                          {pedido.monedaPedido === "PEN" ? "S/ " : "$"}
                          {(item.cantPedido * Number(item.precioPedido)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t bg-gray-50 p-4">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Subtotal:</span>
              <span>
                {pedido.monedaPedido === "PEN" ? "S/" : "$"} {subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">IGV (18%):</span>
              <span>
                {pedido.monedaPedido === "PEN" ? "S/" : "$"} {igv.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-lg text-teal-900">
              <span>Total:</span>
              <span>
                {pedido.monedaPedido === "PEN" ? "S/" : "$"} {total.toFixed(2)}
              </span>
            </div>
          </div>

          {isEditing && (
            <Button onClick={handleSaveChanges} className="ml-4 gap-2">
              <Save className="h-4 w-4"/>
              Guardar Cambios
            </Button>
          )}
        </CardFooter>
      </Card>

      <ModalLoader
        open={isLoading}
        onOpenChange={setIsLoading}
        caseKey={modalLoader ?? undefined}
      />
    </div>
  )
}