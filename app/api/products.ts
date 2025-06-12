
import apiClient from "./client";
import { IDate } from "@/interface/product-interface";
import { IBonificado, IEscala } from "@/interface/product/client-interface";

export const getDateProductsRequest = async (date: IDate, page: number = 1, perPage: number = 10): Promise<any> => {
    return apiClient.post(`/articulos/dateproducts?page=${page}&perPage=${perPage}`, date)
}
export const getProductsRequest = async (): Promise<any> => {
    return apiClient.get(`/articulos`)
}

export const getEscalasRequest = async (requestEscala:IEscala): Promise<any> => {
    return apiClient.post(`/articulos/escalas`,requestEscala)
}

export const getBonificadosRequest = async (requestBonificado: IBonificado): Promise<any> => {
    return apiClient.post(`/articulos/bonificados`,requestBonificado)
}
