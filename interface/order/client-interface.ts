

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

// Interfaz condición
export interface ICondicion {
  CodigoCondicion: string;
  Descripcion: string;
  DiasCdto: number;
  Credito: string;
}

// Id distrito
export interface IDistrito {
  idDistrito: string
}

// Id distrito
export interface IZona {
  NombreZona: string
}
// Id zona
export interface IDzona {
  idzona: number
}

export interface ITerritorio {
  NombreDistrito: string;
  nombreProvincia: string;
  nombreDepartamento: string;
  ubigeo: string;
}

