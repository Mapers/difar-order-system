'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import apiClient from '@/app/api/client'
import { useAuth } from '@/context/authContext'
import type { Cotizacion } from '@/components/ivan/CotizacionCard'

export interface OpcionIvan {
    codigo?: string
    ruc?: string
    nombre?: string
    nombre_comercial?: string
    producto?: string
    presentacion?: string
}

export interface Mensaje {
    rol: 'user' | 'ivan'
    texto: string
    opciones?: OpcionIvan[]
    cotizacion?: Cotizacion
}

export const BIENVENIDA =
    'Hola, soy IVAN. Puedo consultar el estado de cuenta de un cliente, sus comprobantes, ' +
    'los datos de un producto con su kardex, o la ficha de un cliente. ¿Qué necesitas?'

const CLAVE_CHAT = 'ivan-conversacion'

function leerGuardada(): Mensaje[] {
    if (typeof window === 'undefined') return [{ rol: 'ivan', texto: BIENVENIDA }]
    try {
        const crudo = sessionStorage.getItem(CLAVE_CHAT)
        if (!crudo) return [{ rol: 'ivan', texto: BIENVENIDA }]
        const datos = JSON.parse(crudo)
        return Array.isArray(datos) && datos.length > 0 ? datos : [{ rol: 'ivan', texto: BIENVENIDA }]
    } catch {
        return [{ rol: 'ivan', texto: BIENVENIDA }]
    }
}

export function useIvanChat() {
    const { user, isVendedor, isRepresentante } = useAuth()

    const [mensajes, setMensajes] = useState<Mensaje[]>([{ rol: 'ivan', texto: BIENVENIDA }])
    const [entrada, setEntrada] = useState('')
    const [pensando, setPensando] = useState(false)
    const [herramienta, setHerramienta] = useState<string | null>(null)

    const abortRef = useRef<AbortController | null>(null)

    useEffect(() => { setMensajes(leerGuardada()) }, [])

    useEffect(() => {
        try { sessionStorage.setItem(CLAVE_CHAT, JSON.stringify(mensajes)) } catch {}
    }, [mensajes])

    useEffect(() => () => abortRef.current?.abort(), [])

    const detener = useCallback(() => abortRef.current?.abort(), [])

    const limpiar = useCallback(() => {
        abortRef.current?.abort()
        setMensajes([{ rol: 'ivan', texto: BIENVENIDA }])
    }, [])

    const enviar = useCallback(async (textoForzado?: string) => {
        const texto = (textoForzado ?? entrada).trim()
        if (!texto || pensando) return

        let historial: { role: string; content: string }[] = []
        setMensajes(prev => {
            historial = prev
                .slice(1)
                .filter(m => m.texto.trim().length > 0)
                .map(m => ({ role: m.rol === 'user' ? 'user' : 'assistant', content: m.texto }))
            return [...prev, { rol: 'user', texto }, { rol: 'ivan', texto: '' }]
        })

        setEntrada('')
        setPensando(true)
        setHerramienta(null)

        const control = new AbortController()
        abortRef.current = control

        try {
            const res = await fetch(`${apiClient.defaults.baseURL}/chat/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: texto,
                    historial,
                    vendedor: isVendedor() ? user?.codigo ?? null : null,
                    representante: isRepresentante() ? user?.codRepres ?? null : null,
                }),
                signal: control.signal,
            })

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

                    let evento: any
                    try { evento = JSON.parse(t.slice(6)) } catch { continue }

                    if (evento.type === 'token') {
                        setHerramienta(null)
                        setMensajes(prev => {
                            const copia = [...prev]
                            copia[copia.length - 1] = {
                                ...copia[copia.length - 1],
                                rol: 'ivan',
                                texto: copia[copia.length - 1].texto + evento.content,
                            }
                            return copia
                        })
                    } else if (evento.type === 'tool') {
                        setHerramienta(evento.etiqueta || 'Consultando...')
                    } else if (evento.type === 'cotizacion') {
                        setMensajes(prev => {
                            const copia = [...prev]
                            copia[copia.length - 1] = { ...copia[copia.length - 1], cotizacion: evento.cotizacion }
                            return copia
                        })
                    } else if (evento.type === 'opciones') {
                        setMensajes(prev => {
                            const copia = [...prev]
                            copia[copia.length - 1] = { ...copia[copia.length - 1], opciones: evento.opciones }
                            return copia
                        })
                    } else if (evento.type === 'error') {
                        setMensajes(prev => {
                            const copia = [...prev]
                            copia[copia.length - 1] = { rol: 'ivan', texto: evento.content }
                            return copia
                        })
                    }
                }
            }

            setMensajes(prev => {
                const copia = [...prev]
                if (!copia[copia.length - 1].texto) {
                    copia[copia.length - 1] = { rol: 'ivan', texto: 'No recibí respuesta. Intenta de nuevo.' }
                }
                return copia
            })
        } catch (error: any) {
            if (error?.name === 'AbortError') {
                setMensajes(prev => {
                    const copia = [...prev]
                    const parcial = copia[copia.length - 1].texto
                    copia[copia.length - 1] = {
                        ...copia[copia.length - 1],
                        rol: 'ivan',
                        texto: parcial ? `${parcial}\n\n_(respuesta detenida)_` : '_(respuesta detenida)_',
                    }
                    return copia
                })
            } else {
                console.error('[IVAN] Error en la consulta:', error)
                setMensajes(prev => {
                    const copia = [...prev]
                    copia[copia.length - 1] = {
                        rol: 'ivan',
                        texto: 'No pude conectarme con el asistente. Revisa tu conexión e intenta de nuevo.',
                    }
                    return copia
                })
            }
        } finally {
            abortRef.current = null
            setPensando(false)
            setHerramienta(null)
        }
    }, [entrada, pensando, user, isVendedor, isRepresentante])

    return { mensajes, entrada, setEntrada, pensando, herramienta, enviar, detener, limpiar }
}
