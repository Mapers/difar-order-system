import { PDFFont, PDFPage, RGB, StandardFonts, rgb } from 'pdf-lib'
import { EMPRESA, cargarLogoPdf, sanitizarPdf, truncarPdf } from '@/components/reporte/pdfCabecera'
import { aclarar, crearPdfReporte, hexARgb, type OpcionesPdfReporte } from '@/components/reporte/pdfOpciones'
import { fecha, porcentaje, soles, type ComprobanteMes, type ResumenMes, type VistaMes } from '@/app/types/cobranza-ventas-mes'

/**
 * PDF de la Cobranza de Ventas por Mes: cabecera en banda de color, tarjetas
 * de resumen redondeadas, barra de avance y la tabla en un contenedor
 * redondeado con la situación de cada comprobante en "pastillas" de color.
 */

export interface DatosPdfCobranza {
    vista: VistaMes
    filas: ComprobanteMes[]
    resumen: ResumenMes
    periodo: string
    corte: string
    filtros: string
}

const [W, H] = [841.89, 595.28] // A4 horizontal
const M = 28
const UTIL = W - M * 2

const GRIS = rgb(0.42, 0.44, 0.48)
const TINTA = rgb(0.1, 0.11, 0.14)
const BORDE = rgb(0.86, 0.88, 0.91)
const BLANCO = rgb(1, 1, 1)
const VERDE = rgb(0.02, 0.47, 0.34)
const ROJO = rgb(0.73, 0.11, 0.11)
const AMBAR = rgb(0.65, 0.4, 0.02)
const AZUL = rgb(0.03, 0.4, 0.62)

type Esquinas = { si?: boolean; sd?: boolean; ii?: boolean; id?: boolean }

/**
 * Rectángulo con esquinas redondeadas. (x, y) es la esquina inferior
 * izquierda, como en pdf-lib; se puede redondear solo algunas esquinas.
 */
function caja(page: PDFPage, x: number, y: number, w: number, h: number, r: number,
    op: { color?: RGB; borde?: RGB; grosor?: number; esquinas?: Esquinas } = {}) {
    const e = { si: true, sd: true, ii: true, id: true, ...op.esquinas }
    const rr = (on?: boolean) => (on ? Math.min(r, w / 2, h / 2) : 0)
    const [a, b, c, d] = [rr(e.si), rr(e.sd), rr(e.id), rr(e.ii)]
    // drawSvgPath usa coordenadas con y hacia abajo desde (x, y + h).
    const path = [
        `M ${a} 0`, `H ${w - b}`, b ? `Q ${w} 0 ${w} ${b}` : '', `V ${h - c}`, c ? `Q ${w} ${h} ${w - c} ${h}` : '',
        `H ${d}`, d ? `Q 0 ${h} 0 ${h - d}` : '', `V ${a}`, a ? `Q 0 0 ${a} 0` : '', 'Z',
    ].filter(Boolean).join(' ')
    page.drawSvgPath(path, { x, y: y + h, color: op.color, borderColor: op.borde, borderWidth: op.borde ? (op.grosor ?? 0.8) : 0 })
}

/** Pastilla de color con texto (situación del comprobante). */
function pastilla(page: PDFPage, texto: string, x: number, yBase: number, f: PDFFont, color: RGB) {
    const size = 6.6
    const t = sanitizarPdf(texto)
    const w = f.widthOfTextAtSize(t, size) + 10
    caja(page, x, yBase - 3.2, w, 11, 5.5, { color: aclarar(color, 0.86) })
    page.drawText(t, { x: x + 5, y: yBase, size, font: f, color })
}

type Columna = {
    t: string
    ancho: number
    derecha?: boolean
    dibujar: (c: ComprobanteMes, x: number, y: number, ancho: number, f: { n: PDFFont; b: PDFFont }, page: PDFPage) => void
}

const texto = (valor: (c: ComprobanteMes) => string, opciones: { negrita?: boolean; color?: RGB; derecha?: boolean; sub?: (c: ComprobanteMes) => string } = {}) =>
    (c: ComprobanteMes, x: number, y: number, ancho: number, f: { n: PDFFont; b: PDFFont }, page: PDFPage) => {
        const fuente = opciones.negrita ? f.b : f.n
        const principal = truncarPdf(valor(c), ancho - 8, 7.4, fuente)
        const w = fuente.widthOfTextAtSize(principal, 7.4)
        const sub = opciones.sub?.(c)
        page.drawText(principal, { x: opciones.derecha ? x + ancho - 5 - w : x + 5, y: sub ? y + 3.6 : y, size: 7.4, font: fuente, color: opciones.color || TINTA })
        if (sub) {
            const s = truncarPdf(sub, ancho - 8, 6.2, f.n)
            const ws = f.n.widthOfTextAtSize(s, 6.2)
            page.drawText(s, { x: opciones.derecha ? x + ancho - 5 - ws : x + 5, y: y - 5, size: 6.2, font: f.n, color: GRIS })
        }
    }

