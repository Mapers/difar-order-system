'use client'

import { useEffect, useMemo } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Lock } from "lucide-react"
import { Comprobante } from "@/app/types/order/order-interface"
import { Sequential } from "@/app/types/config-types"

interface SerieNCFieldProps {
    /** Comprobante origen. Su serie determina la serie de la NC. */
    comprobante: Comprobante
    /** Todas las series, sin filtrar. El filtro por tipo NC se hace acá. */
    series:      Sequential[]
    /** Recibe `prefijo|tipo`, o "" si no hay serie NC para el origen. */
    onResolve:   (value: string) => void
    error?:      string
}

export function SerieNCField({ comprobante, series, onResolve, error }: SerieNCFieldProps) {
    const serieNC = useMemo(
        () => series.find(
            s => (s.tipo === '07' || s.tipo === '7') && s.prefijo === comprobante.serie
        ),
        [series, comprobante.serie]
    )

    const value = serieNC ? `${serieNC.prefijo}|${serieNC.tipo}` : ""

    useEffect(() => { onResolve(value) }, [value])

    return (
        <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                Serie NC
                <Lock className="h-3 w-3 text-amber-600" />
                <span className="text-amber-600 normal-case font-normal">(bloqueado)</span>
            </Label>
            <Input
                readOnly
                value={serieNC ? `${serieNC.prefijo} - ${serieNC.nombre || 'Nota de Crédito'}` : ""}
                placeholder="—"
                className={`bg-muted text-muted-foreground ${!serieNC ? 'border-red-400' : ''}`}
            />
            {serieNC
                ? <p className="text-[11px] text-muted-foreground">
                    Heredada del comprobante {comprobante.serie}-{comprobante.numero}
                  </p>
                : <p className="text-xs text-red-500">
                    No existe serie de NC configurada para {comprobante.serie} — contacte con administración
                  </p>
            }
            {error && serieNC && <p className="text-xs text-red-500">{error}</p>}
        </div>
    )
}
