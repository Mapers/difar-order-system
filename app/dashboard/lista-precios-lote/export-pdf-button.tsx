'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, ChevronDown } from 'lucide-react'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { EMPRESA, cargarLogoPdf, dibujarCabeceraPdf } from "@/components/reporte/pdfCabecera"
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
    const lowThreshold = Number(filters?.lowStockThreshold);
    if (lowThreshold > 0 && filters?.selectedLabsCount === 1) result = result.filter(i => Number(i.kardex_saldoCant) < lowThreshold)
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

  /**
   * 'LOTE|YYYY-MM-DD|STOCK;...' -> una entrada por lote.
   *
   * El tercer campo lo agregó sp_lista_precios_all para poder abrir el
   * export por lote. Se tolera que falte: con el SP viejo el stock queda en
   * null y se cae al total del producto.
   */
  const processLotes = (lotesRaw: string) => {
    if (!lotesRaw) return []
    return lotesRaw.split(';').map(loteStr => {
      const [lote, fecha, stock] = loteStr.split('|')
      const f = moment(fecha, 'YYYY-MM-DD')
      return {
        lote: lote ?? '',
        fecha: fecha && f.isValid() ? f.format('DD/MM/YYYY') : '',
        stock: stock !== undefined && stock !== '' && !isNaN(Number(stock)) ? Number(stock) : null,
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

      // Endpoint aparte: si falla, la columna sale vacia en vez de perderse
      // la exportacion entera.
      const mapaVentas = new Map<string, number[]>()
      try {
        const resVentas = await PriceService.getVentasTresMeses()
        for (const fila of (resVentas?.data?.data || [])) {
          mapaVentas.set(String(fila.cod_articulo), (fila.meses || []).map(Number))
        }
      } catch (e) {
        console.warn('No se pudieron cargar las ventas de 3 meses para el PDF:', e)
      }

      const pdfDoc = await PDFDocument.create()
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      const logoImage = await cargarLogoPdf(pdfDoc);

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

      // DESCRIPCIÓN, LOTES, UM, STOCK, VENTAS 3M, P.CONTADO, P.CREDITO, B.CONTADO, (B.CREDITO = resto)
      // La ultima columna se lleva el ancho restante, por eso van 8 y no 9.
      const columnWidths = isLandscape
          ? [190, 95, 40, 55, 105, 65, 65, 65]
          : [130, 70, 28, 40,  80, 48, 48, 48];
      const columns = ['DESCRIPCIÓN', 'LOTES', 'UM', 'STOCK', 'VENTAS 3M', 'P.CONTADO', 'P.CREDITO', 'B.CONTADO', 'B.CREDITO']

      const empresaNombre = EMPRESA.nombre
      const empresaRuc = EMPRESA.ruc

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
        const now = new Date()
        yPosition = dibujarCabeceraPdf({
          page, font, boldFont, logo: logoImage,
          pageWidth, pageHeight, margin,
          subtitulo: 'LISTA DE PRECIOS POR LOTE',
          infoDerecha: `Página: ${pageNumber}`,
          infoDerechaSec: `Fecha: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
          razonSocial: empresaNombre,
          ruc: empresaRuc,
        })
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

        const lotesDelItem = processLotes(item.lotes_raw)

        // Una fila por lote. Un producto sin lotes con saldo igual sale, en
        // una sola fila y con la columna de lote vacía: si no, desaparecería
        // de la lista de precios.
        const filasLote = lotesDelItem.length > 0
          ? lotesDelItem
          : [{ lote: '', fecha: '', stock: null as number | null }]

        // El zebreado se calcula una vez por PRODUCTO para que todos sus
        // lotes compartan fondo y se lean como un bloque.
        const zebraProducto = rowIndex % 2 === 1

        for (let iLote = 0; iLote < filasLote.length; iLote++) {
        const loteFila = filasLote[iLote]
        const esPrimeraFila = iLote === 0

        const descLines = splitTextIntoLines(item.prod_descripcion || '', columnWidths[0] - 5, font, baseFontSize)

        const lineHeight = isLandscape ? 7 : 5;

        const descHeight = descLines.length * lineHeight
        const lotesHeight = lineHeight

        // Las barras necesitan su propio alto minimo: si la fila trae una sola
        // linea de texto, sin esto quedarian recortadas.
        const barrasAlto = isLandscape ? 12 : 9
        // barrasAlto solo cuenta en la primera fila, que es donde se dibujan
        // las barras; si no, cada fila de lote quedaria igual de alta sin
        // necesidad y el PDF crece de gusto.
        const maxHeight = Math.max(descHeight, lotesHeight, esPrimeraFila ? barrasAlto : 0, lineHeight)
        const neededHeight = maxHeight + rowGap

        if (yPosition - neededHeight < minYPosition) {
          currentPage = addNewPage()
          pageNumber++
          drawHeader(currentPage)
          drawLabBand(currentPage, item.laboratorio_Descripcion)
          rowIndex = 0
        }

        // Fondo zebra (por producto, no por fila de lote)
        if (zebraProducto) {
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

        // LOTES (columna 1) — una fila del PDF = un lote
        if (loteFila.lote) {
          const lotesStartY = yPosition - topPad - ((maxHeight - lotesHeight) / 2)
          currentPage.drawText(
            loteFila.fecha ? `${loteFila.lote} - ${loteFila.fecha}` : loteFila.lote,
            { x: xPosition, y: lotesStartY, size: smallFontSize, font, color: C.text }
          )
        }
        xPosition += columnWidths[1]

        // UM (columna 2)
        currentPage.drawText(item.prod_medida || '', {
          x: xPosition, y: codigoY, size: baseFontSize, font, color: C.text,
        })
        xPosition += columnWidths[2]

        // STOCK (columna 3) — el del lote. Si el SP todavía no lo manda, se
        // cae al total del producto y solo en su primera fila, para que
        // sumar la columna no dé de más.
        const stockValue = loteFila.stock !== null
          ? loteFila.stock.toFixed(2)
          : (esPrimeraFila ? (Number(item.kardex_saldoCant) || 0).toFixed(2) : '')
        if (stockValue) {
          currentPage.drawText(stockValue, {
            x: xPosition, y: codigoY, size: baseFontSize, font: boldFont, color: C.stock,
          })
        }
        xPosition += columnWidths[3]

        // VENTAS 3M (columna 4) — mini barras como en la pantalla, mas el total.
        // La barra del mes mayor llega al tope y el resto se escala contra ese
        // maximo; misma regla que VentasSparkline.
        // Las ventas son del producto, no del lote: van solo en su primera
        // fila para no repetir el dato ni inflar lo que alguien sume.
        const mesesVenta = esPrimeraFila ? (mapaVentas.get(String(item.prod_codigo)) || []) : []
        const totalVenta = mesesVenta.reduce((a, b) => a + b, 0)
        const baseBarras = codigoY

        if (totalVenta > 0) {
          const maxMes    = Math.max(1, ...mesesVenta)
          const anchoB    = isLandscape ? 3.5 : 2.5
          const sepB      = 1.5
          const minB      = 1.5
          mesesVenta.forEach((cantidad, i) => {
            const alto = cantidad <= 0 ? 0 : Math.max(minB, (cantidad / maxMes) * barrasAlto)
            if (alto <= 0) return
            currentPage.drawRectangle({
              x: xPosition + i * (anchoB + sepB),
              y: baseBarras,
              width: anchoB,
              height: alto,
              color: C.stock,
            })
          })
          const anchoBloque = 3 * anchoB + 2 * sepB + 4
          currentPage.drawText(totalVenta.toFixed(2), {
            x: xPosition + anchoBloque, y: baseBarras, size: baseFontSize, font: boldFont, color: C.stock,
          })
        } else if (esPrimeraFila) {
          currentPage.drawText('Sin ventas', {
            x: xPosition, y: baseBarras, size: tinyFontSize, font, color: C.border,
          })
        }
        xPosition += columnWidths[4]

        // PRECIO CONTADO (columna 5)
        if (item.precio_contado) {
          currentPage.drawText(`S/ ${item.precio_contado}`, {
            x: xPosition, y: codigoY, size: baseFontSize, font, color: C.text,
          })
        }
        xPosition += columnWidths[5]

        // PRECIO CREDITO (columna 6)
        if (item.precio_credito) {
          currentPage.drawText(`S/ ${item.precio_credito}`, {
            x: xPosition, y: codigoY, size: baseFontSize, font, color: C.text,
          })
        }
        xPosition += columnWidths[6]

        // B.CONTADO (columna 7)
        const precioBonifContado = Number(item.precio_por_mayor) > 0 ? `S/ ${item.precio_por_mayor}` : ''
        if (precioBonifContado) {
          currentPage.drawText(precioBonifContado, {
            x: xPosition, y: codigoY, size: baseFontSize, font, color: C.green,
          })
        }
        xPosition += columnWidths[7]

        // B.CREDITO (columna 8 - usa el espacio restante)
        const precioBonifCredito = Number(item.precio_por_menor) > 0 ? `S/ ${item.precio_por_menor}` : ''
        if (precioBonifCredito) {
          currentPage.drawText(precioBonifCredito, {
            x: xPosition, y: codigoY, size: baseFontSize, font, color: C.dblue,
          })
        }

        // separador inferior tenue
        const finalY = yPosition - maxHeight - rowGap
        currentPage.drawLine({
          start: { x: margin, y: finalY },
          end: { x: pageWidth - margin, y: finalY },
          thickness: 0.2,
          color: C.border,
        })

        yPosition -= maxHeight + rowGap
        }

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
