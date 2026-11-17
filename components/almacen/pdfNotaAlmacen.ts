import { StandardFonts, rgb } from 'pdf-lib'
import { cargarLogoPdf, dibujarCabeceraPdf, sanitizarPdf, truncarPdf } from '@/components/reporte/pdfCabecera'
import { aclarar, crearPdfReporte, hexARgb, OpcionesPdfReporte } from '@/components/reporte/pdfOpciones'

/**
 * PDF de la Nota de Ingreso / Salida de Almacén con el mismo diseño de los PDF de Contabilidad
 * (Registro de Compra): cabecera con logo y empresa, tarjeta con el documento en grande y los datos
 * con su etiqueta arriba, tabla con encabezado del color principal y numeración, filas alternas,
 * línea de total y pie con el documento y "Página x de y".
 * El contenido es el del informe Access ("Nota Ingreso Almacen" / "Nota Salida Almacen"):
 * Motivo, Documento, Almacén / Nombre / Concepto / Fecha y PRODUCTO · UND. · LOTE · FECHA VCTO. · CANTIDAD.
 */

const MARGIN = 30
const PAD = 3
const CLR_ETIQUETA = rgb(0.45, 0.45, 0.45)
const CLR_TEXTO = rgb(0.08, 0.08, 0.08)

interface Columna { h: string; w: number; align: 'left' | 'right' | 'center' }

