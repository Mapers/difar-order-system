import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb, RGB } from 'pdf-lib'
import { cargarLogoPdf, sanitizarPdf, truncarPdf } from '@/components/reporte/pdfCabecera'
import { crearPdfReporte, hexARgb, aclarar, OpcionesPdfReporte } from '@/components/reporte/pdfOpciones'
import { CatalogosBanco, PlanillaCabecera, PlanillaDetalle, TipoComprobante } from '@/app/types/planilla-types'

/**
 * PDF de la planilla de cobranza con el mismo formato que la planilla impresa
 * que llenan los vendedores: cabecera con Fecha / Zona / Vendedor / N° planilla,
 * tabla Cliente · Documento · Liquidación de cobranza, totales, observaciones y
 * las leyendas de tipo de documento y código de banco.
 */

const PAGE_W = 841.89
const PAGE_H = 595.28
const M      = 24
const W      = PAGE_W - M * 2

const COLS: { h: string; w: number; align: 'left' | 'center' | 'right' }[] = [
    { h: 'CÓDIGO',      w: 70,  align: 'left'   },
    { h: 'NOMBRE',      w: 210, align: 'left'   },
    { h: 'T/D',         w: 26,  align: 'center' },
    { h: 'SERIE',       w: 38,  align: 'center' },
    { h: 'N° DOC.',     w: 52,  align: 'center' },
    { h: 'IMPORTE',     w: 60,  align: 'right'  },
    { h: 'RECIBO N°',   w: 56,  align: 'center' },
    { h: 'IMPORT. CBZA',w: 62,  align: 'right'  },
    { h: 'C/B',         w: 28,  align: 'center' },
    { h: 'FEC. DEP.',   w: 54,  align: 'center' },
    { h: 'N° OP',       w: 74,  align: 'center' },
    { h: 'N° CHEQUE',   w: 64,  align: 'center' },
]
// Grupos de la fila superior del encabezado: [título, cantidad de columnas]
const GRUPOS: [string, number][] = [['CLIENTE', 2], ['DOCUMENTO', 4], ['LIQUIDACIÓN DE COBRANZA', 6]]

const FILA_H        = 16
const FILAS_MINIMAS = 18   // la planilla impresa siempre muestra renglones vacíos para completar
const NEGRO  = rgb(0.1, 0.1, 0.1)
const LINEA  = rgb(0.35, 0.35, 0.35)
const ROJO   = rgb(0.78, 0.1, 0.1)

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const fechaLarga = (f?: string | null) => {
    const m = String(f ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/)
    return m ? `${Number(m[3])} de ${MESES[Number(m[2]) - 1]} de ${m[1]}` : ''
}
const fechaCorta = (f?: string | null) => {
    const m = String(f ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/)
    return m ? `${m[3]}/${m[2]}/${m[1].slice(2)}` : ''
}
const ESTADOS: Record<string, string> = { borrador: 'Borrador', enviado: 'Enviada', validado: 'Aprobada', rechazado: 'Observada' }
/** 'YYYY-MM-DDTHH:mm…' (o Date ISO) → '17/10/2026 10:10 p. m.' en hora local. */
const fechaHora = (f?: string | null) => {
    if (!f) return ''
    const d = new Date(f)
    if (isNaN(d.getTime())) return ''
    return `${d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true })}`
}
const monto = (v: unknown) => {
    const n = Number(v)
    return Number.isFinite(n) && n !== 0 ? n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
}

interface Fuentes { normal: PDFFont; negrita: PDFFont }

function texto(page: PDFPage, f: PDFFont, t: string, x: number, y: number, w: number, size: number,
               align: 'left' | 'center' | 'right' = 'left', color: RGB = NEGRO) {
    const limpio = truncarPdf(t, w - 4, size, f)
    const ancho = f.widthOfTextAtSize(limpio, size)
    const px = align === 'left' ? x + 3 : align === 'right' ? x + w - 3 - ancho : x + (w - ancho) / 2
    page.drawText(limpio, { x: px, y, size, font: f, color })
}

const GRILLA = rgb(0.8, 0.8, 0.82)
const R      = 6   // radio de las esquinas redondeadas

/**
 * Rectángulo con esquinas redondeadas (pdf-lib no lo trae): se dibuja como path SVG.
 * radios = [arriba-izq, arriba-der, abajo-der, abajo-izq]; (x, y) es la esquina inferior izquierda.
 */
