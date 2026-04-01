'use client'

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Edit, Trash2, RefreshCw, Save, AlertCircle, FileText } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/context/authContext"
import apiClient from "@/app/api/client"
import { DOCUMENT_TYPES, Sequential } from "@/app/types/config-types"

interface SequentialSectionProps {
    sectionType: "secuenciales" | "guias" | "otros_correlativos";
    onOpenModalChange: (fn: () => void) => void;
}

export default function SequentialSection({ sectionType, onOpenModalChange }: SequentialSectionProps) {
    const { user } = useAuth()
    const [sequentials, setSequentials] = useState<Sequential[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingSave, setLoadingSave] = useState(false)
    const [isSequentialModalOpen, setIsSequentialModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [sequentialEditando, setSequentialEditando] = useState<Sequential | null>(null)
    const [itemToDelete, setItemToDelete] = useState<Sequential | null>(null)
    const [errors, setErrors] = useState<{[key: string]: string}>({})

    const [nuevoSequential, setNuevoSequential] = useState({
        nombre: "", tipo: "", descripcion: "", prefijo: "", valorActual: 1, activo: true
    })

    const getTypeName = (code: string) => {
        const doc = DOCUMENT_TYPES.find(d => d.value === code)
        return doc ? doc.label : code
    }

    const fetchSequentials = useCallback(async () => {
        setLoading(true)
        try {
            const response = await apiClient.get(`/admin/listar/${sectionType}`)
            setSequentials(response.data?.data || [])
        } catch (error) {
            console.error("Error fetching data:", error)
            setSequentials([])
        } finally {
            setLoading(false)
        }
    }, [sectionType])

    useEffect(() => {
        fetchSequentials()
    }, [fetchSequentials])

    const abrirModalNuevoSequential = useCallback(() => {
        setSequentialEditando(null)
        setNuevoSequential({ nombre: "", tipo: "", descripcion: "", prefijo: "", valorActual: 1, activo: true })
        setErrors({})
        setIsSequentialModalOpen(true)
    }, [])

    useEffect(() => {
        onOpenModalChange(abrirModalNuevoSequential)
    }, [abrirModalNuevoSequential, onOpenModalChange])

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

    const validateSequentialForm = () => {
        const newErrors: {[key: string]: string} = {}
        if (!nuevoSequential.nombre.trim()) newErrors.nombre = "Obligatorio"
        if (sectionType === "secuenciales" && !nuevoSequential.tipo) newErrors.tipo = "Obligatorio"
        if (!nuevoSequential.prefijo.trim()) newErrors.prefijo = "Obligatorio"
        if (nuevoSequential.valorActual < 0) newErrors.valorActual = "Debe ser >= 0"
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleGuardarSequential = async () => {
        if (!validateSequentialForm()) return
        setLoadingSave(true)
        try {
            const payload = { ...nuevoSequential, tipo: sectionType === "secuenciales" ? nuevoSequential.tipo : null, usuMod: user?.nombreCompleto }
            if (sequentialEditando) {
                const res = await apiClient.put(`/admin/actualizar/${sectionType}/${sequentialEditando.id}`, payload)
                if (res.data.success) {
                    setIsSequentialModalOpen(false)
                    fetchSequentials()
                }
            } else {
                const res = await apiClient.post(`/admin/crear/${sectionType}`, payload)
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

    const confirmarEliminacion = (item: Sequential) => {
        setItemToDelete(item)
        setIsDeleteModalOpen(true)
    }

    const handleEliminar = async () => {
        if (!itemToDelete) return
        setLoadingSave(true)
        try {
            const res = await apiClient.delete(`/admin/eliminar/${sectionType}/${itemToDelete.id}`)
            if (res.data.success) fetchSequentials()
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
            {sequentials.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sequentials.map((sequential) => (
                        <Card key={sequential.id} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-semibold text-lg text-gray-900 break-words">{sequential.nombre}</h3>
                                            {sectionType === "secuenciales" && sequential.tipo && (
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
            )}

            <Dialog open={isSequentialModalOpen} onOpenChange={setIsSequentialModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {sequentialEditando ? 'Editar' : 'Nuevo'} {
                            sectionType === "secuenciales" ? "Comprobante" :
                                sectionType === "guias" ? "Guía" : "Correlativo"
                        }
                        </DialogTitle>
                        <DialogDescription>Configuración de numeración</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nombre">Nombre *</Label>
                                <Input id="nombre" placeholder="Ej: Factura Principal" value={nuevoSequential.nombre} onChange={(e) => setNuevoSequential({...nuevoSequential, nombre: e.target.value})} className={errors.nombre ? "border-red-500" : ""} />
                            </div>

                            {sectionType === "secuenciales" && (
                                <div className="space-y-2">
                                    <Label>Tipo de Documento *</Label>
                                    <Select value={nuevoSequential.tipo} onValueChange={(val) => setNuevoSequential({...nuevoSequential, tipo: val})}>
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
                                <Input id="prefijo" placeholder="Ej: F001" value={nuevoSequential.prefijo} onChange={(e) => setNuevoSequential({...nuevoSequential, prefijo: e.target.value.toUpperCase()})} className={errors.prefijo ? "border-red-500" : ""} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="valorActual">Secuencial Actual *</Label>
                                <Input id="valorActual" type="number" min="0" value={nuevoSequential.valorActual} onChange={(e) => setNuevoSequential({...nuevoSequential, valorActual: parseInt(e.target.value) || 0})} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="descripcion">Descripción</Label>
                            <Textarea id="descripcion" value={nuevoSequential.descripcion} onChange={(e) => setNuevoSequential({...nuevoSequential, descripcion: e.target.value})} rows={3} />
                        </div>

                        <div className="flex items-center space-x-2">
                            <input type="checkbox" id="activo" checked={nuevoSequential.activo} onChange={(e) => setNuevoSequential({...nuevoSequential, activo: e.target.checked})} className="h-4 w-4 text-blue-600 rounded" />
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