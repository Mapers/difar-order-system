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
