'use client'

import { useEffect, useRef, useState } from 'react'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Loader2, Paperclip, Upload } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { EstadoCobranzaBadge } from './EstadoCobranzaBadge'
import {
    CobranzaAsignada, ComentarioCobranza, EstadoGestion, ESTADOS_GESTION,
    simboloMonedaCobranza,
} from '@/app/types/cobranza-types'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    cobranza: CobranzaAsignada | null
    idUsuarioWeb: number | null
    guardando: boolean
    obtenerComentarios: (id: number) => Promise<ComentarioCobranza[]>
    onGuardar: (estado: string, comentario: string, archivo: File | null) => Promise<void>
}

function fmtFecha(f: string | null) {
    if (!f) return '—'
    try { return format(parseISO(f), 'dd/MM/yyyy') } catch { return f.slice(0, 10) }
}

export function ActualizarGestionModal({
    open, onOpenChange, cobranza, idUsuarioWeb, guardando, obtenerComentarios, onGuardar,
}: Props) {
    const [estado, setEstado] = useState<EstadoGestion>('pendiente')
    const [comentario, setComentario] = useState('')
    const [archivo, setArchivo] = useState<File | null>(null)
    const [bitacora, setBitacora] = useState<ComentarioCobranza[]>([])
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!open || !cobranza) return

        setEstado(cobranza.estado_gestion)
        setComentario('')
        setArchivo(null)

        let cancelado = false
        obtenerComentarios(cobranza.id_asignacion)
            .then(c => { if (!cancelado) setBitacora(c) })

        return () => { cancelado = true }
    }, [open, cobranza, obtenerComentarios])

    if (!cobranza) return null

    const pagada = Number(cobranza.esta_pagado) === 1
    const simbolo = simboloMonedaCobranza(cobranza.moneda)

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!guardando) onOpenChange(v) }}>
            <DialogContent className="max-h-[95vh] max-w-lg overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">
                        {cobranza.serie}-{cobranza.numero} — {cobranza.cliente_denominacion}
                    </DialogTitle>
                    <DialogDescription>
                        Vence {fmtFecha(cobranza.fecha_vencimiento)} · Saldo {simbolo}{' '}
                        {Number(cobranza.saldo_actual).toFixed(2)}
                    </DialogDescription>
                </DialogHeader>

                {pagada && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                        Esta factura ya no tiene saldo pendiente: figura como <b>pagada</b> según el
                        kardex. No hace falta marcarla a mano.
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Estado de la gestión</Label>
                    <Select value={estado} onValueChange={(v) => setEstado(v as EstadoGestion)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {ESTADOS_GESTION.map(e => (
                                <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        &quot;Pagado&quot; y &quot;vencido&quot; no se eligen aquí: salen del saldo real y de la fecha de vencimiento.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>Evidencia de pago</Label>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0] ?? null
                            e.target.value = ''
                            setArchivo(f)
                        }}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => inputRef.current?.click()}
                            disabled={guardando}
                            className="gap-1.5"
                        >
                            <Upload className="h-4 w-4" />
                            {archivo ? 'Cambiar archivo' : 'Adjuntar comprobante'}
                        </Button>
                        {archivo && (
                            <span className="inline-flex max-w-full items-center gap-1 truncate rounded bg-muted px-2 py-1 text-xs">
                                <Paperclip className="h-3 w-3 shrink-0" />
                                <span className="truncate">{archivo.name}</span>
                            </span>
                        )}
                        {!archivo && Number(cobranza.tiene_evidencia) === 1 && (
                            <span className="text-xs text-muted-foreground">
                                Ya tiene un comprobante. Si adjuntas otro, lo reemplaza.
                            </span>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Comentario</Label>
                    <Textarea
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        placeholder="Ej: el cliente confirmó transferencia para el viernes..."
                        maxLength={500}
                        className="min-h-[72px]"
                    />
                </div>

                {bitacora.length > 0 && (
                    <div className="space-y-2 border-t pt-3">
                        <p className="text-xs font-semibold text-muted-foreground">Bitácora</p>
                        <div className="max-h-[180px] space-y-2 overflow-y-auto">
                            {bitacora.map(c => (
                                <div key={c.id_comentario} className="border-b border-dashed pb-2 last:border-0">
                                    <div className="mb-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                        <span>{fmtFecha(c.fecha_registro)}</span>
                                        <span>·</span>
                                        <span>{c.usuario || '—'}</span>
                                        {c.estado_al_comentar && (
                                            <EstadoCobranzaBadge estado={c.estado_al_comentar} />
                                        )}
                                    </div>
                                    <p className="text-sm">{c.texto}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => onGuardar(estado, comentario, archivo)}
                        disabled={guardando || !idUsuarioWeb}
                        className="gap-1.5"
                    >
                        {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
