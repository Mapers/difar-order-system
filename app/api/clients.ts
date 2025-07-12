
import apiClient from "./client";

export const fetchGetClients = async (codVendedor: string): Promise<any> => {
    return apiClient.get(`/clientes/listar/${encodeURIComponent(codVendedor)}`);
};

export const fetchGetClientBycod = async (codClient: string): Promise<any> => {
    return apiClient.get(`/clientes/${encodeURIComponent(codClient)}`);
};

export const fetchEvaluationByCodClient = async (codClient: string): Promise<any> => {
    return apiClient.get(`/clientes/evaluacion/${encodeURIComponent(codClient)}`);
};

export const fetchGetDocObligatorios = async (): Promise<any> => {
    return apiClient.get(`/clientes/docs/obligatorios`);
};

export const fetchEvaluationCalifByCodClient = async (codClient: string): Promise<any> => {
    return apiClient.get(`/clientes/evaluacion-calif/${encodeURIComponent(codClient)}`);
};

export const fetchCreateEvaluationDocument = async (dataPayload: any): Promise<any> => {
    return apiClient.post(`/clientes/create-update-evaluacion-doc`,dataPayload);
};

export const fetchCreateUpdateClienteEvaluacion = async (dataPayload:any): Promise<any> => {
    return apiClient.post(`/clientes/create-update-cliente-evaluacion`,dataPayload);
};

export const fetchGetDocumentsTypes = async (): Promise<any> => {
    return apiClient.get(`/clientes/documento/tipo`);
};

export const fetchGetProvincesCities = async (): Promise<any> => {
    return apiClient.get(`/clientes/ciudad/provincias-ciudades`);
};

export const fetchGetDistricts = async (): Promise<any> => {
    return apiClient.get(`/clientes/ciudad/provincias-ciudades`);
};

export const fetchGetSunatStatus= async (): Promise<any> => {
    return apiClient.get(`/clientes/sunat/estado-sunat`);
};

export const fetchGetZones= async (): Promise<any> => {
    return apiClient.get(`/clientes/zone/list-zone`);
};

