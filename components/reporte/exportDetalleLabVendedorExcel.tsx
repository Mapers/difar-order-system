'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { FileSpreadsheet, Loader2 } from 'lucide-react'
import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import { toast } from "@/app/hooks/useToast"
import {
    DetalleItem,
    formatDocumento,
    tipoDocLabel,
    formatFechaEmision
} from "@/components/reporte/detalleLabVendedorShared"

interface ProductoAgrupado {
    Codigo_Art:    string
    NombreItem:    string
    AbrevUnidMed:  string
    TotalCantidad: number
    TotalVentas:   number
}

interface ExportExcelProps {
    data:         any
    viewMode:     'laboratorios' | 'productos'
    productData?: ProductoAgrupado[]
    disabled?:    boolean
}

// Misma paleta que app/dashboard/comprobantes/ExcelExportButton.tsx
const HEADER_ARGB  = 'FF163161'
const ROW_ODD_ARGB = 'FFF2F4F8'
const TOTAL_ARGB   = 'FF163161'
const BORDER_ARGB  = 'FF3A78D8'
const TEXT_ARGB    = 'FF222222'
// Propio de esta vista: el detalle es jerárquico y necesita separar clientes,
// algo que el registro plano de Comprobantes no tiene.
const CLIENTE_ARGB = 'FFE8EDF5'

type ColDef = {
    header: string
    width:  number
    numFmt: string
    align:  'left' | 'right' | 'center'
}

const COLS_CLIENTE: ColDef[] = [
    { header: 'Cód. Art',    width: 12, numFmt: '@',        align: 'left'   },
    { header: 'Descripción', width: 50, numFmt: '@',        align: 'left'   },
    { header: 'Cant',        width:  8, numFmt: '#,##0',    align: 'right'  },
    { header: 'U.M.',        width:  8, numFmt: '@',        align: 'center' },
    { header: 'Tipo',        width:  8, numFmt: '@',        align: 'center' },
    { header: 'Documento',   width: 18, numFmt: '@',        align: 'left'   },
    { header: 'F. Emisión',  width: 13, numFmt: '@',        align: 'center' },
    { header: 'Total S/.',   width: 13, numFmt: '#,##0.00', align: 'right'  },
]

const COLS_PRODUCTO: ColDef[] = [
    { header: 'Cód. Art',    width: 12, numFmt: '@',        align: 'left'   },
    { header: 'Descripción', width: 55, numFmt: '@',        align: 'left'   },
    { header: 'U.M.',        width:  8, numFmt: '@',        align: 'center' },
    { header: 'Cant. Total', width: 12, numFmt: '#,##0',    align: 'right'  },
    { header: 'Total S/.',   width: 13, numFmt: '#,##0.00', align: 'right'  },
]

