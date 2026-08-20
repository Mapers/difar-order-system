'use client'

import { useCallback, useState } from "react"

export interface Coordenada {
    lat: number
    lng: number
}

export interface InfoRuta {
    distanciaKm: number
    duracionMin: number
}

function decodePolyline(encoded: string): [number, number][] {
    const points: [number, number][] = []
    let index = 0, lat = 0, lng = 0

    while (index < encoded.length) {
        let shift = 0, result = 0, b: number
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
        lat += (result & 1) ? ~(result >> 1) : (result >> 1)

        shift = 0; result = 0
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
        lng += (result & 1) ? ~(result >> 1) : (result >> 1)

        points.push([lat / 1e5, lng / 1e5])
    }

    return points
}

const MENSAJES_GEO: Record<number, string> = {
    1: "Permiso de ubicación denegado",
    2: "Ubicación no disponible",
    3: "Tiempo de espera agotado",
}

export function useUbicacionYRuta() {
    const [ubicacion, setUbicacion] = useState<Coordenada | null>(null)
    const [errorUbicacion, setErrorUbicacion] = useState("")
    const [cargandoUbicacion, setCargandoUbicacion] = useState(false)

    const [ruta, setRuta] = useState<[number, number][] | null>(null)
    const [infoRuta, setInfoRuta] = useState<InfoRuta | null>(null)
    const [cargandoRuta, setCargandoRuta] = useState(false)

    const calcularRuta = useCallback(async (desde: Coordenada, hasta: Coordenada) => {
        setCargandoRuta(true)
        setInfoRuta(null)
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/`
                + `${desde.lng},${desde.lat};${hasta.lng},${hasta.lat}`
                + `?overview=full&geometries=polyline`

            const res = await fetch(url)
            const data = await res.json()
            if (data.code !== "Ok" || !data.routes?.[0]) throw new Error("Sin ruta")

            const trayecto = data.routes[0]
            setRuta(decodePolyline(trayecto.geometry))
            setInfoRuta({
                distanciaKm: trayecto.distance / 1000,
                duracionMin: trayecto.duration / 60,
            })
        } catch {
            setErrorUbicacion("No se pudo calcular la ruta.")
        } finally {
            setCargandoRuta(false)
        }
    }, [])

    const pedirUbicacion = useCallback((destino?: Coordenada | null) => {
        if (!navigator.geolocation) {
            setErrorUbicacion("Tu navegador no soporta geolocalización")
            return
        }

        setCargandoUbicacion(true)
        setErrorUbicacion("")

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
                setUbicacion(coords)
                setCargandoUbicacion(false)
                if (destino) calcularRuta(coords, destino)
            },
            (err) => {
                setCargandoUbicacion(false)
                setErrorUbicacion(MENSAJES_GEO[err.code] ?? "Error al obtener ubicación")
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
    }, [calcularRuta])

    const limpiar = useCallback(() => {
        setUbicacion(null)
        setErrorUbicacion("")
        setCargandoUbicacion(false)
        setRuta(null)
        setInfoRuta(null)
        setCargandoRuta(false)
    }, [])

    return {
        ubicacion, errorUbicacion, cargandoUbicacion, pedirUbicacion,
        ruta, infoRuta, cargandoRuta, calcularRuta,
        limpiar,
    }
}

export function formatearDuracion(min: number) {
    return min < 60
        ? `${Math.round(min)} min`
        : `${Math.floor(min / 60)}h ${Math.round(min % 60)}min`
}
