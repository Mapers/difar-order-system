'use client'

import { useRef, useState } from 'react'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Check, GripVertical, ImagePlus, Layers, Loader2, Pencil, Trash2 } from 'lucide-react'
import { toast } from '@/app/hooks/useToast'
import { EVIDENCIA_MAX_BYTES } from '@/app/types/cobranza-types'
import { EditarImagenModal } from './EditarImagenModal'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirmar: (archivo: File) => void
}

interface ImagenPendiente {
    id: string
    file: File
    url: string
}

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp']
const ANCHO_MAX = 1000
const SEPARADOR = 14

function cargarImagen(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('No se pudo leer una de las imágenes'))
        img.src = url
    })
}

function canvasABlob(canvas: HTMLCanvasElement, calidad: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('No se pudo generar la imagen'))),
            'image/jpeg',
            calidad,
        )
    })
}

function escalarCanvas(origen: HTMLCanvasElement, factor: number): HTMLCanvasElement {
    const destino = document.createElement('canvas')
    destino.width = Math.max(1, Math.round(origen.width * factor))
    destino.height = Math.max(1, Math.round(origen.height * factor))
    const ctx = destino.getContext('2d')!
    ctx.drawImage(origen, 0, 0, destino.width, destino.height)
    return destino
}

async function comprimir(canvas: HTMLCanvasElement): Promise<Blob> {
    let calidad = 0.92
    let blob = await canvasABlob(canvas, calidad)
    while (blob.size > EVIDENCIA_MAX_BYTES && calidad > 0.4) {
        calidad -= 0.12
        blob = await canvasABlob(canvas, calidad)
    }
    if (blob.size > EVIDENCIA_MAX_BYTES) {
        const reducido = escalarCanvas(canvas, 0.7)
        blob = await comprimir(reducido)
    }
    return blob
}

async function unificarImagenes(imagenes: ImagenPendiente[]): Promise<File> {
    const cargadas = await Promise.all(imagenes.map(async (i) => ({
        img: await cargarImagen(i.url),
    })))

    const escalas = cargadas.map(({ img }) => Math.min(1, ANCHO_MAX / img.naturalWidth))
    const anchos = cargadas.map(({ img }, i) => Math.round(img.naturalWidth * escalas[i]))
    const altos = cargadas.map(({ img }, i) => Math.round(img.naturalHeight * escalas[i]))
    const anchoCanvas = Math.max(...anchos)
    const altoCanvas = altos.reduce((a, b) => a + b, 0) + SEPARADOR * (cargadas.length - 1)

    const canvas = document.createElement('canvas')
    canvas.width = anchoCanvas
    canvas.height = altoCanvas
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, anchoCanvas, altoCanvas)

    let y = 0
    cargadas.forEach(({ img }, i) => {
        const w = anchos[i]
        const h = altos[i]
        const x = Math.round((anchoCanvas - w) / 2)
        ctx.drawImage(img, x, y, w, h)
        y += h
        if (i < cargadas.length - 1) {
            ctx.strokeStyle = '#d1d5db'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(0, y + SEPARADOR / 2)
            ctx.lineTo(anchoCanvas, y + SEPARADOR / 2)
            ctx.stroke()
            y += SEPARADOR
        }
    })

    const blob = await comprimir(canvas)
    if (blob.size > EVIDENCIA_MAX_BYTES) {
        throw new Error('La imagen unificada superó 5 MB incluso comprimida. Quita alguna imagen e inténtalo de nuevo.')
    }
    return new File([blob], `comprobante-unificado-${Date.now()}.jpg`, { type: 'image/jpeg' })
}

