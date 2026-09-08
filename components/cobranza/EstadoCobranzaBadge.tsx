'use client'

import { ETIQUETA_ESTADO } from '@/app/types/cobranza-types'

const COLORES: Record<string, string> = {
    pendiente:    'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400',
    en_gestion:   'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
    promesa_pago: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400',
    incobrable:   'bg-muted text-muted-foreground',
    pagado:       'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
}

export function EstadoCobranzaBadge({ estado }: { estado: string }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${
                COLORES[estado] ?? 'bg-muted text-muted-foreground'
            }`}
        >
            {ETIQUETA_ESTADO[estado] ?? estado}
        </span>
    )
}
