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
    RefreshCw,
    FileText,
    Save,
    AlertCircle,
    Truck,
    Settings
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/authContext"
import apiClient from "@/app/api/client"
import moment from "moment"

export interface Sequential {
    id: number
    nombre: string
    tipo?: string
    descripcion: string
    prefijo: string
    valorActual: number
    fechaMod: string
    usuMod: string
    activo: boolean
}

export interface AppConfig {
    id_config: number
    cod_apl: string
    cod_config: string
    llave_config: string
    desc_corta: string
    desc_larga: string
    est_config: string
}

const DOCUMENT_TYPES = [
    { value: "1", label: "Factura" },
    { value: "3", label: "Boleta" },
    { value: "7", label: "Nota de Crédito" },
    { value: "8", label: "Nota de Débito" },
]

export default function ConfiguracionesPage() {
    const { user } = useAuth()
    const [activeSection, setActiveSection] = useState("secuenciales")
    const [sequentials, setSequentials] = useState<Sequential[]>([])
    const [configs, setConfigs] = useState<AppConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingSave, setLoadingSave] = useState(false)
    const [isSequentialModalOpen, setIsSequentialModalOpen] = useState(false)
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [sequentialEditando, setSequentialEditando] = useState<Sequential | null>(null)
    const [configEditando, setConfigEditando] = useState<AppConfig | null>(null)
    const [itemToDelete, setItemToDelete] = useState<any>(null)
    const [nuevoSequential, setNuevoSequential] = useState({
        nombre: "", tipo: "", descripcion: "", prefijo: "", valorActual: 1, activo: true
    })

    const [nuevaConfig, setNuevaConfig] = useState({
        cod_apl: "", cod_config: "", llave_config: "", desc_corta: "", desc_larga: "", est_config: "A"
    })

    const [errors, setErrors] = useState<{[key: string]: string}>({})

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
            id: "configuraciones",
            title: "Ajustes del Sistema",
            description: "Variables y llaves de configuración global",
            icon: Settings,
            color: "orange"
        }
    ]

    const getTypeName = (code: string) => {
        const doc = DOCUMENT_TYPES.find(d => d.value === code)
        return doc ? doc.label : code
    }

    const fetchSequentials = async () => {
        setLoading(true)
        try {
            const endpoint = activeSection === "secuenciales" ? "secuenciales" : "guias"
            const response = await apiClient.get(`/admin/listar/${endpoint}`)
            setSequentials(response.data?.data || [])
        } catch (error) {
            console.error("Error fetching data:", error)
            setSequentials([])
        } finally {
            setLoading(false)
        }
    }

    const fetchConfigs = async () => {
        setLoading(true)
        try {
            const response = await apiClient.get(`/admin/listar/configuraciones`)
            setConfigs(response.data?.data || [])
        } catch (error) {
            console.error("Error fetching configs:", error)
            setConfigs([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (activeSection === "configuraciones") {
            fetchConfigs()
        } else {
            fetchSequentials()
        }
    }, [activeSection])

    const abrirModalNuevaConfig = () => {
        setConfigEditando(null)
        setNuevaConfig({ cod_apl: "", cod_config: "", llave_config: "", desc_corta: "", desc_larga: "", est_config: "A" })
        setErrors({})
        setIsConfigModalOpen(true)
    }

    const abrirModalEditarConfig = (config: AppConfig) => {
        setConfigEditando(config)
        setNuevaConfig({
            cod_apl: config.cod_apl,
            cod_config: config.cod_config,
            llave_config: config.llave_config,
            desc_corta: config.desc_corta || "",
            desc_larga: config.desc_larga || "",
            est_config: config.est_config
        })
        setErrors({})
        setIsConfigModalOpen(true)
    }

    const handleGuardarConfig = async () => {
        const newErrors: {[key: string]: string} = {}
        if (!nuevaConfig.cod_apl.trim()) newErrors.cod_apl = "Requerido"
        if (!nuevaConfig.cod_config.trim()) newErrors.cod_config = "Requerido"
        if (!nuevaConfig.llave_config.trim()) newErrors.llave_config = "Requerido"
        setErrors(newErrors)

        if (Object.keys(newErrors).length > 0) return

        setLoadingSave(true)
        try {
            if (configEditando) {
                const res = await apiClient.put(`/admin/actualizar/configuraciones/${configEditando.id_config}`, nuevaConfig)
                if (res.data.success) {
                    setIsConfigModalOpen(false)
                    fetchConfigs()
                }
            } else {
                const res = await apiClient.post(`/admin/crear/configuraciones`, nuevaConfig)
                if (res.data.success) {
                    setIsConfigModalOpen(false)
                    fetchConfigs()
                }
            }
        } catch (error) {
            console.error("Error al guardar config:", error)
        } finally {
            setLoadingSave(false)
        }
    }

    const validateSequentialForm = () => {
        const newErrors: {[key: string]: string} = {}
        if (!nuevoSequential.nombre.trim()) newErrors.nombre = "Obligatorio"
        if (activeSection === "secuenciales" && !nuevoSequential.tipo) newErrors.tipo = "Obligatorio"
        if (!nuevoSequential.prefijo.trim()) newErrors.prefijo = "Obligatorio"
        if (nuevoSequential.valorActual < 0) newErrors.valorActual = "Debe ser >= 0"
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const abrirModalNuevoSequential = () => {
        setSequentialEditando(null)
        setNuevoSequential({ nombre: "", tipo: "", descripcion: "", prefijo: "", valorActual: 1, activo: true })
        setErrors({})
        setIsSequentialModalOpen(true)
    }

    const abrirModalEditarSequential = (sequential: Sequential) => {
        setSequentialEditando(sequential)
        setNuevoSequential({
            nombre: sequential.nombre,
            tipo: sequential.tipo || "",
            descripcion: sequential.descripcion || "",
            prefijo: sequential.prefijo,
            valorActual: sequential.valorActual,
            activo: sequential.activo
        })
        setErrors({})
        setIsSequentialModalOpen(true)
    }

    const handleGuardarSequential = async () => {
        if (!validateSequentialForm()) return
        setLoadingSave(true)
        const endpoint = activeSection === "secuenciales" ? "secuenciales" : "guias"
        try {
            const payload = { ...nuevoSequential, tipo: activeSection === "secuenciales" ? nuevoSequential.tipo : null, usuMod: user?.nombreCompleto }
            if (sequentialEditando) {
                const res = await apiClient.put(`/admin/actualizar/${endpoint}/${sequentialEditando.id}`, payload)
                if (res.data.success) {
                    setIsSequentialModalOpen(false)
                    fetchSequentials()
                }
            } else {
                const res = await apiClient.post(`/admin/crear/${endpoint}`, payload)
                if (res.data.success) {
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

    const confirmarEliminacion = (item: any) => {
        setItemToDelete(item)
        setIsDeleteModalOpen(true)
    }

    const handleEliminar = async () => {
        if (!itemToDelete) return
        setLoadingSave(true)
        try {
            if (activeSection === "configuraciones") {
                const res = await apiClient.delete(`/admin/eliminar/configuraciones/${itemToDelete.id_config}`)
                if (res.data.success) fetchConfigs()
            } else {
                const endpoint = activeSection === "secuenciales" ? "secuenciales" : "guias"
                const res = await apiClient.delete(`/admin/eliminar/${endpoint}/${itemToDelete.id}`)
                if (res.data.success) fetchSequentials()
            }
            setIsDeleteModalOpen(false)
            setItemToDelete(null)
        } catch (error) {
            console.error("Error al eliminar:", error)
        } finally {
            setLoadingSave(false)
        }
    }


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
                                                isActive ? `bg-blue-50 border-blue-500 text-blue-700` : 'border-transparent text-gray-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
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
                                    {activeSection === "secuenciales" && <FileText className="h-5 w-5 text-blue-600" />}
                                    {activeSection === "guias" && <Truck className="h-5 w-5 text-green-600" />}
                                    {activeSection === "configuraciones" && <Settings className="h-5 w-5 text-orange-600" />}
                                    Gestión de {sections.find(s => s.id === activeSection)?.title}
                                </CardTitle>
                                <CardDescription>
                                    {activeSection === "configuraciones"
                                        ? "Configura las variables de entorno de la base de datos."
                                        : `Configura la numeración para ${activeSection === "secuenciales" ? "facturas y boletas" : "guías de remisión"}`}
                                </CardDescription>
                            </div>
                            <Button
                                onClick={activeSection === "configuraciones" ? abrirModalNuevaConfig : abrirModalNuevoSequential}
                                className="flex items-center gap-2 w-full sm:w-auto"
                            >
                                <Plus className="h-4 w-4" /> Nuevo Registro
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-40 w-full" />)}
                                </div>
                            ) : activeSection === "configuraciones" ? (
                                configs.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {configs.map((config) => (
                                            <Card key={config.id_config} className="overflow-hidden">
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h3 className="font-semibold text-lg text-gray-900 break-words">{config.cod_config}</h3>
                                                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                                                    APL: {config.cod_apl}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm text-gray-600 break-words">{config.desc_corta}</p>
                                                        </div>
                                                        <div className="flex gap-1 flex-shrink-0 ml-2">
                                                            <Badge variant={config.est_config === 'A' ? "default" : "secondary"}>
                                                                {config.est_config === 'A' ? "Activo" : "Inactivo"}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3 mb-4 p-2 bg-gray-50 rounded text-sm break-all">
                                                        <span className="font-medium text-gray-500">Llave: </span>
                                                        <span className="font-mono text-xs text-gray-700">{config.llave_config}</span>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => abrirModalEditarConfig(config)} className="flex-1 text-xs">
                                                            <Edit className="h-3 w-3 mr-1" /> Editar
                                                        </Button>
                                                        <Button variant="outline" size="sm" onClick={() => confirmarEliminacion(config)} className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent text-xs flex-1 border-red-200">
                                                            <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay configuraciones registradas</h3>
                                    </div>
                                )
                            ) : (
                                sequentials.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {sequentials.map((sequential) => (
                                            <Card key={sequential.id} className="overflow-hidden">
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h3 className="font-semibold text-lg text-gray-900 break-words">{sequential.nombre}</h3>
                                                                {activeSection === "secuenciales" && sequential.tipo && (
                                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                                        {getTypeName(sequential.tipo)}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-600 break-words">{sequential.descripcion}</p>
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
                                                                <div className="font-semibold text-blue-600">{sequential.prefijo}</div>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-gray-500">Secuencial:</span>
                                                                <div className="font-semibold text-green-600">{sequential.valorActual}</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => abrirModalEditarSequential(sequential)} className="flex-1 text-xs">
                                                            <Edit className="h-3 w-3 mr-1" /> Editar
                                                        </Button>
                                                        <Button variant="outline" size="sm" onClick={() => confirmarEliminacion(sequential)} className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent text-xs flex-1 border-red-200">
                                                            <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay registros configurados</h3>
                                    </div>
                                )
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{configEditando ? 'Editar' : 'Nueva'} Configuración Global</DialogTitle>
                        <DialogDescription>Variables del sistema (pbl_config)</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cod_apl">Cod. Aplicación *</Label>
                                <Input
                                    id="cod_apl"
                                    maxLength={20}
                                    placeholder="Ej: SYS, WEB, WS"
                                    value={nuevaConfig.cod_apl}
                                    onChange={(e) => setNuevaConfig({...nuevaConfig, cod_apl: e.target.value.toUpperCase()})}
                                    className={errors.cod_apl ? "border-red-500" : ""}
                                />
                                {errors.cod_apl && <p className="text-xs text-red-500">{errors.cod_apl}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cod_config">Cod. Configuración *</Label>
                                <Input
                                    id="cod_config"
                                    maxLength={40}
                                    placeholder="Ej: TOKEN_SUNAT"
                                    value={nuevaConfig.cod_config}
                                    onChange={(e) => setNuevaConfig({...nuevaConfig, cod_config: e.target.value.toUpperCase()})}
                                    className={errors.cod_config ? "border-red-500" : ""}
                                />
                                {errors.cod_config && <p className="text-xs text-red-500">{errors.cod_config}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="llave_config">Llave (Valor) *</Label>
                            <Textarea
                                id="llave_config"
                                maxLength={400}
                                placeholder="Valor asignado a la configuración"
                                value={nuevaConfig.llave_config}
                                onChange={(e) => setNuevaConfig({...nuevaConfig, llave_config: e.target.value})}
                                className={errors.llave_config ? "border-red-500" : ""}
                                rows={2}
                            />
                            {errors.llave_config && <p className="text-xs text-red-500">{errors.llave_config}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="desc_corta">Descripción Corta</Label>
                            <Input
                                id="desc_corta"
                                maxLength={200}
                                value={nuevaConfig.desc_corta}
                                onChange={(e) => setNuevaConfig({...nuevaConfig, desc_corta: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="desc_larga">Descripción Larga</Label>
                            <Textarea
                                id="desc_larga"
                                maxLength={1000}
                                value={nuevaConfig.desc_larga}
                                onChange={(e) => setNuevaConfig({...nuevaConfig, desc_larga: e.target.value})}
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Estado</Label>
                            <Select
                                value={nuevaConfig.est_config}
                                onValueChange={(val) => setNuevaConfig({...nuevaConfig, est_config: val})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A">Activo (A)</SelectItem>
                                    <SelectItem value="I">Inactivo (I)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfigModalOpen(false)} disabled={loadingSave}>Cancelar</Button>
                        <Button onClick={handleGuardarConfig} disabled={loadingSave}>
                            {loadingSave && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                            <Save className="h-4 w-4 mr-2" /> Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isSequentialModalOpen} onOpenChange={setIsSequentialModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{sequentialEditando ? 'Editar' : 'Nuevo'} {activeSection === "secuenciales" ? "Comprobante" : "Guía"}</DialogTitle>
                        <DialogDescription>Configuración de numeración</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nombre">Nombre *</Label>
                                <Input
                                    id="nombre"
                                    placeholder="Ej: Factura Principal"
                                    value={nuevoSequential.nombre}
                                    onChange={(e) => setNuevoSequential({...nuevoSequential, nombre: e.target.value})}
                                    className={errors.nombre ? "border-red-500" : ""}
                                />
                            </div>

                            {activeSection === "secuenciales" && (
                                <div className="space-y-2">
                                    <Label>Tipo de Documento *</Label>
                                    <Select
                                        value={nuevoSequential.tipo}
                                        onValueChange={(val) => setNuevoSequential({...nuevoSequential, tipo: val})}
                                    >
                                        <SelectTrigger className={errors.tipo ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Seleccionar tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DOCUMENT_TYPES.map((doc) => (
                                                <SelectItem key={doc.value} value={doc.value}>{doc.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="prefijo">Prefijo *</Label>
                                <Input
                                    id="prefijo"
                                    placeholder="Ej: F001"
                                    value={nuevoSequential.prefijo}
                                    onChange={(e) => setNuevoSequential({...nuevoSequential, prefijo: e.target.value.toUpperCase()})}
                                    className={errors.prefijo ? "border-red-500" : ""}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="valorActual">Secuencial Actual *</Label>
                                <Input
                                    id="valorActual"
                                    type="number"
                                    min="0"
                                    value={nuevoSequential.valorActual}
                                    onChange={(e) => setNuevoSequential({...nuevoSequential, valorActual: parseInt(e.target.value) || 0})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="descripcion">Descripción</Label>
                            <Textarea
                                id="descripcion"
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
                            <Label htmlFor="activo" className="text-sm font-medium">Activo</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSequentialModalOpen(false)} disabled={loadingSave}>Cancelar</Button>
                        <Button onClick={handleGuardarSequential} disabled={loadingSave}>
                            {loadingSave && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                            <Save className="h-4 w-4 mr-2" /> Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-red-600" /> Confirmar Eliminación</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="flex-1" disabled={loadingSave}>Cancelar</Button>
                        <Button onClick={handleEliminar} className="flex-1 bg-red-600 hover:bg-red-700" disabled={loadingSave}>
                            {loadingSave ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />} Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}