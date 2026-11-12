/** Fila de sp_ws_saldo_proveedores_documentos (un documento con saldo). */
export interface SaldoProvDocumento {
    CodigoEmpresa:   string
    NombreEmpresa:   string
    RucEmpresa:      string
    FechaCorte:      string
    CodProveedor:    string
    RucProveedor:    string
    NombreProveedor: string
    FechaEmision:    string | null
    FechaVcto:       string | null
    TipoDoc:         string
    Documento:       string
    Serie:           string
    Numero:          number | string
    Moneda:          string
    Provision:       number
    Amortizacion:    number
    Saldo:           number
    SaldoSoles:      number
    SaldoDolares:    number
    DiasVencido:     number | null
    /** Movimientos repetidos del documento (solo > 0 cuando se suman, igual que Access). */
    MovDuplicados:   number
}

/** Fila de sp_ws_saldo_proveedores_resumen (un proveedor con saldo). */
export interface SaldoProvResumen {
    CodProveedor:       string
    RucProveedor:       string
    NombreProveedor:    string
    Documentos:         number
    SaldoSoles:         number
    SaldoDolares:       number
    DocumentosVencidos: number
    VctoMasAntiguo:     string | null
    MovDuplicados:      number
}

/** Fila de sp_ws_saldo_proveedores_duplicados (auditoría). */
export interface SaldoProvDuplicado {
    IdDuplicado:       number
    IdOriginal:        number
    CodProveedor:      string
    NombreProveedor:   string
    ModuloTrabajo:     string
    Modulo:            string
    Documento:         string
    Serie:             string
    Numero:            number | string
    Provision:         number
    Amortizacion:      number
    FechaAmortizacion: string | null
    FechaEmision:      string | null
    UsuarioOriginal:   number | null
    UsuarioDuplicado:  number | null
    Observaciones:     string | null
}

/** Documentos agrupados por proveedor, como el reporte Access. */
export interface SaldoProvGrupo {
    codigo:     string
    ruc:        string
    nombre:     string
    documentos: SaldoProvDocumento[]
    soles:      number
    dolares:    number
}
