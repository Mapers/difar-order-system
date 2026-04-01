'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
    Send, Plus, ChevronDown, ChevronRight,
    CheckCircle2, AlertCircle,
    RefreshCw, FileText, Loader2, MapPin,
    DollarSign, Eye, X, Upload, Image as ImageIcon, Paperclip,
} from 'lucide-react'
import { toast } from '@/app/hooks/use-toast'
import DetalleVendedor from './DetalleVendedor'
import EstadoPill from './EstadoPill'
import {
    CatalogosBanco, NuevoDetalle,
    PlanillaCabecera,
    PlanillaDetalle,
    TipoComprobante, VendedorInfo,
    ZonaOption
} from "@/app/types/planilla-types";
import {fmtFecha, fmtMoney, fmtRel} from "@/lib/planilla.helper";
import ZonaCombobox from "@/components/contabilidad/planilla-cobranza/ZonaComboBox";
import MiniTabla from "@/components/contabilidad/planilla-cobranza/Minitabla";
import {useAuth} from "@/context/authContext";
import { fetchGetAllClients } from "@/app/api/takeOrders"
import { IClient } from "@/app/types/order/client-interface"
import { Combobox } from "@/app/dashboard/mis-pedidos/page"
import {
    DocumentoCliente,
    SeleccionarDocumentoModal
} from "@/components/contabilidad/planilla-cobranza/SeleccionarDocumentoModal";
import {publicApi} from "@/app/api/client";
import {Voucher, VouchersModal} from "@/components/contabilidad/planilla-cobranza/VouchersModal";

interface FormRegistro {
    codigo_cliente:   string
    nombre_cliente:   string
    tipo_documento:   string
    serie:            string
    numero_doc:       string
    importe:          string
    numero_recibo:    string
    importe_cobrado:  string
    cod_banco:        string
    desc_banco:       string
    fecha_deposito:   string
    numero_operacion: string
    numero_cheque:    string
}

const FORM_INICIAL: FormRegistro = {
    codigo_cliente: '', nombre_cliente: '', tipo_documento: '',
    serie: '', numero_doc: '', importe: '',
    numero_recibo: '', importe_cobrado: '',
    cod_banco: '', desc_banco: '', fecha_deposito: '',
    numero_operacion: '', numero_cheque: '',
}

const MAX_VOUCHERS = 3
const VOUCHER_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf'

interface Props {
    tiposComprobante: TipoComprobante[]
    bancos:           CatalogosBanco[]
    zones:            ZonaOption[]
    planillaActiva:   PlanillaCabecera | null
    detalle:          PlanillaDetalle[]
    onGenerarCorrelativo: (v: VendedorInfo, fecha: string, zona: string) => Promise<any>
    onLimpiar:            () => void
    onAgregarDetalle:     (id: number, reg: NuevoDetalle, vouchers: File[]) => Promise<any>
    onEliminarDetalle:    (id_planilla: number, id_detalle: number) => void
    onEnviarPlanilla:     (id: number, v: VendedorInfo) => Promise<any>
    misPlanillas:         PlanillaCabecera[]
    loadingMisPlanillas:  boolean
    onFetchMisPlanillas:  (params: { id_vendedor: number | string }) => void
    onFetchDetalle:       (id: number) => Promise<{ planilla: any; detalle: PlanillaDetalle[] } | null>
    onReenviar:           (id: number, v: VendedorInfo, regs: NuevoDetalle[]) => Promise<any>
    onCargarBorrador:     (planilla: PlanillaCabecera, detalle: PlanillaDetalle[]) => void
    vendedorInfo: VendedorInfo
}

