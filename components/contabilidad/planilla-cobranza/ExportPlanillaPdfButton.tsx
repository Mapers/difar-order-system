'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Printer, Loader2 } from 'lucide-react'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { toast } from '@/app/hooks/use-toast'
import { PlanillaCabecera, PlanillaDetalle } from '@/app/types/planilla-types'
import { fmtFecha, fmtHora, fmtMoney } from '@/lib/planilla.helper'

interface Props {
    planilla: PlanillaCabecera
    detalle:  PlanillaDetalle[]
}

// ─── Definición de columnas ──────────────────────────────────────────────────
// Total anchos = 781 ≈ contentW (841.89 - 30*2 = 781.89)
const COLS: { h: string; w: number; align: 'left' | 'right' | 'center' }[] = [
    { h: '#',              w: 22,  align: 'center' },
    { h: 'Código',         w: 68,  align: 'left'   },
    { h: 'Nombre cliente', w: 158, align: 'left'   },
    { h: 'T/D',            w: 30,  align: 'center' },
    { h: 'Serie',          w: 38,  align: 'center' },
    { h: 'N° Doc',         w: 60,  align: 'left'   },
    { h: 'Importe',        w: 64,  align: 'right'  },
    { h: 'Recibo',         w: 60,  align: 'left'   },
    { h: 'Cobrado',        w: 64,  align: 'right'  },
    { h: 'Banco',          w: 80,  align: 'left'   },
    { h: 'F. Dep.',        w: 57,  align: 'center' },
    { h: 'N° Op.',         w: 80,  align: 'left'   },
]

const PAGE_W   = 841.89   // A4 landscape
const PAGE_H   = 595.28
const MARGIN   = 30
const ROW_H    = 14
const PAD_H    = 2        // padding horizontal interior de celda
const CONTENT_W = PAGE_W - MARGIN * 2   // 781.89

// Colores
const CLR_HEADER_BG   = rgb(0.08, 0.17, 0.32)   // azul marino
const CLR_HEADER_TEXT = rgb(1,    1,    1)
const CLR_ROW_ALT     = rgb(0.96, 0.97, 0.99)   // azul muy claro
const CLR_SEP_HEAVY   = rgb(0.08, 0.17, 0.32)   // mismo que header
const CLR_SEP_LIGHT   = rgb(0.88, 0.88, 0.88)
const CLR_BODY        = rgb(0.08, 0.08, 0.08)
const CLR_TOTAL_DOC   = rgb(0.08, 0.22, 0.62)
const CLR_TOTAL_COB   = rgb(0.04, 0.42, 0.24)
const CLR_META_LABEL  = rgb(0.45, 0.45, 0.45)
const CLR_META_VAL    = rgb(0.08, 0.08, 0.08)
const CLR_OBS         = rgb(0.08, 0.42, 0.18)

