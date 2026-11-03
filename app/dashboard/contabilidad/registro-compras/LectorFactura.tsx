'use client'

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Check, FileText, Loader2, ScanText, Sparkles, AlertCircle } from "lucide-react"
import { ComprasService } from "@/app/services/contabilidad/ContabilidadService"
import type { LecturaFactura } from "@/app/types/contabilidad-types"

const TIPOS = "image/jpeg,image/png,image/webp,application/pdf"
const PESO_MAXIMO = 10 * 1024 * 1024

// Lo que hace el backend, en el orden en que lo hace. Los pasos avanzan solos
// mientras se espera; la lectura con IA es el más largo.
const PASOS = [
    { texto: "Subiendo la factura",            ms: 900 },
    { texto: "Leyendo el documento con IA",    ms: 9000 },
    { texto: "Buscando al proveedor",          ms: 1800 },
    { texto: "Emparejando productos y lotes",  ms: 2500 },
    { texto: "Calculando importes con IGV",    ms: 1500 },
]

/** Estilos de la lectura: el escáner del cargador y el brillo de los campos que se van llenando. */
export function EstilosLectura() {
    return (
        <style>{`
@keyframes lf-escaneo { 0% { top: 0%; } 50% { top: calc(100% - 3px); } 100% { top: 0%; } }
@keyframes lf-pintar {
  0%   { box-shadow: 0 0 0 0 rgb(139 92 246 / .55); background-color: rgb(139 92 246 / .14); }
  100% { box-shadow: 0 0 0 6px rgb(139 92 246 / 0);  background-color: transparent; }
}
@keyframes lf-entrar { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
.lf-pintando { animation: lf-pintar .9s ease-out; border-radius: .75rem; }
.lf-pintado  { outline: 2px solid rgb(139 92 246 / .45); outline-offset: 2px; border-radius: .75rem; transition: outline-color 1s; }
.lf-fila     { animation: lf-entrar .35s ease-out, lf-pintar 1.1s ease-out; }
@media (prefers-reduced-motion: reduce) { .lf-pintando, .lf-fila { animation: none; } }
        `}</style>
    )
}

export function BotonLeerFactura({ disabled, onLeida }: { disabled?: boolean; onLeida: (d: LecturaFactura) => void }) {
    const input = useRef<HTMLInputElement>(null)
    const [archivo, setArchivo] = useState<File | null>(null)
    const [vista, setVista] = useState<string | null>(null)
    const [paso, setPaso] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [listo, setListo] = useState(false)

    useEffect(() => () => { if (vista) URL.revokeObjectURL(vista) }, [vista])

    // Avanza los pasos mientras se espera la respuesta; el último queda girando.
    useEffect(() => {
        if (!archivo || error || listo || paso >= PASOS.length - 1) return
        const t = setTimeout(() => setPaso(p => p + 1), PASOS[paso].ms)
        return () => clearTimeout(t)
    }, [archivo, paso, error, listo])

    const cerrar = () => {
        setArchivo(null)
        setVista(null)
        setError(null)
        setListo(false)
        setPaso(0)
    }

    const leer = async (f: File) => {
        if (f.size > PESO_MAXIMO) {
            setArchivo(f)
            setError("La factura debe pesar 10 MB o menos.")
            return
        }
        setArchivo(f)
        setVista(f.type.startsWith("image/") ? URL.createObjectURL(f) : null)
        setPaso(0)
        setError(null)
        setListo(false)
        try {
            const d = await ComprasService.leerFactura(f)
            setListo(true)
            setPaso(PASOS.length)
            await new Promise(r => setTimeout(r, 700))
            cerrar()
            onLeida(d)
        } catch (e: any) {
            setError(e?.response?.data?.message || "No se pudo leer la factura.")
        }
    }

    return (
        <>
            <input
                ref={input} type="file" accept={TIPOS} className="hidden"
                onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) leer(f) }}
            />
            <Button
                onClick={() => input.current?.click()} disabled={disabled}
                className="h-10 gap-1.5 bg-gradient-to-r from-violet-600 to-blue-600 px-3 font-semibold text-white shadow-md shadow-violet-600/25 hover:from-violet-700 hover:to-blue-700"
                title="Sube la foto o el PDF de la factura y se llena sola"
            >
                <ScanText className="h-4 w-4" /> <span className="hidden sm:inline">Leer factura</span>
            </Button>

            <Dialog open={!!archivo} onOpenChange={v => { if (!v && (error || listo)) cerrar() }}>
                <DialogContent className="max-w-md gap-0 overflow-hidden p-0" onInteractOutside={e => { if (!error) e.preventDefault() }}>
                    <div className="flex items-center gap-3 border-b px-5 py-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-md shadow-violet-600/30">
                            <Sparkles className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <DialogTitle className="text-base">Leyendo la factura</DialogTitle>
                            <DialogDescription className="truncate text-xs">{archivo?.name}</DialogDescription>
                        </div>
                    </div>

                    <div className="p-5">
                        {/* Vista del archivo con el escáner encima */}
                        <div className="relative mx-auto h-44 w-full overflow-hidden rounded-xl border bg-muted/50">
                            {vista ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={vista} alt="" className="h-full w-full object-cover object-top opacity-80" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground">
                                    <FileText className="h-14 w-14 opacity-40" />
                                </div>
                            )}
                            {!error && !listo && (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-b from-violet-500/0 via-violet-500/10 to-violet-500/0" />
                                    <div className="absolute inset-x-0 h-[3px] bg-violet-500 shadow-[0_0_18px_4px_rgba(139,92,246,.7)]"
                                         style={{ animation: "lf-escaneo 2.2s ease-in-out infinite" }} />
                                </>
                            )}
                            {listo && (
                                <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/15">
                                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                                        <Check className="h-8 w-8" />
                                    </span>
                                </div>
                            )}
                        </div>

                        {error ? (
                            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                            </div>
                        ) : (
                            <ol className="mt-4 space-y-2">
                                {PASOS.map((p, i) => {
                                    const hecho = i < paso
                                    const actual = i === paso
                                    return (
                                        <li key={p.texto} className={`flex items-center gap-2.5 text-sm transition-colors ${hecho ? "text-foreground" : actual ? "font-medium text-violet-700 dark:text-violet-300" : "text-muted-foreground/60"}`}>
                                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${hecho ? "bg-emerald-500 text-white" : actual ? "bg-violet-100 dark:bg-violet-950" : "border"}`}>
                                                {hecho ? <Check className="h-3 w-3" /> : actual ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                            </span>
                                            {p.texto}
                                        </li>
                                    )
                                })}
                            </ol>
                        )}
                    </div>

                    {error && (
                        <div className="flex justify-end gap-2 border-t bg-muted/30 px-5 py-3">
                            <Button variant="outline" size="sm" onClick={cerrar}>Cerrar</Button>
                            <Button size="sm" onClick={() => { cerrar(); input.current?.click() }}>Probar con otra</Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
