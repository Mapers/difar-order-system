'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Eye, Loader2, MessageSquare, PenLine, Search, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import apiClient from '@/app/api/client'
import { useAuth } from '@/context/authContext'
import { Paginador } from '@/components/ui/paginador'
import { useTablaPaginada, type Ordenes } from '@/app/hooks/useTablaPaginada'
import { EstadoCobranzaBadge } from './EstadoCobranzaBadge'
import { ConfirmarAsignacionModal } from './ConfirmarAsignacionModal'
import { EvidenciaCobranzaModal } from './EvidenciaCobranzaModal'
import { ActualizarGestionModal } from './ActualizarGestionModal'
import { useCobranzaAsignacion } from '@/app/hooks/useCobranzaAsignacion'
import { ExportAsignadasPdfButton } from './ExportAsignadasPdfButton'
import {
    BarraSeleccion, ChipsFiltro, DiasVencimiento, TarjetasResumen, Th,
    cumpleVencimiento, diasParaVencer, sumaPorMoneda, type Tarjeta,
} from './vistaCobranza'
import {
    CobranzaAsignada, ESTADOS_FILTRO, FacturaPorAsignar, FiltroVencimiento,
    FILTROS_VENCIMIENTO, rangoDeVencimiento,
    estadoVisible, avisoDescuadre, fmtMontoCobranza, simboloMonedaCobranza,
} from '@/app/types/cobranza-types'

const TODOS = '__todos__'

function fmtFecha(f: string | null) {
    if (!f) return '—'
    try { return format(parseISO(f), 'dd/MM/yyyy') } catch { return f.slice(0, 10) }
}

const fecha = (f: string | null) => (f ? f.slice(0, 10) : null)

const ORDEN_POR_ASIGNAR: Ordenes<FacturaPorAsignar> = {
    factura: f => `${f.serie}-${f.numero}`,
    cliente: f => f.cliente_denominacion,
    vendedor: f => f.nombre_vendedor,
    saldo: f => Number(f.saldo),
    emision: f => fecha(f.fecha_emision),
    vence: f => fecha(f.fecha_vencimiento),
}

const ORDEN_ASIGNADAS: Ordenes<CobranzaAsignada> = {
    factura: c => `${c.serie}-${c.numero}`,
    cliente: c => c.cliente_denominacion,
    vendedor: c => c.nombre_vendedor_asignado,
    saldo: c => Number(c.saldo_actual),
    vence: c => fecha(c.fecha_vencimiento),
    estado: c => estadoVisible(c),
}

const ETIQUETA_VENC: Record<FiltroVencimiento, string> = {
    todas: 'Todas', vencidas: 'Vencidas', v7: 'Vencen en 7 días', v15: 'En 15 días', v30: 'En 30 días',
}

