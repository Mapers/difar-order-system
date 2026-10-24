import { PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib'
import { cargarLogoPdf, dibujarCabeceraPdf, sanitizarPdf, truncarPdf } from '@/components/reporte/pdfCabecera'
import { aclarar, crearPdfReporte, hexARgb, OpcionesPdfReporte } from '@/components/reporte/pdfOpciones'
import type { TablaIvan } from '../nucleo/tipos'
import { esNumerica, formatear } from './formato'

const MARGEN = 32
const FILA = 15
const LETRA = 7.5

/**
 * PDF de una tabla de IVAN con la cabecera de DIFAR. Horizontal si tiene
 * muchas columnas. El ancho de cada columna sale del contenido.
 */
export async function generarPdfTabla(tabla: TablaIvan, op: OpcionesPdfReporte): Promise<Uint8Array> {
    const horizontal = tabla.columnas.length > 6
    const [W, H] = horizontal ? [841.89, 595.28] : [595.28, 841.89]
    const color = hexARgb(op.color)

    const pdf = await crearPdfReporte(op.tamanoLetra)
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const negrita = await pdf.embedFont(StandardFonts.HelveticaBold)
    const logo = await cargarLogoPdf(pdf)

    // Ancho de columnas proporcional al contenido, dentro del ancho útil.
    const util = W - MARGEN * 2
    const medir = (t: string, f: PDFFont) => f.widthOfTextAtSize(sanitizarPdf(t), LETRA) + 8
    const crudos = tabla.columnas.map(c => Math.min(220, Math.max(
        medir(c.t, negrita),
        ...tabla.filas.slice(0, 300).map(f => medir(formatear(f[c.k], c.tipo), font)),
    )))
    const k = util / crudos.reduce((s, a) => s + a, 0)
    const anchos = crudos.map(a => a * k)

    let page: PDFPage
    let y = 0
    let numero = 0
    const paginas: PDFPage[] = []

    const encabezadoTabla = () => {
        page.drawRectangle({ x: MARGEN, y: y - FILA + 4, width: util, height: FILA, color })
        let x = MARGEN
        tabla.columnas.forEach((c, i) => {
            const t = truncarPdf(c.t, anchos[i] - 6, LETRA, negrita)
            const w = negrita.widthOfTextAtSize(t, LETRA)
            page.drawText(t, { x: esNumerica(c) ? x + anchos[i] - 4 - w : x + 4, y: y - 7, size: LETRA, font: negrita, color: rgb(1, 1, 1) })
            x += anchos[i]
        })
        y -= FILA
    }

    const nuevaPagina = () => {
        page = pdf.addPage([W, H])
        paginas.push(page)
        numero++
        y = dibujarCabeceraPdf({
            page, font, boldFont: negrita, logo, pageWidth: W, pageHeight: H, margin: MARGEN,
            subtitulo: sanitizarPdf(op.titulo || tabla.titulo),
            infoDerecha: 'Consulta IVAN',
            filtros: sanitizarPdf([tabla.subtitulo, op.nota].filter(Boolean).join(' · ')),
        }) - 6
        encabezadoTabla()
    }

    const fila = (datos: Record<string, unknown>, opciones: { fondo?: ReturnType<typeof rgb>; fuente?: PDFFont } = {}) => {
        if (y < MARGEN + FILA * 2) nuevaPagina()
        if (opciones.fondo) page.drawRectangle({ x: MARGEN, y: y - FILA + 4, width: util, height: FILA, color: opciones.fondo })
        let x = MARGEN
        const f = opciones.fuente || font
        tabla.columnas.forEach((c, i) => {
            const t = truncarPdf(formatear(datos[c.k], c.tipo), anchos[i] - 6, LETRA, f)
            const w = f.widthOfTextAtSize(t, LETRA)
            page.drawText(t, { x: esNumerica(c) ? x + anchos[i] - 4 - w : x + 4, y: y - 7, size: LETRA, font: f, color: rgb(0.12, 0.12, 0.12) })
            x += anchos[i]
        })
        y -= FILA
    }

    nuevaPagina()
    tabla.filas.forEach((f, i) => fila(f, { fondo: i % 2 ? aclarar(color, 0.94) : undefined }))
    if (tabla.totales) {
        page!.drawLine({ start: { x: MARGEN, y: y + 4 }, end: { x: W - MARGEN, y: y + 4 }, thickness: 0.8, color })
        fila(tabla.totales, { fuente: negrita, fondo: aclarar(color, 0.85) })
    }

    paginas.forEach((p, i) => {
        const t = `Página ${i + 1} de ${numero} · ${tabla.filas.length} filas`
        p.drawText(t, { x: W - MARGEN - font.widthOfTextAtSize(t, 7), y: MARGEN - 14, size: 7, font, color: rgb(0.45, 0.45, 0.45) })
    })

    return pdf.save()
}
