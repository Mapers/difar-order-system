'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import apiClient from '@/app/api/client'
import { useAuth } from '@/context/authContext'
import { toast } from '@/app/hooks/useToast'
import { useReciboCliente } from '@/app/hooks/useReciboCliente'
import { numeroALetras } from '@/app/utils/numero-a-letras'
import { ClientService } from '@/app/services/client/ClientService'
import { mapClientFromApi } from '@/mappers/clients'
import { IClient } from '@/app/types/clients/client-interface'
import {
    CONCEPTOS, TIPOS_LIQUIDACION, ConceptoRecibo, TipoLiquidacion,
    LineaRecibo, MonedaRecibo, NuevoRecibo, ReciboCabecera, simboloMoneda,
    DocumentoRecibo, DocumentoRepetido,
} from '@/app/types/recibo-cliente-types'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ReciboDetalleTabla, erroresDeLineas } from './ReciboDetalleTabla'
import { FirmaPad } from './FirmaPad'
import { AutocompleteBuscador, OpcionAutocomplete } from './AutocompleteBuscador'

interface Props {
    onEmitido: (recibo: ReciboCabecera) => void
}

const MESES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function hoyISO() {
    const d = new Date()
    const mes = String(d.getMonth() + 1).padStart(2, '0')
    const dia = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${mes}-${dia}`
}

function partesFecha(iso: string) {
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!m) return { dia: '', mesIdx: 0, anio: '' }
    return { dia: String(Number(m[3])), mesIdx: Number(m[2]) - 1, anio: m[1] }
}

function componerFecha(dia: string, mesIdx: number, anio: string) {
    const a = anio.padStart(4, '0')
    const m = String(mesIdx + 1).padStart(2, '0')
    const ultimoDia = new Date(Number(a), mesIdx + 1, 0).getDate()
    const d = String(Math.min(Math.max(Number(dia) || 1, 1), ultimoDia)).padStart(2, '0')
    return `${a}-${m}-${d}`
}

const CAMPO =
    'bg-transparent border-0 border-b border-[#9a8c6a] outline-none px-1 py-0.5 ' +
    'text-[#1b2f63] placeholder:text-[#b7aa8a] focus:border-[#9b1c22] focus:bg-[#fbf6e8]'

const svgUri = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`

/* Borde rasgado a los costados: una tira dentada (12x180) que se repite hacia abajo a cada lado
   y un rectángulo lleno al centro. Los extremos de la tira coinciden para que no se note el empalme. */
const TIRA_IZQ = svgUri(`<svg xmlns='http://www.w3.org/2000/svg' width='12' height='180'><path d='M12 0 L2 0 L1.1 3 L2 7.5 L2.9 12.8 L2.4 19.6 L1.4 28.3 L0.2 36.3 L3.5 44 L6.8 52.7 L2.4 62.2 L3.5 69.2 L3.2 74.8 L1.1 80.1 L3.6 86.1 L3.3 93 L2.1 96.4 L0.7 103 L6.3 112.4 L3.5 117.8 L1.5 124.4 L1.6 129.4 L2.3 134.7 L1.7 139.3 L2.4 148.4 L2.6 155 L2.7 164.6 L1.3 169.3 L3 174.6 L2 180 L12 180Z'/></svg>`)
const TIRA_DER = svgUri(`<svg xmlns='http://www.w3.org/2000/svg' width='12' height='180'><path d='M0 0 L10.0 0 L10.9 3 L10.0 7.5 L9.1 12.8 L9.6 19.6 L10.6 28.3 L11.8 36.3 L8.5 44 L5.2 52.7 L9.6 62.2 L8.5 69.2 L8.8 74.8 L10.9 80.1 L8.4 86.1 L8.7 93 L9.9 96.4 L11.3 103 L5.7 112.4 L8.5 117.8 L10.5 124.4 L10.4 129.4 L9.7 134.7 L10.3 139.3 L9.6 148.4 L9.4 155 L9.3 164.6 L10.7 169.3 L9.0 174.6 L10.0 180 L0 180Z'/></svg>`)

function mascaraBordeRoto(): React.CSSProperties {
    const image = `linear-gradient(#000,#000), ${TIRA_IZQ}, ${TIRA_DER}`
    const size = 'calc(100% - 22px) 100%, 12px 180px, 12px 180px'
    const position = 'center top, left top, right top'
    const repeat = 'no-repeat, repeat-y, repeat-y'
    return {
        WebkitMaskImage: image, WebkitMaskSize: size, WebkitMaskPosition: position, WebkitMaskRepeat: repeat,
        maskImage: image, maskSize: size, maskPosition: position, maskRepeat: repeat,
    }
}

/* Arrugas: relieve suave hecho con ruido + luz rasante; se multiplica sobre el papel. */
const ARRUGAS: React.CSSProperties = {
    backgroundImage: svgUri(
        "<svg xmlns='http://www.w3.org/2000/svg' width='640' height='640'>" +
        "<filter id='a' x='0' y='0' width='100%' height='100%'>" +
        "<feTurbulence type='fractalNoise' baseFrequency='0.007 0.012' numOctaves='5' seed='11' stitchTiles='stitch'/>" +
        "<feDiffuseLighting lighting-color='#ffffff' surfaceScale='5'><feDistantLight azimuth='225' elevation='48'/></feDiffuseLighting>" +
        "</filter><rect width='100%' height='100%' filter='url(#a)'/></svg>"
    ),
    backgroundSize: '640px 640px',
    mixBlendMode: 'multiply',
    opacity: 0.38,
}

/* Dobleces: un pliegue vertical al centro y uno horizontal, con sombra y brillo a cada lado. */
const DOBLECES: React.CSSProperties = {
    backgroundImage: [
        'linear-gradient(90deg, transparent calc(50% - 6px), rgba(110,82,35,.10) calc(50% - 1px), rgba(255,253,245,.55) 50%, transparent calc(50% + 7px))',
        'linear-gradient(180deg, transparent calc(38% - 6px), rgba(110,82,35,.09) calc(38% - 1px), rgba(255,253,245,.5) 38%, transparent calc(38% + 7px))',
    ].join(','),
}

// Papel antiguo pero sobrio: crema cálido, bordes algo tostados, rayado muy tenue y tinta azul.
const PAPEL: React.CSSProperties = {
    backgroundColor: '#f7f0dc',
    backgroundImage: [
        'radial-gradient(ellipse at center, rgba(255,252,240,.85) 0%, rgba(247,240,220,0) 60%)',
        'radial-gradient(ellipse at top left, rgba(160,120,60,.10), transparent 55%)',
        'radial-gradient(ellipse at bottom right, rgba(140,100,50,.12), transparent 55%)',
        'repeating-linear-gradient(0deg, rgba(120,95,50,.035) 0px, rgba(120,95,50,.035) 1px, transparent 1px, transparent 28px)',
    ].join(','),
    boxShadow: 'inset 0 0 60px rgba(120,90,40,.18)',
    ...mascaraBordeRoto(),
}
const SERIF = { fontFamily: 'Georgia, "Times New Roman", serif' }

function Casilla({
    marcada, onToggle, children,
}: {
    marcada: boolean
    onToggle: () => void
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={marcada}
            onClick={onToggle}
            className="flex items-center gap-1.5 text-[12px] font-bold text-[#1b2f63] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#9b1c22]"
        >
            <span className="flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-[#1b2f63] text-[12px] leading-none">
                {marcada ? '✕' : ''}
            </span>
            {children}
        </button>
    )
}

export function ReciboForm({ onEmitido }: Props) {
    const { user, isVendedor, isRepresentante } = useAuth()
    const { emitirRecibo, emitiendo, siguienteNumero } = useReciboCliente()

    const [clientes, setClientes] = useState<IClient[]>([])
    const [cargandoClientes, setCargandoClientes] = useState(false)

    const [codCliente, setCodCliente] = useState('')
    const [fecha, setFecha] = useState(hoyISO)
    const [ciudad, setCiudad] = useState<string>((user as any)?.Ciudad ?? 'Chimbote')
    const [concepto, setConcepto] = useState<ConceptoRecibo | ''>('')
    const [tipoLiq, setTipoLiq] = useState<TipoLiquidacion | ''>('')
    const [numeroPlanilla, setNumeroPlanilla] = useState('')
    const [detalleTexto, setDetalleTexto] = useState('')
    const [observacion, setObservacion] = useState('')
    const [lineas, setLineas] = useState<LineaRecibo[]>([])
    const [moneda, setMoneda] = useState<MonedaRecibo>(1)
    const [documentos, setDocumentos] = useState<DocumentoRecibo[]>([])
    const [repetidos, setRepetidos] = useState<DocumentoRepetido[] | null>(null)
    const [cargandoDocs, setCargandoDocs] = useState(false)
    const [firmaCliente, setFirmaCliente] = useState<string | null>(null)
    const [firmaVendedor, setFirmaVendedor] = useState<string | null>(null)
    const [versionFirmas, setVersionFirmas] = useState(0)
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        if (!user) return

        setCargandoClientes(true)
        ClientService.getAllClientsByCodVendedor(
            isVendedor() ? user.codigo ?? '' : '',
            '1',
            isRepresentante() ? user.codRepres ?? '' : '',
        )
            .then(res => setClientes((res?.data || []).map(mapClientFromApi)))
            .catch(() => setClientes([]))
            .finally(() => setCargandoClientes(false))
    }, [user])

    useEffect(() => {
        if (!codCliente) {
            setDocumentos([])
            return
        }

        let cancelado = false
        setCargandoDocs(true)

        // Una fila por documento con su saldo real (todos los pagos restados). Si quien entra es
        // vendedor, el servidor solo le devuelve sus documentos.
        const params = new URLSearchParams({ cod_clie: codCliente })

        apiClient.get(`/recibos/documentos-cliente?${params}`)
            .then(res => {
                if (cancelado) return
                setDocumentos(res.data?.data?.data ?? [])
            })
            .catch(() => {
                if (cancelado) return
                setDocumentos([])
                toast({
                    title: 'Error',
                    description: 'No se pudieron cargar los documentos del cliente.',
                    variant: 'destructive',
                })
            })
            .finally(() => { if (!cancelado) setCargandoDocs(false) })

        return () => { cancelado = true }
    }, [codCliente, user?.codigo])

    const clienteSel = useMemo(
        () => clientes.find(c => c.codigoInterno === codCliente) ?? null,
        [clientes, codCliente]
    )

    const total = useMemo(
        () => lineas.reduce((s, l) => s + (parseFloat(l.importe) || 0), 0),
        [lineas]
    )

    const totalLetras = useMemo(() => numeroALetras(total, moneda), [total, moneda])
    const simbolo = simboloMoneda(moneda)
    const { dia, mesIdx, anio } = partesFecha(fecha)

    const agregarDocumento = useCallback((idKardex: string) => {
        const doc = documentos.find(d => String(d.IdKardexClientes) === idKardex)
        if (!doc) return

        const simboloDoc = doc.Simb_Moneda || 'S/'
        const monedaDoc: MonedaRecibo = simboloDoc.includes('$') ? 2 : 1

        setLineas(prev => {
            if (prev.length > 0 && monedaDoc !== moneda) {
                toast({
                    title: 'Monedas distintas',
                    description: `El recibo está en ${simbolo} y ese documento está en ${simboloDoc}. Emite un recibo aparte para esa moneda.`,
                    variant: 'destructive',
                })
                return prev
            }

            if (prev.some(l => l.id_kardex_cliente === doc.IdKardexClientes)) {
                toast({
                    title: 'Documento repetido',
                    description: `${doc.documento_completo} ya está en el recibo.`,
                    variant: 'warning',
                })
                return prev
            }

            if (prev.length === 0) setMoneda(monedaDoc)

            const enRecibos = Number(doc.recibos_vigentes) > 0
                ? { cantidad: Number(doc.recibos_vigentes), importe: Number(doc.importe_en_recibos) || 0, ultimo: doc.ultimo_recibo }
                : null

            return [...prev, {
                fecha_vcto: doc.Fecha_Vcto,
                en_recibos: enRecibos,
                uid: `kardex-${doc.IdKardexClientes}`,
                id_kardex_cliente: doc.IdKardexClientes,
                tipo_documento: doc.Tipo_Doc ?? '',
                abre_documento: doc.Abre_Doc ?? '',
                serie: doc.SerieDoc ?? '',
                numero_doc: String(doc.NumeroDoc ?? ''),
                documento_completo: doc.documento_completo ?? '',
                importe: String(doc.saldo_pendiente ?? 0),
                saldo_documento: Number(doc.saldo_pendiente ?? 0),
                observaciones: '',
                simbolo_moneda: simboloDoc,
            }]
        })
    }, [documentos, moneda, simbolo])

    const opcionesCliente: OpcionAutocomplete[] = useMemo(
        () => clientes.map(c => ({
            value: c.codigoInterno,
            label: c.razonSocial,
            descripcion: [c.codigoInterno, c.numeroDocumento].filter(Boolean).join(' · '),
        })),
        [clientes]
    )

    const opcionesDocumento: OpcionAutocomplete[] = useMemo(
        () => documentos
            .filter(d => !lineas.some(l => l.id_kardex_cliente === d.IdKardexClientes))
            .map(d => ({
                value: String(d.IdKardexClientes),
                label: `${d.Abre_Doc ?? ''} ${d.documento_completo ?? ''}`.trim(),
                descripcion: [
                    d.Fecha_Vcto ? `Vence ${String(d.Fecha_Vcto).slice(0, 10)}` : null,
                    Number(d.recibos_vigentes) > 0 ? `ya en recibo ${d.ultimo_recibo ?? ''}`.trim() : null,
                ].filter(Boolean).join(' · ') || undefined,
                extra: `${d.Simb_Moneda || 'S/'} ${Number(d.saldo_pendiente ?? 0).toFixed(2)}`,
            })),
        [documentos, lineas]
    )

    const limpiar = () => {
        setCodCliente('')
        setConcepto('')
        setTipoLiq('')
        setNumeroPlanilla('')
        setDetalleTexto('')
        setObservacion('')
        setLineas([])
        setMoneda(1)
        setFecha(hoyISO())
        setFirmaCliente(null)
        setFirmaVendedor(null)
        setVersionFirmas(v => v + 1)
        setErrors({})
    }

    const validate = () => {
        const e: Record<string, string> = {}

        if (!codCliente) e.cliente = 'Elige un cliente'
        if (!concepto) e.concepto = 'Marca el concepto'
        if (!tipoLiq) e.tipoLiq = 'Marca el tipo de liquidación'

        if (tipoLiq === 'PLANILLA' && !numeroPlanilla.trim()) {
            e.numeroPlanilla = 'El N° de planilla es obligatorio'
        }

        if (lineas.length === 0) {
            e.lineas = 'Agrega al menos un documento'
        } else if (lineas.some(l => !l.documento_completo.trim() && !l.tipo_documento.trim())) {
            e.lineas = 'Cada fila necesita tipo o número de documento'
        } else if (Object.keys(erroresDeLineas(lineas)).length > 0) {
            e.lineas = 'Revisa los importes marcados en rojo'
        }

        if (total <= 0) e.total = 'El total debe ser mayor a cero'

        if (!firmaCliente) e.firmaCliente = 'Falta la firma del cliente'
        if (!firmaVendedor) e.firmaVendedor = 'Falta la firma del vendedor'

        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleEmitir = async (confirmarRepetidos = false) => {
        if (!validate() || !user || !clienteSel) return

        const payload: NuevoRecibo = {
            confirmar_repetidos: confirmarRepetidos,
            fecha_emision: fecha,
            ciudad,
            cod_cliente: codCliente,
            nombre_cliente: clienteSel.razonSocial,
            ruc_cliente: clienteSel.numeroDocumento || null,
            zona: clienteSel.zona || null,
            detalle_texto: detalleTexto || null,
            concepto: concepto as ConceptoRecibo,
            tipo_liquidacion: tipoLiq as TipoLiquidacion,
            numero_planilla: tipoLiq === 'PLANILLA' ? numeroPlanilla.trim() : null,
            moneda,
            total_letras: totalLetras,
            observacion: observacion || null,
            id_usuario_web: user.idUsuarioWeb,
            cod_vendedor: user.codigo || null,
            nombre_vendedor: user.nombreCompleto || null,
            firma_cliente: firmaCliente,
            firma_vendedor: firmaVendedor,
            detalle: lineas.map(l => ({
                id_kardex_cliente: l.id_kardex_cliente,
                tipo_documento: l.tipo_documento || null,
                abre_documento: l.abre_documento || null,
                serie: l.serie || null,
                numero_doc: l.numero_doc || null,
                documento_completo: l.documento_completo || null,
                importe: parseFloat(l.importe) || 0,
                saldo_documento: l.saldo_documento,
                observaciones: l.observaciones || null,
            })),
        }

        const data = await emitirRecibo(payload, setRepetidos)
        if (!data) return

        limpiar()
        onEmitido(data.recibo)
    }

    const error = (campo: string) =>
        errors[campo]
            ? <p className="mt-1 text-[11px] font-semibold text-[#9b1c22]">{errors[campo]}</p>
            : null

    return (
        <div className="mx-auto max-w-[820px]" style={{ filter: 'drop-shadow(0 10px 18px rgba(40,30,10,.22))' }}>
            <div
                className="relative border-y border-[#cdbf98] px-[clamp(24px,4vw,34px)] py-[clamp(16px,3.5vw,30px)] text-[#1b2f63]"
                style={PAPEL}
            >
                {/* Arrugas y dobleces del papel (no tapan clics). */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={ARRUGAS} />
                <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={DOBLECES} />
                {/* Doble filete interior, como los talonarios impresos. */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-[16px] inset-y-[7px] rounded-[2px] border border-[#b9a777]/60" />
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-[19px] inset-y-[10px] rounded-[2px] border border-[#b9a777]/30" />

                <div className="relative flex flex-wrap justify-between gap-4 border-b-2 border-double border-[#1b2f63] pb-2.5">
                    <div className="flex flex-1 flex-col gap-1 sm:min-w-[250px]">
                        <img
                            src="/difar-logo.png"
                            alt="DIFAR — Distribuidora e Importadora Farmacéutica S.A.C."
                            className="h-auto w-[clamp(180px,42vw,260px)]"
                        />
                        <div className="text-[9.5px] leading-[1.35] text-[#3b4f86]">
                            Ofc. Princip. Urb. Santa Edelmira - Los Eucaliptos 218<br />
                            Dpto. 102 - Telf. 044-289196 - TRUJILLO<br />
                            Jr. M. Villavicencio 783 P.J. Bolívar Bajo - Telf. 043-706762 · ANCASH - SANTA - CHIMBOTE
                        </div>
                    </div>

                    <div className="w-full sm:w-auto sm:min-w-[220px]">
                        <div className="flex flex-wrap items-baseline justify-end gap-2">
                            <span className="text-[clamp(17px,4vw,24px)] font-bold tracking-[4px]" style={SERIF}>RECIBO</span>
                            <span className="text-[clamp(18px,4.5vw,26px)] font-bold text-[#9b1c22]" style={SERIF}>N°</span>
                            <span className="w-[120px] border-b border-[#c98b8e] pb-px text-[clamp(18px,4.5vw,26px)] font-bold tracking-wider text-[#9b1c22]" style={SERIF}>
                                {siguienteNumero ?? (
                                    <span className="text-[13px] font-semibold italic tracking-normal text-[#b98a8d]">
                                        al generar
                                    </span>
                                )}
                            </span>
                        </div>

                        {siguienteNumero && (
                            <p className="mt-0.5 text-right text-[11px] font-semibold italic text-[#b98a8d]">
                                siguiente · referencial
                            </p>
                        )}

                        <div data-guia="conceptos" className="mt-1.5 flex flex-wrap justify-end gap-x-[18px] gap-y-2.5">
                            {CONCEPTOS.map(c => (
                                <Casilla
                                    key={c.value}
                                    marcada={concepto === c.value}
                                    onToggle={() => setConcepto(concepto === c.value ? '' : c.value)}
                                >
                                    {c.label}
                                </Casilla>
                            ))}
                        </div>
                        <div className="text-right">{error('concepto')}</div>
                    </div>
                </div>

                <div className="mt-3.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1.5 text-[14px]">
                    <input
                        value={ciudad}
                        onChange={(e) => setCiudad(e.target.value)}
                        className={`${CAMPO} w-[110px] font-bold`}
                        aria-label="Ciudad"
                    />
                    <span className="font-bold">,</span>

                    <input
                        value={dia}
                        onChange={(e) => setFecha(componerFecha(e.target.value, mesIdx, anio))}
                        inputMode="numeric"
                        className={`${CAMPO} w-[52px] text-center tabular-nums`}
                        aria-label="Día"
                    />

                    <span className="font-bold">de</span>

                    <select
                        value={mesIdx}
                        onChange={(e) => setFecha(componerFecha(dia, Number(e.target.value), anio))}
                        className={`${CAMPO} cursor-pointer`}
                        aria-label="Mes"
                    >
                        {MESES.map((m, i) => (
                            <option key={m} value={i}>{m}</option>
                        ))}
                    </select>

                    <span className="font-bold">del</span>

                    <input
                        value={anio}
                        onChange={(e) => setFecha(componerFecha(dia, mesIdx, e.target.value))}
                        inputMode="numeric"
                        className={`${CAMPO} w-[68px] text-center tabular-nums`}
                        aria-label="Año"
                    />
                </div>

                <div data-guia="cliente" className="mt-3.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1.5 text-[14px]">
                    <span className="whitespace-nowrap font-bold">Hemos recibido de:</span>
                    <div className="min-w-0 flex-1 sm:min-w-[240px]">
                        <AutocompleteBuscador
                            opciones={opcionesCliente}
                            value={codCliente}
                            onSelect={setCodCliente}
                            cargando={cargandoClientes}
                            placeholder="buscar por nombre, código o RUC"
                            buscarPlaceholder="Nombre, código o RUC…"
                            vacio="No se encontraron clientes."
                            className={`${CAMPO} text-[14px]`}
                        />
                    </div>
                </div>
                {error('cliente')}

                <div className="mt-3.5 flex flex-wrap items-baseline gap-x-5 gap-y-1.5 text-[14px]">
                    <span className="flex w-full min-w-0 items-baseline gap-2.5 sm:w-auto sm:flex-1">
                        <span className="whitespace-nowrap font-bold">Código Cliente (RUC):</span>
                        <span className="min-w-0 flex-1 border-b border-[#9a8c6a] px-1 py-0.5">
                            {clienteSel?.numeroDocumento || <span className="text-[#b7aa8a]">—</span>}
                        </span>
                    </span>

                    <span className="flex w-full min-w-0 items-baseline gap-2.5 sm:w-auto sm:flex-1">
                        <span className="whitespace-nowrap font-bold">Zona:</span>
                        <span className="min-w-0 flex-1 border-b border-[#9a8c6a] px-1 py-0.5">
                            {clienteSel?.zona || <span className="text-[#b7aa8a]">—</span>}
                        </span>
                    </span>
                </div>

                <div className="mt-3.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1.5 text-[14px]">
                    <span className="whitespace-nowrap font-bold">Por lo siguiente:</span>
                    <input
                        value={detalleTexto}
                        onChange={(e) => setDetalleTexto(e.target.value)}
                        className={`${CAMPO} min-w-[120px] flex-1`}
                        placeholder="detalle / vendedor"
                        aria-label="Por lo siguiente"
                    />
                </div>

                <ReciboDetalleTabla
                    lineas={lineas}
                    onChange={setLineas}
                    buscador={
                        <AutocompleteBuscador
                            opciones={opcionesDocumento}
                            onSelect={agregarDocumento}
                            cargando={cargandoDocs}
                            disabled={!codCliente}
                            placeholder={
                                codCliente
                                    ? '+ Buscar comprobante del cliente'
                                    : 'Elige un cliente para ver sus comprobantes'
                            }
                            buscarPlaceholder="N° de documento…"
                            vacio={
                                documentos.length === 0
                                    ? 'El cliente no tiene documentos pendientes.'
                                    : 'Ya agregaste todos los que coinciden.'
                            }
                            className="rounded-lg border border-dashed border-[#1b2f63]/70 bg-[#fbf6e8] px-3.5 py-2 text-[13px] font-semibold text-[#1b2f63]"
                        />
                    }
                    simbolo={simbolo}
                    observacion={observacion}
                    onObservacionChange={setObservacion}
                />
                {error('lineas')}
                {error('total')}

                <div className="mt-3.5 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                    <div className="min-w-0 flex-1 text-[13px] sm:min-w-[300px]">
                        <div className="flex items-baseline gap-2">
                            <span className="whitespace-nowrap font-bold">La cantidad de:</span>
                            <span className="min-w-0 flex-1 border-b border-[#9a8c6a] px-1 py-0.5">
                                {total > 0
                                    ? totalLetras
                                    : <span className="text-[#b7aa8a]">importe en letras</span>}
                            </span>
                        </div>
                    </div>

                    <div data-guia="tipo-liquidacion" className="flex min-w-[150px] flex-col gap-2 text-[13px]">
                        {TIPOS_LIQUIDACION.map(t => (
                            <div key={t.value}>
                                <Casilla
                                    marcada={tipoLiq === t.value}
                                    onToggle={() => setTipoLiq(tipoLiq === t.value ? '' : t.value)}
                                >
                                    {t.label}
                                </Casilla>

                                {t.value === 'PLANILLA' && tipoLiq === 'PLANILLA' && (
                                    <div className="ml-[22px] mt-1.5 flex items-center gap-1.5 text-[13px]">
                                        <span className="whitespace-nowrap font-bold">
                                            N° Planilla <span className="text-[#9b1c22]">*</span>
                                        </span>
                                        <input
                                            value={numeroPlanilla}
                                            onChange={(e) => setNumeroPlanilla(e.target.value)}
                                            inputMode="numeric"
                                            placeholder="obligatorio"
                                            aria-label="Número de planilla"
                                            className={`${CAMPO} w-[120px] ${
                                                errors.numeroPlanilla ? 'border-[#9b1c22] bg-[#f7d9d4]' : ''
                                            }`}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                        {error('tipoLiq')}
                        {error('numeroPlanilla')}
                    </div>
                </div>

                <div data-guia="firmas" className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                        <FirmaPad
                            key={`cliente-${versionFirmas}`}
                            leyenda="FIRMA Y SELLO DEL CLIENTE *"
                            onChange={setFirmaCliente}
                            disabled={emitiendo}
                        />
                        {error('firmaCliente')}
                    </div>

                    <div>
                        <FirmaPad
                            key={`vendedor-${versionFirmas}`}
                            leyenda="FIRMA DEL VENDEDOR *"
                            onChange={setFirmaVendedor}
                            disabled={emitiendo}
                        />
                        {error('firmaVendedor')}
                    </div>
                </div>
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                    type="button"
                    data-guia="limpiar-todo"
                    onClick={limpiar}
                    disabled={emitiendo}
                    className="rounded-lg border border-[#1b2f63] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#1b2f63] transition-colors hover:bg-[#1b2f63] hover:text-white disabled:opacity-40"
                >
                    Limpiar todo
                </button>
                <button
                    type="button"
                    data-guia="generar-recibo"
                    onClick={() => handleEmitir()}
                    disabled={emitiendo}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#1b2f63] bg-[#1b2f63] px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#3b4f86] disabled:opacity-60"
                >
                    {emitiendo && <Loader2 className="h-4 w-4 animate-spin" />}
                    Generar recibo
                </button>
            </div>

            <AlertDialog open={repetidos !== null} onOpenChange={(v) => { if (!v) setRepetidos(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Estos documentos ya están en otro recibo</AlertDialogTitle>
                        <AlertDialogDescription>
                            El recibo no descuenta el saldo, así que un mismo cobro podría quedar en dos recibos.
                            Emítelo solo si es un pago distinto (por ejemplo, otra parte de un pago a cuenta).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <ul className="space-y-1.5 rounded-md border bg-amber-50 p-3 text-[13px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                        {(repetidos ?? []).map(r => (
                            <li key={r.documento}>
                                <b>{r.documento}</b> · recibo N° {r.ultimo_recibo || '—'} por {simbolo} {Number(r.importe_en_recibos).toFixed(2)}
                            </li>
                        ))}
                    </ul>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Revisar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { setRepetidos(null); handleEmitir(true) }}>
                            Sí, es otro pago: emitir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
