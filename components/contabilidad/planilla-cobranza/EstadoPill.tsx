'use client'

import { Send, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import {EstadoPlanilla} from "@/app/types/planilla-types";

interface Props {
    estado: EstadoPlanilla | string
    size?: 'sm' | 'md'
}

const CONFIG: Record<string, {
    label:     string
    className: string
    dotClass:  string
    icon:      React.ReactNode
}> = {
    borrador: {
        label:     'Borrador',
        className: 'bg-slate-100 text-slate-600 border-slate-200',
        dotClass:  'bg-slate-500',
        icon:      <Clock className="h-3 w-3" />,
    },
    enviado: {
        label:     'Enviado',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass:  'bg-amber-500',
        icon:      <Send className="h-3 w-3" />,
    },
    validado: {
        label:     'Aprobado',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass:  'bg-emerald-500',
        icon:      <CheckCircle2 className="h-3 w-3" />,
    },
    rechazado: {
        label:     'Con observación',
        className: 'bg-red-50 text-red-600 border-red-200',
        dotClass:  'bg-red-500',
        icon:      <AlertCircle className="h-3 w-3" />,
    },
}

export default function EstadoPill({ estado, size = 'sm' }: Props) {
    const cfg = CONFIG[estado] ?? CONFIG.borrador
    return (
        <span
            className={`inline-flex items-center gap-1.5 font-semibold rounded-full border whitespace-nowrap
        ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}
        ${cfg.className}`}
        >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotClass}`} />
            {cfg.label}
    </span>
    )
}