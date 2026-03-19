'use client'

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {FileText, Plus, Truck, Settings, CreditCard, Target} from "lucide-react"
import AppConfigSection from "@/components/configuraciones/AppConfigSection";
import SequentialSection from "@/components/configuraciones/SequentialSection";
import ClientConditionsSection from "@/components/configuraciones/ClientConditionsSection";
import MetasConfigSection from "@/components/configuraciones/MetasConfigSection";

const sections = [
    {
        id: "secuenciales",
        title: "Comprobantes",
        description: "Secuenciales de Facturas, Boletas, Notas de Crédito y Notas de Débito",
        icon: FileText,
        color: "blue"
    },
    {
        id: "guias",
        title: "Guías de Remisión",
        description: "Secuenciales para traslado de bienes",
        icon: Truck,
        color: "green"
    },
    {
        id: "condiciones_cliente",
        title: "Condiciones de Pago",
        description: "Asignación de condiciones de crédito y pago a clientes",
        icon: CreditCard,
        color: "purple"
    },
    {
        id: "metas",
        title: "Metas Comerciales",
        description: "Gestión de ciclos, laboratorios, vendedores y productos",
        icon: Target,
        color: "sky"
    },
    {
        id: "configuraciones",
        title: "Ajustes del Sistema",
        description: "Variables y llaves de configuración global",
        icon: Settings,
        color: "orange"
    },
]

const iconColorMap: Record<string, string> = {
    secuenciales: "text-blue-600",
    guias: "text-green-600",
    condiciones_cliente: "text-purple-600",
    metas: "text-sky-600",
    configuraciones: "text-orange-600",
}

const activeBgMap: Record<string, string> = {
    secuenciales: "bg-blue-50 border-blue-500 text-blue-700",
    guias: "bg-green-50 border-green-500 text-green-700",
    condiciones_cliente: "bg-purple-50 border-purple-500 text-purple-700",
    metas: "bg-sky-50 border-sky-500 text-sky-700",
    configuraciones: "bg-orange-50 border-orange-500 text-orange-700",
}

const activeIconBg: Record<string, string> = {
    secuenciales: "bg-blue-100 text-blue-600",
    guias: "bg-green-100 text-green-600",
    condiciones_cliente: "bg-purple-100 text-purple-600",
    metas: "bg-sky-100 text-sky-600",
    configuraciones: "bg-orange-100 text-orange-600",
}

export default function ConfiguracionesPage() {
    const [activeSection, setActiveSection] = useState("secuenciales")
    const [openModalFn, setOpenModalFn] = useState<(() => void) | null>(null)

    const handleSetOpenModalFn = useCallback((fn: () => void) => {
        setOpenModalFn(() => fn)
    }, [])

    const currentSectionData = sections.find(s => s.id === activeSection)

    return (
        <div className="grid gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Configuraciones del Sistema</h1>
                <p className="text-gray-500">Administra los parámetros base, secuenciales y guías del aplicativo</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-1/4">
                    <Card>
                        <CardContent className="p-0">
                            <div className="space-y-1">
                                {sections.map((section) => {
                                    const Icon = section.icon
                                    const isActive = activeSection === section.id
                                    return (
                                        <button
                                            key={section.id}
                                            onClick={() => setActiveSection(section.id)}
                                            className={`w-full text-left p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                                                isActive ? activeBgMap[section.id] : 'border-transparent text-gray-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${isActive ? activeIconBg[section.id] : 'bg-gray-100 text-gray-600'}`}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm">{section.title}</div>
                                                    <div className="text-xs text-gray-500 truncate">{section.description}</div>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:w-3/4">
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                    {currentSectionData && (() => {
                                        const Icon = currentSectionData.icon
                                        return <Icon className={`h-5 w-5 ${iconColorMap[activeSection]}`} />
                                    })()}
                                    Gestión de {currentSectionData?.title}
                                </CardTitle>
                                <CardDescription>
                                    {activeSection === "configuraciones"
                                        ? "Configura las variables de entorno de la base de datos."
                                        : activeSection === "metas"
                                            ? "Administra ciclos, metas por laboratorio, vendedor y producto."
                                            : activeSection === "condiciones_cliente"
                                                ? "Asigna condiciones de pago a clientes específicos."
                                                : `Configura la numeración para ${activeSection === "secuenciales" ? "facturas y boletas" : "guías de remisión"}`}
                                </CardDescription>
                            </div>
                            <Button
                                onClick={() => openModalFn && openModalFn()}
                                className="flex items-center gap-2 w-full sm:w-auto"
                            >
                                <Plus className="h-4 w-4" /> Nuevo Registro
                            </Button>
                        </CardHeader>

                        <CardContent>
                            {activeSection === "configuraciones" ? (
                                <AppConfigSection onOpenModalChange={handleSetOpenModalFn} />
                            ) : activeSection === "condiciones_cliente" ? (
                                <ClientConditionsSection onOpenModalChange={handleSetOpenModalFn} />
                            ) : activeSection === "metas" ? (
                                <MetasConfigSection onOpenModalChange={handleSetOpenModalFn} />
                            ) : (
                                <SequentialSection
                                    key={activeSection}
                                    sectionType={activeSection as "secuenciales" | "guias"}
                                    onOpenModalChange={handleSetOpenModalFn}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}