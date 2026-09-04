import type { ProblemaStock, ResumenStock } from "@/components/comprobantes/StockInsuficienteDialog"

export interface ErrorStock {
    mensaje: string
    resumen: ResumenStock | null
    detalle: ProblemaStock[]
}

export function leerErrorStock(error: any): ErrorStock | null {
    const cuerpo = error?.response?.data
    if (!cuerpo || cuerpo.success !== false) return null

    const data = cuerpo.data
    if (!data || !Array.isArray(data.detalle)) return null

    return {
        mensaje: cuerpo.message || 'El pedido no tiene stock suficiente',
        resumen: data.resumen ?? null,
        detalle: data.detalle as ProblemaStock[],
    }
}
