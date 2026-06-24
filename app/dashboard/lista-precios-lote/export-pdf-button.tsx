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

const ExportPdfButton = ({ payload, filters }: { payload: any; filters?: any }) => {
  const [loading, setLoading] = useState(false)

  const applyFilters = (items: any[]) => {
    // Siempre se omiten los productos con stock <= 0
    let result = items.filter(i => Number(i.kardex_saldoCant) > 0)
    if (filters?.lowStock && filters?.selectedLabsCount === 1) result = result.filter(i => Number(i.kardex_saldoCant) < 10)
    if (filters?.selectedPrinciple) result = result.filter(i => i.prod_principio === filters.selectedPrinciple)
    if (filters?.searchTerm) {
      const q = filters.searchTerm.toLowerCase()
      result = result.filter(i => i.prod_codigo?.toLowerCase().includes(q) || i.prod_descripcion?.toLowerCase().includes(q) || i.prod_principio?.toLowerCase().includes(q))
    }
    return result
  }

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
      const data = applyFilters(response.data || []);

      const pdfDoc = await PDFDocument.create()
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      let logoImage: any = null;
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

      // --- CONFIGURACIÓN DINÁMICA POR ORIENTACIÓN (mismo diseño en ambos) ---
      const isLandscape = orientation === 'horizontal';

      // Medidas estándar A4 en Puntos
      const pageWidth = isLandscape ? 841.89 : 595.28;
      const pageHeight = isLandscape ? 595.28 : 841.89;
      const margin = isLandscape ? 40 : 24;
      const contentWidth = pageWidth - margin * 2;
      const minYPosition = margin + 24;

      // Tamaños de fuente
      const baseFontSize = isLandscape ? 7 : 5;
      const smallFontSize = isLandscape ? 6 : 4;
      const tinyFontSize = isLandscape ? 5.5 : 4;

      // DESCRIPCIÓN, LOTES, UM, STOCK, P.CONTADO, P.CREDITO, B.CONTADO, B.CREDITO, BONIFICACIONES, (ESCALAS = resto)
      const columnWidths = isLandscape
          ? [150, 75, 45, 50, 60, 60, 60, 90, 90]
          : [105, 55, 30, 35, 45, 45, 45, 65, 65];
      const columns = ['DESCRIPCIÓN', 'LOTES', 'UM', 'STOCK', 'P.CONTADO', 'P.CREDITO', 'B.CONTADO', 'B.CREDITO', 'BONIFICACIONES', 'ESCALAS']

      const empresaNombre = "DROGUERIA DIFAR"
      const empresaRuc = "2056138401"

      // Paleta homologada (azul marino corporativo)
      const C = {
        primary:   rgb(0.086, 0.192, 0.361), // banda cabecera y fila de columnas
        accent:    rgb(0.22, 0.60, 0.85),    // línea de acento
        headerSub: rgb(0.78, 0.84, 0.92),    // texto secundario sobre banda
        lab:       rgb(0.18, 0.38, 0.68),    // banda por laboratorio
        rowOdd:    rgb(0.945, 0.953, 0.965), // zebra
        text:      rgb(0.13, 0.17, 0.24),    // texto principal
        muted:     rgb(0.45, 0.45, 0.45),
        border:    rgb(0.85, 0.87, 0.90),
        white:     rgb(1, 1, 1),
        stock:     rgb(0.10, 0.34, 0.74),    // azul stock
        green:     rgb(0.04, 0.42, 0.24),    // bonificaciones
        dblue:     rgb(0.08, 0.22, 0.62),    // escalas
      }

      const headerH = isLandscape ? 50 : 44;
      const colHeaderH = isLandscape ? 15 : 12;
      const labBandH = isLandscape ? 15 : 12;
      const rowGap = isLandscape ? 10 : 6;
      const topPad = isLandscape ? 10 : 7; // rowGap/2 + ascenderH — centers text vertically in the row

      const addNewPage = () => pdfDoc.addPage([pageWidth, pageHeight])

      let currentPage = addNewPage()
      let yPosition = pageHeight
      let pageNumber = 1
      let currentLab = 0
      let rowIndex = 0

      const drawHeaderBand = (page: any) => {
        page.drawRectangle({ x: 0, y: pageHeight - headerH, width: pageWidth, height: headerH, color: C.primary })
        page.drawRectangle({ x: 0, y: pageHeight - headerH - 2.5, width: pageWidth, height: 2.5, color: C.accent })

        let titleXPos = margin
        if (logoImage) {
          const logoW = isLandscape ? 46 : 40
          const logoH = isLandscape ? 28 : 24
          const logoY = pageHeight - headerH / 2 - logoH / 2
          // fondo blanco para que el logo sea visible sobre la banda azul
          page.drawRectangle({ x: margin - 3, y: logoY - 2, width: logoW + 6, height: logoH + 4, color: C.white })
          page.drawImage(logoImage, { x: margin, y: logoY, width: logoW, height: logoH })
          titleXPos = margin + logoW + 12
        }

        const midY = pageHeight - headerH / 2
        page.drawText(empresaNombre, { x: titleXPos, y: midY + 3, size: isLandscape ? 13 : 11, font: boldFont, color: C.white })
        page.drawText(`RUC: ${empresaRuc}`, { x: titleXPos, y: midY - 10, size: isLandscape ? 8 : 6.5, font, color: C.headerSub })

        const titleText = 'LISTA DE PRECIOS POR LOTE'
        const titleSize = isLandscape ? 13 : 9.5
        const titleWidth = boldFont.widthOfTextAtSize(titleText, titleSize)
        page.drawText(titleText, { x: (pageWidth - titleWidth) / 2, y: midY - 3, size: titleSize, font: boldFont, color: C.white })

        const now = new Date()
        const fechaText = `Fecha: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`
        const paginaText = `Página: ${pageNumber}`
        const dsize = isLandscape ? 8 : 6.5
        const fechaW = font.widthOfTextAtSize(fechaText, dsize)
        const paginaW = font.widthOfTextAtSize(paginaText, dsize)
        page.drawText(fechaText, { x: pageWidth - margin - fechaW, y: midY + 3, size: dsize, font, color: C.white })
        page.drawText(paginaText, { x: pageWidth - margin - paginaW, y: midY - 10, size: dsize, font, color: C.headerSub })
      }

      const drawColumnHeader = (page: any) => {
        // yPosition = parte superior de la fila de columnas
        page.drawRectangle({ x: margin, y: yPosition - colHeaderH, width: contentWidth, height: colHeaderH, color: C.primary })
        let xPos = margin + 3
        const textY = yPosition - colHeaderH + (isLandscape ? 5 : 4)
        columns.forEach((col, i) => {
          page.drawText(col, { x: xPos, y: textY, size: baseFontSize, font: boldFont, color: C.white })
          xPos += columnWidths[i] || 0
        })
        yPosition -= colHeaderH + 8
      }

      const drawHeader = (page: any) => {
        drawHeaderBand(page)
        yPosition = pageHeight - headerH - 12
        drawColumnHeader(page)
      }

      const drawLabBand = (page: any, text: string) => {
        page.drawRectangle({ x: margin, y: yPosition - labBandH, width: contentWidth, height: labBandH, color: C.lab })
        page.drawText((text || '').toUpperCase(), {
          x: margin + 6,
          y: yPosition - labBandH + (isLandscape ? 4.5 : 3.5),
          size: isLandscape ? 9 : 7,
          font: boldFont,
          color: C.white,
        })
        yPosition -= labBandH + 6
      }

      drawHeader(currentPage)

      if (!data.length) {
        currentPage.drawText('No se encontraron productos con stock disponible.', {
          x: margin, y: yPosition - 20, size: baseFontSize + 2, font, color: C.muted,
        })
      }

      for (const item of data) {
        if (item.laboratorio_id !== currentLab) {
          currentLab = item.laboratorio_id
          rowIndex = 0

          if (yPosition < minYPosition + 40) {
            currentPage = addNewPage()
            pageNumber++
            drawHeader(currentPage)
          }

          drawLabBand(currentPage, item.laboratorio_Descripcion)
        }

        const lotes = processLotes(item.lotes_raw)
        const bonificaciones = processBonificaciones(item.bonificaciones_raw)
        const escalas = processEscalas(item.escalas_raw)

        const descLines = splitTextIntoLines(item.prod_descripcion || '', columnWidths[0] - 5, font, baseFontSize)

        const bonifLines: { text: string, type: string }[] = []
        bonificaciones.forEach((bonif, index) => {
          const bonifText = bonif.mismoProduct === 'S'
              ? `${index + 1}. compra ${bonif.factor} y lleva ${bonif.cantidad} de ${item.prod_descripcion}`.toUpperCase()
              : `${index + 1}. compra ${bonif.factor} y lleva ${bonif.cantidad} de ${bonif.descArticuloBonif}`.toUpperCase()

          const lines = splitTextIntoLines(bonifText, columnWidths[8] - 5, font, tinyFontSize)
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

        const maxHeight = Math.max(descHeight, lotesHeight, bonifHeight, escalaHeight, lineHeight)
        const neededHeight = maxHeight + rowGap

        if (yPosition - neededHeight < minYPosition) {
          currentPage = addNewPage()
          pageNumber++
          drawHeader(currentPage)
          drawLabBand(currentPage, item.laboratorio_Descripcion)
          rowIndex = 0
        }

        // Fondo zebra (filas impares)
        if (rowIndex % 2 === 1) {
          currentPage.drawRectangle({
            x: margin,
            y: yPosition - maxHeight - rowGap,
            width: contentWidth,
            height: maxHeight + rowGap,
            color: C.rowOdd,
          })
        }

        let xPosition = margin + 3
        const codigoY = yPosition - topPad - (maxHeight - lineHeight) / 2

        // DESCRIPCIÓN (columna 0)
        const descStartY = yPosition - topPad - ((maxHeight - descHeight) / 2)
        descLines.forEach((line, lineIndex) => {
          currentPage.drawText(line, {
            x: xPosition,
            y: descStartY - (lineIndex * lineHeight),
            size: baseFontSize,
            font,
            color: C.text,
          })
        })
        xPosition += columnWidths[0]

        // LOTES (columna 1)
        const lotesStartY = yPosition - topPad - ((maxHeight - lotesHeight) / 2)
        lotes.forEach((lote, index) => {
          const loteText = `${lote.lote} - ${lote.fecha}`
          currentPage.drawText(loteText, {
            x: xPosition,
            y: lotesStartY - (index * lineHeight),
            size: smallFontSize,
            font,
            color: C.text,
          })
        })
        xPosition += columnWidths[1]

        // UM (columna 2)
        currentPage.drawText(item.prod_medida || '', {
          x: xPosition, y: codigoY, size: baseFontSize, font, color: C.text,
        })
        xPosition += columnWidths[2]

        // STOCK (columna 3)
        const stockValue = Number(item.kardex_saldoCant).toFixed(2) || '0.00'
        currentPage.drawText(stockValue, {
          x: xPosition, y: codigoY, size: baseFontSize, font: boldFont, color: C.stock,
        })
        xPosition += columnWidths[3]

        // PRECIO CONTADO (columna 4)
        if (item.precio_contado) {
          currentPage.drawText(`S/ ${item.precio_contado}`, {
            x: xPosition, y: codigoY, size: baseFontSize, font, color: C.text,
          })
        }
        xPosition += columnWidths[4]

        // PRECIO CREDITO (columna 5)
        if (item.precio_credito) {
          currentPage.drawText(`S/ ${item.precio_credito}`, {
            x: xPosition, y: codigoY, size: baseFontSize, font, color: C.text,
          })
        }
        xPosition += columnWidths[5]

        // B.CONTADO (columna 6)
        const precioBonifContado = Number(item.precio_por_mayor) > 0 ? `S/ ${item.precio_por_mayor}` : ''
        if (precioBonifContado) {
          currentPage.drawText(precioBonifContado, {
            x: xPosition, y: codigoY, size: baseFontSize, font, color: C.green,
          })
        }
        xPosition += columnWidths[6]

        // B.CREDITO (columna 7)
        const precioBonifCredito = Number(item.precio_por_menor) > 0 ? `S/ ${item.precio_por_menor}` : ''
        if (precioBonifCredito) {
          currentPage.drawText(precioBonifCredito, {
            x: xPosition, y: codigoY, size: baseFontSize, font, color: C.dblue,
          })
        }
        xPosition += columnWidths[7]

        // BONIFICACIONES (columna 8)
        const bonifStartY = yPosition - topPad - ((maxHeight - bonifHeight) / 2)
        bonifLines.forEach((bonifLine, index) => {
          currentPage.drawText(bonifLine.text, {
            x: xPosition,
            y: bonifStartY - (index * (lineHeight - 1)),
            size: tinyFontSize,
            font,
            color: C.green,
          })
        })
        xPosition += columnWidths[8]

        // ESCALAS (columna 9 - usa el espacio restante)
        const escalaStartY = yPosition - topPad - ((maxHeight - escalaHeight) / 2)
        escalaLines.forEach((escalaText, index) => {
          currentPage.drawText(escalaText, {
            x: xPosition,
            y: escalaStartY - (index * (lineHeight - 1)),
            size: tinyFontSize,
            font,
            color: C.dblue,
          })
        })

        // separador inferior tenue
        const finalY = yPosition - maxHeight - rowGap
        currentPage.drawLine({
          start: { x: margin, y: finalY },
          end: { x: pageWidth - margin, y: finalY },
          thickness: 0.2,
          color: C.border,
        })

        yPosition -= maxHeight + rowGap
        rowIndex++
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
