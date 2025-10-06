'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Search,
    Plus,
    Edit,
    Trash2,
    Package,
    TrendingUp,
    Gift,
    X,
    Save,
    ArrowLeft,
    DollarSign
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Skeleton } from "@/components/ui/skeleton"
import apiClient from "@/app/api/client"
import {getProductsRequest} from "@/app/api/products";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {useAuth} from "@/context/authContext";
import {Bonificacion, Escala} from "@/app/dashboard/lista-precios-lote/types";

interface Producto {
    IdArticulo: number;
    Codigo_Art: string;
    NombreItem: string;
    Stock: string;
    Presentacion: string;
    PUContado: string;
    PUCredito: string;
    PUPorMayor: string;
    PUPorMenor: string;
    escalaCount: number;
    bonificacionCount: number;
}

export default function ScaleBonusManagementPage() {
    const [productos, setProductos] = useState<Producto[]>([])
    const [allProducts, setAllProducts] = useState<Producto[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingSave, setLoadingSave] = useState(false)
    const [productsLoading, setProductsLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [productSearchQuery, setProductSearchQuery] = useState("")
    const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null)
    const [isProductModalOpen, setIsProductModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [popoverOpen, setPopoverOpen] = useState(false)
    const [escalas, setEscalas] = useState<Escala[]>([])
    const [nuevaEscala, setNuevaEscala] = useState<Escala>({ desde: 1, hasta: 1, precio: 0, id: Date.now(), })
    const [bonificaciones, setBonificaciones] = useState<Bonificacion[]>([])
    const [nuevaBonificacion, setNuevaBonificacion] = useState<Bonificacion>({
        compra: 1,
        lleva: 1,
        esMismoProducto: true,
        descripcion: "",
        descripcionProducto: '',
        id: Date.now(),
        productoBonificado: ''
    })
    const { user } = useAuth();

    const fetchProductos = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get('/articulos/bonif-escala-by-prods')
            setProductos(response.data?.data?.data || [])
        } catch (error) {
            console.error("Error fetching products:", error)
            setProductos([])
        } finally {
            setLoading(false)
        }
    }

    const fetchAllProducts = async () => {
        try {
            setProductsLoading(true)
            const response = await getProductsRequest()
            setAllProducts(response.data?.data?.data || [])
        } catch (error) {
            console.error("Error fetching all products:", error)
            setAllProducts([])
        } finally {
            setProductsLoading(false)
        }
    }

    const fetchProductDetails = async (productId: string) => {
        try {
            const response = await apiClient.get(`/articulos/bonusScale/getByProd?code=${productId}`)
            const data = response.data?.data || {}
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
        } catch (error) {
            console.error("Error fetching product details:", error)
            setEscalas([])
            setBonificaciones([])
        }
    }

    useEffect(() => {
        fetchProductos()
    }, [])

    useEffect(() => {
        if (isProductModalOpen || isEditModalOpen) {
            fetchAllProducts()
        }
    }, [isProductModalOpen, isEditModalOpen])

    const filteredProducts = productos.filter(producto =>
        producto.NombreItem.toLowerCase().includes(searchQuery.toLowerCase()) ||
        producto.Codigo_Art.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredAllProducts = allProducts.filter(product =>
        product.NombreItem.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        product.Codigo_Art.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        String(product?.Presentacion).toLowerCase().includes(productSearchQuery.toLowerCase())
    )

    const handleProductSelect = (product: Producto) => {
        setSelectedProduct(product)
        setPopoverOpen(false)
    }

    const handleEditProduct = async (producto: Producto) => {
        setSelectedProduct(producto)
        await fetchProductDetails(producto.Codigo_Art)
        setIsEditModalOpen(true)
    }

    const handleAddEscala = () => {
        if (nuevaEscala.desde > 0 && nuevaEscala.hasta >= nuevaEscala.desde && nuevaEscala.precio > 0) {
            setEscalas([...escalas, { ...nuevaEscala, id: Date.now() }])
            setNuevaEscala({ desde: 1, hasta: 1, precio: 0, id: Date.now() })
        }
    }

    const handleRemoveEscala = (id: number) => {
        setEscalas(escalas.filter(escala => escala.id !== id))
    }

        const handleAddBonificacion = () => {
        if (nuevaBonificacion.compra > 0 &&
            nuevaBonificacion.lleva > 0 &&
            nuevaBonificacion.descripcion &&
            (nuevaBonificacion.esMismoProducto || nuevaBonificacion.productoBonificado)) {
            setBonificaciones([...bonificaciones, { ...nuevaBonificacion, id: Date.now() }])
            setNuevaBonificacion({
                compra: 1,
                lleva: 1,
                descripcion: "",
                id: Date.now(),
                esMismoProducto: true,
                productoBonificado: '',
                descripcionProducto: '' })
        }
    }

    const handleRemoveBonificacion = (id: number) => {
        setBonificaciones(bonificaciones.filter(bonificacion => bonificacion.id !== id))
    }

    const handleSaveChanges = async () => {
        if (!selectedProduct) return

        try {
            await handleAddProductToManagement(selectedProduct);

            setIsEditModalOpen(false)
            fetchProductos()
        } catch (error) {
            console.error("Error saving scales and bonuses:", error)
        }
    }

    const handleDeleteByProd = async (producto: Producto) => {
        setLoading(true)
        try {
            await apiClient.get(`/articulos/bonusScale/delete?code=${producto.Codigo_Art}`)
            fetchProductos()
        } catch (error) {
            console.error("Error saving scales and bonuses:", error)
            setLoading(false)
        }
    }

    const handleAddProductToManagement = async (product: Producto) => {
        setLoadingSave(true)
        try {
            await handleDeleteByProd(product)
            console.log(bonificaciones)
            for (const bonus of bonificaciones) {
                await apiClient.post('/articulos/bonus/upsert', {
                    code: product.Codigo_Art,
                    description: bonus.descripcion,
                    factor: bonus.compra,
                    qty: bonus.lleva,
                    user: user?.nombreCompleto,
                    sameProduct: bonus.esMismoProducto,
                    codProdBonus: bonus.esMismoProducto ? product.Codigo_Art : bonus.productoBonificado,
                    descProdBonus: bonus.esMismoProducto ? product.NombreItem : bonus.descripcionProducto
                })
            }

            for (const escala of escalas) {
                await apiClient.post('/articulos/scale/upsert', {
                    code: product.Codigo_Art,
                    min: escala.desde,
                    max: escala.hasta,
                    price: escala.precio,
                    user: user?.nombreCompleto
                })
            }

            setIsProductModalOpen(false)
            setSelectedProduct(null)
            setLoadingSave(false)
            fetchProductos()
        } catch (error) {
            console.error("Error adding product to management:", error)
            setLoadingSave(false)
        }
    }

    return (
        <div className="grid gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gestión de Promociones</h1>
                <p className="text-gray-500">Administra escalas de precios y bonificaciones por producto</p>
            </div>

            <Card className="shadow-md">
                <CardHeader className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center border-b bg-gray-50">
                    <CardTitle className="text-xl font-semibold text-teal-700">Productos con Promociones</CardTitle>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                type="search"
                                placeholder="Buscar producto..."
                                className="pl-8 bg-white w-full sm:w-64"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nuevo Producto
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Agregar Producto al Sistema de Promociones</DialogTitle>
                                    <DialogDescription>
                                        Selecciona un producto y configura sus escalas y bonificaciones
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="product-search" className="text-sm font-medium">
                                                Buscar Producto
                                            </Label>
                                            <div className="relative">
                                                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            aria-expanded={popoverOpen}
                                                            className="w-full justify-between h-12 px-3 text-left font-normal text-sm"
                                                        >
                                                            {selectedProduct ? (
                                                                <div className="flex flex-col items-start min-w-0 flex-1">
                                                                    <span className="font-medium truncate w-full">
                                                                        {selectedProduct.NombreItem}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 truncate w-full">
                                                                        {selectedProduct.Codigo_Art} | {selectedProduct.Presentacion}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-500">Buscar producto...</span>
                                                            )}
                                                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent
                                                        className="p-0"
                                                        align="start"
                                                        side="bottom"
                                                    >
                                                        <Command shouldFilter={false}>
                                                            <CommandInput
                                                                placeholder="Buscar por código, nombre o laboratorio..."
                                                                value={productSearchQuery}
                                                                onValueChange={setProductSearchQuery}
                                                                className="text-sm"
                                                            />
                                                            <CommandList>
                                                                <CommandEmpty>
                                                                    {productsLoading ? "Buscando productos..." : "No se encontraron productos."}
                                                                </CommandEmpty>
                                                                <CommandGroup heading="Resultados">
                                                                    {filteredAllProducts.map((product) => (
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
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex justify-between items-center w-full mt-1">
                                                                                        <span className="text-xs text-gray-500 truncate">
                                                                                            <span className="font-medium">Código:</span>{" "}
                                                                                            {product.Codigo_Art}
                                                                                        </span>
                                                                                        <span className="text-xs text-gray-500 truncate">
                                                                                            <span className="font-medium">Lab:</span>{" "}
                                                                                            {product.Presentacion}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex justify-between mt-2 text-xs">
                                                                                        <span className="text-green-600">
                                                                                            Contado: S/.{Number(product.PUContado).toFixed(2)}
                                                                                        </span>
                                                                                        <span className="text-blue-600">
                                                                                            Crédito: S/.{Number(product.PUCredito).toFixed(2)}
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
                                    </div>

                                    {selectedProduct && (
                                        <Tabs defaultValue="escalas" className="w-full">
                                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                                <TabsTrigger value="escalas" className="flex items-center gap-2">
                                                    <TrendingUp className="h-4 w-4" />
                                                    Escalas de Precio
                                                </TabsTrigger>
                                                <TabsTrigger value="bonificaciones" className="flex items-center gap-2">
                                                    <Gift className="h-4 w-4" />
                                                    Bonificaciones
                                                </TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="escalas" className="space-y-4">
                                                <Card>
                                                    <CardHeader className="bg-purple-50 border-b">
                                                        <CardTitle className="flex items-center gap-2 text-purple-700 text-lg">
                                                            <TrendingUp className="h-5 w-5" />
                                                            Escalas de Precio
                                                        </CardTitle>
                                                        <CardDescription>
                                                            Define rangos de cantidad con precios especiales por volumen
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4 pt-4">
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="desde" className="text-sm font-medium">Desde</Label>
                                                                <Input
                                                                    id="desde"
                                                                    type="number"
                                                                    min="1"
                                                                    value={nuevaEscala.desde}
                                                                    onChange={(e) => setNuevaEscala({ ...nuevaEscala, desde: parseInt(e.target.value) || 1 })}
                                                                    className="h-10"
                                                                    placeholder="Ej: 10"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="hasta" className="text-sm font-medium">Hasta</Label>
                                                                <Input
                                                                    id="hasta"
                                                                    type="number"
                                                                    min={nuevaEscala.desde}
                                                                    value={nuevaEscala.hasta}
                                                                    onChange={(e) => setNuevaEscala({ ...nuevaEscala, hasta: parseInt(e.target.value) || 1 })}
                                                                    className="h-10"
                                                                    placeholder="Ej: 50"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="precio" className="text-sm font-medium">Precio</Label>
                                                                <div className="relative">
                                                                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                                                    <Input
                                                                        id="precio"
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0.01"
                                                                        value={nuevaEscala.precio}
                                                                        onChange={(e) => setNuevaEscala({ ...nuevaEscala, precio: parseFloat(e.target.value) || 0 })}
                                                                        className="h-10 pl-9"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <Button
                                                            onClick={handleAddEscala}
                                                            className="w-full bg-purple-600 hover:bg-purple-700 h-10"
                                                            disabled={!nuevaEscala.desde || !nuevaEscala.hasta || !nuevaEscala.precio}
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Agregar Escala
                                                        </Button>

                                                        {escalas.length > 0 ? (
                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <h4 className="font-semibold text-sm">Escalas configuradas</h4>
                                                                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                                                        {escalas.length} activas
                                                                    </Badge>
                                                                </div>
                                                                <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                                                                    {escalas.map((escala) => (
                                                                        <div key={escala.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                                                                            <div className="flex-1">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="bg-purple-100 p-2 rounded-md">
                                                                                        <TrendingUp className="h-4 w-4 text-purple-600" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="font-medium text-sm">
                                                                                            {escala.desde} - {escala.hasta} unidades
                                                                                        </div>
                                                                                        <div className="text-sm text-gray-600">
                                                                                            Precio: <span className="font-semibold text-green-600">S/ {escala.precio.toFixed(2)}</span> c/u
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => handleRemoveEscala(escala.id)}
                                                                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                                                            >
                                                                                <X className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                                                                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                                                <h4 className="font-medium text-gray-900 mb-1">No hay escalas configuradas</h4>
                                                                <p className="text-sm text-gray-500">
                                                                    Agrega rangos de cantidad con precios especiales
                                                                </p>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            </TabsContent>

                                            <TabsContent value="bonificaciones" className="space-y-4">
                                                <Card>
                                                    <CardHeader className="bg-yellow-50 border-b">
                                                        <CardTitle className="flex items-center gap-2 text-yellow-700 text-lg">
                                                            <Gift className="h-5 w-5" />
                                                            Bonificaciones
                                                        </CardTitle>
                                                        <CardDescription>
                                                            Configura promociones de "compra y lleva" - Puede ser del mismo producto u otros productos
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4 pt-4">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="compra" className="text-sm font-medium">Compra</Label>
                                                                <Input
                                                                    id="compra"
                                                                    type="number"
                                                                    min="1"
                                                                    value={nuevaBonificacion.compra}
                                                                    onChange={(e) => setNuevaBonificacion({ ...nuevaBonificacion, compra: parseInt(e.target.value) || 1 })}
                                                                    className="h-10"
                                                                    placeholder="Ej: 3"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="lleva" className="text-sm font-medium">Lleva gratis</Label>
                                                                <Input
                                                                    id="lleva"
                                                                    type="number"
                                                                    min="1"
                                                                    value={nuevaBonificacion.lleva}
                                                                    onChange={(e) => setNuevaBonificacion({ ...nuevaBonificacion, lleva: parseInt(e.target.value) || 1 })}
                                                                    className="h-10"
                                                                    placeholder="Ej: 1"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="descripcion" className="text-sm font-medium">Descripción de la promoción</Label>
                                                                <Input
                                                                    id="descripcion"
                                                                    placeholder={
                                                                        nuevaBonificacion.esMismoProducto
                                                                            ? "Ej: Compra 3 unidades y lleva 1 gratis"
                                                                            : "Ej: Compra 3 unidades y lleva 1 producto X gratis"
                                                                    }
                                                                    value={nuevaBonificacion.descripcion}
                                                                    onChange={(e) => setNuevaBonificacion({ ...nuevaBonificacion, descripcion: e.target.value })}
                                                                    className="h-10"
                                                                />
                                                            </div>

                                                            <div>
                                                                <div className="flex items-center space-x-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        id="esMismoProducto"
                                                                        checked={nuevaBonificacion.esMismoProducto}
                                                                        onChange={(e) => setNuevaBonificacion({
                                                                            ...nuevaBonificacion,
                                                                            esMismoProducto: e.target.checked,
                                                                            productoBonificado: e.target.checked ? "" : nuevaBonificacion.productoBonificado,
                                                                            descripcionProducto: e.target.checked ? "" : nuevaBonificacion.descripcionProducto
                                                                        })}
                                                                        className="h-4 w-4 text-blue-600 rounded"
                                                                    />
                                                                    <Label htmlFor="esMismoProducto" className="text-sm font-medium">
                                                                        Bonificar el mismo producto
                                                                    </Label>
                                                                </div>

                                                                {!nuevaBonificacion.esMismoProducto && (
                                                                    <div className="space-y-2 mt-3">
                                                                        <Popover>
                                                                            <PopoverTrigger asChild>
                                                                                <Button
                                                                                    variant="outline"
                                                                                    role="combobox"
                                                                                    className="w-full justify-between h-10 text-left font-normal"
                                                                                >
                                                                                    {nuevaBonificacion.descripcionProducto ? (
                                                                                        <div className="flex flex-col items-start min-w-0 flex-1">
                                                                                    <span className="font-medium truncate w-full">
                                                                                        {nuevaBonificacion.descripcionProducto}
                                                                                    </span>
                                                                                            {nuevaBonificacion.productoBonificado && (
                                                                                                <span className="text-xs text-gray-500 truncate w-full">
                                                                                            Código: {nuevaBonificacion.productoBonificado}
                                                                                        </span>
                                                                                            )}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <span className="text-gray-500">Seleccionar producto a bonificar...</span>
                                                                                    )}
                                                                                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                                                                                </Button>
                                                                            </PopoverTrigger>
                                                                            <PopoverContent className="p-0" align="start">
                                                                                <Command>
                                                                                    <CommandInput
                                                                                        placeholder="Buscar producto..."
                                                                                        className="h-9"
                                                                                    />
                                                                                    <CommandList>
                                                                                        <CommandEmpty>No se encontraron productos.</CommandEmpty>
                                                                                        <CommandGroup className="max-h-60 overflow-y-auto">
                                                                                            {allProducts.map((product) => (
                                                                                                <CommandItem
                                                                                                    key={product.Codigo_Art}
                                                                                                    value={product.Codigo_Art}
                                                                                                    onSelect={() => {
                                                                                                        setNuevaBonificacion({
                                                                                                            ...nuevaBonificacion,
                                                                                                            productoBonificado: product.Codigo_Art,
                                                                                                            descripcionProducto: product.NombreItem
                                                                                                        })
                                                                                                    }}
                                                                                                    className="py-3"
                                                                                                >
                                                                                                    <div className="flex items-start gap-2 w-full">
                                                                                                        <div className="bg-green-100 p-2 rounded-md shrink-0">
                                                                                                            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-green-600"/>
                                                                                                        </div>
                                                                                                        <div className="flex flex-col flex-1 min-w-0">
                                                                                                    <span className="font-medium text-sm truncate">
                                                                                                        {product.NombreItem}
                                                                                                    </span>
                                                                                                            <span className="text-xs text-gray-500 truncate">
                                                                                                        {product.Codigo_Art} | {product.Presentacion}
                                                                                                    </span>
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
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            onClick={handleAddBonificacion}
                                                            className="w-full bg-yellow-600 hover:bg-yellow-700 h-10"
                                                            disabled={
                                                                !nuevaBonificacion.compra ||
                                                                !nuevaBonificacion.lleva ||
                                                                !nuevaBonificacion.descripcion ||
                                                                (!nuevaBonificacion.esMismoProducto && !nuevaBonificacion.productoBonificado)
                                                            }
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Agregar Bonificación
                                                        </Button>

                                                        {bonificaciones.length > 0 ? (
                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <h4 className="font-semibold text-sm">Bonificaciones configuradas</h4>
                                                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                                                        {bonificaciones.length} activas
                                                                    </Badge>
                                                                </div>
                                                                <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                                                                    {bonificaciones.map((bonificacion) => (
                                                                        <div key={bonificacion.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                                                                            <div className="flex-1">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="bg-yellow-100 p-2 rounded-md">
                                                                                        <Gift className="h-4 w-4 text-yellow-600" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="font-medium text-sm">
                                                                                            Compra {bonificacion.compra} lleva {bonificacion.lleva}
                                                                                            {!bonificacion.esMismoProducto && (
                                                                                                <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 text-xs">
                                                                                                    Otro producto
                                                                                                </Badge>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="text-sm text-gray-600">{bonificacion.descripcion}</div>
                                                                                        {!bonificacion.esMismoProducto && bonificacion.descripcionProducto && (
                                                                                            <div className="text-xs text-blue-600 mt-1">
                                                                                                Producto: {bonificacion.descripcionProducto}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => handleRemoveBonificacion(bonificacion.id)}
                                                                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                                                            >
                                                                                <X className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                                                                <Gift className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                                                <h4 className="font-medium text-gray-900 mb-1">No hay bonificaciones</h4>
                                                                <p className="text-sm text-gray-500">
                                                                    Configura promociones de compra y lleva gratis
                                                                </p>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            </TabsContent>
                                        </Tabs>
                                    )}

                                </div>

                                <DialogFooter>
                                    <Button variant="outline" disabled={loadingSave} onClick={() => {
                                        setIsProductModalOpen(false)
                                        setSelectedProduct(null)
                                        setEscalas([])
                                        setBonificaciones([])
                                    }}>
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={() => selectedProduct && handleAddProductToManagement(selectedProduct)}
                                        disabled={!selectedProduct || loadingSave}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Guardar
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <Card key={index} className="border border-gray-200">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <Skeleton className="h-5 w-32" />
                                            <Skeleton className="h-5 w-16" />
                                        </div>
                                        <div className="space-y-2 mb-3">
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-4 w-1/2" />
                                        </div>
                                        <div className="flex gap-2">
                                            <Skeleton className="h-8 w-full" />
                                            <Skeleton className="h-8 w-full" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredProducts.map((producto, index) => (
                                <Card key={index} className="border border-gray-200 hover:shadow-lg transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-blue-600 text-sm truncate">{producto.NombreItem}</h3>
                                                <p className="text-xs text-gray-500 truncate">{producto.Codigo_Art}</p>
                                                <p className="text-xs text-gray-400 truncate">{producto.Presentacion}</p>
                                            </div>
                                            <div className="flex gap-1 flex-shrink-0">
                                                <Badge
                                                    variant={producto.escalaCount > 0 ? "default" : "outline"}
                                                    className={producto.escalaCount > 0 ? "bg-purple-100 text-purple-800" : ""}
                                                >
                                                    {producto.escalaCount} {producto.escalaCount == 1 ? 'Escala' : 'Escalas'}
                                                </Badge>
                                                <Badge
                                                    variant={producto.bonificacionCount > 0 ? "default" : "outline"}
                                                    className={producto.bonificacionCount > 0 ? "bg-yellow-100 text-yellow-800" : ""}
                                                >
                                                    {producto.bonificacionCount} {producto.bonificacionCount == 1 ? 'Bonificación' : 'Bonificacaciones'}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500">Precio Base:</span>
                                                <div className="flex items-center gap-1 mr-1">
                                                    <span className="font-bold text-sm text-green-600">
                                                        S/ {Number(producto.PUContado).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500">Stock:</span>
                                                <Badge variant="outline" className="bg-gray-50 text-gray-700 text-xs">
                                                    Stk. {Number(producto.Stock || 0)}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEditProduct(producto)}
                                                className="flex-1 text-xs"
                                            >
                                                <Edit className="h-3 w-3 mr-1" />
                                                Editar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 bg-transparent text-xs flex-1"
                                                onClick={() => handleDeleteByProd(producto)}
                                            >
                                                <Trash2 className="h-3 w-3 mr-1" />
                                                Eliminar
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos</h3>
                            <p className="text-gray-500 mb-4">
                                {searchQuery ? "No se encontraron productos que coincidan con tu búsqueda." : "Aún no hay productos en el sistema de promociones."}
                            </p>
                            <Button onClick={() => setIsProductModalOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Agregar Primer Producto
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Configurar Promociones - {selectedProduct?.NombreItem}
                        </DialogTitle>
                        <DialogDescription>
                            Código: {selectedProduct?.Codigo_Art} | Precio Base: S/ {Number(selectedProduct?.PUContado).toFixed(2)}
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="escalas" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="escalas" className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Escalas de Precio
                            </TabsTrigger>
                            <TabsTrigger value="bonificaciones" className="flex items-center gap-2">
                                <Gift className="h-4 w-4" />
                                Bonificaciones
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="escalas" className="space-y-4">
                            <Card>
                                <CardHeader className="bg-purple-50 border-b">
                                    <CardTitle className="flex items-center gap-2 text-purple-700 text-lg">
                                        <TrendingUp className="h-5 w-5" />
                                        Escalas de Precio
                                    </CardTitle>
                                    <CardDescription>
                                        Define rangos de cantidad con precios especiales por volumen
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="desde" className="text-sm font-medium">Desde</Label>
                                            <Input
                                                id="desde"
                                                type="number"
                                                min="1"
                                                value={nuevaEscala.desde}
                                                onChange={(e) => setNuevaEscala({ ...nuevaEscala, desde: parseInt(e.target.value) || 1 })}
                                                className="h-10"
                                                placeholder="Ej: 10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hasta" className="text-sm font-medium">Hasta</Label>
                                            <Input
                                                id="hasta"
                                                type="number"
                                                min={nuevaEscala.desde}
                                                value={nuevaEscala.hasta}
                                                onChange={(e) => setNuevaEscala({ ...nuevaEscala, hasta: parseInt(e.target.value) || 1 })}
                                                className="h-10"
                                                placeholder="Ej: 50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="precio" className="text-sm font-medium">Precio</Label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                                <Input
                                                    id="precio"
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    value={nuevaEscala.precio}
                                                    onChange={(e) => setNuevaEscala({ ...nuevaEscala, precio: parseFloat(e.target.value) || 0 })}
                                                    className="h-10 pl-9"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleAddEscala}
                                        className="w-full bg-purple-600 hover:bg-purple-700 h-10"
                                        disabled={!nuevaEscala.desde || !nuevaEscala.hasta || !nuevaEscala.precio}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Agregar Escala
                                    </Button>

                                    {escalas.length > 0 ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold text-sm">Escalas configuradas</h4>
                                                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                                    {escalas.length} activas
                                                </Badge>
                                            </div>
                                            <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                                                {escalas.map((escala) => (
                                                    <div key={escala.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-purple-100 p-2 rounded-md">
                                                                    <TrendingUp className="h-4 w-4 text-purple-600" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-sm">
                                                                        {escala.desde} - {escala.hasta} unidades
                                                                    </div>
                                                                    <div className="text-sm text-gray-600">
                                                                        Precio: <span className="font-semibold text-green-600">S/ {escala.precio.toFixed(2)}</span> c/u
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleRemoveEscala(escala.id)}
                                                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                                            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                            <h4 className="font-medium text-gray-900 mb-1">No hay escalas configuradas</h4>
                                            <p className="text-sm text-gray-500">
                                                Agrega rangos de cantidad con precios especiales
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="bonificaciones" className="space-y-4">
                            <Card>
                                <CardHeader className="bg-yellow-50 border-b">
                                    <CardTitle className="flex items-center gap-2 text-yellow-700 text-lg">
                                        <Gift className="h-5 w-5" />
                                        Bonificaciones
                                    </CardTitle>
                                    <CardDescription>
                                        Configura promociones de "compra y lleva" - Puede ser del mismo producto u otros productos
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="compra" className="text-sm font-medium">Compra</Label>
                                            <Input
                                                id="compra"
                                                type="number"
                                                min="1"
                                                value={nuevaBonificacion.compra}
                                                onChange={(e) => setNuevaBonificacion({ ...nuevaBonificacion, compra: parseInt(e.target.value) || 1 })}
                                                className="h-10"
                                                placeholder="Ej: 3"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lleva" className="text-sm font-medium">Lleva gratis</Label>
                                            <Input
                                                id="lleva"
                                                type="number"
                                                min="1"
                                                value={nuevaBonificacion.lleva}
                                                onChange={(e) => setNuevaBonificacion({ ...nuevaBonificacion, lleva: parseInt(e.target.value) || 1 })}
                                                className="h-10"
                                                placeholder="Ej: 1"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="descripcion" className="text-sm font-medium">Descripción de la promoción</Label>
                                            <Input
                                                id="descripcion"
                                                placeholder={
                                                    nuevaBonificacion.esMismoProducto
                                                        ? "Ej: Compra 3 unidades y lleva 1 gratis"
                                                        : "Ej: Compra 3 unidades y lleva 1 producto X gratis"
                                                }
                                                value={nuevaBonificacion.descripcion}
                                                onChange={(e) => setNuevaBonificacion({ ...nuevaBonificacion, descripcion: e.target.value })}
                                                className="h-10"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id="esMismoProducto"
                                                    checked={nuevaBonificacion.esMismoProducto}
                                                    onChange={(e) => setNuevaBonificacion({
                                                        ...nuevaBonificacion,
                                                        esMismoProducto: e.target.checked,
                                                        productoBonificado: e.target.checked ? "" : nuevaBonificacion.productoBonificado,
                                                        descripcionProducto: e.target.checked ? "" : nuevaBonificacion.descripcionProducto
                                                    })}
                                                    className="h-4 w-4 text-blue-600 rounded"
                                                />
                                                <Label htmlFor="esMismoProducto" className="text-sm font-medium">
                                                    Bonificar el mismo producto
                                                </Label>
                                            </div>

                                            {!nuevaBonificacion.esMismoProducto && (
                                                <div className="space-y-2 mt-3">
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                className="w-full justify-between h-10 text-left font-normal"
                                                            >
                                                                {nuevaBonificacion.descripcionProducto ? (
                                                                    <div className="flex flex-col items-start min-w-0 flex-1">
                                                                                    <span className="font-medium truncate w-full">
                                                                                        {nuevaBonificacion.descripcionProducto}
                                                                                    </span>
                                                                        {nuevaBonificacion.productoBonificado && (
                                                                            <span className="text-xs text-gray-500 truncate w-full">
                                                                                            Código: {nuevaBonificacion.productoBonificado}
                                                                                        </span>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-500">Seleccionar producto a bonificar...</span>
                                                                )}
                                                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="p-0" align="start">
                                                            <Command>
                                                                <CommandInput
                                                                    placeholder="Buscar producto..."
                                                                    className="h-9"
                                                                />
                                                                <CommandList>
                                                                    <CommandEmpty>No se encontraron productos.</CommandEmpty>
                                                                    <CommandGroup className="max-h-60 overflow-y-auto">
                                                                        {allProducts.map((product) => (
                                                                            <CommandItem
                                                                                key={product.Codigo_Art}
                                                                                value={product.Codigo_Art}
                                                                                onSelect={() => {
                                                                                    setNuevaBonificacion({
                                                                                        ...nuevaBonificacion,
                                                                                        productoBonificado: product.Codigo_Art,
                                                                                        descripcionProducto: product.NombreItem
                                                                                    })
                                                                                }}
                                                                                className="py-3"
                                                                            >
                                                                                <div className="flex items-start gap-2 w-full">
                                                                                    <div className="bg-green-100 p-2 rounded-md shrink-0">
                                                                                        <Package className="h-3 w-3 sm:h-4 sm:w-4 text-green-600"/>
                                                                                    </div>
                                                                                    <div className="flex flex-col flex-1 min-w-0">
                                                                                                    <span className="font-medium text-sm truncate">
                                                                                                        {product.NombreItem}
                                                                                                    </span>
                                                                                        <span className="text-xs text-gray-500 truncate">
                                                                                                        {product.Codigo_Art} | {product.Presentacion}
                                                                                                    </span>
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
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleAddBonificacion}
                                        className="w-full bg-yellow-600 hover:bg-yellow-700 h-10"
                                        disabled={
                                            !nuevaBonificacion.compra ||
                                            !nuevaBonificacion.lleva ||
                                            !nuevaBonificacion.descripcion ||
                                            (!nuevaBonificacion.esMismoProducto && !nuevaBonificacion.productoBonificado)
                                        }
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Agregar Bonificación
                                    </Button>

                                    {bonificaciones.length > 0 ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold text-sm">Bonificaciones configuradas</h4>
                                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                                    {bonificaciones.length} activas
                                                </Badge>
                                            </div>
                                            <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                                                {bonificaciones.map((bonificacion) => (
                                                    <div key={bonificacion.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-yellow-100 p-2 rounded-md">
                                                                    <Gift className="h-4 w-4 text-yellow-600" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-sm">
                                                                        Compra {bonificacion.compra} lleva {bonificacion.lleva}
                                                                        {!bonificacion.esMismoProducto && (
                                                                            <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 text-xs">
                                                                                Otro producto
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-sm text-gray-600">{bonificacion.descripcion}</div>
                                                                    {!bonificacion.esMismoProducto && bonificacion.descripcionProducto && (
                                                                        <div className="text-xs text-blue-600 mt-1">
                                                                            Producto: {bonificacion.descripcionProducto}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleRemoveBonificacion(bonificacion.id)}
                                                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                                            <Gift className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                            <h4 className="font-medium text-gray-900 mb-1">No hay bonificaciones</h4>
                                            <p className="text-sm text-gray-500">
                                                Configura promociones de compra y lleva gratis
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button variant="outline" disabled={loadingSave} onClick={() => setIsEditModalOpen(false)}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveChanges} disabled={loadingSave} className="bg-green-600 hover:bg-green-700">
                            <Save className="mr-2 h-4 w-4" />
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}