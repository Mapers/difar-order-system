"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash, ShoppingCart, ArrowRight, ArrowLeft, Check } from "lucide-react"
import { StepProgress } from "@/components/step-progress"

// Mock data
const clients = [
  { Codigo: "C001", Nombre: "Cliente 1" },
  { Codigo: "C002", Nombre: "Cliente 2" },
  { Codigo: "C003", Nombre: "Cliente 3" },
]

const conditions = [
  { CodigoCondicion: "001", Descripcion: "Crédito" },
  { CodigoCondicion: "002", Descripcion: "Factura" },
  { CodigoCondicion: "003", Descripcion: "Boleta" },
]

const products = [
  { IdArticulo: 1, NombreItem: "Producto 1", Precio: 100.0 },
  { IdArticulo: 2, NombreItem: "Producto 2", Precio: 200.0 },
  { IdArticulo: 3, NombreItem: "Producto 3", Precio: 150.0 },
]

interface OrderItem {
  IdArticulo: number
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
  const [currency, setCurrency] = useState("NSO")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])

  const steps = ["Cliente", "Condiciones", "Productos", "Resumen"]

  const handleAddProduct = () => {
    const product = products.find((p) => p.IdArticulo.toString() === selectedProduct)
    if (!product) return

    const newItem: OrderItem = {
      IdArticulo: product.IdArticulo,
      NombreItem: product.NombreItem,
      Cantidad: quantity,
      Precio: product.Precio,
      Total: product.Precio * quantity,
    }

    setOrderItems([...orderItems, newItem])
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Create order object
    const order = {
      clientePedido: client,
      clienteNombre: clientName,
      fechaPedido: new Date().toISOString().split("T")[0],
      monedaPedido: currency,
      condicionPedido: condition,
      condicionNombre: conditionName,
      items: orderItems,
    }

    // In a real app, you would save this to your database
    console.log("Order created:", order)

    // Navigate to summary page
    router.push("/dashboard")
  }

  const handleClientSelect = (value: string) => {
    setClient(value)
    const selectedClient = clients.find((c) => c.Codigo === value)
    if (selectedClient) {
      setClientName(selectedClient.Nombre)
    }
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
                <Select value={client} onValueChange={handleClientSelect} required>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.Codigo} value={c.Codigo}>
                        {c.Nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
          <Card className="shadow-md bg-white">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="text-xl font-semibold text-blue-700">Condiciones del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="condition" className="text-gray-700">
                  Condición
                </Label>
                <Select value={condition} onValueChange={handleConditionSelect} required>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Seleccionar condición" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions.map((c) => (
                      <SelectItem key={c.CodigoCondicion} value={c.CodigoCondicion}>
                        {c.Descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-gray-700">
                  Moneda
                </Label>
                <Select value={currency} onValueChange={setCurrency} required>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NSO">Soles (NSO)</SelectItem>
                    <SelectItem value="USD">Dólares (USD)</SelectItem>
                  </SelectContent>
                </Select>
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
        )}

        {currentStep === 2 && (
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
                      {products.map((p) => (
                        <SelectItem key={p.IdArticulo} value={p.IdArticulo.toString()}>
                          {p.NombreItem}
                        </SelectItem>
                      ))}
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
                            <TableCell>{item.NombreItem}</TableCell>
                            <TableCell className="text-right">{item.Cantidad}</TableCell>
                            <TableCell className="text-right">
                              {item.Precio.toFixed(2)} {currency === "NSO" ? "S/." : "$"}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.Total.toFixed(2)} {currency === "NSO" ? "S/." : "$"}
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

        {currentStep === 3 && (
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
                        <p className="text-gray-900">{currency === "NSO" ? "Soles (S/.)" : "Dólares ($)"}</p>
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
                          <TableCell>{item.NombreItem}</TableCell>
                          <TableCell className="text-right">{item.Cantidad}</TableCell>
                          <TableCell className="text-right">
                            {item.Precio.toFixed(2)} {currency === "NSO" ? "S/." : "$"}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.Total.toFixed(2)} {currency === "NSO" ? "S/." : "$"}
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
                  {calculateTotal().toFixed(2)} {currency === "NSO" ? "S/." : "$"}
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

