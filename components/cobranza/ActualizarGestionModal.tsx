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
import {
    ChevronDown, ChevronUp, FileText, Layers, Loader2, Maximize2, Paperclip, Pencil, Upload,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { publicApi } from '@/app/api/client'
import { toast } from '@/app/hooks/useToast'
import { EstadoCobranzaBadge } from './EstadoCobranzaBadge'
import { UnificarImagenesModal } from './UnificarImagenesModal'
import { EditarImagenModal } from './EditarImagenModal'
import { ImagenAmpliadaModal } from './ImagenAmpliadaModal'
import {
    CobranzaAsignada, ComentarioCobranza, EstadoGestion, ESTADOS_GESTION,
    EvidenciaCobranza, EVIDENCIA_MAX_BYTES, EVIDENCIA_TIPOS,
    fmtMontoCobranza, simboloMonedaCobranza,
} from '@/app/types/cobranza-types'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    cobranza: CobranzaAsignada | null
    idUsuarioWeb: number | null
    guardando: boolean
    obtenerComentarios: (id: number) => Promise<ComentarioCobranza[]>
    obtenerEvidencia: (id: number) => Promise<EvidenciaCobranza | null>
    onGuardar: (estado: string, comentario: string, archivo: File | null) => Promise<void>
}

function fmtFecha(f: string | null) {
    if (!f) return '—'
    try { return format(parseISO(f), 'dd/MM/yyyy') } catch { return f.slice(0, 10) }
}

const esPdfRuta = (ruta: string) => /\.pdf$/i.test(ruta)

