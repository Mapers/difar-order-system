'use client'

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Edit, Trash2, RefreshCw, Save, AlertCircle, CreditCard, Check, ChevronDown } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import apiClient from "@/app/api/client"
import { useAuth } from "@/context/authContext"
import { fetchGetAllClients, fetchGetConditions } from "@/app/api/takeOrders";
import { IClient, ICondicion } from "@/interface/order/client-interface";

interface ClientConditionsSectionProps {
    onOpenModalChange: (fn: () => void) => void;
}

export default function ClientConditionsSection({ onOpenModalChange }: ClientConditionsSectionProps) {
    const { user } = useAuth();
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingSave, setLoadingSave] = useState(false)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [itemEditando, setItemEditando] = useState<any>(null)
    const [itemToDelete, setItemToDelete] = useState<any>(null)
    const [errors, setErrors] = useState<{[key: string]: string}>({})

    const [form, setForm] = useState({ cliente_codigo: "", condicion_id: "", condicion_nombre: "", estado: "A" })

    const [clientOptions, setClientOptions] = useState<IClient[]>([])
    const [conditionOptions, setConditionOptions] = useState<ICondicion[]>([])
    const [openClient, setOpenClient] = useState(false)
    const [openCondition, setOpenCondition] = useState(false)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await apiClient.get(`/admin/listar/condiciones-cliente`)
            setData(res.data?.data || [])
        } catch (error) {
            console.error("Error", error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const isAdmin = [2, 3].includes(user?.idRol || 0);
                const sellerCode = isAdmin ? "" : (user?.codigo || "");
                const resCli = await fetchGetAllClients(sellerCode, isAdmin);
                const clientes = resCli.data?.data?.data || resCli.data?.data || [];
                setClientOptions(clientes);

                const resCond = await fetchGetConditions("");
                const condiciones = resCond.data?.data?.data || resCond.data?.data || [];
                setConditionOptions(condiciones);
            } catch (error) { console.error("Error cargando catálogos", error); }
        };
        if(isModalOpen) loadInitialData();
    }, [isModalOpen, user]);

    const abrirModalNuevo = useCallback(() => {
        setItemEditando(null)
        setForm({ cliente_codigo: "", condicion_id: "", condicion_nombre: "", estado: "A" })
        setErrors({})
        setIsModalOpen(true)
    }, [])

    useEffect(() => { onOpenModalChange(abrirModalNuevo) }, [onOpenModalChange, abrirModalNuevo])

    const abrirModalEditar = (item: any) => {
        setItemEditando(item)
        setForm({
            cliente_codigo: item.cliente_codigo,
            condicion_id: item.condicion_id,
            condicion_nombre: item.condicion_nombre,
            estado: item.estado
        })
        setErrors({})
        setIsModalOpen(true)
    }

    const handleGuardar = async () => {
        const newErrors: {[key: string]: string} = {}
        if (!form.cliente_codigo && !itemEditando) newErrors.cliente = "Debe seleccionar un cliente"
        if (!form.condicion_id) newErrors.condicion = "Debe seleccionar una condición"
        setErrors(newErrors)

        if (Object.keys(newErrors).length > 0) return

        setLoadingSave(true)
        try {
            if (itemEditando) {
                const res = await apiClient.put(`/admin/actualizar/condiciones-cliente/${itemEditando.id}`, form)
                if (res.data.success) { setIsModalOpen(false); fetchData(); }
            } else {
                const res = await apiClient.post(`/admin/crear/condiciones-cliente`, form)
                if (res.data.success) { setIsModalOpen(false); fetchData(); }
            }
        } catch (error) { console.error("Error al guardar:", error) }
        finally { setLoadingSave(false) }
    }

    const confirmarEliminacion = (item: any) => { setItemToDelete(item); setIsDeleteModalOpen(true) }

    const handleEliminar = async () => {
        if (!itemToDelete) return
        setLoadingSave(true)
        try {
            const res = await apiClient.delete(`/admin/eliminar/condiciones-cliente/${itemToDelete.id}`)
            if (res.data.success) fetchData()
            setIsDeleteModalOpen(false)
            setItemToDelete(null)
        } catch (error) { console.error("Error al eliminar:", error) }
        finally { setLoadingSave(false) }
    }

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
            </div>
        )
    }

    return (
        <>
            {data.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {data.map((item) => (
                        <Card key={item.id} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm text-gray-900 truncate">{item.cliente_nombre}</h3>
                                        <p className="text-xs text-gray-500">RUC: {item.RUC}</p>
                                    </div>
                                    <Badge variant={item.estado === 'A' ? "default" : "secondary"} className="ml-2">
                                        {item.estado === 'A' ? "Activo" : "Inactivo"}
                                    </Badge>
                                </div>

                                <div className="bg-slate-50 border border-slate-100 p-2 rounded-md mb-3 mt-2">
                                    <p className="text-xs text-slate-500 font-semibold mb-0.5">Condición de Pago:</p>
                                    <p className="text-sm font-medium text-slate-800">{item.condicion_nombre}</p>
                                </div>

                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => abrirModalEditar(item)} className="flex-1 text-xs">
                                        <Edit className="h-3 w-3 mr-1" /> Editar
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => confirmarEliminacion(item)} className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs flex-1 border-red-200">
                                        <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay condiciones asignadas a clientes</h3>
                </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-xl overflow-visible">
                    <DialogHeader>
                        <DialogTitle>{itemEditando ? 'Editar' : 'Asignar'} Condición a Cliente</DialogTitle>
                        <DialogDescription>Vincula una condición de pago a un cliente específico.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {!itemEditando && (
                            <div className="space-y-2 flex flex-col relative">
                                <Label>Cliente *</Label>
                                <Popover open={openClient} onOpenChange={setOpenClient}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className={cn("justify-between w-full font-normal h-10 bg-white", errors.cliente && "border-red-500")}>
                                            <span className="truncate">
                                                {form.cliente_codigo
                                                    ? clientOptions.find(c => c.codigo === form.cliente_codigo)?.Nombre
                                                    : "Buscar Cliente..."}
                                            </span>
                                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Escriba RUC o Nombre..." />
                                            <CommandList>
                                                <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                                                <CommandGroup>
                                                    {clientOptions.map((cli) => (
                                                        <CommandItem
                                                            key={cli.codigo}
                                                            value={`${cli.RUC} ${cli.Nombre}`}
                                                            onSelect={() => {
                                                                setForm({ ...form, cliente_codigo: cli.codigo });
                                                                setOpenClient(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", form.cliente_codigo === cli.codigo ? "opacity-100" : "opacity-0")} />
                                                            {cli.RUC} - {cli.Nombre}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {errors.cliente && <p className="text-xs text-red-500">{errors.cliente}</p>}
                            </div>
                        )}

                        <div className="space-y-2 flex flex-col relative">
                            <Label>Condición de Pago *</Label>
                            <Popover open={openCondition} onOpenChange={setOpenCondition}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className={cn("justify-between w-full font-normal h-10 bg-white", errors.condicion && "border-red-500")}>
                                        <span className="truncate">
                                            {form.condicion_id ? form.condicion_nombre : "Seleccionar Condición..."}
                                        </span>
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Buscar condición..." />
                                        <CommandList>
                                            <CommandEmpty>No se encontró condición.</CommandEmpty>
                                            <CommandGroup>
                                                {conditionOptions.map((cond) => (
                                                    <CommandItem
                                                        key={cond.CodigoCondicion}
                                                        value={cond.Descripcion}
                                                        onSelect={() => {
                                                            setForm({
                                                                ...form,
                                                                condicion_id: cond.CodigoCondicion,
                                                                condicion_nombre: cond.Descripcion
                                                            });
                                                            setOpenCondition(false);
                                                        }}
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", form.condicion_id === cond.CodigoCondicion ? "opacity-100" : "opacity-0")} />
                                                        {cond.Descripcion}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {errors.condicion && <p className="text-xs text-red-500">{errors.condicion}</p>}
                        </div>

                        {itemEditando && (
                            <div className="space-y-2">
                                <Label>Estado</Label>
                                <Select value={form.estado} onValueChange={(val) => setForm({...form, estado: val})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="A">Activo (A)</SelectItem>
                                        <SelectItem value="I">Inactivo (I)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={loadingSave}>Cancelar</Button>
                        <Button onClick={handleGuardar} disabled={loadingSave}>
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
                        <DialogDescription>¿Estás seguro de que deseas desvincular esta condición de pago del cliente?</DialogDescription>
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