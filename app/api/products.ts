
import apiClient from "./client";
import { IDate } from "@/interface/product-interface";

export const getDateProductsRequest = async (
    date: IDate,
    page: number = 1,
    perPage: number = 10
): Promise<any> => {
    return apiClient.post(`/articulos/dateproducts?page=${page}&perPage=${perPage}`, date)
}
