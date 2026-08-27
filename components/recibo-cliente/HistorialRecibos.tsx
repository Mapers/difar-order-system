'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Ban, Download, Eye, FileText, Loader2, Paperclip, Search, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { publicApi } from '@/app/api/client'
import { useAuth } from '@/context/authContext'
import { useReciboCliente } from '@/app/hooks/useReciboCliente'
import { ResultCounter } from '@/components/comprobantes/ResultCounter'
import {
    CONCEPTOS, EstadoRecibo, FiltrosHistorial, ReciboCabecera, simboloMoneda,
} from '@/app/types/recibo-cliente-types'
import { ReciboDetalleModal } from './ReciboDetalleModal'
import { AnularReciboDialog } from './AnularReciboDialog'

const ESTADO_TODOS = 'TODOS'

const FILTROS_VACIOS: FiltrosHistorial = {
    busqueda: '',
    fecha_desde: '',
    fecha_hasta: '',
    estado: '',
}

function fmtFecha(f: string | null) {
    if (!f) return '—'
    try { return format(parseISO(f), 'dd/MM/yyyy') } catch { return f.slice(0, 10) }
}

function etiquetaConcepto(c: string) {
    return CONCEPTOS.find(x => x.value === c)?.label ?? c
}

function EstadoBadge({ estado }: { estado: EstadoRecibo }) {
    const anulado = estado === 'ANULADO'

    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                anulado ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}
        >
            {anulado ? 'Anulado' : 'Emitido'}
        </span>
    )
}

function VoucherBadge({ cantidad }: { cantidad: number }) {
    const tiene = cantidad > 0

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                tiene ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}
            title={tiene ? `${cantidad} voucher(s) adjunto(s)` : 'Sin voucher adjunto'}
        >
            <Paperclip className="h-3 w-3" />
            {tiene ? cantidad : 'Sin voucher'}
        </span>
    )
}

