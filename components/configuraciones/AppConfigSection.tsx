'use client'

import {useState, useEffect, useCallback} from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Edit, Trash2, RefreshCw, Save, AlertCircle, Settings } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import apiClient from "@/app/api/client"
import {AppConfig} from "@/app/types/config-types";

interface AppConfigSectionProps {
    onOpenModalChange: (fn: () => void) => void;
}

export default function AppConfigSection({ onOpenModalChange }: AppConfigSectionProps) {
    const [configs, setConfigs] = useState<AppConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingSave, setLoadingSave] = useState(false)
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [configEditando, setConfigEditando] = useState<AppConfig | null>(null)
    const [itemToDelete, setItemToDelete] = useState<AppConfig | null>(null)
    const [errors, setErrors] = useState<{[key: string]: string}>({})

    const [nuevaConfig, setNuevaConfig] = useState({
        cod_apl: "", cod_config: "", llave_config: "", desc_corta: "", desc_larga: "", est_config: "A"
    })

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
        fetchConfigs()
    }, [])

    const abrirModalNuevaConfig = useCallback(() => {
        setConfigEditando(null)
        setNuevaConfig({ cod_apl: "", cod_config: "", llave_config: "", desc_corta: "", desc_larga: "", est_config: "A" })
        setErrors({})
        setIsConfigModalOpen(true)
    }, [])

    useEffect(() => {
        onOpenModalChange(abrirModalNuevaConfig)
    }, [onOpenModalChange, abrirModalNuevaConfig])

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

    const confirmarEliminacion = (item: AppConfig) => {
        setItemToDelete(item)
        setIsDeleteModalOpen(true)
    }

    const handleEliminar = async () => {
        if (!itemToDelete) return
        setLoadingSave(true)
        try {
            const res = await apiClient.delete(`/admin/eliminar/configuraciones/${itemToDelete.id_config}`)
            if (res.data.success) fetchConfigs()
            setIsDeleteModalOpen(false)
            setItemToDelete(null)
        } catch (error) {
            console.error("Error al eliminar:", error)
        } finally {
            setLoadingSave(false)
        }
    }

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-40 w-full" />)}
            </div>
        )
    }

    return (
        <>
            {configs.length > 0 ? (
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
            )}

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
                                <Input id="cod_apl" maxLength={20} placeholder="Ej: SYS, WEB, WS" value={nuevaConfig.cod_apl} onChange={(e) => setNuevaConfig({...nuevaConfig, cod_apl: e.target.value.toUpperCase()})} className={errors.cod_apl ? "border-red-500" : ""} />
                                {errors.cod_apl && <p className="text-xs text-red-500">{errors.cod_apl}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cod_config">Cod. Configuración *</Label>
                                <Input id="cod_config" maxLength={40} placeholder="Ej: TOKEN_SUNAT" value={nuevaConfig.cod_config} onChange={(e) => setNuevaConfig({...nuevaConfig, cod_config: e.target.value.toUpperCase()})} className={errors.cod_config ? "border-red-500" : ""} />
                                {errors.cod_config && <p className="text-xs text-red-500">{errors.cod_config}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="llave_config">Llave (Valor) *</Label>
                            <Textarea id="llave_config" maxLength={400} placeholder="Valor asignado a la configuración" value={nuevaConfig.llave_config} onChange={(e) => setNuevaConfig({...nuevaConfig, llave_config: e.target.value})} className={errors.llave_config ? "border-red-500" : ""} rows={2} />
                            {errors.llave_config && <p className="text-xs text-red-500">{errors.llave_config}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="desc_corta">Descripción Corta</Label>
                            <Input id="desc_corta" maxLength={200} value={nuevaConfig.desc_corta} onChange={(e) => setNuevaConfig({...nuevaConfig, desc_corta: e.target.value})} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="desc_larga">Descripción Larga</Label>
                            <Textarea id="desc_larga" maxLength={1000} value={nuevaConfig.desc_larga} onChange={(e) => setNuevaConfig({...nuevaConfig, desc_larga: e.target.value})} rows={2} />
                        </div>

                        <div className="space-y-2">
                            <Label>Estado</Label>
                            <Select value={nuevaConfig.est_config} onValueChange={(val) => setNuevaConfig({...nuevaConfig, est_config: val})}>
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

            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-red-600" /> Confirmar Eliminación</DialogTitle>
                        <DialogDescription>¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="flex-1" disabled={loadingSave}>Cancelar</Button>
                        <Button onClick={handleEliminar} className="flex-1 bg-red-600 hover:bg-red-700" disabled={loadingSave}>
                            {loadingSave ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />} Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}