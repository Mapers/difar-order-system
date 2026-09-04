'use client'

import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import { evaluarVencimientoLote } from "@/app/utils/order-helpers"
import { useVencimientoCorto } from "@/app/hooks/useVencimientoCorto"

interface VencimientoCortoBadgeProps {
    fechaISO?: string | null
    className?: string
}

export function VencimientoCortoBadge({ fechaISO, className }: VencimientoCortoBadgeProps) {
    const mesesUmbral = useVencimientoCorto()
    const estado = evaluarVencimientoLote(fechaISO, mesesUmbral)

    if (!estado || !estado.corto) return null

    if (estado.vencido) {
        return (
            <Badge variant="outline" className={`bg-red-100 text-red-700 border-red-300 ${className ?? ''}`}>
                <AlertTriangle className="mr-1 h-3 w-3" />
                Vencido
            </Badge>
        )
    }

    const texto = estado.meses === 0
        ? 'Vence este mes'
        : `Vence en ${estado.meses} ${estado.meses === 1 ? 'mes' : 'meses'}`

    return (
        <Badge variant="outline" className={`bg-amber-100 text-amber-800 border-amber-300 ${className ?? ''}`}>
            <AlertTriangle className="mr-1 h-3 w-3" />
            {texto}
        </Badge>
    )
}
