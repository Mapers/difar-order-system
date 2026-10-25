'use client'

import { useEffect, useMemo, useState } from 'react'

export type DireccionOrden = 'asc' | 'desc'

/** Cómo se ordena una lista: por qué valor de cada fila. */
export type Ordenes<T> = Record<string, (fila: T) => string | number | null | undefined>

/**
 * Pagina y ordena en pantalla una lista ya cargada. Es genérico: sirve para
 * cualquier tabla. Vuelve a la primera página cuando cambia la lista (por
 * ejemplo, al filtrar) o el tamaño de página.
 */
export function useTablaPaginada<T>(
    filas: T[],
    ordenes: Ordenes<T>,
    inicial: { orden: string; direccion?: DireccionOrden; tamano?: number },
) {
    const [orden, setOrden] = useState(inicial.orden)
    const [direccion, setDireccion] = useState<DireccionOrden>(inicial.direccion ?? 'asc')
    const [tamano, setTamano] = useState(inicial.tamano ?? 25)
    const [pagina, setPagina] = useState(1)

    useEffect(() => { setPagina(1) }, [filas, tamano])

    const ordenadas = useMemo(() => {
        const valor = ordenes[orden]
        if (!valor) return filas
        const signo = direccion === 'asc' ? 1 : -1
        return [...filas].sort((a, b) => {
            const va = valor(a), vb = valor(b)
            if (va == null || va === '') return 1
            if (vb == null || vb === '') return -1
            return (typeof va === 'number' && typeof vb === 'number'
                ? va - vb
                : String(va).localeCompare(String(vb), 'es', { numeric: true })) * signo
        })
    }, [filas, orden, direccion, ordenes])

    const totalPaginas = Math.max(1, Math.ceil(ordenadas.length / tamano))
    const paginaActual = Math.min(pagina, totalPaginas)
    const visibles = ordenadas.slice((paginaActual - 1) * tamano, paginaActual * tamano)

    /** Clic en una cabecera: ordena por esa columna o invierte el sentido. */
    const ordenarPor = (clave: string) => {
        if (clave === orden) setDireccion(d => (d === 'asc' ? 'desc' : 'asc'))
        else { setOrden(clave); setDireccion('asc') }
    }

    return {
        visibles, ordenadas, total: ordenadas.length,
        pagina: paginaActual, totalPaginas, setPagina,
        tamano, setTamano,
        orden, direccion, ordenarPor,
    }
}
