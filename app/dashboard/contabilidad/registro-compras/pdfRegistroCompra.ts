import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { cargarLogoPdf, dibujarCabeceraPdf, sanitizarPdf, truncarPdf } from '@/components/reporte/pdfCabecera'

// A4 vertical
const PAGE_W    = 595.28
const PAGE_H    = 841.89
const MARGIN    = 30
const CONTENT_W = PAGE_W - MARGIN * 2
const ROW_H     = 15
const PAD       = 3

const CLR_HEADER_BG = rgb(0.08, 0.17, 0.32)
const CLR_ROW_ALT   = rgb(0.96, 0.97, 0.99)
const CLR_CAJA      = rgb(0.95, 0.97, 1)
const CLR_BORDE     = rgb(0.82, 0.86, 0.93)
const CLR_ETIQUETA  = rgb(0.45, 0.45, 0.45)
const CLR_TEXTO     = rgb(0.08, 0.08, 0.08)
const CLR_TOTAL     = rgb(0.08, 0.22, 0.62)

const COLS: { h: string; w: number; align: 'left' | 'right' | 'center' }[] = [
    { h: '#',          w: 20,  align: 'center' },
    { h: 'Artículo',   w: 179, align: 'left'   },
    { h: 'Und',        w: 34,  align: 'center' },
    { h: 'Cantidad',   w: 50,  align: 'right'  },
    { h: 'P. unit.',   w: 60,  align: 'right'  },
    { h: 'Total',      w: 66,  align: 'right'  },
    { h: 'Lote',       w: 70,  align: 'center' },
    { h: 'Vence',      w: 56,  align: 'center' },
]

const txt = (x: unknown) => String(x ?? '').trim()
const num = (x: unknown, dec = 2) =>
    Number(x ?? 0).toLocaleString('es-PE', { minimumFractionDigits: dec, maximumFractionDigits: dec })
const fecha = (x: unknown) => {
    if (!x) return ''
    const d = new Date(String(x))
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-PE', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' })
}
const simbolo = (moneda: string) =>
    /^(NSO|PEN|SOL|S\/)/i.test(moneda) ? 'S/' : /^(US|DOL|USD)/i.test(moneda) ? 'US$' : moneda

/**
 * PDF del documento de compra con el mismo formato que el resto de reportes
 * (cabecera con logo, tabla con encabezado azul marino y filas alternadas).
 * `nombreTipo` traduce el código del tipo de documento con el catálogo ya cargado.
 */
