'use client'
import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    ShoppingCart, Filter, Minus, Plus, Trash, Package, AlertCircle,
    Warehouse, FileText, Check, RefreshCw, Eraser,
} from "lucide-react"
import { IProduct, ISelectedProduct, IAlmacen } from "@/app/types/order/product-interface"
import { IItemDashboard } from "@/app/types/metas-types"
import { IMoneda } from "@/app/types/order/client-interface"
import { PriceType, ProductoConLotes } from "@/app/types/order/order-interface"
import ModalLoader from "@/components/modal/modalLoader"
import SelectedProductsTable from "@/components/tomar-pedido/Selectedproductstable"
import PriceSelector from "@/components/tomar-pedido/product-step/PriceSelector"
import LabSearchDialog from "@/components/tomar-pedido/product-step/LabSearchDialog"
import ClearAllDialog from "@/components/tomar-pedido/product-step/ClearAllDialog"
import EditQuantityDialog from "@/components/tomar-pedido/product-step/EditQuantityDialog"
import InlineAutocomplete from "@/components/tomar-pedido/InlineAutocomplete"
import ConfirmOrderDialog from "@/components/tomar-pedido/ConfirmOrderDialog"
import CollapsibleWidget from "@/components/tomar-pedido/CollapsibleWidget"
import { calcularTotal, getCurrencySymbol } from "@/app/utils/order-helpers"

// Widget "Seleccionar Producto" de la sección única de Tomar Pedido Alpha.
// El buscador de productos pasa de un modal a un autocompletado inline
// (predicciones bajo el input mientras se escribe), y el carrito con el
// total y la confirmación viven en el mismo widget.
interface ProductWidgetAlphaProps {
    selectedProduct: IProduct | null
    filteredProducts: IProduct[]
    searchQuery: string
    onSearchQueryChange: (val: string) => void
    onProductSelect: (product: IProduct | null) => void
    priceType: PriceType
    onPriceTypeChange: (pt: PriceType) => void
    priceEdit: any
    onPriceEditChange: (val: any) => void
    onPriceEditBlur: (e: React.FocusEvent<HTMLInputElement>) => void
    currency: IMoneda | null
    quantity: number | ""
    onQuantityChange: (val: number | "") => void
    onAddProduct: () => void
    loadingProducts: boolean
    isLoading: boolean
    modalLoader: string | null | undefined
    onIsLoadingChange: (val: boolean) => void
    laboratories: any[]
    selectedLaboratorio: string | null
    onLaboratorioChange: (val: string) => void
    selectedProducts: ISelectedProduct[]
    productosConLotes: ProductoConLotes[]
    onRemoveItem: (index: number) => void
    onChangeLote: (items: ISelectedProduct[], index: number) => void
    onClearAll: () => void
    isStepValid: boolean
    onUpdateProducts?: (products: ISelectedProduct[]) => void
    metasMap?: Map<string, IItemDashboard> | null
    note: string
    onNoteChange: (val: string) => void
    isLoadingSave: boolean
    onConfirmOrder: () => void
    selectedAlmacen: IAlmacen | null
    almacenes: IAlmacen[]
    loadingAlmacenes?: boolean
    onSelectAlmacen: (alm: IAlmacen) => void
    /** true apenas el cliente queda seleccionado: enfoca el buscador de
     * producto para encadenar el siguiente paso sin usar el mouse. */
    autoFocusSearch?: boolean
    /** Abre el diálogo de confirmación para vaciar cliente y productos. */
    onClearOrder?: () => void
    /** Modo controlado (acordeón con Cliente: solo uno abierto a la vez). */
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

const IgvBadge = ({ product }: { product: IProduct }) => {
    if (product.afecto_igv === 1 || product.afecto_igv === undefined) return null
    if (product.tipo_afectacion_igv === '20') {
        return <span className="shrink-0 rounded-full border border-yellow-300 bg-yellow-50 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-700 dark:border-yellow-900/50 dark:bg-yellow-950/30 dark:text-yellow-400">EXONERADO</span>
    }
    if (product.tipo_afectacion_igv === '30') {
        return <span className="shrink-0 rounded-full border border-blue-300 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400">INAFECTO</span>
    }
    return null
}

export default function ProductWidgetAlpha({
    selectedProduct, filteredProducts, searchQuery, onSearchQueryChange, onProductSelect,
    priceType, onPriceTypeChange, priceEdit, onPriceEditChange, onPriceEditBlur, currency,
    quantity, onQuantityChange, onAddProduct, loadingProducts, isLoading, modalLoader,
    onIsLoadingChange, laboratories, selectedLaboratorio, onLaboratorioChange,
    selectedProducts, productosConLotes, onRemoveItem, onChangeLote, onClearAll,
    isStepValid, onUpdateProducts, metasMap, note, onNoteChange, isLoadingSave,
    onConfirmOrder, selectedAlmacen, almacenes, loadingAlmacenes = false, onSelectAlmacen, autoFocusSearch = false,
    onClearOrder, open, onOpenChange,
}: ProductWidgetAlphaProps) {
    const [labModalSearchOpen, setLabModalSearchOpen] = useState(false)
    const [showClearAllDialog, setShowClearAllDialog] = useState(false)
    const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null)
    const [editQuantity, setEditQuantity] = useState<number | "">(1)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [showNote, setShowNote] = useState(false)
    // Confirmación antes de quitar un producto individual de la grilla
    // (desktop y mobile comparten el mismo diálogo, ya que ambos renderizan
    // la misma tabla con variant="cards").
    const [removingIndex, setRemovingIndex] = useState<number | null>(null)

