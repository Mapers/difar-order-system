import apiClient from "@/app/api/client";

export class MetasService {

    static async listarCiclos(estado?: string): Promise<any> {
        const params = estado ? `?estado=${estado}` : '';
        const response = await apiClient.get(`/metas/ciclos${params}`);
        return response.data;
    }

    static async obtenerCiclo(id: number): Promise<any> {
        const response = await apiClient.get(`/metas/ciclos/${id}`);
        return response.data;
    }

    static async getDashboard(idCiclo: number): Promise<any> {
        const response = await apiClient.get(`/metas/dashboard?id_ciclo=${idCiclo}`);
        return response.data;
    }

    static async getDashboardLaboratorios(idCiclo: number): Promise<any> {
        const response = await apiClient.get(`/metas/dashboard/laboratorios?id_ciclo=${idCiclo}`);
        return response.data;
    }

    static async getDashboardVendedores(idCiclo: number): Promise<any> {
        const response = await apiClient.get(`/metas/dashboard/vendedores?id_ciclo=${idCiclo}`);
        return response.data;
    }

    static async getDashboardItems(idCiclo: number): Promise<any> {
        const response = await apiClient.get(`/metas/dashboard/items?id_ciclo=${idCiclo}`);
        return response.data;
    }

    // CRUD Ciclos
    static async crearCiclo(data: any): Promise<any> {
        const response = await apiClient.post(`/metas/ciclos`, data);
        return response.data;
    }

    static async actualizarCiclo(id: number, data: any): Promise<any> {
        const response = await apiClient.put(`/metas/ciclos/${id}`, data);
        return response.data;
    }

    static async cambiarEstadoCiclo(id: number, data: any): Promise<any> {
        const response = await apiClient.patch(`/metas/ciclos/${id}/estado`, data);
        return response.data;
    }

    // CRUD Laboratorios
    static async listarMetasLab(idCiclo: number): Promise<any> {
        const response = await apiClient.get(`/metas/laboratorios?id_ciclo=${idCiclo}`);
        return response.data;
    }

    static async crearMetaLab(data: any): Promise<any> {
        const response = await apiClient.post(`/metas/laboratorios`, data);
        return response.data;
    }

    static async actualizarMetaLab(id: number, data: any): Promise<any> {
        const response = await apiClient.put(`/metas/laboratorios/${id}`, data);
        return response.data;
    }

    static async eliminarMetaLab(id: number): Promise<any> {
        const response = await apiClient.delete(`/metas/laboratorios/${id}`);
        return response.data;
    }

    // CRUD Vendedores
    static async listarMetasVend(idMetaLab: number): Promise<any> {
        const response = await apiClient.get(`/metas/vendedores?id_meta_lab=${idMetaLab}`);
        return response.data;
    }

    static async crearMetaVend(data: any): Promise<any> {
        const response = await apiClient.post(`/metas/vendedores`, data);
        return response.data;
    }

    static async actualizarMetaVend(id: number, data: any): Promise<any> {
        const response = await apiClient.put(`/metas/vendedores/${id}`, data);
        return response.data;
    }

    static async eliminarMetaVend(id: number): Promise<any> {
        const response = await apiClient.delete(`/metas/vendedores/${id}`);
        return response.data;
    }

    // CRUD Items
    static async listarMetasItem(idMetaLabVend: number): Promise<any> {
        const response = await apiClient.get(`/metas/items?id_meta_lab_vend=${idMetaLabVend}`);
        return response.data;
    }

    static async crearMetaItem(data: any): Promise<any> {
        const response = await apiClient.post(`/metas/items`, data);
        return response.data;
    }

    static async actualizarMetaItem(id: number, data: any): Promise<any> {
        const response = await apiClient.put(`/metas/items/${id}`, data);
        return response.data;
    }

    static async eliminarMetaItem(id: number): Promise<any> {
        const response = await apiClient.delete(`/metas/items/${id}`);
        return response.data;
    }

    // Validaciones
    static async validarDistribucionLab(id: number): Promise<any> {
        const response = await apiClient.get(`/metas/validar/laboratorio/${id}`);
        return response.data;
    }

    static async validarDistribucionVend(id: number): Promise<any> {
        const response = await apiClient.get(`/metas/validar/vendedor/${id}`);
        return response.data;
    }

    static async validarCicloCompleto(id: number): Promise<any> {
        const response = await apiClient.get(`/metas/validar/ciclo/${id}`);
        return response.data;
    }

    // Auxiliares
    static async obtenerPrecioArticulo(codArticulo: string, tipoPrecio?: string): Promise<any> {
        const params = tipoPrecio ? `&tipo_precio=${tipoPrecio}` : '';
        const response = await apiClient.get(`/metas/articulos/precio?cod_articulo=${codArticulo}${params}`);
        return response.data;
    }

    static async listarArticulosPorLab(idLineaGe: number): Promise<any> {
        const response = await apiClient.get(`/metas/articulos/por-laboratorio`);
        return response.data;
    }
}
