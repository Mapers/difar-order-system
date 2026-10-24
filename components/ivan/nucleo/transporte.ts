import apiClient from '@/app/api/client'
import type { EventoIvan } from './tipos'

/** La sesión venció o no hay token: hay que volver a iniciar sesión. */
export class SesionVencidaError extends Error {}

interface Pedido {
    texto: string
    /** Identifica la conversación: el backend la guarda completa para seguir el hilo. */
    conversacionId: string
    historial: { role: 'user' | 'assistant'; content: string }[]
    signal: AbortSignal
    alEvento: (evento: EventoIvan) => void
}

/**
 * Conexión con IVAN (adaptador del streaming SSE). Manda el token de la sesión:
 * el backend saca de ahí quién pregunta y sus permisos, no del cuerpo.
 */
export async function conversarConIvan({ texto, conversacionId, historial, signal, alEvento }: Pedido) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) throw new SesionVencidaError()

    const res = await fetch(`${apiClient.defaults.baseURL}/ivan/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: texto, conversacion_id: conversacionId, historial }),
        signal,
    })

    if (res.status === 401) throw new SesionVencidaError()
    if (res.status === 429) {
        const cuerpo = await res.json().catch(() => null)
        alEvento({ type: 'error', content: cuerpo?.message || 'Demasiadas consultas seguidas. Espera un momento.' })
        return
    }
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lineas = buffer.split('\n')
        buffer = lineas.pop() ?? ''

        for (const linea of lineas) {
            const t = linea.trim()
            if (!t.startsWith('data: ')) continue
            try { alEvento(JSON.parse(t.slice(6)) as EventoIvan) } catch { /* línea incompleta */ }
        }
    }
}
