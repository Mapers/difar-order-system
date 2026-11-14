'use client'

import { useCallback, useState } from 'react'
import { InformesContablesService, mensajeError, parametrosDe } from '@/app/services/contabilidad/InformesContablesService'
import { ClaveReporte, FilaInforme, FiltroExtra, FiltroInforme, TipoFiltro } from '@/app/types/informes-contables-types'

/**
 * Estado y carga de un reporte. Desacopla la UI del servicio HTTP.
 * Si la consulta falla, el motivo queda en `aviso` y la página lo muestra como aviso ámbar
 * (validación), no como error rojo.
 */
export function useInforme() {
    const [filas, setFilas] = useState<FilaInforme[] | null>(null)
    const [cargando, setCargando] = useState(false)
    const [consulta, setConsulta] = useState<{ clave: ClaveReporte; filtro: FiltroInforme } | null>(null)
    const [aviso, setAviso] = useState<string | null>(null)

    const cargar = useCallback(async (clave: ClaveReporte, tipo: TipoFiltro, filtro: FiltroInforme, extras: FiltroExtra[] = []) => {
        setCargando(true)
        setAviso(null)
        try {
            const r = await InformesContablesService.reporte(clave, parametrosDe(tipo, filtro, extras))
            setFilas(r?.filas ?? [])
            setConsulta({ clave, filtro })
            return r?.filas ?? []
        } catch (e) {
            setFilas(null)
            setAviso(await mensajeError(e, 'No se pudo cargar el informe. Revisa los filtros e intenta nuevamente.'))
            return null
        } finally {
            setCargando(false)
        }
    }, [])

    const limpiar = useCallback(() => { setFilas(null); setConsulta(null); setAviso(null) }, [])

    return { filas, cargando, consulta, cargar, limpiar, aviso, setAviso }
}