export function HistorialRecibos() {
    const { user, isAdmin } = useAuth()
    const { historial, loadingHistorial, fetchHistorial, anularRecibo } = useReciboCliente()

    const [filtros, setFiltros] = useState<FiltrosHistorial>(FILTROS_VACIOS)
    const [reciboVisto, setReciboVisto] = useState<number | null>(null)
    const [reciboAAnular, setReciboAAnular] = useState<ReciboCabecera | null>(null)

    /* El badge de vouchers viene del listado, no del modal. Si dentro del
       detalle se adjuntó o borró alguno, el listado quedó desactualizado y hay
       que volver a pedirlo al cerrar. En un ref y no en estado: no repinta
       nada por sí solo, solo recuerda que hubo cambio. */
    const vouchersCambiaron = useRef(false)

    const idUsuarioFiltro = isAdmin() ? null : (user?.idUsuarioWeb ?? null)

    useEffect(() => {
        if (user) fetchHistorial(filtros, idUsuarioFiltro)
    }, [user])

    const buscar = () => fetchHistorial(filtros, idUsuarioFiltro)

    const setFiltro = (campo: keyof FiltrosHistorial, valor: string) =>
        setFiltros(prev => ({ ...prev, [campo]: valor }))

    const limpiarFechas = () =>
        setFiltros(prev => ({ ...prev, fecha_desde: '', fecha_hasta: '' }))

    const handleAnular = async (motivo: string) => {
        if (!reciboAAnular || !user) return
        await anularRecibo(reciboAAnular.id_recibo, motivo, user.idUsuarioWeb)
        setReciboAAnular(null)
    }

    const urlPdf = (r: ReciboCabecera) => (r.ruta_pdf ? `${publicApi}${r.ruta_pdf}` : null)

    const abrirPdf = (r: ReciboCabecera) => {
        const url = urlPdf(r)
        if (url) window.open(url, '_blank')
    }

    const acciones = (r: ReciboCabecera) => (
        <div className="flex gap-2">
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                onClick={() => setReciboVisto(r.id_recibo)}
                title="Ver detalle"
            >
                <Eye className="h-4 w-4" />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                disabled={!urlPdf(r)}
                onClick={() => abrirPdf(r)}
                title={urlPdf(r) ? 'Descargar PDF' : 'El PDF no se pudo generar'}
            >
                <Download className="h-4 w-4" />
            </Button>

            {r.estado !== 'ANULADO' && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setReciboAAnular(r)}
                    title="Anular recibo"
                >
                    <Ban className="h-4 w-4" />
                </Button>
            )}
        </div>
    )

    return (
        <div className="space-y-4">
            <Card className="bg-background shadow-sm">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Fecha desde</Label>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        className="bg-background pr-8"
                                        value={filtros.fecha_desde}
                                        onChange={(e) => setFiltro('fecha_desde', e.target.value)}
                                    />
                                    {filtros.fecha_desde && (
                                        <button
                                            type="button"
                                            onClick={limpiarFechas}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Fecha hasta</Label>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        className="bg-background pr-8"
                                        value={filtros.fecha_hasta}
                                        onChange={(e) => setFiltro('fecha_hasta', e.target.value)}
                                    />
                                    {filtros.fecha_hasta && (
                                        <button
                                            type="button"
                                            onClick={limpiarFechas}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Estado</Label>
                                <Select
                                    value={filtros.estado || ESTADO_TODOS}
                                    onValueChange={(v) =>
                                        setFiltro('estado', v === ESTADO_TODOS ? '' : (v as EstadoRecibo))
                                    }
                                >
                                    <SelectTrigger className="text-xs sm:text-sm">
                                        <SelectValue placeholder="Todos los estados" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ESTADO_TODOS}>Todos los estados</SelectItem>
                                        <SelectItem value="EMITIDO">Emitido</SelectItem>
                                        <SelectItem value="ANULADO">Anulado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Buscar</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 transform text-muted-foreground sm:h-4 sm:w-4" />
                                    <Input
                                        placeholder="Buscar por N° de recibo, código, nombre o RUC del cliente..."
                                        value={filtros.busqueda}
                                        onChange={(e) => setFiltro('busqueda', e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') buscar() }}
                                        className="pl-8 text-xs sm:pl-10 sm:text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <ResultCounter count={historial.length} label="Recibos recuperados" />

                            <Button onClick={buscar} disabled={loadingHistorial} className="flex items-center gap-2">
                                {loadingHistorial
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <Search className="h-4 w-4" />}
                                Buscar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {loadingHistorial ? (
                <div className="flex h-64 flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <div>Buscando recibos...</div>
                </div>
            ) : (
                <>
                    <div className="hidden lg:block">
                        <Card className="bg-background shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="px-3 py-3 text-left text-xs font-medium uppercase text-muted-foreground">N°</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Fecha</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Cliente</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Zona</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Vendedor</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Concepto</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Docs</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Voucher</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Total</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Estado</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Acciones</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-border bg-background">
                                        {historial.length > 0 ? (
                                            historial.map((r) => (
                                                <tr
                                                    key={r.id_recibo}
                                                    className={`transition-all hover:brightness-95 ${
                                                        r.estado === 'ANULADO' ? 'opacity-60' : ''
                                                    }`}
                                                >
                                                    <td className="p-4 text-sm font-medium">{r.numero_recibo}</td>
                                                    <td className="p-4 text-sm">{fmtFecha(r.fecha_emision)}</td>
                                                    <td className="p-4">
                                                        <div className="max-w-[220px] truncate text-sm font-medium" title={r.nombre_cliente}>
                                                            {r.nombre_cliente}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {r.cod_cliente}{r.ruc_cliente ? ` · ${r.ruc_cliente}` : ''}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm">{r.zona || '—'}</td>
                                                    <td className="p-4 text-sm">{r.nombre_vendedor || '—'}</td>
                                                    <td className="p-4 text-sm">{etiquetaConcepto(r.concepto)}</td>
                                                    <td className="p-4 text-sm tabular-nums">{r.total_documentos ?? '—'}</td>
                                                    <td className="p-4"><VoucherBadge cantidad={Number(r.total_vouchers ?? 0)} /></td>
                                                    <td className="p-4 text-sm font-medium tabular-nums">
                                                        {simboloMoneda(r.moneda)} {Number(r.total).toFixed(2)}
                                                    </td>
                                                    <td className="p-4"><EstadoBadge estado={r.estado} /></td>
                                                    <td className="p-4">{acciones(r)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={11} className="p-10 text-center">
                                                    <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                                                    <p className="text-sm text-muted-foreground">
                                                        No hay recibos con esos filtros.
                                                    </p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-3 lg:hidden">
                        {historial.length > 0 ? (
                            historial.map((r) => (
                                <Card
                                    key={r.id_recibo}
                                    className={`border border-border ${r.estado === 'ANULADO' ? 'opacity-60' : ''}`}
                                >
                                    <CardContent className="p-4">
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="mb-1 flex items-center gap-2">
                                                        <span className="font-semibold text-card-foreground">
                                                            {r.numero_recibo}
                                                        </span>
                                                        <EstadoBadge estado={r.estado} />
                                                        <VoucherBadge cantidad={Number(r.total_vouchers ?? 0)} />
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {fmtFecha(r.fecha_emision)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-card-foreground tabular-nums">
                                                        {simboloMoneda(r.moneda)} {Number(r.total).toFixed(2)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">Total</p>
                                                </div>
                                            </div>

                                            <div className="w-full overflow-hidden border-t pt-3">
                                                <p className="mb-0.5 truncate text-sm font-medium">{r.nombre_cliente}</p>
                                                <p className="mb-0.5 text-xs text-muted-foreground">
                                                    Cliente: {r.cod_cliente}{r.ruc_cliente ? ` · ${r.ruc_cliente}` : ''}
                                                </p>
                                                {r.zona && (
                                                    <p className="mb-0.5 text-xs text-muted-foreground">Zona: {r.zona}</p>
                                                )}
                                                {r.nombre_vendedor && (
                                                    <p className="mb-0.5 text-xs text-muted-foreground">
                                                        Vend: {r.nombre_vendedor}
                                                    </p>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    Concepto: {etiquetaConcepto(r.concepto)}
                                                </p>
                                            </div>

                                            <div className="flex justify-end border-t pt-2">{acciones(r)}</div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">No hay recibos con esos filtros.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </>
            )}

            <ReciboDetalleModal
                open={reciboVisto != null}
                onOpenChange={(v) => {
                    if (v) return

                    setReciboVisto(null)

                    if (vouchersCambiaron.current) {
                        vouchersCambiaron.current = false
                        fetchHistorial(filtros, idUsuarioFiltro)
                    }
                }}
                idRecibo={reciboVisto}
                onVouchersCambiaron={() => { vouchersCambiaron.current = true }}
            />

            <AnularReciboDialog
                open={reciboAAnular != null}
                onOpenChange={(v) => { if (!v) setReciboAAnular(null) }}
                recibo={reciboAAnular}
                onConfirmar={handleAnular}
            />
        </div>
    )
}
