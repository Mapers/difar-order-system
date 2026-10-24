'use client'

import { Sparkles } from 'lucide-react'

/** Avatar de IVAN; con `activo` gira un anillo de color mientras trabaja. */
export function AvatarIvan({ activo = false, tamano = 'md' }: { activo?: boolean; tamano?: 'sm' | 'md' | 'lg' }) {
    const lado = { sm: 'h-7 w-7', md: 'h-8 w-8', lg: 'h-10 w-10' }[tamano]
    const icono = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' }[tamano]
    return (
        <span className={`relative inline-flex shrink-0 items-center justify-center rounded-full ${lado}`}>
            {activo && <span className="ivan-anillo absolute inset-0 rounded-full" />}
            <span className={`relative flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-blue-600 to-sky-500 text-white shadow-sm ${activo ? 'm-[2px] h-[calc(100%-4px)] w-[calc(100%-4px)]' : 'h-full w-full'}`}>
                <Sparkles className={icono} />
            </span>
        </span>
    )
}
