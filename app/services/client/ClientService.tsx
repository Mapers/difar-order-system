// import { IClient } from "@/app/models/Client";

import apiClient from "@/app/api/client";

export class ClientService {

  /**
   * 
   * @param codVendedor 
   * @returns 
   */
  static async getAllClientsByCodVendedor(codVendedor: string | null): Promise<any> {
    const response = await apiClient.post(`/clientes/listar`, {
      codVendedor
    });
    return response.data;
  }

  /**
   * 
   * @param codClient 
   * @returns 
   */
  static async getEvaluationDocsClient(codClient: string): Promise<any> {
    const response = await apiClient.get(`/clientes/evaluacion-doc/${encodeURIComponent(codClient)}`);
    return response.data;
  };

  /**
   * 
   * @param codClient 
   * @returns 
   */
  static async getEvaluationCalifByCodClient(codClient: string): Promise<any> {
    const response = await apiClient.get(`/clientes/evaluacion-calif/${encodeURIComponent(codClient)}`);
    return response.data;
  };

  /**
   * 
   * @param dataPayload 
   * @returns 
   */
  static async createUpdateEvaluationDocument(dataPayload: any): Promise<any> {
    const response = await apiClient.post(`/clientes/create-update-evaluacion-doc`, dataPayload);
    return response.data
  };

  /**
   * 
   * @param codClient 
   * @returns 
   */
  static async getClientBycod(codClient: string): Promise<any> {
    const response = await apiClient.get(`/clientes/${encodeURIComponent(codClient)}`);
    return response.data
  };

  /**
   * 
   * @param codClient 
   * @returns 
   */
  static async getEvaluationByCodClient(codClient: string): Promise<any> {
    const response = await apiClient.get(`/clientes/evaluacion/${encodeURIComponent(codClient)}`);
    return response.data
  };

  /**
   * 
   * @returns 
   */
  static async getDocObligatorios(): Promise<any> {
    const response = await apiClient.get(`/clientes/docs/obligatorios`);
    return response.data
  };

  // PARA EDITAR 

  /**
 * 
 * @returns 
 */
  static async getDocumentsTypes(): Promise<any> {
    const response = await apiClient.get(`/clientes/documento/tipo`);
    return response.data
  };

  /**
    * 
    * @returns 
    */
  static async getProvincesCities(): Promise<any> {
    const response = await apiClient.get(`/clientes/ciudad/provincias-ciudades`);
    return response.data
  };

  /**
   * 
   * @returns 
   */
  static async getDistricts(): Promise<any> {
    const response = await apiClient.get(`/clientes/ciudad/provincias-ciudades`);
    return response.data
  };

  /**
  * 
  * @returns 
  */
  static async getZones(): Promise<any> {
    const response = await apiClient.get(`/clientes/zone/list-zone`);
    return response.data
  };

  /**
   * 
   * @returns 
   */
  static async getSunatStatus(): Promise<any> {
    const response = await apiClient.get(`/clientes/sunat/estado-sunat`);
    return response.data
  };

  /**
   * 
   * @returns 
   */
  static async getNextCode(): Promise<any> {
    const response = await apiClient.get(`/clientes/created/next-code`);
    return response.data
  };

  /**
   * 
   * @param dataPayload 
   * @returns 
   */
  static async createUpdateClienteEvaluacion(dataPayload: any): Promise<any> {
    const response = await apiClient.post(`/clientes/create-update-cliente-evaluacion`, dataPayload);
    return response.data
  };

  /**
   *
   * @returns
   */
  static async getClientsByZone(zone: string): Promise<any> {
    const response = await apiClient.get(`/rutas/clients/by-zone?zone=${zone}`);
    return response.data
  };
}