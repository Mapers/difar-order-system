'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { StandardFonts, rgb } from 'pdf-lib'
import { cargarLogoPdf, dibujarCabeceraPdf, truncarPdf } from '@/components/reporte/pdfCabecera'
import { aclarar, crearPdfReporte, hexARgb, OpcionesPdfReporte } from '@/components/reporte/pdfOpciones'
import { PdfVistaPreviaDialog } from '@/components/reporte/PdfVistaPreviaDialog'
import { toast } from '@/app/hooks/useToast'
import { SaldoProvGrupo } from '@/app/types/saldo-proveedores-types'
import { esSolesProv, fmtFecha, fmtMonto } from '@/app/services/reportes/SaldoProveedoresService'

interface Props {
    grupos:            SaldoProvGrupo[]
    fechaCorte:        string
    excluirDuplicados: boolean
    disabled?:         boolean
}

/**
 * PDF con el formato del reporte Access "Saldo Proveedores": por proveedor (RUC y nombre),
 * columnas F. Vcto, F. Emisión, Doc., Serie, Número, M, Provisión, Amortiz., Saldo S/. y Saldo US$,
 * total por proveedor y total general.
 */
export const ExportSaldoProveedoresPdf: React.FC<Props> = ({ grupos, fechaCorte, excluirDuplicados, disabled }) => {
    const [abierto, setAbierto] = useState(false)
    const DEFECTO: OpcionesPdfReporte = { titulo: 'SALDO PROVEEDORES', nota: '', color: '#1a66cc', tamanoLetra: 'normal' }

    const abrir = () => {
        if (!grupos.length) {
            toast({ title: 'Sin datos', description: 'No hay documentos para exportar.', variant: 'warning' })
            return
        }
        setAbierto(true)
    }

    const generar = async (op: OpcionesPdfReporte): Promise<Uint8Array> => {
        const principal = hexARgb(op.color)
        const pdfDoc = await crearPdfReporte(op.tamanoLetra)
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        const W = 595.28, H = 841.89, M = 36, ancho = W - M * 2
        const logo = await cargarLogoPdf(pdfDoc)
        let page = pdfDoc.addPage([W, H])
        let y = H - M

        const nota = [
            `Fecha de corte: ${fmtFecha(fechaCorte)}`,
            excluirDuplicados ? 'Sin movimientos duplicados' : 'Igual que Access (incluye movimientos duplicados)',
            op.nota.trim(),
        ].filter(Boolean).join('   ·   ')

        const cabecera = () => {
            y = dibujarCabeceraPdf({
                page, font, boldFont: bold, logo, pageWidth: W, pageHeight: H, margin: M,
                subtitulo: op.titulo, filtros: nota,
                infoDerechaSec: `Impreso: ${new Date().toLocaleDateString('es-PE')}`,
            })
        }

        // F. Vcto, F. Emisión, Doc., Serie, Número, M, Provisión, Amortiz., Saldo S/., Saldo US$
        const cols = [52, 52, 36, 34, 56, 22, 66, 66, 70, 69]
        const titulos = ['F. Vcto', 'F. Emisión', 'Doc.', 'Serie', 'Número', 'M', 'Provisión', 'Amortiz.', 'Saldo S/.', 'Saldo US$']
        const derecha = (i: number) => i >= 6

        const fila = (valores: string[], f: any, size: number, color = rgb(0, 0, 0)) => {
            let x = M + 4
            valores.forEach((v, i) => {
                const t = truncarPdf(v, cols[i] - 6, size, f)
                const tx = derecha(i) ? x + cols[i] - f.widthOfTextAtSize(t, size) - 4 : i === 5 ? x + cols[i] / 2 - f.widthOfTextAtSize(t, size) / 2 : x
                page.drawText(t, { x: tx, y, size, font: f, color })
                x += cols[i]
            })
        }

        const encabezadoTabla = () => {
            page.drawRectangle({ x: M, y: y - 4, width: ancho, height: 14, color: rgb(0.9, 0.9, 0.9) })
            fila(titulos, bold, 7)
            y -= 15
        }

        let franjaActual: (() => void) | null = null
        const salto = (necesario: number) => {
            if (y - necesario < M) {
                page = pdfDoc.addPage([W, H])
                cabecera()
                franjaActual?.()
            }
        }

        cabecera()
        let totS = 0, totD = 0

        for (const g of grupos) {
            franjaActual = null
            salto(70)
            const franja = (cont: boolean) => {
                page.drawRectangle({ x: M, y: y - 12, width: ancho, height: 17, color: aclarar(principal, 0.88), borderColor: aclarar(principal, 0.65), borderWidth: 0.8 })
                page.drawText(truncarPdf(`${g.ruc}   ${g.nombre}${cont ? '  (continuación)' : ''}`, ancho - 10, 8.5, bold), { x: M + 5, y: y - 7, size: 8.5, font: bold, color: principal })
                y -= 24
                encabezadoTabla()
            }
            franja(false)
            franjaActual = () => franja(true)

            for (const d of g.documentos) {
                salto(14)
                const soles = esSolesProv(d)
                const neg = Number(d.Saldo) < 0
                fila([
                    fmtFecha(d.FechaVcto), fmtFecha(d.FechaEmision), d.Documento, d.Serie, String(d.Numero), d.Moneda,
                    fmtMonto(d.Provision), fmtMonto(d.Amortizacion),
                    soles ? fmtMonto(d.Saldo) : '', soles ? '' : fmtMonto(d.Saldo),
                ], font, 7, neg ? rgb(0.75, 0.1, 0.1) : rgb(0, 0, 0))
                page.drawLine({ start: { x: M, y: y - 4 }, end: { x: W - M, y: y - 4 }, thickness: 0.4, color: rgb(0.85, 0.85, 0.85) })
                y -= 13
            }
            franjaActual = null
            salto(18)
            const xS = M + 4 + cols.slice(0, 8).reduce((a, b) => a + b, 0)
            page.drawText(`Total ${truncarPdf(g.nombre, 250, 7.5, bold)}`, { x: M + 4, y, size: 7.5, font: bold })
            const tS = fmtMonto(g.soles), tD = fmtMonto(g.dolares)
            page.drawText(tS, { x: xS + cols[8] - bold.widthOfTextAtSize(tS, 7.5) - 4, y, size: 7.5, font: bold })
            page.drawText(tD, { x: xS + cols[8] + cols[9] - bold.widthOfTextAtSize(tD, 7.5) - 4, y, size: 7.5, font: bold })
            y -= 20
            totS += g.soles; totD += g.dolares
        }

        salto(30)
        page.drawRectangle({ x: M, y: y - 16, width: ancho, height: 22, color: principal })
        page.drawText(`TOTAL GENERAL (${grupos.length} proveedor${grupos.length !== 1 ? 'es' : ''})`, { x: M + 8, y: y - 8, size: 9, font: bold, color: rgb(1, 1, 1) })
        const g1 = `S/ ${fmtMonto(totS)}`, g2 = `US$ ${fmtMonto(totD)}`
        page.drawText(g1, { x: W - M - 150 - bold.widthOfTextAtSize(g1, 9), y: y - 8, size: 9, font: bold, color: rgb(1, 1, 1) })
        page.drawText(g2, { x: W - M - 8 - bold.widthOfTextAtSize(g2, 9), y: y - 8, size: 9, font: bold, color: rgb(1, 1, 1) })

        return pdfDoc.save()
    }

    return (
        <>
            <Button variant="outline" className="w-full sm:w-auto" onClick={abrir} disabled={disabled}>
                <Download className="mr-2 h-4 w-4" /> PDF
            </Button>
            <PdfVistaPreviaDialog
                abierto={abierto}
                onCerrar={() => setAbierto(false)}
                titulo="Saldo de documentos por pagar proveedor"
                defecto={DEFECTO}
                archivoDefecto={`Saldo_Proveedores_${fechaCorte}`}
                generar={generar}
            />
        </>
    )
}