export default function SeccionVendedor({
                                            tiposComprobante, bancos, zones,
                                            planillaActiva, detalle,
                                            onGenerarCorrelativo, onLimpiar,
                                            onAgregarDetalle, onEliminarDetalle, onEnviarPlanilla,
                                            misPlanillas, loadingMisPlanillas, onFetchMisPlanillas,
                                            onFetchDetalle, onReenviar, onCargarBorrador,
                                            vendedorInfo,
                                        }: Props) {

    const [tab,     setTab]     = useState<'nueva' | 'mis'>('nueva')
    const [creando, setCreando] = useState(false)
    const [enviando, setEnviando] = useState(false)
    const [guardando, setGuardando] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [fechaRuta,  setFechaRuta]  = useState(new Date().toISOString().slice(0, 10))
    const [zonaCombo,  setZonaCombo]  = useState('')
    const [zonaLibre,  setZonaLibre]  = useState('')
    const [usaCombo,   setUsaCombo]   = useState(false)
    const zonaEfectiva = usaCombo ? zonaCombo : zonaLibre

    const [clients,         setClients]         = useState<IClient[]>([])
    const [clientsFiltered, setClientsFiltered] = useState<IClient[]>([])
    const [clientSearch,    setClientSearch]    = useState("")
    const [selectedClient,  setSelectedClient]  = useState<IClient | null>(null)
    const [loadingClients,  setLoadingClients]  = useState(false)
    const { user, isAdmin } = useAuth()

    const [formReg, setFormReg] = useState<FormRegistro>(FORM_INICIAL)
    const fc = (f: keyof FormRegistro, v: string) => setFormReg(p => ({ ...p, [f]: v }))

    const [vouchers,    setVouchers]    = useState<File[]>([])
    const voucherInputRef               = useRef<HTMLInputElement>(null)

    const [docModalOpen, setDocModalOpen] = useState(false)

    const [openRows,     setOpenRows]     = useState<Set<number>>(new Set())
    const [detalleCache, setDetalleCache] = useState<Record<number, PlanillaDetalle[]>>({})
    const [loadingDet,   setLoadingDet]   = useState<number | null>(null)
    const [editId,       setEditId]       = useState<number | null>(null)
    const [editRegs,     setEditRegs]     = useState<PlanillaDetalle[]>([])
    const [reenviando,   setReen]         = useState(false)

    const [vouchersModal, setVouchersModal] = useState<{ open: boolean; planilla: any }>({ open: false, planilla: null })

    const rechazadas = useMemo(
        () => misPlanillas.filter(p => p.estado === 'rechazado').length,
        [misPlanillas]
    )

    useEffect(() => {
        onFetchMisPlanillas({ id_vendedor: vendedorInfo.id_vendedor })
    }, [vendedorInfo.id_vendedor])

    useEffect(() => {
        if (user) fetchClients()
    }, [user])

    const fetchClients = async () => {
        setLoadingClients(true)
        try {
            const sellerCode = isAdmin() ? "" : (user?.codigo || "")
            const response = await fetchGetAllClients(sellerCode, false)
            const data = response.data?.data?.data || []
            setClients(data)
            setClientsFiltered(data)
        } catch {
            setClients([])
        } finally {
            setLoadingClients(false)
        }
    }

    useEffect(() => {
        if (clientSearch) {
            setClientsFiltered(clients.filter(c =>
                c.RUC?.includes(clientSearch) ||
                c.Nombre?.toUpperCase().includes(clientSearch.toUpperCase())
            ))
        } else {
            setClientsFiltered(clients)
        }
    }, [clientSearch, clients])

    const handleClientSelect = (client: IClient | null) => {
        setSelectedClient(client)
        setFormReg(prev => ({
            ...prev,
            codigo_cliente: client?.RUC ?? client?.codigo ?? "",
            nombre_cliente: client?.Nombre ?? "",
            tipo_documento: '',
            serie: '',
            numero_doc: '',
            importe: '',
        }))
    }

    const handleDocumentoSelect = (doc: DocumentoCliente) => {
        fc('tipo_documento', doc.Tipo_Doc)
        fc('serie',          doc.SerieDoc)
        fc('numero_doc',     doc.NumeroDoc)
        fc('importe',        doc.saldo_pendiente.toString())
        toast({
            title: 'Documento cargado',
            description: `${doc.Abre_Doc} ${doc.SerieDoc}-${doc.NumeroDoc}`,
        })
    }

    const handleVoucherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        const disponibles = MAX_VOUCHERS - vouchers.length
        if (disponibles <= 0) {
            toast({ title: 'Límite alcanzado', description: `Máximo ${MAX_VOUCHERS} vouchers por registro.`, variant: 'warning' })
            return
        }
        const nuevos = files.slice(0, disponibles)
        setVouchers(prev => [...prev, ...nuevos])
        if (voucherInputRef.current) voucherInputRef.current.value = ''
    }

    const removeVoucher = (idx: number) => {
        setVouchers(prev => prev.filter((_, i) => i !== idx))
    }

    const voucherPreview = (file: File) => {
        if (file.type === 'application/pdf') return null
        return URL.createObjectURL(file)
    }

    const handleCrear = async () => {
        if (!fechaRuta || !zonaEfectiva.trim()) {
            toast({ title: 'Campos requeridos', description: 'Completa fecha de ruta y zona.', variant: 'warning' })
            return
        }
        setCreando(true)
        await onGenerarCorrelativo(vendedorInfo, fechaRuta, zonaEfectiva)
        setCreando(false)
    }

    const handleZonaCombo = (val: string) => { setUsaCombo(true); setZonaCombo(val); setZonaLibre('') }

    const handleAgregar = async () => {
        if (!planillaActiva) return
        if (!formReg.nombre_cliente || !formReg.tipo_documento || !formReg.importe) {
            toast({ title: 'Campos requeridos', description: 'Nombre, tipo de documento e importe son obligatorios.', variant: 'warning' })
            return
        }
        setGuardando(true)
        const banco = bancos.find(b => b.CodigoEntidadFinanciera === formReg.cod_banco)
        const nuevo = await onAgregarDetalle(
            planillaActiva.id_planilla,
            {
                ...formReg,
                importe:         parseFloat(formReg.importe),
                importe_cobrado: parseFloat(formReg.importe_cobrado || '0'),
                desc_banco:      banco?.DescripcionEntidadFinanciera || formReg.desc_banco,
            },
            vouchers
        )
        if (nuevo) {
            setFormReg(FORM_INICIAL)
            setVouchers([])
            setSelectedClient(null)
        }
        setGuardando(false)
    }

    const handleSolicitar = () => {
        if (!planillaActiva) return
        if (detalle.length === 0) {
            toast({ title: 'Sin registros', description: 'Agrega al menos un registro antes de enviar.', variant: 'warning' })
            return
        }
        setConfirmOpen(true)
    }

    const handleConfirmar = async () => {
        if (!planillaActiva) return
        setConfirmOpen(false)
        setEnviando(true)
        const p = await onEnviarPlanilla(planillaActiva.id_planilla, vendedorInfo)
        if (p) {
            onFetchMisPlanillas({ id_vendedor: vendedorInfo.id_vendedor })
            onLimpiar()
            setTab('mis')
        }
        setEnviando(false)
    }

    const toggleRow = async (planilla: PlanillaCabecera) => {
        const id = planilla.id_planilla
        const wasOpen = openRows.has(id)
        setOpenRows(prev => { const n = new Set(prev); wasOpen ? n.delete(id) : n.add(id); return n })
        if (!wasOpen && !detalleCache[id]) {
            setLoadingDet(id)
            const res = await onFetchDetalle(id)
            if (res?.detalle) setDetalleCache(prev => ({ ...prev, [id]: res.detalle }))
            setLoadingDet(null)
        }
    }

    const handleIniciarEdicion = async (planilla: PlanillaCabecera) => {
        const id = planilla.id_planilla
        let regs = detalleCache[id]
        if (!regs) {
            setLoadingDet(id)
            const res = await onFetchDetalle(id)
            regs = res?.detalle ?? []
            setDetalleCache(prev => ({ ...prev, [id]: regs! }))
            setLoadingDet(null)
        }
        setEditRegs([...regs])
        setEditId(id)
        setOpenRows(prev => { const n = new Set(prev); n.add(id); return n })
        toast({ title: 'Modo edición activado', description: 'Modifica los campos y reenvía.' })
    }

    const handleCancelarEdicion = () => { setEditId(null); setEditRegs([]) }

    const handleEditarBorrador = async (planilla: PlanillaCabecera) => {
        const id = planilla.id_planilla
        let regs = detalleCache[id]
        if (!regs) {
            setLoadingDet(id)
            const res = await onFetchDetalle(id)
            regs = res?.detalle ?? []
            setDetalleCache(prev => ({ ...prev, [id]: regs! }))
            setLoadingDet(null)
        }
        onCargarBorrador(planilla, regs)
        setTab('nueva')
        toast({ title: 'Planilla cargada', description: `Editando ${planilla.numero_planilla}` })
    }

    const handleReenviar = async () => {
        if (!editId) return
        setReen(true)
        await onReenviar(editId, vendedorInfo, editRegs.map(r => ({
            codigo_cliente:   r.codigo_cliente   || undefined,
            nombre_cliente:   r.nombre_cliente,
            tipo_documento:   r.tipo_documento,
            serie:            r.serie            || undefined,
            numero_doc:       r.numero_doc       || undefined,
            importe:          Number(r.importe),
            numero_recibo:    r.numero_recibo    || undefined,
            importe_cobrado:  Number(r.importe_cobrado),
            cod_banco:        r.cod_banco        || undefined,
            desc_banco:       r.desc_banco       || undefined,
            fecha_deposito:   r.fecha_deposito   || undefined,
            numero_operacion: r.numero_operacion || undefined,
            numero_cheque:    r.numero_cheque    || undefined,
        })))
        setEditId(null)
        setEditRegs([])
        onFetchMisPlanillas({ id_vendedor: vendedorInfo.id_vendedor })
        setReen(false)
    }

    return (
        <div className="space-y-4">

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5 text-emerald-600" /> Confirmar envío
                        </DialogTitle>
                        <DialogDescription>
                            Estás a punto de enviar la planilla{' '}
                            <strong>{planillaActiva?.numero_planilla}</strong> con{' '}
                            <strong>{detalle.length} registro{detalle.length !== 1 ? 's' : ''}</strong>{' '}
                            por un total de{' '}
                            <strong>{fmtMoney(detalle.reduce((s, r) => s + Number(r.importe_cobrado), 0))}</strong>.
                            <br /><br />
                            Una vez enviada <strong>no podrás modificarla</strong>. ¿Deseas continuar?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={enviando}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirmar}
                            className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                            disabled={enviando}
                        >
                            {enviando
                                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                : <Send className="h-4 w-4 mr-2" />}
                            Sí, enviar planilla
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <SeleccionarDocumentoModal
                open={docModalOpen}
                onOpenChange={setDocModalOpen}
                codCliente={formReg.codigo_cliente}
                codVendedor={isAdmin() ? undefined : user?.codigo}
                soloVigentes={false}
                onSelect={handleDocumentoSelect}
            />

            <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                {[
                    { id: 'nueva', label: 'Nueva planilla' },
                    { id: 'mis',   label: 'Mis planillas', badge: rechazadas },
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id as any)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold
                            whitespace-nowrap transition-all border-b-2
                            ${tab === t.id
                            ? 'text-sky-700 border-sky-600 bg-sky-50/50'
                            : 'text-slate-500 border-transparent hover:text-sky-600'}`}
                    >
                        {t.label}
                        {t.badge ? (
                            <span className="bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                {t.badge}
                            </span>
                        ) : null}
                    </button>
                ))}
            </div>

            {tab === 'nueva' && (
                <div className="space-y-4">
                    {!planillaActiva && (
                        <Card className="shadow-sm max-w-lg mx-auto overflow-hidden">
                            <div className="bg-slate-800 px-6 py-5">
                                <h2 className="text-lg font-semibold text-white mb-1">Nueva planilla de cobranza</h2>
                                <p className="text-xs text-blue-200">Selecciona la fecha y zona de ruta para generar el correlativo.</p>
                            </div>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                                            Fecha de ruta <span className="text-red-500">*</span>
                                        </label>
                                        <Input type="date" value={fechaRuta} onChange={e => setFechaRuta(e.target.value)} />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                                                Zona <span className="text-red-500">*</span>
                                            </label>
                                        </div>
                                        <ZonaCombobox
                                            zones={zones}
                                            value={usaCombo ? zonaCombo : ''}
                                            onChange={handleZonaCombo}
                                        />
                                        {!usaCombo && (
                                            <Input
                                                className="mt-1"
                                                placeholder="Ej: CHIMBOTE NORTE"
                                                value={zonaLibre}
                                                onChange={e => setZonaLibre(e.target.value)}
                                                maxLength={100}
                                            />
                                        )}
                                        {zonaEfectiva && (
                                            <p className="text-[11px] text-sky-600 font-medium">
                                                Zona: <strong>{zonaEfectiva}</strong>
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <Button onClick={handleCrear} disabled={creando} className="w-full bg-sky-600 hover:bg-sky-700 h-11">
                                    {creando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                    Generar correlativo y continuar
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {planillaActiva && (
                        <>
                            <div className="bg-white border border-sky-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-sky-600 flex items-center justify-center shrink-0">
                                        <FileText className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold font-mono text-sky-700 tracking-wider">
                                            {planillaActiva.numero_planilla}
                                        </p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {planillaActiva.zona} · {fmtFecha(planillaActiva.fecha_ruta)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <EstadoPill estado={planillaActiva.estado} size="md" />
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase text-slate-400 font-semibold">Total cobrado</p>
                                        <p className="font-mono font-bold text-emerald-600">
                                            {fmtMoney(detalle.reduce((s, r) => s + Number(r.importe_cobrado), 0))}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                                <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-100">
                                    <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center">
                                        <FileText className="h-3.5 w-3.5 text-sky-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-sky-800">Datos del documento</p>
                                    <span className="ml-auto text-[10px] text-slate-400 font-medium">Sección 1 de 2</span>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                                        <div className="flex flex-col gap-1.5 md:col-span-5">
                                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                                Buscar Cliente (Nombre o RUC/DNI) <span className="text-red-500">*</span>
                                            </label>
                                            <Combobox<IClient>
                                                items={clientsFiltered}
                                                value={selectedClient?.codigo ?? ""}
                                                onSearchChange={setClientSearch}
                                                onSelect={handleClientSelect}
                                                getItemKey={c => c.codigo}
                                                getItemLabel={c => `${c.Nombre} — ${c.RUC ?? 'S/N'}`}
                                                placeholder={loadingClients ? "Cargando clientes..." : "Escribe para buscar un cliente..."}
                                                emptyText="No se encontraron clientes"
                                                searchText="Buscar..."
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5 md:col-span-1">
                                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                                T/D <span className="text-red-500">*</span>
                                            </label>
                                            <Select value={formReg.tipo_documento} onValueChange={v => fc('tipo_documento', v)}>
                                                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                                                <SelectContent>
                                                    {tiposComprobante.map(t => (
                                                        <SelectItem key={t.codigo} value={t.codigo}>{t.descripcion}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Serie</label>
                                            <Input
                                                placeholder="02"
                                                value={formReg.serie}
                                                onChange={e => fc('serie', e.target.value)}
                                                maxLength={4}
                                                className="font-mono"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">N° Documento</label>
                                            <Input
                                                placeholder="10737"
                                                value={formReg.numero_doc}
                                                onChange={e => fc('numero_doc', e.target.value)}
                                                className="font-mono"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                                Importe S/. <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                type="number" step="0.01" min={0} placeholder="0.00"
                                                value={formReg.importe}
                                                onChange={e => fc('importe', e.target.value)}
                                                className="font-mono text-lg"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 invisible">
                                                Buscar doc.
                                            </label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    if (!formReg.codigo_cliente) {
                                                        toast({
                                                            title: 'Selecciona un cliente',
                                                            description: 'Primero elige el cliente para poder buscar sus documentos.',
                                                            variant: 'warning',
                                                        })
                                                        return
                                                    }
                                                    setDocModalOpen(true)
                                                }}
                                                className="w-full gap-2 border-sky-300 text-sky-700 hover:bg-sky-50"
                                                title="Ver documentos del cliente (kardex)"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                                <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-50 to-slate-50 border-b border-slate-100">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                                        <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-emerald-800">Liquidación de cobranza</p>
                                    <span className="ml-auto text-[10px] text-slate-400 font-medium">Sección 2 de 2</span>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Recibo N°</label>
                                            <Input
                                                placeholder="B/34752"
                                                value={formReg.numero_recibo}
                                                onChange={e => fc('numero_recibo', e.target.value)}
                                                maxLength={30} className="font-mono"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Importe cobrado S/.</label>
                                            <Input
                                                type="number" step="0.01" min={0} placeholder="0.00"
                                                value={formReg.importe_cobrado}
                                                onChange={e => fc('importe_cobrado', e.target.value)}
                                                className="font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div className="border-t border-dashed border-slate-200 pt-3">
                                        <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-3">Depósito bancario</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Banco (C/B)</label>
                                                <Select value={formReg.cod_banco} onValueChange={v => fc('cod_banco', v)}>
                                                    <SelectTrigger><SelectValue placeholder="— sin banco —" /></SelectTrigger>
                                                    <SelectContent>
                                                        {bancos.map(b => (
                                                            <SelectItem key={b.CodigoEntidadFinanciera} value={b.CodigoEntidadFinanciera}>
                                                                {b.DescripcionEntidadFinanciera}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Fecha depósito</label>
                                                <Input type="date" value={formReg.fecha_deposito} onChange={e => fc('fecha_deposito', e.target.value)} />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">N° Operación</label>
                                                <Input
                                                    placeholder="14009921"
                                                    value={formReg.numero_operacion}
                                                    onChange={e => fc('numero_operacion', e.target.value)}
                                                    maxLength={50} className="font-mono"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">N° Cheque</label>
                                                <Input
                                                    placeholder="Opcional"
                                                    value={formReg.numero_cheque}
                                                    onChange={e => fc('numero_cheque', e.target.value)}
                                                    maxLength={50} className="font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-dashed border-slate-200 pt-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider flex items-center gap-1.5">
                                                <Paperclip className="h-3 w-3" />
                                                Vouchers / comprobantes de pago
                                            </p>
                                            <span className="text-[10px] text-slate-400">
                                                {vouchers.length}/{MAX_VOUCHERS}
                                            </span>
                                        </div>

                                        {vouchers.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {vouchers.map((file, idx) => {
                                                    const preview = voucherPreview(file)
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="relative group w-20 h-20 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center"
                                                        >
                                                            {preview ? (
                                                                <img
                                                                    src={preview}
                                                                    alt={file.name}
                                                                    className="w-full h-full object-cover"
                                                                    onLoad={() => URL.revokeObjectURL(preview)}
                                                                />
                                                            ) : (
                                                                <div className="flex flex-col items-center gap-1 p-1">
                                                                    <FileText className="h-6 w-6 text-slate-400" />
                                                                    <span className="text-[9px] text-slate-400 truncate w-full text-center px-1">
                                                                        {file.name}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeVoucher(idx)}
                                                                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white
                                                                    flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}

                                        {vouchers.length < MAX_VOUCHERS && (
                                            <>
                                                <input
                                                    ref={voucherInputRef}
                                                    type="file"
                                                    accept={VOUCHER_ACCEPT}
                                                    multiple
                                                    className="hidden"
                                                    onChange={handleVoucherChange}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => voucherInputRef.current?.click()}
                                                    className="w-full h-14 border-2 border-dashed border-slate-300 rounded-lg
                                                        flex items-center justify-center gap-2
                                                        text-xs text-slate-400 hover:border-sky-400 hover:text-sky-600
                                                        hover:bg-sky-50/50 transition-all"
                                                >
                                                    <Upload className="h-4 w-4" />
                                                    Subir voucher (jpg, png, pdf) · máx. {MAX_VOUCHERS - vouchers.length} más
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    <Button
                                        onClick={handleAgregar}
                                        disabled={guardando}
                                        className="w-full h-11 border-2 border-dashed border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-400"
                                    >
                                        {guardando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                        Agregar registro a la planilla
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                                    <span className="text-sm font-semibold text-slate-700">Registros ingresados</span>
                                    <span className="text-xs text-slate-400 font-medium">
                                        {detalle.length} registro{detalle.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="p-4">
                                    <MiniTabla
                                        registros={detalle}
                                        tiposComprobante={tiposComprobante}
                                        bancos={bancos}
                                        onEliminar={id => onEliminarDetalle(planillaActiva.id_planilla, id)}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm">
                                <div className="flex gap-5">
                                    <div>
                                        <p className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Total documentos</p>
                                        <p className="font-mono font-semibold text-blue-800">
                                            {fmtMoney(detalle.reduce((s, r) => s + Number(r.importe), 0))}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Total cobrado</p>
                                        <p className="font-mono font-semibold text-emerald-600">
                                            {fmtMoney(detalle.reduce((s, r) => s + Number(r.importe_cobrado), 0))}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={onLimpiar} className="text-slate-500">
                                        Cancelar
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                                        onClick={handleSolicitar}
                                        disabled={enviando || detalle.length === 0}
                                    >
                                        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        Cerrar y enviar
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {tab === 'mis' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            {misPlanillas.length} planilla{misPlanillas.length !== 1 ? 's' : ''}
                        </p>
                        <Button
                            variant="outline" size="sm"
                            onClick={() => onFetchMisPlanillas({ id_vendedor: vendedorInfo.id_vendedor })}
                            disabled={loadingMisPlanillas}
                        >
                            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loadingMisPlanillas ? 'animate-spin' : ''}`} />
                            Actualizar
                        </Button>
                    </div>

                    {loadingMisPlanillas ? (
                        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
                    ) : misPlanillas.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <div className="text-3xl mb-3 opacity-40">📋</div>
                                <p className="text-slate-400">Aún no tienes planillas enviadas.</p>
                            </CardContent>
                        </Card>
                    ) : [...misPlanillas].reverse().map(planilla => {
                        const isOpen    = openRows.has(planilla.id_planilla)
                        const isLoading = loadingDet === planilla.id_planilla
                        const planillaVouchers: Voucher[] = (planilla as any).vouchers ?? []

                        const borderColor = planilla.estado === 'validado'  ? 'border-l-emerald-500'
                            : planilla.estado === 'rechazado' ? 'border-l-red-500'
                                : planilla.estado === 'enviado'   ? 'border-l-amber-500'
                                    : 'border-l-slate-300'

                        const avatarCls = planilla.estado === 'validado'  ? 'bg-emerald-50 text-emerald-700'
                            : planilla.estado === 'rechazado' ? 'bg-red-50 text-red-600'
                                : 'bg-amber-50 text-amber-600'

                        const tDocs = (detalleCache[planilla.id_planilla] ?? []).reduce((s, r) => s + Number(r.importe), 0)
                        const tCbza = (detalleCache[planilla.id_planilla] ?? []).reduce((s, r) => s + Number(r.importe_cobrado), 0)

                        return (
                            <Card key={planilla.id_planilla} className={`shadow-sm overflow-hidden border-l-4 ${borderColor}`}>
                                <div
                                    className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => toggleRow(planilla)}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${avatarCls}`}>
                                            {planilla.estado === 'validado'  ? <CheckCircle2 className="h-4 w-4" />
                                                : planilla.estado === 'rechazado' ? <AlertCircle  className="h-4 w-4" />
                                                    : <Send className="h-4 w-4" />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-bold font-mono text-slate-800">
                                                    {planilla.numero_planilla}
                                                </p>
                                                <span className="text-[10px] text-slate-400">· {planilla.zona}</span>
                                                <EstadoPill estado={planilla.estado} />
                                                {planilla.estado === 'rechazado' && (
                                                    <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold animate-pulse">!</span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                {fmtFecha(planilla.fecha_ruta)} · {fmtRel(planilla.fecha_envio)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        {planillaVouchers.length > 0 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setVouchersModal({ open: true, planilla })
                                                }}
                                                className="gap-1 text-sky-700 border-sky-200 hover:bg-sky-50 h-7 px-2"
                                                title="Ver vouchers"
                                            >
                                                <Paperclip className="h-3 w-3" />
                                                <span className="text-[10px] font-semibold">{planillaVouchers.length}</span>
                                            </Button>
                                        )}
                                        <div className="text-right">
                                            <p className="font-mono font-semibold text-slate-800">
                                                {fmtMoney(planilla.total_cobrado ?? tCbza)}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                {planilla.total_registros ?? (detalleCache[planilla.id_planilla]?.length ?? 0)} reg
                                                {tDocs > 0 ? ` · doc ${fmtMoney(tDocs)}` : ''}
                                            </p>
                                        </div>
                                        {isLoading
                                            ? <Loader2 className="h-4 w-4 text-slate-400 animate-spin shrink-0" />
                                            : isOpen
                                                ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 transition-transform" />
                                                : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 transition-transform" />
                                        }
                                    </div>
                                </div>

                                {isOpen && (
                                    <DetalleVendedor
                                        planilla={planilla}
                                        detalle={detalleCache[planilla.id_planilla] ?? []}
                                        loadingDet={isLoading}
                                        tiposComprobante={tiposComprobante}
                                        bancos={bancos}
                                        editId={editId}
                                        editRegs={editRegs}
                                        setEditRegs={setEditRegs}
                                        onIniciarEdicion={() => handleIniciarEdicion(planilla)}
                                        onCancelarEdicion={handleCancelarEdicion}
                                        onReenviar={handleReenviar}
                                        reenviando={reenviando}
                                        onEditarBorrador={planilla.estado === 'borrador'
                                            ? () => handleEditarBorrador(planilla)
                                            : undefined}
                                    />
                                )}
                            </Card>
                        )
                    })}
                </div>
            )}

            <VouchersModal
                open={vouchersModal.open}
                onOpenChange={(v) => setVouchersModal(prev => ({ ...prev, open: v }))}
                numeroPlanilla={vouchersModal.planilla?.numero_planilla ?? ''}
                vouchers={(vouchersModal.planilla as any)?.vouchers ?? []}
                baseUrl={publicApi ?? ''}
            />
        </div>
    )
}