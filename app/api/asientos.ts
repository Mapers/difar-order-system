import apiClient from "./client";

export const fetchComboGlosa = async (): Promise<any> => {
    return apiClient.get('/asientos/combos/glosa')
}

export const fetchComboTipoAsiento = async (): Promise<any> => {
    return apiClient.get('/asientos/combos/tipo-asiento')
}

export const fetchComboMes = async (): Promise<any> => {
    return apiClient.get('/asientos/combos/mes')
}

export const fetchComboAnio = async (): Promise<any> => {
    return apiClient.get('/asientos/combos/anio')
}

export const fetchComboCentroCostos = async (): Promise<any> => {
    return apiClient.get('/asientos/combos/centro-costos')
}

export const fetchSiguienteVoucher = async (anio: string): Promise<any> => {
    return apiClient.get('/asientos/voucher/siguiente', { params: { anio } })
}

export const buscarNotasCredito = async (params: { fecha?: string; busqueda?: string }): Promise<any> => {
    return apiClient.get('/asientos/notas-credito/buscar', { params })
}

export const buscarComprobantes = async (params: { codCliente: string; busqueda?: string }): Promise<any> => {
    return apiClient.get('/asientos/comprobantes/buscar', { params })
}

export const guardarAsiento = async (payload: any): Promise<any> => {
    return apiClient.post('/asientos/guardar', payload)
}

export const listarHistorialNc = async (params?: {
    fechaDesde?: string; fechaHasta?: string; busqueda?: string
}): Promise<any> => {
    return apiClient.get('/asientos/nc/historial', { params })
}

export const revertirProcesoNc = async (item: number): Promise<any> => {
    return apiClient.put(`/asientos/nc/historial/${item}/revertir`)
}
