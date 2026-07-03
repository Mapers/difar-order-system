export interface AsientoLinea {
    id:               string   // uuid local para key de React, no correlativo de negocio
    tipDoc:           string   // "07" N.C., "01" Factura, "03" Boleta
    serie:            string
    numero:           string
    razonSocial:      string
    concepto:         string
    cargo:            number  // 0 si es abono
    abono:            number  // 0 si es cargo
    ctaContable:      string
    centroCostos:     string
    undCosto:         string
    tipoAmortizacion: string  // fijo: "APLICACIÓN DE NOTA DE CRÉDITO"
    fechaEmision:     string  // dd/mm/aaaa, de la N.C. de origen
    fechaVencimiento: string
}

export type MonedaAsiento = 'SOLES' | 'DOLARES'

export interface AsientoCabecera {
    fecha:        string
    moneda:       MonedaAsiento
    mesRegistro:  string  // Meses.Numero, como string (valor de Select)
    anioRegistro: string  // year.Año, como string (valor de Select)
    tipoAsiento:  string  // TipoRegistros del combo (REGISTROS / INICIAL / CIERRE)
    destino:      boolean
    glosa:        string
}

export interface DocumentoAplicable {
    tipDoc:           string
    tipo?:            'Factura' | 'Boleta'
    serie:            string
    numero:           string
    razonSocial:      string
    motivo:           string
    monto:            number
    ctaContable:      string
    fechaEmision:     string
    fechaVencimiento: string
}

export const AMO_ASIENTO_DEFAULT = "APLICACIÓN DE NOTA DE CRÉDITO"

export const CENTROS_COSTO = ["ADMINISTRACIÓN", "VENTAS", "LOGÍSTICA", "GERENCIA"]

// ─── Combos (respuesta cruda de los SP sp_ws_combo_*) ───

export interface ComboGlosaRow {
    Glosa: string
}

export interface ComboTipoAsientoRow {
    TipoRegistros:     string
    Id_Doc_Registros:  number
}

export interface ComboMesRow {
    Mes:    string
    Numero: number
}

export interface ComboAnioRow {
    Anio: number
}
