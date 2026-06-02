'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Loader2 } from 'lucide-react'
import { format, parseISO, addHours } from 'date-fns'
import { Comprobante } from '@/app/types/order/order-interface'
import { Sequential } from '@/app/types/config-types'
import apiClient from '@/app/api/client'
import ExcelJS from 'exceljs'

interface FiltersComprobantes {
    fechaDesde: string
    fechaHasta: string
}

interface ExcelExportButtonProps {
    data             : Comprobante[]
    tiposComprobante?: Sequential[]
    filters?         : FiltersComprobantes
}

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
    Vendedor         : string
}

const HEADER_ARGB    = 'FF163161'
const SUBHEADER_EMIT = 'FF2D62AD'
const SUBHEADER_ORIG = 'FF243D8F'
const ROW_ODD_ARGB   = 'FFF2F4F8'
const TOTAL_ARGB     = 'FF163161'

function safeDate(str: string | null | undefined, offset = 0): string {
    if (!str) return '—'
    try {
        const d = offset ? addHours(parseISO(str), offset) : parseISO(str)
        return format(d, 'dd/MM/yyyy')
    } catch { return '—' }
}

const COLUMNS = [
    { header: 'F.Emision',     key: 'fEmision',     width: 12, numFmt: '@',       group: 'emit' },
    { header: 'Doc',           key: 'doc',           width:  6, numFmt: '@',       group: 'emit' },
    { header: 'Serie',         key: 'serie',         width:  8, numFmt: '@',       group: 'emit' },
    { header: 'NroDesde',      key: 'nroDesde',      width: 10, numFmt: '@',       group: 'emit' },
    { header: 'F.Vcto.',       key: 'fVcto',         width: 12, numFmt: '@',       group: 'emit' },
    { header: 'Cliente',       key: 'cliente',       width: 36, numFmt: '@',       group: 'emit' },
    { header: 'D.I.',          key: 'di',            width:  6, numFmt: '@',       group: 'emit' },
    { header: 'Nº D.I.',       key: 'nroDi',         width: 14, numFmt: '@',       group: 'emit' },
    { header: 'T/C',           key: 'tc',            width:  6, numFmt: '@',       group: 'emit' },
    { header: 'No Grabado',    key: 'noGrabado',     width: 12, numFmt: '#,##0.00', group: 'emit' },
    { header: 'B.Imponible',   key: 'bImponible',    width: 13, numFmt: '#,##0.00', group: 'emit' },
    { header: 'IGV',           key: 'igv',           width: 11, numFmt: '#,##0.00', group: 'emit' },
    { header: 'Total',         key: 'total',         width: 11, numFmt: '#,##0.00', group: 'emit' },
    { header: 'F.Emision',    key: 'fEmisionOrig',  width: 12, numFmt: '@',       group: 'orig' },
    { header: 'Serie',         key: 'serieOrig',     width:  8, numFmt: '@',       group: 'orig' },
    { header: 'Numero',        key: 'numeroOrig',    width: 10, numFmt: '@',       group: 'orig' },
    { header: 'Vendedor',      key: 'vendedor',      width: 24, numFmt: '@',       group: 'vend' },
] as const

