import apiClient from '@/app/api/client'
import { cabeceraSesion } from '@/app/api/sesion'
import { SaldoProvDocumento, SaldoProvDuplicado, SaldoProvGrupo, SaldoProvResumen } from '@/app/types/saldo-proveedores-types'

/**
 * Saldo de Documentos por Pagar Proveedor: /api/reportes/saldo-proveedores (solo lectura).
 * excluirDuplicados = true no suma los movimientos repetidos de kardex proveedores;
 * false da el mismo resultado que el reporte Access.
 */
export const SaldoProveedoresService = {
    documentos: async (f: { fechaCorte: string; codProv?: string; excluirDuplicados: boolean }): Promise<SaldoProvDocumento[]> => {
        const res = await apiClient.get('/reportes/saldo-proveedores/documentos', {
            params: { fechaCorte: f.fechaCorte, codProv: f.codProv || undefined, excluirDuplicados: f.excluirDuplicados ? 1 : 0 },
            headers: cabeceraSesion(),
        })
        return res.data?.data ?? []
    },
    resumen: async (f: { fechaCorte: string; excluirDuplicados: boolean }): Promise<SaldoProvResumen[]> => {
        const res = await apiClient.get('/reportes/saldo-proveedores/resumen', {
            params: { fechaCorte: f.fechaCorte, excluirDuplicados: f.excluirDuplicados ? 1 : 0 },
            headers: cabeceraSesion(),
        })
        return res.data?.data ?? []
    },
    duplicados: async (codProv?: string): Promise<SaldoProvDuplicado[]> => {
        const res = await apiClient.get('/reportes/saldo-proveedores/duplicados', {
            params: { codProv: codProv || undefined },
            headers: cabeceraSesion(),
        })
        return res.data?.data ?? []
    },
}

/** Agrupa por proveedor (orden por nombre) y cada grupo por F. Vcto, como el reporte Access. */
export function agruparPorProveedor(docs: SaldoProvDocumento[]): SaldoProvGrupo[] {
    const mapa = new Map<string, SaldoProvGrupo>()
    for (const d of docs) {
        let g = mapa.get(d.CodProveedor)
        if (!g) {
            g = { codigo: d.CodProveedor, ruc: d.RucProveedor, nombre: d.NombreProveedor, documentos: [], soles: 0, dolares: 0 }
            mapa.set(d.CodProveedor, g)
        }
        g.documentos.push(d)
        g.soles += Number(d.SaldoSoles) || 0
        g.dolares += Number(d.SaldoDolares) || 0
    }
    const grupos = [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre))
    grupos.forEach(g => g.documentos.sort((a, b) => (a.FechaVcto || '').localeCompare(b.FechaVcto || '')))
    return grupos
}

export const fmtMonto = (v: number) =>
    (Number(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const fmtFecha = (s?: string | null) => {
    if (!s) return '-'
    const [y, m, d] = s.slice(0, 10).split('-')
    return y && m && d ? `${d}/${m}/${y}` : s
}

export const esSolesProv = (d: SaldoProvDocumento) => d.Moneda !== 'US$'
