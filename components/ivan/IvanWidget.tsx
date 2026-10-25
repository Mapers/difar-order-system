'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Maximize2, RotateCcw, X } from 'lucide-react'
import { useAuth } from '@/context/authContext'
import { useIvanChat } from '@/app/hooks/useIvanChat'
import { ChatConversacion } from './ChatConversacion'
import { AvatarIvan } from './AvatarIvan'
import { LanzadorIvan, marcarIvanUsado } from './LanzadorIvan'

export function IvanWidget() {
    const { isAuthenticated } = useAuth()
    const pathname = usePathname()

    if (!isAuthenticated) return null
    if (pathname?.startsWith('/dashboard/chat')) return null

    return <BurbujaIvan />
}

function BurbujaIvan() {
    const router = useRouter()
    const chat = useIvanChat()

    const [abierto, setAbierto] = useState(false)

    const LADO_BURBUJA = 56
    const MARGEN = 8
    const UMBRAL_ARRASTRE = 8
    const CLAVE_POS = 'ivan-burbuja-pos'

    const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
    const [arrastrando, setArrastrando] = useState(false)
    const inicioArrastre = useRef<{ x: number; y: number; movio: boolean } | null>(null)

    const acotar = useCallback((x: number, y: number) => ({
        x: Math.min(Math.max(x, MARGEN), window.innerWidth - LADO_BURBUJA - MARGEN),
        y: Math.min(Math.max(y, MARGEN), window.innerHeight - LADO_BURBUJA - MARGEN),
    }), [])

    useEffect(() => {
        try {
            const guardada = localStorage.getItem(CLAVE_POS)
            if (!guardada) return
            const { x, y } = JSON.parse(guardada)
            if (typeof x === 'number' && typeof y === 'number') setPos(acotar(x, y))
        } catch {
        }
    }, [acotar])

    useEffect(() => {
        if (!pos) return
        const alRedimensionar = () => setPos(p => (p ? acotar(p.x, p.y) : p))
        window.addEventListener('resize', alRedimensionar)
        return () => window.removeEventListener('resize', alRedimensionar)
    }, [pos, acotar])

    const alBajarPuntero = (e: React.PointerEvent<HTMLButtonElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        inicioArrastre.current = { x: e.clientX, y: e.clientY, movio: false }
    }

    const alMoverPuntero = (e: React.PointerEvent<HTMLButtonElement>) => {
        const ini = inicioArrastre.current
        if (!ini) return

        const dx = e.clientX - ini.x
        const dy = e.clientY - ini.y
        if (!ini.movio && Math.hypot(dx, dy) < UMBRAL_ARRASTRE) return

        ini.movio = true
        setArrastrando(true)
        setPos(acotar(e.clientX - LADO_BURBUJA / 2, e.clientY - LADO_BURBUJA / 2))
    }

    const alSoltarPuntero = () => {
        const ini = inicioArrastre.current
        inicioArrastre.current = null
        setArrastrando(false)

        if (!ini?.movio) { abrir(); return }

        setPos(p => {
            if (p) { try { localStorage.setItem(CLAVE_POS, JSON.stringify(p)) } catch {} }
            return p
        })
    }

    const abrir = () => {
        marcarIvanUsado()
        setAbierto(true)
    }

    const expandir = () => {
        setAbierto(false)
        router.push('/dashboard/chat')
    }

    return (
        <div
            className={`fixed z-50 ${pos ? '' : 'bottom-4 right-4 sm:bottom-6 sm:right-6'}`}
            style={pos ? { left: pos.x, top: pos.y } : undefined}
        >
            {abierto && (
                <div className="fixed inset-x-0 bottom-0 top-16 flex flex-col overflow-hidden border-t border-border bg-background shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300
                                sm:inset-auto sm:bottom-20 sm:right-6 sm:top-auto sm:h-[600px] sm:w-[420px] sm:rounded-2xl sm:border">
                    <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600 px-4 py-3 text-white">
                        <div className="flex items-center gap-2.5">
                            <AvatarIvan activo={chat.pensando} />
                            <div>
                                <p className="text-sm font-semibold leading-tight">IVAN</p>
                                <p className="flex items-center gap-1.5 text-xs leading-tight text-blue-100">
                                    <span className={`h-1.5 w-1.5 rounded-full ${chat.pensando ? 'animate-pulse bg-amber-300' : 'bg-emerald-300'}`} />
                                    {chat.pensando ? 'Trabajando en tu consulta…' : 'En línea'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {chat.mensajes.length > 0 && (
                                <button onClick={chat.limpiar} className="rounded-lg p-1.5 transition hover:bg-white/15"
                                        title="Nueva conversación" aria-label="Empezar una nueva conversación">
                                    <RotateCcw className="h-4 w-4" />
                                </button>
                            )}
                            <button onClick={expandir} className="rounded-lg p-1.5 transition hover:bg-white/15"
                                    title="Abrir en pantalla completa" aria-label="Abrir el chat en pantalla completa">
                                <Maximize2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => setAbierto(false)} className="rounded-lg p-1.5 transition hover:bg-white/15"
                                    title="Minimizar" aria-label="Minimizar el chat">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <ChatConversacion {...chat} autoFocus={abierto} />
                </div>
            )}

            {!abierto && (
                <LanzadorIvan
                    arrastrando={arrastrando}
                    ladoInvitacion={pos && pos.x < 280 ? 'derecha' : 'izquierda'}
                    onAbrir={abrir}
                    eventos={{
                        onPointerDown: alBajarPuntero,
                        onPointerMove: alMoverPuntero,
                        onPointerUp: alSoltarPuntero,
                        onPointerCancel: () => { inicioArrastre.current = null; setArrastrando(false) },
                    }}
                />
            )}
        </div>
    )
}