export function ActualizarGestionModal({
    open, onOpenChange, cobranza, idUsuarioWeb, guardando, obtenerComentarios, obtenerEvidencia, onGuardar,
}: Props) {
    const [estado, setEstado] = useState<EstadoGestion>('pendiente')
    const [comentario, setComentario] = useState('')
    const [archivo, setArchivo] = useState<File | null>(null)
    const [bitacora, setBitacora] = useState<ComentarioCobranza[]>([])
    const [unificarOpen, setUnificarOpen] = useState(false)
    const [editarOpen, setEditarOpen] = useState(false)
    const [archivoPreviewUrl, setArchivoPreviewUrl] = useState<string | null>(null)
    const [evidenciaExistente, setEvidenciaExistente] = useState<EvidenciaCobranza | null>(null)
    const [cargandoEvidencia, setCargandoEvidencia] = useState(false)
    const [cargandoParaEditar, setCargandoParaEditar] = useState(false)
    const [ampliadaOpen, setAmpliadaOpen] = useState(false)
    const [puedeSubir, setPuedeSubir] = useState(false)
    const [puedeBajar, setPuedeBajar] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!archivo || !archivo.type.startsWith('image/')) {
            setArchivoPreviewUrl(null)
            return
        }
        const url = URL.createObjectURL(archivo)
        setArchivoPreviewUrl(url)
        return () => URL.revokeObjectURL(url)
    }, [archivo])

    useEffect(() => {
        if (!open || !cobranza) return

        setEstado(cobranza.estado_gestion)
        setComentario('')
        setArchivo(null)
        setEvidenciaExistente(null)

        let cancelado = false
        obtenerComentarios(cobranza.id_asignacion)
            .then(c => { if (!cancelado) setBitacora(c) })

        if (Number(cobranza.tiene_evidencia) === 1) {
            setCargandoEvidencia(true)
            obtenerEvidencia(cobranza.id_asignacion)
                .then(e => { if (!cancelado) setEvidenciaExistente(e) })
                .finally(() => { if (!cancelado) setCargandoEvidencia(false) })
        }

        return () => { cancelado = true }
    }, [open, cobranza, obtenerComentarios, obtenerEvidencia])

    useEffect(() => {
        const el = contentRef.current
        if (!el || !open) return
        const actualizar = () => {
            setPuedeSubir(el.scrollTop > 4)
            setPuedeBajar(el.scrollHeight - el.clientHeight - el.scrollTop > 4)
        }
        actualizar()
        const obs = new ResizeObserver(actualizar)
        obs.observe(el)
        el.addEventListener('scroll', actualizar)
        return () => { obs.disconnect(); el.removeEventListener('scroll', actualizar) }
    }, [open])

    const desplazar = (direccion: 1 | -1) => {
        contentRef.current?.scrollBy({ top: direccion * 240, behavior: 'smooth' })
    }

    const urlEvidenciaExistente = evidenciaExistente ? `${publicApi}${evidenciaExistente.ruta}` : null

    const obtenerArchivoDesdeEvidencia = async (): Promise<File | null> => {
        if (!evidenciaExistente || esPdfRuta(evidenciaExistente.ruta)) return null
        try {
            const res = await fetch(`${publicApi}${evidenciaExistente.ruta}`)
            const blob = await res.blob()
            return new File([blob], evidenciaExistente.nombre_archivo || 'comprobante.jpg', {
                type: blob.type || 'image/jpeg',
            })
        } catch {
            return null
        }
    }

    const editarEvidenciaExistente = async () => {
        setCargandoParaEditar(true)
        const file = await obtenerArchivoDesdeEvidencia()
        setCargandoParaEditar(false)
        if (!file) {
            toast({ title: '', description: 'No se pudo cargar el comprobante para editarlo.', variant: 'error' })
            return
        }
        setArchivo(file)
        setEditarOpen(true)
    }

    const cargarArchivoActual = async (): Promise<File | null> => {
        if (archivo) return archivo.type.startsWith('image/') ? archivo : null
        return obtenerArchivoDesdeEvidencia()
    }

    if (!cobranza) return null

    const pagada = Number(cobranza.esta_pagado) === 1
    const simbolo = simboloMonedaCobranza(cobranza.moneda)

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!guardando) onOpenChange(v) }}>
            <DialogContent className="flex max-h-[95dvh] max-w-lg flex-col overflow-hidden p-0">
                <div ref={contentRef} className="scrollbar-none min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
                <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">
                        {cobranza.serie}-{cobranza.numero} — {cobranza.cliente_denominacion}
                    </DialogTitle>
                    <DialogDescription>
                        Vence {fmtFecha(cobranza.fecha_vencimiento)} · Saldo {simbolo}{' '}
                        {fmtMontoCobranza(cobranza.saldo_actual)}
                    </DialogDescription>
                </DialogHeader>

                {pagada && estado !== 'pagado' && (
                    <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-sm text-emerald-800 dark:text-emerald-300">
                        El kardex ya no registra saldo para esta factura. Si el cobro está
                        confirmado, márcala como <b>Pagado</b>.
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
                    {estado === 'pagado' && !pagada && (
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                            El kardex todavía registra un saldo de {simbolo}{' '}
                            {fmtMontoCobranza(cobranza.saldo_actual)} para esta factura.
                        </p>
                    )}
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
                            if (!f) return
                            if (!EVIDENCIA_TIPOS.includes(f.type)) {
                                toast({ title: '', description: 'Solo se permiten imágenes JPG, PNG, WEBP o archivos PDF.', variant: 'error' })
                                return
                            }
                            if (f.size > EVIDENCIA_MAX_BYTES) {
                                toast({ title: '', description: 'El archivo supera el tamaño máximo de 5 MB.', variant: 'error' })
                                return
                            }
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
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setUnificarOpen(true)}
                            disabled={guardando || (!!archivo && !archivo.type.startsWith('image/'))}
                            title={archivo && !archivo.type.startsWith('image/') ? 'No disponible con un PDF adjunto' : undefined}
                            className="gap-1.5"
                        >
                            <Layers className="h-4 w-4" />
                            Unir varias imágenes
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
                    {archivoPreviewUrl && (
                        <div className="space-y-1.5">
                            <div className="flex justify-center rounded-lg border bg-muted/40 p-2">
                                <img
                                    src={archivoPreviewUrl}
                                    alt="Vista previa del comprobante"
                                    className="max-h-[220px] w-auto max-w-full rounded object-contain"
                                />
                            </div>
                            <Button
                                type="button" variant="outline" size="sm" className="gap-1.5"
                                onClick={() => setEditarOpen(true)}
                                disabled={guardando}
                            >
                                <Pencil className="h-3.5 w-3.5" />
                                Recortar / resaltar
                            </Button>
                        </div>
                    )}

                    {cargandoEvidencia && (
                        <p className="text-xs text-muted-foreground">Cargando comprobante actual…</p>
                    )}

                    {!archivo && evidenciaExistente && (
                        <div className="space-y-1.5">
                            {esPdfRuta(evidenciaExistente.ruta) ? (
                                <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
                                    <FileText className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                                    <span className="truncate">{evidenciaExistente.nombre_archivo}</span>
                                </div>
                            ) : (
                                <div className="flex justify-center rounded-lg border bg-muted/40 p-2">
                                    <img
                                        src={urlEvidenciaExistente!}
                                        alt="Comprobante actual"
                                        className="max-h-[220px] w-auto max-w-full cursor-zoom-in rounded object-contain"
                                        onClick={() => setAmpliadaOpen(true)}
                                    />
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button" variant="outline" size="sm" className="gap-1.5"
                                    onClick={() => (esPdfRuta(evidenciaExistente.ruta)
                                        ? window.open(urlEvidenciaExistente!, '_blank')
                                        : setAmpliadaOpen(true))}
                                >
                                    <Maximize2 className="h-3.5 w-3.5" />
                                    Visualizar
                                </Button>
                                {!esPdfRuta(evidenciaExistente.ruta) && (
                                    <Button
                                        type="button" variant="outline" size="sm" className="gap-1.5"
                                        onClick={editarEvidenciaExistente}
                                        disabled={cargandoParaEditar || guardando}
                                    >
                                        {cargandoParaEditar
                                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            : <Pencil className="h-3.5 w-3.5" />}
                                        Recortar / resaltar
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
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
                                    <div className="mb-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
                </div>

                {puedeSubir && (
                    <button
                        type="button"
                        onClick={() => desplazar(-1)}
                        className="absolute right-3 top-16 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md ring-1 ring-border hover:bg-accent"
                        aria-label="Desplazar hacia arriba"
                    >
                        <ChevronUp className="h-4 w-4" />
                    </button>
                )}
                {puedeBajar && (
                    <button
                        type="button"
                        onClick={() => desplazar(1)}
                        className="absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md ring-1 ring-border hover:bg-accent"
                        aria-label="Desplazar hacia abajo"
                    >
                        <ChevronDown className="h-4 w-4" />
                    </button>
                )}
            </DialogContent>

            <ImagenAmpliadaModal
                open={ampliadaOpen}
                onOpenChange={setAmpliadaOpen}
                src={evidenciaExistente && !esPdfRuta(evidenciaExistente.ruta) ? urlEvidenciaExistente : null}
                alt="Comprobante actual ampliado"
                titulo="Comprobante ampliado"
            />

            <UnificarImagenesModal
                open={unificarOpen}
                onOpenChange={setUnificarOpen}
                onConfirmar={(f) => setArchivo(f)}
                cargarInicial={cargarArchivoActual}
            />
            <EditarImagenModal
                open={editarOpen}
                onOpenChange={setEditarOpen}
                archivo={archivo}
                onGuardar={(f) => setArchivo(f)}
            />
        </Dialog>
    )
}
