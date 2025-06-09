

// Interfaz cliente
export interface IClient {
  codigo: string;
  Nombre: string;
  NombreComercial: string;
  RUC: string;
  Dirección: string;
  Provincia: number;
  idDistrito: number;
  IdZona: string;
  LineaCredito: string;
  telefono: string | null;
}
