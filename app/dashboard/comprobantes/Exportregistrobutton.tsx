'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Loader2 } from 'lucide-react'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { format, parseISO, addHours } from 'date-fns'
import { Comprobante, GuiaRemision } from '@/app/types/order/order-interface'
import { Sequential } from '@/app/types/config-types'
import apiClient from "@/app/api/client";

type ReportType = 'comprobantes' | 'notas' | 'guias'

interface FiltersComprobantes {
    fechaDesde: string
    fechaHasta: string
}

interface ExportRegistroButtonProps {
    type             : ReportType
    data?            : Comprobante[]
    guias?           : GuiaRemision[]
    tiposComprobante?: Sequential[]
    mesLabel?        : string
    empresaNombre?   : string
    empresaRuc?      : string
    filters?         : FiltersComprobantes
}

type ColDef = { label: string; width: number; align: 'left' | 'right' | 'center' }

const COLS_COMPROBANTES: ColDef[] = [
    { label: 'F.Emision',    width: 52,  align: 'left'   },
    { label: 'Doc',          width: 26,  align: 'left'   },
    { label: 'Serie',        width: 34,  align: 'left'   },
    { label: 'NroDesde',     width: 44,  align: 'left'   },
    { label: 'F.Vcto.',      width: 50,  align: 'left'   },
    { label: 'Cliente',      width: 130, align: 'left'   },
    { label: 'D.I.',         width: 26,  align: 'center' },
    { label: 'Nº D.I.',      width: 62,  align: 'left'   },
    { label: 'T/C',          width: 24,  align: 'center' },
    { label: 'No Grabado',   width: 50,  align: 'right'  },
    { label: 'B.Imponible',  width: 52,  align: 'right'  },
    { label: 'IGV',          width: 44,  align: 'right'  },
    { label: 'Total',        width: 48,  align: 'right'  },
    { label: 'F.Emision',    width: 52,  align: 'left'   },
    { label: 'Serie',        width: 36,  align: 'left'   },
    { label: 'Numero',       width: 44,  align: 'left'   },
]

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

