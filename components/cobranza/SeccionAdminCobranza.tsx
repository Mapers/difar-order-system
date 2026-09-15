'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChevronDown, Eye, Loader2, PenLine, Search, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import apiClient from '@/app/api/client'
import { useAuth } from '@/context/authContext'
import { EstadoCobranzaBadge } from './EstadoCobranzaBadge'
import { ConfirmarAsignacionModal } from './ConfirmarAsignacionModal'
import { EvidenciaCobranzaModal } from './EvidenciaCobranzaModal'
import { ActualizarGestionModal } from './ActualizarGestionModal'
import { useCobranzaAsignacion } from '@/app/hooks/useCobranzaAsignacion'
import { ExportAsignadasPdfButton } from './ExportAsignadasPdfButton'
import {
    CobranzaAsignada, ESTADOS_FILTRO, FacturaPorAsignar, FiltroVencimiento,
    FILTROS_VENCIMIENTO, rangoDeVencimiento,
    estadoVisible, simboloMonedaCobranza,
} from '@/app/types/cobranza-types'

const TODOS = '__todos__'

function fmtFecha(f: string | null) {
    if (!f) return '—'
    try { return format(parseISO(f), 'dd/MM/yyyy') } catch { return f.slice(0, 10) }
}

export function SeccionAdminCobranza() {
    const { user } = useAuth()
    const hook = useCobranzaAsignacion()

    const [tab, setTab] = useState<'porAsignar' | 'asignadas'>('porAsignar')

    const [buscar, setBuscar] = useState('')
    const [buscarAplicado, setBuscarAplicado] = useState('')
    const [estadosFiltro, setEstadosFiltro] = useState<string[]>([])
    const [vendedorFiltro, setVendedorFiltro] = useState('')
    const [vencFiltro, setVencFiltro] = useState<FiltroVencimiento>('todas')

    const [vendedores, setVendedores] = useState<{ codigo: string; nombre: string }[]>([])

    useEffect(() => {
        let cancelado = false
        apiClient.get('/usuarios/listar/vendedores')
            .then(res => {
                if (cancelado) return
                const filas = res.data?.data?.data ?? []
                setVendedores(filas.map((v: any) => ({
                    codigo: v.Codigo_Vend,
                    nombre: `${v.Nombres ?? ''} ${v.Apellidos ?? ''}`.trim() || v.Codigo_Vend,
                })))
            })
            .catch(() => { if (!cancelado) setVendedores([]) })
        return () => { cancelado = true }
    }, [])

    const [seleccion, setSeleccion] = useState<Map<number, FacturaPorAsignar>>(new Map())
    const [confirmando, setConfirmando] = useState(false)
    const [verEvidencia, setVerEvidencia] = useState<CobranzaAsignada | null>(null)
    /* El SP ya permitía a gerencia gestionar CUALQUIER cobranza —no solo la
       suya—; lo que faltaba era el botón. El permiso lo valida la base, no
       esta pantalla. */
    const [gestionando, setGestionando] = useState<CobranzaAsignada | null>(null)

    useEffect(() => {
        const t = setTimeout(() => setBuscarAplicado(buscar.trim()), 400)
        return () => clearTimeout(t)
    }, [buscar])

    const rango = rangoDeVencimiento(vencFiltro)

    const filtrosPorAsignar = { busqueda: buscarAplicado, vendedor: vendedorFiltro, ...rango }
    const filtrosAsignadas = { busqueda: buscarAplicado, vendedor: vendedorFiltro, estados: estadosFiltro, ...rango }

    const descripcionFiltros = (() => {
        const partes: string[] = []
        if (vendedorFiltro) {
            const v = vendedores.find(x => x.codigo === vendedorFiltro)
            partes.push(`Vendedor: ${v ? `${v.codigo} - ${v.nombre}` : vendedorFiltro}`)
        }
        if (vencFiltro !== 'todas') {
            partes.push(FILTROS_VENCIMIENTO.find(f => f.value === vencFiltro)?.label ?? vencFiltro)
        }
        if (estadosFiltro.length > 0) {
            const etiquetas = estadosFiltro.map(v => ESTADOS_FILTRO.find(e => e.value === v)?.label ?? v)
            partes.push(`Estado: ${etiquetas.join(', ')}`)
        }
        if (buscarAplicado) partes.push(`Búsqueda: "${buscarAplicado}"`)
        return partes.length ? partes.join('  ·  ') : 'Todas las cobranzas asignadas'
    })()

    useEffect(() => {
        if (tab === 'porAsignar') hook.fetchPorAsignar(filtrosPorAsignar, true)
        else hook.fetchAsignadas(filtrosAsignadas, true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, buscarAplicado, estadosFiltro, vendedorFiltro, vencFiltro])

    const centinelaRef = useRef<HTMLDivElement>(null)

    const hayMasPorAsignar = hook.porAsignar.length < hook.totalPorAsignar
    const hayMasAsignadas = hook.asignadas.length < hook.totalAsignadas
    const hayMas = tab === 'porAsignar' ? hayMasPorAsignar : hayMasAsignadas
    const cargando = tab === 'porAsignar' ? hook.cargandoPorAsignar : hook.cargandoAsignadas

    const cargarMas = useCallback(() => {
        if (cargando || !hayMas) return
        if (tab === 'porAsignar') hook.fetchPorAsignar(filtrosPorAsignar, false)
        else hook.fetchAsignadas(filtrosAsignadas, false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cargando, hayMas, tab, buscarAplicado, estadosFiltro, vendedorFiltro, vencFiltro])

    useEffect(() => {
        const nodo = centinelaRef.current
        if (!nodo) return

        const obs = new IntersectionObserver(
            (entradas) => { if (entradas[0].isIntersecting) cargarMas() },
            { rootMargin: '200px' }
        )
        obs.observe(nodo)
        return () => obs.disconnect()
    }, [cargarMas])

    const alternar = (f: FacturaPorAsignar, marcado: boolean) => {
        setSeleccion(prev => {
            const m = new Map(prev)
            if (marcado) m.set(f.id_sunat, f)
            else m.delete(f.id_sunat)
            return m
        })
    }

    const confirmarAsignacion = async (asignaciones: { id_sunat: number; cod_vendedor: string }[]) => {
        if (!user?.idUsuarioWeb) return
        const ok = await hook.asignar(asignaciones, user.idUsuarioWeb)
        if (!ok) return

        setSeleccion(new Map())
        setConfirmando(false)
        hook.fetchPorAsignar(filtrosPorAsignar, true)
        setTab('asignadas')
    }

    const retirar = async (c: CobranzaAsignada) => {
        if (!user?.idUsuarioWeb) return

        const perdidas: string[] = []
        if (Number(c.total_comentarios) > 0) perdidas.push(`${c.total_comentarios} comentario(s)`)
        if (Number(c.tiene_evidencia) === 1) perdidas.push('el comprobante adjunto')

        const detalle = perdidas.length > 0
            ? `\n\nSe eliminarán también ${perdidas.join(' y ')}. Esto no se puede deshacer.`
            : ''

        if (!confirm(`¿Retirar ${c.serie}-${c.numero} de ${c.nombre_vendedor_asignado}?${detalle}`)) return

        await hook.retirar(c.id_asignacion, user.idUsuarioWeb)
    }

    const guardarGestion = async (estado: string, comentario: string, archivo: File | null) => {
        if (!gestionando || !user?.idUsuarioWeb) return

        const ok = await hook.actualizarGestion(gestionando.id_asignacion, user.idUsuarioWeb, estado, comentario)
        if (!ok) return

        if (archivo) await hook.subirEvidencia(gestionando.id_asignacion, archivo, user.idUsuarioWeb)

        setGestionando(null)
        hook.fetchAsignadas(filtrosAsignadas, true)
    }

    return (
        <div className="min-w-0 space-y-4">
            <div className="flex gap-1 border-b">
                {([
                    ['porAsignar', 'Por asignar', hook.totalPorAsignar],
                    ['asignadas', 'Asignadas', hook.totalAsignadas],
                ] as const).map(([id, titulo, total]) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        className={`mr-5 flex items-center gap-2 border-b-2 px-1 pb-2.5 pt-2 text-sm font-semibold transition ${
                            tab === id
                                ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {titulo}
                        <span className={`rounded-full px-2 py-0.5 text-xs ${
                            tab === id ? 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400' : 'bg-muted text-muted-foreground'
                        }`}>
                            {total}
                        </span>
                    </button>
                ))}
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                <div className="min-w-0 flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">Buscar</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={buscar}
                            onChange={(e) => setBuscar(e.target.value)}
                            placeholder="Cliente, RUC, serie o número..."
                            className="pl-9 text-sm"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Vendedor</Label>
                    <Select
                        value={vendedorFiltro || TODOS}
                        onValueChange={(v) => setVendedorFiltro(v === TODOS ? '' : v)}
                    >
                        <SelectTrigger className="w-full text-sm lg:w-52">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={TODOS}>Todos los vendedores</SelectItem>
                            {vendedores.map(v => (
                                <SelectItem key={v.codigo} value={v.codigo}>
                                    {v.codigo} · {v.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Vencimiento</Label>
                    <Select
                        value={vencFiltro}
                        onValueChange={(v) => setVencFiltro(v as FiltroVencimiento)}
                    >
                        <SelectTrigger className="w-full text-sm lg:w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {FILTROS_VENCIMIENTO.map(f => (
                                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {tab === 'asignadas' && (
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Estado</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="flex w-full justify-between text-sm font-normal lg:w-48"
                                >
                                    <span className="truncate">
                                        {estadosFiltro.length === 0
                                            ? 'Todos los estados'
                                            : estadosFiltro.length === 1
                                                ? (ESTADOS_FILTRO.find(e => e.value === estadosFiltro[0])?.label ?? estadosFiltro[0])
                                                : `${estadosFiltro.length} estados seleccionados`}
                                    </span>
                                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2" align="start">
                                <div className="space-y-0.5">
                                    {ESTADOS_FILTRO.map(e => (
                                        <label
                                            key={e.value}
                                            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                                        >
                                            <Checkbox
                                                checked={estadosFiltro.includes(e.value)}
                                                onCheckedChange={(v) => {
                                                    setEstadosFiltro(prev => (
                                                        v === true
                                                            ? [...prev, e.value]
                                                            : prev.filter(x => x !== e.value)
                                                    ))
                                                }}
                                            />
                                            {e.label}
                                        </label>
                                    ))}
                                </div>
                                {estadosFiltro.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setEstadosFiltro([])}
                                        className="mt-2 w-full rounded px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted"
                                    >
                                        Limpiar selección
                                    </button>
                                )}
                            </PopoverContent>
                        </Popover>
                    </div>
                )}

                {tab === 'porAsignar' && (
                    <Button
                        onClick={() => setConfirmando(true)}
                        disabled={seleccion.size === 0}
                        className="w-full bg-teal-700 hover:bg-teal-800 lg:w-auto"
                    >
                        Asignar a cobranza ({seleccion.size})
                    </Button>
                )}

                {tab === 'asignadas' && (
                    <ExportAsignadasPdfButton
                        filtros={filtrosAsignadas}
                        descripcionFiltros={descripcionFiltros}
                    />
                )}
            </div>

            {tab === 'porAsignar' ? (
                <>
                <Card className="hidden lg:block">
                    <div className="overflow-x-auto">
                        <table className="w-full table-fixed divide-y divide-border text-sm [&_td]:align-top">
                            <colgroup>
                                <col className="w-10" />
                                <col className="w-28" />
                                <col />
                                <col className="w-36" />
                                <col className="w-32" />
                                <col className="w-24" />
                                <col className="w-24" />
                            </colgroup>
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-3 py-2"></th>
                                    {['N° Factura', 'Cliente', 'Vendedor', 'Saldo', 'Emisión', 'Vence'].map(h => (
                                        <th key={h} className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {hook.porAsignar.map(f => {
                                    const vencida = f.fecha_vencimiento
                                        ? new Date(f.fecha_vencimiento) < new Date()
                                        : false
                                    return (
                                        <tr key={f.id_sunat} className={vencida ? 'bg-red-50/60 dark:bg-red-950/20' : ''}>
                                            <td className="px-3 py-2">
                                                <Checkbox
                                                    checked={seleccion.has(f.id_sunat)}
                                                    onCheckedChange={(v) => alternar(f, v === true)}
                                                />
                                            </td>
                                            <td className="px-3 py-2 font-medium whitespace-nowrap">{f.serie}-{f.numero}</td>
                                            <td className="px-3 py-2">
                                                <div className="break-words leading-snug">{f.cliente_denominacion}</div>
                                                <div className="text-xs text-muted-foreground">{f.cliente_numdoc}</div>
                                            </td>
                                            <td className="px-3 py-2 text-xs">
                                                <div className="break-words leading-snug">{f.nombre_vendedor}</div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                                                {simboloMonedaCobranza(f.moneda)} {Number(f.saldo).toFixed(2)}
                                            </td>
                                            <td className="px-3 py-2 tabular-nums">{fmtFecha(f.fecha_emision)}</td>
                                            <td className="px-3 py-2 tabular-nums">{fmtFecha(f.fecha_vencimiento)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                </Card>

                <div className="space-y-3 lg:hidden">
                    {hook.porAsignar.map(f => {
                        const vencida = f.fecha_vencimiento
                            ? new Date(f.fecha_vencimiento) < new Date()
                            : false
                        return (
                            <Card
                                key={f.id_sunat}
                                className={`p-4 ${vencida ? 'border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20' : ''}`}
                            >
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        checked={seleccion.has(f.id_sunat)}
                                        onCheckedChange={(v) => alternar(f, v === true)}
                                        className="mt-1 shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold">{f.serie}-{f.numero}</p>
                                        <p className="break-words text-sm text-muted-foreground">
                                            {f.cliente_denominacion}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{f.cliente_numdoc}</p>
                                    </div>
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-sm [&>div]:min-w-0">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Saldo</p>
                                        <p className="whitespace-nowrap font-semibold tabular-nums">
                                            {simboloMonedaCobranza(f.moneda)} {Number(f.saldo).toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Emisión</p>
                                        <p className="tabular-nums">{fmtFecha(f.fecha_emision)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Vence</p>
                                        <p className="tabular-nums">{fmtFecha(f.fecha_vencimiento)}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-muted-foreground">Vendedor</p>
                                        <p className="truncate">{f.nombre_vendedor}</p>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>

                {!cargando && hook.porAsignar.length === 0 && (
                    <Card className="py-10 text-center text-sm text-muted-foreground">
                        No hay facturas pendientes de asignar con estos filtros.
                    </Card>
                )}
                </>
            ) : (
                <>
                <Card className="hidden lg:block">
                    <div className="overflow-x-auto">
                        <table className="w-full table-fixed divide-y divide-border text-sm [&_td]:align-top">
                            <colgroup>
                                <col className="w-28" />
                                <col />
                                <col className="w-40" />
                                <col className="w-32" />
                                <col className="w-24" />
                                <col className="hidden w-20" />
                                <col className="w-24" />
                                <col className="w-44" />
                                <col className="w-28" />
                            </colgroup>
                            <thead className="bg-muted">
                                <tr>
                                    {['N° Factura', 'Cliente', 'Asignado a', 'Saldo', 'Vence', 'Semana', 'Estado', 'Último comentario', ''].map(h => (
                                        <th
                                            key={h}
                                            className={`px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground ${h === 'Semana' ? 'hidden' : ''}`}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {hook.asignadas.map(c => (
                                    <tr key={c.id_asignacion} className={Number(c.esta_vencido) === 1 ? 'bg-red-50/60 dark:bg-red-950/20' : ''}>
                                        <td className="px-3 py-2 font-medium whitespace-nowrap">{c.serie}-{c.numero}</td>
                                        <td className="px-3 py-2">
                                            <div className="break-words leading-snug">{c.cliente_denominacion}</div>
                                        </td>
                                        <td className="px-3 py-2 text-xs">
                                            <div className="break-words leading-snug">
                                                {c.nombre_vendedor_asignado}
                                                {Number(c.fue_reasignada) === 1 && (
                                                    <span className="ml-1 rounded bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                                                        reasignada
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                                            {simboloMonedaCobranza(c.moneda)} {Number(c.saldo_actual).toFixed(2)}
                                        </td>
                                        <td className="px-3 py-2 tabular-nums">{fmtFecha(c.fecha_vencimiento)}</td>
                                        <td className="hidden px-3 py-2 text-xs">{c.semana_asignacion}</td>
                                        <td className="px-3 py-2"><EstadoCobranzaBadge estado={estadoVisible(c)} /></td>
                                        <td className="px-3 py-2">
                                            <span className="line-clamp-2 break-words text-xs text-muted-foreground">
                                                {c.ultimo_comentario || '—'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost" size="icon" className="h-8 w-8"
                                                    disabled={Number(c.tiene_evidencia) !== 1}
                                                    onClick={() => setVerEvidencia(c)}
                                                    title={Number(c.tiene_evidencia) === 1 ? 'Ver comprobante' : 'Sin comprobante'}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="icon" className="h-8 w-8"
                                                    onClick={() => setGestionando(c)}
                                                    title="Actualizar gestión"
                                                >
                                                    <PenLine className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="icon"
                                                    className="h-8 w-8 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                    onClick={() => retirar(c)}
                                                    disabled={hook.guardando}
                                                    title="Retirar asignación"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </Card>

                <div className="space-y-3 lg:hidden">
                    {hook.asignadas.map(c => (
                        <Card
                            key={c.id_asignacion}
                            className={`p-4 ${Number(c.esta_vencido) === 1 ? 'border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20' : ''}`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="font-semibold">{c.serie}-{c.numero}</p>
                                    <p className="break-words text-sm text-muted-foreground">
                                        {c.cliente_denominacion}
                                    </p>
                                </div>
                                <EstadoCobranzaBadge estado={estadoVisible(c)} />
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-sm [&>div]:min-w-0">
                                <div className="col-span-2">
                                    <p className="text-xs text-muted-foreground">Asignado a</p>
                                    <p className="break-words">
                                        {c.nombre_vendedor_asignado}
                                        {Number(c.fue_reasignada) === 1 && (
                                            <span className="ml-1 rounded bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                                                reasignada
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Saldo</p>
                                    <p className="whitespace-nowrap font-semibold tabular-nums">
                                        {simboloMonedaCobranza(c.moneda)} {Number(c.saldo_actual).toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Vence</p>
                                    <p className="tabular-nums">{fmtFecha(c.fecha_vencimiento)}</p>
                                </div>
                                <div className="hidden">
                                    <p className="text-xs text-muted-foreground">Semana</p>
                                    <p>{c.semana_asignacion || '—'}</p>
                                </div>
                                {c.ultimo_comentario && (
                                    <div className="col-span-2">
                                        <p className="text-xs text-muted-foreground">Último comentario</p>
                                        <p className="line-clamp-2 break-words">{c.ultimo_comentario}</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-3 flex gap-2 border-t pt-3">
                                <Button
                                    variant="outline" size="sm" className="flex-1 gap-1.5 text-sm"
                                    onClick={() => setGestionando(c)}
                                >
                                    <PenLine className="h-3.5 w-3.5" /> Actualizar
                                </Button>
                                <Button
                                    variant="outline" size="sm" className="shrink-0"
                                    disabled={Number(c.tiene_evidencia) !== 1}
                                    onClick={() => setVerEvidencia(c)}
                                    title={Number(c.tiene_evidencia) === 1 ? 'Ver comprobante' : 'Sin comprobante'}
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="outline" size="sm"
                                    className="shrink-0 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                                    onClick={() => retirar(c)}
                                    disabled={hook.guardando}
                                    title="Retirar asignación"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>

                {!cargando && hook.asignadas.length === 0 && (
                    <Card className="py-10 text-center text-sm text-muted-foreground">
                        {estadosFiltro.length === 0
                            ? 'Selecciona uno o más estados para ver las cobranzas asignadas.'
                            : 'Ninguna cobranza asignada coincide con estos filtros.'}
                    </Card>
                )}
                </>
            )}

            {cargando && (
                <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
            )}

            <div ref={centinelaRef} className="h-4" />

            {hayMas && !cargando && (
                <div className="flex justify-center">
                    <Button variant="outline" size="sm" onClick={cargarMas} className="gap-1.5">
                        <Loader2 className="h-3.5 w-3.5" /> Cargar más
                    </Button>
                </div>
            )}

            <ConfirmarAsignacionModal
                open={confirmando}
                onOpenChange={setConfirmando}
                seleccionadas={[...seleccion.values()]}
                guardando={hook.guardando}
                consultarVendedores={hook.consultarVendedores}
                onConfirmar={confirmarAsignacion}
            />

            <EvidenciaCobranzaModal
                open={verEvidencia != null}
                onOpenChange={(v) => { if (!v) setVerEvidencia(null) }}
                cobranza={verEvidencia}
                obtenerEvidencia={hook.obtenerEvidencia}
            />

            <ActualizarGestionModal
                open={gestionando != null}
                onOpenChange={(v) => { if (!v) setGestionando(null) }}
                cobranza={gestionando}
                idUsuarioWeb={user?.idUsuarioWeb ?? null}
                guardando={hook.guardando}
                obtenerComentarios={hook.obtenerComentarios}
                onGuardar={guardarGestion}
            />
        </div>
    )
}
