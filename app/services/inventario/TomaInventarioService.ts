import apiClient from '@/app/api/client'
import { cabeceraSesion } from '@/app/api/sesion'
import { TomaCombos, TomaListado, TomaLotes } from '@/app/types/toma-inventario-types'

/** Toma de inventario (solo lectura): /api/inventario/toma. */
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
}