const C_HEADER_BG  = rgb(0.086, 0.192, 0.361)
const C_STATS_BG   = rgb(0.118, 0.263, 0.482)
const C_COL_HDR    = rgb(0.086, 0.192, 0.361)
const C_GRP_EMIT   = rgb(0.18,  0.38,  0.68 )
const C_GRP_ORIG   = rgb(0.14,  0.30,  0.56 )
const C_ROW_EVEN   = rgb(1,     1,     1    )
const C_ROW_ODD    = rgb(0.945, 0.953, 0.965)
const C_ROW_ANUL   = rgb(1,     0.93,  0.93 )
const C_WHITE      = rgb(1,     1,     1    )
const C_TEXT       = rgb(0.13,  0.17,  0.24 )
const C_RED        = rgb(0.78,  0.10,  0.10 )
const C_ANULADO    = rgb(0.72,  0.08,  0.08 )
const C_SEPARATOR  = rgb(0.82,  0.85,  0.90 )


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
    text: any, maxWidth: number, font: any, fontSize: number
): string[] {
    const str = (text === null || text === undefined) ? '' : String(text)
    if (!str) return ['']
    const words = str.split(' ')
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

export function ExportRegistroButton({
                                         type,
                                         data             = [],
                                         guias            = [],
                                         tiposComprobante = [],
                                         mesLabel,
                                         empresaNombre    = 'DROGUERÍA DIFAR',
                                         empresaRuc       = '2056138401',
                                         filters,
                                     }: ExportRegistroButtonProps) {

    const [loading, setLoading] = useState(false)

    const TITLES: Record<ReportType, string> = {
        comprobantes : 'Registro Ventas',
        notas        : 'Registro Notas de Crédito',
        guias        : 'Registro Guías de Remisión',
    }

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

            const availableW = pageWidth - margin * 2

            const baseCols: ColDef[] =
                type === 'comprobantes'
                    ? COLS_COMPROBANTES
                    : type === 'notas' ? COLS_NOTAS
                        : COLS_GUIAS

            const rawW  = baseCols.reduce((s, c) => s + c.width, 0)
            const scale = availableW / rawW
            const cols: ColDef[] = baseCols.map((c, i) => {
                const scaled = i < baseCols.length - 1
                    ? Math.floor(c.width * scale)
                    : availableW - baseCols.slice(0, -1).reduce((s2, col, j) => s2 + Math.floor(col.width * scale), 0)
                return { ...c, width: scaled }
            })

            const scaledWEmitido  = type === 'comprobantes' ? cols.slice(0, 13).reduce((s, c) => s + c.width, 0) : 0
            const scaledWOriginal = type === 'comprobantes' ? cols.slice(13).reduce((s, c) => s + c.width, 0) : 0

            const totalColsW = availableW

            const mesStr = mesLabel
                ?? `${format(new Date(), 'MMMM')} del ${format(new Date(), 'yyyy')}`
                    .replace(/^\w/, c => c.toUpperCase())

            let logoImage: any = null
            try {
                const logoBytes = await fetch('/difar-logo.png').then(r => {
                    if (!r.ok) throw new Error('no logo')
                    return r.arrayBuffer()
                })
                logoImage = await pdfDoc.embedPng(logoBytes)
            } catch { /* sin logo */ }

            type RegistroVenta = {
                Fecha            : string
                Doc              : string
                Serie            : string
                NroDesde         : string
                FVcto            : string
                Cliente          : string
                DI               : string
                NroDI            : string
                TC               : string | number
                NoGrabado        : number
                BImponible       : number
                IGV              : number
                Total            : number
                FechaDocOriginal : string | null
                SerieDocOriginal : string | null
                NumeroDocOriginal: string | null
            }

            let registroVentas: RegistroVenta[] = []
            const usarSP = type === 'comprobantes' && filters?.fechaDesde && filters?.fechaHasta

            if (usarSP) {
                try {
                    const [anio, mes] = filters!.fechaDesde.split('-').map(Number)
                    const params = new URLSearchParams({
                        anio : String(anio),
                        mes  : String(mes),
                    })
                    const resp = await apiClient.get(`/pedidos/registroVentas?${params}`)
                    if (resp.data.data.data) {
                        registroVentas = resp.data.data.data
                    }
                } catch (e) {
                    console.warn('No se pudo obtener registro de ventas del SP, se usarán datos locales', e)
                }
            }

            let totBase  = 0
            let totIGV   = 0
            let totTotal = 0
            const comprobantes = [...data?.filter(c => c.idSunat !== null && !(c.aceptada_por_sunat != null && c.aceptada_por_sunat === 104)), ...registroVentas]
            if (type !== 'guias') {
                for (const c of data) {
                    if (!c.anulado) {
                        totBase  += calcBase(c.total)
                        totIGV   += calcIGV(c.total)
                        totTotal += Number(c.total) || 0
                    }
                }

                for (const c of registroVentas) {
                    totBase  += calcBase(c.Total)
                    totIGV   += calcIGV(c.Total)
                    totTotal += Number(c.Total) || 0
                }
            }
            const countItems = type === 'guias' ? guias.length : comprobantes.length

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
            let rowColorIdx = 0

            const drawHeader = (page: any) => {

                const headerH = 58
                fillRect(page, 0, pageHeight - headerH, pageWidth, headerH, C_HEADER_BG)

                let titleXPos = margin
                if (logoImage) {
                    page.drawImage(logoImage, {
                        x: margin, y: pageHeight - headerH + 12,
                        width: 50, height: 30,
                    })
                    titleXPos = margin + 60
                }

                const hMid      = pageHeight - headerH / 2
                page.drawText(empresaNombre, {
                    x: titleXPos, y: hMid + 4,
                    size: 13, font: boldFont, color: C_WHITE,
                })
                page.drawText(`RUC: ${empresaRuc}`, {
                    x: titleXPos, y: hMid - 9,
                    size: 7.5, font, color: rgb(0.68, 0.78, 0.90),
                })

                const titleText = TITLES[type]
                const titleW    = boldFont.widthOfTextAtSize(titleText, 13)
                page.drawText(titleText, {
                    x: pageWidth - margin - titleW,
                    y: hMid + 4,
                    size: 13, font: boldFont, color: C_WHITE,
                })

                const periodoText = `Periodo: ${mesStr}`
                const periodoW    = font.widthOfTextAtSize(periodoText, 8)
                page.drawText(periodoText, {
                    x: pageWidth - margin - periodoW,
                    y: hMid - 9,
                    size: 8, font, color: rgb(0.68, 0.78, 0.90),
                })

                yPosition = pageHeight - headerH

                if (isFirstPage) {
                    const statsH      = 62
                    const sideW       = 18
                    const lineThick   = 5
                    const lineColor   = rgb(0.22, 0.60, 0.85)
                    const statsTop    = yPosition
                    const statsBot    = yPosition - statsH


                    fillRect(page, sideW, statsBot, pageWidth - sideW * 2, statsH, C_STATS_BG)


                    fillRect(page, 0,                statsBot, sideW, statsH, rgb(1, 1, 1))
                    fillRect(page, pageWidth - sideW, statsBot, sideW, statsH, rgb(1, 1, 1))


                    fillRect(page, 0, statsTop - lineThick, pageWidth, lineThick, lineColor)

                    fillRect(page, 0, statsBot, pageWidth, lineThick, lineColor)


                    const midX = pageWidth / 2
                    page.drawLine({
                        start    : { x: midX, y: statsBot + lineThick },
                        end      : { x: midX, y: statsTop - lineThick },
                        thickness: 1, color: rgb(0.45, 0.60, 0.80),
                    })


                    const lCX = sideW + (pageWidth / 2 - sideW) / 2
                    const rCX = pageWidth / 2 + (pageWidth / 2 - sideW) / 2


                    const sMid = statsBot + statsH / 2

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

                const rowBg = anulado
                    ? C_ROW_ANUL
                    : rowColorIdx % 2 === 0 ? C_ROW_EVEN : C_ROW_ODD
                fillRect(page, margin, yPosition - ROW_H + 2, totalColsW, ROW_H, rowBg)

                let xPosition = margin
                cells.forEach((cell, i) => {
                    const col   = cols[i]
                    const maxW  = col.width - 4
                    const safeCell = (cell === null || cell === undefined) ? '—' : String(cell)
                    const lines = splitTextIntoLines(safeCell, maxW, font, baseFontSize)
                    const txt   = lines[0] ?? ''
                    const tw    = font.widthOfTextAtSize(txt, baseFontSize)
                    const tx    = col.align === 'right'  ? xPosition + col.width - tw - 3
                        : col.align === 'center' ? xPosition + (col.width - tw) / 2
                            : xPosition + 3

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

                page.drawLine({
                    start    : { x: margin,              y: yPosition - ROW_H + 2 },
                    end      : { x: margin + totalColsW, y: yPosition - ROW_H + 2 },
                    thickness: 0.3, color: C_SEPARATOR,
                })

                yPosition -= ROW_H
                rowColorIdx++
            }

            if (type === 'comprobantes') {
                type FilaUnificada = {
                    fechaOrden: number
                    cells     : string[]
                    anulado   : boolean
                    negativo  : boolean
                }

                const parseFecha = (f: string | null | undefined): number => {
                    if (!f) return 0
                    const t = new Date(f).getTime()
                    return isNaN(t) ? 0 : t
                }

                const filas: FilaUnificada[] = []

                if (usarSP && registroVentas.length > 0) {
                    const s = (v: any) => (v === null || v === undefined) ? '—' : String(v)

                    for (const rv of registroVentas) {
                        const hasOriginal = !!(rv.SerieDocOriginal && rv.NumeroDocOriginal)
                        const tcStr       = rv.TC ? String(rv.TC) : '1.00'

                        filas.push({
                            fechaOrden: parseFecha(rv.Fecha),
                            anulado   : false,
                            negativo  : false,
                            cells: [
                                safeDate(rv.Fecha),
                                s(rv.Doc),
                                s(rv.Serie),
                                s(rv.NroDesde),
                                safeDate(rv.FVcto),
                                s(rv.Cliente),
                                s(rv.DI),
                                s(rv.NroDI),
                                tcStr,
                                isNaN(Number(rv.NoGrabado))  ? '0.00' : Number(rv.NoGrabado).toFixed(2),
                                isNaN(Number(rv.BImponible)) ? '0.00' : Number(rv.BImponible).toFixed(2),
                                isNaN(Number(rv.IGV))        ? '0.00' : Number(rv.IGV).toFixed(2),
                                isNaN(Number(rv.Total))      ? '0.00' : Number(rv.Total).toFixed(2),
                                hasOriginal ? safeDate(rv.FechaDocOriginal) : '—',
                                hasOriginal ? s(rv.SerieDocOriginal)        : '—',
                                hasOriginal ? s(rv.NumeroDocOriginal)       : '—',
                            ],
                        })
                    }
                }

                for (const c of data) {
                    const base    = calcBase(c.total)
                    const igv     = calcIGV(c.total)
                    const total   = Number(c.total) || 0
                    const anulado = c.anulado
                    const hasNC   = c.tipoNC !== 'sin_nc'
                    const moneda  = c.moneda === 1 ? 'S/' : '$'
                    const tiDoc   = c.tipo_comprobante === 1 ? 'FAC'
                        : c.tipo_comprobante === 3 ? 'BOL'
                            : String(c.tipo_comprobante ?? '—')
                    const tiDI    = c.tipo_comprobante === 1 ? 'RUC' : 'DNI'

                    const fechaMostrada = hasNC ? c.nc_fecha : c.fecha_envio

                    const cells: string[] = [
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
                        hasNC ? safeDate(c.fecha_envio, 5) : '—',
                        hasNC ? c.serie                     : '—',
                        hasNC ? c.numero                    : '—',
                    ]

                    if (c.idSunat !== null && !(c.aceptada_por_sunat != null && c.aceptada_por_sunat === 104)) {
                        filas.push({
                            fechaOrden: parseFecha(fechaMostrada),
                            anulado,
                            negativo: hasNC,
                            cells,
                        })
                    }
                }

                filas.sort((a, b) => a.fechaOrden - b.fechaOrden)

                for (const fila of filas) {
                    if (yPosition - ROW_H < minYPosition) {
                        currentPage = addNewPage()
                        pageNumber++
                        yPosition   = pageHeight - margin
                        drawHeader(currentPage)
                    }
                    drawRow(currentPage, fila.cells, fila.anulado, fila.negativo)
                }
            }

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

            if (type !== 'guias' && data.length > 0) {
                if (yPosition - 14 < minYPosition) {
                    currentPage = addNewPage()
                    pageNumber++
                    yPosition   = pageHeight - margin
                    drawHeader(currentPage)
                }

                yPosition -= 6

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

            const allPages = pdfDoc.getPages()
            allPages.forEach((pg, idx) => {
                const now       = new Date()
                const fechaText = `Fecha de emision: ${now.toLocaleDateString('es-PE')} ${now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true })}`
                const pgText    = `Pagina ${idx + 1}`
                const pgW       = font.widthOfTextAtSize(pgText, 7.5)
                const footerH   = 26
                const fy        = 0

                pg.drawRectangle({ x: 0, y: fy, width: pageWidth, height: footerH, color: C_HEADER_BG })

                pg.drawRectangle({ x: 0, y: fy + footerH - 2.5, width: pageWidth, height: 2.5, color: rgb(0.22, 0.60, 0.85) })

                const textY = fy + footerH / 2 - 3
                pg.drawText(fechaText, {
                    x: margin, y: textY,
                    size: 7.5, font, color: C_WHITE,
                })
                pg.drawText(pgText, {
                    x: pageWidth - margin - pgW, y: textY,
                    size: 7.5, font, color: C_WHITE,
                })
            })

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