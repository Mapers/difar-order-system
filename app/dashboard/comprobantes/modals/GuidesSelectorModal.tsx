'use client'

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Truck, AlertCircle } from "lucide-react"
import { format, parseISO } from "date-fns"
import apiClient from "@/app/api/client"
import { toast } from "@/components/ui/use-toast"
import {GuiaReferencia} from "@/interface/order/order-interface";

interface GuidesSelectorModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    nroPedido: string
    selectedGuides: GuiaReferencia[]
    onConfirmSelection: (guias: GuiaReferencia[]) => void
}

export function GuidesSelectorModal({
                                        open,
                                        onOpenChange,
                                        nroPedido,
                                        selectedGuides,
                                        onConfirmSelection
                                    }: GuidesSelectorModalProps) {
    const [loading, setLoading] = useState(false)
    const [guiasDisponibles, setGuiasDisponibles] = useState<GuiaReferencia[]>([])
    const [tempSelected, setTempSelected] = useState<GuiaReferencia[]>([])

    useEffect(() => {
        if (open && nroPedido) {
            fetchGuiasRelacionadas()
            setTempSelected(selectedGuides)
        }
    }, [open, nroPedido])

    const fetchGuiasRelacionadas = async () => {
        setLoading(true)
        try {
            const response = await apiClient.get(`/pedidos/guiasRelacionadas?nroPedido=${nroPedido}`)
            const data = response.data.data.data || []
            setGuiasDisponibles(data)
        } catch (error) {
            console.error("Error cargando guías:", error)
            toast({
                title: "Error",
                description: "No se pudieron cargar las guías relacionadas.",
                variant: "destructive"
            })
            setGuiasDisponibles([])
        } finally {
            setLoading(false)
        }
    }

    const toggleGuide = (guia: GuiaReferencia) => {
        setTempSelected(prev => {
            const exists = prev.find(g => g.idGuiaRemCab === guia.idGuiaRemCab)
            if (exists) {
                return prev.filter(g => g.idGuiaRemCab !== guia.idGuiaRemCab)
            } else {
                return [...prev, guia]
            }
        })
    }

    const handleConfirm = () => {
        onConfirmSelection(tempSelected)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-blue-600" />
                        Seleccionar Guías de Remisión
                    </DialogTitle>
                    <DialogDescription>
                        Seleccione las guías asociadas al pedido <strong>{nroPedido}</strong> para referenciarlas en la factura.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        </div>
                    ) : guiasDisponibles.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                            <AlertCircle className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                            <p>No se encontraron guías emitidas para este pedido.</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {guiasDisponibles.map((guia) => {
                                const isSelected = tempSelected.some(g => g.idGuiaRemCab === guia.idGuiaRemCab)
                                return (
                                    <div
                                        key={guia.idGuiaRemCab}
                                        className={`flex items-start space-x-3 border p-3 rounded-md transition-colors ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                                    >
                                        <Checkbox
                                            id={`guia-${guia.idGuiaRemCab}`}
                                            checked={isSelected}
                                            onCheckedChange={() => toggleGuide(guia)}
                                        />
                                        <div className="grid gap-1.5 leading-none w-full">
                                            <label
                                                htmlFor={`guia-${guia.idGuiaRemCab}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex justify-between"
                                            >
                                                <span>{guia.serie}-{guia.numero}</span>
                                                <span className="text-gray-500 font-normal">{format(parseISO(guia.fecha_emision), "dd/MM/yyyy")}</span>
                                            </label>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleConfirm} disabled={loading}>
                        Confirmar Selección ({tempSelected.length})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}