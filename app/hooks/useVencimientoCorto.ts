'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/app/api/client'

const POR_DEFECTO = 6

let cache: number | null = null
let enVuelo: Promise<number> | null = null

async function leerMeses(): Promise<number> {
    if (cache !== null) return cache

    if (!enVuelo) {
        enVuelo = apiClient
            .get('/admin/config/vencimiento-corto')
            .then(res => {
                const n = Number(res.data?.data?.[0]?.meses)
                cache = Number.isFinite(n) && n > 0 ? n : POR_DEFECTO
                return cache
            })
            .catch(() => POR_DEFECTO)
            .finally(() => { enVuelo = null })
    }

    return enVuelo
}

export function invalidarVencimientoCorto() {
    cache = null
}

export function useVencimientoCorto(): number {
    const [meses, setMeses] = useState<number>(cache ?? POR_DEFECTO)

    useEffect(() => {
        let vivo = true
        leerMeses().then(v => { if (vivo) setMeses(v) })
        return () => { vivo = false }
    }, [])

    return meses
}
