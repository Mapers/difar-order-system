export interface ICiclo {
    id_ciclo: number;
    anio: number;
    mes: number;
    fecha_inicio: string;
    fecha_fin: string;
    estado: 'ABIERTO' | 'CERRADO';
}

export interface ILabDashboard {
    id_meta_lab: number;
    id_linea_ge: number;
    nombre_lab?: string;
    meta_monto: number;
    meta_clientes: number;
    venta_real: number;
    clientes_atendidos: number;
    pct_avance_monto: number;
    pct_cobertura_clientes: number;
    monto_pendiente: number;
    color?: string;
}

export interface IVendedorDashboard {
    id_meta_lab_vend: number;
    id_meta_lab: number;
    cod_vendedor: string;
    nombre_vendedor?: string;
    meta_monto: number;
    meta_clientes: number;
    venta_real: number;
    clientes_atendidos: number;
    pct_avance_monto: number;
    pct_cobertura_clientes: number;
    monto_pendiente: number;
    items?: IItemDashboard[];
}

export interface IItemDashboard {
    id_meta_item: number;
    id_meta_lab_vend: number;
    id_meta_lab: number;
    cod_articulo: string;
    nombre_articulo?: string;
    precio_ref_meta: number;
    meta_cantidad: number;
    meta_monto: number;
    u_vendidas: number;
    venta_real: number;
    pct_cumplimiento_unidades: number;
    pct_avance_monto: number;
    unidades_pendientes: number;
    monto_pendiente: number;
    nombre_lab?: string;
}

export type FilterStatus = 'todos' | 'verde' | 'amarillo' | 'rojo';
export type SortMode = 'pct' | 'venta' | 'nombre';
export type ItemSortMode = 'contribucion' | 'avance' | 'unidades';

export interface IDashboardData {
    laboratorios: ILabDashboard[];
    vendedores: IVendedorDashboard[];
    items: IItemDashboard[];
}

export interface ICiclo {
    id_ciclo: number;
    anio: number;
    mes: number;
    fecha_inicio: string;
    fecha_fin: string;
    estado: 'ABIERTO' | 'CERRADO';
    fecha_reg?: string;
    usuario_reg?: string;
}

export interface ICicloForm {
    anio: number;
    mes: number;
    fecha_inicio: string;
    fecha_fin: string;
    usuario: string;
}

export interface IMetaLaboratorio {
    id_meta_lab: number;
    id_ciclo: number;
    id_linea_ge: number;
    meta_monto: number;
    meta_clientes: number;
    observacion: string | null;
    fecha_reg?: string;
    usuario_reg?: string;
    total_vendedores?: number;
    meta_distribuida?: number;
    linea_desc: string;
}

export interface IMetaLaboratorioForm {
    id_ciclo: number;
    id_linea_ge: number;
    meta_monto: number;
    meta_clientes: number;
    observacion: string;
    usuario: string;
}

export interface IMetaVendedor {
    id_meta_lab_vend: number;
    id_meta_lab: number;
    cod_vendedor: string;
    vendedor: string;
    meta_monto: number;
    meta_clientes: number;
    fecha_reg?: string;
    usuario_reg?: string;
    total_items?: number;
    meta_items_distribuida?: number;
}

export interface IMetaVendedorForm {
    id_meta_lab: number;
    cod_vendedor: string;
    meta_monto: number;
    meta_clientes: number;
    usuario: string;
}

export interface IMetaItem {
    id_meta_item: number;
    id_meta_lab_vend: number;
    cod_articulo: string;
    tipo_precio_ref: string;
    precio_ref: number;
    meta_cantidad: number;
    meta_monto: number;
    fecha_reg?: string;
    usuario_reg?: string;
}

export interface IMetaItemForm {
    id_meta_lab_vend: number;
    cod_articulo: string;
    tipo_precio_ref: string;
    precio_ref: number;
    meta_cantidad: number;
    usuario: string;
}

export interface IValidacionLab {
    id_meta_lab: number;
    meta_laboratorio: number;
    meta_clientes_lab: number;
    suma_vendedores: number;
    suma_clientes_vendedores: number;
    diferencia_monto: number;
    diferencia_clientes: number;
    estado_validacion: 'OK' | 'INCONSISTENTE';
}

export interface IValidacionVend {
    id_meta_lab_vend: number;
    meta_vendedor: number;
    suma_items: number;
    diferencia: number;
    estado_validacion: 'OK' | 'INCONSISTENTE';
}

export interface IArticuloPrecio {
    Idpreciosxtipo: number;
    Codigo_Art: string;
    Precio: number;
    TipoPrecio: string;
    NombreItem: string;
    id_linea_ge: number;
    Unidad: string;
}