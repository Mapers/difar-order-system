export interface IDocClient {
    documento: string
}

export interface IDocument {
    Cod_Tipo: string;
    Descripcion: string;
}

export interface IClient {
    nombreApellido: string
    fechaCorte: string
}

// Una factura individual (invoice)
export interface Invoice {
  Fecha_Emision: string;
  Fecha_Vcto: string;
  Date_Amortizacion: string;
  Tipo_Doc: string;
  Abre_Doc: string;
  SerieDoc: string;
  NumeroDoc: number;
  Tipo_Moneda: string;
  Simb_Moneda: string;
  Provision: string;
  Amortizacion: string;
}

// Información del cliente (cabecera)
export interface ClientHead {
  Cod_Clie: string;
  Nombre: string;
  NombreComercial: string;
}

// Cliente con sus facturas (documento por cliente)
export interface Client {
  head: ClientHead;
  boddy: Invoice[];
}

// Vendedor con su lista de clientes
export interface Zone {
  CodVend: string;
  nomVend: string;
  document_dislab: Client[];
}

// Lista de zonas (todos los vendedores)
export type DataZoneClient = Zone[];
