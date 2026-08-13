import apiClient from "@/app/api/client";

export interface CostoArticulo {
    Codigo_Art:     string;
    Descripcion:    string | null;
    Laboratorio:    string | null;
    IdLineaGe:      number | null;
    AbrevUnidMed:   string | null;
    Cant_Compra:    number;
    Costo_Sugerido: number | null;
    Cant_Vendida:   number;
    Venta_Total:    number;
    Costo_Unit:     number;
    Origen:         'C' | 'M' | '';
    Base_Calculo:   string | null;
    Moneda:         string;
    Incluye_IGV:    number;
    Fuente:         string | null;
    Estado:         number;
    Fecha_Vigencia: string;
    Pendiente:      number;
}

export interface CostoGuardar {
    Codigo_Art:     string;
    Fecha_Vigencia: string;
    Costo_Unit:     number;
    Moneda?:        string;
    Incluye_IGV?:   boolean;
    Fuente?:        string | null;
    Estado?:        number;
}

export class CostosService {
    static async listar(
        periodo: string,
        laboratorio?: string,
        soloPendientes = false,
        incluirSinMovimiento = false,
    ): Promise<any> {
        const params = new URLSearchParams({ periodo });
        if (laboratorio) params.append('laboratorio', laboratorio);
        if (soloPendientes) params.append('solo_pendientes', '1');
        if (incluirSinMovimiento) params.append('incluir_sin_mov', '1');
        const response = await apiClient.get(`/costos?${params.toString()}`);
        return response.data;
    }

    /** Crea las filas del periodo para todos los artículos del laboratorio. */
    static async cargarLaboratorio(periodo: string, idLineaGe: number, usuario?: string): Promise<any> {
        const response = await apiClient.post(`/costos/cargar-laboratorio`, {
            periodo, id_linea_ge: idLineaGe, usuario,
        });
        return response.data;
    }

    static async recalcular(periodo: string, usuario?: string): Promise<any> {
        const response = await apiClient.post(`/costos/recalcular`, { periodo, usuario });
        return response.data;
    }

    static async guardar(costos: CostoGuardar[], usuario?: string): Promise<any> {
        const response = await apiClient.put(`/costos`, { costos, usuario });
        return response.data;
    }
}
