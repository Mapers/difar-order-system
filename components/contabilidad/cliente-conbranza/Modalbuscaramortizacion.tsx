'use client'

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import { Search, Loader2, Pencil, BookOpen, BookMarked, Trash2, X, AlertCircle, RefreshCw } from "lucide-react"
import apiClient from "@/app/api/client"
import { toast } from "@/app/hooks/useToast"
import { AmortizacionListItem } from "@/app/types/amortizacion-types"
import {fmtFecha, fmtMoney} from "@/lib/planilla.helper";

interface Props {
    open: boolean
    onClose: () => void
    onSelectEditar: (record: AmortizacionListItem) => void
    onOpenKardex: (record: AmortizacionListItem) => void
    onOpenMayor: (record: AmortizacionListItem) => void
}

export default function ModalBuscarAmortizacion({ open, onClose, onSelectEditar, onOpenKardex, onOpenMayor }: Props) {
    const [data, setData] = useState<AmortizacionListItem[]>([])
    const [loading, setLoading] = useState(false)

    const [fechaDesde, setFechaDesde] = useState("")
    const [fechaHasta, setFechaHasta] = useState("")
    const [textoBusqueda, setTextoBusqueda] = useState("")

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<AmortizacionListItem | null>(null)
    const [loadingDelete, setLoadingDelete] = useState(false)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (fechaDesde) params.append('fechaDesde', fechaDesde)
            if (fechaHasta) params.append('fechaHasta', fechaHasta)
            if (textoBusqueda) params.append('texto', textoBusqueda)
            params.append('limite', '50')
            params.append('offset', '0')

            const response = await apiClient.get(`/amortizacion/listar?${params.toString()}`)
            setData(response.data?.data?.data || [])
        } catch {
            setData([])
        } finally {
            setLoading(false)
        }
    }, [fechaDesde, fechaHasta, textoBusqueda])

    useEffect(() => {
        if (open) fetchData()
    }, [open])

    const handleLimpiar = () => {
        setFechaDesde("")
        setFechaHasta("")
        setTextoBusqueda("")
    }

    const handleDeleteClick = (record: AmortizacionListItem) => {
        setDeleteTarget(record)
        setIsDeleteModalOpen(true)
    }

    const handleEliminar = async () => {
        if (!deleteTarget) return
        setLoadingDelete(true)
        try {
            await apiClient.delete(`/amortizacion/${deleteTarget.Id_Amort_Clie}`)
            toast({ title: "Eliminar", description: "Amortización eliminada correctamente." })
            setIsDeleteModalOpen(false)
            setDeleteTarget(null)
            fetchData()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.response?.data?.message || "No se pudo eliminar la amortización.",
                variant: "destructive"
            })
        } finally {
            setLoadingDelete(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
                <DialogContent className="max-w-[1060px] max-h-[90vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-200 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div>
                                <DialogTitle className="text-[15px]">Buscar Cobranza</DialogTitle>
                                <DialogDescription className="text-xs text-slate-400 mt-0.5">
                                    Filtra por rango de fechas o texto libre
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex-shrink-0">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="flex flex-col gap-1 w-[140px]">
                                <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Fecha desde</Label>
                                <Input
                                    type="date"
                                    className="h-8 text-xs"
                                    value={fechaDesde}
                                    placeholder='Fecha inicio'
                                    onChange={e => setFechaDesde(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1 w-[140px]">
                                <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Fecha hasta</Label>
                                <Input
                                    type="date"
                                    className="h-8 text-xs"
                                    value={fechaHasta}
                                    placeholder='Fecha fin'
                                    onChange={e => setFechaHasta(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                                <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Buscar texto</Label>
                                <Input
                                    className="h-8 text-xs"
                                    placeholder="Cliente, planilla, vendedor, N° doc..."
                                    value={textoBusqueda}
                                    onChange={e => setTextoBusqueda(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={fetchData} disabled={loading}>
                                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                                    Filtrar
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleLimpiar}>
                                    <X className="h-3 w-3" /> Limpiar
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                            <tr className="bg-slate-50 sticky top-0 z-10">
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-500 uppercase text-[10px] tracking-wider border-b">N° Planilla</th>
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-500 uppercase text-[10px] tracking-wider border-b">Cliente</th>
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-500 uppercase text-[10px] tracking-wider border-b">Tipo Doc.</th>
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-500 uppercase text-[10px] tracking-wider border-b">Serie-Número</th>
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-500 uppercase text-[10px] tracking-wider border-b">Fecha Cobro</th>
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-500 uppercase text-[10px] tracking-wider border-b">Importe</th>
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-500 uppercase text-[10px] tracking-wider border-b">Vendedor</th>
                                <th className="text-center py-2.5 px-3 font-semibold text-slate-500 uppercase text-[10px] tracking-wider border-b">Acciones</th>
                            </tr>
                            </thead>
                            <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-slate-400">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                        Cargando registros...
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-slate-400">
                                        <div className="text-3xl mb-2 opacity-40">📂</div>
                                        No se encontraron registros
                                    </td>
                                </tr>
                            ) : data.map(r => (
                                <tr key={r.Id_Amort_Clie} className="hover:bg-slate-50/60 border-b border-slate-100">
                                    <td className="py-2 px-3 font-semibold">{r.NroPlanilla || `#${r.Id_Amort_Clie}`}</td>
                                    <td className="py-2 px-3">{r.NombreCliente || r.Cod_Clie}</td>
                                    <td className="py-2 px-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                                                {r.DescTipoDoc || r.TipoDoc}
                                            </span>
                                    </td>
                                    <td className="py-2 px-3 font-mono text-[11px]">{r.SerieDoc}-{r.NumeroDoc}</td>
                                    <td className="py-2 px-3">{fmtFecha(r.Fecha_Mvto)}</td>
                                    <td className="py-2 px-3 font-medium">{fmtMoney(r.Importe_Amortiz)}</td>
                                    <td className="py-2 px-3 text-slate-500">
                                        {r.NombreVendedor ? `${r.NombreVendedor} ${r.ApellidoVendedor || ''}`.trim() : r.Cod_Vend || '–'}
                                    </td>
                                    <td className="py-2 px-3">
                                        <div className="flex items-center justify-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 px-2 text-[10px] gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                onClick={() => { onSelectEditar(r); onClose() }}
                                            >
                                                <Pencil className="h-3 w-3" /> Editar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 px-2 text-[10px] gap-1 text-purple-600 border-purple-200 hover:bg-purple-50"
                                                onClick={() => onOpenKardex(r)}
                                            >
                                                <BookOpen className="h-3 w-3" /> Kardex
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 px-2 text-[10px] gap-1 text-cyan-600 border-cyan-200 hover:bg-cyan-50"
                                                onClick={() => onOpenMayor(r)}
                                            >
                                                <BookMarked className="h-3 w-3" /> L. Mayor
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 px-2 text-[10px] gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                                onClick={() => handleDeleteClick(r)}
                                            >
                                                <Trash2 className="h-3 w-3" /> Eliminar
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0 rounded-b-lg">
                        <span className="text-xs text-slate-400">{data.length} registro{data.length !== 1 ? 's' : ''}</span>
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={onClose}>Cerrar</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600" /> Confirmar Eliminación
                        </DialogTitle>
                        <DialogDescription>
                            ¿Eliminar la amortización <strong>{deleteTarget?.NroPlanilla || `#${deleteTarget?.Id_Amort_Clie}`}</strong> del cliente <strong>{deleteTarget?.NombreCliente || deleteTarget?.Cod_Clie}</strong>? Se borrarán también los registros de kardex y libro mayor asociados. Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={loadingDelete}>
                            Cancelar
                        </Button>
                        <Button onClick={handleEliminar} className="bg-red-600 hover:bg-red-700" disabled={loadingDelete}>
                            {loadingDelete ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}