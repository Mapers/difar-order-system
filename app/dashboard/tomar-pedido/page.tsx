'use client'
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import {
  ShoppingCart,
  ArrowRight,
  ArrowLeft,
  Check,
  Search,
  Package,
  User,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  DollarSign,
  Coins,
  FileText,
  Trash
} from "lucide-react"
import { StepProgress } from "@/components/step-progress"
import apiClient from "@/app/api/client"
import { Skeleton } from "@/components/ui/skeleton"
import * as moment from 'moment'
import ContactInfo from "@/components/cliente/contactInfo"
import FinancialZone from "@/components/cliente/financialZone"
import PaymentCondition from "@/components/cliente/paymentCondition"
import debounce from 'lodash.debounce';
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover"
import { CommandEmpty, CommandGroup, CommandInput, CommandList, Command, CommandItem } from "@/components/ui/command"
import ModalBonification from "@/components/modal/modalBonification"
import ModalEscale from "@/components/modal/modalEscale"
import { monedas, PROMOCIONES } from "@/constants"
import { fetchGetClients, fetchGetConditions, fetchGetZona, fetchUnidaTerritorial } from "@/app/api/takeOrders"
import { getBonificadosRequest, getEscalasRequest, getProductsRequest } from "@/app/api/products"
import { ICurrentBonification, ICurrentScales, IEscala, IProduct, IPromocionRequest, ISelectedProduct, OrderItem } from "@/interface/order/product-interface"
import { IClient, ICondicion, IDistrito, IMoneda, ITerritorio } from "@/interface/order/client-interface"
import ModalLoader from "@/components/modal/modalLoader"
import {useAuth} from "@/context/authContext";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {LaboratorioModal} from "@/app/dashboard/tomar-pedido/laboratorio-modal";

