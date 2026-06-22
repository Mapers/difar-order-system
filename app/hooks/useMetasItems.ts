'use client'

import { useState, useEffect } from "react"
import { IItemDashboard } from "@/app/types/metas-types"
import { MetasService } from "@/app/services/reports/metasService"

function unwrap(arr: any): any[] {
    if (!arr) return []
    return Array.isArray(arr[0]) ? arr[0] : Array.isArray(arr) ? arr : []
}

export function useMetasItems(codVendedor: string | null | undefined) {
    const [metasMap, setMetasMap] = useState<Map<string, IItemDashboard> | null>(null)

    useEffect(() => {
        if (!codVendedor) {
            setMetasMap(null)
            return
        }

        let cancelled = false

        const load = async () => {
            try {
                const ciclosRes = await MetasService.listarCiclos()
                if (cancelled) return

                const ciclos = ciclosRes?.data?.data || []
                const abierto = ciclos.find((c: any) => c.estado === 'ABIERTO')
                if (!abierto || cancelled) return

                const res = await MetasService.getDashboard(abierto.id_ciclo, codVendedor, undefined)
                if (cancelled) return

                const items: IItemDashboard[] = unwrap(res?.data?.items)
                const map = new Map<string, IItemDashboard>()
                for (const item of items) {
                    if (item.cod_articulo) map.set(item.cod_articulo, item)
                }
                setMetasMap(map)
            } catch {
                setMetasMap(null)
            }
        }

        load()
        return () => { cancelled = true }
    }, [codVendedor])

    return metasMap
}
