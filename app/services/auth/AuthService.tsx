import apiClient from "@/app/api/client";
import { SmsCheck, SmsSend, UserLoginDTO } from "./types";

export class AuthService {

  /**
   * 
   * @param user 
   * @returns 
   */
  /**
   * Inicio de sesión seguro (auditoría 14/11/2026): el servidor manda el código al teléfono registrado del DNI
   * y no entrega el token hasta verificarlo.
   */
  static async solicitarCodigo(dni: string) {
    const response = await apiClient.post(`auth/solicitar-codigo`, { dni });
    return response.data as { success: boolean; message: string; data?: { telefono: string; minutos: number } };
  };

  static async verificarCodigo(data: SmsCheck) {
    const response = await apiClient.post(`auth/verificar-codigo`, data);
    return response.data as { success: boolean; message: string; data?: string };
  };

  /** @deprecated inicio de sesión antiguo (token con solo el DNI). El backend lo apaga en la fase 2. */
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
   * Re-emite un token de vendedor a partir del Vendedor Relación del representante.
   * @param token token actual del representante
   * @returns respuesta con el nuevo token en data
   */
  static async ingresarComoVendedor(token: string) {
    const response = await apiClient.post(
      `auth/ingresar-como-vendedor`,
      { token },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data
  };

  /**
   * Re-emite un token de representante a partir del representante de origen.
   * @param token token actual (vendedor simulado o representante)
   * @returns respuesta con el nuevo token en data
   */
  static async ingresarComoRepresentante(token: string) {
    const response = await apiClient.post(
      `auth/ingresar-como-representante`,
      { token },
      { headers: { Authorization: `Bearer ${token}` } }
    );
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