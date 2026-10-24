'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowUp, Square } from 'lucide-react'
import { AvatarIvan } from './AvatarIvan'
import { ActividadIvan } from './ActividadIvan'
import { BienvenidaIvan } from './BienvenidaIvan'
import { TextoIvan } from './TextoIvan'
import { CotizacionCard } from './CotizacionCard'
import { BotonesAccion } from './acciones/BotonesAccion'
import { TablaIvan } from './TablaIvan'
import { ComprobantePdfModal } from '@/app/dashboard/comprobantes/modals/ComprobantePdfModal'
import type { Mensaje, OpcionIvan } from './nucleo/tipos'

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
    enviar: (texto?: string) => void
    detener: () => void
    amplio?: boolean
    autoFocus?: boolean
}

function RespuestaIvan({ m, ultimo, pensando, enviar, amplio, verPdf }: {
    m: Mensaje; ultimo: boolean; pensando: boolean; enviar: (t: string) => void; amplio: boolean; verPdf: (n: string) => void
}) {
    const router = useRouter()
    const trabajando = ultimo && pensando
    const escribiendo = trabajando && m.estado === 'escribiendo'
    const ancho = amplio ? 'max-w-[80%]' : 'max-w-[88%]'

    return (
        <div className="flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <AvatarIvan activo={trabajando} tamano="sm" />
            <div className={`min-w-0 flex-1 space-y-2 ${ancho}`}>
                <ActividadIvan consultas={m.consultas} estado={trabajando ? m.estado : undefined} />

                {m.texto && (
                    <div className={`w-fit max-w-full rounded-2xl rounded-tl-md border px-3.5 py-2.5 shadow-sm ${
                        m.estado === 'error'
                            ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
                            : 'border-border bg-background text-foreground'}`}>
                        {m.estado === 'error'
                            ? <p className="flex items-start gap-2 text-sm"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{m.texto}</p>
                            : <TextoIvan texto={m.texto} escribiendo={escribiendo} />}
                        {m.estado === 'detenido' && <p className="mt-1.5 text-[11px] italic text-muted-foreground">Respuesta detenida</p>}
                    </div>
                )}
                {!m.texto && m.estado === 'detenido' && <p className="text-xs italic text-muted-foreground">Respuesta detenida</p>}

                {m.cotizacion && <div className={amplio ? 'max-w-lg' : ''}><CotizacionCard cotizacion={m.cotizacion} /></div>}

                {m.tablas?.map((t, j) => <TablaIvan key={j} tabla={t} />)}

                {m.opciones && m.opciones.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {m.opciones.map((o, j) => {
                            const { principal, secundario } = etiquetaOpcion(o)
                            return (
                                <button key={j} type="button" disabled={pensando} onClick={() => enviar(textoDeOpcion(o))}
                                        title={textoDeOpcion(o)} style={{ animationDelay: `${j * 60}ms` }}
                                        className="max-w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-left text-xs text-blue-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md animate-in fade-in slide-in-from-bottom-1 fill-mode-both disabled:opacity-50 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300">
                                    <span className="block font-medium leading-tight">{principal}</span>
                                    {secundario && <span className="mt-0.5 block text-blue-600/70 dark:text-blue-400/70">{secundario}</span>}
                                </button>
                            )
                        })}
                    </div>
                )}

                {m.acciones && m.acciones.length > 0 && m.estado !== 'escribiendo' && (
                    <BotonesAccion acciones={m.acciones} deshabilitado={pensando}
                                   deps={{ enviar, navegar: ruta => router.push(ruta), verPdf }} />
                )}
            </div>
        </div>
    )
}

export function ChatConversacion({ mensajes, entrada, setEntrada, pensando, enviar, detener, amplio = false, autoFocus = false }: Props) {
    const finRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const [pdfComprobante, setPdfComprobante] = useState<string | null>(null)

    useEffect(() => {
        finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, [mensajes])

    useEffect(() => {
        if (autoFocus && window.matchMedia('(min-width: 640px)').matches) inputRef.current?.focus()
    }, [autoFocus])

    // El cuadro de texto crece con el mensaje, hasta 5 líneas.
    useEffect(() => {
        const el = inputRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`
    }, [entrada])

    return (
        <>
            <div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-slate-50/80 to-background p-3 sm:p-4 dark:from-slate-900/40">
                {mensajes.length === 0 && <BienvenidaIvan enviar={t => enviar(t)} amplio={amplio} />}

                {mensajes.map((m, i) => m.rol === 'user' ? (
                    <div key={m.id} className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className={`${amplio ? 'max-w-[75%]' : 'max-w-[85%]'} whitespace-pre-wrap rounded-2xl rounded-tr-md bg-gradient-to-br from-indigo-600 to-blue-600 px-3.5 py-2.5 text-sm text-white shadow-sm`}>
                            {m.texto}
                        </div>
                    </div>
                ) : (
                    <RespuestaIvan key={m.id} m={m} ultimo={i === mensajes.length - 1} pensando={pensando}
                                   enviar={t => enviar(t)} amplio={amplio} verPdf={setPdfComprobante} />
                ))}
                <div ref={finRef} />
            </div>

            <ComprobantePdfModal open={!!pdfComprobante} onOpenChange={v => { if (!v) setPdfComprobante(null) }}
                                 numeroComprobante={pdfComprobante ?? ''} />

            <div className="border-t border-border bg-background p-3">
                <div className={`flex items-end gap-2 rounded-2xl border bg-background px-3 py-2 shadow-sm transition-colors focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950 ${pensando ? 'border-indigo-200' : 'border-border'}`}>
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={entrada}
                        onChange={e => setEntrada(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
                        placeholder={pensando ? 'IVAN está trabajando…' : 'Escribe tu consulta…'}
                        disabled={pensando}
                        className="max-h-[120px] min-h-[24px] flex-1 resize-none bg-transparent py-1 text-base outline-none placeholder:text-muted-foreground sm:text-sm"
                    />
                    {pensando ? (
                        <button type="button" onClick={detener} title="Detener la respuesta" aria-label="Detener la respuesta"
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow transition hover:bg-red-700">
                            <Square className="h-3 w-3 fill-current" />
                        </button>
                    ) : (
                        <button type="button" onClick={() => enviar()} disabled={!entrada.trim()} title="Enviar" aria-label="Enviar"
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow transition hover:scale-105 disabled:scale-100 disabled:opacity-40">
                            <ArrowUp className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
                    IVAN responde con datos del sistema, según los módulos de tu perfil.
                </p>
            </div>
        </>
    )
}
