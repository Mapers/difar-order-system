'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import {PriceService} from "@/app/services/price/PriceService";

const ExportPdfButton = ({ payload }) => {
  const [loading, setLoading] = useState(false)

  const splitTextIntoLines = (text, maxWidth, font, fontSize) => {
    const words = text.split(' ')
    const lines = []
    let currentLine = words[0]

    for (let i = 1; i < words.length; i++) {
      const word = words[i]
      const testLine = currentLine + ' ' + word
      const width = font.widthOfTextAtSize(testLine, fontSize)

      if (width < maxWidth) {
        currentLine = testLine
      } else {
        lines.push(currentLine)
        currentLine = word
      }
    }

    lines.push(currentLine)
    return lines
  }

  const generatePdf = async () => {
    if (loading) return
    setLoading(true)

    try {

      const response = await PriceService.getPricesAll(payload);
      const data = response.data || [];

      const pdfDoc = await PDFDocument.create()
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      const pageWidth = 595.28
      const pageHeight = 841.89
      const margin = 40

      const empresaNombre = "DROGUERIA CORPORACION CENTRALFARMA E.I.R.L."
      const empresaRuc = "2056138401"

      const addNewPage = () => {
        return pdfDoc.addPage([pageWidth, pageHeight])
      }

      let currentPage = addNewPage()
      let yPosition = pageHeight - margin
      let currentItem = 0
      let pageNumber = 1
      let currentLab = 0

      const drawHeader = (page) => {
        page.drawText(empresaNombre, {
          x: margin,
          y: pageHeight - margin,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0),
        })
        page.drawText(empresaRuc, {
          x: margin,
          y: pageHeight - margin - 12,
          size: 8,
          font,
          color: rgb(0, 0, 0),
        })

        const now = new Date()
        const fecha = now.toLocaleDateString()
        const hora = now.toLocaleTimeString()

        const fechaText = `Fecha: ${fecha} ${hora}`
        const paginaText = `Página: ${pageNumber}`

        const fechaWidth = font.widthOfTextAtSize(fechaText, 8)
        const paginaWidth = font.widthOfTextAtSize(paginaText, 8)

        page.drawText(fechaText, {
          x: pageWidth - margin - fechaWidth,
          y: pageHeight - margin,
          size: 8,
          font,
          color: rgb(0, 0, 0),
        })

        page.drawText(paginaText, {
          x: pageWidth - margin - paginaWidth,
          y: pageHeight - margin - 12,
          size: 8,
          font,
          color: rgb(0, 0, 0),
        })

        page.drawText('LISTA DE PRECIOS POR LOTE', {
          x: margin,
          y: pageHeight - margin - 30,
          size: 12,
          font: boldFont,
          color: rgb(0, 0, 0),
        })

        yPosition = pageHeight - margin - 50
        const columnWidths = [50, 50, 150, 30, 45, 47, 47, 50, 55]
        const columns = ['COD.', 'LAB.', 'DESCRIPCIÓN', 'UM', 'STOCK', 'P.CONTADO', 'P.CREDITO', 'LOTE', 'FEC.VENC.']

        let xPosition = margin
        columns.forEach((column, index) => {
          page.drawText(column, {
            x: xPosition,
            y: yPosition,
            size: 7,
            font: boldFont,
            color: rgb(0, 0, 0),
          })
          xPosition += columnWidths[index]
        })

        page.drawLine({
          start: { x: margin, y: yPosition - 5 },
          end: { x: pageWidth - margin, y: yPosition - 5 },
          thickness: 0.5,
          color: rgb(0, 0, 0),
        })

        yPosition -= 15
      }

      drawHeader(currentPage)

      for (const item of data) {
        if (item.laboratorio_id !== currentLab) {
          currentLab = item.laboratorio_id

          if (yPosition < margin + 30) {
            currentPage = addNewPage()
            pageNumber++
            yPosition = pageHeight - margin
            drawHeader(currentPage)
          }

          currentPage.drawText(item.laboratorio_Descripcion, {
            x: margin,
            y: yPosition,
            size: 9,
            font: boldFont,
            color: rgb(0, 0, 0),
          })

          yPosition -= 15
        }

        if (yPosition < margin + 20) {
          currentPage = addNewPage()
          pageNumber++
          yPosition = pageHeight - margin
          drawHeader(currentPage)

          currentPage.drawText(item.laboratorio_Descripcion, {
            x: margin,
            y: yPosition,
            size: 9,
            font: boldFont,
            color: rgb(0, 0, 0),
          })

          yPosition -= 15
        }

        const columnValues = [
          item.prod_codigo || '',
          item.laboratorio_Descripcion || '',
          item.prod_descripcion || '',
          item.prod_medida || '',
          item.kardex_saldoCant || '',
          item.precio_contado || '',
          item.precio_credito || '',
          item.kardex_lote || '',
          item.kardex_VctoItem || '',
        ]

        const columnWidths = [50, 50, 150, 30, 45, 47, 47, 50, 55]
        let xPosition = margin

        let maxLines = 1
        columnValues.forEach((value, index) => {
          if (index === 2) {
            const lines = splitTextIntoLines(value, columnWidths[index] - 5, font, 7)
            maxLines = Math.max(maxLines, lines.length)
          }
        })

        columnValues.forEach((value, index) => {
          if (index === 2) {
            const lines = splitTextIntoLines(value, columnWidths[index] - 5, font, 7)
            lines.forEach((line, lineIndex) => {
              currentPage.drawText(line, {
                x: xPosition,
                y: yPosition - (lineIndex * 7),
                size: 7,
                font,
                color: rgb(0, 0, 0),
              })
            })
          } else {
            let displayText = String(value)
            const textWidth = font.widthOfTextAtSize(displayText, 7)

            if (textWidth > columnWidths[index] - 5) {
              for (let i = displayText.length; i > 0; i--) {
                const testText = displayText.substring(0, i) + '...'
                if (font.widthOfTextAtSize(testText, 7) <= columnWidths[index] - 5) {
                  displayText = testText
                  break
                }
              }
            }

            currentPage.drawText(displayText, {
              x: xPosition,
              y: yPosition,
              size: 7,
              font,
              color: rgb(0, 0, 0),
            })
          }

          xPosition += columnWidths[index]
        })

        yPosition -= (maxLines * 7) + 5
        currentItem++
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = `lista-precios-lote-${new Date().toISOString().split('T')[0]}.pdf`
      link.click()

    } catch (error) {
      console.error('Error al generar PDF:', error)
      alert('Ocurrió un error al generar el PDF.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={generatePdf}
      disabled={loading}
      variant="outline"
      className="flex items-center gap-2"
    >
      <FileText className="h-4 w-4" />
      {loading ? 'Generando...' : 'Exportar PDF'}
    </Button>
  )
}

export default ExportPdfButton