export async function generarPdfRegistroCompra(
    filas: Record<string, unknown>[],
    nombreTipo: (cod: string) => string,
): Promise<Uint8Array> {
    const pdfDoc   = await PDFDocument.create()
    const font     = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const logo     = await cargarLogoPdf(pdfDoc)

    const c = filas[0]
    const moneda = simbolo(txt(c.Moneda))
    const documento = `${nombreTipo(txt(c.TipoDoc))} ${txt(c.SerieDoc)}-${txt(c.NumeroDoc)}`
    const total = filas.reduce((a, r) => a + Number(r.TotalItem ?? 0), 0)
    const ahora = new Date()
    const impreso = `Impreso: ${ahora.toLocaleDateString('es-PE')} ${ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`

    let page = pdfDoc.addPage([PAGE_W, PAGE_H])
    let y = 0

    const cabecera = () => {
        y = dibujarCabeceraPdf({
            page, font, boldFont, logo,
            pageWidth: PAGE_W, pageHeight: PAGE_H, margin: MARGIN,
            subtitulo: 'REGISTRO DE COMPRA',
            razonSocial: txt(c.NombreRazSocial) || undefined,
            ruc: txt(c.RUC) || undefined,
            infoDerecha: `Clave ${txt(c.Clave)}`,
            infoDerechaSec: impreso,
        })
    }

    const filaTabla = (celdas: string[], encabezado: boolean, alterna: boolean) => {
        if (encabezado || alterna) {
            page.drawRectangle({
                x: MARGIN, y: y - ROW_H + 4, width: CONTENT_W, height: ROW_H,
                color: encabezado ? CLR_HEADER_BG : CLR_ROW_ALT,
            })
        }
        const f = encabezado ? boldFont : font
        const size = encabezado ? 7.5 : 8
        let x = MARGIN
        COLS.forEach((col, i) => {
            const t = truncarPdf(celdas[i] ?? '', col.w - PAD * 2, size, f)
            const w = f.widthOfTextAtSize(t, size)
            const tx = col.align === 'right' ? x + col.w - w - PAD
                : col.align === 'center' ? x + (col.w - w) / 2 : x + PAD
            page.drawText(t, { x: tx, y: y - ROW_H + 8, size, font: f, color: encabezado ? rgb(1, 1, 1) : CLR_TEXTO })
            x += col.w
        })
        y -= ROW_H
    }

    cabecera()

    // ── Datos del documento ──────────────────────────────────────────────
    const cajaH = 92
    page.drawRectangle({
        x: MARGIN, y: y - cajaH, width: CONTENT_W, height: cajaH,
        color: CLR_CAJA, borderColor: CLR_BORDE, borderWidth: 0.8,
    })
    page.drawText(sanitizarPdf(documento), { x: MARGIN + 12, y: y - 22, size: 14, font: boldFont, color: CLR_TOTAL })
    const totalTxt = `${moneda} ${num(total)}`
    page.drawText('IMPORTE TOTAL', {
        x: PAGE_W - MARGIN - 12 - font.widthOfTextAtSize('IMPORTE TOTAL', 7), y: y - 12, size: 7, font, color: CLR_ETIQUETA,
    })
    page.drawText(sanitizarPdf(totalTxt), {
        x: PAGE_W - MARGIN - 12 - boldFont.widthOfTextAtSize(sanitizarPdf(totalTxt), 13), y: y - 26, size: 13, font: boldFont, color: CLR_TOTAL,
    })

    const meta: [string, string][] = [
        ['Proveedor', txt(c.Nombre)],
        ['Fecha de emisión', fecha(c.Fecha_Emision)],
        ['Condición', txt(c.CondicionDoc)],
        ['Moneda', moneda === 'S/' ? 'SOLES (S/)' : moneda === 'US$' ? 'DÓLARES (US$)' : txt(c.Moneda)],
        ['Almacén', txt(c.Almacen)],
        ['Ítems', String(filas.length)],
    ]
    // Proveedor ocupa media fila; el resto va en columnas iguales.
    const anchos = [CONTENT_W / 2 - 12, CONTENT_W / 4 - 6, CONTENT_W / 4 - 6, CONTENT_W / 4 - 6, CONTENT_W / 4 - 6, CONTENT_W / 2 - 12]
    const posiciones: [number, number][] = [
        [MARGIN + 12, y - 44], [MARGIN + CONTENT_W / 2, y - 44], [MARGIN + CONTENT_W * 3 / 4, y - 44],
        [MARGIN + 12, y - 70], [MARGIN + CONTENT_W / 4 + 6, y - 70], [MARGIN + CONTENT_W / 2, y - 70],
    ]
    meta.forEach(([etq, val], i) => {
        const [mx, my] = posiciones[i]
        page.drawText(etq.toUpperCase(), { x: mx, y: my, size: 6.5, font, color: CLR_ETIQUETA })
        page.drawText(truncarPdf(val || '-', anchos[i], 9, boldFont), { x: mx, y: my - 11, size: 9, font: boldFont, color: CLR_TEXTO })
    })
    y -= cajaH + 16

    // ── Detalle ──────────────────────────────────────────────────────────
    filaTabla(COLS.map(x => x.h), true, false)
    filas.forEach((r, i) => {
        if (y - ROW_H < MARGIN + 50) {
            page = pdfDoc.addPage([PAGE_W, PAGE_H])
            cabecera()
            filaTabla(COLS.map(x => x.h), true, false)
        }
        filaTabla([
            String(i + 1),
            txt(r.NombreItem),
            txt(r.Und),
            num(r.Cantidad),
            num(r.PUItem),
            num(r.TotalItem),
            txt(r.Lote),
            fecha(r.VctoArt),
        ], false, i % 2 === 1)
    })

    // ── Total ────────────────────────────────────────────────────────────
    y -= 4
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: CLR_HEADER_BG })
    y -= 16
    const etqTotal = 'TOTAL'
    const anchoHastaTotal = COLS.slice(0, 6).reduce((a, x) => a + x.w, 0)
    page.drawText(etqTotal, { x: MARGIN + anchoHastaTotal - 66 - boldFont.widthOfTextAtSize(etqTotal, 9) - 8, y, size: 9, font: boldFont })
    page.drawText(sanitizarPdf(totalTxt), {
        x: MARGIN + anchoHastaTotal - PAD - boldFont.widthOfTextAtSize(sanitizarPdf(totalTxt), 9), y, size: 9, font: boldFont, color: CLR_TOTAL,
    })

    // ── Pie: número de página ────────────────────────────────────────────
    const paginas = pdfDoc.getPages()
    paginas.forEach((p, i) => {
        const t = `Página ${i + 1} de ${paginas.length}`
        p.drawText(t, { x: PAGE_W - MARGIN - font.widthOfTextAtSize(t, 7.5), y: MARGIN - 12, size: 7.5, font, color: CLR_ETIQUETA })
        p.drawText(sanitizarPdf(`Registro de compra ${documento}`), { x: MARGIN, y: MARGIN - 12, size: 7.5, font, color: CLR_ETIQUETA })
    })

    return pdfDoc.save()
}
