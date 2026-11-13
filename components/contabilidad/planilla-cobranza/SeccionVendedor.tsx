'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
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
    Eye, X, Upload, Paperclip, User, Layers, Sparkles,
    Lock, LockOpen, PencilLine, ScanSearch, Camera, Receipt, Search, Eraser, Trash2,
    Link2, Split, UserCog, Landmark, Filter,
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
import { BuscadorClienteReporte, ClienteBusqueda } from "@/components/reporte/BuscadorClienteReporte"
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
import { fetchGetAllClients } from "@/app/api/takeOrders";
import { prepararParaEnvio, LIMITE_ENVIO_BYTES, MENSAJE_ARCHIVOS_PESADOS } from "@/lib/subida-archivos";

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

/** Estilo de los campos que vienen de un documento (recibo, kardex o voucher) y no se editan. */
const CLASE_BLOQUEADO = 'bg-muted/60 disabled:opacity-100 disabled:cursor-not-allowed font-medium'
/** Campo obligatorio sin completar (se marca en rojo al intentar agregar). */
const CLASE_ERROR = 'border-red-500 focus-visible:ring-red-300'

function ErrorCampo({ msg }: { msg?: string }) {
    if (!msg) return null
    return <p className="text-[11px] leading-snug text-red-600 dark:text-red-400">{msg}</p>
}

const PASOS_LECTURA = [
    'Identificando el banco…',
    'Buscando el N° de operación…',
    'Leyendo la fecha del depósito…',
    'Leyendo el importe…',
]

/** Animación mientras la IA lee el voucher: escaneo sobre la foto y pasos que avanzan. */
function LecturaVoucher({ preview, texto }: { preview: string | null; texto?: string }) {
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
                    <Sparkles className="h-4 w-4 shrink-0 animate-pulse" /> {texto ?? 'Leyendo con IA'}
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

// --- Voucher: lectura con IA, varios depósitos y voucher compartido (como la app) ---------------------

/** Lo que el servidor lee de un voucher (POST /planilla-cobranza/leer-voucher). Lo no leído queda vacío. */
interface DatosVoucher {
    cod_banco?:        string
    fecha?:            string
    numero_operacion?: string
    importe?:          number
}

/** Campos del depósito que pueden venir del voucher (quedan bloqueados). */
type CampoVoucher = 'cod_banco' | 'fecha_deposito' | 'numero_operacion' | 'importe'
const CAMPOS_VOUCHER: { k: CampoVoucher; t: string }[] = [
    { k: 'cod_banco', t: 'banco' }, { k: 'fecha_deposito', t: 'fecha' },
    { k: 'numero_operacion', t: 'n° de operación' }, { k: 'importe', t: 'importe' },
]

const faltantesDatos = (d: DatosVoucher) => [
    ...(!d.cod_banco ? ['banco'] : []),
    ...(!d.fecha ? ['fecha'] : []),
    ...(!d.numero_operacion ? ['n° de operación'] : []),
    ...(d.importe == null ? ['importe'] : []),
]

/** El voucher del registro (uno por registro). */
interface VoucherSel { file: File; preview: string | null }

/** Otro voucher escaneado junto con el del registro: va en su propio registro (un registro por depósito). */
interface DepositoExtra { id: string; file: File; preview: string | null; datos: DatosVoucher }

/** Un mismo depósito que paga varios documentos: el siguiente registro reusa el voucher y sus datos. */
interface VoucherCompartido {
    file:             File
    cod_banco:        string
    desc_banco?:      string
    fecha_deposito:   string
    numero_operacion: string
    /** Importe del depósito (lo que dice el voucher). */
    importe:          number
    /** Lo ya registrado en la planilla con este depósito (mismo banco y N° de operación). */
    asignado:         number
}
const quedanDe = (v: VoucherCompartido) => v.importe - v.asignado

const VOUCHER_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf'
const esTipoPermitido = (f: File) =>
    /^(image\/(jpe?g|png|webp)|application\/pdf)$/i.test(f.type) || /\.(jpe?g|png|webp|pdf)$/i.test(f.name)
const esPdf = (f: File) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name)
const VOUCHER_MAX_BYTES = 5 * 1024 * 1024

// Las fotos del celular pesan 6-8 MB. Se reducen antes de subirlas: con 1600 px
// el voucher se lee igual (es la resolución con la que lo procesa la IA) y pesa
// unos 200-300 KB. Los PDF no se tocan. Antes de cada envío se vuelven a ajustar
// para que el total no pase ~900 KB (lib/subida-archivos).
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

function normalizarLectura(d: any): DatosVoucher {
    const t = (v: unknown) => {
        const s = v == null ? '' : String(v).trim()
        return s && s !== 'null' ? s : undefined
    }
    const fecha = t(d?.fecha)
    const importe = d?.importe != null ? Number(d.importe) : NaN
    return {
        cod_banco:        t(d?.cod_banco),
        // Solo AAAA-MM-DD (como DateTime.tryParse de la app) y dentro del rango permitido:
        // una fecha mal leída queda libre para corregirla a mano en vez de bloqueada.
        fecha:            fecha && /^\d{4}-\d{2}-\d{2}/.test(fecha) && !isNaN(Date.parse(fecha.slice(0, 10)))
                              && fecha.slice(0, 10) >= rangoFechaDeposito().min && fecha.slice(0, 10) <= rangoFechaDeposito().max
                              ? fecha.slice(0, 10) : undefined,
        numero_operacion: t(d?.numero_operacion),
        importe:          importe > 0 ? importe : undefined,
    }
}

/** Lee un voucher con IA. Si no puede (archivo muy pesado, 422/503, sin conexión) devuelve datos vacíos. */
async function leerVoucherApi(file: File): Promise<DatosVoucher> {
    try {
        const [listo] = await prepararParaEnvio([file])
        const fd = new FormData()
        fd.append('voucher', listo)
        const res = await apiClient.post('/planilla-cobranza/leer-voucher', fd)
        return normalizarLectura(res.data?.data ?? {})
    } catch {
        return {}
    }
}

/**
 * Varias hojas escaneadas a la vez: posiciones de los vouchers distintos (el mismo voucher escaneado
 * dos veces, con el mismo N° de operación e importe, cuenta una sola vez) y cuántos se descartaron.
 */
function depositosDistintos(hojas: DatosVoucher[]): { unicos: number[]; repetidos: number } {
    const unicos: number[] = []
    hojas.forEach((h, i) => {
        const op = h.numero_operacion?.trim()
        const repetido = !!op && unicos.some(u => hojas[u].numero_operacion?.trim() === op && hojas[u].importe === h.importe)
        if (!repetido) unicos.push(i)
    })
    return { unicos, repetidos: hojas.length - unicos.length }
}

/** Lo registrado en la planilla con un depósito (mismo N° de operación y, si se conoce, mismo banco). */
function asignadoAlDeposito(
    registros: { numero_operacion?: string | null; cod_banco?: string | null; importe_cobrado: number | string }[],
    codBanco: string | undefined,
    operacion: string,
) {
    return registros
        .filter(r => (r.numero_operacion ?? '').trim() === operacion.trim()
            && (!codBanco || !r.cod_banco || r.cod_banco === codBanco))
        .reduce((s, r) => s + (Number(r.importe_cobrado) || 0), 0)
}

/** Lo cobrado debe ser mayor a 0 y no pasar el importe del documento. */
function errorCobrado(importe: number | string, cobrado: number | string) {
    const c = Number(cobrado)
    if (!(c > 0)) return 'Ingresa el importe cobrado.'
    if (c > Number(importe) + 0.001) return 'El importe cobrado no puede ser mayor al importe del documento.'
    return null
}

/** Número escrito por el usuario (acepta coma decimal); vacío -> NaN. */
const num = (s: string | number | null | undefined) => {
    const t = String(s ?? '').trim().replace(',', '.')
    return t === '' ? NaN : Number(t)
}

/** Rango permitido para la fecha del depósito (como el selector de la app). */
function rangoFechaDeposito() {
    const y = new Date().getFullYear()
    return { min: `${y - 2}-01-01`, max: `${y + 1}-12-31` }
}

/** Varias zonas en la única `zona` de texto que guarda el backend: `HUARAZ / HUARMEY`. */
const MAX_ZONA = 100
const unirZonas = (zonas: string[]) => zonas.map(z => z.trim()).filter(Boolean).join(' / ')

const ESTADOS_FILTRO = [
    { v: 'todos',     t: 'Todos los estados' },
    { v: 'borrador',  t: 'Borrador' },
    { v: 'enviado',   t: 'Enviado' },
    { v: 'validado',  t: 'Aprobado' },
    { v: 'rechazado', t: 'Con observación' },
]

/** "Creada por <x>": la planilla la creó administración a nombre del vendedor. */
function BadgeCreadoPor({ nombre }: { nombre?: string | null }) {
    if (!nombre) return null
    return (
        <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300">
            <UserCog className="h-3 w-3 shrink-0" />
            <span className="truncate">Creada por {nombre}</span>
        </span>
    )
}