function redondeado(page: PDFPage, x: number, y: number, w: number, h: number,
                    { radios = [R, R, R, R], borde, fondo, grosor = 0.8 }:
                    { radios?: number[]; borde?: RGB; fondo?: RGB; grosor?: number } = {}) {
    const [tl, tr, br, bl] = radios.map(r => Math.min(r, w / 2, h / 2))
    const d = `M ${tl} 0 H ${w - tr} Q ${w} 0 ${w} ${tr} V ${h - br} Q ${w} ${h} ${w - br} ${h} `
            + `H ${bl} Q 0 ${h} 0 ${h - bl} V ${tl} Q 0 0 ${tl} 0 Z`
    page.drawSvgPath(d, {
        x, y: y + h,
        color: fondo,
        borderColor: borde,
        borderWidth: borde ? grosor : 0,
    })
}

function linea(page: PDFPage, x1: number, y1: number, x2: number, y2: number, color = GRILLA, grosor = 0.5) {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, color, thickness: grosor })
}

/** Archivos que se pueden anexar después de la planilla. */
export interface AnexosPlanilla {
    /** Vouchers de cada registro (imagen o PDF), con su URL pública. */
    vouchers: { id_detalle: number; url: string }[]
    /** PDF de los recibos de cuenta, por número de recibo tal como figura en el registro. */
    recibos:  Record<string, string>
}

