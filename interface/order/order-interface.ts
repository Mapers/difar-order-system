export interface Comprobante {
    idSunat: number
    idComprobanteCab: number
    nroPedido: number
    fecha_envio: string
    serie: string
    numero: string
    cliente_numdoc: string
    cliente_denominacion: string
    moneda: number
    total: string
    tipo_comprobante: number
    anulado: boolean
    enlace: string
    enlace_pdf: string
    enlace_cdr: string
    enlace_xml: string
    tieneGuia: number
    raw_request: string
    raw_response: string
    motivo_anulado?: string
}

export interface GuiaRemision {
    idGuiaRemCab: number
    nroPedido: number
    fecha_emision: string
    serie: string
    numero: string
    cliente_num_doc: string
    cliente_denominacion: string
    peso_bruto_total: string
    tipo_comprobante: number
    anulado: boolean
    enlace: string
    enlace_pdf: string
    enlace_cdr: string
    enlace_xml: string
    pdf_zip_base64: string
    sunat_description?: string
    sunat_responsecode: string
    raw_request: string
    raw_response: string
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
}

export interface GuiaReferencia {
    idGuiaRemCab: number;
    serie: string;
    numero: string;
    fecha_emision: string;
    tipo_comprobante: string;
    pdf_zip_base64: string;
}
