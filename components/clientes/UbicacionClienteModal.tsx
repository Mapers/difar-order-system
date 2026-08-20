'use client'

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { MapPin, ExternalLink, AlertCircle, Building, MapPinOff } from "lucide-react"
import apiClient from "@/app/api/client"
import { MapaLeaflet, PuntoMapa } from "@/components/mapa/MapaLeaflet"

export interface UbicacionCliente {
    codigo: string
    nombre: string | null
    nombreComercial: string | null
    direccion: string | null
    zona: string | null
    latitud: number | null
    longitud: number | null
}

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    codigoCliente: string | null
    nombreCliente?: string
}

export function UbicacionClienteModal({ open, onOpenChange, codigoCliente, nombreCliente }: Props) {
    const [cliente, setCliente] = useState<UbicacionCliente | null>(null)
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!open || !codigoCliente) return

        let cancelado = false
        setCargando(true)
        setError("")
        setCliente(null)

        apiClient.get(`/clientes/${encodeURIComponent(codigoCliente)}/ubicacion`)
            .then(res => { if (!cancelado) setCliente(res.data?.data ?? null) })
            .catch(() => { if (!cancelado) setError("No se pudo cargar la ubicación del cliente.") })
            .finally(() => { if (!cancelado) setCargando(false) })

        return () => { cancelado = true }
    }, [open, codigoCliente])

    useEffect(() => { if (!open) { setCliente(null); setError("") } }, [open])

    const destino = useMemo(
        () => (cliente?.latitud != null && cliente?.longitud != null)
            ? { lat: cliente.latitud, lng: cliente.longitud }
            : null,
        [cliente]
    )

    const puntos: PuntoMapa[] = useMemo(
        () => destino && cliente
            ? [{
                lat: destino.lat,
                lng: destino.lng,
                titulo: cliente.nombreComercial || cliente.nombre || cliente.codigo,
                descripcion: cliente.direccion ?? undefined,
            }]
            : [],
        [destino, cliente]
    )

    const titulo = cliente?.nombreComercial || cliente?.nombre || nombreCliente || "Ubicación del cliente"

    const abrirGoogleMaps = () => {
        if (destino) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${destino.lat},${destino.lng}`, "_blank")
            return
        }

        const consulta = [cliente?.direccion, cliente?.nombreComercial].filter(Boolean).join(" ")
        if (!consulta) return
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}`, "_blank")
    }

    const dato = (Icono: typeof MapPin, etiqueta: string, valor?: string | null) => (
        <div className="flex min-w-0 items-start gap-2">
            <Icono className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{etiqueta}</p>
                <p className="break-words text-sm font-medium">{valor || "—"}</p>
            </div>
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[95vh] max-w-3xl overflow-y-auto p-0">
                <DialogHeader className="px-4 pb-3 pt-5 sm:px-6 sm:pt-6">
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <MapPin className="h-5 w-5 shrink-0 text-blue-600" />
                        <span className="truncate">{titulo}</span>
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Dirección y ubicación en el mapa del cliente {cliente?.codigo ?? ""}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 border-y bg-muted/60 px-4 py-4 sm:grid-cols-2 sm:px-6">
                    {cargando ? (
                        <>
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </>
                    ) : (
                        <>
                            {dato(MapPin, "Dirección", cliente?.direccion)}
                            {dato(Building, "Zona", cliente?.zona)}
                        </>
                    )}
                </div>

                {error && (
                    <div className="px-4 pt-3 sm:px-6">
                        <Badge variant="outline" className="flex w-fit items-center gap-1 border-red-200 bg-red-50 text-xs text-red-700">
                            <AlertCircle className="h-3 w-3" />
                            {error}
                        </Badge>
                    </div>
                )}

                <div className="px-4 pt-4 sm:px-6">
                    {cargando && <Skeleton className="h-[300px] w-full rounded-lg sm:h-[380px]" />}

                    {!cargando && destino && open && (
                        <MapaLeaflet puntos={puntos} altura={340} className="sm:!h-[400px]" />
                    )}

                    {!cargando && !destino && !error && (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
                            <MapPinOff className="mb-3 h-10 w-10 text-muted-foreground" />
                            <p className="text-sm font-medium">Este cliente no tiene ubicación registrada</p>
                            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                                No hay coordenadas cargadas para su local. Puedes buscar la dirección
                                en Google Maps con el botón de abajo.
                            </p>
                        </div>
                    )}
                </div>

                {!cargando && !error && (
                    <div className="px-4 pb-5 pt-3 sm:px-6 sm:pb-6">
                        <Button
                            onClick={abrirGoogleMaps}
                            disabled={!destino && !cliente?.direccion}
                            className="flex w-full items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
                        >
                            <ExternalLink className="h-4 w-4" />
                            {destino ? "Abrir en Google Maps" : "Buscar dirección en Google Maps"}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