interface Props {
    tiposComprobante: TipoComprobante[]
    bancos:           CatalogosBanco[]
    zones:            ZonaOption[]
    planillaActiva:   PlanillaCabecera | null
    detalle:          PlanillaDetalle[]
    onGenerarCorrelativo: (v: VendedorInfo, fecha: string, zona: string) => Promise<any>
    onLimpiar:            () => void
    onAgregarDetalle:     (id: number, reg: NuevoDetalle, vouchers: File[], opciones?: { silencioso?: boolean }) => Promise<any>
    onRecargarDetalle:    (id: number) => Promise<any>
    onEliminarDetalle:    (id_planilla: number, id_detalle: number) => void
    onEnviarPlanilla:     (id: number, v: VendedorInfo) => Promise<any>
    misPlanillas:         PlanillaCabecera[]
    loadingMisPlanillas:  boolean
    onFetchMisPlanillas:  (params: { id_vendedor: number | string; estado?: string; fecha_desde?: string; fecha_hasta?: string }) => void
    onFetchDetalle:       (id: number) => Promise<{ planilla: any; detalle: PlanillaDetalle[] } | null>
    onReenviar:           (id: number, v: VendedorInfo, regs: NuevoDetalle[]) => Promise<any>
    onCargarBorrador:     (planilla: PlanillaCabecera, detalle: PlanillaDetalle[]) => void
    onEliminarPlanilla:   (id: number, v: VendedorInfo) => Promise<boolean>
    vendedorInfo: VendedorInfo
    /**
     * Administración crea la planilla a nombre del vendedor de `vendedorInfo`: clientes,
     * recibos, kardex y zonas son los de ese vendedor (no los del usuario de la sesión).
     */
    modoAdmin?: boolean
}

