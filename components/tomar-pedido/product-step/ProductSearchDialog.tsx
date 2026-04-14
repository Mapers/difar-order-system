'use client'
import React, { useState, useRef } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Search, X, Package } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { IProduct } from "@/app/types/order/product-interface"
import { IMoneda } from "@/app/types/order/client-interface"

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 gap-0 flex flex-col [&>button]:hidden overflow-hidden fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none h-[88vh] w-full sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:w-[620px] sm:h-[75vh] sm:max-w-[95vw]">
                <DialogTitle className="sr-only">Buscar producto</DialogTitle>

                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 px-3 py-2.5 bg-white dark:bg-gray-900">
                    <Search className="h-4 w-4 text-gray-400 shrink-0" />
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
                        className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 h-9"
                    />
                    {searchQuery && (
                        <button type="button" onClick={() => onSearchQueryChange('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    <button type="button" onClick={() => onOpenChange(false)} className="text-sm text-blue-600 dark:text-blue-400 font-medium pl-2 shrink-0">
                        Cancelar
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
                    {isSearching ? (
                        <div className="p-3 space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex gap-3 px-3 py-2.5 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
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
                            <Search className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {searchQuery ? 'No se encontraron productos' : 'Escribe para buscar productos'}
                            </p>
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
                                        onClick={() => onProductSelect(product)}
                                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-950/20 active:bg-blue-100 transition-colors text-left"
                                    >
                                        <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg shrink-0 mt-0.5">
                                            <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                                )
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}