export type ConceptoRecibo = 'PAGO_CTA' | 'DSCT_PP' | 'GASTOS' | 'OTROS'
export type TipoLiquidacion = 'CLIENTE' | 'PLANILLA' | 'ULT_LIQ'
export type EstadoRecibo = 'EMITIDO' | 'ANULADO'

export type MonedaRecibo = 1 | 2

export const CONCEPTOS: { value: ConceptoRecibo; label: string }[] = [
    { value: 'PAGO_CTA', label: 'PAGO A CTA.' },
    { value: 'DSCT_PP',  label: 'DSCT P.P.' },
    { value: 'GASTOS',   label: 'GASTOS' },
    { value: 'OTROS',    label: 'OTROS' },
]

export const TIPOS_LIQUIDACION: { value: TipoLiquidacion; label: string }[] = [
    { value: 'CLIENTE',  label: '1  CLIENTE' },
    { value: 'PLANILLA', label: '2  PLANILLA' },
    { value: 'ULT_LIQ',  label: '3  ULT. LIQ.' },
]

export interface LineaRecibo {
    uid: string
    id_kardex_cliente: number | null
    tipo_documento: string
    abre_documento: string
    serie: string
    numero_doc: string
    documento_completo: string
    importe: string
    saldo_documento: number | null
    observaciones: string
    simbolo_moneda: string
    /** Vencimiento del documento (solo los que vienen de la cuenta del cliente). */
    fecha_vcto?: string | null
    /** Recibos vigentes que ya incluyen este documento (para avisar antes de repetir). */
    en_recibos?: { cantidad: number; importe: number; ultimo: string | null } | null
}

/** Documento con saldo del cliente (GET /recibos/documentos-cliente). Una fila por documento. */
export interface DocumentoRecibo {
    IdKardexClientes: number
    Cod_Clie: string
    Tipo_Doc: string
    Abre_Doc: string | null
    SerieDoc: string
    NumeroDoc: number | string
    documento_completo: string
    Fecha_Emision: string | null
    Fecha_Vcto: string | null
    CodVend: string | null
    Tipo_Moneda: string | null
    Simb_Moneda: string | null
    saldo_pendiente: number | string
    recibos_vigentes: number | string
    importe_en_recibos: number | string
    ultimo_recibo: string | null
}

/** Respuesta 409 del backend: documentos que ya están en otro recibo vigente. */
export interface DocumentoRepetido {
    documento: string
    ultimo_recibo: string
    importe_en_recibos: number
}

export interface ReciboDetalle {
    id_detalle: number
    id_recibo: number
    orden: number
    id_kardex_cliente: number | null
    tipo_documento: string | null
    abre_documento: string | null
    serie: string | null
    numero_doc: string | null
    documento_completo: string | null
    importe: number | string
    saldo_documento: number | string | null
    observaciones: string | null
}

export interface ReciboCabecera {
    id_recibo: number
    numero_recibo: string
    prefijo: string
    correlativo: number
    fecha_emision: string
    ciudad: string
    cod_cliente: string
    nombre_cliente: string
    ruc_cliente: string | null
    zona: string | null
    detalle: string | null
    concepto: ConceptoRecibo
    tipo_liquidacion: TipoLiquidacion
    numero_planilla: string | null
    moneda: MonedaRecibo
    total: number | string
    total_letras: string
    observacion: string | null
    ruta_pdf: string | null
    estado: EstadoRecibo
    motivo_anulacion: string | null
    fecha_anulacion: string | null
    id_usuario_web: number
    cod_vendedor: string | null
    nombre_vendedor: string | null
    whatsapp_estado: string | null
    whatsapp_detalle: string | null
    fecha_registro: string | null
    total_documentos?: number
    total_saldo?: number | string | null
    total_vouchers?: number
    tiene_firma_cliente?: number
    tiene_firma_vendedor?: number
    firma_cliente?: string | null
    firma_vendedor?: string | null
}

export interface NuevoRecibo {
    /** true = el usuario ya vio el aviso de documentos que están en otro recibo y confirmó. */
    confirmar_repetidos?: boolean
    fecha_emision: string
    ciudad: string
    cod_cliente: string
    nombre_cliente: string
    ruc_cliente: string | null
    zona: string | null
    detalle_texto: string | null
    concepto: ConceptoRecibo
    tipo_liquidacion: TipoLiquidacion
    numero_planilla: string | null
    moneda: MonedaRecibo
    total_letras: string
    observacion: string | null
    id_usuario_web: number
    cod_vendedor: string | null
    nombre_vendedor: string | null
    firma_cliente: string | null
    firma_vendedor: string | null
    detalle: {
        id_kardex_cliente: number | null
        tipo_documento: string | null
        abre_documento: string | null
        serie: string | null
        numero_doc: string | null
        documento_completo: string | null
        importe: number
        saldo_documento: number | null
        observaciones: string | null
    }[]
}

export interface FiltrosHistorial {
    busqueda?: string
    fecha_desde?: string
    fecha_hasta?: string
    estado?: EstadoRecibo | ''
}

export function simboloMoneda(moneda: MonedaRecibo | number | null | undefined): string {
    return Number(moneda) === 2 ? 'US$' : 'S/'
}

export function saldoDeLinea(
    saldoDocumento: number | string | null | undefined,
    importe: number | string | null | undefined,
): number | null {
    if (saldoDocumento === null || saldoDocumento === undefined || saldoDocumento === '') return null
    const debia = Number(saldoDocumento)
    const pagado = Number(importe) || 0
    if (!Number.isFinite(debia)) return null
    return Math.max(debia - pagado, 0)
}
