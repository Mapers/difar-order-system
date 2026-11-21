"use client"

import { useEffect, useState } from "react"
import { Map as MapIcon, Play, RotateCcw } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { useGuia } from "./GuiaProvider"
import { AvatarIvan } from "@/components/ivan/AvatarIvan"

const CLAVE_USADO = "guia-boton-usado"

/**
 * Animaciones del botón, para que se note que se puede usar:
 * latido (halo que se expande), brillo que lo recorre y saludo del avatar.
 */
const ANIMACIONES = `
@keyframes guia-latido { 0% { box-shadow: 0 0 0 0 rgba(99,102,241,.55) } 70%, 100% { box-shadow: 0 0 0 11px rgba(99,102,241,0) } }
@keyframes guia-brillo { 0%, 60% { transform: translateX(-130%) } 100% { transform: translateX(430%) } }
@keyframes guia-saludo { 0%, 72%, 100% { transform: none } 78% { transform: rotate(-16deg) scale(1.14) } 86% { transform: rotate(14deg) scale(1.14) } 93% { transform: rotate(-6deg) scale(1.05) } }
`

/** Botón "Guía" de la barra superior. Solo en escritorio y en las pantallas que tienen guía. */
export function GuiaMenu() {
    const g = useGuia()
    // Hasta el primer clic llama la atención (latido + punto); después queda solo el brillo y el saludo.
    const [usado, setUsado] = useState(true)
    useEffect(() => {
        try { setUsado(localStorage.getItem(CLAVE_USADO) === "1") } catch { setUsado(false) }
    }, [])
    const marcarUsado = () => {
        if (usado) return
        setUsado(true)
        try { localStorage.setItem(CLAVE_USADO, "1") } catch { /* sin almacenamiento: no pasa nada */ }
    }
    if (!g || !g.disponible) return null

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button type="button" onClick={marcarUsado} title="Haz clic: te explico esta pantalla paso a paso"
                        style={usado ? undefined : { animation: "guia-latido 2.2s ease-out infinite" }}
                        className={`group relative mr-1 inline-flex h-9 items-center gap-1.5 rounded-lg border pl-1 pr-3 text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-500/20 active:scale-95 ${g.activa
                            ? "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
                            : "text-muted-foreground hover:bg-muted"}`}>
                    <style>{ANIMACIONES}</style>
                    {/* Brillo que cruza el botón cada pocos segundos. */}
                    <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
                        <span className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent dark:via-white/20"
                              style={{ animation: "guia-brillo 4s ease-in-out infinite" }} />
                    </span>
                    <span className="relative inline-flex transition-transform duration-200 group-hover:scale-110" style={{ animation: "guia-saludo 4s ease-in-out infinite" }}>
                        <AvatarIvan tamano="sm" />
                    </span>
                    <span className="relative">IVAN te guía</span>
                    {!usado && (
                        <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-3 w-3">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                            <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-indigo-500 dark:border-gray-900" />
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-96 space-y-3 p-4">
                <div>
                    <p className="text-sm font-bold">IVAN te guía</p>
                    <p className="text-xs text-muted-foreground">Te explico cada pantalla: qué hace, qué tablas toca, dónde se guarda y qué sigue después.</p>
                </div>

                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3">
                    <span>
                        <span className="block text-[13px] font-semibold">IVAN te guía activado</span>
                        <span className="block text-xs text-muted-foreground">La primera vez que entras a una pantalla, te muestro el recorrido.</span>
                    </span>
                    <Switch checked={g.activa} onCheckedChange={g.setActiva} />
                </label>

                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3">
                    <span>
                        <span className="block text-[13px] font-semibold">Ayudas en los botones</span>
                        <span className="block text-xs text-muted-foreground">Un "?" junto a cada botón. Pasa el mouse para ver qué hace.</span>
                    </span>
                    <Switch checked={g.ayudas} onCheckedChange={g.setAyudas} />
                </label>

                <div className="space-y-1.5">
                    <button type="button" disabled={!g.pantalla} onClick={() => g.iniciar(0)}
                            className="flex w-full items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-left text-[13px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                        <Play className="h-4 w-4" /> {g.pantalla ? "Ver recorrido de esta pantalla" : "Esta pantalla aún no tiene recorrido"}
                    </button>
                    <button type="button" onClick={g.abrirCaminos}
                            className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-[13px] font-medium hover:bg-muted">
                        <MapIcon className="h-4 w-4" /> Ver el camino completo (qué sigue después)
                    </button>
                    <button type="button" onClick={g.reiniciarVistos}
                            className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-[13px] font-medium hover:bg-muted">
                        <RotateCcw className="h-4 w-4" /> Volver a mostrar los recorridos ya vistos
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
