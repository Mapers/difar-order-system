
import apiClient from "./client";
import { Customer, Document } from "@/interface/report/report-interface";

export const consultDocClientRequest = async (
    documento: Document,
): Promise<any> => {
    return apiClient.post(`/reportes/consultdocumentclientV1`, documento)
}

export const balanceDocClientSellerRequest = async (
    customer: Customer,
): Promise<any> => {
    return apiClient.post(`/reportes/balancedocumentclientsellerV1`, customer)
}

export const balanceDocClientRequest = async (
    customer: Customer,
): Promise<any> => {
    return apiClient.post(`/reportes/balancedocumentclientV1`, customer);
};


export const fetchTypeDocuments = async (
): Promise<any> => {
    return apiClient.get('/reportes/typedocuments')
}