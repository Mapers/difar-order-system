'use client'
import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Pill, Package, ArrowLeft, Loader2 } from "lucide-react"
import { IProduct } from "@/app/types/order/product-interface"
import { IMoneda } from "@/app/types/order/client-interface"
import apiClient from "@/app/api/client"
import { Badge } from "@/components/ui/badge"

interface SubstituteSelectionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    codPrincipal: string
    nombrePrincipal: string
    onProductSelect: (product: IProduct) => void
    currency: IMoneda | null
}

export default function SubstituteSelectionDialog({
                                                      open, onOpenChange, codPrincipal, nombrePrincipal, onProductSelect, currency
                                                  }: SubstituteSelectionDialogProps) {

    const [loading, setLoading] = useState(false)
    const [sustitutos, setSustitutos] = useState<any[]>([])

    useEffect(() => {
        if (open && codPrincipal) {
            fetchSustitutos()
        }
    }, [open, codPrincipal])

    const fetchSustitutos = async () => {
        setLoading(true)
        try {
            // Asegúrate de que esta ruta coincida con la que definiste en tu router de Node.js
            // Ej: router.get('/buscar', sustitutosController.getSustitutosByProduct);
            const response = await apiClient.get(`/sustitutos/buscar?cod_principal=${codPrincipal}`)
            const data = response.data.data

            // Como tu SP devuelve directamente los registros, 'data' es el array
            if (Array.isArray(data) && data.length > 0) {
                setSustitutos(data)
            } else {
                setSustitutos([])
            }
        } catch (error) {
            console.error("Error al cargar sustitutos", error)
            setSustitutos([])
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 gap-0 flex flex-col [&>button]:hidden overflow-hidden fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none h-[88vh] w-full sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:w-[620px] sm:h-[75vh] sm:max-w-[95vw] shadow-2xl z-[60]">
                <DialogTitle className="sr-only">Sustitutos disponibles</DialogTitle>

                {/* Cabecera Especial */}
                <div className="border-b border-indigo-100 dark:border-gray-700 bg-indigo-50 dark:bg-gray-900 px-4 py-3 flex items-center justify-between">
                    <button onClick={() => onOpenChange(false)} className="text-indigo-600 dark:text-indigo-400 p-1 hover:bg-indigo-100 rounded-full transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="text-center flex-1 px-2">
                        <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-0.5">Alternativas para</div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-1">{nombrePrincipal}</div>
                    </div>
                    <div className="w-7"></div> {/* Spacer para centrar texto */}
                </div>

                <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
                            <p className="text-sm text-gray-500">Buscando alternativas disponibles...</p>
                        </div>
                    ) : sustitutos.length === 0 ? (
                        <div className="py-16 text-center px-4">
                            <Pill className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                                No hay alternativas disponibles
                            </p>
                            <p className="text-xs text-gray-500">
                                No se encontraron sustitutos con stock o matriculados para este producto.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800 pb-6">
                            {sustitutos.map((sub) => {
                                const stockNum = Number(sub.Stock)

                                // Adaptamos el objeto devuelto por tu SP a IProduct para el componente padre
                                // Tu SP devuelve "presentacion" en minúscula y "principioActivo", los mapeamos.
                                const productAdapted: IProduct = {
                                    ...sub,
                                    Presentacion: sub.presentacion,
                                    Laboratorio: sub.Descripcion,
                                    PrincipioActivo: sub.principioActivo,
                                }

                                const stockBadgeClass = stockNum <= 0
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : stockNum <= 10
                                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                        : "bg-green-50 text-green-700 border-green-200"

                                return (
                                    <button
                                        key={sub.Codigo_Art}
                                        type="button"
                                        disabled={stockNum <= 0}
                                        onClick={() => onProductSelect(productAdapted)}
                                        className={`w-full flex items-start gap-3 px-4 py-4 hover:bg-indigo-50/50 transition-colors text-left ${stockNum <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
                                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 rounded text-[10px] px-1.5 py-0 border-none shadow-none">
                                                Pri: {sub.prioridad}
                                            </Badge>
                                            <div className="bg-gray-100 p-2 rounded-lg mt-1">
                                                <Package className="h-4 w-4 text-gray-500" />
                                            </div>
                                        </div>

                                        <div className="flex flex-col flex-1 min-w-0 gap-1.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="font-semibold text-sm text-gray-900 line-clamp-2 flex-1 leading-tight">
                                                    {sub.NombreItem}
                                                </span>
                                                <span className={`text-[11px] shrink-0 font-bold border rounded-full px-2 py-0.5 ${stockBadgeClass}`}>
                                                    Stk: {stockNum.toFixed(0)}
                                                </span>
                                            </div>

                                            <div className="text-xs text-gray-500 leading-tight">
                                                <span className="font-semibold text-gray-700">{sub.Descripcion || 'SIN LAB'}</span>
                                                {sub.principioActivo && ` — ${sub.principioActivo}`}
                                            </div>

                                            <div className="text-xs text-gray-500">
                                                Pres: <span className="text-gray-700">{sub.presentacion}</span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 bg-gray-50 p-1.5 rounded-md border border-gray-100 w-fit">
                                                <span className="text-xs font-semibold text-green-700">
                                                    Con: {currency?.value === "PEN" ? "S/." : "$"}{Number(sub.PUContado).toFixed(2)}
                                                </span>
                                                <span className="text-xs font-semibold text-blue-700 border-l border-gray-200 pl-3">
                                                    Cré: {currency?.value === "PEN" ? "S/." : "$"}{Number(sub.PUCredito).toFixed(2)}
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
    )
}