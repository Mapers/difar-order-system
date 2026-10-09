export interface SubcuentaContable {
    Cod_Contab:  string
    Descricpion: string
}

export interface SubctaMvtoCabecera {
    Empresa:           string
    Ruc:               string
    Cuenta:            string
    CuentaDescripcion: string
    SubCuenta:         string
    Periodo:           string
    Moneda:            string
    SaldoInicial:      number
    TotalIngreso:      number
    TotalSalida:       number
    SaldoFinal:        number
}

export interface SubctaMvtoDetalle {
    IdLibroMayor: number
    Fecha:        string
    LibroContab:  string
    Libro:        string
    Documento:    string
    ClieProv:     string
    Concepto:     string
    Ingreso:      number
    Salida:       number
    Item:         number
}

export interface SubctaMvtoReporte {
    cabecera: SubctaMvtoCabecera | null
    detalle:  SubctaMvtoDetalle[]
}

export interface SubctaMvtoParams {
    cuenta: string
    anio:   string
    mes:    string
    moneda: 'NSO' | 'USD'
}

export const MESES_CONTABLES: { valor: string; nombre: string }[] = [
    { valor: '',   nombre: 'Todo el ejercicio' },
    { valor: '01', nombre: 'Enero' },
    { valor: '02', nombre: 'Febrero' },
    { valor: '03', nombre: 'Marzo' },
    { valor: '04', nombre: 'Abril' },
    { valor: '05', nombre: 'Mayo' },
    { valor: '06', nombre: 'Junio' },
    { valor: '07', nombre: 'Julio' },
    { valor: '08', nombre: 'Agosto' },
    { valor: '09', nombre: 'Setiembre' },
    { valor: '10', nombre: 'Octubre' },
    { valor: '11', nombre: 'Noviembre' },
    { valor: '12', nombre: 'Diciembre' },
]


// ─── Libro Caja y Bancos ──────────────────────────────────────────────────────

export interface CajaControl {
    IdCaja:       number
    Descripcion:  string
    MonedaCaja:   string
    CuentaContab: string
}

export interface TipoDocContable  { Cod_Tipo: string; Abreviatura: string; Descripcion: string }
export interface TipoPagoContable { Cod_Tipo_Amort: string; Descripcion: string; Abreviatura: string }
export interface CentroCosto      { Cod_CC: string; Descripcion: string; Abreviado: string }
export interface UnidadCosto      { IdGalpon: number; Descripcion: string }
export interface ConceptoCaja     { idcajaconceptos: number; caja_conceptos: string }
export interface CuentaContable   { IdCtaContable: number; Cod_Contab: string; Descricpion: string }
export interface MesContable      { Numero: string; Mes: string }

export interface CajaCatalogos {
    cajas:         CajaControl[]
    meses:         MesContable[]
    anios:         { Anio: string }[]
    tiposDoc:      TipoDocContable[]
    tiposPago:     TipoPagoContable[]
    centrosCosto:  CentroCosto[]
    unidadesCosto: UnidadCosto[]
    conceptosCaja: ConceptoCaja[]
    cuentas:       CuentaContable[]
    fechaCierre:   string | null
}

export interface PersonaEmpresa {
    Codigo: string
    Nombre: string
    Relacion?: string | null
    RelacionDescripcion?: string | null
}

export interface CajaVoucherCabecera {
    Item:              number
    Fecha:             string
    Numero:            string
    Mes_Registro:      string
    MesNombre:         string
    Year_Registro:     string
    CajaCtrl:          number
    CajaDescripcion:   string
    MonedaCaja:        string
    CuentaContab:      string
    EMPRESA:           string
    Libro_Contable:    string
    Cerrado:           number
}

export interface CajaDetalleFila {
    Id_Detalle_Caja:   number
    Item:              number
    TipoDoc:           string | null
    Serie:             string | null
    Numero_Doc:        number | null
    Persona:           string | null
    PersonaNombre:     string | null
    Concepto:          string | null
    Ingreso:           number
    Egreso:            number
    TipoPago:          string | null
    Cta_Contable:      number | null
    CuentaCodigo:      string | null
    CuentaDescripcion: string | null
    Centro_Costos:     string | null
    idGalpon:          number | null
    idcajaconceptos:   number | null
    EliminaCja:        number
}

export interface CajaDetallePayload {
    id:            number | null
    tipoDoc:       string | null
    serie:         string | null
    numeroDoc:     number | null
    persona:       string | null
    concepto:      string | null
    ingreso:       number
    egreso:        number
    tipoPago:      string | null
    ctaContable:   number | null
    centroCostos:  string | null
    idGalpon:      number | null
    idConcepto:    number | null
    eliminar:      boolean
}

export interface CajaVoucher {
    cabecera: CajaVoucherCabecera | null
    detalle:  CajaDetalleFila[]
}

export interface CajaVoucherResumen {
    Item:            number
    Fecha:           string
    Numero:          string
    Mes_Registro:    string
    Year_Registro:   string
    CajaCtrl:        number
    CajaDescripcion: string
    Lineas:          number
    TotalIngresos:   number
    TotalEgresos:    number
}

export const TIPO_PAGO_DEFECTO = '009'


// ─── Registro Compras Inventarios ─────────────────────────────────────────────

