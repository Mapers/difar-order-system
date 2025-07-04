
import apiClient from "./client";

export const fetchGetClients = async (codVendedor: string): Promise<any> => {
    return apiClient.get(`/clientes/listar/${encodeURIComponent(codVendedor)}`);
};

