import { ColumnaInforme, FilaInforme, GrupoInforme, Renglon, TipoColumna, ValoresFila } from '@/app/types/informes-contables-types'

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

/** Suma de las columnas con total en un grupo de filas. */
function sumasDe(columnas: ColumnaInforme[], filas: FilaInforme[]): ValoresFila {
    const v: ValoresFila = {}
    for (const c of columnas.filter(x => x.total)) v[c.campo] = filas.reduce((a, f) => a + (Number(valorDe(c, f)) || 0), 0)
    return v
}

/**
 * Renglones de la tabla con los cortes de grupo (encabezado y subtotal), como los reportes de Access.
 * Las filas consecutivas con la misma clave forman un grupo; dentro, los grupos del nivel siguiente.
 * Sin grupos devuelve las filas tal cual. Función pura: la usan la tabla, el Excel y el PDF.
 */
export function armarRenglones(columnas: ColumnaInforme[], filas: FilaInforme[], grupos: GrupoInforme[] = []): Renglon[] {
    const salida: Renglon[] = []
    const recorrer = (lista: { fila: FilaInforme; indice: number }[], nivel: number) => {
        if (nivel >= grupos.length) {
            for (const x of lista) salida.push({ tipo: 'fila', fila: x.fila, indice: x.indice })
            return
        }
        const g = grupos[nivel]
        let i = 0
        while (i < lista.length) {
            const clave = g.clave(lista[i].fila)
            let j = i
            while (j < lista.length && g.clave(lista[j].fila) === clave) j++
            const parte = lista.slice(i, j)
            const filasParte = parte.map(x => x.fila)
            const texto = g.titulo(parte[0].fila)
            salida.push({ tipo: 'grupo', nivel, texto, valores: g.sumasEnEncabezado ? sumasDe(columnas, filasParte) : undefined })
            recorrer(parte, nivel + 1)
            if (typeof g.subtotal === 'function') salida.push({ tipo: 'subtotal', nivel, ...g.subtotal(filasParte) })
            else if (g.subtotal) salida.push({ tipo: 'subtotal', nivel, texto: `Total ${texto}`, valores: sumasDe(columnas, filasParte) })
            i = j
        }
    }
    recorrer(filas.map((fila, indice) => ({ fila, indice })), 0)
    return salida
}

/**
 * Celdas de una fila de subtotal o de pie: el texto ocupa las columnas que no llevan valor
 * (hasta la primera con valor) y cada importe va en su columna.
 */
export function celdasEtiqueta(columnas: ColumnaInforme[], valores: ValoresFila = {}): { span: number; resto: ColumnaInforme[] } {
    const primera = columnas.findIndex(c => valores[c.campo] !== undefined && valores[c.campo] !== null)
    const span = primera <= 0 ? (primera === 0 ? 1 : columnas.length) : primera
    return { span, resto: columnas.slice(span) }
}

/** Texto de un valor de subtotal o pie, con el formato de su columna ('' si no lleva). */
export const textoValor = (col: ColumnaInforme, valores: ValoresFila = {}, moneda?: string) => {
    const v = valores[col.campo]
    if (v === undefined || v === null) return ''
    return col.tipo === 'monto' ? conSimbolo(simboloDe(col, moneda), v) : formatear(col.tipo, v)
}

export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
