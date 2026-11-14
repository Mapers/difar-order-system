import apiClient from '@/app/api/client'
import { cabeceraSesion } from '@/app/api/sesion'
import {
    CatalogosArticulos, CatalogosPersonas, CodigoOsce, FechaFaltante, FichaArticulo, FichaIgv, FichaPersona, FilaAnio, FilaArticulo,
    FilaArticuloOsce, FilaIgv, FilaMes, FilaPersona, FilaTipoCambio, Opcion, ResultadoEliminar, Uso,
} from '@/app/types/datos-generales-types'

/**
 * Datos Fijos › Datos Generales (/api/contabilidad/…). Único punto del front que conoce estas URLs.
 * Todos los endpoints piden sesión (token en la cabecera).
 */
const cfg = (params?: Record<string, unknown>) => ({ headers: cabeceraSesion(), params })
const datos = <T>(r: { data?: { data?: T } }, porDefecto: T): T => r.data?.data ?? porDefecto
const nulo = (v: string) => (v.trim() === '' ? null : v.trim())

/** DELETE que responde 409 con el detalle de uso cuando no se puede eliminar. */
async function eliminar(url: string): Promise<ResultadoEliminar> {
    try {
        return datos((await apiClient.delete(url, cfg())), { eliminado: true, usos: [] })
    } catch (e: any) {
        if (e?.response?.status === 409) return e.response.data?.data ?? { eliminado: false, usos: [] }
        throw e
    }
}

// ------------------------------------------------------------------ Personas y Empresas
const P = '/contabilidad/personas'
export const PersonasService = {
    listar: async (relacion: string, buscar: string): Promise<FilaPersona[]> =>
        datos(await apiClient.get(P, cfg({ relacion: relacion || undefined, buscar: buscar.trim() || undefined })), []),
    catalogos: async (): Promise<CatalogosPersonas> => datos(await apiClient.get(`${P}/catalogos`, cfg()), null as unknown as CatalogosPersonas),
    uso: async (codigo: string): Promise<Uso[]> => datos(await apiClient.get(`${P}/${encodeURIComponent(codigo)}/uso`, cfg()), []),
    guardar: async (f: FichaPersona): Promise<{ codigo: string; otrosConMismoRuc: number }> =>
        datos(await apiClient.post(P, {
            nuevo: f.nuevo, codigo: f.nuevo ? f.codigo.trim() : f.codigo, nombre: f.nombre, nombreComercial: nulo(f.nombreComercial),
            tipoDoc: f.tipoDoc, ruc: nulo(f.ruc), direccion: nulo(f.direccion), referencia: nulo(f.referencia), telefono: nulo(f.telefono),
            correo: nulo(f.correo), otros: nulo(f.otros), idDistrito: f.idDistrito || null, fechaInicio: f.fechaInicio || null,
            relacion: f.relacion, ctaContable: f.ctaContable || null, codigoVendedor: f.codigoVendedor || null, idZona: f.idZona || null,
            lineaCredito: nulo(f.lineaCredito), tipoCliente: nulo(f.tipoCliente),
        }, cfg()), { codigo: f.codigo, otrosConMismoRuc: 0 }),
    eliminar: (codigo: string) => eliminar(`${P}/${encodeURIComponent(codigo)}`),
}

// ------------------------------------------------------------------ Tipo de cambio
const TC = '/contabilidad/tipo-cambio'
export const TipoCambioService = {
    listar: async (desde: string, hasta: string): Promise<FilaTipoCambio[]> => datos(await apiClient.get(TC, cfg({ desde: desde || undefined, hasta: hasta || undefined })), []),
    faltantes: async (desde: string, hasta: string): Promise<FechaFaltante[]> => datos(await apiClient.get(`${TC}/faltantes`, cfg({ desde, hasta })), []),
    guardar: async (nuevo: boolean, fecha: string, compra: string, venta: string): Promise<{ avisoCompraMayorVenta: boolean }> =>
        datos(await apiClient.post(TC, { nuevo, fecha, compra, venta }, cfg()), { avisoCompraMayorVenta: false }),
    eliminar: (fecha: string) => eliminar(`${TC}/${fecha}`),
}

