export interface Catalogo {
    codigo: string
    descripcion: string
}

export interface TipoComprobante {
    codigo:      string
    descripcion: string
}

export interface CatalogosBanco {
    CodigoEntidadFinanciera:   string
    DescripcionEntidadFinanciera: string
}

export interface ZonaOption {
    IdZona:    string
    NombreZona: string
}

export type EstadoPlanilla = 'borrador' | 'enviado' | 'validado' | 'rechazado'

export interface PlanillaCabecera {
    id_planilla:      number
    correlativo:      number
    numero_planilla:  string
    id_vendedor:      number
    codigo_vendedor:  string
    nombre_vendedor:  string
    ciudad:           string
    fecha_ruta:       string
    zona:             string
    estado:           EstadoPlanilla
    observacion_admin?: string | null
    id_admin_revisor?:  number | null
    fecha_revision?:    string | null
    fecha_envio?:       string | null
    fecha_creacion?:    string | null
    total_documentos?:  number
    total_cobrado?:     number
    total_registros?:   number
}

export interface PlanillaDetalle {
    id_detalle:        number
    id_planilla:       number
    codigo_cliente:    string | null
    nombre_cliente:    string
    tipo_documento:    string
    desc_tipo_documento?: string
    serie:             string | null
    numero_doc:        string | null
    importe:           number | string
    numero_recibo:     string | null
    importe_cobrado:   number | string
    cod_banco:         string | null
    desc_banco:        string | null
    fecha_deposito:    string | null
    numero_operacion:  string | null
    numero_cheque:     string | null
    orden?:            number
}

export interface NuevoDetalle {
    codigo_cliente?:   string
    nombre_cliente:    string
    tipo_documento:    string
    serie?:            string
    numero_doc?:       string
    importe:           number
    numero_recibo?:    string
    importe_cobrado:   number
    cod_banco?:        string
    desc_banco?:       string
    fecha_deposito?:   string
    numero_operacion?: string
    numero_cheque?:    string
}

export interface ResumenDia {
    total_planillas: number
    total_cobrado:   number
    validadas:       number
    rechazadas:      number
}

export interface VendedorInfo {
    id_vendedor:      number | string
    codigo_vendedor?: string
    nombre_vendedor?: string
    ciudad?:          string
}

export interface AdminInfo {
    id_admin: number | string
}