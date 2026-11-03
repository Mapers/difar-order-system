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
    getSub,
    subEnBoton = true,
    placeholder = "Seleccionar...",
    searchPlaceholder = "Buscar...",
    emptyText = "Sin resultados",
    disabled = false,
    triggerClassName,
    contentClassName,
}: {
    value: string
    onChange: (item: T) => void
    items: T[]
    getKey: (item: T) => string
    getLabel: (item: T) => string
    /** Texto secundario (p. ej. la descripción de una cuenta): se ve al costado y también se busca. */
    getSub?: (item: T) => string
    /** Cómo se ve el texto secundario en el botón cerrado: al costado, debajo o no se ve. */
    subEnBoton?: boolean | 'debajo'
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    disabled?: boolean
    triggerClassName?: string
    /** Clases extra para la lista desplegable (p. ej. un ancho mínimo cuando el combo es angosto). */
    contentClassName?: string
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
                    title={selected && getSub ? `${getLabel(selected)} · ${getSub(selected)}` : undefined}
                    disabled={disabled}
                    className={cn("w-full justify-between font-normal", triggerClassName)}
                >
                    {selected && getSub && subEnBoton === 'debajo' ? (
                        <span className="flex min-w-0 flex-col items-start leading-tight">
                            <span className="max-w-full truncate">{getLabel(selected)}</span>
                            <span className="max-w-full truncate font-sans text-[10px] text-muted-foreground">{getSub(selected)}</span>
                        </span>
                    ) : (
                        <span className="min-w-0 truncate">
                            {selected ? getLabel(selected) : placeholder}
                            {selected && getSub && subEnBoton && <span className="ml-1.5 font-sans text-muted-foreground">{getSub(selected)}</span>}
                        </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className={cn("w-[var(--radix-popover-trigger-width)] p-0", contentClassName)}>
                {/* Con texto secundario se busca por contenido (código o descripción), no aproximado. */}
                <Command filter={getSub ? (valor, buscado) => (valor.toLowerCase().includes(buscado.trim().toLowerCase()) ? 1 : 0) : undefined}>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {items.map(item => (
                                <CommandItem
                                    key={getKey(item)}
                                    value={getSub ? `${getLabel(item)} ${getSub(item)}` : getLabel(item)}
                                    onSelect={() => {
                                        onChange(item)
                                        setOpen(false)
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", getKey(item) === value ? "opacity-100" : "opacity-0")} />
                                    {getSub ? (
                                        <span className="min-w-0">
                                            <span className="font-mono font-semibold">{getLabel(item)}</span>
                                            <span className="ml-2 text-muted-foreground">{getSub(item)}</span>
                                        </span>
                                    ) : getLabel(item)}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
