import apiClient from '@/app/api/client'
import { cabeceraSesion } from '@/app/api/sesion'
import {
    ArchivoSunat, ClaveArchivo, ClaveReporte, FiltroExtra, FiltroInforme, ProveedorBusqueda, RespuestaReporte, TipoFiltro,
} from '@/app/types/informes-contables-types'

/**
 * Informes Contables (/api/contabilidad/informes). Solo lectura.
 * Único punto del front que conoce las URLs del módulo: los componentes usan este servicio.
 */
const BASE = '/contabilidad/informes'

/** Parámetros que se envían según el filtro del reporte. */
export function parametrosDe(filtro: TipoFiltro, f: FiltroInforme, extras: FiltroExtra[] = []): Record<string, string> {
    const p: Record<string, string> =
        filtro === 'rango' ? { fechaDesde: f.fechaDesde, fechaHasta: f.fechaHasta }
            : filtro === 'fecha' ? { fechaCorte: f.fechaCorte ?? '' }
            : filtro === 'anio' ? { anio: f.anio }
                : filtro === 'ninguno' ? {}
                    : { anio: f.anio, mes: f.mes }
    const poner = (k: string, v?: string) => { if (v && v.trim()) p[k] = v.trim() }
    if (extras.includes('proveedor') || extras.includes('proveedor-obligatorio')) poner('codProveedor', f.codProveedor)
    if (extras.includes('documento')) poner('documento', f.documento)
    if (extras.includes('tipo-doc')) poner('tipoDoc', f.tipoDoc)
    if (extras.includes('buscar')) poner('buscar', f.buscar)
    if (extras.includes('nivel')) poner('nivel', f.nivel)
    if (extras.includes('cuenta')) poner('cuenta', f.cuenta)
    return p
}

/** Nombre de archivo de la cabecera Content-Disposition. */
function nombreDe(cabeceras: Record<string, any>, porDefecto: string): string {
    const directo = cabeceras['x-archivo-nombre']
    if (directo) return String(directo)
    const m = /filename="?([^";]+)"?/i.exec(String(cabeceras['content-disposition'] || ''))
    return m ? m[1] : porDefecto
}

export const InformesContablesService = {
    /** Buscador de proveedores para los filtros (reporte auxiliar del catálogo). */
    buscarProveedores: async (texto: string): Promise<ProveedorBusqueda[]> => {
        const res = await apiClient.get(`${BASE}/reportes/proveedores-buscar`, { params: { buscar: texto }, headers: cabeceraSesion() })
        return res.data?.data?.filas ?? []
    },

    reporte: async (clave: ClaveReporte, params: Record<string, string>): Promise<RespuestaReporte> => {
        const res = await apiClient.get(`${BASE}/reportes/${clave}`, { params, headers: cabeceraSesion() })
        return res.data?.data
    },

    /** Archivo TXT de PLE o SIRE. ids solo para los anexos SIRE 12 y 8 (documentos elegidos). */
    archivo: async (formato: ClaveArchivo, anio: string, mes: string, ids?: number[]): Promise<ArchivoSunat> => {
        const config = { headers: cabeceraSesion(), responseType: 'blob' as const }
        const res = ids
            ? await apiClient.post(`${BASE}/archivos/${formato}`, { anio, mes, ids }, config)
            : await apiClient.get(`${BASE}/archivos/${formato}`, { ...config, params: { anio, mes } })
        return {
            nombre: nombreDe(res.headers, `${formato}-${anio}${mes}.txt`),
            lineas: Number(res.headers['x-archivo-lineas'] ?? 0),
            indicador: Number(res.headers['x-archivo-indicador'] ?? 0),
            blob: res.data,
        }
    },
}

/** Descarga un Blob con su nombre. */
export function descargarBlob(blob: Blob, nombre: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nombre
    a.click()
    URL.revokeObjectURL(url)
}

/** Mensaje de error del backend (también cuando la respuesta es un Blob, como en los archivos). */
export async function mensajeError(e: any, porDefecto: string): Promise<string> {
    const data = e?.response?.data
    if (data instanceof Blob) {
        try { return JSON.parse(await data.text())?.message || porDefecto } catch { return porDefecto }
    }
    return data?.message || porDefecto
}
