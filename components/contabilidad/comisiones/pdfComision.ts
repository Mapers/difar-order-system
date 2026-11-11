import { PDFDocument, StandardFonts, rgb, RGB } from 'pdf-lib'
import { cargarLogoPdf, EMPRESA, sanitizarPdf, truncarPdf } from '@/components/reporte/pdfCabecera'
import { TEMAS_PDF, hexARgb, aclarar } from '@/components/reporte/pdfOpciones'

/**
 * PDF de los reportes de comisiones (ventas y cobranza). Mismo diseño que el
 * PDF de Movimiento de Sub Cuenta Contable: banda de color, logo, recuadro del
 * reporte, tarjetas de resumen, tabla con franja de color y pie paginado.
 */

export type ColorCelda = 'texto' | 'verde' | 'rojo' | 'gris' | 'tema' | 'ambar'

export interface ColumnaPdf {
    clave:     string
    titulo:    string
    /** Ancho en puntos; 0 = se queda con el espacio que sobra (solo una columna). */
    ancho:     number
    derecha?:  boolean
    /** Si es opcional, el usuario puede ocultarla en el modal. */
    opcional?: boolean
    negrita?:  boolean
}

export interface FilaPdf {
    valores: Record<string, string>
    colores?: Record<string, ColorCelda>
}

export interface ReportePdf {
    /** Recuadro superior: título grande y una línea de detalle. */
    recuadroTitulo: string
    recuadroDetalle: string
    /** Texto a la derecha de la cabecera, p. ej. "Junio 2026 · Soles". */
    periodo: string
    tarjetas: { etiqueta: string; valor: string; color?: ColorCelda }[]
    columnas: ColumnaPdf[]
    filas: FilaPdf[]
    /** Fila de totales al pie de la tabla (valores por clave de columna). */
    totales?: Record<string, string>
    /** Texto del pie de página, a la izquierda. */
    pie: string
    vacio?: string
}

export interface OpcionesPdfComision {
    titulo:         string
    nota:           string
    color:          string
    orientacion:    'horizontal' | 'vertical'
    tamanoLetra:    'pequena' | 'normal' | 'grande'
    columnas:       Record<string, boolean>
    zebra:          boolean
    colorImportes:  boolean
    mostrarResumen: boolean
    mostrarTotales: boolean
}

export { TEMAS_PDF }

export const opcionesPorDefecto = (titulo: string, columnas: ColumnaPdf[]): OpcionesPdfComision => ({
    titulo,
    nota:           '',
    color:          TEMAS_PDF[0].color,
    orientacion:    'horizontal',
    tamanoLetra:    'normal',
    columnas:       Object.fromEntries(columnas.filter(c => c.opcional).map(c => [c.clave, true])),
    zebra:          true,
    colorImportes:  true,
    mostrarResumen: true,
    mostrarTotales: true,
})

const VERDE = rgb(0.016, 0.47, 0.34)
const ROJO  = rgb(0.73, 0.11, 0.11)
const AMBAR = rgb(0.71, 0.33, 0.04)
const TEXTO = rgb(0.12, 0.16, 0.23)
const GRIS  = rgb(0.42, 0.45, 0.5)
const BORDE = rgb(0.88, 0.9, 0.93)