export default function OrderPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false);
  const [modalLoader, setModalLoader] = useState<'BONIFICADO' | 'ESCALA' | 'EVALUACION' | null>(null);

  // Estados para cliente
  const [client, setClient] = useState("")
  const [clientName, setClientName] = useState("")
  const [nameZone, setNameZone] = useState("")
  const [selectedClient, setSelectedClient] = useState<IClient | null>(null)
  const [condition, setCondition] = useState<ICondicion | null>(null)
  const [currency, setCurrency] = useState<IMoneda | null>(null)
  const [clients, setClients] = useState<IClient[]>([])
  const [conditions, setConditions] = useState<ICondicion[]>([])
  const [contactoPedido, setContactoPedido] = useState('');
  const [referenciaDireccion, setReferenciaDireccion] = useState('');
  const [note, setNote] = useState('');
  const [unidadTerritorio, setUnidadTerritorio] = useState<ITerritorio>({
    NombreDistrito: "",
    nombreProvincia: '',
    nombreDepartamento: '',
    ubigeo: ''
  })
  // Agrega al inicio con los demás estados
  const [laboratorios, setLaboratorios] = useState<string[]>([]);
  const [selectedLaboratorio, setSelectedLaboratorio] = useState<string | null>(null);
  const [showLaboratorioModal, setShowLaboratorioModal] = useState(false);
  const [tempSelectedProducts, setTempSelectedProducts] = useState<ISelectedProduct[]>([]);
  const auth = useAuth();
  const [priceType, setPriceType] = useState<'contado' | 'credito'>('contado');

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
  const [currentBonification, setCurrentBonification] = useState<ICurrentBonification | null>(null)

  // Estados para escalas
  const [currentScales, setCurrentScales] = useState<ICurrentScales | null>(null)

  // order
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [products, setProducts] = useState<IProduct[]>([])



  const steps = ["Cliente", "Productos", "Resumen"]
  // obtiene una zona por id
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

  // lista clientes  con funcion debouse 
  const debouncedFetchClients = debounce(async () => {
    if (search.client.length >= 4) {
      setLoading(prev => ({ ...prev, clients: true }));
      try {
        const response = await fetchGetClients(search.client, auth.user?.codigo || '');
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

  const addProductToList = (isBonification: boolean, isEscale: boolean) => {
    setIsLoading(true)
    setTimeout(() => {
      const appliedScale = '';
      const finalPrice = priceType === 'contado'
        ? Number(selectedProduct?.PUContado)
        : Number(selectedProduct?.PUCredito);
      console.log(priceType, selectedProduct?.PUCredito, selectedProduct?.PUContado)
      setSelectedProducts([
        ...selectedProducts,
        {
          product: selectedProduct!,
          quantity,
          isBonification,
          isEscale,
          appliedScale,
          finalPrice,
        },
      ])
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

  const getApplicableScale = (productCode: string, quantity: number, productosEscala: IEscala[]) => {
    if (!productosEscala) return null
    return productosEscala.find((scale: IEscala) =>
      scale.IdArticulo === productCode && quantity >= scale.minimo &&
      (scale.maximo === null || quantity <= scale.maximo)
    ) || null
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

      addProductToList(bonificaciones.length > 0, escalasProductos.length > 0);
    } catch (error) {
      console.error("Error al agregar producto:", error);
    } finally {
      setIsLoading(false);
      setModalLoader(null);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch((prev) => ({ ...prev, client: value }));
    if (value === '') {
      setSelectedClient(null);
    }
  }

  const handleRemoveItem = (index: number) => {
    const newItems = [...selectedProducts]
    newItems.splice(index, 1)
    setSelectedProducts(newItems)
  }

  const calcularSubtotal = (productos: ISelectedProduct[]): number => {
    return productos.reduce((sum, item) => {
      const precioUnitario = item.isBonification
        ? 0
        : item.appliedScale?.precio_escala ?? item.finalPrice
      return sum + precioUnitario * item.quantity
    }, 0)
  }

  const calcularIGV = (productos: ISelectedProduct[]): number => {
    return calcularSubtotal(productos) * 0.18
  }

  const calcularTotal = (productos: ISelectedProduct[]): number => {
    const subtotal = calcularSubtotal(productos)
    const igv = calcularIGV(productos)
    return subtotal
  }

  // Agrega este useEffect para extraer laboratorios
  useEffect(() => {
    if (products.length > 0) {
      const labs = [...new Set(products.map(p => p.Descripcion))];
      setLaboratorios(labs);
    }
  }, [products]);

  const handleAddTempProduct = async (product: IProduct, quantity: number, priceType: 'contado' | 'credito') => {
    setIsLoading(true);
    setModalLoader('BONIFICADO');

    const bonificaciones = await getBonificados(product.Codigo_Art, quantity);
    const escalasProductos = await getEscalas(product.Codigo_Art, quantity);

    setIsLoading(false);
    setModalLoader(null);

    const newProduct: ISelectedProduct = {
      product,
      quantity,
      isBonification: bonificaciones.length > 0,
      isEscale: escalasProductos.length > 0,
      appliedScale: null,
      finalPrice: Number(priceType === 'contado' ? product.PUContado : product.PUCredito),
    };

    setTempSelectedProducts(prev => [...prev, newProduct]);
  };

  const handleRemoveTempProduct = (index: number) => {
    setTempSelectedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmSelection = () => {
    setSelectedProducts(prev => [...prev, ...tempSelectedProducts]);
    setTempSelectedProducts([]);
    setShowLaboratorioModal(false);
    setSelectedLaboratorio(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const pedidoData = {
        clientePedido: client,
        monedaPedido: currency?.value,
        condicionPedido: condition?.CodigoCondicion,
        contactoPedido: contactoPedido,
        direccionEntrega: selectedClient?.Dirección,
        referenciaDireccion: referenciaDireccion,
        fechaPedido: moment(new Date()).format('yyyy-MM-DD'),
        usuario: 1,
        vendedorPedido: auth.user?.codigo,
        detalles: selectedProducts.map(item => ({
          iditemPedido: item.product.IdArticulo,
          codigoitemPedido: item.product.Codigo_Art,
          cantPedido: item.quantity,
          precioPedido: item?.finalPrice,
          isbonificado: item.isBonification ? 1 : 0,
          isescala: item.isEscale ? 1 : 0
        })),
        estadodePedido: 1,
        telefonoPedido: selectedClient?.telefono,
        horaPedido: moment(new Date()).format('HH:mm'),
        notaPedido: note,
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


  const handleChangeContactoPedido = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactoPedido(e.target.value);
  };
  const handleChangeReferenciaDireccion = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReferenciaDireccion(e.target.value);
  };



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

  const handleConditionSelect = (condition: ICondicion) => {
    const selectedCondition = conditions.find((c) => c.CodigoCondicion === condition.CodigoCondicion)
    if (selectedCondition) {
      setCondition(selectedCondition);
      console.log("condicion:", selectedCondition)
    }
  }

  const handleCurrencySelect = (currency: IMoneda) => {
    const selectedTypeMoneda = monedas.find((m) => m.value === currency.value)
    if (selectedTypeMoneda) {
      setCurrency(selectedTypeMoneda)
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
        return !!client && currency && condition
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
              {selectedClient && <ContactInfo
                client={selectedClient}
                referenciaDireccion={referenciaDireccion}
                contactoPedido={contactoPedido}
                onChangeReferenciaDireccion={handleChangeReferenciaDireccion}
                onChangeContactoPedido={handleChangeContactoPedido}

              />}
              {selectedClient && <FinancialZone client={selectedClient} nameZone={nameZone} unidadTerritorio={unidadTerritorio} />}
              {selectedClient &&
                <PaymentCondition
                  conditions={conditions}
                  monedas={monedas}
                  onConditionChange={handleConditionSelect}
                  onCurrencyChange={handleCurrencySelect}
                  selectedCondition={condition}
                  selectedCurrency={currency}
                />}
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
                  <div className="flex flex-col sm:flex-row items-start gap-2">
                    <div className="flex-1 space-y-2">
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
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
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
                                          <Package className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600"/>
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
                                          {/* Mostrar ambos precios en los resultados */}
                                          <div className="flex justify-between mt-2 text-xs">
                        <span className="text-green-600">
                          Contado: {currency?.value === "PEN" ? "S/." : "$"}
                          {Number(product.PUContado).toFixed(2)}
                        </span>
                                            <span className="text-blue-600">
                          Crédito: {currency?.value === "PEN" ? "S/." : "$"}
                                              {Number(product.PUCredito).toFixed(2)}
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

                      {selectedProduct && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div
                            className={`border rounded-md p-2 cursor-pointer text-center ${
                              priceType === 'contado'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 bg-gray-50 text-gray-700'
                            }`}
                            onClick={() => setPriceType('contado')}
                          >
                            <div className="font-medium">Contado</div>
                            <div className="text-sm">
                              {currency?.value === "PEN" ? "S/." : "$"}
                              {Number(selectedProduct.PUContado).toFixed(2)}
                            </div>
                          </div>
                          <div
                            className={`border rounded-md p-2 cursor-pointer text-center ${
                              priceType === 'credito'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 bg-gray-50 text-gray-700'
                            }`}
                            onClick={() => setPriceType('credito')}
                          >
                            <div className="font-medium">Crédito</div>
                            <div className="text-sm">
                              {currency?.value === "PEN" ? "S/." : "$"}
                              {Number(selectedProduct.PUCredito).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 sm:w-48 transition-all duration-200">
                      <Label htmlFor="laboratorio" className="text-gray-700 text-xs sm:text-sm hidden sm:block">
                        Filtrar por lab
                      </Label>
                      <Select
                        value={selectedLaboratorio || ""}
                        onValueChange={(value) => {
                          setSelectedLaboratorio(value);
                          setShowLaboratorioModal(true);
                        }}
                      >
                        <SelectTrigger className="w-full sm:h-10 text-xs sm:text-sm bg-gray-50 border-gray-200">
                          <SelectValue placeholder="Laboratorio"/>
                        </SelectTrigger>
                        <SelectContent>
                          {laboratorios.map((lab) => (
                            <SelectItem key={lab} value={lab} className="text-xs sm:text-sm">
                              {lab}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                  <ShoppingCart className="mr-2 h-4 w-4"/>
                  Agregar Producto
                </Button>
              </CardContent>
            </Card>

            {/* Componente de verificación */}
            {/* <ModalLoader
              open={isCheckingBonification}
              onOpenChange={setIsCheckingBonification}
              caseKey="bonificaciones"
            /> */}
            <ModalLoader
              open={isLoading}
              onOpenChange={setIsLoading}
              caseKey={modalLoader ?? undefined}
            />

            {/* Modal de bonificaciones */}
            {/*<ModalBonification*/}
            {/*  open={showBonificationModal}*/}
            {/*  onOpenChange={setShowBonificationModal}*/}
            {/*  currentBonification={currentBonification}*/}
            {/*  products={products}*/}
            {/*  setSelectedProducts={setSelectedProducts}*/}
            {/*  addProductToList={addProductToList}*/}
            {/*  currency={currency}*/}
            {/*/>*/}

            {/* Modald de escalas  */}
            {/*<ModalEscale*/}
            {/*  open={showScalesModal}*/}
            {/*  onOpenChange={setShowScalesModal}*/}
            {/*  currentScales={currentScales}*/}
            {/*  products={products}*/}
            {/*  setSelectedProducts={setSelectedProducts}*/}
            {/*  addProductToList={addProductToList}*/}
            {/*  currency={currency}*/}
            {/*/>*/}
            {selectedProducts.length > 0 && (
              <Card className="shadow-md bg-white">
                <CardHeader className="border-b bg-gray-50">
                  <CardTitle className="text-xl font-semibold text-blue-700">Productos Seleccionados</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="hidden sm:block border rounded-md overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Producto
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Cantidad
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Precio Unit.
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Subtotal
                          </th>
                          <th scope="col"></th>
                        </tr>
                        </thead>
                        <tbody>
                        {selectedProducts.map((item, index) => {
                          const precioOriginal = item.finalPrice;
                          const precioEscala = item.appliedScale?.precio_escala;
                          const precioUnitario = item.isBonification ? 0 : precioEscala ?? precioOriginal;
                          const subtotal = precioUnitario * item.quantity;
                          return (
                            <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                <div className="flex items-center flex-wrap gap-1">
                                  {item.isBonification && (
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                      Bonificado
                                    </Badge>
                                  )}
                                  {item.appliedScale && (
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                      Escala {item.appliedScale.porcentaje_descuento}% desc.
                                    </Badge>
                                  )}
                                  <span>{item.product.NombreItem}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                                {item.quantity}
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                                <div className="flex flex-col items-end">
                                <span className={item.appliedScale ? "line-through text-gray-400 text-xs" : ""}>
                                  {currency?.value === "PEN" ? "S/." : "$"}
                                  {Number(precioOriginal).toFixed(2)}
                                </span>
                                  {item.appliedScale && (
                                    <span className="text-purple-600 font-medium text-sm">
                                    {currency?.value === "PEN" ? "S/." : "$"}
                                      {Number(precioEscala).toFixed(2)}
                                  </span>
                                  )}
                                  {item.isBonification && (
                                    <span
                                      className="text-green-600 text-sm">{currency?.value === "PEN" ? "S/." : "$"}0.00</span>
                                  )}
                                </div>
                              </td>

                              <td
                                className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                {currency?.value === "PEN" ? "S/." : "$"}
                                {subtotal.toFixed(2)}
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveItem(index)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                >
                                  Eliminar
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                        </tbody>
                        <TableFooter>
                          <TableRow>
                            <TableCell colSpan={3}></TableCell>
                            <TableCell className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                              Total:
                            </TableCell>
                            <TableCell
                              className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                              {currency?.value === "PEN" ? "S/." : "$"}
                              {selectedProducts
                                .reduce((sum, item) => {
                                  const precioUnitario = item.isBonification
                                    ? 0
                                    : item.appliedScale?.precio_escala ?? item.finalPrice
                                  return sum + precioUnitario * item.quantity
                                }, 0)
                                .toFixed(2)}
                            </TableCell>
                          </TableRow>
                        </TableFooter>
                      </table>
                    </div>
                  </div>

                  <div className="block sm:hidden space-y-3">
                    {selectedProducts.map((item, index) => {
                      const precioOriginal = item.finalPrice;
                      const precioEscala = item.appliedScale?.precio_escala;
                      const precioUnitario = item.isBonification ? 0 : precioEscala ?? precioOriginal;
                      const subtotal = precioUnitario * item.quantity;

                      return (
                        <Card key={index} className="p-4 relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto absolute right-0 top-0 text-red-500"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash className="h-5 w-5"/>
                          </Button>
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {item.isBonification && (
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                      Bonificado
                                    </Badge>
                                  )}
                                  {item.appliedScale && (
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                      Escala {item.appliedScale.porcentaje_descuento}% desc.
                                    </Badge>
                                  )}
                                </div>
                                <h4 className="font-medium text-sm truncate">{item.product.NombreItem}</h4>
                                <p className="text-xs text-gray-500">Código: {item.product.IdArticulo}</p>
                                <p className="text-xs text-gray-500">{item.product.Descripcion}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <Label className="text-xs text-gray-500">Cantidad</Label>
                                <p className="font-medium">{item.quantity}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">Precio Unit.</Label>
                                <div className="flex flex-col">
                                  <span className={item.appliedScale ? "line-through text-gray-400 text-xs" : ""}>
                                  {currency?.value === "PEN" ? "S/." : "$"}
                                    {Number(precioOriginal).toFixed(2)}
                                </span>
                                  {item.appliedScale && (
                                    <span className="text-purple-600 font-medium text-sm">
                                    {currency?.value === "PEN" ? "S/." : "$"}
                                      {Number(precioEscala).toFixed(2)}
                                  </span>
                                  )}
                                  {item.isBonification && (
                                    <span
                                      className="text-green-600 text-sm">{currency?.value === "PEN" ? "S/." : "$"}0.00</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">Subtotal</Label>
                                <p className="font-bold text-sm">
                                  {currency?.value === "PEN" ? "S/." : "$"}
                                  {subtotal.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Card>
                      )
                    })}

                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">Total:</span>
                          <span className="font-bold text-lg text-blue-700">
                            {currency?.value === "PEN" ? "S/." : "$"}
                            {selectedProducts
                              .reduce((sum, item) => {
                                const precioUnitario = item.isBonification
                                  ? 0
                                  : item.appliedScale?.precio_escala ?? item.finalPrice
                                return sum + precioUnitario * item.quantity
                              }, 0)
                              .toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t bg-gray-50 py-4">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!isStepValid()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Siguiente
                    <ArrowRight className="ml-2 h-4 w-4"/>
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
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"/>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Información del Cliente</h3>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-gray-500">Cliente</Label>
                        <p className="font-medium text-sm sm:text-base">{selectedClient?.Nombre}</p>
                        <p className="text-xs text-gray-500">Documento: doc nro</p>
                      </div>

                      <div className="flex items-start gap-2">
                        <Phone className="w-4 h-4 text-blue-600 mt-0.5"/>
                        <div>
                          <Label className="text-xs text-gray-500">Teléfono</Label>
                          <p className="text-sm">{selectedClient?.telefono ?? '+52 ---------'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-blue-600 mt-0.5"/>
                        <div>
                          <Label className="text-xs text-gray-500">Contacto para el Pedido</Label>
                          <p className="text-sm">{contactoPedido ?? '-----'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-green-600 mt-0.5"/>
                        <div>
                          <Label className="text-xs text-gray-500">Dirección de Entrega</Label>
                          <p className="text-sm">{selectedClient?.Dirección ?? 'Direccion entrega ----'}</p>
                          {selectedClient?.referenciaDireccion && (
                            <p className="text-xs text-gray-600 mt-1">Ref: {selectedClient.referenciaDireccion}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-purple-600 mt-0.5"/>
                        <div>
                          <Label className="text-xs text-gray-500">Zona</Label>
                          <p className="text-sm">
                            {nameZone}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* condiciones de pago */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-green-600"/>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Condiciones de Pago</h3>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-green-600 mt-0.5"/>
                      <div>
                        <Label className="text-xs text-gray-500">Condición</Label>
                        <p className="font-medium text-sm"> {condition?.Descripcion}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      {currency?.value === "PEN" ? (
                        <Coins className="w-4 h-4 text-green-600 mt-0.5"/>
                      ) : (
                        <DollarSign className="w-4 h-4 text-green-600 mt-0.5"/>
                      )}
                      <div>
                        <Label className="text-xs text-gray-500">Moneda</Label>
                        <p className="font-medium text-sm">{currency?.label}</p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Lista de productos */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600"/>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Productos Seleccionados</h3>
                </div>
                <div className="hidden sm:block border rounded-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Producto
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Cantidad
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Precio Unit.
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Subtotal
                        </th>
                        <th scope="col"></th>
                      </tr>
                      </thead>
                      <tbody>
                      {selectedProducts.map((item, index) => {
                        const precioOriginal = item.finalPrice;
                        const precioEscala = item.appliedScale?.precio_escala;
                        const precioUnitario = item.isBonification ? 0 : precioEscala ?? precioOriginal;
                        const subtotal = precioUnitario * item.quantity;
                        return (
                          <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                              <div className="flex items-center flex-wrap gap-1">
                                {item.isBonification && (
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                    Bonificado
                                  </Badge>
                                )}
                                {item.appliedScale && (
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                    Escala {item.appliedScale.porcentaje_descuento}% desc.
                                  </Badge>
                                )}
                                <span>{item.product.NombreItem}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                              {item.quantity}
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                              <div className="flex flex-col items-end">
                                <span className={item.appliedScale ? "line-through text-gray-400 text-xs" : ""}>
                                  {currency?.value === "PEN" ? "S/." : "$"}
                                  {Number(precioOriginal).toFixed(2)}
                                </span>
                                {item.appliedScale && (
                                  <span className="text-purple-600 font-medium text-sm">
                                    {currency?.value === "PEN" ? "S/." : "$"}
                                    {Number(precioEscala).toFixed(2)}
                                  </span>
                                )}
                                {item.isBonification && (
                                  <span
                                    className="text-green-600 text-sm">{currency?.value === "PEN" ? "S/." : "$"}0.00</span>
                                )}
                              </div>
                            </td>

                            <td
                              className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                              {currency?.value === "PEN" ? "S/." : "$"}
                              {subtotal.toFixed(2)}
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                Eliminar
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                      </tbody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={3}></TableCell>
                          <TableCell className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                            Total:
                          </TableCell>
                          <TableCell
                            className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                            {currency?.value === "PEN" ? "S/." : "$"}
                            {selectedProducts
                              .reduce((sum, item) => {
                                const precioUnitario = item.isBonification
                                  ? 0
                                  : item.appliedScale?.precio_escala ?? item.finalPrice
                                return sum + precioUnitario * item.quantity
                              }, 0)
                              .toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </table>
                  </div>
                </div>

                <div className="block sm:hidden space-y-3">
                  {selectedProducts.map((item, index) => {
                    const precioOriginal = item.finalPrice;
                    const precioEscala = item.appliedScale?.precio_escala;
                    const precioUnitario = item.isBonification ? 0 : precioEscala ?? precioOriginal;
                    const subtotal = precioUnitario * item.quantity;

                    return (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap gap-1 mb-2">
                                {item.isBonification && (
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                    Bonificado
                                  </Badge>
                                )}
                                {item.appliedScale && (
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                    Escala {item.appliedScale.porcentaje_descuento}% desc.
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-medium text-sm truncate">{item.product.NombreItem}</h4>
                              <p className="text-xs text-gray-500">Código: {item.product.IdArticulo}</p>
                              <p className="text-xs text-gray-500">{item.product.Descripcion}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <Label className="text-xs text-gray-500">Cantidad</Label>
                              <p className="font-medium">{item.quantity}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Precio Unit.</Label>
                              <div className="flex flex-col">
                                  <span className={item.appliedScale ? "line-through text-gray-400 text-xs" : ""}>
                                  {currency?.value === "PEN" ? "S/." : "$"}
                                    {Number(precioOriginal).toFixed(2)}
                                </span>
                                {item.appliedScale && (
                                  <span className="text-purple-600 font-medium text-sm">
                                    {currency?.value === "PEN" ? "S/." : "$"}
                                    {Number(precioEscala).toFixed(2)}
                                  </span>
                                )}
                                {item.isBonification && (
                                  <span
                                    className="text-green-600 text-sm">{currency?.value === "PEN" ? "S/." : "$"}0.00</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Subtotal</Label>
                              <p className="font-bold text-sm">
                                {currency?.value === "PEN" ? "S/." : "$"}
                                {subtotal.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 flex justify-between items-center">
                <div className="text-lg font-medium text-blue-900">Total del Pedido:</div>
                <div className="text-xl font-bold text-blue-900">
                  {currency?.value === "PEN" ? "S/." : "$"} {calcularTotal(selectedProducts).toFixed(2)}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600"/>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Nota de Pedido</h3>
                </div>

                <div className="bg-white rounded-lg border border-gray-200">
                  <Textarea
                    placeholder="Escribe aquí cualquier observación adicional para el pedido..."
                    className="min-h-[100px] resize-none border-0 focus-visible:ring-0"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <div className="border-t px-3 py-2 bg-gray-50 text-xs text-gray-500">
                    Esta información será incluida en el pedido.
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-gray-50 py-4">
              <Button type="button" variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Anterior
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                <Check className="mr-2 h-4 w-4"/>
                Confirmar Pedido
              </Button>
            </CardFooter>
          </Card>
        )}
      </form>

      <LaboratorioModal
        open={showLaboratorioModal && selectedLaboratorio !== null}
        onOpenChange={setShowLaboratorioModal}
        laboratorio={selectedLaboratorio || ""}
        products={products}
        onAddTempProduct={handleAddTempProduct}
        tempSelectedProducts={tempSelectedProducts}
        onRemoveTempProduct={handleRemoveTempProduct}
        onConfirmSelection={handleConfirmSelection}
        currency={currency}
      />
    </div>
  )
}