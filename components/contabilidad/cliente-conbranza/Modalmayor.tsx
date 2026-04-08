'use client'

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import { Loader2, Pencil, Trash2, BookMarked, AlertCircle, RefreshCw } from "lucide-react"
import apiClient from "@/app/api/client"
import { toast } from "@/app/hooks/useToast"
import { MayorItem, AmortizacionListItem } from "@/app/types/amortizacion-types"
import ModalEditarMayor from "@/components/contabilidad/cliente-conbranza/Modaleditarmayor";
import {fmtFecha, fmtMoney} from "@/lib/planilla.helper";

interface Props {
    open: boolean
    onClose: () => void
    amortizacion: AmortizacionListItem | null
}

export default function ModalMayor({ open, onClose, amortizacion }: Props) {
    const [data, setData] = useState<MayorItem[]>([])
    const [filtered, setFiltered] = useState<MayorItem[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState("")

    const [editItem, setEditItem] = useState<MayorItem | null>(null)
    const [editOpen, setEditOpen] = useState(false)

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<MayorItem | null>(null)
    const [loadingDelete, setLoadingDelete] = useState(false)

    const fetchData = useCallback(async () => {
        if (!amortizacion) return
        setLoading(true)
        try {
            const response = await apiClient.get(`/amortizacion/mayor/${amortizacion.Id_Amort_Clie}`)
            const items = response.data?.data?.data || []
            setData(items)
            setFiltered(items)
        } catch {
            setData([])
            setFiltered([])
        } finally {
            setLoading(false)
        }
    }, [amortizacion])

    useEffect(() => {
        if (open && amortizacion) {
            setSearch("")
            fetchData()
        }
    }, [open, amortizacion])

    useEffect(() => {
        if (!search.trim()) {
            setFiltered(data)
        } else {
            const q = search.toLowerCase()
            setFiltered(data.filter(r =>
                r.CtaContable?.toLowerCase().includes(q) ||
                r.DescCuenta?.toLowerCase().includes(q) ||
                r.Concepto?.toLowerCase().includes(q) ||
                String(r.NroDoc).includes(q)
            ))
        }
    }, [search, data])

    const handleDeleteClick = (item: MayorItem) => {
        setDeleteTarget(item)
        setIsDeleteModalOpen(true)
    }

    const handleEliminar = async () => {
        if (!deleteTarget) return
        setLoadingDelete(true)
        try {
            await apiClient.delete(`/amortizacion/mayor/${deleteTarget.IdLibroMayor}`)
            toast({ title: "Libro Mayor", description: "Asiento eliminado correctamente." })
            setIsDeleteModalOpen(false)
            setDeleteTarget(null)
            fetchData()
        } catch {
            toast({ title: "Error", description: "No se pudo eliminar el asiento.", variant: "destructive" })
        } finally {
            setLoadingDelete(false)
        }
    }

    const handleEditarClick = (item: MayorItem) => {
        setEditItem(item)
        setEditOpen(true)
    }

    const handleEditSaved = () => {
        setEditOpen(false)
        setEditItem(null)
        fetchData()
    }

    const subtitle = amortizacion
        ? `${amortizacion.DescTipoDoc || amortizacion.TipoDoc} ${amortizacion.SerieDoc}-${amortizacion.NumeroDoc} — ${amortizacion.NombreCliente || amortizacion.Cod_Clie}`
        : 'Asientos contables del documento'

    return (
        <>
            <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
                <DialogContent className="max-w-[1020px] max-h-[90vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-200 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div>
                                <DialogTitle className="text-[15px]">Libro Mayor</DialogTitle>
                                <DialogDescription className="text-xs text-slate-400 mt-0.5">{subtitle}</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="px-5 py-3 border-b border-slate-200 flex gap-2 flex-shrink-0">
                        <Input
                            className="text-xs h-8 flex-1"
                            placeholder="Buscar por cuenta, descripción, referencia..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <Button size="sm" className="h-8 text-xs bg-cyan-600 hover:bg-cyan-700">Filtrar</Button>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                            <tr className="bg-slate-50 sticky top-0 z-10">
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-500 uppercase text-[10px] tracking-wider border-b">Fecha</th>
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-500 uppercase text-[10px] tracking-wider border-b">Cuenta</th>
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-500 uppercase text-[10px] tracking-wider border-b">Descripción</th>
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-500 uppercase text-[10px] tracking-wider border-b">Ref. Doc.</th>
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-500 uppercase text-[10px] tracking-wider border-b">Cargo</th>
                                <th className="text-left py-2.5 px-3 font-semibold text-slate-500 uppercase text-[10px] tracking-wider border-b">Abono</th>
                                <th className="text-center py-2.5 px-3 font-semibold text-slate-500 uppercase text-[10px] tracking-wider border-b">Acciones</th>
                            </tr>
                            </thead>
                            <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-slate-400">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                        Cargando asientos...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-slate-400">
                                        Sin asientos contables
                                    </td>
                                </tr>
                            ) : filtered.map(r => (
                                <tr key={r.IdLibroMayor} className="hover:bg-slate-50/60 border-b border-slate-100">
                                    <td className="py-2 px-3">{fmtFecha(r.Fecha)}</td>
                                    <td className="py-2 px-3 font-mono text-[11px] text-blue-600">{r.CtaContable}</td>
                                    <td className="py-2 px-3">{r.DescCuenta || r.Concepto}</td>
                                    <td className="py-2 px-3 font-mono text-[11px]">{r.SerieDoc}-{r.NroDoc}</td>
                                    <td className="py-2 px-3" style={{ color: r.Cargo > 0 ? '#dc2626' : '#94a3b8', fontWeight: r.Cargo > 0 ? 500 : 400 }}>
                                        {r.Cargo > 0 ? fmtMoney(r.Cargo) : '–'}
                                    </td>
                                    <td className="py-2 px-3" style={{ color: r.Abono > 0 ? '#16a34a' : '#94a3b8', fontWeight: r.Abono > 0 ? 500 : 400 }}>
                                        {r.Abono > 0 ? fmtMoney(r.Abono) : '–'}
                                    </td>
                                    <td className="py-2 px-3">
                                        <div className="flex items-center justify-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 px-2 text-[10px] gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                onClick={() => handleEditarClick(r)}
                                            >
                                                <Pencil className="h-3 w-3" /> Editar
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
                        <span className="text-xs text-slate-400">{filtered.length} asiento{filtered.length !== 1 ? 's' : ''}</span>
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={onClose}>Cerrar</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <ModalEditarMayor
                open={editOpen}
                onClose={() => { setEditOpen(false); setEditItem(null) }}
                item={editItem}
                onSaved={handleEditSaved}
            />

            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600" /> Confirmar Eliminación
                        </DialogTitle>
                        <DialogDescription>
                            ¿Eliminar el asiento de la cuenta <strong>{deleteTarget?.CtaContable}</strong> ({deleteTarget?.DescCuenta || deleteTarget?.Concepto})? Esta acción no se puede deshacer.
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