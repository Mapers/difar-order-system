'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Loader2, Check, Pencil } from "lucide-react"
import apiClient from "@/app/api/client"
import { toast } from "@/app/hooks/useToast"
import { MayorItem } from "@/app/types/amortizacion-types"

interface Props {
    open: boolean
    onClose: () => void
    item: MayorItem | null
    onSaved: () => void
}

export default function ModalEditarMayor({ open, onClose, item, onSaved }: Props) {
    const [saving, setSaving] = useState(false)

    const [fecha, setFecha] = useState("")
    const [ctaContable, setCtaContable] = useState("")
    const [concepto, setConcepto] = useState("")
    const [cargo, setCargo] = useState("")
    const [abono, setAbono] = useState("")
    const [cargoME, setCargoME] = useState("")
    const [abonoME, setAbonoME] = useState("")
    const [observaciones, setObservaciones] = useState("")

    useEffect(() => {
        if (item) {
            setFecha(item.Fecha ? item.Fecha.slice(0, 10) : "")
            setCtaContable(item.CtaContable || "")
            setConcepto(item.Concepto || "")
            setCargo(String(item.Cargo || "0"))
            setAbono(String(item.Abono || "0"))
            setCargoME(String(item.CargoME || "0"))
            setAbonoME(String(item.AbonoME || "0"))
            setObservaciones(item.Observaciones || "")
        }
    }, [item])

    const handleGuardar = async () => {
        if (!item) return
        setSaving(true)
        try {
            await apiClient.put(`/amortizacion/mayor/${item.IdLibroMayor}`, {
                fecha: fecha,
                cta_contable: ctaContable,
                concepto: concepto,
                cargo: parseFloat(cargo) || 0,
                abono: parseFloat(abono) || 0,
                cargo_me: parseFloat(cargoME) || 0,
                abono_me: parseFloat(abonoME) || 0,
                observaciones: observaciones,
            })
            toast({ title: "Libro Mayor", description: "Asiento actualizado correctamente." })
            onSaved()
        } catch {
            toast({ title: "Error", description: "No se pudo actualizar el asiento.", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
            <DialogContent className="max-w-[500px] p-0 gap-0">
                <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                            <Pencil className="h-4 w-4" />
                        </div>
                        <div>
                            <DialogTitle className="text-[15px]">Editar Asiento — Libro Mayor</DialogTitle>
                            <DialogDescription className="text-xs text-slate-400 mt-0.5">
                                {item ? `Cuenta ${item.CtaContable} — ${item.SerieDoc}-${item.NroDoc}` : 'Asiento seleccionado'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-5 space-y-4">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                        Datos del asiento contable
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">Fecha <span className="text-red-500">*</span></Label>
                            <Input type="date" className="h-8 text-xs" value={fecha} onChange={e => setFecha(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">N° Cuenta <span className="text-red-500">*</span></Label>
                            <Input className="h-8 text-xs font-mono" value={ctaContable} onChange={e => setCtaContable(e.target.value)} placeholder="Ej: 12100001" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <Label className="text-[11px]">Concepto <span className="text-red-500">*</span></Label>
                        <Input className="h-8 text-xs" value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Descripción del asiento" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">Cargo MN (S/)</Label>
                            <Input type="number" step="0.01" min="0" className="h-8 text-xs" value={cargo} onChange={e => setCargo(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">Abono MN (S/)</Label>
                            <Input type="number" step="0.01" min="0" className="h-8 text-xs" value={abono} onChange={e => setAbono(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">Cargo ME ($)</Label>
                            <Input type="number" step="0.01" min="0" className="h-8 text-xs" value={cargoME} onChange={e => setCargoME(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">Abono ME ($)</Label>
                            <Input type="number" step="0.01" min="0" className="h-8 text-xs" value={abonoME} onChange={e => setAbonoME(e.target.value)} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <Label className="text-[11px]">Observaciones</Label>
                        <Input className="h-8 text-xs" value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Observaciones..." />
                    </div>
                </div>

                <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between rounded-b-lg">
                    <span className="text-xs text-slate-400">
                        {item ? `ID: ${item.IdLibroMayor}` : ''}
                    </span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={onClose}>Cancelar</Button>
                        <Button size="sm" className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 gap-1" onClick={handleGuardar} disabled={saving}>
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                            Guardar cambios
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}