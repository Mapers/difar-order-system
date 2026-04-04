'use client'
import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TableCell, TableRow, TableFooter } from "@/components/ui/table"
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
  Trash, CheckSquare, Loader2,
  Locate, Building, Info, Gift, TrendingUp, ChevronDown, Bot, RefreshCw, Users, X
} from "lucide-react"
import { StepProgress } from "@/components/step-progress"
import apiClient from "@/app/api/client"
import { Skeleton } from "@/components/ui/skeleton"
import moment from 'moment'
import ContactInfo from "@/components/cliente/contactInfo"
import FinancialZone from "@/components/cliente/financialZone"
import PaymentCondition from "@/components/cliente/paymentCondition"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover"
import { monedas, PROMOCIONES } from "@/constants"
import {
  fetchGetAllClients,
  fetchGetConditions,
  fetchGetZona,
  fetchUnidaTerritorial, fetchUpdateClientRef,
} from "@/app/api/takeOrders"
import { getBonificadosRequest, getEscalasRequest, getProductsRequest } from "@/app/api/products"
import { ICurrentBonification, ICurrentScales, IEscala, IProduct, IPromocionRequest, ISelectedProduct, OrderItem } from "@/app/types/order/product-interface"
import { IClient, ICondicion, IDistrito, IMoneda, ITerritorio } from "@/app/types/order/client-interface"
import ModalLoader from "@/components/modal/modalLoader"
import {useAuth} from "@/context/authContext";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {LaboratorioModal} from "@/app/dashboard/tomar-pedido/laboratorio-modal";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader} from "@/components/ui/dialog";
import {DialogTitle} from "@radix-ui/react-dialog";
import {PriceService} from "@/app/services/price/PriceService";
import {format, parseISO} from "date-fns";
import {Combobox} from "@/app/dashboard/mis-pedidos/page";
import {useLaboratoriesData} from "@/app/dashboard/lista-precios-lote/hooks/useLaboratoriesData";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import OrderHistory from "@/components/tomarPedido/order-history";
import { toast } from "@/app/hooks/use-toast"
import AlternativeProductsModal from "@/components/tomarPedido/AlternativeProductsModal";

interface LoteProducto {
  value: string
}

interface ProductoConLotes {
  prod_codigo: string
  prod_descripcion: string
  cantidadPedido: number
  lotes: LoteProducto[]
  loteSeleccionado?: string
}

interface Seller {
  idVendedor: number
  codigo: string
  nombres: string
  apellidos: string
  DNI: string
  telefono: string
  comisionVend: number
  comisionCobranza: number
  empRegistro: string
}