// ------------------------------------------------------------------ Bienes y Servicios + OSCE
const A = '/contabilidad/articulos'
export const ArticulosService = {
    listar: async (buscar: string, subGrupo: string): Promise<FilaArticulo[]> =>
        datos(await apiClient.get(A, cfg({ buscar: buscar.trim() || undefined, subGrupo: subGrupo || undefined })), []),
    catalogos: async (): Promise<CatalogosArticulos> => datos(await apiClient.get(`${A}/catalogos`, cfg()), null as unknown as CatalogosArticulos),
    uso: async (id: number): Promise<Uso[]> => datos(await apiClient.get(`${A}/${id}/uso`, cfg()), []),
    guardar: async (f: FichaArticulo): Promise<{ id: number; codigo: string }> =>
        datos(await apiClient.post(A, {
            id: f.id, subGrupo: f.subGrupo || null, codigo: nulo(f.codigo), nombre: f.nombre, unidad: f.unidad || null, tipoExistencia: f.tipoExistencia || null,
            medida: nulo(f.medida), tipo: nulo(f.tipo), modelo: nulo(f.modelo), marca: nulo(f.marca), otros1: nulo(f.otros1), otros2: nulo(f.otros2),
            precio1: nulo(f.precio1), precio2: nulo(f.precio2), precio3: nulo(f.precio3), precio4: nulo(f.precio4), icbper: f.icbper,
            equivalencia: nulo(f.equivalencia), fiscalizado: f.fiscalizado || null, abreviado: nulo(f.abreviado), osce: f.osce || null,
            control: nulo(f.control), itemRelacionado: f.itemRelacionado || null,
            ctaCargoCosto: f.ctaCargoCosto || null, ctaAbonoCosto: f.ctaAbonoCosto || null, ctaCostoVentas: f.ctaCostoVentas || null,
            ctaExistencias: f.ctaExistencias || null, ctaProduccion: f.ctaProduccion || null, ctaVentas: f.ctaVentas || null,
        }, cfg()), { id: 0, codigo: '' }),
    eliminar: (id: number) => eliminar(`${A}/${id}`),
    osceBuscar: async (texto: string, limite = 50): Promise<CodigoOsce[]> => datos(await apiClient.get(`${A}/osce/buscar`, cfg({ texto, limite })), []),
    osceListar: async (buscar: string, soloSinOsce: boolean): Promise<FilaArticuloOsce[]> =>
        datos(await apiClient.get(`${A}/osce`, cfg({ buscar: buscar.trim() || undefined, soloSinOsce: soloSinOsce ? 1 : 0 })), []),
    osceGuardar: async (id: number, osce: number | null, unidad: string, tipoExistencia: string) =>
        datos(await apiClient.post(`${A}/osce/${id}`, { osce, unidad: unidad || null, tipoExistencia: tipoExistencia || null }, cfg()), null),
}

// ------------------------------------------------------------------ IGV
const I = '/contabilidad/igv'
/** "18" (porcentaje) -> "0.18" (fracción que guarda la tabla), sin errores de coma flotante. */
export function porcentajeAFraccion(p: string): string | null {
    const t = p.trim().replace(',', '.')
    if (t === '') return null
    const n = Number(t)
    if (!Number.isFinite(n)) return t // el backend avisa
    return String(Math.round(n * 100) / 10000)
}
export const IgvService = {
    listar: async (): Promise<FilaIgv[]> => datos(await apiClient.get(I, cfg()), []),
    cuentas: async (): Promise<Opcion[]> => datos(await apiClient.get(`${I}/cuentas`, cfg()), []),
    guardar: async (f: FichaIgv) => datos(await apiClient.post(I, {
        id: f.id, tasa: porcentajeAFraccion(f.tasa), concepto: nulo(f.concepto), fechaInicio: f.fechaInicio || null, fechaFinal: f.fechaFinal || null,
        ctaDebito: f.ctaDebito || null, ctaCredito: f.ctaCredito || null,
    }, cfg()), null),
    eliminar: (id: number) => eliminar(`${I}/${id}`),
}

// ------------------------------------------------------------------ Año y Meses
const AM = '/contabilidad/anio-meses'
export const AnioMesesService = {
    anios: async (): Promise<FilaAnio[]> => datos(await apiClient.get(`${AM}/anios`, cfg()), []),
    crearAnio: async (anio: string) => datos(await apiClient.post(`${AM}/anios`, { anio: anio.trim() }, cfg()), null),
    eliminarAnio: (anio: string) => eliminar(`${AM}/anios/${encodeURIComponent(anio)}`),
    meses: async (): Promise<FilaMes[]> => datos(await apiClient.get(`${AM}/meses`, cfg()), []),
    guardarMes: async (numero: string, mes: string, dias: string) => datos(await apiClient.post(`${AM}/meses/${numero}`, { mes, dias }, cfg()), null),
}
