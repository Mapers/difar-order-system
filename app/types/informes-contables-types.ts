/**
 * Informes Contables: Registros de Ventas/Compras, PLE y SIRE, Libro Diario, Libro Mayor,
 * Estados Financieros y Cuentas Contables (/api/contabilidad/informes).
 */

export type ClaveReporte =
    | 'ventas-soles' | 'ventas-dolares' | 'ventas-resumido-bv' | 'ventas-correlativos'
    | 'ventas-guias-facturadas' | 'ventas-por-anio'
    | 'compras-soles' | 'compras-usd' | 'compras-sire-pendientes' | 'compras-percepciones' | 'compras-por-anio'
    | 'ple-ventas-141' | 'ple-compras-081'
    | 'sire-ventas-anexo03' | 'sire-compras-anexo11' | 'sire-compras-anexo12' | 'sire-compras-anexo8'
    | 'proveedores-cta-cte' | 'proveedores-programa-pagos' | 'proveedores-detalle-anio'
    | 'plan-cuentas'
    | 'ple-diario-051' | 'ple-plan-053' | 'ple-mayor-061'
    | 'diario-general' | 'diario-mes' | 'diario-revision-asientos' | 'diario-simplificado'
    | 'mayor-anio' | 'mayor-mes' | 'mayor-resumen-anio' | 'mayor-resumen-principales' | 'mayor-revisa'
    | 'eeff-balance-general' | 'eeff-resultado-mes' | 'eeff-resultado-anual' | 'eeff-resultado-acumulado'
    | 'eeff-comprobacion' | 'eeff-comprobacion-sunat' | 'eeff-comprobacion-mes' | 'eeff-flujo-efectivo' | 'eeff-cambio-patrimonio'
    | 'cuentas-saldos' | 'cuentas-sumas-mayor'

export type ClaveArchivo = 'ple-141' | 'ple-081' | 'ple-082' | 'ple-051' | 'ple-053' | 'ple-061'
    | 'sire-03' | 'sire-11' | 'sire-12' | 'sire-8'

/** Filtro que pide un reporte: un mes, un año completo, un rango de fechas o una fecha de corte. */
export type TipoFiltro = 'mes' | 'anio' | 'rango' | 'fecha' | 'ninguno'

/**
 * Filtros adicionales de un reporte (además del periodo):
 *   proveedor / proveedor-obligatorio · documento (TT-SERIE-NUMERO) · tipo-doc (programa de pagos) · buscar · nivel (plan de cuentas)
 *   cuenta (prefijo de cuenta del Libro Mayor, opcional)
 */
export type FiltroExtra = 'proveedor' | 'proveedor-obligatorio' | 'documento' | 'tipo-doc' | 'buscar' | 'nivel' | 'cuenta'

export interface FiltroInforme {
    anio: string
    mes: string
    fechaDesde: string
    fechaHasta: string
    /** Fecha de corte (Saldos de cuentas). */
    fechaCorte?: string
    /** Prefijo de cuenta (Libro Mayor): '10', '1010101'... */
    cuenta?: string
    codProveedor?: string
    /** Solo para mostrar ("RUC Nombre"); no se envía. */
    nomProveedor?: string
    documento?: string
    tipoDoc?: string
    buscar?: string
    nivel?: string
}

/** Proveedor del buscador (sp_ws_regcompras_buscar_proveedores). */
export interface ProveedorBusqueda {
    Codigo: string
    RUC: string
    Nombre: string
    Proveedor: string
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
    /** Aviso ámbar visible sobre el informe (por ejemplo, un informe en revisión). */
    advertencia?: string
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
    /** Filtros adicionales al periodo (proveedor, documento, búsqueda...). */
    extras?: FiltroExtra[]
    /** Leyenda de moneda propia (si la automática no describe bien el reporte). */
    leyenda?: string
    /** Cortes del reporte, como los encabezados de grupo de Access (del más general al más fino). */
    grupos?: GrupoInforme[]
    /** Filas del pie después del TOTAL ("Vienen Mes Anterior", "Total Acumulado", diferencias...). */
    pie?: (filas: FilaInforme[], ctx: ContextoInforme) => FilaPie[]
    /** Sin fila TOTAL (estados financieros: sumar todas las filas no tiene sentido; el pie lleva los totales). */
    sinTotal?: boolean
    /** Indicadores propios (después de "Registros"); si no, los 3 últimos importes con total. */
    kpis?: (filas: FilaInforme[]) => { t: string; v: string }[]
    /** Cambia la forma de las filas antes de mostrarlas (Diario Simplificado: una fila por celda -> tabla pivote). */
    transformar?: (filas: FilaInforme[]) => { filas: FilaInforme[]; columnas: ColumnaInforme[] }
    /** Máximo de filas en pantalla (por defecto 500; el Excel lleva todas). */
    limite?: number
}

/** Periodo con que se hizo la consulta (para los textos del pie). */
export interface ContextoInforme {
    anio: string
    mes: string
    fechaCorte?: string
}

/** Valores por campo de una fila de subtotal o de pie (solo las columnas que llevan importe). */
export type ValoresFila = Record<string, number | null>

export interface GrupoInforme {
    /** Filas CONSECUTIVAS con la misma clave forman el grupo (el SP ya viene ordenado). */
    clave: (fila: FilaInforme) => string
    /** Texto del encabezado del grupo (se calcula con la primera fila). */
    titulo: (fila: FilaInforme) => string
    /** Encabezado con la suma de las columnas con total (como "Saldo de Cuentas Contables" de Access). */
    sumasEnEncabezado?: boolean
    /** Fila de subtotal al cerrar el grupo: true = "Total <titulo>" con las sumas; función = texto y valores propios. */
    subtotal?: boolean | ((filas: FilaInforme[]) => { texto: string; valores: ValoresFila })
}

export interface FilaPie {
    texto: string
    valores: ValoresFila
    /** Se pinta como total final (color principal). */
    destacada?: boolean
}

/** Renglón de la tabla: una fila del SP, el encabezado de un grupo o su subtotal. */
export type Renglon =
    | { tipo: 'fila'; fila: FilaInforme; indice: number }
    | { tipo: 'grupo'; nivel: number; texto: string; valores?: ValoresFila }
    | { tipo: 'subtotal'; nivel: number; texto: string; valores: ValoresFila }