    const safeQuantity = typeof quantity === "number" ? quantity : 0
    const sym = getCurrencySymbol(currency?.value)

    useEffect(() => { if (note) setShowNote(true) }, [note])

    const handleEditClick = (index: number) => {
        setEditingProductIndex(index)
        setEditQuantity(selectedProducts[index].quantity)
    }

    const handleSaveEditQuantity = () => {
        if (editingProductIndex !== null && typeof editQuantity === 'number' && editQuantity > 0 && onUpdateProducts) {
            const updatedProducts = [...selectedProducts]
            updatedProducts[editingProductIndex].quantity = editQuantity
            onUpdateProducts(updatedProducts)
        }
        setEditingProductIndex(null)
    }

    // Barra de acciones del pedido: se saca como sección propia (fuera del
    // widget "Seleccionar Producto") para que no dependa del acordeón —
    // se ve siempre que haya al menos un producto, aunque el widget esté
    // colapsado.
    const orderActionsBar = selectedProducts.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 rounded-xl border border-border bg-background shadow-md py-4 px-3 sm:px-6">
            <div className="flex items-center justify-between sm:justify-start gap-3 sm:order-2 sm:ml-auto">
                {!isStepValid && <span className="text-orange-600 text-xs">Hay lotes no seleccionados</span>}
                <span className="text-sm sm:text-base font-semibold text-foreground whitespace-nowrap">
                    Total: {sym} {calcularTotal(selectedProducts).toFixed(2)}
                </span>
            </div>

            <Button
                type="button"
                className="sm:order-3 w-full sm:w-auto bg-green-600 hover:bg-green-700"
                disabled={!isStepValid || isLoadingSave}
                onClick={() => setConfirmOpen(true)}
            >
                <Check className="mr-2 h-4 w-4" />
                Confirmar Pedido
            </Button>

