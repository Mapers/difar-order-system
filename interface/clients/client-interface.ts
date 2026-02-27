
export interface IClient {
  codigoInterno: string;
  razonSocial: string;
  nombreComercial: string;
  tipoDocumento: string;
  numeroDocumento: string;
  categoria: string;
  fechaEvaluacion: string;
  provincia: string;
  zona: string;
  estado: string;
  // Campos exclusivos de la Vista 2
  direccion?: string;
  telefono?: string;
  lineaCredito?: number;
  correoElectronico?: string;
  referenciaDireccion?: string;
  relacion?: string;
  ctaContab?: string | number;
  codigoVendedor?: string;
  tipoCliente?: string;
  estadoSunat?: string;
  fechaInicio?: string;
  nroRegistro?: string;
  resultado?: string;
  nomRepLegal?: string;
  nroResAutSani?: string;
  situacionFuncionamiento?: string;
  certificaciones?: string;
  itemLista?: string;
  otros?: string;
  idDistrito?: string | number;
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
  estadoSUNAT: string
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

