
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
  estadoContribuyente: string | null
  representanteLegal: string | null
  itemLista: string | null
  aprobadoDirTecnica: boolean | null
  aprobadoGerente: boolean | null
  observacionesGlobal: string | null
  createdAt: string | null
  updatedAt: string | null
}


export interface IEvaluacionCalif {
  dirTecnicaEstado: string
  gerenteEstado: string
  estado: string
  observacionesGlobal: string | null
}

