'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Loader2 } from 'lucide-react'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { cargarLogoPdf, dibujarCabeceraPdf, truncarPdf } from '@/components/reporte/pdfCabecera'
import { toast } from '@/app/hooks/useToast'
import { SubctaMvtoCabecera, SubctaMvtoDetalle } from '@/app/types/contabilidad-types'

const money = (v: number | string | null | undefined) =>
    Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fechaDMY = (f: string) => {
    if (!f) return ''
    const [a, m, d] = String(f).slice(0, 10).split('-')
    return a && m && d ? `${d}/${m}/${a}` : String(f)
}

interface Props {
    cabecera: SubctaMvtoCabecera
    detalle:  SubctaMvtoDetalle[]
}

const ExportSubctaMvtoPdf: React.FC<Props> = ({ cabecera, detalle }) => {
    const [loading, setLoading] = useState(false)

    const generar = async () => {
        if (loading) return
        setLoading(true)

        try {
            const pdfDoc   = await PDFDocument.create()
            const font     = await pdfDoc.embedFont(StandardFonts.Helvetica)
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
            const logo     = await cargarLogoPdf(pdfDoc)

            // Horizontal: son 7 columnas y el concepto es largo.
            const pageWidth    = 841.89
            const pageHeight   = 595.28
            const margin       = 40
            const contentWidth = pageWidth - margin * 2

            // Fecha, Libro, Documento, Concepto, Ingreso, Salida, Item
            const cols  = [62, 34, 96, 316, 86, 86, 42]
            const heads = ['Fecha', 'Libro', 'Documento', 'Concepto del registro', 'Ingreso', 'Salida', 'Item']
            const derecha = [false, false, false, false, true, true, true]

            let page = pdfDoc.addPage([pageWidth, pageHeight])
            let y = 0
            let saldo = Number(cabecera.SaldoInicial ?? 0)

            const dibujarCabecera = (p: any) => {
                y = dibujarCabeceraPdf({
                    page: p, font, boldFont, logo,
                    pageWidth, pageHeight, margin,
                    subtitulo: 'MOVIMIENTO DE SUB CUENTA CONTABLE',
                    razonSocial: cabecera.Empresa,
                    ruc: cabecera.Ruc,
                    infoDerechaSec: `Impreso: ${new Date().toLocaleDateString('es-PE')}`,
                })

                p.drawText(truncarPdf(cabecera.SubCuenta, contentWidth, 10, boldFont), {
                    x: margin, y, size: 10, font: boldFont,
                })
                y -= 13
                p.drawText(`${cabecera.Periodo}  ·  ${cabecera.Moneda}`, {
                    x: margin, y, size: 8, font, color: rgb(0.3, 0.3, 0.3),
                })
                y -= 16

                // Fila de títulos de columna
                p.drawRectangle({
                    x: margin, y: y - 14, width: contentWidth, height: 16,
                    color: rgb(0.086, 0.192, 0.361),
                })
                let x = margin + 3
                heads.forEach((h, i) => {
                    const ancho = boldFont.widthOfTextAtSize(h, 8)
                    p.drawText(h, {
                        x: derecha[i] ? x + cols[i] - ancho - 6 : x,
                        y: y - 10, size: 8, font: boldFont, color: rgb(1, 1, 1),
                    })
                    x += cols[i]
                })
                y -= 24
            }

            const saltarPagina = () => {
                page = pdfDoc.addPage([pageWidth, pageHeight])
                dibujarCabecera(page)
            }

            dibujarCabecera(page)

            // Saldo inicial como primera línea, igual que en la pantalla.
            page.drawText('Saldo inicial', { x: margin + 3, y, size: 8, font: boldFont })
            const txtIni = money(cabecera.SaldoInicial)
            page.drawText(txtIni, {
                x: pageWidth - margin - cols[6] - 6 - font.widthOfTextAtSize(txtIni, 8),
                y, size: 8, font: boldFont,
            })
            y -= 14

            for (const d of detalle) {
                if (y < margin + 70) saltarPagina()

                saldo += Number(d.Ingreso ?? 0) - Number(d.Salida ?? 0)

                const celdas = [
                    fechaDMY(d.Fecha),
                    d.Libro ?? '',
                    d.Documento ?? '',
                    d.Concepto ?? '',
                    Number(d.Ingreso) ? money(d.Ingreso) : '',
                    Number(d.Salida) ? money(d.Salida) : '',
                    String(d.Item ?? ''),
                ]

                let x = margin + 3
                celdas.forEach((texto, i) => {
                    const recortado = truncarPdf(texto, cols[i] - 8, 7.5, font)
                    const ancho = font.widthOfTextAtSize(recortado, 7.5)
                    page.drawText(recortado, {
                        x: derecha[i] ? x + cols[i] - ancho - 6 : x,
                        y, size: 7.5, font,
                    })
                    x += cols[i]
                })
                y -= 11
            }

            // Pie: Totales, Saldo Inicial y Saldo Final, como el pie de grupo
            // del reporte de Access.
            if (y < margin + 70) saltarPagina()
            y -= 6
            page.drawLine({
                start: { x: margin, y }, end: { x: pageWidth - margin, y },
                thickness: 0.7, color: rgb(0.4, 0.4, 0.4),
            })
            y -= 14

            const xIngreso = margin + cols[0] + cols[1] + cols[2] + cols[3]
            const dibujarPie = (etiqueta: string, valores: { x: number; ancho: number; texto: string }[]) => {
                page.drawText(etiqueta, { x: margin + 3, y, size: 8, font: boldFont })
                valores.forEach(v => {
                    page.drawText(v.texto, {
                        x: v.x + v.ancho - 6 - boldFont.widthOfTextAtSize(v.texto, 8),
                        y, size: 8, font: boldFont,
                    })
                })
                y -= 13
            }

            dibujarPie('Totales:', [
                { x: xIngreso,            ancho: cols[4], texto: money(cabecera.TotalIngreso) },
                { x: xIngreso + cols[4],  ancho: cols[5], texto: money(cabecera.TotalSalida) },
            ])
            dibujarPie('Saldo Inicial:', [
                { x: xIngreso + cols[4],  ancho: cols[5], texto: money(cabecera.SaldoInicial) },
            ])
            dibujarPie('Saldo Final:', [
                { x: xIngreso + cols[4],  ancho: cols[5], texto: money(cabecera.SaldoFinal) },
            ])

            const paginas = pdfDoc.getPages()
            paginas.forEach((p, i) => {
                const txt = `Página ${i + 1} de ${paginas.length}`
                p.drawText(txt, {
                    x: pageWidth - margin - font.widthOfTextAtSize(txt, 8),
                    y: margin / 2, size: 8, font,
                })
            })

            const bytes = await pdfDoc.save()
            const link = document.createElement('a')
            link.href = window.URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
            link.download = `mvto-subcuenta-${cabecera.Cuenta}-${new Date().toISOString().split('T')[0]}.pdf`
            link.click()
            window.URL.revokeObjectURL(link.href)
        } catch (error) {
            console.error('Error al generar el PDF del movimiento de sub cuenta:', error)
            toast({ title: "Error", description: "Ocurrió un error al generar el PDF.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="outline"
            onClick={generar}
            disabled={loading}
            className="shrink-0 gap-2 text-blue-700 border-blue-200 hover:bg-blue-50 bg-background"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {loading ? 'Generando...' : 'Exportar PDF'}
        </Button>
    )
}

export default ExportSubctaMvtoPdf
