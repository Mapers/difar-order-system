import apiClient from '@/app/api/client'
import { cabeceraSesion } from '@/app/api/sesion'
import { CatalogosArticulos, CodigoOsce, FichaArticulo } from '@/app/types/datos-generales-types'
import type { ListasAbiertas } from '@/components/contabilidad/datos-generales/articulos/FichaArticuloDialog'
import { fraccionDePct } from '@/components/contabilidad/datos-generales/comunes'

/**
 * Crear Producto de Lista de Precios por Lote (/api/logistica/productos). Ficha completa de Access
 * [Bienes y Servicios 2] + precios base. Todos los endpoints piden sesión (token en la cabecera).
 */
const B = '/logistica/productos'
const cfg = (params?: Record<string, unknown>) => ({ headers: cabeceraSesion(), params })
const datos = <T>(r: { data?: { data?: T } }, porDefecto: T): T => r.data?.data ?? porDefecto
const nulo = (v: string) => (v.trim() === '' ? null : v.trim())
const dec = (v: string) => (v.trim() === '' ? null : v.trim().replace(',', '.'))

export interface PreciosBase { PUContado: string; PUCredito: string; PUPorMayor: string; PUPorMenor: string }
export interface ResultadoCrear { id: number; codigo: string; preciosGuardados: boolean; aviso?: string }

export const ProductosService = {
    catalogos: async (): Promise<CatalogosArticulos> => datos(await apiClient.get(`${B}/catalogos`, cfg()), null as unknown as CatalogosArticulos),
    listas: async (): Promise<ListasAbiertas> =>
        datos(await apiClient.get(`${B}/listas`, cfg()), { medida: [], tipo: [], modelo: [], marca: [], otros1: [], otros2: [], control: [] }),
    osceBuscar: async (texto: string, limite = 50): Promise<CodigoOsce[]> => datos(await apiClient.get(`${B}/osce/buscar`, cfg({ texto, limite })), []),
    crear: async (f: FichaArticulo, precios: PreciosBase): Promise<ResultadoCrear> =>
        datos(await apiClient.post(B, {
            subGrupo: f.subGrupo || null, codigo: f.codigo.trim(), nombre: f.nombre.trim(), unidad: f.unidad || null, tipoExistencia: f.tipoExistencia || null,
            medida: nulo(f.medida), tipo: nulo(f.tipo), modelo: nulo(f.modelo), marca: nulo(f.marca), otros1: nulo(f.otros1), otros2: nulo(f.otros2),
            // % Precio: en pantalla 18 (%), en la base 0.18 (como Access)
            precio1: fraccionDePct(f.precio1) || null, precio2: fraccionDePct(f.precio2) || null, precio3: fraccionDePct(f.precio3) || null, precio4: fraccionDePct(f.precio4) || null, icbper: f.icbper,
            equivalencia: nulo(f.equivalencia), fiscalizado: f.fiscalizado || null, abreviado: nulo(f.abreviado), osce: f.osce || null,
            control: nulo(f.control), itemRelacionado: null,
            ctaCargoCosto: f.ctaCargoCosto || null, ctaAbonoCosto: f.ctaAbonoCosto || null, ctaCostoVentas: f.ctaCostoVentas || null,
            ctaExistencias: f.ctaExistencias || null, ctaProduccion: f.ctaProduccion || null, ctaVentas: f.ctaVentas || null,
            precios: {
                PUContado: dec(precios.PUContado), PUCredito: dec(precios.PUCredito),
                PUPorMayor: dec(precios.PUPorMayor), PUPorMenor: dec(precios.PUPorMenor),
            },
        }, cfg()), { id: 0, codigo: f.codigo, preciosGuardados: true }),
}
