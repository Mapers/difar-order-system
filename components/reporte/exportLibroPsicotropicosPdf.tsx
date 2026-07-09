'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { toast } from '@/app/hooks/useToast'

interface Producto {
    id: string; dci: string; conc: string; forma: string
    lista: string; unidad: string; saldoIni: number
}
interface Movimiento {
    id: string; fecha: string; tipo: 'INGRESO' | 'EGRESO'
    prodId: string; serie: string; corr: string; estab: string; cant: number
}
interface LibroConfig {
    razon: string; ruc: string; dir: string; dt: string; anio: number; folio: string
}

interface Props {
    config: LibroConfig
    productos: Producto[]
    movimientos: Movimiento[]
    anio: string
    disabled?: boolean
}

export const ExportLibroPsicotropicosPdf: React.FC<Props> = ({
    config, productos, movimientos, anio, disabled = false
}) => {
    const [loading, setLoading] = useState(false)

    const fmt = (n: number) => n.toLocaleString('es-PE')

    const generatePdf = async () => {
        if (!productos.length) return
        setLoading(true)

        try {
            const pdfDoc  = await PDFDocument.create()
            const font     = await pdfDoc.embedFont(StandardFonts.Helvetica)
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

            const pageWidth  = 595.28
            const pageHeight = 841.89
            const margin     = 36
            const cw         = pageWidth - margin * 2   // 523

            // Column widths (total = 523)
            const cols = [26, 26, 90, 148, 66, 66, 70]
            const colHdrs = ['Mes', 'Día', 'Comprobante', 'Establecimiento', 'Debe', 'Haber', 'Saldo']

            let page      = pdfDoc.addPage([pageWidth, pageHeight])
            let y         = pageHeight - margin

            // ── Logo ──────────────────────────────────────────────────────
            let logoImage: any = null
            try {
                const bytes = await fetch('/difar-logo.png').then(r => {
                    if (!r.ok) throw new Error()
                    return r.arrayBuffer()
                })
                logoImage = await pdfDoc.embedPng(bytes)
            } catch { /* sin logo */ }

            // ── drawHeader (se repite en cada página nueva) ───────────────
            const drawHeader = () => {
                let titleX = margin
                if (logoImage) {
                    page.drawImage(logoImage, { x: margin, y: pageHeight - margin - 15, width: 50, height: 30 })
                    titleX = margin + 60
                }

                page.drawText('DROGUERÍA DIFAR', {
                    x: titleX, y: pageHeight - margin,
                    size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.2)
                })
                page.drawText('LIBRO DE CONTROL DE PSICOTRÓPICOS Y ESTUPEFACIENTES', {
                    x: titleX, y: pageHeight - margin - 14,
                    size: 9, font: boldFont, color: rgb(0, 0, 0)
                })

                const dateStr = `Impreso: ${new Date().toLocaleDateString('es-PE')}`
                page.drawText(dateStr, {
                    x: pageWidth - margin - font.widthOfTextAtSize(dateStr, 7),
                    y: pageHeight - margin,
                    size: 7, font, color: rgb(0.4, 0.4, 0.4)
                })

                // Línea separadora header
                page.drawLine({
                    start: { x: margin, y: pageHeight - margin - 22 },
                    end:   { x: pageWidth - margin, y: pageHeight - margin - 22 },
                    thickness: 0.5, color: rgb(0.7, 0.7, 0.7)
                })

                y = pageHeight - margin - 32
            }

            // ── Bloque de empresa (solo en la primera página) ─────────────
            const drawEmpresaBlock = () => {
                page.drawRectangle({
                    x: margin, y: y - 38, width: cw, height: 42,
                    color: rgb(0.96, 0.96, 0.96),
                    borderColor: rgb(0.82, 0.82, 0.82), borderWidth: 0.8
                })
                page.drawText(`RUC: ${config.ruc}   ·   ${config.razon}`, {
                    x: margin + 6, y: y - 12, size: 7, font: boldFont
                })
                const dir = config.dir.length > 100 ? config.dir.substring(0, 100) + '…' : config.dir
                page.drawText(`Domicilio: ${dir}`, {
                    x: margin + 6, y: y - 23, size: 7, font
                })
                page.drawText(`Director Técnico: ${config.dt || '—'}`, {
                    x: margin + 6, y: y - 34, size: 7, font
                })
                page.drawText(`Año: ${config.anio}   ·   Folio N°: ${config.folio || '—'}`, {
                    x: margin + 300, y: y - 34, size: 7, font: boldFont
                })
                y -= 50
            }

            // ── Cabecera de columnas de la tabla ──────────────────────────
            const drawColHeaders = () => {
                page.drawRectangle({
                    x: margin, y: y - 12, width: cw, height: 14,
                    color: rgb(0.88, 0.88, 0.88)
                })
                let xc = margin + 3
                colHdrs.forEach((h, i) => {
                    const isNum = i >= 4
                    const tw = boldFont.widthOfTextAtSize(h, 6.5)
                    const xh = isNum ? xc + cols[i] - tw - 3 : xc
                    page.drawText(h, { x: xh, y: y - 9, size: 6.5, font: boldFont, color: rgb(0.25, 0.25, 0.25) })
                    xc += cols[i]
                })
                y -= 14
            }

            // ── checkPageBreak ────────────────────────────────────────────
            const checkBreak = (needed: number) => {
                if (y - needed < margin + 10) {
                    page = pdfDoc.addPage([pageWidth, pageHeight])
                    drawHeader()
                    drawColHeaders()
                }
            }

            // ── INICIO ────────────────────────────────────────────────────
            drawHeader()
            drawEmpresaBlock()

            // ── Por cada PRODUCTO ─────────────────────────────────────────
            for (const prod of productos) {
                const movsProd = movimientos
                    .filter(m => m.prodId === prod.id)
                    .sort((a, b) => a.fecha === b.fecha ? a.id.localeCompare(b.id) : a.fecha.localeCompare(b.fecha))

                checkBreak(30)
                y -= 6

                // Header del producto (slate-800)
                const prodTitle = `${prod.dci}${prod.conc ? '  ·  ' + prod.conc.trim() : ''}  [${prod.lista}]`
                page.drawRectangle({
                    x: margin, y: y - 12, width: cw, height: 15,
                    color: rgb(0.13, 0.13, 0.13)
                })
                page.drawText(prodTitle.substring(0, 90), {
                    x: margin + 5, y: y - 9,
                    size: 7, font: boldFont, color: rgb(1, 1, 1)
                })
                y -= 15

                drawColHeaders()

                // Fila saldo inicial (ámbar claro)
                checkBreak(12)
                page.drawRectangle({
                    x: margin, y: y - 10, width: cw, height: 12,
                    color: rgb(1, 0.97, 0.88),
                    borderColor: rgb(0.9, 0.85, 0.6), borderWidth: 0.4
                })
                let xs = margin + 3
                const saldoIniTexts = ['—', '—', '—', 'Saldo Inicial',
                    prod.saldoIni > 0 ? fmt(prod.saldoIni) : '—', '—', fmt(prod.saldoIni)]
                saldoIniTexts.forEach((t, i) => {
                    const isNum = i >= 4
                    const tw = boldFont.widthOfTextAtSize(t, 6.5)
                    const xt = isNum ? xs + cols[i] - tw - 3 : xs + 1
                    page.drawText(t, {
                        x: xt, y: y - 7.5,
                        size: 6.5, font: boldFont,
                        color: i === 3 ? rgb(0.5, 0.35, 0) : rgb(0.2, 0.2, 0.2)
                    })
                    xs += cols[i]
                })
                y -= 12

                // Filas de movimientos con saldo corriente
                let saldoCorriente = prod.saldoIni
                let rowIdx = 0

                for (const m of movsProd) {
                    checkBreak(11)
                    const isIng = m.tipo === 'INGRESO'
                    if (isIng) saldoCorriente += m.cant
                    else saldoCorriente -= m.cant

                    const [, mes, dia] = m.fecha.split('-')
                    const negativo = saldoCorriente < 0
                    const bg = rowIdx % 2 === 0 ? rgb(1, 1, 1) : rgb(0.97, 0.97, 0.97)

                    page.drawRectangle({ x: margin, y: y - 10, width: cw, height: 11, color: bg })

                    const rowTexts = [
                        mes, dia,
                        `${m.serie}-${m.corr}`,
                        m.estab.length > 28 ? m.estab.substring(0, 28) + '…' : m.estab,
                        isIng ? fmt(m.cant) : '',
                        !isIng ? fmt(m.cant) : '',
                        fmt(saldoCorriente)
                    ]

                    let xr = margin + 3
                    rowTexts.forEach((t, i) => {
                        if (!t) { xr += cols[i]; return }
                        const isNum  = i >= 4
                        const tw     = font.widthOfTextAtSize(t, 6.5)
                        const xrt    = isNum ? xr + cols[i] - tw - 3 : xr + 1
                        const color  = i === 4 ? rgb(0.05, 0.45, 0.15)
                                     : i === 5 ? rgb(0.7, 0.1, 0.1)
                                     : i === 6 ? (negativo ? rgb(0.8, 0.05, 0.05) : rgb(0.1, 0.1, 0.1))
                                     : rgb(0.15, 0.15, 0.15)
                        page.drawText(t, { x: xrt, y: y - 7.5, size: 6.5, font, color })
                        xr += cols[i]
                    })

                    // Línea divisoria
                    page.drawLine({
                        start: { x: margin, y: y - 10 },
                        end:   { x: pageWidth - margin, y: y - 10 },
                        thickness: 0.3, color: rgb(0.87, 0.87, 0.87)
                    })

                    y -= 11
                    rowIdx++
                }

                // Fila de saldo final
                checkBreak(13)
                page.drawRectangle({
                    x: margin, y: y - 11, width: cw, height: 13,
                    color: rgb(0.13, 0.13, 0.13)
                })
                const sfText = fmt(saldoCorriente)
                const sfW    = boldFont.widthOfTextAtSize(sfText, 7)
                page.drawText('SALDO FINAL:', {
                    x: margin + 5, y: y - 8, size: 7, font: boldFont, color: rgb(0.8, 0.8, 0.8)
                })
                page.drawText(sfText, {
                    x: pageWidth - margin - sfW - 3, y: y - 8,
                    size: 7, font: boldFont,
                    color: saldoCorriente < 0 ? rgb(1, 0.4, 0.4) : rgb(0.4, 1, 0.6)
                })
                y -= 14
            }

            // ── Guardar y descargar ────────────────────────────────────────
            const pdfBytes = await pdfDoc.save()
            const blob = new Blob([pdfBytes], { type: 'application/pdf' })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = `libro-psicotropicos-${anio}.pdf`
            link.click()

        } catch (err) {
            console.error('Error PDF libro psico:', err)
            toast({ title: 'Error', description: 'No se pudo generar el PDF.', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs bg-background text-red-700 border-red-200 hover:bg-red-50"
            onClick={generatePdf}
            disabled={disabled || loading}
        >
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            {loading ? 'Generando…' : 'Exportar PDF'}
        </Button>
    )
}
