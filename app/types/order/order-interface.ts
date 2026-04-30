export interface Comprobante {
    idSunat:               number  | null
    idComprobanteCab:      number  | null
    nroPedido:             number  | null
    fecha_envio:           string  | null
    serie:                 string
    numero:                string
    cliente_numdoc:        string  | null
    cliente_denominacion:  string  | null
    moneda:                number  | null
    total:                 string  | null
    tipo_comprobante:      number  | null
    anulado:               boolean
    enlace:                string  | null
    enlace_pdf:            string  | null
    enlace_cdr:            string  | null
    enlace_xml:            string  | null
    tieneGuia:             number
    raw_request:           string  | null
    raw_response:          string  | null
    motivo_anulado?:       string  | null
    tieneNC:               boolean
    aceptada_por_sunat?:   number  | null
    estado_correlativo:    'OCUPADO' | 'LIBRE'
    fecha_emision?:        string  | null
    estado?:               string | null
}

export interface GuiaRemision {
    idGuiaRemCab:         number | null
    nroPedido:            number | null
    fecha_emision:        string | null
    serie:                string
    numero:               string
    cliente_num_doc:      string
    cliente_denominacion: string
    peso_bruto_total:     string | null
    tipo_comprobante:     number | null
    anulado:              boolean
    enlace:               string | null
    enlace_pdf:           string | null
    enlace_cdr:           string | null
    enlace_xml:           string | null
    pdf_zip_base64:       string | null
    sunat_description:    string | null
    sunat_soap_error:     string | null
    sunat_responsecode:   string | null
    raw_request:          string | null
    raw_response:         string | null
    motivo_anulado:       string | null
    idComprobanteCab:     number | null
    comprobante_serie:    string | null
    comprobante_numero:   number | null
    comprobante_tipo:     number | null
    comprobante_enlace:   string | null
    estado:               string
}

export interface SunatTransaccion {
    idTransaction: number;
    descripcion: string;
}

export interface TipoDocSunat {
    codigo: string;
    descripcion: string;
}

export interface Pedido {
    idPedidocab: number
    nroPedido: string
    fechaPedido: string
    codigoCliente: string
    nombreCliente: string
    condicionPedido: string
    RUC: string
    codigoVendedor: string
    is_migrado: string
    estadodePedido: number
    nombreVendedor: string
    totalPedido: string
    monedaPedido: string
    cantidadPedidos: number
    direccionCliente: string
    errorObservaciones?: string
    errorCodigo?: string
    errorFecha?: string
    observaciones?: string
    condicionCredito?: string
    telefono?: string
    email?: string
}

export interface GuiaReferencia {
    idGuiaRemCab: number;
    serie: string;
    numero: string;
    fecha_emision: string;
    tipo_comprobante: string;
    pdf_zip_base64: string;
}

export interface LoteProducto {
    value: string
}

export interface ProductoConLotes {
    prod_codigo: string
    prod_descripcion: string
    cantidadPedido: number
    lotes: LoteProducto[]
    loteSeleccionado?: string
}

export interface Seller {
    idVendedor: number
    codigo: string
    nombres: string
    apellidos: string
    DNI: string
    telefono: string
    comisionVend: number
    comisionCobranza: number
    empRegistro: string
}

export type PriceType = 'contado' | 'credito' | 'porMayor' | 'porMenor' | 'custom' | 'regalo'

export type ModalLoaderType = 'BONIFICADO' | 'ESCALA' | 'EVALUACION' | null