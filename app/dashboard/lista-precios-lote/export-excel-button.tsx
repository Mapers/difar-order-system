'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Loader2 } from 'lucide-react'
import ExcelJS from 'exceljs'
import { PriceService } from '@/app/services/price/PriceService'
import { etiquetaPeriodo } from '@/app/dashboard/lista-precios-lote/hooks/useVentasTresMeses'
import moment from 'moment'

const HEADER_ARGB  = 'FF163161'
const LAB_ARGB     = 'FF1E4A8A'
const ROW_ODD_ARGB = 'FFF2F4F8'
const STOCK_ARGB   = 'FF1A56A0'
const BONIF_ARGB   = 'FF1A6B3A'
const ESCALA_ARGB  = 'FF1A3A8F'
const VENTAS_ARGB  = 'FF1A56A0'


const COLUMNS = [
    { header: 'LABORATORIO',     key: 'laboratorio',  width: 28, numFmt: '@' },
    { header: 'CÓDIGO',          key: 'codigo',        width: 10, numFmt: '@' },
    { header: 'DESCRIPCIÓN',     key: 'descripcion',   width: 38, numFmt: '@' },
    { header: 'PRESENTACIÓN',    key: 'presentacion',  width: 18, numFmt: '@' },
    { header: 'PRINCIPIO ACTIVO',key: 'principio',     width: 22, numFmt: '@' },
    { header: 'UM',              key: 'um',            width:  6, numFmt: '@' },
    { header: 'LOTES',           key: 'lotes',         width: 18, numFmt: '@' },
    { header: 'F. VENCIMIENTO',  key: 'vencimientos',  width: 14, numFmt: '@' },
    { header: 'STOCK',           key: 'stock',         width: 10, numFmt: '#,##0.00' },
    // Las tres columnas de mes reciben el nombre real del periodo al escribir la
    // cabecera; aca van con nombre generico porque COLUMNS es estatico.
    { header: 'VENTAS 3M',       key: 'ventas3m',      width: 11, numFmt: '#,##0.00' },
    { header: 'MES 1',           key: 'ventasM1',      width:  9, numFmt: '#,##0.00' },
    { header: 'MES 2',           key: 'ventasM2',      width:  9, numFmt: '#,##0.00' },
    { header: 'MES 3',           key: 'ventasM3',      width:  9, numFmt: '#,##0.00' },
    { header: 'P.CONTADO',       key: 'precioContado', width: 12, numFmt: '#,##0.00' },
    { header: 'P.CRÉDITO',       key: 'precioCredito', width: 12, numFmt: '#,##0.00' },
    { header: 'B.CONTADO',       key: 'bonifContado',  width: 12, numFmt: '#,##0.00' },
    { header: 'B.CRÉDITO',       key: 'bonifCredito',  width: 12, numFmt: '#,##0.00' },
] as const

/**
 * Lote y vencimiento van en columnas separadas, una línea por lote.
 * Se devuelven los dos strings con la misma cantidad de líneas para que
 * las celdas queden alineadas fila a fila dentro del producto.
 */
function parseLotes(raw: string): { lotes: string; vencimientos: string } {
    if (!raw) return { lotes: '', vencimientos: '' }

    const filas = raw.split(';').map(s => {
        const [lote, fecha] = s.split('|')
        const vcto = moment(fecha, 'YYYY-MM-DD')
        return {
            lote: lote ?? '',
            // Sin esto, un lote sin fecha imprimía "Invalid date".
            vcto: fecha && vcto.isValid() ? vcto.format('DD/MM/YYYY') : '',
        }
    })

    return {
        lotes:        filas.map(f => f.lote).join('\n'),
        vencimientos: filas.map(f => f.vcto).join('\n'),
    }
}

function parseBonificaciones(raw: string, prodDesc: string): string {
    if (!raw) return ''
    return raw.split(';').map((s, i) => {
        const [factor, , cantidad, mismoProduct, descArticuloBonif] = s.split('|')
        const dest = mismoProduct === 'S' ? prodDesc : descArticuloBonif
        return `${i + 1}. Compra ${factor} → lleva ${cantidad} de ${dest}`
    }).join('\n')
}

