import { StandardFonts, rgb } from 'pdf-lib'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cargarLogoPdf, dibujarCabeceraPdf, sanitizarPdf, truncarPdf } from '@/components/reporte/pdfCabecera'
import { aclarar, crearPdfReporte, hexARgb, OpcionesPdfReporte } from '@/components/reporte/pdfOpciones'

/**
 * PDF de la Nota de Ingreso / Salida de Almacén con el formato de los reportes de la web
 * (logo, razón social, RUC, colores y tamaño del modal de vista previa) y el contenido del
 * informe Access ("Nota Ingreso Almacen" / "Nota Salida Almacen"): Motivo, Documento,
 * Almacen / Nombre / Concepto / Fecha y las columnas PRODUCTO · UND. · LOTE · FECHA VCTO. · CANTIDAD.
 * Pie en cada página: fecha de impresión, domicilio y "Página x de y".
 */
export async function generarPdfNotaAlmacen(filas: any[], esSalida: boolean, op: OpcionesPdfReporte): Promise<Uint8Array> {
    const c = filas[0] ?? {}
    const principal = hexARgb(op.color)
    const pdfDoc = await crearPdfReporte(op.tamanoLetra)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const logo = await cargarLogoPdf(pdfDoc)

    const W = 595.28, H = 841.89, M = 40, ancho = W - M * 2
    const gris = rgb(0.35, 0.35, 0.35)
    const fmt = (v: any) => Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const dmy = (v: any) => {
        if (!v) return ''
        const s = String(typeof v === 'string' ? v : new Date(v).toISOString()).slice(0, 10)
        return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`
    }
    const nombreCP = String(c.ClienteProveedor ?? '').replace(/^[^:]*:\s*/, '')

    // columnas: PRODUCTO · UND. · LOTE · FECHA VCTO. · CANTIDAD (cantidad al final, como Access)
    const cols = [245, 45, 80, 70, ancho - 245 - 45 - 80 - 70]
    const titulos = ['PRODUCTO', 'UND.', 'LOTE', 'FECHA VCTO.', 'CANTIDAD']

    let page = pdfDoc.addPage([W, H])
    let y = 0

    const cabecera = () => {
        y = dibujarCabeceraPdf({
            page, font, boldFont: bold, logo, pageWidth: W, pageHeight: H, margin: M,
            subtitulo: op.titulo, razonSocial: c.NombreRazSocial, ruc: c.RUC,
            infoDerecha: c.Documento ?? '', infoDerechaSec: `Fecha: ${dmy(c.Fecha_Mvto)}`,
            filtros: op.nota.trim() || undefined,
        })
    }
    const encabezadoTabla = () => {
        page.drawRectangle({ x: M, y: y - 5, width: ancho, height: 18, color: aclarar(principal, 0.85) })
        let x = M
        titulos.forEach((t, i) => {
            const tx = i === 4 ? x + cols[i] - bold.widthOfTextAtSize(t, 8) - 4 : x + 4
            page.drawText(t, { x: tx, y, size: 8, font: bold, color: principal })
            x += cols[i]
        })
        y -= 18
    }
    const saltoSiFalta = (alto: number) => {
        if (y - alto < M + 30) { page = pdfDoc.addPage([W, H]); cabecera(); encabezadoTabla() }
    }

    // ---------------------------------------------------------------- cabecera de la nota
    cabecera()
    const motivo = sanitizarPdf(c.Motivo ?? '')
    page.drawText(motivo, { x: (W - bold.widthOfTextAtSize(motivo, 11)) / 2, y, size: 11, font: bold, color: principal })
    y -= 20

    const datos: [string, string][] = [
        ['Almacen:', c.Almacen ?? ''], ['Fecha:', dmy(c.Fecha_Mvto)],
        [esSalida ? 'Nombre:' : 'Nombre:', nombreCP], ['Concepto:', c.Glosa ?? ''],
    ]
    const altoCaja = 44
    page.drawRectangle({ x: M, y: y - altoCaja + 10, width: ancho, height: altoCaja, color: aclarar(principal, 0.95), borderColor: aclarar(principal, 0.75), borderWidth: 0.6 })
    const colX = [M + 10, M + ancho / 2 + 10]
    datos.forEach(([k, v], i) => {
        const cx = colX[i % 2], cy = y - Math.floor(i / 2) * 16
        page.drawText(k, { x: cx, y: cy, size: 8.5, font: bold, color: gris })
        page.drawText(truncarPdf(v, ancho / 2 - 75, 8.5, font), { x: cx + 55, y: cy, size: 8.5, font })
    })
    y -= altoCaja + 6

    // ---------------------------------------------------------------- detalle
    encabezadoTabla()
    let total = 0
    filas.forEach((f, idx) => {
        saltoSiFalta(14)
        if (idx % 2 === 1) page.drawRectangle({ x: M, y: y - 4, width: ancho, height: 14, color: aclarar(principal, 0.97) })
        const cant = Number(esSalida ? f.Cantidad_Sal : f.Cantidad_Ing) || 0
        total += cant
        const valores = [f.BienesServicios ?? '', f.AbrevUnidMed ?? '', esSalida ? (f.LOTE2 ?? f.Lote ?? '') : (f.Lote ?? ''), dmy(f.FechaVctoLote), fmt(cant)]
        let x = M
        valores.forEach((v, i) => {
            const t = truncarPdf(String(v), cols[i] - 8, 8, font)
            const tx = i === 4 ? x + cols[i] - font.widthOfTextAtSize(t, 8) - 4 : x + 4
            page.drawText(t, { x: tx, y, size: 8, font })
            x += cols[i]
        })
        page.drawLine({ start: { x: M, y: y - 4.5 }, end: { x: W - M, y: y - 4.5 }, thickness: 0.4, color: rgb(0.86, 0.86, 0.86) })
        y -= 14
    })
    saltoSiFalta(22)
    y -= 4
    page.drawRectangle({ x: M, y: y - 5, width: ancho, height: 18, color: aclarar(principal, 0.9) })
    const etiquetaTotal = `TOTAL (${filas.length} ítem${filas.length === 1 ? '' : 's'})`
    page.drawText(sanitizarPdf(etiquetaTotal), { x: M + 4, y, size: 8.5, font: bold, color: principal })
    const txtTotal = fmt(total)
    page.drawText(txtTotal, { x: W - M - bold.widthOfTextAtSize(txtTotal, 8.5) - 4, y, size: 8.5, font: bold, color: principal })

    // ---------------------------------------------------------------- pie en todas las páginas
    const paginas = pdfDoc.getPages()
    const fechaLarga = sanitizarPdf(format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }))
    const domicilio = c.Domicilio ?? ''
    paginas.forEach((p, i) => {
        p.drawLine({ start: { x: M, y: M - 2 }, end: { x: W - M, y: M - 2 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
        p.drawText(fechaLarga, { x: M, y: M - 14, size: 7.5, font, color: gris })
        const pag = `Página ${i + 1} de ${paginas.length}`
        p.drawText(sanitizarPdf(pag), { x: W - M - font.widthOfTextAtSize(sanitizarPdf(pag), 7.5), y: M - 14, size: 7.5, font, color: gris })
        const dom = truncarPdf(domicilio, ancho - 220, 7, font)
        p.drawText(dom, { x: (W - font.widthOfTextAtSize(dom, 7)) / 2, y: M - 14, size: 7, font, color: gris })
    })
    return pdfDoc.save()
}
