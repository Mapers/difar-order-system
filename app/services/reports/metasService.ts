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

    static async getDashboard(idCiclo: number, codVendedor: string | undefined, idZona?: string): Promise<any> {
        const response = await apiClient.get(`/metas/dashboard?id_ciclo=${idCiclo}&codVendedor=${codVendedor || ''}&id_zona=${idZona || ''}`);
        return response.data;
    }

    static async getResumenVendedorLabs(idCiclo: number): Promise<any> {
        const response = await apiClient.get(`/metas/dashboard/resumen-vendedor-labs?id_ciclo=${idCiclo}`);
        return response.data;
    }

    static async getDetalleVendedorPorLab(idCiclo: number, codVendedor: string): Promise<any> {
        const response = await apiClient.get(`/metas/dashboard/detalle-vendedor-labs?id_ciclo=${idCiclo}&cod_vendedor=${codVendedor}`);
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

    static async crearMetasLabBulk(data: any): Promise<any> {
        const response = await apiClient.post(`/metas/laboratorios/bulk`, data);
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
    static async listarMetasVend(idCiclo: number, idLineaGe: number): Promise<any> {
        const response = await apiClient.get(`/metas/vendedores?id_ciclo=${idCiclo}&id_linea_ge=${idLineaGe}`);
        return response.data;
    }

    static async crearMetaVend(data: any): Promise<any> {
        const response = await apiClient.post(`/metas/vendedores`, data);
        return response.data;
    }

    static async crearMetasVendBulk(data: any): Promise<any> {
        const response = await apiClient.post(`/metas/vendedores/bulk`, data);
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

    static async listarMetasItemPorVend(idCiclo: number, idLineaGe: number, codVendedor: string): Promise<any> {
        const response = await apiClient.get(`/metas/items/por-vendedor?id_ciclo=${idCiclo}&id_linea_ge=${idLineaGe}&cod_vendedor=${codVendedor}`);
        return response.data;
    }

    static async crearMetaItem(data: any): Promise<any> {
        const response = await apiClient.post(`/metas/items`, data);
        return response.data;
    }

    static async crearMetasItemBulk(data: any): Promise<any> {
        const response = await apiClient.post(`/metas/items/bulk`, data);
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

    static async obtenerDisponibleMeta(idMetaLabVend: number): Promise<any> {
        const response = await apiClient.get(`/metas/disponible/item/${idMetaLabVend}`);
        return response.data;
    }

    // Auxiliares
    static async obtenerPrecioArticulo(codArticulo: string, tipoPrecio?: string): Promise<any> {
        const params = tipoPrecio ? `&tipo_precio=${tipoPrecio}` : '';
        const response = await apiClient.get(`/metas/articulos/precio?cod_articulo=${codArticulo}${params}`);
        return response.data;
    }

    static async listarArticulosPorLab(idLineaGe: number): Promise<any> {
        const response = await apiClient.get(`/metas/articulos/por-laboratorio?id_linea_ge=${idLineaGe}`);
        return response.data;
    }

    static async listarClientesAtendidos(idMetaLabVend: number): Promise<any> {
        const response = await apiClient.get(`/metas/dashboard/clientes-vendedor/${idMetaLabVend}`);
        return response.data;
    }

    static async listarClientesAtendidosDirecto(codVendedor: string, idCiclo: number, idLineaGe: number): Promise<any> {
        const response = await apiClient.get(
            `/metas/dashboard/clientes-atendidos?cod_vendedor=${codVendedor}&id_ciclo=${idCiclo}&id_linea_ge=${idLineaGe}`
        );
        return response.data;
    }

    static async getVisitasSemana(codVendedor: string, fechaInicio: string, fechaFin: string): Promise<any> {
        const response = await apiClient.get(
            `/rutas/visitas-semana?cod_vendedor=${codVendedor}&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
        );
        return response.data;
    }
}
