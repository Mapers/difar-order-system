// import { IClient } from "@/app/models/Client";

import apiClient from "@/app/api/client";
import { PriceListParams } from "@/app/dashboard/lista-precios-lote/types";

export class PriceService {

 /**
  * 
  * @param params 
  * @returns 
  */
  static async getPreciosPorLote(params?:PriceListParams): Promise<any> {
    const response = await apiClient.get('/articulos/preciosporlote', { params });
    return response.data;
  }
}