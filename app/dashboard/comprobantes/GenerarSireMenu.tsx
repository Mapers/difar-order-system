'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDown, ChevronDown, FileText, FileSpreadsheet, Loader2 } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { addHours, format, parseISO } from 'date-fns'
import ExcelJS from 'exceljs'
import { toast } from '@/app/hooks/useToast'
import { Comprobante } from '@/app/types/order/order-interface'
import { esExportableARegistroVentas } from '@/app/utils/sunat'

interface FiltersComprobantes {
    fechaDesde: string
    fechaHasta: string
}

interface GenerarSireMenuProps {
    /** Exactamente lo que se ve en la tabla: no se vuelve a consultar nada. */
    data: Comprobante[]
    filters?: FiltersComprobantes
}

const RUC_EMPRESA     = '20481321892'
const ENTIDAD_EMPRESA = 'DISTRIBUIDORA E IMPORTADORA FARMACEUTICA S.A.C.'

/** Nombres de la fila 1 del modelo, en su orden exacto. */
const CABECERA_XLSX = [
    '', 'RUC', 'ENTIDAD', 'PERIODO', '',
    'Fecha de emisión', 'Fecha Vcto/Pago', 'Tipo CP/Doc.', 'Serie del CDP',
    'Nro CP o Doc. Nro Inicial (Rango)', 'Nro Final (Rango)',
    'Tipo Doc Identidad', 'Nro Doc Identidad', 'Apellidos Nombres/ Razón Social',
    'Valor Facturado Exportación', 'BI Gravada', 'Dscto BI', 'IGV / IPM',
    'Dscto IGV / IPM', 'Mto Exonerado', 'Mto Inafecto', 'BI Grav IVAP', 'IVAP',
    'ICBPER', 'Otros Tributos', 'Total CP', 'Moneda', 'Tipo Cambio',
    'Fecha Emisión Doc Modificado', 'Tipo CP Modificado', 'Serie CP Modificado',
    'Nro CP Modificado', 'ID Proyecto Operadores Atribución', 'Tipo de Nota',
    'Est. Comp', 'Valor FOB Embarcado', 'Valor OP Gratuitas', 'Tipo Operación',
    'DAM / CP', 'CAR SUNAT', 'Column1',
]

/** Fila 2 del modelo: el número de campo oficial. Vacío donde no aplica. */
const NUMEROS_CAMPO = [
    '', '1', '2', '3', '',
    '4', '5', '6', '', '7', '8',
    '9', '', '10',
    '11', '12', '', '13', '14', '15', '', '16', '17', '18', '', '19',
    '20', '21', '', '22', '23', '24', '', '25', '26', '27', '28', '29', '30', '31', '32',
]

const n2 = (v: any) => {
    const x = Number(v)
    return isNaN(x) ? 0 : Number(x.toFixed(2))
}

/**
 * El backend serializa las fechas como si fueran UTC, así que en Perú (UTC-5)
 * el navegador las corre 5 horas atrás y una fecha sin hora —fecha_emision es
 * un DATE— cae al día anterior. Contrastado contra la propuesta del SIRE de
 * julio: 296 de 307 comprobantes salían un día antes.
 *
 * El +5 es el mismo desfase que ya compensan los exports de PDF y Excel de
 * esta pantalla con `safeDate(c.fecha_envio, 5)`.
 */
const aFechaLocal = (v: string | null | undefined): Date | null => {
    if (!v) return null
    try {
        const d = addHours(parseISO(String(v)), 5)
        return isNaN(d.getTime()) ? null : d
    } catch { return null }
}

/** dd/mm/yyyy, que es como van las fechas en el TXT. */
const fechaTxt = (v: string | null | undefined): string => {
    const d = aFechaLocal(v)
    return d ? format(d, 'dd/MM/yyyy') : ''
}

/** Serial de Excel: los días desde el 30/12/1899, como en el modelo. */
const fechaSerial = (v: string | null | undefined): number | '' => {
    const d = aFechaLocal(v)
    if (!d) return ''
    return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(1899, 11, 30)) / 86400000)
}

/** 6 = RUC, 1 = DNI, 0 = sin documento. */
const tipoDocIdentidad = (numDoc: string | null | undefined): string => {
    const d = String(numDoc || '').trim()
    if (d.length === 11) return '6'
    if (d.length === 8)  return '1'
    return d ? '0' : '0'
}

