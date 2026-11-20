"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { PantallaGuia } from "./tipos"
import { buscarElemento } from "./GuiaRecorrido"

interface Punto { indice: number; top: number; left: number }

/** Un "?" junto a cada parte de la pantalla que tiene explicación. Al pasar el mouse la muestra; al hacer clic abre el recorrido ahí. */
export function GuiaAyudas({ pantalla, onAbrir }: { pantalla: PantallaGuia; onAbrir: (indice: number) => void }) {
    const [puntos, setPuntos] = useState<Punto[]>([])
    const [encima, setEncima] = useState<number | null>(null)

    useEffect(() => {
        let raf = 0
        const ubicar = () => {
            const lista: Punto[] = []
            pantalla.pasos.forEach((p, i) => {
                const el = buscarElemento(p.guia)
                if (!el) return
                const r = el.getBoundingClientRect()
                if (r.bottom < 0 || r.top > window.innerHeight) return
                lista.push({ indice: i + 1, top: r.top - 8, left: r.right - 10 })
            })
            setPuntos(lista)
        }
        const pedir = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(ubicar) }
        ubicar()
        // La pantalla carga datos y cambia de pestaña: se vuelve a ubicar cada poco.
        const iv = setInterval(ubicar, 1500)
        window.addEventListener("resize", pedir)
        window.addEventListener("scroll", pedir, true)
        return () => {
            clearInterval(iv); cancelAnimationFrame(raf)
            window.removeEventListener("resize", pedir)
            window.removeEventListener("scroll", pedir, true)
        }
    }, [pantalla])

    if (typeof document === "undefined") return null
    const sel = encima != null ? pantalla.pasos[encima - 1] : null
    const pto = puntos.find(p => p.indice === encima)

    return createPortal(
        <>
            {puntos.map(p => (
                <button
                    key={p.indice}
                    type="button"
                    aria-label={`IVAN te explica: ${pantalla.pasos[p.indice - 1].titulo}`}
                    onMouseEnter={() => setEncima(p.indice)}
                    onMouseLeave={() => setEncima(e => (e === p.indice ? null : e))}
                    onFocus={() => setEncima(p.indice)}
                    onBlur={() => setEncima(null)}
                    onClick={() => onAbrir(p.indice)}
                    className="fixed z-[65] flex h-[18px] w-[18px] items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white shadow ring-2 ring-white hover:bg-indigo-700 dark:ring-gray-900"
                    style={{ top: p.top, left: p.left }}
                >
                    ?
                </button>
            ))}
            {sel && pto && (
                <div
                    role="tooltip"
                    className="pointer-events-none fixed z-[66] w-72 rounded-lg border bg-white p-3 text-[12px] leading-relaxed text-gray-800 shadow-xl dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    style={{
                        top: Math.min(pto.top + 24, window.innerHeight - 200),
                        left: Math.min(Math.max(8, pto.left - 140), window.innerWidth - 296),
                    }}
                >
                    <p className="mb-1 text-[13px] font-bold">{sel.titulo}</p>
                    <p>{sel.queHace}</p>
                    {sel.seGuarda && <p className="mt-1"><b>Se guarda en:</b> {sel.seGuarda}</p>}
                    {sel.despues && <p className="mt-1 text-indigo-700 dark:text-indigo-300"><b>Después sigue:</b> {sel.despues}</p>}
                    <p className="mt-1.5 text-[11px] text-gray-500">Clic en el "?" y IVAN te muestra el recorrido desde aquí.</p>
                </div>
            )}
        </>,
        document.body,
    )
}
