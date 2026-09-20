'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { ChevronDown } from 'lucide-react'

// Envoltorio "acordeón" para los widgets de la sección única de Tomar
// Pedido Alpha: el header entero es el trigger, y el contenido (más un
// footer opcional, ej. el pie con el total y "Confirmar") se oculta al
// colapsar. Soporta modo controlado (open/onOpenChange, para que la página
// coordine "solo uno abierto a la vez" entre Cliente y Producto) y modo no
// controlado (defaultOpen, cada widget maneja su propio estado) cuando no
// se pasa `open`.
const ACCENTS = {
    blue: {
        badge: 'bg-blue-100 dark:bg-blue-900/40',
        icon: 'text-blue-600 dark:text-blue-400',
        title: 'text-blue-700 dark:text-blue-400',
        ring: 'from-blue-500 to-blue-400',
    },
    violet: {
        badge: 'bg-violet-100 dark:bg-violet-900/40',
        icon: 'text-violet-600 dark:text-violet-400',
        title: 'text-violet-700 dark:text-violet-400',
        ring: 'from-violet-500 to-violet-400',
    },
} as const

interface CollapsibleWidgetProps {
    icon: React.ComponentType<{ className?: string }>
    title: string
    badge?: React.ReactNode
    defaultOpen?: boolean
    footer?: React.ReactNode
    children: React.ReactNode
    /** Color de acento del widget — distingue Cliente (blue) de Producto
     * (violet) a simple vista, más allá del texto del título. */
    accent?: keyof typeof ACCENTS
    /** Modo controlado: si se pasa, el estado abierto/cerrado lo maneja
     * quien use el componente (ej. la página, para coordinar entre dos
     * widgets) en vez de manejarlo este componente internamente. */
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export default function CollapsibleWidget({
    icon: Icon, title, badge, defaultOpen = true, footer, children,
    accent = 'blue', open: openProp, onOpenChange,
}: CollapsibleWidgetProps) {
    const [internalOpen, setInternalOpen] = useState(defaultOpen)
    const isControlled = openProp !== undefined
    const open = isControlled ? openProp : internalOpen
    const colors = ACCENTS[accent]

    const toggle = () => {
        const next = !open
        if (isControlled) onOpenChange?.(next)
        else setInternalOpen(next)
    }

    return (
        <Card className="overflow-hidden shadow-md bg-background transition-shadow hover:shadow-lg">
            <div className={`h-1 bg-gradient-to-r ${colors.ring}`} />
            <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                className={`flex w-full items-center gap-2 bg-muted p-6 text-left transition-colors hover:bg-muted/70 ${open ? 'border-b' : ''}`}
            >
                <div className={`p-1.5 rounded-md shrink-0 ${colors.badge}`}>
                    <Icon className={`h-4 w-4 ${colors.icon}`} />
                </div>
                <CardTitle className={`text-lg font-semibold flex-1 truncate ${colors.title}`}>
                    {title}
                </CardTitle>
                {badge}
                <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <>
                    <CardContent className="space-y-5 pt-6 px-3 sm:px-6">
                        {children}
                    </CardContent>
                    {footer}
                </>
            )}
        </Card>
    )
}
