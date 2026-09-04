'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Eye, Loader2, PenLine, Search } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useAuth } from '@/context/authContext'
import { EstadoCobranzaBadge } from './EstadoCobranzaBadge'
import { EvidenciaCobranzaModal } from './EvidenciaCobranzaModal'
import { ActualizarGestionModal } from './ActualizarGestionModal'
import { useCobranzaAsignacion } from '@/app/hooks/useCobranzaAsignacion'
import {
    CobranzaAsignada, ETIQUETA_ESTADO,
    estadoVisible, simboloMonedaCobranza,
} from '@/app/types/cobranza-types'

function fmtFecha(f: string | null) {
    if (!f) return '—'
    try { return format(parseISO(f), 'dd/MM/yyyy') } catch { return f.slice(0, 10) }
}

export function SeccionVendedorCobranza() {
    const { user } = useAuth()
    const hook = useCobranzaAsignacion()

    const [buscar, setBuscar] = useState('')
    const [buscarAplicado, setBuscarAplicado] = useState('')
    const [gestionando, setGestionando] = useState<CobranzaAsignada | null>(null)
    const [verEvidencia, setVerEvidencia] = useState<CobranzaAsignada | null>(null)

    const codVendedor = user?.codigo ?? ''

    useEffect(() => {
        const t = setTimeout(() => setBuscarAplicado(buscar.trim()), 400)
        return () => clearTimeout(t)
    }, [buscar])

    const filtros = { vendedor: codVendedor, busqueda: buscarAplicado }

    const recargar = useCallback(() => {
        if (!codVendedor) return
        hook.fetchAsignadas({ vendedor: codVendedor, busqueda: buscarAplicado }, true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [codVendedor, buscarAplicado])

    useEffect(() => { recargar() }, [recargar])

    const centinelaRef = useRef<HTMLDivElement>(null)
    const hayMas = hook.asignadas.length < hook.totalAsignadas

    const cargarMas = useCallback(() => {
        if (hook.cargandoAsignadas || !hayMas) return
        hook.fetchAsignadas(filtros, false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hook.cargandoAsignadas, hayMas, codVendedor, buscarAplicado])

    useEffect(() => {
        const nodo = centinelaRef.current
        if (!nodo) return
        const obs = new IntersectionObserver(
            (e) => { if (e[0].isIntersecting) cargarMas() },
            { rootMargin: '200px' }
        )
        obs.observe(nodo)
        return () => obs.disconnect()
    }, [cargarMas])

    const contadores = ['pendiente', 'en_gestion', 'promesa_pago', 'incobrable', 'pagado'].map(k => ({
        estado: k,
        n: hook.asignadas.filter(c => estadoVisible(c) === k).length,
    }))

    const guardarGestion = async (estado: string, comentario: string, archivo: File | null) => {
        if (!gestionando || !user?.idUsuarioWeb) return

        const ok = await hook.actualizarGestion(gestionando.id_asignacion, user.idUsuarioWeb, estado, comentario)
        if (!ok) return

        if (archivo) {
            await hook.subirEvidencia(gestionando.id_asignacion, archivo, user.idUsuarioWeb)
        }

        setGestionando(null)
        recargar()
    }

    if (!codVendedor) {
        return (
            <Card className="py-12 text-center text-sm text-muted-foreground">
                Tu usuario no tiene un código de vendedor asignado, así que no se puede
                mostrar tu cartera de cobranza.
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {contadores.map(c => (
                    <Card key={c.estado} className="p-3">
                        <p className="text-xl font-bold tabular-nums">{c.n}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {ETIQUETA_ESTADO[c.estado]}
                        </p>
                    </Card>
                ))}
            </div>
            <p className="-mt-2 text-[11px] text-muted-foreground">
                Contadores sobre las {hook.asignadas.length} filas cargadas de {hook.totalAsignadas}.
            </p>

            <div className="space-y-1 sm:max-w-sm">
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

            <Card className="hidden lg:block">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border text-sm">
                        <thead className="bg-muted">
                            <tr>
                                {['N° Factura', 'Cliente', 'Semana', 'Saldo', 'Vence', 'Estado', ''].map(h => (
                                    <th key={h} className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {hook.asignadas.map(c => (
                                <tr key={c.id_asignacion} className={Number(c.esta_vencido) === 1 ? 'bg-red-50/60' : ''}>
                                    <td className="px-3 py-2 font-medium">{c.serie}-{c.numero}</td>
                                    <td className="px-3 py-2">
                                        <div className="max-w-[240px] truncate">{c.cliente_denominacion}</div>
                                        <div className="text-xs text-muted-foreground">{c.cliente_numdoc}</div>
                                    </td>
                                    <td className="px-3 py-2 text-xs">{c.semana_asignacion}</td>
                                    <td className="px-3 py-2 tabular-nums">
                                        {simboloMonedaCobranza(c.moneda)} {Number(c.saldo_actual).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 tabular-nums">{fmtFecha(c.fecha_vencimiento)}</td>
                                    <td className="px-3 py-2"><EstadoCobranzaBadge estado={estadoVisible(c)} /></td>
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
                                                variant="outline" size="sm"
                                                onClick={() => setGestionando(c)}
                                                className="gap-1.5 text-xs"
                                            >
                                                <PenLine className="h-3.5 w-3.5" /> Actualizar
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
                        className={`p-4 ${Number(c.esta_vencido) === 1 ? 'border-red-200 bg-red-50/40' : ''}`}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="font-semibold">{c.serie}-{c.numero}</p>
                                <p className="truncate text-sm text-muted-foreground">
                                    {c.cliente_denominacion}
                                </p>
                            </div>
                            <EstadoCobranzaBadge estado={estadoVisible(c)} />
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-xs">
                            <div>
                                <p className="text-muted-foreground">Saldo</p>
                                <p className="font-semibold tabular-nums">
                                    {simboloMonedaCobranza(c.moneda)} {Number(c.saldo_actual).toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Vence</p>
                                <p className="tabular-nums">{fmtFecha(c.fecha_vencimiento)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Semana</p>
                                <p>{c.semana_asignacion || '—'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Comentarios</p>
                                <p>{c.total_comentarios}</p>
                            </div>
                        </div>

                        <div className="mt-3 flex gap-2 border-t pt-3">
                            <Button
                                variant="outline" size="sm" className="flex-1 gap-1.5 text-xs"
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
                        </div>
                    </Card>
                ))}
            </div>

            {!hook.cargandoAsignadas && hook.asignadas.length === 0 && (
                <Card className="py-10 text-center text-sm text-muted-foreground">
                    No tienes facturas asignadas para cobrar con estos filtros.
                </Card>
            )}

            {hook.cargandoAsignadas && (
                <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
            )}

            <div ref={centinelaRef} className="h-4" />

            {hayMas && !hook.cargandoAsignadas && (
                <div className="flex justify-center">
                    <Button variant="outline" size="sm" onClick={cargarMas} className="gap-1.5">
                        <Loader2 className="h-3.5 w-3.5" /> Cargar más
                    </Button>
                </div>
            )}

            <ActualizarGestionModal
                open={gestionando != null}
                onOpenChange={(v) => { if (!v) setGestionando(null) }}
                cobranza={gestionando}
                idUsuarioWeb={user?.idUsuarioWeb ?? null}
                guardando={hook.guardando}
                obtenerComentarios={hook.obtenerComentarios}
                onGuardar={guardarGestion}
            />

            <EvidenciaCobranzaModal
                open={verEvidencia != null}
                onOpenChange={(v) => { if (!v) setVerEvidencia(null) }}
                cobranza={verEvidencia}
                obtenerEvidencia={hook.obtenerEvidencia}
            />
        </div>
    )
}
