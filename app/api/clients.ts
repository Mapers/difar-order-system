
import apiClient from "./client";
import { Customer, Document } from "@/interface/report/report-interface";

export const consultDocClientRequest = async (
    documento: Document,
): Promise<any> => {
    return apiClient.post(`/reportes/consultdocumentclientV1`, documento)
}




export const fetchGetClients = async (query: string): Promise<any> => {
    return apiClient.get(`/clientes/searchv1?query=${encodeURIComponent(query)}`);
  };
  