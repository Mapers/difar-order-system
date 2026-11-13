import { ColumnaInforme, FilaInforme, TipoColumna } from '@/app/types/informes-contables-types'

/** Formatos de presentación de los informes contables (funciones puras). */

export const fmtMonto = (v: unknown) =>
    (Number(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const fmtFecha = (v: unknown) => {
    if (!v) return '-'
    const s = String(v)
    const [y, m, d] = s.slice(0, 10).split('-')
    return y && m && d ? `${d}/${m}/${y}` : s
}

export function formatear(tipo: TipoColumna, v: unknown): string {
    if (v === null || v === undefined || v === '') return tipo === 'monto' ? '0.00' : '-'
    switch (tipo) {
        case 'fecha': return fmtFecha(v)
        case 'monto': return fmtMonto(v)
        case 'tc': return (Number(v) || 0).toFixed(3)
        case 'entero': return (Number(v) || 0).toLocaleString('en-US')
        case 'si-no': return Number(v) ? 'Sí' : 'No'
        case 'moneda': return ({ NSO: 'S/', USD: 'US$' } as Record<string, string>)[String(v)] ?? String(v)
        default: return String(v)
    }
}

/** Símbolo de moneda de una columna de importe: el de la columna, o el del reporte (S/ por defecto). */
export const simboloDe = (col: ColumnaInforme, monedaReporte?: string) =>
    col.tipo !== 'monto' ? '' : (col.moneda !== undefined ? col.moneda : (monedaReporte ?? 'S/'))

/** "S/ 1,234.50" (o solo el número si la columna no tiene símbolo). */
export const conSimbolo = (simbolo: string, v: unknown) => (simbolo ? `${simbolo} ${fmtMonto(v)}` : fmtMonto(v))

/** Código de moneda de la base (NSO, PEN, USD, S/, US$) -> símbolo. */
export const simboloMoneda = (v: unknown): string => {
    const s = String(v ?? '').trim().toUpperCase()
    if (s === 'NSO' || s === 'PEN' || s === 'S/' || s === 'S/.') return 'S/'
    if (s === 'USD' || s === 'US$') return 'US$'
    return ''
}

/** Símbolo de UN importe: el de su fila si la columna mezcla monedas (monedaDe), si no el de la columna/reporte. */
export const simboloCelda = (col: ColumnaInforme, fila: FilaInforme, monedaReporte?: string) =>
    col.tipo !== 'monto' ? '' : (col.monedaDe ? simboloMoneda(col.monedaDe(fila)) : simboloDe(col, monedaReporte))

/** Símbolo del TOTAL de una columna: si todas las filas tienen la misma moneda, esa; si se mezclan, ninguno. */
export function simboloTotal(col: ColumnaInforme, filas: FilaInforme[], monedaReporte?: string): string {
    if (col.tipo !== 'monto') return ''
    if (!col.monedaDe) return simboloDe(col, monedaReporte)
    const s = new Set(filas.map(f => simboloMoneda(col.monedaDe!(f))))
    return s.size === 1 ? [...s][0] : ''
}

/**
 * Texto del TOTAL de una columna de importe, siempre con símbolo.
 * Si la columna mezcla monedas, no se suman soles con dólares: se muestra "S/ 1,234.00 · US$ 56.00".
 */
export function textoTotal(col: ColumnaInforme, filas: FilaInforme[], monedaReporte?: string): string {
    if (col.tipo !== 'monto' || !col.monedaDe) {
        return conSimbolo(simboloTotal(col, filas, monedaReporte), filas.reduce((a, f) => a + (Number(valorDe(col, f)) || 0), 0))
    }
    const porMoneda = new Map<string, number>()
    for (const f of filas) {
        const s = simboloMoneda(col.monedaDe(f)) || 'S/'
        porMoneda.set(s, (porMoneda.get(s) ?? 0) + (Number(valorDe(col, f)) || 0))
    }
    const orden = ['S/', 'US$']
    return [...porMoneda.entries()].sort((a, b) => orden.indexOf(a[0]) - orden.indexOf(b[0]))
        .map(([s, v]) => conSimbolo(s, v)).join(' · ')
}

/** Texto de una celda, con el símbolo de moneda en los importes ("S/ 77.50"). */
export const formatearCelda = (col: ColumnaInforme, fila: FilaInforme, monedaReporte?: string) =>
    col.tipo === 'monto'
        ? conSimbolo(simboloCelda(col, fila, monedaReporte), valorDe(col, fila))
        : formatear(col.tipo, valorDe(col, fila))

/** Valor de una columna en una fila (calculado o directo). */
export const valorDe = (col: ColumnaInforme, fila: FilaInforme) => (col.valor ? col.valor(fila) : fila[col.campo])

export const esNumerica = (tipo: TipoColumna) => tipo === 'monto' || tipo === 'entero' || tipo === 'tc'

/** Suma de las columnas marcadas como total. */
export function totales(columnas: ColumnaInforme[], filas: FilaInforme[]): Record<string, number> {
    const t: Record<string, number> = {}
    for (const c of columnas.filter(x => x.total)) {
        t[c.campo] = filas.reduce((a, f) => a + (Number(f[c.campo]) || 0), 0)
    }
    return t
}

export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
