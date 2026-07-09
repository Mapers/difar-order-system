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
    X, Search, Package, Lock, Unlock
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
import { IVendedorResumenDashboard, IVendedorLabDetalle } from "@/app/types/metas-types";
import VendedorLabsConfigModal from "@/components/configuraciones/metas/VendedorLabsConfigModal";
import {formatSafeDate} from "@/app/utils/date";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import {cn} from "@/lib/utils";
import {getProductsRequest} from "@/app/api/products";
import {useAuth} from "@/context/authContext";
import apiClient from "@/app/api/client";
import { MetaExcelButtons } from "@/components/configuraciones/metas/MetaExcelButtons";
import { MetaColumn } from "@/components/configuraciones/metas/metaExcel";
import ProductSearchDialog from "@/components/tomar-pedido/product-step/ProductSearchDialog";
import { IProduct } from "@/app/types/order/product-interface";
import { IMoneda } from "@/app/types/order/client-interface";

interface MetasConfigSectionProps {
    onOpenModalChange: (fn: (() => void) | null) => void;
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

const TIPO_PRECIO_OPTS = ['PRECIO_LISTA', 'PRECIO_CREDITO', 'PRECIO_CONTADO']

// Opciones de precio del producto para los radios (solo las que tienen precio > 0)
const buildPriceOptions = (product: any) => {
    if (!product) return []
    return [
        { key: 'contado',   label: 'Contado',      value: Number(product.PUContado || 0), tipo: 'PRECIO_CONTADO' },
        { key: 'credito',   label: 'Crédito',      value: Number(product.PUCredito || 0), tipo: 'PRECIO_CREDITO' },
        { key: 'bonifCont', label: 'Bonif. Cont.', value: Number(product.PUPorMayor || 0), tipo: 'PRECIO_CONTADO' },
        { key: 'bonifCred', label: 'Bonif. Cred.', value: Number(product.PUPorMenor || 0), tipo: 'PRECIO_CREDITO' },
    ].filter(o => o.value > 0)
}

const LAB_EXCEL_COLUMNS: MetaColumn[] = [
    { header: "Código", key: "cod", width: 14, prefill: (l) => l.Codigo_Linea },
    { header: "Laboratorio", key: "nombre", width: 34, prefill: (l) => l.Descripcion },
    { header: "Meta Monto S/", key: "meta_monto", width: 16, required: true },
    { header: "Observación", key: "observacion", width: 30 },
]

const VEND_EXCEL_COLUMNS: MetaColumn[] = [
    { header: "Código", key: "cod", width: 16, prefill: (v) => v.Codigo_Vend || v.codigo },
    { header: "Vendedor", key: "nombre", width: 32, prefill: (v) => `${v.Nombres || v.nombres || ''} ${v.Apellidos || v.apellidos || ''}`.trim() },
    { header: "Meta Monto S/", key: "meta_monto", width: 16, required: true },
    { header: "Meta Clientes", key: "meta_clientes", width: 16, prefill: (v) => v.totalClientes ?? '' },
]

const ITEM_EXCEL_COLUMNS: MetaColumn[] = [
    { header: "Código", key: "cod", width: 16, prefill: (p) => p.Codigo_Art },
    { header: "Producto", key: "nombre", width: 34, prefill: (p) => p.NombreItem },
    { header: "Presentación", key: "presentacion", width: 18, prefill: (p) => p.Presentacion || '' },
    { header: "Tipo Precio", key: "tipo_precio_ref", width: 16, prefill: () => 'PRECIO_LISTA', options: TIPO_PRECIO_OPTS },
    { header: "Precio Ref", key: "precio_ref", width: 14, prefill: (p) => Number(p.PUCredito) || Number(p.PUContado) || '' },
    { header: "Meta Cantidad", key: "meta_cantidad", width: 16, required: true },
]

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
                                    : 'bg-background border-border text-muted-foreground hover:border-blue-200 hover:text-blue-600'
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
                                        <h3 className="font-bold text-base text-card-foreground">{MESES[item.mes]} {item.anio}</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
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
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No hay ciclos registrados</h3>
                    <p className="text-sm text-muted-foreground">Crea un nuevo ciclo para comenzar a asignar metas</p>
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

function LaboratoriosSection({ onOpenModalChange }: { onOpenModalChange: (fn: (() => void) | null) => void }) {
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

    const [form, setForm] = useState({ id_linea_ge: '', lab_nombre: '', meta_monto: '', observacion: '' })

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
        setForm({ id_linea_ge: '', lab_nombre: '', meta_monto: '', observacion: '' })
        setErrors({})
        setIsModalOpen(true)
    }, [selectedCiclo])

    useEffect(() => { onOpenModalChange(null) }, [onOpenModalChange])

    const abrirEditar = (item: IMetaLaboratorio) => {
        setEditando(item)
        setForm({
            id_linea_ge: String(item.id_linea_ge),
            lab_nombre: item.linea_desc || `Lab #${item.id_linea_ge}`,
            meta_monto: String(item.meta_monto),
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
            <div className="flex items-center gap-3 mb-4 p-3 bg-muted rounded-lg border border-border">
                <Label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Ciclo:</Label>
                <Select value={selectedCiclo} onValueChange={setSelectedCiclo}>
                    <SelectTrigger className="w-[220px] h-9 text-sm bg-background"><SelectValue placeholder="Seleccionar ciclo" /></SelectTrigger>
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
                        <Card key={item.id_linea_ge} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-sm text-card-foreground">{item.linea_desc || `Lab #${item.id_linea_ge}`}</h3>
                                    </div>
                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                        {item.total_vendedores || 0} vendedor{(item.total_vendedores || 0) === 1 ? '' : 'es'}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-1 gap-2 my-3">
                                    <div className="bg-muted p-2 rounded-md">
                                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Meta S/</p>
                                        <p className="text-sm font-bold text-foreground">{fmtMoney(item.meta_monto)}</p>
                                    </div>
                                </div>
                                {item.meta_distribuida !== undefined && (
                                    <div className="text-[10px] text-muted-foreground mb-2">
                                        Distribuido: {fmtMoney(item.meta_distribuida!)} de {fmtMoney(item.meta_monto)}
                                        {Number(item.meta_distribuida) !== Number(item.meta_monto) &&
                                          <span className="text-amber-600 font-semibold ml-1">⚠ Diferencia</span>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <Factory className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No hay metas de laboratorio</h3>
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
                                <Popover open={openLabPopover} onOpenChange={setOpenLabPopover} modal>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox"
                                                className={cn("justify-between w-full font-normal h-10 bg-background", errors.id_linea_ge && "border-red-500")}>
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
                                                                <span className="text-[10px] text-muted-foreground">Código: {lab.Codigo_Linea} · ID: {lab.IdLineaGe}</span>
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
                                <Input value={`${form.lab_nombre} (ID: ${form.id_linea_ge})`} disabled className="bg-muted" />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Meta Monto (S/) *</Label>
                            <Input type="number" step="0.01" value={form.meta_monto}
                                   onChange={e => setForm({ ...form, meta_monto: e.target.value })}
                                   placeholder="25000.00" className={errors.meta_monto ? "border-red-500" : ""} />
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

function VendedoresSection({ onOpenModalChange }: { onOpenModalChange: (fn: (() => void) | null) => void }) {
    const [ciclos, setCiclos]           = useState<ICiclo[]>([])
    const [selectedCiclo, setSelectedCiclo] = useState('')
    const [resumen, setResumen]         = useState<IVendedorResumenDashboard[]>([])
    const [loading, setLoading]         = useState(false)

    // Modal de labs
    const [modalVend, setModalVend]     = useState<IVendedorResumenDashboard | null>(null)
    const [labsDetalle, setLabsDetalle] = useState<IVendedorLabDetalle[]>([])
    const [loadingDetalle, setLoadingDetalle] = useState(false)

    useEffect(() => { onOpenModalChange(null) }, [onOpenModalChange])

    useEffect(() => {
        MetasService.listarCiclos().then(res => {
            const list: ICiclo[] = res?.data?.data || res?.data || []
            setCiclos(list)
            const abierto = list.find(c => c.estado === 'ABIERTO')
            if (abierto) setSelectedCiclo(String(abierto.id_ciclo))
        }).catch(console.error)
    }, [])

    const fetchResumen = useCallback(async () => {
        if (!selectedCiclo) return
        setLoading(true)
        try {
            const res = await MetasService.getResumenVendedorLabs(Number(selectedCiclo))
            setResumen(res?.data?.data || res?.data || [])
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }, [selectedCiclo])

    useEffect(() => { fetchResumen() }, [fetchResumen])

    const abrirModalVendedor = async (vend: IVendedorResumenDashboard) => {
        setModalVend(vend)
        setLabsDetalle([])
        setLoadingDetalle(true)
        try {
            const res = await MetasService.getDetalleVendedorPorLab(Number(selectedCiclo), vend.cod_vendedor)
            setLabsDetalle(res?.data?.data || [])
        } catch (e) { console.error(e) }
        finally { setLoadingDetalle(false) }
    }

    return (
        <>
            {/* Selector de ciclo */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-muted rounded-lg border border-border">
                <Label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Ciclo:</Label>
                <Select value={selectedCiclo} onValueChange={setSelectedCiclo}>
                    <SelectTrigger className="w-[220px] h-9 text-sm bg-background">
                        <SelectValue placeholder="Seleccionar ciclo" />
                    </SelectTrigger>
                    <SelectContent>
                        {ciclos.map(c => (
                            <SelectItem key={c.id_ciclo} value={String(c.id_ciclo)}>
                                {MESES_CORTO[c.mes]} {c.anio}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {resumen.length > 0 && (
                    <Badge variant="outline" className="text-xs">{resumen.length} vendedores</Badge>
                )}
            </div>

            {/* Grid de cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
                </div>
            ) : resumen.length === 0 ? (
                <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground">No hay vendedores con metas asignadas</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {resumen.map((v) => {
                        const pct       = Number(v.pct_avance_global || 0)
                        const enMeta    = Number(v.labs_en_meta  || 0)
                        const riesgo    = Number(v.labs_riesgo   || 0)
                        const bajo      = Number(v.labs_bajo     || 0)
                        const totalLabs = Number(v.total_labs    || 0)

                        return (
                            <Card key={v.cod_vendedor} className="overflow-hidden">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-sm text-card-foreground">{v.nombre_vendedor || v.cod_vendedor}</h3>
                                            <p className="text-xs text-muted-foreground">Cód: {v.cod_vendedor}</p>
                                        </div>
                                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                            {totalLabs} lab{totalLabs !== 1 ? 's' : ''}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 my-3">
                                        <div className="bg-muted p-2 rounded-md">
                                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Venta S/</p>
                                            <p className="text-sm font-bold text-foreground">{fmtMoney(Number(v.venta_total))}</p>
                                        </div>
                                        <div className="bg-muted p-2 rounded-md">
                                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Cuota S/</p>
                                            <p className="text-sm font-bold text-foreground">{fmtMoney(Number(v.cuota_total))}</p>
                                        </div>
                                    </div>

                                    <div className="text-[10px] text-muted-foreground mb-3">
                                        Avance global: <span className="font-semibold text-foreground">{pct}%</span>
                                        {' · '}
                                        <span className="text-emerald-600 font-semibold">✓ {enMeta}</span>
                                        {' '}
                                        <span className="text-amber-500 font-semibold">⚠ {riesgo}</span>
                                        {' '}
                                        <span className="text-red-500 font-semibold">✗ {bajo}</span>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full h-8 text-xs"
                                        onClick={() => abrirModalVendedor(v)}
                                    >
                                        Ver laboratorios →
                                    </Button>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Modal de laboratorios del vendedor */}
            {modalVend && (
                <VendedorLabsConfigModal
                    open={!!modalVend}
                    onClose={() => setModalVend(null)}
                    codVendedor={modalVend.cod_vendedor}
                    nombreVendedor={modalVend.nombre_vendedor}
                    totalLabs={Number(modalVend.total_labs)}
                    labsDelVendedor={labsDetalle}
                    loading={loadingDetalle}
                />
            )}
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
    const [selectedProductData, setSelectedProductData] = useState<any>(null)
    const [selectedPriceKey, setSelectedPriceKey] = useState('')
    const [disponibilidad, setDisponibilidad] = useState<{ meta_vendedor: number; suma_items_vendedor: number; meta_lab: number; suma_items_lab: number } | null>(null)
    const [validacionError, setValidacionError] = useState<string | null>(null)
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
            if (list.length > 0) setSelectedLab(String(list[0].id_linea_ge))
        }).catch(console.error)
    }, [selectedCiclo])

    useEffect(() => {
        if (!selectedLab || !selectedCiclo) return
        MetasService.listarMetasVend(Number(selectedCiclo), Number(selectedLab)).then(res => {
            const list: IMetaVendedor[] = res?.data?.data || res?.data || []
            setVendedores(list)
            if (list.length > 0) setSelectedVend(String(list[0].cod_vendedor))
        }).catch(console.error)
    }, [selectedLab, selectedCiclo])

    const cargarItems = (cod: string) => {
        if (!selectedCiclo || !selectedLab || !cod) return
        setLoading(true)
        MetasService.listarMetasItemPorVend(Number(selectedCiclo), Number(selectedLab), cod)
            .then(res => setData(res?.data?.data || res?.data || []))
            .catch(console.error)
            .finally(() => setLoading(false))
    }

    const fetchData = useCallback(() => {
        cargarItems(selectedVend)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedVend, selectedCiclo, selectedLab])

    useEffect(() => {
        if (selectedVend && selectedCiclo && selectedLab) cargarItems(selectedVend)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedVend, selectedCiclo, selectedLab])

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

    // disponibilidad deshabilitada: el modelo ya no usa id_meta_lab_vend

    const labActual = labs.find(l => String(l.id_linea_ge) === selectedLab)

    const filteredAllProducts = allProducts.filter(product => {
        const coincideLab = !labActual ||
            String(product?.id_linea_ge ?? '').trim() === String(labActual.Codigo_Linea ?? '').trim()
        if (!coincideLab) return false
        if (!productSearchQuery) return true
        const q = productSearchQuery.toLowerCase()
        return product.NombreItem?.toLowerCase().includes(q) ||
            product.Codigo_Art?.toLowerCase().includes(q) ||
            String(product?.Presentacion)?.toLowerCase().includes(q)
    })

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
        setSelectedProductData(null)
        setSelectedPriceKey('')
        setErrors({})
        setIsModalOpen(true)
    }, [selectedVend])

    useEffect(() => { onOpenModalChange(abrirModalNuevo) }, [onOpenModalChange, abrirModalNuevo])

    const handleProductSelect = (product: any) => {
        const opts = buildPriceOptions(product)
        const first = opts[0]

        setSelectedProductData(product)
        setSelectedPriceKey(first ? first.key : '')
        setForm(prev => ({
            ...prev,
            cod_articulo: product.Codigo_Art,
            nombre_articulo: product.NombreItem,
            presentacion: product.Presentacion || '',
            precio_ref: first ? String(first.value) : '',
            tipo_precio_ref: first ? first.tipo : prev.tipo_precio_ref,
        }))
        setPopoverOpen(false)
    }

    const metaActualItem = editando ? Number(editando.meta_monto || 0) : 0
    const nuevoMonto = (Number(form.precio_ref) || 0) * (Number(form.meta_cantidad) || 0)
    const dispVend = disponibilidad ? Number(disponibilidad.meta_vendedor) - (Number(disponibilidad.suma_items_vendedor) - metaActualItem) : null
    const dispLab  = disponibilidad ? Number(disponibilidad.meta_lab) - (Number(disponibilidad.suma_items_lab) - metaActualItem) : null
    const metasBaseInvalidas = !!disponibilidad && (Number(disponibilidad.meta_vendedor) <= 0 || Number(disponibilidad.meta_lab) <= 0)
    const excedeVend = dispVend !== null && nuevoMonto > dispVend
    const excedeLab  = dispLab !== null && nuevoMonto > dispLab
    const bloqueaPorTope = metasBaseInvalidas || excedeVend || excedeLab

    const handleGuardar = async () => {
        const newErrors: Record<string, string> = {}
        if (!form.cod_articulo) newErrors.cod_articulo = "Debe seleccionar un producto"
        if (!editando && !form.precio_ref) newErrors.precio_ref = "Selecciona un precio"
        if (!form.meta_cantidad) newErrors.meta_cantidad = "Requerido"
        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) return
        if (bloqueaPorTope) return

        setLoadingSave(true)
        try {
            const payload: IMetaItemForm = {
                id_ciclo: Number(selectedCiclo),
                id_linea_ge: Number(selectedLab),
                cod_vendedor: selectedVend,
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

    const priceOptions = buildPriceOptions(selectedProductData)
    const metaCalculada = Number(form.precio_ref) * Number(form.meta_cantidad)

    return (
        <>
            <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg border border-border flex-wrap">
                <Label className="text-xs font-semibold text-muted-foreground">Ciclo:</Label>
                <Select value={selectedCiclo} onValueChange={setSelectedCiclo}>
                    <SelectTrigger className="w-[140px] h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>{ciclos.map(c => <SelectItem key={c.id_ciclo} value={String(c.id_ciclo)}>{MESES_CORTO[c.mes]} {c.anio}</SelectItem>)}</SelectContent>
                </Select>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs font-semibold text-muted-foreground">Lab:</Label>
                <Select value={selectedLab} onValueChange={setSelectedLab}>
                    <SelectTrigger className="w-[130px] h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>{labs.map(l => <SelectItem key={l.id_linea_ge} value={String(l.id_linea_ge)}>{l.linea_desc}</SelectItem>)}</SelectContent>
                </Select>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs font-semibold text-muted-foreground">Vendedor:</Label>
                <Select value={selectedVend} onValueChange={setSelectedVend}>
                    <SelectTrigger className="w-[130px] h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>{vendedores.map(v => <SelectItem key={v.cod_vendedor} value={String(v.cod_vendedor)}>{v.vendedor}</SelectItem>)}</SelectContent>
                </Select>
                <div className="ml-auto flex gap-2">
                    <MetaExcelButtons
                        fileBaseName="metas-productos"
                        sheetName="Productos"
                        columns={ITEM_EXCEL_COLUMNS}
                        disabled={!selectedVend}
                        disabledHint="Selecciona ciclo, laboratorio y vendedor primero"
                        loadEntities={async () => {
                            const res = await getProductsRequest()
                            const products = res.data?.data?.data || []
                            if (!labActual) return products
                            return products.filter((p: any) =>
                                String(p?.id_linea_ge ?? '').trim() === String(labActual.Codigo_Linea ?? '').trim()
                            )
                        }}
                        rowToItem={(r) => ({
                            cod_articulo: r.cod,
                            tipo_precio_ref: r.tipo_precio_ref || 'PRECIO_LISTA',
                            precio_ref: Number(r.precio_ref) || 0,
                            meta_cantidad: Number(r.meta_cantidad) || 0,
                        })}
                        submit={async (items) => {
                            const body = await MetasService.crearMetasItemBulk({
                                id_ciclo: Number(selectedCiclo),
                                id_linea_ge: Number(selectedLab),
                                cod_vendedor: selectedVend,
                                usuario: user?.nombreCompleto || 'WEB',
                                items,
                            })
                            return body?.data ?? body
                        }}
                        onDone={fetchData}
                    />
                </div>
            </div>

            {loading ? <Skeleton className="h-40" /> : data.length > 0 ? (
                <div className="overflow-x-auto border border-border rounded-lg">
                    <table className="w-full text-xs">
                        <thead>
                        <tr className="bg-muted border-b border-border">
                            <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Código</th>
                            <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Tipo Precio</th>
                            <th className="text-right px-3 py-2 font-semibold text-muted-foreground">P.Ref</th>
                            <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Cantidad</th>
                            <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Meta S/</th>
                            <th className="text-center px-3 py-2 font-semibold text-muted-foreground">Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {data.map((item: IMetaItem) => (
                            <tr key={item.id_meta_item} className="border-b border-border hover:bg-muted">
                                <td className="px-3 py-2 font-semibold text-foreground">{item.cod_articulo}</td>
                                <td className="px-3 py-2 text-muted-foreground">{item.tipo_precio_ref}</td>
                                <td className="px-3 py-2 text-right text-muted-foreground">{fmtMoney(item.precio_ref)}</td>
                                <td className="px-3 py-2 text-right text-muted-foreground">{Number(item.meta_cantidad).toLocaleString()}</td>
                                <td className="px-3 py-2 text-right font-bold text-foreground">{fmtMoney(item.meta_monto)}</td>
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
                                            setSelectedProductData(null)
                                            setSelectedPriceKey('')
                                            setErrors({})
                                            setIsModalOpen(true)
                                        }}><Edit className="h-3 w-3 text-muted-foreground" /></Button>
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
                    <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground">No hay productos asignados</h3>
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
                                <Button
                                    type="button"
                                    variant="outline"
                                    role="combobox"
                                    onClick={() => setPopoverOpen(true)}
                                    className={cn(
                                        "w-full max-w-full justify-between h-12 px-3 text-left font-normal text-sm",
                                        errors.cod_articulo && "border-red-500"
                                    )}
                                >
                                    {form.cod_articulo ? (
                                        <div className="flex flex-col items-start overflow-hidden" style={{ maxWidth: 'calc(100% - 28px)' }}>
                                            <span className="truncate w-full text-sm font-medium">
                                                {form.nombre_articulo}
                                            </span>
                                            <span className="text-xs text-muted-foreground truncate w-full">
                                                {form.cod_articulo}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground truncate">Buscar por código, nombre o laboratorio...</span>
                                    )}
                                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>

                                <ProductSearchDialog
                                    open={popoverOpen}
                                    onOpenChange={setPopoverOpen}
                                    searchQuery={productSearchQuery}
                                    onSearchQueryChange={setProductSearchQuery}
                                    filteredProducts={filteredAllProducts as IProduct[]}
                                    onProductSelect={handleProductSelect}
                                    currency={{ value: "PEN", label: "Soles" } as IMoneda}
                                />
                                {errors.cod_articulo && <p className="text-xs text-red-500">{errors.cod_articulo}</p>}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Código Artículo</Label>
                                <Input value={form.cod_articulo} disabled className="bg-muted" />
                            </div>
                        )}

                        {!editando ? (
                            <div className="space-y-2">
                                <Label>Precio de referencia *</Label>
                                {!form.cod_articulo ? (
                                    <p className="text-xs text-muted-foreground">Selecciona un producto para ver sus precios.</p>
                                ) : priceOptions.length === 0 ? (
                                    <p className="text-xs text-amber-600">Este producto no tiene precios disponibles.</p>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {priceOptions.map(opt => (
                                            <button
                                                key={opt.key}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedPriceKey(opt.key)
                                                    setForm(prev => ({ ...prev, precio_ref: String(opt.value), tipo_precio_ref: opt.tipo }))
                                                    setErrors(prev => ({ ...prev, precio_ref: '' }))
                                                }}
                                                className={cn(
                                                    "relative rounded-xl p-2 text-center border-2 transition-all",
                                                    selectedPriceKey === opt.key
                                                        ? "border-blue-500 bg-blue-50"
                                                        : "border-border bg-muted hover:border-blue-300"
                                                )}
                                            >
                                                {selectedPriceKey === opt.key && <Check className="absolute top-1 right-1 h-3 w-3 text-blue-600" />}
                                                <div className={cn(
                                                    "text-[10px] font-medium mb-0.5",
                                                    selectedPriceKey === opt.key ? "text-blue-600" : "text-muted-foreground"
                                                )}>{opt.label}</div>
                                                <div className={cn(
                                                    "text-sm font-bold",
                                                    selectedPriceKey === opt.key ? "text-blue-700" : "text-foreground"
                                                )}>S/ {opt.value.toFixed(2)}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {errors.precio_ref && <p className="text-xs text-red-500">{errors.precio_ref}</p>}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Precio de referencia</Label>
                                <Input value={fmtMoney(Number(form.precio_ref))} disabled className="bg-muted" />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Meta Cantidad *</Label>
                            <Input type="number" value={form.meta_cantidad}
                                   onChange={e => setForm({ ...form, meta_cantidad: e.target.value })}
                                   className={errors.meta_cantidad ? "border-red-500" : ""} />
                            {errors.meta_cantidad && <p className="text-xs text-red-500">{errors.meta_cantidad}</p>}
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

                        {validacionError && (
                            <p className="text-xs text-amber-600">⚠ {validacionError} (se permitirá guardar)</p>
                        )}

                        {disponibilidad && (
                            <div className="rounded-lg border p-3 text-xs space-y-1">
                                {metasBaseInvalidas ? (
                                    <p className="text-red-600 font-medium">Define primero la meta del vendedor y del laboratorio.</p>
                                ) : (
                                    <>
                                        <div className={`flex justify-between ${excedeVend ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                                            <span>Disponible vendedor:</span>
                                            <span>{fmtMoney(Number(dispVend))}</span>
                                        </div>
                                        <div className={`flex justify-between ${excedeLab ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                                            <span>Disponible laboratorio:</span>
                                            <span>{fmtMoney(Number(dispLab))}</span>
                                        </div>
                                        {(excedeVend || excedeLab) && (
                                            <p className="text-red-600 font-medium pt-1">
                                                Esta meta ({fmtMoney(nuevoMonto)}) excede el tope de {excedeVend ? 'vendedor' : 'laboratorio'}.
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleGuardar} disabled={loadingSave || bloqueaPorTope}>
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