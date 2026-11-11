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
}

export interface TomaListado {
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