export async function construirPdfPlanilla(
    planilla: PlanillaCabecera,
    detalle: PlanillaDetalle[],
    tipos: TipoComprobante[],
    bancos: CatalogosBanco[],
    op: OpcionesPdfReporte,
    anexos?: AnexosPlanilla,
): Promise<Uint8Array> {
    const pdf = await crearPdfReporte(op.tamanoLetra)
    const fuentes: Fuentes = {
        normal:  await pdf.embedFont(StandardFonts.Helvetica),
        negrita: await pdf.embedFont(StandardFonts.HelveticaBold),
    }
    const logo  = await cargarLogoPdf(pdf)
    const acento = hexARgb(op.color)
    const suave  = aclarar(acento, 0.88)

    const impresoEn = fechaHora(new Date().toISOString())
    const totalDocs = detalle.reduce((s, r) => s + (Number(r.importe) || 0), 0)
    const totalCbza = detalle.reduce((s, r) => s + (Number(r.importe_cobrado) || 0), 0)

    // Filas por página: la última deja espacio para totales, observaciones y leyendas.
    const FILAS_PAGINA = 22
    const FILAS_ULTIMA = FILAS_MINIMAS
    const paginas: PlanillaDetalle[][] = []
    let resto = [...detalle]
    while (resto.length > FILAS_ULTIMA) {
        paginas.push(resto.slice(0, FILAS_PAGINA))
        resto = resto.slice(FILAS_PAGINA)
    }
    paginas.push(resto)

    paginas.forEach((filas, ip) => {
        const page = pdf.addPage([PAGE_W, PAGE_H])
        const ultima = ip === paginas.length - 1
        let y = PAGE_H - M

        // ── Cabecera ────────────────────────────────────────────────────────
        if (logo) {
            const h = 38, w = (logo.width / logo.height) * h
            page.drawImage(logo, { x: M, y: y - h, width: w, height: h })
        }
        page.drawText('DISTRIBUIDORA E IMPORTADORA FARMACEUTICA S.A.C.', { x: M, y: y - 48, size: 7.5, font: fuentes.negrita, color: acento })
        page.drawText('RUC 20481321892', { x: M, y: y - 58, size: 6.5, font: fuentes.normal, color: NEGRO })

        const titulo = sanitizarPdf(op.titulo || 'PLANILLA DE COBRANZA').toUpperCase()
        const tw = fuentes.negrita.widthOfTextAtSize(titulo, 18)
        page.drawText(titulo, { x: M + (W - tw) / 2, y: y - 26, size: 18, font: fuentes.negrita, color: acento })

        const numero = `N° ${planilla.numero_planilla ?? ''}`
        const nw = fuentes.negrita.widthOfTextAtSize(numero, 15)
        page.drawText(numero, { x: PAGE_W - M - nw, y: y - 24, size: 15, font: fuentes.negrita, color: ROJO })
        const impreso = `Impreso: ${impresoEn}${paginas.length > 1 ? `  ·  Página ${ip + 1} de ${paginas.length}` : ''}`
        page.drawText(impreso, { x: PAGE_W - M - fuentes.normal.widthOfTextAtSize(impreso, 7), y: y - 38, size: 7, font: fuentes.normal, color: LINEA })
        const estado = [`Estado: ${ESTADOS[planilla.estado] ?? planilla.estado ?? ''}`,
                        planilla.fecha_envio ? `Enviada: ${fechaHora(planilla.fecha_envio)}` : '',
                        planilla.fecha_revision ? `Revisada: ${fechaHora(planilla.fecha_revision)}` : '']
            .filter(Boolean).join('  ·  ')
        page.drawText(sanitizarPdf(estado), { x: PAGE_W - M - fuentes.normal.widthOfTextAtSize(sanitizarPdf(estado), 7), y: y - 48, size: 7, font: fuentes.normal, color: LINEA })

        // Fila de datos: FECHA | ZONA | VENDEDOR | N° PLANILLA
        y -= 84
        const datos: [string, string, number][] = [
            ['FECHA', fechaLarga(planilla.fecha_ruta), 0.24],
            ['ZONA', planilla.zona ?? '', 0.2],
            ['VENDEDOR', `${planilla.codigo_vendedor ?? ''} ${planilla.nombre_vendedor ?? ''}`.trim(), 0.38],
            ['N° PLANILLA', planilla.numero_planilla ?? '', 0.18],
        ]
        let x = M
        const SEP = 6
        datos.forEach(([et, val, frac], i) => {
            const w = W * frac - (i < datos.length - 1 ? SEP : 0)
            const wEt = fuentes.negrita.widthOfTextAtSize(et, 7) + 12
            redondeado(page, x, y, wEt, 20, { radios: [R, 0, 0, R], fondo: suave })
            redondeado(page, x, y, w, 20, { borde: LINEA })
            texto(page, fuentes.negrita, et, x, y + 7, wEt, 7, 'center', acento)
            texto(page, fuentes.normal, val, x + wEt, y + 7, w - wEt, 8.5, 'left')
            x += w + SEP
        })

        // ── Tabla: fondo de encabezados, grilla fina y marco redondeado ─────
        y -= 10
        const renglones = Math.max(filas.length, ultima ? FILAS_ULTIMA : FILAS_PAGINA)
        const yTop = y
        const yCols = yTop - 14
        const yFilas = yCols - 16
        const yFin = yFilas - renglones * FILA_H
        const bordes: number[] = []
        COLS.reduce((acc, c) => { bordes.push(acc); return acc + c.w }, M)
        bordes.push(M + W)

        redondeado(page, M, yCols, W, 14, { radios: [R, R, 0, 0], fondo: acento })
        page.drawRectangle({ x: M, y: yFilas, width: W, height: 16, color: suave })
        for (let i = 0; i < renglones; i++) {
            if (i % 2 === 1) page.drawRectangle({ x: M, y: yFilas - (i + 1) * FILA_H, width: W, height: FILA_H, color: aclarar(acento, 0.965) })
        }

        // Títulos de grupo, separados por una línea blanca
        let ic = 0
        for (const [g, n] of GRUPOS) {
            const x0 = bordes[ic], x1 = bordes[ic + n]
            texto(page, fuentes.negrita, g, x0, yCols + 4, x1 - x0, 7.5, 'center', rgb(1, 1, 1))
            if (ic > 0) linea(page, x0, yCols, x0, yTop, rgb(1, 1, 1), 0.8)
            ic += n
        }
        // Títulos de columna
        COLS.forEach((c, ci) => texto(page, fuentes.negrita, c.h, bordes[ci], yFilas + 5, c.w, 6.5, 'center', acento))

        // Grilla: verticales internas (más marcadas entre grupos) y horizontales entre filas
        const inicioGrupo = new Set([2, 6])
        for (let ci = 1; ci < COLS.length; ci++) {
            linea(page, bordes[ci], yCols, bordes[ci], yFin, inicioGrupo.has(ci) ? LINEA : GRILLA, inicioGrupo.has(ci) ? 0.7 : 0.5)
        }
        linea(page, M, yFilas, M + W, yFilas, LINEA, 0.7)
        for (let i = 1; i < renglones; i++) linea(page, M, yFilas - i * FILA_H, M + W, yFilas - i * FILA_H)

        filas.forEach((r, i) => {
            const valores = [
                r.codigo_cliente ?? '', r.nombre_cliente ?? '', r.tipo_documento ?? '', r.serie ?? '',
                r.numero_doc ?? '', monto(r.importe), r.numero_recibo ?? '', monto(r.importe_cobrado),
                r.cod_banco ?? '', fechaCorta(r.fecha_deposito), r.numero_operacion ?? '', r.numero_cheque ?? '',
            ]
            const yt = yFilas - (i + 1) * FILA_H + 5
            COLS.forEach((c, ci) => { if (valores[ci]) texto(page, fuentes.normal, valores[ci], bordes[ci], yt, c.w, 7.5, c.align) })
        })

        redondeado(page, M, yFin, W, yTop - yFin, { borde: LINEA, grosor: 0.9 })
        y = yFin

        if (!ultima) return

        // ── Totales ─────────────────────────────────────────────────────────
        const xCol = (i: number) => M + COLS.slice(0, i).reduce((s, c) => s + c.w, 0)
        // Como en la planilla impresa: la etiqueta en dos líneas a la izquierda del total.
        const totalCaja = (linea1: string, linea2: string, valor: number, ic: number, anchoEt: number) => {
            const xv = xCol(ic)
            texto(page, fuentes.negrita, linea1, xv - anchoEt, y - 10, anchoEt, 6.5, 'right', acento)
            texto(page, fuentes.negrita, linea2, xv - anchoEt, y - 18, anchoEt, 6.5, 'right', acento)
            redondeado(page, xv, y - 21, COLS[ic].w, 18, { radios: [4, 4, 4, 4], borde: acento, fondo: aclarar(acento, 0.94), grosor: 0.9 })
            texto(page, fuentes.negrita, monto(valor) || '0.00', xv, y - 14, COLS[ic].w, 8.5, 'right')
        }
        totalCaja('TOTAL', 'DOCUMENTOS', totalDocs, 5, 60)
        totalCaja('TOTAL', 'COBRADOS', totalCbza, 7, COLS[6].w)
        y -= 32

        // ── Observaciones ───────────────────────────────────────────────────
        const altoObs = 62
        const anchoObs = 430
        redondeado(page, M, y - altoObs, anchoObs, altoObs, { borde: LINEA })
        page.drawText('OBSERVACIONES', { x: M + 4, y: y - 11, size: 7.5, font: fuentes.negrita, color: acento })
        const obs = [planilla.observacion_admin, op.nota].filter(Boolean).join(' · ')
        const lineas = partir(sanitizarPdf(obs), fuentes.normal, 8, anchoObs - 10).slice(0, 4)
        lineas.forEach((l, i) => page.drawText(l, { x: M + 5, y: y - 24 - i * 10, size: 8, font: fuentes.normal, color: NEGRO }))

        // ── Leyendas: tipo de documento y código de banco ───────────────────
        const usados = new Set(detalle.map(r => r.cod_banco).filter(Boolean))
        const principales = ['02', '11', '38']
        const leyBancos = bancos
            .filter(b => usados.has(b.CodigoEntidadFinanciera) || principales.includes(b.CodigoEntidadFinanciera))
            .slice(0, 6)
            .map(b => `${b.CodigoEntidadFinanciera} ${b.DescripcionEntidadFinanciera}`)
        const leyTipos = tipos.slice(0, 6).map(t => `${t.codigo} ${t.descripcion}`)
        leyenda(page, fuentes, 'TIPO DCMTO.', leyTipos, M + anchoObs + 16, y, 140, acento)
        leyenda(page, fuentes, 'CÓDIGO BCO.', leyBancos, M + anchoObs + 166, y, W - anchoObs - 166, acento)
    })

    if (anexos && (op.extras?.vouchers || op.extras?.recibos))
        await anexarPorRegistro(pdf, fuentes, planilla, detalle, bancos, anexos, acento, !!op.extras?.vouchers, !!op.extras?.recibos)

    return pdf.save()
}

