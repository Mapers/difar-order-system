'use client'

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
    Edit, Trash2, RefreshCw, Save, AlertCircle, Calendar, Factory,
    Users, Pill, ChevronRight, CheckCircle, XCircle, ChevronDown, Check,
    X, Search, Package
} from "lucide-react"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    ICiclo, ICicloForm,
    IMetaLaboratorio, IMetaLaboratorioForm,
    IMetaVendedor, IMetaVendedorForm,
    IMetaItem, IMetaItemForm
} from "@/app/types/metas-types"
import {MetasService} from "@/app/services/reports/metasService";
import {formatSafeDate} from "@/app/utils/date";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import {cn} from "@/lib/utils";
import {getProductsRequest} from "@/app/api/products";
import {useAuth} from "@/context/authContext";
import apiClient from "@/app/api/client";

interface MetasConfigSectionProps {
    onOpenModalChange: (fn: () => void) => void;
}

type SubTab = 'ciclos' | 'laboratorios' | 'vendedores' | 'items';

const subTabs: { id: SubTab; label: string; icon: any; description: string }[] = [
    { id: 'ciclos', label: 'Ciclos', icon: Calendar, description: 'Períodos de metas' },
    { id: 'laboratorios', label: 'Laboratorios', icon: Factory, description: 'Metas por laboratorio' },
    { id: 'vendedores', label: 'Vendedores', icon: Users, description: 'Metas por vendedor' },
    { id: 'items', label: 'Productos', icon: Pill, description: 'Metas por producto' },
];

const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const MESES_CORTO = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const fmtMoney = (n: number) => "S/ " + Number(n).toLocaleString("es-PE", { minimumFractionDigits: 2 })

export default function MetasConfigSection({ onOpenModalChange }: MetasConfigSectionProps) {
    const [activeSubTab, setActiveSubTab] = useState<SubTab>('ciclos');

    return (
        <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
                {subTabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeSubTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                                isActive
                                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200 hover:text-blue-600'
                            }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeSubTab === 'ciclos' && <CiclosSection onOpenModalChange={onOpenModalChange} />}
            {activeSubTab === 'laboratorios' && <LaboratoriosSection onOpenModalChange={onOpenModalChange} />}
            {activeSubTab === 'vendedores' && <VendedoresSection onOpenModalChange={onOpenModalChange} />}
            {activeSubTab === 'items' && <ItemsSection onOpenModalChange={onOpenModalChange} />}
        </div>
    );
}

/* ═══════════════════════════════════════════════
   CICLOS SECTION
   ═══════════════════════════════════════════════ */

