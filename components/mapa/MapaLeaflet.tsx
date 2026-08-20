'use client'

import { useCallback, useEffect, useRef } from "react"

export interface PuntoMapa {
    lat: number
    lng: number
    titulo: string
    descripcion?: string
    orden?: number
}

interface Props {
    puntos: PuntoMapa[]
    ubicacionUsuario?: { lat: number; lng: number } | null
    ruta?: [number, number][] | null
    altura?: number
    className?: string
}

const LEAFLET_VERSION = "1.9.4"

async function cargarLeaflet(): Promise<any> {
    if (typeof window === "undefined") throw new Error("No window")
    if ((window as any).L?.version) return (window as any).L

    if (!document.querySelector(`link[href*="leaflet@${LEAFLET_VERSION}"]`)) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`
        document.head.appendChild(link)
    }

    await new Promise<void>((resolve, reject) => {
        if ((window as any).L?.version) { resolve(); return }
        const script = document.createElement("script")
        script.src = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`
        script.onload = () => resolve()
        script.onerror = () => reject(new Error("No se pudo cargar Leaflet"))
        document.head.appendChild(script)
    })

    return (window as any).L
}

function iconoDestino(L: any, orden?: number) {
    const numero = orden != null
        ? `<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
             transform:rotate(45deg);color:#fff;font-size:11px;font-weight:700">${orden}</span>`
        : ""

    return L.divIcon({
        html: `<div style="position:relative;width:24px;height:24px;background:#ef4444;
                 border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
                 box-shadow:0 2px 6px rgba(0,0,0,0.4)">${numero}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -26],
        className: "",
    })
}

function iconoUsuario(L: any) {
    return L.divIcon({
        html: `<div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center">
                 <div style="position:absolute;width:32px;height:32px;background:rgba(59,130,246,0.2);border-radius:50%"></div>
                 <div style="position:relative;z-index:1;width:14px;height:14px;background:#3b82f6;
                      border:2.5px solid #fff;border-radius:50%;box-shadow:0 0 0 3px rgba(59,130,246,0.3)"></div>
               </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        className: "",
    })
}

