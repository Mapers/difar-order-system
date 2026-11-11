'use client'

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Loader2, RefreshCw, CheckCheck, XCircle, Inbox, History, Undo2, AlertCircle, Search,
} from "lucide-react"
import { toast } from "@/app/hooks/useToast"
import { CajaBancosService } from "@/app/services/contabilidad/ContabilidadService"
import {
    CajaCatalogos, CajaPlanillaHistorial, CajaPlanillaPendiente,
} from "@/app/types/contabilidad-types"

const money = (v: number | string) =>
    Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const simbolo = (moneda?: string | null) => (moneda === 'USD' ? 'US$' : 'S/')

/** 'YYYY-MM-DD...' -> 'dd/mm/yyyy'. */
const fmtFecha = (f?: string | null) => {
    const iso = String(f ?? '').slice(0, 10)
    return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '—'
}

const isoLocal = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const haceDias = (n: number) => {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return isoLocal(d)
}

const documento = (r: { serie: string | null; numero_doc: string | null }) =>
    `${r.serie ?? ''}-${r.numero_doc ?? ''}`

interface Edicion { idCaja: string; fecha: string }

interface Props {
    catalogos:     CajaCatalogos | null
    usuario:       number | null
    onPendientes?: (n: number) => void
}

export function PlanillasCaja({ catalogos, usuario, onPendientes }: Props) {
    const [vista, setVista] = useState<'pendientes' | 'historial'>('pendientes')

    const [pendientes, setPendientes] = useState<CajaPlanillaPendiente[]>([])
    const [cargando, setCargando]     = useState(false)
    const [edicion, setEdicion]       = useState<Record<number, Edicion>>({})
    const [seleccion, setSeleccion]   = useState<Set<number>>(new Set())
    const [trabajando, setTrabajando] = useState(false)

    const [aceptarIds, setAceptarIds]   = useState<number[] | null>(null)
    const [rechazarIds, setRechazarIds] = useState<number[] | null>(null)
    const [motivo, setMotivo]           = useState('')

    const [desde, setDesde]               = useState(haceDias(30))
    const [hasta, setHasta]               = useState(isoLocal(new Date()))
    const [historial, setHistorial]       = useState<CajaPlanillaHistorial[]>([])
    const [cargandoHist, setCargandoHist] = useState(false)
    const [histCargado, setHistCargado]   = useState(false)
    const [revertir, setRevertir]         = useState<CajaPlanillaHistorial | null>(null)

    const cajas = catalogos?.cajas ?? []
    const nombreTipoPago = (cod: string) => {
        const t = catalogos?.tiposPago.find(x => x.Cod_Tipo_Amort === cod)
        return t ? (t.Abreviatura || t.Descripcion) : cod
    }

    const cargarPendientes = useCallback(async () => {
        setCargando(true)
        try {
            const lista = await CajaBancosService.planillasPendientes()
            setPendientes(lista)
            // Las sugerencias solo llenan lo que el usuario aún no tocó.
            setEdicion(prev => {
                const sig: Record<number, Edicion> = {}
                for (const r of lista) {
                    sig[r.id_detalle] = prev[r.id_detalle] ?? {
                        idCaja: r.id_caja_sugerida != null ? String(r.id_caja_sugerida) : '',
                        fecha:  String(r.fecha_sugerida ?? '').slice(0, 10),
                    }
                }
                return sig
            })
            setSeleccion(prev => new Set([...prev].filter(id => lista.some(r => r.id_detalle === id))))
            onPendientes?.(lista.length)
        } catch {
            toast({ title: "Error", description: "No se pudieron cargar los cobros pendientes.", variant: "destructive" })
        } finally {
            setCargando(false)
        }
    }, [onPendientes])

    const cargarHistorial = useCallback(async () => {
        setCargandoHist(true)
        try {
            setHistorial(await CajaBancosService.planillasHistorial(desde, hasta))
            setHistCargado(true)
        } catch {
            toast({ title: "Error", description: "No se pudo cargar el historial.", variant: "destructive" })
        } finally {
            setCargandoHist(false)
        }
    }, [desde, hasta])

    useEffect(() => { cargarPendientes() }, [cargarPendientes])

    useEffect(() => {
        if (vista === 'historial' && !histCargado) cargarHistorial()
    }, [vista, histCargado, cargarHistorial])

    const grupos = useMemo(() => {
        const mapa = new Map<number, CajaPlanillaPendiente[]>()
        for (const r of pendientes) {
            if (!mapa.has(r.id_planilla)) mapa.set(r.id_planilla, [])
            mapa.get(r.id_planilla)!.push(r)
        }
        return [...mapa.values()]
    }, [pendientes])

    const toggle = (ids: number[], marcar: boolean) => {
        setSeleccion(prev => {
            const n = new Set(prev)
            ids.forEach(id => (marcar ? n.add(id) : n.delete(id)))
            return n
        })
    }

    const setCampo = (id: number, campo: keyof Edicion, valor: string) =>
        setEdicion(prev => ({ ...prev, [id]: { ...prev[id], [campo]: valor } }))

    const problemaAceptar = (ids: number[]) => {
        for (const id of ids) {
            const r = pendientes.find(x => x.id_detalle === id)
            const e = edicion[id]
            if (!r) continue
            if (!r.cuenta_cliente) return `El cliente de ${documento(r)} no tiene cuenta por cobrar en su ficha.`
            if (!e?.idCaja) return `Elige la caja o banco de ${documento(r)}.`
            if (!e?.fecha) return `Pon la fecha de ${documento(r)}.`
            const caja = cajas.find(c => String(c.IdCaja) === e.idCaja)
            if (caja && caja.MonedaCaja !== r.moneda) {
                return `${documento(r)} es en ${r.moneda} y la caja ${caja.Descripcion} es en ${caja.MonedaCaja}.`
            }
        }
        return null
    }

    const pedirAceptar = (ids: number[]) => {
        if (ids.length === 0) return
        const p = problemaAceptar(ids)
        if (p) {
            toast({ title: "Falta un dato", description: p, variant: "warning" })
            return
        }
        setAceptarIds(ids)
    }

    const confirmarAceptar = async () => {
        if (!aceptarIds) return
        const ids = aceptarIds
        setAceptarIds(null)
        setTrabajando(true)
        try {
            const r: any = await CajaBancosService.planillasAceptar(usuario, ids.map(id => ({
                idDetalle: id,
                idCaja:    Number(edicion[id].idCaja),
                fecha:     edicion[id].fecha,
            })))
            const n = Number(r?.aceptados ?? ids.length)
            const v = Number(r?.vouchers ?? 0)
            toast({
                title:       "Cobros aceptados",
                description: `${n} cobro${n !== 1 ? 's' : ''} pasaron al libro${v ? ` en ${v} voucher${v !== 1 ? 's' : ''}` : ''}.`,
            })
            await cargarPendientes()
            if (histCargado) cargarHistorial()
        } catch (e: any) {
            toast({
                title:       "No se pudo aceptar",
                description: e?.response?.data?.message || "Error al aceptar los cobros.",
                variant:     "destructive",
            })
        } finally {
            setTrabajando(false)
        }
    }

    const confirmarRechazar = async () => {
        if (!rechazarIds) return
        if (!motivo.trim()) {
            toast({ title: "Motivo requerido", description: "Escribe por qué se rechaza.", variant: "warning" })
            return
        }
        const ids = rechazarIds
        setRechazarIds(null)
        setTrabajando(true)
        try {
            await CajaBancosService.planillasRechazar(usuario, ids, motivo.trim())
            toast({
                title:       "Cobros rechazados",
                description: `${ids.length} cobro${ids.length !== 1 ? 's' : ''} volvieron al admin de planillas.`,
            })
            setMotivo('')
            await cargarPendientes()
            if (histCargado) cargarHistorial()
        } catch (e: any) {
            toast({
                title:       "No se pudo rechazar",
                description: e?.response?.data?.message || "Error al rechazar los cobros.",
                variant:     "destructive",
            })
        } finally {
            setTrabajando(false)
        }
    }

    const confirmarRevertir = async () => {
        if (!revertir) return
        const r = revertir
        setRevertir(null)
        setTrabajando(true)
        try {
            await CajaBancosService.planillasRevertir(usuario, r.id_detalle)
            toast({ title: "Cobro revertido", description: `${documento(r)} salió del voucher y volvió a pendientes.` })
            await Promise.all([cargarPendientes(), cargarHistorial()])
        } catch (e: any) {
            toast({
                title:       "No se pudo revertir",
                description: e?.response?.data?.message || "Error al revertir el cobro.",
                variant:     "destructive",
            })
        } finally {
            setTrabajando(false)
        }
    }

    const seleccionados = [...seleccion]
    const totalSel = pendientes
        .filter(r => seleccion.has(r.id_detalle))
        .reduce((s, r) => s + Number(r.importe_cobrado), 0)
    const resumenAceptar = useMemo(() => {
        if (!aceptarIds) return null
        const filas = pendientes.filter(r => aceptarIds.includes(r.id_detalle))
        const vouchers = new Set(filas.map(r => `${edicion[r.id_detalle]?.idCaja}|${edicion[r.id_detalle]?.fecha}`))
        return {
            n:        filas.length,
            total:    filas.reduce((s, r) => s + Number(r.importe_cobrado), 0),
            vouchers: vouchers.size,
        }
    }, [aceptarIds, pendientes, edicion])

    return (
        <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-lg border bg-muted p-1">
                    <button
                        type="button"
                        onClick={() => setVista('pendientes')}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${vista === 'pendientes' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <Inbox className="h-4 w-4" /> Pendientes
                        <span className="rounded-full bg-blue-600 px-1.5 text-[11px] text-white tabular-nums">{pendientes.length}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setVista('historial')}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${vista === 'historial' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <History className="h-4 w-4" /> Historial
                    </button>
                </div>

                {vista === 'pendientes' && (
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={cargarPendientes} disabled={cargando || trabajando}>
                            {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Actualizar
                        </Button>
                        <Button
                            variant="outline" size="sm"
                            className="gap-1.5 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                            onClick={() => { setMotivo(''); setRechazarIds(seleccionados) }}
                            disabled={trabajando || seleccionados.length === 0}
                        >
                            <XCircle className="h-4 w-4" /> Rechazar ({seleccionados.length})
                        </Button>
                        <Button
                            size="sm"
                            className="gap-1.5 bg-emerald-600 text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700"
                            onClick={() => pedirAceptar(seleccionados)}
                            disabled={trabajando || seleccionados.length === 0}
                        >
                            {trabajando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                            Aceptar seleccionados ({seleccionados.length})
                            {seleccionados.length > 0 && <span className="tabular-nums">· S/ {money(totalSel)}</span>}
                        </Button>
                    </div>
                )}
            </div>

            {vista === 'pendientes' && (
                cargando && pendientes.length === 0 ? (
                    <Card className="flex items-center justify-center py-16 text-muted-foreground shadow-sm">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </Card>
                ) : pendientes.length === 0 ? (
                    <Card className="shadow-sm">
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <Inbox className="h-12 w-12 mb-3 opacity-20" />
                            <p className="text-sm font-medium">No hay cobros de planilla pendientes</p>
                            <p className="text-xs">Aparecen aquí cuando el admin de planillas pulsa "Enviar a caja".</p>
                        </div>
                    </Card>
                ) : grupos.map(filas => {
                    const p = filas[0]
                    const ids = filas.map(r => r.id_detalle)
                    const todas = ids.every(id => seleccion.has(id))
                    const algunas = !todas && ids.some(id => seleccion.has(id))
                    const total = filas.reduce((s, r) => s + Number(r.importe_cobrado), 0)
                    return (
                        <Card key={p.id_planilla} className="overflow-hidden shadow-sm">
                            <div className="flex flex-wrap items-center gap-3 border-b bg-gradient-to-r from-muted/60 to-background px-4 py-3">
                                <Checkbox
                                    checked={todas ? true : algunas ? 'indeterminate' : false}
                                    onCheckedChange={v => toggle(ids, v === true)}
                                    disabled={trabajando}
                                    aria-label="Elegir toda la planilla"
                                />
                                <div className="min-w-0">
                                    <p className="font-mono text-[15px] font-extrabold">{p.numero_planilla}</p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {p.nombre_vendedor} · ruta {fmtFecha(p.fecha_ruta)} · enviada {fmtFecha(p.fecha_envio)}
                                    </p>
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                    <span className="font-mono text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                                        S/ {money(total)}
                                    </span>
                                    <Button size="sm" variant="outline" className="gap-1.5" disabled={trabajando}
                                            onClick={() => pedirAceptar(ids)}>
                                        <CheckCheck className="h-4 w-4" /> Aceptar todo
                                    </Button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[980px] text-xs">
                                    <thead>
                                        <tr className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                                            <th className="w-9 px-2 py-2" />
                                            <th className="px-2 py-2 text-left font-semibold">Cliente</th>
                                            <th className="px-2 py-2 text-left font-semibold">Documento</th>
                                            <th className="px-2 py-2 text-right font-semibold">Cobrado</th>
                                            <th className="px-2 py-2 text-left font-semibold">Pago</th>
                                            <th className="w-40 px-2 py-2 text-left font-semibold">Fecha</th>
                                            <th className="w-60 px-2 py-2 text-left font-semibold">Caja / banco</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filas.map(r => {
                                            const e = edicion[r.id_detalle] ?? { idCaja: '', fecha: '' }
                                            const caja = cajas.find(c => String(c.IdCaja) === e.idCaja)
                                            const otraMoneda = caja && caja.MonedaCaja !== r.moneda
                                            return (
                                                <tr key={r.id_detalle} className="border-t align-top hover:bg-muted/30">
                                                    <td className="px-2 py-2 text-center">
                                                        <Checkbox
                                                            checked={seleccion.has(r.id_detalle)}
                                                            onCheckedChange={v => toggle([r.id_detalle], v === true)}
                                                            disabled={trabajando}
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <p className="max-w-[240px] truncate font-semibold" title={r.nombre_cliente}>{r.nombre_cliente}</p>
                                                        <p className="font-mono text-[10.5px] text-muted-foreground">
                                                            {r.codigo_cliente || '—'}
                                                            {r.cuenta_cliente
                                                                ? <> · cta {r.cuenta_cliente}</>
                                                                : <span className="ml-1 font-sans font-semibold text-red-600">· sin cuenta por cobrar</span>}
                                                        </p>
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                                            {r.desc_tipo_documento || r.tipo_documento}
                                                        </span>
                                                        <span className="ml-1.5 font-mono">{documento(r)}</span>
                                                        {r.numero_recibo && <p className="text-[10.5px] text-muted-foreground">Rec. {r.numero_recibo}</p>}
                                                    </td>
                                                    <td className="px-2 py-2 text-right font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                                                        {simbolo(r.moneda)} {money(r.importe_cobrado)}
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <p className="font-semibold">{nombreTipoPago(r.tipo_pago)}</p>
                                                        <p className="text-[10.5px] text-muted-foreground">
                                                            {[r.desc_banco,
                                                              r.numero_operacion && `Op. ${r.numero_operacion}`,
                                                              r.numero_cheque && `Ch. ${r.numero_cheque}`,
                                                              r.fecha_deposito && `dep. ${fmtFecha(r.fecha_deposito)}`]
                                                                .filter(Boolean).join(' · ') || 'Efectivo'}
                                                        </p>
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <Input type="date" className="h-8 text-xs" value={e.fecha} disabled={trabajando}
                                                               onChange={ev => setCampo(r.id_detalle, 'fecha', ev.target.value)} />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <select
                                                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                                                            value={e.idCaja} disabled={trabajando}
                                                            onChange={ev => setCampo(r.id_detalle, 'idCaja', ev.target.value)}
                                                        >
                                                            <option value="">Elegir...</option>
                                                            {cajas.map(c => (
                                                                <option key={c.IdCaja} value={String(c.IdCaja)}>
                                                                    {c.Descripcion} ({c.MonedaCaja})
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {otraMoneda && (
                                                            <p className="mt-1 text-[10.5px] font-semibold text-amber-700">
                                                                El documento es en {r.moneda}
                                                            </p>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )
                })
            )}

            {vista === 'historial' && (
                <Card className="overflow-hidden shadow-sm">
                    <div className="flex flex-wrap items-end gap-3 border-b p-4">
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground">Desde</Label>
                            <Input type="date" className="h-9 w-40" value={desde} onChange={e => setDesde(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground">Hasta</Label>
                            <Input type="date" className="h-9 w-40" value={hasta} onChange={e => setHasta(e.target.value)} />
                        </div>
                        <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={cargarHistorial} disabled={cargandoHist}>
                            {cargandoHist ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            Buscar
                        </Button>
                        <p className="ml-auto text-xs text-muted-foreground">Filtra por la fecha en que se aceptó o rechazó.</p>
                    </div>

                    {historial.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
                            <History className="h-10 w-10 mb-2 opacity-20" />
                            <p className="text-sm">{cargandoHist ? 'Cargando...' : 'Nada aceptado ni rechazado en esas fechas'}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px] text-xs">
                                <thead>
                                    <tr className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                                        <th className="px-2 py-2 text-left font-semibold">Resuelto</th>
                                        <th className="px-2 py-2 text-left font-semibold">Estado</th>
                                        <th className="px-2 py-2 text-left font-semibold">Planilla</th>
                                        <th className="px-2 py-2 text-left font-semibold">Cliente / documento</th>
                                        <th className="px-2 py-2 text-right font-semibold">Cobrado</th>
                                        <th className="px-2 py-2 text-left font-semibold">En el libro / motivo</th>
                                        <th className="px-2 py-2 text-left font-semibold">Por</th>
                                        <th className="w-24 px-2 py-2" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {historial.map(r => (
                                        <tr key={r.id_detalle} className="border-t align-top hover:bg-muted/30">
                                            <td className="px-2 py-2 whitespace-nowrap font-mono">{fmtFecha(r.fecha_resuelve)}</td>
                                            <td className="px-2 py-2">
                                                {r.estado === 'aceptado' ? (
                                                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">Aceptado</span>
                                                ) : (
                                                    <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">Rechazado</span>
                                                )}
                                            </td>
                                            <td className="px-2 py-2">
                                                <p className="font-mono font-semibold">{r.numero_planilla}</p>
                                                <p className="max-w-[160px] truncate text-[10.5px] text-muted-foreground">{r.nombre_vendedor}</p>
                                            </td>
                                            <td className="px-2 py-2">
                                                <p className="max-w-[220px] truncate font-semibold" title={r.nombre_cliente}>{r.nombre_cliente}</p>
                                                <p className="font-mono text-[10.5px] text-muted-foreground">{documento(r)}</p>
                                            </td>
                                            <td className="px-2 py-2 text-right font-mono font-semibold tabular-nums">S/ {money(r.importe_cobrado)}</td>
                                            <td className="px-2 py-2">
                                                {r.estado === 'aceptado' ? (
                                                    <>
                                                        <p className="font-semibold">{r.caja}</p>
                                                        <p className="text-[10.5px] text-muted-foreground">
                                                            Voucher {r.voucher} · {fmtFecha(r.fecha_mvto)}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <p className="max-w-[260px] text-red-700 dark:text-red-400">{r.motivo}</p>
                                                )}
                                            </td>
                                            <td className="px-2 py-2 text-[10.5px] text-muted-foreground">{r.usuario_resuelve || '—'}</td>
                                            <td className="px-2 py-2 text-right">
                                                {r.estado === 'aceptado' && (
                                                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-amber-700 hover:bg-amber-50"
                                                            onClick={() => setRevertir(r)} disabled={trabajando}>
                                                        <Undo2 className="h-3.5 w-3.5" /> Revertir
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            <AlertDialog open={aceptarIds !== null} onOpenChange={v => { if (!v) setAceptarIds(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Aceptar cobros en el libro</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se registrarán {resumenAceptar?.n} cobro{resumenAceptar?.n !== 1 ? 's' : ''} por
                            {' '}S/ {money(resumenAceptar?.total ?? 0)} en {resumenAceptar?.vouchers} voucher
                            {resumenAceptar?.vouchers !== 1 ? 's' : ''} de caja. Se genera el asiento y baja la
                            deuda de cada cliente. Se puede revertir desde el Historial.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="bg-emerald-600 hover:bg-emerald-700" onClick={confirmarAceptar}>
                            Sí, aceptar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={rechazarIds !== null} onOpenChange={v => { if (!v) setRechazarIds(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Rechazar cobros</AlertDialogTitle>
                        <AlertDialogDescription>
                            {rechazarIds?.length} cobro{rechazarIds?.length !== 1 ? 's' : ''} volverán al admin de
                            planillas con este motivo, para que los revise y los reenvíe.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                        rows={3}
                        placeholder="Ej.: el depósito no aparece en el estado de cuenta del banco"
                        value={motivo}
                        onChange={e => setMotivo(e.target.value)}
                        maxLength={300}
                    />
                    {!motivo.trim() && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <AlertCircle className="h-3.5 w-3.5" /> El motivo es obligatorio.
                        </p>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <Button className="bg-red-600 hover:bg-red-700" onClick={confirmarRechazar} disabled={!motivo.trim()}>
                            Rechazar
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={revertir !== null} onOpenChange={v => { if (!v) setRevertir(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Revertir cobro</AlertDialogTitle>
                        <AlertDialogDescription>
                            {revertir && <>El cobro {documento(revertir)} de {revertir.nombre_cliente} saldrá del voucher
                            {' '}{revertir.voucher} ({revertir.caja}), se regenerará el asiento y la deuda del cliente
                            vuelve a subir. El cobro queda otra vez pendiente.</>}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="bg-amber-600 hover:bg-amber-700" onClick={confirmarRevertir}>
                            Sí, revertir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
