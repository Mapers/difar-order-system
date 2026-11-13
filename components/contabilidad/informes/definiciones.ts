import { ClaveArchivo, ClaveReporte, ColumnaInforme, DefinicionReporte, FilaInforme } from '@/app/types/informes-contables-types'
import { fmtFecha } from './formato'

/**
 * Registro de reportes del front (patrón Registry): columnas, filtro y textos de cada pestaña.
 * Las páginas no conocen columnas: piden aquí la definición por su clave.
 * Agregar un reporte = agregar una entrada (el backend ya lo expone por su catálogo).
 */

// ---- columnas reutilizables
const c = (campo: string, titulo: string, tipo: ColumnaInforme['tipo'] = 'texto', extra: Partial<ColumnaInforme> = {}): ColumnaInforme =>
    ({ campo, titulo, tipo, ...extra })
const monto = (campo: string, titulo: string, movil?: ColumnaInforme['movil']) => c(campo, titulo, 'monto', { total: true, movil })
/** Importe en la moneda original del documento (puede mezclar S/ y US$): cada fila lleva el símbolo de su moneda. */
const montoOriginal = (campo: string, titulo: string, movil?: ColumnaInforme['movil'], campoMoneda = 'Moneda') =>
    ({ ...monto(campo, titulo, movil), moneda: '', monedaDe: (f: FilaInforme) => f[campoMoneda] })

/** "01 F001-13080": tipo, serie y número en una sola columna (la tabla entra en pantalla). */
const comprobante = (tipo: string, serie: string, numero: string) =>
    c(`_${tipo}_${serie}_${numero}`, 'Comprobante', 'mono', {
        movil: 'titulo',
        valor: (f: FilaInforme) => `${f[tipo] ?? ''} ${f[serie] ?? ''}-${f[numero] ?? ''}`.trim(),
    })
/** Documento de referencia (notas de crédito): "17/11/2025 F002-634". */
const referencia = (fecha: string, serie: string, numero: string) =>
    c(`_ref_${numero}`, 'Doc. referencia', 'mono', {
        valor: (f: FilaInforme) => f[serie] ? `${fmtFecha(f[fecha])} ${f[serie]}-${f[numero] ?? ''}` : null,
    })

const DOC_VENTA = [c('Fecha', 'F. Emisión', 'fecha'), comprobante('Cod_Tipo', 'Serie', 'Numero')]
const DOC_COMPRA = [c('RegNro', 'Reg.', 'mono'), c('Fecha', 'F. Emisión', 'fecha'), comprobante('Cod_Tipo', 'SerieDoc', 'NumeroDoc')]
const COMPRA_SOLES = [...DOC_COMPRA, c('Nombre', 'Proveedor', 'texto', { movil: 'subtitulo' }), c('RUC', 'RUC', 'mono'), c('TipoCambio', 'T/C', 'tc'),
    monto('NoGravado', 'No Gravado'), monto('VVMN', 'B. Imponible'), monto('IGVMN', 'IGV'), monto('TOTALMN', 'Total', 'importe')]

/** Primeros campos de la línea PLE/SIRE que se muestran en la vista previa. */
const vistaLinea = (fecha: string, tipo: string, serie: string, numero: string, nombre: string, total: string): ColumnaInforme[] => [
    c(fecha, 'F. Emisión'), comprobante(tipo, serie, numero),
    c(nombre, 'Cliente / Proveedor', 'texto', { movil: 'subtitulo' }), c(total, 'Total', 'monto', { total: true, movil: 'importe' }),
]

const sireCompras = (clave: ClaveReporte, anexo: string, desc: string, conCar: boolean): DefinicionReporte => ({
    clave, titulo: `Compras Anexo ${anexo}`, filtro: 'mes', access: `Compras › SIREanexo${anexo}`, campoId: 'IdRegCompras',
    descripcion: desc,
    columnas: [c('Fecha', 'F. Emisión', 'fecha'), comprobante('TipoDoc', 'SerieDoc', 'NumeroDoc'), c('Nombre', 'Proveedor', 'texto', { movil: 'subtitulo' }), c('RUC', 'RUC', 'mono'),
        montoOriginal('ValorVta', 'B. Imponible', undefined, 'c26'), montoOriginal('IGV', 'IGV', undefined, 'c26'), montoOriginal('Total', 'Total', 'importe', 'c26'),
        ...(conCar ? [c('CARoriginal', 'CAR SIRE', 'mono')] : [])],
})