export function MapaLeaflet({
    puntos,
    ubicacionUsuario = null,
    ruta = null,
    altura = 420,
    className = "",
}: Props) {
    const contenedorRef = useRef<HTMLDivElement | null>(null)
    const mapaRef = useRef<any>(null)
    const capaDestinosRef = useRef<any>(null)
    const marcadorUsuarioRef = useRef<any>(null)
    const capaRutaRef = useRef<any[]>([])
    const listoRef = useRef(false)
    const vivoRef = useRef(true)
    const timerInitRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const encuadrar = useCallback(() => {
        const mapa = mapaRef.current
        const L = (window as any).L
        if (!mapa || !L || !vivoRef.current) return

        const coords: [number, number][] = [
            ...puntos.map(p => [p.lat, p.lng] as [number, number]),
            ...(ubicacionUsuario ? [[ubicacionUsuario.lat, ubicacionUsuario.lng] as [number, number]] : []),
            ...(ruta ?? []),
        ]

        if (coords.length === 0) return

        if (coords.length === 1) {
            mapa.setView(coords[0], 16, { animate: false })
            return
        }

        mapa.fitBounds(L.latLngBounds(coords), { padding: [50, 50], animate: false })
    }, [puntos, ubicacionUsuario, ruta])

    const dibujarDestinos = useCallback(() => {
        const mapa = mapaRef.current
        const L = (window as any).L
        if (!mapa || !L) return

        capaDestinosRef.current?.remove()
        capaDestinosRef.current = L.layerGroup().addTo(mapa)

        puntos.forEach(p => {
            const titulo = p.orden != null ? `${p.orden}. ${p.titulo}` : p.titulo

            L.marker([p.lat, p.lng], { icon: iconoDestino(L, p.orden) })
                .addTo(capaDestinosRef.current)
                .bindPopup(`
                    <div style="font-family:system-ui,sans-serif;min-width:160px">
                        <strong style="color:#ef4444;font-size:12px">${titulo}</strong>
                        ${p.descripcion ? `<br/><span style="font-size:11px;color:#666">${p.descripcion}</span>` : ""}
                    </div>
                `)
        })
    }, [puntos])

    const dibujarUsuario = useCallback(() => {
        const mapa = mapaRef.current
        const L = (window as any).L
        if (!mapa || !L) return

        marcadorUsuarioRef.current?.remove()
        marcadorUsuarioRef.current = null

        if (!ubicacionUsuario) return

        marcadorUsuarioRef.current = L
            .marker([ubicacionUsuario.lat, ubicacionUsuario.lng], { icon: iconoUsuario(L) })
            .addTo(mapa)
            .bindPopup('<div style="font-family:system-ui;font-size:12px"><strong style="color:#3b82f6">Tu ubicación</strong></div>')
    }, [ubicacionUsuario])

    const dibujarRuta = useCallback(() => {
        const mapa = mapaRef.current
        const L = (window as any).L
        if (!mapa || !L) return

        capaRutaRef.current.forEach(capa => capa.remove())
        capaRutaRef.current = []

        if (!ruta || ruta.length === 0) return

        capaRutaRef.current.push(
            L.polyline(ruta, { color: "#1e3a8a", weight: 8, opacity: 0.12 }).addTo(mapa),
            L.polyline(ruta, { color: "#3b82f6", weight: 4, opacity: 0.9, dashArray: "10 6", lineCap: "round" }).addTo(mapa),
        )
    }, [ruta])

    const iniciar = useCallback(async (contenedor: HTMLDivElement) => {
        const L = await cargarLeaflet()

        if (!vivoRef.current || !contenedor.isConnected) return

        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/images/marker-icon-2x.png`,
            iconUrl: `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/images/marker-icon.png`,
            shadowUrl: `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/images/marker-shadow.png`,
        })

        mapaRef.current?.remove()

        const centro = puntos[0] ?? { lat: -9.19, lng: -75.015 } // Perú, por si aún no hay puntos
        const mapa = L.map(contenedor, { center: [centro.lat, centro.lng], zoom: 15 })

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(mapa)

        mapaRef.current = mapa

        dibujarDestinos()
        dibujarUsuario()
        dibujarRuta()
        encuadrar()

        setTimeout(() => { if (vivoRef.current) mapa.invalidateSize() }, 200)
    }, [puntos, dibujarDestinos, dibujarUsuario, dibujarRuta, encuadrar])

    const contenedorCallbackRef = useCallback((nodo: HTMLDivElement | null) => {
        contenedorRef.current = nodo
        if (!nodo || listoRef.current) return

        listoRef.current = true
        timerInitRef.current = setTimeout(() => {
            if (contenedorRef.current && vivoRef.current) {
                iniciar(contenedorRef.current).catch(err =>
                    console.error("Error iniciando el mapa:", err)
                )
            }
        }, 200)
    }, [])

    useEffect(() => { if (mapaRef.current) { dibujarDestinos(); encuadrar() } }, [dibujarDestinos, encuadrar])
    useEffect(() => { if (mapaRef.current) { dibujarUsuario(); encuadrar() } }, [dibujarUsuario, encuadrar])
    useEffect(() => { if (mapaRef.current) { dibujarRuta(); encuadrar() } }, [dibujarRuta, encuadrar])

    useEffect(() => {
        vivoRef.current = true

        return () => {
            vivoRef.current = false

            if (timerInitRef.current) {
                clearTimeout(timerInitRef.current)
                timerInitRef.current = null
            }

            mapaRef.current?.remove()
            mapaRef.current = null
            listoRef.current = false
            capaDestinosRef.current = null
            marcadorUsuarioRef.current = null
            capaRutaRef.current = []
        }
    }, [])

    return (
        <div
            ref={contenedorCallbackRef}
            className={`w-full rounded-lg border border-border bg-muted ${className}`}
            style={{ height: altura, position: "relative", zIndex: 0 }}
        />
    )
}
