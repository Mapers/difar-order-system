import { IClient } from "@/app/models/Client";

const mockClients: IClient[] = [
  {
    Codigo: "CLI-001",
    Nombre: "Juan Pérez",
    NombreComercial: "Tienda Pérez",
    Estado: "Activo",
    RUC: "12345678901",
    Direccion: "Av. Principal 123",
    Telefono: "987654321",
    Email: "juan@tiendaperez.com",
  },
  {
    Codigo: "CLI-002",
    Nombre: "María García",
    NombreComercial: "Boutique María",
    Estado: "Inactivo",
    RUC: "10987654321",
    Direccion: "Calle Flores 456",
    Telefono: "912345678",
    Email: "maria@boutiquemaria.com"
  },
  {
    Codigo: "CLI-003",
    Nombre: "Carlos López",
    NombreComercial: "Distribuidora López",
    Estado: "Activo",
    RUC: "98765432109",
    Direccion: "Jr. Comercio 789",
    Telefono: "976543210",
    Email: "carlos@distribuidoralopez.com"
  },
  {
    Codigo: "CLI-004",
    Nombre: "Ana Martínez",
    NombreComercial: "Almacenes Martínez",
    Estado: "Activo",
    RUC: "56789012345",
    Direccion: "Av. Industrial 321",
    Telefono: "934567890",
    Email: "ana@almacenesmartinez.com"
  },
  {
    Codigo: "CLI-005",
    Nombre: "Pedro Sánchez",
    NombreComercial: "Ferretería Sánchez",
    Estado: "Inactivo",
    RUC: "34567890123",
    Direccion: "Calle Hierro 654",
    Telefono: "945678901",
    Email: "pedro@ferreteriasanchez.com"
  }
];

export class ClientService {
  async getAllClients(): Promise<IClient[]> {
    // Simulamos un retraso de red
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockClients;
  }

  async getClientByCode(code: string): Promise<IClient | null> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const client = mockClients.find(c => c.Codigo === code);
    return client || null;
  }

  async createClient(client: Omit<IClient, 'Codigo'>): Promise<IClient> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const newClient = {
      ...client,
      Codigo: `CLI-${(mockClients.length + 1).toString().padStart(3, '0')}`
    };

    mockClients.push(newClient);
    return newClient;
  }

  async updateClient(code: string, clientData: Partial<IClient>): Promise<IClient> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const index = mockClients.findIndex(c => c.Codigo === code);
    if (index === -1) throw new Error("Cliente no encontrado");

    mockClients[index] = { ...mockClients[index], ...clientData };
    return mockClients[index];
  }

  async deleteClient(code: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const index = mockClients.findIndex(c => c.Codigo === code);
    if (index === -1) throw new Error("Cliente no encontrado");

    mockClients.splice(index, 1);
  }
}