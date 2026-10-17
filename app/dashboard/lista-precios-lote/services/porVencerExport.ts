import moment from 'moment'
import { PriceService } from '@/app/services/price/PriceService'
import { datosPorAlmacen, DatosExport } from '@/app/dashboard/lista-precios-lote/services/almacenesExport'

export interface FiltroPorVencer {
    meses: number
    incluirVencidos: boolean
    excluirSinStock: boolean
    /** null = no se filtra por stock escaso */
    stockEscaso: number | null
}

/** Desde hoy hasta la misma fecha dentro de N meses, ambos días incluidos. */
export function rangoVencimiento(meses: number, hoy: moment.Moment = moment()) {
    return {
        desde: hoy.clone().startOf('day'),
        hasta: hoy.clone().add(meses, 'months').endOf('day'),
    }
}

/**
 * Deja en cada producto solo los lotes que vencen dentro del rango, y saca
 * los productos que se quedan sin lotes. lotes_raw se reescribe con los
 * segmentos que pasan, así los generadores de Excel y PDF no cambian.
 *
 * Un lote sin fecha de vencimiento no entra: no se puede decir que vence.
 */
export function filtrarPorVencer(items: any[], f: FiltroPorVencer, hoy?: moment.Moment): any[] {
    const { desde, hasta } = rangoVencimiento(f.meses, hoy)

    return items.flatMap(item => {
        const stockProducto = Number(item.kardex_saldoCant)
        if (f.excluirSinStock && !(stockProducto > 0)) return []
        if (f.stockEscaso != null && !(stockProducto < f.stockEscaso)) return []

        const lotes = String(item.lotes_raw ?? '').split(';').filter(seg => {
            const [, fecha, stock] = seg.split('|')
            const vcto = moment(fecha, 'YYYY-MM-DD')
            if (!fecha || !vcto.isValid()) return false
            if (vcto.isAfter(hasta)) return false
            if (!f.incluirVencidos && vcto.isBefore(desde)) return false
            // El stock por lote puede no venir (SP viejo): en ese caso manda
            // el filtro por stock del producto de arriba.
            if (f.excluirSinStock && stock !== undefined && stock !== '' && !(Number(stock) > 0)) return false
            return true
        })

        return lotes.length > 0 ? [{ ...item, lotes_raw: lotes.join(';') }] : []
    })
}

/**
 * Trae los productos para el export por vencer.
 *
 * - Separado por almacén: un grupo por almacén (los elegidos, o todos).
 * - Sin separar y con almacenes elegidos: se juntan en una sola lista, así
 *   que un producto aparece una vez por cada almacén donde tenga lotes.
 * - Sin separar y sin almacenes: la lista general, como el export normal.
 *
 * Devuelve null si no queda nada que exportar.
 */
export async function obtenerDatosPorVencer({ laboratorios, almacenes, separarPorAlmacen, filtro }: {
    laboratorios: number[]
    almacenes: number[]
    separarPorAlmacen: boolean
    filtro: FiltroPorVencer
}): Promise<DatosExport | null> {
    const payload = { descripcion: '', laboratorio: laboratorios.join(',') }
    const filtrar = (items: any[]) => filtrarPorVencer(items, filtro)

    if (separarPorAlmacen || almacenes.length > 0) {
        const grupos = await datosPorAlmacen(payload, filtrar, almacenes.length > 0 ? almacenes : null)
        if (grupos.length === 0) return null
        if (separarPorAlmacen) return { grupos }

        // Al juntar almacenes se reordena por laboratorio para que el export
        // no repita la banda de un mismo laboratorio varias veces.
        const data = grupos
            .flatMap(g => g.data)
            .sort((a, b) =>
                String(a.laboratorio_Descripcion ?? '').localeCompare(String(b.laboratorio_Descripcion ?? ''))
                || String(a.prod_descripcion ?? '').localeCompare(String(b.prod_descripcion ?? '')))
        return { data }
    }

    const response = await PriceService.getPricesAll(payload)
    const data = filtrar(response.data || [])
    return data.length > 0 ? { data } : null
}
