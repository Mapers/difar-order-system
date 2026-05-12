'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Loader2 } from 'lucide-react'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { format, parseISO, addHours } from 'date-fns'
import { Comprobante, GuiaRemision } from '@/app/types/order/order-interface'
import { Sequential } from '@/app/types/config-types'

// ─── Props ────────────────────────────────────────────────────────────────────

type ReportType = 'comprobantes' | 'notas' | 'guias'

interface ExportRegistroButtonProps {
    type             : ReportType
    data?            : Comprobante[]
    guias?           : GuiaRemision[]
    tiposComprobante?: Sequential[]
    mesLabel?        : string
    empresaNombre?   : string
    empresaRuc?      : string
}

type ColDef = { label: string; width: number; align: 'left' | 'right' | 'center' }

const COLS_COMPROBANTES: ColDef[] = [
    { label: 'F.Emision',    width: 55,  align: 'left'   },
    { label: 'Doc',          width: 28,  align: 'left'   },
    { label: 'Serie',        width: 36,  align: 'left'   },
    { label: 'NroDesde',     width: 46,  align: 'left'   },
    { label: 'F.Vcto.',      width: 52,  align: 'left'   },
    { label: 'Cliente',      width: 135, align: 'left'   },
    { label: 'D.I.',         width: 28,  align: 'center' },
    { label: 'Nº D.I.',      width: 65,  align: 'left'   },
    { label: 'T/C',          width: 26,  align: 'center' },
    { label: 'No Grabado',   width: 52,  align: 'right'  },
    { label: 'B.Imponible',  width: 54,  align: 'right'  },
    { label: 'IGV',          width: 46,  align: 'right'  },
    { label: 'Total',        width: 50,  align: 'right'  },
    { label: 'F.Emision',    width: 50,  align: 'left'   },
    { label: 'Serie Numero', width: 73,  align: 'left'   },
]

const COLS_NOTAS: ColDef[] = [
    { label: 'F.Emision',    width: 55,  align: 'left'   },
    { label: 'Doc',          width: 28,  align: 'left'   },
    { label: 'Serie',        width: 36,  align: 'left'   },
    { label: 'Número',       width: 46,  align: 'left'   },
    { label: 'F.Vcto.',      width: 52,  align: 'left'   },
    { label: 'Cliente',      width: 160, align: 'left'   },
    { label: 'D.I.',         width: 28,  align: 'center' },
    { label: 'Nº D.I.',      width: 70,  align: 'left'   },
    { label: 'T/C',          width: 26,  align: 'center' },
    { label: 'No Grabado',   width: 52,  align: 'right'  },
    { label: 'B.Imponible',  width: 54,  align: 'right'  },
    { label: 'IGV',          width: 46,  align: 'right'  },
    { label: 'Total',        width: 54,  align: 'right'  },
]

const COLS_GUIAS: ColDef[] = [
    { label: 'F.Emision',    width: 55,  align: 'left'   },
    { label: 'Serie',        width: 46,  align: 'left'   },
    { label: 'Número',       width: 50,  align: 'left'   },
    { label: 'Cliente',      width: 185, align: 'left'   },
    { label: 'D.I.',         width: 28,  align: 'center' },
    { label: 'Nº D.I.',      width: 80,  align: 'left'   },
    { label: 'Comprobante',  width: 95,  align: 'left'   },
    { label: 'Estado',       width: 60,  align: 'center' },
    { label: 'Cód. SUNAT',   width: 62,  align: 'center' },
]

// ─── Helpers (igual que ExportPdfButton) ──────────────────────────────────────

function safeDate(str: string | null | undefined, offset = 0): string {
    if (!str) return '—'
    try {
        const d = offset ? addHours(parseISO(str), offset) : parseISO(str)
        return format(d, 'dd/MM/yyyy')
    } catch { return '—' }
}

function fmtMoney(val: number): string {
    return val.toFixed(2)
}

function calcBase(total: string | null): number {
    const t = Number(total)
    return isNaN(t) ? 0 : t / 1.18
}

function calcIGV(total: string | null): number {
    const t = Number(total)
    return isNaN(t) ? 0 : t - t / 1.18
}

