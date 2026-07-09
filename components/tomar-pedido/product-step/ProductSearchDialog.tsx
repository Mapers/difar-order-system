'use client'
import React, { useState, useRef } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Search, X, Package, Pill, AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { IProduct } from "@/app/types/order/product-interface"
import { IMoneda } from "@/app/types/order/client-interface"
import SubstituteSelectionDialog from "./SubstituteSelectionDialog"

interface ProductSearchDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    searchQuery: string
    onSearchQueryChange: (val: string) => void
    filteredProducts: IProduct[]
    onProductSelect: (product: IProduct) => void
    currency: IMoneda | null
}

const IgvBadge = ({ product }: { product: IProduct }) => {
    if (product.afecto_igv === 1) return null

    if (product.tipo_afectacion_igv === '20') {
        return (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900/50 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
                EXONERADO
            </span>
        )
    }

    if (product.tipo_afectacion_igv === '30') {
        return (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                INAFECTO
            </span>
        )
    }

    return null
}

export default function ProductSearchDialog({
                                                open, onOpenChange, searchQuery, onSearchQueryChange,
                                                filteredProducts, onProductSelect, currency
                                            }: ProductSearchDialogProps) {
    const [isSearching, setIsSearching] = useState(false)
    const searchTimerRef = useRef<NodeJS.Timeout | null>(null)

    const [substitutesModalOpen, setSubstitutesModalOpen] = useState(false)
    const [productForSubstitutes, setProductForSubstitutes] = useState<IProduct | null>(null)

    const handleOpenSubstitutes = (e: React.MouseEvent, product: IProduct) => {
        e.stopPropagation()
        setProductForSubstitutes(product)
        setSubstitutesModalOpen(true)
    }

    const handleSubstituteSelect = (substituteProduct: IProduct) => {
        setSubstitutesModalOpen(false)
        onProductSelect(substituteProduct)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="p-0 gap-0 flex flex-col [&>button]:hidden overflow-hidden fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none h-[88vh] w-full sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:w-[620px] sm:h-[75vh] sm:max-w-[95vw]">
                    <DialogTitle className="sr-only">Buscar producto</DialogTitle>

                    <div className="flex items-center gap-2 border-b border-border px-3 py-2.5 bg-background">
                        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                        <input
                            type="text"
                            autoFocus
                            placeholder="Buscar por código, nombre o laboratorio..."
                            value={searchQuery}
                            onChange={(e) => {
                                setIsSearching(true)
                                onSearchQueryChange(e.target.value)
                                if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
                                searchTimerRef.current = setTimeout(() => setIsSearching(false), 350)
                            }}
                            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder-muted-foreground h-9"
                        />
                        {searchQuery && (
                            <button type="button" onClick={() => onSearchQueryChange('')} className="text-muted-foreground hover:text-foreground">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                        <button type="button" onClick={() => onOpenChange(false)} className="text-sm text-blue-600 dark:text-blue-400 font-medium pl-2 shrink-0">
                            Cancelar
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-background">
                        {isSearching ? (
                            <div className="p-3 space-y-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex gap-3 px-3 py-2.5 rounded-lg border border-border bg-muted/50">
                                        <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                                        <div className="flex-1 space-y-1.5">
                                            <div className="flex justify-between gap-2">
                                                <Skeleton className="h-4 w-3/5 rounded" />
                                                <Skeleton className="h-5 w-16 rounded-full" />
                                            </div>
                                            <Skeleton className="h-3 w-2/5 rounded" />
                                            <div className="flex gap-4">
                                                <Skeleton className="h-3 w-20 rounded" />
                                                <Skeleton className="h-3 w-20 rounded" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="py-12 text-center">
                                <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                <p className="text-sm font-medium text-muted-foreground">
                                    {searchQuery ? 'No se encontraron productos' : 'Escribe para buscar productos'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {filteredProducts.map((product) => {
                                    const stockNum = Number(product.Stock)
                                    const isAgotado = stockNum <= 0

                                    const stockBadgeClass = isAgotado
                                        ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
                                        : stockNum <= 10
                                            ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900/50"
                                            : "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50"

                                    return (
                                        <div key={product.Codigo_Art} className="flex flex-col border-b border-border last:border-0">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onProductSelect(product)
                                                }}
                                                className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-950/20 active:bg-blue-100 transition-colors text-left ${isAgotado && !product.tieneSustitutos ? 'opacity-60' : ''}`}
                                            >
                                                <div className={`${isAgotado ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'} dark:bg-blue-900/40 p-2 rounded-lg shrink-0 mt-0.5`}>
                                                    {isAgotado ? <AlertCircle className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                                                </div>

                                                <div className="flex flex-col flex-1 min-w-0 gap-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <span className="font-semibold text-sm text-foreground line-clamp-2 flex-1 leading-tight">
                                                            {product.NombreItem}
                                                        </span>
                                                        <span className={`text-xs shrink-0 font-medium border rounded-full px-2 py-0.5 ${stockBadgeClass}`}>
                                                            Stock: {stockNum.toFixed(0)}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                                                        <span className="text-xs text-muted-foreground">
                                                            <span className="font-medium text-muted-foreground">Cód:</span> {product.Codigo_Art}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground truncate">
                                                            <span className="font-medium text-muted-foreground">Lab:</span> {product.Descripcion}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                                                        <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                                                            Contado: {currency?.value === "PEN" ? "S/." : "$"}{Number(product.PUContado).toFixed(2)}
                                                        </span>
                                                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                                                            Crédito: {currency?.value === "PEN" ? "S/." : "$"}{Number(product.PUCredito).toFixed(2)}
                                                        </span>
                                                        <IgvBadge product={product} />
                                                    </div>
                                                </div>
                                            </button>

                                            {isAgotado && product.tieneSustitutos === 1 && (
                                                <div className="px-4 pb-3 pt-1">
                                                    <button
                                                        onClick={(e) => handleOpenSubstitutes(e, product)}
                                                        className="flex w-full items-center justify-center gap-2 py-2 px-4 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                                    >
                                                        <Pill className="h-4 w-4" />
                                                        Ver Sustitutos Disponibles
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {productForSubstitutes && (
                <SubstituteSelectionDialog
                    open={substitutesModalOpen}
                    onOpenChange={setSubstitutesModalOpen}
                    codPrincipal={productForSubstitutes.Codigo_Art}
                    nombrePrincipal={productForSubstitutes.NombreItem}
                    currency={currency}
                    onProductSelect={handleSubstituteSelect}
                />
            )}
        </>
    )
}