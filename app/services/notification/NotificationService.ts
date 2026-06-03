import apiClient from "@/app/api/client";

export interface TransferRequestPayload {
  clienteCodigo: string;
  solicitadoPor: string;
  solicitanteNombre?: string;
  clienteNombre?: string;
  clienteRuc?: string;
  vendedorOrigen?: string | null;
}

export class NotificationService {
  static async listNotifications(
    rol: string | null,
    codigo: string | null,
  ): Promise<any> {
    const params: Record<string, string> = {};
    if (rol) params.rol = rol;
    if (codigo) params.codigo = codigo;
    const response = await apiClient.get("/notificaciones", { params });
    return response.data;
  }

  static async markRead(id: string | number): Promise<any> {
    const response = await apiClient.post(`/notificaciones/${id}/leer`);
    return response.data;
  }

  static async deleteNotification(id: string | number): Promise<any> {
    const response = await apiClient.delete(`/notificaciones/${id}`);
    return response.data;
  }

  static async markAllRead(
    rol: string | null,
    codigo: string | null,
  ): Promise<any> {
    const response = await apiClient.post("/notificaciones/marcar-todas/leidas", {
      rol,
      codigo,
    });
    return response.data;
  }

  static async requestTransfer(payload: TransferRequestPayload): Promise<any> {
    const response = await apiClient.post("/clientes/transferencias", payload);
    return response.data;
  }

  static async approveTransfer(
    id: string | number,
    resueltoPor?: string | null,
  ): Promise<any> {
    const response = await apiClient.post(`/clientes/transferencias/${id}/aprobar`, {
      resueltoPor,
    });
    return response.data;
  }

  static async rejectTransfer(
    id: string | number,
    resueltoPor?: string | null,
  ): Promise<any> {
    const response = await apiClient.post(`/clientes/transferencias/${id}/rechazar`, {
      resueltoPor,
    });
    return response.data;
  }
}
