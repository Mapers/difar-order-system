'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { conversarConIvan, SesionVencidaError } from '@/components/ivan/nucleo/transporte'
import { aplicarEvento } from '@/components/ivan/nucleo/eventos'
import type { Mensaje } from '@/components/ivan/nucleo/tipos'
import { marcarIvanUsado } from '@/components/ivan/LanzadorIvan'

export type { Mensaje, OpcionIvan, AccionIvan } from '@/components/ivan/nucleo/tipos'

const CLAVE_CHAT = 'ivan-claude-conversacion'
const CLAVE_ID = 'ivan-claude-conversacion-id'
const idConversacion = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
const nuevoId = () => Math.random().toString(36).slice(2, 10)

/**
 * Lo que vuelve al backend como historial. Las respuestas de IVAN llevan
 * delante qué consultó y con qué parámetros, para que "el mismo registro" o
 * "ahora a crédito" se resuelvan sin volver a preguntar.
 */
function paraHistorial(m: Mensaje) {
    if (m.rol === 'user' || !m.contexto?.length) return m.texto
    const nota = m.contexto.map(c => `${c.herramienta}(${JSON.stringify(c.parametros)})`).join('; ')
    return `[Consultas: ${nota}]\n${m.texto}`
}

function leerGuardada(): Mensaje[] {
    if (typeof window === 'undefined') return []
    try {
        const datos = JSON.parse(sessionStorage.getItem(CLAVE_CHAT) || '[]')
        // Una respuesta que quedó a medias (se recargó la página) se marca como detenida.
        return Array.isArray(datos)
            ? datos.map((m: Mensaje) => (m.estado && !['listo', 'error', 'detenido'].includes(m.estado) ? { ...m, estado: 'detenido' } : m))
            : []
    } catch {
        return []
    }
}

/** Estado del chat con IVAN: mensajes, envío, detener y limpiar. */
export function useIvanChat() {
    const [mensajes, setMensajes] = useState<Mensaje[]>([])
    const [entrada, setEntrada] = useState('')
    const [pensando, setPensando] = useState(false)
    const abortRef = useRef<AbortController | null>(null)
    // Una conversación = un id. El backend guarda con él todo el hilo.
    const conversacionRef = useRef('')

    useEffect(() => {
        setMensajes(leerGuardada())
        try { conversacionRef.current = sessionStorage.getItem(CLAVE_ID) || '' } catch { /* sin almacenamiento */ }
        if (!conversacionRef.current) conversacionRef.current = idConversacion()
        try { sessionStorage.setItem(CLAVE_ID, conversacionRef.current) } catch { /* sin almacenamiento */ }
    }, [])
    useEffect(() => {
        try { sessionStorage.setItem(CLAVE_CHAT, JSON.stringify(mensajes)) } catch { /* sin almacenamiento */ }
    }, [mensajes])
    useEffect(() => () => abortRef.current?.abort(), [])

    // Actualiza solo la última respuesta de IVAN.
    const actualizarUltima = (cambio: (m: Mensaje) => Mensaje) =>
        setMensajes(prev => {
            const copia = [...prev]
            copia[copia.length - 1] = cambio(copia[copia.length - 1])
            return copia
        })

    const detener = useCallback(() => abortRef.current?.abort(), [])

    const limpiar = useCallback(() => {
        abortRef.current?.abort()
        setMensajes([])
        conversacionRef.current = idConversacion()
        try { sessionStorage.setItem(CLAVE_ID, conversacionRef.current) } catch { /* sin almacenamiento */ }
    }, [])

    const enviar = useCallback(async (textoForzado?: string) => {
        const texto = (textoForzado ?? entrada).trim()
        if (!texto || pensando) return
        marcarIvanUsado()

        let historial: { role: 'user' | 'assistant'; content: string }[] = []
        setMensajes(prev => {
            historial = prev
                .filter(m => m.texto.trim() && m.estado !== 'error')
                .map(m => ({ role: m.rol === 'user' ? 'user' : 'assistant', content: paraHistorial(m) }))
            return [
                ...prev,
                { id: nuevoId(), rol: 'user', texto },
                { id: nuevoId(), rol: 'ivan', texto: '', estado: 'pensando' },
            ]
        })
        setEntrada('')
        setPensando(true)

        const control = new AbortController()
        abortRef.current = control

        try {
            await conversarConIvan({
                texto,
                conversacionId: conversacionRef.current || idConversacion(),
                historial,
                signal: control.signal,
                alEvento: evento => actualizarUltima(m => aplicarEvento(m, evento)),
            })
            actualizarUltima(m => {
                if (m.estado === 'error') return m
                if (!m.texto) return { ...m, texto: 'No recibí respuesta. Intenta de nuevo.', estado: 'error' }
                return { ...m, estado: 'listo' }
            })
        } catch (error: any) {
            if (error?.name === 'AbortError') {
                actualizarUltima(m => ({ ...m, estado: 'detenido' }))
            } else if (error instanceof SesionVencidaError) {
                actualizarUltima(m => ({ ...m, estado: 'error', texto: 'Tu sesión venció. Vuelve a iniciar sesión para seguir usando a IVAN.' }))
            } else {
                console.error('[IVAN] Error en la consulta:', error)
                actualizarUltima(m => ({ ...m, estado: 'error', texto: 'No pude conectarme con IVAN. Revisa tu conexión e intenta de nuevo.' }))
            }
        } finally {
            abortRef.current = null
            setPensando(false)
        }
    }, [entrada, pensando])

    return { mensajes, entrada, setEntrada, pensando, enviar, detener, limpiar }
}
