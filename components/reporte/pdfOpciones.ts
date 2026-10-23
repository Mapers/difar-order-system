import { PDFDocument, rgb, RGB } from 'pdf-lib'

/** Colores que ofrecen los modales de PDF. */
export const TEMAS_PDF: { nombre: string; color: string }[] = [
    { nombre: 'Azul marino', color: '#163161' },
    { nombre: 'Azul',        color: '#2563eb' },
    { nombre: 'Verde',       color: '#047857' },
    { nombre: 'Morado',      color: '#6d28d9' },
    { nombre: 'Vino',        color: '#9f1239' },
    { nombre: 'Grafito',     color: '#334155' },
]

export type TamanoLetraPdf = 'pequena' | 'normal' | 'grande'

/** Opciones comunes del modal de vista previa de los reportes. */
export interface OpcionesPdfReporte {
    titulo:      string
    nota:        string
    /** Color principal en hex, p. ej. '#163161'. */
    color:       string
    tamanoLetra: TamanoLetraPdf
}

export const hexARgb = (hex: string): RGB => {
    const h = hex.replace('#', '')
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
    return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

/** Mezcla el color con blanco: t=0 el color, t=1 blanco. Para fondos suaves. */
export const aclarar = (c: RGB, t: number): RGB =>
    rgb(c.red + (1 - c.red) * t, c.green + (1 - c.green) * t, c.blue + (1 - c.blue) * t)

const ESCALA: Record<TamanoLetraPdf, number> = { pequena: 0.9, normal: 1, grande: 1.1 }

/**
 * Crea el documento aplicando el tamaño de letra elegido sin tocar cada
 * reporte: las fuentes miden el texto y las páginas lo dibujan con el tamaño
 * escalado, así los cortes y las alineaciones a la derecha siguen cuadrando.
 */
export async function crearPdfReporte(tamano: TamanoLetraPdf = 'normal'): Promise<PDFDocument> {
    const pdfDoc = await PDFDocument.create()
    const k = ESCALA[tamano]
    if (k === 1) return pdfDoc

    const embedFont = pdfDoc.embedFont.bind(pdfDoc)
    pdfDoc.embedFont = (async (...args: Parameters<PDFDocument['embedFont']>) => {
        const f = await embedFont(...args)
        const ancho = f.widthOfTextAtSize.bind(f)
        const alto = f.heightAtSize.bind(f)
        f.widthOfTextAtSize = (t: string, s: number) => ancho(t, s * k)
        f.heightAtSize = (s: number, o?: { descender?: boolean }) => alto(s * k, o)
        return f
    }) as PDFDocument['embedFont']

    const addPage = pdfDoc.addPage.bind(pdfDoc)
    pdfDoc.addPage = ((...args: Parameters<PDFDocument['addPage']>) => {
        const p = addPage(...args)
        const drawText = p.drawText.bind(p)
        p.drawText = (t, o = {}) => drawText(t, { ...o, size: (o.size ?? 24) * k })
        return p
    }) as PDFDocument['addPage']

    return pdfDoc
}
