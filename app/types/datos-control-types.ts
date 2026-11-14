/** Datos Fijos › Datos de Control (Catálogos) — /api/contabilidad/datos-control */

export type ClaveCatalogo =
    | 'empresa' | 'caja' | 'tipo-documento' | 'doc-registro' | 'origen-documento' | 'cuenta-banco' | 'entidad-financiera'
    | 'tipo-operacion' | 'libro-contable' | 'tipo-voucher' | 'almacen' | 'moneda' | 'centro-costos' | 'unidad-negocio'
    | 'subunidad-negocio' | 'tipo-pago' | 'condicion' | 'modulo-trabajo' | 'situacion-mercaderia' | 'zona' | 'serie'
    | 'unidad-transporte' | 'chofer' | 'comision-cobranza'

/** Fila uniforme de sp_ws_contabilidad_datos_control_listar. */
export interface FilaCatalogo {
    id: string | number
    codigo: string | number | null
    descripcion: string | null
    abreviatura: string | number | null
    datos: Record<string, unknown>
}

export interface UsoRegistro { tabla: string; descripcion: string; cantidad: number }

export interface OpcionCombo { id?: number | string; codigo?: string | number; cuenta?: string; descripcion?: string }

/** Una fila JSON de sp_ws_contabilidad_datos_control_combos. */
export interface CombosDatosControl {
    monedas: OpcionCombo[]
    cuentasCaja: OpcionCombo[]
    cuentasBanco: OpcionCombo[]
    entidades: OpcionCombo[]
    docRegistros: OpcionCombo[]
    origenes: OpcionCombo[]
    clavesOp: OpcionCombo[]
    motivosOp: OpcionCombo[]
    efectivo: OpcionCombo[]
    unidadesNegocio: OpcionCombo[]
    domiciliosFiscales: OpcionCombo[]
    regimenes: OpcionCombo[]
    librosModulo: string[]
    siguienteCentroCostos: string | null
    siguienteZona: string | null
}

export type ClaveCombo = Exclude<keyof CombosDatosControl, 'librosModulo' | 'siguienteCentroCostos' | 'siguienteZona'>
