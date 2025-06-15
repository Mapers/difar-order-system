
// Interfaz request para escala y bonificado
export interface IPromocionRequest {
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
export interface IBonificado {
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

// Interfaz producto
export interface IProduct {
  IdArticulo: number;
  Codigo_Art: string;
  NombreItem: string;
  Stock: string;
  Descripcion: string;
  presentacion: string | null;
  tieneEscala: number;
  tieneBonificado: number;
  precio1: string;
}

// Interfaz order item
export interface OrderItem {
  IdArticulo: number
  Codigo_Art: string
  NombreItem: string
  Cantidad: number
  Precio: number
  Total: number
}


