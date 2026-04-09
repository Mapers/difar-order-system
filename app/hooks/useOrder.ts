'use client'
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import apiClient from "@/app/api/client"
import moment from 'moment'
import { monedas } from "@/constants"
import {
    fetchGetAllClients,
    fetchGetConditions,
    fetchGetZona,
    fetchUnidaTerritorial,
    fetchUpdateClientRef,
} from "@/app/api/takeOrders"
import { getBonificadosRequest, getEscalasRequest, getProductsRequest } from "@/app/api/products"
import { IProduct, ISelectedProduct, IPromocionRequest } from "@/app/types/order/product-interface"
import { IClient, ICondicion, IDistrito, IMoneda, ITerritorio } from "@/app/types/order/client-interface"
import { useAuth } from "@/context/authContext"
import { PriceService } from "@/app/services/price/PriceService"
import { format, parseISO } from "date-fns"
import { toast } from "@/app/hooks/useToast"
import {ModalLoaderType, PriceType, ProductoConLotes, Seller} from "@/app/types/order/order-interface";

export function useOrderPage() {
    const router = useRouter()
    const { user, isAdmin } = useAuth()

    const [currentStep, setCurrentStep] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingSave, setIsLoadingSave] = useState(false)
    const [modalLoader, setModalLoader] = useState<ModalLoaderType>(null)

    // Client states
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
    const [contactoPedido, setContactoPedido] = useState('')
    const [referenciaDireccion, setReferenciaDireccion] = useState('')
    const [note, setNote] = useState('')
    const [sellers, setSellers] = useState<Seller[]>([])
    const [sellersFiltered, setSellersFiltered] = useState<Seller[]>([])
    const [seller, setSeller] = useState<Seller | null>(null)
    const [unidadTerritorio, setUnidadTerritorio] = useState<ITerritorio>({
        NombreDistrito: "",
        nombreProvincia: '',
        nombreDepartamento: '',
        ubigeo: ''
    })

    // Product states
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [quantity, setQuantity] = useState<number | "">(1)
    const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null)
    const [selectedProducts, setSelectedProducts] = useState<ISelectedProduct[]>([])
    const [products, setProducts] = useState<IProduct[]>([])
    const [priceEdit, setPriceEdit] = useState(0)
    const [priceType, setPriceType] = useState<PriceType>('contado')
    const [selectedLaboratorio, setSelectedLaboratorio] = useState<string | null>(null)
    const [showLaboratorioModal, setShowLaboratorioModal] = useState(false)
    const [tempSelectedProducts, setTempSelectedProducts] = useState<ISelectedProduct[]>([])
    const [isCheckingBonification, setIsCheckingBonification] = useState(false)

    // Alternative products
    const [showAlternativesModal, setShowAlternativesModal] = useState(false)
    const [outOfStockProduct, setOutOfStockProduct] = useState<IProduct | null>(null)
    const [alternativeProducts, setAlternativeProducts] = useState<IProduct[]>([])

    // Lotes
    const [editingLotes, setEditingLotes] = useState<ProductoConLotes[]>([])
    const [showLotesModal, setShowLotesModal] = useState(false)
    const [productosConLotes, setProductosConLotes] = useState<ProductoConLotes[]>([])
    const [loadingLotes, setLoadingLotes] = useState(false)

    // Product details modal
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [viewingProduct, setViewingProduct] = useState<IProduct | null>(null)
    const [escalas, setEscalas] = useState<any[]>([])
    const [bonificaciones, setBonificaciones] = useState<any[]>([])

    // Client data confirm
    const [showClientDataConfirmModal, setShowClientDataConfirmModal] = useState(false)
    const [editedClientData, setEditedClientData] = useState({
        Dirección: '',
        telefono: '',
        referencia: ''
    })

    // Auto create client
    const [isAutoCreateModalOpen, setIsAutoCreateModalOpen] = useState(false)
    const [isAutoCreating, setIsAutoCreating] = useState(false)

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

    // --- API Calls ---

    const getZona = async (idZona: string) => {
        try {
            const response = await fetchGetZona(idZona)
            setNameZone(response?.data?.data?.data?.NombreZona || "No definido")
        } catch (error) {
            console.error("Error fetching zona:", error)
        }
    }

    const getUnidadTerritorial = async (idDistrito: number) => {
        try {
            const request: IDistrito = { idDistrito: idDistrito.toString() }
            const response = await fetchUnidaTerritorial(request)
            setUnidadTerritorio(response?.data?.data?.data[0] || "No definido")
        } catch (error) {
            console.error("Error fetching unidad territorial:", error)
        }
    }

    const getEscalas = async (idArticulo: string, cantidad: number) => {
        try {
            const requestEscala: IPromocionRequest = { idArticulo, cantidad }
            const response = await getEscalasRequest(requestEscala)
            if (response.data.message === 404) return []
            return response?.data?.data?.data
        } catch (error) {
            console.error("Error fetching escalas:", error)
            return []
        }
    }

    const getBonificados = async (idArticulo: string, cantidad: number) => {
        try {
            const requestBonificado: IPromocionRequest = { idArticulo, cantidad }
            const response = await getBonificadosRequest(requestBonificado)
            if (response.data.message === 404) return []
            return response?.data?.data?.data
        } catch (error) {
            console.error("Error fetching bonificado:", error)
            return []
        }
    }

    const debouncedFetchClients = async () => {
        setLoading(prev => ({ ...prev, clients: true }))
        try {
            const sellerCode = isAdmin() ? "" : (user?.codigo || "")
            const response = await fetchGetAllClients(sellerCode, isAdmin())
            if (response.data?.data?.data.length === 0) {
                setClients([])
            } else {
                setClients(response.data?.data?.data || [])
                setClientsFiltered(response.data?.data?.data || [])
            }
        } catch (error) {
            console.error("Error fetching clients:", error)
        } finally {
            setLoading(prev => ({ ...prev, clients: false }))
        }
    }

    const fetchProductDetails = async (productId: string) => {
        try {
            const response = await apiClient.get(`/articulos/bonusScale/getByProd?code=${productId}`)
            const data = response.data?.data || {}

            if (data.scale.length > 0 || data.bonus.length > 0) {
                setEscalas((data.scale || []).map((item: any, index: number) => ({
                    id: index,
                    desde: Number(item.minimo),
                    hasta: Number(item.maximo),
                    precio: Number(item.Precio),
                })))
                setBonificaciones((data.bonus || []).map((item: any, index: number) => ({
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
            }))
            setSellers(vendedoresTransformados)
        } catch (error) {
            setSellers([])
        }
    }

    const fetchConditions = async () => {
        try {
            const response = await fetchGetConditions(search.client)
            setConditions(response.data?.data?.data || [])
        } catch (error) {
            console.error("Error fetching conditions:", error)
        } finally {
            setLoading(prev => ({ ...prev, conditions: false }))
        }
    }

    // --- Product Logic ---

    const addProductToList = (isBonification: boolean, isEscale: boolean) => {
        setIsLoading(true)
        setTimeout(() => {

            const resolvePrice = (): number => {
                switch (priceType) {
                    case 'contado':  return Number(selectedProduct?.PUContado)
                    case 'credito':  return Number(selectedProduct?.PUCredito)
                    case 'porMenor': return Number(selectedProduct?.PUPorMenor)
                    case 'porMayor': return Number(selectedProduct?.PUPorMayor)
                    case 'regalo':   return 0
                    case 'custom':   return Number(priceEdit) || 0
                    default:         return Number(selectedProduct?.PUContado)
                }
            }

            const finalPrice = resolvePrice()

            const newItem: ISelectedProduct = {
                product: selectedProduct!,
                quantity,
                isBonification,
                isEscale,
                appliedScale: null,
                finalPrice,
                isEdit: priceType === 'custom' || priceType === 'regalo',
                isAuthorize: (priceType === 'custom' && Number(priceEdit) < Number(selectedProduct?.PUContado))
                    || priceType === 'regalo',
            }

            setSelectedProducts(prev => [...prev, newItem])
            handleListarLotes([newItem])
            setSelectedProduct(null)
            setQuantity(1)
            setIsLoading(false)
        }, 600)
    }

    const handleListarLotes = async (productsToList: ISelectedProduct[]) => {
        try {
            setShowLotesModal(true)
            setLoadingLotes(true)
            setEditingLotes([])

            const productosTemp: ProductoConLotes[] = []

            for (const producto of productsToList) {
                const response = await PriceService.getProductLots(producto.product.Codigo_Art)
                const lotes = response.data.map((lote: any) => ({
                    value: lote.numeroLote + '|' + lote.fechaVencimiento +
                        '|' + (Number(lote.stock) >= 0 ? Number(lote.stock).toFixed(2) : 0),
                    numeroLote: lote.numeroLote,
                    fechaVencimiento: lote.fechaVencimiento,
                    stock: Number(lote.stock).toFixed(2),
                }))

                const lotesFiltered = lotes.filter((item: any) => Number(item.stock) > 0)

                if (lotesFiltered.some((item: any) => item.numeroLote !== null && item.fechaVencimiento !== null)) {
                    const existingSelection = productosConLotes.find(x => x.prod_codigo === producto.product.Codigo_Art)

                    productosTemp.push({
                        prod_codigo: producto.product.Codigo_Art,
                        prod_descripcion: producto.product.NombreItem,
                        cantidadPedido: producto.quantity,
                        lotes: lotesFiltered,
                        loteSeleccionado: existingSelection?.loteSeleccionado || (lotesFiltered.length > 0 ? lotesFiltered[0].value : ""),
                    })
                }
            }

            setEditingLotes(productosTemp)
            setLoadingLotes(false)
        } catch (e) {
            console.error("Error al obtener lotes:", e)
            setLoadingLotes(false)
        }
    }

    const handleAddProduct = async () => {
        if (!selectedProduct) return
        try {
            const idArticulo = selectedProduct.Codigo_Art
            const cantidad = quantity

            setModalLoader('BONIFICADO')
            setIsLoading(true)
            const bonificacionesResult = await getBonificados(idArticulo, cantidad)
            setIsLoading(false)

            setModalLoader('ESCALA')
            setIsLoading(true)
            const escalasProductos = await getEscalas(idArticulo, cantidad)
            setIsLoading(false)

            addProductToList(bonificacionesResult.length > 0, escalasProductos.length > 0)

            toast({
                title: "Producto agregado",
                description: `${selectedProduct.NombreItem} x ${cantidad}`,
                variant: "success",
            });
        } catch (error) {
            console.error("Error al agregar producto:", error)
        } finally {
            setIsLoading(false)
            setModalLoader(null)
        }
    }

    const handleRemoveItem = (index: number) => {
        const newItems = [...selectedProducts]
        newItems.splice(index, 1)
        setSelectedProducts(newItems)
    }

    const handleLoteChange = (productIndex: number, value: string) => {
        setEditingLotes(prev => {
            const updated = [...prev]
            updated[productIndex].loteSeleccionado = value
            return updated
        })
    }

    const handleConfirmarLotes = () => {
        setProductosConLotes(prev => {
            const newMap = [...prev]
            editingLotes.forEach(editItem => {
                const index = newMap.findIndex(x => x.prod_codigo === editItem.prod_codigo)
                if (index >= 0) {
                    newMap[index] = editItem
                } else {
                    newMap.push(editItem)
                }
            })
            return newMap
        })
        setShowLotesModal(false)
        setEditingLotes([])
    }

    // --- Client Logic ---

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearch(prev => ({ ...prev, client: value }))
        if (value === '') {
            setSelectedClient(null)
        }
    }

    const handleClientSelect = (c: IClient | null) => {
        if (c === null) {
            setSelectedClient(null)
            setSearch(prev => ({ ...prev, client: '' }))
            return;
        }
        setSelectedClient(c)
        setClient(c.codigo)
        setClientName(c.Nombre)
        setContactoPedido(c.Nombre)
        setReferenciaDireccion(c.referenciaDireccion || '')
        setSearch(prev => ({ ...prev, client: `${c.Nombre} (${c.codigo})` }))
        setEditedClientData({
            telefono: c.telefono,
            referencia: c.referenciaDireccion,
            Dirección: c.Dirección
        })
        if (c.IdZona) getZona(c.IdZona)
        if (c.idDistrito) getUnidadTerritorial(c.idDistrito)

        const selectedCondition = conditions.find(cond => cond.CodigoCondicion === c.CondicionPago)
        if (selectedCondition) setCondition(selectedCondition)
    }

    const handleSellerSelect = (seller1: Seller | null) => {
        setSeller(seller1)
    }

    const handleChangeContactoPedido = (e: React.ChangeEvent<HTMLInputElement>) => {
        setContactoPedido(e.target.value)
    }

    const handleUpdateClient = (updatedFields: { telefono?: string; Dirección?: string }) => {
        if (selectedClient) {
            setSelectedClient(prev => prev ? { ...prev, ...updatedFields } : null)
        }
    }

    const handleChangeReferenciaDireccion = (e: React.ChangeEvent<HTMLInputElement>) => {
        setReferenciaDireccion(e.target.value)
    }

    const handleConditionSelect = (cond: ICondicion) => {
        const found = conditions.find(c => c.CodigoCondicion === cond.CodigoCondicion)
        if (found) setCondition(found)
    }

    const handleCurrencySelect = (curr: IMoneda) => {
        const found = monedas.find(m => m.value === curr.value)
        if (found) setCurrency(found)
    }

    const checkClientDataChanges = () => {
        const hasChanges =
            selectedClient?.Dirección !== editedClientData.Dirección ||
            selectedClient?.telefono !== editedClientData.telefono ||
            String(referenciaDireccion || '') !== String(editedClientData.referencia || '')
        return hasChanges && editedClientData.Dirección !== ''
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
        } catch (error) {
            console.error('Error al actualizar datos del cliente:', error)
            throw error
        }
    }

    // --- Product Selection (from Popover) ---

    const handleProductSelect = (product: IProduct | null) => {
        if (product === null) {
            setSelectedProduct(null)
            return;
        }
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

    const proceedWithProductSelection = (product: IProduct) => {
        setSelectedProduct(product)
        setOpen(false)
        setPriceEdit(Number(product.PUContado))
        setViewingProduct(product)
        fetchProductDetails(product.Codigo_Art)
        setShowAlternativesModal(false)
    }

    // --- Laboratorio temp products ---

    const handleAddTempProduct = async (product: IProduct, qty: number, pt: PriceType, customPrice?: number) => {
        setIsLoading(true)
        setModalLoader('BONIFICADO')
        const bonificacionesResult = await getBonificados(product.Codigo_Art, qty)
        const escalasProductos = await getEscalas(product.Codigo_Art, qty)
        setIsLoading(false)
        setModalLoader(null)

        const resolvePrice = (): number => {
            switch (pt) {
                case 'contado':  return Number(product.PUContado)
                case 'credito':  return Number(product.PUCredito)
                case 'porMenor': return Number(product.PUPorMenor)
                case 'porMayor': return Number(product.PUPorMayor)
                case 'regalo':   return 0
                case 'custom':   return Number(customPrice) || 0
                default:         return Number(product.PUContado)
            }
        }

        const finalPrice = resolvePrice()

        const newProduct: ISelectedProduct = {
            product,
            quantity: qty,
            isBonification: bonificacionesResult.length > 0,
            isEscale: escalasProductos.length > 0,
            appliedScale: null,
            finalPrice,
            isEdit: pt === 'custom' || pt === 'regalo',
            isAuthorize: (pt === 'custom' && customPrice != null && customPrice < Number(product.PUContado))
                || pt === 'regalo',
        }

        setTempSelectedProducts(prev => [...prev, newProduct])
    }

    const handleRemoveTempProduct = (index: number) => {
        setTempSelectedProducts(prev => prev.filter((_, i) => i !== index))
    }

    const handleConfirmSelection = () => {
        setSelectedProducts(prev => [...prev, ...tempSelectedProducts])
        handleListarLotes([...tempSelectedProducts])
        setTempSelectedProducts([])
        setShowLaboratorioModal(false)
        setSelectedLaboratorio(null)
    }

    // --- Submit ---

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (checkClientDataChanges()) {
            setShowClientDataConfirmModal(true)
        } else {
            handleSaveOrder()
        }
    }

    const handleSaveOrder = async () => {
        if (isLoadingSave) return
        try {
            setIsLoadingSave(true)
            const lotesData = productosConLotes.map(producto => ({
                codigoProducto: producto.prod_codigo,
                lote: producto.loteSeleccionado?.split('|')[0],
                fechaVencimiento: format(parseISO(producto.loteSeleccionado?.split('|')[1] || ''), "dd/MM/yyyy")
            }))

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
                vendedorPedido: isAdmin() ? seller?.codigo : user?.codigo,
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
            setIsLoadingSave(false)
        }
    }

    const handleAutoCreateClient = async () => {
        setIsAutoCreating(true)
        try {
            const sellerCode = isAdmin() ? (seller?.codigo || "") : (user?.codigo || "")
            const res = await apiClient.post('/clientes/auto-create-mifact', {
                numeroDocumento: search.client.trim(),
                codigoVendedor: sellerCode
            })
            if (res.data?.success && res.data?.data) {
                toast({ title: "Éxito", description: "Cliente creado y seleccionado correctamente." })
                const newClient = res.data.data
                setClients(prev => [...prev, newClient])
                setClientsFiltered([newClient])
                handleClientSelect(newClient)
                setIsAutoCreateModalOpen(false)
            }
        } catch (error: any) {
            toast({
                title: "Error de Consulta",
                description: error?.response?.data?.message || "No se pudo consultar o crear el cliente."
            })
        } finally {
            setIsAutoCreating(false)
        }
    }

    // --- Navigation ---

    const nextStep = () => {
        if (currentStep < 2) setCurrentStep(currentStep + 1)
    }

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1)
    }

    const goToStep = (step: number) => {
        setCurrentStep(step)
    }

    const isStepValid = () => {
        switch (currentStep) {
            case 0:
                return !!client && currency && condition && (isAdmin() ? (!!seller) : true)
            case 1:
                return selectedProducts.length > 0
            default:
                return true
        }
    }

    // --- Filtered products ---

    const filteredProducts = products.filter(
        (product) =>
            product.Codigo_Art.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.NombreItem.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.Descripcion.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    // --- Effects ---

    useEffect(() => {
        if (user) {
            debouncedFetchClients()
            if (isAdmin()) fetchVendedores()
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
    }, [search.client])

    useEffect(() => {
        if (sellerSearch.length > 0) {
            setSellersFiltered(sellers.filter(item =>
                item.codigo?.includes(sellerSearch) ||
                `${item.nombres} ${item.apellidos}`.toUpperCase().includes(sellerSearch.toUpperCase())))
        } else {
            setSellersFiltered(sellers)
        }
    }, [sellers, sellerSearch])

    useEffect(() => {
        fetchConditions()
    }, [search.condition])

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

    const clear = () => {
        setSelectedProducts([]);
        setProductosConLotes([]);
    };

    // --- Draft ---

    const getOrderStateForDraft = () => ({
        currentStep,
        search,
        selectedClient,
        seller,
        sellerSearch,
        nameZone,
        unidadTerritorio,
        contactoPedido,
        referenciaDireccion,
        condition,
        currency,
        selectedProducts,
        productosConLotes,
        note,
        editedClientData
    });

    const loadStateFromDraft = (draft: any) => {
        // Restaurar los estados
        setCurrentStep(draft.currentStep);
        setSearch(draft.search);
        setSelectedClient(draft.selectedClient);
        setClient(draft.selectedClient?.codigo || "");
        setClientName(draft.selectedClient?.Nombre || "");
        setSeller(draft.seller);
        setSellerSearch(draft.sellerSearch);
        setNameZone(draft.nameZone);
        setUnidadTerritorio(draft.unidadTerritorio);
        setContactoPedido(draft.contactoPedido);
        setReferenciaDireccion(draft.referenciaDireccion);
        setCondition(draft.condition);
        setCurrency(draft.currency);
        setSelectedProducts(draft.selectedProducts);
        setProductosConLotes(draft.productosConLotes);
        setNote(draft.note);
        setEditedClientData(draft.editedClientData);
    };

    return {
        // State
        currentStep, isLoading, isLoadingSave, modalLoader,
        client, clientName, sellerSearch, nameZone,
        selectedClient, condition, currency, clients, clientsFiltered,
        conditions, contactoPedido, referenciaDireccion, note, setNote,
        sellers, sellersFiltered, seller, unidadTerritorio,
        open, setOpen, searchQuery, setSearchQuery,
        quantity, setQuantity, selectedProduct, selectedProducts,
        products, priceEdit, setPriceEdit, priceType, setPriceType,
        selectedLaboratorio, setSelectedLaboratorio,
        showLaboratorioModal, setShowLaboratorioModal,
        tempSelectedProducts, isCheckingBonification,
        showAlternativesModal, setShowAlternativesModal,
        outOfStockProduct, alternativeProducts,
        editingLotes, showLotesModal, setShowLotesModal,
        productosConLotes, loadingLotes,
        isViewModalOpen, setIsViewModalOpen, viewingProduct, escalas, bonificaciones,
        showClientDataConfirmModal, setShowClientDataConfirmModal,
        editedClientData, isAutoCreateModalOpen, setIsAutoCreateModalOpen,
        isAutoCreating, loading, search, setSearch, setSellerSearch,
        filteredProducts, setSelectedProducts,

        // Handlers
        handleSearchChange, handleClientSelect, handleSellerSelect,
        handleChangeContactoPedido, handleUpdateClient,
        handleChangeReferenciaDireccion, handleConditionSelect,
        handleCurrencySelect, handleProductSelect, proceedWithProductSelection,
        handleAddProduct, handleRemoveItem,
        handleLoteChange, handleConfirmarLotes, handleListarLotes,
        handleAddTempProduct, handleRemoveTempProduct, handleConfirmSelection,
        handleSubmit, handleSaveOrder, updateClientData,
        handleAutoCreateClient,
        nextStep, prevStep, goToStep, isStepValid,
        isAdmin, clear,
        getOrderStateForDraft, loadStateFromDraft
    }
}