'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Loader2 } from 'lucide-react'
import ExcelJS from 'exceljs'
import { toast } from '@/app/hooks/useToast'
import { SaldoProvGrupo } from '@/app/types/saldo-proveedores-types'
import { esSolesProv, fmtFecha } from '@/app/services/reportes/SaldoProveedoresService'

interface Props {
    grupos:            SaldoProvGrupo[]
    fechaCorte:        string
    excluirDuplicados: boolean
    disabled?:         boolean
}

/** Excel del saldo de proveedores: una fila por documento, con el proveedor en cada fila. */
export const ExportSaldoProveedoresExcel: React.FC<Props> = ({ grupos, fechaCorte, excluirDuplicados, disabled }) => {
    const [cargando, setCargando] = useState(false)

    const exportar = async () => {
        if (!grupos.length) {
            toast({ title: 'Sin datos', description: 'No hay documentos para exportar.', variant: 'warning' })
            return
        }
        setCargando(true)
        try {
            const wb = new ExcelJS.Workbook()
            const ws = wb.addWorksheet('Saldo Proveedores')
            ws.addRow(['SALDO PROVEEDORES']).font = { bold: true, size: 14 }
            ws.addRow([`Fecha de corte: ${fmtFecha(fechaCorte)}`, excluirDuplicados ? 'Sin movimientos duplicados' : 'Igual que Access (incluye duplicados)'])
            ws.addRow([])
            const cab = ws.addRow(['RUC', 'Proveedor', 'F. Vcto', 'F. Emisión', 'Doc.', 'Serie', 'Número', 'M', 'Provisión', 'Amortiz.', 'Saldo S/.', 'Saldo US$', 'Días vencido'])
            cab.font = { bold: true, color: { argb: 'FFFFFFFF' } }
            cab.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A66CC' } } })
            let totS = 0, totD = 0
            for (const g of grupos) {
                for (const d of g.documentos) {
                    const soles = esSolesProv(d)
                    const r = ws.addRow([
                        g.ruc, g.nombre, fmtFecha(d.FechaVcto), fmtFecha(d.FechaEmision), d.Documento, d.Serie, String(d.Numero), d.Moneda,
                        Number(d.Provision), Number(d.Amortizacion), soles ? Number(d.Saldo) : null, soles ? null : Number(d.Saldo),
                        d.DiasVencido ?? null,
                    ])
                    if (Number(d.Saldo) < 0) r.font = { color: { argb: 'FFC00000' } }
                }
                const t = ws.addRow(['', `Total ${g.nombre}`, '', '', '', '', '', '', null, null, g.soles, g.dolares])
                t.font = { bold: true }
                totS += g.soles; totD += g.dolares
            }
            const tg = ws.addRow(['', 'TOTAL GENERAL', '', '', '', '', '', '', null, null, totS, totD])
            tg.font = { bold: true }
            ;[14, 45, 11, 11, 7, 7, 11, 5, 13, 13, 13, 13, 12].forEach((w, i) => { ws.getColumn(i + 1).width = w })
            ;[9, 10, 11, 12].forEach(c => { ws.getColumn(c).numFmt = '#,##0.00' })

            const buf = await wb.xlsx.writeBuffer()
            const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
            const a = document.createElement('a')
            a.href = url
            a.download = `Saldo_Proveedores_${fechaCorte}.xlsx`
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
        <Button variant="outline" className="w-full sm:w-auto" onClick={exportar} disabled={disabled || cargando}>
            {cargando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />} Excel
        </Button>
    )
}
