
import apiClient from "./client";
import { Customer, Document } from "@/interface/report/report-interface";

export const consultDocClientRequest = async (documento: Document, vendedor: string | null): Promise<any> => {
    if (vendedor) return apiClient.post(`/reportes/consultdocumentclient?vendedor=${vendedor}`, documento)
    return apiClient.post(`/reportes/consultdocumentclient`, documento)
}

export const balanceDocClientSellerRequest = async (customer: Customer, vendedor: string | null): Promise<any> => {
    if (vendedor) return apiClient.post(`/reportes/balancedocumentclientseller?vendedor=${vendedor}`, customer)
    return apiClient.post(`/reportes/balancedocumentclientseller`, customer)
}

export const balanceDocClientRequest = async (customer: Customer, vendedor: string | null): Promise<any> => {
    if (vendedor) return apiClient.post(`/reportes/balancedocumentclient?vendedor=${vendedor}`, customer);
    return apiClient.post(`/reportes/balancedocumentclient`, customer);
};

export const fetchTypeDocuments = async (): Promise<any> => {
    return apiClient.get('/reportes/typedocuments')
}

export const fetchAvailableZones = async (): Promise<any> => {
    return apiClient.get('/reportes/zones')
}