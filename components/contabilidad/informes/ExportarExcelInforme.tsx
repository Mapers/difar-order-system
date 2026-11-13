'use client'

import React, { useState } from 'react'
import ExcelJS from 'exceljs'
import { FileSpreadsheet, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/app/hooks/useToast'
import { ColumnaInforme, FilaInforme } from '@/app/types/informes-contables-types'
import { esNumerica, formatear, simboloCelda, simboloTotal, totales, valorDe } from './formato'

interface Props {
    titulo: string
    subtitulo: string
    nombreArchivo: string
    columnas: ColumnaInforme[]
    filas: FilaInforme[] | null
    moneda?: string
}

/** Excel genérico de cualquier informe: cabecera, una fila por registro y fila de totales. */
export function ExportarExcelInforme({ titulo, subtitulo, nombreArchivo, columnas, filas, moneda }: Props) {
    const [cargando, setCargando] = useState(false)

    const exportar = async () => {
        if (!filas?.length) {
            toast({ title: 'Sin datos', description: 'No hay filas para exportar.', variant: 'warning' })
            return
        }
        setCargando(true)
        try {
            const wb = new ExcelJS.Workbook()
            const ws = wb.addWorksheet(titulo.slice(0, 31))
            ws.addRow([titulo]).font = { bold: true, size: 14 }
            ws.addRow([subtitulo])
            ws.addRow([])
            const cab = ws.addRow(columnas.map(c => c.titulo))
            cab.font = { bold: true, color: { argb: 'FFFFFFFF' } }
            cab.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A66CC' } } })
            for (const f of filas) {
                const r = ws.addRow(columnas.map(c => esNumerica(c.tipo) ? Number(valorDe(c, f)) || 0 : formatear(c.tipo, valorDe(c, f))))
                columnas.forEach((c, i) => { const s = simboloCelda(c, f, moneda); if (s) r.getCell(i + 1).numFmt = `"${s}" #,##0.00` })
            }
            const t = totales(columnas, filas)
            const rt = ws.addRow(columnas.map((c, i) => i === 0 ? 'TOTAL' : c.total ? t[c.campo] : null))
            rt.font = { bold: true }
            columnas.forEach((c, i) => { const s = simboloTotal(c, filas, moneda); if (s) rt.getCell(i + 1).numFmt = `"${s}" #,##0.00` })
            columnas.forEach((c, i) => {
                const col = ws.getColumn(i + 1)
                col.width = c.movil === 'subtitulo' ? 42 : esNumerica(c.tipo) ? 14 : 12
                if (c.tipo === 'monto') col.numFmt = '#,##0.00'
                if (c.tipo === 'tc') col.numFmt = '0.000'
            })
            const buf = await wb.xlsx.writeBuffer()
            const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
            const a = document.createElement('a')
            a.href = url
            a.download = `${nombreArchivo}.xlsx`
            a.click()
            URL.revokeObjectURL(url)
        } catch (e) {
            console.error(e)
            toast({ title: 'Error', description: 'No se pudo generar el Excel.', variant: 'destructive' })
        } finally {
            setCargando(false)
        }
    }

    return (
        <Button variant="outline" className="w-full sm:w-auto" onClick={exportar} disabled={!filas?.length || cargando}>
            {cargando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />} Excel
        </Button>
    )
}