export function SeccionAdminCobranza() {
    const { user, isAdmin } = useAuth()
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
    const [confirmarRetiro, setConfirmarRetiro] = useState<CobranzaAsignada | null>(null)
    const [retirandoId, setRetirandoId] = useState<number | null>(null)

    useEffect(() => {
        const t = setTimeout(() => setBuscarAplicado(buscar.trim()), 400)
        return () => clearTimeout(t)
    }, [buscar])

    // Al servidor solo van búsqueda y vendedor: vencimiento y estado se filtran
    // aquí, para poder mostrar cuántas hay en cada filtro rápido.
    const filtrosServidor = { busqueda: buscarAplicado, vendedor: vendedorFiltro }
    // El PDF de asignadas se arma en el servidor con todos los filtros.
    const filtrosAsignadas = { ...filtrosServidor, estados: estadosFiltro, ...rangoDeVencimiento(vencFiltro) }

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

    // Las dos pestañas se cargan juntas: así ambos contadores son reales desde el inicio.
    const recargarPorAsignar = () => hook.fetchPorAsignar(filtrosServidor, true)
    const recargarAsignadas = () => hook.fetchAsignadas({ ...filtrosServidor, estados: undefined }, true)

    useEffect(() => {
        recargarPorAsignar()
        recargarAsignadas()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [buscarAplicado, vendedorFiltro])

    const cargando = tab === 'porAsignar' ? hook.cargandoPorAsignar : hook.cargandoAsignadas

    // ── Por asignar ──────────────────────────────────────────────────────────
    const porAsignarFiltradas = useMemo(
        () => hook.listaPorAsignar.filter(f => cumpleVencimiento(f.fecha_vencimiento, vencFiltro)),
        [hook.listaPorAsignar, vencFiltro],
    )
    const tablaPA = useTablaPaginada(porAsignarFiltradas, ORDEN_POR_ASIGNAR, { orden: 'vence', direccion: 'asc' })

    // ── Asignadas ────────────────────────────────────────────────────────────
    const asignadasPorVenc = useMemo(
        () => hook.listaAsignadas.filter(c => cumpleVencimiento(c.fecha_vencimiento, vencFiltro)),
        [hook.listaAsignadas, vencFiltro],
    )
    const asignadasFiltradas = useMemo(
        () => (estadosFiltro.length ? asignadasPorVenc.filter(c => estadosFiltro.includes(estadoVisible(c))) : asignadasPorVenc),
        [asignadasPorVenc, estadosFiltro],
    )
    const tablaAS = useTablaPaginada(asignadasFiltradas, ORDEN_ASIGNADAS, { orden: 'vence', direccion: 'asc' })

    // ── Resumen y filtros rápidos ────────────────────────────────────────────
    const base = tab === 'porAsignar' ? hook.listaPorAsignar : hook.listaAsignadas
    const contarVenc = (v: FiltroVencimiento) => base.filter(f => cumpleVencimiento(f.fecha_vencimiento, v)).length
    const chipsVenc = (['todas', 'vencidas', 'v7', 'v15', 'v30'] as FiltroVencimiento[])
        .map(v => ({ valor: v, etiqueta: ETIQUETA_VENC[v], cantidad: contarVenc(v) }))
    const chipsEstado = ESTADOS_FILTRO.map(e => ({
        valor: e.value, etiqueta: e.label,
        cantidad: asignadasPorVenc.filter(c => estadoVisible(c) === e.value).length,
    }))

    const vencidasPA = hook.listaPorAsignar.filter(f => (diasParaVencer(f.fecha_vencimiento) ?? 0) < 0)
    const proximasPA = hook.listaPorAsignar.filter(f => cumpleVencimiento(f.fecha_vencimiento, 'v7'))
    const seleccionadas = [...seleccion.values()]
    const montoPA = (fs: FacturaPorAsignar[]) => sumaPorMoneda(fs, f => f.saldo, f => f.moneda)
    const montoAS = (cs: CobranzaAsignada[]) => sumaPorMoneda(cs, c => c.saldo_actual, c => c.moneda)
    const deEstado = (...estados: string[]) => hook.listaAsignadas.filter(c => estados.includes(estadoVisible(c)))

    const tarjetas: Tarjeta[] = tab === 'porAsignar'
        ? [
            { id: 'total', titulo: 'Por asignar', valor: String(hook.listaPorAsignar.length), detalle: montoPA(hook.listaPorAsignar), tono: 'neutro', activa: vencFiltro === 'todas', onClick: () => setVencFiltro('todas') },
            { id: 'vencidas', titulo: 'Vencidas', valor: String(vencidasPA.length), detalle: montoPA(vencidasPA), tono: 'rojo', activa: vencFiltro === 'vencidas', onClick: () => setVencFiltro('vencidas') },
            { id: 'v7', titulo: 'Vencen en 7 días', valor: String(proximasPA.length), detalle: montoPA(proximasPA), tono: 'ambar', activa: vencFiltro === 'v7', onClick: () => setVencFiltro('v7') },
            { id: 'sel', titulo: 'Seleccionadas', valor: String(seleccion.size), detalle: seleccion.size ? montoPA(seleccionadas) : 'Marca facturas para asignarlas', tono: 'verde' },
        ]
        : [
            { id: 'total', titulo: 'Asignadas', valor: String(hook.listaAsignadas.length), detalle: montoAS(hook.listaAsignadas), tono: 'neutro', activa: estadosFiltro.length === 0, onClick: () => setEstadosFiltro([]) },
            { id: 'gestion', titulo: 'Pendientes / en gestión', valor: String(deEstado('pendiente', 'en_gestion').length), detalle: montoAS(deEstado('pendiente', 'en_gestion')), tono: 'azul', activa: estadosFiltro.join() === 'pendiente,en_gestion', onClick: () => setEstadosFiltro(['pendiente', 'en_gestion']) },
            { id: 'promesa', titulo: 'Promesa de pago', valor: String(deEstado('promesa_pago').length), detalle: montoAS(deEstado('promesa_pago')), tono: 'violeta', activa: estadosFiltro.join() === 'promesa_pago', onClick: () => setEstadosFiltro(['promesa_pago']) },
            { id: 'pagado', titulo: 'Pagadas', valor: String(deEstado('pagado').length), detalle: montoAS(deEstado('pagado')), tono: 'verde', activa: estadosFiltro.join() === 'pagado', onClick: () => setEstadosFiltro(['pagado']) },
        ]

    // ── Selección ────────────────────────────────────────────────────────────
    const alternar = (f: FacturaPorAsignar, marcado: boolean) => {
        setSeleccion(prev => {
            const m = new Map(prev)
            if (marcado) m.set(f.id_sunat, f)
            else m.delete(f.id_sunat)
            return m
        })
    }
    const alternarVarias = (filas: FacturaPorAsignar[], marcado: boolean) => {
        setSeleccion(prev => {
            const m = new Map(prev)
            filas.forEach(f => { if (marcado) m.set(f.id_sunat, f); else m.delete(f.id_sunat) })
            return m
        })
    }
    const paginaSeleccionada = tablaPA.visibles.length > 0 && tablaPA.visibles.every(f => seleccion.has(f.id_sunat))
    const filtradasSeleccionadas = porAsignarFiltradas.length > 0 && porAsignarFiltradas.every(f => seleccion.has(f.id_sunat))

    const confirmarAsignacion = async (asignaciones: { id_sunat: number; cod_vendedor: string }[]) => {
        if (!user?.idUsuarioWeb) return
        const ok = await hook.asignar(asignaciones, user.idUsuarioWeb)
        if (!ok) return

        setSeleccion(new Map())
        setConfirmando(false)
        recargarPorAsignar()
        recargarAsignadas()
        setTab('asignadas')
    }

    const retirar = async (c: CobranzaAsignada) => {
        if (!user?.idUsuarioWeb) return
        setConfirmarRetiro(null)
        setRetirandoId(c.id_asignacion)
        await hook.retirar(c.id_asignacion, user.idUsuarioWeb)
        setRetirandoId(null)
        recargarAsignadas()
        recargarPorAsignar()
    }

    const eliminarEvidencia = async (idAsignacion: number) => {
        if (!user?.idUsuarioWeb) return false
        const ok = await hook.eliminarEvidencia(idAsignacion, user.idUsuarioWeb)
        if (ok) recargarAsignadas()
        return ok
    }

    const guardarGestion = async (estado: string, comentario: string, archivo: File | null) => {
        if (!gestionando || !user?.idUsuarioWeb) return

        const ok = await hook.actualizarGestion(gestionando.id_asignacion, user.idUsuarioWeb, estado, comentario)
        if (!ok) return

        if (archivo) await hook.subirEvidencia(gestionando.id_asignacion, archivo, user.idUsuarioWeb)

        setGestionando(null)
        recargarAsignadas()
    }

    const alternarEstado = (valor: string) =>
        setEstadosFiltro(prev => (prev.includes(valor) ? prev.filter(x => x !== valor) : [...prev, valor]))

    const sinFilas = (tab === 'porAsignar' ? porAsignarFiltradas : asignadasFiltradas).length === 0

    return (
        <div className="min-w-0 space-y-4">
            <div className="flex gap-1 border-b">
                {([
                    ['porAsignar', 'Por asignar', hook.listaPorAsignar.length],
                    ['asignadas', 'Asignadas', hook.listaAsignadas.length],
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
                        <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
                            tab === id ? 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400' : 'bg-muted text-muted-foreground'
                        }`}>
                            {total}
                        </span>
                    </button>
                ))}
            </div>

            <TarjetasResumen tarjetas={tarjetas} cargando={cargando && base.length === 0} />

            <Card className="space-y-3 p-3 sm:p-4">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                    <div className="relative min-w-0 flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={buscar}
                            onChange={(e) => setBuscar(e.target.value)}
                            placeholder="Buscar cliente, RUC, serie o número..."
                            className="pl-9 text-sm"
                        />
                    </div>
                    <Select
                        value={vendedorFiltro || TODOS}
                        onValueChange={(v) => setVendedorFiltro(v === TODOS ? '' : v)}
                    >
                        <SelectTrigger className="w-full text-sm lg:w-60">
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
                    {tab === 'asignadas' && (
                        <ExportAsignadasPdfButton
                            filtros={filtrosAsignadas}
                            descripcionFiltros={descripcionFiltros}
                        />
                    )}
                </div>
                <div className="flex flex-col gap-2 border-t pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">Vencimiento</span>
                        <ChipsFiltro chips={chipsVenc} activos={[vencFiltro]} onCambiar={v => setVencFiltro(v as FiltroVencimiento)} />
                    </div>
                    {tab === 'asignadas' && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">Estado</span>
                            <ChipsFiltro chips={chipsEstado} activos={estadosFiltro} onCambiar={alternarEstado} />
                            {estadosFiltro.length > 0 && (
                                <button onClick={() => setEstadosFiltro([])} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
                                    Ver todos
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </Card>

            {tab === 'porAsignar' ? (
                <>
                {porAsignarFiltradas.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="text-muted-foreground">
                            Ordenado por <b className="text-foreground">{({ vence: 'vencimiento', emision: 'emisión', saldo: 'saldo', cliente: 'cliente', vendedor: 'vendedor', factura: 'factura' } as Record<string, string>)[tablaPA.orden]}</b>. Clic en una columna para cambiarlo.
                        </span>
                        <Button
                            variant="outline" size="sm"
                            onClick={() => alternarVarias(porAsignarFiltradas, !filtradasSeleccionadas)}
                        >
                            {filtradasSeleccionadas ? 'Quitar selección' : `Seleccionar las ${porAsignarFiltradas.length} del filtro`}
                        </Button>
                    </div>
                )}

                <Card className="hidden overflow-hidden lg:block">
                    <div className="overflow-x-auto">
                        <table className="w-full table-fixed text-sm [&_td]:align-middle">
                            <colgroup>
                                <col className="w-10" />
                                <col className="w-32" />
                                <col />
                                <col className="w-40" />
                                <col className="w-28" />
                                <col className="w-24" />
                                <col className="w-24" />
                                <col className="w-28" />
                            </colgroup>
                            <thead className="sticky top-0 z-10 border-b bg-muted">
                                <tr>
                                    <th className="px-3 py-2.5">
                                        <Checkbox
                                            checked={paginaSeleccionada}
                                            onCheckedChange={(v) => alternarVarias(tablaPA.visibles, v === true)}
                                            disabled={tablaPA.visibles.length === 0}
                                            aria-label="Seleccionar las facturas de esta página"
                                        />
                                    </th>
                                    <Th titulo="N° Factura" clave="factura" orden={tablaPA.orden} direccion={tablaPA.direccion} onOrdenar={tablaPA.ordenarPor} />
                                    <Th titulo="Cliente" clave="cliente" orden={tablaPA.orden} direccion={tablaPA.direccion} onOrdenar={tablaPA.ordenarPor} />
                                    <Th titulo="Vendedor" clave="vendedor" orden={tablaPA.orden} direccion={tablaPA.direccion} onOrdenar={tablaPA.ordenarPor} />
                                    <Th titulo="Saldo" clave="saldo" orden={tablaPA.orden} direccion={tablaPA.direccion} onOrdenar={tablaPA.ordenarPor} derecha />
                                    <Th titulo="Emisión" clave="emision" orden={tablaPA.orden} direccion={tablaPA.direccion} onOrdenar={tablaPA.ordenarPor} />
                                    <Th titulo="Vence" clave="vence" orden={tablaPA.orden} direccion={tablaPA.direccion} onOrdenar={tablaPA.ordenarPor} />
                                    <Th titulo="Situación" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {tablaPA.visibles.map(f => {
                                    const marcada = seleccion.has(f.id_sunat)
                                    return (
                                        <tr
                                            key={f.id_sunat}
                                            onClick={() => alternar(f, !marcada)}
                                            className={`cursor-pointer transition-colors ${marcada ? 'bg-teal-50 dark:bg-teal-950/30' : 'hover:bg-muted/50'}`}
                                        >
                                            <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                                                <Checkbox checked={marcada} onCheckedChange={(v) => alternar(f, v === true)} />
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[13px] font-semibold">{f.serie}-{f.numero}</td>
                                            <td className="px-3 py-2.5">
                                                <div className="line-clamp-2 font-medium leading-snug" title={f.cliente_denominacion ?? ''}>{f.cliente_denominacion}</div>
                                                <div className="text-xs text-muted-foreground">{f.cliente_numdoc}</div>
                                            </td>
                                            <td className="px-3 py-2.5 text-xs">
                                                <div className="line-clamp-2 leading-snug">{f.nombre_vendedor}</div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums">
                                                {simboloMonedaCobranza(f.moneda)} {fmtMontoCobranza(f.saldo)}
                                            </td>
                                            <td className="px-3 py-2.5 tabular-nums text-muted-foreground">{fmtFecha(f.fecha_emision)}</td>
                                            <td className="px-3 py-2.5 tabular-nums">{fmtFecha(f.fecha_vencimiento)}</td>
                                            <td className="px-3 py-2.5"><DiasVencimiento fecha={f.fecha_vencimiento} /></td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <div className="space-y-3 lg:hidden">
                    {tablaPA.visibles.map(f => {
                        const marcada = seleccion.has(f.id_sunat)
                        return (
                            <Card
                                key={f.id_sunat}
                                onClick={() => alternar(f, !marcada)}
                                className={`cursor-pointer p-4 transition ${marcada ? 'border-teal-300 bg-teal-50 dark:bg-teal-950/30' : ''}`}
                            >
                                <div className="flex items-start gap-3">
                                    <span onClick={e => e.stopPropagation()}>
                                        <Checkbox checked={marcada} onCheckedChange={(v) => alternar(f, v === true)} className="mt-1 shrink-0" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-mono text-sm font-semibold">{f.serie}-{f.numero}</p>
                                            <DiasVencimiento fecha={f.fecha_vencimiento} />
                                        </div>
                                        <p className="break-words text-sm font-medium">{f.cliente_denominacion}</p>
                                        <p className="text-xs text-muted-foreground">{f.cliente_numdoc} · {f.nombre_vendedor}</p>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-end justify-between border-t pt-3 text-sm">
                                    <div className="text-xs text-muted-foreground tabular-nums">
                                        Emitida {fmtFecha(f.fecha_emision)} · vence {fmtFecha(f.fecha_vencimiento)}
                                    </div>
                                    <p className="whitespace-nowrap font-bold tabular-nums">
                                        {simboloMonedaCobranza(f.moneda)} {fmtMontoCobranza(f.saldo)}
                                    </p>
                                </div>
                            </Card>
                        )
                    })}
                </div>

                <Paginador
                    pagina={tablaPA.pagina} totalPaginas={tablaPA.totalPaginas} total={tablaPA.total}
                    tamano={tablaPA.tamano} onPagina={tablaPA.setPagina} onTamano={tablaPA.setTamano}
                    etiqueta="facturas"
                />
                </>
            ) : (
                <>
                <Card className="hidden overflow-hidden lg:block">
                    <div className="overflow-x-auto">
                        <table className="w-full table-fixed text-sm [&_td]:align-middle">
                            <colgroup>
                                <col className="w-32" />
                                <col />
                                <col className="w-40" />
                                <col className="w-28" />
                                <col className="w-28" />
                                <col className="w-32" />
                                <col className="w-28" />
                            </colgroup>
                            <thead className="sticky top-0 z-10 border-b bg-muted">
                                <tr>
                                    <Th titulo="N° Factura" clave="factura" orden={tablaAS.orden} direccion={tablaAS.direccion} onOrdenar={tablaAS.ordenarPor} />
                                    <Th titulo="Cliente" clave="cliente" orden={tablaAS.orden} direccion={tablaAS.direccion} onOrdenar={tablaAS.ordenarPor} />
                                    <Th titulo="Asignado a" clave="vendedor" orden={tablaAS.orden} direccion={tablaAS.direccion} onOrdenar={tablaAS.ordenarPor} />
                                    <Th titulo="Saldo" clave="saldo" orden={tablaAS.orden} direccion={tablaAS.direccion} onOrdenar={tablaAS.ordenarPor} derecha />
                                    <Th titulo="Vence" clave="vence" orden={tablaAS.orden} direccion={tablaAS.direccion} onOrdenar={tablaAS.ordenarPor} />
                                    <Th titulo="Estado" clave="estado" orden={tablaAS.orden} direccion={tablaAS.direccion} onOrdenar={tablaAS.ordenarPor} />
                                    <Th titulo="" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {tablaAS.visibles.map(c => (
                                    <tr key={c.id_asignacion} className="hover:bg-muted/50">
                                        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[13px] font-semibold">{c.serie}-{c.numero}</td>
                                        <td className="px-3 py-2.5">
                                            <div className="line-clamp-2 font-medium leading-snug" title={c.cliente_denominacion ?? ''}>{c.cliente_denominacion}</div>
                                            <div className="text-xs text-muted-foreground">{c.cliente_numdoc}</div>
                                            {c.ultimo_comentario && (
                                                <div className="mt-1 flex items-start gap-1 text-xs text-muted-foreground" title={c.ultimo_comentario}>
                                                    <MessageSquare className="mt-0.5 h-3 w-3 shrink-0" />
                                                    <span className="line-clamp-1 italic">{c.ultimo_comentario}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5 text-xs">
                                            <div className="line-clamp-2 leading-snug">{c.nombre_vendedor_asignado}</div>
                                            {Number(c.fue_reasignada) === 1 && (
                                                <span className="mt-0.5 inline-block rounded bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                                                    reasignada
                                                </span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums">
                                            {simboloMonedaCobranza(c.moneda)} {fmtMontoCobranza(c.saldo_actual)}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="tabular-nums">{fmtFecha(c.fecha_vencimiento)}</div>
                                            {estadoVisible(c) !== 'pagado' && <DiasVencimiento fecha={c.fecha_vencimiento} />}
                                        </td>
                                        <td className="px-3 py-2.5"><EstadoCobranzaBadge estado={estadoVisible(c)} alerta={avisoDescuadre(c)} /></td>
                                        <td className="px-3 py-2.5">
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
                                                    onClick={() => setConfirmarRetiro(c)}
                                                    disabled={retirandoId === c.id_asignacion}
                                                    title="Retirar asignación"
                                                >
                                                    {retirandoId === c.id_asignacion
                                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                                        : <Trash2 className="h-4 w-4" />}
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
                    {tablaAS.visibles.map(c => (
                        <Card key={c.id_asignacion} className="p-4">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="font-mono text-sm font-semibold">{c.serie}-{c.numero}</p>
                                    <p className="break-words text-sm font-medium">{c.cliente_denominacion}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {c.nombre_vendedor_asignado}
                                        {Number(c.fue_reasignada) === 1 && <span className="ml-1 font-semibold text-amber-700">· reasignada</span>}
                                    </p>
                                </div>
                                <EstadoCobranzaBadge estado={estadoVisible(c)} alerta={avisoDescuadre(c)} />
                            </div>
                            <div className="mt-3 flex items-end justify-between border-t pt-3">
                                <div className="space-y-1 text-xs text-muted-foreground tabular-nums">
                                    <div>Vence {fmtFecha(c.fecha_vencimiento)}</div>
                                    {estadoVisible(c) !== 'pagado' && <DiasVencimiento fecha={c.fecha_vencimiento} />}
                                </div>
                                <p className="whitespace-nowrap font-bold tabular-nums">
                                    {simboloMonedaCobranza(c.moneda)} {fmtMontoCobranza(c.saldo_actual)}
                                </p>
                            </div>
                            {c.ultimo_comentario && (
                                <p className="mt-2 line-clamp-2 break-words rounded-md bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">{c.ultimo_comentario}</p>
                            )}
                            <div className="mt-3 flex gap-2 border-t pt-3">
                                <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-sm" onClick={() => setGestionando(c)}>
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
                                    onClick={() => setConfirmarRetiro(c)}
                                    disabled={retirandoId === c.id_asignacion}
                                    title="Retirar asignación"
                                >
                                    {retirandoId === c.id_asignacion
                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        : <Trash2 className="h-3.5 w-3.5" />}
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>

                <Paginador
                    pagina={tablaAS.pagina} totalPaginas={tablaAS.totalPaginas} total={tablaAS.total}
                    tamano={tablaAS.tamano} onPagina={tablaAS.setPagina} onTamano={tablaAS.setTamano}
                    etiqueta="cobranzas"
                />
                </>
            )}

            {cargando && base.length === 0 && (
                <Card className="space-y-2 p-4">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </Card>
            )}

            {!cargando && sinFilas && (
                <Card className="py-12 text-center text-sm text-muted-foreground">
                    {tab === 'porAsignar'
                        ? 'No hay facturas pendientes de asignar con estos filtros.'
                        : 'Ninguna cobranza asignada coincide con estos filtros.'}
                </Card>
            )}

            {tab === 'porAsignar' && (
                <BarraSeleccion
                    cantidad={seleccion.size}
                    monto={montoPA(seleccionadas)}
                    onLimpiar={() => setSeleccion(new Map())}
                    onAsignar={() => setConfirmando(true)}
                />
            )}

            <AlertDialog open={confirmarRetiro != null} onOpenChange={(v) => { if (!v) setConfirmarRetiro(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmarRetiro && `¿Retirar ${confirmarRetiro.serie}-${confirmarRetiro.numero} de ${confirmarRetiro.nombre_vendedor_asignado}?`}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmarRetiro && (() => {
                                const perdidas: string[] = []
                                if (Number(confirmarRetiro.total_comentarios) > 0) perdidas.push(`${confirmarRetiro.total_comentarios} comentario(s)`)
                                if (Number(confirmarRetiro.tiene_evidencia) === 1) perdidas.push('el comprobante adjunto')
                                return perdidas.length > 0
                                    ? `Se eliminarán también ${perdidas.join(' y ')}. Esto no se puede deshacer.`
                                    : 'Esto no se puede deshacer.'
                            })()}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => confirmarRetiro && retirar(confirmarRetiro)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Retirar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <ConfirmarAsignacionModal
                open={confirmando}
                onOpenChange={setConfirmando}
                seleccionadas={seleccionadas}
                guardando={hook.guardando}
                consultarVendedores={hook.consultarVendedores}
                onConfirmar={confirmarAsignacion}
            />

            <EvidenciaCobranzaModal
                open={verEvidencia != null}
                onOpenChange={(v) => { if (!v) setVerEvidencia(null) }}
                cobranza={verEvidencia}
                obtenerEvidencia={hook.obtenerEvidencia}
                onEliminar={isAdmin() ? eliminarEvidencia : undefined}
            />

            <ActualizarGestionModal
                open={gestionando != null}
                onOpenChange={(v) => { if (!v) setGestionando(null) }}
                cobranza={gestionando}
                idUsuarioWeb={user?.idUsuarioWeb ?? null}
                guardando={hook.guardando}
                obtenerComentarios={hook.obtenerComentarios}
                obtenerEvidencia={hook.obtenerEvidencia}
                onGuardar={guardarGestion}
            />
        </div>
    )
}
