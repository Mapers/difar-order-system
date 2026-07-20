import { CheckCircle2, XCircle, AlertCircle, Clock, type LucideIcon } from "lucide-react"

export const ESTADOS_SUNAT = {
    '101': 'EN PROCESO',
    '102': 'ACEPTADO',
    '103': 'ACEPTADO CON OBSERVACION',
    '104': 'RECHAZADO',
    '105': 'ANULADO',
    '108': 'SOLICITUD DE BAJA',
} as const

export type CodigoSunat = keyof typeof ESTADOS_SUNAT

export interface EstadoSunatConfig {
    label: string
    descripcion: string
    badgeClass: string
    cellBg: string
    textColor: string
    iconClass: string
    Icon: LucideIcon
}

const CONFIG: Record<CodigoSunat, EstadoSunatConfig> = {
    '101': {
        label: 'En proceso',
        descripcion: 'EN PROCESO',
        badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
        cellBg: 'bg-amber-50',
        textColor: 'text-amber-700',
        iconClass: 'text-amber-600',
        Icon: Clock,
    },
    '102': {
        label: 'Aceptado',
        descripcion: 'ACEPTADO',
        badgeClass: 'bg-green-100 text-green-800 border-green-200',
        cellBg: 'bg-green-50',
        textColor: 'text-green-700',
        iconClass: 'text-green-600',
        Icon: CheckCircle2,
    },
    '103': {
        label: 'Observado',
        descripcion: 'ACEPTADO CON OBSERVACIÓN',
        badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
        cellBg: 'bg-blue-50',
        textColor: 'text-blue-700',
        iconClass: 'text-blue-600',
        Icon: AlertCircle,
    },
    '104': {
        label: 'Rechazado',
        descripcion: 'RECHAZADO',
        badgeClass: 'bg-red-100 text-red-700 border-red-200',
        cellBg: 'bg-red-50',
        textColor: 'text-red-700',
        iconClass: 'text-red-600',
        Icon: XCircle,
    },
    '105': {
        label: 'Anulado',
        descripcion: 'ANULADO',
        badgeClass: 'bg-red-100 text-red-700 border-red-200',
        cellBg: 'bg-red-50',
        textColor: 'text-red-700',
        iconClass: 'text-red-600',
        Icon: XCircle,
    },
    '108': {
        label: 'Baja pendiente',
        descripcion: 'SOLICITUD DE BAJA',
        badgeClass: 'bg-muted text-muted-foreground border-border',
        cellBg: 'bg-muted',
        textColor: 'text-muted-foreground',
        iconClass: 'text-muted-foreground',
        Icon: Clock,
    },
}

const DESCONOCIDO: EstadoSunatConfig = {
    label: 'Desconocido',
    descripcion: 'DESCONOCIDO',
    badgeClass: 'bg-muted text-muted-foreground border-border',
    cellBg: 'bg-muted',
    textColor: 'text-muted-foreground',
    iconClass: 'text-muted-foreground',
    Icon: AlertCircle,
}

const DESTACABLES: readonly string[] = ['101', '103', '104', '105', '108']

function normalizar(codigo: string | number | null | undefined): string | null {
    if (codigo === null || codigo === undefined) return null
    const limpio = String(codigo).trim()
    return limpio === '' ? null : limpio
}

export function getEstadoSunatConfig(
    codigo: string | number | null | undefined
): EstadoSunatConfig | null {
    const clave = normalizar(codigo)
    if (clave === null) return null
    return CONFIG[clave as CodigoSunat] ?? DESCONOCIDO
}

export function getEstadoSunatDestacable(
    codigo: string | number | null | undefined
): EstadoSunatConfig | null {
    const clave = normalizar(codigo)
    if (clave === null || !DESTACABLES.includes(clave)) return null
    return CONFIG[clave as CodigoSunat] ?? null
}
