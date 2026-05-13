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

// ─── Columnas ─────────────────────────────────────────────────────────────────
// Grupo "Comprobante Emitido"  → índices 0-12  (F.Emision → Total)
// Grupo "Comprobante Original" → índices 13-15 (F.Emision | Serie | Numero)
//   solo se renderiza cuando algún registro tiene tipoNC !== 'sin_nc'

type ColDef = { label: string; width: number; align: 'left' | 'right' | 'center' }

const COLS_COMPROBANTES: ColDef[] = [
    // ── Comprobante Emitido ──────────────────────────
    { label: 'F.Emision',    width: 52,  align: 'left'   },  // 0
    { label: 'Doc',          width: 26,  align: 'left'   },  // 1
    { label: 'Serie',        width: 34,  align: 'left'   },  // 2
    { label: 'NroDesde',     width: 44,  align: 'left'   },  // 3
    { label: 'F.Vcto.',      width: 50,  align: 'left'   },  // 4
    { label: 'Cliente',      width: 130, align: 'left'   },  // 5
    { label: 'D.I.',         width: 26,  align: 'center' },  // 6
    { label: 'Nº D.I.',      width: 62,  align: 'left'   },  // 7
    { label: 'T/C',          width: 24,  align: 'center' },  // 8
    { label: 'No Grabado',   width: 50,  align: 'right'  },  // 9
    { label: 'B.Imponible',  width: 52,  align: 'right'  },  // 10
    { label: 'IGV',          width: 44,  align: 'right'  },  // 11
    { label: 'Total',        width: 48,  align: 'right'  },  // 12
    // ── Comprobante Original (solo si tieneNC) ───────
    { label: 'F.Emision',    width: 52,  align: 'left'   },  // 13
    { label: 'Serie',        width: 36,  align: 'left'   },  // 14
    { label: 'Numero',       width: 44,  align: 'left'   },  // 15
]

// Anchos de cada grupo
const W_EMITIDO  = COLS_COMPROBANTES.slice(0, 13).reduce((s, c) => s + c.width, 0)
const W_ORIGINAL = COLS_COMPROBANTES.slice(13).reduce((s, c) => s + c.width, 0)

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

// ─── Paleta de colores (imagen de referencia) ─────────────────────────────────
const C_HEADER_BG  = rgb(0.086, 0.192, 0.361)   // azul marino #162F5C
const C_STATS_BG   = rgb(0.118, 0.263, 0.482)   // azul medio  #1E4379
const C_COL_HDR    = rgb(0.086, 0.192, 0.361)   // azul marino (cabecera cols)
const C_GRP_EMIT   = rgb(0.18,  0.38,  0.68 )   // grupo Emitido
const C_GRP_ORIG   = rgb(0.14,  0.30,  0.56 )   // grupo Original
const C_ROW_EVEN   = rgb(1,     1,     1    )   // fila par — blanco
const C_ROW_ODD    = rgb(0.945, 0.953, 0.965)   // fila impar — gris muy claro
const C_ROW_ANUL   = rgb(1,     0.93,  0.93 )   // fila anulada — rojo suave
const C_WHITE      = rgb(1,     1,     1    )
const C_TEXT       = rgb(0.13,  0.17,  0.24 )   // texto oscuro
const C_MUTED      = rgb(0.42,  0.47,  0.56 )   // gris footer
const C_RED        = rgb(0.78,  0.10,  0.10 )
const C_ANULADO    = rgb(0.72,  0.08,  0.08 )
const C_SEPARATOR  = rgb(0.82,  0.85,  0.90 )   // línea entre filas
const C_ACCENT     = rgb(0.235, 0.486, 0.784)   // azul acento

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeDate(str: string | null | undefined, offset = 0): string {
    if (!str) return '—'
    try {
        const d = offset ? addHours(parseISO(str), offset) : parseISO(str)
        return format(d, 'dd/MM/yyyy')
    } catch { return '—' }
}

function fmtMoney(val: number, negative = false): string {
    return negative ? `-${Math.abs(val).toFixed(2)}` : val.toFixed(2)
}

function calcBase(total: string | null): number {
    const t = Number(total)
    return isNaN(t) ? 0 : t / 1.18
}

function calcIGV(total: string | null): number {
    const t = Number(total)
    return isNaN(t) ? 0 : t - t / 1.18
}

