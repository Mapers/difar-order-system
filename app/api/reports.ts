
import apiClient from "./client";
import { IClient, IDocClient } from "@/interface/report-interface";

export const consultDocClientRequest = async (
    docClient: IDocClient,
    page: number = 1,
    perPage: number = 10
): Promise<any> => {
    return apiClient.post(`/reportes/consultdocumentclient?page=${page}&perPage=${perPage}`, docClient)
}

export const balanceDocClientSellerRequest = async (
    client: IClient,
    page: number = 1,
    perPage: number = 10
): Promise<any> => {
    return apiClient.post(`/reportes/balancedocumentclientseller?page=${page}&perPage=${perPage}`, client)
}

export const balanceDocClientRequest = async (
    client: IClient,
    page: number = 1,
    perPage: number = 10
): Promise<any> => {
    return apiClient.post(`/reportes/balancedocumentclient?page=${page}&perPage=${perPage}`, client);
};


export const fetchTypeDocuments = async (
): Promise<any> => {
    return apiClient.get('/reportes/typedocuments')
}