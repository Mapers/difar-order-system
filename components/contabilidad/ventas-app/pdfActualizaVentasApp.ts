import { StandardFonts, rgb, RGB } from 'pdf-lib'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cargarLogoPdf, sanitizarPdf, truncarPdf } from '@/components/reporte/pdfCabecera'
import { aclarar, crearPdfReporte, hexARgb, OpcionesPdfReporte } from '@/components/reporte/pdfOpciones'
import type { ComprobanteApp, EstadoCarga, ResumenMes, ResumenSunat } from '@/app/services/contabilidad/VentasAppService'

export interface DatosPdfVentasApp {
    /** Comprobantes visibles con los filtros activos de la pantalla. */
    filas:        ComprobanteApp[]
    resumen:      ResumenMes | null
    sunat:        ResumenSunat | null
    ncPendientes: number
    /** Periodo legible, p. ej. "Octubre 2026". */
    periodo:      string
    /** Textos de los filtros aplicados. */
    filtroTipo:   string
    filtroEstado: string
    buscar:       string
}

/** Razón social legal (como el Registro de Ventas, el SIRE y el Registro de Compras). */
const EMPRESA_LEGAL = { nombre: 'IMPORTADORA FARMACEUTICA SAC', ruc: '20481321892' }

const TIPO: Record<string, string> = { '01': 'FAC', '03': 'BOL', '07': 'NC' }
const MOTIVO: Record<string, string> = {
    '01': 'Anulación de la operación', '02': 'Anulación por error en el RUC', '03': 'Corrección por error en la descripción',
    '04': 'Descuento global', '05': 'Descuento por ítem', '06': 'Devolución total', '07': 'Devolución por ítem', '13': 'Ajuste de montos y/o fechas',
}
/** Colores por estado de carga (como la pantalla): texto, franja izquierda y fondo suave. */
const ESTADO: Record<EstadoCarga, { texto: string; fuerte: RGB; fondo: RGB }> = {
    CARGADO:   { texto: 'Cargado',   fuerte: rgb(0.02, 0.47, 0.34), fondo: rgb(0.925, 0.98, 0.95) },
    PENDIENTE: { texto: 'Pendiente', fuerte: rgb(0.71, 0.33, 0.04), fondo: rgb(1, 0.97, 0.88) },
    PARCIAL:   { texto: 'Parcial',   fuerte: rgb(0.75, 0.07, 0.24), fondo: rgb(1, 0.94, 0.95) },
}

/**
 * PDF de "Actualiza Ventas APP" con el formato de los reportes de la web (cabecera corporativa,
 * colores y tamaño del modal de vista previa). A4 horizontal: filtros aplicados, resumen del mes,
 * suma total SUNAT, tabla de los comprobantes visibles con fila de totales y pie con
 * fecha de impresión y "Página x de y".
 */
