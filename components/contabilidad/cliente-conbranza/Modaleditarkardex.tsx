'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Loader2, Check, Pencil } from "lucide-react"
import apiClient from "@/app/api/client"
import { toast } from "@/app/hooks/useToast"
import { KardexItem, TipoDocumento } from "@/app/types/amortizacion-types"

interface Props {
    open: boolean
    onClose: () => void
    item: KardexItem | null
    onSaved: () => void
}

export default function ModalEditarKardex({ open, onClose, item, onSaved }: Props) {
    const [saving, setSaving] = useState(false)

    const [tiposDoc, setTiposDoc] = useState<TipoDocumento[]>([])

    const [fechaEmision, setFechaEmision] = useState("")
    const [fechaVcto, setFechaVcto] = useState("")
    const [tipoDoc, setTipoDoc] = useState("")
    const [serieDoc, setSerieDoc] = useState("")
    const [numeroDoc, setNumeroDoc] = useState("")
    const [provision, setProvision] = useState("")
    const [amortizacion, setAmortizacion] = useState("")
    const [observaciones, setObservaciones] = useState("")

    useEffect(() => {
        const fetchTiposDoc = async () => {
            try {
                const res = await apiClient.get('/amortizacion/combos/tipo-documento')
                setTiposDoc(res.data?.data?.data || [])
            } catch {
                setTiposDoc([])
            }
        }
        fetchTiposDoc()
    }, [])

    useEffect(() => {
        if (item) {
            setFechaEmision(item.Fecha_Emision ? item.Fecha_Emision.slice(0, 10) : "")
            setFechaVcto(item.Fecha_Vcto ? item.Fecha_Vcto.slice(0, 10) : "")
            setTipoDoc(item.Tipo_Doc || "")
            setSerieDoc(item.SerieDoc || "")
            setNumeroDoc(String(item.NumeroDoc || ""))
            setProvision(String(item.Provision || "0"))
            setAmortizacion(String(item.Amortizacion || "0"))
            setObservaciones(item.Observaciones || "")
        }
    }, [item])

    const handleGuardar = async () => {
        if (!item) return
        setSaving(true)
        try {
            await apiClient.put(`/amortizacion/kardex/${item.IdKardexClientes}`, {
                fecha_emision: fechaEmision || null,
                fecha_vcto: fechaVcto || null,
                tipo_doc: tipoDoc,
                serie_doc: serieDoc,
                numero_doc: parseInt(numeroDoc) || 0,
                provision: parseFloat(provision) || 0,
                amortizacion: parseFloat(amortizacion) || 0,
                observaciones: observaciones,
            })
            toast({ title: "Kardex", description: "Movimiento actualizado correctamente." })
            onSaved()
        } catch {
            toast({ title: "Error", description: "No se pudo actualizar el movimiento.", variant: "destructive" })
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
                            <DialogTitle className="text-[15px]">Editar Movimiento — Kardex</DialogTitle>
                            <DialogDescription className="text-xs text-slate-400 mt-0.5">
                                {item ? `${item.SerieDoc}-${item.NumeroDoc}` : 'Movimiento seleccionado'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-5 space-y-4">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                        Datos del movimiento
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">Fecha Emisión</Label>
                            <Input type="date" className="h-8 text-xs" value={fechaEmision} onChange={e => setFechaEmision(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">Fecha Vcto.</Label>
                            <Input type="date" className="h-8 text-xs" value={fechaVcto} onChange={e => setFechaVcto(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">Tipo Documento <span className="text-red-500">*</span></Label>
                            <Select value={tipoDoc} onValueChange={v => setTipoDoc(v)}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {tiposDoc.map(t => (
                                        <SelectItem key={t.Cod_Tipo} value={t.Cod_Tipo}>
                                            {t.Descripcion}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">Serie</Label>
                            <Input className="h-8 text-xs" value={serieDoc} onChange={e => setSerieDoc(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">Número</Label>
                            <Input className="h-8 text-xs" value={numeroDoc} onChange={e => setNumeroDoc(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">Provisión (S/)</Label>
                            <Input type="number" step="0.01" min="0" className="h-8 text-xs" value={provision} onChange={e => setProvision(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">Amortización (S/)</Label>
                            <Input type="number" step="0.01" min="0" className="h-8 text-xs" value={amortizacion} onChange={e => setAmortizacion(e.target.value)} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <Label className="text-[11px]">Observaciones</Label>
                        <Input className="h-8 text-xs" value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Observaciones..." />
                    </div>
                </div>

                <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between rounded-b-lg">
                    <span className="text-xs text-slate-400">
                        {item ? `ID: ${item.IdKardexClientes}` : ''}
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