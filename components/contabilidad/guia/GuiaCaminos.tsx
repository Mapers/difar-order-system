"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, MapPin } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CaminoGuia } from "./tipos"

interface Props {
    open: boolean
    onOpenChange: (v: boolean) => void
    caminos: CaminoGuia[]
    rutaActual: string
    /** Clic en un paso de la pantalla actual: abre su recorrido sin navegar. */
    onAqui: () => void
}

/** "Qué sigue después": cada tarea de contabilidad como una fila de pasos. Clic en un paso = abre esa pantalla con su recorrido. */
export function GuiaCaminos({ open, onOpenChange, caminos, rutaActual, onAqui }: Props) {
    const router = useRouter()
    // Por defecto, el primer camino que pasa por la pantalla donde está el usuario.
    const inicial = caminos.find(c => c.etapas.some(e => e.ruta === rutaActual))?.id ?? caminos[0]?.id
    const [sel, setSel] = useState<string | undefined>(inicial)
    useEffect(() => { if (open) setSel(inicial) }, [open, inicial])
    const camino = caminos.find(c => c.id === sel)

    const ir = (ruta?: string) => {
        if (!ruta) return
        onOpenChange(false)
        if (ruta === rutaActual) onAqui()
        else router.push(`${ruta}?guia=1`)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>IVAN te guía · qué sigue después</DialogTitle>
                    <DialogDescription>
                        Elige una tarea y verás sus pasos en orden: quién lo hace, en qué pantalla y qué se guarda. Haz clic en un paso para ir a esa pantalla con su guía.
                    </DialogDescription>
                </DialogHeader>

                {caminos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Todavía no hay caminos cargados.</p>
                ) : (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {caminos.map(c => (
                                <button key={c.id} type="button" onClick={() => setSel(c.id)}
                                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${c.id === sel
                                            ? "border-indigo-600 bg-indigo-600 text-white"
                                            : "hover:bg-muted"}`}>
                                    {c.titulo}
                                </button>
                            ))}
                        </div>

                        {camino && (
                            <>
                                <p className="text-sm text-muted-foreground">{camino.descripcion}</p>
                                <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {camino.etapas.map((e, i) => {
                                        const aqui = e.ruta === rutaActual
                                        return (
                                            <li key={i}>
                                                <button type="button" disabled={!e.ruta} onClick={() => ir(e.ruta)}
                                                        className={`flex h-full w-full flex-col gap-1.5 rounded-xl border p-3.5 text-left text-[13px] transition-colors ${aqui
                                                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                                                            : "hover:border-indigo-300 hover:bg-muted/50"} disabled:cursor-default`}>
                                                    <span className="flex items-center gap-2">
                                                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${aqui ? "bg-indigo-600 text-white" : "bg-muted"}`}>{i + 1}</span>
                                                        <b className="flex-1 leading-tight">{e.titulo}</b>
                                                        {aqui && <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-indigo-600"><MapPin className="h-3 w-3" />Estás aquí</span>}
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">{e.quien}</span>
                                                    <span>{e.queHace}</span>
                                                    {e.seGuarda && <span className="text-muted-foreground"><b>Se guarda:</b> {e.seGuarda}</span>}
                                                    {e.despues && (
                                                        <span className="mt-auto inline-flex items-start gap-1 pt-1 text-indigo-700 dark:text-indigo-300">
                                                            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {e.despues}
                                                        </span>
                                                    )}
                                                </button>
                                            </li>
                                        )
                                    })}
                                </ol>
                            </>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
