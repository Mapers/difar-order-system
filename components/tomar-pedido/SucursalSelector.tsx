'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
    Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { Loader2, MapPin, Plus, AlertCircle, Check, ChevronDown, Search, Landmark } from 'lucide-react'
import { toast } from '@/app/hooks/useToast'
import apiClient from '@/app/api/client'
import { ClientService } from '@/app/services/client/ClientService'
import { fetchUpdateClientRef } from '@/app/api/takeOrders'

export interface Sucursal {
    idSucursal : number
    direccion  : string
    referencia : string | null
    idZona     : string | null
    nombreZona : string | null
    idDistrito?        : number | null
    nombreDistrito?    : string | null
    nombreProvincia?   : string | null
    nombreDepartamento?: string | null
    esPrincipal: number
}

function ubicacion(s: Sucursal): string {
    return [s.nombreDistrito, s.nombreProvincia].filter(Boolean).join(', ')
}

export function SucursalSelector({
    clienteCodigo, clienteDireccion, clienteTelefono, seleccionada, onSeleccionar, usuarioId, onPrincipalGuardada,
}: {
    clienteCodigo   : string
    clienteDireccion?: string
    /** Se reenvía al guardar la dirección principal (el endpoint actualiza ambos). */
    clienteTelefono?: string | null
    seleccionada    : Sucursal | null
    onSeleccionar   : (s: Sucursal) => void
    usuarioId?      : number | null
    /** Avisa al pedido cuando se registra la dirección principal de un cliente que no tenía. */
    onPrincipalGuardada?: (direccion: string, referencia: string | null) => void
}) {
    const [sucursales, setSucursales] = useState<Sucursal[]>([])
    const [cargando, setCargando]     = useState(false)
    const [abierto, setAbierto]       = useState(false)
    // 'principal' = el cliente no tiene dirección y hay que registrarla antes de seguir.
    const [modo, setModo]             = useState<'sucursal' | 'principal'>('sucursal')

    const seleccionRef = useRef(seleccionada)
    seleccionRef.current = seleccionada
    const onSeleccionarRef = useRef(onSeleccionar)
    onSeleccionarRef.current = onSeleccionar
    const direccionRef = useRef(clienteDireccion)
    direccionRef.current = clienteDireccion

    const cargar = useCallback(async (codigo: string) => {
        setCargando(true)
        try {
            const res = await apiClient.get(`/clientes/${encodeURIComponent(codigo)}/sucursales`)
            const lista: Sucursal[] = res.data?.data ?? []
            setSucursales(lista)

            // Sin dirección principal no hay a dónde despachar: se pide de inmediato.
            const principal = lista.find(s => s.esPrincipal === 1)
            if (!String(principal?.direccion ?? direccionRef.current ?? '').trim()) {
                setModo('principal')
                setAbierto(true)
            }

            const actual = seleccionRef.current
            const sigueValida = actual && lista.some(x => x.idSucursal === actual.idSucursal)
            if (!sigueValida) {
                const principal = lista.find(s => s.esPrincipal === 1) ?? lista[0]
                if (principal) onSeleccionarRef.current(principal)
            }
        } catch {
            const fallback: Sucursal = {
                idSucursal: 0, direccion: direccionRef.current ?? '',
                referencia: null, idZona: null, nombreZona: null, esPrincipal: 1,
            }
            setSucursales([fallback])
            if (!seleccionRef.current) onSeleccionarRef.current(fallback)
            toast({
                title: 'No se pudieron cargar las sucursales',
                description: 'Se usará la dirección principal del cliente.',
                variant: 'warning',
            })
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => {
        if (clienteCodigo) cargar(clienteCodigo)
    }, [clienteCodigo, cargar])

    const agregada = (s: Sucursal) => {
        setSucursales(prev => [...prev, s])
        onSeleccionar(s)
        setAbierto(false)
    }

    const principalGuardada = (direccion: string, referencia: string | null) => {
        const base = sucursales.find(s => s.esPrincipal === 1)
        const principal: Sucursal = {
            ...(base ?? { idSucursal: 0, idZona: null, nombreZona: null, esPrincipal: 1 }),
            direccion, referencia,
        }
        setSucursales(prev => base ? prev.map(s => s.esPrincipal === 1 ? principal : s) : [principal, ...prev])
        onSeleccionar(principal)
        onPrincipalGuardada?.(direccion, referencia)
        setAbierto(false)
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <Label className="text-sm font-medium text-muted-foreground">
                    Dirección de entrega
                </Label>
                <Button
                    type="button" variant="outline" size="sm"
                    className="h-7 gap-1.5 px-2 text-xs"
                    onClick={() => { setModo('sucursal'); setAbierto(true) }}
                >
                    <Plus className="h-3.5 w-3.5" /> Agregar sucursal
                </Button>
            </div>

            {cargando ? (
                <div className="flex items-center gap-2 rounded-lg border p-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando direcciones…
                </div>
            ) : (
                <div className="space-y-1.5" role="radiogroup" aria-label="Dirección de entrega">
                    {sucursales.map(s => {
                        const activa = seleccionada?.idSucursal === s.idSucursal
                        return (
                            <button
                                key={s.idSucursal}
                                type="button"
                                role="radio"
                                aria-checked={activa}
                                onClick={() => onSeleccionar(s)}
                                className={`flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors ${
                                    activa
                                        ? 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/40'
                                        : 'border-border hover:bg-accent/50'
                                }`}
                            >
                                <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                                    activa ? 'border-blue-600' : 'border-muted-foreground/40'
                                }`}>
                                    {activa && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                                </span>

                                <span className="min-w-0 flex-1">
                                    <span className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-sm font-medium leading-tight">
                                            {s.direccion || 'Sin dirección'}
                                        </span>
                                        {s.esPrincipal === 1 && (
                                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                Principal
                                            </span>
                                        )}
                                    </span>
                                    {(s.referencia || s.nombreZona || ubicacion(s)) && (
                                        <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                                            {ubicacion(s) && <span>{ubicacion(s)}</span>}
                                            {s.referencia && <span>{s.referencia}</span>}
                                            {s.nombreZona && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3 shrink-0" />{s.nombreZona}
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </span>
                            </button>
                        )
                    })}
                </div>
            )}

            <NuevaSucursalDialog
                abierto={abierto}
                modo={modo}
                onCerrar={() => setAbierto(false)}
                clienteCodigo={clienteCodigo}
                clienteTelefono={clienteTelefono}
                usuarioId={usuarioId}
                onCreada={agregada}
                onPrincipalGuardada={principalGuardada}
            />
        </div>
    )
}

function NuevaSucursalDialog({
    abierto, modo, onCerrar, clienteCodigo, clienteTelefono, usuarioId, onCreada, onPrincipalGuardada,
}: {
    abierto      : boolean
    modo         : 'sucursal' | 'principal'
    onCerrar     : () => void
    clienteCodigo: string
    clienteTelefono?: string | null
    usuarioId?   : number | null
    onCreada     : (s: Sucursal) => void
    onPrincipalGuardada: (direccion: string, referencia: string | null) => void
}) {
    const esPrincipal = modo === 'principal'
    const [punto, setPunto] = useState<{ lat: number; lon: number } | null>(null)
    const [direccion, setDireccion]   = useState('')
    const [referencia, setReferencia] = useState('')
    const [idZona, setIdZona]         = useState('')
    const [zonas, setZonas]           = useState<any[]>([])
    const [zonaAbierta, setZonaAbierta] = useState(false)
    const [provincias, setProvincias] = useState<any[]>([])
    const [distritos, setDistritos]   = useState<any[]>([])
    const [idProvincia, setIdProvincia] = useState<number | null>(null)
    const [idDistrito, setIdDistrito]   = useState<number | null>(null)
    const [provinciaAbierta, setProvinciaAbierta] = useState(false)
    const [distritoAbierto, setDistritoAbierto]   = useState(false)
    const [guardando, setGuardando]   = useState(false)
    const [error, setError]           = useState<string | null>(null)

    useEffect(() => {
        if (!abierto) return
        setDireccion(''); setReferencia(''); setIdZona(''); setError(null); setZonaAbierta(false); setPunto(null)
        setIdProvincia(null); setIdDistrito(null)
        setProvinciaAbierta(false); setDistritoAbierto(false)
        ClientService.getZones()
            .then(r => setZonas(r?.data ?? r ?? []))
            .catch(() => setZonas([]))
        // Los catálogos no cambian mientras el modal está abierto: se piden
        // una vez por apertura, como las zonas.
        ClientService.getProvincesCities()
            .then(r => setProvincias(r?.data ?? r ?? []))
            .catch(() => setProvincias([]))
        apiClient.get('/clientes/ciudad/distritos')
            .then(r => setDistritos(r.data?.data ?? []))
            .catch(() => setDistritos([]))
    }, [abierto])

    const distritosDeProvincia = idProvincia
        ? distritos.filter((d: any) => d.idProvincia === idProvincia)
        : []

    // Al elegir un resultado del buscador se llenan dirección, referencia,
    // provincia y distrito; todo queda editable.
    const aplicarResultado = (r: ResultadoDireccion) => {
        setDireccion(r.direccion.slice(0, 100))
        if (r.referencia) setReferencia(r.referencia.slice(0, 255))
        setPunto({ lat: r.lat, lon: r.lon })
        const prov = provincias.find((p: any) => mismoNombre(p.nombre, r.provincia))
        if (prov) {
            setIdProvincia(prov.id)
            const dist = distritos.find((d: any) => d.idProvincia === prov.id && mismoNombre(d.nombre, r.distrito))
            setIdDistrito(dist ? dist.id : null)
        }
        setError(null)
    }

    const guardarPrincipal = async () => {
        if (!direccion.trim()) { setError('La dirección es obligatoria'); return }
        setGuardando(true); setError(null)
        try {
            await fetchUpdateClientRef(clienteCodigo, direccion.trim(), clienteTelefono ?? '', referencia.trim())
            toast({ title: 'Dirección registrada', description: direccion.trim() })
            onPrincipalGuardada(direccion.trim(), referencia.trim() || null)
        } catch (e: any) {
            setError(e?.response?.data?.message || 'No se pudo guardar la dirección.')
        } finally {
            setGuardando(false)
        }
    }

    const guardar = async () => {
        if (esPrincipal) return guardarPrincipal()
        if (!direccion.trim()) { setError('La dirección es obligatoria'); return }
        if (!idZona)           { setError('La zona es obligatoria');      return }
        if (!idDistrito)       { setError('El distrito es obligatorio');  return }

        setGuardando(true); setError(null)
        try {
            const res = await apiClient.post(
                `/clientes/${encodeURIComponent(clienteCodigo)}/sucursales`,
                { direccion: direccion.trim(), referencia: referencia.trim() || null,
                  idZona, idDistrito, usuario: usuarioId ?? null },
            )
            const creada: Sucursal | null = res.data?.data ?? null
            if (!creada) throw new Error('sin respuesta')
            toast({ title: 'Sucursal creada', description: creada.direccion })
            onCreada(creada)
        } catch (e: any) {
            setError(e?.response?.data?.message || 'No se pudo crear la sucursal.')
        } finally {
            setGuardando(false)
        }
    }

    return (
        <Dialog open={abierto} onOpenChange={v => { if (!v) onCerrar() }}>
            <DialogContent className="flex max-h-[92vh] flex-col gap-4 overflow-y-auto sm:max-w-lg"
                           onOpenAutoFocus={e => e.preventDefault()}>
                <DialogHeader className="text-left">
                    <DialogTitle className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white">
                            <MapPin className="h-4 w-4" />
                        </span>
                        {esPrincipal ? 'Dirección del cliente' : 'Nueva sucursal'}
                    </DialogTitle>
                    <DialogDescription>
                        {esPrincipal
                            ? 'Este cliente no tiene dirección registrada. Búscala o escríbela para poder despachar el pedido.'
                            : 'Busca la dirección o un lugar de referencia; queda disponible de inmediato para este cliente.'}
                    </DialogDescription>
                </DialogHeader>

                <BuscadorDireccion onElegir={aplicarResultado} />

                {punto && (
                    <iframe
                        title="Ubicación encontrada"
                        className="h-36 w-full shrink-0 rounded-lg border"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${punto.lon - 0.004}%2C${punto.lat - 0.003}%2C${punto.lon + 0.004}%2C${punto.lat + 0.003}&layer=mapnik&marker=${punto.lat}%2C${punto.lon}`}
                    />
                )}

                <div className="space-y-3">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">
                            Dirección<span className="ml-0.5 text-red-500">*</span>
                        </Label>
                        <Input
                            className="h-9" value={direccion} maxLength={100}
                            placeholder="Av. Los Olivos 456"
                            onChange={e => setDireccion(e.target.value)}
                        />
                    </div>

                    {!esPrincipal && (<>
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">
                            Zona<span className="ml-0.5 text-red-500">*</span>
                        </Label>
                        {/* Mismo combobox con buscador que usa modalClientEdit:
                            la lista de zonas es larga y un select plano obliga
                            a recorrerla a mano. */}
                        <Popover open={zonaAbierta} onOpenChange={setZonaAbierta}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={zonaAbierta}
                                    aria-haspopup="listbox"
                                    className="h-9 w-full justify-between font-normal"
                                >
                                    <span className={cn('truncate', !idZona && 'text-muted-foreground')}>
                                        {idZona
                                            ? zonas.find((z: any) => z.IdZona === idZona)?.NombreZona || idZona
                                            : 'Seleccionar zona...'}
                                    </span>
                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-[--radix-popover-trigger-width] p-0"
                                align="start"
                            >
                                <Command>
                                    <CommandInput placeholder="Buscar zona..." />
                                    <CommandList role="listbox" aria-label="Zonas">
                                        <CommandEmpty>No se encontraron zonas.</CommandEmpty>
                                        <CommandGroup>
                                            {zonas.map((z: any) => (
                                                <CommandItem
                                                    key={z.IdZona}
                                                    value={z.NombreZona || String(z.IdZona)}
                                                    role="option"
                                                    aria-selected={idZona === z.IdZona}
                                                    onSelect={() => {
                                                        setIdZona(z.IdZona)
                                                        setZonaAbierta(false)
                                                    }}
                                                >
                                                    <Check className={cn('mr-2 h-4 w-4',
                                                        idZona === z.IdZona ? 'opacity-100' : 'opacity-0')} />
                                                    {z.NombreZona || z.IdZona}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">
                                Provincia<span className="ml-0.5 text-red-500">*</span>
                            </Label>
                            <Popover open={provinciaAbierta} onOpenChange={setProvinciaAbierta}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={provinciaAbierta}
                                        aria-haspopup="listbox"
                                        className="h-9 w-full justify-between font-normal"
                                    >
                                        <span className={cn('truncate', !idProvincia && 'text-muted-foreground')}>
                                            {idProvincia
                                                ? provincias.find((p: any) => p.id === idProvincia)?.nombre || idProvincia
                                                : 'Seleccionar provincia...'}
                                        </span>
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-[--radix-popover-trigger-width] p-0"
                                    align="start"
                                >
                                    <Command>
                                        <CommandInput placeholder="Buscar provincia..." />
                                        <CommandList role="listbox" aria-label="Provincias">
                                            <CommandEmpty>No se encontraron provincias.</CommandEmpty>
                                            <CommandGroup>
                                                {provincias.map((p: any) => (
                                                    <CommandItem
                                                        key={p.id}
                                                        value={`${p.nombre} ${p.id}`}
                                                        role="option"
                                                        aria-selected={idProvincia === p.id}
                                                        onSelect={() => {
                                                            if (p.id !== idProvincia) setIdDistrito(null)
                                                            setIdProvincia(p.id)
                                                            setProvinciaAbierta(false)
                                                        }}
                                                    >
                                                        <Check className={cn('mr-2 h-4 w-4',
                                                            idProvincia === p.id ? 'opacity-100' : 'opacity-0')} />
                                                        {p.nombre}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">
                                Distrito<span className="ml-0.5 text-red-500">*</span>
                            </Label>
                            <Popover open={distritoAbierto} onOpenChange={setDistritoAbierto}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={distritoAbierto}
                                        aria-haspopup="listbox"
                                        disabled={!idProvincia}
                                        className="h-9 w-full justify-between font-normal"
                                    >
                                        <span className={cn('truncate', !idDistrito && 'text-muted-foreground')}>
                                            {idDistrito
                                                ? distritos.find((d: any) => d.id === idDistrito)?.nombre || idDistrito
                                                : idProvincia ? 'Seleccionar distrito...' : 'Elige la provincia'}
                                        </span>
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-[--radix-popover-trigger-width] p-0"
                                    align="start"
                                >
                                    <Command>
                                        <CommandInput placeholder="Buscar distrito..." />
                                        <CommandList role="listbox" aria-label="Distritos">
                                            <CommandEmpty>No se encontraron distritos.</CommandEmpty>
                                            <CommandGroup>
                                                {distritosDeProvincia.map((d: any) => (
                                                    <CommandItem
                                                        key={d.id}
                                                        value={`${d.nombre} ${d.id}`}
                                                        role="option"
                                                        aria-selected={idDistrito === d.id}
                                                        onSelect={() => {
                                                            setIdDistrito(d.id)
                                                            setDistritoAbierto(false)
                                                        }}
                                                    >
                                                        <Check className={cn('mr-2 h-4 w-4',
                                                            idDistrito === d.id ? 'opacity-100' : 'opacity-0')} />
                                                        {d.nombre}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    </>)}

                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Referencia</Label>
                        <Input
                            className="h-9" value={referencia} maxLength={255}
                            placeholder="Frente al parque, portón azul"
                            onChange={e => setReferencia(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-sm text-red-800">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={onCerrar}>{esPrincipal ? 'Más tarde' : 'Cancelar'}</Button>
                    <Button size="sm" className="gap-1.5" onClick={guardar} disabled={guardando}>
                        {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Guardar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}


// ─── Buscador de direcciones ─────────────────────────────────────────────────

interface ResultadoDireccion {
    titulo     : string
    detalle    : string
    direccion  : string
    referencia : string | null
    distrito   : string
    provincia  : string
    lat        : number
    lon        : number
    esLugar    : boolean
}

/** Compara nombres sin tildes ni mayúsculas ("Víctor Larco" = "VICTOR LARCO"). */
const normalizar = (t: unknown) => String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase()
const mismoNombre = (a: unknown, b: unknown) => !!normalizar(a) && normalizar(a) === normalizar(b)

/**
 * Busca direcciones y lugares de referencia (colegios, mercados, plazas…) en
 * OpenStreetMap, el mismo mapa que usa Ruta Semanal. Photon está hecho para
 * buscar mientras se escribe; se limita a Perú y se espera a que se deje de teclear.
 */
function BuscadorDireccion({ onElegir }: { onElegir: (r: ResultadoDireccion) => void }) {
    const [q, setQ] = useState('')
    const [resultados, setResultados] = useState<ResultadoDireccion[]>([])
    const [buscando, setBuscando] = useState(false)
    const [abierto, setAbierto] = useState(false)
    // Al elegir un resultado el texto cambia al nombre elegido: esa vez no se vuelve a buscar.
    const recienElegido = useRef(false)

    useEffect(() => {
        if (recienElegido.current) { recienElegido.current = false; return }
        const texto = q.trim()
        if (texto.length < 3) { setResultados([]); return }
        let vivo = true
        setBuscando(true)
        const t = setTimeout(async () => {
            try {
                const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(texto)}&limit=8&bbox=-81.4,-18.4,-68.6,-0.03`
                const res = await fetch(url)
                const json = await res.json()
                if (!vivo) return
                const lista: ResultadoDireccion[] = (json.features ?? [])
                    .filter((f: any) => f.properties?.countrycode === 'PE')
                    .map((f: any) => {
                        const p = f.properties
                        const calle = [p.street, p.housenumber].filter(Boolean).join(' ')
                        const urbanizacion = p.locality || p.district || ''
                        const esLugar = !!p.name && p.osm_key !== 'highway' && p.osm_key !== 'place'
                        const direccion = [calle || (!esLugar ? p.name : ''), urbanizacion].filter(Boolean).join(' - ')
                        return {
                            titulo: p.name || calle || urbanizacion || p.city,
                            detalle: [calle && p.name ? calle : '', urbanizacion, p.city, p.county].filter(Boolean).join(', '),
                            direccion: direccion || p.name || '',
                            referencia: esLugar ? `Cerca de ${p.name}` : null,
                            distrito: p.city || p.district || '',
                            provincia: p.county || p.state || '',
                            lat: f.geometry.coordinates[1],
                            lon: f.geometry.coordinates[0],
                            esLugar,
                        }
                    })
                setResultados(lista)
                setAbierto(true)
            } catch {
                if (vivo) setResultados([])
            } finally {
                if (vivo) setBuscando(false)
            }
        }, 450)
        return () => { vivo = false; clearTimeout(t) }
    }, [q])

    return (
        <div className="relative">
            <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Buscar dirección o lugar de referencia</Label>
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    onFocus={() => resultados.length > 0 && setAbierto(true)}
                    placeholder="Ej: Av. Larco 123 Trujillo, Mercado Central Chimbote…"
                    className="h-10 pl-8 pr-8"
                />
                {buscando && <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-600" />}
            </div>
            {abierto && q.trim().length >= 3 && !buscando && (
                <div className="mt-1 max-h-60 overflow-y-auto rounded-lg border bg-background shadow-md">
                    {resultados.length === 0 ? (
                        <p className="px-3 py-3 text-sm text-muted-foreground">Sin resultados. Puedes escribir la dirección abajo.</p>
                    ) : resultados.map((r, i) => (
                        <button
                            key={i} type="button"
                            onClick={() => { recienElegido.current = true; onElegir(r); setAbierto(false); setQ(r.titulo) }}
                            className="flex w-full items-start gap-2.5 border-b px-3 py-2 text-left last:border-b-0 hover:bg-accent/60"
                        >
                            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${r.esLugar ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                {r.esLugar ? <Landmark className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate text-sm font-medium">{r.titulo}</span>
                                <span className="block truncate text-xs text-muted-foreground">{r.detalle}</span>
                            </span>
                        </button>
                    ))}
                    <p className="border-t bg-muted/40 px-3 py-1 text-[10px] text-muted-foreground">Datos © OpenStreetMap</p>
                </div>
            )}
        </div>
    )
}
