
export interface PrecioLote {
    laboratorio_id: number;
    laboratorio_Descripcion: string;
    linea_lote_id: number;
    linea_lote_Descripcion: string;
    prod_codigo: string;
    prod_descripcion: string;
    prod_presentacion: string | null;
    prod_medida: string;
    prod_principio: string | null;
    kardex_saldoCant: string;
    kardex_lote: string;
    kardex_VctoItem: string;
    precio_contado: string;
    precio_credito: string;
}

export interface PriceListParams {
    laboratorio?: string,
    descripcion?: string
}

export interface LoteInfo {
    numeroLote: string;
    stock: number;
    fechaVencimiento: string;
    estado: string
}