import { format, parseISO } from "date-fns"
import { IClientEvaluation, IClient, IEvaluation, IEvaluacionCalif } from "@/interface/clients/client-interface";
// cliente- para grilla
export const mapClientFromApi = (data: any): IClient => ({
  codigoInterno: data.codigo,
  razonSocial: data.cliente_nombre,
  nombreComercial: data.cliente_comercial,
  tipoDocumento: data.documento_abrev,
  numeroDocumento: data.documento_numero,
  categoria: data.categoria,
  fechaEvaluacion: data.fecha_evaluacion ? data.fecha_evaluacion : "Sin evaluar",
  provincia: data.provincia,
  zona: data.zona,
  estado: data.estado,
})

// cliente en evaluacion
export const mapClientEvaluationFromApi = (data: any): IClientEvaluation => ({
  codigoInterno: data.codigo,
  codigoVendedor: data.codigo_vendedor,
  razonSocial: data.razon_social,
  nombreComercial: data.nombre_comercial,
  ruc: data.documento_numero,
  tipoDocumentoAbreviado: data.tipo_abreviado,
  tipoDocumentoDescripcion: data.tipo_descripcion,
  direccion: data.direccion,
  telefono: data.Telefono || "No registrado",
  email: data.email ?? "Sin correo",
  provincia: data.provincia,
  distrito: data.distrito,
  zona: data.zona,
  representanteLegal: data.representante_lega ?? "No asignado",
  categoria: data.categoria_cliente ?? "No asignado",
  estado: data.estado,
  fechaInicio: data.FECHA_INICIO
    ? format(parseISO(data.FECHA_INICIO), "dd/MM/yyyy")
    : "Sin fecha",
  fechaRegistro: data.FechaRegistros
    ? format(parseISO(data.FechaRegistros), "dd/MM/yyyy")
    : "Sin fecha",
})

// Evaluacion de un cliente
export const mapEvaluationFromApi = (data: any): IEvaluation => ({
  codigoInterno: data.Codigo,
  nombreComercial: data.NombreComercial,
  razonSocial: data.RazonSocial,
  ruc: data.RUC,
  direccion: data.Dirección,
  telefono: data.Telefono ?? "No registrado",
  correoElectronico: data.correoElectronico ?? "Sin correo",
  evaluacionId: data.EvaluacionId ? data.EvaluacionId : "No asigando",
  fechaEvaluacion: data.fecha_evaluacion
    ? format(parseISO(data.fecha_evaluacion), "dd/MM/yyyy")
    : "Sin fecha",
  categoria: data.categoria,
  estadoContribuyente: data.estado_contribuyente,
  representanteLegal: data.representante_legal,
  itemLista: data.item_lista,
  aprobadoDirTecnica: data.aprobado_dir_tecnica,
  aprobadoGerente: data.aprobado_gerente,
  observacionesGlobal: data.observaciones_global,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

// 
/**
 * Transforma la respuesta cruda del backend
 * al modelo tipado ICalificacion.
 */
 export const mapEvaluacionCalificacionFromApi = (data: any): IEvaluacionCalif => ({
  dirTecnicaEstado: data.dir_tecnica_estado,
  gerenteEstado: data.gerente_estado,
  estado: data.resultado_final,
  observacionesGlobal: data.observaciones_global,
})
