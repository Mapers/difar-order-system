import type { ColumnaTabla } from '../nucleo/tipos'

/** Cómo se muestra cada tipo de dato en el chat y en el PDF. */
export function formatear(valor: unknown, tipo: ColumnaTabla['tipo']): string {
    if (valor === null || valor === undefined || valor === '') return ''
    if (tipo === 'moneda') {
        const n = Number(valor)
        return Number.isFinite(n) ? n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(valor)
    }
    if (tipo === 'numero') {
        const n = Number(valor)
        return Number.isFinite(n) ? n.toLocaleString('es-PE', { maximumFractionDigits: 2 }) : String(valor)
    }
    if (tipo === 'fecha') {
        const m = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/)
        return m ? `${m[3]}/${m[2]}/${m[1]}` : String(valor)
    }
    return String(valor)
}

export const esNumerica = (c: ColumnaTabla) => c.tipo === 'moneda' || c.tipo === 'numero'

export const nombreArchivo = (titulo: string) =>
    `IVAN_${titulo.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60)}_${new Date().toISOString().slice(0, 10)}`
