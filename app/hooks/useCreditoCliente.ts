'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/app/api/client'

/** Lo que devuelve GET /clientes/credito (sp_ws_credito_cliente). */
export interface CreditoCliente {
    codigo:               string
    nombre:               string
    tipoDocumento:        string
    numeroDocumento:      string
    estadoCliente:        string
    lineaCredito:         number
    usado:                number
    disponible:           number
    documentosPendientes: number
    usadoDolares:         number
}

/** RUC (11 dígitos) = '06', DNI (8 dígitos) = '01'; lo demás se deja que lo resuelva el backend. */
export const tipoDocumentoDe = (numero: string) => {
    const n = String(numero ?? '').trim()
    if (/^\d{11}$/.test(n)) return '06'
    if (/^\d{8}$/.test(n)) return '01'
    return ''
}

/** Sin línea asignada o con el cliente inactivo no hay crédito que usar. */
export const tieneCreditoActivo = (c: CreditoCliente | null) =>
    !!c && Number(c.lineaCredito) > 0 && String(c.estadoCliente ?? '').toUpperCase() !== 'INACTIVO'

/**
 * Línea de crédito del cliente según el backend: asignada, usada y disponible.
 * Se consulta una vez por cliente elegido.
 */
export function useCreditoCliente(numeroDocumento?: string | null) {
    const [credito, setCredito] = useState<CreditoCliente | null>(null)
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState(false)

    useEffect(() => {
        const numero = String(numeroDocumento ?? '').trim()
        setCredito(null); setError(false)
        if (!numero) return
        let vivo = true
        setCargando(true)
        apiClient.get('/clientes/credito', { params: { tipoDocumento: tipoDocumentoDe(numero), numeroDocumento: numero } })
            .then(res => {
                if (!vivo) return
                const d = res.data?.data
                setCredito(d ? {
                    ...d,
                    lineaCredito: Number(d.lineaCredito) || 0,
                    usado: Number(d.usado) || 0,
                    disponible: Number(d.disponible) || 0,
                    documentosPendientes: Number(d.documentosPendientes) || 0,
                    usadoDolares: Number(d.usadoDolares) || 0,
                } : null)
            })
            .catch(() => { if (vivo) setError(true) })
            .finally(() => { if (vivo) setCargando(false) })
        return () => { vivo = false }
    }, [numeroDocumento])

    return { credito, cargando, error }
}
