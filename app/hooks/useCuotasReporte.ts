"use client"

import { useCallback, useEffect, useState } from "react"
import { MetasService } from "@/app/services/reports/metasService"

export interface CuotaItem {
    cod_articulo:  string
    /** Vienen del SP para poder nombrar los productos con cuota y sin ventas. */
    nombre_item:   string
    abrev_unidad:  string
    meta_cantidad: number
    meta_monto:    number
    precio_ref:    number
}

/** Clave de los mapas: `${idLineaGe}|${codVendedor}`. */
const clave = (idLineaGe: number | string, codVendedor: string) => `${idLineaGe}|${codVendedor}`

/**
 * Cuotas del reporte "Ventas por Vendedor".
 *
 * No hay SPs nuevos: las cuotas ya viven en pbl_meta_laboratorio_vendedor_item
 * con la granularidad exacta que hace falta (ciclo, laboratorio, vendedor,
 * artículo), y sp_pbl_meta_lab_listar / sp_pbl_meta_vend_listar /
 * sp_pbl_meta_item_listar_por_vend ya las exponen. El reporte trae anio y mes,
 * que es la clave de pbl_meta_ciclo, así que el período mapea directo.
 *
 * Se cargan las cuotas de TODO EL CICLO, no las de los laboratorios que
 * aparecen en el reporte. Es deliberado: un laboratorio con meta y cero ventas
 * no está en la respuesta del reporte, que sale del kardex, y es justamente el
 * caso que hay que mostrar (meta asignada, 0% de avance). Si la carga se
 * limitara a los laboratorios con ventas, esa cuota sería invisible y el total
 * quedaría corto.
 *
 * El cruce se hace en el front y no dentro de los SPs del reporte para que los
 * tres exportadores reciban los datos ya cruzados sin duplicar la lógica del
 * semáforo ni del porcentaje.
 */
export function useCuotasReporte(anio: number, mes: number) {
    const [idCiclo, setIdCiclo] = useState<number | null>(null)
    const [cicloResuelto, setCicloResuelto] = useState(false)
    const [loading, setLoading] = useState(false)
    const [cuotaVendedor, setCuotaVendedor] = useState<Map<string, number>>(new Map())
    const [cuotasItems, setCuotasItems] = useState<Map<string, CuotaItem[]>>(new Map())

    // Ciclo del período. Sin ciclo cargado no hay cuota posible, y eso NO es lo
    // mismo que una cuota en cero: la UI lo tiene que decir distinto.
    useEffect(() => {
        let vivo = true
        setCicloResuelto(false)
        setIdCiclo(null)
        setCuotaVendedor(new Map())
        setCuotasItems(new Map())

        MetasService.listarCiclos()
            .then(res => {
                if (!vivo) return
                const lista = res?.data?.data || res?.data || []
                const ciclo = lista.find((c: any) => Number(c.anio) === anio && Number(c.mes) === mes)
                setIdCiclo(ciclo ? Number(ciclo.id_ciclo) : null)
            })
            .catch(e => { console.error("Error cargando ciclos de metas:", e) })
            .finally(() => { if (vivo) setCicloResuelto(true) })

        return () => { vivo = false }
    }, [anio, mes])

    // Mapa completo de cuotas del ciclo: (laboratorio, vendedor) -> soles.
    //
    // Se arma una sola vez por período, no por búsqueda. Primero
    // sp_pbl_meta_lab_listar dice qué laboratorios tienen metas cargadas —así
    // no se consulta el catálogo entero— y después se piden los vendedores de
    // cada uno.
    useEffect(() => {
        if (idCiclo === null) { setCuotaVendedor(new Map()); return }

        let vivo = true
        setLoading(true)

        MetasService.listarMetasLab(idCiclo)
            .then(res => {
                const labs = (res?.data?.data || res?.data || []) as any[]
                const idsConMeta = labs
                    .filter(l => Number(l.meta_monto) > 0)
                    .map(l => Number(l.id_linea_ge))
                    .filter(n => Number.isFinite(n))

                return Promise.all(
                    idsConMeta.map(id =>
                        MetasService.listarMetasVend(idCiclo, id)
                            .then(r => ({ id, filas: (r?.data?.data || r?.data || []) as any[] }))
                            .catch(() => ({ id, filas: [] as any[] }))
                    )
                )
            })
            .then(respuestas => {
                if (!vivo) return
                const mapa = new Map<string, number>()
                for (const { id, filas } of respuestas) {
                    for (const f of filas) {
                        const monto = Number(f.meta_monto) || 0
                        // sp_pbl_meta_vend_listar devuelve TODOS los vendedores
                        // de mvendedores por LEFT JOIN; los que no tienen meta
                        // vienen en 0 y no aportan nada.
                        if (monto > 0) mapa.set(clave(id, f.cod_vendedor), monto)
                    }
                }
                setCuotaVendedor(mapa)
            })
            .catch(e => { console.error("Error cargando cuotas por vendedor:", e) })
            .finally(() => { if (vivo) setLoading(false) })

        return () => { vivo = false }
    }, [idCiclo])

    /** Cuotas por artículo de un (laboratorio, vendedor) (R2.1). */
    const cargarCuotasItems = useCallback(async (idLineaGe: number, codVendedor: string): Promise<CuotaItem[]> => {
        if (idCiclo === null) return []
        try {
            const r = await MetasService.listarMetasItemPorVend(idCiclo, idLineaGe, codVendedor)
            const filas = r?.data?.data || r?.data || []
            const items: CuotaItem[] = filas.map((f: any) => ({
                cod_articulo:  String(f.cod_articulo),
                nombre_item:   f.NombreItem ?? '',
                abrev_unidad:  f.AbrevUnidMed ?? '',
                meta_cantidad: Number(f.meta_cantidad) || 0,
                meta_monto:    Number(f.meta_monto) || 0,
                precio_ref:    Number(f.precio_ref) || 0,
            }))
            setCuotasItems(prev => new Map(prev).set(clave(idLineaGe, codVendedor), items))
            return items
        } catch (e) {
            console.error("Error cargando cuotas por ítem:", e)
            return []
        }
    }, [idCiclo])

    const cuotasDeItems = useCallback(
        (idLineaGe: number, codVendedor: string): CuotaItem[] =>
            cuotasItems.get(clave(idLineaGe, codVendedor)) ?? [],
        [cuotasItems]
    )

    return {
        idCiclo,
        /** false mientras se resuelve, y también cuando el período no tiene ciclo. */
        hayCiclo: cicloResuelto && idCiclo !== null,
        cicloResuelto,
        loading,
        cuotaVendedor,
        cargarCuotasItems,
        cuotasDeItems,
    }
}
