'use client'

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    MapPin,
    Navigation,
    ExternalLink,
    Locate,
    AlertCircle,
    Loader2,
    Clock,
    Route,
} from "lucide-react"

interface Direccion {
    id: string
    Nombre: string
    direccion: string
    NombreComercial: string
    latitud: number
    longitud: number
    telefono?: string
    estado: string
    comentario?: string
    ruta_cliente_id?: number
}

interface RouteInfo {
    distanceKm: number
    durationMin: number
}

interface MapaModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    mapaTitulo: string
    selectedMapaDirecciones: Direccion[]
    generarMapaEstatico: (direcciones: Direccion[]) => string
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

export function MapaModal({
                              isOpen,
                              onOpenChange,
                              mapaTitulo,
                              selectedMapaDirecciones,
                          }: MapaModalProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null)
    const mapInstanceRef = useRef<any>(null)
    const userMarkerRef = useRef<any>(null)
    const routeLayerRef = useRef<any>(null)
    const initDoneRef = useRef(false)

    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [locationError, setLocationError] = useState("")
    const [loadingLocation, setLoadingLocation] = useState(false)
    const [loadingRoute, setLoadingRoute] = useState(false)
    const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)

    // Destruir mapa al cerrar el modal
    useEffect(() => {
        if (!isOpen) {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
            initDoneRef.current = false
            userMarkerRef.current = null
            routeLayerRef.current = null
            setUserLocation(null)
            setRouteInfo(null)
            setLocationError("")
        }
    }, [isOpen])

    // Carga Leaflet sin integrity (evita bloqueo por hash incorrecto)
    const loadLeaflet = async (): Promise<any> => {
        if (typeof window === "undefined") throw new Error("No window")
        if ((window as any).L?.version) return (window as any).L

        // CSS — sin integrity
        if (!document.querySelector('link[href*="leaflet@1.9.4"]')) {
            const link = document.createElement("link")
            link.rel = "stylesheet"
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            document.head.appendChild(link)
        }

        // JS — sin integrity ni crossOrigin para evitar el bloqueo SRI
        await new Promise<void>((resolve, reject) => {
            if ((window as any).L?.version) { resolve(); return }
            const script = document.createElement("script")
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
            script.onload = () => resolve()
            script.onerror = () => reject(new Error("No se pudo cargar Leaflet"))
            document.head.appendChild(script)
        })

        return (window as any).L
    }

    const initMap = async (container: HTMLDivElement) => {
        try {
            const L = await loadLeaflet()

            // Fix conocido de Leaflet con bundlers (Next.js / Webpack)
            delete (L.Icon.Default.prototype as any)._getIconUrl
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            })

            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }

            const first = selectedMapaDirecciones[0]
            const map = L.map(container, {
                center: [first.latitud, first.longitud],
                zoom: 15,
            })

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(map)

            // Pin rojo para destinos
            const destIcon = L.divIcon({
                html: `<div style="
                    width:24px;height:24px;
                    background:#ef4444;
                    border:3px solid #fff;
                    border-radius:50% 50% 50% 0;
                    transform:rotate(-45deg);
                    box-shadow:0 2px 6px rgba(0,0,0,0.4);
                "></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 24],
                popupAnchor: [0, -26],
                className: "",
            })

            selectedMapaDirecciones.forEach((dir, i) => {
                L.marker([dir.latitud, dir.longitud], { icon: destIcon })
                    .addTo(map)
                    .bindPopup(`
                        <div style="font-family:system-ui,sans-serif;min-width:160px">
                            <strong style="color:#ef4444;font-size:12px">${i + 1}. ${dir.NombreComercial}</strong><br/>
                            <span style="font-size:11px;color:#666">${dir.direccion}</span>
                        </div>
                    `)
            })

            if (selectedMapaDirecciones.length > 1) {
                map.fitBounds(
                    L.latLngBounds(selectedMapaDirecciones.map(d => [d.latitud, d.longitud])),
                    { padding: [40, 40] }
                )
            }

            mapInstanceRef.current = map

            // Forzar recalculo de tamaño tras animación del Dialog
            setTimeout(() => map.invalidateSize(), 200)

            // Pedir ubicación automáticamente
            doRequestLocation()

        } catch (err) {
            console.error("Error iniciando mapa:", err)
            setLocationError("No se pudo cargar el mapa.")
        }
    }

    // Callback ref: se ejecuta cuando el div entra al DOM real
    const mapCallbackRef = useCallback((node: HTMLDivElement | null) => {
        mapContainerRef.current = node
        if (!node || !isOpen || initDoneRef.current) return
        if (selectedMapaDirecciones.length === 0) return

        initDoneRef.current = true
        // Esperar que el Dialog termine su animación de apertura
        setTimeout(() => {
            if (mapContainerRef.current) {
                initMap(mapContainerRef.current)
            }
        }, 200)
    }, [isOpen, selectedMapaDirecciones]) // eslint-disable-line react-hooks/exhaustive-deps

    // Geolocalización
    const doRequestLocation = () => {
        if (!navigator.geolocation) {
            setLocationError("Tu navegador no soporta geolocalización")
            return
        }
        setLoadingLocation(true)
        setLocationError("")

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
                setUserLocation(coords)
                setLoadingLocation(false)
                placeUserMarker(coords)
                if (selectedMapaDirecciones.length === 1) {
                    fetchRoute(coords, selectedMapaDirecciones[0])
                }
            },
            (err) => {
                setLoadingLocation(false)
                const msgs: Record<number, string> = {
                    1: "Permiso de ubicación denegado",
                    2: "Ubicación no disponible",
                    3: "Tiempo de espera agotado",
                }
                setLocationError(msgs[err.code] ?? "Error al obtener ubicación")
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
    }

    const placeUserMarker = (coords: { lat: number; lng: number }) => {
        const map = mapInstanceRef.current
        const L = (window as any).L
        if (!map || !L) return

        if (userMarkerRef.current) userMarkerRef.current.remove()

        const userIcon = L.divIcon({
            html: `<div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center">
                <div style="position:absolute;width:32px;height:32px;background:rgba(59,130,246,0.2);border-radius:50%;"></div>
                <div style="position:relative;z-index:1;width:14px;height:14px;background:#3b82f6;border:2.5px solid #fff;border-radius:50%;box-shadow:0 0 0 3px rgba(59,130,246,0.3);"></div>
            </div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            className: "",
        })

        userMarkerRef.current = L.marker([coords.lat, coords.lng], { icon: userIcon })
            .addTo(map)
            .bindPopup('<div style="font-family:system-ui;font-size:12px"><strong style="color:#3b82f6">📍 Tu ubicación</strong></div>')

        const allPoints = [
            [coords.lat, coords.lng],
            ...selectedMapaDirecciones.map(d => [d.latitud, d.longitud]),
        ]
        map.fitBounds(L.latLngBounds(allPoints), { padding: [50, 50] })
    }

    const fetchRoute = async (from: { lat: number; lng: number }, to: Direccion) => {
        setLoadingRoute(true)
        setRouteInfo(null)
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.longitud},${to.latitud}?overview=full&geometries=polyline`
            const res = await fetch(url)
            const data = await res.json()
            if (data.code !== "Ok" || !data.routes?.[0]) throw new Error("Sin ruta")

            const route = data.routes[0]
            const geometry = decodePolyline(route.geometry)
            setRouteInfo({ distanceKm: route.distance / 1000, durationMin: route.duration / 60 })
            drawRoute(geometry)
        } catch {
            setLocationError("No se pudo calcular la ruta.")
        } finally {
            setLoadingRoute(false)
        }
    }

    const drawRoute = (points: [number, number][]) => {
        const map = mapInstanceRef.current
        const L = (window as any).L
        if (!map || !L) return

        if (routeLayerRef.current) {
            routeLayerRef.current.remove()
            routeLayerRef.current = null
        }

        L.polyline(points, { color: "#1e3a8a", weight: 8, opacity: 0.12 }).addTo(map)
        const line = L.polyline(points, { color: "#3b82f6", weight: 4, opacity: 0.9, dashArray: "10 6", lineCap: "round" }).addTo(map)
        routeLayerRef.current = line

        map.fitBounds(L.latLngBounds(points), { padding: [55, 55] })
    }

    const openGoogleMaps = () => {
        if (selectedMapaDirecciones.length === 0) return
        const waypoints = selectedMapaDirecciones.map(d => `${d.latitud},${d.longitud}`).join("/")
        const origin = userLocation ? `${userLocation.lat},${userLocation.lng}/` : ""
        window.open(`https://www.google.com/maps/dir/${origin}${waypoints}`, "_blank")
    }

    const formatDuration = (min: number) =>
        min < 60 ? `${Math.round(min)} min` : `${Math.floor(min / 60)}h ${Math.round(min % 60)}min`

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
                <DialogHeader className="px-6 pt-6 pb-3">
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        {mapaTitulo}
                    </DialogTitle>
                    <DialogDescription>
                        {selectedMapaDirecciones.length === 1
                            ? `Ubicación de ${selectedMapaDirecciones[0]?.NombreComercial}`
                            : `${selectedMapaDirecciones.length} ubicaciones en el mapa`}
                    </DialogDescription>
                </DialogHeader>

                {/* Barra de acciones */}
                <div className="px-6 py-3 flex flex-wrap items-center gap-2 border-y bg-gray-50/80">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={doRequestLocation}
                        disabled={loadingLocation}
                        className="flex items-center gap-1.5"
                    >
                        {loadingLocation
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Locate className="h-3.5 w-3.5 text-blue-600" />}
                        {userLocation ? "Actualizar ubicación" : "Activar ubicación"}
                    </Button>

                    {selectedMapaDirecciones.length === 1 && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => userLocation
                                ? fetchRoute(userLocation, selectedMapaDirecciones[0])
                                : doRequestLocation()
                            }
                            disabled={loadingRoute || !userLocation}
                            className="flex items-center gap-1.5"
                        >
                            {loadingRoute
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Route className="h-3.5 w-3.5 text-indigo-600" />}
                            {loadingRoute ? "Calculando..." : "Ruta más corta"}
                        </Button>
                    )}

                    <Button
                        size="sm"
                        onClick={openGoogleMaps}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white ml-auto"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Abrir en Google Maps
                    </Button>
                </div>

                {/* Badges de estado */}
                <div className="px-6 pt-2 pb-1 flex flex-wrap gap-2 min-h-[32px]">
                    {userLocation && !locationError && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            Ubicación activa
                        </Badge>
                    )}
                    {locationError && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {locationError}
                        </Badge>
                    )}
                    {routeInfo && (
                        <>
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs flex items-center gap-1">
                                <Navigation className="h-3 w-3" />
                                {routeInfo.distanceKm.toFixed(1)} km
                            </Badge>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                ~{formatDuration(routeInfo.durationMin)}
                            </Badge>
                        </>
                    )}
                    {!userLocation && !loadingLocation && !locationError && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Locate className="h-3 w-3" />
                            Activa tu ubicación para calcular la trayectoria
                        </span>
                    )}
                </div>

                {/* Contenedor del mapa */}
                <div className="px-6 pb-3">
                    <div
                        ref={mapCallbackRef}
                        style={{
                            width: "100%",
                            height: "420px",
                            borderRadius: "8px",
                            border: "1px solid #e5e7eb",
                            position: "relative",
                            zIndex: 0,
                            background: "#e5e7eb",
                        }}
                    />
                </div>

                {/* Lista de puntos (rutas múltiples) */}
                {selectedMapaDirecciones.length > 1 && (
                    <div className="px-6 pb-4 space-y-2">
                        <h4 className="font-medium text-sm text-gray-700">Puntos de la ruta:</h4>
                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                            {selectedMapaDirecciones.map((dir, i) => (
                                <div key={dir.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">{dir.NombreComercial}</div>
                                        <div className="text-xs text-gray-500 truncate">{dir.direccion}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <DialogFooter className="px-6 pb-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}