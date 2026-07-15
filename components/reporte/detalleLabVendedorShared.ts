/**
 * Tipos y formateo compartidos por las tres vistas del detalle de
 * "Ventas por Vendedor": la tabla del modal, el PDF y el Excel.
 *
 * Viven acá para que las tres muestren el comprobante y la fecha
 * igual. Si el formato se duplica, terminan divergiendo.
 */

export interface DetalleItem {
    Codigo_Art:    string
    Cantidad_Sal:  number
    AbrevUnidMed:  string
    NombreItem:    string
    SumaDeVta_Tot: number
    Codigo_Doc?:   string | number | null
    Serie_Doc?:    string | number | null
    /** El kardex lo devuelve como número (540, 12546), no como string. */
    Nro_Doc?:      string | number | null
    FechaEmision?: string | Date | null
}

/** El SP mezcla tipos: Serie_Doc llega string y Nro_Doc número. */
const txt = (v: string | number | null | undefined): string =>
    (v === null || v === undefined) ? '' : String(v).trim()

/** Códigos SUNAT de tipo de comprobante que devuelve el kardex. */
const TIPOS_DOC: Record<string, string> = {
    '01': 'FAC',
    '03': 'BOL',
    '09': 'G.R.',
}

export const tipoDocLabel = (codigo?: string | number | null): string => {
    const c = txt(codigo)
    return c ? (TIPOS_DOC[c] ?? c) : ''
}

/**
 * Documento como "F001-12546" o "T001-540". Devuelve '—' si el kardex
 * no trae serie ni número, que puede pasar en movimientos sin comprobante.
 */
export const formatDocumento = (item: DetalleItem): string => {
    const serie = txt(item.Serie_Doc)
    const nro   = txt(item.Nro_Doc)
    if (!serie && !nro) return '—'
    if (!serie || !nro) return serie || nro
    return `${serie}-${nro}`
}

/** Documento con su tipo delante: "FAC 0001-00012345". */
export const formatDocumentoConTipo = (item: DetalleItem): string => {
    const doc = formatDocumento(item)
    if (doc === '—') return doc
    const tipo = tipoDocLabel(item.Codigo_Doc)
    return tipo ? `${tipo} ${doc}` : doc
}

/**
 * Fecha de emisión como dd/MM/yyyy.
 * Sale de k.Fecha_Mvto, que es la misma fecha con la que el reporte
 * decide a qué mes pertenece la venta.
 *
 * Se lee en UTC a propósito: el SP manda un DATE sin hora ("2026-07-01").
 * Con getDate() local, en Perú (UTC-5) eso se corre al 30/06.
 */
export const formatFechaEmision = (item: DetalleItem): string => {
    if (!item.FechaEmision) return '—'
    const d = item.FechaEmision instanceof Date
        ? item.FechaEmision
        : new Date(item.FechaEmision)
    if (isNaN(d.getTime())) return '—'
    const dd   = String(d.getUTCDate()).padStart(2, '0')
    const mm   = String(d.getUTCMonth() + 1).padStart(2, '0')
    const yyyy = d.getUTCFullYear()
    return `${dd}/${mm}/${yyyy}`
}
