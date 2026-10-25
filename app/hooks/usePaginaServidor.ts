'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import apiClient from '@/app/api/client'
import { toast } from '@/app/hooks/useToast'

export type PaginaServidor<T, R> = {
    data: T[]
    total: number
    pagina: number
    totalPaginas: number
    tamano: number
    resumen: R | null
}

/**
 * Pide una página a un endpoint paginado en el servidor y la vuelve a pedir
 * cuando cambian los parámetros. Genérico para cualquier listado: el servidor
 * filtra, ordena, pagina y resume; aquí solo se pinta la página recibida.
 * Si llega una respuesta de una consulta anterior, se descarta.
 */
export function usePaginaServidor<T, R>(ruta: string, params: Record<string, string | number | undefined>, mensajeError: string) {
    const [estado, setEstado] = useState<PaginaServidor<T, R>>({ data: [], total: 0, pagina: 1, totalPaginas: 1, tamano: 25, resumen: null })
    const [cargando, setCargando] = useState(false)
    const ultima = useRef(0)

    const clave = JSON.stringify(params)

    const pedir = useCallback(async (extra?: Record<string, string>) => {
        const limpios = Object.fromEntries(
            Object.entries({ ...JSON.parse(clave), ...extra }).filter(([, v]) => v !== undefined && v !== ''),
        ) as Record<string, string>
        const res = await apiClient.get(`${ruta}?${new URLSearchParams(limpios)}`)
        return res.data?.data ?? {}
    }, [ruta, clave])

    const recargar = useCallback(async () => {
        const id = ++ultima.current
        setCargando(true)
        try {
            const d = await pedir()
            if (id !== ultima.current) return
            setEstado({
                data: d.data ?? [], total: d.total ?? 0, pagina: d.pagina ?? 1,
                totalPaginas: d.totalPaginas ?? 1, tamano: d.tamano ?? 25, resumen: d.resumen ?? null,
            })
        } catch (error) {
            if (id !== ultima.current) return
            console.error(mensajeError, error)
            toast({ title: '', description: mensajeError, variant: 'error' })
        } finally {
            if (id === ultima.current) setCargando(false)
        }
    }, [pedir, mensajeError])

    useEffect(() => { recargar() }, [recargar])

    /** Todas las filas del filtro actual, sin paginar (para "seleccionar todo"). */
    const todasDelFiltro = useCallback(async (): Promise<T[]> => {
        try {
            const d = await pedir({ seleccion: '1' })
            return d.data ?? []
        } catch (error) {
            toast({ title: '', description: mensajeError, variant: 'error' })
            return []
        }
    }, [pedir, mensajeError])

    return { ...estado, cargando, recargar, todasDelFiltro }
}
