export interface AsientoLinea {
    id:               string   // uuid local para key de React, no correlativo de negocio
    tipDoc:           string   // "07" N.C., "01" Factura, "03" Boleta
    serie:            string
    numero:           string
    codCliente:       string   // RUC — es lo que se graba en `diario centralizacion.Nombre`
    razonSocial:      string   // solo para mostrar; no se persiste
    cargo:            number  // 0 si es abono
    abono:            number  // 0 si es cargo
    ctaContable:      number | null  // IdCtaContable, resuelto desde el cliente
    codContable:      string   // Cod_Contab, solo para mostrar
    centroCostos:     string   // Cod_CC de mcentrocostos
    undCosto:         string   // solo UI, no tiene columna destino
    fechaEmision:     string   // aaaa-mm-dd, del documento de origen
    fechaVencimiento: string
}

export type MonedaAsiento = 'SOLES' | 'DOLARES'

export interface AsientoCabecera {
    fecha:        string
    moneda:       MonedaAsiento
    mesRegistro:  string  // Meses.Numero con cero a la izquierda ("07")
    anioRegistro: string  // year.year, como string (valor de Select)
    tipoAsiento:  string  // doc_registros.Id_Doc_Registros, como string (valor de Select)
    destino:      boolean
    glosa:        string
}

export interface DocumentoAplicable {
    tipDoc:           string
    tipo?:            'Factura' | 'Boleta'
    serie:            string
    numero:           string
    codCliente:       string
    razonSocial:      string
    motivo:           string
    monto:            number
    idCtaContable:    number | null
    codVend:          string
    fechaEmision:     string
    fechaVencimiento: string
}

// El asiento siempre se graba con este tipo de amortización — el SP lo fija
// en '999' ("Aplicacion nota de credito"). Aquí solo se muestra.
export const AMO_ASIENTO_LABEL = "APLICACIÓN DE NOTA DE CRÉDITO"

// `diario encabezado.Glosa Registro` es varchar(50) y
// `diario centralizacion.Concepto` es varchar(30): el SP trunca la glosa
// a 30 al copiarla al concepto de cada línea.
export const GLOSA_MAX     = 50
export const CONCEPTO_MAX  = 30

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
    Numero: string
}

export interface ComboAnioRow {
    Anio: number
}

export interface ComboCentroCostosRow {
    CodCentroCostos: string
    Descripcion:     string
    Abreviado:       string
}
