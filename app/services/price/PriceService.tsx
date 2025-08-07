// import { IClient } from "@/app/models/Client";

import apiClient from "@/app/api/client";
import { PriceListParams } from "@/app/dashboard/lista-precios-lote/types";

export class PriceService {

  /**
   * 
   * @param params 
   * @returns 
   */
  static async getPricesLot(params?: PriceListParams): Promise<any> {
    const response = await apiClient.get('/price/list-prices-lote', { params });
    return response.data;
  }

  static async getLaboratories(): Promise<any> {
    const response = await apiClient.get('/price/laboratories');
    return response.data;
  }
}