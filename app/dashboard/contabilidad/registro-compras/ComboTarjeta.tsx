'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { Check, ChevronRight, type LucideIcon } from "lucide-react"

/**
 * Combo con el mismo formato que Cliente Cobranza: sin elegir es una tarjeta
 * (ícono + título + descripción + flecha); ya elegido pasa a la tarjeta azul
 * con el valor, su código y el botón "Cambiar". La lista trae buscador.
 */
export function ComboTarjeta<T>({
    value, items, getKey, getLabel, getSub, onChange,
    icono: Icono, titulo, descripcion, disabled = false,
}: {
    value: string
    items: T[]
    getKey: (item: T) => string
    getLabel: (item: T) => string
    getSub?: (item: T) => string
    onChange: (item: T) => void
    icono: LucideIcon
    titulo: string
    descripcion: string
    disabled?: boolean
}) {
    const [open, setOpen] = useState(false)
    const elegido = items.find(x => getKey(x) === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            {elegido ? (
                <PopoverAnchor asChild>
                    <div className="flex min-h-[50px] items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-2 dark:border-blue-900 dark:bg-blue-950/40">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
                            <Icono className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold leading-tight text-blue-900 dark:text-blue-100" title={getLabel(elegido)}>
                                {getLabel(elegido)}
                            </p>
                            {getSub && (
                                <p className="truncate font-mono text-xs text-blue-600 dark:text-blue-400">{getSub(elegido)}</p>
                            )}
                        </div>
                        {!disabled && (
                            <PopoverTrigger asChild>
                                <Button type="button" size="sm" variant="outline"
                                        className="h-7 shrink-0 border-blue-200 bg-background px-2.5 text-xs text-blue-600 hover:bg-blue-100 dark:border-blue-900">
                                    Cambiar
                                </Button>
                            </PopoverTrigger>
                        )}
                    </div>
                </PopoverAnchor>
            ) : (
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        className="flex min-h-[50px] w-full items-center gap-2.5 rounded-xl border border-border bg-background p-2 text-left transition-colors hover:border-blue-400 hover:bg-blue-50/50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:border-blue-500 dark:hover:bg-blue-950/20"
                    >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                            <Icono className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold leading-tight text-foreground">{titulo}</p>
                            <p className="truncate text-xs text-muted-foreground">{descripcion}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                </PopoverTrigger>
            )}

            <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-[240px] p-0">
                <Command>
                    <CommandInput placeholder={`Buscar ${titulo.replace(/^Elegir /, '').toLowerCase()}...`} />
                    <CommandList>
                        <CommandEmpty>Sin resultados</CommandEmpty>
                        <CommandGroup>
                            {items.map(x => {
                                const k = getKey(x)
                                return (
                                    <CommandItem
                                        key={k}
                                        value={`${getLabel(x)} ${getSub?.(x) ?? ''} ${k}`}
                                        onSelect={() => { onChange(x); setOpen(false) }}
                                        className="p-0"
                                    >
                                        <div className="flex w-full items-center gap-3 px-3 py-2">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                                                <Icono className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-foreground">{getLabel(x)}</p>
                                                {getSub && <p className="truncate font-mono text-xs text-muted-foreground">{getSub(x)}</p>}
                                            </div>
                                            {k === value && <Check className="h-4 w-4 shrink-0 text-blue-600" />}
                                        </div>
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
