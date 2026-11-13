/** Plan Contable — mantenimiento (/api/contabilidad/plan-cuentas). */

export interface OpcionCatalogo { id: number; nombre: string; codigo?: string }
export interface DestinoAmarre { id: number; codigo: string | null; nombre: string | null; cuentaPr: string | null; idCuenta: number | null }

export interface CatalogosPlan {
    tipos: OpcionCatalogo[]
    conceptos: OpcionCatalogo[]
    flujos: OpcionCatalogo[]
    /** cta_registros: 0 = "Si Registros", 1 = "No". */
    registros: OpcionCatalogo[]
    sunat: OpcionCatalogo[]
    destinosCargo: DestinoAmarre[]
    destinosAbono: DestinoAmarre[]
}

/** Ficha de la cuenta: los campos del form Access [Plan Contable]. */
export interface FichaCuenta {
    id: number | null
    codigo: string
    descripcion: string
    tipo: string
    conceptoEeff: string
    estadoFlujo: string
    amarreCargo: string
    amarreAbono: string
    caja: string
    bancos: string
    libroCaja: string
    libroBancos: string
    regCompras: string
    regVentas: string
    cuentaSunat: string
    fechaAlta: string
}

/** Dónde se usa una cuenta (alerta de eliminar). */
export interface UsoCuenta { tabla: string; descripcion: string; cantidad: number }

export type TipoMaestro = 'destino' | 'tipo-cuenta' | 'concepto-eeff' | 'cuenta-sunat'
