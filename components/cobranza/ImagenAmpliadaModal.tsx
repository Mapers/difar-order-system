'use client'

import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    src: string | null
    alt?: string
    titulo?: string
}

const ZOOM_MIN = 1
const ZOOM_MAX = 5

export function ImagenAmpliadaModal({ open, onOpenChange, src, alt, titulo }: Props) {
    const [zoom, setZoom] = useState(1)
    const [baseSize, setBaseSize] = useState<{ w: number; h: number } | null>(null)
    const [arrastrando, setArrastrando] = useState(false)
    const imgRef = useRef<HTMLImageElement>(null)
    const contenedorRef = useRef<HTMLDivElement>(null)
    const pinchRef = useRef<{ dist: number; zoom: number } | null>(null)
    const arrastreRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null)

    useEffect(() => {
        if (!open) { setZoom(1); setBaseSize(null) }
    }, [open])

    useEffect(() => {
        if (!arrastrando) return
        const mover = (e: MouseEvent) => {
            const el = contenedorRef.current
            const inicio = arrastreRef.current
            if (!el || !inicio) return
            el.scrollLeft = inicio.scrollLeft - (e.clientX - inicio.x)
            el.scrollTop = inicio.scrollTop - (e.clientY - inicio.y)
        }
        const soltar = () => {
            arrastreRef.current = null
            setArrastrando(false)
        }
        window.addEventListener('mousemove', mover)
        window.addEventListener('mouseup', soltar)
        return () => {
            window.removeEventListener('mousemove', mover)
            window.removeEventListener('mouseup', soltar)
        }
    }, [arrastrando])

    const iniciarArrastre = (e: React.MouseEvent) => {
        if (zoom <= 1.01) return
        const el = contenedorRef.current
        if (!el) return
        e.preventDefault()
        arrastreRef.current = { x: e.clientX, y: e.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop }
        setArrastrando(true)
    }

    const onCargaImagen = () => {
        const img = imgRef.current
        if (!img) return
        setBaseSize({ w: img.clientWidth, h: img.clientHeight })
    }

    const distanciaToques = (t: React.TouchList) => {
        const a = t[0]
        const b = t[1]
        return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
    }

    const onWheel = (e: React.WheelEvent) => {
        e.preventDefault()
        setZoom(z => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z - e.deltaY * 0.0015)))
    }

    const onTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) pinchRef.current = { dist: distanciaToques(e.touches), zoom }
    }

    const onTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && pinchRef.current) {
            e.preventDefault()
            const factor = distanciaToques(e.touches) / pinchRef.current.dist
            setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, pinchRef.current.zoom * factor)))
        }
    }

    const onTouchEnd = () => { pinchRef.current = null }

    if (!src) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex max-h-[96dvh] max-w-[96vw] items-center justify-center overflow-hidden border-none bg-transparent p-2 shadow-none sm:max-w-[96vw]"
                closeClassName="right-3 top-3 rounded-full bg-black/60 p-1.5 text-white opacity-100 hover:bg-black/75 focus:ring-offset-0 data-[state=open]:bg-black/60 data-[state=open]:text-white"
            >
                <DialogTitle className="sr-only">{titulo || 'Imagen ampliada'}</DialogTitle>
                <div
                    ref={contenedorRef}
                    className={cn(
                        'scrollbar-none flex min-h-0 min-w-0 max-h-[92dvh] max-w-[92vw] select-none overflow-auto',
                        zoom > 1.01 && (arrastrando ? 'cursor-grabbing' : 'cursor-grab'),
                    )}
                    style={{ touchAction: 'pan-x pan-y' }}
                    onWheel={onWheel}
                    onMouseDown={iniciarArrastre}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    <img
                        ref={imgRef}
                        src={src}
                        alt={alt || 'Imagen ampliada'}
                        draggable={false}
                        onLoad={onCargaImagen}
                        className="m-auto select-none rounded-lg object-contain"
                        style={baseSize
                            ? { width: baseSize.w * zoom, height: baseSize.h * zoom }
                            : { maxHeight: '92dvh', maxWidth: '92vw' }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
