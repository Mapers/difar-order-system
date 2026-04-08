'use client'
import React from "react"
import { Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { IProduct } from "@/app/types/order/product-interface"
import { IMoneda } from "@/app/types/order/client-interface"
import { PriceType } from "@/app/types/order/order-interface"

interface PriceSelectorProps {
    selectedProduct: IProduct
    priceType: PriceType
    onPriceTypeChange: (pt: PriceType) => void
    priceEdit: any
    onPriceEditChange: (val: any) => void
    onPriceEditBlur: (e: React.FocusEvent<HTMLInputElement>) => void
    currency: IMoneda | null
}

export default function PriceSelector({
                                          selectedProduct, priceType, onPriceTypeChange,
                                          priceEdit, onPriceEditChange, onPriceEditBlur, currency
                                      }: PriceSelectorProps) {
    const sym = currency?.value === "PEN" ? "S/." : "$"

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-3 [&>*]:min-w-0">
            <button type="button" onClick={() => onPriceTypeChange('contado')} className={`relative rounded-xl p-2 sm:p-3 text-center transition-all border-2 ${priceType === 'contado' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'}`}>
                {priceType === 'contado' && <Check className="absolute top-1 right-1 h-3 w-3 text-blue-600 dark:text-blue-400" />}
                <div className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Contado</div>
                <div className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300">{sym}{Number(selectedProduct.PUContado).toFixed(2)}</div>
            </button>

            <button type="button" onClick={() => onPriceTypeChange('credito')} className={`relative rounded-xl p-2 sm:p-3 text-center transition-all border-2 ${priceType === 'credito' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'}`}>
                {priceType === 'credito' && <Check className="absolute top-1 right-1 h-3 w-3 text-blue-600 dark:text-blue-400" />}
                <div className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Crédito</div>
                <div className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300">{sym}{Number(selectedProduct.PUCredito).toFixed(2)}</div>
            </button>

            {Number(selectedProduct.PUPorMayor) > 0 && (
                <button type="button" onClick={() => onPriceTypeChange('porMayor')} className={`relative rounded-xl p-2 sm:p-3 text-center transition-all border-2 ${priceType === 'porMayor' ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 shadow-sm' : 'border-violet-200 dark:border-violet-800 bg-violet-50/50'}`}>
                    {priceType === 'porMayor' && <Check className="absolute top-1 right-1 h-3 w-3 text-violet-600 dark:text-violet-400" />}
                    <div className="text-[10px] sm:text-xs font-medium text-violet-600 dark:text-violet-400 mb-0.5">Bonif. Cont.</div>
                    <div className="text-xs sm:text-sm font-bold text-violet-700 dark:text-violet-300">{sym}{Number(selectedProduct.PUPorMayor).toFixed(2)}</div>
                </button>
            )}

            {Number(selectedProduct.PUPorMenor) > 0 && (
                <button type="button" onClick={() => onPriceTypeChange('porMenor')} className={`relative rounded-xl p-2 sm:p-3 text-center transition-all border-2 ${priceType === 'porMenor' ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-sm' : 'border-green-200 dark:border-green-800 bg-green-50/50'}`}>
                    {priceType === 'porMenor' && <Check className="absolute top-1 right-1 h-3 w-3 text-green-600 dark:text-green-400" />}
                    <div className="text-[10px] sm:text-xs font-medium text-green-600 dark:text-green-400 mb-0.5">Bonif. Cred.</div>
                    <div className="text-xs sm:text-sm font-bold text-green-700 dark:text-green-300">{sym}{Number(selectedProduct.PUPorMenor).toFixed(2)}</div>
                </button>
            )}

            <button type="button" onClick={() => onPriceTypeChange('custom')} className={`relative rounded-xl p-2 sm:p-3 text-center transition-all border-2 ${priceType === 'custom' ? 'border-red-500 bg-red-50 dark:bg-red-900/30 shadow-sm' : 'border-red-200 dark:border-red-800 bg-red-50/50'}`}>
                {priceType === 'custom' && <Check className="absolute top-1 right-1 h-3 w-3 text-red-600 dark:text-red-400" />}
                <div className="text-[10px] sm:text-xs font-medium text-red-600 dark:text-red-400 mb-0.5">Personalizado</div>
                <div className="flex items-center justify-center gap-0.5">
                    <span className="text-[10px] sm:text-xs text-red-700">{sym}</span>
                    <Input
                        type="text" value={priceEdit === 0 ? '' : priceEdit}
                        onChange={(e) => {
                            let value = e.target.value.replace(/[^\d.]/g, '')
                            const parts = value.split('.')
                            if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('')
                            if (parts.length === 2 && parts[1].length > 2) value = parts[0] + '.' + parts[1].substring(0, 2)
                            onPriceEditChange(value === '' ? 0 : value)
                        }}
                        onBlur={onPriceEditBlur} onClick={(e) => e.stopPropagation()}
                        className="h-6 sm:h-7 w-14 sm:w-16 text-center text-xs font-bold text-red-700 bg-white border-red-200 p-1"
                        placeholder="0.00"
                    />
                </div>
            </button>
        </div>
    )
}