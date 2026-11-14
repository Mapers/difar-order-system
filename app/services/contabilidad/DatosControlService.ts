import apiClient from '@/app/api/client'
import { cabeceraSesion } from '@/app/api/sesion'
import { ClaveCatalogo, CombosDatosControl, FilaCatalogo, UsoRegistro } from '@/app/types/datos-control-types'

/**
 * Datos de Control — Catálogos (/api/contabilidad/datos-control). Requiere sesión.
 * El backend decide qué catálogos existen, qué campos acepta y quién puede grabar.
 */
const BASE = '/contabilidad/datos-control'
const cfg = () => ({ headers: cabeceraSesion() })

export const DatosControlService = {
    combos: async (): Promise<CombosDatosControl> => (await apiClient.get(`${BASE}/combos`, cfg())).data?.data,

    listar: async (catalogo: ClaveCatalogo): Promise<FilaCatalogo[]> =>
        (await apiClient.get(`${BASE}/${catalogo}`, cfg())).data?.data ?? [],

    /** Dónde se usa el registro. centro-costos, zona y serie se revisan por su código. */
    uso: async (catalogo: ClaveCatalogo, id: string | number, codigo?: string | number | null): Promise<UsoRegistro[]> =>
        (await apiClient.get(`${BASE}/${catalogo}/${encodeURIComponent(String(id))}/uso`,
            { ...cfg(), params: codigo !== undefined && codigo !== null ? { codigo: String(codigo) } : undefined })).data?.data ?? [],

    /** Alta (id = null) o modificación (id = id / código anterior). */
    guardar: async (catalogo: ClaveCatalogo, id: string | number | null, datos: Record<string, unknown>) =>
        (await apiClient.post(`${BASE}/${catalogo}`, { id, datos }, cfg())).data?.data,

    eliminar: async (catalogo: ClaveCatalogo, id: string | number) =>
        (await apiClient.delete(`${BASE}/${catalogo}/${encodeURIComponent(String(id))}`, cfg())).data?.data,
}