function parseEscalas(raw: string): string {
    if (!raw) return ''
    return raw.split(';').map((s, i) => {
        const [minimo, maximo, precio] = s.split('|')
        return `${i + 1}. De ${minimo} a ${maximo} → S/ ${Number(precio).toFixed(2)}`
    }).join('\n')
}

const ExportExcelButton = ({ payload, filters }: { payload: any; filters?: any }) => {
    const [loading, setLoading] = useState(false)

    const applyFilters = (items: any[]) => {
        let result = items
        if (filters?.excludeNoStock) result = result.filter(i => Number(i.kardex_saldoCant) > 0)
        const lowThreshold = Number(filters?.lowStockThreshold);
        if (lowThreshold > 0 && filters?.selectedLabsCount === 1) result = result.filter(i => Number(i.kardex_saldoCant) < lowThreshold)
        if (filters?.selectedPrinciple) result = result.filter(i => i.prod_principio === filters.selectedPrinciple)
        if (filters?.searchTerm) {
            const q = filters.searchTerm.toLowerCase()
            result = result.filter(i => i.prod_codigo?.toLowerCase().includes(q) || i.prod_descripcion?.toLowerCase().includes(q) || i.prod_principio?.toLowerCase().includes(q))
        }
        return result
    }

    const exportExcel = async () => {
        if (loading) return
        setLoading(true)

        try {
            const response = await PriceService.getPricesAll(payload)
            const data = applyFilters(response.data || [])

            // Endpoint aparte: si falla, el Excel sale con esas columnas en cero
            // en vez de perderse la exportacion entera.
            const mapaVentas = new Map<string, { meses: number[]; total_3m: number }>()
            let etiquetasMes: string[] = []
            try {
                const resVentas = await PriceService.getVentasTresMeses()
                const body = resVentas?.data ?? {}
                etiquetasMes = (body.periodos || []).map(etiquetaPeriodo)
                for (const fila of (body.data || [])) {
                    mapaVentas.set(String(fila.cod_articulo), {
                        meses: (fila.meses || []).map(Number),
                        total_3m: Number(fila.total_3m || 0),
                    })
                }
            } catch (e) {
                console.warn('No se pudieron cargar las ventas de 3 meses para el Excel:', e)
            }

            const workbook = new ExcelJS.Workbook()
            workbook.creator = 'DROGUERÍA DIFAR'

            const ws = workbook.addWorksheet('Lista de Precios', {
                views: [{ state: 'frozen', ySplit: 2 }],
            })

            // Row 1: title
            ws.mergeCells(1, 1, 1, COLUMNS.length)
            const titleCell = ws.getCell(1, 1)
            titleCell.value = `LISTA DE PRECIOS POR LOTE — DROGUERÍA DIFAR`
            titleCell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 }
            titleCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_ARGB } }
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
            ws.getRow(1).height = 22

            // Row 2: column headers
            ws.columns = COLUMNS.map(col => ({ key: col.key, width: col.width }))
            ws.getRow(2).height = 18
            const headerMes: Record<string, number> = { ventasM1: 0, ventasM2: 1, ventasM3: 2 }
            COLUMNS.forEach((col, idx) => {
                const cell = ws.getCell(2, idx + 1)
                const iMes = headerMes[col.key as string]
                cell.value = iMes !== undefined && etiquetasMes[iMes]
                    ? etiquetasMes[iMes].toUpperCase()
                    : col.header
                cell.font  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 }
                cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_ARGB } }
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
                cell.border = { bottom: { style: 'thin', color: { argb: 'FF3A78D8' } } }
            })

            const maxLen: number[] = COLUMNS.map(c => c.header.length)
            let currentLab = 0
            let rowIndex   = 0

            for (const item of data) {
                // Lab separator row
                if (item.laboratorio_id !== currentLab) {
                    currentLab = item.laboratorio_id
                    ws.mergeCells(ws.rowCount + 1, 1, ws.rowCount + 1, COLUMNS.length)
                    const labRow  = ws.lastRow!
                    const labCell = labRow.getCell(1)
                    labCell.value     = item.laboratorio_Descripcion?.toUpperCase()
                    labCell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 }
                    labCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: LAB_ARGB } }
                    labCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
                    labRow.height     = 16
                }

                const { lotes, vencimientos } = parseLotes(item.lotes_raw)

                const precioContado  = item.precio_contado  ? Number(item.precio_contado)  : null
                const precioCredito  = item.precio_credito  ? Number(item.precio_credito)  : null
                const bonifContado   = Number(item.precio_por_mayor) > 0 ? Number(item.precio_por_mayor) : null
                const bonifCredito   = Number(item.precio_por_menor) > 0 ? Number(item.precio_por_menor) : null

                const v = mapaVentas.get(String(item.prod_codigo))

                const dataRow = ws.addRow({
                    laboratorio  : item.laboratorio_Descripcion ?? '',
                    codigo       : item.prod_codigo ?? '',
                    descripcion  : item.prod_descripcion ?? '',
                    presentacion : item.prod_presentacion ?? '',
                    principio    : item.prod_principio ?? '',
                    um           : item.prod_medida ?? '',
                    lotes,
                    vencimientos,
                    stock        : Number(Number(item.kardex_saldoCant || 0).toFixed(2)),
                    ventas3m     : Number(v?.total_3m ?? 0),
                    ventasM1     : Number(v?.meses?.[0] ?? 0),
                    ventasM2     : Number(v?.meses?.[1] ?? 0),
                    ventasM3     : Number(v?.meses?.[2] ?? 0),
                    precioContado,
                    precioCredito,
                    bonifContado,
                    bonifCredito,
                })

                const isOdd  = rowIndex % 2 !== 0
                const bgArgb = isOdd ? ROW_ODD_ARGB : 'FFFFFFFF'
                dataRow.height = 16

                const lineCount = Math.max(lotes.split('\n').length, 1)
                if (lineCount > 1) dataRow.height = lineCount * 14

                COLUMNS.forEach((col, idx) => {
                    const cell = dataRow.getCell(idx + 1)
                    let textArgb = 'FF222222'

                    if (col.key === 'stock')         textArgb = STOCK_ARGB
                    if (col.key === 'ventas3m') textArgb = VENTAS_ARGB
                    if (col.key === 'bonifContado' || col.key === 'bonifCredito') textArgb = BONIF_ARGB

                    cell.font      = { size: 9, color: { argb: textArgb } }
                    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } }
                    cell.alignment = {
                        horizontal: ['stock','ventas3m','ventasM1','ventasM2','ventasM3','precioContado','precioCredito','bonifContado','bonifCredito'].includes(col.key)
                            ? 'right' : 'left',
                        vertical  : 'top',
                        wrapText  : true,
                    }
                    if (col.numFmt !== '@' && cell.value !== null) cell.numFmt = col.numFmt

                    const cellStr = cell.value != null ? String(cell.value) : ''
                    const firstLine = cellStr.split('\n')[0]
                    if (firstLine.length > maxLen[idx]) maxLen[idx] = firstLine.length
                })

                rowIndex++
            }

            // Barra dentro de la celda, nativa de Excel: la fila con mas ventas
            // llega al ancho completo y el resto se escala sola. El numero sigue
            // visible, la barra va detras. Se aplica al rango completo de datos;
            // las filas separadoras de laboratorio no tienen valor numerico aqui,
            // asi que la regla las ignora.
            const colVentas = ws.getColumn(COLUMNS.findIndex(c => c.key === 'ventas3m') + 1)
            if (ws.rowCount > 2) {
                ws.addConditionalFormatting({
                    ref: `${colVentas.letter}3:${colVentas.letter}${ws.rowCount}`,
                    rules: [{
                        type: 'dataBar',
                        priority: 1,
                        cfvo: [{ type: 'min' }, { type: 'max' }],
                        color: { argb: VENTAS_ARGB },
                    } as any],
                })
            }

            // Auto column widths
            ws.columns.forEach((wsCol, idx) => {
                const contentWidth = maxLen[idx] + 2
                const minWidth     = COLUMNS[idx].width
                wsCol.width = Math.max(contentWidth, minWidth)
            })

            const buffer = await workbook.xlsx.writeBuffer()
            const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            const link   = document.createElement('a')
            link.href    = URL.createObjectURL(blob)
            link.download = `lista-precios-lote-${new Date().toISOString().split('T')[0]}.xlsx`
            link.click()
            URL.revokeObjectURL(link.href)

        } catch (error) {
            console.error('Error al generar Excel:', error)
            alert('Ocurrió un error al generar el Excel.')
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

export default ExportExcelButton
