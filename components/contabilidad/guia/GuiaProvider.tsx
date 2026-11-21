"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import { CaminoGuia, PantallaGuia } from "./tipos"
import { CAMINOS, abreSola, esRutaContable, pantallaDe } from "./contenido"
import { GuiaRecorrido } from "./GuiaRecorrido"
import { GuiaAyudas } from "./GuiaAyudas"
import { GuiaCaminos } from "./GuiaCaminos"

// Preferencias de la guía: por navegador (cada usuario en su computadora).
const K_ACTIVA = "guia-conta:activa"
const K_AYUDAS = "guia-conta:ayudas"
const K_VISTOS = "guia-conta:vistos"

function leer<T>(clave: string, porDefecto: T): T {
    try {
        const v = localStorage.getItem(clave)
        return v === null ? porDefecto : (JSON.parse(v) as T)
    } catch { return porDefecto }
}
function grabar(clave: string, valor: unknown) {
    try { localStorage.setItem(clave, JSON.stringify(valor)) } catch { /* sin almacenamiento: solo dura la sesión */ }
}

interface Recorrido { pantalla: PantallaGuia; indice: number }

interface GuiaCtx {
    /** Estamos en escritorio y en una pantalla con guía (todo el sistema menos configuración, roles y usuarios). */
    disponible: boolean
    pantalla: PantallaGuia | undefined
    activa: boolean
    setActiva: (v: boolean) => void
    ayudas: boolean
    setAyudas: (v: boolean) => void
    /** Abre el recorrido de la pantalla actual (opcionalmente en un paso). */
    iniciar: (indice?: number) => void
    reiniciarVistos: () => void
    abrirCaminos: () => void
    caminos: CaminoGuia[]
}

const Ctx = createContext<GuiaCtx | null>(null)

export function useGuia() {
    return useContext(Ctx)
}

function useEscritorio() {
    const [es, setEs] = useState(false)
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 768px)")
        const f = () => setEs(mq.matches)
        f()
        mq.addEventListener("change", f)
        return () => mq.removeEventListener("change", f)
    }, [])
    return es
}

export function GuiaProvider({ children }: { children: React.ReactNode }) {
    const ruta = usePathname() || ""
    const escritorio = useEscritorio()
    const disponible = escritorio && esRutaContable(ruta)
    const pantalla = disponible ? pantallaDe(ruta) : undefined

    const [cargado, setCargado] = useState(false)
    const [activa, setActivaSt] = useState(true)
    const [ayudas, setAyudasSt] = useState(false)
    const [vistos, setVistos] = useState<string[]>([])
    const [recorrido, setRecorrido] = useState<Recorrido | null>(null)
    const [caminosOpen, setCaminosOpen] = useState(false)

    useEffect(() => {
        setActivaSt(leer(K_ACTIVA, true))
        setAyudasSt(leer(K_AYUDAS, false))
        setVistos(leer<string[]>(K_VISTOS, []))
        setCargado(true)
    }, [])

    const setActiva = (v: boolean) => { setActivaSt(v); grabar(K_ACTIVA, v); if (!v) setRecorrido(null) }
    const setAyudas = (v: boolean) => { setAyudasSt(v); grabar(K_AYUDAS, v) }

    const marcarVisto = useCallback((r: string) => {
        setVistos(prev => {
            if (prev.includes(r)) return prev
            const n = [...prev, r]
            grabar(K_VISTOS, n)
            return n
        })
    }, [])

    const iniciar = useCallback((indice = 0) => {
        if (pantalla) setRecorrido({ pantalla, indice })
    }, [pantalla])

    // Al entrar a una pantalla: ?guia=1 (viene del camino completo) la abre siempre;
    // si la guía está activada, se abre sola la primera vez.
    useEffect(() => {
        setRecorrido(null)
        if (!cargado || !pantalla) return
        const forzar = new URLSearchParams(window.location.search).get("guia") === "1"
        if (!forzar && (!activa || vistos.includes(pantalla.ruta) || !abreSola(pantalla.ruta))) return
        const t = setTimeout(() => setRecorrido({ pantalla, indice: 0 }), 900)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pantalla?.ruta, cargado])

    const cerrar = useCallback(() => {
        setRecorrido(r => { if (r) marcarVisto(r.pantalla.ruta); return null })
    }, [marcarVisto])

    const valor = useMemo<GuiaCtx>(() => ({
        disponible, pantalla, activa, setActiva, ayudas, setAyudas, iniciar,
        reiniciarVistos: () => { setVistos([]); grabar(K_VISTOS, []) },
        abrirCaminos: () => setCaminosOpen(true),
        caminos: CAMINOS,
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [disponible, pantalla, activa, ayudas, iniciar])

    return (
        <Ctx.Provider value={valor}>
            {children}
            {disponible && recorrido && (
                <GuiaRecorrido
                    pantalla={recorrido.pantalla}
                    indice={recorrido.indice}
                    onIndice={i => setRecorrido(r => r && { ...r, indice: i })}
                    onCerrar={cerrar}
                />
            )}
            {disponible && ayudas && pantalla && !recorrido && (
                <GuiaAyudas pantalla={pantalla} onAbrir={i => setRecorrido({ pantalla, indice: i })} />
            )}
            {disponible && (
                <GuiaCaminos open={caminosOpen} onOpenChange={setCaminosOpen} caminos={CAMINOS} rutaActual={ruta}
                             onAqui={() => pantalla && setRecorrido({ pantalla, indice: 0 })} />
            )}
        </Ctx.Provider>
    )
}
