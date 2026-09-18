'use client'

import { useEffect, useRef, useState } from 'react'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    Crop, Highlighter, Loader2, RotateCcw, Undo2, ZoomIn, ZoomOut,
} from 'lucide-react'
import { toast } from '@/app/hooks/useToast'
import { cn } from '@/lib/utils'
import { comprimirCanvas } from './unirImagenes'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    archivo: File | null
    onGuardar: (archivo: File) => void
}

type Modo = 'recortar' | 'resaltar'

interface Snapshot {
    width: number
    height: number
    canvas: HTMLCanvasElement
}

interface Seleccion {
    x0: number
    y0: number
    x1: number
    y1: number
}

interface PreviaRecorte {
    url: string
    x: number
    y: number
    w: number
    h: number
}

const LADO_MAX_EDICION = 4096
const AREA_MAX_EDICION = 12_000_000
const COLOR_RESALTADO = 'rgba(255, 214, 0, 0.45)'
const MAX_HISTORIAL = 5
const ZOOM_MIN = 1
const ZOOM_MAX = 4
const ZOOM_PASO = 0.5

function escalaDeEdicion(ancho: number, alto: number) {
    const porLado = Math.min(1, LADO_MAX_EDICION / Math.max(ancho, alto))
    const porArea = Math.min(1, Math.sqrt(AREA_MAX_EDICION / (ancho * alto)))
    return Math.min(porLado, porArea)
}

function coordenadasCanvas(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect()
    const x = (clientX - rect.left) * (canvas.width / rect.width)
    const y = (clientY - rect.top) * (canvas.height / rect.height)
    return {
        x: Math.min(Math.max(x, 0), canvas.width),
        y: Math.min(Math.max(y, 0), canvas.height),
    }
}

