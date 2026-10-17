import moment from 'moment'
import { PriceService } from '@/app/services/price/PriceService'
import { datosPorAlmacen, DatosExport } from '@/app/dashboard/lista-precios-lote/services/almacenesExport'

/** Los filtros de la pantalla que también aplican al export por vencer. */
export interface FiltrosPantalla {
    excludeNoStock: boolean
    lowStockThreshold: string
    searchTerm: string
    selectedPrinciple: string
}

/** Desde hoy hasta la misma fecha dentro de N meses, ambos días incluidos. */
export function rangoVencimiento(meses: number, hoy: moment.Moment = moment()) {
    return {
        desde: hoy.clone().startOf('day'),
        hasta: hoy.clone().add(meses, 'months').endOf('day'),
    }
}

/**
 * Deja en cada producto solo los lotes que vencen dentro de los próximos N
 * meses y saca los productos que se quedan sin lotes. lotes_raw se reescribe
 * con los segmentos que pasan, así los generadores de Excel y PDF no cambian.
 *
 * Los lotes ya vencidos y los que no tienen fecha no entran.
 */
export function filtrarPorVencer(items: any[], meses: number, filtros: FiltrosPantalla, hoy?: moment.Moment): any[] {
    const { desde, hasta } = rangoVencimiento(meses, hoy)
    const stockEscaso = Number(filtros.lowStockThreshold)
    const q = filtros.searchTerm?.toLowerCase()

    return items.flatMap(item => {
        const stockProducto = Number(item.kardex_saldoCant)
        if (filtros.excludeNoStock && !(stockProducto > 0)) return []
        if (stockEscaso > 0 && !(stockProducto < stockEscaso)) return []
        if (filtros.selectedPrinciple && item.prod_principio !== filtros.selectedPrinciple) return []
        if (q && !(
            item.prod_codigo?.toLowerCase().includes(q)
            || item.prod_descripcion?.toLowerCase().includes(q)
            || item.prod_principio?.toLowerCase().includes(q)
        )) return []

        const lotes = String(item.lotes_raw ?? '').split(';').filter(seg => {
            const [, fecha, stock] = seg.split('|')
            const vcto = moment(fecha, 'YYYY-MM-DD')
            if (!fecha || !vcto.isValid()) return false
            if (vcto.isBefore(desde) || vcto.isAfter(hasta)) return false
            // El stock por lote puede no venir (SP viejo): en ese caso manda
            // el filtro por stock del producto de arriba.
            if (filtros.excludeNoStock && stock !== undefined && stock !== '' && !(Number(stock) > 0)) return false
            return true
        })

        return lotes.length > 0 ? [{ ...item, lotes_raw: lotes.join(';') }] : []
    })
}

/**
 * Trae los productos para el export por vencer con los mismos criterios de
 * almacén que los botones de Excel y PDF. Devuelve null si no queda nada.
 */
export async function obtenerDatosPorVencer({ payload, meses, filtros, porAlmacen, almacenSel }: {
    payload: any
    meses: number
    filtros: FiltrosPantalla
    porAlmacen: boolean
    almacenSel: number | null
}): Promise<DatosExport | null> {
    const filtrar = (items: any[]) => filtrarPorVencer(items, meses, filtros)

    if (porAlmacen || almacenSel != null) {
        const grupos = await datosPorAlmacen(payload, filtrar, almacenSel != null ? [almacenSel] : null)
        return grupos.length > 0 ? { grupos } : null
    }

    const response = await PriceService.getPricesAll(payload)
    const data = filtrar(response.data || [])
    return data.length > 0 ? { data } : null
}
