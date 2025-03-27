import apiClient from "@/app/api/client";

export interface IClient {
  Codigo: string;
  Nombre: string;
  NombreComercial?: string;
  Relacion?: string;
  Estado: "Activo" | "Inactivo";
  RUC?: string;
  Direccion?: string;
  Telefono?: string;
  Email?: string;
}

export class ClientModel {
  private readonly apiUrl: string;

  constructor() {
    this.apiUrl = '/api/clients';
  }

  async getAll(): Promise<IClient[]> {
    const response = await apiClient.get(this.apiUrl);
    return response.data;
  }

  async getByCode(code: string): Promise<IClient | null> {
    try {
      const response = await apiClient.get(`${this.apiUrl}/${code}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async create(data: Omit<IClient, 'Codigo'>): Promise<IClient> {
    const response = await apiClient.post(this.apiUrl, data);
    return response.data;
  }

  async update(code: string, data: Partial<Omit<IClient, 'Codigo'>>): Promise<IClient | null> {
    try {
      const response = await apiClient.put(`${this.apiUrl}/${code}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async delete(code: string): Promise<boolean> {
    try {
      await apiClient.delete(`${this.apiUrl}/${code}`);
      return true;
    } catch (error) {
      throw error;
    }
  }
}