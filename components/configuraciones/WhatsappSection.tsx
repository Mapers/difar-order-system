'use client'

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Edit, RefreshCw, Save, MessageCircle, PowerOff, Power, Users, MapPin, Globe } from "lucide-react"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import apiClient from "@/app/api/client"
import { WhatsappConfig, TipoFiltroWhatsapp } from "@/app/types/config-types"
import { ClientService } from "@/app/services/client/ClientService"
import { toast } from "@/app/hooks/useToast"
import MultiSelectFilter, { OptionItem } from "@/components/configuraciones/MultiSelectFilter"

interface WhatsappSectionProps {
    onOpenModalChange: (fn: () => void) => void
}

// Normaliza un valor entrante (array, string JSON o null) a array de strings.
const toArr = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.map(String)
    if (typeof v === "string" && v.trim()) {
        try {
            const p = JSON.parse(v)
            return Array.isArray(p) ? p.map(String) : []
        } catch {
            return []
        }
    }
    return []
}

export default function WhatsappSection({ onOpenModalChange }: WhatsappSectionProps) {
    const [items, setItems] = useState<WhatsappConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingSave, setLoadingSave] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editando, setEditando] = useState<WhatsappConfig | null>(null)
    const [form, setForm] = useState({ numero: "", nombre: "", descripcion: "" })
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Filtro de destinatarios
    const [tipoFiltro, setTipoFiltro] = useState<TipoFiltroWhatsapp>("TODOS")
    const [clientesSel, setClientesSel] = useState<string[]>([])
    const [zonasSel, setZonasSel] = useState<string[]>([])

    // Opciones (se cargan una sola vez, al abrir el modal)
    const [zonaOptions, setZonaOptions] = useState<OptionItem[]>([])
    const [clienteOptions, setClienteOptions] = useState<OptionItem[]>([])
    const [optsLoaded, setOptsLoaded] = useState(false)
    const [loadingOpts, setLoadingOpts] = useState(false)

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

    const cargarOpciones = useCallback(async () => {
        if (optsLoaded) return
        setLoadingOpts(true)
        try {
            const [zRes, cRes] = await Promise.all([
                ClientService.getZones(),
                ClientService.getAllClientsByCodVendedor(null, "1", null),
            ])
            const zonas: OptionItem[] = (zRes?.data || [])
                .map((z: any) => ({ value: String(z.IdZona ?? ""), label: z.NombreZona || String(z.IdZona ?? "") }))
                .filter((z: OptionItem) => z.value)
            const clientes: OptionItem[] = (cRes?.data || [])
                .map((c: any) => {
                    const codigo = String(c.codigo ?? c.Codigo ?? "")
                    const nombre = c.cliente_nombre ?? c.razonSocial ?? c.Nombre ?? c.nombre ?? "Sin nombre"
                    return { value: codigo, label: `${nombre} (${codigo})` }
                })
                .filter((c: OptionItem) => c.value)
            setZonaOptions(zonas)
            setClienteOptions(clientes)
            setOptsLoaded(true)
        } catch {
            toast({ title: "Error", description: "No se pudieron cargar zonas/clientes.", variant: "destructive" })
        } finally {
            setLoadingOpts(false)
        }
    }, [optsLoaded])

    const abrirModalNuevo = useCallback(() => {
        setEditando(null)
        setForm({ numero: "", nombre: "", descripcion: "" })
        setTipoFiltro("TODOS")
        setClientesSel([])
        setZonasSel([])
        setErrors({})
        setIsModalOpen(true)
        cargarOpciones()
    }, [cargarOpciones])

    useEffect(() => { onOpenModalChange(abrirModalNuevo) }, [onOpenModalChange, abrirModalNuevo])

    const abrirModalEditar = (item: WhatsappConfig) => {
        setEditando(item)
        setForm({ numero: item.numero, nombre: item.nombre, descripcion: item.descripcion || "" })
        setTipoFiltro((item.tipo_filtro as TipoFiltroWhatsapp) || "TODOS")
        setClientesSel(toArr(item.clientes_filtro))
        setZonasSel(toArr(item.zonas_filtro))
        setErrors({})
        setIsModalOpen(true)
        cargarOpciones()
    }

    const handleGuardar = async () => {
        const newErrors: Record<string, string> = {}
        if (!form.numero.trim()) newErrors.numero = "Requerido"
        else if (!/^\d{9,15}$/.test(form.numero.replace(/\s/g, ""))) newErrors.numero = "Número inválido (9-15 dígitos)"
        if (!form.nombre.trim()) newErrors.nombre = "Requerido"
        if (tipoFiltro === "ZONA" && zonasSel.length === 0) newErrors.filtro = "Selecciona al menos una zona"
        if (tipoFiltro === "CLIENTE" && clientesSel.length === 0) newErrors.filtro = "Selecciona al menos un cliente"
        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) return

        const payload = {
            numero: form.numero,
            nombre: form.nombre,
            descripcion: form.descripcion,
            tipo_filtro: tipoFiltro,
            clientes_filtro: tipoFiltro === "CLIENTE" ? clientesSel : [],
            zonas_filtro: tipoFiltro === "ZONA" ? zonasSel : [],
        }

        setLoadingSave(true)
        try {
            if (editando) {
                await apiClient.put(`/admin/actualizar/whatsapp-config/${editando.id_whatsapp}`, payload)
                toast({ title: "✓ Actualizado", description: "Número actualizado correctamente." })
            } else {
                await apiClient.post("/admin/crear/whatsapp-config", payload)
                toast({ title: "✓ Registrado", description: "Número registrado correctamente." })
            }
            setIsModalOpen(false)
            fetchItems()
        } catch (error: any) {
            const msg = error?.response?.data?.message || "No se pudo guardar el número."
            toast({ title: "Error", description: msg, variant: "destructive" })
        } finally {
            setLoadingSave(false)
        }
    }

    const handleToggle = async (item: WhatsappConfig) => {
        try {
            await apiClient.put(`/admin/toggle/whatsapp-config/${item.id_whatsapp}`)
            fetchItems()
        } catch {
            toast({ title: "Error", description: "No se pudo cambiar el estado.", variant: "destructive" })
        }
    }

    const renderFiltroBadge = (item: WhatsappConfig) => {
        if (item.tipo_filtro === "ZONA") {
            return (
                <Badge variant="outline" className="text-xs gap-1">
                    <MapPin className="h-3 w-3" /> Zonas: {toArr(item.zonas_filtro).length}
                </Badge>
            )
        }
        if (item.tipo_filtro === "CLIENTE") {
            return (
                <Badge variant="outline" className="text-xs gap-1">
                    <Users className="h-3 w-3" /> Clientes: {toArr(item.clientes_filtro).length}
                </Badge>
            )
        }
        return (
            <Badge variant="outline" className="text-xs gap-1">
                <Globe className="h-3 w-3" /> Todas las ventas
            </Badge>
        )
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
                                            <p className="font-semibold text-sm text-card-foreground">{item.nombre}</p>
                                            <p className="text-xs text-muted-foreground font-mono">+51 {item.numero}</p>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={item.est_whatsapp === "A" ? "default" : "secondary"}
                                        className={item.est_whatsapp === "A" ? "bg-green-100 text-green-700 border-green-200" : ""}
                                    >
                                        {item.est_whatsapp === "A" ? "Activo" : "Inactivo"}
                                    </Badge>
                                </div>

                                <div className="mb-3">{renderFiltroBadge(item)}</div>

                                {item.descripcion && (
                                    <p className="text-xs text-muted-foreground mb-3 bg-muted rounded p-2">{item.descripcion}</p>
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
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No hay números registrados</h3>
                    <p className="text-sm text-muted-foreground">Registra un número de WhatsApp para recibir notificaciones de ventas.</p>
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
                                placeholder="Ej: 987654321"
                                value={form.numero}
                                onChange={(e) => setForm({ ...form, numero: e.target.value.replace(/\D/g, "") })}
                                className={errors.numero ? "border-red-500" : ""}
                                maxLength={15}
                            />
                            {errors.numero && <p className="text-xs text-red-500">{errors.numero}</p>}
                            <p className="text-xs text-muted-foreground">Ingresa el número sin el código de país (+51). Ej: 987654321</p>
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

                        <div className="space-y-2">
                            <Label>¿Qué notificaciones recibe?</Label>
                            <Tabs value={tipoFiltro} onValueChange={(v) => setTipoFiltro(v as TipoFiltroWhatsapp)}>
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="TODOS" className="text-xs">Todos</TabsTrigger>
                                    <TabsTrigger value="ZONA" className="text-xs">Zonas</TabsTrigger>
                                    <TabsTrigger value="CLIENTE" className="text-xs">Clientes</TabsTrigger>
                                </TabsList>

                                <TabsContent value="TODOS" className="pt-2">
                                    <p className="text-xs text-muted-foreground">Recibirá la notificación de todas las ventas.</p>
                                </TabsContent>

                                <TabsContent value="ZONA" className="pt-2 space-y-1">
                                    <MultiSelectFilter
                                        options={zonaOptions}
                                        selected={zonasSel}
                                        onChange={setZonasSel}
                                        placeholder="Seleccionar zonas..."
                                        searchPlaceholder="Buscar zona..."
                                        emptyText="No se encontraron zonas"
                                        loading={loadingOpts}
                                    />
                                    <p className="text-xs text-muted-foreground">Solo recibirá ventas de las zonas seleccionadas.</p>
                                </TabsContent>

                                <TabsContent value="CLIENTE" className="pt-2 space-y-1">
                                    <MultiSelectFilter
                                        options={clienteOptions}
                                        selected={clientesSel}
                                        onChange={setClientesSel}
                                        placeholder="Seleccionar clientes..."
                                        searchPlaceholder="Buscar cliente o documento..."
                                        emptyText="No se encontraron clientes"
                                        loading={loadingOpts}
                                    />
                                    <p className="text-xs text-muted-foreground">Solo recibirá ventas de los clientes seleccionados.</p>
                                </TabsContent>
                            </Tabs>
                            {errors.filtro && <p className="text-xs text-red-500">{errors.filtro}</p>}
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
