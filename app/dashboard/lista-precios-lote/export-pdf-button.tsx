'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import {PriceService} from "@/app/services/price/PriceService";
import moment from "moment";

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
        const columnWidths = [50, 120, 50, 50, 54, 45, 85, 95, 95]
        const columns = ['COD.', 'DESCRIPCIÓN', 'LOTE', 'VCTO', 'UM', 'STOCK', 'P.CONTADO', 'P.CREDITO']

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

        const columnWidths = [50, 120, 50, 50, 54, 45, 85, 95, 95]
        let xPosition = margin

        let maxLines = 1

        const descLines = splitTextIntoLines(item.prod_descripcion || '', columnWidths[1] - 5, font, 7)
        maxLines = Math.max(maxLines, descLines.length)

        const basicColumns = [
          item.prod_codigo || '',
          item.prod_descripcion || '',
          item.kardex_lote || '',
          moment(item.kardex_VctoItem, 'yyy-MM-DD').format('DD/MM/yyyy'),
          item.prod_medida || '',
          Number(item.kardex_saldoCant).toFixed(2) || '',
        ]

        basicColumns.forEach((value, index) => {
          if (index === 1) {
            descLines.forEach((line, lineIndex) => {
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

        const precioContado = item.precio_contado || ''
        const precioPorMayor = item.precio_por_mayor || ''

        if (precioContado) {
          currentPage.drawText(precioContado, {
            x: xPosition,
            y: yPosition,
            size: 7,
            font,
            color: rgb(0, 0, 0),
          })
        }

        if (precioPorMayor && parseFloat(precioPorMayor) > 0) {
          const bonifText = `BONIF. ${precioPorMayor}`
          const precioContadoWidth = font.widthOfTextAtSize(precioContado, 7)

          currentPage.drawText(bonifText, {
            x: xPosition + precioContadoWidth + 2,
            y: yPosition,
            size: 6,
            font,
            color: rgb(0, 0.5, 0),
          })
        }

        xPosition += columnWidths[6]

        const precioCredito = item.precio_credito || ''
        const precioPorMenor = item.precio_por_menor || ''

        if (precioCredito) {
          currentPage.drawText(precioCredito, {
            x: xPosition,
            y: yPosition,
            size: 7,
            font,
            color: rgb(0, 0, 0),
          })
        }

        if (precioPorMenor && parseFloat(precioPorMenor) > 0) {
          const bonifText = `BONIF. ${precioPorMenor}`
          const precioCreditoWidth = font.widthOfTextAtSize(precioCredito, 7)

          currentPage.drawText(bonifText, {
            x: xPosition + precioCreditoWidth + 2,
            y: yPosition,
            size: 6,
            font,
            color: rgb(0, 0, 0.8),
          })
        }

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