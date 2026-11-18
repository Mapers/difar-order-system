import apiClient from '@/app/api/client'

/**
 * Validación de la propuesta SIRE de ventas (Excel de SUNAT) contra el Registro de Ventas de la web.
 * Backend: /api/contabilidad/sire-ventas/validar (sesión + permiso del menú Actualiza Ventas APP).
 */
export type NivelSire = 'ok' | 'info' | 'aviso'

export interface FilaSire {
    tipo: string | number; serie: string; numero: number; fecha?: string | null; ruc?: string | null; cliente?: string | null
    bi: number; dscto_bi: number; igv: number; dscto_igv: number; exonerado: number; inafecto: number; otros: number; total: number
    estado?: number | null; tipo_ref?: string | number | null; serie_ref?: string | null; num_ref?: string | number | null
}

export interface MontosSire { base: number; igv: number; exonerado: number; inafecto: number; total: number; otros?: number; estado?: number | null; origen?: string }

export interface DocumentoSire {
    clave: string; tipo: string; serie: string; numero: number; fecha: string | null; ruc: string | null; cliente: string | null; docRef: string | null
    categoria: string; nivel: NivelSire; titulo: string; causa: string; accion: string
    sunat: MontosSire | null; registro: MontosSire | null
    web: { estadoSunat: string; anulado: boolean; tieneHash: boolean; enviado: { base: number; igv: number; total: number }; flete: number; igvFlete: number; gratuito: number } | null
    dif: { base: number; igv: number; total: number }
    explicacionIA?: string; accionIA?: string
}

export interface ResultadoSire {
    periodo: string; anio: number; mes: number
    resumen: {
        sunat: { documentos: number; base: number; igv: number; exonerado: number; inafecto: number; otros: number; total: number }
        registro: { documentos: number; base: number; igv: number; exonerado: number; inafecto: number; total: number }
        diferencia: { base: number; igv: number; total: number }
        conteo: Record<string, number>
        cuadra: boolean
    }
    documentos: DocumentoSire[]
    ia: { resumen: string; cuadra: boolean } | null
    iaError: string | null
}

/** Encabezados del Excel SIRE de SUNAT (RVIE) que se leen. */
const COLUMNAS: Record<keyof FilaSire | 'periodo', string> = {
    periodo: 'Periodo', tipo: 'Tipo CP/Doc.', serie: 'Serie del CDP', numero: 'Nro CP o Doc. Nro Inicial (Rango)', fecha: 'Fecha de emisión',
    ruc: 'Nro Doc Identidad', cliente: 'Apellidos Nombres/ Razón Social', bi: 'BI Gravada', dscto_bi: 'Dscto BI', igv: 'IGV / IPM',
    dscto_igv: 'Dscto IGV / IPM', exonerado: 'Mto Exonerado', inafecto: 'Mto Inafecto', otros: 'Otros Tributos', total: 'Total CP',
    estado: 'Est. Comp', tipo_ref: 'Tipo CP Modificado', serie_ref: 'Serie CP Modificado', num_ref: 'Nro CP Modificado',
}
const OBLIGATORIAS: (keyof typeof COLUMNAS)[] = ['periodo', 'tipo', 'serie', 'numero', 'bi', 'igv', 'total']

/** Lee el Excel de la propuesta SIRE en el navegador y devuelve el periodo y las filas que necesita el backend. */
export async function leerExcelSire(archivo: File): Promise<{ periodo: string; filas: FilaSire[]; hoja: string }> {
    const XLSX = await import('xlsx')
    const libro = XLSX.read(await archivo.arrayBuffer(), { type: 'array', cellDates: true })
    const norm = (s: unknown) => String(s ?? '').trim().toLowerCase()
    for (const hoja of libro.SheetNames) {
        const filas = XLSX.utils.sheet_to_json<any[]>(libro.Sheets[hoja], { header: 1, raw: true, defval: null })
        const iEnc = filas.findIndex(f => f.some(c => norm(c) === norm(COLUMNAS.serie)))
        if (iEnc < 0) continue
        const enc = filas[iEnc].map(norm)
        const ix = Object.fromEntries(Object.entries(COLUMNAS).map(([k, n]) => [k, enc.indexOf(norm(n))])) as Record<string, number>
        const faltan = OBLIGATORIAS.filter(k => ix[k] < 0)
        if (faltan.length) throw new Error(`Al archivo le faltan columnas de SUNAT: ${faltan.map(k => COLUMNAS[k]).join(', ')}.`)
        const datos = filas.slice(iEnc + 1).filter(f => f[ix.serie])
        if (!datos.length) throw new Error('La hoja de SUNAT no tiene comprobantes.')
        const periodos = Array.from(new Set(datos.map(f => String(f[ix.periodo] ?? '').trim()).filter(Boolean)))
        if (periodos.length !== 1 || !/^\d{6}$/.test(periodos[0])) throw new Error(`El archivo debe ser de un solo periodo (encontré: ${periodos.join(', ') || 'ninguno'}).`)
        const n = (v: unknown) => (v === null || v === undefined || v === '' ? 0 : Number(v) || 0)
        const fecha = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : v ? String(v) : null)
        return {
            periodo: periodos[0], hoja,
            filas: datos.map(f => ({
                tipo: f[ix.tipo], serie: String(f[ix.serie]).trim(), numero: Number(f[ix.numero]), fecha: fecha(f[ix.fecha]),
                ruc: ix.ruc >= 0 && f[ix.ruc] != null ? String(f[ix.ruc]) : null, cliente: ix.cliente >= 0 ? f[ix.cliente] : null,
                bi: n(f[ix.bi]), dscto_bi: ix.dscto_bi >= 0 ? n(f[ix.dscto_bi]) : 0, igv: n(f[ix.igv]), dscto_igv: ix.dscto_igv >= 0 ? n(f[ix.dscto_igv]) : 0,
                exonerado: ix.exonerado >= 0 ? n(f[ix.exonerado]) : 0, inafecto: ix.inafecto >= 0 ? n(f[ix.inafecto]) : 0,
                otros: ix.otros >= 0 ? n(f[ix.otros]) : 0, total: n(f[ix.total]),
                estado: ix.estado >= 0 && f[ix.estado] != null ? Number(f[ix.estado]) : null,
                tipo_ref: ix.tipo_ref >= 0 ? f[ix.tipo_ref] : null, serie_ref: ix.serie_ref >= 0 ? f[ix.serie_ref] : null, num_ref: ix.num_ref >= 0 ? f[ix.num_ref] : null,
            })),
        }
    }
    throw new Error('No encontré la hoja de la propuesta SIRE (columna "Serie del CDP"). ¿Es el Excel que descarga SUNAT?')
}

export const SireVentasService = {
    async validar(periodo: string, filas: FilaSire[], conIA = true): Promise<ResultadoSire> {
        const { data } = await apiClient.post('/contabilidad/sire-ventas/validar', { periodo, filas, conIA }, { timeout: 180000 })
        return data.data
    },
}
