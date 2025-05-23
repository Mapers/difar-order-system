export interface IDocClientSeller {
  documento: string
}

export interface IDocumentSeller {
  Cod_Tipo: string;
  Descripcion: string;
}

export interface IClientSeller {
  nombreApellido: string
  fechaCorte: string
}


// Una factura individual (invoice)
export interface InvoiceSeller {
  Fecha_Emision: string;
  Fecha_Vcto: string;
  Tipo_Doc: string;
  Abre_Doc: string;
  SerieDoc: string;
  NumeroDoc: number;
  Tipo_Moneda: string;
  Simb_Moneda: string;
  saldoDoc: string;
}

// Información del cliente (cabecera)
export interface ClientHeadSeller {
  Nombre: string;
  NombreComercial: string;
}

// Cliente con sus facturas (documento por cliente)
export interface ClientSeller {
  head: ClientHeadSeller;
  boddy: InvoiceSeller[];
}

// Vendedor con su lista de clientes
export interface ZoneSeller {
  CodVend: string;
  nomVend: string;
  document_dislab: ClientSeller[];
}

// Lista de zonas (todos los vendedores)
export type DataZoneClient = ZoneSeller[];
