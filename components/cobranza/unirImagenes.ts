import { EVIDENCIA_MAX_BYTES } from '@/app/types/cobranza-types'

export type Disposicion = 'vertical' | 'horizontal' | 'cuadricula'

export interface CeldaUnion {
    x: number
    y: number
    w: number
    h: number
}

export interface ResultadoUnion {
    archivo: File
    celdas: CeldaUnion[]
}

const LADO_OBJETIVO = 1000
const SEPARADOR = 14
const AREA_MAX = 12_000_000
const LADO_MAX = 8192

interface Pieza {
    img: HTMLImageElement
    w: number
    h: number
    x: number
    y: number
}

export function cargarImagen(url: string): Promise<HTMLImageElement> {
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

export async function comprimirCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
    let calidad = 0.92
    let blob = await canvasABlob(canvas, calidad)
    while (blob.size > EVIDENCIA_MAX_BYTES && calidad > 0.4) {
        calidad -= 0.12
        blob = await canvasABlob(canvas, calidad)
    }
    if (blob.size > EVIDENCIA_MAX_BYTES) {
        const reducido = document.createElement('canvas')
        reducido.width = Math.max(1, Math.round(canvas.width * 0.7))
        reducido.height = Math.max(1, Math.round(canvas.height * 0.7))
        reducido.getContext('2d')!.drawImage(canvas, 0, 0, reducido.width, reducido.height)
        return comprimirCanvas(reducido)
    }
    return blob
}

function columnasDe(disposicion: Disposicion, total: number): number {
    if (disposicion === 'vertical') return 1
    if (disposicion === 'horizontal') return Math.max(1, total)
    return total <= 4 ? 2 : 3
}

function escalaDe(disposicion: Disposicion, img: HTMLImageElement): number {
    const lado = disposicion === 'horizontal' ? img.naturalHeight : img.naturalWidth
    return Math.min(1, LADO_OBJETIVO / Math.max(1, lado))
}

export async function unirImagenes(urls: string[], disposicion: Disposicion): Promise<ResultadoUnion> {
    if (urls.length === 0) throw new Error('No hay imágenes para unir')

    const imgs = await Promise.all(urls.map(cargarImagen))
    const columnas = columnasDe(disposicion, imgs.length)
    const anchoCelda = disposicion === 'horizontal' ? 0 : LADO_OBJETIVO

    const piezas: Pieza[] = imgs.map((img) => {
        const escala = escalaDe(disposicion, img)
        return {
            img,
            w: Math.max(1, Math.round(img.naturalWidth * escala)),
            h: Math.max(1, Math.round(img.naturalHeight * escala)),
            x: 0,
            y: 0,
        }
    })

    const filas: Pieza[][] = []
    for (let i = 0; i < piezas.length; i += columnas) filas.push(piezas.slice(i, i + columnas))

    const anchoDeFila = (fila: Pieza[]) => anchoCelda > 0
        ? columnas * anchoCelda + SEPARADOR * (columnas - 1)
        : fila.reduce((suma, p) => suma + p.w, 0) + SEPARADOR * (fila.length - 1)

    const ancho = Math.max(...filas.map(anchoDeFila))

    const lineasH: number[] = []
    const lineasV: number[] = []

    let y = 0
    filas.forEach((fila, iFila) => {
        const altoFila = Math.max(...fila.map(p => p.h))
        let x = anchoCelda > 0 ? 0 : Math.round((ancho - anchoDeFila(fila)) / 2)

        fila.forEach((p, iCol) => {
            const celda = anchoCelda > 0 ? anchoCelda : p.w
            p.x = Math.round(x + (celda - p.w) / 2)
            p.y = Math.round(y + (altoFila - p.h) / 2)
            x += celda + SEPARADOR
            if (iFila === 0 && iCol < fila.length - 1) lineasV.push(x - SEPARADOR / 2)
        })

        y += altoFila
        if (iFila < filas.length - 1) {
            lineasH.push(y + SEPARADOR / 2)
            y += SEPARADOR
        }
    })
    const alto = y

    const factor = Math.min(
        1,
        Math.sqrt(AREA_MAX / (ancho * alto)),
        LADO_MAX / ancho,
        LADO_MAX / alto,
    )
    const W = Math.max(1, Math.round(ancho * factor))
    const H = Math.max(1, Math.round(alto * factor))

    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingQuality = 'high'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    const celdas: CeldaUnion[] = piezas.map((p) => {
        const x = p.x * factor
        const y2 = p.y * factor
        const w = p.w * factor
        const h = p.h * factor
        ctx.drawImage(p.img, x, y2, w, h)
        return { x: (x / W) * 100, y: (y2 / H) * 100, w: (w / W) * 100, h: (h / H) * 100 }
    })

    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 1
    ctx.beginPath()
    lineasH.forEach((linea) => {
        const py = Math.round(linea * factor) + 0.5
        ctx.moveTo(0, py)
        ctx.lineTo(W, py)
    })
    lineasV.forEach((linea) => {
        const px = Math.round(linea * factor) + 0.5
        ctx.moveTo(px, 0)
        ctx.lineTo(px, H)
    })
    ctx.stroke()

    const blob = await comprimirCanvas(canvas)
    if (blob.size > EVIDENCIA_MAX_BYTES) {
        throw new Error('La imagen unificada superó 5 MB incluso comprimida. Quita alguna imagen e inténtalo de nuevo.')
    }

    return {
        archivo: new File([blob], `comprobante-unificado-${Date.now()}.jpg`, { type: 'image/jpeg' }),
        celdas,
    }
}