// ─── Anexos ──────────────────────────────────────────────────────────────────

type Archivo = { tipo: 'jpg' | 'png' | 'pdf'; bytes: ArrayBuffer }
const cacheArchivos = new Map<string, Promise<Archivo | null>>()

/** Descarga una vez cada archivo; las imágenes que pdf-lib no lee (WEBP) se pasan a PNG. */
function cargarArchivo(url: string): Promise<Archivo | null> {
    if (!cacheArchivos.has(url)) {
        cacheArchivos.set(url, (async () => {
            try {
                const res = await fetch(url)
                if (!res.ok) return null
                const tipo = (res.headers.get('content-type') ?? '').toLowerCase()
                const bytes = await res.arrayBuffer()
                if (tipo.includes('pdf') || /\.pdf($|\?)/i.test(url)) return { tipo: 'pdf', bytes }
                if (tipo.includes('jpeg') || tipo.includes('jpg')) return { tipo: 'jpg', bytes }
                if (tipo.includes('png')) return { tipo: 'png', bytes }
                const bitmap = await createImageBitmap(new Blob([bytes]))
                const canvas = document.createElement('canvas')
                canvas.width = bitmap.width; canvas.height = bitmap.height
                canvas.getContext('2d')?.drawImage(bitmap, 0, 0)
                const png = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'))
                return png ? { tipo: 'png', bytes: await png.arrayBuffer() } : null
            } catch {
                return null
            }
        })())
    }
    return cacheArchivos.get(url)!
}

