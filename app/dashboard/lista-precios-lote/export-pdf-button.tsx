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
    if (!text) return [''];
    const words = text.split(' ')
    const lines = []
    let currentLine = ''

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const testLine = currentLine ? currentLine + ' ' + word : word
      const width = font.widthOfTextAtSize(testLine, fontSize)

      if (width <= maxWidth) {
        currentLine = testLine
      } else {
        if (currentLine) {
          lines.push(currentLine)
        }
        currentLine = word
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }

    return lines.length > 0 ? lines : ['']
  }

  const processLotes = (lotesRaw) => {
    if (!lotesRaw) return []
    return lotesRaw.split(';').map(loteStr => {
      const [lote, fecha] = loteStr.split('|')
      return {
        lote,
        fecha: moment(fecha, 'YYYY-MM-DD').format('DD/MM/YYYY')
      }
    })
  }

  const processBonificaciones = (bonificacionesRaw) => {
    if (!bonificacionesRaw) return []
    return bonificacionesRaw.split(';').map(bonifStr => {
      const [factor, descripcion, cantidad, mismoProduct, descArticuloBonif] = bonifStr.split('|')
      return {
        factor: parseFloat(factor),
        descripcion,
        cantidad: parseFloat(cantidad),
        mismoProduct,
        descArticuloBonif
      }
    })
  }

  const processEscalas = (escalasRaw) => {
    if (!escalasRaw) return []
    return escalasRaw.split(';').map(escalaStr => {
      const [minimo, maximo, precio] = escalaStr.split('|')
      return {
        minimo: parseInt(minimo),
        maximo: parseInt(maximo),
        precio: parseFloat(precio)
      }
    })
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

      const pageWidth = 841.89
      const pageHeight = 595.28
      const margin = 40
      const minYPosition = margin + 20

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

        const titleText = 'LISTA DE PRECIOS POR LOTE'
        const titleWidth = boldFont.widthOfTextAtSize(titleText, 12)
        page.drawText(titleText, {
          x: (pageWidth - titleWidth) / 2,
          y: pageHeight - margin - 30,
          size: 12,
          font: boldFont,
          color: rgb(0, 0, 0),
        })

        yPosition = pageHeight - margin - 50

        const columnWidths = [50, 120, 75, 50, 50, 60, 60, 60, 60, 90, 100]
        const columns = ['COD.', 'DESCRIPCIÓN', 'LOTES', 'UM', 'STOCK', 'P.CONTADO', 'P.CREDITO', 'B.CONTADO', 'B.CREDITO', 'BONIFICACIONES', 'ESCALAS']

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
          thickness: 1,
          color: rgb(0, 0, 0),
        })

        yPosition -= 15
      }

      drawHeader(currentPage)

      for (const item of data) {
        if (item.laboratorio_id !== currentLab) {
          currentLab = item.laboratorio_id

          if (yPosition < minYPosition + 30) {
            currentPage = addNewPage()
            pageNumber++
            yPosition = pageHeight - margin
            drawHeader(currentPage)
          }

          currentPage.drawLine({
            start: { x: margin, y: yPosition + 8 },
            end: { x: pageWidth - margin, y: yPosition + 8 },
            thickness: 0.3,
            color: rgb(0.7, 0.7, 0.7),
          })

          currentPage.drawText(item.laboratorio_Descripcion, {
            x: margin,
            y: yPosition,
            size: 9,
            font: boldFont,
            color: rgb(0, 0, 0),
          })

          yPosition -= 15
        }

        const lotes = processLotes(item.lotes_raw)
        const bonificaciones = processBonificaciones(item.bonificaciones_raw)
        const escalas = processEscalas(item.escalas_raw)

        const descLines = splitTextIntoLines(item.prod_descripcion || '', 120 - 5, font, 7)

        const bonifLines = []
        bonificaciones.forEach((bonif, index) => {
          const bonifText = bonif.mismoProduct === 'S'
              ? `${index + 1}. compra ${bonif.factor} y lleva ${bonif.cantidad} de ${item.prod_descripcion}`.toUpperCase()
              : `${index + 1}. compra ${bonif.factor} y lleva ${bonif.cantidad} de ${bonif.descArticuloBonif}`.toUpperCase()

          const lines = splitTextIntoLines(bonifText, 90 - 15, font, 5.5)
          bonifLines.push(...lines.map(line => ({ text: line, type: 'bonif' })))
        })

        const escalaLines = escalas.map((escala, index) =>
            `${index + 1}. Desde ${escala.minimo} hasta ${escala.maximo} - S/ ${escala.precio.toFixed(2)}`.toUpperCase()
        )

        const descHeight = descLines.length * 7
        const lotesHeight = lotes.length * 7
        const bonifHeight = bonifLines.length * 6
        const escalaHeight = escalaLines.length * 6

        const maxHeight = Math.max(
            descHeight,
            lotesHeight,
            bonifHeight,
            escalaHeight,
            7
        )

        const neededHeight = maxHeight + 10

        if (yPosition - neededHeight < minYPosition) {
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

        const columnWidths = [50, 120, 75, 50, 50, 60, 60, 60, 60, 90, 100]
        let xPosition = margin

        // CODIGO
        const codigoY = yPosition - (maxHeight / 2) + 3
        currentPage.drawText(item.prod_codigo || '', {
          x: xPosition,
          y: codigoY,
          size: 7,
          font,
          color: rgb(0, 0, 0),
        })
        xPosition += columnWidths[0]

        // DESCRIPCIÓN
        const descStartY = yPosition - ((maxHeight - descHeight) / 2)
        descLines.forEach((line, lineIndex) => {
          currentPage.drawText(line, {
            x: xPosition,
            y: descStartY - (lineIndex * 7),
            size: 7,
            font,
            color: rgb(0, 0, 0),
          })
        })
        xPosition += columnWidths[1]

        // LOTES
        const lotesStartY = yPosition - ((maxHeight - lotesHeight) / 2)
        lotes.forEach((lote, index) => {
          const loteText = `${lote.lote} - ${lote.fecha}`
          currentPage.drawText(loteText, {
            x: xPosition,
            y: lotesStartY - (index * 7),
            size: 6,
            font,
            color: rgb(0, 0, 0),
          })
        })
        xPosition += columnWidths[2]

        // UM
        const umY = yPosition - (maxHeight / 2) + 3
        currentPage.drawText(item.prod_medida || '', {
          x: xPosition,
          y: umY,
          size: 7,
          font,
          color: rgb(0, 0, 0),
        })
        xPosition += columnWidths[3]

        // STOCK
        const stockY = yPosition - (maxHeight / 2) + 3
        currentPage.drawText(Number(item.kardex_saldoCant).toFixed(2) || '', {
          x: xPosition,
          y: stockY,
          size: 7,
          font,
          color: rgb(0, 0, 0),
        })
        xPosition += columnWidths[4]

        // PRECIO CONTADO
        const precioContadoY = yPosition - (maxHeight / 2) + 3
        const precioContado = `S/ ${item.precio_contado}`
        if (precioContado) {
          currentPage.drawText(precioContado, {
            x: xPosition,
            y: precioContadoY,
            size: 7,
            font,
            color: rgb(0, 0, 0),
          })
        }
        xPosition += columnWidths[5]

        // PRECIO CREDITO
        const precioCreditoY = yPosition - (maxHeight / 2) + 3
        const precioCredito = `S/ ${item.precio_credito}`
        if (precioCredito) {
          currentPage.drawText(precioCredito, {
            x: xPosition,
            y: precioCreditoY,
            size: 7,
            font,
            color: rgb(0, 0, 0),
          })
        }
        xPosition += columnWidths[6]

        // PRECIO BONIF CONTADO
        const precioBonifContadoY = yPosition - (maxHeight / 2) + 3
        const precioBonifContado = Number(item.precio_por_mayor) > 0 ? `S/ ${item.precio_por_mayor}` : ''
        if (precioBonifContado) {
          currentPage.drawText(precioBonifContado, {
            x: xPosition,
            y: precioBonifContadoY,
            size: 7,
            font,
            color: rgb(0, 0.5, 0),
          })
        }
        xPosition += columnWidths[7]

        // PRECIO BONIF CREDITO
        const precioBonifCreditoY = yPosition - (maxHeight / 2) + 3
        const precioBonifCredito = Number(item.precio_por_menor) > 0 ? `S/ ${item.precio_por_menor}` : ''
        if (precioBonifCredito) {
          currentPage.drawText(precioBonifCredito, {
            x: xPosition,
            y: precioBonifCreditoY,
            size: 7,
            font,
            color: rgb(0, 0, 0.8),
          })
        }
        xPosition += columnWidths[8]

        // BONIFICACIONES
        const bonifStartY = yPosition - ((maxHeight - bonifHeight) / 2)
        bonifLines.forEach((bonifLine, index) => {
          currentPage.drawText(bonifLine.text, {
            x: xPosition,
            y: bonifStartY - (index * 6),
            size: 5.5,
            font,
            color: rgb(0, 0.5, 0),
          })
        })
        xPosition += columnWidths[9]

        // ESCALAS
        const escalaStartY = yPosition - ((maxHeight - escalaHeight) / 2)
        escalaLines.forEach((escalaText, index) => {
          currentPage.drawText(escalaText, {
            x: xPosition,
            y: escalaStartY - (index * 6),
            size: 5.5,
            font,
            color: rgb(0, 0, 0.8),
          })
        })

        const finalY = yPosition - maxHeight - 3
        currentPage.drawLine({
          start: { x: margin, y: finalY },
          end: { x: pageWidth - margin, y: finalY },
          thickness: 0.2,
          color: rgb(0.8, 0.8, 0.8),
        })

        yPosition -= maxHeight + 10
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