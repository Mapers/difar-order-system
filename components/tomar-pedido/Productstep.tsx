'use client'
import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {ShoppingCart, ArrowRight, ArrowLeft, Search, Building, Minus, Plus, Trash, Package, Save} from "lucide-react"

import { IProduct, ISelectedProduct } from "@/app/types/order/product-interface"
import { IMoneda } from "@/app/types/order/client-interface"
import { PriceType, ProductoConLotes } from "@/app/types/order/order-interface"

import ModalLoader from "@/components/modal/modalLoader"
import SelectedProductsTable from "@/components/tomar-pedido/Selectedproductstable"
import PriceSelector from "@/components/tomar-pedido/product-step/PriceSelector";
import LabSearchDialog from "@/components/tomar-pedido/product-step/LabSearchDialog";
import ClearAllDialog from "@/components/tomar-pedido/product-step/ClearAllDialog";
import EditQuantityDialog from "@/components/tomar-pedido/product-step/EditQuantityDialog";
import ProductSearchDialog from "@/components/tomar-pedido/product-step/ProductSearchDialog";
import {getCurrencySymbol} from "@/app/utils/order-helpers";

interface ProductStepProps {
    open: boolean
    onOpenChange: (open: boolean) => void
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
    onChangeLote: (items: ISelectedProduct[]) => void
    onClearAll: () => void
    onNext: () => void
    onPrev: () => void
    isStepValid: boolean
    onUpdateProducts?: (products: ISelectedProduct[]) => void;
    handleSaveDraft: () => void
}

