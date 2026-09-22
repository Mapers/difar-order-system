'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from "@/components/ui/command"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

// Combo con buscador (Popover + Command) para reemplazar un <Select> nativo
// cuando la lista puede beneficiarse de filtrado por texto. Mismo patrón
// visual usado en Tomar Pedido Alpha (condición de pago / moneda).
export function ComboSelect<T>({
    value,
    onChange,
    items,
    getKey,
    getLabel,
    placeholder = "Seleccionar...",
    searchPlaceholder = "Buscar...",
    emptyText = "Sin resultados",
    disabled = false,
    triggerClassName,
}: {
    value: string
    onChange: (item: T) => void
    items: T[]
    getKey: (item: T) => string
    getLabel: (item: T) => string
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    disabled?: boolean
    triggerClassName?: string
}) {
    const [open, setOpen] = useState(false)
    const selected = items.find(item => getKey(item) === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn("w-full justify-between font-normal", triggerClassName)}
                >
                    <span className="truncate">{selected ? getLabel(selected) : placeholder}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {items.map(item => (
                                <CommandItem
                                    key={getKey(item)}
                                    value={getLabel(item)}
                                    onSelect={() => {
                                        onChange(item)
                                        setOpen(false)
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", getKey(item) === value ? "opacity-100" : "opacity-0")} />
                                    {getLabel(item)}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