/** El tipo del comprobante viene como número en el payload: 1, 3, 7. */
const tipoCP = (t: any): string => String(t ?? '').padStart(2, '0')

const esNotaCredito = (c: Comprobante) => Number(c.tipo_comprobante) === 7

/**
 * Una fila del Registro de Ventas, en el orden del TXT (41 campos).
 * El XLSX usa los mismos valores, pero mueve el CUO al inicio y agrega una
 * columna vacía después del periodo, tal como el modelo.
 */
function armarFila(c: Comprobante, cuo: number, periodo: string) {
    const esNC = esNotaCredito(c)

    // Mismo criterio que los exports de PDF y Excel de esta misma pantalla:
    // el SP ya devuelve las notas de crédito en negativo, así que el importe va
    // en las columnas normales —base, IGV, total— y no en las de descuento.
    // Los anulados exportan en cero, igual que hoy.
    const anulado   = Boolean(c.anulado)
    const biGravada = anulado ? 0 : n2(c.total_gravada)
    const igvIpm    = anulado ? 0 : n2(c.total_igv)
    const total     = anulado ? 0 : n2(c.total)
    const exonerado = anulado ? 0 : n2((c as any).total_exonerada)
    const inafecto  = anulado ? 0 : n2((c as any).total_inafecta)
    const dsctoBI   = 0
    const dsctoIGV  = 0

    return {
        ruc:            RUC_EMPRESA,
        entidad:        ENTIDAD_EMPRESA,
        periodo,
        cuo:            String(cuo),
        fechaEmision:   c.fecha_emision ?? c.fecha_envio,
        fechaVcto:      '',
        tipoCP:         tipoCP(c.tipo_comprobante),
        serie:          c.serie ?? '',
        numero:         c.numero ?? '',
        numeroFinal:    '',
        tipoDocIdent:   tipoDocIdentidad(c.cliente_numdoc),
        nroDocIdent:    c.cliente_numdoc ?? '',
        cliente:        c.cliente_denominacion ?? '',
        valorExport:    0,
        biGravada,
        dsctoBI,
        igvIpm,
        dsctoIGV,
        exonerado,
        inafecto,
        isc:            0,
        biIvap:         0,
        ivap:           0,
        icbper:         0,
        otrosTributos:  0,
        total,
        // El payload trae la moneda como código numérico: 1 = soles, 2 = dólares.
        moneda:         Number(c.moneda) === 2 ? 'USD' : 'PEN',
        tipoCambio:     '',
        fechaDocMod:    esNC ? (c.ref_fecha ?? '') : '',
        tipoCPMod:      esNC && c.ref_serie ? '01' : '',
        serieCPMod:     esNC ? (c.ref_serie ?? '') : '',
        nroCPMod:       esNC ? (c.ref_numero ?? '') : '',
        idProyecto:     '',
        tipoNota:       esNC ? String((c as any).motivo_sunat ?? '') : '',
        estComp:        '1',
        valorFob:       0,
        valorGratuitas: 0,
        tipoOperacion:  '101',
        dam:            '',
        carSunat:       '',
    }
}

