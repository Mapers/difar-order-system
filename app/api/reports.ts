
import apiClient from "./client";
import { Customer, Document } from "@/interface/report/report-interface";

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