export default function OrderPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSave, setIsLoadingSave] = useState(false);
  const [modalLoader, setModalLoader] = useState<'BONIFICADO' | 'ESCALA' | 'EVALUACION' | null>(null);

  // Estados para cliente
  const [client, setClient] = useState("")
  const [clientName, setClientName] = useState("")
  const [sellerSearch, setSellerSearch] = useState("")
  const [nameZone, setNameZone] = useState("")
  const [selectedClient, setSelectedClient] = useState<IClient | null>(null)
  const [condition, setCondition] = useState<ICondicion | null>(null)
  const [currency, setCurrency] = useState<IMoneda | null>(null)
  const [clients, setClients] = useState<IClient[]>([])
  const [clientsFiltered, setClientsFiltered] = useState<IClient[]>([])
  const [conditions, setConditions] = useState<ICondicion[]>([])
  const [contactoPedido, setContactoPedido] = useState('');
  const [referenciaDireccion, setReferenciaDireccion] = useState('');
  const [note, setNote] = useState('');
  const [sellers, setSellers] = useState<Seller[]>([])
  const [sellersFiltered, setSellersFiltered] = useState<Seller[]>([])
  const [seller, setSeller] = useState<Seller>(null)
  const [editingLotes, setEditingLotes] = useState<ProductoConLotes[]>([]);
  const [unidadTerritorio, setUnidadTerritorio] = useState<ITerritorio>({
    NombreDistrito: "",
    nombreProvincia: '',
    nombreDepartamento: '',
    ubigeo: ''
  })
  const [priceEdit, setPriceEdit] = useState(0);
  const { laboratories } = useLaboratoriesData()
  const [selectedLaboratorio, setSelectedLaboratorio] = useState<string | null>(null);
  const [showLaboratorioModal, setShowLaboratorioModal] = useState(false);
  const [tempSelectedProducts, setTempSelectedProducts] = useState<ISelectedProduct[]>([]);
  const { user, isAdmin } = useAuth();
  const [priceType, setPriceType] = useState<'contado' | 'credito' | 'porMayor' | 'porMenor' | 'custom'>('contado');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewingProduct, setViewingProduct] = useState<IProduct | null>(null)
  const [escalas, setEscalas] = useState<any[]>([])
  const [bonificaciones, setBonificaciones] = useState<any[]>([])

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

  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [sellerModalOpen, setSellerModalOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<ISelectedProduct[]>([])
  const [isCheckingBonification, setIsCheckingBonification] = useState(false)
  const [showAlternativesModal, setShowAlternativesModal] = useState(false)
  const [outOfStockProduct, setOutOfStockProduct] = useState<IProduct | null>(null)
  const [alternativeProducts, setAlternativeProducts] = useState<IProduct[]>([])
  const [products, setProducts] = useState<IProduct[]>([])

  const [showLotesModal, setShowLotesModal] = useState(false);
  const [productosConLotes, setProductosConLotes] = useState<ProductoConLotes[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [showClientDataConfirmModal, setShowClientDataConfirmModal] = useState(false)
  const [editedClientData, setEditedClientData] = useState({
    Dirección: '',
    telefono: '',
    referencia: ''
  })

  const [isAutoCreateModalOpen, setIsAutoCreateModalOpen] = useState(false);
  const [isAutoCreating, setIsAutoCreating] = useState(false);

  const steps = [
    { label: "Cliente", icon: User },
    { label: "Productos", icon: Package },
    { label: "Resumen", icon: FileText },
  ]

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

  const debouncedFetchClients = async () => {
    setLoading(prev => ({ ...prev, clients: true }));
    try {
      const sellerCode = isAdmin() ? "" : (user?.codigo || "");
      const response = await fetchGetAllClients(sellerCode, isAdmin());
      if (response.data?.data?.data.length === 0) {
        setClients([])
      } else {
        setClients(response.data?.data?.data || [])
        setClientsFiltered(response.data?.data?.data || [])
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(prev => ({ ...prev, clients: false }))
    }
  }

  const fetchProductDetails = async (productId: string) => {
    try {
      const response = await apiClient.get(`/articulos/bonusScale/getByProd?code=${productId}`)
      const data = response.data?.data || {}

      if (data.scale.length > 0 || data.bonus.length > 0) {
        setEscalas((data.scale || []).map((item, index) => ({
          id: index,
          desde: Number(item.minimo),
          hasta: Number(item.maximo),
          precio: Number(item.Precio),
        })))
        setBonificaciones((data.bonus || []).map((item, index) => ({
          id: index,
          compra: Number(item.Factor),
          lleva: Number(item.Cantidad),
          descripcion: item.Descripcion,
          esMismoProducto: item.mismoProduct === 'S',
          productoBonificado: item.mismoProduct === 'S' ? null : item.IdArticuloBonif,
          descripcionProducto: item.mismoProduct === 'S' ? null : item.DescArticuloBonif
        })))
        setIsViewModalOpen(true)
      } else {
        setIsViewModalOpen(false)
      }
    } catch (error) {
      console.error("Error fetching product details:", error)
      setEscalas([])
      setBonificaciones([])
    }
  }

  const fetchVendedores = async () => {
    try {
      const response = await apiClient.get('/usuarios/listar/vendedores')
      const vendedoresTransformados = response.data.data.data.map((v: any) => ({
        idVendedor: v.idVendedor,
        codigo: v.Codigo_Vend,
        nombres: v.Nombres,
        apellidos: v.Apellidos,
        DNI: v.DNI,
        telefono: v.Telefonos,
        comisionVend: v.ComisionVend,
        comisionCobranza: v.ComisionCobranza,
        empRegistro: v.EmpRegistro,
      }));
      setSellers(vendedoresTransformados);
    } catch (error) {
      setSellers([]);
    }
  }

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
      const appliedScale = null;
      const finalPrice = priceType === 'contado'
          ? Number(selectedProduct?.PUContado)
          : priceType === 'credito'
              ? Number(selectedProduct?.PUCredito)
              : priceType === 'porMenor'
                  ? Number(selectedProduct?.PUPorMenor)
                  : priceType === 'porMayor'
                      ? Number(selectedProduct?.PUPorMayor)
                      : priceEdit;

      const newItem = {
        product: selectedProduct!,
        quantity,
        isBonification,
        isEscale,
        appliedScale,
        finalPrice,
        isEdit: priceType === 'custom',
        isAuthorize: priceType === 'custom' && priceEdit < Number(selectedProduct?.PUContado),
      };

      setSelectedProducts([
        ...selectedProducts,
        newItem,
      ])

      handleListarLotes([newItem])

      setSelectedProduct(null)
      setQuantity(1)
      setIsLoading(false)
    }, 600)
  }


  useEffect(() => {
    if (user) {
      debouncedFetchClients();
      if (isAdmin()) {
        fetchVendedores();
      }
    }
  }, [user])

  useEffect(() => {
    if (search.client) {
      setClientsFiltered(clients.filter(item =>
        item.RUC?.includes(search.client) ||
        item.Nombre?.toUpperCase().includes(search.client.toUpperCase())))
    } else {
      setClientsFiltered(clients)
    }
  }, [search.client]);

  useEffect(() => {
    if (sellerSearch.length > 0) {
      setSellersFiltered(sellers.filter(item =>
        item.codigo?.includes(sellerSearch) ||
        `${item.nombres} ${item.apellidos}`.toUpperCase().includes(sellerSearch.toUpperCase())))
    } else {
      setSellersFiltered(sellers)
    }
  }, [sellers, sellerSearch]);

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

  const handleLoteChange = (productIndex: number, value: string) => {
    setEditingLotes(prev => {
      const updated = [...prev];
      updated[productIndex].loteSeleccionado = value;
      return updated;
    });
  };

  const handleConfirmarLotes = async () => {
    setProductosConLotes(prev => {
      const newMap = [...prev];

      editingLotes.forEach(editItem => {
        const index = newMap.findIndex(x => x.prod_codigo === editItem.prod_codigo);
        if (index >= 0) {
          newMap[index] = editItem;
        } else {
          newMap.push(editItem);
        }
      });

      return newMap;
    });
    setShowLotesModal(false);
    setEditingLotes([]);
  }

  const handleListarLotes = async (productsToList: ISelectedProduct[]) => {
    try {
      setShowLotesModal(true)
      setLoadingLotes(true)

      setEditingLotes([]);

      const productosTemp: ProductoConLotes[] = []

      for (const producto of productsToList) {
        const response = await PriceService.getProductLots(producto.product.Codigo_Art)
        const lotes = response.data.map((lote: any) => ({
          value: lote.numeroLote + '|' + lote.fechaVencimiento +
              '|' + (Number(lote.stock) >= 0 ?  Number(lote.stock).toFixed(2) : 0),
          numeroLote: lote.numeroLote,
          fechaVencimiento: lote.fechaVencimiento,
          stock: Number(lote.stock).toFixed(2),
        }))

        const lotesFiltered = lotes.filter((item: any) => Number(item.stock) > 0);

        if (lotesFiltered.some((item: any) => item.numeroLote !== null && item.fechaVencimiento !== null)) {
          const existingSelection = productosConLotes.find(x => x.prod_codigo === producto.product.Codigo_Art);

          productosTemp.push({
            prod_codigo: producto.product.Codigo_Art,
            prod_descripcion: producto.product.NombreItem,
            cantidadPedido: producto.quantity,
            lotes: lotesFiltered,
            loteSeleccionado: existingSelection?.loteSeleccionado || (lotesFiltered.length > 0 ? lotesFiltered[0].value : ""),
          })
        }
      }

      setEditingLotes(productosTemp);
      setLoadingLotes(false);
    } catch (e) {
      console.error("Error al obtener lotes:", e);
      setLoadingLotes(false);
    }
  };

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

  const checkClientDataChanges = () => {
    const hasChanges =
        selectedClient?.Dirección !== editedClientData.Dirección ||
        selectedClient?.telefono !== editedClientData.telefono ||
        String(referenciaDireccion || '') !== String(editedClientData.referencia || '')
    return hasChanges && editedClientData.Dirección !== ''
  }

  const handleAddTempProduct = async (product: IProduct, quantity: number, priceType: 'contado' | 'credito' | 'porMayor' | 'porMenor' | 'custom', customPrice?: number) => {
    setIsLoading(true);
    setModalLoader('BONIFICADO');

    const bonificaciones = await getBonificados(product.Codigo_Art, quantity)
    const escalasProductos = await getEscalas(product.Codigo_Art, quantity)

    setIsLoading(false)
    setModalLoader(null)

    const newProduct: ISelectedProduct = {
      product,
      quantity,
      isBonification: bonificaciones.length > 0,
      isEscale: escalasProductos.length > 0,
      appliedScale: null,
      finalPrice: Number(priceType === 'contado'
        ? product.PUContado
        : priceType === 'credito'
          ? product.PUCredito
          : priceType === 'porMenor'
                  ? product.PUPorMenor
                  : priceType === 'porMayor'
                      ? product.PUPorMayor
                      : customPrice),
      isEdit: priceType === 'custom',
      isAuthorize: (priceType === 'custom' && customPrice != null) && customPrice < Number(product.PUContado),
    }

    setTempSelectedProducts(prev => [...prev, newProduct]);
  }

  const handleRemoveTempProduct = (index: number) => {
    setTempSelectedProducts(prev => prev.filter((_, i) => i !== index))
  }

  const handleConfirmSelection = () => {
    setSelectedProducts(prev => [...prev, ...tempSelectedProducts]);
    handleListarLotes([...tempSelectedProducts])

    setTempSelectedProducts([]);
    setShowLaboratorioModal(false);
    setSelectedLaboratorio(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (checkClientDataChanges()) {
      setShowClientDataConfirmModal(true);
    } else {
      handleSaveOrder();
    }
  }

  const handleSaveOrder = async () => {
    if (isLoadingSave) {
      return;
    }
    try {
      setIsLoadingSave(true);
      const lotesData = productosConLotes.map(producto => ({
        codigoProducto: producto.prod_codigo,
        lote: producto.loteSeleccionado?.split('|')[0],
        fechaVencimiento: format(parseISO(producto.loteSeleccionado?.split('|')[1]), "dd/MM/yyyy")
      }));

      const pedidoData = {
        clientePedido: client,
        clienteNamePedido: clientName,
        monedaPedido: currency?.value,
        condicionPedido: condition?.CodigoCondicion,
        contactoPedido: contactoPedido,
        direccionEntrega: selectedClient?.Dirección,
        referenciaDireccion: referenciaDireccion,
        fechaPedido: moment(new Date()).format('yyyy-MM-DD'),
        usuario: 1,
        vendedorPedido: isAdmin() ? seller.codigo : user?.codigo,
        represPedido: user?.codRepres || null,
        detalles: selectedProducts.map(item => ({
          iditemPedido: item.product.IdArticulo,
          codigoitemPedido: item.product.Codigo_Art,
          cantPedido: item.quantity,
          precioPedido: item?.finalPrice,
          isbonificado: item.isBonification ? 1 : 0,
          isescala: item.isEscale ? 1 : 0,
          lote: lotesData.find(x => x.codigoProducto === item.product.Codigo_Art)?.lote,
          fecVenc: lotesData.find(x => x.codigoProducto === item.product.Codigo_Art)?.fechaVencimiento,
          isEdit: item.isEdit ? 'S' : 'N',
          isAuthorize: item.isAuthorize ? 'S' : 'N',
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
    } finally {
      setIsLoadingSave(false);
    }
  }

  const updateClientData = async () => {
    if (!selectedClient) return

    try {
      await fetchUpdateClientRef(
          selectedClient?.codigo,
          selectedClient?.Dirección,
          selectedClient?.telefono,
          referenciaDireccion
      )
      console.log('Datos del cliente actualizados exitosamente')
    } catch (error) {
      console.error('Error al actualizar datos del cliente:', error)
      throw error
    }
  }

  const handleClientSelect = (c: IClient) => {
    setSelectedClient(c)
    setClient(c.codigo)
    setClientName(c.Nombre)
    setContactoPedido(c.Nombre)
    setReferenciaDireccion(c.referenciaDireccion || '')
    setSearch({ ...search, client: `${c.Nombre} (${c.codigo})` })
    setEditedClientData({
      telefono: c.telefono,
      referencia: c.referenciaDireccion,
      Dirección: c.Dirección
    })
    if (c.IdZona) {
      getZona(c.IdZona)
    }
    if (c.idDistrito) {
      getUnidadTerritorial(c.idDistrito)
    }

    const selectedCondition = conditions.find((condition) => condition.CodigoCondicion === c.CondicionPago)
    if (selectedCondition) {
      setCondition(selectedCondition);
    }
  }

  const handleSellerSelect = (seller1: Seller) => {
    console.log(seller1)
    setSeller(seller1)
  }

  const handleChangeContactoPedido = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactoPedido(e.target.value);
  };

  const handleUpdateClient = (updatedFields: { telefono?: string; Dirección?: string }) => {
    if (selectedClient) {
      setSelectedClient(prev => prev ? { ...prev, ...updatedFields } : null);
    }
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
    if (Number(product.Stock) <= 0) {

      let alts: IProduct[] = []

      if (product.principioActivo) {
        alts = products.filter(p =>
            p.principioActivo &&
            p.principioActivo.trim().toLowerCase() === product.principioActivo!.trim().toLowerCase() &&
            p.Codigo_Art !== product.Codigo_Art &&
            Number(p.Stock) > 0
        )
      }

      setOutOfStockProduct(product)
      setAlternativeProducts(alts)
      setShowAlternativesModal(true)
      setOpen(false)
      return
    }

    proceedWithProductSelection(product)
  }

  const handleConditionSelect = (condition: ICondicion) => {
    const selectedCondition = conditions.find((c) => c.CodigoCondicion === condition.CodigoCondicion)
    if (selectedCondition) {
      setCondition(selectedCondition);
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

  const handleAutoCreateClient = async () => {
    setIsAutoCreating(true);
    try {
      const sellerCode = isAdmin() ? (seller?.codigo || "") : (user?.codigo || "");

      const res = await apiClient.post('/clientes/auto-create-mifact', {
        numeroDocumento: search.client.trim(),
        codigoVendedor: sellerCode
      });

      if (res.data?.success && res.data?.data) {
        toast({ title: "Éxito", description: "Cliente creado y seleccionado correctamente." });
        const newClient = res.data.data;

        setClients(prev => [...prev, newClient]);
        setClientsFiltered(prev => [newClient]);

        handleClientSelect(newClient);
        setIsAutoCreateModalOpen(false);
      }
    } catch (error: any) {
      toast({
        title: "Error de Consulta",
        description: error?.response?.data?.message || "No se pudo consultar o crear el cliente."
      });
    } finally {
      setIsAutoCreating(false);
    }
  };

  const formatCurrency = (value) => {
    if (value === 0 || value === '') return '';
    const numberValue = typeof value === 'string' ?
        parseFloat(value.replace(/[^\d.]/g, '')) : value;

    return numberValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const goToStep = (step: number) => {
    setCurrentStep(step)
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 0: // Client step
        return !!client && currency && condition && (isAdmin() ? (!!seller) : true)
      case 1:
        return selectedProducts.length > 0
      default:
        return true
    }
  }

  const proceedWithProductSelection = (product: IProduct) => {
    setSelectedProduct(product)
    setOpen(false)
    setPriceEdit(Number(product.PUContado))

    setViewingProduct(product)
    fetchProductDetails(product.Codigo_Art)

    setShowAlternativesModal(false)
  }

  return (
    <div className="grid gap-4 sm:gap-6 overflow-x-hidden w-full">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Tomar Pedido</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Crea un nuevo pedido siguiendo los pasos.</p>
        </div>
      </div>

      {/* Step progress — own full-width row so it can never be squeezed */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm px-4 pt-4 pb-3">
        <StepProgress steps={steps} currentStep={currentStep} onStepClick={goToStep} />
      </div>

      <form onSubmit={handleSubmit}>
        {currentStep === 0 && (
          <Card className="shadow-md bg-white dark:bg-gray-900 dark:border-gray-800">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-md">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg font-semibold text-blue-700 dark:text-blue-400">Seleccionar Cliente</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {/* Selected client chip */}
              {selectedClient && (
                <div className="flex items-center gap-2.5 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 truncate">{selectedClient.Nombre}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">{selectedClient.RUC ? `RUC: ${selectedClient.RUC}` : selectedClient.codigo}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setSearch((prev) => ({ ...prev, client: '' }))}
                    className="shrink-0 h-8 px-3 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                  >
                    Cambiar
                  </Button>
                </div>
              )}

              {!selectedClient && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Buscar cliente
                  </Label>

                  {/* Trigger button — opens modal */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setClientModalOpen(true)}
                    className="w-full justify-start h-11 px-3 text-left font-normal text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 dark:text-gray-100"
                  >
                    <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
                    <span className="text-gray-400 dark:text-gray-500 font-normal">Buscar por RUC, DNI o nombre...</span>
                  </Button>

                  {/* Client search modal — bottom sheet on mobile, centered dialog on desktop */}
                  <Dialog open={clientModalOpen} onOpenChange={(v) => {
                    setClientModalOpen(v)
                    if (!v) setSearch((prev) => ({ ...prev, client: '' }))
                  }}>
                    <DialogContent className="p-0 gap-0 flex flex-col [&>button]:hidden overflow-hidden
                      fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none h-[88vh] w-full
                      sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:w-[620px] sm:h-[75vh] sm:max-w-[95vw]">
                      <DialogTitle className="sr-only">Buscar cliente</DialogTitle>

                      {/* Search bar */}
                      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 px-3 py-2.5 bg-white dark:bg-gray-900">
                        <Search className="h-4 w-4 text-gray-400 shrink-0" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="RUC, DNI o nombre del cliente..."
                          value={search.client}
                          onChange={(e) => setSearch((prev) => ({ ...prev, client: e.target.value }))}
                          className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 h-9"
                        />
                        {search.client && (
                          <button type="button" onClick={() => setSearch((prev) => ({ ...prev, client: '' }))} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => { setClientModalOpen(false); setSearch((prev) => ({ ...prev, client: '' })) }}
                          className="text-sm text-blue-600 dark:text-blue-400 font-medium pl-2 shrink-0"
                        >
                          Cancelar
                        </button>
                      </div>

                      {/* Results */}
                      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
                        {loading.clients ? (
                          <div className="p-3 space-y-2">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="flex gap-3 px-3 py-2.5 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                  <Skeleton className="h-4 w-3/5 rounded" />
                                  <Skeleton className="h-3 w-2/5 rounded" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : clientsFiltered.length === 0 ? (
                          <div className="py-12 text-center">
                            <Users className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              {search.client ? 'No se encontraron clientes' : 'Escribe para buscar clientes'}
                            </p>
                            {search.client && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Intente con otro RUC, DNI o nombre</p>}
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {clientsFiltered.map((c) => (
                              <button
                                key={c.codigo}
                                type="button"
                                onClick={() => { handleClientSelect(c); setClientModalOpen(false) }}
                                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-950/20 active:bg-blue-100 dark:active:bg-blue-950/40 transition-colors text-left"
                              >
                                <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full shrink-0 mt-0.5">
                                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                                  <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-1 leading-tight">
                                    {c.Nombre}
                                  </span>
                                  {c.NombreComercial && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{c.NombreComercial}</span>
                                  )}
                                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                                    {c.RUC && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        <span className="font-medium text-gray-600 dark:text-gray-300">RUC:</span> {c.RUC}
                                      </span>
                                    )}
                                    {c.Dirección && (
                                      <span className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 flex items-center gap-1">
                                        <MapPin className="h-3 w-3 shrink-0" />{c.Dirección}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {(selectedClient && isAdmin()) && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Vendedor</Label>

                  {seller ? (
                    <div className="flex items-center gap-2.5 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-900/50">
                      <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 truncate">{seller.nombres} {seller.apellidos}</p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">{seller.codigo}</p>
                      </div>
                      <Button type="button" size="sm" variant="ghost"
                        onClick={() => { setSeller(null as any); setSellerSearch("") }}
                        className="shrink-0 h-8 px-3 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40">
                        Cambiar
                      </Button>
                    </div>
                  ) : (
                    <Button type="button" variant="outline"
                      onClick={() => setSellerModalOpen(true)}
                      className="w-full justify-start h-11 px-3 text-left font-normal text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-200 dark:text-gray-100">
                      <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
                      <span className="text-gray-400 dark:text-gray-500 font-normal">Buscar vendedor...</span>
                    </Button>
                  )}

                  {/* Seller search modal */}
                  <Dialog open={sellerModalOpen} onOpenChange={(v) => {
                    setSellerModalOpen(v)
                    if (!v) setSellerSearch("")
                  }}>
                    <DialogContent className="p-0 gap-0 flex flex-col [&>button]:hidden overflow-hidden
                      fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none h-[88vh] w-full
                      sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:w-[520px] sm:h-[65vh] sm:max-w-[95vw]">
                      <DialogTitle className="sr-only">Buscar vendedor</DialogTitle>

                      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 px-3 py-2.5 bg-white dark:bg-gray-900">
                        <Search className="h-4 w-4 text-gray-400 shrink-0" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Nombre o código del vendedor..."
                          value={sellerSearch}
                          onChange={(e) => setSellerSearch(e.target.value)}
                          className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 h-9"
                        />
                        {sellerSearch && (
                          <button type="button" onClick={() => setSellerSearch("")} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        <button type="button"
                          onClick={() => { setSellerModalOpen(false); setSellerSearch("") }}
                          className="text-sm text-blue-600 dark:text-blue-400 font-medium pl-2 shrink-0">
                          Cancelar
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
                        {sellersFiltered.length === 0 ? (
                          <div className="py-12 text-center">
                            <Users className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              {sellerSearch ? 'No se encontraron vendedores' : 'Escribe para buscar vendedores'}
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {sellersFiltered.map((s) => (
                              <button key={s.codigo} type="button"
                                onClick={() => { handleSellerSelect(s); setSellerModalOpen(false); setSellerSearch("") }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 active:bg-indigo-100 transition-colors text-left">
                                <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2 rounded-full shrink-0">
                                  <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{s.nombres} {s.apellidos}</p>
                                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">{s.codigo}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
              {selectedClient && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  {/* Left column: Contact Info */}
                  <div className="space-y-4">
                    <ContactInfo
                      client={selectedClient}
                      referenciaDireccion={referenciaDireccion}
                      contactoPedido={contactoPedido}
                      onChangeReferenciaDireccion={handleChangeReferenciaDireccion}
                      onChangeContactoPedido={handleChangeContactoPedido}
                      onUpdateClient={handleUpdateClient}
                    />
                  </div>
                  {/* Right column: Financial + Payment + History */}
                  <div className="space-y-4">
                    <FinancialZone client={selectedClient} nameZone={nameZone} unidadTerritorio={unidadTerritorio}/>
                    <PaymentCondition
                      conditions={conditions}
                      monedas={monedas}
                      onConditionChange={handleConditionSelect}
                      onCurrencyChange={handleCurrencySelect}
                      selectedCondition={condition}
                      selectedCurrency={currency}
                    />
                    <OrderHistory client={selectedClient} />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end border-t bg-gray-50 dark:bg-gray-800/50 dark:border-gray-800 py-4">
              <Button
                type="button"
                onClick={nextStep}
                disabled={!isStepValid()}
                className="bg-blue-600 hover:bg-blue-700 h-11 px-6"
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4"/>
              </Button>
            </CardFooter>
          </Card>
        )}
        {currentStep === 1 && (
          <div className="grid gap-6">
            <Card className="shadow-md bg-white dark:bg-gray-900 dark:border-gray-800">
              <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-md">
                    <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-blue-700 dark:text-blue-400">Agregar Productos</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                {/* Fila 1: Buscador de producto (siempre full-width) */}
                <div className="space-y-2">
                    <Label htmlFor="producto" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Producto
                    </Label>
                    <div className="relative">
                      {/* Trigger: looks like a search input, opens the modal */}
                      <Button
                          type="button"
                          variant="outline"
                          onClick={() => setOpen(true)}
                          className="w-full justify-start h-11 sm:h-12 px-3 text-left font-normal text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 dark:text-gray-100"
                      >
                        <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400"/>
                        {selectedProduct ? (
                            <div className="flex flex-col items-start min-w-0 flex-1">
                              <span className="font-semibold text-gray-900 dark:text-gray-100 w-full line-clamp-1">
                                {selectedProduct.NombreItem}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 w-full line-clamp-1">
                                {selectedProduct.Codigo_Art} | {selectedProduct.Descripcion}
                              </span>
                            </div>
                        ) : (
                            <span className="text-gray-400 dark:text-gray-500 font-normal">Buscar por código, nombre o laboratorio...</span>
                        )}
                      </Button>

                      {/* Product search modal — bottom sheet on mobile, centered dialog on desktop */}
                      <Dialog open={open} onOpenChange={setOpen}>
                        <DialogContent className="p-0 gap-0 flex flex-col [&>button]:hidden overflow-hidden
                          fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none h-[88vh] w-full
                          sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:w-[620px] sm:h-[75vh] sm:max-w-[95vw]">
                          <DialogTitle className="sr-only">Buscar producto</DialogTitle>

                          {/* Search input — always at top, visible above keyboard */}
                          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 px-3 py-2.5 bg-white dark:bg-gray-900">
                            <Search className="h-4 w-4 text-gray-400 shrink-0"/>
                            <input
                                type="text"
                                autoFocus
                                placeholder="Buscar por código, nombre o laboratorio..."
                                value={searchQuery}
                                onChange={(e) => {
                                  setIsSearching(true)
                                  setSearchQuery(e.target.value)
                                  if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
                                  searchTimerRef.current = setTimeout(() => setIsSearching(false), 350)
                                }}
                                className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 h-9"
                            />
                            {searchQuery && (
                              <button type="button" onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X className="h-4 w-4"/>
                              </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="text-sm text-blue-600 dark:text-blue-400 font-medium pl-2 shrink-0"
                            >
                              Cancelar
                            </button>
                          </div>

                          {/* Results — scrollable */}
                          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
                            {isSearching ? (
                              <div className="p-3 space-y-2">
                                {[1, 2, 3].map((i) => (
                                  <div key={i} className="flex gap-3 px-3 py-2.5 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                    <Skeleton className="h-8 w-8 rounded-lg shrink-0"/>
                                    <div className="flex-1 space-y-1.5">
                                      <div className="flex justify-between gap-2">
                                        <Skeleton className="h-4 w-3/5 rounded"/>
                                        <Skeleton className="h-5 w-16 rounded-full"/>
                                      </div>
                                      <Skeleton className="h-3 w-2/5 rounded"/>
                                      <div className="flex gap-4">
                                        <Skeleton className="h-3 w-20 rounded"/>
                                        <Skeleton className="h-3 w-20 rounded"/>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : filteredProducts.length === 0 ? (
                              <div className="py-12 text-center">
                                <Search className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-3"/>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                  {searchQuery ? 'No se encontraron productos' : 'Escribe para buscar productos'}
                                </p>
                                {searchQuery && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Intente con otro código, nombre o laboratorio</p>}
                              </div>
                            ) : (
                              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredProducts.map((product) => {
                                  const stockNum = Number(product.Stock)
                                  const stockBadgeClass = stockNum === 0
                                    ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
                                    : stockNum <= 10
                                    ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900/50"
                                    : "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50"

                                  return (
                                    <button
                                      key={product.Codigo_Art}
                                      type="button"
                                      onClick={() => handleProductSelect(product)}
                                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-950/20 active:bg-blue-100 dark:active:bg-blue-950/40 transition-colors text-left"
                                    >
                                      <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg shrink-0 mt-0.5">
                                        <Package className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                                      </div>
                                      <div className="flex flex-col flex-1 min-w-0 gap-1">
                                        <div className="flex items-start justify-between gap-2">
                                          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 flex-1 leading-tight">
                                            {product.NombreItem}
                                          </span>
                                          <span className={`text-xs shrink-0 font-medium border rounded-full px-2 py-0.5 ${stockBadgeClass}`}>
                                            Stock: {stockNum.toFixed(0)}
                                          </span>
                                        </div>
                                        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                                          <span className="text-xs text-gray-500 dark:text-gray-400">
                                            <span className="font-medium text-gray-600 dark:text-gray-300">Cód:</span> {product.Codigo_Art}
                                          </span>
                                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            <span className="font-medium text-gray-600 dark:text-gray-300">Lab:</span> {product.Descripcion}
                                          </span>
                                        </div>
                                        <div className="flex gap-3 mt-0.5">
                                          <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                                            Contado: {currency?.value === "PEN" ? "S/." : "$"}{Number(product.PUContado).toFixed(2)}
                                          </span>
                                          <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                                            Crédito: {currency?.value === "PEN" ? "S/." : "$"}{Number(product.PUCredito).toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {selectedProduct && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-3">
                          {/* Contado */}
                          <button
                              type="button"
                              onClick={() => setPriceType('contado')}
                              className={`relative rounded-xl p-2 sm:p-3 text-center transition-all border-2 ${
                                  priceType === 'contado'
                                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-sm'
                                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700'
                              }`}
                          >
                            {priceType === 'contado' && <Check className="absolute top-1 right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600 dark:text-blue-400" />}
                            <div className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">Contado</div>
                            <div className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300">
                              {currency?.value === "PEN" ? "S/." : "$"}{Number(selectedProduct.PUContado).toFixed(2)}
                            </div>
                          </button>

                          {/* Crédito */}
                          <button
                              type="button"
                              onClick={() => setPriceType('credito')}
                              className={`relative rounded-xl p-2 sm:p-3 text-center transition-all border-2 ${
                                  priceType === 'credito'
                                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-sm'
                                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700'
                              }`}
                          >
                            {priceType === 'credito' && <Check className="absolute top-1 right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600 dark:text-blue-400" />}
                            <div className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">Crédito</div>
                            <div className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300">
                              {currency?.value === "PEN" ? "S/." : "$"}{Number(selectedProduct.PUCredito).toFixed(2)}
                            </div>
                          </button>

                          {/* Bonif Contado */}
                          {Number(selectedProduct.PUPorMayor) > 0 && (
                            <button
                                type="button"
                                onClick={() => setPriceType('porMayor')}
                                className={`relative rounded-xl p-2 sm:p-3 text-center transition-all border-2 ${
                                    priceType === 'porMayor'
                                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 shadow-sm'
                                        : 'border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-gray-800 hover:border-violet-400 dark:hover:border-violet-600'
                                }`}
                            >
                              {priceType === 'porMayor' && <Check className="absolute top-1 right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 text-violet-600 dark:text-violet-400" />}
                              <div className="text-[10px] sm:text-xs font-medium text-violet-600 dark:text-violet-400 mb-0.5 sm:mb-1">Bonif. Cont.</div>
                              <div className="text-xs sm:text-sm font-bold text-violet-700 dark:text-violet-300">
                                {currency?.value === "PEN" ? "S/." : "$"}{Number(selectedProduct.PUPorMayor).toFixed(2)}
                              </div>
                            </button>
                          )}

                          {/* Bonif Crédito */}
                          {Number(selectedProduct.PUPorMenor) > 0 && (
                            <button
                                type="button"
                                onClick={() => setPriceType('porMenor')}
                                className={`relative rounded-xl p-2 sm:p-3 text-center transition-all border-2 ${
                                    priceType === 'porMenor'
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-sm'
                                        : 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-gray-800 hover:border-green-400 dark:hover:border-green-600'
                                }`}
                            >
                              {priceType === 'porMenor' && <Check className="absolute top-1 right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600 dark:text-green-400" />}
                              <div className="text-[10px] sm:text-xs font-medium text-green-600 dark:text-green-400 mb-0.5 sm:mb-1">Bonif. Cred.</div>
                              <div className="text-xs sm:text-sm font-bold text-green-700 dark:text-green-300">
                                {currency?.value === "PEN" ? "S/." : "$"}{Number(selectedProduct.PUPorMenor).toFixed(2)}
                              </div>
                            </button>
                          )}

                          {/* Custom */}
                          <button
                              type="button"
                              onClick={() => setPriceType('custom')}
                              className={`relative rounded-xl p-2 sm:p-3 text-center transition-all border-2 ${
                                  priceType === 'custom'
                                      ? 'border-red-500 bg-red-50 dark:bg-red-900/30 shadow-sm'
                                      : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-gray-800 hover:border-red-400 dark:hover:border-red-600'
                              }`}
                          >
                            {priceType === 'custom' && <Check className="absolute top-1 right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-600 dark:text-red-400" />}
                            <div className="text-[10px] sm:text-xs font-medium text-red-600 dark:text-red-400 mb-0.5 sm:mb-1">Personalizado</div>
                            <div className="flex items-center justify-center gap-0.5">
                              <span className="text-[10px] sm:text-xs text-red-700 dark:text-red-300">{currency?.value === "PEN" ? "S/." : "$"}</span>
                              <Input
                                  type="text"
                                  value={priceEdit === 0 ? '' : priceEdit}
                                  onChange={(e) => {
                                    let value = e.target.value;
                                    value = value.replace(/[^\d.]/g, '');
                                    const parts = value.split('.');
                                    if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
                                    if (parts.length === 2 && parts[1].length > 2) value = parts[0] + '.' + parts[1].substring(0, 2);
                                    setPriceEdit(value === '' ? 0 : value);
                                  }}
                                  onBlur={(e) => {
                                    if (e.target.value && e.target.value !== '0') {
                                      const numValue = parseFloat(e.target.value);
                                      setPriceEdit(isNaN(numValue) ? 0 : numValue.toFixed(2));
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-6 sm:h-7 w-14 sm:w-16 text-center text-xs font-bold text-red-700 dark:text-red-300 bg-white dark:bg-gray-700 border-red-200 dark:border-red-700 p-1"
                                  placeholder="0.00"
                              />
                            </div>
                          </button>
                        </div>
                    )}
                </div>

                {/* Fila 2: Lab + Cantidad + Agregar en una sola fila */}
                <div className="flex gap-2 sm:gap-3 items-end">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="laboratorio" className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                      Lab
                    </Label>
                    <Select
                        value={selectedLaboratorio || ""}
                        onValueChange={(value) => {
                          setSelectedLaboratorio(value);
                          setShowLaboratorioModal(true);
                        }}
                    >
                      <SelectTrigger className="w-full h-11 text-xs sm:text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100">
                        <SelectValue placeholder="Laboratorio"/>
                      </SelectTrigger>
                      <SelectContent>
                        {laboratories.map((lab) => (
                            <SelectItem key={lab.IdLineaGe} value={lab.IdLineaGe} className="text-xs sm:text-sm">
                              {lab.Descripcion}
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-20 sm:w-28 shrink-0 space-y-1.5">
                    <Label htmlFor="quantity" className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                      Cant.
                    </Label>
                    <Input
                        id="quantity"
                        type="number"
                        min="1"
                        step="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                        className="h-11 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-center text-base font-medium"
                    />
                  </div>

                  <Button
                      type="button"
                      disabled={!selectedProduct || loading.products || isCheckingBonification}
                      onClick={handleAddProduct}
                      className="h-11 shrink-0 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 font-medium px-3 sm:px-5"
                  >
                    <ShoppingCart className="h-4 w-4 sm:mr-2"/>
                    <span className="hidden sm:inline">Agregar al pedido</span>
                  </Button>
                </div>
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
                <Card className="shadow-md bg-white dark:bg-gray-900 dark:border-gray-800">
                  <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-md">
                        <ShoppingCart className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <CardTitle className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                        Productos Seleccionados
                      </CardTitle>
                      <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 bg-indigo-600 text-white text-xs font-bold rounded-full">
                        {selectedProducts.length}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="hidden sm:block border dark:border-gray-700 rounded-md overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                              Producto
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                              Lote - Fec.Venc
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                              Stock
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                              Cantidad
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                              Precio Unit.
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
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
                            const lote = productosConLotes.find(x => x.prod_codigo === item.product.Codigo_Art)?.loteSeleccionado || '||'
                            const split = lote.split('|');
                            const cod = split[0];
                            const fec = split[1];
                            const stk = split[2];

                            let rowBgClass = index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/60";
                            if (item.isAuthorize) {
                              rowBgClass = "bg-blue-50 dark:bg-blue-950/30 border-l-4 border-l-blue-500";
                            } else if (item.isEdit) {
                              rowBgClass = "bg-green-50 dark:bg-green-950/30 border-l-4 border-l-green-500";
                            }

                            return (
                                <tr key={index} className={rowBgClass}>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
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
                                      {item.isEdit && (
                                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                            Editado
                                          </Badge>
                                      )}
                                      {item.isAuthorize && (
                                          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                                            Por Autorizar
                                          </Badge>
                                      )}
                                    </div>
                                  </td>

                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-left">
                                    {cod} - Vence: {fec.length > 0 && format(parseISO(fec), "dd/MM/yyyy")}
                                  </td>

                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                                    {stk}
                                  </td>

                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                                    {item.quantity}
                                  </td>

                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                                    <div className="flex flex-col items-end">
                      <span className={item.appliedScale ? "line-through text-gray-400 dark:text-gray-500 text-xs" : ""}>
                        {currency?.value === "PEN" ? "S/." : "$"}
                        {Number(precioOriginal).toFixed(2)}
                      </span>
                                      {item.appliedScale && (
                                          <span className="text-purple-600 dark:text-purple-400 font-medium text-sm">
                          {currency?.value === "PEN" ? "S/." : "$"}
                                            {Number(precioEscala).toFixed(2)}
                        </span>
                                      )}
                                      {item.isBonification && (
                                          <span className="text-green-600 dark:text-green-400 text-sm">{currency?.value === "PEN" ? "S/." : "$"}0.00</span>
                                      )}
                                    </div>
                                  </td>

                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
                                    {currency?.value === "PEN" ? "S/." : "$"}
                                    {subtotal.toFixed(2)}
                                  </td>

                                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                          type='button'
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleListarLotes([item])}
                                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                          title="Cambiar Lote"
                                      >
                                        <Package className="h-4 w-4" />
                                      </Button>

                                      <Button
                                          type='button'
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveItem(index)}
                                          className="text-red-600 dark:text-red-400 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
                                          title="Eliminar"
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                            );
                          })}
                          </tbody>
                          <TableFooter>
                            <TableRow>
                              <TableCell colSpan={4}></TableCell>
                              <TableCell className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                                Total:
                              </TableCell>
                              <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100 text-right">
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

                    <div className="block sm:hidden space-y-2.5">
                      {selectedProducts.map((item, index) => {
                        const precioOriginal = item.finalPrice;
                        const precioEscala = item.appliedScale?.precio_escala;
                        const precioUnitario = item.isBonification ? 0 : precioEscala ?? precioOriginal;
                        const subtotal = precioUnitario * item.quantity;
                        const lote = productosConLotes.find(x => x.prod_codigo === item.product.Codigo_Art)?.loteSeleccionado || '||'
                        const split = lote.split('|');
                        const cod = split[0];
                        const fec = split[1];
                        const stk = split[2];

                        const cardBorderClass = item.isAuthorize
                          ? "border-l-4 border-l-blue-500 dark:border-l-blue-400"
                          : item.isEdit
                          ? "border-l-4 border-l-green-500 dark:border-l-green-400"
                          : "";
                        const cardBgClass = item.isAuthorize
                          ? "bg-blue-50 dark:bg-blue-950/30"
                          : item.isEdit
                          ? "bg-green-50 dark:bg-green-950/30"
                          : "bg-white dark:bg-gray-800";

                        return (
                            <div key={index} className={`rounded-xl border dark:border-gray-700 shadow-sm overflow-hidden ${cardBgClass} ${cardBorderClass}`}>
                              {/* Header */}
                              <div className="flex items-start justify-between gap-2 px-3.5 pt-3 pb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap gap-1 mb-1.5">
                                    {item.isEdit && <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-[10px]">Editado</Badge>}
                                    {item.isAuthorize && <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-[10px]">Por Autorizar</Badge>}
                                    {item.isBonification && <Badge variant="outline" className="bg-yellow-50 text-yellow-700 text-[10px]">Bonificado</Badge>}
                                    {item.appliedScale && <Badge variant="outline" className="bg-purple-50 text-purple-700 text-[10px]">Escala {item.appliedScale.porcentaje_descuento}%</Badge>}
                                  </div>
                                  <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">{item.product.NombreItem}</h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.product.Descripcion}</p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30" onClick={() => handleListarLotes([item])} type='button'>
                                    <Package className="h-4 w-4"/>
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30" onClick={() => handleRemoveItem(index)} type='button'>
                                    <Trash className="h-4 w-4"/>
                                  </Button>
                                </div>
                              </div>

                              {/* Details grid */}
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-3.5 py-2 border-t dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20">
                                <div>
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium">Lote / Vence</p>
                                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{cod} {fec.length > 0 && `· ${format(parseISO(fec), "dd/MM/yy")}`}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium">Stock</p>
                                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{stk}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium">Cantidad</p>
                                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{item.quantity}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium">P. Unitario</p>
                                  <div className="flex flex-col">
                                    <span className={`text-xs ${item.appliedScale ? "line-through text-gray-400" : "font-medium text-gray-700 dark:text-gray-300"}`}>
                                      {currency?.value === "PEN" ? "S/." : "$"}{Number(precioOriginal).toFixed(2)}
                                    </span>
                                    {item.appliedScale && <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">{currency?.value === "PEN" ? "S/." : "$"}{Number(precioEscala).toFixed(2)}</span>}
                                    {item.isBonification && <span className="text-xs font-semibold text-green-600 dark:text-green-400">{currency?.value === "PEN" ? "S/." : "$"}0.00</span>}
                                  </div>
                                </div>
                              </div>

                              {/* Subtotal footer */}
                              <div className="flex items-center justify-between px-3.5 py-2 border-t dark:border-gray-700">
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Subtotal</span>
                                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                                  {currency?.value === "PEN" ? "S/." : "$"}{subtotal.toFixed(2)}
                                </span>
                              </div>
                            </div>
                        )
                      })}

                      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-blue-100 text-sm">Total del pedido</span>
                          <span className="font-bold text-xl text-white">
                            {currency?.value === "PEN" ? "S/." : "$"}
                            {selectedProducts.reduce((sum, item) => {
                              const pu = item.isBonification ? 0 : item.appliedScale?.precio_escala ?? item.finalPrice
                              return sum + pu * item.quantity
                            }, 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t bg-gray-50 dark:bg-gray-800/50 dark:border-gray-800 py-4">
                    <Button type="button" variant="outline" onClick={prevStep} className="h-11 dark:border-gray-700 dark:text-gray-300">
                      <ArrowLeft className="mr-2 h-4 w-4"/>
                      Anterior
                    </Button>
                    <Button type="button" onClick={nextStep} disabled={!isStepValid()} className="h-11 bg-blue-600 hover:bg-blue-700 px-6">
                      Siguiente
                      <ArrowRight className="ml-2 h-4 w-4"/>
                    </Button>
                  </CardFooter>
                </Card>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <Card className="shadow-md bg-white dark:bg-gray-900 dark:border-gray-800">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/40 rounded-md">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-lg font-semibold text-blue-700 dark:text-blue-400">Resumen del Pedido</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Client Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400"/>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Información del Cliente</h3>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-100 dark:border-blue-900/50 space-y-3">
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">Cliente</Label>
                      <p className="font-medium text-sm">{selectedClient?.Nombre}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-start gap-2">
                        <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0"/>
                        <div className="min-w-0">
                          <Label className="text-xs text-gray-500 dark:text-gray-400">Teléfono</Label>
                          <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{selectedClient?.telefono ?? '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0"/>
                        <div className="min-w-0">
                          <Label className="text-xs text-gray-500 dark:text-gray-400">Contacto</Label>
                          <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{contactoPedido ?? '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0"/>
                        <div className="min-w-0">
                          <Label className="text-xs text-gray-500 dark:text-gray-400">Dirección</Label>
                          <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">{selectedClient?.Dirección ?? '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0"/>
                        <div className="min-w-0">
                          <Label className="text-xs text-gray-500 dark:text-gray-400">Zona</Label>
                          <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{nameZone}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Conditions */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400"/>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Condiciones de Pago</h3>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-4 border border-green-100 dark:border-green-900/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0"/>
                        <div className="min-w-0">
                          <Label className="text-xs text-gray-500 dark:text-gray-400">Condición</Label>
                          <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">{condition?.Descripcion}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        {currency?.value === "PEN" ? <Coins className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0"/> : <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0"/>}
                        <div className="min-w-0">
                          <Label className="text-xs text-gray-500 dark:text-gray-400">Moneda</Label>
                          <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">{currency?.label}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-600 dark:text-orange-400"/>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Productos del Pedido</h3>
                </div>
                <div className="hidden sm:block border dark:border-gray-700 rounded-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Producto
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Lote - Fec.Venc
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Stock
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Cantidad
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Precio Unit.
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Subtotal
                        </th>
                        <th scope="col"></th>
                      </tr>
                      </thead>
                      <tbody>
                      {selectedProducts.map((item, index) => {
                        const precioOriginal = item.finalPrice
                        const precioEscala = item.appliedScale?.precio_escala
                        const precioUnitario = item.isBonification ? 0 : precioEscala ?? precioOriginal
                        const subtotal = precioUnitario * item.quantity
                        const lote = productosConLotes.find(x => x.prod_codigo === item.product.Codigo_Art)?.loteSeleccionado || '||'
                        const split = lote.split('|');
                        const cod = split[0];
                        const fec = split[1];
                        const stk = split[2];

                        let rowBgClass = index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/60";
                        if (item.isAuthorize) {
                          rowBgClass = "bg-blue-50 dark:bg-blue-950/30 border-l-4 border-l-blue-500";
                        } else if (item.isEdit) {
                          rowBgClass = "bg-green-50 dark:bg-green-950/30 border-l-4 border-l-green-500";
                        }

                        return (
                          <tr key={index} className={rowBgClass}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
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
                                {item.isEdit && (
                                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                      Editado
                                    </Badge>
                                )}
                                {item.isAuthorize && (
                                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                                      Por Autorizar
                                    </Badge>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-left">
                              {cod} - Vence: {fec.length > 0 && format(parseISO(fec), "dd/MM/yyyy")}
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                              {stk}
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                              <div className="flex flex-col items-end">
                                <span className={item.appliedScale ? "line-through text-gray-400 dark:text-gray-500 text-xs" : ""}>
                                  {currency?.value === "PEN" ? "S/." : "$"}
                                  {Number(precioOriginal).toFixed(2)}
                                </span>
                                {item.appliedScale && (
                                  <span className="text-purple-600 dark:text-purple-400 font-medium text-sm">
                                    {currency?.value === "PEN" ? "S/." : "$"}
                                    {Number(precioEscala).toFixed(2)}
                                  </span>
                                )}
                                {item.isBonification && (
                                  <span
                                    className="text-green-600 dark:text-green-400 text-sm">{currency?.value === "PEN" ? "S/." : "$"}0.00</span>
                                )}
                              </div>
                            </td>

                            <td
                              className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
                              {currency?.value === "PEN" ? "S/." : "$"}
                              {subtotal.toFixed(2)}
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-600 dark:text-red-400 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
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
                          <TableCell colSpan={4}></TableCell>
                          <TableCell className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                            Total:
                          </TableCell>
                          <TableCell
                            className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100 text-right">
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

                <div className="block sm:hidden space-y-2.5">
                  {selectedProducts.map((item, index) => {
                    const precioOriginal = item.finalPrice;
                    const precioEscala = item.appliedScale?.precio_escala;
                    const precioUnitario = item.isBonification ? 0 : precioEscala ?? precioOriginal;
                    const subtotal = precioUnitario * item.quantity;
                    const lote = productosConLotes.find(x => x.prod_codigo === item.product.Codigo_Art)?.loteSeleccionado || '||'
                    const split = lote.split('|');
                    const cod = split[0];
                    const fec = split[1];
                    const stk = split[2];

                    const cardBorderClass = item.isAuthorize
                      ? "border-l-4 border-l-blue-500 dark:border-l-blue-400"
                      : item.isEdit
                      ? "border-l-4 border-l-green-500 dark:border-l-green-400"
                      : "";
                    const cardBgClass = item.isAuthorize
                      ? "bg-blue-50 dark:bg-blue-950/30"
                      : item.isEdit
                      ? "bg-green-50 dark:bg-green-950/30"
                      : "bg-white dark:bg-gray-800";
                    return (
                      <div key={index} className={`rounded-xl border dark:border-gray-700 shadow-sm overflow-hidden ${cardBgClass} ${cardBorderClass}`}>
                        {/* Header */}
                        <div className="flex items-start gap-2 px-3.5 pt-3 pb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {item.isEdit && <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-[10px]">Editado</Badge>}
                              {item.isAuthorize && <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-[10px]">Por Autorizar</Badge>}
                              {item.isBonification && <Badge variant="outline" className="bg-yellow-50 text-yellow-700 text-[10px]">Bonificado</Badge>}
                              {item.appliedScale && <Badge variant="outline" className="bg-purple-50 text-purple-700 text-[10px]">Escala {item.appliedScale.porcentaje_descuento}%</Badge>}
                            </div>
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">{item.product.NombreItem}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.product.Descripcion}</p>
                          </div>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-3.5 py-2 border-t dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20">
                          <div>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium">Lote / Vence</p>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{cod} {fec.length > 0 && `· ${format(parseISO(fec), "dd/MM/yy")}`}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium">Stock</p>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{stk}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium">Cantidad</p>
                            <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{item.quantity}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium">P. Unitario</p>
                            <div className="flex flex-col">
                              <span className={`text-xs ${item.appliedScale ? "line-through text-gray-400 dark:text-gray-500" : "font-medium text-gray-700 dark:text-gray-300"}`}>
                                {currency?.value === "PEN" ? "S/." : "$"}{Number(precioOriginal).toFixed(2)}
                              </span>
                              {item.appliedScale && <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">{currency?.value === "PEN" ? "S/." : "$"}{Number(precioEscala).toFixed(2)}</span>}
                              {item.isBonification && <span className="text-xs font-semibold text-green-600 dark:text-green-400">{currency?.value === "PEN" ? "S/." : "$"}0.00</span>}
                            </div>
                          </div>
                        </div>

                        {/* Subtotal footer */}
                        <div className="flex items-center justify-between px-3.5 py-2 border-t dark:border-gray-700">
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Subtotal</span>
                          <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                            {currency?.value === "PEN" ? "S/." : "$"}{subtotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center shadow-sm">
                <div className="text-sm font-medium text-blue-100">Total del Pedido</div>
                <div className="text-2xl font-bold text-white">
                  {currency?.value === "PEN" ? "S/." : "$"} {calcularTotal(selectedProducts).toFixed(2)}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400"/>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Observaciones</h3>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                  <Textarea
                    placeholder="Escribe aquí cualquier observación adicional para el pedido..."
                    className="min-h-[90px] resize-none border-0 focus-visible:ring-0 bg-transparent dark:text-gray-100 dark:placeholder-gray-500 text-sm"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <div className="border-t dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-400 dark:text-gray-500">
                    Esta información será incluida en el pedido.
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-gray-50 dark:bg-gray-800/50 dark:border-gray-800 py-4">
              <Button type="button" variant="outline" onClick={prevStep} className="h-11 dark:border-gray-700 dark:text-gray-300">
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Anterior
              </Button>
              <Button type="submit" className="h-11 px-6 bg-green-600 hover:bg-green-700" disabled={isLoadingSave}>
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

      <Dialog open={showLotesModal} onOpenChange={setShowLotesModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Seleccionar Lotes
            </DialogTitle>
            <DialogDescription>
              Seleccione los lotes y cantidades para los productos
            </DialogDescription>
          </DialogHeader>

          {loadingLotes ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
          ) : (
              <div className="space-y-6 grid grid-cols-1 gap-4">
                {editingLotes.map((producto, productIndex) => (
                    <Card key={productIndex}>
                      <CardHeader className="bg-gray-50 py-3">
                        <CardTitle className="text-sm font-medium">
                          {producto.prod_codigo} - {producto.prod_descripcion}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <Label htmlFor={`lote-${productIndex}`}>Seleccionar Lote</Label>
                            <Select
                                value={producto.loteSeleccionado}
                                onValueChange={(value) => handleLoteChange(productIndex, value)}
                            >
                              <SelectTrigger id={`lote-${productIndex}`}>
                                <SelectValue placeholder="Seleccione un lote" />
                              </SelectTrigger>
                              <SelectContent>
                                {producto.lotes.map((lote, loteIndex) => {
                                  const split = lote.value.split('|');
                                  const cod = split[0];
                                  const fec = split[1];
                                  const stk = split[2];
                                  return (
                                      (
                                          <SelectItem
                                              key={loteIndex}
                                              value={lote.value}
                                          >
                                            {cod} - Vence: {format(parseISO(fec), "dd/MM/yyyy")} - Stk: {stk}
                                          </SelectItem>
                                      )
                                  )
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                ))}
              </div>
          )}

          <DialogFooter>
            <Button
                onClick={handleConfirmarLotes}
                disabled={loadingLotes || editingLotes.length === 0}
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              Confirmar Lotes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showClientDataConfirmModal} onOpenChange={setShowClientDataConfirmModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Confirmar Actualización de Datos
            </DialogTitle>
            <DialogDescription>
              Se detectaron cambios en los datos del cliente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 font-medium mb-2">
                ¿Desea guardar estos cambios permanentemente para futuras ventas?
              </p>
              <p className="text-xs text-blue-700">
                Los nuevos datos del cliente se asociarán a su código y se utilizarán en próximos pedidos.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
                variant="outline"
                onClick={() => {
                  handleSaveOrder();
                }}
                className="flex-1"
            >
              {'Confirmar Pedido'}
            </Button>
            <Button
                onClick={() => {
                  handleSaveOrder();
                  updateClientData();
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {'Guardar Datos y Confirmar Pedido'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detalles de Promociones - {viewingProduct?.NombreItem}
            </DialogTitle>
            <DialogDescription>
              Código: {viewingProduct?.Codigo_Art} | Precio Base: S/ {Number(viewingProduct?.PUContado).toFixed(2)}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="escalas" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="escalas" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Escalas de Precio ({escalas.length})
              </TabsTrigger>
              <TabsTrigger value="bonificaciones" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Bonificaciones ({bonificaciones.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="escalas" className="space-y-4">
              <Card>
                <CardContent className="pt-4">
                  {escalas.length > 0 ? (
                      <div className="space-y-3">
                        <div className="border rounded-lg divide-y">
                          {escalas.map((escala, index) => (
                              <div key={escala.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <div className="bg-purple-100 p-2 rounded-md">
                                      <TrendingUp className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div>
                                      <div className="font-medium text-sm">
                                        Escala {index + 1}: {escala.desde} - {escala.hasta} unidades
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        Precio especial: <span className="font-semibold text-green-600">S/ {escala.precio.toFixed(2)}</span> c/u
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        Comparado con precio base: <span className="font-medium">S/ {Number(viewingProduct?.PUContado).toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                  {(((Number(viewingProduct?.PUContado) - escala.precio) / Number(viewingProduct?.PUContado)) * 100).toFixed(1)}% desc.
                                </Badge>
                              </div>
                          ))}
                        </div>
                      </div>
                  ) : (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <h4 className="font-medium text-gray-900 mb-1">No hay escalas configuradas</h4>
                        <p className="text-sm text-gray-500">
                          Este producto no tiene escalas de precio configuradas
                        </p>
                      </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bonificaciones" className="space-y-4">
              <Card>
                <CardContent className="pt-4">
                  {bonificaciones.length > 0 ? (
                      <div className="space-y-3">
                        <div className="border rounded-lg divide-y">
                          {bonificaciones.map((bonificacion, index) => (
                              <div key={bonificacion.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <div className="bg-yellow-100 p-2 rounded-md">
                                      <Gift className="h-4 w-4 text-yellow-600" />
                                    </div>
                                    <div>
                                      <div className="font-medium text-sm">
                                        Promoción {index + 1}: Compra {bonificacion.compra} lleva {bonificacion.lleva} gratis
                                      </div>
                                      <div className="text-sm text-gray-600">{bonificacion.descripcion}</div>
                                      {!bonificacion.esMismoProducto && bonificacion.descripcionProducto && (
                                          <div className="text-xs text-blue-600 mt-1">
                                            Producto bonificado: {bonificacion.descripcionProducto}
                                          </div>
                                      )}
                                      <div className="text-xs text-gray-500 mt-1">
                                        Tipo: {bonificacion.esMismoProducto ? 'Mismo producto' : 'Producto diferente'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  {(bonificacion.lleva / bonificacion.compra * 100).toFixed(0)}% bonif.
                                </Badge>
                              </div>
                          ))}
                        </div>
                      </div>
                  ) : (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <Gift className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <h4 className="font-medium text-gray-900 mb-1">No hay bonificaciones</h4>
                        <p className="text-sm text-gray-500">
                          Este producto no tiene bonificaciones configuradas
                        </p>
                      </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAutoCreateModalOpen} onOpenChange={setIsAutoCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-700">
              <Bot className="h-5 w-5" /> Auto-Completar desde SUNAT/RENIEC
            </DialogTitle>
            <DialogDescription className="pt-2">
              El documento <strong className="text-gray-900">{search.client}</strong> no está registrado en el sistema.
              <br/><br/>
              ¿Deseas buscarlo en línea y registrarlo automáticamente?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
                type="button"
                variant="outline"
                onClick={() => setIsAutoCreateModalOpen(false)}
                disabled={isAutoCreating}
            >
              Cancelar
            </Button>
            <Button
                type="button"
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={handleAutoCreateClient}
                disabled={isAutoCreating}
            >
              {isAutoCreating ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Buscando...</>
              ) : (
                  <><Search className="h-4 w-4 mr-2" /> Buscar y Crear</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlternativeProductsModal
          open={showAlternativesModal}
          onOpenChange={setShowAlternativesModal}
          originalProduct={outOfStockProduct}
          alternatives={alternativeProducts}
          currency={currency}
          onSelectAlternative={proceedWithProductSelection}
          onProceedWithOriginal={proceedWithProductSelection}
      />
    </div>
  )
}