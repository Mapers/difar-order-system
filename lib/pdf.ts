import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import {Pedido, PedidoDet} from "@/app/dashboard/estados-pedidos/page";

function money(n: string) {
  return "S/ " + Number(n).toFixed(2)
}

type TableLayout = {
  x: number
  y: number
  widths: { qty: number; desc: number; code: number; lot: number; due: number; unit: number; amt: number }
  paddingX: number
  rowH: number
  headerH: number
}

export async function generateOrderPdf(order: Pedido, items: PedidoDet[]): Promise<Blob> {
  const pdfDoc = await PDFDocument.create()
  let page = pdfDoc.addPage([595.28, 841.89])
  const { width, height } = page.getSize()
  const margin = 36
  const contentWidth = width - margin * 2

  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let y = height - margin

  let logoImage = null;
  try {
    const logoResponse = await fetch('/difar-logo.png');
    const logoBuffer = await logoResponse.arrayBuffer();
    logoImage = await pdfDoc.embedPng(logoBuffer);
  } catch (error) {
    console.warn('No se pudo cargar el logo:', error);
  }

  const title = "RECIBO DE VENTA"
  const numberStr = "Nro. " + String(order?.nroPedido || 0).padStart(10, '0')
  const titleSize = 16
  const numSize = 14
  const padX = 16
  const padY = 12
  const gap = 8

  const titleW = helvBold.widthOfTextAtSize(title, titleSize)
  const numW = helvBold.widthOfTextAtSize(numberStr, numSize)
  const widgetW = Math.max(190, Math.max(titleW, numW) + padX * 2)
  const widgetH = padY * 2 + titleSize + gap + numSize

  const logoWidth = 60
  const logoHeight = 30
  const logoX = margin
  const logoY = y - logoHeight

  const widgetX = width - margin - widgetW
  const widgetY = y - widgetH + 2

  if (logoImage) {
    page.drawImage(logoImage, {
      x: logoX,
      y: logoY,
      width: logoWidth,
      height: logoHeight,
    });
  } else {
    page.drawText("DIFAR", {
      x: logoX,
      y: logoY + logoHeight / 2 - 6,
      size: 14,
      font: helvBold,
      color: rgb(0.2, 0.2, 0.2),
    });
  }

  drawRoundedRect(page, widgetX, widgetY, widgetW, widgetH, 10, {
    fill: rgb(0.985, 0.985, 0.985),
    stroke: rgb(0.74, 0.74, 0.74),
    borderWidth: 1,
  })

  const centerX = widgetX + widgetW / 2
  const titleX = centerX - titleW / 2
  const titleY = widgetY + widgetH - padY - titleSize + 2
  page.drawText(title, { x: titleX, y: titleY, size: titleSize, font: helvBold })

  const numX = centerX - numW / 2
  const numY = titleY - gap - numSize
  page.drawText(numberStr, { x: numX, y: numY, size: numSize, font: helvBold })

  y -= widgetH + 10
  line(page, margin, y, width - margin, y, 1, rgb(0.8, 0.8, 0.8))
  y -= 15

  const col1X = margin
  let col1Y = y

  page.drawText("Fecha de Emisión:", { x: col1X, y: col1Y, size: 10, font: helvBold })
  page.drawText(order.fechaPedido, { x: col1X + 100, y: col1Y, size: 10, font: helv })
  col1Y -= 14

  const nombreComercialLines = wrapText(order.nombreComercial.trim(), helv, 10, contentWidth - 100)
  page.drawText("Nombre Comercial:", { x: col1X, y: col1Y, size: 10, font: helvBold })
  let nombreY = col1Y
  for (const line of nombreComercialLines) {
    page.drawText(line, { x: col1X + 100, y: nombreY, size: 10, font: helv })
    nombreY -= 12
  }
  col1Y -= (nombreComercialLines.length * 12) + 2

  const direccionLines = wrapText(order?.direccionEntrega || '-', helv, 10, contentWidth - 100)
  page.drawText("Dirección:", { x: col1X, y: col1Y, size: 10, font: helvBold })
  let direccionY = col1Y
  for (const line of direccionLines) {
    page.drawText(line, { x: col1X + 100, y: direccionY, size: 10, font: helv })
    direccionY -= 12
  }
  col1Y -= (direccionLines.length * 12) + 2

  const col2X = width / 2 + 10

  page.drawText("Condición:", { x: col1X, y: col1Y, size: 10, font: helvBold })
  page.drawText(order?.condicionPedido || '-', { x: col1X + 100, y: col1Y, size: 10, font: helv })


  page.drawText("Vendedor:", { x: col2X, y: col1Y, size: 10, font: helvBold })
  page.drawText(order?.nombreVendedor || '-', { x: col2X + 60, y: col1Y, size: 10, font: helv })

  col1Y -= (direccionLines.length * 12) + 10
  y = Math.min(col1Y, y)

  const layout: TableLayout = {
    x: margin,
    y,
    widths: {
      qty: 40,        // CANT.
      desc: 135,      // DESCRIPCIÓN
      code: 60,       // CÓDIGO
      lot: 70,        // LOTE (nuevo)
      due: 70,        // FEC. VENC.
      unit: 70,       // P. UNIT.
      amt: 80,        // IMPORTE
    },
    paddingX: 6,
    rowH: 16,
    headerH: 20,
  }

  y = drawTableHeader(page, layout, helvBold, helv, width, height)

  for (const item of items) {
    const descMaxWidth = layout.widths.desc - layout.paddingX * 2
    const descLines = wrapText(item.productoNombre, helv, 10, descMaxWidth)
    const dynamicRowH = Math.max(layout.rowH, descLines.length * 12 + 6)

    if (y - dynamicRowH < margin + 70) {
      page = pdfDoc.addPage([595.28, 841.89])
      y = 841.89 - margin
      y = drawTableHeader(page, layout, helvBold, helv, width, height)
    }

    const rowTop = y
    const rowBottom = y - dynamicRowH

    const xPositions = computeColumnXs(layout)
    for (const x of xPositions) {
      line(page, x, rowTop, x, rowBottom, 0.5, rgb(0.9, 0.9, 0.9))
    }
    line(page, layout.x, rowBottom, layout.x + totalWidth(layout), rowBottom, 0.5, rgb(0.85, 0.85, 0.85))

    const baseY = rowTop - 12

    drawCellText(page, String(item.cantPedido), layout.x + layout.paddingX, baseY, helv, 10, "left")

    let textY = baseY
    for (const l of descLines) {
      page.drawText(l, { x: xPositions[1] + layout.paddingX, y: textY, size: 10, font: helv })
      textY -= 12
    }

    drawCellText(page, item.codigoitemPedido, xPositions[2] + layout.paddingX, baseY, helv, 10, "left")

    const lote = item.cod_lote || '-'
    drawCellText(page, lote, xPositions[3] + layout.paddingX, baseY, helv, 10, "left")

    const fechaVenc = item.fec_venc_lote || '-'
    drawCellText(page, fechaVenc, xPositions[4] + layout.paddingX, baseY, helv, 10, "left")

    const unitStr = money(item.precioPedido)
    drawCellText(page, unitStr, xPositions[5] + layout.widths.unit - layout.paddingX, baseY, helv, 10, "right")

    const amtStr = money(String(Number(item.precioPedido) * Number(item.cantPedido)))
    drawCellText(page, amtStr, xPositions[6] + layout.widths.amt - layout.paddingX, baseY, helvBold, 10, "right")

    y -= dynamicRowH
  }

  y -= 12
  const totalVal = items.reduce((s, it) => s + Number(it.precioPedido) * Number(it.cantPedido), 0)
  const totalStr = money(totalVal.toString())

  const tableRight = layout.x + totalWidth(layout)
  const totalLabel = "TOTAL:"
  const labelW = helvBold.widthOfTextAtSize(totalLabel, 12)
  const valW = helvBold.widthOfTextAtSize(totalStr, 12)

  drawCellText(page, totalLabel, tableRight - valW - 10 - labelW, y, helvBold, 12, "left")
  drawCellText(page, totalStr, tableRight - valW, y, helvBold, 12, "left")

  y -= 28
  const totalText = numberToText(totalVal) + " SOLES"
  page.drawText("SON: " + totalText, { x: margin, y, size: 10, font: helv })

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: "application/pdf" })
}

