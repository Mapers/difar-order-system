'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { conversarConIvan, SesionVencidaError } from '@/components/ivan/nucleo/transporte'
import { aplicarEvento } from '@/components/ivan/nucleo/eventos'
import type { Mensaje } from '@/components/ivan/nucleo/tipos'

export type { Mensaje, OpcionIvan, AccionIvan } from '@/components/ivan/nucleo/tipos'

const CLAVE_CHAT = 'ivan-claude-conversacion'
const nuevoId = () => Math.random().toString(36).slice(2, 10)

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

    useEffect(() => { setMensajes(leerGuardada()) }, [])
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
    }, [])

    const enviar = useCallback(async (textoForzado?: string) => {
        const texto = (textoForzado ?? entrada).trim()
        if (!texto || pensando) return

        let historial: { role: 'user' | 'assistant'; content: string }[] = []
        setMensajes(prev => {
            historial = prev
                .filter(m => m.texto.trim() && m.estado !== 'error')
                .map(m => ({ role: m.rol === 'user' ? 'user' : 'assistant', content: m.texto }))
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
