
import apiClient from "./client";

export const fetchGetClients = async (query: string): Promise<any> => {
    return apiClient.get(`/clientes/search?query=${encodeURIComponent(query)}`);
};

