'use client'

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Edit, RefreshCw, Save, MessageCircle, PowerOff, Power } from "lucide-react"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import apiClient from "@/app/api/client"
import { WhatsappConfig } from "@/app/types/config-types"

interface WhatsappSectionProps {
    onOpenModalChange: (fn: () => void) => void
}

export default function WhatsappSection({ onOpenModalChange }: WhatsappSectionProps) {
    const [items, setItems] = useState<WhatsappConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingSave, setLoadingSave] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editando, setEditando] = useState<WhatsappConfig | null>(null)
    const [form, setForm] = useState({ numero: "", nombre: "", descripcion: "" })
    const [errors, setErrors] = useState<Record<string, string>>({})

    const fetchItems = async () => {
        setLoading(true)
        try {
            const res = await apiClient.get("/admin/listar/whatsapp-config")
            setItems(res.data?.data || [])
        } catch {
            setItems([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchItems() }, [])

    const abrirModalNuevo = useCallback(() => {
        setEditando(null)
        setForm({ numero: "", nombre: "", descripcion: "" })
        setErrors({})
        setIsModalOpen(true)
    }, [])

    useEffect(() => { onOpenModalChange(abrirModalNuevo) }, [onOpenModalChange, abrirModalNuevo])

    const abrirModalEditar = (item: WhatsappConfig) => {
        setEditando(item)
        setForm({ numero: item.numero, nombre: item.nombre, descripcion: item.descripcion || "" })
        setErrors({})
        setIsModalOpen(true)
    }

    const handleGuardar = async () => {
        const newErrors: Record<string, string> = {}
        if (!form.numero.trim()) newErrors.numero = "Requerido"
        else if (!/^\d{9,15}$/.test(form.numero.replace(/\s/g, ""))) newErrors.numero = "Número inválido (9-15 dígitos)"
        if (!form.nombre.trim()) newErrors.nombre = "Requerido"
        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) return

        setLoadingSave(true)
        try {
            if (editando) {
                await apiClient.put(`/admin/actualizar/whatsapp-config/${editando.id_whatsapp}`, form)
            } else {
                await apiClient.post("/admin/crear/whatsapp-config", form)
            }
            setIsModalOpen(false)
            fetchItems()
        } catch {
            // handled silently
        } finally {
            setLoadingSave(false)
        }
    }

    const handleToggle = async (item: WhatsappConfig) => {
        try {
            await apiClient.put(`/admin/toggle/whatsapp-config/${item.id_whatsapp}`)
            fetchItems()
        } catch {
            // handled silently
        }
    }

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 w-full" />)}
            </div>
        )
    }

    return (
        <>
            {items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((item) => (
                        <Card key={item.id_whatsapp} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <MessageCircle className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-gray-900">{item.nombre}</p>
                                            <p className="text-xs text-gray-500 font-mono">+51 {item.numero}</p>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={item.est_whatsapp === "A" ? "default" : "secondary"}
                                        className={item.est_whatsapp === "A" ? "bg-green-100 text-green-700 border-green-200" : ""}
                                    >
                                        {item.est_whatsapp === "A" ? "Activo" : "Inactivo"}
                                    </Badge>
                                </div>

                                {item.descripcion && (
                                    <p className="text-xs text-gray-500 mb-3 bg-gray-50 rounded p-2">{item.descripcion}</p>
                                )}

                                <div className="flex gap-2 mt-3">
                                    <Button variant="outline" size="sm" onClick={() => abrirModalEditar(item)} className="flex-1 text-xs">
                                        <Edit className="h-3 w-3 mr-1" /> Editar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggle(item)}
                                        className={`flex-1 text-xs ${item.est_whatsapp === "A"
                                            ? "text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                            : "text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                        }`}
                                    >
                                        {item.est_whatsapp === "A"
                                            ? <><PowerOff className="h-3 w-3 mr-1" /> Desactivar</>
                                            : <><Power className="h-3 w-3 mr-1" /> Activar</>
                                        }
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay números registrados</h3>
                    <p className="text-sm text-gray-500">Registra un número de WhatsApp para recibir notificaciones de ventas.</p>
                </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editando ? "Editar" : "Nuevo"} WhatsApp</DialogTitle>
                        <DialogDescription>Número que recibirá notificaciones de ventas.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="numero">Número *</Label>
                            <Input
                                id="numero"
                                placeholder="Ej: 51987654321"
                                value={form.numero}
                                onChange={(e) => setForm({ ...form, numero: e.target.value.replace(/\D/g, "") })}
                                className={errors.numero ? "border-red-500" : ""}
                                maxLength={15}
                            />
                            {errors.numero && <p className="text-xs text-red-500">{errors.numero}</p>}
                            <p className="text-xs text-gray-400">Incluye código de país sin el +51. Ej: 987654321</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nombre">Nombre / Etiqueta *</Label>
                            <Input
                                id="nombre"
                                placeholder="Ej: Gerencia, Ventas Lima"
                                value={form.nombre}
                                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                className={errors.nombre ? "border-red-500" : ""}
                                maxLength={100}
                            />
                            {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="descripcion">Descripción (opcional)</Label>
                            <Input
                                id="descripcion"
                                placeholder="Ej: Notificaciones de pedidos zona norte"
                                value={form.descripcion}
                                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                                maxLength={200}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={loadingSave}>Cancelar</Button>
                        <Button onClick={handleGuardar} disabled={loadingSave}>
                            {loadingSave && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                            <Save className="h-4 w-4 mr-2" /> Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
