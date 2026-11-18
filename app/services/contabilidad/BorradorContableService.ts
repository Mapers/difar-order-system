import apiClient from "@/app/api/client"
import type { LineaBorrador } from "@/lib/borradorContable"

/** Borradores en el servidor (tablas tmp_*): /api/contabilidad/borradores. */
export type FormularioBorrador = 'caja' | 'compras'

export interface BorradorCaja<T> { lineas: LineaBorrador<T>[]; actualizado: string | null }
export interface BorradorCompras<C, T> { cabecera: C; baseCabecera: C | null; actualizado: string; lineas: LineaBorrador<T>[] }

export interface PendienteCaja { Item: number; Caja: number; CajaNombre: string; Fecha: string; Voucher: string; Nuevas: number; Editadas: number; Eliminadas: number; Actualizado: string }
export interface PendienteCompras { Clave: number; Serie: string | null; Numero: string | null; Proveedor: string | null; Lineas: number; Actualizado: string }

const ruta = (f: FormularioBorrador, id: number | string) => `/contabilidad/borradores/${f}/${id}`

export const BorradorContableService = {
    ruta,
    async cajaObtener<T>(item: number): Promise<BorradorCaja<T>> {
        const r = await apiClient.get(ruta('caja', item))
        return r.data?.data ?? { lineas: [], actualizado: null }
    },
    async cajaPendientes(): Promise<PendienteCaja[]> {
        const r = await apiClient.get(ruta('caja', 'pendientes'))
        return r.data?.data ?? []
    },
    async comprasObtener<C, T>(clave: number): Promise<BorradorCompras<C, T> | null> {
        const r = await apiClient.get(ruta('compras', clave))
        return r.data?.data ?? null
    },
    async comprasPendientes(): Promise<PendienteCompras[]> {
        const r = await apiClient.get(ruta('compras', 'pendientes'))
        return r.data?.data ?? []
    },
    async guardar(f: FormularioBorrador, id: number, cuerpo: unknown) {
        await apiClient.put(ruta(f, id), cuerpo)
    },
    async eliminar(f: FormularioBorrador, id: number) {
        await apiClient.delete(ruta(f, id))
    },
}
