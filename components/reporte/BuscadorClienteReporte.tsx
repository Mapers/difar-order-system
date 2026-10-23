'use client'

import { useEffect, useMemo, useState } from "react"
import { User } from "lucide-react"
import { Button } from "@/components/ui/button"
import InlineAutocomplete from "@/components/tomar-pedido/InlineAutocomplete"
import { normalizarBusqueda, TextoResaltado } from "@/components/texto-resaltado"
import { fetchGetAllClients } from "@/app/api/takeOrders"
import { useAuth } from "@/context/authContext"

/** Lo mínimo que muestra el buscador de un cliente. */
export interface ClienteBusqueda {
    codigo:           string
    Nombre:           string
    NombreComercial?: string | null
    RUC?:             string | null
    /** Línea extra bajo el nombre (p. ej. la dirección). */
    detalle?:         string | null
}

/**
 * Buscador de cliente de los reportes, con el mismo diseño que el de Cliente
 * Cobranza: tarjeta "Buscar cliente", lista con nombre, nombre comercial y RUC
 * resaltando lo escrito, y ya elegido la tarjeta azul con "Cambiar".
 *
 * Sin `clientes`, carga el listado completo respetando que el vendedor solo vea
 * sus clientes y el representante los suyos. Con `clientes`, busca solo entre esos.
 */
export function BuscadorClienteReporte({
    valor, onChange, clientes, descripcion = "Por RUC, nombre o nombre comercial", disabled = false,
}: {
    valor:        ClienteBusqueda | null
    onChange:     (cliente: ClienteBusqueda | null) => void
    clientes?:    ClienteBusqueda[]
    descripcion?: string
    disabled?:    boolean
}) {
    const auth = useAuth()
    const [listado, setListado] = useState<ClienteBusqueda[]>([])
    const [cargando, setCargando] = useState(false)
    const [busqueda, setBusqueda] = useState("")

    useEffect(() => {
        if (clientes || !auth.user) return
        let vivo = true
        setCargando(true)
        const sellerCode = auth.isAdmin() ? "" : (auth.user?.codigo || "")
        const representante = auth.isAdmin() ? "" : (auth.user?.codRepres || "")
        fetchGetAllClients(sellerCode, auth.isAdmin(), representante)
            .then(res => { if (vivo) setListado(res.data?.data?.data || res.data?.data || []) })
            .catch(() => { if (vivo) setListado([]) })
            .finally(() => { if (vivo) setCargando(false) })
        return () => { vivo = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientes, auth.user])

    const fuente = clientes ?? listado

    // Sin distinguir mayúsculas ni tildes: "bazan" encuentra "BAZÁN".
    const filtrados = useMemo(() => {
        const q = busqueda.trim()
        if (!q) return fuente
        const n = normalizarBusqueda(q)
        return fuente.filter(c =>
            (c.RUC ?? '').includes(q) ||
            normalizarBusqueda(c.Nombre).includes(n) ||
            normalizarBusqueda(c.NombreComercial ?? '').includes(n) ||
            normalizarBusqueda(c.detalle ?? '').includes(n))
    }, [fuente, busqueda])

    if (valor) {
        return (
            <div className="flex min-h-[50px] items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-2.5 dark:border-blue-900 dark:bg-blue-950/40">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
                    <User className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-tight text-blue-900 dark:text-blue-100" title={valor.Nombre}>
                        {valor.Nombre}
                    </p>
                    <p className="truncate text-xs text-blue-600 dark:text-blue-400">
                        {valor.RUC ? `RUC: ${valor.RUC}` : (valor.detalle || valor.codigo)}
                    </p>
                </div>
                <Button
                    type="button" size="sm" variant="outline" disabled={disabled}
                    onClick={() => { setBusqueda(""); onChange(null) }}
                    className="h-7 shrink-0 border-blue-200 bg-background px-2.5 text-xs text-blue-600 hover:bg-blue-100"
                >
                    Cambiar
                </Button>
            </div>
        )
    }

    return (
        <InlineAutocomplete<ClienteBusqueda>
            variant="tile"
            tileAccent="blue"
            tileIcon={User}
            tileTitle="Buscar cliente"
            tileDescription={descripcion}
            placeholder="RUC, nombre o nombre comercial..."
            value={busqueda}
            onValueChange={setBusqueda}
            loading={cargando}
            disabled={disabled}
            items={filtrados}
            pageSize={30}
            getKey={c => c.codigo}
            getItemLabel={c => c.Nombre}
            onSelect={c => { setBusqueda(""); onChange(c) }}
            emptyMessage="No se encontraron clientes"
            idleMessage="Escribe para buscar clientes"
            renderItem={c => (
                <div className="flex items-start gap-3 px-3 py-2.5">
                    <div className="mt-0.5 shrink-0 rounded-full bg-blue-100 p-2">
                        <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="line-clamp-1 text-sm font-semibold leading-tight text-foreground">
                            <TextoResaltado texto={c.Nombre} busqueda={busqueda} />
                        </span>
                        {c.NombreComercial && c.NombreComercial.trim().toUpperCase() !== c.Nombre?.trim().toUpperCase() && (
                            <span className="line-clamp-1 text-xs text-muted-foreground">
                                <TextoResaltado texto={c.NombreComercial} busqueda={busqueda} />
                            </span>
                        )}
                        {c.RUC && (
                            <span className="text-xs text-muted-foreground">
                                <span className="font-medium">RUC:</span> <TextoResaltado texto={c.RUC} busqueda={busqueda} />
                            </span>
                        )}
                        {c.detalle && (
                            <span className="line-clamp-1 text-xs text-muted-foreground">
                                <TextoResaltado texto={c.detalle} busqueda={busqueda} />
                            </span>
                        )}
                    </div>
                </div>
            )}
        />
    )
}
