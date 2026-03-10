export interface Sequential {
    id: number
    nombre: string
    tipo?: string
    descripcion: string
    prefijo: string
    valorActual: number
    fechaMod: string
    usuMod: string
    activo: boolean
}

export interface AppConfig {
    id_config: number
    cod_apl: string
    cod_config: string
    llave_config: string
    desc_corta: string
    desc_larga: string
    est_config: string
}

export const DOCUMENT_TYPES = [
    { value: "1", label: "Factura" },
    { value: "3", label: "Boleta" },
    { value: "7", label: "Nota de Crédito" },
    { value: "8", label: "Nota de Débito" },
]