export default function ExportPlanillaPdfButton({ planilla, detalle }: Props) {
    const [loading, setLoading] = useState(false)

    const generatePdf = async () => {
        if (!detalle || detalle.length === 0) {
            toast({ title: 'Sin registros', description: 'No hay registros para imprimir.', variant: 'warning' })
            return
        }
        setLoading(true)

        try {
            const pdfDoc   = await PDFDocument.create()
            const font     = await pdfDoc.embedFont(StandardFonts.Helvetica)
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
            const monoFont = await pdfDoc.embedFont(StandardFonts.Courier)

            let page       = pdfDoc.addPage([PAGE_W, PAGE_H])
            let y          = PAGE_H - MARGIN
            let pageNumber = 1

            // Logo
            let logoImage: any = null
            try {
                const bytes = await fetch('/difar-logo.png').then(r => {
                    if (!r.ok) throw new Error()
                    return r.arrayBuffer()
                })
                logoImage = await pdfDoc.embedPng(bytes)
            } catch { /* sin logo */ }

            // ── Header de página ─────────────────────────────────────────
            const drawPageHeader = (p: typeof page) => {
                let titleX = MARGIN

                if (logoImage) {
                    p.drawImage(logoImage, {
                        x: MARGIN, y: PAGE_H - MARGIN - 8,
                        width: 42, height: 26,
                    })
                    titleX = MARGIN + 52
                }

                p.drawText('DROGUERÍA DIFAR', {
                    x: titleX, y: PAGE_H - MARGIN,
                    size: 11, font: boldFont, color: CLR_META_VAL,
                })
                p.drawText('PLANILLA DE COBRANZA', {
                    x: titleX, y: PAGE_H - MARGIN - 13,
                    size: 8, font, color: CLR_META_LABEL,
                })

                // Fecha impresión + página (derecha)
                const now       = new Date()
                const dateStr   = `Impreso: ${now.toLocaleDateString('es-PE')} ${now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`
                const pageStr   = `Página ${pageNumber}`
                p.drawText(dateStr, {
                    x: PAGE_W - MARGIN - font.widthOfTextAtSize(dateStr, 7),
                    y: PAGE_H - MARGIN,
                    size: 7, font, color: CLR_META_LABEL,
                })
                p.drawText(pageStr, {
                    x: PAGE_W - MARGIN - font.widthOfTextAtSize(pageStr, 7),
                    y: PAGE_H - MARGIN - 12,
                    size: 7, font, color: CLR_META_LABEL,
                })

                // Línea separadora
                y = PAGE_H - MARGIN - 34
                p.drawLine({
                    start: { x: MARGIN, y },
                    end:   { x: PAGE_W - MARGIN, y },
                    thickness: 1, color: CLR_SEP_HEAVY,
                })
                y -= 10
            }

            // ── Salto de página ──────────────────────────────────────────
            const checkBreak = (needed: number) => {
                if (y - needed < MARGIN + 24) {
                    page = pdfDoc.addPage([PAGE_W, PAGE_H])
                    pageNumber++
                    drawPageHeader(page)
                    return true
                }
                return false
            }

            // ── Fila de tabla ────────────────────────────────────────────
            const drawTableRow = (
                p: typeof page,
                rowY: number,
                cells: string[],
                isHeader: boolean,
                isAlt: boolean = false,
            ) => {
                // Fondo
                if (isHeader) {
                    p.drawRectangle({
                        x: MARGIN, y: rowY - ROW_H + 2,
                        width: CONTENT_W, height: ROW_H,
                        color: CLR_HEADER_BG,
                    })
                } else if (isAlt) {
                    p.drawRectangle({
                        x: MARGIN, y: rowY - ROW_H + 2,
                        width: CONTENT_W, height: ROW_H,
                        color: CLR_ROW_ALT,
                    })
                }

                const fnt   = isHeader ? boldFont : font
                const size  = 7
                const color = isHeader ? CLR_HEADER_TEXT : CLR_BODY

                let x = MARGIN
                COLS.forEach((col, i) => {
                    const raw  = String(cells[i] ?? '')
                    // Truncar si no cabe
                    let text   = raw
                    const maxW = col.w - PAD_H * 2
                    while (text.length > 0 && fnt.widthOfTextAtSize(text, size) > maxW) {
                        text = text.slice(0, -1)
                    }
                    if (text !== raw) text = text.slice(0, -1) + '…'

                    const textW = fnt.widthOfTextAtSize(text, size)
                    let textX: number
                    if (col.align === 'right') {
                        textX = x + col.w - textW - PAD_H
                    } else if (col.align === 'center') {
                        textX = x + (col.w - textW) / 2
                    } else {
                        textX = x + PAD_H
                    }

                    p.drawText(text, {
                        x: textX,
                        y: rowY - ROW_H + 4,    // padding vertical de celda
                        size, font: fnt, color,
                    })
                    x += col.w
                })
            }

            // ── Línea divisoria de filas ─────────────────────────────────
            const drawRowLine = (p: typeof page, rowY: number) => {
                p.drawLine({
                    start: { x: MARGIN, y: rowY - ROW_H + 2 },
                    end:   { x: PAGE_W - MARGIN, y: rowY - ROW_H + 2 },
                    thickness: 0.25, color: CLR_SEP_LIGHT,
                })
            }

            // ════════════════════════════════════════════════════════════
            // INICIO DEL DOCUMENTO
            // ════════════════════════════════════════════════════════════
            drawPageHeader(page)

            // ── Meta info de planilla (6 columnas iguales) ───────────────
            const metaItems = [
                { label: 'N° Planilla', val: planilla.numero_planilla },
                { label: 'Vendedor',    val: planilla.nombre_vendedor },
                { label: 'Zona',        val: planilla.zona            || '—' },
                { label: 'Fecha ruta',  val: fmtFecha(planilla.fecha_ruta) },
                { label: 'Enviada',     val: planilla.fecha_envio ? fmtHora(planilla.fecha_envio) : '—' },
                { label: 'Estado',      val: planilla.estado.toUpperCase() },
            ]
            const metaColW = CONTENT_W / metaItems.length

            metaItems.forEach((item, i) => {
                const x = MARGIN + i * metaColW
                page.drawText(item.label.toUpperCase(), {
                    x, y,
                    size: 6, font, color: CLR_META_LABEL,
                })
                page.drawText(item.val, {
                    x, y: y - 11,
                    size: 8, font: boldFont, color: CLR_META_VAL,
                })
            })
            y -= 30

            // Observación admin
            if (planilla.observacion_admin) {
                page.drawText(`Nota: ${planilla.observacion_admin}`, {
                    x: MARGIN, y,
                    size: 7, font, color: CLR_OBS,
                })
                y -= 13
            }

            // Línea fina antes de la tabla
            page.drawLine({
                start: { x: MARGIN, y },
                end:   { x: PAGE_W - MARGIN, y },
                thickness: 0.4, color: CLR_SEP_LIGHT,
            })
            y -= 4

            // ── Encabezado de tabla ──────────────────────────────────────
            checkBreak(ROW_H + 4)
            drawTableRow(page, y, COLS.map(c => c.h), true)
            y -= ROW_H

            // ── Filas de datos ───────────────────────────────────────────
            let totalDocs = 0
            let totalCbza = 0

            detalle.forEach((r, idx) => {
                checkBreak(ROW_H + 2)

                const importe = Number(r.importe         ?? 0)
                const cobrado = Number(r.importe_cobrado ?? 0)
                totalDocs += importe
                totalCbza += cobrado

                const isAlt = idx % 2 === 1
                drawTableRow(page, y, [
                    String(idx + 1),
                    r.codigo_cliente    || '—',
                    r.nombre_cliente,
                    r.desc_tipo_documento || r.tipo_documento || '—',
                    r.serie             || '—',
                    r.numero_doc        || '—',
                    fmtMoney(importe),
                    r.numero_recibo     || '—',
                    fmtMoney(cobrado),
                    r.desc_banco        || r.cod_banco || '—',
                    r.fecha_deposito ? fmtFecha(r.fecha_deposito) : '—',
                    r.numero_operacion  || '—',
                ], false, isAlt)

                drawRowLine(page, y)
                y -= ROW_H
            })

            // ── Línea cierre tabla ───────────────────────────────────────
            checkBreak(40)
            y -= 3
            page.drawLine({
                start: { x: MARGIN, y },
                end:   { x: PAGE_W - MARGIN, y },
                thickness: 0.8, color: CLR_SEP_HEAVY,
            })
            y -= 14

            // ── Totales (alineados a la derecha) ─────────────────────────
            const totDocsLabel = 'Total documentos:'
            const totDocsVal   = fmtMoney(totalDocs)
            const totCbzaLabel = 'Total cobrado:'
            const totCbzaVal   = fmtMoney(totalCbza)
            const valColW      = 90   // columna de valores (derecha)
            const lblColW      = 110  // columna de etiquetas

            // Fila total documentos
            page.drawText(totDocsLabel, {
                x: PAGE_W - MARGIN - valColW - lblColW,
                y,
                size: 8, font: boldFont, color: CLR_TOTAL_DOC,
            })
            page.drawText(totDocsVal, {
                x: PAGE_W - MARGIN - valColW + (valColW - boldFont.widthOfTextAtSize(totDocsVal, 8)) - PAD_H,
                y,
                size: 8, font: boldFont, color: CLR_TOTAL_DOC,
            })

            // Fila total cobrado
            page.drawText(totCbzaLabel, {
                x: PAGE_W - MARGIN - valColW - lblColW,
                y: y - 14,
                size: 9, font: boldFont, color: CLR_TOTAL_COB,
            })
            page.drawText(totCbzaVal, {
                x: PAGE_W - MARGIN - valColW + (valColW - boldFont.widthOfTextAtSize(totCbzaVal, 9)) - PAD_H,
                y: y - 14,
                size: 9, font: boldFont, color: CLR_TOTAL_COB,
            })

            // ── Guardar y descargar ──────────────────────────────────────
            const pdfBytes = await pdfDoc.save()
            const blob     = new Blob([pdfBytes], { type: 'application/pdf' })
            const link     = document.createElement('a')
            link.href      = URL.createObjectURL(blob)
            link.download  = `Planilla_${planilla.numero_planilla.replace(/\s/g, '_')}_${planilla.fecha_ruta}.pdf`
            link.click()
            URL.revokeObjectURL(link.href)

        } catch (err) {
            console.error(err)
            toast({ title: 'Error', description: 'No se pudo generar el PDF.', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
            onClick={generatePdf}
            disabled={loading}
        >
            {loading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Printer  className="h-3.5 w-3.5" />}
            {loading ? 'Generando...' : 'Imprimir planilla'}
        </Button>
    )
}