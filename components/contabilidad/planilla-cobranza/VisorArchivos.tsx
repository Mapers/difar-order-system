'use client'

import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Download, ExternalLink, FileText, Maximize, Minus, Plus, RotateCw, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ArchivoVisor {
    url:      string
    nombre:   string
    titulo:   string
    detalle?: string
    esPdf:    boolean
}

interface Props {
    archivos: ArchivoVisor[]
    /** Índice abierto; null = cerrado. */
    indice:   number | null
    onIndice: (i: number | null) => void
}

const ZOOM_MIN = 0.25
const ZOOM_MAX = 5

/**
 * Visor a pantalla completa de imágenes y PDF. Las imágenes se pueden acercar
 * (botones o rueda del mouse), mover arrastrando y girar. Flechas o teclado
 * para pasar de un archivo a otro; Esc cierra.
 */
export function VisorArchivos({ archivos, indice, onIndice }: Props) {
    const [zoom, setZoom] = useState(1)
    const [giro, setGiro] = useState(0)
    const [pos, setPos] = useState({ x: 0, y: 0 })
    const arrastre = useRef<{ x: number; y: number; px: number; py: number } | null>(null)

    const abierto = indice !== null && archivos.length > 0
    const actual = abierto ? archivos[Math.min(indice!, archivos.length - 1)] : null

    // Al cambiar de archivo se vuelve a la vista ajustada.
    useEffect(() => { setZoom(1); setGiro(0); setPos({ x: 0, y: 0 }) }, [indice])

    const ir = (delta: number) => {
        if (indice === null || archivos.length < 2) return
        onIndice((indice + delta + archivos.length) % archivos.length)
    }

    const cambiarZoom = (z: number) => {
        const nuevo = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100))
        setZoom(nuevo)
        if (nuevo <= 1) setPos({ x: 0, y: 0 })
    }

    const descargar = () => {
        if (!actual) return
        const a = document.createElement('a')
        a.href = actual.url
        a.download = actual.nombre
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
        a.click()
    }

    const BotonBarra = ({ titulo, onClick, children, disabled = false }: {
        titulo: string; onClick: () => void; children: React.ReactNode; disabled?: boolean
    }) => (
        <button
            type="button"
            title={titulo}
            aria-label={titulo}
            onClick={onClick}
            disabled={disabled}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-100 transition hover:bg-white/20 disabled:opacity-30"
        >
            {children}
        </button>
    )

    return (
        <Dialog open={abierto} onOpenChange={v => { if (!v) onIndice(null) }}>
            <DialogContent
                closeClassName="hidden"
                className="flex h-[96vh] w-[98vw] max-w-none flex-col gap-0 overflow-hidden border-slate-800 bg-slate-950 p-0 text-slate-100 sm:rounded-xl"
                onKeyDown={e => {
                    if (e.key === 'ArrowRight') { e.preventDefault(); ir(1) }
                    if (e.key === 'ArrowLeft') { e.preventDefault(); ir(-1) }
                    if (!actual?.esPdf && (e.key === '+' || e.key === '=')) cambiarZoom(zoom + 0.25)
                    if (!actual?.esPdf && e.key === '-') cambiarZoom(zoom - 0.25)
                }}
            >
                {actual && (
                    <>
                        <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 px-4 py-3">
                            <div className="min-w-0">
                                <DialogTitle className="truncate text-sm font-semibold text-white">{actual.titulo}</DialogTitle>
                                <DialogDescription className="truncate text-xs text-slate-400">
                                    {actual.detalle ? `${actual.detalle} · ` : ''}{indice! + 1} de {archivos.length}
                                </DialogDescription>
                            </div>
                            <div className="ml-auto flex flex-wrap items-center gap-1.5">
                                {!actual.esPdf && (
                                    <>
                                        <BotonBarra titulo="Alejar" onClick={() => cambiarZoom(zoom - 0.25)} disabled={zoom <= ZOOM_MIN}>
                                            <Minus className="h-4 w-4" />
                                        </BotonBarra>
                                        <span className="w-14 text-center text-xs tabular-nums text-slate-300">{Math.round(zoom * 100)}%</span>
                                        <BotonBarra titulo="Acercar" onClick={() => cambiarZoom(zoom + 0.25)} disabled={zoom >= ZOOM_MAX}>
                                            <Plus className="h-4 w-4" />
                                        </BotonBarra>
                                        <BotonBarra titulo="Girar" onClick={() => setGiro(g => (g + 90) % 360)}>
                                            <RotateCw className="h-4 w-4" />
                                        </BotonBarra>
                                        <BotonBarra titulo="Ajustar a la pantalla" onClick={() => { setZoom(1); setGiro(0); setPos({ x: 0, y: 0 }) }}>
                                            <Maximize className="h-4 w-4" />
                                        </BotonBarra>
                                        <span className="mx-1 h-6 w-px bg-slate-700" />
                                    </>
                                )}
                                <BotonBarra titulo="Descargar" onClick={descargar}>
                                    <Download className="h-4 w-4" />
                                </BotonBarra>
                                <BotonBarra titulo="Abrir en otra pestaña" onClick={() => window.open(actual.url, '_blank', 'noopener,noreferrer')}>
                                    <ExternalLink className="h-4 w-4" />
                                </BotonBarra>
                                <BotonBarra titulo="Cerrar" onClick={() => onIndice(null)}>
                                    <X className="h-4 w-4" />
                                </BotonBarra>
                            </div>
                        </div>

                        <div
                            className={cn(
                                'relative flex min-h-0 flex-1 items-center justify-center overflow-hidden select-none',
                                !actual.esPdf && (zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'),
                            )}
                            onWheel={e => { if (!actual.esPdf) cambiarZoom(zoom + (e.deltaY < 0 ? 0.2 : -0.2)) }}
                            onMouseDown={e => {
                                if (actual.esPdf || zoom <= 1) return
                                arrastre.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y }
                            }}
                            onMouseMove={e => {
                                if (!arrastre.current) return
                                setPos({
                                    x: arrastre.current.px + (e.clientX - arrastre.current.x),
                                    y: arrastre.current.py + (e.clientY - arrastre.current.y),
                                })
                            }}
                            onMouseUp={() => { arrastre.current = null }}
                            onMouseLeave={() => { arrastre.current = null }}
                            onDoubleClick={() => { if (!actual.esPdf) cambiarZoom(zoom > 1 ? 1 : 2) }}
                        >
                            {actual.esPdf ? (
                                <>
                                    <iframe title={actual.nombre} src={actual.url} className="hidden h-full w-full bg-white md:block" />
                                    {/* En celulares el navegador no muestra PDF dentro de la página: se abre aparte. */}
                                    <div className="flex flex-col items-center gap-3 px-6 text-center md:hidden">
                                        <FileText className="h-14 w-14 text-red-400" />
                                        <p className="text-sm text-slate-300">{actual.nombre}</p>
                                        <button type="button" onClick={() => window.open(actual.url, '_blank', 'noopener,noreferrer')}
                                                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900">
                                            <ExternalLink className="h-4 w-4" /> Abrir PDF
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <img
                                    src={actual.url}
                                    alt={actual.nombre}
                                    draggable={false}
                                    className="max-h-full max-w-full object-contain transition-transform duration-150"
                                    style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom}) rotate(${giro}deg)` }}
                                />
                            )}

                            {archivos.length > 1 && (
                                <>
                                    <button type="button" onClick={() => ir(-1)} aria-label="Anterior"
                                            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25">
                                        <ChevronLeft className="h-6 w-6" />
                                    </button>
                                    <button type="button" onClick={() => ir(1)} aria-label="Siguiente"
                                            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25">
                                        <ChevronRight className="h-6 w-6" />
                                    </button>
                                </>
                            )}
                        </div>

                        {archivos.length > 1 && (
                            <div className="flex justify-center gap-2 overflow-x-auto border-t border-slate-800 px-4 py-3">
                                {archivos.map((a, i) => (
                                    <button
                                        key={a.url + i}
                                        type="button"
                                        onClick={() => onIndice(i)}
                                        title={a.titulo}
                                        className={cn(
                                            'flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border-2 bg-slate-800 transition',
                                            i === indice ? 'border-sky-400 opacity-100' : 'border-transparent opacity-50 hover:opacity-80',
                                        )}
                                    >
                                        {a.esPdf
                                            ? <FileText className="h-5 w-5 text-red-400" />
                                            : <img src={a.url} alt="" className="h-full w-full object-cover" />}
                                    </button>
                                ))}
                            </div>
                        )}
                        <p className="pb-2 text-center text-[11px] text-slate-500">
                            {actual.esPdf ? '' : 'Rueda del mouse o doble clic para zoom · arrastra para mover · '}← → para cambiar · Esc para cerrar
                        </p>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