export function ExcelExportButton({
    data             = [],
    tiposComprobante = [],
    filters,
}: ExcelExportButtonProps) {

    const [loading, setLoading] = useState(false)

    const exportExcel = async () => {
        if (loading) return
        setLoading(true)

        try {
            let registroVentas: RegistroVenta[] = []
            const usarSP = filters?.fechaDesde && filters?.fechaHasta

            if (usarSP) {
                try {
                    const [anio, mes] = filters!.fechaDesde.split('-').map(Number)
                    const params = new URLSearchParams({
                        anio: String(anio),
                        mes:  String(mes),
                    })
                    const resp = await apiClient.get(`/pedidos/registroVentas?${params}`)
                    if (resp.data.data.data) registroVentas = resp.data.data.data
                } catch (e) {
                    console.warn('No se pudo obtener registro de ventas del SP', e)
                }
            }

            type Fila = {
                fechaOrden: number
                row       : Record<string, string | number>
                anulado   : boolean
                negativo  : boolean
            }

            const parseFecha = (f: string | null | undefined): number => {
                if (!f) return 0
                const t = new Date(f).getTime()
                return isNaN(t) ? 0 : t
            }

            const filas: Fila[] = []

            if (usarSP && registroVentas.length > 0) {
                const s = (v: any) => (v === null || v === undefined) ? '—' : String(v)
                for (const rv of registroVentas) {
                    const hasOriginal = !!(rv.SerieDocOriginal && rv.NumeroDocOriginal)
                    filas.push({
                        fechaOrden: parseFecha(rv.Fecha),
                        anulado   : false,
                        negativo  : false,
                        row: {
                            fEmision    : safeDate(rv.Fecha),
                            doc         : s(rv.Doc),
                            serie       : s(rv.Serie),
                            nroDesde    : s(rv.NroDesde),
                            fVcto       : safeDate(rv.FVcto),
                            cliente     : s(rv.Cliente),
                            di          : s(rv.DI),
                            nroDi       : s(rv.NroDI),
                            tc          : rv.TC ? String(rv.TC) : '1.00',
                            noGrabado   : isNaN(Number(rv.NoGrabado))  ? 0 : Number(Number(rv.NoGrabado).toFixed(2)),
                            bImponible  : isNaN(Number(rv.BImponible)) ? 0 : Number(Number(rv.BImponible).toFixed(2)),
                            igv         : isNaN(Number(rv.IGV))        ? 0 : Number(Number(rv.IGV).toFixed(2)),
                            total       : isNaN(Number(rv.Total))      ? 0 : Number(Number(rv.Total).toFixed(2)),
                            fEmisionOrig: hasOriginal ? safeDate(rv.FechaDocOriginal) : '—',
                            serieOrig   : hasOriginal ? s(rv.SerieDocOriginal)        : '—',
                            numeroOrig  : hasOriginal ? s(rv.NumeroDocOriginal)       : '—',
                            vendedor    : s(rv.Vendedor),
                        },
                    })
                }
            }

            for (const c of data) {
                if (c.idSunat === null || (c.aceptada_por_sunat != null && c.aceptada_por_sunat === 104)) continue
                const base    = Number(c.total_gravada || 0)
                const igv     = Number(c.total_igv || 0)
                const totalN  = Number(c.total) || 0
                const hasNC   = c.tipoNC !== 'sin_nc'
                const moneda  = c.moneda === 1 ? 'S/' : '$'
                const tiDoc   = c.tipo_comprobante === 1 ? 'FAC' : c.tipo_comprobante === 3 ? 'BOL' : String(c.tipo_comprobante ?? '—')
                const tiDI    = c.tipo_comprobante === 1 ? 'RUC' : 'DNI'

                filas.push({
                    fechaOrden: parseFecha(c.fecha_envio),
                    anulado   : c.anulado,
                    negativo  : hasNC,
                    row: {
                        fEmision    : safeDate(c.fecha_envio, 5),
                        doc         : tiDoc,
                        serie       : c.serie,
                        nroDesde    : c.numero,
                        fVcto       : safeDate(c.fecha_emision ?? c.fecha_envio, 5),
                        cliente     : c.cliente_denominacion ?? '—',
                        di          : tiDI,
                        nroDi       : c.cliente_numdoc ?? '—',
                        tc          : moneda,
                        noGrabado   : Number((c.anulado ? 0 : Number(c.no_gravadas || 0)).toFixed(2)),
                        bImponible  : Number((c.anulado ? 0 : base).toFixed(2)),
                        igv         : Number((c.anulado ? 0 : igv).toFixed(2)),
                        total       : Number((c.anulado ? 0 :totalN).toFixed(2)),
                        fEmisionOrig: '—',
                        serieOrig   : '—',
                        numeroOrig  : '—',
                        vendedor    : c.Vendedor || '—',
                    },
                })
            }

            filas.sort((a, b) => a.fechaOrden - b.fechaOrden)

            // ── Build workbook ──────────────────────────────────────────
            const workbook  = new ExcelJS.Workbook()
            workbook.creator = 'DROGUERÍA DIFAR'
            const ws = workbook.addWorksheet('Registro Ventas', {
                views: [{ state: 'frozen', ySplit: 3 }],
            })

            const numEmitCols = COLUMNS.filter(c => c.group === 'emit').length
            const numOrigCols = COLUMNS.filter(c => c.group === 'orig').length

            // Row 1: group headers
            ws.getRow(1).height = 18
            const emitStart = 1
            const emitEnd   = numEmitCols
            const origStart = numEmitCols + 1
            const origEnd   = numEmitCols + numOrigCols

            ws.mergeCells(1, emitStart, 1, emitEnd)
            const emitCell = ws.getCell(1, emitStart)
            emitCell.value = 'Comprobante Emitido'
            emitCell.font  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
            emitCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUBHEADER_EMIT } }
            emitCell.alignment = { horizontal: 'center', vertical: 'middle' }

            ws.mergeCells(1, origStart, 1, origEnd)
            const origCell = ws.getCell(1, origStart)
            origCell.value = 'Comprobante Original'
            origCell.font  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
            origCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUBHEADER_ORIG } }
            origCell.alignment = { horizontal: 'center', vertical: 'middle' }

            // Row 2: column headers
            ws.getRow(2).height = 18
            ws.columns = COLUMNS.map(col => ({
                key  : col.key,
                width: col.width,
            }))

            COLUMNS.forEach((col, idx) => {
                const cell = ws.getCell(2, idx + 1)
                cell.value = col.header
                cell.font  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 }
                cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_ARGB } }
                cell.alignment = { horizontal: 'center', vertical: 'middle' }
                cell.border = {
                    bottom: { style: 'thin', color: { argb: 'FF3A78D8' } },
                }
            })

            // Vendedor column: single header spanning both header rows
            const vendCol = origEnd + 1
            ws.mergeCells(1, vendCol, 2, vendCol)
            const vendCell = ws.getCell(1, vendCol)
            vendCell.value     = 'Vendedor'
            vendCell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 }
            vendCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_ARGB } }
            vendCell.alignment = { horizontal: 'center', vertical: 'middle' }

            // Track max content length for auto-width
            const maxLen: number[] = COLUMNS.map(c => c.header.length)

            // Data rows
            let totBase = 0, totNoGrabado = 0, totIGV = 0, totTotal = 0
            filas.forEach((fila, i) => {
                const dataRow = ws.addRow(fila.row)
                dataRow.height = 16

                const isOdd    = i % 2 !== 0
                const bgArgb   = fila.anulado ? 'FFFFEAEA' : isOdd ? ROW_ODD_ARGB : 'FFFFFFFF'
                const textArgb = fila.anulado ? 'FFC01010' : 'FF222222'

                COLUMNS.forEach((col, idx) => {
                    const cell = dataRow.getCell(idx + 1)
                    cell.font      = { size: 9, color: { argb: fila.negativo && idx >= 9 && idx <= 12 ? 'FFC81010' : textArgb } }
                    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } }
                    cell.alignment = {
                        horizontal: idx >= 9 && idx <= 12 ? 'right' : idx === 6 || idx === 8 ? 'center' : 'left',
                        vertical  : 'middle',
                    }
                    if (col.numFmt !== '@') cell.numFmt = col.numFmt

                    const cellStr = cell.value != null ? String(cell.value) : ''
                    if (cellStr.length > maxLen[idx]) maxLen[idx] = cellStr.length
                })

                totBase      += Number(fila.row.bImponible) || 0
                totNoGrabado += Number(fila.row.noGrabado)  || 0
                totIGV       += Number(fila.row.igv)        || 0
                totTotal     += Number(fila.row.total)      || 0
            })

            // Totals row
            const totRow = ws.addRow({
                fEmision  : 'TOTALES',
                noGrabado : Number(totNoGrabado.toFixed(2)),
                bImponible: Number(totBase.toFixed(2)),
                igv       : Number(totIGV.toFixed(2)),
                total     : Number((totBase + totNoGrabado + totIGV).toFixed(2)),
            })
            totRow.height = 20
            COLUMNS.forEach((col, idx) => {
                const cell = totRow.getCell(idx + 1)
                cell.font  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 }
                cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_ARGB } }
                cell.alignment = {
                    horizontal: idx >= 9 && idx <= 12 ? 'right' : idx === 0 ? 'left' : 'center',
                    vertical  : 'middle',
                }
                if (col.numFmt !== '@') cell.numFmt = col.numFmt
                cell.border = {
                    top: { style: 'medium', color: { argb: 'FF3A78D8' } },
                }
            })

            // Apply reactive column widths based on content
            ws.columns.forEach((wsCol, idx) => {
                const contentWidth = maxLen[idx] + 2
                const minWidth     = COLUMNS[idx].width
                wsCol.width = Math.max(contentWidth, minWidth)
            })

            // Download
            const buffer = await workbook.xlsx.writeBuffer()
            const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            const link   = document.createElement('a')
            link.href    = URL.createObjectURL(blob)
            link.download = `registro-comprobantes-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
            link.click()
            URL.revokeObjectURL(link.href)

        } catch (error) {
            console.error('Error al generar Excel:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="outline"
            disabled={loading}
            onClick={exportExcel}
            className="flex items-center gap-2"
        >
            {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <FileSpreadsheet className="h-4 w-4" />
            }
            {loading ? 'Generando...' : 'Exportar Excel'}
        </Button>
    )
}
