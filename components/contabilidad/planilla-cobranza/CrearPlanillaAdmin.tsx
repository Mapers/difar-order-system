'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
    Command, CommandEmpty, CommandGroup,
    CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { Check, ChevronDown, Info, RefreshCw, UserCog, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import apiClient from '@/app/api/client'
import { usePlanillaCobranza } from '@/app/hooks/usePlanillaCobranza'
import {
    CatalogosBanco, TipoComprobante, VendedorInfo, VendedorPlanilla, ZonaOption,
} from '@/app/types/planilla-types'
import SeccionVendedor from './SeccionVendedor'

interface Props {
    tiposComprobante: TipoComprobante[]
    bancos:           CatalogosBanco[]
    zones:            ZonaOption[]
    /** Quien crea la planilla (se muestra en la nota). */
    nombreUsuario:    string
}

/**
 * "Crear planilla" de administración: se elige el vendedor y se llena la planilla a su
 * nombre con el mismo flujo del vendedor. El correlativo sale de /admin/correlativo, que
 * registra quién la creó.
 */
export default function CrearPlanillaAdmin({ tiposComprobante, bancos, zones, nombreUsuario }: Props) {
    // Instancia propia: no comparte la planilla en curso con "Validar planillas".
    const hook = usePlanillaCobranza()

    const [vendedores, setVendedores] = useState<VendedorPlanilla[]>([])
    const [cargando,   setCargando]   = useState(true)
    const [error,      setError]      = useState(false)
    const [elegido,    setElegido]    = useState<VendedorPlanilla | null>(null)
    const [abierto,    setAbierto]    = useState(false)

    const cargar = () => {
        setCargando(true)
        setError(false)
        apiClient.get('/planilla-cobranza/vendedores')
            .then(res => {
                const d = res.data?.data
                const lista: any[] = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []
                setVendedores(lista
                    .filter(v => v?.id_vendedor != null)
                    .map(v => ({
                        id_vendedor:     Number(v.id_vendedor),
                        codigo_vendedor: String(v.codigo_vendedor ?? '').trim(),
                        nombre_completo: String(v.nombre_completo ?? '').trim(),
                        ciudad:          v.ciudad ? String(v.ciudad).trim() : null,
                    })))
            })
            .catch(() => { setVendedores([]); setError(true) })
            .finally(() => setCargando(false))
    }
    useEffect(() => { cargar() }, [])

    const porCiudad = useMemo(() => {
        const g = new Map<string, VendedorPlanilla[]>()
        for (const v of vendedores) {
            const c = v.ciudad || 'SIN CIUDAD'
            g.set(c, [...(g.get(c) ?? []), v])
        }
        return Array.from(g.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([ciudad, lista]) => ({ ciudad, lista: lista.sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo)) }))
    }, [vendedores])

    const elegir = (v: VendedorPlanilla | null) => {
        // Nada del vendedor anterior queda a la vista (planilla en curso, registros, lista).
        hook.reiniciarVendedor()
        // Una planilla que llegue tarde del vendedor anterior ya no se muestra.
        hook.fijarVendedor(v ? v.id_vendedor : -1)
        setElegido(v)
        setAbierto(false)
    }

    const vendedorInfo: VendedorInfo | null = useMemo(() => elegido ? {
        id_vendedor:     elegido.id_vendedor,
        codigo_vendedor: elegido.codigo_vendedor,
        nombre_vendedor: elegido.nombre_completo,
        ciudad:          elegido.ciudad ?? 'LIMA',
    } : null, [elegido])

    const selector = (
        <Popover open={abierto} onOpenChange={setAbierto}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="h-11 w-full justify-between bg-background font-normal">
                    <span className="flex min-w-0 items-center gap-2 truncate">
                        <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {elegido ? `${elegido.codigo_vendedor} · ${elegido.nombre_completo}` : 'Buscar vendedor por código o nombre…'}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[280px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Código o nombre del vendedor…" />
                    <CommandList className="max-h-80">
                        <CommandEmpty>No se encontraron vendedores.</CommandEmpty>
                        {porCiudad.map(g => (
                            <CommandGroup key={g.ciudad} heading={g.ciudad}>
                                {g.lista.map(v => (
                                    <CommandItem
                                        key={v.id_vendedor}
                                        value={`${v.codigo_vendedor} ${v.nombre_completo} ${v.id_vendedor}`}
                                        onSelect={() => elegir(v)}
                                    >
                                        <Check className={cn('mr-2 h-4 w-4 shrink-0', elegido?.id_vendedor === v.id_vendedor ? 'opacity-100' : 'opacity-0')} />
                                        <span className="mr-2 font-mono text-xs text-muted-foreground">{v.codigo_vendedor}</span>
                                        <span className="truncate">{v.nombre_completo}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )

    if (!elegido || !vendedorInfo) {
        return (
            <Card className="mx-auto max-w-lg overflow-hidden shadow-sm">
                <div className="bg-slate-800 px-6 py-5">
                    <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-white">
                        <UserCog className="h-5 w-5" /> Crear planilla para un vendedor
                    </h2>
                    <p className="text-xs text-blue-200">Elige el vendedor: la planilla se crea a su nombre con el mismo flujo que usa él.</p>
                </div>
                <CardContent className="space-y-3 p-4 sm:p-6">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Vendedor <span className="text-red-500">*</span>
                    </label>
                    {cargando ? <Skeleton className="h-11 rounded-md" /> : selector}
                    {error && (
                        <div className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                            No se pudo cargar la lista de vendedores.
                            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={cargar}>
                                <RefreshCw className="h-3 w-3" /> Reintentar
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-violet-200 bg-violet-50/60 p-3 sm:p-4 dark:border-violet-900 dark:bg-violet-950/20">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
                    <UserCog className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">Creando planilla para</p>
                    <p className="truncate text-sm font-bold text-foreground">
                        <span className="font-mono">{elegido.codigo_vendedor}</span> · {elegido.nombre_completo}
                    </p>
                    {elegido.ciudad && <p className="text-xs text-muted-foreground">{elegido.ciudad}</p>}
                </div>
                <Button variant="outline" size="sm" className="shrink-0 border-violet-300 text-violet-700 hover:bg-violet-100"
                        disabled={hook.loadingMisPlanillas} onClick={() => elegir(null)}>
                    Cambiar
                </Button>
                <p className="flex w-full items-start gap-1.5 text-xs text-muted-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-600" />
                    La planilla quedará a nombre de {elegido.codigo_vendedor} y se registrará que la creó {nombreUsuario || 'tu usuario'}. El vendedor la verá en Mis planillas.
                </p>
            </div>

            {/* key: al cambiar de vendedor se reinicia todo lo local (cachés, edición, formulario). */}
            <SeccionVendedor
                key={elegido.id_vendedor}
                modoAdmin
                tiposComprobante={tiposComprobante}
                bancos={bancos}
                zones={zones}
                planillaActiva={hook.planillaActiva}
                detalle={hook.detalle}
                onGenerarCorrelativo={(v, fecha, zona) => hook.generarCorrelativo(v, fecha, zona, { admin: true })}
                onLimpiar={hook.limpiarPlanillaActiva}
                onAgregarDetalle={hook.agregarDetalle}
                onRecargarDetalle={hook.recargarDetalle}
                onEliminarDetalle={hook.eliminarDetalle}
                onEnviarPlanilla={hook.enviarPlanilla}
                misPlanillas={hook.misPlanillas}
                loadingMisPlanillas={hook.loadingMisPlanillas}
                onFetchMisPlanillas={hook.fetchMisPlanillas}
                onFetchDetalle={hook.consultarDetalle}
                onReenviar={hook.reenviarPlanilla}
                onCargarBorrador={hook.cargarBorrador}
                onEliminarPlanilla={hook.eliminarPlanilla}
                vendedorInfo={vendedorInfo}
            />
        </div>
    )
}
