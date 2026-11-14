import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Aviso en ámbar (nunca rojo): validaciones, registros en uso y respuestas del SP. */
export function AvisoAmbar({ titulo, children, className }: { titulo?: string; children?: React.ReactNode; className?: string }) {
    return (
        <div role="alert" className={cn('flex gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200', className)}>
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div className="min-w-0 space-y-1">
                {titulo && <p className="font-medium">{titulo}</p>}
                {children && <div className="text-[13px] leading-snug">{children}</div>}
            </div>
        </div>
    )
}
