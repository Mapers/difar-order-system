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

  /** Unidades vendidas por artículo en los últimos 3 meses, para la columna de ventas. */
  static async getVentasTresMeses(): Promise<any> {
    const response = await apiClient.get('/price/ventas-3-meses');
    return response.data;
  }

  static async getPricesAll(params?: PriceListParams): Promise<any> {
    const response = await apiClient.get('/price/list-prices-lote/all', { params });
    return response.data;
  }

  static async getLaboratories(): Promise<any> {
    const response = await apiClient.get('/price/laboratories');
    return response.data;
  }

  static async getLaboratoriesRepres(codRepres: string | null): Promise<any> {
    const response = await apiClient.get('/price/laboratories-repres?codRepres=' + codRepres);
    return response.data;
  }

  static async getProductLots(code: string, almacen?: number | null): Promise<any> {
    const response = await apiClient.get(`/price/list-prices-lote/${code}`, {
      params: almacen ? { almacen } : undefined,
    });
    return response.data;
  }
}