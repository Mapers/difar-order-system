'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Loader2, Send, Square, X } from 'lucide-react'
import { useAuth } from '@/context/authContext'
import apiClient from '@/app/api/client'

interface OpcionIvan {
    codigo?: string
    ruc?: string
    nombre?: string
    nombre_comercial?: string
    producto?: string
    presentacion?: string
}

interface Mensaje {
    rol: 'user' | 'ivan'
    texto: string
    opciones?: OpcionIvan[]
}

function etiquetaOpcion(o: OpcionIvan) {
    const principal = o.nombre_comercial || o.nombre || o.producto || o.codigo || ''
    const secundario = o.nombre_comercial && o.nombre ? o.nombre : (o.presentacion || '')
    return { principal, secundario }
}

function textoDeOpcion(o: OpcionIvan) {
    const id = o.ruc || o.codigo
    const nombre = o.nombre_comercial || o.nombre || o.producto || ''
    if (id && nombre) return `Me refiero a ${nombre} (${id})`
    return `Me refiero a ${nombre || id}`
}

const BIENVENIDA =
    'Hola, soy IVAN. Puedo consultar el estado de cuenta de un cliente, sus comprobantes, ' +
    'los datos de un producto con su kardex, o la ficha de un cliente. ¿Qué necesitas?'

export function IvanWidget() {
    const { user, isAuthenticated, isVendedor, isRepresentante } = useAuth()

    const [abierto, setAbierto] = useState(false)
    const [mensajes, setMensajes] = useState<Mensaje[]>([{ rol: 'ivan', texto: BIENVENIDA }])
    const [entrada, setEntrada] = useState('')
    const [pensando, setPensando] = useState(false)
    const [herramienta, setHerramienta] = useState<string | null>(null)

    const finRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const abortRef = useRef<AbortController | null>(null)

    const detener = () => abortRef.current?.abort()

    useEffect(() => () => abortRef.current?.abort(), [])

    useEffect(() => {
        finRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [mensajes, herramienta])

    useEffect(() => {
        if (abierto) inputRef.current?.focus()
    }, [abierto])

    const enviar = async (textoForzado?: string) => {
        const texto = (textoForzado ?? entrada).trim()
        if (!texto || pensando) return

        const historial = mensajes
            .slice(1)
            .filter(m => m.texto.trim().length > 0)
            .map(m => ({ role: m.rol === 'user' ? 'user' : 'assistant', content: m.texto }))

        setEntrada('')
        setMensajes(prev => [...prev, { rol: 'user', texto }, { rol: 'ivan', texto: '' }])
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
                    } else if (evento.type === 'opciones') {
                        setMensajes(prev => {
                            const copia = [...prev]
                            copia[copia.length - 1] = {
                                ...copia[copia.length - 1],
                                opciones: evento.opciones,
                            }
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
                        texto: parcial
                            ? `${parcial}\n\n_(respuesta detenida)_`
                            : '_(respuesta detenida)_',
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
    }

    if (!isAuthenticated) return null

    return (
        <div className="fixed bottom-6 right-6 z-50 hidden lg:block">
            {abierto && (
                <div className="mb-3 flex h-[540px] w-[400px] flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
                    <div className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white">
                        <div className="flex items-center gap-2">
                            <Bot className="h-5 w-5" />
                            <div>
                                <p className="text-sm font-semibold leading-tight">IVAN</p>
                                <p className="text-[11px] leading-tight text-blue-100">
                                    Inteligencia Virtual de Atención y Negocios
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setAbierto(false)}
                            className="rounded p-1 transition hover:bg-blue-700"
                            title="Minimizar"
                            aria-label="Minimizar el chat"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-3">
                        {mensajes.map((m, i) => (
                            <div key={i} className="space-y-2">
                                <div className={`flex ${m.rol === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                                            m.rol === 'user'
                                                ? 'bg-blue-600 text-white'
                                                : 'border border-border bg-background text-foreground'
                                        }`}
                                    >
                                        {m.texto || (pensando && i === mensajes.length - 1 && !herramienta
                                            ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            : m.texto)}
                                    </div>
                                </div>

                                {m.rol === 'ivan' && m.opciones && m.opciones.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pl-1">
                                        {m.opciones.map((o, j) => {
                                            const { principal, secundario } = etiquetaOpcion(o)
                                            return (
                                                <button
                                                    key={j}
                                                    type="button"
                                                    disabled={pensando}
                                                    onClick={() => enviar(textoDeOpcion(o))}
                                                    title={textoDeOpcion(o)}
                                                    className="max-w-full rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-left text-xs text-blue-800 transition hover:border-blue-400 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <span className="font-medium">{principal}</span>
                                                    {secundario && (
                                                        <span className="ml-1 text-blue-600/70">· {secundario}</span>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}

                        {herramienta && (
                            <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                {herramienta}
                            </div>
                        )}

                        <div ref={finRef} />
                    </div>

                    <div className="flex items-center gap-2 border-t border-border bg-background p-3">
                        <Input
                            ref={inputRef}
                            value={entrada}
                            onChange={(e) => setEntrada(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
                            placeholder="Pregunta por un cliente o un producto..."
                            disabled={pensando}
                            className="text-sm"
                        />
                        {pensando ? (
                            <Button
                                size="icon"
                                onClick={detener}
                                className="shrink-0 bg-red-600 hover:bg-red-700"
                                title="Detener la respuesta"
                                aria-label="Detener la respuesta"
                            >
                                <Square className="h-3.5 w-3.5 fill-current" />
                            </Button>
                        ) : (
                            <Button
                                size="icon"
                                onClick={() => enviar()}
                                disabled={!entrada.trim()}
                                className="shrink-0 bg-blue-600 hover:bg-blue-700"
                                title="Enviar"
                                aria-label="Enviar"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {!abierto && (
                <button
                    onClick={() => setAbierto(true)}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition hover:scale-105 hover:bg-blue-700"
                    title="Abrir IVAN"
                    aria-label="Abrir el asistente IVAN"
                >
                    <Bot className="h-6 w-6" />
                </button>
            )}
        </div>
    )
}
