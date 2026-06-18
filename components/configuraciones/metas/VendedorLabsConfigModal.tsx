'use client'

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import StatusChip from "@/components/reporte/metas/StatusChip"
import ProgressBar from "@/components/reporte/metas/ProgressBar"
import { IVendedorLabDetalle, FilterStatus } from "@/app/types/metas-types"
import { fmtMoney, getStatusColor, getLabColor, getInitials } from "@/app/utils/metas-helpers"

interface VendedorLabsConfigModalProps {
    open: boolean;
    onClose: () => void;
    codVendedor: string;
    nombreVendedor: string;
    totalLabs: number;
    labsDelVendedor: IVendedorLabDetalle[];
    loading?: boolean;
}

export default function VendedorLabsConfigModal({
    open,
    onClose,
    codVendedor,
    nombreVendedor,
    totalLabs,
    labsDelVendedor,
    loading = false,
}: VendedorLabsConfigModalProps) {
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState<FilterStatus>("todos")

    const filtered = useMemo(() => {
        let rows = labsDelVendedor.map(l => ({
            ...l,
            pct: Number(l.pct_lab || 0),
        }))

        if (search) {
            const q = search.toLowerCase()
            rows = rows.filter(l => (l.nombre_lab || '').toLowerCase().includes(q))
        }

        if (filter === "verde")    rows = rows.filter(l => l.pct >= 80)
        if (filter === "amarillo") rows = rows.filter(l => l.pct >= 50 && l.pct < 80)
        if (filter === "rojo")     rows = rows.filter(l => l.pct < 50)

        return rows.sort((a, b) => b.pct - a.pct)
    }, [labsDelVendedor, search, filter])

    const filterBtns: { key: FilterStatus; label: string; activeClass: string }[] = [
        { key: "todos",    label: "Todos",    activeClass: "bg-sky-600 text-white border-sky-600" },
        { key: "verde",    label: "✓ Meta",   activeClass: "bg-emerald-600 text-white border-emerald-600" },
        { key: "amarillo", label: "⚠ Riesgo", activeClass: "bg-amber-500 text-white border-amber-500" },
        { key: "rojo",     label: "✗ Bajo",   activeClass: "bg-red-600 text-white border-red-600" },
    ]

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0">
                <div className="p-5 pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-sky-100 text-sky-600">
                            {getInitials(nombreVendedor)}
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-slate-800">
                                {nombreVendedor}
                            </DialogTitle>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">
                                    Cód: {codVendedor}
                                </Badge>
                                <span className="text-[10px] text-slate-400">
                                    {totalLabs} laboratorio{totalLabs !== 1 ? 's' : ''} asignado{totalLabs !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-4 pt-3 pb-2 space-y-2 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar laboratorio..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-10 bg-slate-50 h-9 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {filterBtns.map(btn => (
                            <Button
                                key={btn.key}
                                variant="outline"
                                size="sm"
                                className={`text-[11px] h-7 px-3 ${filter === btn.key ? btn.activeClass : "text-slate-500"}`}
                                onClick={() => setFilter(btn.key)}
                            >
                                {btn.label}
                            </Button>
                        ))}
                        <span className="text-[10px] text-slate-400 ml-auto">
                            {filtered.length} de {labsDelVendedor.length}
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-2">
                            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-sky-600" />
                            <p className="text-xs text-slate-400">Cargando laboratorios...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center text-slate-400 text-sm py-10">
                            Sin resultados
                        </div>
                    ) : filtered.map((lab, i) => {
                        const [c1] = getStatusColor(lab.pct)
                        const color = getLabColor(i)
                        return (
                            <div
                                key={lab.id_lab}
                                className="rounded-lg border border-slate-100 bg-white p-3"
                                style={{ borderLeft: `3px solid ${color}` }}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div
                                            className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                                            style={{ background: `${color}22`, color }}
                                        >
                                            {getInitials(lab.nombre_lab || '')}
                                        </div>
                                        <span className="text-sm font-semibold text-slate-800 truncate">
                                            {lab.nombre_lab || `Lab ${lab.id_lab}`}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-sm font-bold" style={{ color: c1 }}>{lab.pct}%</span>
                                        <StatusChip pct={lab.pct} />
                                    </div>
                                </div>
                                <div className="mt-2 space-y-1">
                                    <ProgressBar pct={lab.pct} height="h-1.5" />
                                    <span className="text-[10px] text-slate-400">
                                        {fmtMoney(Number(lab.venta_real))} / {fmtMoney(Number(lab.meta_monto))}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </DialogContent>
        </Dialog>
    )
}
