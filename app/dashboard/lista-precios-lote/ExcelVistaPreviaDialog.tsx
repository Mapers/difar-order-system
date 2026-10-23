'use client'

import { useEffect, useMemo, useState } from 'react'
import type ExcelJS from 'exceljs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Download, FileSpreadsheet, Palette, RotateCcw, Table2, Type } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Interruptor, Seccion, SelectorColor } from '@/components/reporte/PdfOpcionesControles'
import {
    construirLibroExcel, descargarLibroExcel, GrupoColumnasExcel, OPCIONES_EXCEL_DEFECTO, OpcionesExcel, VentasExcel,
} from './export-excel-button'
import type { DatosExport } from './services/almacenesExport'

const COLUMNAS: { clave: GrupoColumnasExcel; nombre: string }[] = [
    { clave: 'presentacion', nombre: 'Presentación' },
    { clave: 'principio',    nombre: 'Principio activo' },
    { clave: 'anioVenc',     nombre: 'Año de vencimiento' },
    { clave: 'ventasMes',    nombre: 'Ventas por mes' },
    { clave: 'bonif',        nombre: 'Precios bonificados' },
]

/** Filas que se dibujan por hoja: el archivo trae todas, la vista previa solo el inicio. */
const FILAS_VISTA = 150

/**
 * Vista previa del Excel: dibuja el mismo libro que se descarga (hojas, celdas
 * combinadas, colores, formatos de número y la barra de ventas), así lo que se
 * ve es lo que trae el archivo.
 */
