'use client'

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Users, Factory, Pill, RefreshCw } from "lucide-react"

import ResumenTab from "@/components/reporte/metas/ResumenTab"
import VendedoresTab from "@/components/reporte/metas/VendedoresTab"
import LaboratoriosTab from "@/components/reporte/metas/LaboratoriosTab"
import ItemsPorLabTab from "@/components/reporte/metas/ItemsPorLabTab"
import VendedorDetailModal from "@/components/reporte/metas/VendedorDetailModal"

import { IVendedorDashboard } from "@/app/types/metas-types"
import { useMetasDashboard } from "@/app/hooks/useMetasDashboard"
import { MONTH_NAMES } from "@/app/utils/metas-helpers"
import VendedorDashboardView from "@/components/reporte/metas/VendedorDashboardView";

// Tabs solo disponibles para admin/no-vendedor
const adminTabs = [
    { id: "resumen",      label: "Resumen",       icon: BarChart3 },
    { id: "vendedores",   label: "Vendedores",     icon: Users },
    { id: "laboratorios", label: "Laboratorios",   icon: Factory },
    { id: "productos",    label: "Ítems por Lab",  icon: Pill },
]

export default function MetasDashboardPage() {
    const [activeTab, setActiveTab] = useState("resumen")
    const [selectedVendedor, setSelectedVendedor] = useState<IVendedorDashboard | null>(null)
    const [vendModalOpen, setVendModalOpen] = useState(false)

    const {
        ciclos,
        selectedCiclo,
        setSelectedCiclo,
        dashboardData,
        loading,
        loadingDashboard,
        refreshDashboard,
        kpis,
        isVendedorView,
    } = useMetasDashboard()

    const handleVendedorClick = (vendedor: IVendedorDashboard) => {
        setSelectedVendedor(vendedor)
        setVendModalOpen(true)
    }

    const cicloLabel = selectedCiclo
        ? `${MONTH_NAMES[selectedCiclo.mes]} ${selectedCiclo.anio}`
        : "Sin ciclo"

    // ── Loading inicial (ciclos) ──────────────────────────────────────
    if (loading) {
        return (
            <div className="grid gap-6 p-4 md:p-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
                </div>
            </div>
        )
    }

    return (
        <div className="grid gap-4">
            {/* ── Cabecera ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                        {isVendedorView ? "Mi Dashboard de Metas" : "Metas por Vendedor"}
                    </h1>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Select
                        value={selectedCiclo ? String(selectedCiclo.id_ciclo) : ""}
                        onValueChange={(val) => {
                            const ciclo = ciclos.find(c => String(c.id_ciclo) === val)
                            if (ciclo) setSelectedCiclo(ciclo)
                        }}
                    >
                        <SelectTrigger className="w-[200px] h-9 text-sm bg-white">
                            <SelectValue placeholder="Seleccionar ciclo" />
                        </SelectTrigger>
                        <SelectContent>
                            {ciclos.map(c => (
                                <SelectItem key={c.id_ciclo} value={String(c.id_ciclo)}>
                                    {MONTH_NAMES[c.mes]} {c.anio} {c.estado === 'ABIERTO' ? '🟢' : '🔴'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Badge variant="outline" className="text-xs bg-slate-50">
                        Ciclo: {cicloLabel}
                    </Badge>

                    {selectedCiclo && (
                        <Badge
                            variant={selectedCiclo.estado === 'ABIERTO' ? "default" : "secondary"}
                            className="text-xs"
                        >
                            {selectedCiclo.estado}
                        </Badge>
                    )}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshDashboard}
                        disabled={loadingDashboard}
                    >
                        <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loadingDashboard ? "animate-spin" : ""}`} />
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* ── Tabs (solo admin) ── */}
            {!isVendedorView && (
                <div className="flex bg-white border border-slate-200 rounded-lg overflow-x-auto shadow-sm">
                    {adminTabs.map(tab => {
                        const isActive = activeTab === tab.id
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                                    isActive
                                        ? "text-sky-700 border-sky-600 bg-sky-50/50"
                                        : "text-slate-500 border-transparent hover:text-sky-600"
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        )
                    })}
                </div>
            )}

            {/* ── Contenido ── */}
            {loadingDashboard ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600 mb-4" />
                    <p className="text-slate-500 font-medium">Cargando datos del ciclo...</p>
                </div>
            ) : !dashboardData ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <BarChart3 className="h-12 w-12 text-slate-300 mb-4" />
                        <p className="text-slate-500">No hay datos disponibles para este ciclo</p>
                        <p className="text-xs text-slate-400 mt-1">Selecciona un ciclo con metas configuradas</p>
                    </CardContent>
                </Card>
            ) : isVendedorView ? (
                kpis && (
                    <VendedorDashboardView
                        data={dashboardData}
                        kpis={kpis}
                    />
                )
            ) : (
                <>
                    {activeTab === "resumen" && kpis && (
                        <ResumenTab
                            data={dashboardData}
                            kpis={kpis}
                            onVendedorClick={handleVendedorClick}
                            isVendedorView={false}
                        />
                    )}

                    {activeTab === "vendedores" && (
                        <VendedoresTab
                            vendedores={dashboardData.vendedores}
                            onVendedorClick={handleVendedorClick}
                        />
                    )}

                    {activeTab === "laboratorios" && (
                        <LaboratoriosTab
                            laboratorios={dashboardData.laboratorios}
                        />
                    )}

                    {activeTab === "productos" && (
                        <ItemsPorLabTab
                            laboratorios={dashboardData.laboratorios}
                            items={dashboardData.items}
                        />
                    )}
                </>
            )}

            {!isVendedorView && (
                <VendedorDetailModal
                    open={vendModalOpen}
                    onClose={() => setVendModalOpen(false)}
                    vendedor={selectedVendedor}
                    allItems={dashboardData?.items || []}
                />
            )}
        </div>
    )
}