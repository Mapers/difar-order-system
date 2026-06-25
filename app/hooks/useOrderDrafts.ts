import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/authContext'
import { DraftService } from '@/app/services/drafts/DraftService'

export interface OrderDraft {
    id: string
    savedAt: number
    nombre?: string
    currentStep: number
    search: { client: string; product: string; condition: string }
    selectedClient: any | null
    seller: any | null
    sellerSearch: string
    nameZone: string
    unidadTerritorio: any
    contactoPedido: string
    referenciaDireccion: string
    condition: any | null
    currency: any | null
    selectedProducts: any[]
    productosConLotes: any[]
    note: string
    editedClientData: any
    selectedAlmacen: any | null
}

export function useOrderDrafts() {
    const { user } = useAuth()
    const [savedDrafts, setSavedDrafts] = useState<OrderDraft[]>([])
    const [loading, setLoading] = useState(false)

    const idUsuarioWeb = user?.idUsuarioWeb

    const fetchDrafts = useCallback(async () => {
        if (!idUsuarioWeb) return
        setLoading(true)
        try {
            const drafts = await DraftService.listar(idUsuarioWeb)
            setSavedDrafts(drafts)
        } catch (e) {
            console.error('Error al cargar borradores:', e)
        } finally {
            setLoading(false)
        }
    }, [idUsuarioWeb])

    useEffect(() => {
        fetchDrafts()
    }, [fetchDrafts])

    const saveDraft = async (orderState: Partial<OrderDraft>) => {
        if (!idUsuarioWeb) {
            console.error('[useOrderDrafts] idUsuarioWeb no disponible — verifica que sp_login_usuario retorna idUsuarioWeb y que el token fue renovado')
            return false
        }
        try {
            const { id, savedAt, ...rest } = orderState as OrderDraft
            const newId = await DraftService.crear(idUsuarioWeb, rest)
            const newDraft: OrderDraft = {
                ...rest,
                id: newId,
                savedAt: Date.now(),
            }
            setSavedDrafts(prev => [newDraft, ...prev])
            return true
        } catch (e) {
            console.error('Error al guardar borrador:', e)
            return false
        }
    }

    const deleteDraft = async (id: string) => {
        if (!idUsuarioWeb) return
        try {
            await DraftService.eliminar(idUsuarioWeb, id)
            setSavedDrafts(prev => prev.filter(d => d.id !== id))
        } catch (e) {
            console.error('Error al eliminar borrador:', e)
        }
    }

    return {
        savedDrafts,
        loading,
        saveDraft,
        deleteDraft,
    }
}
