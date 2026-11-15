import apiClient from '@/app/api/client'
import { cabeceraSesion } from '@/app/api/sesion'
import { TomaCabecera, TomaCombos, TomaConteoLote, TomaCrear, TomaDetalle, TomaEtiquetaLeida, TomaListado, TomaLoteBuscado, TomaLotes } from '@/app/types/toma-inventario-types'

/**
 * Toma de inventario: /api/inventario/toma.
 * Reportes (solo lectura) y tomas del usuario (cada uno ve solo las suyas).
 */
export const TomaInventarioService = {
    combos: async (): Promise<TomaCombos> => {
        const res = await apiClient.get('/inventario/toma/combos', { headers: cabeceraSesion() })
        return res.data?.data ?? { laboratorios: [], almacenes: [] }
    },
    listado: async (laboratorio?: string): Promise<TomaListado> => {
        const res = await apiClient.get('/inventario/toma/listado', { params: { laboratorio: laboratorio || undefined }, headers: cabeceraSesion() })
        return res.data?.data
    },
    lotes: async (f: { fecha?: string; laboratorio?: string; almacen?: string }): Promise<TomaLotes> => {
        const res = await apiClient.get('/inventario/toma/lotes', {
            params: { fecha: f.fecha || undefined, laboratorio: f.laboratorio || undefined, almacen: f.almacen || undefined },
            headers: cabeceraSesion(),
        })
        return res.data?.data
    },

    historial: async (): Promise<TomaCabecera[]> => {
        const res = await apiClient.get('/inventario/toma/tomas', { headers: cabeceraSesion() })
        return res.data?.data ?? []
    },
    crear: async (datos: TomaCrear): Promise<{ idToma: number; lineas: number }> => {
        const res = await apiClient.post('/inventario/toma/tomas', datos, { headers: cabeceraSesion() })
        return res.data?.data
    },
    obtener: async (idToma: number): Promise<TomaDetalle> => {
        const res = await apiClient.get(`/inventario/toma/tomas/${idToma}`, { headers: cabeceraSesion() })
        return res.data?.data
    },
    guardar: async (idToma: number, conteos: { id: number; conteo: string }[]): Promise<number> => {
        const res = await apiClient.put(`/inventario/toma/tomas/${idToma}/conteos`, { conteos }, { headers: cabeceraSesion() })
        return res.data?.data?.actualizadas ?? 0
    },
    /** Conteo por lote: cantidad + lote + vencimiento por línea. */
    obtenerLotes: async (idToma: number): Promise<TomaConteoLote[]> => {
        const res = await apiClient.get(`/inventario/toma/tomas/${idToma}/lotes`, { headers: cabeceraSesion() })
        return res.data?.data ?? []
    },
    guardarLotes: async (idToma: number, lineas: { id: number; lotes: { lote: string; vencimiento: string | null; cantidad: string }[] }[]): Promise<number> => {
        const res = await apiClient.put(`/inventario/toma/tomas/${idToma}/lotes`, { lineas }, { headers: cabeceraSesion() })
        return res.data?.data?.actualizadas ?? 0
    },
    buscarLote: async (codigo: string, lote: string): Promise<TomaLoteBuscado> => {
        const res = await apiClient.get('/inventario/toma/lote', { params: { codigo, lote }, headers: cabeceraSesion() })
        return res.data?.data
    },
    /** Cámara + IA: lee lote y vencimiento de la foto (no se guarda). */
    leerEtiqueta: async (foto: Blob, datos: { producto: string; lotes: string }): Promise<TomaEtiquetaLeida> => {
        const fd = new FormData()
        fd.append('foto', foto, 'etiqueta.jpg')
        fd.append('producto', datos.producto)
        fd.append('lotes', datos.lotes)
        const res = await apiClient.post('/inventario/toma/leer-etiqueta', fd, { headers: { ...cabeceraSesion(), 'Content-Type': 'multipart/form-data' }, timeout: 60000 })
        return res.data?.data
    },
    cerrar: async (idToma: number): Promise<void> => {
        await apiClient.post(`/inventario/toma/tomas/${idToma}/cerrar`, {}, { headers: cabeceraSesion() })
    },
}