function CiclosSection({ onOpenModalChange }: { onOpenModalChange: (fn: () => void) => void }) {
    const [data, setData] = useState<ICiclo[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingSave, setLoadingSave] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [editando, setEditando] = useState<ICiclo | null>(null)
    const [itemToDelete, setItemToDelete] = useState<ICiclo | null>(null)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const { user } = useAuth()

    const [form, setForm] = useState<ICicloForm>({
        anio: new Date().getFullYear(), mes: new Date().getMonth() + 1,
        fecha_inicio: '', fecha_fin: '', usuario: user?.nombreCompleto || 'WEB'
    })

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await MetasService.listarCiclos()
            setData(res?.data?.data || res?.data || [])
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const abrirModalNuevo = useCallback(() => {
        setEditando(null)
        const now = new Date()
        const y = now.getFullYear(), m = now.getMonth() + 1
        const lastDay = new Date(y, m, 0).getDate()
        setForm({
            anio: y, mes: m,
            fecha_inicio: `${y}-${String(m).padStart(2, '0')}-01`,
            fecha_fin: `${y}-${String(m).padStart(2, '0')}-${lastDay}`,
            usuario: user?.nombreCompleto || 'WEB'
        })
        setErrors({})
        setIsModalOpen(true)
    }, [])

    useEffect(() => { onOpenModalChange(abrirModalNuevo) }, [onOpenModalChange, abrirModalNuevo])

    const abrirEditar = (item: ICiclo) => {
        setEditando(item)
        setForm({
            anio: item.anio, mes: item.mes,
            fecha_inicio: item.fecha_inicio?.split('T')[0] || '',
            fecha_fin: item.fecha_fin?.split('T')[0] || '',
            usuario: user?.nombreCompleto || 'WEB'
        })
        setErrors({})
        setIsModalOpen(true)
    }

    const handleMesChange = (mes: number) => {
        const y = form.anio
        const lastDay = new Date(y, mes, 0).getDate()
        setForm({
            ...form, mes,
            fecha_inicio: `${y}-${String(mes).padStart(2, '0')}-01`,
            fecha_fin: `${y}-${String(mes).padStart(2, '0')}-${lastDay}`
        })
    }

    const handleGuardar = async () => {
        const newErrors: Record<string, string> = {}
        if (!form.fecha_inicio) newErrors.fecha_inicio = "Requerido"
        if (!form.fecha_fin) newErrors.fecha_fin = "Requerido"
        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) return

        setLoadingSave(true)
        try {
            if (editando) {
                await MetasService.actualizarCiclo(editando.id_ciclo, { ...form, estado: editando.estado })
            } else {
                await MetasService.crearCiclo(form)
            }
            setIsModalOpen(false)
            fetchData()
        } catch (e) { console.error(e) }
        finally { setLoadingSave(false) }
    }

    const cambiarEstado = async (item: ICiclo) => {
        const nuevoEstado = item.estado === 'ABIERTO' ? 'CERRADO' : 'ABIERTO'
        try {
            await MetasService.cambiarEstadoCiclo(item.id_ciclo, { estado: nuevoEstado, usuario: user?.nombreCompleto || 'WEB' })
            fetchData()
        } catch (e) { console.error(e) }
    }

    const handleEliminar = async () => {
        if (!itemToDelete) return
        setLoadingSave(true)
        try {
            await MetasService.actualizarCiclo(itemToDelete.id_ciclo, {})
            await fetch(`/api/metas/ciclos/${itemToDelete.id_ciclo}`, { method: 'DELETE' })
            setIsDeleteModalOpen(false)
            fetchData()
        } catch (e) { console.error(e) }
        finally { setLoadingSave(false) }
    }

    if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36" />)}</div>

    return (
        <>
            {data.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {data.map((item: ICiclo) => (
                        <Card key={item.id_ciclo} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-base text-gray-900">{MESES[item.mes]} {item.anio}</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {formatSafeDate(item.fecha_inicio?.split('T')[0])} → {formatSafeDate(item.fecha_fin?.split('T')[0])}
                                        </p>
                                    </div>
                                    <Badge variant={item.estado === 'ABIERTO' ? "default" : "secondary"}
                                           className={item.estado === 'ABIERTO' ? 'bg-emerald-100 text-emerald-800' : ''}>
                                        {item.estado === 'ABIERTO' ? '🟢 Abierto' : '🔴 Cerrado'}
                                    </Badge>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <Button variant="outline" size="sm" onClick={() => abrirEditar(item)} className="flex-1 text-xs">
                                        <Edit className="h-3 w-3 mr-1" /> Editar
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => cambiarEstado(item)}
                                            className={`flex-1 text-xs ${item.estado === 'ABIERTO' ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}>
                                        {item.estado === 'ABIERTO'
                                            ? <><XCircle className="h-3 w-3 mr-1" /> Cerrar</>
                                            : <><CheckCircle className="h-3 w-3 mr-1" /> Abrir</>}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => { setItemToDelete(item); setIsDeleteModalOpen(true) }}
                                            className="text-red-600 border-red-200 hover:bg-red-50 text-xs">
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay ciclos registrados</h3>
                    <p className="text-sm text-gray-500">Crea un nuevo ciclo para comenzar a asignar metas</p>
                </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editando ? 'Editar' : 'Nuevo'} Ciclo de Metas</DialogTitle>
                        <DialogDescription>Define el período mensual para las metas comerciales</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Año *</Label>
                                <Input type="number" min={2020} max={2030} value={form.anio}
                                       onChange={e => setForm({ ...form, anio: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Mes *</Label>
                                <Select value={String(form.mes)} onValueChange={v => handleMesChange(Number(v))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {MESES.slice(1).map((m, i) => (
                                            <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Fecha Inicio *</Label>
                                <Input type="date" value={form.fecha_inicio}
                                       onChange={e => setForm({ ...form, fecha_inicio: e.target.value })}
                                       className={errors.fecha_inicio ? "border-red-500" : ""} />
                            </div>
                            <div className="space-y-2">
                                <Label>Fecha Fin *</Label>
                                <Input type="date" value={form.fecha_fin}
                                       onChange={e => setForm({ ...form, fecha_fin: e.target.value })}
                                       className={errors.fecha_fin ? "border-red-500" : ""} />
                            </div>
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

            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-red-600" /> Confirmar Eliminación</DialogTitle>
                        <DialogDescription>¿Eliminar este ciclo? Se borrarán todas las metas asociadas.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={loadingSave}>Cancelar</Button>
                        <Button onClick={handleEliminar} className="bg-red-600 hover:bg-red-700" disabled={loadingSave}>
                            {loadingSave ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />} Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

/* ═══════════════════════════════════════════════
   LABORATORIOS SECTION
   ═══════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════
   LABORATORIOS SECTION
   ═══════════════════════════════════════════════ */

function LaboratoriosSection({ onOpenModalChange }: { onOpenModalChange: (fn: () => void) => void }) {
    const [ciclos, setCiclos] = useState<ICiclo[]>([])
    const [selectedCiclo, setSelectedCiclo] = useState<string>('')
    const [data, setData] = useState<IMetaLaboratorio[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingSave, setLoadingSave] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [editando, setEditando] = useState<IMetaLaboratorio | null>(null)
    const [itemToDelete, setItemToDelete] = useState<IMetaLaboratorio | null>(null)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const { user } = useAuth()

    const [form, setForm] = useState({ id_linea_ge: '', lab_nombre: '', meta_monto: '', meta_clientes: '', observacion: '' })

    const [catLaboratorios, setCatLaboratorios] = useState<any[]>([])
    const [loadingLabs, setLoadingLabs] = useState(false)
    const [openLabPopover, setOpenLabPopover] = useState(false)

    useEffect(() => {
        MetasService.listarCiclos().then(res => {
            const list: ICiclo[] = res?.data?.data || res?.data || []
            setCiclos(list)
            const abierto = list.find(c => c.estado === 'ABIERTO')
            if (abierto) setSelectedCiclo(String(abierto.id_ciclo))
        }).catch(console.error)
    }, [])

    useEffect(() => {
        if (!isModalOpen || editando) return
        const cargarLabs = async () => {
            setLoadingLabs(true)
            try {
                const res = await apiClient.get('/price/laboratories')
                setCatLaboratorios(res.data?.data || [])
            } catch (e) { console.error("Error cargando laboratorios:", e) }
            finally { setLoadingLabs(false) }
        }
        cargarLabs()
    }, [isModalOpen, editando])

    const fetchData = useCallback(async () => {
        if (!selectedCiclo) return
        setLoading(true)
        try {
            const res = await MetasService.listarMetasLab(Number(selectedCiclo))
            setData(res?.data?.data || res?.data || [])
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }, [selectedCiclo])

    useEffect(() => { fetchData() }, [fetchData])

    const abrirModalNuevo = useCallback(() => {
        if (!selectedCiclo) return
        setEditando(null)
        setForm({ id_linea_ge: '', lab_nombre: '', meta_monto: '', meta_clientes: '', observacion: '' })
        setErrors({})
        setIsModalOpen(true)
    }, [selectedCiclo])

    useEffect(() => { onOpenModalChange(abrirModalNuevo) }, [onOpenModalChange, abrirModalNuevo])

    const abrirEditar = (item: IMetaLaboratorio) => {
        setEditando(item)
        setForm({
            id_linea_ge: String(item.id_linea_ge),
            lab_nombre: item.linea_desc || `Lab #${item.id_linea_ge}`,
            meta_monto: String(item.meta_monto),
            meta_clientes: String(item.meta_clientes),
            observacion: item.observacion || ''
        })
        setErrors({})
        setIsModalOpen(true)
    }

    const handleGuardar = async () => {
        const newErrors: Record<string, string> = {}
        if (!form.id_linea_ge) newErrors.id_linea_ge = "Debe seleccionar un laboratorio"
        if (!form.meta_monto) newErrors.meta_monto = "Requerido"
        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) return

        setLoadingSave(true)
        try {
            const payload: IMetaLaboratorioForm = {
                id_ciclo: Number(selectedCiclo),
                id_linea_ge: Number(form.id_linea_ge),
                meta_monto: Number(form.meta_monto),
                meta_clientes: Number(form.meta_clientes) || 0,
                observacion: form.observacion,
                usuario: user?.nombreCompleto || 'WEB'
            }
            if (editando) {
                await MetasService.actualizarMetaLab(editando.id_meta_lab, payload)
            } else {
                await MetasService.crearMetaLab(payload)
            }
            setIsModalOpen(false)
            fetchData()
        } catch (e) { console.error(e) }
        finally { setLoadingSave(false) }
    }

    const handleEliminar = async () => {
        if (!itemToDelete) return
        setLoadingSave(true)
        try {
            await MetasService.eliminarMetaLab(itemToDelete.id_meta_lab)
            setIsDeleteModalOpen(false)
            fetchData()
        } catch (e) { console.error(e) }
        finally { setLoadingSave(false) }
    }

    return (
        <>
            <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <Label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Ciclo:</Label>
                <Select value={selectedCiclo} onValueChange={setSelectedCiclo}>
                    <SelectTrigger className="w-[220px] h-9 text-sm bg-white"><SelectValue placeholder="Seleccionar ciclo" /></SelectTrigger>
                    <SelectContent>
                        {ciclos.map(c => (
                            <SelectItem key={c.id_ciclo} value={String(c.id_ciclo)}>
                                {MESES_CORTO[c.mes]} {c.anio}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {data.length > 0 && <Badge variant="outline" className="text-xs">{data.length} labs</Badge>}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36" />)}</div>
            ) : data.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {data.map((item: IMetaLaboratorio) => (
                        <Card key={item.id_meta_lab} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-sm text-gray-900">{item.linea_desc || `Lab #${item.id_linea_ge}`}</h3>
                                        <p className="text-xs text-gray-500">{item.observacion || 'Sin observación'}</p>
                                    </div>
                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                        {item.total_vendedores || 0} vendedor{(item.total_vendedores || 0) === 1 ? '' : 'es'}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 my-3">
                                    <div className="bg-slate-50 p-2 rounded-md">
                                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Meta S/</p>
                                        <p className="text-sm font-bold text-slate-800">{fmtMoney(item.meta_monto)}</p>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-md">
                                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Meta Clientes</p>
                                        <p className="text-sm font-bold text-slate-800">{item.meta_clientes}</p>
                                    </div>
                                </div>
                                {item.meta_distribuida !== undefined && (
                                    <div className="text-[10px] text-slate-400 mb-2">
                                        Distribuido: {fmtMoney(item.meta_distribuida!)} de {fmtMoney(item.meta_monto)}
                                        {Number(item.meta_distribuida) !== Number(item.meta_monto) &&
                                          <span className="text-amber-600 font-semibold ml-1">⚠ Diferencia</span>}
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => abrirEditar(item)} className="flex-1 text-xs">
                                        <Edit className="h-3 w-3 mr-1" /> Editar
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => { setItemToDelete(item); setIsDeleteModalOpen(true) }}
                                            className="text-red-600 border-red-200 hover:bg-red-50 text-xs flex-1">
                                        <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <Factory className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay metas de laboratorio</h3>
                </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editando ? 'Editar' : 'Nueva'} Meta de Laboratorio</DialogTitle>
                        <DialogDescription>Asigna la meta de ventas para un laboratorio en este ciclo</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {!editando ? (
                            <div className="space-y-2">
                                <Label>Laboratorio *</Label>
                                <Popover open={openLabPopover} onOpenChange={setOpenLabPopover}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox"
                                                className={cn("justify-between w-full font-normal h-10 bg-white", errors.id_linea_ge && "border-red-500")}>
                                            <span className="truncate">
                                                {form.id_linea_ge
                                                    ? form.lab_nombre
                                                    : "Buscar laboratorio..."}
                                            </span>
                                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Buscar por nombre..." />
                                            <CommandList>
                                                {loadingLabs && (
                                                    <div className="p-4 text-sm text-center text-muted-foreground">
                                                        <RefreshCw className="h-4 w-4 animate-spin inline mr-2" />Cargando laboratorios...
                                                    </div>
                                                )}
                                                {!loadingLabs && catLaboratorios.length === 0 && (
                                                    <CommandEmpty>No se encontraron laboratorios.</CommandEmpty>
                                                )}
                                                <CommandGroup>
                                                    {catLaboratorios.map((lab: any) => (
                                                        <CommandItem
                                                            key={lab.IdLineaGe}
                                                            value={`${lab.Codigo_Linea} ${lab.Descripcion}`}
                                                            onSelect={() => {
                                                                setForm(prev => ({
                                                                    ...prev,
                                                                    id_linea_ge: String(lab.Codigo_Linea),
                                                                    lab_nombre: lab.Descripcion
                                                                }))
                                                                setOpenLabPopover(false)
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4",
                                                                form.id_linea_ge === String(lab.IdLineaGe) ? "opacity-100" : "opacity-0"
                                                            )} />
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium">{lab.Descripcion}</span>
                                                                <span className="text-[10px] text-slate-400">Código: {lab.Codigo_Linea} · ID: {lab.IdLineaGe}</span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {errors.id_linea_ge && <p className="text-xs text-red-500">{errors.id_linea_ge}</p>}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Laboratorio</Label>
                                <Input value={`${form.lab_nombre} (ID: ${form.id_linea_ge})`} disabled className="bg-slate-50" />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Meta Monto (S/) *</Label>
                                <Input type="number" step="0.01" value={form.meta_monto}
                                       onChange={e => setForm({ ...form, meta_monto: e.target.value })}
                                       placeholder="25000.00" className={errors.meta_monto ? "border-red-500" : ""} />
                            </div>
                            <div className="space-y-2">
                                <Label>Meta Clientes</Label>
                                <Input type="number" value={form.meta_clientes}
                                       onChange={e => setForm({ ...form, meta_clientes: e.target.value })} placeholder="120" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Observación</Label>
                            <Textarea value={form.observacion} onChange={e => setForm({ ...form, observacion: e.target.value })}
                                      placeholder="Ej: Meta BIOS PERU Marzo 2026" rows={2} />
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

            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-red-600" /> Confirmar Eliminación</DialogTitle>
                        <DialogDescription>Se eliminarán todos los vendedores e ítems asociados.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={loadingSave}>Cancelar</Button>
                        <Button onClick={handleEliminar} className="bg-red-600 hover:bg-red-700" disabled={loadingSave}>
                            {loadingSave ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />} Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

/* ═══════════════════════════════════════════════
   VENDEDORES SECTION
   ═══════════════════════════════════════════════ */

function VendedoresSection({ onOpenModalChange }: { onOpenModalChange: (fn: () => void) => void }) {
    const [ciclos, setCiclos] = useState<ICiclo[]>([])
    const [selectedCiclo, setSelectedCiclo] = useState('')
    const [labs, setLabs] = useState<IMetaLaboratorio[]>([])
    const [selectedLab, setSelectedLab] = useState('')
    const [data, setData] = useState<IMetaVendedor[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingSave, setLoadingSave] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [editando, setEditando] = useState<IMetaVendedor | null>(null)
    const [itemToDelete, setItemToDelete] = useState<IMetaVendedor | null>(null)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [form, setForm] = useState({ cod_vendedor: '', nombre_vendedor: '', meta_monto: '', meta_clientes: '' })
    const { user } = useAuth()

    const [catVendedores, setCatVendedores] = useState<any[]>([])
    const [loadingVends, setLoadingVends] = useState(false)
    const [openVendPopover, setOpenVendPopover] = useState(false)

    useEffect(() => {
        MetasService.listarCiclos().then(res => {
            const list: ICiclo[] = res?.data?.data || res?.data || []
            setCiclos(list)
            const abierto = list.find(c => c.estado === 'ABIERTO')
            if (abierto) setSelectedCiclo(String(abierto.id_ciclo))
        }).catch(console.error)
    }, [])

    useEffect(() => {
        if (!selectedCiclo) return
        MetasService.listarMetasLab(Number(selectedCiclo)).then(res => {
            const list: IMetaLaboratorio[] = res?.data?.data || res?.data || []
            setLabs(list)
            if (list.length > 0) setSelectedLab(String(list[0].id_meta_lab))
        }).catch(console.error)
    }, [selectedCiclo])

    useEffect(() => {
        if (!isModalOpen || editando) return
        const cargarVendedores = async () => {
            setLoadingVends(true)
            try {
                const res = await apiClient.get('/usuarios/listar/vendedores')
                const vendsList = res.data?.data?.data || res.data?.data || []
                setCatVendedores(vendsList)
            } catch (e) { console.error("Error cargando vendedores:", e) }
            finally { setLoadingVends(false) }
        }
        cargarVendedores()
    }, [isModalOpen, editando])

    const fetchData = useCallback(async () => {
        if (!selectedLab) return
        setLoading(true)
        try {
            const res = await MetasService.listarMetasVend(Number(selectedLab))
            setData(res?.data?.data || res?.data || [])
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }, [selectedLab])

    useEffect(() => { fetchData() }, [fetchData])

    const abrirModalNuevo = useCallback(() => {
        if (!selectedLab) return
        setEditando(null)
        setForm({ cod_vendedor: '', nombre_vendedor: '', meta_monto: '', meta_clientes: '' })
        setErrors({})
        setIsModalOpen(true)
    }, [selectedLab])

    useEffect(() => { onOpenModalChange(abrirModalNuevo) }, [onOpenModalChange, abrirModalNuevo])

    const handleGuardar = async () => {
        const newErrors: Record<string, string> = {}
        if (!form.cod_vendedor) newErrors.cod_vendedor = "Debe seleccionar un vendedor"
        if (!form.meta_monto) newErrors.meta_monto = "Requerido"
        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) return

        setLoadingSave(true)
        try {
            const payload: IMetaVendedorForm = {
                id_meta_lab: Number(selectedLab),
                cod_vendedor: form.cod_vendedor,
                meta_monto: Number(form.meta_monto),
                meta_clientes: Number(form.meta_clientes) || 0,
                usuario: user?.nombreCompleto || 'WEB'
            }
            if (editando) await MetasService.actualizarMetaVend(editando.id_meta_lab_vend, payload)
            else await MetasService.crearMetaVend(payload)
            setIsModalOpen(false)
            fetchData()
        } catch (e) { console.error(e) }
        finally { setLoadingSave(false) }
    }

    const handleEliminar = async () => {
        if (!itemToDelete) return
        setLoadingSave(true)
        try {
            await MetasService.eliminarMetaVend(itemToDelete.id_meta_lab_vend)
            setIsDeleteModalOpen(false)
            fetchData()
        } catch (e) { console.error(e) }
        finally { setLoadingSave(false) }
    }

    return (
        <>
            <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex-wrap">
                <Label className="text-xs font-semibold text-slate-500">Ciclo:</Label>
                <Select value={selectedCiclo} onValueChange={setSelectedCiclo}>
                    <SelectTrigger className="w-[180px] h-9 text-sm bg-white"><SelectValue placeholder="Ciclo" /></SelectTrigger>
                    <SelectContent>{ciclos.map(c => <SelectItem key={c.id_ciclo} value={String(c.id_ciclo)}>{MESES_CORTO[c.mes]} {c.anio}</SelectItem>)}</SelectContent>
                </Select>
                <ChevronRight className="h-4 w-4 text-slate-300" />
                <Label className="text-xs font-semibold text-slate-500">Lab:</Label>
                <Select value={selectedLab} onValueChange={setSelectedLab}>
                    <SelectTrigger className="w-[180px] h-9 text-sm bg-white"><SelectValue placeholder="Laboratorio" /></SelectTrigger>
                    <SelectContent>{labs.map(l => <SelectItem key={l.id_meta_lab} value={String(l.id_meta_lab)}>{l.linea_desc || `Lab #${l.id_linea_ge}`}</SelectItem>)}</SelectContent>
                </Select>
            </div>

            {loading ? <Skeleton className="h-40" /> : data.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {data.map((item: IMetaVendedor) => (
                        <Card key={item.id_meta_lab_vend}>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-sm text-gray-900">{item.vendedor || item.cod_vendedor}</h3>
                                        <p className="text-xs text-gray-500">Cod: {item.cod_vendedor} · {item.total_items || 0} producto{(item.total_items || 0) === 1 ? '' : 's'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 my-3">
                                    <div className="bg-slate-50 p-2 rounded-md">
                                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Meta S/</p>
                                        <p className="text-sm font-bold">{fmtMoney(item.meta_monto)}</p>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-md">
                                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Meta Clientes</p>
                                        <p className="text-sm font-bold">{item.meta_clientes}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => {
                                        setEditando(item)
                                        setForm({
                                            cod_vendedor: item.cod_vendedor,
                                            nombre_vendedor: item.vendedor || item.cod_vendedor,
                                            meta_monto: String(item.meta_monto),
                                            meta_clientes: String(item.meta_clientes)
                                        })
                                        setIsModalOpen(true)
                                    }} className="flex-1 text-xs"><Edit className="h-3 w-3 mr-1" /> Editar</Button>
                                    <Button variant="outline" size="sm" onClick={() => { setItemToDelete(item); setIsDeleteModalOpen(true) }}
                                            className="text-red-600 border-red-200 hover:bg-red-50 text-xs flex-1">
                                        <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8"><Users className="h-12 w-12 text-gray-400 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-900">No hay vendedores asignados</h3></div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>{editando ? 'Editar' : 'Nuevo'} Vendedor</DialogTitle></DialogHeader>
                    <div className="space-y-4">

                        {!editando ? (
                            <div className="space-y-2">
                                <Label>Vendedor *</Label>
                                <Popover open={openVendPopover} onOpenChange={setOpenVendPopover}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox"
                                                className={cn("justify-between w-full font-normal h-10 bg-white", errors.cod_vendedor && "border-red-500")}>
                                            <span className="truncate">
                                                {form.cod_vendedor
                                                    ? `${form.nombre_vendedor} (${form.cod_vendedor})`
                                                    : "Buscar vendedor..."}
                                            </span>
                                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Buscar por nombre o código..." />
                                            <CommandList>
                                                {loadingVends && (
                                                    <div className="p-4 text-sm text-center text-muted-foreground">
                                                        <RefreshCw className="h-4 w-4 animate-spin inline mr-2" />Cargando vendedores...
                                                    </div>
                                                )}
                                                {!loadingVends && catVendedores.length === 0 && (
                                                    <CommandEmpty>No se encontraron vendedores.</CommandEmpty>
                                                )}
                                                <CommandGroup>
                                                    {catVendedores.map((vend: any) => {
                                                        const codigo = vend.Codigo_Vend || vend.codigo
                                                        const nombre = `${vend.Nombres || vend.nombres || ''} ${vend.Apellidos || vend.apellidos || ''}`.trim()
                                                        return (
                                                            <CommandItem
                                                                key={codigo}
                                                                value={`${codigo} ${nombre}`}
                                                                onSelect={() => {
                                                                    setForm(prev => ({
                                                                        ...prev,
                                                                        cod_vendedor: codigo,
                                                                        nombre_vendedor: nombre
                                                                    }))
                                                                    setOpenVendPopover(false)
                                                                }}
                                                            >
                                                                <Check className={cn("mr-2 h-4 w-4",
                                                                    form.cod_vendedor === codigo ? "opacity-100" : "opacity-0"
                                                                )} />
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-medium">{nombre}</span>
                                                                    <span className="text-[10px] text-slate-400">Código: {codigo}</span>
                                                                </div>
                                                            </CommandItem>
                                                        )
                                                    })}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {errors.cod_vendedor && <p className="text-xs text-red-500">{errors.cod_vendedor}</p>}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Vendedor</Label>
                                <Input value={`${form.nombre_vendedor} (${form.cod_vendedor})`} disabled className="bg-slate-50" />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Meta Monto S/ *</Label>
                                <Input type="number" step="0.01" value={form.meta_monto}
                                       onChange={e => setForm({ ...form, meta_monto: e.target.value })}
                                       className={errors.meta_monto ? "border-red-500" : ""} />
                                {errors.meta_monto && <p className="text-xs text-red-500">{errors.meta_monto}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Meta Clientes</Label>
                                <Input type="number" value={form.meta_clientes}
                                       onChange={e => setForm({ ...form, meta_clientes: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
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
                        <DialogTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-red-600" /> Eliminar Vendedor</DialogTitle>
                        <DialogDescription>Se eliminarán los productos asignados a este vendedor.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleEliminar} className="bg-red-600 hover:bg-red-700" disabled={loadingSave}>
                            <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

/* ═══════════════════════════════════════════════
   ITEMS/PRODUCTOS SECTION
   ═══════════════════════════════════════════════ */

function ItemsSection({ onOpenModalChange }: { onOpenModalChange: (fn: () => void) => void }) {
    const [ciclos, setCiclos] = useState<ICiclo[]>([])
    const [selectedCiclo, setSelectedCiclo] = useState('')
    const [labs, setLabs] = useState<IMetaLaboratorio[]>([])
    const [selectedLab, setSelectedLab] = useState('')
    const [vendedores, setVendedores] = useState<IMetaVendedor[]>([])
    const [selectedVend, setSelectedVend] = useState('')
    const [data, setData] = useState<IMetaItem[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingSave, setLoadingSave] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [editando, setEditando] = useState<IMetaItem | null>(null)
    const [itemToDelete, setItemToDelete] = useState<IMetaItem | null>(null)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [form, setForm] = useState({ cod_articulo: '', nombre_articulo: '', presentacion: '', tipo_precio_ref: 'PRECIO_LISTA', precio_ref: '', meta_cantidad: '' })

    const [allProducts, setAllProducts] = useState<any[]>([])
    const [productsLoading, setProductsLoading] = useState(false)
    const [productSearchQuery, setProductSearchQuery] = useState("")
    const [popoverOpen, setPopoverOpen] = useState(false)
    const [buscandoPrecio, setBuscandoPrecio] = useState(false)
    const { user } = useAuth()

    useEffect(() => {
        MetasService.listarCiclos().then(res => {
            const list: ICiclo[] = res?.data?.data || res?.data || []
            setCiclos(list)
            const abierto = list.find(c => c.estado === 'ABIERTO')
            if (abierto) setSelectedCiclo(String(abierto.id_ciclo))
        }).catch(console.error)
    }, [])

    useEffect(() => {
        if (!selectedCiclo) return
        MetasService.listarMetasLab(Number(selectedCiclo)).then(res => {
            const list: IMetaLaboratorio[] = res?.data?.data || res?.data || []
            setLabs(list)
            if (list.length > 0) setSelectedLab(String(list[0].id_meta_lab))
        }).catch(console.error)
    }, [selectedCiclo])

    useEffect(() => {
        if (!selectedLab) return
        MetasService.listarMetasVend(Number(selectedLab)).then(res => {
            const list: IMetaVendedor[] = res?.data?.data || res?.data || []
            setVendedores(list)
            if (list.length > 0) setSelectedVend(String(list[0].id_meta_lab_vend))
        }).catch(console.error)
    }, [selectedLab])

    const fetchData = useCallback(async () => {
        if (!selectedVend) return
        setLoading(true)
        try {
            const res = await MetasService.listarMetasItem(Number(selectedVend))
            setData(res?.data?.data || res?.data || [])
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }, [selectedVend])

    useEffect(() => { fetchData() }, [fetchData])

    const fetchAllProducts = async () => {
        try {
            setProductsLoading(true)
            const response = await getProductsRequest()
            setAllProducts(response.data?.data?.data || [])
        } catch (error) {
            console.error("Error fetching all products:", error)
            setAllProducts([])
        } finally {
            setProductsLoading(false)
        }
    }

    useEffect(() => {
        if (isModalOpen && !editando) {
            fetchAllProducts()
        }
    }, [isModalOpen, editando])

    const filteredAllProducts = allProducts.filter(product =>
        product.NombreItem?.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        product.Codigo_Art?.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        String(product?.Presentacion)?.toLowerCase().includes(productSearchQuery.toLowerCase())
    )

    const buscarPrecioAutomatico = async (codArticulo: string) => {
        setBuscandoPrecio(true)
        try {
            const res = await MetasService.obtenerPrecioArticulo(codArticulo, form.tipo_precio_ref || 'PRECIO_LISTA')
            const precio = res?.data?.data?.Precio || res?.data?.Precio || 0
            if (precio > 0) {
                setForm(prev => ({ ...prev, precio_ref: String(precio) }))
            }
        } catch (e) {
            console.error("Error buscando precio:", e)
        } finally {
            setBuscandoPrecio(false)
        }
    }

    const abrirModalNuevo = useCallback(() => {
        if (!selectedVend) return
        setEditando(null)
        setForm({ cod_articulo: '', nombre_articulo: '', presentacion: '', tipo_precio_ref: 'PRECIO_LISTA', precio_ref: '', meta_cantidad: '' })
        setProductSearchQuery("")
        setErrors({})
        setIsModalOpen(true)
    }, [selectedVend])

    useEffect(() => { onOpenModalChange(abrirModalNuevo) }, [onOpenModalChange, abrirModalNuevo])

    const handleProductSelect = (product: any) => {
        const precioContado = Number(product.PUContado || 0)
        const precioCredito = Number(product.PUCredito || 0)

        setForm(prev => ({
            ...prev,
            cod_articulo: product.Codigo_Art,
            nombre_articulo: product.NombreItem,
            presentacion: product.Presentacion || '',
            precio_ref: precioCredito > 0 ? String(precioCredito) : precioContado > 0 ? String(precioContado) : ''
        }))
        setPopoverOpen(false)

        if (!precioCredito && !precioContado) {
            buscarPrecioAutomatico(product.Codigo_Art)
        }
    }

    const handleGuardar = async () => {
        const newErrors: Record<string, string> = {}
        if (!form.cod_articulo) newErrors.cod_articulo = "Debe seleccionar un producto"
        if (!form.meta_cantidad) newErrors.meta_cantidad = "Requerido"
        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) return

        setLoadingSave(true)
        try {
            const payload: IMetaItemForm = {
                id_meta_lab_vend: Number(selectedVend),
                cod_articulo: form.cod_articulo,
                tipo_precio_ref: form.tipo_precio_ref,
                precio_ref: Number(form.precio_ref) || 0,
                meta_cantidad: Number(form.meta_cantidad),
                usuario: user?.nombreCompleto || 'WEB'
            }
            if (editando) await MetasService.actualizarMetaItem(editando.id_meta_item, payload)
            else await MetasService.crearMetaItem(payload)
            setIsModalOpen(false)
            fetchData()
        } catch (e) { console.error(e) }
        finally { setLoadingSave(false) }
    }

    const handleEliminar = async () => {
        if (!itemToDelete) return
        setLoadingSave(true)
        try {
            await MetasService.eliminarMetaItem(itemToDelete.id_meta_item)
            setIsDeleteModalOpen(false)
            fetchData()
        } catch (e) { console.error(e) }
        finally { setLoadingSave(false) }
    }

    const metaCalculada = Number(form.precio_ref) * Number(form.meta_cantidad)

    return (
        <>
            <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex-wrap">
                <Label className="text-xs font-semibold text-slate-500">Ciclo:</Label>
                <Select value={selectedCiclo} onValueChange={setSelectedCiclo}>
                    <SelectTrigger className="w-[140px] h-8 text-xs bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>{ciclos.map(c => <SelectItem key={c.id_ciclo} value={String(c.id_ciclo)}>{MESES_CORTO[c.mes]} {c.anio}</SelectItem>)}</SelectContent>
                </Select>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                <Label className="text-xs font-semibold text-slate-500">Lab:</Label>
                <Select value={selectedLab} onValueChange={setSelectedLab}>
                    <SelectTrigger className="w-[130px] h-8 text-xs bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>{labs.map(l => <SelectItem key={l.id_meta_lab} value={String(l.id_meta_lab)}>{l.linea_desc}</SelectItem>)}</SelectContent>
                </Select>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                <Label className="text-xs font-semibold text-slate-500">Vendedor:</Label>
                <Select value={selectedVend} onValueChange={setSelectedVend}>
                    <SelectTrigger className="w-[130px] h-8 text-xs bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>{vendedores.map(v => <SelectItem key={v.id_meta_lab_vend} value={String(v.id_meta_lab_vend)}>{v.vendedor}</SelectItem>)}</SelectContent>
                </Select>
            </div>

            {loading ? <Skeleton className="h-40" /> : data.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-xs">
                        <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left px-3 py-2 font-semibold text-slate-500">Código</th>
                            <th className="text-left px-3 py-2 font-semibold text-slate-500">Tipo Precio</th>
                            <th className="text-right px-3 py-2 font-semibold text-slate-500">P.Ref</th>
                            <th className="text-right px-3 py-2 font-semibold text-slate-500">Cantidad</th>
                            <th className="text-right px-3 py-2 font-semibold text-slate-500">Meta S/</th>
                            <th className="text-center px-3 py-2 font-semibold text-slate-500">Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {data.map((item: IMetaItem) => (
                            <tr key={item.id_meta_item} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-3 py-2 font-semibold text-slate-800">{item.cod_articulo}</td>
                                <td className="px-3 py-2 text-slate-500">{item.tipo_precio_ref}</td>
                                <td className="px-3 py-2 text-right text-slate-600">{fmtMoney(item.precio_ref)}</td>
                                <td className="px-3 py-2 text-right text-slate-600">{Number(item.meta_cantidad).toLocaleString()}</td>
                                <td className="px-3 py-2 text-right font-bold text-slate-800">{fmtMoney(item.meta_monto)}</td>
                                <td className="px-3 py-2 text-center">
                                    <div className="flex gap-1 justify-center">
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                                            setEditando(item)
                                            setForm({
                                                cod_articulo: item.cod_articulo,
                                                nombre_articulo: '',
                                                presentacion: '',
                                                tipo_precio_ref: item.tipo_precio_ref,
                                                precio_ref: String(item.precio_ref),
                                                meta_cantidad: String(item.meta_cantidad)
                                            })
                                            setIsModalOpen(true)
                                        }}><Edit className="h-3 w-3 text-slate-500" /></Button>
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setItemToDelete(item); setIsDeleteModalOpen(true) }}>
                                            <Trash2 className="h-3 w-3 text-red-500" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8">
                    <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No hay productos asignados</h3>
                </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-lg overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>{editando ? 'Editar' : 'Nuevo'} Producto</DialogTitle>
                        <DialogDescription>Si dejas precio en 0, se buscará automáticamente en preciosxtipo</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {!editando ? (
                            <div className="space-y-4 overflow-hidden min-w-0">
                                <Label className="text-sm font-medium">Buscar Producto *</Label>
                                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={popoverOpen}
                                            className={cn(
                                                "w-full max-w-full justify-between h-12 px-3 text-left font-normal text-sm",
                                                errors.cod_articulo && "border-red-500"
                                            )}
                                        >
                                            {form.cod_articulo ? (
                                                <div className="flex flex-col items-start overflow-hidden" style={{ maxWidth: 'calc(100% - 28px)' }}>
                                                    <span className="truncate w-full text-sm font-medium">
                                                        {form.nombre_articulo.substring(0, 50)}...
                                                    </span>
                                                    <span className="text-xs text-gray-500 truncate w-full">
                                                        {form.cod_articulo}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500 truncate">Buscar por código, nombre o laboratorio...</span>
                                            )}
                                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0 w-[450px] max-w-[90vw]" align="start" side="bottom">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Buscar por código, nombre o laboratorio..."
                                                value={productSearchQuery}
                                                onValueChange={setProductSearchQuery}
                                                className="text-sm h-11"
                                            />
                                            <CommandList className="max-h-[50vh]">
                                                <CommandEmpty className="py-6 text-center">
                                                    {productsLoading ? "Buscando productos..." : "No se encontraron productos."}
                                                </CommandEmpty>
                                                <CommandGroup heading="Resultados" className="overflow-y-auto">
                                                    {filteredAllProducts.map((product) => (
                                                        <CommandItem
                                                            key={product.Codigo_Art}
                                                            value={product.Codigo_Art}
                                                            onSelect={() => handleProductSelect(product)}
                                                            className="py-2 sm:py-3"
                                                        >
                                                            <div className="flex items-start gap-2 w-full min-w-0">
                                                                <div className="bg-blue-100 p-1.5 sm:p-2 rounded-md shrink-0 mt-0.5">
                                                                    <Package className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                                                                </div>
                                                                <div className="flex flex-col flex-1 min-w-0">
                                                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start w-full gap-1 sm:gap-2">
                                                                        <span className="font-medium text-sm break-words flex-1">
                                                                            {product.NombreItem}
                                                                        </span>
                                                                        <div className="flex flex-wrap gap-1 shrink-0">
                                                                            <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                                                                                Stock: {product.Stock}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center w-full mt-1 gap-1">
                                                                        <span className="text-xs text-gray-500 break-words">
                                                                            <span className="font-medium">Código:</span> {product.Codigo_Art}
                                                                        </span>
                                                                        <span className="text-xs text-gray-500 break-words">
                                                                            <span className="font-medium">Lab:</span> {product.Presentacion}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex flex-col xs:flex-row xs:justify-between mt-2 text-xs gap-1">
                                                                        <span className="text-green-600 whitespace-nowrap">
                                                                            Contado: S/.{Number(product.PUContado).toFixed(2)}
                                                                        </span>
                                                                        <span className="text-blue-600 whitespace-nowrap">
                                                                            Crédito: S/.{Number(product.PUCredito).toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {errors.cod_articulo && <p className="text-xs text-red-500">{errors.cod_articulo}</p>}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Código Artículo</Label>
                                <Input value={form.cod_articulo} disabled className="bg-slate-50" />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Tipo Precio Ref</Label>
                            <Select value={form.tipo_precio_ref} onValueChange={val => setForm({ ...form, tipo_precio_ref: val })}>
                                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PRECIO_LISTA">Precio Lista</SelectItem>
                                    <SelectItem value="PRECIO_CREDITO">Precio Crédito</SelectItem>
                                    <SelectItem value="PRECIO_CONTADO">Precio Contado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Precio Ref (S/)</Label>
                                <div className="relative">
                                    <Input type="number" step="0.01" value={form.precio_ref}
                                           onChange={e => setForm({ ...form, precio_ref: e.target.value })}
                                           placeholder="0 = automático"
                                           disabled={buscandoPrecio}
                                    />
                                    {buscandoPrecio && (
                                        <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-blue-500" />
                                    )}
                                </div>
                                {!form.precio_ref && !buscandoPrecio && (
                                    <p className="text-[10px] text-amber-600">⚠ Se buscará en preciosxtipo al guardar</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Meta Cantidad *</Label>
                                <Input type="number" value={form.meta_cantidad}
                                       onChange={e => setForm({ ...form, meta_cantidad: e.target.value })}
                                       className={errors.meta_cantidad ? "border-red-500" : ""} />
                                {errors.meta_cantidad && <p className="text-xs text-red-500">{errors.meta_cantidad}</p>}
                            </div>
                        </div>

                        {form.precio_ref && form.meta_cantidad && metaCalculada > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] uppercase font-semibold text-blue-500">Meta calculada</p>
                                    <p className="text-xs text-blue-600">
                                        {fmtMoney(Number(form.precio_ref))} × {Number(form.meta_cantidad).toLocaleString()} uds
                                    </p>
                                </div>
                                <p className="text-lg font-bold text-blue-700">{fmtMoney(metaCalculada)}</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
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
                        <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600" /> Eliminar Producto
                        </DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de eliminar este producto de las metas? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleEliminar} className="bg-red-600 hover:bg-red-700" disabled={loadingSave}>
                            {loadingSave ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />} Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}