import apiClient from '@/app/api/client'
import { PriceService } from '@/app/services/price/PriceService'

export interface AlmacenOption {
    IdAlmacen: number
    Descripcion: string
}

export interface GrupoAlmacen {
    almacen: AlmacenOption
    data: any[]
}

export async function listarAlmacenes(): Promise<AlmacenOption[]> {
    const res = await apiClient.get('/admin/listar/almacenes')
    const raw = res.data?.data?.data ?? res.data?.data ?? []

    return (raw as any[])
        .map(a => ({
            IdAlmacen:   Number(a.IdAlmacen),
            Descripcion: String(a.Descripcion ?? '').trim(),
        }))
        .filter(a => Number.isFinite(a.IdAlmacen))
        .sort((a, b) => a.IdAlmacen - b.IdAlmacen)
}

export async function datosPorAlmacen(
    payload: any,
    aplicarFiltros: (items: any[]) => any[],
): Promise<GrupoAlmacen[]> {
    const almacenes = await listarAlmacenes()
    const grupos: GrupoAlmacen[] = []

    for (const almacen of almacenes) {
        let filas: any[] = []
        try {
            const res = await PriceService.getPricesAll({ ...payload, almacen: almacen.IdAlmacen })
            filas = res?.data ?? []
        } catch (error: any) {
            if (error?.response?.status !== 404) throw error
            filas = []
        }

        const data = aplicarFiltros(filas)
        if (data.length > 0) grupos.push({ almacen, data })
    }

    return grupos
}

export function nombreHojaValido(texto: string, fallback: string): string {
    const limpio = texto.replace(/[\[\]\*\?\/\\:]/g, ' ').replace(/\s+/g, ' ').trim()
    return (limpio || fallback).slice(0, 31)
}
