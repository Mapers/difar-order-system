
import apiClient from "./client";

export const fetchGetClients = async (query: string): Promise<any> => {
    return apiClient.get(`/clientes/searchv1?query=${encodeURIComponent(query)}`);
};
