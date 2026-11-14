'use client'

import React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Aviso ámbar de validación (falta un filtro, el servidor rechazó un valor...). No es un error rojo. */
export function AvisoInforme({ texto, onCerrar, className }: { texto: string | null; onCerrar?: () => void; className?: string }) {
    if (!texto) return null
    return (
        <div role="status"
             className={cn('flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800',
                 'dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300 animate-in fade-in-0 slide-in-from-top-1 duration-300', className)}>
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="flex-1">{texto}</span>
            {onCerrar && (
                <button type="button" onClick={onCerrar} aria-label="Cerrar aviso" className="shrink-0 opacity-70 hover:opacity-100">
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}
