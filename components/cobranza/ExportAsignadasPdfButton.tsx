'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Printer, Loader2 } from 'lucide-react'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { cargarLogoPdf, dibujarCabeceraPdf } from '@/components/reporte/pdfCabecera'
import { format, parseISO } from 'date-fns'
import apiClient from '@/app/api/client'
import { toast } from '@/app/hooks/useToast'
import {
    CobranzaAsignada, ETIQUETA_ESTADO, estadoVisible, simboloMonedaCobranza,
} from '@/app/types/cobranza-types'

interface Props {
    filtros: {
        busqueda?: string
        vendedor?: string
        estado?: string
        fechaDesde?: string
        fechaHasta?: string
    }
    descripcionFiltros: string
}

const COLS: { h: string; w: number; align: 'left' | 'right' | 'center' }[] = [
    { h: '#',        w: 16,  align: 'center' },
    { h: 'Factura',  w: 60,  align: 'left'   },
    { h: 'Cliente',  w: 140, align: 'left'   },
    { h: 'RUC/DNI',  w: 56,  align: 'left'   },
    { h: 'Vendedor', w: 94,  align: 'left'   },
    { h: 'Vence',    w: 44,  align: 'center' },
    { h: 'Saldo',    w: 60,  align: 'right'  },
    { h: 'Estado',   w: 64,  align: 'center' },
]

const PAGE_W    = 595.28   // A4 vertical
const PAGE_H    = 841.89
const MARGIN    = 30
const ROW_H     = 14
const PAD_H     = 2
const CONTENT_W = PAGE_W - MARGIN * 2

const CLR_HEADER_BG   = rgb(0.08, 0.17, 0.32)
const CLR_HEADER_TEXT = rgb(1, 1, 1)
const CLR_ROW_ALT     = rgb(0.96, 0.97, 0.99)
const CLR_SEP_HEAVY   = rgb(0.08, 0.17, 0.32)
const CLR_SEP_LIGHT   = rgb(0.88, 0.88, 0.88)
const CLR_BODY        = rgb(0.08, 0.08, 0.08)
const CLR_VENCIDO     = rgb(0.70, 0.10, 0.10)
const CLR_TOTAL       = rgb(0.08, 0.22, 0.62)
const CLR_META_LABEL  = rgb(0.45, 0.45, 0.45)
const CLR_META_VAL    = rgb(0.08, 0.08, 0.08)

const LIMITE_EXPORTACION = 5000

const fmtFecha = (f: string | null) => {
    if (!f) return '—'
    try { return format(parseISO(f), 'dd/MM/yyyy') } catch { return f.slice(0, 10) }
}

