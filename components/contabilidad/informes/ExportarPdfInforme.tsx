'use client'

import React, { useState } from 'react'
import { Download } from 'lucide-react'
import { StandardFonts, rgb } from 'pdf-lib'
import { Button } from '@/components/ui/button'
import { toast } from '@/app/hooks/useToast'
import { cargarLogoPdf, dibujarCabeceraPdf, sanitizarPdf, truncarPdf } from '@/components/reporte/pdfCabecera'
import { aclarar, crearPdfReporte, hexARgb, OpcionesPdfReporte } from '@/components/reporte/pdfOpciones'
import { PdfVistaPreviaDialog } from '@/components/reporte/PdfVistaPreviaDialog'
import { ColumnaInforme, FilaInforme, FilaPie, GrupoInforme, TipoColumna, ValoresFila } from '@/app/types/informes-contables-types'
import { armarRenglones, celdasEtiqueta, esNumerica, formatearCelda, textoTotal, textoValor, totales, valorDe } from './formato'

interface Props {
    /** Título por defecto del PDF (editable en la vista previa). */
    titulo: string
    /** Periodo y leyenda de moneda, debajo del título. */
    subtitulo: string
    nombreArchivo: string
    columnas: ColumnaInforme[]
    filas: FilaInforme[] | null
    moneda?: string
    /** Cortes de grupo y filas del pie (los mismos de la tabla en pantalla). */
    grupos?: GrupoInforme[]
    pie?: FilaPie[]
    sinTotal?: boolean
}

/** Peso de ancho de cada tipo de columna; se reparte el ancho de la página en esa proporción. */
const PESO: Record<TipoColumna, number> = {
    texto: 1.2, mono: 1.25, fecha: 1.1, monto: 1.2, entero: 0.95, tc: 0.75, 'si-no': 0.7, moneda: 0.55,
}

/**
 * PDF genérico de los informes contables, con el MISMO formato que los demás reportes del sistema
 * (cabecera con logo y empresa, vista previa con título, nota, color, letra y orientación,
 * encabezado de tabla gris, filas con separador, negativos en rojo y franja de totales con el color principal).
 * Las columnas son las mismas del informe en pantalla y del Excel.
 */
