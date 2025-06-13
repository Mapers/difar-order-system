
// Interfaz escala
export interface IEscalaRequest {
  idArticulo: string,
  cantidad: number
}

// Interfaz bonificado
export interface IBonificadoRequest {
  idArticulo: string,
  cantidad: number
}

// Interfaz escala
export interface IEscala {
  IdArticulo: string;
  Descripcion: string;
  minimo: number;
  maximo: number | null;
  Precio: string;
  estado: string;
  Presentacion: string;
  PrincipioAdictivo: string;
}

// Interfaz bonificado
export interface IBonificado{
  ProductoSolicitado: string;
  CantidadSolicitada: string;
  ProductoBonificado: string;
  CantidadBonificadaPorUnidad: string;
  VecesBonifica: number;
  TotalBonificados: string;
  NombreItem: string;
  Presentacion: string;
  PrecioBonificado: string;
  PrincipioActivo: string;
}