export const ExportDetalleLabVendedorExcel: React.FC<ExportExcelProps> = ({
    data,
    viewMode,
    productData = [],
    disabled = false
}) => {
    const [loading, setLoading] = useState(false)

    const exportExcel = async () => {
        if (loading || !data || data.length === 0) return
        setLoading(true)

        try {
            // Mismo alcance que el PDF hermano: primer vendedor, primer laboratorio.
            const vendData = data[0]
            const labData  = vendData.Laboratorios[0]

            const esCliente = viewMode === 'laboratorios'
            const COLUMNS   = esCliente ? COLS_CLIENTE : COLS_PRODUCTO
            const lastCol   = COLUMNS.length

            const workbook = new ExcelJS.Workbook()
            workbook.creator = 'DROGUERÍA DIFAR'
            const ws = workbook.addWorksheet(esCliente ? 'Detalle por Cliente' : 'Resumen por Productos')

            // Ancho: arranca en el largo del header y crece con el contenido,
            // igual que el maxLen de ExcelExportButton.
            const maxLen: number[] = COLUMNS.map(c => c.header.length)
            const track = (idx: number, v: any) => {
                const s = v != null ? String(v) : ''
                if (s.length > maxLen[idx]) maxLen[idx] = s.length
            }

            // ── Título y subtítulo ──────────────────────────────
            ws.mergeCells(1, 1, 1, lastCol)
            const titleCell = ws.getCell(1, 1)
            titleCell.value = esCliente
                ? 'Ventas por Vendedor — Detalle por Laboratorio'
                : 'Ventas por Vendedor — Resumen por Productos'
            titleCell.font      = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
            titleCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_ARGB } }
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
            ws.getRow(1).height = 22

            ws.mergeCells(2, 1, 2, lastCol)
            const subCell = ws.getCell(2, 1)
            subCell.value     = `${labData.Laboratorio}  ·  ${vendData.Vendedor}  ·  ${vendData.Mes} ${vendData.Año}`
            subCell.font      = { bold: true, size: 9, color: { argb: TEXT_ARGB } }
            subCell.alignment = { horizontal: 'center', vertical: 'middle' }
            ws.getRow(2).height = 16

            // ── Cabecera de columnas ────────────────────────────
            const HDR = 4
            COLUMNS.forEach((col, idx) => {
                const cell = ws.getCell(HDR, idx + 1)
                cell.value = col.header
                cell.font  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 }
                cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_ARGB } }
                cell.alignment = { horizontal: 'center', vertical: 'middle' }
                cell.border = { bottom: { style: 'thin', color: { argb: BORDER_ARGB } } }
            })
            ws.getRow(HDR).height = 16
            ws.views = [{ state: 'frozen', ySplit: HDR }]

            let r = HDR + 1
            let zebra = 0

            const writeDataRow = (values: any[]) => {
                const row = ws.getRow(r)
                row.height = 16
                const bg = zebra % 2 !== 0 ? ROW_ODD_ARGB : 'FFFFFFFF'
                COLUMNS.forEach((col, idx) => {
                    const cell = row.getCell(idx + 1)
                    cell.value = values[idx]
                    cell.font  = { size: 9, color: { argb: TEXT_ARGB } }
                    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
                    cell.alignment = { horizontal: col.align, vertical: 'middle' }
                    if (col.numFmt !== '@') cell.numFmt = col.numFmt
                    track(idx, values[idx])
                })
                r++
                zebra++
            }

            if (esCliente) {
                for (const cli of labData.Clientes) {
                    // Banda de cliente: agrupa sus ítems y reinicia la zebra.
                    ws.mergeCells(r, 1, r, lastCol)
                    const cCell = ws.getCell(r, 1)
                    cCell.value     = `${cli.Codigo}   ${cli.Nombre}${cli.NombreComercial ? '  ·  ' + cli.NombreComercial : ''}`
                    cCell.font      = { bold: true, size: 9, color: { argb: TEXT_ARGB } }
                    cCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: CLIENTE_ARGB } }
                    cCell.alignment = { horizontal: 'left', vertical: 'middle' }
                    ws.getRow(r).height = 16
                    r++
                    zebra = 0

                    for (const item of cli.Items as DetalleItem[]) {
                        writeDataRow([
                            item.Codigo_Art,
                            item.NombreItem,
                            Number(item.Cantidad_Sal),
                            item.AbrevUnidMed,
                            tipoDocLabel(item.Codigo_Doc),
                            formatDocumento(item),
                            formatFechaEmision(item),
                            Number(item.SumaDeVta_Tot),
                        ])
                    }

                    // Total del cliente
                    const tRow = ws.getRow(r)
                    tRow.height = 16
                    COLUMNS.forEach((col, idx) => {
                        const cell = tRow.getCell(idx + 1)
                        if (idx === lastCol - 2) cell.value = 'Total Cliente'
                        if (idx === lastCol - 1) {
                            cell.value  = Number(cli.TotalCliente)
                            cell.numFmt = '#,##0.00'
                        }
                        cell.font      = { bold: true, size: 9, color: { argb: TEXT_ARGB } }
                        cell.alignment = { horizontal: 'right', vertical: 'middle' }
                        cell.border    = { top: { style: 'thin', color: { argb: BORDER_ARGB } } }
                    })
                    r += 2 // total + línea en blanco
                }
            } else {
                for (const prod of productData) {
                    writeDataRow([
                        prod.Codigo_Art,
                        prod.NombreItem,
                        prod.AbrevUnidMed,
                        Number(prod.TotalCantidad),
                        Number(prod.TotalVentas),
                    ])
                }
            }

            // ── Totales ─────────────────────────────────────────
            const mkTotal = (label: string, value: number) => {
                const row = ws.getRow(r)
                row.height = 20
                COLUMNS.forEach((_, idx) => {
                    const cell = row.getCell(idx + 1)
                    if (idx === 0) cell.value = label
                    if (idx === lastCol - 1) {
                        cell.value  = Number(value)
                        cell.numFmt = '#,##0.00'
                    }
                    cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 }
                    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_ARGB } }
                    cell.alignment = { horizontal: idx === 0 ? 'left' : 'right', vertical: 'middle' }
                })
                r++
            }

            if (esCliente) mkTotal('TOTAL LÍNEA', Number(labData.TotalLinea))
            mkTotal('TOTAL VENDEDOR', Number(vendData.TotalVendedor))

            // Ancho final, acotado como en ExcelExportButton
            COLUMNS.forEach((col, idx) => {
                ws.getColumn(idx + 1).width = Math.min(Math.max(col.width, maxLen[idx] + 2), 60)
            })

            // ── Descarga ────────────────────────────────────────
            const buffer = await workbook.xlsx.writeBuffer()
            const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            const link   = document.createElement('a')
            link.href    = URL.createObjectURL(blob)
            const slug   = esCliente ? 'detalle-cliente' : 'resumen-productos'
            link.download = `${slug}-${vendData.Codigo_Vend}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
            link.click()
            URL.revokeObjectURL(link.href)

        } catch (error) {
            console.error('Error al generar Excel:', error)
            toast({ title: "Error", description: "No se pudo generar el Excel", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="outline"
            disabled={disabled || loading}
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
