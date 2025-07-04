export interface IClient {
    codigo: string;
    cliente_nombre: string;
    cliente_comercial: string;
    documento_abrev: string;
    documento_numero: string;
    categoria: string;
    fecha_evaluacion: string | null;
    provincia: string;
    zona: string;
    estado: string;
  }