function splitTextIntoLines(
    text: string, maxWidth: number, font: any, fontSize: number
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

// ─── Componente ───────────────────────────────────────────────────────────────

export function ExportRegistroButton({
                                         type,
                                         data             = [],
                                         guias            = [],
                                         tiposComprobante = [],
                                         mesLabel,
                                         empresaNombre    = 'DROGUERÍA DIFAR',
                                         empresaRuc       = '2056138401',
                                     }: ExportRegistroButtonProps) {

    const [loading, setLoading] = useState(false)

    const TITLES: Record<ReportType, string> = {
        comprobantes : 'Registro Ventas',
        notas        : 'Registro Notas de Crédito',
        guias        : 'Registro Guías de Remisión',
    }

    // Hay NC si algún registro tiene tipo_cpe='07' → nc_serie viene populated
    const tieneNC = type === 'comprobantes'
        && data.some(c => c.tipoNC !== 'sin_nc')

    const generatePdf = async () => {
        if (loading) return
        setLoading(true)

        try {
            const pdfDoc   = await PDFDocument.create()
            const font     = await pdfDoc.embedFont(StandardFonts.Helvetica)
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

            const pageWidth    = 841.89
            const pageHeight   = 595.28
            const margin       = 40
            const minYPosition = margin + 20
            const baseFontSize = 7

            // Ancho disponible para la tabla
            const availableW = pageWidth - margin * 2

            // Seleccionar cols base según tipo y si hay NC
            const baseCols: ColDef[] =
                type === 'comprobantes'
                    ? COLS_COMPROBANTES
                    : type === 'notas' ? COLS_NOTAS
                        : COLS_GUIAS

            // Escalar proporcionalmente para que sumen exactamente availableW
            const rawW  = baseCols.reduce((s, c) => s + c.width, 0)
            const scale = availableW / rawW
            const cols: ColDef[] = baseCols.map((c, i) => {
                const scaled = i < baseCols.length - 1
                    ? Math.floor(c.width * scale)
                    : availableW - baseCols.slice(0, -1).reduce((s2, col, j) => s2 + Math.floor(col.width * scale), 0)
                return { ...c, width: scaled }
            })

            // W grupos reescalados
            const scaledWEmitido  = type === 'comprobantes' ? cols.slice(0, 13).reduce((s, c) => s + c.width, 0) : 0
            const scaledWOriginal = type === 'comprobantes' ? cols.slice(13).reduce((s, c) => s + c.width, 0) : 0

            const totalColsW = availableW

            const mesStr = mesLabel
                ?? `${format(new Date(), 'MMMM')} del ${format(new Date(), 'yyyy')}`
                    .replace(/^\w/, c => c.toUpperCase())

            // ── Logo ──
            let logoImage: any = null
            try {
                const logoBytes = await fetch('/difar-logo.png').then(r => {
                    if (!r.ok) throw new Error('no logo')
                    return r.arrayBuffer()
                })
                logoImage = await pdfDoc.embedPng(logoBytes)
            } catch { /* sin logo */ }

            // ── Pre-calcular totales (para stats de primera página) ──
            let totBase  = 0
            let totIGV   = 0
            let totTotal = 0
            if (type !== 'guias') {
                for (const c of data) {
                    if (!c.anulado) {
                        totBase  += calcBase(c.total)
                        totIGV   += calcIGV(c.total)
                        totTotal += Number(c.total) || 0
                    }
                }
            }
            const countItems = type === 'guias' ? guias.length : data.length

            // ── Helper rect relleno ──
            const fillRect = (
                page: any,
                x: number, y: number, w: number, h: number,
                color: ReturnType<typeof rgb>
            ) => page.drawRectangle({ x, y, width: w, height: h, color })

            const addNewPage = () => pdfDoc.addPage([pageWidth, pageHeight])

            let currentPage = addNewPage()
            let yPosition   = pageHeight - margin
            let pageNumber  = 1
            let isFirstPage = true
            let rowColorIdx = 0   // alterna colores de fila

            // ── drawHeader ────────────────────────────────────────────────────
            const drawHeader = (page: any) => {

                // 1. Banda azul marino (header)
                const headerH = 58
                fillRect(page, 0, pageHeight - headerH, pageWidth, headerH, C_HEADER_BG)
                // Franja decorativa inferior (azul acento, 3px)
                fillRect(page, 0, pageHeight - headerH - 3, pageWidth, 3, C_ACCENT)

                let titleXPos = margin
                if (logoImage) {
                    page.drawImage(logoImage, {
                        x: margin, y: pageHeight - headerH + 12,
                        width: 50, height: 30,
                    })
                    titleXPos = margin + 60
                }

                // Nombre empresa (izquierda) — centrado vertical en headerH
                const hMid      = pageHeight - headerH / 2   // centro de la banda
                page.drawText(empresaNombre, {
                    x: titleXPos, y: hMid + 4,
                    size: 13, font: boldFont, color: C_WHITE,
                })
                page.drawText(`RUC: ${empresaRuc}`, {
                    x: titleXPos, y: hMid - 9,
                    size: 7.5, font, color: rgb(0.68, 0.78, 0.90),
                })

                // Título del reporte (derecha) — mismo centrado
                const titleText = TITLES[type]
                const titleW    = boldFont.widthOfTextAtSize(titleText, 13)
                page.drawText(titleText, {
                    x: pageWidth - margin - titleW,
                    y: hMid + 4,
                    size: 13, font: boldFont, color: C_WHITE,
                })

                // Período (derecha, bajo título)
                const periodoText = `Periodo: ${mesStr}`
                const periodoW    = font.widthOfTextAtSize(periodoText, 8)
                page.drawText(periodoText, {
                    x: pageWidth - margin - periodoW,
                    y: hMid - 9,
                    size: 8, font, color: rgb(0.68, 0.78, 0.90),
                })

                yPosition = pageHeight - headerH - 3

                // 2. Bloque de stats (solo primera página)
                if (isFirstPage) {
                    const statsH      = 62          // altura total del bloque
                    const sideW       = 18          // ancho de los laterales blancos
                    const lineThick   = 2.5         // grosor líneas celestes
                    const lineColor   = rgb(0.22, 0.60, 0.85)  // celeste #38A0DA
                    const statsTop    = yPosition
                    const statsBot    = yPosition - statsH

                    // Fondo azul medio (área interior entre los laterales)
                    fillRect(page, sideW, statsBot, pageWidth - sideW * 2, statsH, C_STATS_BG)

                    // Laterales blancos izquierdo y derecho
                    fillRect(page, 0,                statsBot, sideW, statsH, rgb(1, 1, 1))
                    fillRect(page, pageWidth - sideW, statsBot, sideW, statsH, rgb(1, 1, 1))

                    // Línea celeste superior
                    fillRect(page, sideW, statsTop - lineThick, pageWidth - sideW * 2, lineThick, lineColor)
                    // Línea celeste inferior — ancho total de la hoja
                    fillRect(page, 0, statsBot, pageWidth, lineThick, lineColor)

                    // Separador vertical central (blanco semitransparente)
                    const midX = pageWidth / 2
                    page.drawLine({
                        start    : { x: midX, y: statsBot + 12 },
                        end      : { x: midX, y: statsTop - 12 },
                        thickness: 1, color: rgb(0.45, 0.60, 0.80),
                    })

                    // Centros horizontales de cada mitad
                    const lCX = sideW + (pageWidth / 2 - sideW) / 2
                    const rCX = pageWidth / 2 + (pageWidth / 2 - sideW) / 2

                    // Centro vertical del bloque
                    const sMid = statsBot + statsH / 2

                    // Stat izquierda — comprobantes emitidos
                    const cntStr  = String(countItems)
                    const cntW    = boldFont.widthOfTextAtSize(cntStr, 20)
                    const cntLbl  = 'COMPROBANTES EMITIDOS'
                    const cntLblW = font.widthOfTextAtSize(cntLbl, 7)
                    page.drawText(cntStr, {
                        x: lCX - cntW / 2, y: sMid + 4,
                        size: 20, font: boldFont, color: C_WHITE,
                    })
                    page.drawText(cntLbl, {
                        x: lCX - cntLblW / 2, y: sMid - 10,
                        size: 7, font, color: rgb(0.68, 0.80, 0.93),
                    })

                    // Stat derecha — total facturado
                    const totStr  = totTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })
                    const totW    = boldFont.widthOfTextAtSize(totStr, 20)
                    const totLbl  = 'TOTAL FACTURADO (S/)'
                    const totLblW = font.widthOfTextAtSize(totLbl, 7)
                    page.drawText(totStr, {
                        x: rCX - totW / 2, y: sMid + 4,
                        size: 20, font: boldFont, color: C_WHITE,
                    })
                    page.drawText(totLbl, {
                        x: rCX - totLblW / 2, y: sMid - 10,
                        size: 7, font, color: rgb(0.68, 0.80, 0.93),
                    })

                    yPosition -= statsH + 8
                } else {
                    yPosition -= 8
                }

                // 3. Títulos de grupo — solo comprobantes
                if (type === 'comprobantes') {
                    const xEmitido  = margin
                    const xOriginal = margin + scaledWEmitido
                    const groupH    = 12

                    fillRect(page, xEmitido, yPosition - groupH, scaledWEmitido, groupH, C_GRP_EMIT)
                    page.drawText('Comprobante Emitido', {
                        x: xEmitido + 3, y: yPosition - groupH + 3,
                        size: baseFontSize, font: boldFont, color: C_WHITE,
                    })

                    fillRect(page, xOriginal, yPosition - groupH, scaledWOriginal, groupH, C_GRP_ORIG)
                    page.drawText('Comprobante Original', {
                        x: xOriginal + 3, y: yPosition - groupH + 3,
                        size: baseFontSize, font: boldFont, color: C_WHITE,
                    })

                    yPosition -= groupH
                }

                // 4. Cabecera columnas
                const colHdrH = 14
                fillRect(page, margin, yPosition - colHdrH, totalColsW, colHdrH, C_COL_HDR)

                let xPosition = margin
                cols.forEach(col => {
                    const lw = boldFont.widthOfTextAtSize(col.label, baseFontSize)
                    const tx = col.align === 'right'
                        ? xPosition + col.width - lw - 3
                        : col.align === 'center'
                            ? xPosition + (col.width - lw) / 2
                            : xPosition + 3
                    page.drawText(col.label, {
                        x: tx, y: yPosition - colHdrH + 4,
                        size: baseFontSize, font: boldFont, color: C_WHITE,
                    })
                    xPosition += col.width
                })

                yPosition -= colHdrH + 2
                rowColorIdx = 0
            }

            drawHeader(currentPage)
            isFirstPage = false

            // ── drawRow ───────────────────────────────────────────────────────
            const ROW_H = 18

            const drawRow = (
                page    : any,
                cells   : string[],
                anulado : boolean,
                negativo: boolean = false
            ) => {
                if (yPosition - ROW_H < minYPosition) {
                    currentPage = addNewPage()
                    pageNumber++
                    yPosition   = pageHeight - margin
                    drawHeader(currentPage)
                }

                // Fondo alternado por fila
                const rowBg = anulado
                    ? C_ROW_ANUL
                    : rowColorIdx % 2 === 0 ? C_ROW_EVEN : C_ROW_ODD
                fillRect(page, margin, yPosition - ROW_H + 2, totalColsW, ROW_H, rowBg)

                let xPosition = margin
                cells.forEach((cell, i) => {
                    const col   = cols[i]
                    const maxW  = col.width - 4
                    const lines = splitTextIntoLines(cell ?? '—', maxW, font, baseFontSize)
                    const txt   = lines[0] ?? ''
                    const tw    = font.widthOfTextAtSize(txt, baseFontSize)
                    const tx    = col.align === 'right'  ? xPosition + col.width - tw - 3
                        : col.align === 'center' ? xPosition + (col.width - tw) / 2
                            : xPosition + 3

                    // Cols 10-12 (B.Imponible, IGV, Total) en rojo si negativo
                    const isNumCol = i >= 10 && i <= 12
                    const color    = anulado              ? C_ANULADO
                        : negativo && isNumCol ? C_RED
                            : C_TEXT

                    page.drawText(txt, {
                        x: tx, y: yPosition - ROW_H + 5,
                        size: baseFontSize, font, color,
                    })
                    xPosition += col.width
                })

                // Línea separadora sutil
                page.drawLine({
                    start    : { x: margin,              y: yPosition - ROW_H + 2 },
                    end      : { x: margin + totalColsW, y: yPosition - ROW_H + 2 },
                    thickness: 0.3, color: C_SEPARATOR,
                })

                yPosition -= ROW_H
                rowColorIdx++
            }

            // ── Render comprobantes ───────────────────────────────────────────
            if (type === 'comprobantes') {
                for (const c of data) {
                    if (yPosition - ROW_H < minYPosition) {
                        currentPage = addNewPage()
                        pageNumber++
                        yPosition   = pageHeight - margin
                        drawHeader(currentPage)
                    }

                    const base    = calcBase(c.total)
                    const igv     = calcIGV(c.total)
                    const total   = Number(c.total) || 0
                    const anulado = c.anulado
                    // hasNC → el SP devolvió nc_serie populated (tipo_cpe='07' existe)
                    const hasNC   = c.tipoNC !== 'sin_nc'
                    const moneda  = c.moneda === 1 ? 'S/' : '$'
                    const tiDoc   = c.tipo_comprobante === 1 ? 'FAC'
                        : c.tipo_comprobante === 3 ? 'BOL'
                            : String(c.tipo_comprobante ?? '—')
                    const tiDI    = c.tipo_comprobante === 1 ? 'RUC' : 'DNI'

                    const cells: string[] = [
                        // Comprobante Emitido:
                        // hasNC  -> datos de la NC emitida (nc_serie, nc_numero, nc_fecha)
                        // !hasNC -> datos normales del comprobante
                        hasNC ? safeDate(c.nc_fecha)      : safeDate(c.fecha_envio, 5),
                        tiDoc,
                        hasNC ? (c.nc_serie  ?? '—')      : c.serie,
                        hasNC ? (c.nc_numero ?? '—')      : c.numero,
                        hasNC ? safeDate(c.nc_fecha)      : safeDate(c.fecha_emision ?? c.fecha_envio, 5),
                        c.cliente_denominacion ?? '—',
                        tiDI,
                        c.cliente_numdoc ?? '—',
                        moneda,
                        '0.00',
                        fmtMoney(base,  hasNC),
                        fmtMoney(igv,   hasNC),
                        fmtMoney(total, hasNC),
                    ]

                    // Comprobante Original: siempre se muestran las 3 cols
                    // hasNC  -> datos del comprobante padre
                    // !hasNC -> guiones
                    cells.push(
                        hasNC ? safeDate(c.fecha_envio, 5) : '—',
                        hasNC ? c.serie                     : '—',
                        hasNC ? c.numero                    : '—',
                    )

                    drawRow(currentPage, cells, anulado, hasNC)
                }
            }

            // ── Render notas ──────────────────────────────────────────────────
            if (type === 'notas') {
                for (const c of data) {
                    if (yPosition - ROW_H < minYPosition) {
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

            // ── Render guías ──────────────────────────────────────────────────
            if (type === 'guias') {
                for (const g of guias) {
                    if (yPosition - ROW_H < minYPosition) {
                        currentPage = addNewPage()
                        pageNumber++
                        yPosition   = pageHeight - margin
                        drawHeader(currentPage)
                    }

                    const estado =
                        !g.idGuiaRemCab               ? 'NO USADO'
                            : g.sunat_responsecode !== '0' ? 'ERROR SUNAT'
                                : g.anulado                    ? 'ANULADO'
                                    : 'ACEPTADO'

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

            // ── Fila totales ──────────────────────────────────────────────────
            if (type !== 'guias' && data.length > 0) {
                if (yPosition - 14 < minYPosition) {
                    currentPage = addNewPage()
                    pageNumber++
                    yPosition   = pageHeight - margin
                    drawHeader(currentPage)
                }

                // Separación visual antes de totales
                yPosition -= 6

                // Fondo azul marino para la fila de totales (más alta)
                const totRowH = 22
                fillRect(currentPage, margin, yPosition - totRowH, totalColsW, totRowH, C_HEADER_BG)

                currentPage.drawText('TOTALES', {
                    x: margin + 3, y: yPosition - totRowH / 2 - 3,
                    size: baseFontSize + 1, font: boldFont, color: C_WHITE,
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
                            x: tx + col.width - vw - 3, y: yPosition - totRowH / 2 - 3,
                            size: baseFontSize + 1, font: boldFont, color: C_WHITE,
                        })
                    }
                    tx += col.width
                })
            }

            // ── Footer en todas las páginas ───────────────────────────────────
            const allPages = pdfDoc.getPages()
            allPages.forEach((pg, idx) => {
                const now       = new Date()
                const fechaText = `Fecha de emision: ${now.toLocaleDateString('es-PE')} ${now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true })}`
                const pgText    = `Pagina ${idx + 1}`
                const pgW       = font.widthOfTextAtSize(pgText, 7.5)
                const fy        = margin - 16

                // Línea separadora
                pg.drawLine({
                    start    : { x: margin,              y: fy + 12 },
                    end      : { x: pageWidth - margin,  y: fy + 12 },
                    thickness: 0.5, color: rgb(0.80, 0.83, 0.88),
                })

                pg.drawText(fechaText, {
                    x: margin, y: fy,
                    size: 7.5, font, color: C_MUTED,
                })
                pg.drawText(pgText, {
                    x: pageWidth - margin - pgW, y: fy,
                    size: 7.5, font, color: C_MUTED,
                })
            })

            // ── Guardar y descargar ───────────────────────────────────────────
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