export async function generarPdfComision(rep: ReportePdf, op: OpcionesPdfComision): Promise<Uint8Array> {
    const pdfDoc   = await PDFDocument.create()
    const font     = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const logo     = await cargarLogoPdf(pdfDoc)

    const horizontal   = op.orientacion === 'horizontal'
    const pageWidth    = horizontal ? 841.89 : 595.28
    const pageHeight   = horizontal ? 595.28 : 841.89
    const margin       = horizontal ? 36 : 28
    const contentWidth = pageWidth - margin * 2

    const size  = op.tamanoLetra === 'pequena' ? 6.5 : op.tamanoLetra === 'grande' ? 8.5 : 7.5
    const filaH = size + 5.5

    const tema      = hexARgb(op.color || TEMAS_PDF[0].color)
    const temaSuave = aclarar(tema, 0.92)
    const zebraCol  = aclarar(tema, 0.965)

    const colorDe = (c?: ColorCelda): RGB => {
        if (!op.colorImportes && c !== 'gris' && c !== 'tema') return TEXTO
        switch (c) {
            case 'verde': return VERDE
            case 'rojo':  return ROJO
            case 'ambar': return AMBAR
            case 'gris':  return GRIS
            case 'tema':  return tema
            default:      return TEXTO
        }
    }

    // Columnas visibles; la flexible se queda con lo que sobra. Si las fijas no
    // entran (hoja vertical), se achican en proporción.
    const cols = rep.columnas
        .filter(c => !c.opcional || op.columnas[c.clave] !== false)
        .map(c => ({ ...c }))
    const flexible = cols.find(c => c.ancho === 0)
    const minFlex = flexible ? (horizontal ? 150 : 100) : 0
    let fijo = cols.reduce((s, c) => s + c.ancho, 0)
    if (fijo + minFlex > contentWidth) {
        const factor = (contentWidth - minFlex) / fijo
        cols.forEach(c => { c.ancho = Math.floor(c.ancho * factor) })
        fijo = cols.reduce((s, c) => s + c.ancho, 0)
    }
    if (flexible) flexible.ancho = contentWidth - fijo
    else if (fijo < contentWidth) {
        // Sin columna flexible: se reparte el sobrante en proporción.
        const factor = contentWidth / fijo
        cols.forEach(c => { c.ancho = c.ancho * factor })
    }

    let page = pdfDoc.addPage([pageWidth, pageHeight])
    let y = 0

    const texto = (p: any, t: string, x: number, yy: number, s: number, f: any, color: RGB = TEXTO) =>
        p.drawText(sanitizarPdf(t), { x, y: yy, size: s, font: f, color })

    const textoDerecha = (p: any, t: string, xFin: number, yy: number, s: number, f: any, color: RGB = TEXTO) => {
        const limpio = sanitizarPdf(t)
        p.drawText(limpio, { x: xFin - f.widthOfTextAtSize(limpio, s), y: yy, size: s, font: f, color })
    }

    const dibujarEncabezadoTabla = (p: any) => {
        const alto = filaH + 4
        p.drawRectangle({ x: margin, y: y - alto, width: contentWidth, height: alto, color: tema })
        const base = y - alto / 2 - size * 0.35
        let x = margin
        cols.forEach(c => {
            const t = truncarPdf(c.titulo, c.ancho - 8, size, boldFont)
            if (c.derecha) textoDerecha(p, t, x + c.ancho - 6, base, size, boldFont, rgb(1, 1, 1))
            else texto(p, t, x + 5, base, size, boldFont, rgb(1, 1, 1))
            x += c.ancho
        })
        y = y - alto - 2 - filaH + 3.5
    }

    const dibujarCabecera = (p: any, primera: boolean) => {
        p.drawRectangle({ x: 0, y: pageHeight - 6, width: pageWidth, height: 6, color: tema })
        const arriba = pageHeight - margin
        let xT = margin
        if (logo) {
            p.drawImage(logo, { x: margin, y: arriba - 18, width: 52, height: 31 })
            xT = margin + 62
        }
        const anchoT = contentWidth - (xT - margin) - 150
        texto(p, truncarPdf(EMPRESA.nombre, anchoT, 12, boldFont), xT, arriba, 12, boldFont)
        texto(p, `RUC: ${EMPRESA.ruc}`, xT, arriba - 13, 8.5, font, GRIS)
        texto(p, truncarPdf(op.titulo, anchoT, 10, boldFont), xT, arriba - 26, 10, boldFont, tema)

        const ahora = new Date()
        textoDerecha(p, `Impreso: ${ahora.toLocaleDateString('es-PE')} ${ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`,
            pageWidth - margin, arriba, 8, font, GRIS)
        textoDerecha(p, rep.periodo, pageWidth - margin, arriba - 13, 8.5, boldFont, tema)

        y = arriba - 40
        p.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.8, color: tema })
        y -= 12

        if (primera) {
            const lineasNota = op.nota.trim() ? 1 : 0
            const alto = 32 + lineasNota * 11
            p.drawRectangle({ x: margin, y: y - alto, width: contentWidth, height: alto, color: temaSuave })
            p.drawRectangle({ x: margin, y: y - alto, width: 3, height: alto, color: tema })
            texto(p, truncarPdf(rep.recuadroTitulo, contentWidth - 20, 11, boldFont), margin + 12, y - 14, 11, boldFont)
            texto(p, truncarPdf(rep.recuadroDetalle, contentWidth - 20, 8, font), margin + 12, y - 26, 8, font, GRIS)
            if (lineasNota) texto(p, truncarPdf(op.nota.trim(), contentWidth - 20, 8, font), margin + 12, y - 37, 8, font, TEXTO)
            y -= alto + 10

            if (op.mostrarResumen && rep.tarjetas.length) {
                const n = rep.tarjetas.length
                const gap = 8
                const ancho = (contentWidth - gap * (n - 1)) / n
                rep.tarjetas.forEach((t, i) => {
                    const x = margin + i * (ancho + gap)
                    const ultima = i === n - 1
                    p.drawRectangle({
                        x, y: y - 34, width: ancho, height: 34,
                        color: ultima ? temaSuave : rgb(1, 1, 1),
                        borderColor: ultima ? tema : BORDE, borderWidth: ultima ? 1 : 0.8,
                    })
                    texto(p, truncarPdf(t.etiqueta.toUpperCase(), ancho - 14, 6.5, boldFont), x + 8, y - 12, 6.5, boldFont, GRIS)
                    texto(p, truncarPdf(t.valor, ancho - 14, 11.5, boldFont), x + 8, y - 27, 11.5, boldFont, ultima ? tema : colorDe(t.color))
                })
                y -= 34 + 12
            }
        }
        dibujarEncabezadoTabla(p)
    }

    const saltarPagina = () => {
        page = pdfDoc.addPage([pageWidth, pageHeight])
        dibujarCabecera(page, false)
    }

    const limiteInferior = margin + 30
    dibujarCabecera(page, true)

    rep.filas.forEach((f, i) => {
        if (y < limiteInferior) saltarPagina()
        if (op.zebra && i % 2 === 1) {
            page.drawRectangle({ x: margin, y: y - 3.5, width: contentWidth, height: filaH, color: zebraCol })
        }
        let x = margin
        cols.forEach(c => {
            const fuente = c.negrita ? boldFont : font
            const t = truncarPdf(f.valores[c.clave] ?? '', c.ancho - 10, size, fuente)
            const color = colorDe(f.colores?.[c.clave])
            if (c.derecha) textoDerecha(page, t, x + c.ancho - 6, y, size, fuente, color)
            else texto(page, t, x + 5, y, size, fuente, color)
            x += c.ancho
        })
        page.drawLine({ start: { x: margin, y: y - 3.5 }, end: { x: pageWidth - margin, y: y - 3.5 }, thickness: 0.3, color: BORDE })
        y -= filaH
    })

    if (rep.filas.length === 0) {
        texto(page, rep.vacio || 'Sin registros en el período.', margin + 5, y - 4, size + 1, font, GRIS)
        y -= filaH + 4
    }

    if (op.mostrarTotales && rep.totales && rep.filas.length) {
        if (y < limiteInferior + filaH) saltarPagina()
        page.drawRectangle({ x: margin, y: y - 3.5, width: contentWidth, height: filaH, color: temaSuave })
        page.drawLine({ start: { x: margin, y: y + filaH - 3.5 }, end: { x: pageWidth - margin, y: y + filaH - 3.5 }, thickness: 0.8, color: tema })
        let x = margin
        cols.forEach(c => {
            const v = rep.totales![c.clave]
            if (v) {
                const t = truncarPdf(v, c.ancho - 10, size, boldFont)
                if (c.derecha) textoDerecha(page, t, x + c.ancho - 6, y, size, boldFont, TEXTO)
                else texto(page, t, x + 5, y, size, boldFont, TEXTO)
            }
            x += c.ancho
        })
        y -= filaH
    }

    const paginas = pdfDoc.getPages()
    paginas.forEach((p, i) => {
        p.drawLine({ start: { x: margin, y: margin - 6 }, end: { x: pageWidth - margin, y: margin - 6 }, thickness: 0.4, color: BORDE })
        texto(p, truncarPdf(`${rep.pie} · ${op.titulo}`, contentWidth - 90, 7, font), margin, margin - 18, 7, font, GRIS)
        textoDerecha(p, `Página ${i + 1} de ${paginas.length}`, pageWidth - margin, margin - 18, 7, font, GRIS)
    })

    return pdfDoc.save()
}