export function ExportarPdfInforme({ titulo, subtitulo, nombreArchivo, columnas, filas, moneda, grupos, pie = [], sinTotal }: Props) {
    const [abierto, setAbierto] = useState(false)
    const muchas = columnas.length > 7
    const DEFECTO: OpcionesPdfReporte = {
        titulo: titulo.toUpperCase(), nota: '', color: '#1a66cc', tamanoLetra: 'normal',
        orientacion: muchas ? 'horizontal' : 'vertical',
    }

    const abrir = () => {
        if (!filas?.length) {
            toast({ title: 'Sin datos', description: 'No hay filas para exportar.', variant: 'warning' })
            return
        }
        setAbierto(true)
    }

    const generar = async (op: OpcionesPdfReporte): Promise<Uint8Array> => {
        const datos = filas ?? []
        const principal = hexARgb(op.color)
        const pdfDoc = await crearPdfReporte(op.tamanoLetra)
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        const horizontal = (op.orientacion ?? DEFECTO.orientacion) === 'horizontal'
        const W = horizontal ? 841.89 : 595.28, H = horizontal ? 595.28 : 841.89, M = 30, ancho = W - M * 2
        const logo = await cargarLogoPdf(pdfDoc)
        let page = pdfDoc.addPage([W, H])
        let y = H - M

        // anchos proporcionales; el nombre (cliente / proveedor) se lleva más espacio
        const pesos = columnas.map(c => (c.movil === 'subtitulo' ? 2.8 : PESO[c.tipo]))
        const suma = pesos.reduce((a, b) => a + b, 0)
        const cols = pesos.map(p => (p / suma) * ancho)
        const size = horizontal ? 6.8 : 6.6
        const t = totales(columnas, datos)

        const cabecera = () => {
            y = dibujarCabeceraPdf({
                page, font, boldFont: bold, logo, pageWidth: W, pageHeight: H, margin: M,
                subtitulo: op.titulo,
                filtros: [subtitulo, op.nota.trim()].filter(Boolean).join('   ·   '),
                infoDerechaSec: `Impreso: ${new Date().toLocaleDateString('es-PE')}`,
            })
        }

        // texto a la izquierda que va justo después de un número alineado a la derecha: se separa un poco
        const sangria = (i: number) => (i > 0 && esNumerica(columnas[i - 1].tipo) && !esNumerica(columnas[i].tipo) ? 8 : 0)
        const fila = (valores: string[], f: any, s: number, color = rgb(0, 0, 0)) => {
            let x = M + 3
            valores.forEach((v, i) => {
                const txt = truncarPdf(v, cols[i] - 5 - sangria(i), s, f)
                const tx = esNumerica(columnas[i].tipo) ? x + cols[i] - f.widthOfTextAtSize(txt, s) - 3 : x + sangria(i)
                page.drawText(txt, { x: tx, y, size: s, font: f, color })
                x += cols[i]
            })
        }

        const encabezadoTabla = () => {
            page.drawRectangle({ x: M, y: y - 4, width: ancho, height: 14, color: rgb(0.9, 0.9, 0.9) })
            fila(columnas.map(c => c.titulo), bold, size)
            y -= 15
        }

        const salto = (necesario: number) => {
            if (y - necesario < M + 12) {
                page = pdfDoc.addPage([W, H])
                cabecera()
                encabezadoTabla()
            }
        }

        cabecera()
        encabezadoTabla()

        /** Fila de grupo, subtotal o pie: texto sobre las columnas sin valor y cada importe en su columna. */
        const filaEtiqueta = (texto: string, valores: ValoresFila | undefined, fondo?: ReturnType<typeof rgb>, color = rgb(0, 0, 0)) => {
            salto(13)
            if (fondo) page.drawRectangle({ x: M, y: y - 4, width: ancho, height: 12, color: fondo })
            const { span } = celdasEtiqueta(columnas, valores)
            const anchoTexto = cols.slice(0, span).reduce((a, b) => a + b, 0)
            page.drawText(truncarPdf(texto, anchoTexto - 5, size, bold), { x: M + 3, y, size, font: bold, color })
            let x = M + anchoTexto
            columnas.slice(span).forEach((c, k) => {
                const i = span + k
                const txt = truncarPdf(textoValor(c, valores, moneda), cols[i] - 5, size, bold)
                if (txt) page.drawText(txt, { x: x + cols[i] - bold.widthOfTextAtSize(txt, size) - 3, y, size, font: bold, color })
                x += cols[i]
            })
            y -= 12
        }

        const importe = columnas.find(c => c.movil === 'importe')
        for (const reng of armarRenglones(columnas, datos, grupos)) {
            if (reng.tipo === 'grupo') { filaEtiqueta(reng.texto, reng.valores, rgb(0.91, 0.94, 0.98)); continue }
            if (reng.tipo === 'subtotal') { filaEtiqueta(reng.texto, reng.valores, rgb(0.95, 0.95, 0.95)); continue }
            const f = reng.fila
            salto(13)
            const negativo = importe ? Number(valorDe(importe, f)) < 0 : false
            const alerta = columnas.some(c => c.alerta?.(f))
            fila(columnas.map(c => formatearCelda(c, f, moneda)), font, size,
                negativo || alerta ? rgb(0.75, 0.1, 0.1) : rgb(0, 0, 0))
            page.drawLine({ start: { x: M, y: y - 4 }, end: { x: W - M, y: y - 4 }, thickness: 0.4, color: rgb(0.85, 0.85, 0.85) })
            y -= 12
        }

        // franja de totales con el color principal (igual que "TOTAL GENERAL" de los otros reportes)
        if (!sinTotal && columnas.some(c => c.total)) {
            salto(30)
            y -= 4
            page.drawRectangle({ x: M, y: y - 8, width: ancho, height: 18, color: aclarar(principal, 0.85), borderColor: principal, borderWidth: 0.8 })
            let x = M + 3
            columnas.forEach((c, i) => {
                let txt = ''
                if (i === 0) txt = `TOTAL (${datos.length})`
                else if (c.total) txt = c.tipo === 'monto' ? textoTotal(c, datos, moneda) : t[c.campo].toLocaleString('en-US')
                if (txt) {
                    const s = truncarPdf(txt, (i === 0 ? cols[0] + cols[1] : cols[i]) - 4, size + 0.4, bold)
                    const tx = i === 0 ? x : x + cols[i] - bold.widthOfTextAtSize(s, size + 0.4) - 3
                    page.drawText(s, { x: tx, y: y - 2, size: size + 0.4, font: bold, color: principal })
                }
                x += cols[i]
            })
            y -= 20
        }
        // pie del reporte ("Vienen Mes Anterior", "Total Acumulado", diferencias...)
        for (const p of pie) filaEtiqueta(p.texto, p.valores, p.destacada ? aclarar(principal, 0.85) : undefined, p.destacada ? principal : rgb(0, 0, 0))

        // número de página en el pie
        const paginas = pdfDoc.getPages()
        paginas.forEach((p, i) => {
            const pie = sanitizarPdf(`Página ${i + 1} de ${paginas.length}`)
            p.drawText(pie, { x: W - M - font.widthOfTextAtSize(pie, 7), y: M - 14, size: 7, font, color: rgb(0.45, 0.45, 0.45) })
        })

        return pdfDoc.save()
    }

    return (
        <>
            <Button variant="outline" className="w-full sm:w-auto" onClick={abrir} disabled={!filas?.length}>
                <Download className="mr-2 h-4 w-4" /> PDF
            </Button>
            <PdfVistaPreviaDialog
                abierto={abierto}
                onCerrar={() => setAbierto(false)}
                titulo={titulo}
                defecto={DEFECTO}
                archivoDefecto={nombreArchivo}
                generar={generar}
            />
        </>
    )
}
