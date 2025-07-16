import apiClient from "@/app/api/client";
import { SmsCheck, SmsSend, UserLoginDTO } from "./types";

export class AuthService {

  /**
   * 
   * @param user 
   * @returns 
   */
  static async loginRequest(user: UserLoginDTO) {
    const response = await apiClient.post(`auth/signin`, user);
    return response.data
  };

  /**
   * 
   * @param user 
   * @returns 
   */
  static async registerRequest(user: any) {
    const response = await apiClient.post(`/auth/signup`, user);
    return response.data
  };

  /**
   * 
   * @param data
   * @returns 
   */
  static async insertToken(data: SmsSend) {
    const response = await apiClient.post(`code/twillio/generateToken`, data);
    return response.data
  };

  /**
   * 
   * @param data 
   * @returns 
   */
  static async checkToken(data: SmsCheck) {
    const response = await apiClient.post(`code/twillio/validateToken`, data);
    return response.data
  };


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