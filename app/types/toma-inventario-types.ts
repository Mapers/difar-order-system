// Toma de inventario (reportes Access "ListadoToma Inventarios" y "SALDO_itemsxlab").

export interface TomaCombo {
    valor: string
    codigo: string
    texto: string
}

export interface TomaCombos {
    laboratorios: TomaCombo[]
    almacenes: TomaCombo[]
}

/** Fila de sp_ws_toma_inventario_listado (catálogo para contar). */
export interface TomaListadoFila {
    IdLaboratorio: number
    CodigoLaboratorio: string
    Laboratorio: string
    IdSublinea: number
    CodigoSublinea: string
    Sublinea: string
    IdArticulo: number
    Codigo: string
    Producto: string
    Unidad: string
    /** Lotes con saldo hoy (todos los almacenes): referencia para el conteo. */
    Lotes: TomaLoteRef[]
}

export interface TomaListado {
    fechaLotes: string
    filas: TomaListadoFila[]
    totales: { articulos: number; laboratorios: number }
}

/** Fila de sp_ws_toma_inventario_lotes (saldo del sistema por lote). */
export interface TomaLoteFila {
    IdAlmacen: number
    Almacen: string | null
    IdLaboratorio: number
    CodigoLaboratorio: string
    Laboratorio: string
    Sublinea: string
    Codigo: string
    Producto: string
    Unidad: string
    Lote: string | null
    Vencimiento: string | null
    SaldoSistema: number
}

export interface TomaLotes {
    fechaCorte: string
    filas: TomaLoteFila[]
    totales: { lineas: number; articulos: number; unidades: number; negativos: number; vencidos: number }
}

/** Lote referencial de un artículo (badge junto al producto). */
export interface TomaLoteRef {
    lote: string | null
    vencimiento: string | null
    saldo?: number
}

// ─── Tomas del usuario (t_ws_toma_inventario_cabecera / _detalle) ────────────

export type TomaModo = 'LISTADO' | 'LOTE'
export type TomaEstado = 'BORRADOR' | 'CERRADA'

export interface TomaCabecera {
    IdToma: number
    Modo: TomaModo
    IdLaboratorio: number | null
    Laboratorio: string | null
    IdAlmacen: number | null
    Almacen: string | null
    FechaCorte: string
    Estado: TomaEstado
    Observacion: string | null
    Lineas: number
    Contadas: number
    Usuario?: string | null
    CreadoEn: string
    ActualizadoEn: string
    CerradoEn: string | null
}

export interface TomaLinea {
    IdLinea: number
    Orden: number
    IdAlmacen: number | null
    Almacen: string | null
    CodigoLaboratorio: string | null
    Laboratorio: string | null
    CodigoSublinea: string | null
    Sublinea: string | null
    Codigo: string
    Producto: string | null
    Unidad: string | null
    Lote: string | null
    Vencimiento: string | null
    Lotes: TomaLoteRef[]
    SaldoSistema: number | null
    Conteo: string | null
}

export interface TomaDetalle {
    cabecera: TomaCabecera
    lineas: TomaLinea[]
}

export interface TomaCrear {
    modo: TomaModo
    laboratorio?: string
    almacen?: string
    fecha?: string
    observacion?: string
}
