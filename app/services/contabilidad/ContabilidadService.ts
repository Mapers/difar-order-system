import apiClient from '@/app/api/client'
import {
    CajaCatalogos,
    CajaDetallePayload,
    CajaVoucher,
    CajaVoucherResumen,
    PersonaEmpresa,
    SubcuentaContable,
    SubctaMvtoParams,
    SubctaMvtoReporte,
} from '@/app/types/contabilidad-types'

export const ContabilidadService = {
    listarSubcuentas: async (busqueda?: string): Promise<SubcuentaContable[]> => {
        const res = await apiClient.get('/contabilidad/subcuentas', {
            params: busqueda ? { busqueda } : undefined,
        })
        return res.data?.data?.data ?? []
    },

    reporteSubcuentaMovimiento: async (params: SubctaMvtoParams): Promise<SubctaMvtoReporte> => {
        const res = await apiClient.get('/contabilidad/rpt-subcuenta-mvto', { params })
        const body = res.data?.data ?? {}
        return {
            cabecera: body.cabecera ?? null,
            detalle:  body.detalle ?? [],
        }
    },
}

// ─── Libro Caja y Bancos ──────────────────────────────────────────────────────

export const CajaBancosService = {
    catalogos: async (): Promise<CajaCatalogos> => {
        const res = await apiClient.get('/contabilidad/caja/catalogos')
        const d = res.data?.data ?? {}

        const porTexto = (campo: string) => (a: any, b: any) =>
            String(a?.[campo] ?? '').localeCompare(String(b?.[campo] ?? ''), 'es')

        return {
            cajas:         [...(d.cajas ?? [])].sort(porTexto('Descripcion')),
            meses:         [...(d.meses ?? [])].sort(porTexto('Numero')),
            anios:         [...(d.anios ?? [])].sort(porTexto('Anio')),
            tiposDoc:      [...(d.tiposDoc ?? [])].sort(porTexto('Descripcion')),
            tiposPago:     [...(d.tiposPago ?? [])].sort(porTexto('Descripcion')),
            centrosCosto:  [...(d.centrosCosto ?? [])].sort(porTexto('Descripcion')),
            unidadesCosto: [...(d.unidadesCosto ?? [])].sort(porTexto('Descripcion')),
            conceptosCaja: [...(d.conceptosCaja ?? [])].sort(porTexto('caja_conceptos')),
            cuentas:       [...(d.cuentas ?? [])].sort(porTexto('Cod_Contab')),
            fechaCierre:   d.fechaCierre ?? null,
        }
    },

    buscarPersonas: async (busqueda: string): Promise<PersonaEmpresa[]> => {
        const res = await apiClient.get('/contabilidad/caja/personas', {
            params: busqueda ? { busqueda } : undefined,
        })
        return res.data?.data?.data ?? []
    },

    buscarVouchers: async (anio: string, mes?: string, caja?: number): Promise<CajaVoucherResumen[]> => {
        const res = await apiClient.get('/contabilidad/caja/vouchers', {
            params: { anio, mes: mes || undefined, caja: caja || undefined },
        })
        return res.data?.data?.data ?? []
    },

    obtenerVoucher: async (
        caja: number, fecha: string, usuario: number | null, crear: boolean,
    ): Promise<CajaVoucher> => {
        const res = await apiClient.get('/contabilidad/caja/voucher', {
            params: { caja, fecha, usuario: usuario ?? undefined, crear: crear ? 1 : 0 },
        })
        const d = res.data?.data ?? {}
        return { cabecera: d.cabecera ?? null, detalle: d.detalle ?? [] }
    },

    guardar: async (item: number, usuario: number | null, detalle: CajaDetallePayload[]) => {
        const res = await apiClient.post(`/contabilidad/caja/voucher/${item}/guardar`, { usuario, detalle })
        return res.data?.data ?? null
    },

    eliminarLineasMarcadas: async (item: number, usuario: number | null) => {
        const res = await apiClient.delete(`/contabilidad/caja/voucher/${item}/detalle`, {
            params: { usuario: usuario ?? undefined },
        })
        return res.data?.data ?? null
    },

    eliminarVoucher: async (item: number) => {
        const res = await apiClient.delete(`/contabilidad/caja/voucher/${item}`)
        return res.data?.data ?? null
    },
}
