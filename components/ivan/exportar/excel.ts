import * as XLSX from 'xlsx'
import type { TablaIvan } from '../nucleo/tipos'
import { esNumerica, formatear, nombreArchivo } from './formato'

/** Descarga la tabla como Excel, con números como números (se pueden sumar). */
export function exportarExcel(tabla: TablaIvan) {
    const valor = (v: unknown, c: TablaIvan['columnas'][number]) =>
        esNumerica(c) && v !== '' && v != null && Number.isFinite(Number(v)) ? Number(v) : formatear(v, c.tipo)

    const filas = [
        [tabla.titulo],
        ...(tabla.subtitulo ? [[tabla.subtitulo]] : []),
        [],
        tabla.columnas.map(c => c.t),
        ...tabla.filas.map(f => tabla.columnas.map(c => valor(f[c.k], c))),
        ...(tabla.totales ? [tabla.columnas.map(c => valor(tabla.totales![c.k], c))] : []),
    ]
    const hoja = XLSX.utils.aoa_to_sheet(filas)
    hoja['!cols'] = tabla.columnas.map(c => ({
        wch: Math.min(45, Math.max(c.t.length, ...tabla.filas.slice(0, 200).map(f => formatear(f[c.k], c.tipo).length)) + 2),
    }))
    const libro = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(libro, hoja, 'Datos')
    XLSX.writeFile(libro, `${nombreArchivo(tabla.titulo)}.xlsx`)
}
