
// interfaz documento
export interface Document {
  documento: string
}

// interfaz código de tipos de documento (F001-9061)
export interface TypeDocument {
  Cod_Tipo: string;
  Descripcion: string;
}

// interfaz de cliente (customer)
export interface Customer {
  nombreApellido: string
  fechaCorte: string
  idZona: string | null

}

// interfaz factura individual (invoice)
export interface Invoice {
  Date_Amortizacion?: string;
  Provision: string;
  Amortizacion: string;
  saldoDoc?: string;
  Fecha_Emision: string;
  Fecha_Vcto: string;
  Tipo_Doc: string;
  Abre_Doc: string;
  SerieDoc: string;
  NumeroDoc: number;
  Tipo_Moneda: string;
  Simb_Moneda: string;
}

// Información del cliente (cabecera)
export interface ClientHead {
  Cod_Clie?: string;
  Nombre: string;
  NombreComercial: string;
}

// Cliente con sus facturas (documento por cliente)
export interface Client {
  head: ClientHead;
  boddy: Invoice[];
}

// Interfaz de vendedor con su lista de clientes
export interface Zone {
  CodVend: string;
  nomVend: string;
  document_dislab: Client[];
}
// Interfaz de zona 
export interface IArea {
  IdZona: string,
  NombreZona: string
}
