'use client'

import { useState } from 'react'
import { ChevronDown, FileSpreadsheet, FileText, Table2 } from 'lucide-react'
import { PdfVistaPreviaDialog } from '@/components/reporte/PdfVistaPreviaDialog'
import type { TablaIvan as Tabla } from './nucleo/tipos'
import { esNumerica, formatear, nombreArchivo } from './exportar/formato'
import { exportarExcel } from './exportar/excel'
import { generarPdfTabla } from './exportar/pdf'

const VISIBLES = 6

/** Datos de una consulta dentro del chat, con exportación a Excel y PDF. */
export function TablaIvan({ tabla }: { tabla: Tabla }) {
    const [todas, setTodas] = useState(false)
    const [pdfAbierto, setPdfAbierto] = useState(false)
    const filas = todas ? tabla.filas : tabla.filas.slice(0, VISIBLES)
    const resto = tabla.filas.length - VISIBLES

    return (
        <div className="w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-wrap items-center gap-2 border-b bg-gradient-to-r from-slate-50 to-transparent px-3 py-2 dark:from-slate-900/50">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                    <Table2 className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">{tabla.titulo}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                        {tabla.filas.length} {tabla.filas.length === 1 ? 'fila' : 'filas'}{tabla.subtitulo ? ` · ${tabla.subtitulo}` : ''}
                    </p>
                </div>
                <div className="flex gap-1">
                    <button type="button" onClick={() => exportarExcel(tabla)} title="Descargar en Excel"
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                    </button>
                    <button type="button" onClick={() => setPdfAbierto(true)} title="Vista previa del PDF"
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                        <FileText className="h-3.5 w-3.5" /> PDF
                    </button>
                </div>
            </div>

            <div className={`overflow-x-auto ${todas ? 'max-h-80 overflow-y-auto' : ''}`}>
                <table className="w-full text-[11px]">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                        <tr>
                            {tabla.columnas.map(c => (
                                <th key={c.k} className={`whitespace-nowrap px-2.5 py-1.5 font-semibold text-muted-foreground ${esNumerica(c) ? 'text-right' : 'text-left'}`}>{c.t}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filas.map((f, i) => (
                            <tr key={i} className="border-t border-border/60 odd:bg-muted/20">
                                {tabla.columnas.map(c => (
                                    <td key={c.k} className={`max-w-[220px] truncate px-2.5 py-1.5 ${esNumerica(c) ? 'text-right font-mono tabular-nums' : ''}`}
                                        title={formatear(f[c.k], c.tipo)}>
                                        {formatear(f[c.k], c.tipo)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                    {tabla.totales && (todas || resto <= 0) && (
                        <tfoot>
                            <tr className="border-t-2 border-indigo-200 bg-indigo-50/60 font-semibold dark:border-indigo-900 dark:bg-indigo-950/30">
                                {tabla.columnas.map(c => (
                                    <td key={c.k} className={`whitespace-nowrap px-2.5 py-1.5 ${esNumerica(c) ? 'text-right font-mono tabular-nums' : ''}`}>
                                        {formatear(tabla.totales![c.k], c.tipo)}
                                    </td>
                                ))}
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            {resto > 0 && (
                <button type="button" onClick={() => setTodas(v => !v)}
                        className="flex w-full items-center justify-center gap-1 border-t py-1.5 text-[11px] font-medium text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/30">
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${todas ? 'rotate-180' : ''}`} />
                    {todas ? 'Mostrar menos' : `Ver las ${tabla.filas.length} filas${tabla.totales ? ' y el total' : ''}`}
                </button>
            )}

            <PdfVistaPreviaDialog
                abierto={pdfAbierto}
                onCerrar={() => setPdfAbierto(false)}
                titulo={tabla.titulo}
                descripcion="Consulta de IVAN"
                defecto={{ titulo: tabla.titulo.toUpperCase(), nota: '', color: '#163161', tamanoLetra: 'normal' }}
                archivoDefecto={nombreArchivo(tabla.titulo)}
                generar={op => generarPdfTabla(tabla, op)}
            />
        </div>
    )
}
