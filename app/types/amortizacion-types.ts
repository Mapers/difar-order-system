export interface Seller {
    idVendedor: number
    codigo: string
    nombres: string
    apellidos: string
}

export interface TipoAmortizacion {
    Cod_Tipo_Amort: string
    Descripcion: string
}

export interface EntidadFinanciera {
    CodigoEntidadFinanciera: string
    DescripcionEntidadFinanciera: string
}

export interface TipoDocumento {
    Cod_Tipo: string
    Descripcion: string
    Abreviatura: string
}

export interface FormState {
    Id_Amort_Clie: number | null
    NroPlanilla: string
    Cod_Clie: string
    TipoDoc: string
    SerieDoc: string
    NumeroDoc: string
    Fecha_Mvto: string
    Importe_Amortiz: string
    Tipo_Amort: string
    NroDocAmortiza: string
    Entida_Financiera: string
    Observaciones: string
    Cod_Vend: string
    Moneda: string
    Empresa: string
}

export const FORM_INITIAL: FormState = {
    Id_Amort_Clie: null,
    NroPlanilla: "",
    Cod_Clie: "",
    TipoDoc: "",
    SerieDoc: "",
    NumeroDoc: "",
    Fecha_Mvto: "",
    Importe_Amortiz: "",
    Tipo_Amort: "",
    NroDocAmortiza: "",
    Entida_Financiera: "",
    Observaciones: "",
    Cod_Vend: "",
    Moneda: "NSO",
    Empresa: "",
}

export interface AmortizacionListItem {
    Id_Amort_Clie: number
    NroPlanilla: string
    Cod_Clie: string
    NombreCliente: string
    TipoDoc: string
    DescTipoDoc: string
    SerieDoc: string
    NumeroDoc: string
    Importe_Amortiz: number
    DescTipoAmort: string
    Cod_Vend: string
    NombreVendedor: string
    ApellidoVendedor: string
    EMPRESA: string
    Fecha_Mvto: string
    Moneda: string
    Tipo_Amort: string
    NroDocAmortiza: string
    Entidad_Financiera: string
    DescripcionEntidadFinanciera: string
    Observaciones: string
}

export interface KardexItem {
    IdKardexClientes: number
    Cod_Clie: string
    Tipo_Doc: string
    DescTipoDoc: string
    SerieDoc: string
    NumeroDoc: number
    Fecha_Emision: string
    Fecha_Vcto: string
    Tipo_Moneda: string
    Provision: number
    Amortizacion: number
    Fecha_Amortizacion: string
    Tipo_Amortizacion: string
    EMPRESA: string
    ModuloTrabajo: string
    CodVend: string
    Id_Amort_Clie: number
    Observaciones: string
    Anio: string
    Mes: string
}

export interface MayorItem {
    IdLibroMayor: number
    Anio: string
    Mes: string
    CtaContable: string
    DescCuenta: string
    Concepto: string
    Cargo: number
    Abono: number
    CargoME: number
    AbonoME: number
    LibroContab: string
    Fecha: string
    EMPRESA: string
    TipoDoc: string
    SerieDoc: string
    NroDoc: number
    Nombre: string
    Observaciones: string
    Id_Amort_Clie: number
    TipoRegistro: number
    IdCtaContable: number
    moneda: string
}

export interface EmpresaOption {
    CodigoEmpresa:   string
    NombreRazSocial: string
}