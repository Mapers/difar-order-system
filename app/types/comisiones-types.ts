// Tipos del módulo de comisiones (backend: /api/comisiones, SP sp_ws_comision_*).

export interface Periodo { anio: string; mes: string }

export interface ComboItem { valor: string; texto: string; tasa?: number }

// ── Ventas ─────────────────────────────────────────────────────────────────
export interface ComisionVentaFila {
    Anio: string
    Mes: string
    NombreMes: string
    Codigo_Vend: string
    Vendedor: string
    VentasTotal: number
    VentasRepLab: number
    VentasNetas: number
    TasaComision: number
    TasaPorcentaje: number
    Comision: number
    CostoSalidas: number
    Utilidad: number
    NombreRazSocial?: string
    RUC?: string
}

export interface ComisionVentaResumen {
    periodo: Periodo
    filas: ComisionVentaFila[]
    totales: { vendedores: number; ventasTotal: number; ventasRepLab: number; ventasNetas: number; comision: number }
}

export interface ComisionVentaDetalleFila {
    Fecha_Mvto: string
    Codigo_Doc: string
    TipoDocumento: string
    Serie_Doc: string
    Nro_Doc: string
    Codigo_Op: string
    Operacion: string
    CodigoCliente: string
    Cliente: string
    VentasTotal: number
    VentasRepLab: number
    VentasNetas: number
    Items: number
}

export interface ComisionVentaDetalle {
    periodo: Periodo
    vendedor: string
    filas: ComisionVentaDetalleFila[]
    totales: { comprobantes: number; ventasTotal: number; ventasRepLab: number; ventasNetas: number }
}

// ── Cobranza ───────────────────────────────────────────────────────────────
export interface ComisionCobranzaFila {
    Codigo_Vend: string
    Vendedor: string
    TasaVendedor: number
    Cobros: number
    Cobranza: number
    CobranzaValorVenta: number
    CobranzaTramo1: number
    CobranzaTramo2: number
    CobranzaTramo3: number
    CobranzaOtrosTramos: number
    CobranzaFueraDePlazo: number
    CobranzaSinComision: number
    PromedioDiasVencido: number
    Comision: number
}

export interface ComisionCobranzaResumen {
    periodo: Periodo
    soloPropio: boolean
    filas: ComisionCobranzaFila[]
    totales: {
        vendedores: number; cobros: number; cobranza: number
        cobranzaTramo1: number; cobranzaTramo2: number; cobranzaTramo3: number
        cobranzaFueraDePlazo: number; comision: number
    }
}

export interface ComisionCobranzaDetalleFila {
    Codigo_Vend: string
    Vendedor: string
    TasaVendedor: number
    Tipo_Doc: string
    SerieDoc: string
    NumeroDoc: string
    CodigoCliente: string
    Cliente: string
    Fecha_Emision: string
    Fecha_Vcto: string
    PlazoCondicion: number
    Fecha_Amortizacion: string
    DiasVencido: number
    Tipo_Moneda: string
    SimboloMoneda: string
    TipoAmortizacion: string
    NroPlanilla: string | null
    Amortizacion: number
    TasaIGV: number | null
    ImporteVV: number
    Tramo: number
    TasaComision: number
    TasaPorcentaje: number
    Comision: number
}

export interface ComisionCobranzaDetalle {
    periodo: Periodo
    vendedor: string
    filas: ComisionCobranzaDetalleFila[]
    totales: { cobros: number; cobranza: number; valorVenta: number; comision: number; porTramo: Record<string, number> }
}

export interface EscalaTramo { tramo: number; desde: number | null; hasta: number; porcentaje: number }

export interface EscalaCobranza {
    id: number
    fec_inicio: string
    fec_final: string | null
    usa_web: boolean
    vigente: boolean
    tramos: EscalaTramo[]
}

export const MESES: { valor: string; nombre: string }[] = [
    { valor: '01', nombre: 'Enero' }, { valor: '02', nombre: 'Febrero' }, { valor: '03', nombre: 'Marzo' },
    { valor: '04', nombre: 'Abril' }, { valor: '05', nombre: 'Mayo' }, { valor: '06', nombre: 'Junio' },
    { valor: '07', nombre: 'Julio' }, { valor: '08', nombre: 'Agosto' }, { valor: '09', nombre: 'Setiembre' },
    { valor: '10', nombre: 'Octubre' }, { valor: '11', nombre: 'Noviembre' }, { valor: '12', nombre: 'Diciembre' },
]

export const nombreMes = (mes: string) => MESES.find(m => m.valor === mes)?.nombre ?? mes


// ── Global por laboratorio (laboratorio → productos → cajas) ─────────────────
export interface LabProducto {
    codigo: string
    producto: string
    unidad: string | null
    cantidad: number
    ventasTotal: number
    ventasNetas: number
    comprobantes: number
    /** Comisión con la regla vigente (ventas netas × tasa del vendedor, hoy 2 %). */
    comision: number
    /** Incentivo en soles por caja; si existe, reemplaza a la comisión por tasa (null = sin incentivo). */
    tarifaCaja: number | null
}

export interface LabGrupo {
    idLaboratorio: number
    laboratorio: string
    productos: LabProducto[]
}

export interface ComisionLaboratorios {
    periodo: Periodo
    filtros: { vendedor: string | null; producto: string | null; cliente: string | null }
    laboratorios: LabGrupo[]
    /** Referencia contra el Libro de Ventas: facturas/boletas − notas de crédito. */
    referencia: { ventas: number; notasCredito: number }
}