export default function ProductStep({
                                        open, onOpenChange, selectedProduct, filteredProducts, searchQuery,
                                        onSearchQueryChange, onProductSelect, priceType, onPriceTypeChange,
                                        priceEdit, onPriceEditChange, onPriceEditBlur, currency, quantity,
                                        onQuantityChange, onAddProduct, loadingProducts, isLoading, modalLoader,
                                        onIsLoadingChange, laboratories, selectedLaboratorio, onLaboratorioChange,
                                        selectedProducts, productosConLotes, onRemoveItem, onChangeLote,
                                        onClearAll, onNext, onPrev, isStepValid, onUpdateProducts, handleSaveDraft
                                    }: ProductStepProps) {
    const [labModalSearchOpen, setLabModalSearchOpen] = useState(false)
    const [showClearAllDialog, setShowClearAllDialog] = useState(false)
    const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null)
    const [editQuantity, setEditQuantity] = useState<number | "">(1)

    const safeQuantity = typeof quantity === "number" ? quantity : 0;

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

    return (
        <div className="grid gap-6">
            <Card className="shadow-md bg-white">
                <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-md">
                            <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-blue-700 dark:text-blue-400">Agregar Productos</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Producto</Label>
                        <Button
                            type="button" variant="outline" onClick={() => onOpenChange(true)}
                            className="w-full justify-start h-11 sm:h-12 px-3 text-left font-normal text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500 overflow-hidden"
                        >
                            <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
                            {selectedProduct ? (
                                <div className="flex flex-col items-start min-w-0 flex-1 overflow-hidden">
                                    <span className="font-semibold text-gray-900 dark:text-gray-100 w-full truncate">{selectedProduct.NombreItem}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 w-full truncate">{selectedProduct.Codigo_Art} | {selectedProduct.Descripcion}</span>
                                </div>
                            ) : (
                                <span className="truncate text-gray-400 dark:text-gray-500 font-normal">Buscar por código, nombre o laboratorio...</span>
                            )}
                        </Button>

                        <ProductSearchDialog
                            open={open} onOpenChange={onOpenChange}
                            searchQuery={searchQuery} onSearchQueryChange={onSearchQueryChange}
                            filteredProducts={filteredProducts} onProductSelect={onProductSelect}
                            currency={currency}
                        />

                        {selectedProduct && (
                            <PriceSelector
                                selectedProduct={selectedProduct} priceType={priceType}
                                onPriceTypeChange={onPriceTypeChange} priceEdit={priceEdit}
                                onPriceEditChange={onPriceEditChange} onPriceEditBlur={onPriceEditBlur}
                                currency={currency}
                            />
                        )}
                    </div>

                    <div className="flex gap-2 sm:gap-3 items-end">
                        <div className="flex-1 space-y-1.5 min-w-0">
                            <Label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Lab</Label>
                            <Button
                                type="button" variant="outline" onClick={() => setLabModalSearchOpen(true)}
                                className="w-full justify-start h-11 px-3 text-left font-normal text-xs sm:text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 hover:border-purple-400 dark:hover:border-purple-500 overflow-hidden"
                            >
                                <Building className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
                                <span className="truncate text-gray-900 dark:text-gray-100">
                                    {selectedLaboratorio ? (laboratories.find(l => String(l.IdLineaGe) === selectedLaboratorio)?.Descripcion ?? selectedLaboratorio) : <span className="text-gray-400">Seleccionar laboratorio...</span>}
                                </span>
                            </Button>
                            <LabSearchDialog
                                open={labModalSearchOpen} onOpenChange={setLabModalSearchOpen}
                                laboratories={laboratories} selectedLaboratorio={selectedLaboratorio}
                                onLaboratorioChange={onLaboratorioChange}
                            />
                        </div>

                        <div className="shrink-0 space-y-1.5">
                            <Label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                Cant.
                                {selectedProduct && (() => {
                                    const stockTotal = Number(selectedProduct.Stock);
                                    const remaining = stockTotal - safeQuantity;
                                    return (
                                        <span className="ml-1.5 text-[10px] font-normal text-gray-400 dark:text-gray-500">
                                            Stock: {stockTotal.toFixed(0)} · <span className={remaining <= 0 ? 'text-red-500 dark:text-red-400 font-semibold' : remaining <= 3 ? 'text-amber-500 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}>
                                                Restante: {Math.max(0, remaining)}
                                            </span>
                                        </span>
                                    );
                                })()}
                            </Label>
                            <div className={`flex items-center h-11 rounded-lg border overflow-hidden transition-colors ${!selectedProduct ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-100 opacity-50 cursor-not-allowed' : (selectedProduct && safeQuantity >= Number(selectedProduct.Stock)) ? 'bg-gray-50 border-red-300' : 'bg-gray-50 border-gray-200'}`}>
                                <button
                                    type="button" disabled={!selectedProduct}
                                    onClick={() => safeQuantity <= 1 ? (onProductSelect(null), onQuantityChange(1)) : onQuantityChange(safeQuantity - 1)}
                                    className={`h-full px-2.5 flex items-center justify-center transition-colors disabled:cursor-not-allowed ${safeQuantity <= 1 ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                                >
                                    {safeQuantity <= 1 ? <Trash className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                                </button>
                                <input
                                    type="number" min="1" step="1" disabled={!selectedProduct}
                                    value={quantity}
                                    onChange={(e) => {
                                        const val = e.target.value
                                        if (val === "") onQuantityChange("")
                                        else {
                                            const num = parseInt(val, 10)
                                            if (!isNaN(num) && num > 0) onQuantityChange(Math.min(num, selectedProduct ? Number(selectedProduct.Stock) : Infinity))
                                        }
                                    }}
                                    onBlur={() => { if (quantity === "" || quantity < 1) onQuantityChange(1) }}
                                    onKeyDown={(e) => { if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault() }}
                                    className="w-10 sm:w-12 bg-transparent outline-none text-center text-base font-semibold text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:cursor-not-allowed"
                                />
                                <button
                                    type="button" disabled={!selectedProduct || (!!selectedProduct && safeQuantity >= Number(selectedProduct.Stock))}
                                    onClick={() => onQuantityChange(Math.min(safeQuantity + 1, selectedProduct ? Number(selectedProduct.Stock) : Infinity))}
                                    className={`h-full px-2.5 flex items-center justify-center transition-colors disabled:cursor-not-allowed ${selectedProduct && safeQuantity >= Number(selectedProduct.Stock) ? 'text-gray-300' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>

                        <Button
                            type="button" disabled={!selectedProduct || loadingProducts} onClick={onAddProduct}
                            className="h-11 shrink-0 bg-indigo-600 hover:bg-indigo-700 font-medium px-3 sm:px-5"
                        >
                            <ShoppingCart className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Agregar al pedido</span>
                        </Button>
                    </div>

                    {selectedProduct && (() => {
                        const unitPrice = priceType === 'contado' ? Number(selectedProduct.PUContado) : priceType === 'credito' ? Number(selectedProduct.PUCredito) : priceType === 'porMenor' ? Number(selectedProduct.PUPorMenor) : priceType === 'porMayor' ? Number(selectedProduct.PUPorMayor) : Number(priceEdit);
                        const sym = getCurrencySymbol(currency?.value);
                        return (
                            <p className="text-[11px] text-right text-gray-500 mt-1.5">
                                {sym}{unitPrice.toFixed(2)} × {safeQuantity} = <span className="font-semibold text-gray-800">{sym}{(unitPrice * safeQuantity).toFixed(2)}</span>
                            </p>
                        );
                    })()}
                </CardContent>
            </Card>

            <ClearAllDialog isOpen={showClearAllDialog} onClose={() => setShowClearAllDialog(false)} onConfirm={() => { onClearAll(); setShowClearAllDialog(false); }} />

            <EditQuantityDialog
                isOpen={editingProductIndex !== null}
                onClose={() => setEditingProductIndex(null)}
                selectedItem={editingProductIndex !== null ? selectedProducts[editingProductIndex] : null}
                editQuantity={editQuantity} setEditQuantity={setEditQuantity} onSave={handleSaveEditQuantity}
            />

            <ModalLoader open={isLoading} onOpenChange={onIsLoadingChange} caseKey={modalLoader ?? undefined} />

            {selectedProducts.length > 0 && (
                <Card className="shadow-md bg-white">
                    <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50 dark:border-gray-800">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-md">
                                <ShoppingCart className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <CardTitle className="text-lg font-semibold text-blue-700 dark:text-blue-400">Productos Seleccionados</CardTitle>
                            <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 bg-indigo-600 text-white text-xs font-bold rounded-full">
                                {selectedProducts.length}
                            </span>
                            <div className="ml-auto">
                                <Button type="button" variant="ghost" size="sm" onClick={() => setShowClearAllDialog(true)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-xs h-8">
                                    <Trash className="h-3.5 w-3.5 mr-1" />Limpiar todo
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <SelectedProductsTable
                            selectedProducts={selectedProducts} productosConLotes={productosConLotes}
                            currencyValue={currency?.value} onRemoveItem={onRemoveItem}
                            onChangeLote={onChangeLote} onEditClick={handleEditClick}
                        />
                    </CardContent>
                    <CardFooter className="flex justify-between border-t bg-gray-50 py-4 gap-2">
                        <div className="flex justify-start gap-2">
                            <Button type="button" variant="outline" onClick={onPrev}><ArrowLeft className="mr-2 h-4 w-4" />Anterior</Button>
                            <Button
                                type="button"
                                onClick={handleSaveDraft}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-medium"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Guardar Borrador
                            </Button>
                        </div>
                        <Button type="button" onClick={onNext} disabled={!isStepValid} className="bg-blue-600 hover:bg-blue-700">Siguiente<ArrowRight className="ml-2 h-4 w-4" /></Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    )
}