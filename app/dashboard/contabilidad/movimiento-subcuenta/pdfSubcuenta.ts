import { PDFDocument, StandardFonts, rgb, RGB } from 'pdf-lib'
import { cargarLogoPdf, sanitizarPdf, truncarPdf } from '@/components/reporte/pdfCabecera'
import { SubctaMvtoCabecera, SubctaMvtoDetalle } from '@/app/types/contabilidad-types'

export type ColumnaOpcional = 'libro' | 'documento' | 'saldo' | 'item'

export interface OpcionesPdfSubcta {
    titulo:          string
    nota:            string
    /** Color principal en hex, p. ej. '#163161'. */
    color:           string
    orientacion:     'horizontal' | 'vertical'
    tamanoLetra:     'pequena' | 'normal' | 'grande'
    columnas:        Record<ColumnaOpcional, boolean>
    zebra:           boolean
    colorImportes:   boolean
    mostrarResumen:  boolean
}

export const TEMAS_PDF: { nombre: string; color: string }[] = [
    { nombre: 'Azul marino', color: '#163161' },
    { nombre: 'Azul',        color: '#2563eb' },
    { nombre: 'Verde',       color: '#047857' },
    { nombre: 'Morado',      color: '#6d28d9' },
    { nombre: 'Vino',        color: '#9f1239' },
    { nombre: 'Grafito',     color: '#334155' },
]

export const OPCIONES_PDF_DEFECTO: OpcionesPdfSubcta = {
    titulo:         'MOVIMIENTO DE SUB CUENTA CONTABLE',
    nota:           '',
    color:          TEMAS_PDF[0].color,
    orientacion:    'horizontal',
    tamanoLetra:    'normal',
    columnas:       { libro: true, documento: true, saldo: true, item: true },
    zebra:          true,
    colorImportes:  true,
    mostrarResumen: true,
}

const money = (v: number | string | null | undefined) =>
    Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fechaDMY = (f: string) => {
    if (!f) return ''
    const [a, m, d] = String(f).slice(0, 10).split('-')
    return a && m && d ? `${d}/${m}/${a}` : String(f)
}

