import apiClient from '@/app/api/client'
import { cabeceraSesion } from '@/app/api/sesion'
import { CatalogosPlan, FichaCuenta, TipoMaestro, UsoCuenta } from '@/app/types/plan-cuentas-types'

/**
 * Plan Contable — mantenimiento (/api/contabilidad/plan-cuentas).
 * La lista del plan sale del módulo de informes (reporte 'plan-cuentas', solo lectura).
 */
const BASE = '/contabilidad/plan-cuentas'
const cfg = () => ({ headers: cabeceraSesion() })

/** Ficha -> cuerpo del POST (números o vacío). */
const cuerpo = (f: FichaCuenta) => ({
    id: f.id, codigo: f.codigo, descripcion: f.descripcion, tipo: f.tipo, conceptoEeff: f.conceptoEeff, estadoFlujo: f.estadoFlujo,
    amarreCargo: f.amarreCargo || null, amarreAbono: f.amarreAbono || null,
    caja: f.caja, bancos: f.bancos, libroCaja: f.libroCaja, libroBancos: f.libroBancos, regCompras: f.regCompras, regVentas: f.regVentas,
    cuentaSunat: f.cuentaSunat || null, fechaAlta: f.fechaAlta || null,
})

export const PlanCuentasService = {
    catalogos: async (): Promise<CatalogosPlan> => (await apiClient.get(`${BASE}/catalogos`, cfg())).data?.data,

    uso: async (id: number): Promise<UsoCuenta[]> => (await apiClient.get(`${BASE}/${id}/uso`, cfg())).data?.data ?? [],

    guardar: async (f: FichaCuenta) => (await apiClient.post(BASE, cuerpo(f), cfg())).data?.data,

    /** Elimina; si la cuenta tiene movimientos el backend responde 409 con el detalle (no borra nada). */
    eliminar: async (id: number): Promise<{ eliminada: boolean; usos: UsoCuenta[] }> => {
        try {
            return (await apiClient.delete(`${BASE}/${id}`, cfg())).data?.data
        } catch (e: any) {
            if (e?.response?.status === 409) return e.response.data?.data ?? { eliminada: false, usos: [] }
            throw e
        }
    },

    guardarMaestro: async (tipo: TipoMaestro, datos: Record<string, unknown>) =>
        (await apiClient.post(`${BASE}/maestros/${tipo}`, datos, cfg())).data?.data,

    eliminarMaestro: async (tipo: TipoMaestro, id: number, lado?: 'CARGO' | 'ABONO') =>
        (await apiClient.delete(`${BASE}/maestros/${tipo}/${id}`, { ...cfg(), params: lado ? { lado } : undefined })).data?.data,
}
