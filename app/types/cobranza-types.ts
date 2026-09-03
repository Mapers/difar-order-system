export type EstadoGestion = 'pendiente' | 'en_gestion' | 'promesa_pago' | 'incobrable'

export const ESTADOS_GESTION: { value: EstadoGestion; label: string }[] = [
    { value: 'pendiente',    label: 'Pendiente' },
    { value: 'en_gestion',   label: 'En gestión' },
    { value: 'promesa_pago', label: 'Promesa de pago' },
    { value: 'incobrable',   label: 'Incobrable' },
]

export const ESTADOS_FILTRO: { value: string; label: string }[] = [
    ...ESTADOS_GESTION,
    { value: 'vencido', label: 'Vencidas' },
    { value: 'pagado',  label: 'Pagadas' },
]

export const ETIQUETA_ESTADO: Record<string, string> = {
    pendiente:    'Pendiente',
    en_gestion:   'En gestión',
    promesa_pago: 'Promesa de pago',
    incobrable:   'Incobrable',
    pagado:       'Pagado',
    vencido:      'Vencido',
}

export interface FacturaPorAsignar {
    id_sunat:             number
    id_comprobante_cab:   number
    serie:                string
    numero:               string
    cliente_numdoc:       string | null
    cliente_denominacion: string | null
    fecha_vencimiento:    string | null
    fecha_emision:        string | null
    saldo:                number | string
    moneda:               number | null
    dias_credito:         number | null
    cod_vendedor:         string
    nombre_vendedor:      string
}

export interface CobranzaAsignada {
    id_asignacion:            number
    id_sunat:                 number
    serie:                    string
    numero:                   string
    cliente_numdoc:           string | null
    cliente_denominacion:     string | null
    fecha_vencimiento:        string | null
    monto_al_asignar:         number | string | null
    moneda:                   number | null
    cod_vendedor_original:    string | null
    cod_vendedor_asignado:    string
    nombre_vendedor_asignado: string | null
    fue_reasignada:           number
    estado_gestion:           EstadoGestion
    fecha_asignacion:         string
    semana_asignacion:        string | null
    saldo_actual:             number | string
    esta_pagado:              number
    esta_vencido:             number
    tiene_evidencia:          number
    total_comentarios:        number
    ultimo_comentario:        string | null
}

export interface ComentarioCobranza {
    id_comentario:      number
    texto:              string
    estado_al_comentar: string | null
    fecha_registro:     string
    usuario:            string | null
}

export interface EvidenciaCobranza {
    id_asignacion:  number
    ruta:           string
    nombre_archivo: string
    peso_bytes:     number | null
    fecha_mod:      string
    usuario:        string | null
}

export interface VendedorNotificar {
    codigo:          string
    nombre:          string
    telefono:        string | null
    telefono_usable: number
}

export const EVIDENCIA_MAX_BYTES = 5 * 1024 * 1024
export const EVIDENCIA_TIPOS = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf',
]

export const PAGINA_COBRANZA = 50

export function simboloMonedaCobranza(moneda: number | null | undefined) {
    return Number(moneda) === 2 ? 'US$' : 'S/'
}

export function estadoVisible(c: CobranzaAsignada): string {
    return Number(c.esta_pagado) === 1 ? 'pagado' : c.estado_gestion
}
