import { format, parseISO } from "date-fns"
import { IClientEvaluation, IClient, IEvaluation, IEvaluacionCalif } from "@/interface/clients/client-interface";
// cliente- para grilla
export const mapClientFromApi = (data: any): IClient => ({
  codigoInterno: data.codigo || "No registrado",
  razonSocial: data.cliente_nombre || "No registrado",
  nombreComercial: data.cliente_comercial || "No registrado",
  tipoDocumento: data.documento_abrev || "No registrado",
  numeroDocumento: data.documento_numero || "No registrado",
  categoria: data.categoria || "No registrado",
  fechaEvaluacion: data.fecha_evaluacion ? data.fecha_evaluacion : "Sin fecha",
  provincia: data.provincia || "No registrado",
  zona: data.zona || "No registrado",
  estado: data.estado || "No registrado",
})

// cliente en evaluacion
export const mapClientEvaluationFromApi = (data: any): IClientEvaluation => ({
  codigoInterno: data.codigo || "No registrado",
  codigoVendedor: data.codigo_vendedor || "No registrado",
  razonSocial: data.razon_social || "No registrado",
  nombreComercial: data.nombre_comercial || "No registrado",
  ruc: data.documento_numero || "No registrado",
  tipoDocumentoAbreviado: data.tipo_abreviado || "No asignado",
  tipoDocumentoDescripcion: data.tipo_descripcion || "No registrado",
  direccion: data.direccion || "No registrado",
  telefono: data.Telefono || "No registrado",
  email: data.email ?? "Sin correo",
  provincia: data.provincia || "No registrado",
  distrito: data.distrito || "No registrado",
  zona: data.zona || "No registrado",
  representanteLegal: data.representante_lega || "No asignado",
  categoria: data.categoria_cliente || "No asignado",
  estado: data.estado || "No registrado",
  fechaInicio: data.FECHA_INICIO || "Sin fecha",
  fechaRegistro: data.FechaRegistros ? format(parseISO(data.FechaRegistros), "dd/MM/yyyy") : "Sin fecha",
})

// Evaluacion de un cliente
export const mapEvaluationFromApi = (data: any): IEvaluation => ({
  codigoInterno: data.Codigo || "No registrado",
  nombreComercial: data.NombreComercial || "No registrado",
  razonSocial: data.RazonSocial || "No registrado",
  ruc: data.RUC || "No registrado",
  direccion: data.Dirección || "No registrado",
  telefono: data.Telefono || "No registrado",
  correoElectronico: data.correoElectronico || "No registrado",
  evaluacionId: data.EvaluacionId || "No asigando",
  fechaEvaluacion: data.fecha_evaluacion || "No Registrado",
  categoria: data.categoria || "No registrado",
  estadoContribuyente: data.estado_contribuyente || "No registrado",
  representanteLegal: data.representante_legal || "No registrado",
  itemLista: data.item_lista || "No registrado",
  aprobadoDirTecnica: data.aprobado_dir_tecnica || "No registrado",
  aprobadoGerente: data.aprobado_gerente || "No registrado",
  observacionesGlobal: data.observaciones_global || "No registrado",
  createdAt: data.created_at || "No registrado",
  updatedAt: data.updated_at || "No registrado",
});

// Evaluacion de un cliente
export const mapEvaluacionCalificacionFromApi = (data: any): IEvaluacionCalif => ({
  dirTecnicaEstado: data.dir_tecnica_estado || "No registrado",
  gerenteEstado: data.gerente_estado || "No registrado",
  estado: data.resultado_final || "No registrado",
  observacionesGlobal: data.observaciones_global || "No registrado",
})
