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
    Eye, X, Upload, Image as ImageIcon, Paperclip, User, Layers, Sparkles,
    Lock, PencilLine, ScanSearch, Camera, Receipt, Search, Eraser, Trash2,
} from 'lucide-react'
import apiClient from '@/app/api/client'
import { toast } from '@/app/hooks/useToast'
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
import { IClient } from "@/app/types/order/client-interface"
import { BuscadorClienteReporte } from "@/components/reporte/BuscadorClienteReporte"
import {
    DocumentoCliente,
    SeleccionarDocumentoModal
} from "@/components/contabilidad/planilla-cobranza/SeleccionarDocumentoModal";
import {publicApi} from "@/app/api/client";
import {Voucher, VouchersModal} from "@/components/contabilidad/planilla-cobranza/VouchersModal";
import { UnificarImagenesModal } from "@/components/cobranza/UnificarImagenesModal";
import { SeleccionarReciboModal, ReciboDocumento } from "@/components/contabilidad/planilla-cobranza/SeleccionarReciboModal";
import { ReciboCabecera } from "@/app/types/recibo-cliente-types";
import { ExportarPlanillaFormato } from "@/components/contabilidad/planilla-cobranza/ExportarPlanillaFormato";

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

// Varios vouchers por registro, cada uno con su banco, fecha y operación. Está
// apagado hasta que la base de datos guarde esos datos por voucher (hoy el detalle
// tiene un solo banco/operación); con false se permite un solo voucher.
const VOUCHER_MULTIPLE = false
const MAX_VOUCHERS = VOUCHER_MULTIPLE ? 3 : 1

/** Estilo de los campos que vienen de un documento (recibo o voucher) y no se editan. */
const CLASE_BLOQUEADO = 'bg-muted/60 disabled:opacity-100 disabled:cursor-not-allowed font-medium'

const PASOS_LECTURA = [
    'Identificando el banco…',
    'Buscando el N° de operación…',
    'Leyendo la fecha del depósito…',
    'Leyendo el importe…',
]