export async function generarPdfNotaAlmacen(filas: any[], esSalida: boolean, op: OpcionesPdfReporte): Promise<Uint8Array> {
    const c = filas[0] ?? {}
    const pdfDoc = await crearPdfReporte(op.tamanoLetra)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const logo = await cargarLogoPdf(pdfDoc)

    const PAGE_W = 595.28, PAGE_H = 841.89
    const CONTENT_W = PAGE_W - MARGIN * 2
    const ROW_H = 15

    const principal = hexARgb(op.color)
    const alterna = aclarar(principal, 0.94)
    const caja = aclarar(principal, 0.95)
    const borde = aclarar(principal, 0.8)

    const txt = (v: any) => (v == null ? '' : String(v).trim())
    const num = (v: any) => Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const fecha = (v: any) => {
        if (!v) return ''
        const s = String(typeof v === 'string' ? v : new Date(v).toISOString()).slice(0, 10)
        return /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : s
    }
    const cantidad = (f: any) => Number(esSalida ? f.Cantidad_Sal : f.Cantidad_Ing) || 0
    const lote = (f: any) => txt(esSalida ? (f.LOTE2 ?? f.Lote) : f.Lote)

    const documento = txt(c.Documento)
    const tipo = esSalida ? 'NOTA DE SALIDA' : 'NOTA DE INGRESO'
    const nombreCP = txt(c.ClienteProveedor).replace(/^[^:]*:\s*/, '')
    const totalCant = filas.reduce((a, f) => a + cantidad(f), 0)
    const ahora = new Date()
    const impreso = `Impreso: ${ahora.toLocaleDateString('es-PE')} ${ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`

    // # · PRODUCTO · UND. · LOTE · FECHA VCTO. · CANTIDAD (el producto se queda con el sobrante)
    const cols: Columna[] = [
        { h: '#', w: 20, align: 'center' },
        { h: 'Producto', w: 0, align: 'left' },
        { h: 'Und', w: 34, align: 'center' },
        { h: 'Lote', w: 76, align: 'center' },
        { h: 'Fecha vcto.', w: 62, align: 'center' },
        { h: 'Cantidad', w: 60, align: 'right' },
    ]
    cols[1].w = CONTENT_W - cols.reduce((a, x) => a + x.w, 0)

    let page = pdfDoc.addPage([PAGE_W, PAGE_H])
    let y = 0

    const cabecera = () => {
        y = dibujarCabeceraPdf({
            page, font, boldFont: bold, logo,
            pageWidth: PAGE_W, pageHeight: PAGE_H, margin: MARGIN,
            subtitulo: op.titulo.trim() || tipo,
            razonSocial: txt(c.NombreRazSocial) || undefined,
            ruc: txt(c.RUC) || undefined,
            infoDerecha: documento,
            infoDerechaSec: impreso,
            filtros: op.nota.trim() || undefined,
        })
    }

    const filaTabla = (celdas: string[], encabezado: boolean, fondo: boolean) => {
        if (encabezado || fondo) {
            page.drawRectangle({ x: MARGIN, y: y - ROW_H + 4, width: CONTENT_W, height: ROW_H, color: encabezado ? principal : alterna })
        }
        const f = encabezado ? bold : font
        const size = encabezado ? 7.5 : 8
        let x = MARGIN
        cols.forEach((col, i) => {
            const t = truncarPdf(celdas[i] ?? '', col.w - PAD * 2, size, f)
            const w = f.widthOfTextAtSize(t, size)
            const tx = col.align === 'right' ? x + col.w - w - PAD : col.align === 'center' ? x + (col.w - w) / 2 : x + PAD
            page.drawText(t, { x: tx, y: y - ROW_H + 4 + (ROW_H - size) / 2 + 1, size, font: f, color: encabezado ? rgb(1, 1, 1) : CLR_TEXTO })
            x += col.w
        })
        y -= ROW_H
    }

    cabecera()

    // ── Datos de la nota ─────────────────────────────────────────────────
    const cajaH = 92
    page.drawRectangle({ x: MARGIN, y: y - cajaH, width: CONTENT_W, height: cajaH, color: caja, borderColor: borde, borderWidth: 0.8 })
    const titulo = sanitizarPdf(`${tipo} ${documento}`.trim())
    page.drawText(truncarPdf(titulo, CONTENT_W - 150, 14, bold), { x: MARGIN + 12, y: y - 22, size: 14, font: bold, color: principal })
    const etqTotal = 'CANTIDAD TOTAL'
    page.drawText(etqTotal, { x: PAGE_W - MARGIN - 12 - font.widthOfTextAtSize(etqTotal, 7), y: y - 12, size: 7, font, color: CLR_ETIQUETA })
    const totalTxt = num(totalCant)
    page.drawText(totalTxt, { x: PAGE_W - MARGIN - 12 - bold.widthOfTextAtSize(totalTxt, 13), y: y - 26, size: 13, font: bold, color: principal })

    const meta: [string, string][] = [
        [esSalida ? 'Cliente / destino' : 'Proveedor / origen', nombreCP],
        ['Fecha', fecha(c.Fecha_Mvto)],
        ['Almacén', txt(c.Almacen)],
        ['Motivo', txt(c.Motivo)],
        ['Concepto', txt(c.Glosa)],
    ]
    const q = CONTENT_W / 4
    const posiciones: [number, number, number][] = [
        [MARGIN + 12, y - 44, q * 2 - 24],
        [MARGIN + q * 2, y - 44, q - 12],
        [MARGIN + q * 3, y - 44, q - 24],
        [MARGIN + 12, y - 70, q * 2 - 24],
        [MARGIN + q * 2, y - 70, q * 2 - 24],
    ]
    meta.forEach(([etq, val], i) => {
        const [mx, my, ancho] = posiciones[i]
        page.drawText(sanitizarPdf(etq.toUpperCase()), { x: mx, y: my, size: 6.5, font, color: CLR_ETIQUETA })
        page.drawText(truncarPdf(val || '-', ancho, 9, bold), { x: mx, y: my - 11, size: 9, font: bold, color: CLR_TEXTO })
    })
    y -= cajaH + 16

    // ── Detalle ──────────────────────────────────────────────────────────
    filaTabla(cols.map(x => x.h), true, false)
    filas.forEach((f, i) => {
        if (y - ROW_H < MARGIN + 50) {
            page = pdfDoc.addPage([PAGE_W, PAGE_H])
            cabecera()
            filaTabla(cols.map(x => x.h), true, false)
        }
        filaTabla([String(i + 1), txt(f.BienesServicios), txt(f.AbrevUnidMed), lote(f), fecha(f.FechaVctoLote), num(cantidad(f))], false, i % 2 === 1)
    })

    // ── Total, alineado con la columna Cantidad ──────────────────────────
    if (y - 30 < MARGIN + 20) { page = pdfDoc.addPage([PAGE_W, PAGE_H]); cabecera() }
    y -= 4
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: principal })
    y -= 16
    const anchoTotal = bold.widthOfTextAtSize(totalTxt, 9)
    const finTotal = PAGE_W - MARGIN
    page.drawText('TOTAL', { x: finTotal - PAD - anchoTotal - 12 - bold.widthOfTextAtSize('TOTAL', 9), y, size: 9, font: bold })
    page.drawText(totalTxt, { x: finTotal - PAD - anchoTotal, y, size: 9, font: bold, color: principal })

    // ── Pie: documento, domicilio y número de página ─────────────────────
    const paginas = pdfDoc.getPages()
    const pieIzq = sanitizarPdf(`${tipo.charAt(0)}${tipo.slice(1).toLowerCase()} ${documento}`.trim())
    const domicilio = txt(c.Domicilio)
    paginas.forEach((p, i) => {
        const t = `Página ${i + 1} de ${paginas.length}`
        p.drawText(sanitizarPdf(t), { x: PAGE_W - MARGIN - font.widthOfTextAtSize(sanitizarPdf(t), 7.5), y: MARGIN - 12, size: 7.5, font, color: CLR_ETIQUETA })
        p.drawText(pieIzq, { x: MARGIN, y: MARGIN - 12, size: 7.5, font, color: CLR_ETIQUETA })
        if (domicilio) {
            const dom = truncarPdf(domicilio, CONTENT_W - 260, 7, font)
            p.drawText(dom, { x: (PAGE_W - font.widthOfTextAtSize(dom, 7)) / 2, y: MARGIN - 12, size: 7, font, color: CLR_ETIQUETA })
        }
    })

    return pdfDoc.save()
}
