'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Loader2 } from 'lucide-react'
import ExcelJS from 'exceljs'
import { PriceService } from '@/app/services/price/PriceService'
import { etiquetaPeriodo } from '@/app/dashboard/lista-precios-lote/hooks/useVentasTresMeses'
import moment from 'moment'
import { datosPorAlmacen, DatosExport, nombreHojaValido } from '@/app/dashboard/lista-precios-lote/services/almacenesExport'
import { ExcelVistaPreviaDialog } from './ExcelVistaPreviaDialog'

const HEADER_DEFECTO_ARGB = 'FF163161'
const LAB_DEFECTO_ARGB    = 'FF1E4A8A'
const ROW_ODD_ARGB = 'FFF2F4F8'

/** Columnas que se pueden quitar desde la vista previa (el resto siempre va). */
export type GrupoColumnasExcel = 'presentacion' | 'principio' | 'anioVenc' | 'ventasMes' | 'bonif'

export interface OpcionesExcel {
    /** Color de la cabecera en hex; la franja de laboratorio usa uno más claro. */
    color:    string
    zebra:    boolean
    columnas: Record<GrupoColumnasExcel, boolean>
}

export const OPCIONES_EXCEL_DEFECTO: OpcionesExcel = {
    color: '#163161',
    zebra: true,
    columnas: { presentacion: true, principio: true, anioVenc: true, ventasMes: true, bonif: true },
}

const GRUPO_DE_COLUMNA: Record<string, GrupoColumnasExcel> = {
    presentacion: 'presentacion', principio: 'principio', anioVenc: 'anioVenc',
    ventasM1: 'ventasMes', ventasM2: 'ventasMes', ventasM3: 'ventasMes',
    bonifContado: 'bonif', bonifCredito: 'bonif',
}

const argbDe = (hex: string) => 'FF' + hex.replace('#', '').toUpperCase()
/** Mezcla con blanco para la franja de laboratorio (t=0 el color, t=1 blanco). */
const argbAclarado = (hex: string, t: number) => {
    const n = parseInt(hex.replace('#', ''), 16)
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.round(v + (255 - v) * t))
    return 'FF' + c.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase()
}
const STOCK_ARGB   = 'FF1A56A0'
const BONIF_ARGB   = 'FF1A6B3A'
const ESCALA_ARGB  = 'FF1A3A8F'
const VENTAS_ARGB  = 'FF1A56A0'