/** Cabecera común de las páginas de anexo. */
function cabeceraAnexo(page: PDFPage, f: Fuentes, titulo: string, sub: string, acento: RGB) {
    redondeado(page, M, PAGE_H - M - 34, W, 34, { fondo: acento })
    page.drawText(titulo, { x: M + 14, y: PAGE_H - M - 15, size: 12, font: f.negrita, color: rgb(1, 1, 1) })
    page.drawText(sanitizarPdf(sub), { x: M + 14, y: PAGE_H - M - 27, size: 7.5, font: f.normal, color: rgb(1, 1, 1) })
}

/** Dibuja una imagen o la primera página de un PDF ajustada dentro del recuadro, centrada. */
async function dibujarAjustado(pdf: PDFDocument, page: PDFPage, archivo: Archivo, x: number, y: number, w: number, h: number) {
    if (archivo.tipo === 'pdf') {
        const origen = await PDFDocument.load(archivo.bytes)
        const [pag] = await pdf.embedPdf(origen, [0])
        const k = Math.min(w / pag.width, h / pag.height)
        page.drawPage(pag, { x: x + (w - pag.width * k) / 2, y: y + (h - pag.height * k) / 2, width: pag.width * k, height: pag.height * k })
        return
    }
    const img = archivo.tipo === 'png' ? await pdf.embedPng(archivo.bytes) : await pdf.embedJpg(archivo.bytes)
    const k = Math.min(w / img.width, h / img.height)
    page.drawImage(img, { x: x + (w - img.width * k) / 2, y: y + (h - img.height * k) / 2, width: img.width * k, height: img.height * k })
}

/**
 * Anexo por registro: una hoja por cobro con su voucher a la izquierda y su
 * recibo de cuenta a la derecha, para revisarlos juntos. Si solo se marcó uno
 * de los dos, ocupa toda la hoja.
 */
