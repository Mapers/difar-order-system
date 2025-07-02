
import { IDistrito } from "@/interface/order/client-interface";
import apiClient from "./client";

export const fetchGetClients = async (query: string): Promise<any> => {
    return apiClient.get(`/tomarPedido/cliente/search?query=${encodeURIComponent(query)}`);
};

export const fetchGetConditions = async (query: string): Promise<any> => {
    return apiClient.get(`tomarPedido/condiciones?query=${encodeURIComponent(query)}`);
};

export const fetchGetZona = async (idZona: string): Promise<any> => {
    return apiClient.get(`/tomarPedido/cliente/zona/${encodeURIComponent(idZona)}`);
};

export const fetchUnidaTerritorial = async (request:IDistrito ): Promise<any> => {
    return apiClient.post(`/tomarPedido/cliente/unidadterritorial`,request);
};

