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

export const buscarNotasCredito = async (params: { fecha?: string; busqueda?: string }): Promise<any> => {
    return apiClient.get('/asientos/notas-credito/buscar', { params })
}

export const guardarAsiento = async (payload: any): Promise<any> => {
    return apiClient.post('/asientos/guardar', payload)
}
