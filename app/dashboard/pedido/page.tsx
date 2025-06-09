'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash, ShoppingCart, ArrowRight, ArrowLeft, Check } from "lucide-react"
import { StepProgress } from "@/components/step-progress"
import apiClient from "@/app/api/client"
import { Skeleton } from "@/components/ui/skeleton"
import * as moment from 'moment'
import { fetchGetClients } from "@/app/api/clients"
import { IClient } from "@/interface/client/client-interface"
import ContactInfo from "@/components/cliente/contactInfo"
import { X } from "lucide-react"


interface ICondicion {
  CodigoCondicion: string
  Descripcion: string
  Credito: boolean
}

interface IProduct {
  IdArticulo: number
  Codigo_Art: string
  NombreItem: string
  Stock?: number
  precio1?: string;
}

interface OrderItem {
  IdArticulo: number
  Codigo_Art: string
  NombreItem: string
  Cantidad: number
  Precio: number
  Total: number
}

export default function OrderPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [client, setClient] = useState("")
  const [clientName, setClientName] = useState("")
  const [condition, setCondition] = useState("")
  const [conditionName, setConditionName] = useState("")
  const [currency, setCurrency] = useState("PEN")

  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [selectedClient, setSelectedClient] = useState<IClient | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [clients, setClients] = useState<IClient[]>([])
  const [conditions, setConditions] = useState<ICondicion[]>([])
  const [products, setProducts] = useState<IProduct[]>([])
  const [loading, setLoading] = useState({
    clients: false,
    conditions: true,
    products: true
  })
  const [search, setSearch] = useState({
    client: "",
    product: "",
    condition: ""
  })


  const steps = ["Cliente", "Productos", "Resumen"]


  useEffect(() => {
    const fetchClients = async () => {
      setLoading(prev => ({ ...prev, clients: true }));
      try {
        const response = await fetchGetClients(search.client);
        if (response.data?.data?.data.length == 0) {
          setClients([])
        }
        setClients(response.data?.data?.data || []);
      } catch (error) {
        console.error("Error fetching clients:", error);
      } finally {
        setLoading(prev => ({ ...prev, clients: false }));
      }
    };

    fetchClients();
  }, [search.client]);


  // Fetch conditions
  useEffect(() => {
    const fetchConditions = async () => {
      try {
        const response = await apiClient.get(`/condiciones?query=${search.condition}`)
        setConditions(response.data?.data?.data || [])
      } catch (error) {
        console.error("Error fetching conditions:", error)
      } finally {
        setLoading(prev => ({ ...prev, conditions: false }))
      }
    }

    fetchConditions()
  }, [search.condition])

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const url = search.product
          ? `/articulos/search?query=${encodeURIComponent(search.product)}`
          : '/articulos'

        const response = await apiClient.get(url)
        setProducts(response.data?.data?.data || [])
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoading(prev => ({ ...prev, products: false }))
      }
    }

    fetchProducts()
  }, [search.product])

  const handleAddProduct = () => {
    const product = products.find((p) => p.IdArticulo.toString() === selectedProduct)
    if (!product) return

    const existingItemIndex = orderItems.findIndex(item => item.IdArticulo === product.IdArticulo)

    if (existingItemIndex >= 0) {
      const updatedItems = [...orderItems]
      updatedItems[existingItemIndex].Cantidad += quantity
      updatedItems[existingItemIndex].Total = updatedItems[existingItemIndex].Cantidad * updatedItems[existingItemIndex].Precio
      setOrderItems(updatedItems)
    } else {
      const newItem: OrderItem = {
        IdArticulo: product.IdArticulo,
        Codigo_Art: product.Codigo_Art,
        NombreItem: product.NombreItem,
        Cantidad: quantity,
        Precio: Number(product.precio1),
        Total: Number(product.precio1) * quantity,
      }

      setOrderItems([...orderItems, newItem])
    }

    setSelectedProduct("")
    setQuantity(1)
  }

  const handleRemoveItem = (index: number) => {
    const newItems = [...orderItems]
    newItems.splice(index, 1)
    setOrderItems(newItems)
  }

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.Total, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const pedidoData = {
        clientePedido: client,
        monedaPedido: currency,
        condicionPedido: condition,
        fechaPedido: moment(new Date()).format('yyyy-MM-DD'),
        usuario: 1,
        detalles: orderItems.map(item => ({
          iditemPedido: item.IdArticulo,
          codigoitemPedido: item.Codigo_Art,
          cantPedido: item.Cantidad,
          precioPedido: item.Precio
        }))
      }

      const response = await apiClient.post('/pedidos', pedidoData)

      if (response.status === 201) {
        router.push("/dashboard/mis-pedidos")
      }
    } catch (error) {
      console.error("Error creating order:", error)
    }
  }

  // const handleClientSelect = (value: string) => {
  //   setClient(value)
  //   const selectedClient = clients.find((c) => c.codigo === value)
  //   if (selectedClient) {
  //     setClientName(selectedClient.Nombre)
  //   }
  // }
  const handleClientSelect = (value: string) => {
    const parsedClient = JSON.parse(value) as IClient
    setSelectedClient(parsedClient)
  }


  const handleConditionSelect = (value: string) => {
    setCondition(value)
    const selectedCondition = conditions.find((c) => c.CodigoCondicion === value)
    if (selectedCondition) {
      setConditionName(selectedCondition.Descripcion)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (step: number) => {
    setCurrentStep(step)
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 0: // Client step
        return !!client
      case 1: // Conditions step
        return !!condition
      case 2: // Products step
        return orderItems.length > 0
      default:
        return true
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Tomar Pedido</h1>
        <p className="text-gray-500">Crea un nuevo pedido siguiendo los pasos.</p>
      </div>

      <Card className="mb-6 shadow-md bg-white">
        <CardContent className="pt-6">
          <StepProgress steps={steps} currentStep={currentStep} onStepClick={goToStep} />
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        {currentStep === 0 && (
          <Card className="shadow-md bg-white">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="text-xl font-semibold text-blue-700">Seleccionar Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="client" className="text-gray-700">
                  Cliente
                </Label>
                <div className="relative p-2">
                  <Input
                    placeholder="Buscar cliente..."
                    value={search.client}
                    onChange={(e) => setSearch({ ...search, client: e.target.value })}
                    className="mb-2 pr-8"
                  />
                  {search.client && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch({ ...search, client: "" })
                        setSelectedClient(null)
                        setClients([])
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {loading.clients ? (
                  <div className="p-4">
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : clients.length > 0 ? (
                  <div className="space-y-1">
                    {clients.map((c) => (
                      <div
                        key={c.codigo}
                        className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                        onClick={() => {
                          setSelectedClient(c)
                          setSearch({ ...search, client: `${c.Nombre} (${c.codigo})` })
                        }}
                      >
                        {c.Nombre} ({c.codigo})
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-sm text-gray-500">
                    No se encontraron clientes
                  </div>
                )}
              </div>
              {selectedClient && <ContactInfo client={selectedClient} />}
            </CardContent>
            <CardFooter className="flex justify-end border-t bg-gray-50 py-4">
              <Button
                type="button"
                onClick={nextStep}
                disabled={!isStepValid()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
        {currentStep === 1 && (
          <div className="grid gap-6">
            <Card className="shadow-md bg-white">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="text-xl font-semibold text-blue-700">Agregar Productos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="product" className="text-gray-700">
                    Producto
                  </Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        <Input
                          placeholder="Buscar producto..."
                          value={search.product}
                          onChange={(e) => setSearch({ ...search, product: e.target.value })}
                          className="mb-2"
                        />
                      </div>
                      {loading.products ? (
                        <div className="p-4">
                          <Skeleton className="h-4 w-full" />
                        </div>
                      ) : products.length > 0 ? (
                        products.map((p) => (
                          <SelectItem key={p.IdArticulo} value={p.IdArticulo.toString()}>
                            {p.NombreItem} ({p.Codigo_Art})
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-4 text-sm text-gray-500">
                          No se encontraron productos
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-gray-700">
                    Cantidad
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                    className="bg-white"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAddProduct}
                  disabled={!selectedProduct}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Agregar Producto
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-md bg-white">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="text-xl font-semibold text-blue-700">Productos Seleccionados</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">
                            No hay productos agregados
                          </TableCell>
                        </TableRow>
                      ) : (
                        orderItems.map((item, index) => (
                          <TableRow key={index} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="font-medium">{item.NombreItem}</div>
                              <div className="text-sm text-gray-500">{item.Codigo_Art}</div>
                            </TableCell>
                            <TableCell className="text-right">{item.Cantidad}</TableCell>
                            <TableCell className="text-right">
                              {Number(item.Precio).toFixed(2)} {currency === "PEN" ? "S/." : "$"}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.Total.toFixed(2)} {currency === "PEN" ? "S/." : "$"}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(index)}
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t bg-gray-50 py-4">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Siguiente
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {currentStep === 2 && (
          <Card className="shadow-md bg-white">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="text-xl font-semibold text-blue-700">Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Información del Cliente</h3>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Cliente:</p>
                        <p className="text-gray-900">{clientName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Código:</p>
                        <p className="text-gray-900">{client}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Información del Pedido</h3>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Condición:</p>
                        <p className="text-gray-900">{conditionName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Moneda:</p>
                        <p className="text-gray-900">{currency === "PEN" ? "Soles (S/.)" : "Dólares ($)"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Fecha:</p>
                        <p className="text-gray-900">{new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Productos</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item, index) => (
                        <TableRow key={index} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="font-medium">{item.NombreItem}</div>
                            <div className="text-sm text-gray-500">{item.Codigo_Art}</div>
                          </TableCell>
                          <TableCell className="text-right">{item.Cantidad}</TableCell>
                          <TableCell className="text-right">
                            {Number(item.Precio).toFixed(2)} {currency === "PEN" ? "S/." : "$"}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.Total.toFixed(2)} {currency === "PEN" ? "S/." : "$"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 p-4 flex justify-between items-center">
                <div className="text-lg font-medium text-blue-900">Total del Pedido:</div>
                <div className="text-xl font-bold text-blue-900">
                  {calculateTotal().toFixed(2)} {currency === "PEN" ? "S/." : "$"}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-gray-50 py-4">
              <Button type="button" variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                <Check className="mr-2 h-4 w-4" />
                Confirmar Pedido
              </Button>
            </CardFooter>
          </Card>
        )}
      </form>
    </div>
  )
}