const hexARgb = (hex: string): RGB => {
    const h = hex.replace('#', '')
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
    return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

/** Mezcla el color con blanco: t=0 el color, t=1 blanco. Para fondos suaves. */
const aclarar = (c: RGB, t: number): RGB =>
    rgb(c.red + (1 - c.red) * t, c.green + (1 - c.green) * t, c.blue + (1 - c.blue) * t)

const VERDE = rgb(0.016, 0.47, 0.34)
const ROJO  = rgb(0.73, 0.11, 0.11)
const TEXTO = rgb(0.12, 0.16, 0.23)
const GRIS  = rgb(0.42, 0.45, 0.5)
const BORDE = rgb(0.88, 0.9, 0.93)

interface Columna {
    clave:   'fecha' | 'libro' | 'documento' | 'concepto' | 'ingreso' | 'salida' | 'saldo' | 'item'
    titulo:  string
    ancho:   number
    derecha: boolean
}

/** Genera el PDF del movimiento de sub cuenta con las opciones elegidas en el modal. */
export async function generarPdfSubcta(
    cabecera: SubctaMvtoCabecera,
    detalle: SubctaMvtoDetalle[],
    op: OpcionesPdfSubcta,
): Promise<Uint8Array> {
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

    const tema      = hexARgb(op.color || OPCIONES_PDF_DEFECTO.color)
    const temaSuave = aclarar(tema, 0.92)
    const zebraCol  = aclarar(tema, 0.965)

    // Anchos fijos; el concepto se queda con lo que sobra.
    const base: Columna[] = [
        { clave: 'fecha',     titulo: 'Fecha',                 ancho: 54, derecha: false },
        { clave: 'libro',     titulo: 'Libro',                 ancho: 30, derecha: false },
        { clave: 'documento', titulo: 'Documento',             ancho: 90, derecha: false },
        { clave: 'concepto',  titulo: 'Concepto del registro', ancho: 0,  derecha: false },
        { clave: 'ingreso',   titulo: 'Ingreso',               ancho: 72, derecha: true  },
        { clave: 'salida',    titulo: 'Salida',                ancho: 72, derecha: true  },
        { clave: 'saldo',     titulo: 'Saldo',                 ancho: 80, derecha: true  },
        { clave: 'item',      titulo: 'Item',                  ancho: 34, derecha: true  },
    ]
    const cols = base.filter(c => !(c.clave in op.columnas) || op.columnas[c.clave as ColumnaOpcional])
    const fijo = cols.reduce((s, c) => s + c.ancho, 0)
    cols.find(c => c.clave === 'concepto')!.ancho = Math.max(120, contentWidth - fijo)

    let page = pdfDoc.addPage([pageWidth, pageHeight])
    let y = 0

    const texto = (p: any, t: string, x: number, yy: number, s: number, f: any, color: RGB = TEXTO) =>
        p.drawText(sanitizarPdf(t), { x, y: yy, size: s, font: f, color })

    const textoDerecha = (p: any, t: string, xFin: number, yy: number, s: number, f: any, color: RGB = TEXTO) => {
        const limpio = sanitizarPdf(t)
        p.drawText(limpio, { x: xFin - f.widthOfTextAtSize(limpio, s), y: yy, size: s, font: f, color })
    }

    const dibujarEncabezadoTabla = (p: any) => {
        // y es el borde superior de la franja; el texto va centrado en ella.
        const alto = filaH + 4
        p.drawRectangle({ x: margin, y: y - alto, width: contentWidth, height: alto, color: tema })
        const base = y - alto / 2 - size * 0.35
        let x = margin
        cols.forEach(c => {
            if (c.derecha) textoDerecha(p, c.titulo, x + c.ancho - 6, base, size, boldFont, rgb(1, 1, 1))
            else texto(p, c.titulo, x + 5, base, size, boldFont, rgb(1, 1, 1))
            x += c.ancho
        })
        // Siguiente fila: su fondo empieza 2pt debajo de la franja.
        y = y - alto - 2 - filaH + 3.5
    }

    // Banda de color arriba, logo, empresa y título del reporte.
    const dibujarCabecera = (p: any, primera: boolean) => {
        p.drawRectangle({ x: 0, y: pageHeight - 6, width: pageWidth, height: 6, color: tema })
        const arriba = pageHeight - margin
        let xT = margin
        if (logo) {
            p.drawImage(logo, { x: margin, y: arriba - 18, width: 52, height: 31 })
            xT = margin + 62
        }
        const anchoT = contentWidth - (xT - margin) - 150
        texto(p, truncarPdf(cabecera.Empresa, anchoT, 12, boldFont), xT, arriba, 12, boldFont)
        texto(p, `RUC: ${cabecera.Ruc}`, xT, arriba - 13, 8.5, font, GRIS)
        texto(p, truncarPdf(op.titulo || OPCIONES_PDF_DEFECTO.titulo, anchoT, 10, boldFont), xT, arriba - 26, 10, boldFont, tema)

        const ahora = new Date()
        textoDerecha(p, `Impreso: ${ahora.toLocaleDateString('es-PE')} ${ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`,
            pageWidth - margin, arriba, 8, font, GRIS)
        textoDerecha(p, `${cabecera.Periodo} · ${cabecera.Moneda}`, pageWidth - margin, arriba - 13, 8.5, boldFont, tema)

        y = arriba - 40
        p.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.8, color: tema })
        y -= 12

        if (primera) {
            // Recuadro de la cuenta.
            const lineasNota = op.nota.trim() ? 1 : 0
            const alto = 32 + lineasNota * 11
            p.drawRectangle({ x: margin, y: y - alto, width: contentWidth, height: alto, color: temaSuave })
            p.drawRectangle({ x: margin, y: y - alto, width: 3, height: alto, color: tema })
            texto(p, truncarPdf(cabecera.SubCuenta, contentWidth - 20, 11, boldFont), margin + 12, y - 14, 11, boldFont)
            texto(p, `${cabecera.Periodo}  ·  Expresado en ${cabecera.Moneda}`, margin + 12, y - 26, 8, font, GRIS)
            if (lineasNota) {
                texto(p, truncarPdf(op.nota.trim(), contentWidth - 20, 8, font), margin + 12, y - 37, 8, font, TEXTO)
            }
            y -= alto + 10

            if (op.mostrarResumen) {
                const tarjetas: { etiqueta: string; valor: number; color: RGB }[] = [
                    { etiqueta: 'SALDO INICIAL', valor: cabecera.SaldoInicial, color: TEXTO },
                    { etiqueta: 'TOTAL INGRESO', valor: cabecera.TotalIngreso, color: VERDE },
                    { etiqueta: 'TOTAL SALIDA',  valor: cabecera.TotalSalida,  color: ROJO  },
                    { etiqueta: 'SALDO FINAL',   valor: cabecera.SaldoFinal,   color: tema  },
                ]
                const gap = 8
                const ancho = (contentWidth - gap * 3) / 4
                tarjetas.forEach((t, i) => {
                    const x = margin + i * (ancho + gap)
                    const ultima = i === tarjetas.length - 1
                    p.drawRectangle({
                        x, y: y - 34, width: ancho, height: 34,
                        color: ultima ? temaSuave : rgb(1, 1, 1),
                        borderColor: ultima ? tema : BORDE, borderWidth: ultima ? 1 : 0.8,
                    })
                    texto(p, t.etiqueta, x + 8, y - 12, 6.5, boldFont, GRIS)
                    texto(p, money(t.valor), x + 8, y - 27, 11.5, boldFont, t.color)
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

    // Primera línea: saldo inicial, como en la pantalla.
    page.drawRectangle({ x: margin, y: y - 3.5, width: contentWidth, height: filaH, color: temaSuave })
    texto(page, 'Saldo inicial', margin + 5, y, size, boldFont)
    {
        let x = margin
        for (const c of cols) {
            if (c.clave === 'saldo') textoDerecha(page, money(cabecera.SaldoInicial), x + c.ancho - 6, y, size, boldFont)
            x += c.ancho
        }
        if (!op.columnas.saldo) {
            const tSal = cols.find(c => c.clave === 'salida')!
            const xSal = cols.slice(0, cols.indexOf(tSal) + 1).reduce((s, c) => s + c.ancho, margin)
            textoDerecha(page, money(cabecera.SaldoInicial), xSal - 6, y, size, boldFont)
        }
    }
    y -= filaH

    let saldo = Number(cabecera.SaldoInicial ?? 0)
    detalle.forEach((d, i) => {
        if (y < limiteInferior) saltarPagina()
        saldo += Number(d.Ingreso ?? 0) - Number(d.Salida ?? 0)

        if (op.zebra && i % 2 === 1) {
            page.drawRectangle({ x: margin, y: y - 3.5, width: contentWidth, height: filaH, color: zebraCol })
        }

        const valores: Record<Columna['clave'], { t: string; f: any; color: RGB }> = {
            fecha:     { t: fechaDMY(d.Fecha), f: font, color: TEXTO },
            libro:     { t: d.Libro ?? '', f: boldFont, color: tema },
            documento: { t: d.Documento ?? '', f: font, color: TEXTO },
            concepto:  { t: d.Concepto ?? '', f: font, color: TEXTO },
            ingreso:   { t: Number(d.Ingreso) ? money(d.Ingreso) : '', f: font, color: op.colorImportes ? VERDE : TEXTO },
            salida:    { t: Number(d.Salida) ? money(d.Salida) : '', f: font, color: op.colorImportes ? ROJO : TEXTO },
            saldo:     { t: money(saldo), f: boldFont, color: TEXTO },
            item:      { t: String(d.Item ?? ''), f: font, color: GRIS },
        }

        let x = margin
        cols.forEach(c => {
            const v = valores[c.clave]
            const recortado = truncarPdf(v.t, c.ancho - 10, size, v.f)
            if (c.derecha) textoDerecha(page, recortado, x + c.ancho - 6, y, size, v.f, v.color)
            else texto(page, recortado, x + 5, y, size, v.f, v.color)
            x += c.ancho
        })
        page.drawLine({
            start: { x: margin, y: y - 3.5 }, end: { x: pageWidth - margin, y: y - 3.5 },
            thickness: 0.3, color: BORDE,
        })
        y -= filaH
    })

    if (detalle.length === 0) {
        texto(page, 'Sin movimientos en el período.', margin + 5, y - 4, size + 1, font, GRIS)
        y -= filaH + 4
    }

    // Totales al pie solo si no se muestran las tarjetas de resumen arriba,
    // para no repetir los mismos importes.
    if (!op.mostrarResumen) {
        if (y < limiteInferior + filaH * 3) saltarPagina()
        y -= 4
        page.drawLine({ start: { x: margin, y: y + filaH - 4 }, end: { x: pageWidth - margin, y: y + filaH - 4 }, thickness: 0.8, color: tema })
        const xDe = (clave: Columna['clave']) => {
            let x = margin
            for (const c of cols) {
                if (c.clave === clave) return x + c.ancho - 6
                x += c.ancho
            }
            return pageWidth - margin
        }
        const pie: [string, () => void][] = [
            ['Totales', () => {
                textoDerecha(page, money(cabecera.TotalIngreso), xDe('ingreso'), y, size, boldFont, op.colorImportes ? VERDE : TEXTO)
                textoDerecha(page, money(cabecera.TotalSalida), xDe('salida'), y, size, boldFont, op.colorImportes ? ROJO : TEXTO)
            }],
            ['Saldo inicial', () => textoDerecha(page, money(cabecera.SaldoInicial), xDe(op.columnas.saldo ? 'saldo' : 'salida'), y, size, boldFont)],
            ['Saldo final',   () => textoDerecha(page, money(cabecera.SaldoFinal), xDe(op.columnas.saldo ? 'saldo' : 'salida'), y, size, boldFont, tema)],
        ]
        pie.forEach(([etiqueta, valores]) => {
            texto(page, etiqueta, margin + 5, y, size, boldFont)
            valores()
            y -= filaH
        })
    }

    const paginas = pdfDoc.getPages()
    paginas.forEach((p, i) => {
        p.drawLine({ start: { x: margin, y: margin - 6 }, end: { x: pageWidth - margin, y: margin - 6 }, thickness: 0.4, color: BORDE })
        texto(p, `${cabecera.Cuenta} · ${op.titulo || OPCIONES_PDF_DEFECTO.titulo}`, margin, margin - 18, 7, font, GRIS)
        textoDerecha(p, `Página ${i + 1} de ${paginas.length}`, pageWidth - margin, margin - 18, 7, font, GRIS)
    })

    return pdfDoc.save()
}
