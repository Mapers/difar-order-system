import apiClient from '@/app/api/client'

/**
 * Actualiza Ventas APP (Access › MENU PRINCIPAL), versión web por comprobante.
 * Backend: /api/contabilidad/ventas-app/* (sesión + permiso del menú; el token lo pone client.ts).
 */
export type Origen = 'FAC' | 'NC'
export type EstadoCarga = 'CARGADO' | 'PARCIAL' | 'PENDIENTE'

export interface ComprobanteApp {
    origen: Origen
    id: number
    tipo_doc: string            // 01 factura · 03 boleta · 07 nota de crédito
    serie: string
    numero: number
    fecha: string
    ruc: string | null
    cliente: string | null
    valor_venta: number
    igv: number
    total: number               // NC en negativo
    doc_ref: string | null      // NC: documento que modifica
    motivo: string | null       // NC: motivo SUNAT
    estado_sunat: string | null
    rv_filas: number
    ma_filas: number
    kc_filas: number
    problema: string | null
    estado_carga: EstadoCarga
}

export interface ResumenMes {
    total: number; cargados: number; pendientes: number; parciales: number; conProblema: number
    montoPendiente: number; montoCargado: number
}

/** Totales del Registro de Ventas del mes con las columnas de la propuesta SIRE (SUNAT). */
export interface ResumenSunat {
    comprobantes: number; ventas: number; notas_credito: number
    base_imponible: number   // O + P
    igv: number              // Q + R
    exonerado: number        // S
    inafecto: number         // T
    flete: number            // Y (otros cargos)
    total_registro: number   // Total del Registro de Ventas
    total_cp: number         // Z = Total del registro + flete
}

export interface TablasAfectadas {
    registroVentas: Record<string, any>[]
    mayorAuxiliar: Record<string, any>[]
    kardexClientes?: Record<string, any>[]
}

export interface ResultadoCarga extends TablasAfectadas {
    resultado: { origen: Origen; id: number; tipo_doc: string; serie: string; numero: number; idregvtas: number; filas_registro_ventas: number; filas_mayor_auxiliar: number } | null
}

const base = '/contabilidad/ventas-app'

export const VentasAppService = {
    async listado(anio: number, mes: number): Promise<{ filas: ComprobanteApp[]; resumen: ResumenMes; resumenSunat: ResumenSunat | null }> {
        const { data } = await apiClient.get(`${base}/listado`, { params: { anio, mes } })
        return data.data
    },
    async previsualizar(origen: Origen, id: number): Promise<TablasAfectadas> {
        const { data } = await apiClient.get(`${base}/${origen}/${id}/previsualizar`)
        return data.data
    },
    async detalle(origen: Origen, id: number): Promise<TablasAfectadas> {
        const { data } = await apiClient.get(`${base}/${origen}/${id}/detalle`)
        return data.data
    },
    async cargar(origen: Origen, id: number): Promise<ResultadoCarga> {
        const { data } = await apiClient.post(`${base}/${origen}/${id}/cargar`)
        return data.data
    },
}
