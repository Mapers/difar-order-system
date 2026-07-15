'use client'

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CalendarClock, Loader2, Save } from "lucide-react"
import { Comprobante } from "@/app/types/order/order-interface"
import { Sequential } from "@/app/types/config-types"
import { SerieNCField } from "./SerieNCField"
import { InstallmentModal, Cuota } from "./InstallmentModal"

interface ModificarCuotasModalProps {
    open:               boolean
    onOpenChange:       (open: boolean) => void
    comprobante:        Comprobante
    tiposComprobante:   Sequential[]
    onConfirm: (
        cuotas: { fecha: string; monto: number }[],
        observaciones: string,
        prefijo: string,
        tipoCompr: string,
        codOperacion: string
    ) => Promise<void>
}

export function ModificarCuotasModal({
                                         open, onOpenChange, comprobante, tiposComprobante, onConfirm
                                     }: ModificarCuotasModalProps) {
    const [loading,            setLoading]            = useState(false)
    const [observaciones,      setObservaciones]      = useState("")
    const [selectedSerie,      setSelectedSerie]      = useState("")
    const [cuotas,             setCuotas]             = useState<Cuota[]>([])
    const [showCuotasModal,    setShowCuotasModal]    = useState(false)

    const totalImporte = Number(comprobante.total || 0)

    useEffect(() => {
        if (!open) {
            setObservaciones("")
            setCuotas([])
            setLoading(false)
        }
    }, [open])

    const canConfirm =
        cuotas.length > 0 &&
        observaciones.trim().length >= 5 &&
        !!selectedSerie

    const handleSubmit = async () => {
        if (!canConfirm) return
        setLoading(true)
        try {
            const [prefijo, tipo] = selectedSerie.split('|')
            await onConfirm(cuotas, observaciones.trim(), prefijo, tipo, '')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CalendarClock className="h-5 w-5 text-purple-600" />
                            Modificar Cuotas — {comprobante.serie}-{comprobante.numero}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="bg-purple-50 p-3 rounded-lg text-sm space-y-1">
                            <p><strong>Cliente:</strong> {comprobante.cliente_denominacion}</p>
                            <p className="text-xs text-purple-700">
                                Solo se reprograman las fechas y montos de las cuotas.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <SerieNCField
                                comprobante={comprobante}
                                series={tiposComprobante}
                                onResolve={setSelectedSerie}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-muted-foreground">
                                Nuevas Cuotas <span className="text-red-500">*</span>
                            </Label>
                            <div className="border rounded-md p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        {cuotas.length > 0 ? (
                                            <div className="text-sm space-y-0.5">
                                                <p className="font-medium text-foreground">
                                                    {cuotas.length} cuota(s) configurada(s)
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Último vencimiento: {cuotas[cuotas.length - 1].fecha}
                                                </p>
                                                <div className="text-xs text-muted-foreground max-h-16 overflow-y-auto mt-1">
                                                    {cuotas.map((c, i) => (
                                                        <div key={i} className="flex justify-between w-48">
                                                            <span>Cuota {i + 1} ({c.fecha}):</span>
                                                            <span className="font-medium">{c.monto.toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                No hay cuotas configuradas aún
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShowCuotasModal(true)}
                                        className="shrink-0 border-purple-300 text-purple-700 hover:bg-purple-50"
                                    >
                                        <CalendarClock className="h-4 w-4 mr-1" />
                                        {cuotas.length > 0 ? 'Editar' : 'Configurar'}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold uppercase text-muted-foreground">
                                Observaciones / Sustento <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                placeholder="Ej: Reprogramación de cuotas por acuerdo con el cliente..."
                                value={observaciones}
                                onChange={e => setObservaciones(e.target.value)}
                                className="min-h-[80px] resize-none"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!canConfirm || loading}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {loading
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando...</>
                                : <><Save className="mr-2 h-4 w-4" /> Emitir NC Modificación</>
                            }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <InstallmentModal
                open={showCuotasModal}
                onOpenChange={setShowCuotasModal}
                totalImporte={totalImporte}
                initialCuotas={cuotas}
                onSave={setCuotas}
            />
        </>
    )
}