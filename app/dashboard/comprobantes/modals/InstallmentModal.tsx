"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, CalendarClock, AlertCircle } from "lucide-react"
import { format, addDays } from "date-fns"

export interface Cuota {
    fecha: string
    monto: number
}

interface InstallmentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    totalImporte: number
    initialCuotas: Cuota[]
    onSave: (cuotas: Cuota[]) => void
}

export function InstallmentModal({ open, onOpenChange, totalImporte, initialCuotas, onSave }: InstallmentModalProps) {
    const [cuotas, setCuotas] = useState<Cuota[]>([])
    const [numCuotasGen, setNumCuotasGen] = useState(1)

    useEffect(() => {
        if (open) {
            if (initialCuotas.length > 0) {
                setCuotas(initialCuotas)
            } else {
                setCuotas([{ fecha: format(addDays(new Date(), 30), 'yyyy-MM-dd'), monto: totalImporte }])
            }
        }
    }, [open, totalImporte, initialCuotas])

    const handleGenerarCuotas = () => {
        const montoPorCuota = Number((totalImporte / numCuotasGen).toFixed(2))
        const nuevasCuotas: Cuota[] = []
        let sumaAcumulada = 0

        for (let i = 0; i < numCuotasGen; i++) {
            const monto = (i === numCuotasGen - 1)
                ? Number((totalImporte - sumaAcumulada).toFixed(2))
                : montoPorCuota

            sumaAcumulada += monto

            nuevasCuotas.push({
                fecha: format(addDays(new Date(), (i + 1) * 30), 'yyyy-MM-dd'),
                monto: monto
            })
        }
        setCuotas(nuevasCuotas)
    }

    const updateCuota = (index: number, field: keyof Cuota, value: string | number) => {
        const nuevas = [...cuotas]
        nuevas[index] = { ...nuevas[index], [field]: value }
        setCuotas(nuevas)
    }

    const removeCuota = (index: number) => {
        setCuotas(cuotas.filter((_, i) => i !== index))
    }

    const addCuotaManual = () => {
        setCuotas([...cuotas, { fecha: format(new Date(), 'yyyy-MM-dd'), monto: 0 }])
    }

    const totalCuotas = cuotas.reduce((sum, c) => sum + Number(c.monto), 0)
    const diferencia = totalImporte - totalCuotas
    const esValido = Math.abs(diferencia) < 0.1

    const handleConfirmar = () => {
        if (!esValido) return
        onSave(cuotas)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarClock className="h-5 w-5" /> Configurar Cuotas
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="flex items-end gap-2 p-3 bg-gray-50 rounded-md border">
                        <div className="space-y-1 flex-1">
                            <Label className="text-xs">Cantidad de Cuotas</Label>
                            <Input
                                type="number"
                                min={1}
                                max={60}
                                value={numCuotasGen}
                                onChange={(e) => setNumCuotasGen(Number(e.target.value))}
                            />
                        </div>
                        <Button onClick={handleGenerarCuotas} variant="secondary">Generar</Button>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 mb-1">
                            <div className="col-span-1 text-center">#</div>
                            <div className="col-span-5">Fecha Vencimiento</div>
                            <div className="col-span-5">Importe</div>
                            <div className="col-span-1"></div>
                        </div>
                        {cuotas.map((cuota, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-1 text-center font-bold text-sm bg-gray-100 rounded h-8 flex items-center justify-center">
                                    {index + 1}
                                </div>
                                <div className="col-span-5">
                                    <Input
                                        type="date"
                                        value={cuota.fecha}
                                        onChange={(e) => updateCuota(index, 'fecha', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-5">
                                    <Input
                                        type="number"
                                        value={cuota.monto}
                                        onChange={(e) => updateCuota(index, 'monto', Number(e.target.value))}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Button variant="ghost" size="icon" onClick={() => removeCuota(index)} className="h-8 w-8 text-red-500 hover:bg-red-50">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button onClick={addCuotaManual} variant="outline" size="sm" className="w-full border-dashed">
                        <Plus className="h-4 w-4 mr-2" /> Agregar Cuota Manual
                    </Button>

                    <div className={`p-3 rounded-md border flex justify-between items-center ${esValido ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <span className="text-sm font-medium">Total Pedido: <strong>{totalImporte.toFixed(2)}</strong></span>
                        <div className="text-right">
                            <span className={`text-sm font-bold block ${esValido ? 'text-green-700' : 'text-red-700'}`}>
                                Total Cuotas: {totalCuotas.toFixed(2)}
                            </span>
                            {!esValido && <span className="text-xs text-red-600">Diferencia: {diferencia.toFixed(2)}</span>}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleConfirmar} disabled={!esValido}>Guardar Cuotas</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}