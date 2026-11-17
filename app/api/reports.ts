import { cabeceraSesion } from "./sesion";

import apiClient from "./client";
import { Customer, Document } from "@/app/types/report/report-interface";

export const consultDocClientRequest = async (documento: Document, vendedor: string | null): Promise<any> => {
    if (vendedor) return apiClient.post(`/reportes/consultdocumentclient?vendedor=${vendedor}`, documento)
    return apiClient.post(`/reportes/consultdocumentclient`, documento)
}

export const fetchTypeDocuments = async (): Promise<any> => {
    return apiClient.get('/reportes/typedocuments')
}

export const fetchAvailableZones = async (): Promise<any> => {
    return apiClient.get('/reportes/zones')
}

export const searchClientsRequest = async (
    search: string,
    vendedor: string | null = null,
    representante: string | null = null
): Promise<any> => {
    const params = new URLSearchParams();
    params.append('search', search);
    if (vendedor) {
        params.append('vendedor', vendedor);
    }
    if (representante) {
        params.append('representante', representante);
    }
    return apiClient.get(`/reportes/searchclient?${params.toString()}`);
};

export const getExpiredBalancesRequest = async () => {
    return apiClient.get(`/reportes/saldos-vencidos`);
};

export const saldoPorCobrarClienteRequest = async (doc_cliente: string, fecha: string): Promise<any> => {
    return apiClient.post(`/reportes/saldo-por-cobrar-cliente`, { doc_cliente, fecha });
};

export const estadoCuentaClienteRequest = async (doc_cliente: string, fecha: string): Promise<any> => {
    return apiClient.post(`/reportes/estado-cuenta-cliente`, { doc_cliente, fecha });
};

export const ventasTotalesRequest = async (params: {
    anio: string
    mes: string
    laboratorios?: number[]
    vendedores?: string[]
}): Promise<any> => {
    // Agrupa por el laboratorio real (el mismo del filtro) y la línea del artículo, como Access.
    return apiClient.post(`/reportes/ventas-totales-2b`, params, { headers: cabeceraSesion() });
};

export const hojaEnBlancoRequest = async (params: {
    anio: string
    mes: string
    vendedores?: string[]
    cliente?: string | null
}): Promise<any> => {
    // Lee el documento real de Hoja en Blanco (registro de ventas de difar-p2025), como Access.
    return apiClient.post(`/reportes/hoja-en-blanco-2b`, params, { headers: cabeceraSesion() });
};
