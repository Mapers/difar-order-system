'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, ChevronDown } from 'lucide-react'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { PriceService } from "@/app/services/price/PriceService";
import moment from "moment";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const ExportPdfButton = ({ payload }: { payload: any }) => {
  const [loading, setLoading] = useState(false)

  const splitTextIntoLines = (text: string, maxWidth: number, font: any, fontSize: number) => {
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

  const processLotes = (lotesRaw: string) => {
    if (!lotesRaw) return []
    return lotesRaw.split(';').map(loteStr => {
      const [lote, fecha] = loteStr.split('|')
      return {
        lote,
        fecha: moment(fecha, 'YYYY-MM-DD').format('DD/MM/YYYY')
      }
    })
  }

  const processBonificaciones = (bonificacionesRaw: string) => {
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

  const processEscalas = (escalasRaw: string) => {
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

  const generatePdf = async (orientation: 'horizontal' | 'vertical') => {
    if (loading) return
    setLoading(true)

    try {
      const response = await PriceService.getPricesAll(payload);
      const data = response.data || [];

      const pdfDoc = await PDFDocument.create()
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      let logoImage = null;
      try {
        const logoUrl = '/difar-logo.png';
        const logoBytes = await fetch(logoUrl).then((res) => {
          if (!res.ok) throw new Error("No se pudo cargar la imagen");
          return res.arrayBuffer();
        });
        logoImage = await pdfDoc.embedPng(logoBytes);
      } catch (error) {
        console.warn("No se pudo cargar el logotipo para el PDF:", error);
      }

      // --- CONFIGURACIÓN DINÁMICA POR ORIENTACIÓN ---
      const isLandscape = orientation === 'horizontal';

      // Medidas estándar A4 en Puntos
      const pageWidth = isLandscape ? 841.89 : 595.28;
      const pageHeight = isLandscape ? 595.28 : 841.89;
      const margin = isLandscape ? 40 : 20; // Menos margen en vertical para aprovechar espacio
      const minYPosition = margin + 20;

      // Tamaños de fuente reducidos en vertical
      const baseFontSize = isLandscape ? 7 : 5;
      const smallFontSize = isLandscape ? 6 : 4;
      const tinyFontSize = isLandscape ? 5.5 : 4;

      // Anchos de columna proporcionales al ancho disponible
      // Total horizontal disponible: 841.89 - 80 = 761.89
      // Total vertical disponible: 595.28 - 40 = 555.28
      const columnWidths = isLandscape
          ? [50, 120, 75, 45, 50, 60, 60, 60, 60, 90, 90] // Suma ~ 760
          : [40, 85, 55, 30, 35, 45, 45, 45, 45, 65, 65];  // Suma ~ 555

      const empresaNombre = "DROGUERIA DIFAR"
      const empresaRuc = "2056138401"

      const addNewPage = () => {
        return pdfDoc.addPage([pageWidth, pageHeight])
      }

      let currentPage = addNewPage()
      let yPosition = pageHeight - margin
      let pageNumber = 1
      let currentLab = 0

      const drawHeader = (page: any, logoImg = null) => {
        let titleXPos = margin;

        if (logoImg) {
          const logoWidth = 50;
          const logoHeight = 30;
          page.drawImage(logoImg, {
            x: margin,
            y: pageHeight - margin - 15,
            width: logoWidth,
            height: logoHeight,
          });
          titleXPos = margin + logoWidth + 10;
        }

        page.drawText(empresaNombre, {
          x: titleXPos,
          y: pageHeight - margin,
          size: isLandscape ? 10 : 8,
          font: boldFont,
          color: rgb(0, 0, 0),
        })
        page.drawText(empresaRuc, {
          x: titleXPos,
          y: pageHeight - margin - 12,
          size: isLandscape ? 8 : 6,
          font,
          color: rgb(0, 0, 0),
        })

        const now = new Date()
        const fecha = now.toLocaleDateString()
        const hora = now.toLocaleTimeString()

        const fechaText = `Fecha: ${fecha} ${hora}`
        const paginaText = `Página: ${pageNumber}`

        const fechaWidth = font.widthOfTextAtSize(fechaText, isLandscape ? 8 : 6)
        const paginaWidth = font.widthOfTextAtSize(paginaText, isLandscape ? 8 : 6)

        page.drawText(fechaText, {
          x: pageWidth - margin - fechaWidth,
          y: pageHeight - margin,
          size: isLandscape ? 8 : 6,
          font,
          color: rgb(0, 0, 0),
        })

        page.drawText(paginaText, {
          x: pageWidth - margin - paginaWidth,
          y: pageHeight - margin - 12,
          size: isLandscape ? 8 : 6,
          font,
          color: rgb(0, 0, 0),
        })

        const titleText = 'LISTA DE PRECIOS POR LOTE'
        const titleWidth = boldFont.widthOfTextAtSize(titleText, isLandscape ? 12 : 10)
        page.drawText(titleText, {
          x: (pageWidth - titleWidth) / 2,
          y: pageHeight - margin - 30,
          size: isLandscape ? 12 : 10,
          font: boldFont,
          color: rgb(0, 0, 0),
        })

        yPosition = pageHeight - margin - 50

        const columns = ['COD.', 'DESCRIPCIÓN', 'LOTES', 'UM', 'STOCK', 'P.CONTADO', 'P.CREDITO', 'B.CONTADO', 'B.CREDITO', 'BONIFICACIONES', 'ESCALAS']

        let xPosition = margin
        columns.forEach((column, index) => {
          page.drawText(column, {
            x: xPosition,
            y: yPosition,
            size: baseFontSize,
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

      drawHeader(currentPage, logoImage)

      for (const item of data) {
        if (item.laboratorio_id !== currentLab) {
          currentLab = item.laboratorio_id

          if (yPosition < minYPosition + 30) {
            currentPage = addNewPage()
            pageNumber++
            yPosition = pageHeight - margin
            drawHeader(currentPage, logoImage)
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
            size: isLandscape ? 9 : 7,
            font: boldFont,
            color: rgb(0, 0, 0),
          })

          yPosition -= 15
        }

        const lotes = processLotes(item.lotes_raw)
        const bonificaciones = processBonificaciones(item.bonificaciones_raw)
        const escalas = processEscalas(item.escalas_raw)

        const descLines = splitTextIntoLines(item.prod_descripcion || '', columnWidths[1] - 5, font, baseFontSize)

        const bonifLines: {text: string, type: string}[] = []
        bonificaciones.forEach((bonif, index) => {
          const bonifText = bonif.mismoProduct === 'S'
              ? `${index + 1}. compra ${bonif.factor} y lleva ${bonif.cantidad} de ${item.prod_descripcion}`.toUpperCase()
              : `${index + 1}. compra ${bonif.factor} y lleva ${bonif.cantidad} de ${bonif.descArticuloBonif}`.toUpperCase()

          const lines = splitTextIntoLines(bonifText, columnWidths[9] - 5, font, tinyFontSize)
          bonifLines.push(...lines.map(line => ({ text: line, type: 'bonif' })))
        })

        const escalaLines = escalas.map((escala, index) =>
            `${index + 1}. De ${escala.minimo} a ${escala.maximo} - S/${escala.precio.toFixed(2)}`.toUpperCase()
        )

        const lineHeight = isLandscape ? 7 : 5;

        const descHeight = descLines.length * lineHeight
        const lotesHeight = lotes.length * lineHeight
        const bonifHeight = bonifLines.length * (lineHeight - 1)
        const escalaHeight = escalaLines.length * (lineHeight - 1)

        const maxHeight = Math.max(
            descHeight,
            lotesHeight,
            bonifHeight,
            escalaHeight,
            lineHeight
        )

        const neededHeight = maxHeight + (isLandscape ? 10 : 6)

        if (yPosition - neededHeight < minYPosition) {
          currentPage = addNewPage()
          pageNumber++
          yPosition = pageHeight - margin
          drawHeader(currentPage, logoImage)

          currentPage.drawText(item.laboratorio_Descripcion, {
            x: margin,
            y: yPosition,
            size: isLandscape ? 9 : 7,
            font: boldFont,
            color: rgb(0, 0, 0),
          })
          yPosition -= 15
        }

        let xPosition = margin

        // CODIGO
        const codigoY = yPosition - (maxHeight / 2) + 2
        currentPage.drawText(item.prod_codigo || '', {
          x: xPosition,
          y: codigoY,
          size: baseFontSize,
          font,
          color: rgb(0, 0, 0),
        })
        xPosition += columnWidths[0]

        // DESCRIPCIÓN
        const descStartY = yPosition - ((maxHeight - descHeight) / 2)
        descLines.forEach((line, lineIndex) => {
          currentPage.drawText(line, {
            x: xPosition,
            y: descStartY - (lineIndex * lineHeight),
            size: baseFontSize,
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
            y: lotesStartY - (index * lineHeight),
            size: smallFontSize,
            font,
            color: rgb(0, 0, 0),
          })
        })
        xPosition += columnWidths[2]

        // UM
        currentPage.drawText(item.prod_medida || '', {
          x: xPosition,
          y: codigoY,
          size: baseFontSize,
          font,
          color: rgb(0, 0, 0),
        })
        xPosition += columnWidths[3]

        // STOCK
        currentPage.drawText(Number(item.kardex_saldoCant).toFixed(2) || '', {
          x: xPosition,
          y: codigoY,
          size: baseFontSize,
          font,
          color: rgb(0, 0, 0),
        })
        xPosition += columnWidths[4]

        // PRECIO CONTADO
        const precioContado = `S/ ${item.precio_contado}`
        if (item.precio_contado) {
          currentPage.drawText(precioContado, {
            x: xPosition,
            y: codigoY,
            size: baseFontSize,
            font,
            color: rgb(0, 0, 0),
          })
        }
        xPosition += columnWidths[5]

        // PRECIO CREDITO
        const precioCredito = `S/ ${item.precio_credito}`
        if (item.precio_credito) {
          currentPage.drawText(precioCredito, {
            x: xPosition,
            y: codigoY,
            size: baseFontSize,
            font,
            color: rgb(0, 0, 0),
          })
        }
        xPosition += columnWidths[6]

        // PRECIO BONIF CONTADO
        const precioBonifContado = Number(item.precio_por_mayor) > 0 ? `S/ ${item.precio_por_mayor}` : ''
        if (precioBonifContado) {
          currentPage.drawText(precioBonifContado, {
            x: xPosition,
            y: codigoY,
            size: baseFontSize,
            font,
            color: rgb(0, 0.5, 0),
          })
        }
        xPosition += columnWidths[7]

        // PRECIO BONIF CREDITO
        const precioBonifCredito = Number(item.precio_por_menor) > 0 ? `S/ ${item.precio_por_menor}` : ''
        if (precioBonifCredito) {
          currentPage.drawText(precioBonifCredito, {
            x: xPosition,
            y: codigoY,
            size: baseFontSize,
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
            y: bonifStartY - (index * (lineHeight - 1)),
            size: tinyFontSize,
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
            y: escalaStartY - (index * (lineHeight - 1)),
            size: tinyFontSize,
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

        yPosition -= maxHeight + (isLandscape ? 10 : 6)
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = `lista-precios-${orientation}-${new Date().toISOString().split('T')[0]}.pdf`
      link.click()

    } catch (error) {
      console.error('Error al generar PDF:', error)
      alert('Ocurrió un error al generar el PDF.')
    } finally {
      setLoading(false)
    }
  }

  return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {loading ? 'Generando...' : 'Exportar PDF'}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => generatePdf('horizontal')} className="cursor-pointer">
            Formato Horizontal (Recomendado)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => generatePdf('vertical')} className="cursor-pointer">
            Formato Vertical (Letra pequeña)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  )
}

export default ExportPdfButton