            {onClearOrder && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClearOrder}
                    className="sm:order-1 w-full sm:w-auto text-red-600 border-red-200 bg-red-50/50 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-900/50 dark:bg-red-950/20 dark:hover:bg-red-950/40"
                >
                    <Eraser className="mr-2 h-4 w-4" />
                    Limpiar pedido
                </Button>
            )}
        </div>
    )

    const badge = selectedProducts.length > 0 && (
        <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 bg-violet-600 text-white text-xs font-bold rounded-full">
            {selectedProducts.length}
        </span>
    )

    return (
        <>
        <CollapsibleWidget icon={Package} title="Seleccionar Producto" badge={badge} accent="violet" open={open} onOpenChange={onOpenChange}>
                {!selectedAlmacen ? (
                    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
                        <Warehouse className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Elegí un almacén para ver productos</p>
                            <p className="text-xs text-amber-700 dark:text-amber-400">El stock y los precios dependen del almacén.</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {loadingAlmacenes ? (
                                <span className="text-xs text-amber-700 dark:text-amber-400">Cargando almacenes...</span>
                            ) : almacenes.length === 0 ? (
                                <span className="text-xs text-amber-700 dark:text-amber-400">No hay almacenes disponibles.</span>
                            ) : (
                                almacenes.map((alm) => (
                                    <Button
                                        key={alm.IdAlmacen}
                                        type="button" size="sm"
                                        onClick={() => onSelectAlmacen(alm)}
                                        className="bg-amber-600 hover:bg-amber-700 text-white whitespace-nowrap"
                                    >
                                        {alm.Descripcion}
                                    </Button>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setLabModalSearchOpen(true)}
                                className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                    selectedLaboratorio
                                        ? 'border-purple-300 bg-purple-100 text-purple-700 hover:bg-purple-200 dark:border-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                                        : 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:border-purple-900/50 dark:bg-purple-950/20 dark:text-purple-400'
                                }`}
                            >
                                <Filter className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">
                                    {selectedLaboratorio
                                        ? (laboratories.find(l => String(l.IdLineaGe) === selectedLaboratorio)?.Descripcion ?? selectedLaboratorio)
                                        : 'Filtrar por laboratorio'}
                                </span>
                            </button>
                            <LabSearchDialog
                                open={labModalSearchOpen} onOpenChange={setLabModalSearchOpen}
                                laboratories={laboratories} selectedLaboratorio={selectedLaboratorio}
                                onLaboratorioChange={onLaboratorioChange}
                            />
                        </div>

                        {selectedProduct ? (
                            // Todo en una sola tarjeta compacta: info del producto, cantidad,
                            // agregar y cambiar comparten fila en vez de apilarse cada uno por
                            // su cuenta — así no "roba" tanto espacio vertical al widget.
                            <div className="space-y-3 rounded-xl border border-violet-200 dark:border-violet-900/50 bg-violet-50 dark:bg-violet-950/30 p-3">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-violet-900 dark:text-violet-100 leading-tight">
                                            {selectedProduct.NombreItem}
                                        </p>
                                        <p className="text-xs text-violet-600 dark:text-violet-400 truncate">
                                            {selectedProduct.Codigo_Art} | {selectedProduct.Descripcion}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto sm:items-end sm:gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-medium text-violet-700 dark:text-violet-400 whitespace-nowrap">
                                                Cantidad
                                            </Label>
                                            <div className={`inline-flex items-center h-9 rounded-lg border bg-background overflow-hidden transition-colors ${
                                                safeQuantity >= Number(selectedProduct.Stock) ? 'border-red-300' : 'border-border'
                                            }`}>
                                                <button
                                                    type="button"
                                                    onClick={() => safeQuantity <= 1
                                                        ? (onProductSelect(null), onQuantityChange(1))
                                                        : onQuantityChange(safeQuantity - 1)}
                                                    className={`h-full w-8 shrink-0 flex items-center justify-center transition-colors ${
                                                        safeQuantity <= 1
                                                            ? 'text-red-400 hover:text-red-600 hover:bg-red-50'
                                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                                    }`}
                                                >
                                                    {safeQuantity <= 1 ? <Trash className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                                                </button>
                                                <input
                                                    type="number" min="1" step="1"
                                                    value={quantity}
                                                    onChange={(e) => {
                                                        const val = e.target.value
                                                        if (val === "") onQuantityChange("")
                                                        else {
                                                            const num = parseInt(val, 10)
                                                            if (!isNaN(num) && num > 0)
                                                                onQuantityChange(Math.min(num, Number(selectedProduct.Stock)))
                                                        }
                                                    }}
                                                    onBlur={() => { if (quantity === "" || quantity < 1) onQuantityChange(1) }}
                                                    onKeyDown={(e) => { if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault() }}
                                                    className="w-9 bg-transparent outline-none text-center text-sm font-semibold text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <button
                                                    type="button"
                                                    disabled={safeQuantity >= Number(selectedProduct.Stock)}
                                                    onClick={() => onQuantityChange(Math.min(safeQuantity + 1, Number(selectedProduct.Stock)))}
                                                    className={`h-full w-8 shrink-0 flex items-center justify-center transition-colors disabled:cursor-not-allowed ${
                                                        safeQuantity >= Number(selectedProduct.Stock) ? 'text-muted-foreground/50' : 'text-muted-foreground hover:text-blue-600 hover:bg-blue-50'
                                                    }`}
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {(() => {
                                            const stockTotal = Number(selectedProduct.Stock)
                                            const remaining = Math.max(0, stockTotal - safeQuantity)
                                            const remainingColor = remaining <= 0 ? 'text-red-500' : remaining <= 3 ? 'text-amber-500' : 'text-green-600'
                                            return (
                                                <div className="flex h-9 shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-muted px-2.5 leading-none">
                                                    <span className="text-[9px] font-medium text-muted-foreground whitespace-nowrap">Stock: {stockTotal.toFixed(0)}</span>
                                                    <div className="my-1 h-px w-full bg-border" />
                                                    <span className={`text-[9px] font-semibold whitespace-nowrap ${remainingColor}`}>Restante: {remaining}</span>
                                                </div>
                                            )
                                        })()}

                                        <Button
                                            type="button"
                                            disabled={loadingProducts}
                                            onClick={onAddProduct}
                                            className="h-9 w-full sm:w-auto sm:shrink-0 bg-indigo-600 hover:bg-indigo-700 font-medium px-4"
                                        >
                                            <ShoppingCart className="h-4 w-4 mr-2" />
                                            <span className="hidden lg:inline">Agregar al pedido</span>
                                            <span className="lg:hidden">Agregar</span>
                                        </Button>

                                        <Button
                                            type="button" variant="outline"
                                            onClick={() => { onProductSelect(null); onSearchQueryChange('') }}
                                            className="h-9 px-4 w-full sm:w-auto sm:shrink-0 font-medium text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-700 bg-background dark:bg-transparent"
                                        >
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Cambiar
                                        </Button>
                                    </div>
                                </div>

                                <PriceSelector
                                    selectedProduct={selectedProduct} priceType={priceType}
                                    onPriceTypeChange={onPriceTypeChange} priceEdit={priceEdit}
                                    onPriceEditChange={onPriceEditChange} onPriceEditBlur={onPriceEditBlur}
                                    currency={currency}
                                />

                                {(() => {
                                    const unitPrice = priceType === 'regalo' ? 0 : priceType === 'contado' ? Number(selectedProduct.PUContado) : priceType === 'credito' ? Number(selectedProduct.PUCredito) : priceType === 'porMenor' ? Number(selectedProduct.PUPorMenor) : priceType === 'porMayor' ? Number(selectedProduct.PUPorMayor) : Number(priceEdit)
                                    return (
                                        <p className="text-[11px] text-right text-muted-foreground">
                                            {sym}{unitPrice.toFixed(2)} × {safeQuantity} = <span className="font-semibold text-foreground">{sym}{(unitPrice * safeQuantity).toFixed(2)}</span>
                                        </p>
                                    )
                                })()}
                            </div>
                        ) : (
                            <InlineAutocomplete<IProduct>
                                variant="tile"
                                tileIcon={Package}
                                tileAccent="violet"
                                tileTitle="Seleccionar producto"
                                tileDescription="Tocá para buscar por código, nombre o laboratorio"
                                placeholder="Código, nombre o laboratorio..."
                                value={searchQuery}
                                onValueChange={onSearchQueryChange}
                                loading={loadingProducts}
                                items={filteredProducts}
                                pageSize={30}
                                getKey={(p) => p.Codigo_Art}
                                getItemLabel={(p) => p.NombreItem}
                                onSelect={(p) => onProductSelect(p)}
                                isItemDisabled={(p) => Number(p.Stock) <= 0 && !p.tieneSustitutos}
                                emptyMessage="No se encontraron productos"
                                idleMessage="Escribe para buscar productos"
                                focusTrigger={autoFocusSearch}
                                renderItem={(p) => {
                                    const stockNum = Number(p.Stock)
                                    const isAgotado = stockNum <= 0
                                    const stockBadgeClass = isAgotado
                                        ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
                                        : stockNum <= 10
                                            ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900/50"
                                            : "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50"
                                    return (
                                        <div className="flex items-start gap-3 px-3 py-2.5">
                                            <div className={`${isAgotado ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'} dark:bg-blue-900/40 p-2 rounded-lg shrink-0 mt-0.5`}>
                                                {isAgotado ? <AlertCircle className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                                            </div>
                                            <div className="flex flex-col flex-1 min-w-0 gap-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="font-semibold text-sm text-foreground line-clamp-2 flex-1 leading-tight">
                                                        {p.NombreItem}
                                                    </span>
                                                    <span className={`text-xs shrink-0 font-medium border rounded-full px-2 py-0.5 ${stockBadgeClass}`}>
                                                        Stock: {stockNum.toFixed(0)}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                                                    <span className="text-xs text-muted-foreground"><span className="font-medium">Cód:</span> {p.Codigo_Art}</span>
                                                    <span className="text-xs text-muted-foreground truncate"><span className="font-medium">Lab:</span> {p.Descripcion}</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                                                    <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                                                        Contado: {sym}{Number(p.PUContado).toFixed(2)}
                                                    </span>
                                                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                                                        Crédito: {sym}{Number(p.PUCredito).toFixed(2)}
                                                    </span>
                                                    <IgvBadge product={p} />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }}
                            />
                        )}
                    </div>
                )}

                {selectedProducts.length > 0 && (
                    <div className="space-y-4 border-t border-border pt-4">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-violet-100 dark:bg-violet-900/40 rounded-md">
                                <ShoppingCart className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            <span className="text-sm font-semibold text-foreground">Productos Seleccionados</span>
                            <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 bg-violet-600 text-white text-xs font-bold rounded-full">
                                {selectedProducts.length}
                            </span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setShowClearAllDialog(true)} className="ml-auto text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-xs h-8">
                                <Trash className="h-3.5 w-3.5 lg:mr-1" />
                                <span className="hidden lg:inline">Limpiar todo</span>
                            </Button>
                        </div>

                        <SelectedProductsTable
                            selectedProducts={selectedProducts} productosConLotes={productosConLotes}
                            currencyValue={currency?.value} onRemoveItem={(index) => setRemovingIndex(index)}
                            onChangeLote={onChangeLote} onEditClick={handleEditClick}
                            metasMap={metasMap} variant="cards" showTotal={false}
                        />

                        {showNote ? (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-muted-foreground" />
                                        <Label className="text-sm font-medium text-foreground">Observaciones</Label>
                                    </div>
                                    {!note && (
                                        <button type="button" onClick={() => setShowNote(false)} className="text-xs text-muted-foreground hover:text-foreground">
                                            Ocultar
                                        </button>
                                    )}
                                </div>
                                <div className="bg-background rounded-lg border border-border">
                                    <Textarea
                                        placeholder="Escribe aquí cualquier observación adicional para el pedido..."
                                        className="min-h-[80px] resize-none border-0 focus-visible:ring-0 text-sm"
                                        value={note}
                                        onChange={(e) => onNoteChange(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>
                        ) : (
                            <Button
                                type="button" variant="ghost" onClick={() => setShowNote(true)}
                                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                                <FileText className="h-3.5 w-3.5 mr-1.5" />
                                Agregar observación (opcional)
                            </Button>
                        )}
                    </div>
                )}
        </CollapsibleWidget>

        {orderActionsBar}

        <ClearAllDialog isOpen={showClearAllDialog} onClose={() => setShowClearAllDialog(false)} onConfirm={() => { onClearAll(); setShowClearAllDialog(false) }} />

        <AlertDialog open={removingIndex !== null} onOpenChange={(v) => { if (!v) setRemovingIndex(null) }}>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <Trash className="h-5 w-5" />
                        Quitar producto
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {removingIndex !== null && selectedProducts[removingIndex]
                            ? <>¿Seguro que deseas quitar <span className="font-medium text-foreground">{selectedProducts[removingIndex].product.NombreItem}</span> del pedido?</>
                            : '¿Seguro que deseas quitar este producto del pedido?'}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => { if (removingIndex !== null) onRemoveItem(removingIndex); setRemovingIndex(null) }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        Sí, quitar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <EditQuantityDialog
            isOpen={editingProductIndex !== null}
            onClose={() => setEditingProductIndex(null)}
            selectedItem={editingProductIndex !== null ? selectedProducts[editingProductIndex] : null}
            editQuantity={editQuantity} setEditQuantity={setEditQuantity} onSave={handleSaveEditQuantity}
        />
        <ModalLoader open={isLoading} onOpenChange={onIsLoadingChange} caseKey={modalLoader ?? undefined} />
        <ConfirmOrderDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            selectedProducts={selectedProducts}
            isLoading={isLoadingSave}
            onConfirm={() => { setConfirmOpen(false); onConfirmOrder() }}
        />
        </>
    )
}
