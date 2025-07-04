
import apiClient from "./client";
import { Customer, Document } from "@/interface/report/report-interface";

export const consultDocClientRequest = async (documento: Document): Promise<any> => {
    return apiClient.post(`/reportes/consultdocumentclient`, documento)
}

export const balanceDocClientSellerRequest = async (customer: Customer): Promise<any> => {
    return apiClient.post(`/reportes/balancedocumentclientseller`, customer)
}

export const balanceDocClientRequest = async (customer: Customer): Promise<any> => {
    return apiClient.post(`/reportes/balancedocumentclient`, customer);
};

export const fetchTypeDocuments = async (): Promise<any> => {
    return apiClient.get('/reportes/typedocuments')
}

export const fetchAvailableZones = async (): Promise<any> => {
    return apiClient.get('/reportes/zones')
}