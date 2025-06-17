
import apiClient from "./client";
import { IDate } from "@/interface/product-interface";
import { IPromocionRequest } from "@/interface/order/product-interface";

export const getDateProductsRequest = async (date: IDate, page: number = 1, perPage: number = 10): Promise<any> => {
    return apiClient.post(`/articulos/dateproducts?page=${page}&perPage=${perPage}`, date)
}
export const getProductsRequest = async (): Promise<any> => {
    return apiClient.get(`/articulos`)
}

export const getEscalasRequest = async (requestEscala: IPromocionRequest): Promise<any> => {
    return apiClient.post(`/articulos/escalas`, requestEscala)
}

export const getBonificadosRequest = async (requestBonificado: IPromocionRequest): Promise<any> => {
    return apiClient.post(`/articulos/bonificados`, requestBonificado)
}
