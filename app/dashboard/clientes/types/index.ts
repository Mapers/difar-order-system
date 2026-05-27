
export interface Evaluation {
    codCliente: string
    tipoId: number
    detalle: string
    observaciones: string
}

export interface IClientEvaluation {
    codigoInterno: string
    codigoVendedor: string
    razonSocial: string
    nombreComercial: string
    ruc: string
    tipoDocumentoAbreviado: string
    tipoDocumentoDescripcion: string
    direccion: string
    telefono: string
    email: string
    provincia: string
    distrito: string
    zona: string
    representanteLegal: string
    categoria: string
    estado: string
    fechaInicio: string
    fechaRegistro: string
}

export interface IClient {
    codigoInterno: string
    razonSocial: string
    nombreComercial: string
    tipoDocumento: string
    numeroDocumento: string
    categoria: string
    fechaEvaluacion: string
    provincia: string
    zona: string
    estado: string
}

export interface IEvaluation {
    codigoInterno: string
    nombreComercial: string
    razonSocial: string
    ruc: string
    direccion: string
    telefono: string
    correoElectronico: string
    evaluacionId: string
    fechaEvaluacion: string
    categoria: string
    estadoContribuyente: string
    representanteLegal: string
    itemLista: string
    aprobadoDirTecnica: boolean
    aprobadoGerente: boolean
    observacionesGlobal: string
    createdAt: string
    updatedAt: string
}


export interface IEvaluacionCalif {
    dirTecnicaEstado: string
    gerenteEstado: string
    estado: string
    observacionesGlobal: string | null
}

export interface ISolicitudCliente {
    id: number
    ruc: string
    estado: 'solicitando' | 'completado' | 'aprobado' | 'rechazado'
    fechaSolicitud: string
    solicitadoPor?: string
    resultado?: IResultadoDigemid
}

export interface IResultadoDigemid {
    ok: boolean
    total: number
    registros: IRegistroDigemid[]
}

export interface IRegistroDigemid {
    idRegistro: string
    item: string
    nroRegistro: string
    categoria: string
    nombreComercial: string
    razonSocial: string
    ruc: string
    direccion: string
    ubigeo: string
    situacion: string
    empadronado: string
    detalle: IDetalleDigemid
}

export interface IDetalleDigemid {
    nroRegistro: string
    situacion: string
    lugarRegistro: string
    fechaInicio: string
    nroRuc: string
    categoria: string
    nombreComercial: string
    razonSocial: string
    direccion: string
    depProvDist: string
    horario: string
    tipo: string
    motivo: string
    solicitante: string
    representantes: Record<string, string>[]
    personal: Record<string, string>[]
}