// Idéntica a ExportPdfButton
function splitTextIntoLines(
    text: string,
    maxWidth: number,
    font: any,
    fontSize: number
): string[] {
    if (!text) return ['']
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''
    for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word
        if (font.widthOfTextAtSize(testLine, fontSize) <= maxWidth) {
            currentLine = testLine
        } else {
            if (currentLine) lines.push(currentLine)
            currentLine = word
        }
    }
    if (currentLine) lines.push(currentLine)
    return lines.length > 0 ? lines : ['']
}

export function ExportRegistroButton({
                                         type,
                                         data             = [],
                                         guias            = [],
                                         tiposComprobante = [],
                                         mesLabel,
                                         empresaNombre    = 'DISTRIBUIDORA E IMPORTADORA FARMACEUTICA S.A.C.',
                                         empresaRuc       = '20481321892',
                                     }: ExportRegistroButtonProps) {

    const [loading, setLoading] = useState(false)

    const TITLES: Record<ReportType, string> = {
        comprobantes : 'Registro Ventas',
        notas        : 'Registro Notas de Crédito',
        guias        : 'Registro Guías de Remisión',
    }

    const generatePdf = async () => {
        if (loading) return
        setLoading(true)

        try {
            const pdfDoc   = await PDFDocument.create()
            const font     = await pdfDoc.embedFont(StandardFonts.Helvetica)
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

            // ── Mismas métricas que ExportPdfButton ──
            const pageWidth    = 841.89
            const pageHeight   = 595.28
            const margin       = 40
            const minYPosition = margin + 20
            const baseFontSize = 7

            const cols: ColDef[] =
                type === 'comprobantes' ? COLS_COMPROBANTES :
                    type === 'notas'        ? COLS_NOTAS        :
                        COLS_GUIAS

            const totalColsW = cols.reduce((s, c) => s + c.width, 0)

            const mesStr = mesLabel
                ?? `${format(new Date(), 'MMMM')} del ${format(new Date(), 'yyyy')}`
                    .replace(/^\w/, c => c.toUpperCase())

            // ── Logo igual que ExportPdfButton ──
            let logoImage: any = null
            try {
                const logoBytes = await fetch('/difar-logo.png').then(r => {
                    if (!r.ok) throw new Error('no logo')
                    return r.arrayBuffer()
                })
                logoImage = await pdfDoc.embedPng(logoBytes)
            } catch { /* continúa sin logo */ }

            // ── addNewPage igual que ExportPdfButton ──
            const addNewPage = () => pdfDoc.addPage([pageWidth, pageHeight])

            let currentPage = addNewPage()
            let yPosition   = pageHeight - margin
            let pageNumber  = 1

            // ── drawHeader — estructura idéntica a ExportPdfButton ──
            const drawHeader = (page: any) => {
                let titleXPos = margin

                // Logo
                if (logoImage) {
                    page.drawImage(logoImage, {
                        x: margin, y: pageHeight - margin - 15,
                        width: 50, height: 30,
                    })
                    titleXPos = margin + 50 + 10
                }

                // Empresa
                page.drawText(empresaNombre, {
                    x: titleXPos, y: pageHeight - margin,
                    size: 10, font: boldFont, color: rgb(0, 0, 0),
                })
                page.drawText(empresaRuc, {
                    x: titleXPos, y: pageHeight - margin - 12,
                    size: 8, font, color: rgb(0, 0, 0),
                })

                // Fecha + página (derecha) — igual que ExportPdfButton
                const now        = new Date()
                const fechaText  = `Fecha: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`
                const paginaText = `Página: ${pageNumber}`
                const fechaWidth  = font.widthOfTextAtSize(fechaText,  8)
                const paginaWidth = font.widthOfTextAtSize(paginaText, 8)

                page.drawText(fechaText, {
                    x: pageWidth - margin - fechaWidth,
                    y: pageHeight - margin,
                    size: 8, font, color: rgb(0, 0, 0),
                })
                page.drawText(paginaText, {
                    x: pageWidth - margin - paginaWidth,
                    y: pageHeight - margin - 12,
                    size: 8, font, color: rgb(0, 0, 0),
                })

                // Título centrado — igual que ExportPdfButton
                const titleText  = TITLES[type]
                const titleWidth = boldFont.widthOfTextAtSize(titleText, 12)
                page.drawText(titleText, {
                    x: (pageWidth - titleWidth) / 2,
                    y: pageHeight - margin - 30,
                    size: 12, font: boldFont, color: rgb(0, 0, 0),
                })

                // Mes (bajo el título, como en la imagen)
                const mesW = font.widthOfTextAtSize(`Mes  ${mesStr}`, 9)
                page.drawText(`Mes  ${mesStr}`, {
                    x: (pageWidth - mesW) / 2,
                    y: pageHeight - margin - 43,
                    size: 9, font, color: rgb(0, 0, 0),
                })

                yPosition = pageHeight - margin - 57

                // Cabecera de columnas — igual que ExportPdfButton
                let xPosition = margin
                cols.forEach(col => {
                    page.drawText(col.label, {
                        x: xPosition + 2, y: yPosition,
                        size: baseFontSize, font: boldFont, color: rgb(0, 0, 0),
                    })
                    xPosition += col.width
                })

                // Línea bajo columnas — igual que ExportPdfButton
                page.drawLine({
                    start: { x: margin,              y: yPosition - 5 },
                    end:   { x: margin + totalColsW, y: yPosition - 5 },
                    thickness: 1, color: rgb(0, 0, 0),
                })

                yPosition -= 15
            }

            drawHeader(currentPage)

            // ── Acumuladores totales ──
            let totBase  = 0
            let totIGV   = 0
            let totTotal = 0

            // ── drawRow — igual que ExportPdfButton dibuja cada item ──
            const drawRow = (page: any, cells: string[], anulado: boolean) => {
                const rowColor = anulado ? rgb(0.7, 0, 0) : rgb(0, 0, 0)
                let xPosition  = margin

                cells.forEach((cell, i) => {
                    const col   = cols[i]
                    const maxW  = col.width - 4
                    // usa splitTextIntoLines igual que ExportPdfButton, toma 1ra línea
                    const lines = splitTextIntoLines(cell ?? '—', maxW, font, baseFontSize)
                    const txt   = lines[0] ?? ''
                    const tw    = font.widthOfTextAtSize(txt, baseFontSize)
                    const tx    = col.align === 'right'  ? xPosition + col.width - tw - 2
                        : col.align === 'center' ? xPosition + (col.width - tw) / 2
                            : xPosition + 2

                    page.drawText(txt, {
                        x: tx, y: yPosition,
                        size: baseFontSize, font, color: rowColor,
                    })
                    xPosition += col.width
                })

                // Línea separadora — igual que ExportPdfButton
                page.drawLine({
                    start: { x: margin,              y: yPosition - 4 },
                    end:   { x: margin + totalColsW, y: yPosition - 4 },
                    thickness: 0.2, color: rgb(0.8, 0.8, 0.8),
                })

                yPosition -= 12
            }

            // ── Comprobantes ──────────────────────────────────────────────────
            if (type === 'comprobantes') {
                for (const c of data) {
                    if (yPosition - 12 < minYPosition) {
                        currentPage = addNewPage()
                        pageNumber++
                        yPosition   = pageHeight - margin
                        drawHeader(currentPage)
                    }

                    const base    = calcBase(c.total)
                    const igv     = calcIGV(c.total)
                    const total   = Number(c.total) || 0
                    const anulado = c.anulado

                    // tipo_comprobante es number | null en la interface
                    const tiDoc = c.tipo_comprobante === 1 ? 'FAC'
                        : c.tipo_comprobante === 3 ? 'BOL'
                            : c.tipo_comprobante === 7 ? 'NC'
                                : String(c.tipo_comprobante ?? '—')

                    const moneda = c.moneda === 1 ? 'S/' : '$'
                    const tiDI   = c.tipo_comprobante === 1 ? 'RUC' : 'DNI'

                    if (!anulado) { totBase += base; totIGV += igv; totTotal += total }

                    drawRow(currentPage, [
                        safeDate(c.fecha_envio, 5),
                        tiDoc,
                        c.serie,
                        c.numero,
                        safeDate(c.fecha_emision ?? c.fecha_envio, 5),
                        c.cliente_denominacion ?? '—',
                        tiDI,
                        c.cliente_numdoc ?? '—',
                        moneda,
                        '0.00',
                        fmtMoney(base),
                        fmtMoney(igv),
                        fmtMoney(total),
                        '—',   // F.Emision comprobante original (no disponible en interface)
                        '—',   // Serie Numero comprobante original
                    ], anulado)
                }
            }

            // ── Notas de crédito ──────────────────────────────────────────────
            if (type === 'notas') {
                for (const c of data) {
                    if (yPosition - 12 < minYPosition) {
                        currentPage = addNewPage()
                        pageNumber++
                        yPosition   = pageHeight - margin
                        drawHeader(currentPage)
                    }

                    const base    = calcBase(c.total)
                    const igv     = calcIGV(c.total)
                    const total   = Number(c.total) || 0
                    const anulado = c.anulado
                    const moneda  = c.moneda === 1 ? 'S/' : '$'
                    const tiDI    = c.tipo_comprobante === 1 ? 'RUC' : 'DNI'

                    if (!anulado) { totBase += base; totIGV += igv; totTotal += total }

                    drawRow(currentPage, [
                        safeDate(c.fecha_envio),
                        'NC',
                        c.serie,
                        c.numero,
                        safeDate(c.fecha_emision ?? c.fecha_envio),
                        c.cliente_denominacion ?? '—',
                        tiDI,
                        c.cliente_numdoc ?? '—',
                        moneda,
                        '0.00',
                        fmtMoney(base),
                        fmtMoney(igv),
                        fmtMoney(total),
                    ], anulado)
                }
            }

            // ── Guías ─────────────────────────────────────────────────────────
            if (type === 'guias') {
                for (const g of guias) {
                    if (yPosition - 12 < minYPosition) {
                        currentPage = addNewPage()
                        pageNumber++
                        yPosition   = pageHeight - margin
                        drawHeader(currentPage)
                    }

                    // sunat_responsecode es string | null en la interface
                    const estado =
                        !g.idGuiaRemCab                        ? 'NO USADO'
                            : g.sunat_responsecode !== '0'         ? 'ERROR SUNAT'
                                : g.anulado                            ? 'ANULADO'
                                    : 'ACEPTADO'

                    // comprobante_numero es number | null en la interface
                    const compRef =
                        g.comprobante_serie && g.comprobante_numero != null
                            ? `${g.comprobante_serie}-${g.comprobante_numero}`
                            : '—'

                    drawRow(currentPage, [
                        safeDate(g.fecha_emision),
                        g.serie,
                        String(Number(g.numero)),
                        g.cliente_denominacion,
                        'DNI/RUC',
                        g.cliente_num_doc,
                        compRef,
                        estado,
                        g.sunat_responsecode ?? '—',
                    ], g.anulado)
                }
            }

            // ── Fila de totales (comprobantes y notas) ────────────────────────
            if (type !== 'guias' && data.length > 0) {
                if (yPosition - 14 < minYPosition) {
                    currentPage = addNewPage()
                    pageNumber++
                    yPosition   = pageHeight - margin
                    drawHeader(currentPage)
                }

                currentPage.drawLine({
                    start: { x: margin,              y: yPosition + 4 },
                    end:   { x: margin + totalColsW, y: yPosition + 4 },
                    thickness: 0.8, color: rgb(0, 0, 0),
                })

                currentPage.drawText('TOTALES', {
                    x: margin + 2, y: yPosition,
                    size: baseFontSize, font: boldFont, color: rgb(0, 0, 0),
                })

                const totMap: Record<string, string> = {
                    'No Grabado':  '0.00',
                    'B.Imponible': fmtMoney(totBase),
                    'IGV':         fmtMoney(totIGV),
                    'Total':       fmtMoney(totTotal),
                }

                let tx = margin
                cols.forEach(col => {
                    const val = totMap[col.label]
                    if (val) {
                        const vw = boldFont.widthOfTextAtSize(val, baseFontSize)
                        currentPage.drawText(val, {
                            x: tx + col.width - vw - 2, y: yPosition,
                            size: baseFontSize, font: boldFont, color: rgb(0, 0, 0),
                        })
                    }
                    tx += col.width
                })
            }

            // ── Guardar y descargar — igual que ExportPdfButton ──
            const pdfBytes = await pdfDoc.save()
            const blob     = new Blob([pdfBytes], { type: 'application/pdf' })
            const link     = document.createElement('a')
            link.href      = window.URL.createObjectURL(blob)
            link.download  = `registro-${type}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
            link.click()

        } catch (error) {
            console.error('Error al generar PDF:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="outline"
            disabled={loading}
            onClick={generatePdf}
            className="flex items-center gap-2"
        >
            {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <FileText className="h-4 w-4" />
            }
            {loading ? 'Generando...' : 'Exportar PDF'}
        </Button>
    )
}