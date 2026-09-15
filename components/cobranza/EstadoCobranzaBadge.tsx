'use client'

import { AlertCircle } from 'lucide-react'
import { ETIQUETA_ESTADO } from '@/app/types/cobranza-types'

const COLORES: Record<string, string> = {
    pendiente:    'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400',
    en_gestion:   'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
    promesa_pago: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400',
    incobrable:   'bg-muted text-muted-foreground',
    pagado:       'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
    vencido:      'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400',
}

export function EstadoCobranzaBadge({ estado, alerta }: { estado: string; alerta?: string | null }) {
    return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                    COLORES[estado] ?? 'bg-muted text-muted-foreground'
                }`}
            >
                {ETIQUETA_ESTADO[estado] ?? estado}
            </span>
            {alerta && (
                <span title={alerta} aria-label={alerta} className="inline-flex shrink-0">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
                </span>
            )}
        </span>
    )
}
