'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Trash, ShoppingCart, ArrowRight, ArrowLeft, Check, Search, Package } from "lucide-react"
import { StepProgress } from "@/components/step-progress"
import apiClient from "@/app/api/client"
import { Skeleton } from "@/components/ui/skeleton"
import * as moment from 'moment'
import { fetchGetClients, fetchGetConditions, fetchGetZona, fetchUnidaTerritorial } from "@/app/api/orders"
import ContactInfo from "@/components/cliente/contactInfo"
import FinancialZone from "@/components/cliente/financialZone"
import PaymentCondition from "@/components/cliente/paymentCondition"
import debounce from 'lodash.debounce';
import { getBonificadosRequest, getEscalasRequest, getProductsRequest } from "@/app/api/products"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover"
import { CommandEmpty, CommandGroup, CommandInput, CommandList, Command, CommandItem } from "@/components/ui/command"
import ModalVerification from "@/components/modal/modalVerification"
import ModalBonification from "@/components/modal/modalBonification"
import ModalEscale from "@/components/modal/modalEscale"
import { evaluarPromociones } from "@/utils/order"
import { PROMOCIONES } from "@/constants"
import { IBonificado, ICurrentBonification, IEscala, IProduct, IPromocionRequest, ISelectedProduct, OrderItem } from "@/interface/order/product-interface"
import { IClient, ICondicion, IDistrito, ITerritorio } from "@/interface/order/client-interface"

