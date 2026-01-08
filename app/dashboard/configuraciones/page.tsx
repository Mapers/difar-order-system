'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Plus,
    Edit,
    Trash2,
    Calendar,
    User,
    RefreshCw,
    FileText,
    Save,
    AlertCircle,
    Truck // Icono para guías
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/authContext"
import apiClient from "@/app/api/client"
import moment from "moment"

interface Sequential {
    id: number
    nombre: string
    descripcion: string
    prefijo: string
    valorActual: number
    fechaMod: string
    usuMod: string
    activo: boolean
}

export default function ConfiguracionesPage() {
    const { user } = useAuth()

    // activeSection controla qué estamos viendo: 'secuenciales' (comprobantes) o 'guias'
    const [activeSection, setActiveSection] = useState("secuenciales")

    const [sequentials, setSequentials] = useState<Sequential[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingSave, setLoadingSave] = useState(false)

    const [isSequentialModalOpen, setIsSequentialModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    const [sequentialEditando, setSequentialEditando] = useState<Sequential | null>(null)
    const [sequentialToDelete, setSequentialToDelete] = useState<Sequential | null>(null)

    const [nuevoSequential, setNuevoSequential] = useState({
        nombre: "",
        descripcion: "",
        prefijo: "",
        valorActual: 1,
        activo: true
    })
    const [errors, setErrors] = useState<{[key: string]: string}>({})

    // Definimos las secciones disponibles en el sidebar
    const sections = [
        {
            id: "secuenciales",
            title: "Comprobantes",
            description: "Secuenciales de Facturas y Boletas",
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
    ]

    // Helper para obtener el nombre del endpoint según la sección
    // Si la sección es 'secuenciales', usa 'secuenciales'. Si es 'guias', usa 'guias'.
    const getEndpointName = () => {
        return activeSection === "secuenciales" ? "secuenciales" : "guias";
    }

    // Helper para textos dinámicos
    const getEntityName = () => {
        return activeSection === "secuenciales" ? "Comprobante" : "Guía";
    }

    const validateSequentialForm = () => {
        const newErrors: {[key: string]: string} = {}

        if (!nuevoSequential.nombre.trim()) {
            newErrors.nombre = "El nombre es obligatorio"
        }
        if (!nuevoSequential.prefijo.trim()) {
            newErrors.prefijo = "El prefijo es obligatorio"
        }
        if (nuevoSequential.valorActual < 0) {
            newErrors.valorActual = "El valor actual debe ser mayor o igual a 0"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const fetchSequentials = async () => {
        setLoading(true)
        try {
            // URL dinámica basada en la sección
            const endpoint = getEndpointName();
            const response = await apiClient.get(`/admin/listar/${endpoint}`)
            setSequentials(response.data?.data || [])
        } catch (error) {
            console.error("Error fetching data:", error)
            setSequentials([])
        } finally {
            setLoading(false)
        }
    }

    const abrirModalNuevoSequential = () => {
        setSequentialEditando(null)
        setNuevoSequential({
            nombre: "",
            descripcion: "",
            prefijo: "",
            valorActual: 1,
            activo: true
        })
        setErrors({})
        setIsSequentialModalOpen(true)
    }

    const abrirModalEditarSequential = (sequential: Sequential) => {
        setSequentialEditando(sequential)
        setNuevoSequential({
            nombre: sequential.nombre,
            descripcion: sequential.descripcion || "",
            prefijo: sequential.prefijo,
            valorActual: sequential.valorActual,
            activo: sequential.activo
        })
        setErrors({})
        setIsSequentialModalOpen(true)
    }

    const abrirModalEliminarSequential = (sequential: Sequential) => {
        setSequentialToDelete(sequential)
        setIsDeleteModalOpen(true)
    }

    const handleGuardarSequential = async () => {
        if (!validateSequentialForm()) {
            return
        }

        setLoadingSave(true)
        const endpoint = getEndpointName();

        try {
            if (sequentialEditando) {
                // Actualizar (URL dinámica)
                const response = await apiClient.put(`/admin/actualizar/${endpoint}/${sequentialEditando.id}`, {
                    ...nuevoSequential,
                    usuMod: user?.nombreCompleto
                })

                if (response.data.success) {
                    setIsSequentialModalOpen(false)
                    setSequentialEditando(null)
                    fetchSequentials()
                }
            } else {
                // Crear (URL dinámica)
                const response = await apiClient.post(`/admin/crear/${endpoint}`, {
                    ...nuevoSequential,
                    usuMod: user?.nombreCompleto
                })

                if (response.data.success) {
                    setIsSequentialModalOpen(false)
                    fetchSequentials()
                }
            }
        } catch (error) {
            console.error("Error al guardar:", error)
        } finally {
            setLoadingSave(false)
        }
    }

    const handleEliminarSequential = async () => {
        if (!sequentialToDelete) return
        setLoadingSave(true)
        const endpoint = getEndpointName();

        try {
            // Eliminar (URL dinámica)
            const response = await apiClient.delete(`/admin/eliminar/${endpoint}/${sequentialToDelete.id}`)
            if (response.data.success) {
                setIsDeleteModalOpen(false)
                setSequentialToDelete(null)
                fetchSequentials()
            }
        } catch (error) {
            console.error("Error al eliminar:", error)
        } finally {
            setLoadingSave(false)
        }
    }

    // Recargar datos cuando cambiamos de pestaña (sección)
    useEffect(() => {
        fetchSequentials()
    }, [activeSection])

    return (
        <div className="grid gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Configuraciones del Sistema</h1>
                <p className="text-gray-500">Administra los secuenciales de comprobantes y guías</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* SIDEBAR DE NAVEGACIÓN */}
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
                                                isActive
                                                    ? `bg-blue-50 border-blue-500 text-blue-700`
                                                    : 'border-transparent text-gray-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${
                                                    isActive
                                                        ? 'bg-blue-100 text-blue-600'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm">{section.title}</div>
                                                    <div className="text-xs text-gray-500 truncate">
                                                        {section.description}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* CONTENIDO PRINCIPAL */}
                <div className="lg:w-3/4">
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                    {activeSection === "secuenciales" ? (
                                        <FileText className="h-5 w-5 text-blue-600" />
                                    ) : (
                                        <Truck className="h-5 w-5 text-green-600" />
                                    )}
                                    Gestión de {activeSection === "secuenciales" ? "Comprobantes" : "Guías"}
                                </CardTitle>
                                <CardDescription>
                                    Configura la numeración para {activeSection === "secuenciales" ? "facturas y boletas" : "guías de remisión"}
                                </CardDescription>
                            </div>
                            <Button
                                onClick={abrirModalNuevoSequential}
                                className="flex items-center gap-2 w-full sm:w-auto"
                            >
                                <Plus className="h-4 w-4" />
                                Nuevo {getEntityName()}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Array.from({ length: 4 }).map((_, index) => (
                                        <Skeleton key={index} className="h-40 w-full" />
                                    ))}
                                </div>
                            ) : sequentials.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {sequentials.map((sequential) => (
                                        <Card key={sequential.id} className="overflow-hidden">
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-lg text-gray-900 break-words">
                                                            {sequential.nombre}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 break-words">
                                                            {sequential.descripcion}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-1 flex-shrink-0 ml-2">
                                                        <Badge variant={sequential.activo ? "default" : "secondary"}>
                                                            {sequential.activo ? "Activo" : "Inactivo"}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="space-y-3 mb-4">
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div>
                                                            <span className="font-medium text-gray-500">Prefijo:</span>
                                                            <div className="font-semibold text-blue-600">
                                                                {sequential.prefijo}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-gray-500">Secuencial:</span>
                                                            <div className="font-semibold text-green-600">
                                                                {sequential.valorActual}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 text-sm text-gray-600 flex items-center justify-between">
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <User className="h-3 w-3 text-orange-600 flex-shrink-0" />
                                                            <span className="break-words">
                                                                {sequential.usuMod || 'Sistema'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-3 w-3 text-purple-600 flex-shrink-0" />
                                                            <span>
                                                                {moment(sequential.fechaMod).format('DD/MM/YYYY HH:mm')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => abrirModalEditarSequential(sequential)}
                                                        className="flex-1 text-xs"
                                                    >
                                                        <Edit className="h-3 w-3 mr-1" />
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => abrirModalEliminarSequential(sequential)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent text-xs flex-1 border-red-200"
                                                    >
                                                        <Trash2 className="h-3 w-3 mr-1" />
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        No hay {activeSection === "secuenciales" ? "comprobantes" : "guías"} configurados
                                    </h3>
                                    <p className="text-gray-500 mb-4">
                                        Crea el primero usando el botón superior
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* MODAL CREAR/EDITAR */}
            <Dialog open={isSequentialModalOpen} onOpenChange={setIsSequentialModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {sequentialEditando ? 'Editar' : 'Nuevo'} {getEntityName()}
                        </DialogTitle>
                        <DialogDescription>
                            Configuración de numeración para {activeSection === "secuenciales" ? "documentos de venta" : "guías de remisión"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nombre">Nombre *</Label>
                                <Input
                                    id="nombre"
                                    placeholder={activeSection === "secuenciales" ? "Ej: Factura Electrónica" : "Ej: Guía Remitente"}
                                    value={nuevoSequential.nombre}
                                    onChange={(e) => {
                                        setNuevoSequential({...nuevoSequential, nombre: e.target.value})
                                        if (errors.nombre) setErrors(prev => ({...prev, nombre: ''}))
                                    }}
                                    className={errors.nombre ? "border-red-500" : ""}
                                />
                                {errors.nombre && (
                                    <p className="text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.nombre}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="prefijo">Prefijo *</Label>
                                <Input
                                    id="prefijo"
                                    placeholder={activeSection === "secuenciales" ? "Ej: F001" : "Ej: T001"}
                                    value={nuevoSequential.prefijo}
                                    onChange={(e) => {
                                        setNuevoSequential({...nuevoSequential, prefijo: e.target.value.toUpperCase()})
                                        if (errors.prefijo) setErrors(prev => ({...prev, prefijo: ''}))
                                    }}
                                    className={errors.prefijo ? "border-red-500" : ""}
                                />
                                {errors.prefijo && (
                                    <p className="text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.prefijo}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="valorActual">Secuencial Actual *</Label>
                            <Input
                                id="valorActual"
                                type="number"
                                min="0"
                                value={nuevoSequential.valorActual}
                                onChange={(e) => {
                                    setNuevoSequential({...nuevoSequential, valorActual: parseInt(e.target.value) || 0})
                                    if (errors.valorActual) setErrors(prev => ({...prev, valorActual: ''}))
                                }}
                                className={errors.valorActual ? "border-red-500" : ""}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="descripcion">Descripción</Label>
                            <Textarea
                                id="descripcion"
                                placeholder="Describe el uso de este secuencial..."
                                value={nuevoSequential.descripcion}
                                onChange={(e) => setNuevoSequential({...nuevoSequential, descripcion: e.target.value})}
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="activo"
                                checked={nuevoSequential.activo}
                                onChange={(e) => setNuevoSequential({...nuevoSequential, activo: e.target.checked})}
                                className="h-4 w-4 text-blue-600 rounded"
                            />
                            <Label htmlFor="activo" className="text-sm font-medium">
                                Activo
                            </Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSequentialModalOpen(false)} disabled={loadingSave}>
                            Cancelar
                        </Button>
                        <Button onClick={handleGuardarSequential} disabled={loadingSave}>
                            {loadingSave && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                            <Save className="h-4 w-4 mr-2" />
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL ELIMINAR */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            Confirmar Eliminación
                        </DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas eliminar "{sequentialToDelete?.nombre}"?
                            Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="flex-1"
                            disabled={loadingSave}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleEliminarSequential}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                            disabled={loadingSave}
                        >
                            {loadingSave ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}