export default function SeccionVendedor({
                                            tiposComprobante, bancos, zones,
                                            planillaActiva, detalle,
                                            onGenerarCorrelativo, onLimpiar,
                                            onAgregarDetalle, onRecargarDetalle, onEliminarDetalle, onEnviarPlanilla,
                                            misPlanillas, loadingMisPlanillas, onFetchMisPlanillas,
                                            onFetchDetalle, onReenviar, onCargarBorrador, onEliminarPlanilla,
                                            vendedorInfo, modoAdmin = false,
                                        }: Props) {

    const [tab,     setTab]     = useState<'nueva' | 'mis'>('nueva')
    const [creando, setCreando] = useState(false)
    const [enviando, setEnviando] = useState(false)
    const [guardando, setGuardando] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [fechaRuta,  setFechaRuta]  = useState(new Date().toLocaleDateString('en-CA'))

    // --- Zonas: una o varias (las asignadas al vendedor, de la lista o escritas a mano) ---
    const [zonasElegidas, setZonasElegidas] = useState<string[]>([])
    const [zonaTexto,     setZonaTexto]     = useState('')
    const [misZonas,      setMisZonas]      = useState<ZonaOption[]>([])
    const codigoVendedor = vendedorInfo.codigo_vendedor ?? ''

    useEffect(() => {
        if (!codigoVendedor) { setMisZonas([]); return }
        let vivo = true
        apiClient.get('/rutas/seller-zone', { params: { seller: codigoVendedor } })
            .then(res => {
                const d = res.data?.data
                const lista: any[] = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []
                const ids = lista.map(z => String(z?.IdZona ?? '')).filter(Boolean)
                const asignadas = ids
                    .map(id => zones.find(z => String(z.IdZona) === id))
                    .filter((z): z is ZonaOption => !!z)
                if (vivo) setMisZonas(asignadas)
            })
            .catch(() => { if (vivo) setMisZonas([]) })
        return () => { vivo = false }
    }, [codigoVendedor, zones])

    const nombresMisZonas = useMemo(() => new Set(misZonas.map(z => String(z.NombreZona ?? '').toUpperCase())), [misZonas])
    const otrasZonas = zonasElegidas.filter(z => !nombresMisZonas.has(z))
    const zonaEscrita = zonaTexto.trim().toUpperCase()
    const zonaFinal = unirZonas([...zonasElegidas, ...(zonaEscrita && !zonasElegidas.includes(zonaEscrita) ? [zonaEscrita] : [])])

    const agregarZona = (z: string) => {
        const n = z.trim().toUpperCase()
        if (!n) return
        setZonasElegidas(prev => prev.includes(n) ? prev : [...prev, n])
        setZonaTexto('')
    }
    const alternarZona = (z: string) => {
        const n = z.toUpperCase()
        setZonasElegidas(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])
    }

    const [selectedClient,  setSelectedClient]  = useState<IClient | null>(null)
    const { user, isAdmin } = useAuth()

    // Modo administración: el buscador lista los clientes del vendedor elegido.
    const [clientesVendedor, setClientesVendedor] = useState<ClienteBusqueda[] | undefined>(undefined)
    useEffect(() => {
        if (!modoAdmin) { setClientesVendedor(undefined); return }
        let vivo = true
        setClientesVendedor([])
        if (!codigoVendedor) return
        fetchGetAllClients(codigoVendedor, false, '')
            .then(res => {
                if (!vivo) return
                const todos: any[] = res.data?.data?.data || res.data?.data || []
                setClientesVendedor(todos.filter(c => Number(c.isMine) === 1))
            })
            .catch(() => { if (vivo) setClientesVendedor([]) })
        return () => { vivo = false }
    }, [modoAdmin, codigoVendedor])

    const [formReg, setFormReg] = useState<FormRegistro>(FORM_INICIAL)
    const [errores, setErrores] = useState<Partial<Record<keyof FormRegistro, string>>>({})
    const quitarErrores = (...ks: (keyof FormRegistro)[]) =>
        setErrores(prev => {
            if (!ks.some(k => prev[k])) return prev
            const n = { ...prev }
            ks.forEach(k => delete n[k])
            return n
        })
    const fc = (f: keyof FormRegistro, v: string) => {
        setFormReg(p => ({ ...p, [f]: v }))
        quitarErrores(f)
    }

    // --- Voucher del registro ---
    const [voucher,        setVoucher]        = useState<VoucherSel | null>(null)
    const [lectura,        setLectura]        = useState<'leyendo' | 'leido' | 'manual' | null>(null)
    const [importeVoucher, setImporteVoucher] = useState('')
    const [bloqueados,     setBloqueados]     = useState<CampoVoucher[]>([])
    const [revisarOpen,    setRevisarOpen]    = useState(false)
    const [depositosExtra, setDepositosExtra] = useState<DepositoExtra[]>([])
    const [compartido,     setCompartido]     = useState<VoucherCompartido | null>(null)
    const [preguntaCompartido, setPreguntaCompartido] = useState<VoucherCompartido | null>(null)
    const [confirmVarios,  setConfirmVarios]  = useState<{ registro: NuevoDetalle; files: File[] }[] | null>(null)
    /** Cada lectura lleva un número: si el voucher cambió mientras se leía, la respuesta vieja se descarta. */
    const lecturaN = useRef(0)
    const previewActual = useRef<string | null>(null)

    const bloqueado = (k: CampoVoucher) => bloqueados.includes(k) || lectura === 'leyendo'

    /** Lo que falta del voucher (para completar a mano). */
    const faltanVoucher = [
        ...(!formReg.cod_banco ? ['banco'] : []),
        ...(!formReg.fecha_deposito ? ['fecha'] : []),
        ...(!formReg.numero_operacion.trim() ? ['n° de operación'] : []),
        ...(!(num(importeVoucher) > 0) ? ['importe'] : []),
    ]

    const crearPreview = (file: File) => esPdf(file) ? null : URL.createObjectURL(file)
    const ponerPreview = (sel: VoucherSel | null) => {
        if (previewActual.current && previewActual.current !== sel?.preview) URL.revokeObjectURL(previewActual.current)
        previewActual.current = sel?.preview ?? null
        setVoucher(sel)
    }

    /** Quita lo que se había leído del voucher anterior (y suelta el voucher compartido). */
    const soltarLectura = () => {
        const bloq = bloqueados
        setFormReg(p => ({
            ...p,
            cod_banco:        bloq.includes('cod_banco') ? '' : p.cod_banco,
            desc_banco:       bloq.includes('cod_banco') ? '' : p.desc_banco,
            fecha_deposito:   bloq.includes('fecha_deposito') ? '' : p.fecha_deposito,
            numero_operacion: bloq.includes('numero_operacion') ? '' : p.numero_operacion,
        }))
        setImporteVoucher('')
        setBloqueados([])
        setCompartido(null)
    }

    const aplicarLectura = (d: DatosVoucher) => {
        const bloq: CampoVoucher[] = []
        if (d.cod_banco)        bloq.push('cod_banco')
        if (d.fecha)            bloq.push('fecha_deposito')
        if (d.numero_operacion) bloq.push('numero_operacion')
        if (d.importe != null)  bloq.push('importe')
        setFormReg(p => ({
            ...p,
            ...(d.cod_banco ? { cod_banco: d.cod_banco, desc_banco: '' } : {}),
            ...(d.fecha ? { fecha_deposito: d.fecha } : {}),
            ...(d.numero_operacion ? { numero_operacion: d.numero_operacion } : {}),
        }))
        setImporteVoucher(d.importe != null ? d.importe.toFixed(2) : '')
        setBloqueados(bloq)
        quitarErrores('cod_banco', 'fecha_deposito', 'numero_operacion')
        const completo = bloq.length === CAMPOS_VOUCHER.length
        setLectura(completo ? 'leido' : 'manual')
        if (!completo) setRevisarOpen(true)
    }

    const quitarExtras = () => {
        depositosExtra.forEach(x => x.preview && URL.revokeObjectURL(x.preview))
        setDepositosExtra([])
    }

    /**
     * Pone (o quita, con null) el voucher del registro y lo lee con IA. Cambiar el voucher deja de
     * lado los otros depósitos escaneados con él y suelta el voucher compartido.
     */
    const ponerVoucher = async (file: File | null, preleida?: DatosVoucher, preview?: string | null) => {
        const n = ++lecturaN.current
        quitarExtras()
        soltarLectura()
        setRevisarOpen(false)
        if (!file) { ponerPreview(null); setLectura(null); return }
        ponerPreview({ file, preview: preview !== undefined ? preview : crearPreview(file) })
        setLectura('leyendo')
        const d = preleida ?? await leerVoucherApi(file)
        if (n !== lecturaN.current) return
        aplicarLectura(d)
    }

    /** Varias hojas a la vez: la primera queda en este registro y las demás como registros aparte. */
    const ponerVarios = async (files: File[]) => {
        quitarExtras()
        soltarLectura()
        setRevisarOpen(false)
        const tempPreview = crearPreview(files[0])
        ponerPreview({ file: files[0], preview: tempPreview })
        setLectura('leyendo')
        const n = ++lecturaN.current
        const lecturas = await Promise.all(files.map(leerVoucherApi))
        if (n !== lecturaN.current) return
        const d = depositosDistintos(lecturas)
        const primero = d.unicos[0]
        if (primero !== 0 && tempPreview) URL.revokeObjectURL(tempPreview)
        await ponerVoucher(files[primero], lecturas[primero], primero === 0 ? tempPreview : undefined)
        const extras: DepositoExtra[] = d.unicos.slice(1).map(i => ({
            id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
            file: files[i], preview: crearPreview(files[i]), datos: lecturas[i],
        }))
        setDepositosExtra(extras)
        // Con varios depósitos, cada registro cobra lo de su voucher.
        const imp = lecturas[primero].importe
        if (extras.length > 0 && imp != null) fc('importe_cobrado', imp.toFixed(2))
        const total = d.unicos.length
        const partes = [
            ...(total > 1 ? [`${total} vouchers: se agregarán ${total} registros, uno por depósito.`] : []),
            ...(d.repetidos > 0 ? [`${d.repetidos} hoja${d.repetidos === 1 ? '' : 's'} repetida${d.repetidos === 1 ? '' : 's'} (mismo voucher): no se ${d.repetidos === 1 ? 'agregó' : 'agregaron'}.`] : []),
        ]
        if (partes.length) toast({ title: 'Vouchers leídos', description: partes.join(' ') })
    }

    const [unirModalOpen, setUnirModalOpen] = useState(false)
    const voucherInputRef               = useRef<HTMLInputElement>(null)

    const [docModalOpen, setDocModalOpen] = useState(false)
    /** Documento elegido del kardex: tipo, serie, número e importe quedan fijos. */
    const [docElegido, setDocElegido] = useState(false)

    // Recibo de cuenta importado (opcional): sus datos (cliente, documento, cobrado) no se editan.
    const [reciboModalOpen, setReciboModalOpen] = useState(false)
    const [recibo, setRecibo] = useState<{ cab: ReciboCabecera; doc: ReciboDocumento } | null>(null)
    const conRecibo = !!recibo
    const docBloqueado = conRecibo || docElegido

    const importarRecibo = (cab: ReciboCabecera, doc: ReciboDocumento) => {
        const numero = cab.prefijo ? `${cab.prefijo}-${cab.numero_recibo}` : String(cab.numero_recibo)
        setRecibo({ cab, doc })
        setDocElegido(true)
        setSelectedClient({ codigo: cab.cod_cliente, Nombre: cab.nombre_cliente, RUC: cab.ruc_cliente ?? '' } as IClient)
        setFormReg(p => ({
            ...p,
            codigo_cliente:  cab.ruc_cliente || cab.cod_cliente,
            nombre_cliente:  cab.nombre_cliente,
            tipo_documento:  doc.tipo_documento,
            serie:           doc.serie,
            numero_doc:      doc.numero_doc,
            importe:         Number(doc.saldo_documento ?? doc.importe).toFixed(2),
            numero_recibo:   numero,
            importe_cobrado: Number(doc.importe).toFixed(2),
        }))
        quitarErrores('nombre_cliente', 'tipo_documento', 'importe', 'importe_cobrado')
        toast({ title: 'Recibo importado', description: `${numero} · ${doc.abre_documento} ${doc.serie}-${doc.numero_doc}` })
    }

    const quitarRecibo = () => {
        setRecibo(null)
        setDocElegido(false)
        setSelectedClient(null)
        const q = compartido ? quedanDe(compartido) : 0
        setFormReg(p => ({
            ...p,
            codigo_cliente: '', nombre_cliente: '', tipo_documento: '', serie: '', numero_doc: '',
            importe: '', numero_recibo: '', importe_cobrado: q > 0.009 ? q.toFixed(2) : '',
        }))
    }

    const quitarDocumento = () => {
        setDocElegido(false)
        setFormReg(p => ({ ...p, tipo_documento: '', serie: '', numero_doc: '', importe: '' }))
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

    // --- Mis planillas: filtros por estado y fechas ---
    const [filtroEstado, setFiltroEstado] = useState('todos')
    const [filtroDesde,  setFiltroDesde]  = useState('')
    const [filtroHasta,  setFiltroHasta]  = useState('')
    const hayFiltros = filtroEstado !== 'todos' || !!filtroDesde || !!filtroHasta

    const cargarMisPlanillas = useCallback(() => {
        onFetchMisPlanillas({
            id_vendedor: vendedorInfo.id_vendedor,
            estado:      filtroEstado === 'todos' ? undefined : filtroEstado,
            fecha_desde: filtroDesde || undefined,
            fecha_hasta: filtroHasta || undefined,
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vendedorInfo.id_vendedor, filtroEstado, filtroDesde, filtroHasta])

    useEffect(() => { cargarMisPlanillas() }, [cargarMisPlanillas])

    // "Creada por": planillas que administración creó a nombre del vendedor. Si falla, no se muestra.
    const [creadoPor, setCreadoPor] = useState<Record<number, string>>({})
    useEffect(() => {
        let vivo = true
        apiClient.get('/planilla-cobranza/creado-por', { params: { id_vendedor: vendedorInfo.id_vendedor } })
            .then(res => {
                const d = res.data?.data
                const lista: any[] = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []
                const m: Record<number, string> = {}
                lista.forEach(x => { if (x?.id_planilla != null && x?.creado_por) m[Number(x.id_planilla)] = String(x.creado_por) })
                if (vivo) setCreadoPor(m)
            })
            .catch(() => { /* silencioso */ })
        return () => { vivo = false }
    }, [vendedorInfo.id_vendedor, misPlanillas, planillaActiva?.id_planilla])
    const creadorDe = (p: PlanillaCabecera | null) => p ? (p.creado_por || creadoPor[p.id_planilla] || null) : null

    const handleClientSelect = (client: IClient | null) => {
        setSelectedClient(client)
        setDocElegido(false)
        setFormReg(prev => ({
            ...prev,
            codigo_cliente: client?.RUC || client?.codigo || "",
            nombre_cliente: client?.Nombre ?? "",
            tipo_documento: '',
            serie: '',
            numero_doc: '',
            importe: '',
        }))
        quitarErrores('nombre_cliente')
    }

    const handleDocumentoSelect = (doc: DocumentoCliente) => {
        setDocElegido(true)
        setFormReg(p => ({
            ...p,
            tipo_documento: doc.Tipo_Doc,
            serie:          doc.SerieDoc,
            numero_doc:     doc.NumeroDoc,
            importe:        Number(doc.saldo_pendiente).toFixed(2),
        }))
        quitarErrores('tipo_documento', 'importe')
        toast({
            title: 'Documento cargado',
            description: `${doc.Abre_Doc} ${doc.SerieDoc}-${doc.NumeroDoc}`,
        })
    }

    /** Valida y reduce los archivos elegidos (tipo y 5 MB por archivo). */
    const filtrarArchivos = async (originales: File[]) => {
        const validos: File[] = []
        for (const original of originales) {
            if (!esTipoPermitido(original)) {
                toast({
                    title: 'Archivo no permitido',
                    description: `${original.name} no es JPG, PNG, WEBP ni PDF. Las fotos de iPhone (HEIC) hay que convertirlas antes.`,
                    variant: 'warning',
                })
                continue
            }
            const file = await reducirImagen(original)
            // Un PDF no se puede comprimir: si pasa el tope por envío nunca podría enviarse.
            const esPdf = original.type === 'application/pdf' || /.pdf$/i.test(original.name)
            if (esPdf && file.size > LIMITE_ENVIO_BYTES) {
                toast({ title: 'Archivo muy pesado', description: `${file.name}: ${MENSAJE_ARCHIVOS_PESADOS}`, variant: 'warning' })
                continue
            }
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
        return validos
    }

    const handleVoucherChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const originales = Array.from(e.target.files || [])
        if (voucherInputRef.current) voucherInputRef.current.value = ''
        const validos = await filtrarArchivos(originales)
        if (validos.length === 0) return
        if (validos.length === 1) ponerVoucher(validos[0])
        else ponerVarios(validos)
    }

    const handleImagenUnificada = async (unida: File) => {
        const file = await reducirImagen(unida)
        if (file.size > VOUCHER_MAX_BYTES) {
            toast({
                title: 'Archivo muy pesado',
                description: `La imagen unificada pesa ${(file.size / 1024 / 1024).toFixed(1)} MB y el máximo es 5 MB.`,
                variant: 'warning',
            })
            return
        }
        ponerVoucher(file)
        toast({ title: 'Imagen unificada', description: 'Se agregó como voucher del registro.' })
    }

    // Modal "no pudimos leer": completar a mano habilita solo lo que faltó.
    const completarAMano = () => setRevisarOpen(false)
    const subirOtraFoto = () => {
        ponerVoucher(null)
        setTimeout(() => voucherInputRef.current?.click(), 0)
    }

    const handleCrear = async () => {
        if (!fechaRuta || !zonaFinal) {
            toast({ title: 'Campos requeridos', description: 'Completa fecha de ruta y zona.', variant: 'warning' })
            return
        }
        if (zonaFinal.length > MAX_ZONA) {
            toast({ title: 'Demasiadas zonas', description: `La zona admite hasta ${MAX_ZONA} caracteres. Quita alguna.`, variant: 'warning' })
            return
        }
        setCreando(true)
        const p = await onGenerarCorrelativo(vendedorInfo, fechaRuta, zonaFinal)
        setCreando(false)
        if (p) { setZonasElegidas([]); setZonaTexto('') }
    }

    /** Deja el formulario del registro en blanco: cliente, documento, recibo, depósito y vouchers. */
    const limpiarRegistro = () => {
        lecturaN.current++
        setFormReg(FORM_INICIAL)
        ponerPreview(null)
        quitarExtras()
        setLectura(null)
        setImporteVoucher('')
        setBloqueados([])
        setCompartido(null)
        setRevisarOpen(false)
        setRecibo(null)
        setSelectedClient(null)
        setDocElegido(false)
        setErrores({})
    }
    const [limpiarOpen, setLimpiarOpen] = useState(false)
    const hayDatosRegistro = !!selectedClient || !!voucher || depositosExtra.length > 0
        || Object.entries(formReg).some(([k, v]) => v !== (FORM_INICIAL as any)[k])

    /** Todo lo obligatorio, con o sin voucher. */
    const validar = () => {
        const e: Partial<Record<keyof FormRegistro, string>> = {}
        const importe = num(formReg.importe)
        const cobrado = num(formReg.importe_cobrado)
        if (!formReg.nombre_cliente.trim()) e.nombre_cliente = 'Elige el cliente.'
        if (!formReg.tipo_documento) e.tipo_documento = 'Elige el tipo.'
        if (!(importe > 0)) e.importe = 'Ingresa el importe del documento (mayor a 0).'
        if (!(cobrado > 0)) e.importe_cobrado = 'El importe cobrado debe ser mayor a 0.'
        else if (importe > 0 && cobrado > importe + 0.001) e.importe_cobrado = 'El importe cobrado no puede ser mayor al importe del documento.'
        if (!formReg.cod_banco) e.cod_banco = 'Elige el banco.'
        const { min, max } = rangoFechaDeposito()
        if (!formReg.fecha_deposito) e.fecha_deposito = 'Elige la fecha del depósito.'
        else if (formReg.fecha_deposito < min || formReg.fecha_deposito > max) e.fecha_deposito = 'La fecha del depósito está fuera de rango.'
        if (!formReg.numero_operacion.trim()) e.numero_operacion = 'Ingresa el N° de operación.'
        return e
    }

    const descBanco = (cod?: string) => bancos.find(b => b.CodigoEntidadFinanciera === cod)?.DescripcionEntidadFinanciera

    const handleAgregar = async () => {
        if (!planillaActiva) return
        if (lectura === 'leyendo') {
            toast({ title: 'Leyendo el voucher', description: 'Espera a que termine la lectura del voucher.', variant: 'warning' })
            return
        }
        if (voucher && faltanVoucher.length > 0) {
            toast({ title: 'Voucher incompleto', description: `Completa: ${faltanVoucher.join(', ')}.`, variant: 'warning' })
            return
        }
        const errs = validar()
        const n = Object.keys(errs).length
        if (n > 0) {
            setErrores(errs)
            toast({
                title:       'Revisa el registro',
                description: n === 1 ? Object.values(errs)[0] : `Completa los ${n} campos marcados en rojo.`,
                variant:     'warning',
            })
            return
        }
        const importe = num(formReg.importe)
        // Los otros depósitos escaneados: completos y ninguno puede pasar el importe del documento.
        for (let i = 0; i < depositosExtra.length; i++) {
            const x = depositosExtra[i]
            const falta = faltantesDatos(x.datos)
            if (falta.length > 0) {
                toast({ title: `Depósito ${i + 2} incompleto`, description: `No se leyó completo (falta ${falta.join(', ')}): quítalo y súbelo en otro registro.`, variant: 'warning' })
                return
            }
            const e = errorCobrado(importe, x.datos.importe!)
            if (e) { toast({ title: `Depósito ${i + 2}`, description: e, variant: 'warning' }); return }
        }
        const t = (s: string) => s.trim() || undefined
        const registro: NuevoDetalle = {
            codigo_cliente:   t(formReg.codigo_cliente),
            nombre_cliente:   formReg.nombre_cliente.trim(),
            tipo_documento:   formReg.tipo_documento,
            serie:            t(formReg.serie),
            numero_doc:       t(formReg.numero_doc),
            importe,
            numero_recibo:    t(formReg.numero_recibo),
            importe_cobrado:  num(formReg.importe_cobrado),
            cod_banco:        t(formReg.cod_banco),
            desc_banco:       descBanco(formReg.cod_banco) || t(formReg.desc_banco),
            fecha_deposito:   t(formReg.fecha_deposito),
            numero_operacion: t(formReg.numero_operacion),
            numero_cheque:    t(formReg.numero_cheque),
        }
        const todos = [
            { registro, files: voucher ? [voucher.file] : [] },
            ...depositosExtra.map(x => ({
                registro: {
                    ...registro,
                    importe_cobrado:  x.datos.importe!,
                    cod_banco:        x.datos.cod_banco,
                    desc_banco:       descBanco(x.datos.cod_banco),
                    fecha_deposito:   x.datos.fecha,
                    numero_operacion: x.datos.numero_operacion,
                    numero_cheque:    undefined,
                } as NuevoDetalle,
                files: [x.file],
            })),
        ]
        // Varios depósitos: se avisa que se generan varios registros de la misma factura.
        if (todos.length > 1) { setConfirmVarios(todos); return }
        await ejecutarAgregar(todos)
    }

    const ejecutarAgregar = async (todos: { registro: NuevoDetalle; files: File[] }[]) => {
        if (!planillaActiva) return
        const id = planillaActiva.id_planilla
        const varios = todos.length > 1
        const vfile = voucher?.file ?? null
        const impVoucher = num(importeVoucher)
        setGuardando(true)
        let agregados = 0
        for (const x of todos) {
            const r = await onAgregarDetalle(id, x.registro, x.files, { silencioso: varios })
            if (!r) break
            agregados++
        }
        setGuardando(false)
        if (varios) {
            if (agregados === todos.length) {
                toast({
                    title:       `${todos.length} registros agregados (uno por depósito)`,
                    description: `${todos[0].registro.nombre_cliente} — ${todos.map(x => fmtMoney(x.registro.importe_cobrado)).join(' + ')}`,
                })
            } else {
                if (agregados > 0) await onRecargarDetalle(id)
                toast({ title: 'Registros incompletos', description: `Se agregaron ${agregados} de ${todos.length} registros.`, variant: 'warning' })
            }
        }
        if (agregados === 0) return
        const reg = todos[0].registro
        limpiarRegistro()
        // Si el voucher es mayor a lo registrado con ese depósito, se ofrece usarlo en otra factura.
        if (!varios && vfile && reg.cod_banco && reg.fecha_deposito && reg.numero_operacion && impVoucher > 0) {
            const asignado = asignadoAlDeposito([...detalle, reg], reg.cod_banco, reg.numero_operacion)
            const v: VoucherCompartido = {
                file: vfile, cod_banco: reg.cod_banco, desc_banco: reg.desc_banco,
                fecha_deposito: reg.fecha_deposito, numero_operacion: reg.numero_operacion,
                importe: impVoucher, asignado,
            }
            if (quedanDe(v) > 0.009) setPreguntaCompartido(v)
        }
    }

    /** Nuevo registro con el mismo voucher: depósito bloqueado y cobrado = lo que queda. */
    const iniciarCompartido = (v: VoucherCompartido) => {
        limpiarRegistro()
        ponerPreview({ file: v.file, preview: crearPreview(v.file) })
        const q = quedanDe(v)
        setFormReg({
            ...FORM_INICIAL,
            cod_banco:        v.cod_banco,
            desc_banco:       v.desc_banco ?? '',
            fecha_deposito:   v.fecha_deposito,
            numero_operacion: v.numero_operacion,
            importe_cobrado:  q > 0.009 ? q.toFixed(2) : '',
        })
        setImporteVoucher(v.importe.toFixed(2))
        setBloqueados(CAMPOS_VOUCHER.map(c => c.k))
        setLectura('leido')
        setCompartido(v)
    }

    // "No cuadra": el cobrado contra lo que dice el voucher (o lo que queda del voucher compartido).
    const sumaVoucher = compartido ? quedanDe(compartido) : num(importeVoucher)
    const cobradoN = num(formReg.importe_cobrado)
    const difiereImporte = !!voucher && sumaVoucher > 0 && cobradoN > 0 && Math.abs(cobradoN - sumaVoucher) > 0.009

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
            cargarMisPlanillas()
            limpiarRegistro()
            onLimpiar()
            setTab('mis')
        }
        setEnviando(false)
    }

    const [regAEliminar, setRegAEliminar] = useState<PlanillaDetalle | null>(null)
    const confirmarEliminarRegistro = () => {
        if (!planillaActiva || !regAEliminar) return
        onEliminarDetalle(planillaActiva.id_planilla, regAEliminar.id_detalle)
        setRegAEliminar(null)
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
        limpiarRegistro()
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
        cargarMisPlanillas()
    }

    const CAMPOS_EDITABLES: (keyof PlanillaDetalle)[] = [
        'codigo_cliente', 'nombre_cliente', 'tipo_documento', 'serie', 'numero_doc', 'importe',
        'numero_recibo', 'importe_cobrado', 'cod_banco', 'fecha_deposito', 'numero_operacion',
    ]

    const handleReenviar = async () => {
        if (!editId) return
        const originales = detalleCache[editId] ?? []
        for (let i = 0; i < editRegs.length; i++) {
            const r = editRegs[i]
            const doc = `${r.serie ?? ''}-${r.numero_doc ?? ''}`
            const errCob = errorCobrado(r.importe, r.importe_cobrado)
            if (errCob) {
                toast({ title: `Fila ${i + 1}: importe cobrado`, description: `${doc} · ${errCob}`, variant: 'warning' })
                return
            }
            // Las filas corregidas deben quedar completas, como un registro nuevo.
            const orig = originales.find(o => o.id_detalle === r.id_detalle)
            const editada = !orig || CAMPOS_EDITABLES.some(k => String(orig[k] ?? '') !== String(r[k] ?? ''))
            if (!editada) continue
            const falta = [
                ...(!String(r.nombre_cliente ?? '').trim() ? ['cliente'] : []),
                ...(!r.tipo_documento ? ['tipo de documento'] : []),
                ...(!(Number(r.importe) > 0) ? ['importe'] : []),
                ...(!r.cod_banco ? ['banco'] : []),
                ...(!r.fecha_deposito ? ['fecha de depósito'] : []),
                ...(!String(r.numero_operacion ?? '').trim() ? ['N° de operación'] : []),
            ]
            if (falta.length > 0) {
                toast({ title: `Fila ${i + 1}: datos incompletos`, description: `${doc} · Completa ${falta.join(', ')}.`, variant: 'warning' })
                return
            }
        }
        setReen(true)
        const res = await onReenviar(editId, vendedorInfo, editRegs.map(r => ({
            id_detalle:       r.id_detalle,
            codigo_cliente:   r.codigo_cliente   || undefined,
            nombre_cliente:   r.nombre_cliente,
            tipo_documento:   r.tipo_documento,
            serie:            r.serie            || undefined,
            numero_doc:       r.numero_doc       || undefined,
            importe:          Number(r.importe),
            numero_recibo:    r.numero_recibo    || undefined,
            importe_cobrado:  Number(r.importe_cobrado),
            cod_banco:        r.cod_banco        || undefined,
            desc_banco:       descBanco(r.cod_banco ?? undefined) || r.desc_banco || undefined,
            fecha_deposito:   r.fecha_deposito ? String(r.fecha_deposito).slice(0, 10) : undefined,
            numero_operacion: r.numero_operacion || undefined,
            numero_cheque:    r.numero_cheque    || undefined,
        })))
        setReen(false)
        if (!res) return
        setDetalleCache(prev => { const n = { ...prev }; delete n[editId]; return n })
        setEditId(null)
        setEditRegs([])
        cargarMisPlanillas()
    }

    const rango = rangoFechaDeposito()
    const etiquetaTipo = (cod: string) => tiposComprobante.find(t => t.codigo === cod)?.descripcion ?? 'documento'

    return (
        <div className="space-y-4">

            <SeleccionarReciboModal
                open={reciboModalOpen}
                onOpenChange={setReciboModalOpen}
                idUsuarioWeb={modoAdmin ? undefined : user?.idUsuarioWeb}
                codVendedor={modoAdmin ? codigoVendedor || undefined : undefined}
                codCliente={formReg.codigo_cliente || undefined}
                onImportar={importarRecibo}
            />

            <Dialog open={revisarOpen && !!voucher && lectura === 'manual'} onOpenChange={v => { if (!v) completarAMano() }}>
                <DialogContent className="max-w-sm" onOpenAutoFocus={e => e.preventDefault()}>
                    <DialogHeader className="items-center text-center">
                        <div className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50">
                            <ScanSearch className="h-7 w-7 text-amber-600" />
                        </div>
                        <DialogTitle className="text-center">No pudimos leer todo el voucher</DialogTitle>
                        <DialogDescription className="text-center">
                            {bloqueados.length === 0
                                ? 'La foto no se ve con claridad o no parece un comprobante de pago.'
                                : !bloqueados.includes('cod_banco')
                                    ? 'No logramos identificar a qué banco pertenece este comprobante.'
                                    : 'Algunos datos no se ven con claridad en la foto.'}
                            {' '}No te preocupes: puedes completarlos a mano.
                        </DialogDescription>
                    </DialogHeader>
                    {voucher && (
                        <div className="flex gap-3 rounded-lg border bg-muted/40 p-3">
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted flex items-center justify-center">
                                {voucher.preview
                                    ? <img src={voucher.preview} alt="" className="h-full w-full object-cover" />
                                    : <FileText className="h-6 w-6 text-muted-foreground" />}
                            </div>
                            <div className="min-w-0 space-y-1 text-xs">
                                {bloqueados.length > 0 && (
                                    <p><span className="font-semibold text-violet-700">Leímos:</span>{' '}
                                        {CAMPOS_VOUCHER.filter(c => bloqueados.includes(c.k)).map(c => c.t).join(', ')}</p>
                                )}
                                <p><span className="font-semibold text-amber-700">Falta completar:</span>{' '}
                                    {CAMPOS_VOUCHER.filter(c => !bloqueados.includes(c.k)).map(c => c.t).join(', ')}</p>
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

            {/* Varios depósitos de una misma factura: un registro por voucher. */}
            <Dialog open={!!confirmVarios} onOpenChange={v => { if (!v && !guardando) setConfirmVarios(null) }}>
                <DialogContent className="max-w-md">
                    <DialogHeader className="items-center text-center">
                        <div className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-full border border-sky-300 bg-gradient-to-br from-sky-100 to-sky-50 dark:border-sky-800 dark:from-sky-950 dark:to-sky-900/40">
                            <Split className="h-7 w-7 rotate-180 text-sky-600" />
                        </div>
                        <DialogTitle className="text-center">Se generarán {confirmVarios?.length ?? 0} registros</DialogTitle>
                        {confirmVarios && (
                            <DialogDescription className="text-center">
                                Asociados a la {etiquetaTipo(confirmVarios[0].registro.tipo_documento).toLowerCase()}{' '}
                                {[confirmVarios[0].registro.serie, confirmVarios[0].registro.numero_doc].filter(Boolean).join('-')}{' '}
                                de {confirmVarios[0].registro.nombre_cliente}, uno por cada depósito:
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    {confirmVarios && (
                        <div className="space-y-2">
                            {confirmVarios.map((x, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">{i + 1}</span>
                                    <span className="min-w-0 font-medium">
                                        {x.registro.desc_banco ?? x.registro.cod_banco ?? ''} · {fmtFecha(x.registro.fecha_deposito)} · Op. {x.registro.numero_operacion ?? ''} · {fmtMoney(x.registro.importe_cobrado)}
                                    </span>
                                </div>
                            ))}
                            <p className="pt-1 text-sm font-bold">
                                Total cobrado: {fmtMoney(confirmVarios.reduce((s, x) => s + x.registro.importe_cobrado, 0))}
                            </p>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button variant="outline" disabled={guardando} onClick={() => setConfirmVarios(null)}>Cancelar</Button>
                        <Button className="gap-1.5 bg-sky-600 text-white hover:bg-sky-700" disabled={guardando}
                                onClick={async () => { const t = confirmVarios; setConfirmVarios(null); if (t) await ejecutarAgregar(t) }}>
                            {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Generar {confirmVarios?.length ?? 0} registros
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* El depósito es mayor a lo registrado: ofrecer otra factura con el mismo voucher. */}
            <Dialog open={!!preguntaCompartido} onOpenChange={v => { if (!v) setPreguntaCompartido(null) }}>
                <DialogContent className="max-w-md">
                    <DialogHeader className="items-center text-center">
                        <div className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-950/50">
                            <Receipt className="h-7 w-7 text-sky-600" />
                        </div>
                        <DialogTitle className="text-center">Este voucher cubre más documentos</DialogTitle>
                        <DialogDescription className="text-center">
                            El depósito es mayor a lo que registraste. Si pagó otra factura (del mismo u otro cliente), agrégala con este mismo voucher.
                        </DialogDescription>
                    </DialogHeader>
                    {preguntaCompartido && (
                        <div className="space-y-1 rounded-lg border bg-muted/40 p-3 text-sm">
                            {[
                                ['Banco', preguntaCompartido.desc_banco || preguntaCompartido.cod_banco],
                                ['N° operación', preguntaCompartido.numero_operacion],
                                ['Importe del depósito', fmtMoney(preguntaCompartido.importe)],
                                ['Ya registrado', fmtMoney(preguntaCompartido.asignado)],
                            ].map(([k, v]) => (
                                <div key={k} className="flex justify-between gap-3">
                                    <span className="text-muted-foreground">{k}</span>
                                    <span className="text-right font-semibold">{v}</span>
                                </div>
                            ))}
                            <div className="mt-1 flex justify-between gap-3 border-t pt-1.5">
                                <span className="text-muted-foreground">Queda por asignar</span>
                                <span className="font-bold text-amber-700 dark:text-amber-400">{fmtMoney(quedanDe(preguntaCompartido))}</span>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setPreguntaCompartido(null)}>No, terminar</Button>
                        <Button className="gap-1.5 bg-sky-600 text-white hover:bg-sky-700"
                                onClick={() => { const v = preguntaCompartido; setPreguntaCompartido(null); if (v) iniciarCompartido(v) }}>
                            <Plus className="h-4 w-4" /> Agregar otra factura
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!regAEliminar} onOpenChange={v => { if (!v) setRegAEliminar(null) }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
                                <Trash2 className="h-4 w-4" />
                            </span>
                            Eliminar registro
                        </DialogTitle>
                        <DialogDescription>
                            {regAEliminar?.nombre_cliente} — {fmtMoney(regAEliminar?.importe_cobrado)}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setRegAEliminar(null)}>Cancelar</Button>
                        <Button className="gap-1.5 bg-red-600 text-white hover:bg-red-700" onClick={confirmarEliminarRegistro} disabled={guardando || enviando}>
                            <Trash2 className="h-4 w-4" /> Eliminar
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
                codVendedor={modoAdmin ? codigoVendedor || undefined : (isAdmin() ? undefined : user?.codigo)}
                soloVigentes={false}
                consolidar
                onSelect={handleDocumentoSelect}
            />

            <div className="flex bg-background border border-border rounded-lg overflow-hidden shadow-sm">
                {[
                    { id: 'nueva', label: 'Nueva planilla' },
                    { id: 'mis',   label: modoAdmin ? 'Planillas del vendedor' : 'Mis planillas', badge: rechazadas },
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
                            <CardContent className="p-4 sm:p-6 space-y-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        Fecha de ruta <span className="text-red-500">*</span>
                                    </label>
                                    <Input type="date" value={fechaRuta} onChange={e => setFechaRuta(e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Zona <span className="text-red-500">*</span>
                                        </label>
                                        <span className="ml-auto text-[10px] text-muted-foreground">Puedes elegir más de una</span>
                                    </div>

                                    {misZonas.length > 0 && (
                                        <div className="space-y-1.5">
                                            <p className="text-[11px] font-semibold text-foreground">
                                                {modoAdmin ? 'Zonas asignadas al vendedor' : 'Tus zonas asignadas'}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {misZonas.map(z => {
                                                    const sel = zonasElegidas.includes(String(z.NombreZona ?? '').toUpperCase())
                                                    return (
                                                        <button
                                                            key={z.IdZona} type="button"
                                                            onClick={() => alternarZona(z.NombreZona)}
                                                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors
                                                                ${sel
                                                                ? 'border-sky-600 bg-sky-600 text-white'
                                                                : 'border-sky-200 bg-background text-sky-700 hover:bg-sky-50 dark:border-sky-900 dark:text-sky-300'}`}
                                                        >
                                                            {sel && <CheckCircle2 className="h-3 w-3" />}
                                                            {z.NombreZona}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {otrasZonas.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {otrasZonas.map(z => (
                                                <span key={z} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 py-0.5 pl-2 pr-1 text-xs font-medium dark:border-slate-800 dark:bg-slate-900">
                                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                                    {z}
                                                    <button type="button" title={`Quitar ${z}`}
                                                            onClick={() => setZonasElegidas(prev => prev.filter(x => x !== z))}
                                                            className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <ZonaCombobox
                                        zones={zones.filter(z => !zonasElegidas.includes(String(z.NombreZona ?? '').toUpperCase()))}
                                        value=""
                                        onChange={agregarZona}
                                    />
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="O escribe otra zona, ej: CHIMBOTE NORTE"
                                            value={zonaTexto}
                                            onChange={e => setZonaTexto(e.target.value.toUpperCase())}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarZona(zonaTexto) } }}
                                            maxLength={MAX_ZONA}
                                        />
                                        <Button type="button" variant="outline" className="shrink-0 gap-1"
                                                disabled={!zonaTexto.trim()} onClick={() => agregarZona(zonaTexto)}>
                                            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Agregar</span>
                                        </Button>
                                    </div>
                                    {zonaFinal && (
                                        <p className="text-[11px] text-sky-600 font-medium break-words">
                                            Zona de la planilla: <strong>{zonaFinal}</strong>
                                        </p>
                                    )}
                                    {zonaFinal.length > MAX_ZONA && (
                                        <p className="flex items-start gap-1 text-[11px] text-red-600">
                                            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                                            Demasiadas zonas: la zona admite hasta {MAX_ZONA} caracteres ({zonaFinal.length}/{MAX_ZONA}). Quita alguna.
                                        </p>
                                    )}
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
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-sky-600 flex items-center justify-center shrink-0">
                                        <FileText className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-lg font-bold font-mono text-sky-700 tracking-wider">
                                            {planillaActiva.numero_planilla}
                                        </p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <MapPin className="h-3 w-3 shrink-0" />
                                            <span className="truncate">{planillaActiva.zona} · {fmtFecha(planillaActiva.fecha_ruta)}</span>
                                        </p>
                                        {creadorDe(planillaActiva) && (
                                            <div className="mt-1"><BadgeCreadoPor nombre={creadorDe(planillaActiva)} /></div>
                                        )}
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

                            {compartido && (
                                <div className="flex items-center gap-3 rounded-xl border border-sky-300 bg-sky-50 p-3 dark:border-sky-900 dark:bg-sky-950/30">
                                    <Link2 className="h-5 w-5 shrink-0 text-sky-600" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-sky-900 dark:text-sky-100">
                                            Voucher compartido · quedan {fmtMoney(quedanDe(compartido))}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {compartido.desc_banco || compartido.cod_banco} · Op. {compartido.numero_operacion} · depósito {fmtMoney(compartido.importe)}, ya registrado {fmtMoney(compartido.asignado)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                                <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-sky-50 via-blue-50/60 to-transparent px-5 py-3.5 dark:from-sky-950/40 dark:via-blue-950/20">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-sm font-bold text-white shadow-sm shadow-sky-200 dark:shadow-none">1</span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold leading-tight text-sky-900 dark:text-sky-100">Cliente y documento</p>
                                        <p className="text-[11px] text-muted-foreground">A quién se le cobra y qué documento se liquida</p>
                                    </div>
                                    <span className="ml-auto shrink-0 rounded-full border border-sky-200 bg-background px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:border-sky-900 dark:text-sky-300">Paso 1 de 2</span>
                                </div>
                                <div className="space-y-4 p-4 sm:p-5">
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
                                            <div className={errores.nombre_cliente ? 'rounded-xl ring-2 ring-red-400' : ''}>
                                                <BuscadorClienteReporte
                                                    valor={selectedClient}
                                                    onChange={c => handleClientSelect(c as IClient | null)}
                                                    clientes={modoAdmin ? (clientesVendedor ?? []) : undefined}
                                                    descripcion={modoAdmin ? `Clientes del vendedor ${codigoVendedor}` : undefined}
                                                />
                                            </div>
                                        )}
                                        <ErrorCampo msg={errores.nombre_cliente} />
                                    </div>

                                    <div className={`rounded-xl border p-3 sm:p-4 transition-colors ${formReg.codigo_cliente ? 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40' : 'border-dashed border-slate-200 bg-muted/20 dark:border-slate-800'}`}>
                                        <div className="mb-3 flex flex-wrap items-center gap-2">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
                                                <FileText className="h-3.5 w-3.5" />
                                            </span>
                                            <p className="text-sm font-semibold text-foreground">Documento a cobrar</p>
                                            {docBloqueado && (
                                                <span className="flex items-center gap-1 text-[11px] font-medium text-blue-600">
                                                    <Lock className="h-3 w-3" /> {conRecibo ? 'Del recibo' : 'Del kardex'}
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
                                                <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                    {docBloqueado && <Lock className="h-2.5 w-2.5" />}Tipo <span className="text-red-500">*</span>
                                                </label>
                                                <Select value={formReg.tipo_documento} onValueChange={v => fc('tipo_documento', v)} disabled={docBloqueado}>
                                                    <SelectTrigger className={`bg-background ${docBloqueado ? CLASE_BLOQUEADO : ''} ${errores.tipo_documento ? CLASE_ERROR : ''}`}><SelectValue placeholder="Elegir tipo" /></SelectTrigger>
                                                    <SelectContent>
                                                        {tiposComprobante.map(t => (
                                                            <SelectItem key={t.codigo} value={t.codigo}>{t.descripcion}</SelectItem>
                                                        ))}
                                                        {formReg.tipo_documento && !tiposComprobante.some(t => t.codigo === formReg.tipo_documento) && (
                                                            <SelectItem value={formReg.tipo_documento}>{formReg.tipo_documento}</SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <ErrorCampo msg={errores.tipo_documento} />
                                            </div>
                                            <div className="flex flex-col gap-1.5 md:col-span-2">
                                                <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                    {docBloqueado && <Lock className="h-2.5 w-2.5" />}Serie
                                                </label>
                                                <Input
                                                    placeholder="Ej. F001"
                                                    value={formReg.serie}
                                                    onChange={e => fc('serie', e.target.value)}
                                                    maxLength={4} disabled={docBloqueado}
                                                    className={`bg-background font-mono placeholder:font-sans placeholder:text-muted-foreground/50 ${docBloqueado ? CLASE_BLOQUEADO : ''}`}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5 md:col-span-3">
                                                <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                    {docBloqueado && <Lock className="h-2.5 w-2.5" />}N° documento
                                                </label>
                                                <Input
                                                    placeholder="Ej. 10737"
                                                    value={formReg.numero_doc}
                                                    onChange={e => fc('numero_doc', e.target.value)}
                                                    disabled={docBloqueado}
                                                    className={`bg-background font-mono placeholder:font-sans placeholder:text-muted-foreground/50 ${docBloqueado ? CLASE_BLOQUEADO : ''}`}
                                                />
                                            </div>
                                            <div className="col-span-2 flex flex-col gap-1.5 md:col-span-4">
                                                <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                    {docBloqueado && <Lock className="h-2.5 w-2.5" />}Importe del documento <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">S/</span>
                                                    <Input
                                                        type="number" step="0.01" min={0} placeholder="0.00"
                                                        value={formReg.importe}
                                                        onChange={e => fc('importe', e.target.value)}
                                                        disabled={docBloqueado}
                                                        className={`bg-background pl-9 text-right font-mono text-base font-semibold placeholder:text-muted-foreground/50 ${docBloqueado ? CLASE_BLOQUEADO : ''} ${errores.importe ? CLASE_ERROR : ''}`}
                                                    />
                                                </div>
                                                <ErrorCampo msg={errores.importe} />
                                            </div>
                                        </div>
                                        {docElegido && !conRecibo && (
                                            <button type="button" onClick={quitarDocumento}
                                                    className="mt-2 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-950/40">
                                                <LockOpen className="h-3.5 w-3.5" /> Quitar documento (para escribirlo a mano)
                                            </button>
                                        )}
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
                                <div className="p-4 sm:p-5 space-y-4">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900/40">
                                        <div className="mb-3 flex items-center gap-2">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
                                                <Receipt className="h-3.5 w-3.5" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold leading-tight text-foreground">Recibo de cuenta (opcional)</p>
                                                <p className="text-[11px] text-muted-foreground">Si lo eliges, el cliente, el documento y el importe cobrado salen del recibo</p>
                                            </div>
                                        </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                {conRecibo && <Lock className="h-2.5 w-2.5" />}Recibo de cuenta
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
                                                        title={recibo ? 'Cambiar recibo' : 'Buscar recibos'}>
                                                    <Search className="h-4 w-4" />
                                                    <span className="hidden sm:inline">{recibo ? 'Cambiar' : 'Buscar'}</span>
                                                </Button>
                                            </div>
                                            {!recibo && (
                                                <Input
                                                    placeholder="Recibo N° (opcional), ej. B/34752"
                                                    value={formReg.numero_recibo}
                                                    onChange={e => fc('numero_recibo', e.target.value)}
                                                    maxLength={50}
                                                    className="h-10 bg-background font-mono placeholder:font-sans placeholder:text-muted-foreground/60"
                                                />
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                {conRecibo && <Lock className="h-2.5 w-2.5" />}Importe cobrado S/. <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                type="number" step="0.01" min={0} placeholder={conRecibo ? 'Sale del recibo' : '0.00'}
                                                value={formReg.importe_cobrado}
                                                onChange={e => fc('importe_cobrado', e.target.value)}
                                                disabled={conRecibo}
                                                className={`h-10 font-mono placeholder:font-sans placeholder:text-muted-foreground/60 ${conRecibo ? CLASE_BLOQUEADO : 'bg-background'} ${errores.importe_cobrado ? CLASE_ERROR : ''}`}
                                            />
                                            <ErrorCampo msg={errores.importe_cobrado} />
                                            {difiereImporte && (
                                                <p className="flex items-start gap-1 text-[11px] leading-snug text-amber-700 dark:text-amber-400">
                                                    <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                                                    {compartido ? 'Del voucher quedan' : 'El voucher dice'} S/ {sumaVoucher.toFixed(2)}{' '}
                                                    {conRecibo ? 'y el recibo dice' : 'y el importe cobrado es'} S/ {cobradoN.toFixed(2)}.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    </div>

                                    <div className="space-y-3 rounded-xl border border-violet-100 bg-violet-50/30 p-3 sm:p-4 dark:border-violet-950 dark:bg-violet-950/10">
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
                                        </div>

                                        {voucher && (
                                            <div className={`rounded-xl border p-3
                                                ${lectura === 'manual' ? 'border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20' : 'border-violet-200 bg-violet-50/40 dark:border-violet-900 dark:bg-violet-950/20'}`}>
                                                {lectura === 'leyendo' ? (
                                                    <div className="flex items-start gap-2">
                                                        <div className="flex-1"><LecturaVoucher preview={voucher.preview} /></div>
                                                        <button type="button" onClick={() => ponerVoucher(null)} title="Quitar voucher"
                                                                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600">
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3 animate-in fade-in duration-500">
                                                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                                                            {voucher.preview
                                                                ? <img src={voucher.preview} alt={voucher.file.name} className="h-full w-full object-cover" />
                                                                : <FileText className="h-6 w-6 text-muted-foreground" />}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-semibold">{compartido ? 'Voucher compartido' : 'Voucher'}</p>
                                                            {lectura === 'leido' && <p className="flex items-center gap-1 text-xs text-violet-700 dark:text-violet-300"><Sparkles className="h-3 w-3" /> Leído del voucher</p>}
                                                            {lectura === 'manual' && <p className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400"><PencilLine className="h-3 w-3" /> Completa a mano lo que falta</p>}
                                                        </div>
                                                        <button type="button" onClick={() => ponerVoucher(null)} title="Quitar voucher"
                                                                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600">
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <input
                                            ref={voucherInputRef}
                                            type="file"
                                            accept={VOUCHER_ACCEPT}
                                            multiple
                                            className="hidden"
                                            onChange={handleVoucherChange}
                                        />
                                        {!voucher && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => voucherInputRef.current?.click()}
                                                    className="h-14 border-2 border-dashed border-sky-300 rounded-lg
                                                        flex items-center justify-center gap-2 px-3
                                                        text-xs font-medium text-sky-700 hover:border-sky-400
                                                        hover:bg-sky-50/50 transition-all"
                                                >
                                                    <Upload className="h-4 w-4 shrink-0" />
                                                    <span className="text-left leading-tight">
                                                        Subir voucher
                                                        <span className="block text-[10px] font-normal opacity-70">
                                                            foto o PDF · varios = un registro por depósito
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
                                        )}

                                        {depositosExtra.length > 0 && (
                                            <div className="rounded-xl border border-sky-300 bg-sky-50/70 p-3 dark:border-sky-900 dark:bg-sky-950/30">
                                                <p className="text-sm font-bold text-foreground">También se registrarán (un registro por depósito)</p>
                                                <p className="text-[11px] text-muted-foreground">Mismo cliente y documento; cada uno con su voucher y su depósito.</p>
                                                <div className="mt-2 space-y-2">
                                                    {depositosExtra.map((x, i) => {
                                                        const falta = faltantesDatos(x.datos)
                                                        return (
                                                            <div key={x.id} className="flex items-center gap-2.5 rounded-lg border bg-background p-2">
                                                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted flex items-center justify-center">
                                                                    {x.preview
                                                                        ? <img src={x.preview} alt="" className="h-full w-full object-cover" />
                                                                        : <FileText className="h-4 w-4 text-muted-foreground" />}
                                                                </div>
                                                                <div className="min-w-0 flex-1 text-xs">
                                                                    <p className="font-semibold">
                                                                        Depósito {i + 2} · {x.datos.importe == null ? 'importe ?' : fmtMoney(x.datos.importe)}
                                                                    </p>
                                                                    <p className="truncate text-muted-foreground">
                                                                        {[descBanco(x.datos.cod_banco) ?? x.datos.cod_banco ?? 'banco ?',
                                                                          ...(x.datos.fecha ? [fmtFecha(x.datos.fecha)] : []),
                                                                          `Op. ${x.datos.numero_operacion ?? '?'}`].join(' · ')}
                                                                    </p>
                                                                    {falta.length > 0 && (
                                                                        <p className="text-amber-700 dark:text-amber-400">No se leyó: {falta.join(', ')}. Quítalo y súbelo en otro registro.</p>
                                                                    )}
                                                                </div>
                                                                <button type="button" title="Quitar"
                                                                        onClick={() => {
                                                                            if (x.preview) URL.revokeObjectURL(x.preview)
                                                                            setDepositosExtra(prev => prev.filter(d => d.id !== x.id))
                                                                        }}
                                                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600">
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/30 p-3 sm:p-4 dark:border-emerald-950 dark:bg-emerald-950/10">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                                                <Landmark className="h-3.5 w-3.5" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold leading-tight text-foreground">Datos del depósito</p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {voucher ? 'Lo leído del voucher queda bloqueado' : 'Obligatorios aunque no subas voucher'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                    {bloqueados.includes('cod_banco') && <Lock className="h-2.5 w-2.5" />}Banco <span className="text-red-500">*</span>
                                                </label>
                                                {lectura === 'leyendo' ? <div className="voucher-brillo h-10 rounded-md border" /> : (
                                                    <Select value={formReg.cod_banco} onValueChange={v => { fc('cod_banco', v); fc('desc_banco', '') }} disabled={bloqueado('cod_banco')}>
                                                        <SelectTrigger className={`h-10 ${bloqueado('cod_banco') ? CLASE_BLOQUEADO : 'bg-background'} ${errores.cod_banco ? CLASE_ERROR : ''}`}>
                                                            <SelectValue placeholder="Elegir banco" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {bancos.map(b => (
                                                                <SelectItem key={b.CodigoEntidadFinanciera} value={b.CodigoEntidadFinanciera}>{b.DescripcionEntidadFinanciera}</SelectItem>
                                                            ))}
                                                            {formReg.cod_banco && !bancos.some(b => b.CodigoEntidadFinanciera === formReg.cod_banco) && (
                                                                <SelectItem value={formReg.cod_banco}>{formReg.desc_banco || formReg.cod_banco}</SelectItem>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                                <ErrorCampo msg={errores.cod_banco} />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                    {bloqueados.includes('fecha_deposito') && <Lock className="h-2.5 w-2.5" />}Fecha de depósito <span className="text-red-500">*</span>
                                                </label>
                                                {lectura === 'leyendo' ? <div className="voucher-brillo h-10 rounded-md border" /> : (
                                                    <Input
                                                        type="date" min={rango.min} max={rango.max}
                                                        value={formReg.fecha_deposito}
                                                        onChange={e => fc('fecha_deposito', e.target.value)}
                                                        disabled={bloqueado('fecha_deposito')}
                                                        className={`h-10 font-mono ${bloqueado('fecha_deposito') ? CLASE_BLOQUEADO : 'bg-background'} ${errores.fecha_deposito ? CLASE_ERROR : ''}`}
                                                    />
                                                )}
                                                <ErrorCampo msg={errores.fecha_deposito} />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                    {bloqueados.includes('numero_operacion') && <Lock className="h-2.5 w-2.5" />}N° operación <span className="text-red-500">*</span>
                                                </label>
                                                {lectura === 'leyendo' ? <div className="voucher-brillo h-10 rounded-md border" /> : (
                                                    <Input
                                                        placeholder="Ej. 14009921"
                                                        value={formReg.numero_operacion}
                                                        onChange={e => fc('numero_operacion', e.target.value)}
                                                        disabled={bloqueado('numero_operacion')}
                                                        maxLength={50}
                                                        className={`h-10 font-mono placeholder:font-sans placeholder:text-muted-foreground/50 ${bloqueado('numero_operacion') ? CLASE_BLOQUEADO : 'bg-background'} ${errores.numero_operacion ? CLASE_ERROR : ''}`}
                                                    />
                                                )}
                                                <ErrorCampo msg={errores.numero_operacion} />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">N° Cheque</label>
                                                <Input
                                                    placeholder="Opcional"
                                                    value={formReg.numero_cheque}
                                                    onChange={e => fc('numero_cheque', e.target.value)}
                                                    maxLength={50} className="h-10 bg-background font-mono placeholder:font-sans"
                                                />
                                            </div>
                                            {voucher && (
                                                <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
                                                    <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                        {bloqueados.includes('importe') && <Lock className="h-2.5 w-2.5" />}Importe del voucher <span className="text-red-500">*</span>
                                                    </label>
                                                    {lectura === 'leyendo' ? <div className="voucher-brillo h-10 rounded-md border" /> : (
                                                        <Input
                                                            type="number" step="0.01" min={0} placeholder="0.00"
                                                            value={importeVoucher}
                                                            onChange={e => setImporteVoucher(e.target.value)}
                                                            disabled={bloqueado('importe')}
                                                            className={`h-10 font-mono ${bloqueado('importe') ? CLASE_BLOQUEADO : 'bg-background'}`}
                                                        />
                                                    )}
                                                </div>
                                            )}
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
                                            <Eraser className="h-4 w-4" /> <span className="hidden sm:inline">Limpiar</span>
                                        </Button>
                                        <Button
                                            onClick={handleAgregar}
                                            disabled={guardando}
                                            className="h-11 flex-1 border-2 border-dashed border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-400"
                                        >
                                            {guardando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                            {depositosExtra.length > 0
                                                ? `Agregar ${depositosExtra.length + 1} registros a la planilla`
                                                : 'Agregar registro a la planilla'}
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
                                        onEliminar={guardando || enviando ? undefined : (id => setRegAEliminar(detalle.find(r => r.id_detalle === id) ?? null))}
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
                                    <Button variant="outline" size="sm" onClick={() => { limpiarRegistro(); onLimpiar() }} disabled={guardando || enviando} className="text-muted-foreground">
                                        Cancelar
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                                        onClick={handleSolicitar}
                                        disabled={enviando || guardando || detalle.length === 0}
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
                    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-background p-3 shadow-sm">
                        <div className="flex min-w-[150px] flex-1 flex-col gap-1 sm:flex-none">
                            <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                <Filter className="h-3 w-3" /> Estado
                            </label>
                            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                                <SelectTrigger className="h-9 bg-background text-xs sm:w-44"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {ESTADOS_FILTRO.map(e => <SelectItem key={e.v} value={e.v}>{e.t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex min-w-[130px] flex-1 flex-col gap-1 sm:flex-none">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Desde</label>
                            <Input type="date" value={filtroDesde} max={filtroHasta || undefined}
                                   onChange={e => setFiltroDesde(e.target.value)} className="h-9 text-xs" />
                        </div>
                        <div className="flex min-w-[130px] flex-1 flex-col gap-1 sm:flex-none">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Hasta</label>
                            <Input type="date" value={filtroHasta} min={filtroDesde || undefined}
                                   onChange={e => setFiltroHasta(e.target.value)} className="h-9 text-xs" />
                        </div>
                        {hayFiltros && (
                            <Button variant="ghost" size="sm" className="h-9 gap-1 text-muted-foreground"
                                    onClick={() => { setFiltroEstado('todos'); setFiltroDesde(''); setFiltroHasta('') }}>
                                <X className="h-3.5 w-3.5" /> Quitar filtros
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            {misPlanillas.length} planilla{misPlanillas.length !== 1 ? 's' : ''}
                        </p>
                        <Button
                            variant="outline" size="sm"
                            onClick={cargarMisPlanillas}
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
                                <p className="text-muted-foreground">
                                    {hayFiltros
                                        ? 'No hay planillas con esos filtros.'
                                        : modoAdmin ? 'El vendedor aún no tiene planillas.' : 'Aún no tienes planillas enviadas.'}
                                </p>
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
                                    className="flex items-center justify-between gap-2 p-3.5 cursor-pointer hover:bg-muted transition-colors"
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
                                                <BadgeCreadoPor nombre={creadorDe(planilla)} />
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