function situacion(c: ComprobanteMes): [string, RGB] {
    if (c.diasVencido > 30) return [`Vencido ${c.diasVencido} d`, ROJO]
    if (c.diasVencido > 0) return [`Vencido ${c.diasVencido} d`, AMBAR]
    if (c.diasParaVencer === 0) return ['Vence hoy', AZUL]
    return [`Por vencer ${c.diasParaVencer ?? '-'} d`, AZUL]
}

function columnas(vista: VistaMes): Columna[] {
    const cliente = texto(c => c.nombreComercial || c.cliente, { negrita: true, sub: c => [`RUC ${c.ruc}`, c.zona].filter(Boolean).join(' · ') })
    const comprobante = texto(c => c.comprobante, { negrita: true, color: rgb(0.1, 0.3, 0.75), sub: c => (c.contado ? 'Contado' : c.condicion) })
    const comunes: Columna[] = [
        { t: 'Comprobante', ancho: 82, dibujar: comprobante },
        { t: 'Cliente', ancho: 0, dibujar: cliente },
        { t: 'Vendedor', ancho: 104, dibujar: texto(c => c.vendedor) },
    ]
    if (vista === 'faltante') return [
        ...comunes,
        { t: 'Emisión', ancho: 54, dibujar: texto(c => fecha(c.emision)) },
        { t: 'Vence', ancho: 54, dibujar: texto(c => fecha(c.vencimiento)) },
        { t: 'Situación', ancho: 76, dibujar: (c, x, y, _w, f, p) => { const [t, col] = situacion(c); pastilla(p, t, x + 5, y, f.b, col) } },
        { t: 'Total', ancho: 66, derecha: true, dibujar: texto(c => soles(c.total, c.moneda), { derecha: true }) },
        { t: 'Abonado', ancho: 66, derecha: true, dibujar: texto(c => soles(c.abonado, c.moneda), { derecha: true, color: VERDE }) },
        { t: 'Saldo', ancho: 70, derecha: true, dibujar: texto(c => soles(c.saldo, c.moneda), { derecha: true, negrita: true, color: ROJO }) },
    ]
    return [
        ...comunes,
        { t: 'Emisión', ancho: 54, dibujar: texto(c => fecha(c.emision)) },
        { t: 'Pagado el', ancho: 56, dibujar: texto(c => fecha(c.ultimoPago)) },
        { t: 'Tardó', ancho: 62, dibujar: (c, x, y, _w, f, p) => { if (c.tardo == null) return; pastilla(p, c.tardo === 0 ? 'Al momento' : `${c.tardo} días`, x + 5, y, f.b, c.atrasoPago ? AMBAR : VERDE) } },
        { t: 'Cómo se cobró', ancho: 150, dibujar: texto(c => c.formaCobro || 'Sin detalle del pago') },
        { t: 'Importe', ancho: 70, derecha: true, dibujar: texto(c => soles(c.total, c.moneda), { derecha: true, negrita: true, color: VERDE }) },
    ]
}

