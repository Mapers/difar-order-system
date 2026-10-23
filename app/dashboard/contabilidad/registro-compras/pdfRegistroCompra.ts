import { PDFDocument, StandardFonts, rgb, RGB } from 'pdf-lib'
import { cargarLogoPdf, dibujarCabeceraPdf, sanitizarPdf, truncarPdf } from '@/components/reporte/pdfCabecera'
import { TEMAS_PDF } from '../movimiento-subcuenta/pdfSubcuenta'

export type ColumnaOpcionalCompra = 'und' | 'punit' | 'lote' | 'vence'

export interface OpcionesPdfCompra {
    titulo:       string
    nota:         string
    /** Color principal en hex, p. ej. '#163161'. */
    color:        string
    orientacion:  'horizontal' | 'vertical'
    tamanoLetra:  'pequena' | 'normal' | 'grande'
    columnas:     Record<ColumnaOpcionalCompra, boolean>
    zebra:        boolean
    mostrarDatos: boolean
}

export const OPCIONES_PDF_COMPRA_DEFECTO: OpcionesPdfCompra = {
    titulo:       'REGISTRO DE COMPRA',
    nota:         '',
    color:        TEMAS_PDF[0].color,
    orientacion:  'vertical',
    tamanoLetra:  'normal',
    columnas:     { und: true, punit: true, lote: true, vence: true },
    zebra:        true,
    mostrarDatos: true,
}

const MARGIN = 30
const PAD    = 3

const CLR_ETIQUETA = rgb(0.45, 0.45, 0.45)
const CLR_TEXTO    = rgb(0.08, 0.08, 0.08)

interface Columna {
    clave: 'n' | 'articulo' | ColumnaOpcionalCompra | 'cantidad' | 'total'
    h:     string
    w:     number
    align: 'left' | 'right' | 'center'
}

