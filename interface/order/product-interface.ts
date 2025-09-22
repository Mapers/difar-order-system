
// Interfaz request para escala y bonificado
export interface IPromocionRequest {
  idArticulo: string,
  cantidad: number
}

// Interfaz Bonificacion actual
export interface ICurrentBonification {
  bonificaciones: IBonificado[],
  productoSolicitado: string,
  nombreProductoSolicitado: string,
  cantidadSolicitada: number
}

// Interfaz Escala actual
export interface ICurrentScales {
  escalas: IEscala[],
  productoSolicitado: string,
  nombreProductoSolicitado: string,
  cantidadSolicitada: number,
  escalaAplicable: IEscala | null
}

// Interfaz Bonificacion actual
export interface ICurrent {
  bonificaciones: IBonificado[],
  productoSolicitado: string,
  nombreProductoSolicitado: string,
  cantidadSolicitada: number
}

// Interfaz escala
export interface IEscala {
  IdArticulo: string;
  Descripcion: string;
  minimo: number;
  maximo: number;
  precio_escala: string; 
  estado: string;
  Presentacion: string;
  PrincipioAdictivo: string;
  precio_contado_actual: string; 
  porcentaje_descuento: string; 
}

// Interfaz producto bonificado
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
  PUContado: string;
  PUCredito: string;
  isbonificado?: number;
  isescala?: number;
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

// Interfaz  de producto selecionado
export interface ISelectedProduct {
  product: IProduct
  quantity: number
  isBonification?: boolean
  isEscale?: boolean
  bonificationId?: number
  appliedScale?: any
  finalPrice?: number
  isEdit?: boolean
  isAuthorize?: boolean
}