export function UnificarImagenesModal({ open, onOpenChange, onConfirmar }: Props) {
    const [imagenes, setImagenes] = useState<ImagenPendiente[]>([])
    const [procesando, setProcesando] = useState(false)
    const [vistaPrevia, setVistaPrevia] = useState<{ file: File; url: string } | null>(null)
    const [editandoId, setEditandoId] = useState<string | null>(null)
    const [editandoVistaPrevia, setEditandoVistaPrevia] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const limpiarTodo = () => {
        imagenes.forEach(i => URL.revokeObjectURL(i.url))
        setImagenes([])
        if (vistaPrevia) URL.revokeObjectURL(vistaPrevia.url)
        setVistaPrevia(null)
    }

    const limpiarYcerrar = (v: boolean) => {
        if (procesando) return
        if (!v) limpiarTodo()
        onOpenChange(v)
    }

    const agregarArchivos = (lista: FileList | null) => {
        if (!lista) return
        const nuevas: ImagenPendiente[] = []
        Array.from(lista).forEach((file) => {
            if (!TIPOS_IMAGEN.includes(file.type)) {
                toast({ title: '', description: `${file.name} no es una imagen válida (solo JPG, PNG o WEBP).`, variant: 'error' })
                return
            }
            nuevas.push({ id: `${file.name}-${file.lastModified}-${Math.random()}`, file, url: URL.createObjectURL(file) })
        })
        if (nuevas.length) setImagenes(prev => [...prev, ...nuevas])
    }

    const quitar = (id: string) => {
        setImagenes(prev => {
            const objetivo = prev.find(i => i.id === id)
            if (objetivo) URL.revokeObjectURL(objetivo.url)
            return prev.filter(i => i.id !== id)
        })
    }

    const mover = (id: string, direccion: -1 | 1) => {
        setImagenes(prev => {
            const idx = prev.findIndex(i => i.id === id)
            const destino = idx + direccion
            if (idx < 0 || destino < 0 || destino >= prev.length) return prev
            const copia = [...prev]
            const [item] = copia.splice(idx, 1)
            copia.splice(destino, 0, item)
            return copia
        })
    }

    const generarVistaPrevia = async () => {
        if (imagenes.length === 0) return
        setProcesando(true)
        try {
            const archivo = await unificarImagenes(imagenes)
            setVistaPrevia({ file: archivo, url: URL.createObjectURL(archivo) })
        } catch (error: any) {
            toast({ title: '', description: error?.message || 'No se pudieron unificar las imágenes.', variant: 'error' })
        } finally {
            setProcesando(false)
        }
    }

    const volverAEditar = () => {
        if (vistaPrevia) URL.revokeObjectURL(vistaPrevia.url)
        setVistaPrevia(null)
    }

    const usarImagen = () => {
        if (!vistaPrevia) return
        onConfirmar(vistaPrevia.file)
        imagenes.forEach(i => URL.revokeObjectURL(i.url))
        setImagenes([])
        setVistaPrevia(null)
        onOpenChange(false)
    }

    const guardarImagenEditada = (id: string, editado: File) => {
        setImagenes(prev => prev.map(i => {
            if (i.id !== id) return i
            URL.revokeObjectURL(i.url)
            return { ...i, file: editado, url: URL.createObjectURL(editado) }
        }))
    }

    const guardarVistaPreviaEditada = (editado: File) => {
        setVistaPrevia(prev => {
            if (prev) URL.revokeObjectURL(prev.url)
            return { file: editado, url: URL.createObjectURL(editado) }
        })
    }

    const imagenEnEdicion = imagenes.find(i => i.id === editandoId) ?? null

    return (
        <Dialog open={open} onOpenChange={limpiarYcerrar}>
            <DialogContent className="max-h-[95vh] max-w-lg overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Layers className="h-4 w-4" />
                        Unificar varias imágenes
                    </DialogTitle>
                    <DialogDescription>
                        {vistaPrevia
                            ? 'Así queda la imagen unificada. Revísala antes de usarla.'
                            : 'Agrega varias fotos del comprobante; se combinarán en una sola imagen, en el orden en que aparecen abajo, antes de subirla.'}
                    </DialogDescription>
                </DialogHeader>

                {vistaPrevia ? (
                    <div className="space-y-2">
                        <div className="flex max-h-[420px] items-center justify-center overflow-auto rounded-lg border bg-muted/40 p-2">
                            <img
                                src={vistaPrevia.url}
                                alt="Vista previa unificada"
                                className="max-w-full rounded object-contain"
                            />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground">
                                {(vistaPrevia.file.size / 1024).toFixed(0)} KB · {imagenes.length} imagen{imagenes.length !== 1 ? 'es' : ''} combinada{imagenes.length !== 1 ? 's' : ''}
                            </p>
                            <Button
                                type="button" variant="outline" size="sm" className="gap-1.5"
                                onClick={() => setEditandoVistaPrevia(true)}
                            >
                                <Pencil className="h-3.5 w-3.5" />
                                Recortar / resaltar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            className="hidden"
                            onChange={(e) => { agregarArchivos(e.target.files); e.target.value = '' }}
                        />

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => inputRef.current?.click()}
                            disabled={procesando}
                            className="gap-1.5 self-start"
                        >
                            <ImagePlus className="h-4 w-4" />
                            Agregar imágenes
                        </Button>

                        {imagenes.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                Todavía no agregaste ninguna imagen.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {imagenes.map((img, idx) => (
                                    <div key={img.id} className="flex items-center gap-2 rounded-lg border p-2">
                                        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <img src={img.url} alt={img.file.name} className="h-12 w-12 shrink-0 rounded object-cover" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-medium">{idx + 1}. {img.file.name}</p>
                                            <p className="text-[11px] text-muted-foreground">
                                                {(img.file.size / 1024).toFixed(0)} KB
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-0.5">
                                            <Button
                                                type="button" variant="ghost" size="icon" className="h-7 w-7"
                                                disabled={procesando || idx === 0}
                                                onClick={() => mover(img.id, -1)}
                                            >
                                                ↑
                                            </Button>
                                            <Button
                                                type="button" variant="ghost" size="icon" className="h-7 w-7"
                                                disabled={procesando || idx === imagenes.length - 1}
                                                onClick={() => mover(img.id, 1)}
                                            >
                                                ↓
                                            </Button>
                                            <Button
                                                type="button" variant="ghost" size="icon" className="h-7 w-7"
                                                disabled={procesando}
                                                onClick={() => setEditandoId(img.id)}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                type="button" variant="ghost" size="icon"
                                                className="h-7 w-7 text-destructive"
                                                disabled={procesando}
                                                onClick={() => quitar(img.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                <DialogFooter>
                    {vistaPrevia ? (
                        <>
                            <Button variant="outline" onClick={volverAEditar} className="gap-1.5">
                                <ArrowLeft className="h-4 w-4" />
                                Volver a editar
                            </Button>
                            <Button onClick={usarImagen} className="gap-1.5">
                                <Check className="h-4 w-4" />
                                Usar esta imagen
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => limpiarYcerrar(false)} disabled={procesando}>
                                Cancelar
                            </Button>
                            <Button onClick={generarVistaPrevia} disabled={procesando || imagenes.length === 0} className="gap-1.5">
                                {procesando && <Loader2 className="h-4 w-4 animate-spin" />}
                                Ver vista previa {imagenes.length > 0 ? `(${imagenes.length})` : ''}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>

            <EditarImagenModal
                open={editandoId !== null}
                onOpenChange={(v) => { if (!v) setEditandoId(null) }}
                archivo={imagenEnEdicion?.file ?? null}
                onGuardar={(editado) => { if (editandoId) guardarImagenEditada(editandoId, editado) }}
            />
            <EditarImagenModal
                open={editandoVistaPrevia}
                onOpenChange={setEditandoVistaPrevia}
                archivo={vistaPrevia?.file ?? null}
                onGuardar={guardarVistaPreviaEditada}
            />
        </Dialog>
    )
}
