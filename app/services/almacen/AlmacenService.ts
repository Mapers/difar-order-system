import apiClient from '@/app/api/client'

/**
 * Almacén (Access: SIE INVENTARIOS › Datos Movimientos): Ingresos y Salidas de almacén.
 * Backend: /api/almacen/ingresos/* y /api/almacen/salidas/* (sesión + permiso por menú; el token lo pone client.ts).
 */
export type TipoMovimiento = 'ingresos' | 'salidas'

export interface OpcionConcepto { Codigo_Op: string; Operacion: string; EsTransferencia?: number }
export interface OpcionDocumento { Cod_Tipo: string; Descripcion: string; Abreviatura: string; PorDefecto: number }
export interface OpcionAlmacen { IdAlmacen: number; Codigo_Alm: string; Descripcion: string }
export interface OpcionCentroCosto { Cod_CC: string; Descripcion: string; PorDefecto?: number }

export interface CatalogosAlmacen {
    conceptos: OpcionConcepto[]
    documentos: OpcionDocumento[]
    series: { Serie_Doc: string }[]
    almacenes: OpcionAlmacen[]
    centrosCosto: OpcionCentroCosto[]
    /** "Unidad Costo" (mgalpon). Ingresos la llama galpones y Salidas unidadesCosto; hoy está vacía. */
    galpones?: { IdGalpon: number; Descripcion: string }[]
    unidadesCosto?: { IdGalpon: number; Descripcion: string }[]
    fechaCierre: string | null
}

export interface PersonaAlmacen { Codigo: string; Nombre: string; NombreComercial?: string | null; RUC?: string | null; Relacion?: string | null; RelacionDescripcion?: string | null }
export interface ArticuloAlmacen { Codigo_Art: string; NombreItem: string; AbrevUnidMed?: string; MueveKardex?: number; Kardex?: number }
export interface LoteConSaldo { Lote: string; MinVctoItem: string | null; SumaDeSaldo: string | number }

export interface FilaListado {
    Codigo_Mvto: number
    Fecha_Mvto: string
    Operacion: string
    Codigo_Doc: string
    Serie_Doc: string
    Nro_Doc: number
    Proveedor?: string
    Cliente?: string
    Almacen: string
    Glosa: string | null
    Items?: number
    Lineas?: number
    CantidadTotal: string | number
    CostoTotal?: string | number
    Transferencia?: string
    AlmacenesDestino?: string | null
}

/** Línea del detalle tal como la edita la pantalla. */
export interface LineaNota {
    clave: string
    id: number | null
    marcada: boolean
    codigoArt: string
    articulo: string
    unidad: string
    cantidad: string
    costoTotal: string
    lote: string
    fechaVcto: string
    centroCostos: string
    almacenDestino: string
    /** "Unidad Costo" / "Und Costo" (idGalpon). */
    idGalpon: string
}

export interface NotaParaGuardar {
    fecha: string
    concepto: string
    documento: string
    serie: string
    numero: number | null
    proveedor?: string
    cliente?: string
    almacen: number | null
    /** Salidas: "UndCosto Transferencia" (idUndCosto). */
    undCosto?: number | null
    observaciones: string
    detalle: Partial<LineaNota>[]
}

const base = (t: TipoMovimiento) => `/almacen/${t}`

export const AlmacenService = {
    catalogos: async (t: TipoMovimiento): Promise<CatalogosAlmacen> => (await apiClient.get(`${base(t)}/catalogos`)).data.data,
    personas: async (t: TipoMovimiento, buscar: string): Promise<PersonaAlmacen[]> =>
        (await apiClient.get(`${base(t)}/${t === 'ingresos' ? 'proveedores' : 'clientes'}`, { params: { buscar, limite: 30 } })).data.data ?? [],
    articulos: async (t: TipoMovimiento, buscar: string): Promise<ArticuloAlmacen[]> =>
        (await apiClient.get(`${base(t)}/articulos`, { params: { buscar, limite: 30 } })).data.data ?? [],
    lotes: async (articulo: string, almacen: number, excluir?: number | null): Promise<LoteConSaldo[]> =>
        (await apiClient.get(`/almacen/salidas/lotes`, { params: { articulo, almacen, excluir: excluir || undefined } })).data.data ?? [],
    siguienteNumero: async (t: TipoMovimiento, documento: string, serie: string): Promise<number> =>
        (await apiClient.get(`${base(t)}/siguiente-numero`, { params: { documento, serie } })).data.data.numero,
    listar: async (t: TipoMovimiento, f: { desde?: string; hasta?: string; buscar?: string; concepto?: string; almacen?: string }): Promise<FilaListado[]> =>
        (await apiClient.get(base(t), { params: { ...f, limite: 500 } })).data.data.filas ?? [],
    obtener: async (t: TipoMovimiento, id: number): Promise<{ cabecera: any; detalle: any[] }> => (await apiClient.get(`${base(t)}/${id}`)).data.data,
    reporte: async (t: TipoMovimiento, id: number): Promise<any[]> => (await apiClient.get(`${base(t)}/${id}/reporte`)).data.data ?? [],
    guardar: async (t: TipoMovimiento, id: number | null, nota: NotaParaGuardar): Promise<{ message: string; data: any }> => {
        const r = id ? await apiClient.put(`${base(t)}/${id}`, nota) : await apiClient.post(base(t), nota)
        return { message: r.data.message, data: r.data.data }
    },
    eliminarDetalle: async (t: TipoMovimiento, id: number, ids: number[]) => (await apiClient.post(`${base(t)}/${id}/eliminar-detalle`, { ids })).data,
    eliminar: async (t: TipoMovimiento, id: number) => (await apiClient.delete(`${base(t)}/${id}`)).data,
}

/** Mensaje del backend (400 de validación) o uno genérico. */
export const mensajeError = (e: any, generico = 'No se pudo completar la operación.') =>
    e?.response?.data?.message || generico