/** Animación mientras la IA lee el voucher: escaneo sobre la foto y pasos que avanzan. */
function LecturaVoucher({ preview }: { preview: string | null }) {
    const [paso, setPaso] = useState(0)
    useEffect(() => {
        const t = setInterval(() => setPaso(p => (p + 1) % PASOS_LECTURA.length), 900)
        return () => clearInterval(t)
    }, [])
    return (
        <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-xl border-2 border-violet-300 bg-muted shadow-sm shadow-violet-200 dark:border-violet-800">
                {preview
                    ? <img src={preview} alt="" className="h-full w-full object-cover opacity-80" />
                    : <div className="flex h-full w-full items-center justify-center"><FileText className="h-8 w-8 text-muted-foreground" /></div>}
                <div className="absolute inset-0 bg-violet-500/10" />
                <div className="voucher-escaneo absolute left-0 right-0 h-0.5 bg-violet-500 shadow-[0_0_12px_4px_rgba(139,92,246,0.6)]" />
                {['left-1 top-1 border-l-2 border-t-2', 'right-1 top-1 border-r-2 border-t-2',
                  'left-1 bottom-1 border-l-2 border-b-2', 'right-1 bottom-1 border-r-2 border-b-2'].map(c => (
                    <span key={c} className={`absolute h-3 w-3 border-violet-500 ${c}`} />
                ))}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-violet-700 dark:text-violet-300">
                    <Sparkles className="h-4 w-4 shrink-0 animate-pulse" /> Leyendo con IA
                </p>
                <p key={paso} className="animate-in fade-in slide-in-from-bottom-1 text-xs text-muted-foreground duration-300">
                    {PASOS_LECTURA[paso]}
                </p>
                <div className="flex gap-1">
                    {PASOS_LECTURA.map((_, i) => (
                        <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= paso ? 'bg-violet-500' : 'bg-violet-200 dark:bg-violet-900'}`} />
                    ))}
                </div>
            </div>
        </div>
    )
}

/** Un comprobante de pago del registro, con sus propios datos de depósito. */
interface VoucherItem {
    id:               string
    file:             File
    preview:          string | null
    estado:           'leyendo' | 'leido' | 'manual'
    cod_banco:        string
    fecha:            string
    numero_operacion: string
    importe:          string
    /** Campos que vienen del voucher: quedan bloqueados. */
    bloqueados:       CampoVoucher[]
}
type CampoVoucher = 'cod_banco' | 'fecha' | 'numero_operacion' | 'importe'
const CAMPOS_VOUCHER: { k: CampoVoucher; t: string }[] = [
    { k: 'cod_banco', t: 'Banco' }, { k: 'fecha', t: 'Fecha' },
    { k: 'numero_operacion', t: 'N° de operación' }, { k: 'importe', t: 'Importe' },
]
const faltantes = (v: VoucherItem) => CAMPOS_VOUCHER.filter(c => !String(v[c.k] ?? '').trim())
const VOUCHER_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf'
const VOUCHER_TIPOS = VOUCHER_ACCEPT.split(',')
const VOUCHER_MAX_BYTES = 5 * 1024 * 1024

// Las fotos del celular pesan 6-8 MB. Se reducen antes de subirlas: con 1600 px
// el voucher se lee igual (es la resolución con la que lo procesa la IA) y pesa
// unos 200-300 KB. Los PDF no se tocan.
const VOUCHER_LADO_MAX = 1600

async function reducirImagen(file: File): Promise<File> {
    if (!file.type.startsWith('image/')) return file
    try {
        const bitmap = await createImageBitmap(file)
        const escala = Math.min(1, VOUCHER_LADO_MAX / Math.max(bitmap.width, bitmap.height))
        if (escala === 1 && file.size <= 1024 * 1024) { bitmap.close(); return file }
        const canvas = document.createElement('canvas')
        canvas.width  = Math.round(bitmap.width * escala)
        canvas.height = Math.round(bitmap.height * escala)
        const ctx = canvas.getContext('2d')
        if (!ctx) { bitmap.close(); return file }
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        bitmap.close()
        const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.85))
        if (!blob || blob.size >= file.size) return file
        return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg', lastModified: Date.now() })
    } catch {
        // Si el navegador no puede decodificarla se sube tal cual y la valida el tamaño.
        return file
    }
}

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
    onEliminarPlanilla:   (id: number, v: VendedorInfo) => Promise<boolean>
    vendedorInfo: VendedorInfo
}

export default function SeccionVendedor({
                                            tiposComprobante, bancos, zones,
                                            planillaActiva, detalle,
                                            onGenerarCorrelativo, onLimpiar,
                                            onAgregarDetalle, onEliminarDetalle, onEnviarPlanilla,
                                            misPlanillas, loadingMisPlanillas, onFetchMisPlanillas,
                                            onFetchDetalle, onReenviar, onCargarBorrador, onEliminarPlanilla,
                                            vendedorInfo,
                                        }: Props) {

    const [tab,     setTab]     = useState<'nueva' | 'mis'>('nueva')
    const [creando, setCreando] = useState(false)
    const [enviando, setEnviando] = useState(false)
    const [guardando, setGuardando] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [fechaRuta,  setFechaRuta]  = useState(new Date().toLocaleDateString('en-CA'))
    const [zonaCombo,  setZonaCombo]  = useState('')
    const [zonaLibre,  setZonaLibre]  = useState('')
    const [usaCombo,   setUsaCombo]   = useState(false)
    const zonaEfectiva = usaCombo ? zonaCombo : zonaLibre

    const [selectedClient,  setSelectedClient]  = useState<IClient | null>(null)
    const { user, isAdmin } = useAuth()

    const [formReg, setFormReg] = useState<FormRegistro>(FORM_INICIAL)
    const fc = (f: keyof FormRegistro, v: string) => setFormReg(p => ({ ...p, [f]: v }))

    // Comprobantes del registro: cada uno se lee con IA y sus datos quedan bloqueados.
    const [items, setItems] = useState<VoucherItem[]>([])
    const vouchers = items.map(i => i.file)
    // Vouchers que no se pudieron leer completos: se avisan de a uno en un modal.
    const [porRevisar, setPorRevisar] = useState<string[]>([])
    const enRevision = items.find(i => i.id === porRevisar[0]) ?? null

    const actualizarItem = (id: string, cambios: Partial<VoucherItem>) =>
        setItems(prev => prev.map(i => i.id === id ? { ...i, ...cambios } : i))

    const leerVoucher = async (item: VoucherItem) => {
        let d: any = {}
        try {
            const fd = new FormData()
            fd.append('voucher', item.file)
            const res = await apiClient.post('/planilla-cobranza/leer-voucher', fd)
            d = res.data?.data ?? {}
        } catch { /* sin datos: se pide completar a mano */ }
        const leidos: Record<CampoVoucher, string> = {
            cod_banco:        d.cod_banco ?? '',
            fecha:            d.fecha ?? '',
            numero_operacion: d.numero_operacion ?? '',
            importe:          d.importe != null ? String(d.importe) : '',
        }
        const bloqueados = CAMPOS_VOUCHER.map(c => c.k).filter(k => leidos[k])
        const completo = bloqueados.length === CAMPOS_VOUCHER.length
        setItems(prev => prev.map(i => i.id === item.id
            ? { ...i, ...leidos, bloqueados, estado: completo ? 'leido' : 'manual' }
            : i))
        if (!completo) setPorRevisar(prev => [...prev, item.id])
    }

    // El importe cobrado sale del recibo (o lo escribe el vendedor); el voucher solo sirve para avisar si no cuadra.
    const sumaVouchers = items.reduce((s, i) => s + (Number(i.importe) || 0), 0)
    const difiereImporte = items.length > 0 && sumaVouchers > 0 && Number(formReg.importe_cobrado) > 0
        && Math.abs(Number(formReg.importe_cobrado) - sumaVouchers) > 0.009

    const agregarArchivos = (files: File[]) => {
        const nuevos: VoucherItem[] = files.map(file => ({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            file,
            preview: file.type === 'application/pdf' ? null : URL.createObjectURL(file),
            estado: 'leyendo',
            cod_banco: '', fecha: '', numero_operacion: '', importe: '',
            bloqueados: [],
        }))
        setItems(prev => [...prev, ...nuevos])
        nuevos.forEach(leerVoucher)
    }

    const [unirModalOpen, setUnirModalOpen] = useState(false)
    const voucherInputRef               = useRef<HTMLInputElement>(null)

    const [docModalOpen, setDocModalOpen] = useState(false)

    // Recibo de cuenta importado: sus datos (cliente, documento, importes) no se editan.
    const [reciboModalOpen, setReciboModalOpen] = useState(false)
    const [recibo, setRecibo] = useState<{ cab: ReciboCabecera; doc: ReciboDocumento } | null>(null)
    const conRecibo = !!recibo

    const importarRecibo = (cab: ReciboCabecera, doc: ReciboDocumento) => {
        setRecibo({ cab, doc })
        setSelectedClient({ codigo: cab.cod_cliente, Nombre: cab.nombre_cliente, RUC: cab.ruc_cliente ?? '' } as IClient)
        setFormReg(p => ({
            ...p,
            codigo_cliente:  cab.ruc_cliente || cab.cod_cliente,
            nombre_cliente:  cab.nombre_cliente,
            tipo_documento:  doc.tipo_documento,
            serie:           doc.serie,
            numero_doc:      doc.numero_doc,
            importe:         String(doc.saldo_documento ?? doc.importe),
            numero_recibo:   `${cab.prefijo}-${cab.numero_recibo}`,
            importe_cobrado: Number(doc.importe).toFixed(2),
        }))
        toast({ title: 'Recibo importado', description: `${cab.prefijo}-${cab.numero_recibo} · ${doc.abre_documento} ${doc.serie}-${doc.numero_doc}` })
    }

    const quitarRecibo = () => {
        setRecibo(null)
        setSelectedClient(null)
        setFormReg(p => ({
            ...p,
            codigo_cliente: '', nombre_cliente: '', tipo_documento: '', serie: '', numero_doc: '',
            importe: '', numero_recibo: '', importe_cobrado: '',
        }))
    }

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

    const handleVoucherChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const originales = Array.from(e.target.files || [])
        if (voucherInputRef.current) voucherInputRef.current.value = ''

        const disponibles = MAX_VOUCHERS - vouchers.length
        if (disponibles <= 0) {
            toast({ title: 'Límite alcanzado', description: `Máximo ${MAX_VOUCHERS} vouchers por registro.`, variant: 'warning' })
            return
        }

        const validos: File[] = []
        for (const original of originales) {
            if (!VOUCHER_TIPOS.includes(original.type)) {
                toast({
                    title: 'Archivo no permitido',
                    description: `${original.name} no es JPG, PNG, WEBP ni PDF. Las fotos de iPhone (HEIC) hay que convertirlas antes.`,
                    variant: 'warning',
                })
                continue
            }
            const file = await reducirImagen(original)
            if (file.size > VOUCHER_MAX_BYTES) {
                toast({
                    title: 'Archivo muy pesado',
                    description: `${file.name} pesa ${(file.size / 1024 / 1024).toFixed(1)} MB y el máximo es 5 MB.`,
                    variant: 'warning',
                })
                continue
            }
            validos.push(file)
        }

        if (validos.length === 0) return

        if (validos.length > disponibles) {
            toast({
                title: 'Límite alcanzado',
                description: `Se agregaron ${disponibles} de ${validos.length}: el máximo es ${MAX_VOUCHERS} por registro.`,
                variant: 'warning',
            })
        }

        agregarArchivos(validos.slice(0, disponibles))
    }

    const handleImagenUnificada = async (unida: File) => {
        const file = await reducirImagen(unida)
        if (vouchers.length >= MAX_VOUCHERS) {
            toast({ title: 'Límite alcanzado', description: `Máximo ${MAX_VOUCHERS} vouchers por registro.`, variant: 'warning' })
            return
        }
        if (file.size > VOUCHER_MAX_BYTES) {
            toast({
                title: 'Archivo muy pesado',
                description: `La imagen unificada pesa ${(file.size / 1024 / 1024).toFixed(1)} MB y el máximo es 5 MB.`,
                variant: 'warning',
            })
            return
        }
        agregarArchivos([file])
        toast({ title: 'Imagen unificada', description: 'Se agregó como un voucher más.' })
    }

    const quitarVoucher = (id: string) => {
        setItems(prev => {
            const it = prev.find(i => i.id === id)
            if (it?.preview) URL.revokeObjectURL(it.preview)
            return prev.filter(i => i.id !== id)
        })
        setPorRevisar(prev => prev.filter(x => x !== id))
    }

    // Modal "no pudimos leer": completar a mano habilita solo lo que faltó.
    const completarAMano = () => setPorRevisar(prev => prev.slice(1))
    const subirOtraFoto = () => {
        if (enRevision) quitarVoucher(enRevision.id)
        setTimeout(() => voucherInputRef.current?.click(), 0)
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

    /** Lo cobrado debe ser mayor a 0 y no pasar el importe del documento. */
    const errorCobrado = (importe: number | string, cobrado: number | string) => {
        const c = Number(cobrado)
        if (!(c > 0)) return 'Ingresa el importe cobrado.'
        if (c > Number(importe) + 0.001) return 'El importe cobrado no puede ser mayor al importe del documento.'
        return null
    }

    /** Deja el formulario del registro en blanco: cliente, documento, recibo y vouchers. */
    const limpiarRegistro = () => {
        setFormReg(FORM_INICIAL)
        items.forEach(i => i.preview && URL.revokeObjectURL(i.preview))
        setItems([])
        setPorRevisar([])
        setRecibo(null)
        setSelectedClient(null)
    }
    const [limpiarOpen, setLimpiarOpen] = useState(false)
    const hayDatosRegistro = !!selectedClient || items.length > 0
        || Object.entries(formReg).some(([k, v]) => v !== (FORM_INICIAL as any)[k])

    const handleAgregar = async () => {
        if (!planillaActiva) return
        if (!formReg.nombre_cliente || !formReg.tipo_documento || !formReg.importe) {
            toast({ title: 'Campos requeridos', description: 'Nombre, tipo de documento e importe son obligatorios.', variant: 'warning' })
            return
        }
        if (!recibo) {
            toast({ title: 'Falta el recibo', description: 'Selecciona el recibo de cuenta: el importe cobrado sale de él.', variant: 'warning' })
            return
        }
        const errCobrado = errorCobrado(formReg.importe, formReg.importe_cobrado)
        if (errCobrado) {
            toast({ title: 'Importe cobrado', description: errCobrado, variant: 'warning' })
            return
        }
        if (items.some(i => i.estado === 'leyendo')) {
            toast({ title: 'Leyendo vouchers', description: 'Espera a que termine la lectura de los vouchers.', variant: 'warning' })
            return
        }
        const incompleto = items.findIndex(i => faltantes(i).length > 0)
        if (incompleto >= 0) {
            toast({
                title:       `Voucher ${incompleto + 1} incompleto`,
                description: `Completa: ${faltantes(items[incompleto]).map(c => c.t.toLowerCase()).join(', ')}.`,
                variant:     'warning',
            })
            return
        }
        setGuardando(true)
        // El registro guarda el depósito del primer voucher (el detalle tiene un solo banco/operación).
        const principal = items[0]
        const codBanco = principal?.cod_banco ?? formReg.cod_banco
        const banco = bancos.find(b => b.CodigoEntidadFinanciera === codBanco)
        const nuevo = await onAgregarDetalle(
            planillaActiva.id_planilla,
            {
                ...formReg,
                cod_banco:        codBanco,
                fecha_deposito:   principal?.fecha ?? formReg.fecha_deposito,
                numero_operacion: principal ? items.map(i => i.numero_operacion).join(' / ') : formReg.numero_operacion,
                importe:         parseFloat(formReg.importe),
                importe_cobrado: parseFloat(formReg.importe_cobrado || '0'),
                desc_banco:      banco?.DescripcionEntidadFinanciera || formReg.desc_banco,
            },
            vouchers
        )
        if (nuevo) limpiarRegistro()
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

    const [aEliminar,  setAEliminar]  = useState<PlanillaCabecera | null>(null)
    const [eliminando, setEliminando] = useState(false)
    const handleEliminarPlanilla = async () => {
        if (!aEliminar) return
        setEliminando(true)
        const ok = await onEliminarPlanilla(aEliminar.id_planilla, vendedorInfo)
        setEliminando(false)
        if (!ok) return
        // Si estaba abierta en "Nueva planilla", se cierra junto con lo que se estaba llenando.
        if (planillaActiva?.id_planilla === aEliminar.id_planilla) {
            limpiarRegistro()
            onLimpiar()
        }
        setOpenRows(prev => { const n = new Set(prev); n.delete(aEliminar.id_planilla); return n })
        setAEliminar(null)
        onFetchMisPlanillas({ id_vendedor: vendedorInfo.id_vendedor })
    }

    const handleReenviar = async () => {
        if (!editId) return
        const conError = editRegs.findIndex(r => errorCobrado(r.importe, r.importe_cobrado))
        if (conError >= 0) {
            const r = editRegs[conError]
            toast({
                title:       `Fila ${conError + 1}: importe cobrado`,
                description: `${r.serie ?? ''}-${r.numero_doc ?? ''} · ${errorCobrado(r.importe, r.importe_cobrado)}`,
                variant:     'warning',
            })
            return
        }
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

            <SeleccionarReciboModal
                open={reciboModalOpen}
                onOpenChange={setReciboModalOpen}
                idUsuarioWeb={user?.idUsuarioWeb}
                codCliente={formReg.codigo_cliente || undefined}
                onImportar={importarRecibo}
            />

            <Dialog open={!!enRevision} onOpenChange={v => { if (!v) completarAMano() }}>
                <DialogContent className="max-w-sm" onOpenAutoFocus={e => e.preventDefault()}>
                    <DialogHeader className="items-center text-center">
                        <div className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50">
                            <ScanSearch className="h-7 w-7 text-amber-600" />
                        </div>
                        <DialogTitle className="text-center">No pudimos leer todo el voucher</DialogTitle>
                        <DialogDescription className="text-center">
                            {enRevision && faltantes(enRevision).length === CAMPOS_VOUCHER.length
                                ? 'La foto no se ve con claridad o no parece un comprobante de pago.'
                                : enRevision && faltantes(enRevision).some(c => c.k === 'cod_banco')
                                    ? 'No logramos identificar a qué banco pertenece este comprobante.'
                                    : 'Algunos datos no se ven con claridad en la foto.'}
                            {' '}No te preocupes: puedes completarlos a mano.
                        </DialogDescription>
                    </DialogHeader>
                    {enRevision && (
                        <div className="flex gap-3 rounded-lg border bg-muted/40 p-3">
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted flex items-center justify-center">
                                {enRevision.preview
                                    ? <img src={enRevision.preview} alt="" className="h-full w-full object-cover" />
                                    : <FileText className="h-6 w-6 text-muted-foreground" />}
                            </div>
                            <div className="min-w-0 space-y-1 text-xs">
                                {enRevision.bloqueados.length > 0 && (
                                    <p><span className="font-semibold text-violet-700">Leímos:</span>{' '}
                                        {CAMPOS_VOUCHER.filter(c => enRevision.bloqueados.includes(c.k)).map(c => c.t.toLowerCase()).join(', ')}</p>
                                )}
                                <p><span className="font-semibold text-amber-700">Falta completar:</span>{' '}
                                    {faltantes(enRevision).map(c => c.t.toLowerCase()).join(', ')}</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2 sm:justify-center">
                        <Button variant="outline" className="gap-1.5" onClick={subirOtraFoto}>
                            <Camera className="h-4 w-4" /> Subir otra foto
                        </Button>
                        <Button className="gap-1.5 bg-sky-600 text-white hover:bg-sky-700" onClick={completarAMano}>
                            <PencilLine className="h-4 w-4" /> Completar a mano
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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

            <Dialog open={limpiarOpen} onOpenChange={setLimpiarOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                                <Eraser className="h-4 w-4" />
                            </span>
                            ¿Limpiar el registro?
                        </DialogTitle>
                        <DialogDescription>
                            Se borrará todo lo que llenaste en este registro: cliente, documento, recibo,
                            importe cobrado, datos del depósito y los vouchers subidos.
                        </DialogDescription>
                    </DialogHeader>
                    <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                        Los registros que ya agregaste a la planilla no se tocan.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setLimpiarOpen(false)}>Cancelar</Button>
                        <Button className="gap-1.5 bg-amber-600 text-white hover:bg-amber-700"
                                onClick={() => { limpiarRegistro(); setLimpiarOpen(false) }}>
                            <Eraser className="h-4 w-4" /> Sí, limpiar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!aEliminar} onOpenChange={v => { if (!v && !eliminando) setAEliminar(null) }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
                                <Trash2 className="h-4 w-4" />
                            </span>
                            ¿Eliminar la planilla {aEliminar?.numero_planilla}?
                        </DialogTitle>
                        <DialogDescription>
                            Se borrará la planilla con todos sus registros y vouchers. Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    {aEliminar && (
                        <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/40 p-3 text-xs">
                            <div><p className="text-muted-foreground">Fecha</p><p className="font-medium">{fmtFecha(aEliminar.fecha_ruta)}</p></div>
                            <div><p className="text-muted-foreground">Zona</p><p className="truncate font-medium">{aEliminar.zona || '—'}</p></div>
                            <div><p className="text-muted-foreground">Registros</p><p className="font-medium">{detalleCache[aEliminar.id_planilla]?.length ?? (aEliminar as any).total_registros ?? 0}</p></div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" disabled={eliminando} onClick={() => setAEliminar(null)}>Cancelar</Button>
                        <Button className="gap-1.5 bg-red-600 text-white hover:bg-red-700" disabled={eliminando} onClick={handleEliminarPlanilla}>
                            {eliminando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Sí, eliminar
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

            <div className="flex bg-background border border-border rounded-lg overflow-hidden shadow-sm">
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
                            : 'text-muted-foreground border-transparent hover:text-sky-600'}`}
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
                                        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Fecha de ruta <span className="text-red-500">*</span>
                                        </label>
                                        <Input type="date" value={fechaRuta} onChange={e => setFechaRuta(e.target.value)} />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                            <div className="bg-background border border-sky-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-sky-600 flex items-center justify-center shrink-0">
                                        <FileText className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold font-mono text-sky-700 tracking-wider">
                                            {planillaActiva.numero_planilla}
                                        </p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {planillaActiva.zona} · {fmtFecha(planillaActiva.fecha_ruta)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <EstadoPill estado={planillaActiva.estado} size="md" />
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase text-muted-foreground font-semibold">Total cobrado</p>
                                        <p className="font-mono font-bold text-emerald-600">
                                            {fmtMoney(detalle.reduce((s, r) => s + Number(r.importe_cobrado), 0))}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                                <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-sky-50 via-blue-50/60 to-transparent px-5 py-3.5 dark:from-sky-950/40 dark:via-blue-950/20">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-sm font-bold text-white shadow-sm shadow-sky-200 dark:shadow-none">1</span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold leading-tight text-sky-900 dark:text-sky-100">Cliente y documento</p>
                                        <p className="text-[11px] text-muted-foreground">A quién se le cobra y qué documento se liquida</p>
                                    </div>
                                    <span className="ml-auto shrink-0 rounded-full border border-sky-200 bg-background px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:border-sky-900 dark:text-sky-300">Paso 1 de 2</span>
                                </div>
                                <div className="space-y-4 p-5">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            <User className="h-3 w-3" /> Cliente <span className="text-red-500">*</span>
                                        </label>
                                        {conRecibo && selectedClient ? (
                                            <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-2.5">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
                                                    <User className="h-4 w-4 text-white" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-blue-900 truncate leading-tight">
                                                        {selectedClient.Nombre}
                                                    </p>
                                                    <p className="text-xs text-blue-600 truncate">
                                                        {selectedClient.RUC ? `RUC: ${selectedClient.RUC}` : selectedClient.codigo}
                                                    </p>
                                                </div>
                                                <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-blue-600">
                                                    <Lock className="h-3 w-3" /> Del recibo
                                                </span>
                                            </div>
                                        ) : (
                                            <BuscadorClienteReporte
                                                valor={selectedClient}
                                                onChange={c => handleClientSelect(c as IClient | null)}
                                            />
                                        )}
                                    </div>

                                    <div className={`rounded-xl border p-4 transition-colors ${formReg.codigo_cliente ? 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40' : 'border-dashed border-slate-200 bg-muted/20 dark:border-slate-800'}`}>
                                        <div className="mb-3 flex flex-wrap items-center gap-2">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
                                                <FileText className="h-3.5 w-3.5" />
                                            </span>
                                            <p className="text-sm font-semibold text-foreground">Documento a cobrar</p>
                                            {conRecibo && (
                                                <span className="flex items-center gap-1 text-[11px] font-medium text-blue-600">
                                                    <Lock className="h-3 w-3" /> Del recibo
                                                </span>
                                            )}
                                            <Button
                                                type="button" size="sm" variant="outline"
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
                                                disabled={conRecibo}
                                                className="ml-auto h-8 gap-1.5 border-sky-300 bg-background text-xs text-sky-700 hover:bg-sky-50"
                                                title="Ver documentos del cliente (kardex)"
                                            >
                                                <Eye className="h-3.5 w-3.5" /> Ver documentos del cliente
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 md:grid-cols-12">
                                            <div className="col-span-2 flex flex-col gap-1.5 md:col-span-3">
                                                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo <span className="text-red-500">*</span></label>
                                                <Select value={formReg.tipo_documento} onValueChange={v => fc('tipo_documento', v)} disabled={conRecibo}>
                                                    <SelectTrigger className={`bg-background ${conRecibo ? CLASE_BLOQUEADO : ''}`}><SelectValue placeholder="Elegir tipo" /></SelectTrigger>
                                                    <SelectContent>
                                                        {tiposComprobante.map(t => (
                                                            <SelectItem key={t.codigo} value={t.codigo}>{t.descripcion}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex flex-col gap-1.5 md:col-span-2">
                                                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Serie</label>
                                                <Input
                                                    placeholder="Ej. F001"
                                                    value={formReg.serie}
                                                    onChange={e => fc('serie', e.target.value)}
                                                    maxLength={4} disabled={conRecibo}
                                                    className={`bg-background font-mono placeholder:font-sans placeholder:text-muted-foreground/50 ${conRecibo ? CLASE_BLOQUEADO : ''}`}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5 md:col-span-3">
                                                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">N° documento</label>
                                                <Input
                                                    placeholder="Ej. 10737"
                                                    value={formReg.numero_doc}
                                                    onChange={e => fc('numero_doc', e.target.value)}
                                                    disabled={conRecibo}
                                                    className={`bg-background font-mono placeholder:font-sans placeholder:text-muted-foreground/50 ${conRecibo ? CLASE_BLOQUEADO : ''}`}
                                                />
                                            </div>
                                            <div className="col-span-2 flex flex-col gap-1.5 md:col-span-4">
                                                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Importe del documento <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">S/</span>
                                                    <Input
                                                        type="number" step="0.01" min={0} placeholder="0.00"
                                                        value={formReg.importe}
                                                        onChange={e => fc('importe', e.target.value)}
                                                        disabled={conRecibo}
                                                        className={`bg-background pl-9 text-right font-mono text-base font-semibold placeholder:text-muted-foreground/50 ${conRecibo ? CLASE_BLOQUEADO : ''}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-background border border-border rounded-xl overflow-hidden shadow-sm">
                                <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-emerald-50 via-teal-50/60 to-transparent px-5 py-3.5 dark:from-emerald-950/40 dark:via-teal-950/20">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-sm shadow-emerald-200 dark:shadow-none">2</span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold leading-tight text-emerald-900 dark:text-emerald-100">Liquidación de cobranza</p>
                                        <p className="text-[11px] text-muted-foreground">Recibo, importe cobrado y comprobantes de pago</p>
                                    </div>
                                    <span className="ml-auto shrink-0 rounded-full border border-emerald-200 bg-background px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:border-emerald-900 dark:text-emerald-300">Paso 2 de 2</span>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                                        <div className="mb-3 flex items-center gap-2">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
                                                <Receipt className="h-3.5 w-3.5" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold leading-tight text-foreground">Recibo de cuenta</p>
                                                <p className="text-[11px] text-muted-foreground">Obligatorio: el importe cobrado sale del recibo</p>
                                            </div>
                                        </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                {conRecibo && <Lock className="h-2.5 w-2.5" />}Recibo N° <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex gap-2">
                                                <div className={`flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border px-3
                                                    ${recibo ? 'border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/40' : 'bg-background'}`}>
                                                    <Receipt className={`h-4 w-4 shrink-0 ${recibo ? 'text-sky-600' : 'text-muted-foreground'}`} />
                                                    {recibo ? (
                                                        <span className="min-w-0 flex-1 truncate font-mono text-sm font-semibold text-sky-900 dark:text-sky-100">
                                                            {formReg.numero_recibo}
                                                            <span className="ml-2 font-sans text-xs font-normal text-sky-700">· {recibo.doc.abre_documento} {recibo.doc.serie}-{recibo.doc.numero_doc}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="flex-1 truncate text-sm text-muted-foreground">Selecciona un recibo emitido</span>
                                                    )}
                                                    {recibo && (
                                                        <button type="button" onClick={quitarRecibo} title="Quitar recibo"
                                                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600">
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                                {recibo?.cab.ruta_pdf && (
                                                    <Button type="button" variant="outline" size="icon" asChild
                                                            className="h-10 w-10 shrink-0 border-sky-300 text-sky-700 hover:bg-sky-50" title="Ver PDF del recibo">
                                                        <a href={`${publicApi}${recibo.cab.ruta_pdf}`} target="_blank" rel="noreferrer"><Eye className="h-4 w-4" /></a>
                                                    </Button>
                                                )}
                                                <Button type="button" variant="outline" onClick={() => setReciboModalOpen(true)}
                                                        className="h-10 shrink-0 gap-1.5 border-sky-300 text-sky-700 hover:bg-sky-50"
                                                        title={recibo ? 'Cambiar recibo' : 'Buscar mis recibos'}>
                                                    <Search className="h-4 w-4" />
                                                    <span className="hidden sm:inline">{recibo ? 'Cambiar' : 'Buscar'}</span>
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                <Lock className="h-2.5 w-2.5" />Importe cobrado S/.
                                            </label>
                                            <Input
                                                type="number" step="0.01" min={0} placeholder="Sale del recibo"
                                                value={formReg.importe_cobrado}
                                                disabled
                                                className={`h-10 font-mono placeholder:font-sans placeholder:text-muted-foreground/60 ${CLASE_BLOQUEADO}`}
                                            />
                                            {difiereImporte && (
                                                <p className="flex items-start gap-1 text-[11px] leading-snug text-amber-700 dark:text-amber-400">
                                                    <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                                                    {VOUCHER_MULTIPLE ? 'Los vouchers suman' : 'El voucher dice'} S/ {sumaVouchers.toFixed(2)} y el recibo dice S/ {Number(formReg.importe_cobrado).toFixed(2)}.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    </div>

                                    <div className="space-y-3 rounded-xl border border-violet-100 bg-violet-50/30 p-4 dark:border-violet-950 dark:bg-violet-950/10">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                                                <Paperclip className="h-3.5 w-3.5" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold leading-tight text-foreground">Comprobantes de pago</p>
                                                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                    <Sparkles className="h-3 w-3 text-violet-500" /> Banco, fecha y operación se leen del voucher
                                                </p>
                                            </div>
                                            {VOUCHER_MULTIPLE && <span className="ml-auto text-[10px] text-muted-foreground">{items.length}/{MAX_VOUCHERS}</span>}
                                        </div>

                                        {items.map((v, idx) => (
                                            <div key={v.id} className={`rounded-xl border p-3 space-y-3
                                                ${v.estado === 'manual' ? 'border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20' : 'border-violet-200 bg-violet-50/40 dark:border-violet-900 dark:bg-violet-950/20'}`}>
                                                {v.estado === 'leyendo' ? (
                                                    <div className="flex items-start gap-2">
                                                        <div className="flex-1"><LecturaVoucher preview={v.preview} /></div>
                                                        <button type="button" onClick={() => quitarVoucher(v.id)} title="Quitar voucher"
                                                                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600">
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                <div className="flex items-center gap-3 animate-in fade-in duration-500">
                                                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                                                        {v.preview
                                                            ? <img src={v.preview} alt={v.file.name} className="h-full w-full object-cover" />
                                                            : <FileText className="h-6 w-6 text-muted-foreground" />}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-semibold">{VOUCHER_MULTIPLE ? `Voucher ${idx + 1}` : 'Voucher'}</p>
                                                        {v.estado === 'leido' && <p className="flex items-center gap-1 text-xs text-violet-700 dark:text-violet-300"><Sparkles className="h-3 w-3" /> Leído del voucher</p>}
                                                        {v.estado === 'manual' && <p className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400"><PencilLine className="h-3 w-3" /> Completa a mano lo que falta</p>}
                                                    </div>
                                                    <button type="button" onClick={() => quitarVoucher(v.id)} title="Quitar voucher"
                                                            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                )}

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                    {CAMPOS_VOUCHER.map((c, ci) => {
                                                        if (v.estado === 'leyendo') return (
                                                            <div key={c.k} className="flex flex-col gap-1">
                                                                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{c.t}</label>
                                                                <div className="voucher-brillo h-9 rounded-md border" />
                                                            </div>
                                                        )
                                                        const bloqueado = v.bloqueados.includes(c.k)
                                                        const clase = bloqueado ? 'bg-muted/60 text-foreground disabled:opacity-100 font-medium' : 'bg-background'
                                                        return (
                                                            <div key={c.k} className="flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-500"
                                                                 style={{ animationDelay: `${ci * 120}ms` }}>
                                                                <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                                    {bloqueado && <Lock className="h-2.5 w-2.5" />}{c.t}
                                                                </label>
                                                                {c.k === 'cod_banco' ? (
                                                                    <Select value={v.cod_banco} onValueChange={val => actualizarItem(v.id, { cod_banco: val })} disabled={bloqueado}>
                                                                        <SelectTrigger className={`h-9 text-xs ${clase}`}><SelectValue placeholder="Elegir banco" /></SelectTrigger>
                                                                        <SelectContent>
                                                                            {bancos.map(b => (
                                                                                <SelectItem key={b.CodigoEntidadFinanciera} value={b.CodigoEntidadFinanciera}>{b.DescripcionEntidadFinanciera}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                ) : (
                                                                    <Input
                                                                        type={c.k === 'fecha' ? 'date' : c.k === 'importe' ? 'number' : 'text'}
                                                                        step={c.k === 'importe' ? '0.01' : undefined}
                                                                        value={v[c.k]} disabled={bloqueado}
                                                                        onChange={e => actualizarItem(v.id, { [c.k]: e.target.value } as Partial<VoucherItem>)}
                                                                        className={`h-9 text-xs font-mono ${clase}`}
                                                                    />
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}

                                        {items.length < MAX_VOUCHERS && (
                                            <>
                                                <input
                                                    ref={voucherInputRef}
                                                    type="file"
                                                    accept={VOUCHER_ACCEPT}
                                                    multiple={VOUCHER_MULTIPLE}
                                                    className="hidden"
                                                    onChange={handleVoucherChange}
                                                />
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => voucherInputRef.current?.click()}
                                                        className="h-14 border-2 border-dashed border-sky-300 rounded-lg
                                                            flex items-center justify-center gap-2 px-3
                                                            text-xs font-medium text-sky-700 hover:border-sky-400
                                                            hover:bg-sky-50/50 transition-all"
                                                    >
                                                        {items.length === 0 ? <Upload className="h-4 w-4 shrink-0" /> : <Plus className="h-4 w-4 shrink-0" />}
                                                        <span className="text-left leading-tight">
                                                            {items.length === 0 ? 'Subir voucher' : 'Agregar otro voucher'}
                                                            <span className="block text-[10px] font-normal opacity-70">
                                                                foto o PDF{VOUCHER_MULTIPLE && <> · máx. {MAX_VOUCHERS - items.length} más</>}
                                                            </span>
                                                        </span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setUnirModalOpen(true)}
                                                        className="h-14 border-2 border-dashed border-violet-200 rounded-lg
                                                            flex items-center justify-center gap-2 px-3
                                                            text-xs text-violet-600 hover:border-violet-400
                                                            hover:bg-violet-50/50 transition-all"
                                                    >
                                                        <Layers className="h-4 w-4 shrink-0" />
                                                        <span className="text-left leading-tight">
                                                            Unir varias fotos
                                                            <span className="block text-[10px] opacity-70">
                                                                recortar y ordenar
                                                            </span>
                                                        </span>
                                                    </button>
                                                </div>
                                            </>
                                        )}

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">N° Cheque</label>
                                                <Input
                                                    placeholder="Opcional"
                                                    value={formReg.numero_cheque}
                                                    onChange={e => fc('numero_cheque', e.target.value)}
                                                    maxLength={50} className="bg-background font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            type="button" variant="outline"
                                            onClick={() => setLimpiarOpen(true)}
                                            disabled={guardando || !hayDatosRegistro}
                                            className="h-11 shrink-0 gap-1.5 px-4 text-muted-foreground"
                                            title="Borrar lo escrito en este registro"
                                        >
                                            <Eraser className="h-4 w-4" /> Limpiar
                                        </Button>
                                        <Button
                                            onClick={handleAgregar}
                                            disabled={guardando}
                                            className="h-11 flex-1 border-2 border-dashed border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-400"
                                        >
                                            {guardando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                            Agregar registro a la planilla
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-background border border-border rounded-xl overflow-hidden shadow-sm">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted">
                                    <span className="text-sm font-semibold text-foreground">Registros ingresados</span>
                                    <span className="text-xs text-muted-foreground font-medium">
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

                            <div className="flex flex-wrap items-center justify-between gap-3 bg-background border border-border rounded-xl px-4 py-3 shadow-sm">
                                <div className="flex gap-5">
                                    <div>
                                        <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Total documentos</p>
                                        <p className="font-mono font-semibold text-blue-800">
                                            {fmtMoney(detalle.reduce((s, r) => s + Number(r.importe), 0))}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Total cobrado</p>
                                        <p className="font-mono font-semibold text-emerald-600">
                                            {fmtMoney(detalle.reduce((s, r) => s + Number(r.importe_cobrado), 0))}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap justify-end gap-2">
                                    <ExportarPlanillaFormato planilla={planillaActiva} detalle={detalle}
                                                             tiposComprobante={tiposComprobante} bancos={bancos} etiqueta="Vista previa" />
                                    <Button variant="outline" size="sm" onClick={onLimpiar} className="text-muted-foreground">
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
                        <p className="text-sm text-muted-foreground">
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
                                <p className="text-muted-foreground">Aún no tienes planillas enviadas.</p>
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
                                    className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-muted transition-colors"
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
                                                <p className="text-sm font-bold font-mono text-card-foreground">
                                                    {planilla.numero_planilla}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground">· {planilla.zona}</span>
                                                <EstadoPill estado={planilla.estado} />
                                                {planilla.estado === 'rechazado' && (
                                                    <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold animate-pulse">!</span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
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
                                            <p className="font-mono font-semibold text-card-foreground">
                                                {fmtMoney(planilla.total_cobrado ?? tCbza)}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {planilla.total_registros ?? (detalleCache[planilla.id_planilla]?.length ?? 0)} reg
                                                {tDocs > 0 ? ` · doc ${fmtMoney(tDocs)}` : ''}
                                            </p>
                                        </div>
                                        {isLoading
                                            ? <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
                                            : isOpen
                                                ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform" />
                                                : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform" />
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
                                        onEliminarBorrador={planilla.estado === 'borrador'
                                            ? () => setAEliminar(planilla)
                                            : undefined}
                                    />
                                )}
                            </Card>
                        )
                    })}
                </div>
            )}

            <UnificarImagenesModal
                open={unirModalOpen}
                onOpenChange={setUnirModalOpen}
                onConfirmar={handleImagenUnificada}
            />

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