export function GenerarSireMenu({ data = [], filters }: GenerarSireMenuProps) {
    const [loadingTxt, setLoadingTxt] = useState(false)
    const [loadingXls, setLoadingXls] = useState(false)

    /** AAAAMM desde el filtro de la pantalla; si no hay, el mes en curso. */
    const periodo = (() => {
        if (filters?.fechaDesde) {
            const [a, m] = filters.fechaDesde.split('-')
            if (a && m) return `${a}${m}`
        }
        const d = new Date()
        return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
    })()

    // Mismo filtro que usan los exports de esta pantalla: deja fuera los
    // rechazados por SUNAT y las filas de "correlativo no utilizado", que no
    // tienen idSunat y no son comprobantes.
    const exportables = data.filter(esExportableARegistroVentas)

    const filas = () => exportables.map((c, i) => armarFila(c, i + 1, periodo))

    const sinDatos = () => {
        if (exportables.length === 0) {
            toast({
                title: 'Sin datos',
                description: 'No hay comprobantes válidos en la tabla para generar.',
                variant: 'warning',
            })
            return true
        }
        return false
    }

    const descargar = (contenido: Blob, nombre: string) => {
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(contenido)
        link.download = nombre
        link.click()
        window.URL.revokeObjectURL(link.href)
    }

    const generarTxt = () => {
        if (sinDatos() || loadingTxt) return
        setLoadingTxt(true)
        try {
            const lineas = filas().map(f => [
                f.ruc, f.entidad, f.periodo, f.cuo,
                fechaTxt(f.fechaEmision), f.fechaVcto,
                f.tipoCP, f.serie, f.numero, f.numeroFinal,
                f.tipoDocIdent, f.nroDocIdent, f.cliente,
                f.valorExport, f.biGravada, f.dsctoBI, f.igvIpm, f.dsctoIGV,
                f.exonerado, f.inafecto, f.isc, f.biIvap, f.ivap, f.icbper,
                f.otrosTributos, f.total,
                f.moneda, f.tipoCambio,
                fechaTxt(f.fechaDocMod), f.tipoCPMod, f.serieCPMod, f.nroCPMod,
                f.idProyecto, f.tipoNota, f.estComp,
                f.valorFob, f.valorGratuitas, f.tipoOperacion,
                f.dam, f.carSunat, '',
            ].join('|'))

            // CRLF: es el salto de línea que espera el PLE.
            const contenido = lineas.join('\r\n') + '\r\n'
            // LE + RUC + AAAAMM + 00 + código del Registro de Ventas + fijos.
            const nombre = `LE${RUC_EMPRESA}${periodo}00140400021112.txt`
            descargar(new Blob([contenido], { type: 'text/plain;charset=utf-8' }), nombre)
        } catch (error) {
            console.error('Error al generar el TXT:', error)
            toast({ title: 'Error', description: 'No se pudo generar el archivo TXT.', variant: 'destructive' })
        } finally {
            setLoadingTxt(false)
        }
    }

    const generarXlsx = async () => {
        if (sinDatos() || loadingXls) return
        setLoadingXls(true)
        try {
            const wb = new ExcelJS.Workbook()
            wb.creator = ENTIDAD_EMPRESA
            const ws = wb.addWorksheet('Registro de Ventas')

            ws.addRow(CABECERA_XLSX)
            ws.addRow(NUMEROS_CAMPO)
            ws.getRow(1).font = { bold: true }
            ws.getRow(2).font = { bold: true, size: 9 }

            for (const f of filas()) {
                ws.addRow([
                    Number(f.cuo), f.ruc, f.entidad, f.periodo, '',
                    fechaSerial(f.fechaEmision), f.fechaVcto,
                    // Sin el cero a la izquierda: el modelo trae 1 y 7, no 01 ni 07.
                    Number(f.tipoCP), f.serie, f.numero, f.numeroFinal,
                    Number(f.tipoDocIdent), f.nroDocIdent, f.cliente,
                    f.valorExport, f.biGravada, f.dsctoBI, f.igvIpm, f.dsctoIGV,
                    f.exonerado, f.inafecto, f.isc, f.biIvap, f.ivap, f.icbper,
                    f.otrosTributos, f.total,
                    f.moneda, f.tipoCambio,
                    fechaSerial(f.fechaDocMod), f.tipoCPMod, f.serieCPMod, f.nroCPMod,
                    f.idProyecto, f.tipoNota, f.estComp,
                    f.valorFob, f.valorGratuitas,
                    // El modelo deja Tipo Operación vacío en el Excel, aunque en
                    // el TXT vaya 101. Se respeta tal cual.
                    '',
                    f.dam, f.carSunat, '',
                ])
            }

            ws.columns.forEach(col => { col.width = 18 })

            const buffer = await wb.xlsx.writeBuffer()
            descargar(
                new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
                `Archivo_de_Reemplazo_Registro_de_Ventas_${periodo}.xlsx`
            )
        } catch (error) {
            console.error('Error al generar el XLSX:', error)
            toast({ title: 'Error', description: 'No se pudo generar el archivo Excel.', variant: 'destructive' })
        } finally {
            setLoadingXls(false)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                    <FileDown className="h-4 w-4" />
                    Exportar SIRE
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Registro de Ventas — SUNAT
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onSelect={(e: Event) => { e.preventDefault(); generarTxt() }}
                    disabled={loadingTxt}
                    className="cursor-pointer gap-2"
                >
                    {loadingTxt ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    {loadingTxt ? 'Generando TXT...' : 'Archivo TXT (PLE)'}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onSelect={(e: Event) => { e.preventDefault(); generarXlsx() }}
                    disabled={loadingXls}
                    className="cursor-pointer gap-2"
                >
                    {loadingXls ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                    {loadingXls ? 'Generando Excel...' : 'Archivo de Reemplazo (XLSX)'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
