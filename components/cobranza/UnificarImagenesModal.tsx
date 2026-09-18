'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Check, GripVertical, ImagePlus, Layers, Loader2, Pencil, Trash2 } from 'lucide-react'
import { toast } from '@/app/hooks/useToast'
import { cn } from '@/lib/utils'
import { CeldaUnion, Disposicion, unirImagenes } from './unirImagenes'
import { EditarImagenModal } from './EditarImagenModal'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirmar: (archivo: File) => void
    cargarInicial?: () => Promise<File | null>
}

interface ImagenPendiente {
    id: string
    file: File
    url: string
}

interface VistaPrevia {
    file: File
    url: string
    celdas: CeldaUnion[]
}

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp']

const DISPOSICIONES: { valor: Disposicion; etiqueta: string }[] = [
    { valor: 'vertical', etiqueta: 'Vertical' },
    { valor: 'horizontal', etiqueta: 'Horizontal' },
    { valor: 'cuadricula', etiqueta: 'Cuadrícula' },
]

export function UnificarImagenesModal({ open, onOpenChange, onConfirmar, cargarInicial }: Props) {
    const [imagenes, setImagenes] = useState<ImagenPendiente[]>([])
    const [cargandoInicial, setCargandoInicial] = useState(false)
    const [disposicion, setDisposicion] = useState<Disposicion>('vertical')
    const [procesando, setProcesando] = useState(false)
    const [vistaPrevia, setVistaPrevia] = useState<VistaPrevia | null>(null)
    const [seleccionSwap, setSeleccionSwap] = useState<number | null>(null)
    const [arrastrandoId, setArrastrandoId] = useState<string | null>(null)
    const [editandoId, setEditandoId] = useState<string | null>(null)
    const [editandoVistaPrevia, setEditandoVistaPrevia] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const listaRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open || !cargarInicial) return
        setCargandoInicial(true)
        let cancelado = false
        cargarInicial().then((file) => {
            if (cancelado || !file) return
            setImagenes(prev => {
                if (prev.length > 0) return prev
                return [{ id: `${file.name}-${file.lastModified}-inicial`, file, url: URL.createObjectURL(file) }]
            })
        }).finally(() => { if (!cancelado) setCargandoInicial(false) })
        return () => { cancelado = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    const limpiarTodo = () => {
        imagenes.forEach(i => URL.revokeObjectURL(i.url))
        setImagenes([])
        if (vistaPrevia) URL.revokeObjectURL(vistaPrevia.url)
        setVistaPrevia(null)
        setSeleccionSwap(null)
        setDisposicion('vertical')
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

    const generar = useCallback(async (lista: ImagenPendiente[], disp: Disposicion) => {
        if (lista.length === 0) return
        setProcesando(true)
        try {
            const { archivo, celdas } = await unirImagenes(lista.map(i => i.url), disp)
            setVistaPrevia(prev => {
                if (prev) URL.revokeObjectURL(prev.url)
                return { file: archivo, url: URL.createObjectURL(archivo), celdas }
            })
            setSeleccionSwap(null)
        } catch (error: any) {
            toast({ title: '', description: error?.message || 'No se pudieron unificar las imágenes.', variant: 'error' })
        } finally {
            setProcesando(false)
        }
    }, [])

    const cambiarDisposicion = (valor: Disposicion) => {
        setDisposicion(valor)
        if (vistaPrevia) generar(imagenes, valor)
    }

    const volverAEditar = () => {
        if (vistaPrevia) URL.revokeObjectURL(vistaPrevia.url)
        setVistaPrevia(null)
        setSeleccionSwap(null)
    }

    const usarImagen = () => {
        if (!vistaPrevia) return
        onConfirmar(vistaPrevia.file)
        URL.revokeObjectURL(vistaPrevia.url)
        imagenes.forEach(i => URL.revokeObjectURL(i.url))
        setImagenes([])
        setVistaPrevia(null)
        setSeleccionSwap(null)
        onOpenChange(false)
    }

    const tocarCelda = (indice: number) => {
        if (procesando) return
        if (seleccionSwap === null) { setSeleccionSwap(indice); return }
        if (seleccionSwap === indice) { setSeleccionSwap(null); return }

        const copia = [...imagenes]
        const otro = copia[seleccionSwap]
        copia[seleccionSwap] = copia[indice]
        copia[indice] = otro
        setImagenes(copia)
        generar(copia, disposicion)
    }

    const inicioArrastre = (e: React.PointerEvent<HTMLButtonElement>, id: string) => {
        if (procesando) return
        e.currentTarget.setPointerCapture(e.pointerId)
        setArrastrandoId(id)
    }

    const moverArrastre = (e: React.PointerEvent<HTMLButtonElement>) => {
        if (!arrastrandoId || !listaRef.current) return
        const filas = Array.from(listaRef.current.children) as HTMLElement[]
        const encontrado = filas.findIndex((fila) => {
            const r = fila.getBoundingClientRect()
            return e.clientY < r.top + r.height / 2
        })
        const destino = encontrado === -1 ? filas.length - 1 : encontrado

        setImagenes(prev => {
            const actual = prev.findIndex(i => i.id === arrastrandoId)
            if (actual < 0 || actual === destino) return prev
            const copia = [...prev]
            const [item] = copia.splice(actual, 1)
            copia.splice(destino, 0, item)
            return copia
        })
    }

    const finArrastre = (e: React.PointerEvent<HTMLButtonElement>) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
        }
        setArrastrandoId(null)
    }

    const imagenEnEdicion = imagenes.find(i => i.id === editandoId) ?? null

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
            return { file: editado, url: URL.createObjectURL(editado), celdas: prev?.celdas ?? [] }
        })
    }

    const selectorDisposicion = (
        <div className="inline-flex rounded-md border p-0.5">
            {DISPOSICIONES.map(d => (
                <Button
                    key={d.valor}
                    type="button"
                    size="sm"
                    variant={disposicion === d.valor ? 'default' : 'ghost'}
                    disabled={procesando}
                    onClick={() => cambiarDisposicion(d.valor)}
                >
                    {d.etiqueta}
                </Button>
            ))}
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={limpiarYcerrar}>
            <DialogContent className="flex max-h-[95dvh] max-w-lg flex-col overflow-hidden p-0">
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Layers className="h-4 w-4" />
                        Unificar varias imágenes
                    </DialogTitle>
                    <DialogDescription>
                        {vistaPrevia
                            ? 'Así queda la imagen unificada. Toca dos fotos para intercambiarlas.'
                            : 'Agrega varias fotos del comprobante; se combinarán en una sola imagen, en el orden de la lista, antes de subirla.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-wrap items-center gap-2">
                    {selectorDisposicion}
                    {procesando && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                {vistaPrevia ? (
                    <div className="space-y-2">
                        <div className="flex max-h-[420px] justify-center overflow-auto rounded-lg border bg-muted/40 p-2">
                            <div className="relative inline-block max-w-full">
                                <img
                                    src={vistaPrevia.url}
                                    alt="Vista previa unificada"
                                    className="block max-w-full rounded"
                                />
                                {vistaPrevia.celdas.map((celda, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => tocarCelda(i)}
                                        disabled={procesando}
                                        title={`Imagen ${i + 1}`}
                                        style={{
                                            left: `${celda.x}%`,
                                            top: `${celda.y}%`,
                                            width: `${celda.w}%`,
                                            height: `${celda.h}%`,
                                        }}
                                        className={cn(
                                            'absolute rounded transition',
                                            seleccionSwap === i
                                                ? 'bg-sky-500/25 ring-2 ring-sky-500'
                                                : 'hover:bg-sky-500/10',
                                        )}
                                    >
                                        <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 text-[10px] font-semibold text-white">
                                            {i + 1}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground">
                                {(vistaPrevia.file.size / 1024).toFixed(0)} KB · {imagenes.length} imagen{imagenes.length !== 1 ? 'es' : ''} combinada{imagenes.length !== 1 ? 's' : ''}
                                {seleccionSwap !== null && ` · imagen ${seleccionSwap + 1} marcada, toca otra para intercambiar`}
                            </p>
                            <Button
                                type="button" variant="outline" size="sm" className="gap-1.5"
                                disabled={procesando}
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
                                {cargandoInicial
                                    ? <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                                    : 'Todavía no agregaste ninguna imagen.'}
                            </div>
                        ) : (
                            <>
                                <div ref={listaRef} className="space-y-2">
                                    {imagenes.map((img, idx) => (
                                        <div
                                            key={img.id}
                                            className={cn(
                                                'flex items-center gap-2 rounded-lg border p-2 transition',
                                                arrastrandoId === img.id && 'opacity-70 ring-2 ring-sky-500',
                                            )}
                                        >
                                            <button
                                                type="button"
                                                aria-label={`Mover ${img.file.name}`}
                                                className="shrink-0 cursor-grab touch-none p-1 text-muted-foreground active:cursor-grabbing"
                                                onPointerDown={(e) => inicioArrastre(e, img.id)}
                                                onPointerMove={moverArrastre}
                                                onPointerUp={finArrastre}
                                                onPointerCancel={finArrastre}
                                            >
                                                <GripVertical className="h-4 w-4" />
                                            </button>
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
                                <p className="text-[11px] text-muted-foreground">
                                    Arrastra el asa de la izquierda para cambiar el orden, o usa las flechas.
                                </p>
                            </>
                        )}
                    </>
                )}

                <DialogFooter>
                    {vistaPrevia ? (
                        <>
                            <Button variant="outline" onClick={volverAEditar} disabled={procesando} className="gap-1.5">
                                <ArrowLeft className="h-4 w-4" />
                                Volver a editar
                            </Button>
                            <Button onClick={usarImagen} disabled={procesando} className="gap-1.5">
                                <Check className="h-4 w-4" />
                                Usar esta imagen
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => limpiarYcerrar(false)} disabled={procesando}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={() => generar(imagenes, disposicion)}
                                disabled={procesando || imagenes.length === 0}
                                className="gap-1.5"
                            >
                                {procesando && <Loader2 className="h-4 w-4 animate-spin" />}
                                Ver vista previa {imagenes.length > 0 ? `(${imagenes.length})` : ''}
                            </Button>
                        </>
                    )}
                </DialogFooter>
                </div>
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
