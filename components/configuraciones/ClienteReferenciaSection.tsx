'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Images, Search, User, ChevronLeft, ChevronRight } from "lucide-react"
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import apiClient from "@/app/api/client"
import { useAuth } from "@/context/authContext"
import { fetchGetAllClients } from "@/app/api/takeOrders"
import { IClient } from "@/app/types/order/client-interface"
import { ClienteReferenciaImagen, REFERENCIA_MAX } from "@/app/types/cliente-referencia-types"
import { ReferenciasClienteGaleria } from "@/components/clientes/ReferenciasClienteGaleria"

interface ClienteReferenciaSectionProps {
    onOpenModalChange: (fn: () => void) => void;
}

const PAGE_SIZE = 12

export default function ClienteReferenciaSection({ onOpenModalChange }: ClienteReferenciaSectionProps) {
    const { user, isAdmin } = useAuth()

    const [data, setData] = useState<IClient[]>([])
    const [imagenes, setImagenes] = useState<ClienteReferenciaImagen[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedQuery, setDebouncedQuery] = useState("")
    const [soloConImagenes, setSoloConImagenes] = useState(false)
    const [page, setPage] = useState(1)

    const [clienteAbierto, setClienteAbierto] = useState<IClient | null>(null)
    const huboCambios = useRef(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery)
            setPage(1)
        }, 400)
        return () => clearTimeout(timer)
    }, [searchQuery])

    useEffect(() => { setPage(1) }, [soloConImagenes])

    const noOp = useCallback(() => {}, [])
    useEffect(() => { onOpenModalChange(noOp) }, [onOpenModalChange, noOp])

    const porCliente = useMemo(() => {
        const mapa = new Map<string, ClienteReferenciaImagen[]>()
        imagenes.forEach(img => {
            const lista = mapa.get(img.codigo_cliente) ?? []
            lista.push(img)
            mapa.set(img.codigo_cliente, lista)
        })
        return mapa
    }, [imagenes])

    const cargarImagenes = useCallback(async () => {
        try {
            const res = await apiClient.get('/clientes/referencias-imagenes')
            setImagenes(res.data?.data?.data ?? [])
        } catch (error) {
            console.error("Error cargando las imágenes de referencia", error)
            setImagenes([])
        }
    }, [])

    const loadInitialData = useCallback(async () => {
        setLoading(true)
        try {
            const sellerCode = isAdmin() ? "" : (user?.codigo || "")
            const representante = isAdmin() ? "" : (user?.codRepres || "")
            const resCli = await fetchGetAllClients(sellerCode, isAdmin(), representante)
            setData(resCli.data?.data?.data || resCli.data?.data || [])
            await cargarImagenes()
        } catch (error) {
            console.error("Error cargando catálogos", error)
        } finally {
            setLoading(false)
        }
    }, [user, isAdmin, cargarImagenes])

    useEffect(() => { if (user) loadInitialData() }, [user])

    const filteredData = data.filter(item => {
        if (soloConImagenes && !porCliente.has(item.codigo)) return false
        if (!debouncedQuery) return true

        const q = debouncedQuery.toLowerCase()
        return (
            item.Nombre?.toLowerCase().includes(q) ||
            item.NombreComercial?.toLowerCase().includes(q) ||
            item.RUC?.toLowerCase().includes(q) ||
            item.codigo?.toLowerCase().includes(q)
        )
    })

    const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE))
    const paginatedData = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    const cerrarGestion = () => {
        setClienteAbierto(null)
        if (huboCambios.current) {
            huboCambios.current = false
            cargarImagenes()
        }
    }

    return (
        <>
            <div className="mb-4 flex flex-col gap-3 rounded-lg border border-border bg-muted p-3 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-3">
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre, RUC o código de cliente..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-9 border-border bg-background text-sm"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant={soloConImagenes ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSoloConImagenes(v => !v)}
                        className="whitespace-nowrap text-xs"
                    >
                        <Images className="mr-1 h-3.5 w-3.5" />
                        Solo con imágenes
                    </Button>

                    {data.length > 0 && (
                        <Badge variant="outline" className="whitespace-nowrap text-xs">
                            {filteredData.length} cliente{filteredData.length === 1 ? '' : 's'}
                        </Badge>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
                </div>
            ) : paginatedData.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {paginatedData.map((item) => {
                            const cuantas = porCliente.get(item.codigo)?.length ?? 0

                            return (
                                <Card key={item.codigo} className="overflow-hidden transition-shadow hover:shadow-md">
                                    <CardContent className="p-4">
                                        <div className="mb-2 min-w-0">
                                            <h3 className="truncate text-sm font-bold text-card-foreground">
                                                {item.Nombre}
                                            </h3>
                                            {item.NombreComercial && (
                                                <p className="truncate text-[10px] text-muted-foreground">
                                                    {item.NombreComercial}
                                                </p>
                                            )}
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                RUC: {item.RUC} · Cod: {item.codigo}
                                            </p>
                                        </div>

                                        <div className={`my-3 rounded-lg border p-3 ${
                                            cuantas > 0
                                                ? 'border-emerald-100 bg-emerald-50'
                                                : 'border-amber-100 bg-amber-50'
                                        }`}>
                                            <p className={`mb-0.5 text-[10px] font-semibold uppercase ${
                                                cuantas > 0 ? 'text-emerald-500' : 'text-amber-500'
                                            }`}>
                                                Imágenes de referencia
                                            </p>
                                            <p className={`text-lg font-bold ${
                                                cuantas > 0 ? 'text-emerald-800' : 'text-amber-800'
                                            }`}>
                                                {cuantas > 0 ? `${cuantas} de ${REFERENCIA_MAX}` : 'Sin imágenes'}
                                            </p>
                                        </div>

                                        {(item.Vendedor?.trim() || item.NombreZona) && (
                                            <div className="mb-3 flex gap-2 text-[10px] text-muted-foreground">
                                                {item.Vendedor?.trim() && (
                                                    <span className="truncate">
                                                        <User className="mr-0.5 inline h-3 w-3" />
                                                        {item.Vendedor.trim()}
                                                    </span>
                                                )}
                                                {item.NombreZona && <span className="truncate">· {item.NombreZona}</span>}
                                            </div>
                                        )}

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setClienteAbierto(item)}
                                            className="w-full text-xs"
                                        >
                                            <Images className="mr-1 h-3 w-3" /> Gestionar imágenes
                                        </Button>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-center gap-2">
                            <Button variant="outline" size="sm" disabled={page <= 1}
                                    onClick={() => setPage(p => p - 1)} className="text-xs">
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            <span className="text-xs text-muted-foreground">
                                Página {page} de {totalPages}
                            </span>
                            <Button variant="outline" size="sm" disabled={page >= totalPages}
                                    onClick={() => setPage(p => p + 1)} className="text-xs">
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                <div className="py-8 text-center">
                    <Images className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-medium text-foreground">
                        {soloConImagenes
                            ? "Ningún cliente tiene imágenes todavía"
                            : debouncedQuery
                                ? "No se encontraron clientes"
                                : "No hay clientes registrados"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {soloConImagenes
                            ? "Desactiva el filtro para ver todos los clientes y empezar a cargar."
                            : debouncedQuery
                                ? "Intenta con otro término de búsqueda"
                                : "Los clientes aparecerán aquí cuando existan en el sistema"}
                    </p>
                </div>
            )}

            <Dialog
                open={clienteAbierto != null}
                onOpenChange={(v) => { if (!v) cerrarGestion() }}
            >
                <DialogContent className="max-h-[95vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg">
                            {clienteAbierto?.Nombre ?? "Imágenes de referencia"}
                        </DialogTitle>
                        <DialogDescription>
                            {[clienteAbierto?.codigo, clienteAbierto?.RUC].filter(Boolean).join(" · ")}
                            {" — hasta "}{REFERENCIA_MAX}{" imágenes de la fachada y puntos de referencia."}
                        </DialogDescription>
                    </DialogHeader>

                    <ReferenciasClienteGaleria
                        codigoCliente={clienteAbierto?.codigo ?? null}
                        abierto={clienteAbierto != null}
                        puedeGestionar
                        onCambio={() => { huboCambios.current = true }}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}
