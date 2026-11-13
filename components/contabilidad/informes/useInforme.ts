'use client'

import { useCallback, useState } from 'react'
import { toast } from '@/app/hooks/useToast'
import { InformesContablesService, mensajeError, parametrosDe } from '@/app/services/contabilidad/InformesContablesService'
import { ClaveReporte, FilaInforme, FiltroInforme, TipoFiltro } from '@/app/types/informes-contables-types'

/** Estado y carga de un reporte. Desacopla la UI del servicio HTTP. */
export function useInforme() {
    const [filas, setFilas] = useState<FilaInforme[] | null>(null)
    const [cargando, setCargando] = useState(false)
    const [consulta, setConsulta] = useState<{ clave: ClaveReporte; filtro: FiltroInforme } | null>(null)

    const cargar = useCallback(async (clave: ClaveReporte, tipo: TipoFiltro, filtro: FiltroInforme) => {
        setCargando(true)
        try {
            const r = await InformesContablesService.reporte(clave, parametrosDe(tipo, filtro))
            setFilas(r?.filas ?? [])
            setConsulta({ clave, filtro })
            return r?.filas ?? []
        } catch (e) {
            setFilas(null)
            toast({ title: 'No se pudo cargar el informe', description: await mensajeError(e, 'Intenta nuevamente.'), variant: 'destructive' })
            return null
        } finally {
            setCargando(false)
        }
    }, [])

    const limpiar = useCallback(() => { setFilas(null); setConsulta(null) }, [])

    return { filas, cargando, consulta, cargar, limpiar }
}