export function ExcelVistaPreviaDialog({
    abierto, onCerrar, datos, ventas, tituloDefecto, archivoDefecto,
}: {
    abierto:        boolean
    onCerrar:       () => void
    datos:          DatosExport | null
    ventas:         VentasExcel | null
    tituloDefecto:  string
    archivoDefecto: string
}) {
    const [titulo, setTitulo] = useState(tituloDefecto)
    const [archivo, setArchivo] = useState(archivoDefecto)
    const [op, setOp] = useState<OpcionesExcel>(OPCIONES_EXCEL_DEFECTO)
    const [hoja, setHoja] = useState(0)

    useEffect(() => {
        if (!abierto) return
        setTitulo(tituloDefecto); setArchivo(archivoDefecto); setOp(OPCIONES_EXCEL_DEFECTO); setHoja(0)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [abierto])

    const libro = useMemo(() => {
        if (!abierto || !datos || !ventas) return null
        return construirLibroExcel({ datos, ventas, titulo: titulo.trim() || tituloDefecto, opciones: op })
    }, [abierto, datos, ventas, titulo, tituloDefecto, op])

    const hojas = libro?.worksheets ?? []
    const ws = hojas[Math.min(hoja, Math.max(0, hojas.length - 1))]

    const descargar = async () => {
        if (!libro) return
        await descargarLibroExcel(libro, `${(archivo.trim() || archivoDefecto).replace(/\.xlsx$/i, '')}.xlsx`)
    }

    return (
        <Dialog open={abierto} onOpenChange={v => { if (!v) onCerrar() }}>
            <DialogContent className="flex h-[92vh] w-[96vw] max-w-7xl flex-col gap-0 overflow-hidden p-0"
                           onOpenAutoFocus={e => e.preventDefault()}>
                <DialogHeader className="border-b px-5 py-4 text-left">
                    <DialogTitle className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 text-white">
                            <FileSpreadsheet className="h-4 w-4" />
                        </span>
                        Exportar Excel
                    </DialogTitle>
                    <DialogDescription>
                        Revisa cómo queda la hoja y ajusta lo que necesites antes de descargar.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[auto_1fr] md:grid-cols-[300px_1fr] md:grid-rows-1">
                    {/* Opciones */}
                    <div className="max-h-[38vh] min-h-0 space-y-5 overflow-y-auto border-b p-5 md:max-h-none md:border-b-0 md:border-r">
                        <Seccion icono={Type} titulo="Textos">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Título de la hoja</Label>
                                <Input value={titulo} maxLength={90} onChange={e => setTitulo(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Nombre del archivo</Label>
                                <div className="flex items-center gap-1.5">
                                    <Input value={archivo} onChange={e => setArchivo(e.target.value)} />
                                    <span className="text-xs text-muted-foreground">.xlsx</span>
                                </div>
                            </div>
                        </Seccion>

                        <Seccion icono={Palette} titulo="Color">
                            <SelectorColor valor={op.color} onChange={v => setOp(p => ({ ...p, color: v }))} />
                            <Interruptor etiqueta="Filas alternadas (cebra)" valor={op.zebra} onChange={v => setOp(p => ({ ...p, zebra: v }))} />
                        </Seccion>

                        <Seccion icono={Table2} titulo="Columnas">
                            <div className="grid grid-cols-1 gap-2">
                                {COLUMNAS.map(c => (
                                    <label key={c.clave} className="flex cursor-pointer items-center gap-2 text-sm">
                                        <Checkbox
                                            checked={op.columnas[c.clave]}
                                            onCheckedChange={v => setOp(p => ({ ...p, columnas: { ...p.columnas, [c.clave]: v === true } }))}
                                        />
                                        {c.nombre}
                                    </label>
                                ))}
                            </div>
                            <p className="text-[11px] text-muted-foreground">Laboratorio, código, descripción, lotes, stock y precios siempre se incluyen.</p>
                        </Seccion>
                    </div>

                    {/* Vista previa tipo hoja de cálculo */}
                    <div className="flex min-h-0 min-w-0 flex-col bg-muted/40">
                        <div className="min-h-0 flex-1 overflow-auto">
                            {ws ? <HojaVista ws={ws} /> : (
                                <p className="p-6 text-sm text-muted-foreground">Preparando la vista previa…</p>
                            )}
                        </div>
                        {/* Pestañas de hojas, como en Excel */}
                        <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-t bg-background px-2 py-1.5">
                            {hojas.map((h, i) => (
                                <button key={h.id} type="button" onClick={() => setHoja(i)}
                                        className={cn('shrink-0 rounded-b-md border border-t-0 px-3 py-1 text-xs',
                                            i === hoja ? 'border-emerald-300 bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                : 'border-transparent text-muted-foreground hover:bg-muted')}>
                                    {h.name}
                                </button>
                            ))}
                            {ws && (
                                <span className="ml-auto shrink-0 pl-3 text-[11px] text-muted-foreground">
                                    {ws.rowCount > FILAS_VISTA
                                        ? `Se muestran ${FILAS_VISTA} de ${ws.rowCount} filas; el archivo trae todas`
                                        : `${ws.rowCount} filas`}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 border-t bg-muted/30 px-4 py-3 sm:px-5">
                    <Button variant="ghost" size="sm" className="gap-1.5 px-2 sm:px-3" title="Restablecer"
                            onClick={() => { setOp(OPCIONES_EXCEL_DEFECTO); setTitulo(tituloDefecto); setArchivo(archivoDefecto) }}>
                        <RotateCcw className="h-4 w-4" /> <span className="hidden sm:inline">Restablecer</span>
                    </Button>
                    <div className="ml-auto flex gap-2">
                        <Button variant="outline" onClick={onCerrar}>Cerrar</Button>
                        <Button className="gap-1.5 bg-emerald-600 text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700"
                                disabled={!libro} onClick={descargar}>
                            <Download className="h-4 w-4" /> Descargar<span className="hidden sm:inline"> Excel</span>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ─── Dibujo de la hoja ───────────────────────────────────────────────────────

const letraColumna = (n: number) => {
    let s = ''
    while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26) }
    return s
}
const numeroColumna = (letras: string) => letras.split('').reduce((a, c) => a * 26 + c.charCodeAt(0) - 64, 0)
const colorDe = (argb?: string) => argb && argb.length === 8 ? `#${argb.slice(2)}` : undefined

const textoCelda = (cell: ExcelJS.Cell): string => {
    const v = cell.value
    if (v === null || v === undefined) return ''
    if (typeof v === 'number') {
        if (cell.numFmt === '#,##0.00') return v.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        return String(v)
    }
    return String(v)
}

function HojaVista({ ws }: { ws: ExcelJS.Worksheet }) {
    const nCols = ws.columnCount
    const nFilas = Math.min(ws.rowCount, FILAS_VISTA)

    // Celdas combinadas: la primera ocupa el rango y las demás no se dibujan.
    const { inicio, ocultas } = useMemo(() => {
        const inicio = new Map<string, number>()
        const ocultas = new Set<string>()
        for (const rango of (ws.model as any).merges ?? []) {
            const m = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(rango)
            if (!m) continue
            const c1 = numeroColumna(m[1]), r1 = Number(m[2]), c2 = numeroColumna(m[3]), r2 = Number(m[4])
            inicio.set(`${r1}:${c1}`, c2 - c1 + 1)
            for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) if (r !== r1 || c !== c1) ocultas.add(`${r}:${c}`)
        }
        return { inicio, ocultas }
    }, [ws])

    // La barra de ventas es formato condicional en Excel; aquí se dibuja igual, contra el máximo de la columna.
    const colVentas = useMemo(() => {
        for (let c = 1; c <= nCols; c++) if (String(ws.getCell(2, c).value ?? '').startsWith('VENTAS 3M')) return c
        return -1
    }, [ws, nCols])
    const maxVentas = useMemo(() => {
        if (colVentas < 0) return 0
        let m = 0
        for (let r = 3; r <= ws.rowCount; r++) { const v = ws.getCell(r, colVentas).value; if (typeof v === 'number' && v > m) m = v }
        return m
    }, [ws, colVentas])

    const anchos = Array.from({ length: nCols }, (_, i) => Math.round((ws.getColumn(i + 1).width ?? 10) * 7))

    return (
        <table className="border-collapse bg-white text-[11px] text-[#222]" style={{ tableLayout: 'fixed' }}>
            <colgroup>
                <col style={{ width: 36 }} />
                {anchos.map((w, i) => <col key={i} style={{ width: w }} />)}
            </colgroup>
            <thead>
                <tr>
                    <th className="sticky left-0 top-0 z-20 border border-[#d4d4d4] bg-[#efefef]" />
                    {anchos.map((_, i) => (
                        <th key={i} className="sticky top-0 z-10 border border-[#d4d4d4] bg-[#efefef] py-0.5 text-center text-[10px] font-normal text-[#555]">
                            {letraColumna(i + 1)}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: nFilas }, (_, ri) => {
                    const r = ri + 1
                    const fila = ws.getRow(r)
                    return (
                        <tr key={r} style={{ height: Math.round((fila.height ?? 15) * 1.33) }}>
                            <td className="sticky left-0 z-10 border border-[#d4d4d4] bg-[#efefef] text-center text-[10px] text-[#555]">{r}</td>
                            {Array.from({ length: nCols }, (_, ci) => {
                                const c = ci + 1
                                const clave = `${r}:${c}`
                                if (ocultas.has(clave)) return null
                                const cell = ws.getCell(r, c)
                                const fill = colorDe((cell.fill as any)?.fgColor?.argb)
                                const color = colorDe(cell.font?.color?.argb)
                                const valor = cell.value
                                const barra = c === colVentas && r > 2 && typeof valor === 'number' && maxVentas > 0
                                    ? (valor / maxVentas) * 100 : 0
                                return (
                                    <td key={c} colSpan={inicio.get(clave)}
                                        className="overflow-hidden whitespace-pre-line border border-[#e1e1e1] px-1 align-top"
                                        style={{
                                            background: barra > 0
                                                ? `linear-gradient(90deg, #8fb4e3 ${barra}%, ${fill ?? '#fff'} ${barra}%)`
                                                : fill,
                                            color,
                                            fontWeight: cell.font?.bold ? 700 : undefined,
                                            fontSize: cell.font?.size ? `${cell.font.size + 2}px` : undefined,
                                            textAlign: (cell.alignment?.horizontal as any) ?? (typeof valor === 'number' ? 'right' : 'left'),
                                            verticalAlign: cell.alignment?.vertical === 'middle' ? 'middle' : 'top',
                                        }}>
                                        {textoCelda(cell)}
                                    </td>
                                )
                            })}
                        </tr>
                    )
                })}
            </tbody>
        </table>
    )
}
