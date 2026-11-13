/** Informes Contables: Registros de Ventas/Compras, PLE y SIRE (/api/contabilidad/informes). */

export type ClaveReporte =
    | 'ventas-soles' | 'ventas-dolares' | 'ventas-resumido-bv' | 'ventas-correlativos'
    | 'ventas-guias-facturadas' | 'ventas-por-anio'
    | 'compras-soles' | 'compras-usd' | 'compras-sire-pendientes' | 'compras-percepciones' | 'compras-por-anio'
    | 'ple-ventas-141' | 'ple-compras-081'
    | 'sire-ventas-anexo03' | 'sire-compras-anexo11' | 'sire-compras-anexo12' | 'sire-compras-anexo8'

export type ClaveArchivo = 'ple-141' | 'ple-081' | 'ple-082' | 'sire-03' | 'sire-11' | 'sire-12' | 'sire-8'

/** Filtro que pide un reporte: un mes, un año completo o un rango de fechas. */
export type TipoFiltro = 'mes' | 'anio' | 'rango'

export interface FiltroInforme {
    anio: string
    mes: string
    fechaDesde: string
    fechaHasta: string
}

/** Fila genérica tal como la devuelve el SP (las columnas dependen del reporte). */
export type FilaInforme = Record<string, string | number | null>

export interface RespuestaReporte {
    clave: ClaveReporte
    titulo: string
    filas: FilaInforme[]
    total: number
}

export interface ArchivoSunat {
    nombre: string
    lineas: number
    indicador: number
    blob: Blob
}

/** Tipo de dato de una columna: decide formato, alineación y si se suma. */
export type TipoColumna = 'texto' | 'mono' | 'fecha' | 'monto' | 'entero' | 'tc' | 'si-no' | 'moneda'

export interface ColumnaInforme {
    campo: string
    titulo: string
    tipo: TipoColumna
    /** Se suma en el pie de la tabla, en los KPIs y en el Excel. */
    total?: boolean
    /** Rol de la columna en la tarjeta del celular. */
    movil?: 'titulo' | 'subtitulo' | 'importe'
    /** Pinta la celda en rojo cuando la condición se cumple (por ejemplo, huecos en el correlativo). */
    alerta?: (fila: FilaInforme) => boolean
    /** Valor calculado a partir de la fila (por ejemplo, "01 F001-13080"); si no, se usa fila[campo]. */
    valor?: (fila: FilaInforme) => string | number | null
    /** Símbolo de moneda de esta columna si difiere del reporte ('' = sin símbolo, columnas con monedas mezcladas). */
    moneda?: string
    /** Columnas que mezclan monedas: devuelve la moneda de la fila (NSO/USD/PEN) para poner su símbolo en cada importe. */
    monedaDe?: (fila: FilaInforme) => unknown
}

export interface DefinicionReporte {
    clave: ClaveReporte
    titulo: string
    descripcion: string
    access: string
    filtro: TipoFiltro
    columnas: ColumnaInforme[]
    /** Campo que identifica la fila (para seleccionar documentos en SIRE 12 y 8). */
    campoId?: string
    /** Texto si el periodo no tiene filas (por ejemplo, reportes que hoy no tienen datos). */
    vacio?: string
    /** Moneda de los importes del reporte: 'S/' (por defecto) o 'US$'. */
    moneda?: string
}
