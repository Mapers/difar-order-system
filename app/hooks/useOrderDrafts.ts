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

    /** Crea un borrador nuevo. Devuelve su id, o null si falló. */
    const saveDraft = async (orderState: Partial<OrderDraft>): Promise<string | null> => {
        if (!idUsuarioWeb) {
            console.error('[useOrderDrafts] idUsuarioWeb no disponible — verifica que sp_login_usuario retorna idUsuarioWeb y que el token fue renovado')
            return null
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
            return newId
        } catch (e) {
            console.error('Error al guardar borrador:', e)
            return null
        }
    }

    /**
     * Pisa un borrador existente.
     * Devuelve 'ok' | 'gone' (ya no existe) | 'error' (red / servidor).
     * La distinción importa: ante 'gone' hay que recrear, ante 'error' NO
     * — recrear tras un timeout duplicaría el borrador.
     */
    const updateDraft = async (id: string, orderState: Partial<OrderDraft>): Promise<'ok' | 'gone' | 'error'> => {
        if (!idUsuarioWeb) return 'error'
        try {
            const { id: _id, savedAt: _savedAt, ...rest } = orderState as OrderDraft
            const ok = await DraftService.actualizar(idUsuarioWeb, id, rest)
            if (!ok) return 'gone'
            setSavedDrafts(prev => prev.map(d =>
                d.id === id ? { ...rest, id, savedAt: Date.now() } : d
            ))
            return 'ok'
        } catch (e) {
            console.error('Error al actualizar borrador:', e)
            return 'error'
        }
    }

    /**
     * Crea si no hay id, actualiza si lo hay. Devuelve el id vigente.
     * Es lo que usa el autoguardado para no ir dejando una fila por acción.
     *
     * Si el borrador desapareció (el tope de 10 de sp_pbl_borrador_crear lo
     * puede evaporar desde otra pestaña), lo recrea en vez de perder el
     * trabajo en silencio.
     */
    const upsertDraft = async (id: string | null, orderState: Partial<OrderDraft>): Promise<string | null> => {
        if (!id) return saveDraft(orderState)
        const res = await updateDraft(id, orderState)
        if (res === 'ok')   return id
        if (res === 'gone') return saveDraft(orderState)
        return null
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
        updateDraft,
        upsertDraft,
        deleteDraft,
    }
}