const fmtMonto = (n: number) =>
    n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function ExportAsignadasPdfButton({ filtros, descripcionFiltros }: Props) {
    const [loading, setLoading] = useState(false)

    const generar = async () => {
        setLoading(true)
        try {
            const params: Record<string, string> = {
                limit: String(LIMITE_EXPORTACION),
                offset: '0',
            }
            Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = String(v) })

            const res = await apiClient.get(`/cobranza/asignadas?${new URLSearchParams(params)}`)
            const filas: CobranzaAsignada[] = res.data?.data?.data ?? []
            const total: number = res.data?.data?.total ?? filas.length

            if (filas.length === 0) {
                toast({ title: 'Sin registros', description: 'No hay cobranzas asignadas con esos filtros.', variant: 'warning' })
                return
            }

            const pdfDoc   = await PDFDocument.create()
            const font     = await pdfDoc.embedFont(StandardFonts.Helvetica)
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

            let page       = pdfDoc.addPage([PAGE_W, PAGE_H])
            let y          = PAGE_H - MARGIN
            let pageNumber = 1

            const logoImage = await cargarLogoPdf(pdfDoc)

            const drawPageHeader = (p: typeof page) => {
                const now = new Date()
                const impreso = `Impreso: ${now.toLocaleDateString('es-PE')} `
                    + `${now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`

                y = dibujarCabeceraPdf({
                    page: p, font, boldFont, logo: logoImage,
                    pageWidth: PAGE_W, pageHeight: PAGE_H, margin: MARGIN,
                    subtitulo: 'COBRANZAS ASIGNADAS',
                    infoDerecha: `Página ${pageNumber}`,
                    infoDerechaSec: impreso,
                    filtros: descripcionFiltros,
                })
            }

            const checkBreak = (needed: number) => {
                if (y - needed < MARGIN + 24) {
                    page = pdfDoc.addPage([PAGE_W, PAGE_H])
                    pageNumber++
                    drawPageHeader(page)
                    drawTableRow(page, y, COLS.map(c => c.h), true)
                    y -= ROW_H
                    return true
                }
                return false
            }

            function drawTableRow(
                p: typeof page,
                rowY: number,
                cells: string[],
                isHeader: boolean,
                isAlt = false,
                vencido = false,
            ) {
                if (isHeader) {
                    p.drawRectangle({
                        x: MARGIN, y: rowY - ROW_H + 2,
                        width: CONTENT_W, height: ROW_H, color: CLR_HEADER_BG,
                    })
                } else if (isAlt) {
                    p.drawRectangle({
                        x: MARGIN, y: rowY - ROW_H + 2,
                        width: CONTENT_W, height: ROW_H, color: CLR_ROW_ALT,
                    })
                }

                const fnt   = isHeader ? boldFont : font
                const size  = 7
                const color = isHeader ? CLR_HEADER_TEXT : (vencido ? CLR_VENCIDO : CLR_BODY)

                let x = MARGIN
                COLS.forEach((col, i) => {
                    const raw  = String(cells[i] ?? '')
                    let text   = raw
                    const maxW = col.w - PAD_H * 2
                    while (text.length > 0 && fnt.widthOfTextAtSize(text, size) > maxW) {
                        text = text.slice(0, -1)
                    }
                    if (text !== raw && text.length > 0) text = text.slice(0, -1) + '…'

                    const textW = fnt.widthOfTextAtSize(text, size)
                    const textX = col.align === 'right'
                        ? x + col.w - textW - PAD_H
                        : col.align === 'center'
                            ? x + (col.w - textW) / 2
                            : x + PAD_H

                    p.drawText(text, { x: textX, y: rowY - ROW_H + 4, size, font: fnt, color })
                    x += col.w
                })
            }

            const drawRowLine = (p: typeof page, rowY: number) => {
                p.drawLine({
                    start: { x: MARGIN, y: rowY - ROW_H + 2 },
                    end:   { x: PAGE_W - MARGIN, y: rowY - ROW_H + 2 },
                    thickness: 0.25, color: CLR_SEP_LIGHT,
                })
            }

            // ── Documento ────────────────────────────────────────────────
            drawPageHeader(page)

            const porMoneda = new Map<string, number>()
            const porEstado = new Map<string, number>()
            let vencidas = 0

            filas.forEach(c => {
                const sim = simboloMonedaCobranza(c.moneda)
                porMoneda.set(sim, (porMoneda.get(sim) ?? 0) + Number(c.saldo_actual || 0))
                const est = estadoVisible(c)
                porEstado.set(est, (porEstado.get(est) ?? 0) + 1)
                if (Number(c.esta_vencido) === 1) vencidas++
            })

            const metaItems = [
                { label: 'Documentos', val: String(filas.length) },
                { label: 'Vencidos',   val: String(vencidas) },
                ...[...porEstado.entries()].map(([est, n]) => ({
                    label: ETIQUETA_ESTADO[est] ?? est,
                    val: String(n),
                })),
            ]
            const metaColW = CONTENT_W / Math.max(metaItems.length, 1)

            metaItems.forEach((item, i) => {
                const x = MARGIN + i * metaColW
                page.drawText(item.label.toUpperCase(), { x, y, size: 6, font, color: CLR_META_LABEL })
                page.drawText(item.val, { x, y: y - 11, size: 8, font: boldFont, color: CLR_META_VAL })
            })
            y -= 30

            if (total > filas.length) {
                page.drawText(
                    `Se muestran ${filas.length} de ${total} registros. Acota los filtros para ver el resto.`,
                    { x: MARGIN, y, size: 7, font, color: CLR_VENCIDO },
                )
                y -= 13
            }

            page.drawLine({
                start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y },
                thickness: 0.4, color: CLR_SEP_LIGHT,
            })
            y -= 4

            drawTableRow(page, y, COLS.map(c => c.h), true)
            y -= ROW_H

            filas.forEach((c, idx) => {
                checkBreak(ROW_H + 2)
                const est = estadoVisible(c)
                drawTableRow(page, y, [
                    String(idx + 1),
                    `${c.serie}-${c.numero}`,
                    c.cliente_denominacion || '—',
                    c.cliente_numdoc || '—',
                    c.nombre_vendedor_asignado || c.cod_vendedor_asignado || '—',
                    fmtFecha(c.fecha_vencimiento),
                    `${simboloMonedaCobranza(c.moneda)} ${fmtMonto(Number(c.saldo_actual || 0))}`,
                    ETIQUETA_ESTADO[est] ?? est,
                ], false, idx % 2 === 1, Number(c.esta_vencido) === 1)

                drawRowLine(page, y)
                y -= ROW_H
            })

            // ── Totales por moneda ───────────────────────────────────────
            checkBreak(20 + porMoneda.size * 14)
            y -= 3
            page.drawLine({
                start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y },
                thickness: 0.8, color: CLR_SEP_HEAVY,
            })
            y -= 14

            const valColW = 90
            const lblColW = 130

            ;[...porMoneda.entries()].forEach(([sim, monto]) => {
                const label = `Saldo total ${sim}:`
                const val   = `${sim} ${fmtMonto(monto)}`
                page.drawText(label, {
                    x: PAGE_W - MARGIN - valColW - lblColW, y,
                    size: 9, font: boldFont, color: CLR_TOTAL,
                })
                page.drawText(val, {
                    x: PAGE_W - MARGIN - boldFont.widthOfTextAtSize(val, 9) - PAD_H, y,
                    size: 9, font: boldFont, color: CLR_TOTAL,
                })
                y -= 14
            })

            const pdfBytes = await pdfDoc.save()
            const blob     = new Blob([pdfBytes], { type: 'application/pdf' })
            const link     = document.createElement('a')
            link.href      = URL.createObjectURL(blob)
            link.download  = `Cobranzas_Asignadas_${format(new Date(), 'yyyy-MM-dd')}.pdf`
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
            className="w-full gap-1.5 border-border text-foreground hover:bg-muted lg:w-auto"
            onClick={generar}
            disabled={loading}
        >
            {loading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Printer className="h-3.5 w-3.5" />}
            {loading ? 'Generando...' : 'Exportar PDF'}
        </Button>
    )
}
