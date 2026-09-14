'use client'

import { useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Send, Square } from 'lucide-react'
import { TextoConComprobantes } from './TextoConComprobantes'
import { CotizacionCard } from './CotizacionCard'
import type { Mensaje, OpcionIvan } from '@/app/hooks/useIvanChat'

function etiquetaOpcion(o: OpcionIvan) {
    const principal = o.nombre_comercial || o.nombre || o.producto || o.codigo || ''

    const identificador = o.ruc || o.codigo || ''
    const razonSocial = o.nombre_comercial && o.nombre ? o.nombre : ''
    const secundario = [razonSocial, identificador, o.presentacion].filter(Boolean).join(' · ')

    return { principal, secundario }
}

function textoDeOpcion(o: OpcionIvan) {
    const id = o.ruc || o.codigo
    const nombre = o.nombre_comercial || o.nombre || o.producto || ''
    if (id && nombre) return `Me refiero a ${nombre} (${id})`
    return `Me refiero a ${nombre || id}`
}

interface Props {
    mensajes: Mensaje[]
    entrada: string
    setEntrada: (v: string) => void
    pensando: boolean
    herramienta: string | null
    enviar: (texto?: string) => void
    detener: () => void
    amplio?: boolean
    autoFocus?: boolean
}

export function ChatConversacion({
    mensajes, entrada, setEntrada, pensando, herramienta, enviar, detener,
    amplio = false, autoFocus = false,
}: Props) {
    const finRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, [mensajes, herramienta])

    useEffect(() => {
        if (autoFocus && window.matchMedia('(min-width: 640px)').matches) {
            inputRef.current?.focus()
        }
    }, [autoFocus])

    const anchoBurbuja = amplio ? 'max-w-[75%]' : 'max-w-[85%]'

    return (
        <>
            <div className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-3">
                {mensajes.map((m, i) => (
                    <div key={i} className="space-y-2">
                        <div className={`flex ${m.rol === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`${anchoBurbuja} whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                                    m.rol === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'border border-border bg-background text-foreground'
                                }`}
                            >
                                {m.texto
                                    ? (m.rol === 'ivan'
                                        ? <TextoConComprobantes texto={m.texto} />
                                        : m.texto)
                                    : (pensando && i === mensajes.length - 1 && !herramienta
                                        ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        : null)}
                            </div>
                        </div>

                        {m.rol === 'ivan' && m.cotizacion && (
                            <div className={amplio ? 'max-w-lg pl-1' : 'pl-1'}>
                                <CotizacionCard cotizacion={m.cotizacion} />
                            </div>
                        )}

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
                                            className="max-w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-left text-xs text-blue-800 transition hover:border-blue-400 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:border-blue-700 dark:hover:bg-blue-950/50"
                                        >
                                            <span className="block font-medium leading-tight">{principal}</span>
                                            {secundario && (
                                                <span className="mt-0.5 block text-blue-600/70 dark:text-blue-400/70">
                                                    {secundario}
                                                </span>
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
                    className="text-base sm:text-sm"
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
        </>
    )
}