export const DEFINICIONES: Record<ClaveReporte, DefinicionReporte> = {
    // ---------------- Ventas
    'ventas-soles': {
        clave: 'ventas-soles', titulo: 'Soles', filtro: 'mes', access: 'Ventas › Soles',
        descripcion: 'Registro de ventas del mes en soles (los documentos en dólares se convierten con su tipo de cambio).',
        columnas: [c('Fecha', 'F. Emisión', 'fecha'), comprobante('Doc', 'Serie', 'NroDesde'), c('FVcto', 'F. Vcto', 'fecha'),
            c('Cliente', 'Cliente', 'texto', { movil: 'subtitulo' }), c('NroDI', 'RUC / DNI', 'mono'), c('TC', 'T/C', 'tc'),
            monto('NoGrabado', 'No Gravado'), monto('BImponible', 'B. Imponible'), monto('IGV', 'IGV'), monto('Total', 'Total', 'importe'),
            referencia('FechaDocOriginal', 'SerieDocOriginal', 'NumeroDocOriginal')],
    },
    'ventas-dolares': {
        clave: 'ventas-dolares', titulo: 'Dólares', filtro: 'mes', access: 'Ventas › Dolares',
        descripcion: 'Ventas emitidas en dólares, con importes en dólares y su tipo de cambio.',
        vacio: 'No hay ventas en dólares en este periodo (en la historia del registro de ventas no hay ninguna).', moneda: 'US$',
        columnas: [...DOC_VENTA, c('Nombre', 'Cliente', 'texto', { movil: 'subtitulo' }),
            c('RUC', 'RUC', 'mono'), c('TipoCambio', 'T/C', 'tc'), monto('ValorVta', 'Valor Venta'), monto('IGV', 'IGV'),
            monto('Exonerado', 'Exonerado'), monto('Inafecto', 'Inafecto'), monto('Total', 'Total', 'importe')],
    },
    'ventas-resumido-bv': {
        clave: 'ventas-resumido-bv', titulo: 'Resumido BV', filtro: 'mes', access: 'Ventas › Resumido BV',
        descripcion: 'Registro de ventas con las boletas resumidas en una línea por grupo (número desde–hasta).',
        columnas: [...DOC_VENTA, c('Nombre', 'Cliente', 'texto', { movil: 'subtitulo' }),
            c('RUC', 'RUC', 'mono'), c('TipoCambio', 'T/C', 'tc'), monto('NoGrabado', 'No Gravado'), monto('VVMN', 'B. Imponible'),
            monto('IGVMN', 'IGV'), monto('TOTALMN', 'Total', 'importe')],
    },
    'ventas-correlativos': {
        clave: 'ventas-correlativos', titulo: 'Correlativos', filtro: 'anio', access: 'Ventas › CorrComprobante',
        descripcion: 'Control de correlativos por mes, tipo y serie. "Revisa" distinto de 0 indica números faltantes o repetidos.',
        columnas: [c('mesVentas', 'Mes', 'mono'), c('TipoDoc', 'Doc', 'mono'), c('Serie', 'Serie', 'mono', { movil: 'titulo' }),
            c('nroMin', 'Nro. mínimo', 'entero'), c('nroMax', 'Nro. máximo', 'entero'), c('cantDoc', 'Cantidad', 'entero', { total: true }),
            c('revisa', 'Revisa', 'entero', { movil: 'importe', alerta: (f: FilaInforme) => Number(f.revisa) !== 0 })],
    },
    'ventas-guias-facturadas': {
        clave: 'ventas-guias-facturadas', titulo: 'Guías facturadas', filtro: 'rango', access: 'Ventas › GuiasFacturadas',
        descripcion: 'Guías de remisión y el comprobante con que se facturaron (une los datos de Access hasta abril 2026 y los de la web).',
        columnas: [c('FechaEmision', 'F. Emisión', 'fecha'), c('GuiaRemision', 'Guía', 'mono', { movil: 'titulo' }),
            c('Cliente', 'Cliente', 'texto', { movil: 'subtitulo' }), { ...comprobante('TipoDoc', 'Serie', 'Numero'), movil: undefined },
            c('Anulado', 'Estado'), c('Moneda', 'Mon.'), montoOriginal('Total', 'Total', 'importe'), c('Origen', 'Origen')],
    },
    'ventas-por-anio': {
        clave: 'ventas-por-anio', titulo: 'Ventas por año', filtro: 'anio', access: 'Ventas › Ventasporaño',
        descripcion: 'Todas las ventas del año, documento por documento, en moneda original y en soles.',
        // "Mes" no se muestra: la fecha de emisión ya indica el mes (así entra el Total S/ en pantalla)
        columnas: [c('Fecha', 'F. Emisión', 'fecha'), comprobante('TipoDoc', 'Serie', 'Numero'), c('RUC', 'RUC', 'mono'), c('Nombre', 'Cliente', 'texto', { movil: 'subtitulo' }),
            c('Moneda', 'Mon.', 'moneda'), c('Venta', 'T/C', 'tc'), montoOriginal('VVNA', 'No Gravado'), montoOriginal('VVA', 'B. Imponible'), montoOriginal('IGV', 'IGV'),
            montoOriginal('Total', 'Total doc.'), monto('TotalSoles', 'Total S/', 'importe')],
    },

    // ---------------- Compras
    'compras-soles': {
        clave: 'compras-soles', titulo: 'Soles', filtro: 'mes', access: 'Compras › SOLES',
        descripcion: 'Registro de compras del mes en soles (base e IGV en dólares se recalculan con la tasa de IGV del documento).',
        columnas: COMPRA_SOLES,
    },
    'compras-usd': {
        clave: 'compras-usd', titulo: 'USD', filtro: 'mes', access: 'Compras › USD',
        descripcion: 'Compras del mes en dólares, con importes en dólares.', moneda: 'US$',
        columnas: [...DOC_COMPRA, c('Nombre', 'Proveedor', 'texto', { movil: 'subtitulo' }), c('RUC', 'RUC', 'mono'), c('TipoCambio', 'T/C', 'tc'),
            monto('ValorNoAfecto', 'No Afecto'), monto('ValorVta', 'Valor Venta'), monto('IGV', 'IGV'), monto('Total', 'Total', 'importe')],
    },
    'compras-sire-pendientes': {
        clave: 'compras-sire-pendientes', titulo: 'SIRE pendientes', filtro: 'mes', access: 'Compras › SIREpend',
        descripcion: 'Compras con CAR SIRE que todavía no se marcaron como revisadas.',
        columnas: [...COMPRA_SOLES, c('carSIRE', 'CAR SIRE', 'mono')],
    },
    'compras-percepciones': {
        clave: 'compras-percepciones', titulo: 'Percepciones', filtro: 'mes', access: 'Compras › Percepciones',
        descripcion: 'Compras del mes con percepción del IGV.',
        vacio: 'No hay compras con percepción en este periodo (hoy ningún documento tiene percepción registrada).',
        columnas: [c('Fecha_Emision', 'F. Emisión', 'fecha'), comprobante('Tipo_Doc', 'SerieDoc', 'NumeroDoc'), c('RUC', 'RUC', 'mono'), c('Nombre', 'Proveedor', 'texto', { movil: 'subtitulo' }),
            monto('Percepcion', 'Percepción', 'importe')],
    },
    'compras-por-anio': {
        clave: 'compras-por-anio', titulo: 'Compras por año', filtro: 'anio', access: 'Compras › Compras-Año',
        descripcion: 'Compras del año con CAR SIRE y si ya se revisaron (una fila por documento).',
        columnas: [c('PeriodoTributario', 'Mes', 'mono'), c('Fecha_Emision', 'F. Emisión', 'fecha'), comprobante('Tipo_Doc', 'SerieDoc', 'NumeroDoc'), c('Cod_Prov', 'RUC', 'mono'),
            c('Nombre', 'Proveedor', 'texto', { movil: 'subtitulo' }), c('Moneda', 'Mon.', 'moneda'), montoOriginal('ImporteTotal', 'Importe', 'importe'),
            c('carSIRE', 'CAR SIRE', 'mono'), c('revisadoSIRE', 'Revisado', 'si-no'), c('ItemsDetalle', 'Ítems', 'entero')],
    },

    // ---------------- PLE y SIRE (vista previa de las líneas)
    'ple-ventas-141': {
        clave: 'ple-ventas-141', titulo: '14.1 Ventas', filtro: 'mes', access: 'PLE (ventas)',
        descripcion: 'Registro de Ventas e Ingresos electrónico (35 campos).',
        columnas: vistaLinea('c04', 'c06', 'c07', 'c08', 'c12', 'c25'),
    },
    'ple-compras-081': {
        clave: 'ple-compras-081', titulo: '8.1 Compras', filtro: 'mes', access: 'PLE (compras)',
        descripcion: 'Registro de Compras electrónico, domiciliados (42 campos).',
        columnas: vistaLinea('c04', 'c06', 'c07', 'c09', 'c13', 'c24'),
    },
    'sire-ventas-anexo03': {
        clave: 'sire-ventas-anexo03', titulo: 'Ventas Anexo 03', filtro: 'mes', access: 'Ventas › SIREanexo03',
        descripcion: 'Archivo de reemplazo de la propuesta RVIE, desde el registro de ventas (34 campos).',
        columnas: vistaLinea('c05', 'c07', 'c08', 'c09', 'c13', 'c26'),
    },
    'sire-compras-anexo11': sireCompras('sire-compras-anexo11', '11', 'Todas las compras del mes, importes en soles (37 campos).', false),
    'sire-compras-anexo12': sireCompras('sire-compras-anexo12', '12', 'Solo los documentos que elijas, en moneda original y con su CAR SIRE.', true),
    'sire-compras-anexo8': sireCompras('sire-compras-anexo8', '8', 'Solo los documentos que elijas, en moneda original.', false),
}

