"use client"
import React, { useCallback, useEffect, useState } from "react"
import { RefreshCw, Sparkles, LogIn } from "lucide-react"
import { useAuth } from "@/context/authContext"

// Cada despliegue graba su versión en el front (NEXT_PUBLIC_APP_VERSION, ver
// next.config.mjs) y en /version.json. Si el servidor ya tiene otra versión,
// este front quedó viejo: se avisa con un modal y, al aceptar, se cierra la
// sesión y se recarga la página para que entre con el código nuevo.

const VERSION_ACTUAL = process.env.NEXT_PUBLIC_APP_VERSION ?? ""
const CADA_MS = 5 * 60 * 1000

async function versionDelServidor(): Promise<string | null> {
    try {
        const r = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" })
        if (!r.ok) return null
        const j = await r.json()
        return typeof j?.version === "string" ? j.version : null
    } catch {
        return null // sin red o sin archivo: no se molesta al usuario
    }
}

export function AvisoVersionNueva() {
    const { logout } = useAuth()
    const [nueva, setNueva] = useState(false)
    const [saliendo, setSaliendo] = useState(false)

    const revisar = useCallback(async () => {
        if (!VERSION_ACTUAL) return
        const v = await versionDelServidor()
        if (v && v !== VERSION_ACTUAL) setNueva(true)
    }, [])

    useEffect(() => {
        revisar()
        const id = window.setInterval(revisar, CADA_MS)
        const alVolver = () => { if (document.visibilityState === "visible") revisar() }
        document.addEventListener("visibilitychange", alVolver)
        window.addEventListener("focus", revisar)
        return () => {
            window.clearInterval(id)
            document.removeEventListener("visibilitychange", alVolver)
            window.removeEventListener("focus", revisar)
        }
    }, [revisar])

    const aceptar = async () => {
        setSaliendo(true)
        try { await logout() } catch { /* igual se recarga */ }
        // Recarga completa para bajar el código nuevo (no solo navegar)
        window.location.replace("/")
    }

    if (!nueva) return null

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-300"
            role="alertdialog" aria-modal="true" aria-labelledby="aviso-version-titulo">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-background shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="relative flex flex-col items-center bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 px-6 pb-8 pt-9 text-white">
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
                    <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 ring-4 ring-white/20">
                        <Sparkles className="h-10 w-10" strokeWidth={1.6} />
                    </div>
                    <h2 id="aviso-version-titulo" className="relative mt-5 text-center text-2xl font-bold">
                        Hay una nueva versión del sistema
                    </h2>
                    <p className="relative mt-2 text-center text-sm text-blue-100">
                        Para usar las últimas mejoras, vuelve a iniciar sesión.
                    </p>
                </div>

                <div className="flex items-start gap-3 px-6 py-5 text-sm text-muted-foreground">
                    <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <p>Se cerrará tu sesión y la página se recargará. Tus borradores de pedidos se mantienen.</p>
                </div>

                <div className="border-t bg-muted/40 px-6 py-4">
                    <button type="button" onClick={aceptar} disabled={saliendo} autoFocus
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition-colors hover:bg-blue-700 disabled:opacity-70">
                        {saliendo ? <RefreshCw className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                        {saliendo ? "Actualizando…" : "Volver a iniciar sesión"}
                    </button>
                </div>
            </div>
        </div>
    )
}
