'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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
} from '@/app/types/recibo-cliente-types'
import {
    DocumentoCliente,
} from '@/components/contabilidad/planilla-cobranza/SeleccionarDocumentoModal'
import { ReciboDetalleTabla } from './ReciboDetalleTabla'
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
    'bg-transparent border-0 border-b border-[#8aa0cf] outline-none px-1 py-0.5 ' +
    'text-[#12388f] placeholder:text-[#b9c4dd] focus:border-[#d21f27] focus:bg-[#f4f7ff]'

const TIPO_NOTA_CREDITO = '07'

function esNotaCredito(doc: DocumentoCliente) {
    return String(doc.Tipo_Doc ?? '').trim().padStart(2, '0') === TIPO_NOTA_CREDITO
}

function consolidarPendientes(docs: DocumentoCliente[]): DocumentoCliente[] {
    const porDocumento = new Map<string, { base: DocumentoCliente; saldo: number }>()

    for (const d of docs) {
        if (esNotaCredito(d)) continue

        const clave = d.documento_completo || `${d.Tipo_Doc}-${d.SerieDoc}-${d.NumeroDoc}`
        const saldo = Number(d.saldo_pendiente) || 0
        const acumulado = porDocumento.get(clave)

        if (!acumulado) {
            porDocumento.set(clave, { base: d, saldo })
            continue
        }

        acumulado.saldo += saldo
        if (saldo > 0) acumulado.base = d
    }

    return [...porDocumento.values()]
        .filter(x => x.saldo > 0.005)
        .map(x => ({ ...x.base, saldo_pendiente: Number(x.saldo.toFixed(2)) }))
}

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
            className="flex items-center gap-1.5 text-[12px] font-bold text-[#12388f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#d21f27]"
        >
            <span className="flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-[#12388f] text-[12px] leading-none">
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
    const [documentos, setDocumentos] = useState<DocumentoCliente[]>([])
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

        const params = new URLSearchParams({ cod_clie: codCliente })
        if (isVendedor() && user?.codigo) params.append('cod_vend', user.codigo)

        apiClient.get(`/planilla-cobranza/documentos-cliente?${params}`)
            .then(res => {
                if (cancelado) return
                const docs: DocumentoCliente[] = res.data?.data?.data ?? []
                setDocumentos(consolidarPendientes(docs))
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

            return [...prev, {
                uid: `kardex-${doc.IdKardexClientes}`,
                id_kardex_cliente: doc.IdKardexClientes,
                tipo_documento: doc.Tipo_Doc ?? '',
                abre_documento: doc.Abre_Doc ?? '',
                serie: doc.SerieDoc ?? '',
                numero_doc: doc.NumeroDoc ?? '',
                documento_completo: doc.documento_completo ?? '',
                importe: String(doc.saldo_pendiente ?? 0),
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
                descripcion: d.Fecha_Vcto ? `Vence ${String(d.Fecha_Vcto).slice(0, 10)}` : undefined,
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
        }

        if (total <= 0) e.total = 'El total debe ser mayor a cero'

        if (!firmaCliente) e.firmaCliente = 'Falta la firma del cliente'
        if (!firmaVendedor) e.firmaVendedor = 'Falta la firma del vendedor'

        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleEmitir = async () => {
        if (!validate() || !user || !clienteSel) return

        const payload: NuevoRecibo = {
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
                observaciones: l.observaciones || null,
            })),
        }

        const data = await emitirRecibo(payload)
        if (!data) return

        limpiar()
        onEmitido(data.recibo)
    }

    const error = (campo: string) =>
        errors[campo]
            ? <p className="mt-1 text-[11px] font-semibold text-[#d21f27]">{errors[campo]}</p>
            : null

    return (
        <div className="mx-auto max-w-[820px]">
            <div className="rounded-md border border-[#cfd6e6] bg-[#fdfdf8] p-[clamp(14px,3.5vw,30px)] text-[#12388f] shadow-[0_8px_30px_rgba(20,40,90,.15)]">

                <div className="flex flex-wrap justify-between gap-4 border-b-2 border-[#12388f] pb-2.5">
                    <div className="flex flex-1 flex-col gap-1 sm:min-w-[250px]">
                        <img
                            src="/difar-logo.png"
                            alt="DIFAR — Distribuidora e Importadora Farmacéutica S.A.C."
                            className="h-auto w-[clamp(180px,42vw,260px)]"
                        />
                        <div className="text-[9.5px] leading-[1.35] text-[#2b52a8]">
                            Ofc. Princip. Urb. Santa Edelmira - Los Eucaliptos 218<br />
                            Dpto. 102 - Telf. 044-289196 - TRUJILLO<br />
                            Jr. M. Villavicencio 783 P.J. Bolívar Bajo - Telf. 043-706762 · ANCASH - SANTA - CHIMBOTE
                        </div>
                    </div>

                    <div className="w-full sm:w-auto sm:min-w-[220px]">
                        <div className="flex flex-wrap items-baseline justify-end gap-2">
                            <span className="text-[clamp(16px,4vw,22px)] font-extrabold tracking-[2px]">RECIBO</span>
                            <span className="text-[clamp(18px,4.5vw,26px)] font-extrabold text-[#d21f27]">N°</span>
                            <span className="w-[120px] border-b border-[#e39aa0] pb-px text-[clamp(18px,4.5vw,26px)] font-extrabold tracking-wider text-[#d21f27]">
                                {siguienteNumero ?? (
                                    <span className="text-[13px] font-semibold italic tracking-normal text-[#c9a2a6]">
                                        al generar
                                    </span>
                                )}
                            </span>
                        </div>

                        {siguienteNumero && (
                            <p className="mt-0.5 text-right text-[11px] font-semibold italic text-[#c9a2a6]">
                                siguiente · referencial
                            </p>
                        )}

                        <div className="mt-1.5 flex flex-wrap justify-end gap-x-[18px] gap-y-2.5">
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

                <div className="mt-3.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1.5 text-[14px]">
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
                        <span className="min-w-0 flex-1 border-b border-[#8aa0cf] px-1 py-0.5">
                            {clienteSel?.numeroDocumento || <span className="text-[#b9c4dd]">—</span>}
                        </span>
                    </span>

                    <span className="flex w-full min-w-0 items-baseline gap-2.5 sm:w-auto sm:flex-1">
                        <span className="whitespace-nowrap font-bold">Zona:</span>
                        <span className="min-w-0 flex-1 border-b border-[#8aa0cf] px-1 py-0.5">
                            {clienteSel?.zona || <span className="text-[#b9c4dd]">—</span>}
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
                            className="rounded-lg border border-[#1a7a3c] px-3.5 py-2 text-[13px] font-semibold text-[#1a7a3c]"
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
                            <span className="min-w-0 flex-1 border-b border-[#8aa0cf] px-1 py-0.5">
                                {total > 0
                                    ? totalLetras
                                    : <span className="text-[#b9c4dd]">importe en letras</span>}
                            </span>
                        </div>
                    </div>

                    <div className="flex min-w-[150px] flex-col gap-2 text-[13px]">
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
                                            N° Planilla <span className="text-[#d21f27]">*</span>
                                        </span>
                                        <input
                                            value={numeroPlanilla}
                                            onChange={(e) => setNumeroPlanilla(e.target.value)}
                                            inputMode="numeric"
                                            placeholder="obligatorio"
                                            aria-label="Número de planilla"
                                            className={`${CAMPO} w-[120px] ${
                                                errors.numeroPlanilla ? 'border-[#d21f27] bg-[#fdecec]' : ''
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

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
                    onClick={limpiar}
                    disabled={emitiendo}
                    className="rounded-lg border border-[#12388f] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#12388f] transition-colors hover:bg-[#12388f] hover:text-white disabled:opacity-40"
                >
                    Limpiar todo
                </button>
                <button
                    type="button"
                    onClick={handleEmitir}
                    disabled={emitiendo}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#12388f] bg-[#12388f] px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#2b52a8] disabled:opacity-60"
                >
                    {emitiendo && <Loader2 className="h-4 w-4 animate-spin" />}
                    Generar recibo
                </button>
            </div>

        </div>
    )
}
