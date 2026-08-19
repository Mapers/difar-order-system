'use client'

import { useState } from 'react'
import {
    Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import {
    Command, CommandEmpty, CommandGroup,
    CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { Check, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface OpcionAutocomplete {
    value: string
    label: string
    descripcion?: string
    extra?: string
}

interface Props {
    opciones: OpcionAutocomplete[]
    onSelect: (value: string) => void
    value?: string
    placeholder?: string
    buscarPlaceholder?: string
    vacio?: string
    cargando?: boolean
    disabled?: boolean
    className?: string
}

export function AutocompleteBuscador({
    opciones,
    onSelect,
    value,
    placeholder = 'Buscar…',
    buscarPlaceholder = 'Escribe para buscar…',
    vacio = 'Sin resultados.',
    cargando = false,
    disabled = false,
    className,
}: Props) {
    const [abierto, setAbierto] = useState(false)

    const seleccionada = value ? opciones.find(o => o.value === value) : undefined

    const etiqueta = cargando
        ? 'Cargando…'
        : seleccionada
            ? [seleccionada.label, seleccionada.descripcion].filter(Boolean).join(' — ')
            : placeholder

    return (
        <Popover open={abierto} onOpenChange={setAbierto}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    role="combobox"
                    aria-expanded={abierto}
                    disabled={disabled || cargando}
                    className={cn(
                        'flex w-full items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50',
                        className
                    )}
                >
                    <span className={cn('truncate', !seleccionada && 'text-[#b9c4dd]')}>
                        {etiqueta}
                    </span>
                    {cargando
                        ? <Loader2 className="h-4 w-4 shrink-0 animate-spin opacity-50" />
                        : <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />}
                </button>
            </PopoverTrigger>

            <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[280px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={buscarPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{vacio}</CommandEmpty>
                        <CommandGroup>
                            {opciones.map(o => (
                                <CommandItem
                                    key={o.value}
                                    value={`${o.label} ${o.descripcion ?? ''} ${o.extra ?? ''}`}
                                    onSelect={() => {
                                        onSelect(o.value)
                                        setAbierto(false)
                                    }}
                                    className="flex items-start gap-2"
                                >
                                    <Check
                                        className={cn(
                                            'mt-0.5 h-4 w-4 shrink-0',
                                            value === o.value ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />

                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate font-medium">{o.label}</span>
                                        {o.descripcion && (
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {o.descripcion}
                                            </span>
                                        )}
                                    </span>

                                    {o.extra && (
                                        <span className="shrink-0 whitespace-nowrap text-xs font-semibold tabular-nums">
                                            {o.extra}
                                        </span>
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