export async function generarPdfActualizaVentasApp(d: DatosPdfVentasApp, op: OpcionesPdfReporte): Promise<Uint8Array> {
    const principal = hexARgb(op.color)
    const pdfDoc = await crearPdfReporte(op.tamanoLetra)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const logo = await cargarLogoPdf(pdfDoc)

    const W = 841.89, H = 595.28, M = 36, ancho = W - M * 2
    const gris = rgb(0.35, 0.35, 0.35)
    const violeta = rgb(0.43, 0.16, 0.85)
    const ambar = rgb(0.6, 0.3, 0.02)
    const num = (v: unknown) => Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const soles = (v: unknown) => `S/ ${num(v)}`
    const dmy = (v: unknown) => { if (!v) return ''; const s = String(v).slice(0, 10); return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` }
    const documento = (f: ComprobanteApp) => `${f.serie}-${String(f.numero).padStart(8, '0')}`
    const ahora = new Date()

    // Estado · Tipo · Documento · Fecha · Cliente · RUC · Valor venta · IGV · Total · Tablas
    const fijas = [52, 28, 80, 52, 0, 62, 70, 62, 74, 84]
    fijas[4] = ancho - fijas.reduce((a, b) => a + b, 0)
    const cols = fijas
    const titulos = ['ESTADO', 'TIPO', 'DOCUMENTO', 'FECHA', 'CLIENTE', 'RUC / DNI', 'VALOR VENTA', 'IGV', 'TOTAL', 'TABLAS']
    const derecha = (i: number) => i >= 6 && i <= 8
    const centro = (i: number) => i === 1 || i === 9
    const xCol = (i: number) => M + cols.slice(0, i).reduce((a, b) => a + b, 0)

    const filtros = [
        `Tipo: ${d.filtroTipo}`,
        `Estado: ${d.filtroEstado}`,
        d.buscar.trim() ? `Búsqueda: "${d.buscar.trim()}"` : '',
    ].filter(Boolean).join('   ·   ')

    let page = pdfDoc.addPage([W, H])
    let y = 0

    // Cabecera de los libros de Contabilidad (como Movimiento por subcuenta): banda de color arriba, logo,
    // razón social, RUC y título del reporte; a la derecha fecha de impresión y "Periodo · Moneda"; línea de cierre.
    const cabecera = () => {
        page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: principal })
        const arriba = H - M
        let xT = M
        if (logo) {
            page.drawImage(logo, { x: M, y: arriba - 18, width: 52, height: 31 })
            xT = M + 62
        }
        const anchoT = ancho - (xT - M) - 170
        page.drawText(truncarPdf(EMPRESA_LEGAL.nombre, anchoT, 12, bold), { x: xT, y: arriba, size: 12, font: bold })
        page.drawText(`RUC: ${EMPRESA_LEGAL.ruc}`, { x: xT, y: arriba - 13, size: 8.5, font, color: gris })
        page.drawText(truncarPdf(op.titulo || 'Actualiza Ventas APP - Registro de Ventas', anchoT, 10, bold), { x: xT, y: arriba - 26, size: 10, font: bold, color: principal })
        const impreso = `Impreso: ${format(ahora, 'dd/MM/yyyy HH:mm')}`
        page.drawText(impreso, { x: W - M - font.widthOfTextAtSize(impreso, 8), y: arriba, size: 8, font, color: gris })
        const per = sanitizarPdf(`${d.periodo} · Soles`)
        page.drawText(per, { x: W - M - bold.widthOfTextAtSize(per, 8.5), y: arriba - 13, size: 8.5, font: bold, color: principal })
        y = arriba - 40
        page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.8, color: principal })
        y -= 12
        page.drawText(truncarPdf(`Filtros aplicados: ${filtros}`, ancho, 7.5, font), { x: M, y, size: 7.5, font, color: gris })
        y -= 14
    }
    const texto = (t: string, i: number, yy: number, size: number, f: any, color: RGB = rgb(0, 0, 0)) => {
        const s = truncarPdf(t, cols[i] - 8, size, f)
        const w = f.widthOfTextAtSize(s, size)
        const x = derecha(i) ? xCol(i) + cols[i] - w - 4 : centro(i) ? xCol(i) + (cols[i] - w) / 2 : xCol(i) + 4
        page.drawText(s, { x, y: yy, size, font: f, color })
    }
    const encabezadoTabla = () => {
        page.drawRectangle({ x: M, y: y - 5, width: ancho, height: 18, color: aclarar(principal, 0.85) })
        titulos.forEach((t, i) => texto(t, i, y, 7.5, bold, principal))
        y -= 15
    }
    const saltoSiFalta = (alto: number) => {
        if (y - alto < M + 8) { page = pdfDoc.addPage([W, H]); cabecera(); encabezadoTabla() }
    }

    // ---------------------------------------------------------------- primera página: nota y resúmenes
    cabecera()
    if (op.nota.trim()) {
        page.drawText(truncarPdf(op.nota.trim(), ancho, 8.5, font), { x: M, y, size: 8.5, font, color: gris })
        y -= 16
    }

    const altoCaja = 66, sep = 10
    const anchoResumen = ancho * 0.6, anchoSunat = ancho - anchoResumen - sep
    const caja = (x: number, w: number, titulo: string, extra?: string) => {
        page.drawRectangle({ x, y: y - altoCaja + 10, width: w, height: altoCaja, color: aclarar(principal, 0.96), borderColor: aclarar(principal, 0.75), borderWidth: 0.6 })
        page.drawText(sanitizarPdf(titulo), { x: x + 8, y: y - 2, size: 8.5, font: bold, color: principal })
        if (extra) {
            const e = truncarPdf(extra, w - bold.widthOfTextAtSize(sanitizarPdf(titulo), 8.5) - 30, 7, font)
            page.drawText(e, { x: x + w - font.widthOfTextAtSize(e, 7) - 8, y: y - 2, size: 7, font, color: gris })
        }
    }

    // Resumen del mes (las tarjetas de la pantalla)
    caja(M, anchoResumen, 'Resumen del mes', d.periodo)
    const r = d.resumen
    const tarjetas: [string, string, string, RGB][] = [
        ['COMPROBANTES', r ? String(r.total) : '-', d.periodo, principal],
        ['CARGADOS', r ? String(r.cargados) : '-', r ? soles(r.montoCargado) : '', ESTADO.CARGADO.fuerte],
        ['PENDIENTES', r ? String(r.pendientes) : '-', r ? soles(r.montoPendiente) : '', ESTADO.PENDIENTE.fuerte],
        ['NC PENDIENTES', String(d.ncPendientes), 'Notas de crédito', violeta],
        ['CON OBSERVACIÓN', r ? String(r.conProblema + r.parciales) : '-', 'Parciales o sin ficha', ESTADO.PARCIAL.fuerte],
    ]
    const anchoTarjeta = (anchoResumen - 16) / tarjetas.length
    tarjetas.forEach(([t, v, s, color], i) => {
        const x = M + 8 + i * anchoTarjeta
        if (i > 0) page.drawLine({ start: { x: x - 4, y: y - 14 }, end: { x: x - 4, y: y - altoCaja + 16 }, thickness: 0.4, color: aclarar(principal, 0.75) })
        page.drawRectangle({ x, y: y - 17, width: 14, height: 2, color })
        page.drawText(truncarPdf(t, anchoTarjeta - 10, 6.5, bold), { x, y: y - 26, size: 6.5, font: bold, color: gris })
        page.drawText(truncarPdf(v, anchoTarjeta - 10, 14, bold), { x, y: y - 41, size: 14, font: bold, color })
        page.drawText(truncarPdf(s, anchoTarjeta - 10, 6.5, font), { x, y: y - 51, size: 6.5, font, color: gris })
    })

    // Suma total · SUNAT
    const xs = M + anchoResumen + sep
    const s = d.sunat
    caja(xs, anchoSunat, 'Suma total · SUNAT', s ? `${s.comprobantes} comprobantes (${s.ventas} ventas, ${s.notas_credito} NC)` : undefined)
    if (s) {
        const lineas: [string, number][] = [['Base imponible (O+P)', s.base_imponible], ['IGV (Q+R)', s.igv]]
        if (s.exonerado !== 0) lineas.push(['Exonerado (S)', s.exonerado])
        if (s.inafecto !== 0) lineas.push(['Inafecto (T)', s.inafecto])
        if (s.flete !== 0) lineas.push(['Flete / otros (Y)', s.flete])
        const media = Math.ceil(lineas.length / 2)
        const anchoCol = (anchoSunat - 24) / 2
        lineas.forEach(([t, v], i) => {
            const x = xs + 8 + (i < media ? 0 : anchoCol + 8)
            const yy = y - 16 - (i % media) * 11
            page.drawText(sanitizarPdf(t), { x, y: yy, size: 7.5, font, color: gris })
            const vt = soles(v)
            page.drawText(vt, { x: x + anchoCol - font.widthOfTextAtSize(vt, 7.5), y: yy, size: 7.5, font })
        })
        const yt = y - altoCaja + 17
        page.drawLine({ start: { x: xs + 8, y: yt + 10 }, end: { x: xs + anchoSunat - 8, y: yt + 10 }, thickness: 0.4, color: aclarar(principal, 0.6), dashArray: [2, 2] })
        page.drawText('Total CP (Z)', { x: xs + 8, y: yt, size: 9, font: bold, color: principal })
        const tz = soles(s.total_cp)
        page.drawText(tz, { x: xs + anchoSunat - 8 - bold.widthOfTextAtSize(tz, 9), y: yt, size: 9, font: bold, color: principal })
    } else {
        page.drawText('Sin datos del Registro de Ventas para el periodo.', { x: xs + 8, y: y - 20, size: 8, font, color: gris })
    }
    y -= altoCaja + 12

    // ---------------------------------------------------------------- detalle
    page.drawText(sanitizarPdf(`Comprobantes (${d.filas.length})`), { x: M, y, size: 9, font: bold, color: principal })
    y -= 17
    encabezadoTabla()

    let tValor = 0, tIgv = 0, tTotal = 0
    d.filas.forEach((f, idx) => {
        const e = ESTADO[f.estado_carga] ?? ESTADO.PENDIENTE
        const refNc = f.doc_ref ? `Modifica ${f.doc_ref}${f.motivo ? ` · ${MOTIVO[f.motivo] ?? `motivo ${f.motivo}`}` : ''}` : ''
        const obs = f.problema ? `Obs.: ${f.problema}` : ''
        const alto = refNc || obs ? 21 : 13
        saltoSiFalta(alto)

        // fondo suave por estado; las filas impares un poco más intensas (cebra)
        const fondo = idx % 2 === 0 ? aclarar(e.fondo, 0.35) : e.fondo
        page.drawRectangle({ x: M, y: y - alto + 9, width: ancho, height: alto, color: fondo })
        page.drawRectangle({ x: M, y: y - alto + 9, width: 2.2, height: alto, color: e.fuerte })

        const valor = Number(f.valor_venta) || 0, igv = Number(f.igv) || 0, total = Number(f.total) || 0
        tValor += valor; tIgv += igv; tTotal += total
        const negro = rgb(0, 0, 0)
        texto(e.texto, 0, y, 7.5, bold, e.fuerte)
        texto(TIPO[f.tipo_doc] ?? f.tipo_doc, 1, y, 7, bold, f.tipo_doc === '07' ? violeta : principal)
        texto(documento(f), 2, y, 7.5, bold)
        texto(dmy(f.fecha), 3, y, 7.5, font)
        texto(f.cliente ?? '', 4, y, 7.5, font)
        texto(f.ruc ?? '', 5, y, 7.5, font)
        const colorMonto = total < 0 ? violeta : negro
        texto(soles(valor), 6, y, 7.5, font, colorMonto)
        texto(soles(igv), 7, y, 7.5, font, colorMonto)
        texto(soles(total), 8, y, 7.5, bold, colorMonto)
        texto(`RV ${f.rv_filas ?? 0} · MA ${f.ma_filas ?? 0} · KC ${f.kc_filas ?? 0}`, 9, y, 7, font, gris)

        if (refNc) {
            // sin observación la línea de la NC puede ocupar también la columna del cliente
            const w = cols[2] + cols[3] + (obs ? 0 : cols[4]) - 8
            page.drawText(truncarPdf(refNc, w, 6.5, font), { x: xCol(2) + 4, y: y - 9, size: 6.5, font, color: violeta })
        }
        if (obs) {
            const w = cols[4] + cols[5] - 8
            page.drawText(truncarPdf(obs, w, 6.5, font), { x: xCol(4) + 4, y: y - 9, size: 6.5, font, color: ambar })
        }
        page.drawLine({ start: { x: M, y: y - alto + 9 }, end: { x: W - M, y: y - alto + 9 }, thickness: 0.3, color: rgb(0.86, 0.86, 0.86) })
        y -= alto
    })

    // fila de totales
    saltoSiFalta(22)
    y -= 4
    page.drawRectangle({ x: M, y: y - 5, width: ancho, height: 18, color: aclarar(principal, 0.85) })
    const etiqueta = `TOTAL (${d.filas.length} comprobante${d.filas.length === 1 ? '' : 's'})`
    page.drawText(sanitizarPdf(etiqueta), { x: M + 6, y, size: 8.5, font: bold, color: principal })
    texto(soles(tValor), 6, y, 8, bold, principal)
    texto(soles(tIgv), 7, y, 8, bold, principal)
    texto(soles(tTotal), 8, y, 8, bold, principal)

    // ---------------------------------------------------------------- pie en todas las páginas
    const paginas = pdfDoc.getPages()
    const fechaLarga = sanitizarPdf(format(ahora, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }))
    paginas.forEach((p, i) => {
        p.drawLine({ start: { x: M, y: M - 2 }, end: { x: W - M, y: M - 2 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
        p.drawText(fechaLarga, { x: M, y: M - 14, size: 7.5, font, color: gris })
        const centroTxt = sanitizarPdf(`Actualiza Ventas APP · ${d.periodo}`)
        p.drawText(centroTxt, { x: (W - font.widthOfTextAtSize(centroTxt, 7)) / 2, y: M - 14, size: 7, font, color: gris })
        const pag = sanitizarPdf(`Página ${i + 1} de ${paginas.length}`)
        p.drawText(pag, { x: W - M - font.widthOfTextAtSize(pag, 7.5), y: M - 14, size: 7.5, font, color: gris })
    })
    return pdfDoc.save()
}
