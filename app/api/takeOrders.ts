
import { IDistrito } from "@/app/types/order/client-interface";
import apiClient from "./client";

export const fetchGetAllClients = async (seller: string, isGerente: boolean): Promise<any> => {
    return apiClient.get(`/tomarPedido/cliente/all?vendedor=${seller}&isGerente=${isGerente}`);
};

export const fetchGetConditions = async (query: string): Promise<any> => {
    return apiClient.get(`tomarPedido/condiciones?query=${encodeURIComponent(query)}`);
};

export const fetchGetStatus = async (): Promise<any> => {
    return apiClient.get(`tomarPedido/estados`);
};

export const fetchUpdateStatusConfirm = async (nroPedido: string): Promise<any> => {
    return apiClient.put(`tomarPedido/updateStatusConfirm?nroPedido=${nroPedido}`);
};

export const fetchUpdateStatus = async (nroPedido: string, estado: number): Promise<any> => {
    return apiClient.put(`tomarPedido/updateStatus?nroPedido=${nroPedido}&estado=${estado}`);
};

export const fetchUpdateClientRef = async (code: string, address: string, phone: string, refAddress: string): Promise<any> => {
    return apiClient.post(`tomarPedido/cliente/updateRef`, {
        code: code,
        address: address,
        phone: phone,
        refAddress: refAddress,
    });
};

export const fetchGetZona = async (idZona: string): Promise<any> => {
    return apiClient.get(`/tomarPedido/cliente/zona/${encodeURIComponent(idZona)}`);
};

export const fetchUnidaTerritorial = async (request:IDistrito ): Promise<any> => {
    return apiClient.post(`/tomarPedido/cliente/unidadterritorial`,request);
};

export const fetchGetDocTypeGuide = async (): Promise<any> => {
    return apiClient.get(`tomarPedido/tipoDocsGuia`);
};