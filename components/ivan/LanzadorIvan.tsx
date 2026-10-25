'use client'

import { useEffect, useState } from 'react'
import { Sparkles, X } from 'lucide-react'

/**
 * Botón flotante de IVAN con efectos para invitar a usarlo:
 *  - ondas suaves que salen del botón y un destello periódico del ícono;
 *  - una invitación (globo) que aparece a los pocos segundos, una vez por
 *    sesión, hasta que la persona use IVAN por primera vez.
 * Con "reducir movimiento" activado en el sistema, las animaciones se apagan.
 */

const CLAVE_USADO = 'ivan-usado'
const CLAVE_VISTA = 'ivan-invitacion-vista'
const RETRASO_MS = 4000
const DURACION_MS = 12000

const MENSAJES = [
    '¿Te ayudo? Pregúntame por ventas, cobranzas o clientes.',
    'Te armo un reporte en segundos. Solo pídemelo.',
    '¿Buscas un saldo o una factura? Pregúntame.',
]

const leer = (almacen: () => Storage, clave: string) => { try { return almacen().getItem(clave) } catch { return null } }
const guardar = (almacen: () => Storage, clave: string) => { try { almacen().setItem(clave, '1') } catch {} }

/** Marca que la persona ya usó IVAN: la invitación no vuelve a salir. */
export const marcarIvanUsado = () => guardar(() => localStorage, CLAVE_USADO)

function useInvitacion() {
    const [mensaje, setMensaje] = useState<string | null>(null)

    useEffect(() => {
        if (leer(() => localStorage, CLAVE_USADO) || leer(() => sessionStorage, CLAVE_VISTA)) return
        const mostrar = setTimeout(() => {
            setMensaje(MENSAJES[Math.floor(Math.random() * MENSAJES.length)])
            guardar(() => sessionStorage, CLAVE_VISTA)
        }, RETRASO_MS)
        const ocultar = setTimeout(() => setMensaje(null), RETRASO_MS + DURACION_MS)
        return () => { clearTimeout(mostrar); clearTimeout(ocultar) }
    }, [])

    return { mensaje, cerrar: () => setMensaje(null) }
}

type Props = {
    arrastrando: boolean
    /** Lado en que cabe la invitación (según dónde se dejó el botón). */
    ladoInvitacion: 'izquierda' | 'derecha'
    onAbrir: () => void
    eventos: Pick<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onPointerCancel'>
}

export function LanzadorIvan({ arrastrando, ladoInvitacion, onAbrir, eventos }: Props) {
    const { mensaje, cerrar } = useInvitacion()
    const visible = !!mensaje && !arrastrando

    return (
        <div className="relative">
            {visible && (
                <div
                    role="status"
                    className={`ivan-invitacion absolute bottom-1 w-60 ${ladoInvitacion === 'izquierda' ? 'right-[4.25rem] origin-bottom-right' : 'left-[4.25rem] origin-bottom-left'}`}
                >
                    <div className="relative rounded-2xl border border-indigo-200 bg-white px-3.5 py-2.5 pr-8 shadow-xl shadow-indigo-500/10 dark:border-indigo-500/30 dark:bg-slate-900">
                        <button onClick={onAbrir} className="text-left">
                            <span className="block text-[11px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">IVAN</span>
                            <span className="block text-sm leading-snug text-foreground">{mensaje}</span>
                        </button>
                        <button onClick={cerrar} aria-label="Cerrar la invitación"
                                className="absolute right-1.5 top-1.5 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground">
                            <X className="h-3.5 w-3.5" />
                        </button>
                        <span aria-hidden
                              className={`absolute bottom-4 h-3 w-3 rotate-45 border-indigo-200 bg-white dark:border-indigo-500/30 dark:bg-slate-900 ${ladoInvitacion === 'izquierda' ? '-right-1.5 border-r border-t' : '-left-1.5 border-b border-l'}`} />
                    </div>
                </div>
            )}

            {!arrastrando && <span aria-hidden className="ivan-onda" />}
            {!arrastrando && <span aria-hidden className="ivan-onda ivan-onda-2" />}

            <button
                {...eventos}
                className={`relative flex h-14 w-14 touch-none items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 text-white shadow-xl shadow-indigo-500/40 ring-2 ring-white/20 transition ${
                    arrastrando ? 'scale-110 cursor-grabbing opacity-90' : 'cursor-grab hover:scale-110'
                }`}
                title="Abrir IVAN — mantén pulsado para moverla"
                aria-label="Abrir el asistente IVAN"
            >
                <Sparkles className="ivan-destello h-6 w-6" />
            </button>
        </div>
    )
}
