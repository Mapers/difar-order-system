'use client'

import { ETIQUETA_ESTADO } from '@/app/types/cobranza-types'

const COLORES: Record<string, string> = {
    pendiente:    'bg-amber-50 text-amber-700',
    en_gestion:   'bg-blue-50 text-blue-700',
    promesa_pago: 'bg-purple-50 text-purple-700',
    incobrable:   'bg-muted text-muted-foreground',
    pagado:       'bg-emerald-50 text-emerald-700',
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