// Anchos base para A4 vertical (535 pt de contenido); el artículo se queda con el sobrante.
const COLUMNAS: Columna[] = [
    { clave: 'n',        h: '#',        w: 20,  align: 'center' },
    { clave: 'articulo', h: 'Artículo', w: 0,   align: 'left'   },
    { clave: 'und',      h: 'Und',      w: 34,  align: 'center' },
    { clave: 'cantidad', h: 'Cantidad', w: 50,  align: 'right'  },
    { clave: 'punit',    h: 'P. unit.', w: 60,  align: 'right'  },
    { clave: 'total',    h: 'Total',    w: 66,  align: 'right'  },
    { clave: 'lote',     h: 'Lote',     w: 70,  align: 'center' },
    { clave: 'vence',    h: 'Vence',    w: 56,  align: 'center' },
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

const hexARgb = (hex: string): RGB => {
    const h = hex.replace('#', '')
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
    return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}
const aclarar = (c: RGB, t: number): RGB =>
    rgb(c.red + (1 - c.red) * t, c.green + (1 - c.green) * t, c.blue + (1 - c.blue) * t)

/**
 * PDF del documento de compra con el mismo formato que el resto de reportes
 * (cabecera con logo, tabla con encabezado de color y filas alternadas).
 * `nombreTipo` traduce el código del tipo de documento con el catálogo ya cargado.
 */
export async function generarPdfRegistroCompra(
    filas: Record<string, unknown>[],
    nombreTipo: (cod: string) => string,
    op: OpcionesPdfCompra = OPCIONES_PDF_COMPRA_DEFECTO,
): Promise<Uint8Array> {
    const pdfDoc   = await PDFDocument.create()
    const font     = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const logo     = await cargarLogoPdf(pdfDoc)

    const [PAGE_W, PAGE_H] = op.orientacion === 'horizontal' ? [841.89, 595.28] : [595.28, 841.89]
    const CONTENT_W = PAGE_W - MARGIN * 2
    const escala = op.tamanoLetra === 'pequena' ? 0.88 : op.tamanoLetra === 'grande' ? 1.15 : 1
    const fs = (n: number) => n * escala
    const ROW_H = Math.round(15 * escala)

    const principal = hexARgb(op.color)
    const alterna   = aclarar(principal, 0.94)
    const caja      = aclarar(principal, 0.95)
    const borde     = aclarar(principal, 0.8)

    // Columnas visibles; las fijas crecen con la letra y el artículo se queda con el resto.
    const cols = COLUMNAS
        .filter(x => !(x.clave in op.columnas) || op.columnas[x.clave as ColumnaOpcionalCompra])
        .map(x => ({ ...x, w: x.w * escala }))
    const fijo = cols.reduce((a, x) => a + x.w, 0)
    cols.find(x => x.clave === 'articulo')!.w = Math.max(120, CONTENT_W - fijo)
    // Si no alcanza (letra grande en vertical), se reparte proporcionalmente.
    const totalW = cols.reduce((a, x) => a + x.w, 0)
    if (totalW > CONTENT_W) cols.forEach(x => { x.w = x.w * CONTENT_W / totalW })

    const c = filas[0]
    const moneda = simbolo(txt(c.Moneda))
    const documento = `${nombreTipo(txt(c.TipoDoc))} ${txt(c.SerieDoc)}-${txt(c.NumeroDoc)}`
    const total = filas.reduce((a, r) => a + Number(r.TotalItem ?? 0), 0)
    const totalTxt = `${moneda} ${num(total)}`
    const ahora = new Date()
    const impreso = `Impreso: ${ahora.toLocaleDateString('es-PE')} ${ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`

    let page = pdfDoc.addPage([PAGE_W, PAGE_H])
    let y = 0

    const cabecera = () => {
        y = dibujarCabeceraPdf({
            page, font, boldFont, logo,
            pageWidth: PAGE_W, pageHeight: PAGE_H, margin: MARGIN,
            subtitulo: op.titulo.trim() || OPCIONES_PDF_COMPRA_DEFECTO.titulo,
            razonSocial: txt(c.NombreRazSocial) || undefined,
            ruc: txt(c.RUC) || undefined,
            infoDerecha: `Clave ${txt(c.Clave)}`,
            infoDerechaSec: impreso,
            filtros: op.nota.trim() || undefined,
        })
    }

    const filaTabla = (celdas: string[], encabezado: boolean, fondo: boolean) => {
        if (encabezado || fondo) {
            page.drawRectangle({
                x: MARGIN, y: y - ROW_H + 4, width: CONTENT_W, height: ROW_H,
                color: encabezado ? principal : alterna,
            })
        }
        const f = encabezado ? boldFont : font
        const size = fs(encabezado ? 7.5 : 8)
        let x = MARGIN
        cols.forEach((col, i) => {
            const t = truncarPdf(celdas[i] ?? '', col.w - PAD * 2, size, f)
            const w = f.widthOfTextAtSize(t, size)
            const tx = col.align === 'right' ? x + col.w - w - PAD
                : col.align === 'center' ? x + (col.w - w) / 2 : x + PAD
            page.drawText(t, { x: tx, y: y - ROW_H + 4 + (ROW_H - size) / 2 + 1, size, font: f, color: encabezado ? rgb(1, 1, 1) : CLR_TEXTO })
            x += col.w
        })
        y -= ROW_H
    }

    const celdas = (r: Record<string, unknown>, i: number) => cols.map(col => {
        switch (col.clave) {
            case 'n':        return String(i + 1)
            case 'articulo': return txt(r.NombreItem)
            case 'und':      return txt(r.Und)
            case 'cantidad': return num(r.Cantidad)
            case 'punit':    return num(r.PUItem)
            case 'total':    return num(r.TotalItem)
            case 'lote':     return txt(r.Lote)
            case 'vence':    return fecha(r.VctoArt)
        }
    })

    cabecera()

    // ── Datos del documento ──────────────────────────────────────────────
    if (op.mostrarDatos) {
        const cajaH = 92 * escala
        page.drawRectangle({
            x: MARGIN, y: y - cajaH, width: CONTENT_W, height: cajaH,
            color: caja, borderColor: borde, borderWidth: 0.8,
        })
        page.drawText(sanitizarPdf(documento), { x: MARGIN + 12, y: y - fs(22), size: fs(14), font: boldFont, color: principal })
        page.drawText('IMPORTE TOTAL', {
            x: PAGE_W - MARGIN - 12 - font.widthOfTextAtSize('IMPORTE TOTAL', fs(7)), y: y - fs(12), size: fs(7), font, color: CLR_ETIQUETA,
        })
        page.drawText(sanitizarPdf(totalTxt), {
            x: PAGE_W - MARGIN - 12 - boldFont.widthOfTextAtSize(sanitizarPdf(totalTxt), fs(13)), y: y - fs(26), size: fs(13), font: boldFont, color: principal,
        })

        const meta: [string, string][] = [
            ['Proveedor', txt(c.Nombre)],
            ['Fecha de emisión', fecha(c.Fecha_Emision)],
            ['Condición', txt(c.CondicionDoc)],
            ['Moneda', moneda === 'S/' ? 'SOLES (S/)' : moneda === 'US$' ? 'DÓLARES (US$)' : txt(c.Moneda)],
            ['Almacén', txt(c.Almacen)],
            ['Ítems', String(filas.length)],
        ]
        const q = CONTENT_W / 4
        const posiciones: [number, number, number][] = [
            [MARGIN + 12,    y - fs(44), q * 2 - 24],
            [MARGIN + q * 2, y - fs(44), q - 12],
            [MARGIN + q * 3, y - fs(44), q - 12],
            [MARGIN + 12,    y - fs(70), q - 18],
            [MARGIN + q,     y - fs(70), q - 12],
            [MARGIN + q * 2, y - fs(70), q - 12],
        ]
        meta.forEach(([etq, val], i) => {
            const [mx, my, ancho] = posiciones[i]
            page.drawText(etq.toUpperCase(), { x: mx, y: my, size: fs(6.5), font, color: CLR_ETIQUETA })
            page.drawText(truncarPdf(val || '-', ancho, fs(9), boldFont), { x: mx, y: my - fs(11), size: fs(9), font: boldFont, color: CLR_TEXTO })
        })
        y -= cajaH + 16
    } else {
        page.drawText(sanitizarPdf(`${documento} · ${txt(c.Nombre)} · ${fecha(c.Fecha_Emision)}`), {
            x: MARGIN, y: y - 4, size: fs(10), font: boldFont, color: principal,
        })
        y -= fs(20)
    }

    // ── Detalle ──────────────────────────────────────────────────────────
    filaTabla(cols.map(x => x.h), true, false)
    filas.forEach((r, i) => {
        if (y - ROW_H < MARGIN + 50) {
            page = pdfDoc.addPage([PAGE_W, PAGE_H])
            cabecera()
            filaTabla(cols.map(x => x.h), true, false)
        }
        filaTabla(celdas(r, i), false, op.zebra && i % 2 === 1)
    })

    // ── Total, alineado con la columna Total ─────────────────────────────
    y -= 4
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: principal })
    y -= 16
    let finTotal = MARGIN
    for (const col of cols) { finTotal += col.w; if (col.clave === 'total') break }
    const anchoTotal = boldFont.widthOfTextAtSize(sanitizarPdf(totalTxt), fs(9))
    page.drawText('TOTAL', { x: finTotal - PAD - anchoTotal - 12 - boldFont.widthOfTextAtSize('TOTAL', fs(9)), y, size: fs(9), font: boldFont })
    page.drawText(sanitizarPdf(totalTxt), { x: finTotal - PAD - anchoTotal, y, size: fs(9), font: boldFont, color: principal })

    // ── Pie: número de página ────────────────────────────────────────────
    const paginas = pdfDoc.getPages()
    paginas.forEach((p, i) => {
        const t = `Página ${i + 1} de ${paginas.length}`
        p.drawText(t, { x: PAGE_W - MARGIN - font.widthOfTextAtSize(t, 7.5), y: MARGIN - 12, size: 7.5, font, color: CLR_ETIQUETA })
        p.drawText(sanitizarPdf(`Registro de compra ${documento}`), { x: MARGIN, y: MARGIN - 12, size: 7.5, font, color: CLR_ETIQUETA })
    })

    return pdfDoc.save()
}