function drawTableHeader(page: any, layout: TableLayout, helvBold: any, helv: any, pageW: number, pageH: number) {
  const headerTop = layout.y
  const headerBottom = layout.y - layout.headerH
  const totalW = totalWidth(layout)

  page.drawRectangle({
    x: layout.x,
    y: headerBottom,
    width: totalW,
    height: layout.headerH,
    color: rgb(0.96, 0.96, 0.96),
  })
  line(page, layout.x, headerBottom, layout.x + totalW, headerBottom, 0.8, rgb(0.8, 0.8, 0.8))

  const xs = computeColumnXs(layout)
  for (const x of xs) {
    line(page, x, headerTop, x, headerBottom, 0.8, rgb(0.85, 0.85, 0.85))
  }

  const textY = headerTop - 13

  page.drawText("CANT.", { x: xs[0] + layout.paddingX, y: textY, size: 10, font: helvBold })
  page.drawText("DESCRIPCIÓN", { x: xs[1] + layout.paddingX, y: textY, size: 10, font: helvBold })
  page.drawText("CÓDIGO", { x: xs[2] + layout.paddingX, y: textY, size: 10, font: helvBold })
  page.drawText("LOTE", { x: xs[3] + layout.paddingX, y: textY, size: 10, font: helvBold })
  page.drawText("FEC. VENC.", { x: xs[4] + layout.paddingX, y: textY, size: 10, font: helvBold })

  const unitLabel = "P. UNIT."
  const amtLabel = "IMPORTE"
  const unitXRight = xs[5] + layout.widths.unit - layout.paddingX
  const amtXRight = xs[6] + layout.widths.amt - layout.paddingX

  page.drawText(unitLabel, {
    x: unitXRight - helvBold.widthOfTextAtSize(unitLabel, 10),
    y: textY,
    size: 10,
    font: helvBold,
  })

  page.drawText(amtLabel, {
    x: amtXRight - helvBold.widthOfTextAtSize(amtLabel, 10),
    y: textY,
    size: 10,
    font: helvBold,
  })

  return headerBottom - 2
}

