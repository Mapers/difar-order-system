'use client'

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PenLine, Loader2, Save, AlertCircle } from "lucide-react"
import { Comprobante } from "@/app/types/order/order-interface"
import { Sequential } from "@/app/types/config-types"
import { toast } from "@/app/hooks/useToast"
import apiClient from "@/app/api/client"
import { useAuth } from "@/context/authContext"

interface ItemDescripcion {
    cod_item:           string
    descripcion_actual: string
    nueva_descripcion:  string
    cantidad:           number
    seleccionado:       boolean
}

interface CorregirDescripcionModalProps {
    open:               boolean
    onOpenChange:       (open: boolean) => void
    comprobante:        Comprobante
    tiposComprobante:   Sequential[]
    onConfirm: (
        items: { cod_item: string; nueva_descripcion: string }[],
        observaciones: string,
        prefijo: string,
        tipoCompr: string,
        codOperacion: string
    ) => Promise<void>
}

export function CorregirDescripcionModal({
                                             open, onOpenChange, comprobante, tiposComprobante, onConfirm
                                         }: CorregirDescripcionModalProps) {
    const auth = useAuth()

    const [loading,       setLoading]       = useState(false)
    const [loadingItems,  setLoadingItems]  = useState(false)
    const [items,         setItems]         = useState<ItemDescripcion[]>([])
    const [observaciones, setObservaciones] = useState("")
    const [selectedSerie, setSelectedSerie] = useState("")

    const seriesNC = tiposComprobante.filter(t => t.tipo === '07' || t.tipo === '7')

    useEffect(() => {
        if (!open) {
            setItems([])
            setObservaciones("")
            setLoading(false)
            return
        }

        const fetchDetalles = async () => {
            setLoadingItems(true)
            try {
                // Mismo endpoint que ComprobantesDetailPage
                let url = `/pedidosDetalles/${comprobante.nroPedido}/detalles`
                if (auth.user?.idRol === 1) url += `?vendedor=${auth.user?.codigo}`

                const res = await apiClient.get(url)
                const detalles = res.data?.data || []

                setItems(detalles.map((d: any) => ({
                    cod_item:           d.codigoitemPedido,   // campo correcto de PedidoDet
                    descripcion_actual: d.productoNombre,     // campo correcto de PedidoDet
                    nueva_descripcion:  d.productoNombre,
                    cantidad:           Number(d.cantPedido),
                    seleccionado:       false
                })))
            } catch {
                toast({ title: "Error", description: "No se pudieron cargar los ítems", variant: "destructive" })
            } finally {
                setLoadingItems(false)
            }
        }

        fetchDetalles()

        if (seriesNC.length > 0) {
            setSelectedSerie(`${seriesNC[0].prefijo}|${seriesNC[0].tipo}`)
        }
    }, [open])

    const toggleItem = (index: number) => {
        setItems(prev => prev.map((item, i) =>
            i === index ? { ...item, seleccionado: !item.seleccionado } : item
        ))
    }

    const updateDescripcion = (index: number, value: string) => {
        setItems(prev => prev.map((item, i) =>
            i === index ? { ...item, nueva_descripcion: value } : item
        ))
    }

    const itemsSeleccionados = items.filter(i => i.seleccionado)

    const canConfirm =
        itemsSeleccionados.length > 0 &&
        itemsSeleccionados.every(i => i.nueva_descripcion.trim().length > 0) &&
        observaciones.trim().length >= 5 &&
        !!selectedSerie

    const handleSubmit = async () => {
        if (!canConfirm) return
        setLoading(true)
        try {
            const [prefijo, tipo] = selectedSerie.split('|')
            await onConfirm(
                itemsSeleccionados.map(i => ({
                    cod_item:          i.cod_item,
                    nueva_descripcion: i.nueva_descripcion.trim()
                })),
                observaciones.trim(),
                prefijo,
                tipo,
                ''
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <PenLine className="h-5 w-5 text-blue-600" />
                        Corrección de Descripción — {comprobante.serie}-{comprobante.numero}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="bg-blue-50 p-3 rounded-lg text-sm space-y-1">
                        <p><strong>Cliente:</strong> {comprobante.cliente_denominacion}</p>
                        <p>
                            <strong>Total:</strong>{' '}
                            {comprobante.moneda === 1 ? 'S/' : '$'} {Number(comprobante.total).toFixed(2)}
                        </p>
                        <div className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mt-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            <span className="text-xs">
                                Plazo: hasta el 15° día hábil del mes siguiente a la emisión
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold uppercase text-gray-500">
                                Serie NC <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedSerie} onValueChange={setSelectedSerie}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Seleccionar serie" />
                                </SelectTrigger>
                                <SelectContent>
                                    {seriesNC.map(t => (
                                        <SelectItem key={t.prefijo} value={`${t.prefijo}|${t.tipo}`}>
                                            {t.prefijo} - {t.nombre || 'Nota de Crédito'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase text-gray-500">
                            Seleccioná los ítems a corregir <span className="text-red-500">*</span>
                        </Label>

                        {loadingItems ? (
                            <div className="flex justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            </div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-4 text-gray-500 text-sm border rounded-md">
                                No se encontraron ítems
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-56 overflow-y-auto border rounded-md p-2">
                                {items.map((item, index) => (
                                    <div
                                        key={item.cod_item}
                                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                                            item.seleccionado
                                                ? 'border-blue-400 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                        onClick={() => toggleItem(index)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                checked={item.seleccionado}
                                                onChange={() => toggleItem(index)}
                                                onClick={e => e.stopPropagation()}
                                                className="mt-1 shrink-0 cursor-pointer"
                                            />
                                            <div
                                                className="flex-1 space-y-2"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <div>
                                                    <p className="text-xs text-gray-500">
                                                        Cód: {item.cod_item} · Cant: {item.cantidad}
                                                    </p>
                                                    <p className="text-sm font-medium text-gray-800">
                                                        {item.descripcion_actual}
                                                    </p>
                                                </div>

                                                {item.seleccionado && (
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-blue-600 font-medium">
                                                            Nueva descripción:
                                                        </Label>
                                                        <Input
                                                            value={item.nueva_descripcion}
                                                            onChange={e => updateDescripcion(index, e.target.value)}
                                                            placeholder="Escribí la descripción corregida..."
                                                            className="text-sm"
                                                            autoFocus
                                                        />
                                                        {item.nueva_descripcion.trim().length === 0 && (
                                                            <p className="text-xs text-red-500">
                                                                La descripción no puede estar vacía
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {itemsSeleccionados.length > 0 && (
                            <p className="text-xs text-blue-600">
                                {itemsSeleccionados.length} ítem(s) seleccionado(s) para corregir
                            </p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-semibold uppercase text-gray-500">
                            Observaciones / Sustento <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            placeholder="Ej: Corrección de descripción por error en el nombre del producto..."
                            value={observaciones}
                            onChange={e => setObservaciones(e.target.value)}
                            className="min-h-[80px] resize-none"
                        />
                        {observaciones.trim().length > 0 && observaciones.trim().length < 5 && (
                            <p className="text-xs text-red-500">Mínimo 5 caracteres</p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!canConfirm || loading}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {loading
                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando...</>
                            : <><Save className="mr-2 h-4 w-4" /> Emitir NC Corrección</>
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}