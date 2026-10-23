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
import { Loader2, MapPin, Plus, AlertCircle, Check, ChevronDown } from 'lucide-react'
import { toast } from '@/app/hooks/useToast'
import apiClient from '@/app/api/client'
import { ClientService } from '@/app/services/client/ClientService'

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
    clienteCodigo, clienteDireccion, seleccionada, onSeleccionar, usuarioId,
}: {
    clienteCodigo   : string
    clienteDireccion?: string
    seleccionada    : Sucursal | null
    onSeleccionar   : (s: Sucursal) => void
    usuarioId?      : number | null
}) {
    const [sucursales, setSucursales] = useState<Sucursal[]>([])
    const [cargando, setCargando]     = useState(false)
    const [abierto, setAbierto]       = useState(false)

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

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <Label className="text-sm font-medium text-muted-foreground">
                    Dirección de entrega
                </Label>
                <Button
                    type="button" variant="outline" size="sm"
                    className="h-7 gap-1.5 px-2 text-xs"
                    onClick={() => setAbierto(true)}
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
                onCerrar={() => setAbierto(false)}
                clienteCodigo={clienteCodigo}
                usuarioId={usuarioId}
                onCreada={agregada}
            />
        </div>
    )
}

function NuevaSucursalDialog({
    abierto, onCerrar, clienteCodigo, usuarioId, onCreada,
}: {
    abierto      : boolean
    onCerrar     : () => void
    clienteCodigo: string
    usuarioId?   : number | null
    onCreada     : (s: Sucursal) => void
}) {
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
        setDireccion(''); setReferencia(''); setIdZona(''); setError(null); setZonaAbierta(false)
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

    const guardar = async () => {
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nueva sucursal</DialogTitle>
                    <DialogDescription>
                        Queda disponible de inmediato para este cliente.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">
                            Dirección<span className="ml-0.5 text-red-500">*</span>
                        </Label>
                        <Input
                            className="h-9" value={direccion} maxLength={100} autoFocus
                            placeholder="Av. Los Olivos 456"
                            onChange={e => setDireccion(e.target.value)}
                        />
                    </div>

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
                    <Button variant="ghost" size="sm" onClick={onCerrar}>Cancelar</Button>
                    <Button size="sm" className="gap-1.5" onClick={guardar} disabled={guardando}>
                        {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Guardar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
