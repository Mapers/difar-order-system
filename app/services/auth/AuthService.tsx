// import { IClient } from "@/app/models/Client";

import apiClient from "@/app/api/client";

export class AuthService {

  /**
   * 
   * @param codVendedor 
   * @returns 
   */
  static async getMenuByCodVendedor(codVendedor: string): Promise<any> {
    const response = await apiClient.get(`/menu/menu-vendedor/${encodeURIComponent(codVendedor)}`);
    return response.data;
  }

}