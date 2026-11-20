"use client"

import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react"
import { PantallaGuia, PasoGuia } from "./tipos"
import { AvatarIvan } from "@/components/ivan/AvatarIvan"

/** Elemento visible con data-guia="<id>" (el primero que se vea, si hay varios). */
export function buscarElemento(guia?: string): HTMLElement | null {
    if (!guia) return null
    const lista = document.querySelectorAll<HTMLElement>(`[data-guia="${CSS.escape(guia)}"]`)
    for (const el of Array.from(lista)) {
        const r = el.getBoundingClientRect()
        if (r.width > 0 && r.height > 0) return el
    }
    return null
}

const ANCHO = 400
const MARGEN = 12

interface Props {
    pantalla: PantallaGuia
    /** 0 = presentación de la pantalla; 1..n = pasos. */
    indice: number
    onIndice: (i: number) => void
    onCerrar: () => void
}

export function GuiaRecorrido({ pantalla, indice, onIndice, onCerrar }: Props) {
    const total = pantalla.pasos.length + 1
    const paso: PasoGuia = indice === 0
        ? { titulo: pantalla.nombre, queHace: pantalla.resumen, despues: "Hola, soy IVAN. Pulsa Siguiente y te muestro cada parte de esta pantalla." }
        : pantalla.pasos[indice - 1]

    const [rect, setRect] = useState<DOMRect | null>(null)
    const [alto, setAlto] = useState(260)
    const tarjeta = useRef<HTMLDivElement>(null)

    const medir = useCallback(() => {
        const el = buscarElemento(paso.guia)
        setRect(el ? el.getBoundingClientRect() : null)
    }, [paso.guia])

    // Llevar el elemento a la vista y medirlo.
    useEffect(() => {
        const el = buscarElemento(paso.guia)
        if (el) el.scrollIntoView({ block: "center", behavior: "smooth" })
        medir()
        const t1 = setTimeout(medir, 350)
        const t2 = setTimeout(medir, 800)
        let raf = 0
        const enMovimiento = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(medir) }
        window.addEventListener("resize", enMovimiento)
        window.addEventListener("scroll", enMovimiento, true)
        return () => {
            clearTimeout(t1); clearTimeout(t2); cancelAnimationFrame(raf)
            window.removeEventListener("resize", enMovimiento)
            window.removeEventListener("scroll", enMovimiento, true)
        }
    }, [medir, paso.guia])

    useLayoutEffect(() => {
        if (tarjeta.current) setAlto(tarjeta.current.offsetHeight)
    }, [indice, rect])

    const ultimo = indice >= total - 1
    const siguiente = () => (ultimo ? onCerrar() : onIndice(indice + 1))
    const anterior = () => indice > 0 && onIndice(indice - 1)

    useEffect(() => {
        const tecla = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCerrar()
            else if (e.key === "ArrowRight") siguiente()
            else if (e.key === "ArrowLeft") anterior()
        }
        window.addEventListener("keydown", tecla)
        return () => window.removeEventListener("keydown", tecla)
    })

    if (typeof document === "undefined") return null

    // Posición de la tarjeta: debajo del elemento, si no cabe arriba, si no al centro.
    const vw = window.innerWidth, vh = window.innerHeight
    let top: number, left: number
    if (rect) {
        const abajo = rect.bottom + MARGEN
        const arriba = rect.top - MARGEN - alto
        top = abajo + alto <= vh - MARGEN ? abajo : arriba >= MARGEN ? arriba : Math.max(MARGEN, (vh - alto) / 2)
        left = Math.min(Math.max(MARGEN, rect.left + rect.width / 2 - ANCHO / 2), vw - ANCHO - MARGEN)
    } else {
        top = Math.max(MARGEN, (vh - alto) / 2)
        left = (vw - ANCHO) / 2
    }

    return createPortal(
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={`IVAN te guía: ${pantalla.nombre}`}>
            {/* Fondo oscuro; con elemento, el hueco lo hace la sombra del recuadro. */}
            {rect ? (
                <div
                    className="pointer-events-none fixed rounded-lg ring-[3px] ring-indigo-400 transition-all duration-200"
                    style={{
                        top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12,
                        boxShadow: "0 0 0 9999px rgba(3, 6, 12, 0.68)",
                    }}
                />
            ) : (
                <div className="fixed inset-0 bg-black/60" />
            )}
            {/* Capa que evita clics en la pantalla mientras se explica. */}
            <div className="fixed inset-0" onClick={e => e.stopPropagation()} />

            <div
                ref={tarjeta}
                className="fixed rounded-xl border bg-white p-5 text-gray-900 shadow-2xl dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                style={{ top, left, width: ANCHO }}
            >
                <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        <AvatarIvan tamano="sm" />
                        {indice === 0 ? `IVAN te guía · ${pantalla.grupo}` : `IVAN · Paso ${indice} de ${total - 1}`}
                    </span>
                    <button type="button" onClick={onCerrar} aria-label="Cerrar guía"
                            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <h3 className="mb-3 text-lg font-bold leading-snug">{paso.titulo}</h3>

                <dl className="space-y-2.5 text-[13px] leading-relaxed">
                    <Fila etiqueta={indice === 0 ? "Para qué sirve" : "Qué hace"} texto={paso.queHace} />
                    {paso.quePasa && <Fila etiqueta="Qué pasa" texto={paso.quePasa} />}
                    {paso.seGuarda && (
                        <Fila etiqueta="Se guarda en" texto={paso.seGuarda}
                              extra={paso.tablas ? <span className="mt-0.5 block font-mono text-[10.5px] text-gray-500 dark:text-gray-400">{paso.tablas}</span> : null} />
                    )}
                    {paso.despues && (
                        <div className="rounded-lg bg-indigo-50 px-3 py-2 dark:bg-indigo-950/50">
                            <dt className="text-[11px] font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Después sigue</dt>
                            <dd className="text-indigo-900 dark:text-indigo-100">{paso.despues}</dd>
                        </div>
                    )}
                </dl>

                <div className="mt-4 flex items-center gap-2">
                    <div className="flex flex-1 flex-wrap gap-1" aria-hidden="true">
                        {Array.from({ length: total }).map((_, i) => (
                            <span key={i} className={`h-1.5 w-3.5 rounded-full ${i === indice ? "bg-indigo-600" : i < indice ? "bg-indigo-300 dark:bg-indigo-700" : "bg-gray-200 dark:bg-gray-700"}`} />
                        ))}
                    </div>
                    {indice > 0 && (
                        <button type="button" onClick={anterior}
                                className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-[13px] font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                            <ArrowLeft className="h-3.5 w-3.5" /> Anterior
                        </button>
                    )}
                    <button type="button" onClick={siguiente} autoFocus
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3.5 py-2 text-[13px] font-bold text-white hover:bg-indigo-700">
                        {ultimo ? <><Check className="h-3.5 w-3.5" /> Terminar</> : <>Siguiente <ArrowRight className="h-3.5 w-3.5" /></>}
                    </button>
                </div>
                {indice === 0 && (
                    <p className="mt-3 text-[11px] text-gray-500 dark:text-gray-400">
                        Puedes apagarme o volver a llamarme con el botón <b>IVAN te guía</b> de arriba a la derecha. Teclas: ← → y Esc.
                    </p>
                )}
            </div>
        </div>,
        document.body,
    )
}

function Fila({ etiqueta, texto, extra }: { etiqueta: string; texto: string; extra?: ReactNode }) {
    return (
        <div className="grid grid-cols-[96px_1fr] gap-2">
            <dt className="font-bold text-gray-600 dark:text-gray-300">{etiqueta}</dt>
            <dd>{texto}{extra}</dd>
        </div>
    )
}