export interface ComprasCatalogos {
    tiposDoc:            { Cod_Tipo: string; Abreviatura: string; Descripcion: string }[]
    monedas:             { Abreviatura: string; Descripcion: string }[]
    meses:               MesContable[]
    anios:               { Anio: string }[]
    tasasIgv:            { Tasa: number }[]
    condiciones:         { CodigoCondicion: string; Descripcion: string; DiasCdto: number }[]
    almacenes:           { IdAlmacen: number; Descripcion: string }[]
    tiposPago:           { Cod_Tipo_Amort: string; Descripcion: string }[]
    centrosCosto:        { idCentroCostos: number; Cod_CC: string; Descripcion: string }[]
    clasificacionBienes: { idClasificacionBienes: number; DescripcionBienes: string }[]
    usuarios:            { IdUsuarios: number; NombreUsuarios: string }[]
    cuentas:             CuentaContable[]
    unidadesCosto:       UnidadCosto[]
    fechaCierre:         string | null
}

export interface ProveedorCompras {
    Codigo: string
    RUC?: string | null
    Nombre: string
}

export interface ArticuloCompras {
    IdArticulo: number
    Codigo_Art: string
    NombreItem: string
    Kardex?: number | null
}

export interface ComprasCabecera {
    Clave:                 number
    Cod_Prov:              string
    ProveedorNombre:       string | null
    ProveedorRuc:          string | null
    Tipo_Doc:              string
    SerieDoc:              string
    NumeroDoc:             number
    Fecha_Emision:         string
    Moneda:                string
    ImporteTotal:          number
    TasaIGV:               number
    PeriodoTributario:     string
    Anio:                  string
    Condision:             string
    Almacen:               number
    Exonerado:             number
    Inafecto:              number
    icbper:                number
    TipoDocOriginal:       string | null
    FechaDocOriginal:      string | null
    SerieDocOriginal:      string | null
    NumeroDocOriginal:     number | null
    NroDpstoDetra:         string | null
    FechaDetra:            string | null
    FechaCancelacion:      string | null
    TipoPago:              string | null
    CentroCostos:          number | null
    ObsCancelacion:        string | null
    Observaciones:         string | null
    EntregadoPor:          string | null
    Responsable:           string | null
    idClasificacionBienes: number | null
    fecIngreso:            string | null
    serieOC:               string | null
    nrOC:                  string | null
    NroRegistro:           number | null
    LibroContable:         string | null
    Empresa:               string
    revisadoSIRE:          number
    carSIRE:               string | null
    Cerrado:               number
    VecesRegistrado:       number
}

export interface ComprasDetalleFila {
    Id_Compras_Detalle: number
    Clave:              number
    idArticulo:         number | null
    Articulo:           string | null
    NombreItem:         string | null
    Cantidad:           number
    Lote:               string | null
    VctoArt:            string | null
    ImporteAfecto:      number
    ImporteNoAfecto:    number
    CuentaContab:       number | null
    CuentaCodigo:       string | null
    CuentaDescripcion:  string | null
    CentroCostos:       string | null
    idGalpon:           number | null
    EliminaRC:          number
}

export interface ComprasTotales {
    TIncIGV:      number
    TSinIGV:      number
    Diferencia:   number
    DifNoAfectos: number
    Error:        string
    CalculoIGV:   number
}

export interface ComprasDocumento {
    cabecera: ComprasCabecera | null
    detalle:  ComprasDetalleFila[]
    totales:  ComprasTotales | null
}

export interface ComprasResumen {
    Clave:           number
    Cod_Prov:        string
    ProveedorNombre: string | null
    Tipo_Doc:        string
    SerieDoc:        string
    NumeroDoc:       number
    Fecha_Emision:   string
    Moneda:          string
    ImporteTotal:    number
    NroRegistro:     number | null
}

export interface ComprasCabeceraPayload {
    codProv:               string
    tipoDoc:               string
    serie:                 string
    numero:                number | null
    fechaEmision:          string
    moneda:                string
    importeTotal:          number
    tasaIGV:               number
    condicion:             string
    almacen:               number | null
    periodo:               string
    anio:                  string
    exonerado:             number
    inafecto:              number
    icbper:                number
    tipoDocOriginal:       string | null
    fechaDocOriginal:      string | null
    serieDocOriginal:      string | null
    numeroDocOriginal:     number | null
    nroDepositoDetra:      string | null
    fechaDetra:            string | null
    fechaCancelacion:      string | null
    tipoPago:              string | null
    centroCostos:          number | null
    obsCancelacion:        string | null
    observaciones:         string | null
    entregadoPor:          string | null
    responsable:           string | null
    idClasificacionBienes: number | null
    fecIngreso:            string | null
    serieOC:               string | null
    nrOC:                  string | null
    revisadoSIRE:          boolean
}

export interface ComprasDetallePayload {
    id:              number | null
    idArticulo:      number | null
    articulo:        string | null
    cantidad:        number
    lote:            string | null
    vctoArt:         string | null
    importeAfecto:   number
    importeNoAfecto: number
    cuentaContab:    number | null
    centroCostos:    string | null
    idGalpon:        number | null
    eliminar:        boolean
}

export const CONDICION_CONTADO = '01'
