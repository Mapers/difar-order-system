'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { TEMAS_PDF } from './pdfOpciones'

// Controles de los modales de PDF (Movimiento Sub Cuenta, Registro de Compras, reportes).

export function Seccion({ icono: Icono, titulo, children }: { icono: React.ComponentType<{ className?: string }>; titulo: string; children: React.ReactNode }) {
    return (
        <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Icono className="h-3.5 w-3.5" /> {titulo}
            </h3>
            {children}
        </section>
    )
}

export function Opciones<T extends string>({ etiqueta, valor, onChange, opciones }: {
    etiqueta: string; valor: T; onChange: (v: T) => void; opciones: { v: T; t: string }[]
}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs">{etiqueta}</Label>
            <div className="flex rounded-lg border bg-muted p-0.5">
                {opciones.map(o => (
                    <button
                        key={o.v}
                        type="button"
                        onClick={() => onChange(o.v)}
                        className={cn(
                            'flex-1 rounded-md px-2 py-1.5 text-xs transition-colors',
                            valor === o.v ? 'bg-background font-semibold text-blue-700 shadow-sm dark:text-blue-400' : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {o.t}
                    </button>
                ))}
            </div>
        </div>
    )
}

export function Interruptor({ etiqueta, valor, onChange }: { etiqueta: string; valor: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
            {etiqueta}
            <Switch checked={valor} onCheckedChange={onChange} />
        </label>
    )
}

export function SelectorColor({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs">Color</Label>
            <div className="flex flex-wrap items-center gap-2">
                {TEMAS_PDF.map(t => (
                    <button
                        key={t.color}
                        type="button"
                        title={t.nombre}
                        onClick={() => onChange(t.color)}
                        className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition',
                            valor.toLowerCase() === t.color ? 'ring-2 ring-foreground/60' : 'hover:scale-110',
                        )}
                        style={{ backgroundColor: t.color }}
                    >
                        {valor.toLowerCase() === t.color && <Check className="h-4 w-4 text-white" />}
                    </button>
                ))}
                <label title="Otro color" className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-dashed text-xs text-muted-foreground">
                    +
                    <input type="color" value={valor} onChange={e => onChange(e.target.value)}
                           className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                </label>
            </div>
        </div>
    )
}
