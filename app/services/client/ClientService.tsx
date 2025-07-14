// import { IClient } from "@/app/models/Client";

import apiClient from "@/app/api/client";

export class ClientService {
  static async getAllClientsByCodVendedor(codVendedor: string): Promise<any> {
    const response = await apiClient.get(`/clientes/listar/${codVendedor}`);
    return response.data;
  }

  // async getClientByCode(code: string): Promise<IClient | null> {
  //   await new Promise(resolve => setTimeout(resolve, 300));

  //   const client = mockClients.find(c => c.Codigo === code);
  //   return client || null;
  // }

  // async createClient(client: Omit<IClient, 'Codigo'>): Promise<IClient> {
  //   await new Promise(resolve => setTimeout(resolve, 500));

  //   const newClient = {
  //     ...client,
  //     Codigo: `CLI-${(mockClients.length + 1).toString().padStart(3, '0')}`
  //   };

  //   mockClients.push(newClient);
  //   return newClient;
  // }

  // async updateClient(code: string, clientData: Partial<IClient>): Promise<IClient> {
  //   await new Promise(resolve => setTimeout(resolve, 500));

  //   const index = mockClients.findIndex(c => c.Codigo === code);
  //   if (index === -1) throw new Error("Cliente no encontrado");

  //   mockClients[index] = { ...mockClients[index], ...clientData };
  //   return mockClients[index];
  // }

  // async deleteClient(code: string): Promise<void> {
  //   await new Promise(resolve => setTimeout(resolve, 300));

  //   const index = mockClients.findIndex(c => c.Codigo === code);
  //   if (index === -1) throw new Error("Cliente no encontrado");

  //   mockClients.splice(index, 1);
  // }
}