import apiClient from '@/app/api/client'
import { cabeceraSesion } from '@/app/api/sesion'
import {
    ComboItem,
    ComisionCobranzaDetalle,
    ComisionCobranzaResumen,
    ComisionVentaDetalle,
    ComisionVentaResumen,
    EscalaCobranza,
    ComisionLaboratorios,
} from '@/app/types/comisiones-types'

/** Módulo de comisiones (solo lectura): /api/comisiones/ventas y /api/comisiones/cobranza. */
export const ComisionesService = {
    // Ventas
    ventasResumen: async (anio: string, mes: string, vendedor?: string): Promise<ComisionVentaResumen> => {
        const res = await apiClient.get('/comisiones/ventas', { params: { anio, mes, vendedor: vendedor || undefined }, headers: cabeceraSesion() })
        return res.data?.data
    },
    ventasDetalle: async (anio: string, mes: string, vendedor: string): Promise<ComisionVentaDetalle> => {
        const res = await apiClient.get('/comisiones/ventas/detalle', { params: { anio, mes, vendedor }, headers: cabeceraSesion() })
        return res.data?.data
    },
    /** Global por laboratorio. Filtros opcionales: vendedor, producto, cliente. */
    ventasLaboratorios: async (anio: string, mes: string, f: { vendedor?: string; producto?: string; cliente?: string } = {}): Promise<ComisionLaboratorios> => {
        const res = await apiClient.get('/comisiones/ventas/laboratorios', {
            params: { anio, mes, vendedor: f.vendedor || undefined, producto: f.producto || undefined, cliente: f.cliente || undefined },
            headers: cabeceraSesion(),
        })
        return res.data?.data
    },
    vendedores: async (): Promise<ComboItem[]> => {
        const res = await apiClient.get('/comisiones/ventas/combos', { params: { tipo: 'VENDEDOR' }, headers: cabeceraSesion() })
        return res.data?.data ?? []
    },

    // Cobranza
    cobranzaResumen: async (anio: string, mes: string, vendedor?: string): Promise<ComisionCobranzaResumen> => {
        const res = await apiClient.get('/comisiones/cobranza', { params: { anio, mes, vendedor: vendedor || undefined }, headers: cabeceraSesion() })
        return res.data?.data
    },
    cobranzaDetalle: async (anio: string, mes: string, vendedor: string): Promise<ComisionCobranzaDetalle> => {
        const res = await apiClient.get('/comisiones/cobranza/detalle', { params: { anio, mes, vendedor }, headers: cabeceraSesion() })
        return res.data?.data
    },
    escalas: async (): Promise<EscalaCobranza[]> => {
        const res = await apiClient.get('/comisiones/cobranza/escalas', { headers: cabeceraSesion() })
        return res.data?.data ?? []
    },
}
