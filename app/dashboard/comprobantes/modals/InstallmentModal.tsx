"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, CalendarClock } from "lucide-react"
import { format, addDays } from "date-fns"

export interface Cuota {
    fecha: string
    monto: number
}

interface CuotaInput {
    fecha:       string
    montoInput:  string
    monto:       number
}

interface InstallmentModalProps {
    open:          boolean
    onOpenChange:  (open: boolean) => void
    totalImporte:  number
    initialCuotas: Cuota[]
    onSave:        (cuotas: Cuota[]) => void
}

export function InstallmentModal({
                                     open, onOpenChange, totalImporte, initialCuotas, onSave
                                 }: InstallmentModalProps) {
    const [cuotas,       setCuotas]       = useState<CuotaInput[]>([])
    const [numCuotasGen, setNumCuotasGen] = useState(1)
    const [numInput,     setNumInput]     = useState("1")

    useEffect(() => {
        if (!open) return
        if (initialCuotas.length > 0) {
            setCuotas(initialCuotas.map(c => ({
                fecha:      c.fecha,
                montoInput: String(c.monto),
                monto:      c.monto
            })))
        } else {
            setCuotas([{
                fecha:      format(addDays(new Date(), 30), 'yyyy-MM-dd'),
                montoInput: String(totalImporte),
                monto:      totalImporte
            }])
        }
    }, [open, totalImporte, initialCuotas])

    const handleGenerarCuotas = () => {
        const n = numCuotasGen
        if (n <= 0) return

        const montoPorCuota = Number((totalImporte / n).toFixed(2))
        const nuevas: CuotaInput[] = []
        let acumulado = 0

        for (let i = 0; i < n; i++) {
            const monto = i === n - 1
                ? Number((totalImporte - acumulado).toFixed(2))
                : montoPorCuota
            acumulado += monto
            nuevas.push({
                fecha:      format(addDays(new Date(), (i + 1) * 30), 'yyyy-MM-dd'),
                montoInput: String(monto),
                monto
            })
        }
        setCuotas(nuevas)
    }

    const updateFecha = (index: number, value: string) => {
        setCuotas(prev => prev.map((c, i) =>
            i === index ? { ...c, fecha: value } : c
        ))
    }

    const updateMontoInput = (index: number, value: string) => {
        if (value !== '' && !/^\d*\.?\d*$/.test(value)) return

        const parsed = parseFloat(value)
        const monto  = isNaN(parsed) ? 0 : parsed

        setCuotas(prev => prev.map((c, i) =>
            i === index ? { ...c, montoInput: value, monto } : c
        ))
    }

    const handleMontoBlur = (index: number) => {
        setCuotas(prev => prev.map((c, i) =>
            i === index
                ? { ...c, montoInput: c.monto === 0 ? '' : String(c.monto) }
                : c
        ))
    }

    const removeCuota = (index: number) => {
        setCuotas(prev => prev.filter((_, i) => i !== index))
    }

    const addCuotaManual = () => {
        setCuotas(prev => [...prev, {
            fecha:      format(addDays(new Date(), 30), 'yyyy-MM-dd'),
            montoInput: '',
            monto:      0
        }])
    }

    const totalCuotas = cuotas.reduce((sum, c) => sum + c.monto, 0)
    const diferencia  = Number((totalImporte - totalCuotas).toFixed(2))
    const esValido    = Math.abs(diferencia) < 0.01
        && cuotas.length > 0
        && cuotas.every(c => c.monto > 0 && c.fecha)

    const handleConfirmar = () => {
        if (!esValido) return
        onSave(cuotas.map(c => ({ fecha: c.fecha, monto: c.monto })))
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
                    <div className="flex items-end gap-2 p-3 bg-muted rounded-md border">
                        <div className="space-y-1 flex-1">
                            <Label className="text-xs">Cantidad de Cuotas</Label>
                            <Input
                                type="text"
                                inputMode="numeric"
                                value={numInput}
                                onChange={e => {
                                    const val = e.target.value
                                    if (val === '' || /^\d+$/.test(val)) {
                                        setNumInput(val)
                                        const n = parseInt(val)
                                        if (!isNaN(n) && n > 0) setNumCuotasGen(n)
                                    }
                                }}
                                onBlur={() => {
                                    if (!numInput || parseInt(numInput) < 1) {
                                        setNumInput('1')
                                        setNumCuotasGen(1)
                                    }
                                }}
                            />
                        </div>
                        <Button onClick={handleGenerarCuotas} variant="secondary">
                            Generar
                        </Button>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground mb-1">
                            <div className="col-span-1 text-center">#</div>
                            <div className="col-span-5">Fecha Vencimiento</div>
                            <div className="col-span-5">Importe</div>
                            <div className="col-span-1" />
                        </div>

                        {cuotas.map((cuota, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-1 text-center font-bold text-sm bg-muted rounded h-8 flex items-center justify-center">
                                    {index + 1}
                                </div>
                                <div className="col-span-5">
                                    <Input
                                        type="date"
                                        value={cuota.fecha}
                                        onChange={e => updateFecha(index, e.target.value)}
                                    />
                                </div>
                                <div className="col-span-5">
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={cuota.montoInput}
                                        placeholder="0.00"
                                        onChange={e => updateMontoInput(index, e.target.value)}
                                        onBlur={() => handleMontoBlur(index)}
                                        className={cuota.monto <= 0 ? 'border-red-300 focus-visible:ring-red-400' : ''}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeCuota(index)}
                                        className="h-8 w-8 text-red-500 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {cuotas.length === 0 && (
                            <p className="text-center text-sm text-muted-foreground py-4">
                                No hay cuotas. Generá o agregá una manualmente.
                            </p>
                        )}
                    </div>

                    <Button
                        onClick={addCuotaManual}
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed"
                    >
                        <Plus className="h-4 w-4 mr-2" /> Agregar Cuota Manual
                    </Button>

                    <div className={`p-3 rounded-md border flex justify-between items-center ${
                        esValido ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                        <span className="text-sm font-medium">
                            Total: <strong>S/ {totalImporte.toFixed(2)}</strong>
                        </span>
                        <div className="text-right">
                            <span className={`text-sm font-bold block ${esValido ? 'text-green-700' : 'text-red-700'}`}>
                                Cuotas: S/ {totalCuotas.toFixed(2)}
                            </span>
                            {!esValido && diferencia !== 0 && (
                                <span className="text-xs text-red-600">
                                    {diferencia > 0 ? `Falta: ${diferencia.toFixed(2)}` : `Excede: ${Math.abs(diferencia).toFixed(2)}`}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirmar} disabled={!esValido}>
                        Guardar Cuotas
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}