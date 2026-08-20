'use client'

import { useEffect, useMemo } from "react"
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
import { MapaLeaflet, PuntoMapa } from "@/components/mapa/MapaLeaflet"
import { useUbicacionYRuta, formatearDuracion } from "@/components/mapa/useUbicacionYRuta"

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

interface MapaModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    mapaTitulo: string
    selectedMapaDirecciones: Direccion[]
    generarMapaEstatico: (direcciones: Direccion[]) => string
}

export function MapaModal({
    isOpen,
    onOpenChange,
    mapaTitulo,
    selectedMapaDirecciones,
}: MapaModalProps) {
    const {
        ubicacion, errorUbicacion, cargandoUbicacion, pedirUbicacion,
        ruta, infoRuta, cargandoRuta, calcularRuta, limpiar,
    } = useUbicacionYRuta()

    const esPuntoUnico = selectedMapaDirecciones.length === 1

    const puntos: PuntoMapa[] = useMemo(
        () => selectedMapaDirecciones.map((d, i) => ({
            lat: d.latitud,
            lng: d.longitud,
            titulo: d.NombreComercial,
            descripcion: d.direccion,
            orden: selectedMapaDirecciones.length > 1 ? i + 1 : undefined,
        })),
        [selectedMapaDirecciones]
    )

    const destino = esPuntoUnico
        ? { lat: selectedMapaDirecciones[0].latitud, lng: selectedMapaDirecciones[0].longitud }
        : null

    // Al abrir se pide la ubicación sola; al cerrar se descarta todo.
    useEffect(() => {
        if (isOpen) {
            if (selectedMapaDirecciones.length > 0) pedirUbicacion(destino)
        } else {
            limpiar()
        }
    }, [isOpen])

    const abrirGoogleMaps = () => {
        if (selectedMapaDirecciones.length === 0) return
        const waypoints = selectedMapaDirecciones.map(d => `${d.latitud},${d.longitud}`).join("/")
        const origen = ubicacion ? `${ubicacion.lat},${ubicacion.lng}/` : ""
        window.open(`https://www.google.com/maps/dir/${origen}${waypoints}`, "_blank")
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
                <DialogHeader className="px-4 pt-5 pb-3 sm:px-6 sm:pt-6">
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        {mapaTitulo}
                    </DialogTitle>
                    <DialogDescription>
                        {esPuntoUnico
                            ? `Ubicación de ${selectedMapaDirecciones[0]?.NombreComercial}`
                            : `${selectedMapaDirecciones.length} ubicaciones en el mapa`}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-wrap items-center gap-2 border-y bg-muted/80 px-4 py-3 sm:px-6">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => pedirUbicacion(destino)}
                        disabled={cargandoUbicacion}
                        className="flex items-center gap-1.5"
                    >
                        {cargandoUbicacion
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Locate className="h-3.5 w-3.5 text-blue-600" />}
                        {ubicacion ? "Actualizar ubicación" : "Activar ubicación"}
                    </Button>

                    {esPuntoUnico && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => ubicacion && destino
                                ? calcularRuta(ubicacion, destino)
                                : pedirUbicacion(destino)}
                            disabled={cargandoRuta || !ubicacion}
                            className="flex items-center gap-1.5"
                        >
                            {cargandoRuta
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Route className="h-3.5 w-3.5 text-indigo-600" />}
                            {cargandoRuta ? "Calculando..." : "Ruta más corta"}
                        </Button>
                    )}

                    <Button
                        size="sm"
                        onClick={abrirGoogleMaps}
                        className="ml-auto flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Abrir en Google Maps
                    </Button>
                </div>

                <div className="flex min-h-[32px] flex-wrap gap-2 px-4 pb-1 pt-2 sm:px-6">
                    {ubicacion && !errorUbicacion && (
                        <Badge variant="outline" className="flex items-center gap-1 border-blue-200 bg-blue-50 text-xs text-blue-700">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            Ubicación activa
                        </Badge>
                    )}
                    {errorUbicacion && (
                        <Badge variant="outline" className="flex items-center gap-1 border-red-200 bg-red-50 text-xs text-red-700">
                            <AlertCircle className="h-3 w-3" />
                            {errorUbicacion}
                        </Badge>
                    )}
                    {infoRuta && (
                        <>
                            <Badge variant="outline" className="flex items-center gap-1 border-indigo-200 bg-indigo-50 text-xs text-indigo-700">
                                <Navigation className="h-3 w-3" />
                                {infoRuta.distanciaKm.toFixed(1)} km
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1 border-green-200 bg-green-50 text-xs text-green-700">
                                <Clock className="h-3 w-3" />
                                ~{formatearDuracion(infoRuta.duracionMin)}
                            </Badge>
                        </>
                    )}
                    {!ubicacion && !cargandoUbicacion && !errorUbicacion && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Locate className="h-3 w-3" />
                            Activa tu ubicación para calcular la trayectoria
                        </span>
                    )}
                </div>

                <div className="px-4 pb-3 sm:px-6">
                    {isOpen && (
                        <MapaLeaflet
                            puntos={puntos}
                            ubicacionUsuario={ubicacion}
                            ruta={ruta}
                            altura={420}
                        />
                    )}
                </div>

                {selectedMapaDirecciones.length > 1 && (
                    <div className="space-y-2 px-4 pb-4 sm:px-6">
                        <h4 className="text-sm font-medium text-foreground">Puntos de la ruta:</h4>
                        <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
                            {selectedMapaDirecciones.map((dir, i) => (
                                <div key={dir.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted p-2.5">
                                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                                        {i + 1}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium">{dir.NombreComercial}</div>
                                        <div className="truncate text-xs text-muted-foreground">{dir.direccion}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <DialogFooter className="px-4 pb-5 sm:px-6 sm:pb-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
