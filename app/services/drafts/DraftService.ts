import apiClient from '@/app/api/client'
import { OrderDraft } from '@/app/hooks/useOrderDrafts'

export const DraftService = {
    listar: async (idUsuarioWeb: number): Promise<OrderDraft[]> => {
        const res = await apiClient.get('/borradores', {
            params: { id_usuario_web: idUsuarioWeb }
        })
        const rows: any[] = res.data?.data?.data ?? []
        return rows.map(row => ({
            ...JSON.parse(row.estado_json),
            id: String(row.id),
            savedAt: new Date(row.creado_en).getTime(),
            nombre: row.nombre,
        }))
    },

    crear: async (idUsuarioWeb: number, draft: Omit<OrderDraft, 'id' | 'savedAt'>): Promise<string> => {
        const nombre = (draft as any).selectedClient?.Nombre ?? null
        const res = await apiClient.post('/borradores', {
            id_usuario_web: idUsuarioWeb,
            nombre,
            estado_json: JSON.stringify(draft),
        })
        return String(res.data?.data?.id)
    },

    /**
     * Pisa un borrador existente. Es lo que hace posible el autoguardado:
     * sin esto, cada acción del wizard crearía una fila nueva.
     *
     * Devuelve false SOLO si el borrador ya no existe (404). Cualquier otro
     * fallo (red, 500) se propaga: ahí no hay que recrear nada, porque
     * recrear ante un timeout duplicaría el borrador.
     */
    actualizar: async (idUsuarioWeb: number, id: string, draft: Omit<OrderDraft, 'id' | 'savedAt'>): Promise<boolean> => {
        const nombre = (draft as any).selectedClient?.Nombre ?? null
        try {
            await apiClient.put(`/borradores/${id}`, {
                id_usuario_web: idUsuarioWeb,
                nombre,
                estado_json: JSON.stringify(draft),
            })
            return true
        } catch (e: any) {
            if (e?.response?.status === 404) return false
            throw e
        }
    },

    eliminar: async (idUsuarioWeb: number, id: string): Promise<void> => {
        await apiClient.delete(`/borradores/${id}`, {
            params: { id_usuario_web: idUsuarioWeb }
        })
    },

    limpiar: async (idUsuarioWeb: number): Promise<void> => {
        await apiClient.delete('/borradores/limpiar', {
            params: { id_usuario_web: idUsuarioWeb }
        })
    },
}
