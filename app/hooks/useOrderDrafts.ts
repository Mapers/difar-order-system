import { useState, useEffect } from "react"

const DRAFTS_KEY = "order_drafts"

export interface OrderDraft {
    id: string
    savedAt: number
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
}

export function useOrderDrafts() {
    const [savedDrafts, setSavedDrafts] = useState<OrderDraft[]>([])

    useEffect(() => {
        const drafts = localStorage.getItem(DRAFTS_KEY)
        if (drafts) {
            try {
                setSavedDrafts(JSON.parse(drafts))
            } catch (e) {
                console.error("Error parsing drafts:", e)
            }
        }
    }, [])

    const saveDraft = (orderState: Partial<OrderDraft>) => {
        const newDraft: OrderDraft = {
            ...orderState,
            id: Date.now().toString(),
            savedAt: Date.now(),
        } as OrderDraft

        const updatedDrafts = [newDraft, ...savedDrafts]
        setSavedDrafts(updatedDrafts)
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts))
    }

    const deleteDraft = (id: string) => {
        const updatedDrafts = savedDrafts.filter(draft => draft.id !== id)
        setSavedDrafts(updatedDrafts)
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts))
    }

    return {
        savedDrafts,
        saveDraft,
        deleteDraft
    }
}