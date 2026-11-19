import apiClient from '@/app/api/client'

/**
 * Actualización Contable (Access › FORMULARIO DE ACTUALIZACION · actContable), versión web de SOLO LECTURA.
 * Compara lo que grabaría el botón "guardar" del Access con lo que hay en las tablas; no borra ni graba.
 * Backend: /api/contabilidad/actualizacion-contable/* (sesión + permiso del menú; el token lo pone client.ts).
 */
export type BloqueClave = 'bcos' | 'caja' | 'diar' | 'clie' | 'prov'
export type EstadoDiferencia = 'DUPLICADO' | 'FALTA' | 'SOBRA' | 'IMPORTE_DISTINTO'

export interface Bloque { clave: BloqueClave; nombre: string; consultas: number }

export interface FilaResumen {
    consulta: string
    tabla_destino: string
    modulo: string | null
    esperado_filas: number
    real_filas: number
    esperado_importe: number
    real_importe: number
    ok: number
    duplicados: number
    faltantes: number
    sobrantes: number
    importe_distinto: number
    origen_web: number
}

export interface FilaDetalle {
    consulta: string
    tabla_destino: string
    estado: EstadoDiferencia
    clave: string | null
    ids_reales: string | null
    id_original: number | null
    ids_sobrantes: string | null
    esperado_filas: number
    real_filas: number
    esperado_importe: number
    real_importe: number
    cod_persona: string | null
    nombre_persona: string | null
    documento: string | null
    cuenta: string | null
    fecha: string | null
    mes: string | null
    voucher: string | number | null
}

export interface Totales { consultas: number; ok: number; duplicados: number; faltantes: number; sobrantes: number; importe_distinto: number; origen_web: number; conDiferencias: number }

export interface ResultadoBloque {
    bloque: { clave: BloqueClave; nombre: string }
    anio: string
    resumen: FilaResumen[]
    totales: Totales
    detalle: FilaDetalle[]
    ms: number
}

export interface FilaAlcance { tabla: string; modulo: string | null; filas: number; importe: number; se_regenera: string; nota: string | null }

const base = '/contabilidad/actualizacion-contable'

export const ActualizacionContableService = {
    async bloques(): Promise<{ empresa: string; bloques: Bloque[] }> {
        const { data } = await apiClient.get(`${base}/bloques`)
        return data.data
    },
    async revisar(bloque: BloqueClave, anio: number): Promise<ResultadoBloque> {
        // Cada bloque recorre el año completo: puede tardar varios segundos.
        const { data } = await apiClient.get(`${base}/${bloque}/revisar`, { params: { anio }, timeout: 180000 })
        return data.data
    },
    /** Arreglar: el backend vuelve a revisar y acepta solo las copias que siguen duplicadas. */
    async repararPreparar(anio: number, bloque: BloqueClave, seleccion: { tabla: string; id: number }[]): Promise<{ token: string; lotes: number; total: number; porTabla: { tabla: string; filas: number; backup: string }[]; rechazadas: number }> {
        const { data } = await apiClient.post(`${base}/reparar/preparar`, { anio, bloque, seleccion }, { timeout: 180000 })
        return data.data
    },
    /** Un lote: copia al backup y recién después borra (todo o nada). */
    async repararEjecutar(token: string, lote: number): Promise<{ lote: number; de: number; tabla: string; respaldadas: number; eliminadas: number; yaNoExistian: number; tablaBackup: string; loteBackup: string }> {
        const { data } = await apiClient.post(`${base}/reparar/ejecutar`, { token, lote }, { timeout: 180000 })
        return data.data
    },
    async alcanceElimina(anio: number): Promise<{ anio: string; filas: FilaAlcance[]; resumen: { totalFilas: number; filasQueNoVuelven: number } }> {
        const { data } = await apiClient.get(`${base}/alcance-elimina`, { params: { anio }, timeout: 180000 })
        return data.data
    },
}