export function EditarImagenModal({ open, onOpenChange, archivo, onGuardar }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const overlayRef = useRef<HTMLCanvasElement>(null)
    const contenedorRef = useRef<HTMLDivElement>(null)
    const historialRef = useRef<Snapshot[]>([])
    const dibujandoRef = useRef(false)
    const ultimoPuntoRef = useRef<{ x: number; y: number } | null>(null)
    const inicioRef = useRef<{ x: number; y: number } | null>(null)
    const panRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null)

    const [modo, setModo] = useState<Modo>('recortar')
    const [seleccion, setSeleccion] = useState<Seleccion | null>(null)
    const [previaRecorte, setPreviaRecorte] = useState<PreviaRecorte | null>(null)
    const [cargando, setCargando] = useState(false)
    const [guardando, setGuardando] = useState(false)
    const [puedeDeshacer, setPuedeDeshacer] = useState(false)
    const [zoomEdicion, setZoomEdicion] = useState(1)
    const [baseDisplaySize, setBaseDisplaySize] = useState<{ w: number; h: number } | null>(null)

    useEffect(() => {
        if (!open || !archivo) return

        setModo('recortar')
        setSeleccion(null)
        setPreviaRecorte(prev => { if (prev) URL.revokeObjectURL(prev.url); return null })
        historialRef.current = []
        setPuedeDeshacer(false)
        setCargando(true)

        const url = URL.createObjectURL(archivo)
        const img = new Image()
        img.onload = () => {
            const canvas = canvasRef.current
            const overlay = overlayRef.current
            if (!canvas || !overlay) { setCargando(false); return }
            const escala = escalaDeEdicion(img.naturalWidth, img.naturalHeight)
            const w = Math.round(img.naturalWidth * escala)
            const h = Math.round(img.naturalHeight * escala)
            canvas.width = w
            canvas.height = h
            overlay.width = w
            overlay.height = h
            const ctx = canvas.getContext('2d')!
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, w, h)
            ctx.drawImage(img, 0, 0, w, h)
            URL.revokeObjectURL(url)
            setCargando(false)
        }
        img.onerror = () => {
            URL.revokeObjectURL(url)
            setCargando(false)
            toast({ title: '', description: 'No se pudo abrir la imagen para editar.', variant: 'error' })
            onOpenChange(false)
        }
        img.src = url
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, archivo])

    const medirYResetZoom = () => {
        const canvas = canvasRef.current
        const overlay = overlayRef.current
        if (!canvas) return
        canvas.style.width = ''
        canvas.style.height = ''
        canvas.style.maxWidth = ''
        canvas.style.maxHeight = ''
        if (overlay) {
            overlay.style.width = ''
            overlay.style.height = ''
            overlay.style.maxWidth = ''
            overlay.style.maxHeight = ''
        }
        const rect = canvas.getBoundingClientRect()
        setBaseDisplaySize({ w: rect.width, h: rect.height })
        setZoomEdicion(1)
    }

    useEffect(() => {
        if (!cargando) medirYResetZoom()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cargando])

    const cambiarZoom = (delta: number) => {
        setZoomEdicion(z => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((z + delta) * 100) / 100)))
    }

    const estiloZoom: React.CSSProperties | undefined = (baseDisplaySize && zoomEdicion !== 1)
        ? {
            width: baseDisplaySize.w * zoomEdicion,
            height: baseDisplaySize.h * zoomEdicion,
            maxWidth: 'none',
            maxHeight: 'none',
        }
        : undefined

    const limpiarOverlay = () => {
        const overlay = overlayRef.current
        if (!overlay) return
        overlay.getContext('2d')!.clearRect(0, 0, overlay.width, overlay.height)
    }

    const guardarSnapshot = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const copia = document.createElement('canvas')
        copia.width = canvas.width
        copia.height = canvas.height
        copia.getContext('2d')!.drawImage(canvas, 0, 0)
        historialRef.current.push({ width: canvas.width, height: canvas.height, canvas: copia })
        if (historialRef.current.length > MAX_HISTORIAL) historialRef.current.shift()
        setPuedeDeshacer(true)
    }

    const deshacer = () => {
        const canvas = canvasRef.current
        const overlay = overlayRef.current
        const previo = historialRef.current.pop()
        if (!canvas || !overlay || !previo) return
        canvas.width = previo.width
        canvas.height = previo.height
        overlay.width = previo.width
        overlay.height = previo.height
        canvas.getContext('2d')!.drawImage(previo.canvas, 0, 0)
        setSeleccion(null)
        setPreviaRecorte(prev => { if (prev) URL.revokeObjectURL(prev.url); return null })
        setPuedeDeshacer(historialRef.current.length > 0)
        medirYResetZoom()
    }

    const restablecer = () => {
        if (!archivo) return
        historialRef.current = []
        setPuedeDeshacer(false)
        setSeleccion(null)
        setPreviaRecorte(prev => { if (prev) URL.revokeObjectURL(prev.url); return null })
        setCargando(true)
        const url = URL.createObjectURL(archivo)
        const img = new Image()
        img.onload = () => {
            const canvas = canvasRef.current
            const overlay = overlayRef.current
            if (!canvas || !overlay) { setCargando(false); return }
            const escala = escalaDeEdicion(img.naturalWidth, img.naturalHeight)
            const w = Math.round(img.naturalWidth * escala)
            const h = Math.round(img.naturalHeight * escala)
            canvas.width = w
            canvas.height = h
            overlay.width = w
            overlay.height = h
            const ctx = canvas.getContext('2d')!
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, w, h)
            ctx.drawImage(img, 0, 0, w, h)
            URL.revokeObjectURL(url)
            setCargando(false)
        }
        img.onerror = () => {
            URL.revokeObjectURL(url)
            setCargando(false)
            toast({ title: '', description: 'No se pudo restablecer la imagen.', variant: 'error' })
        }
        img.src = url
    }

    const dibujarSeleccion = (sel: Seleccion) => {
        const overlay = overlayRef.current
        if (!overlay) return
        const ctx = overlay.getContext('2d')!
        ctx.clearRect(0, 0, overlay.width, overlay.height)
        const x = Math.min(sel.x0, sel.x1)
        const y = Math.min(sel.y0, sel.y1)
        const w = Math.abs(sel.x1 - sel.x0)
        const h = Math.abs(sel.y1 - sel.y0)

        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
        ctx.fillRect(0, 0, overlay.width, overlay.height)
        ctx.clearRect(x, y, w, h)

        ctx.strokeStyle = '#38bdf8'
        ctx.lineWidth = 2
        ctx.setLineDash([6, 4])
        ctx.strokeRect(x, y, w, h)
    }

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const canvas = canvasRef.current
        if (!canvas || cargando || dibujandoRef.current || panRef.current) return
        const { x, y } = coordenadasCanvas(canvas, e.clientX, e.clientY)
        dibujandoRef.current = true
        e.currentTarget.setPointerCapture(e.pointerId)

        if (modo === 'recortar') {
            limpiarOverlay()
            inicioRef.current = { x, y }
            setSeleccion({ x0: x, y0: y, x1: x, y1: y })
        } else {
            guardarSnapshot()
            ultimoPuntoRef.current = { x, y }
            const ctx = canvas.getContext('2d')!
            ctx.save()
            ctx.globalAlpha = 1
            ctx.fillStyle = COLOR_RESALTADO
            const grosor = Math.min(canvas.width, canvas.height) * 0.045
            ctx.beginPath()
            ctx.arc(x, y, grosor / 2, 0, Math.PI * 2)
            ctx.fill()
            ctx.restore()
        }
    }

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dibujandoRef.current) return
        const canvas = canvasRef.current
        if (!canvas) return
        const { x, y } = coordenadasCanvas(canvas, e.clientX, e.clientY)

        if (modo === 'recortar') {
            const inicio = inicioRef.current ?? { x, y }
            const nueva = { x0: inicio.x, y0: inicio.y, x1: x, y1: y }
            dibujarSeleccion(nueva)
            setSeleccion(nueva)
        } else {
            const ctx = canvas.getContext('2d')!
            const ultimo = ultimoPuntoRef.current
            const grosor = Math.min(canvas.width, canvas.height) * 0.045
            ctx.save()
            ctx.strokeStyle = COLOR_RESALTADO
            ctx.lineWidth = grosor
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.beginPath()
            if (ultimo) ctx.moveTo(ultimo.x, ultimo.y)
            else ctx.moveTo(x, y)
            ctx.lineTo(x, y)
            ctx.stroke()
            ctx.restore()
            ultimoPuntoRef.current = { x, y }
        }
    }

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
        }
        dibujandoRef.current = false
        ultimoPuntoRef.current = null
        inicioRef.current = null
    }

    const centroideToques = (t: React.TouchList) => {
        const a = t[0]
        const b = t[1]
        return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }
    }

    const onTouchStartContenedor = (e: React.TouchEvent) => {
        if (e.touches.length !== 2) return
        const el = contenedorRef.current
        if (!el) return
        // Dos dedos = recorrer la imagen ampliada; cancela cualquier trazo en curso.
        dibujandoRef.current = false
        ultimoPuntoRef.current = null
        inicioRef.current = null
        const c = centroideToques(e.touches)
        panRef.current = { x: c.x, y: c.y, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop }
    }

    const onTouchMoveContenedor = (e: React.TouchEvent) => {
        if (e.touches.length !== 2 || !panRef.current) return
        const el = contenedorRef.current
        if (!el) return
        const c = centroideToques(e.touches)
        el.scrollLeft = panRef.current.scrollLeft - (c.x - panRef.current.x)
        el.scrollTop = panRef.current.scrollTop - (c.y - panRef.current.y)
    }

    const onTouchEndContenedor = () => { panRef.current = null }

    const verVistaPreviaRecorte = () => {
        const canvas = canvasRef.current
        if (!canvas || !seleccion) return
        const x = Math.round(Math.min(seleccion.x0, seleccion.x1))
        const y = Math.round(Math.min(seleccion.y0, seleccion.y1))
        const w = Math.round(Math.abs(seleccion.x1 - seleccion.x0))
        const h = Math.round(Math.abs(seleccion.y1 - seleccion.y0))
        if (w < 10 || h < 10) {
            toast({ title: '', description: 'Selecciona un área más grande para recortar.', variant: 'error' })
            return
        }

        const temp = document.createElement('canvas')
        temp.width = w
        temp.height = h
        temp.getContext('2d')!.drawImage(canvas, x, y, w, h, 0, 0, w, h)

        temp.toBlob(blob => {
            if (!blob) {
                toast({ title: '', description: 'No se pudo generar la vista previa del recorte.', variant: 'error' })
                return
            }
            setPreviaRecorte(prev => {
                if (prev) URL.revokeObjectURL(prev.url)
                return { url: URL.createObjectURL(blob), x, y, w, h }
            })
        }, 'image/png')
    }

    const volverASeleccionar = () => {
        setPreviaRecorte(prev => {
            if (prev) URL.revokeObjectURL(prev.url)
            return null
        })
        if (seleccion) dibujarSeleccion(seleccion)
    }

    const confirmarRecorte = () => {
        const canvas = canvasRef.current
        const overlay = overlayRef.current
        if (!canvas || !overlay || !previaRecorte) return

        guardarSnapshot()

        const { x, y, w, h } = previaRecorte
        const temp = document.createElement('canvas')
        temp.width = w
        temp.height = h
        temp.getContext('2d')!.drawImage(canvas, x, y, w, h, 0, 0, w, h)

        canvas.width = w
        canvas.height = h
        canvas.getContext('2d')!.drawImage(temp, 0, 0)
        overlay.width = w
        overlay.height = h

        URL.revokeObjectURL(previaRecorte.url)
        setPreviaRecorte(null)
        setSeleccion(null)
        medirYResetZoom()
    }

    const quitarSeleccion = () => {
        setSeleccion(null)
        limpiarOverlay()
    }

    const cambiarModo = (nuevo: Modo) => {
        setModo(nuevo)
        setSeleccion(null)
        setPreviaRecorte(prev => { if (prev) URL.revokeObjectURL(prev.url); return null })
        limpiarOverlay()
    }

    const guardar = async () => {
        const canvas = canvasRef.current
        if (!canvas) return
        setGuardando(true)
        try {
            const blob = await comprimirCanvas(canvas)
            const nombre = archivo?.name?.replace(/\.[^.]+$/, '') || 'imagen'
            onGuardar(new File([blob], `${nombre}-editada.jpg`, { type: 'image/jpeg' }))
            onOpenChange(false)
        } catch (error: any) {
            toast({ title: '', description: error?.message || 'No se pudo guardar la imagen editada.', variant: 'error' })
        } finally {
            setGuardando(false)
        }
    }

    const seleccionUtil = !!seleccion
        && Math.abs(seleccion.x1 - seleccion.x0) >= 10
        && Math.abs(seleccion.y1 - seleccion.y0) >= 10

    const cerrar = (v: boolean) => {
        if (guardando) return
        if (!v) setPreviaRecorte(prev => { if (prev) URL.revokeObjectURL(prev.url); return null })
        onOpenChange(v)
    }

    return (
        <Dialog open={open} onOpenChange={cerrar}>
            <DialogContent className="flex max-h-[95dvh] max-w-2xl flex-col overflow-hidden p-0">
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
                <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">Editar imagen</DialogTitle>
                    <DialogDescription>
                        {previaRecorte
                            ? 'Así queda el recorte. Confírmalo o vuelve a ajustar la selección.'
                            : modo === 'recortar'
                                ? 'Arrastra sobre la imagen para seleccionar el área a recortar.'
                                : 'Arrastra sobre la imagen para resaltar la parte importante, como el monto o la fecha.'}
                    </DialogDescription>
                </DialogHeader>

                {previaRecorte && (
                    <div className="flex max-h-[60dvh] items-center justify-center overflow-auto rounded-lg border bg-muted/40 p-2">
                        <img
                            src={previaRecorte.url}
                            alt="Vista previa del recorte"
                            className="max-h-[56dvh] max-w-full rounded object-contain"
                        />
                    </div>
                )}

                <div style={{ display: previaRecorte ? 'none' : 'block' }}>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex rounded-md border p-0.5">
                            <Button
                                type="button"
                                size="sm"
                                variant={modo === 'recortar' ? 'default' : 'ghost'}
                                className="gap-1.5"
                                onClick={() => cambiarModo('recortar')}
                            >
                                <Crop className="h-4 w-4" />
                                Recortar
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant={modo === 'resaltar' ? 'default' : 'ghost'}
                                className="gap-1.5"
                                onClick={() => cambiarModo('resaltar')}
                            >
                                <Highlighter className="h-4 w-4" />
                                Resaltar
                            </Button>
                        </div>

                        {modo === 'recortar' && seleccion && (
                            <>
                                <Button
                                    type="button" size="sm" variant="outline"
                                    onClick={verVistaPreviaRecorte} disabled={!seleccionUtil}
                                >
                                    Ver vista previa
                                </Button>
                                <Button type="button" size="sm" variant="ghost" onClick={quitarSeleccion}>
                                    Quitar selección
                                </Button>
                            </>
                        )}

                        <div className="ml-auto flex items-center gap-1.5">
                            <Button
                                type="button" size="sm" variant="outline" className="gap-1.5"
                                onClick={deshacer} disabled={!puedeDeshacer}
                            >
                                <Undo2 className="h-4 w-4" />
                                Deshacer
                            </Button>
                            <Button
                                type="button" size="sm" variant="outline" className="gap-1.5"
                                onClick={restablecer} disabled={cargando}
                            >
                                <RotateCcw className="h-4 w-4" />
                                Restablecer
                            </Button>
                        </div>
                    </div>

                    <div className="mt-2 flex items-center justify-center gap-1.5">
                        <Button
                            type="button" size="icon" variant="outline" className="h-10 w-10"
                            onClick={() => cambiarZoom(-ZOOM_PASO)}
                            disabled={cargando || zoomEdicion <= ZOOM_MIN}
                            aria-label="Alejar"
                        >
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="min-w-[3.5rem] text-center text-xs tabular-nums text-muted-foreground">
                            {Math.round(zoomEdicion * 100)}%
                        </span>
                        <Button
                            type="button" size="icon" variant="outline" className="h-10 w-10"
                            onClick={() => cambiarZoom(ZOOM_PASO)}
                            disabled={cargando || zoomEdicion >= ZOOM_MAX}
                            aria-label="Acercar"
                        >
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        {zoomEdicion !== 1 && (
                            <Button
                                type="button" size="sm" variant="ghost" className="h-10 gap-1 text-xs"
                                onClick={() => setZoomEdicion(1)}
                            >
                                Ajustar
                            </Button>
                        )}
                    </div>
                    {zoomEdicion !== 1 && (
                        <p className="mt-1 text-center text-[11px] text-muted-foreground">
                            Deslizá con dos dedos (o arrastrá la barra de scroll) para recorrer la imagen ampliada.
                        </p>
                    )}

                    <div
                        ref={contenedorRef}
                        className={cn(
                            'relative mx-auto mt-2 flex max-h-[60dvh] w-full overflow-auto rounded-lg border bg-muted/40 p-2',
                            modo === 'recortar' ? 'cursor-crosshair' : 'cursor-cell',
                        )}
                        style={{ touchAction: 'none' }}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerUp}
                        onTouchStart={onTouchStartContenedor}
                        onTouchMove={onTouchMoveContenedor}
                        onTouchEnd={onTouchEndContenedor}
                        onTouchCancel={onTouchEndContenedor}
                    >
                        {cargando && (
                            <div className="m-auto flex h-[240px] items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        )}
                        <div className="relative m-auto shrink-0" style={{ display: cargando ? 'none' : 'block' }}>
                            <canvas ref={canvasRef} className="max-h-[56dvh] max-w-full rounded" style={estiloZoom} />
                            <canvas
                                ref={overlayRef}
                                className="pointer-events-none absolute inset-0 max-h-[56dvh] max-w-full rounded"
                                style={estiloZoom}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    {previaRecorte ? (
                        <>
                            <Button variant="outline" onClick={volverASeleccionar}>
                                Volver a seleccionar
                            </Button>
                            <Button onClick={confirmarRecorte} className="gap-1.5">
                                Confirmar recorte
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => cerrar(false)} disabled={guardando}>
                                Cancelar
                            </Button>
                            <Button onClick={guardar} disabled={guardando || cargando} className="gap-1.5">
                                {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
                                Guardar cambios
                            </Button>
                        </>
                    )}
                </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
