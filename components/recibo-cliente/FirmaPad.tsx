'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface Props {
    leyenda: string
    onChange: (dataUrl: string | null) => void
    disabled?: boolean
}

const TINTA = '#12388f'
const GROSOR = 2.2

const ANCHO_EXPORT = 600

export function FirmaPad({ leyenda, onChange, disabled = false }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const dibujando = useRef(false)
    const ultimo = useRef<{ x: number; y: number } | null>(null)

    const [tieneTrazo, setTieneTrazo] = useState(false)

    const ctx = () => canvasRef.current?.getContext('2d') ?? null

    const aplicarEstilo = useCallback(() => {
        const c = ctx()
        if (!c) return
        c.lineWidth = GROSOR
        c.lineCap = 'round'
        c.lineJoin = 'round'
        c.strokeStyle = TINTA
        c.fillStyle = TINTA
    }, [])

    const redimensionar = useCallback(() => {
        const canvas = canvasRef.current
        const c = ctx()
        if (!canvas || !c) return

        const rect = canvas.getBoundingClientRect()
        if (rect.width === 0) return

        const dpr = window.devicePixelRatio || 1
        const previo = tieneTrazo ? canvas.toDataURL() : null

        canvas.width = Math.round(rect.width * dpr)
        canvas.height = Math.round(rect.height * dpr)
        c.setTransform(dpr, 0, 0, dpr, 0, 0)
        aplicarEstilo()

        if (previo) {
            const img = new Image()
            img.onload = () => c.drawImage(img, 0, 0, rect.width, rect.height)
            img.src = previo
        }
    }, [aplicarEstilo, tieneTrazo])

    useEffect(() => {
        redimensionar()

        const canvas = canvasRef.current
        if (!canvas || typeof ResizeObserver === 'undefined') return

        const ro = new ResizeObserver(() => redimensionar())
        ro.observe(canvas)
        return () => ro.disconnect()
    }, [])

    const exportar = useCallback((): string | null => {
        const canvas = canvasRef.current
        const c = ctx()
        if (!canvas || !c) return null

        const { width, height } = canvas
        if (width === 0 || height === 0) return null

        const datos = c.getImageData(0, 0, width, height).data

        let minX = width, minY = height, maxX = -1, maxY = -1
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (datos[(y * width + x) * 4 + 3] > 8) {
                    if (x < minX) minX = x
                    if (x > maxX) maxX = x
                    if (y < minY) minY = y
                    if (y > maxY) maxY = y
                }
            }
        }

        if (maxX < 0) return null

        const margen = Math.round(GROSOR * (window.devicePixelRatio || 1)) + 2
        minX = Math.max(0, minX - margen)
        minY = Math.max(0, minY - margen)
        maxX = Math.min(width - 1, maxX + margen)
        maxY = Math.min(height - 1, maxY + margen)

        const anchoRecorte = maxX - minX + 1
        const altoRecorte = maxY - minY + 1
        const escala = Math.min(1, ANCHO_EXPORT / anchoRecorte)

        const salida = document.createElement('canvas')
        salida.width = Math.max(1, Math.round(anchoRecorte * escala))
        salida.height = Math.max(1, Math.round(altoRecorte * escala))

        const cs = salida.getContext('2d')
        if (!cs) return null

        cs.drawImage(
            canvas,
            minX, minY, anchoRecorte, altoRecorte,
            0, 0, salida.width, salida.height
        )

        return salida.toDataURL('image/png')
    }, [])

    const posicion = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const iniciar = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (disabled) return
        e.preventDefault()

        const c = ctx()
        if (!c) return

        dibujando.current = true
        ultimo.current = posicion(e)
        e.currentTarget.setPointerCapture?.(e.pointerId)

        aplicarEstilo()
        c.beginPath()
        c.arc(ultimo.current.x, ultimo.current.y, GROSOR / 2, 0, Math.PI * 2)
        c.fill()

        setTieneTrazo(true)
    }

    const mover = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!dibujando.current || disabled) return
        e.preventDefault()

        const c = ctx()
        const desde = ultimo.current
        if (!c || !desde) return

        const p = posicion(e)
        c.beginPath()
        c.moveTo(desde.x, desde.y)
        c.lineTo(p.x, p.y)
        c.stroke()
        ultimo.current = p
    }

    const terminar = () => {
        if (!dibujando.current) return
        dibujando.current = false
        ultimo.current = null
        onChange(exportar())
    }

    const borrar = () => {
        const canvas = canvasRef.current
        const c = ctx()
        if (!canvas || !c) return

        c.clearRect(0, 0, canvas.width, canvas.height)
        setTieneTrazo(false)
        onChange(null)
    }

    return (
        <div className="flex flex-col">
            <div className="relative">
                <canvas
                    ref={canvasRef}
                    onPointerDown={iniciar}
                    onPointerMove={mover}
                    onPointerUp={terminar}
                    onPointerLeave={terminar}
                    aria-label={leyenda}
                    className={`block h-[110px] w-full touch-none rounded-md bg-white ${
                        tieneTrazo
                            ? 'border-[1.5px] border-solid border-[#12388f]'
                            : 'border-[1.5px] border-dashed border-[#8aa0cf]'
                    } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-crosshair'}`}
                />

                {!tieneTrazo && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[12px] italic text-[#c3cbe0]">
                        Firma aquí con el dedo o el mouse
                    </div>
                )}
            </div>

            <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="flex-1 border-t-[1.5px] border-[#12388f] pt-1.5 text-center text-[11px] font-extrabold tracking-[.4px] text-[#12388f]">
                    {leyenda}
                </span>

                <button
                    type="button"
                    onClick={borrar}
                    disabled={!tieneTrazo || disabled}
                    className="whitespace-nowrap px-1.5 py-0.5 text-[11px] font-bold text-[#d21f27] hover:underline disabled:invisible"
                >
                    Borrar
                </button>
            </div>
        </div>
    )
}