/** Pestañas de cada página (en el orden del menú de Access). */
export const PESTANAS_VENTAS: ClaveReporte[] = ['ventas-soles', 'ventas-dolares', 'ventas-resumido-bv', 'ventas-correlativos', 'ventas-guias-facturadas', 'ventas-por-anio']
export const PESTANAS_COMPRAS: ClaveReporte[] = ['compras-soles', 'compras-usd', 'compras-percepciones', 'compras-sire-pendientes', 'compras-por-anio']

/** Archivos TXT: de qué reporte salen y si el usuario elige los documentos. */
export interface DefinicionArchivo {
    clave: ClaveArchivo
    titulo: string
    descripcion: string
    reporte: ClaveReporte | null
    seleccionable?: boolean
}

export const ARCHIVOS_PLE: DefinicionArchivo[] = [
    { clave: 'ple-141', titulo: '14.1 Registro de Ventas', descripcion: 'Ventas e ingresos del mes', reporte: 'ple-ventas-141' },
    { clave: 'ple-081', titulo: '8.1 Registro de Compras', descripcion: 'Compras de domiciliados del mes', reporte: 'ple-compras-081' },
    { clave: 'ple-082', titulo: '8.2 No Domiciliados', descripcion: 'Sin operaciones: se genera vacío (indicador 0)', reporte: null },
]

export const ARCHIVOS_SIRE: DefinicionArchivo[] = [
    { clave: 'sire-03', titulo: 'Ventas Anexo 03', descripcion: 'Reemplazo de la propuesta RVIE', reporte: 'sire-ventas-anexo03' },
    { clave: 'sire-11', titulo: 'Compras Anexo 11', descripcion: 'Todas las compras del mes', reporte: 'sire-compras-anexo11' },
    { clave: 'sire-12', titulo: 'Compras Anexo 12', descripcion: 'Documentos elegidos, con CAR', reporte: 'sire-compras-anexo12', seleccionable: true },
    { clave: 'sire-8', titulo: 'Compras Anexo 8', descripcion: 'Documentos elegidos', reporte: 'sire-compras-anexo8', seleccionable: true },
]
