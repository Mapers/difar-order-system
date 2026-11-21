"use client"

import { Map as MapIcon, Play, RotateCcw } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { useGuia } from "./GuiaProvider"
import { AvatarIvan } from "@/components/ivan/AvatarIvan"

/** Botón "Guía" de la barra superior. Solo en escritorio y en las pantallas que tienen guía. */
export function GuiaMenu() {
    const g = useGuia()
    if (!g || !g.disponible) return null

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button type="button"
                        className={`mr-1 inline-flex h-9 items-center gap-1.5 rounded-lg border pl-1 pr-3 text-[13px] font-semibold transition-colors ${g.activa
                            ? "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
                            : "text-muted-foreground hover:bg-muted"}`}>
                    <AvatarIvan tamano="sm" /> IVAN te guía
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