async function anexarPorRegistro(pdf: PDFDocument, f: Fuentes, planilla: PlanillaCabecera, detalle: PlanillaDetalle[],
                                 bancos: CatalogosBanco[], anexos: AnexosPlanilla, acento: RGB,
                                 conVouchers: boolean, conRecibos: boolean) {
    const nombreBanco = (c?: string | null) => bancos.find(b => b.CodigoEntidadFinanciera === c)?.DescripcionEntidadFinanciera ?? c ?? ''
    // Una hoja por voucher; un registro sin voucher pero con recibo lleva una hoja solo con el recibo.
    const hojas: { r: PlanillaDetalle; n: number; voucher?: string; i: number; total: number; recibo?: string }[] = []
    detalle.forEach((r, n) => {
        const vouchers = conVouchers ? anexos.vouchers.filter(v => v.id_detalle === r.id_detalle).map(v => v.url) : []
        const recibo = conRecibos && r.numero_recibo ? anexos.recibos[r.numero_recibo] : undefined
        if (vouchers.length === 0 && !recibo) return
        if (vouchers.length === 0) hojas.push({ r, n: n + 1, i: 1, total: 1, recibo })
        else vouchers.forEach((url, i) => hojas.push({ r, n: n + 1, voucher: url, i: i + 1, total: vouchers.length, recibo }))
    })
    if (hojas.length === 0) return

    const titulo = conVouchers && conRecibos ? 'ANEXO · VOUCHER Y RECIBO POR REGISTRO'
                 : conVouchers ? 'ANEXO · VOUCHERS DE PAGO' : 'ANEXO · RECIBOS DE CUENTA'
    const columnas: ('voucher' | 'recibo')[] = [...(conVouchers ? ['voucher' as const] : []), ...(conRecibos ? ['recibo' as const] : [])]
    const SEP = 12
    const yTop = PAGE_H - M - 46            // debajo de la banda del anexo
    const hDatos = 40                       // franja con los datos del registro
    const yPaneles = yTop - hDatos - 10
    const wCol = (W - SEP * (columnas.length - 1)) / columnas.length
    const hCol = yPaneles - M

    for (const [p, h] of hojas.entries()) {
        const page = pdf.addPage([PAGE_W, PAGE_H])
        cabeceraAnexo(page, f, titulo,
            `Planilla N° ${planilla.numero_planilla} · ${planilla.nombre_vendedor ?? ''} · Página ${p + 1} de ${hojas.length}`, acento)

        // Datos del registro, como en la fila de la planilla
        redondeado(page, M, yTop - hDatos, W, hDatos, { fondo: aclarar(acento, 0.9) })
        texto(page, f.negrita, `${h.n}. ${h.r.nombre_cliente}`, M + 10, yTop - 16, W - 200, 10, 'left', acento)
        texto(page, f.negrita, `Cobrado S/ ${monto(h.r.importe_cobrado) || '0.00'}`, M + W - 190, yTop - 16, 180, 11, 'right', NEGRO)
        const datos = [`Doc. ${h.r.serie ?? ''}-${h.r.numero_doc ?? ''}`, nombreBanco(h.r.cod_banco),
                       h.r.numero_operacion ? `Op. ${h.r.numero_operacion}` : '',
                       h.r.fecha_deposito ? `Dep. ${fechaCorta(h.r.fecha_deposito)}` : '',
                       h.r.numero_recibo ? `Recibo ${h.r.numero_recibo}` : 'Sin recibo']
            .filter(Boolean).join('   ·   ')
        texto(page, f.normal, datos, M + 10, yTop - 32, W - 120, 8, 'left', NEGRO)
        if (h.total > 1) texto(page, f.normal, `Voucher ${h.i} de ${h.total}`, M + W - 110, yTop - 32, 100, 7.5, 'right', LINEA)

        for (const [k, col] of columnas.entries()) {
            const x = M + k * (wCol + SEP)
            const etiqueta = col === 'voucher' ? 'VOUCHER DE PAGO' : `RECIBO DE CUENTA${h.r.numero_recibo ? ' ' + h.r.numero_recibo : ''}`
            redondeado(page, x, M, wCol, hCol, { borde: GRILLA })
            redondeado(page, x, M + hCol - 18, wCol, 18, { radios: [R, R, 0, 0], fondo: acento })
            texto(page, f.negrita, etiqueta, x, M + hCol - 12.5, wCol, 8, 'center', rgb(1, 1, 1))

            const url = col === 'voucher' ? h.voucher : h.recibo
            const pad = 10
            const archivo = url ? await cargarArchivo(url) : null
            if (archivo) await dibujarAjustado(pdf, page, archivo, x + pad, M + pad, wCol - pad * 2, hCol - 18 - pad * 2)
            else texto(page, f.normal,
                url ? 'No se pudo cargar el archivo'
                    : col === 'voucher' ? 'Sin voucher (pago en efectivo)' : 'Sin recibo de cuenta',
                x, M + hCol / 2, wCol, 9, 'center', LINEA)
        }
    }
}

function leyenda(page: PDFPage, f: Fuentes, titulo: string, filas: string[], x: number, y: number, w: number, acento: RGB) {
    const alto = 12 + filas.length * 12
    redondeado(page, x, y - 12, w, 12, { radios: [R, R, 0, 0], fondo: acento })
    texto(page, f.negrita, titulo, x, y - 9, w, 7, 'center', rgb(1, 1, 1))
    filas.forEach((t, i) => {
        if (i > 0) linea(page, x, y - 12 - i * 12, x + w, y - 12 - i * 12)
        texto(page, f.normal, t, x, y - 21 - i * 12, w, 7, 'left')
    })
    redondeado(page, x, y - alto, w, alto, { borde: LINEA })
}

function partir(t: string, f: PDFFont, size: number, ancho: number): string[] {
    const lineas: string[] = []
    let actual = ''
    for (const palabra of t.split(/\s+/).filter(Boolean)) {
        const prueba = actual ? `${actual} ${palabra}` : palabra
        if (f.widthOfTextAtSize(prueba, size) > ancho && actual) { lineas.push(actual); actual = palabra }
        else actual = prueba
    }
    if (actual) lineas.push(actual)
    return lineas
}