function computeColumnXs(layout: TableLayout) {
  const xs: number[] = []
  let acc = layout.x
  xs.push(acc) // qty
  acc += layout.widths.qty
  xs.push(acc) // desc
  acc += layout.widths.desc
  xs.push(acc) // code
  acc += layout.widths.code
  xs.push(acc) // lot
  acc += layout.widths.lot
  xs.push(acc) // due
  acc += layout.widths.due
  xs.push(acc) // unit
  acc += layout.widths.unit
  xs.push(acc) // amt
  xs.push(acc) // final position
  return xs
}

function numberToText(num: number): string {
  const unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const especiales = ['', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  const entero = Math.floor(num);
  const decimal = Math.round((num - entero) * 100);

  let texto = '';

  if (entero === 0) {
    texto = 'CERO';
  } else if (entero < 10) {
    texto = unidades[entero];
  } else if (entero < 20) {
    texto = especiales[entero - 10];
  } else if (entero < 100) {
    const decena = Math.floor(entero / 10);
    const unidad = entero % 10;

    if (unidad === 0) {
      texto = decenas[decena];
    } else if (decena === 1) {
      texto = 'DIECI' + unidades[unidad];
    } else if (decena === 2) {
      texto = 'VEINTI' + unidades[unidad];
    } else {
      texto = decenas[decena] + ' Y ' + unidades[unidad];
    }
  } else if (entero < 1000) {
    const centena = Math.floor(entero / 100);
    const resto = entero % 100;

    if (centena === 1 && resto === 0) {
      texto = 'CIEN';
    } else {
      texto = centenas[centena];
      if (resto > 0) {
        texto += ' ' + numberToText(resto);
      }
    }
  } else if (entero < 1000000) {
    const miles = Math.floor(entero / 1000);
    const resto = entero % 1000;

    if (miles === 1) {
      texto = 'MIL';
    } else {
      texto = numberToText(miles) + ' MIL';
    }

    if (resto > 0) {
      texto += ' ' + numberToText(resto);
    }
  } else if (entero < 1000000000) {
    const millones = Math.floor(entero / 1000000);
    const resto = entero % 1000000;

    if (millones === 1) {
      texto = 'UN MILLÓN';
    } else {
      texto = numberToText(millones) + ' MILLONES';
    }

    if (resto > 0) {
      texto += ' ' + numberToText(resto);
    }
  }

  if (decimal > 0) {
    texto += ' CON ' + decimal.toString().padStart(2, '0') + '/100';
  }

  return texto;
}

function totalWidth(layout: TableLayout) {
  const w = layout.widths
  return w.qty + w.desc + w.code + w.lot + w.due + w.unit + w.amt
}

function drawCellText(
    page: any,
    text: string,
    x: number,
    y: number,
    font: any,
    size: number,
    align: "left" | "right" = "left",
) {
  let tx = x
  if (align === "right") {
    tx = x - font.widthOfTextAtSize(text, size)
  }
  page.drawText(text, { x: tx, y, size, font })
}

function wrapText(text: string, font: any, size: number, maxWidth: number) {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ""

  for (const w of words) {
    const test = current ? current + " " + w : w
    const width = font.widthOfTextAtSize(test, size)
    if (width <= maxWidth) {
      current = test
    } else {
      if (current) lines.push(current)
      if (font.widthOfTextAtSize(w, size) > maxWidth) {
        let cut = w
        while (font.widthOfTextAtSize(cut, size) > maxWidth && cut.length > 1) {
          cut = cut.slice(0, -1)
        }
        lines.push(cut + "…")
        current = ""
      } else {
        current = w
      }
    }
  }
  if (current) lines.push(current)
  return lines
}

function line(page: any, x1: number, y1: number, x2: number, y2: number, thickness: number, color: any) {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color })
}

function drawRoundedRect(
    page: any,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    opts: { fill?: any; stroke?: any; borderWidth?: number } = {},
) {
  const rr = Math.min(r, w / 2, h / 2)
  const path = roundedRectSvgPath(x, y, w, h, rr)
  page.drawSvgPath(path, {
    color: opts.fill,
    borderColor: opts.stroke,
    borderWidth: opts.borderWidth ?? 1,
  })
}

function roundedRectSvgPath(x: number, y: number, w: number, h: number, r: number) {
  const x2 = x + w
  const y2 = y + h
  return [
    `M ${x + r} ${y}`,
    `L ${x2 - r} ${y}`,
    `Q ${x2} ${y} ${x2} ${y + r}`,
    `L ${x2} ${y2 - r}`,
    `Q ${x2} ${y2} ${x2 - r} ${y2}`,
    `L ${x + r} ${y2}`,
    `Q ${x} ${y2} ${x} ${y2 - r}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    "Z",
  ].join(" ")
}