const TODAS_LAS_COLUMNAS = [
    { header: 'LABORATORIO',     key: 'laboratorio',  width: 28, numFmt: '@' },
    { header: 'CÓDIGO',          key: 'codigo',        width: 10, numFmt: '@' },
    { header: 'DESCRIPCIÓN',     key: 'descripcion',   width: 38, numFmt: '@' },
    { header: 'PRESENTACIÓN',    key: 'presentacion',  width: 18, numFmt: '@' },
    { header: 'PRINCIPIO ACTIVO',key: 'principio',     width: 22, numFmt: '@' },
    { header: 'UM',              key: 'um',            width:  6, numFmt: '@' },
    { header: 'LOTES',           key: 'lotes',         width: 18, numFmt: '@' },
    { header: 'F. VENCIMIENTO',  key: 'vencimientos',  width: 14, numFmt: '@' },
    { header: 'AÑO VENC.',       key: 'anioVenc',      width:  9, numFmt: '0' },
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
export interface LoteFila {
    lote:  string
    vcto:  string
    anio:  number | null
    stock: number | null
}

/**
 * 'LOTE|YYYY-MM-DD|STOCK;LOTE|YYYY-MM-DD|STOCK' -> una fila por lote.
 *
 * El tercer campo lo agregó sp_lista_precios_all para poder abrir el export
 * por lote. Se tolera que falte: si la BD todavía no tiene el SP nuevo, el
 * stock queda en null y el export sigue saliendo, solo que sin esa columna.
 */
export function parseLotes(raw: string): LoteFila[] {
    if (!raw) return []

    return raw.split(';').map(s => {
        const [lote, fecha, stock] = s.split('|')
        const vcto = moment(fecha, 'YYYY-MM-DD')
        return {
            lote: lote ?? '',
            // Sin esto, un lote sin fecha imprimía "Invalid date".
            vcto: fecha && vcto.isValid() ? vcto.format('DD/MM/YYYY') : '',
            anio: fecha && vcto.isValid() ? vcto.year() : null,
            stock: stock !== undefined && stock !== '' && !isNaN(Number(stock))
                ? Number(stock)
                : null,
        }
    })
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

function construirHoja(
    workbook: ExcelJS.Workbook,
    nombreHoja: string,
    titulo: string,
    data: any[],
    etiquetasMes: string[],
    mapaVentas: Map<string, { meses: number[]; total_3m: number }>,
    op: OpcionesExcel,
) {
            const COLUMNS = TODAS_LAS_COLUMNAS.filter(c => {
                const g = GRUPO_DE_COLUMNA[c.key]
                return !g || op.columnas[g]
            })
            const propio = op.color.toLowerCase() !== OPCIONES_EXCEL_DEFECTO.color
            const HEADER_ARGB = propio ? argbDe(op.color) : HEADER_DEFECTO_ARGB
            const LAB_ARGB = propio ? argbAclarado(op.color, 0.2) : LAB_DEFECTO_ARGB

            const ws = workbook.addWorksheet(nombreHoja, {
                views: [{ state: 'frozen', ySplit: 2 }],
            })

            // Row 1: title
            ws.mergeCells(1, 1, 1, COLUMNS.length)
            const titleCell = ws.getCell(1, 1)
            titleCell.value = titulo
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

                const filasLote = parseLotes(item.lotes_raw)

                const precioContado  = item.precio_contado  ? Number(item.precio_contado)  : null
                const precioCredito  = item.precio_credito  ? Number(item.precio_credito)  : null
                const bonifContado   = Number(item.precio_por_mayor) > 0 ? Number(item.precio_por_mayor) : null
                const bonifCredito   = Number(item.precio_por_menor) > 0 ? Number(item.precio_por_menor) : null

                const v = mapaVentas.get(String(item.prod_codigo))

                // Una fila por lote. Un producto sin lotes con saldo igual
                // aparece, en una sola fila y con las columnas de lote vacías:
                // si no, desaparecería del listado de precios.
                const filas = filasLote.length > 0
                    ? filasLote
                    : [{ lote: '', vcto: '', anio: null, stock: null } as LoteFila]

                // El zebreado va por PRODUCTO, no por fila: así los lotes de un
                // mismo producto comparten fondo y se leen como un bloque.
                const isOdd  = rowIndex % 2 !== 0
                const bgArgb = isOdd && op.zebra ? ROW_ODD_ARGB : 'FFFFFFFF'

                filas.forEach((f, iLote) => {
                    const esPrimera = iLote === 0

                    const dataRow = ws.addRow({
                        laboratorio  : item.laboratorio_Descripcion ?? '',
                        codigo       : item.prod_codigo ?? '',
                        descripcion  : item.prod_descripcion ?? '',
                        presentacion : item.prod_presentacion ?? '',
                        principio    : item.prod_principio ?? '',
                        um           : item.prod_medida ?? '',
                        lotes        : f.lote,
                        vencimientos : f.vcto,
                        anioVenc     : f.anio,
                        // El stock es del lote. Si el SP todavía no lo manda,
                        // se cae al total del producto y solo en la primera
                        // fila, para que sumar la columna no dé de más.
                        stock        : f.stock !== null
                            ? Number(f.stock.toFixed(2))
                            : (esPrimera ? Number(Number(item.kardex_saldoCant || 0).toFixed(2)) : null),
                        // Las ventas son del producto, no del lote: repetirlas
                        // en cada fila inflaría cualquier suma.
                        ventas3m     : esPrimera ? Number(v?.total_3m ?? 0)   : null,
                        ventasM1     : esPrimera ? Number(v?.meses?.[0] ?? 0) : null,
                        ventasM2     : esPrimera ? Number(v?.meses?.[1] ?? 0) : null,
                        ventasM3     : esPrimera ? Number(v?.meses?.[2] ?? 0) : null,
                        precioContado,
                        precioCredito,
                        bonifContado,
                        bonifCredito,
                    })

                    dataRow.height = 16

                    COLUMNS.forEach((col, idx) => {
                        const cell = dataRow.getCell(idx + 1)
                        let textArgb = 'FF222222'

                        if (col.key === 'stock')         textArgb = STOCK_ARGB
                        if (col.key === 'ventas3m') textArgb = VENTAS_ARGB
                        if (col.key === 'bonifContado' || col.key === 'bonifCredito') textArgb = BONIF_ARGB

                        cell.font      = { size: 9, color: { argb: textArgb } }
                        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } }
                        cell.alignment = {
                            horizontal: ['anioVenc','stock','ventas3m','ventasM1','ventasM2','ventasM3','precioContado','precioCredito','bonifContado','bonifCredito'].includes(col.key)
                                ? 'right' : 'left',
                            vertical  : 'top',
                            wrapText  : true,
                        }
                        if (col.numFmt !== '@' && cell.value !== null) cell.numFmt = col.numFmt as string

                        const cellStr = cell.value != null ? String(cell.value) : ''
                        if (cellStr.length > maxLen[idx]) maxLen[idx] = cellStr.length
                    })
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
}

export type VentasExcel = { etiquetasMes: string[]; mapa: Map<string, { meses: number[]; total_3m: number }> }

/** Ventas de 3 meses por artículo; si el endpoint falla, las columnas salen en cero. */
export async function cargarVentasExcel(): Promise<VentasExcel> {
    const mapa = new Map<string, { meses: number[]; total_3m: number }>()
    let etiquetasMes: string[] = []
    try {
        const resVentas = await PriceService.getVentasTresMeses()
        const body = resVentas?.data ?? {}
        etiquetasMes = (body.periodos || []).map(etiquetaPeriodo)
        for (const fila of (body.data || [])) {
            mapa.set(String(fila.cod_articulo), {
                meses: (fila.meses || []).map(Number),
                total_3m: Number(fila.total_3m || 0),
            })
        }
    } catch (e) {
        console.warn('No se pudieron cargar las ventas de 3 meses para el Excel:', e)
    }
    return { etiquetasMes, mapa }
}

/** Arma el libro (una hoja, o una por almacén) sin descargarlo: lo usa también la vista previa. */
export function construirLibroExcel({ datos, titulo, ventas, opciones = OPCIONES_EXCEL_DEFECTO }: {
    datos: DatosExport
    titulo: string
    ventas: VentasExcel
    opciones?: OpcionesExcel
}): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'DROGUERÍA DIFAR'

    if (datos.grupos) {
        for (const { almacen, data: filas } of datos.grupos) {
            construirHoja(
                workbook,
                nombreHojaValido(`${almacen.IdAlmacen} - ${almacen.Descripcion}`, `Almacén ${almacen.IdAlmacen}`),
                `${titulo} — ALMACÉN ${almacen.IdAlmacen}: ${almacen.Descripcion.toUpperCase()}`,
                filas, ventas.etiquetasMes, ventas.mapa, opciones,
            )
        }
    } else {
        construirHoja(workbook, 'Lista de Precios', titulo, datos.data ?? [], ventas.etiquetasMes, ventas.mapa, opciones)
    }
    return workbook
}

export async function descargarLibroExcel(workbook: ExcelJS.Workbook, nombreArchivo: string) {
    const buffer = await workbook.xlsx.writeBuffer()
    const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link   = document.createElement('a')
    link.href    = URL.createObjectURL(blob)
    link.download = nombreArchivo
    link.click()
    URL.revokeObjectURL(link.href)
}

/**
 * Arma y descarga el Excel de la lista de precios. Recibe los datos ya
 * filtrados para que lo usen tanto el botón de export como el modal de
 * productos por vencer.
 */
export async function generarExcel({ datos, titulo, nombreArchivo }: {
    datos: DatosExport
    titulo: string
    nombreArchivo: string
}) {
    const ventas = await cargarVentasExcel()
    await descargarLibroExcel(construirLibroExcel({ datos, titulo, ventas }), nombreArchivo)
}

const ExportExcelButton = ({ payload, filters, porAlmacen = false, almacenSel = null }: { payload: any; filters?: any; porAlmacen?: boolean; almacenSel?: number | null }) => {
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

    const [preparado, setPreparado] = useState<{ datos: DatosExport; ventas: VentasExcel; archivo: string } | null>(null)

    // Los datos se traen una vez al abrir; las opciones del modal solo rearman el libro.
    const abrir = async () => {
        if (loading) return
        setLoading(true)

        try {
            const agrupar = porAlmacen || almacenSel != null

            let datos: DatosExport
            if (agrupar) {
                const grupos = await datosPorAlmacen(
                    payload, applyFilters, almacenSel != null ? [almacenSel] : null,
                )
                if (grupos.length === 0) {
                    alert(almacenSel != null
                        ? 'Ese almacén no tiene productos con los filtros aplicados.'
                        : 'Ningún almacén tiene productos con los filtros aplicados.')
                    return
                }
                datos = { grupos }
            } else {
                const response = await PriceService.getPricesAll(payload)
                datos = { data: applyFilters(response.data || []) }
            }

            setPreparado({
                datos,
                ventas: await cargarVentasExcel(),
                archivo: `lista-precios-lote${almacenSel != null ? `-alm${almacenSel}` : porAlmacen ? '-por-almacen' : ''}-${new Date().toISOString().split('T')[0]}`,
            })
        } catch (error) {
            console.error('Error al generar Excel:', error)
            alert('Ocurrió un error al generar el Excel.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Button
                variant="outline"
                disabled={loading}
                onClick={abrir}
                className="flex items-center gap-2"
            >
                {loading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <FileSpreadsheet className="h-4 w-4" />
                }
                {loading ? 'Preparando...' : 'Exportar Excel'}
            </Button>
            <ExcelVistaPreviaDialog
                abierto={!!preparado}
                onCerrar={() => setPreparado(null)}
                datos={preparado?.datos ?? null}
                ventas={preparado?.ventas ?? null}
                tituloDefecto="LISTA DE PRECIOS POR LOTE — DROGUERÍA DIFAR"
                archivoDefecto={preparado?.archivo ?? 'lista-precios-lote'}
            />
        </>
    )
}

export default ExportExcelButton