export async function generarPdfCobranza(d: DatosPdfCobranza, op: OpcionesPdfReporte): Promise<Uint8Array> {
    const pdf = await crearPdfReporte(op.tamanoLetra)
    const n = await pdf.embedFont(StandardFonts.Helvetica)
    const b = await pdf.embedFont(StandardFonts.HelveticaBold)
    const logo = await cargarLogoPdf(pdf)
    const color = hexARgb(op.color)
    const f = { n, b }

    const cols = columnas(d.vista)
    const fijo = cols.reduce((s, c) => s + c.ancho, 0)
    cols.forEach(c => { if (!c.ancho) c.ancho = UTIL - fijo })

    const titulo = sanitizarPdf(op.titulo || (d.vista === 'faltante' ? 'COMPROBANTES CON DEUDA' : 'COMPROBANTES PAGADOS'))
    const paginas: PDFPage[] = []
    let page!: PDFPage
    let y = 0

    // ── Cabecera ─────────────────────────────────────────────────────────────
    const cabecera = (completa: boolean) => {
        const alto = completa ? 66 : 40
        caja(page, M, H - M - alto, UTIL, alto, 10, { color })
        let x = M + 12
        if (logo) {
            // La tarjeta blanca del logo queda centrada en la banda.
            const lh = alto - (completa ? 22 : 14)
            const lw = (logo.width / logo.height) * lh
            const centro = H - M - alto / 2
            caja(page, x, centro - (lh + 10) / 2, lw + 12, lh + 10, 7, { color: BLANCO })
            page.drawImage(logo, { x: x + 6, y: centro - lh / 2, width: lw, height: lh })
            x += lw + 26
        }
        page.drawText(titulo, { x, y: H - M - (completa ? 26 : 23), size: completa ? 15 : 11.5, font: b, color: BLANCO })
        page.drawText(sanitizarPdf(`Cobranza de las ventas de ${d.periodo}`), { x, y: H - M - (completa ? 41 : 34), size: completa ? 8.5 : 7.5, font: n, color: aclarar(color, 0.75) })
        if (completa && (d.filtros || op.nota)) {
            page.drawText(truncarPdf([d.filtros, op.nota].filter(Boolean).join(' · '), 420, 7.5, n), { x, y: H - M - 54, size: 7.5, font: n, color: aclarar(color, 0.75) })
        }
        // En las páginas siguientes la banda es más baja: solo empresa y corte.
        const derecha = completa
            ? [EMPRESA.nombre, `RUC ${EMPRESA.ruc}`, `Cobranza al ${fecha(d.corte)}`]
            : [EMPRESA.nombre, `Cobranza al ${fecha(d.corte)}`]
        derecha.forEach((t, i) => {
            const s = sanitizarPdf(t)
            const fuente = i === 0 ? b : n
            const tam = i === 0 ? 8.5 : 7.5
            page.drawText(s, { x: W - M - 12 - fuente.widthOfTextAtSize(s, tam), y: H - M - (completa ? 22 : 17) - i * 11, size: tam, font: fuente, color: i === 0 ? BLANCO : aclarar(color, 0.75) })
        })
        return H - M - alto - 12
    }

    // ── Tarjetas de resumen y barra de avance (solo en la primera página) ────
    const resumen = () => {
        const r = d.resumen
        const total = r.ventas.montos.PEN
        const tarjetas: [string, string, string, RGB][] = [
            ['VENTAS', soles(total), `${r.ventas.cantidad} comprobantes emitidos`, color],
            ['COBRADO', soles(r.cobrado.montos.PEN), `${porcentaje(r.cobrado.montos.PEN, total)} · ${r.cobrado.pagados} comprobantes pagados`, VERDE],
            ['FALTANTE', soles(r.faltante.montos.PEN), `${soles(r.faltante.vencido.montos.PEN)} vencido · ${soles(r.faltante.porVencer.montos.PEN)} por vencer`, ROJO],
        ]
        const gap = 10
        const ancho = (UTIL - gap * 2) / 3
        const alto = 54
        tarjetas.forEach(([t, valor, sub, col], i) => {
            const x = M + i * (ancho + gap)
            caja(page, x, y - alto, ancho, alto, 9, { color: BLANCO, borde: BORDE })
            caja(page, x, y - alto, 4, alto, 2, { color: col, esquinas: { si: true, ii: true, sd: false, id: false } })
            page.drawText(t, { x: x + 14, y: y - 15, size: 7, font: b, color: GRIS })
            page.drawText(sanitizarPdf(valor), { x: x + 14, y: y - 33, size: 15, font: b, color: col })
            page.drawText(truncarPdf(sub, ancho - 24, 7, n), { x: x + 14, y: y - 45, size: 7, font: n, color: GRIS })
        })
        y -= alto + 12

        const base = r.cobrado.montos.PEN + r.faltante.vencido.montos.PEN + r.faltante.porVencer.montos.PEN || 1
        const tramos: [number, RGB, string][] = [
            [r.cobrado.montos.PEN, VERDE, 'Cobrado'], [r.faltante.vencido.montos.PEN, ROJO, 'Vencido'], [r.faltante.porVencer.montos.PEN, rgb(0.96, 0.7, 0.1), 'Por vencer'],
        ]
        caja(page, M, y - 7, UTIL, 7, 3.5, { color: rgb(0.93, 0.94, 0.96) })
        let x = M
        tramos.forEach(([v, col], i) => {
            const w = (v / base) * UTIL
            if (w < 0.5) return
            caja(page, x, y - 7, w, 7, 3.5, { color: col, esquinas: { si: i === 0, ii: i === 0, sd: i === tramos.length - 1, id: i === tramos.length - 1 } })
            x += w
        })
        y -= 17
        let lx = M
        tramos.forEach(([v, col, t]) => {
            caja(page, lx, y - 1, 6, 6, 1.5, { color: col })
            const s = sanitizarPdf(`${t} ${porcentaje(v, base)}`)
            page.drawText(s, { x: lx + 9, y, size: 7, font: n, color: GRIS })
            lx += n.widthOfTextAtSize(s, 7) + 22
        })
        y -= 16
    }

    // ── Tabla ────────────────────────────────────────────────────────────────
    const FILA = 21
    const CAB = 18
    const encabezado = () => {
        caja(page, M, y - CAB, UTIL, CAB, 8, { color, esquinas: { si: true, sd: true, ii: false, id: false } })
        let x = M
        cols.forEach(c => {
            const t = sanitizarPdf(c.t.toUpperCase())
            const w = b.widthOfTextAtSize(t, 6.6)
            page.drawText(t, { x: c.derecha ? x + c.ancho - 5 - w : x + 5, y: y - 12, size: 6.6, font: b, color: BLANCO })
            x += c.ancho
        })
        y -= CAB
    }
    let inicioTabla = 0
    const cerrarTabla = () => {
        // Contorno redondeado alrededor de la tabla de esta página.
        caja(page, M, y, UTIL, inicioTabla - y, 8, { borde: BORDE, grosor: 0.8 })
    }
    const nuevaPagina = (primera: boolean) => {
        page = pdf.addPage([W, H])
        paginas.push(page)
        y = cabecera(primera)
        if (primera) resumen()
        inicioTabla = y
        encabezado()
    }

    nuevaPagina(true)
    d.filas.forEach((c, i) => {
        if (y - FILA < M + 30) { cerrarTabla(); nuevaPagina(false) }
        if (i % 2) page.drawRectangle({ x: M + 0.5, y: y - FILA, width: UTIL - 1, height: FILA, color: aclarar(color, 0.955) })
        let x = M
        cols.forEach(col => { col.dibujar(c, x, y - FILA / 2 - 2.5, col.ancho, f, page); x += col.ancho })
        y -= FILA
    })

    // Fila de totales.
    if (y - FILA < M + 30) { cerrarTabla(); nuevaPagina(false) }
    caja(page, M, y - FILA, UTIL, FILA, 8, { color: aclarar(color, 0.88), esquinas: { si: false, sd: false, ii: true, id: true } })
    const totalDe = (k: 'total' | 'abonado' | 'saldo') => d.filas.reduce((s, c) => s + c[k], 0)
    page.drawText(sanitizarPdf(`${d.filas.length} comprobantes`), { x: M + 5, y: y - FILA / 2 - 2.5, size: 7.6, font: b, color: TINTA })
    let x = M
    cols.forEach(col => {
        const k = col.t === 'Total' || col.t === 'Importe' ? 'total' : col.t === 'Abonado' ? 'abonado' : col.t === 'Saldo' ? 'saldo' : null
        if (k) {
            const t = soles(totalDe(k))
            page.drawText(t, { x: x + col.ancho - 5 - b.widthOfTextAtSize(t, 7.6), y: y - FILA / 2 - 2.5, size: 7.6, font: b, color: k === 'saldo' ? ROJO : k === 'abonado' || d.vista === 'cobrado' ? VERDE : TINTA })
        }
        x += col.ancho
    })
    y -= FILA
    cerrarTabla()

    // ── Pie ──────────────────────────────────────────────────────────────────
    const generado = `Generado el ${new Date().toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })} · Intranet DIFAR`
    paginas.forEach((p, i) => {
        p.drawLine({ start: { x: M, y: M - 6 }, end: { x: W - M, y: M - 6 }, thickness: 0.5, color: BORDE })
        p.drawText(sanitizarPdf(generado), { x: M, y: M - 16, size: 6.8, font: n, color: GRIS })
        const t = `Página ${i + 1} de ${paginas.length}`
        p.drawText(t, { x: W - M - n.widthOfTextAtSize(t, 6.8), y: M - 16, size: 6.8, font: n, color: GRIS })
    })

    return pdf.save()
}