export default function OrderPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  // Estados para cliente
  const [client, setClient] = useState("")
  const [clientName, setClientName] = useState("")
  const [condition, setCondition] = useState("")
  const [conditionName, setConditionName] = useState("")
  const [nameZone, setNameZone] = useState("")
  const [currency, setCurrency] = useState("PEN")
  const [selectedClient, setSelectedClient] = useState<IClient | null>(null)
  const [clients, setClients] = useState<IClient[]>([])
  const [conditions, setConditions] = useState<ICondicion[]>([])

  const [unidadTerritorio, setUnidadTerritorio] = useState<ITerritorio>({
    NombreDistrito: "",
    nombreProvincia: '',
    nombreDepartamento: '',
    ubigeo: ''
  })
  const [loading, setLoading] = useState({
    clients: false,
    conditions: true,
    products: false
  })
  const [search, setSearch] = useState({
    client: "",
    product: "",
    condition: ""
  })

  // Estado para productos
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null)

  // Funciona como orderItems
  const [selectedProducts, setSelectedProducts] = useState<ISelectedProduct[]>([])
  // Estados para modales
  const [isCheckingBonification, setIsCheckingBonification] = useState(false)
  const [showBonificationModal, setShowBonificationModal] = useState(false)
  const [currentBonification, setCurrentBonification] = useState<ICurrentBonification | null>(null)

  // Estados para escalas
  const [showScalesModal, setShowScalesModal] = useState(false)
  const [currentScales, setCurrentScales] = useState<any>(null)
  const [selectedScale, setSelectedScale] = useState<string | null>(null)

  // order
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [products, setProducts] = useState<IProduct[]>([])
  const [escalasProducto, setEscalasProducto] = useState<IEscala[]>([])
  const [bonificacionesProducto, setBonificacionesProducto] = useState<IBonificado[]>([])



  const monedas = [
    { value: 'PEN', label: 'Soles (PEN)' },
    { value: 'USD', label: 'Dólares (USD)' },
  ];

  const steps = ["Cliente", "Productos", "Resumen"]

  const getZona = async (idZona: string) => {
    try {
      const response = await fetchGetZona(idZona);
      setNameZone(response?.data?.data?.data?.NombreZona || "No definido")
    }
    catch (error) {
      console.error("Error fetching zona:", error);
    }
  }
  // lista territorio
  const getUnidadTerritorial = async (idDistrito: number) => {
    try {
      const request: IDistrito = {
        idDistrito: idDistrito.toString(),
      }
      const response = await fetchUnidaTerritorial(request);
      setUnidadTerritorio(response?.data?.data?.data[0] || "No definido");
    }
    catch (error) {
      console.error("Error fetching unidad territorial:", error);
    }
  }
  // Lista escalas
  const getEscalas = async (idArticulo: string, cantidad: number) => {
    try {
      const requestEscala: IPromocionRequest = {
        idArticulo: idArticulo,
        cantidad: cantidad
      }
      const response = await getEscalasRequest(requestEscala);
      setEscalasProducto(response?.data?.data?.data || [])
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
      const response = await getBonificadosRequest(requestBonificado);
      if (response?.data?.data?.data[0].Mensaje) return []
      console.log("> data bonificado:", response?.data.data.data)
      return response?.data?.data?.data
    }
    catch (error) {
      console.error("Error fetching bonificado:", error);
    }
  }
  // lista clientes  con funcion debouse 
  const debouncedFetchClients = debounce(async () => {
    if (search.client.length >= 4) {
      setLoading(prev => ({ ...prev, clients: true }));
      try {
        const response = await fetchGetClients(search.client);
        if (response.data?.data?.data.length === 0) {
          setClients([]);
        } else {
          setClients(response.data?.data?.data || []);
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
      } finally {
        setLoading(prev => ({ ...prev, clients: false }));
      }
    } else {
      setClients([]);
    }
  }, 500);

  // lista las condiciones
  const fetchConditions = async () => {
    try {
      const response = await fetchGetConditions(search.client);
      setConditions(response.data?.data?.data || [])
    } catch (error) {
      console.error("Error fetching conditions:", error)
    } finally {
      setLoading(prev => ({ ...prev, conditions: false }))
    }
  }

  const addProductToList = (appliedScale?: any) => {
    setIsLoading(true)
    setTimeout(() => {
      const finalPrice = appliedScale ? appliedScale.precio : selectedProduct!.precio1
      setSelectedProducts([
        ...selectedProducts,
        {
          product: selectedProduct!,
          quantity,
          appliedScale,
          finalPrice,
        },
      ])
      console.log(" selected  products : ", selectedProducts)
      setSelectedProduct(null)
      setQuantity(1)
      setIsLoading(false)
    }, 600)
  }


  useEffect(() => {
    debouncedFetchClients();
    return () => debouncedFetchClients.cancel();
  }, [search.client]);

  useEffect(() => {
    fetchConditions()
  }, [search.condition]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(prev => ({ ...prev, products: true }))
        const response = await getProductsRequest()
        setProducts(response.data?.data?.data || [])
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoading(prev => ({ ...prev, products: false }))
      }
    }

    fetchProducts()
  }, [search.product])


  // const getApplicableScale = (productCode: string, quantity: number) => {
  //   const productScales = escalas[productCode as keyof typeof escalas]
  //   if (!productScales) return null

  //   return productScales.find((scale) => quantity >= scale.minimo && quantity <= scale.maximo) || null
  // }
  const getApplicableScale = (productCode: string, quantity: number) => {
    return escalasProducto.find(scale =>
      scale.IdArticulo === productCode &&
      quantity >= scale.minimo &&
      (scale.maximo === null || quantity <= scale.maximo)
    ) || null
  }



  const handleAddProduct = async () => {
    if (!selectedProduct) return;
    setIsCheckingBonification(true);
    try {
      const idArticulo = selectedProduct.Codigo_Art;
      const cantidad = quantity;
      const result = evaluarPromociones(selectedProduct);
      switch (result) {
        case PROMOCIONES.BONIFICADO:
          const bonificaciones = await getBonificados(idArticulo, cantidad);
          if (bonificaciones.length > 0) {
            setCurrentBonification({
              bonificaciones,
              productoSolicitado: idArticulo,
              nombreProductoSolicitado: selectedProduct.NombreItem,
              cantidadSolicitada: cantidad,
            });
            setShowBonificationModal(true);
          }
          break
        case PROMOCIONES.ESCALA:
          break
        case PROMOCIONES.NO_ESCALA_BONIFICADO:
          addProductToList()
          break
      }
    } catch (error) {
      console.error("Error al agregar producto:", error);
    } finally {
      setIsCheckingBonification(false);
    }
  };
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch((prev) => ({ ...prev, client: value }));
    if (value === '') {
      setSelectedClient(null);
    }
  }
  const handleSearchChangeProduct = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch((prev) => ({ ...prev, product: value }));
    if (value === '') {
      // setSelectedProduct(null);
    }
  }
  const handleRemoveItem = (index: number) => {
    const newItems = [...selectedProducts]
    newItems.splice(index, 1)
    setSelectedProducts(newItems)
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

  const handleClientSelect = (c: IClient) => {
    setSelectedClient(c)
    setClient(c.codigo)
    setClientName(c.Nombre)
    setSearch({ ...search, client: `${c.Nombre} (${c.codigo})` })
    if (c.IdZona) {
      getZona(c.IdZona)
    }
    if (c.idDistrito) {
      getUnidadTerritorial(c.idDistrito)
    }

  }
  const filteredProducts = products.filter(
    (product) =>
      product.Codigo_Art.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.NombreItem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.Descripcion.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleProductSelect = (product: IProduct) => {
    setSelectedProduct(product)
    setOpen(false)
  }

  const handleConditionSelect = (value: string) => {
    setCondition(value)
    const selectedCondition = conditions.find((c) => c.CodigoCondicion === value)
    if (selectedCondition) {
      setConditionName(selectedCondition.Descripcion)
    }
  }

  const handleCurrencySelect = (value: string) => {
    setCurrency(value)
    const selectedTypeMoneda = monedas.find((m) => m.value === value)
    if (selectedTypeMoneda) {
      setConditionName(selectedTypeMoneda.label)
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
      case 1: // Products step
        return selectedProducts.length > 0
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
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Buscar cliente..."
                    value={search.client}
                    onChange={handleSearchChange}
                    className="pl-8 bg-white"
                  />
                </div>
                {loading.clients ? (
                  <div className="p-4">
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : clients.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto border space-y-1">
                    {clients.map((c) => (
                      <div
                        key={c.codigo}
                        className="relative flex  w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                        onClick={() => handleClientSelect(c)}
                      >
                        {c.Nombre} ({c.codigo})
                      </div>
                    ))}
                  </div>
                ) : !selectedClient ? (
                  <div className="p-4 text-sm text-gray-500">
                    No se encontraron clientes
                  </div>
                ) : null}
              </div>
              {selectedClient && <ContactInfo client={selectedClient} />}
              {selectedClient && <FinancialZone client={selectedClient} nameZone={nameZone} unidadTerritorio={unidadTerritorio} />}
              {selectedClient && <PaymentCondition conditions={conditions} monedas={monedas} onConditionChange={handleConditionSelect} onCurrencyChange={handleCurrencySelect} />}
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

                <div className="lg:col-span-2 space-y-2">
                  <Label htmlFor="producto" className="text-sm font-medium">
                    Producto
                  </Label>
                  <div className="relative">
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between h-10 sm:h-12 px-3 text-left font-normal text-sm"
                        >
                          {selectedProduct ? (
                            <div className="flex flex-col items-start min-w-0 flex-1">
                              <span className="font-medium truncate w-full">
                                {selectedProduct.NombreItem}
                              </span>
                              <span className="text-xs text-gray-500 truncate w-full">
                                {selectedProduct.Codigo_Art} | {selectedProduct.Descripcion}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500">Buscar producto...</span>
                          )}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="z-[999] w-[calc(100vw-2rem)] sm:w-full p-0"
                        align="start"
                        side="bottom"
                      >
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Buscar por código, nombre o laboratorio..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            className="text-sm"
                          />
                          <CommandList>
                            <CommandEmpty>No se encontraron productos.</CommandEmpty>
                            <CommandGroup heading="Resultados">
                              {filteredProducts.map((product) => (
                                <CommandItem
                                  key={product.Codigo_Art}
                                  value={product.Codigo_Art}
                                  onSelect={() => handleProductSelect(product)}
                                  className="py-3"
                                >
                                  <div className="flex items-start gap-2 w-full">
                                    <div className="bg-blue-100 p-2 rounded-md shrink-0">
                                      <Package className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <div className="flex justify-between items-start w-full gap-2">
                                        <span className="font-medium text-sm truncate flex-1">
                                          {product.NombreItem}
                                        </span>
                                        <div className="flex flex-wrap gap-1 shrink-0">
                                          <Badge
                                            variant="outline"
                                            className="bg-green-50 text-green-700 text-xs"
                                          >
                                            Stock: {product.Stock}
                                          </Badge>
                                          {product.tieneBonificado === 1 && (
                                            <Badge
                                              variant="outline"
                                              className="bg-yellow-50 text-yellow-700 text-xs"
                                            >
                                              Bonif.
                                            </Badge>
                                          )}
                                          {product.tieneEscala === 1 && (
                                            <Badge
                                              variant="outline"
                                              className="bg-purple-50 text-purple-700 text-xs"
                                            >
                                              Escalas
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-center w-full mt-1">
                                        <span className="text-xs text-gray-500 truncate">
                                          <span className="font-medium">Código:</span>{" "}
                                          {product.Codigo_Art}
                                        </span>
                                        <span className="text-xs text-gray-500 truncate">
                                          <span className="font-medium">Lab:</span>{" "}
                                          {product.Descripcion}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
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
                  disabled={!selectedProduct || loading.products || isCheckingBonification}
                  onClick={handleAddProduct}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Agregar Producto
                </Button>
              </CardContent>
            </Card>

            {/* Componente de verificación */}
            <ModalVerification
              open={isCheckingBonification}
              onOpenChange={setIsCheckingBonification}
            />

            {/* Modal de bonificaciones */}
            <ModalBonification
              open={showBonificationModal}
              onOpenChange={setShowBonificationModal}
              currentBonification={currentBonification}
              products={products}
              setSelectedProducts={setSelectedProducts}
              addProductToList={addProductToList}
            />

            {/* Modald de escalas  */}
            {/* <ModalEscale
              open={showScalesModal}
              onOpenChange={setShowScalesModal}
              currentScales={currentScales}
            /> */}
            {selectedProducts.length > 0 && (
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
                        {selectedProducts.map((item, index) => {
                          const precioOriginal = item.product.precio1;
                          const precioEscala = item.appliedScale?.precio1;
                          const precioUnitario = item.isBonification ? 0 : precioEscala ?? precioOriginal;
                          const subtotal = precioUnitario * item.quantity;
                          return (
                            <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                <div className="flex items-center flex-wrap gap-1">
                                  {item.isBonification && (
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                      Bonificado
                                    </Badge>
                                  )}
                                  {item.appliedScale && (
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                      Escala {item.appliedScale.descuento}% desc.
                                    </Badge>
                                  )}
                                  <span>{item.product.NombreItem}</span>
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                                {item.quantity}
                              </TableCell>

                              <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                                <div className="flex flex-col items-end">
                                  <span className={item.appliedScale ? "line-through text-gray-400 text-xs" : ""}>
                                    {currency === "PEN" ? "S/." : "$"}
                                    {Number(precioOriginal).toFixed(2)}
                                  </span>
                                  {item.appliedScale && (
                                    <span className="text-purple-600 font-medium text-sm">
                                      {currency === "PEN" ? "S/." : "$"}
                                      {Number(precioEscala).toFixed(2)}
                                    </span>
                                  )}
                                  {item.isBonification && (
                                    <span className="text-green-600 text-sm">{currency === "PEN" ? "S/." : "$"}0.00</span>
                                  )}
                                </div>
                              </TableCell>

                              <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                {currency === "PEN" ? "S/." : "$"}
                                {subtotal.toFixed(2)}
                              </TableCell>

                              <TableCell className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveItem(index)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                >
                                  Eliminar
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={3}></TableCell>
                          <TableCell className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                            Total:
                          </TableCell>
                          <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                            {currency === "PEN" ? "S/." : "$"}
                            {selectedProducts
                              .reduce((sum, item) => {
                                const precioUnitario = item.isBonification
                                  ? 0
                                  : item.appliedScale?.precio1 ?? item.product.precio1
                                return sum + precioUnitario * item.quantity
                              }, 0)
                              .toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
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
            )}
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