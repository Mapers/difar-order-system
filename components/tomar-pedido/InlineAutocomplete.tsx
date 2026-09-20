'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Search, Loader2, Plus, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Skeleton } from '@/components/ui/skeleton'

// Combobox compacto: botón chico que abre un popover con buscador, en vez
// de un input siempre expandido (que se veía como una caja de texto
// grande). Mismo patrón que ya usa "Condición de Pago" / "Moneda" en este
// módulo (Popover + Command), para que Cliente/Vendedor/Producto se vean
// consistentes con el resto de los selectores de la app.
interface InlineAutocompleteProps<T> {
    value: string
    onValueChange: (value: string) => void
    items: T[]
    loading?: boolean
    disabled?: boolean
    placeholder?: string
    label?: string
    getKey: (item: T) => string
    onSelect: (item: T) => void
    renderItem: (item: T) => React.ReactNode
    getItemLabel: (item: T) => string
    isItemDisabled?: (item: T) => boolean
    emptyMessage?: string
    idleMessage?: string
    /** 'tile' (por defecto): tarjeta-acción completa (ícono + título +
     * descripción + flecha) — se lee como una acción de la app, no como un
     * campo de formulario. Para el campo principal del widget (Cliente,
     * Producto). 'full': botón tipo input con ícono de lupa (variante
     * anterior, se deja disponible por si hace falta en otro lado). 'chip':
     * pastilla chica tipo "+ Agregar", para campos opcionales/secundarios
     * (Vendedor, Laboratorio) que no deben competir visualmente con el
     * campo principal. */
    variant?: 'tile' | 'full' | 'chip'
    chipLabel?: string
    /** Ícono, título y descripción del tile (para variant='tile'). La
     * descripción reemplaza a `placeholder` como subtítulo de la tarjeta;
     * `placeholder` sigue siendo el placeholder real del input de búsqueda
     * una vez abierto el popover. */
    tileIcon?: React.ComponentType<{ className?: string }>
    tileTitle?: string
    tileDescription?: string
    /** Color de acento del tile, para que combine con el widget que lo
     * contiene (Cliente=blue, Producto=violet). */
    tileAccent?: 'blue' | 'violet'
    /** Cuando pasa a true, enfoca el botón disparador (ej. apenas se
     * selecciona el cliente, para que el siguiente paso lógico —buscar
     * producto— quede a un Enter/Espacio de distancia sin tocar el mouse). */
    focusTrigger?: boolean
    /** Si `items` puede ser grande (ej. todos los clientes cuando la
     * búsqueda está vacía), limita cuántos se renderizan de entrada y va
     * sumando de a `pageSize` más al llegar al final del scroll — sin esto,
     * el navegador se traba tratando de montar miles de filas de una. */
    pageSize?: number
}

export default function InlineAutocomplete<T>({
    value, onValueChange, items, loading = false, disabled = false,
    placeholder = 'Buscar...', label, getKey, onSelect, renderItem,
    isItemDisabled, emptyMessage = 'No se encontraron resultados',
    idleMessage = 'Escribe para buscar', variant = 'tile', chipLabel,
    tileIcon: TileIcon, tileTitle, tileDescription, tileAccent = 'blue', focusTrigger = false,
    pageSize,
}: InlineAutocompleteProps<T>) {
    const [open, setOpen] = useState(false)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const tileColors = tileAccent === 'violet'
        ? { hoverBorder: 'hover:border-violet-400 dark:hover:border-violet-500', hoverBg: 'hover:bg-violet-50/50 dark:hover:bg-violet-950/20', badge: 'bg-violet-100 dark:bg-violet-900/40', icon: 'text-violet-600 dark:text-violet-400' }
        : { hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-500', hoverBg: 'hover:bg-blue-50/50 dark:hover:bg-blue-950/20', badge: 'bg-blue-100 dark:bg-blue-900/40', icon: 'text-blue-600 dark:text-blue-400' }

    useEffect(() => {
        if (focusTrigger) triggerRef.current?.focus()
    }, [focusTrigger])

    const [visibleCount, setVisibleCount] = useState(pageSize ?? items.length)
    const observerRef = useRef<IntersectionObserver | null>(null)

    useEffect(() => {
        setVisibleCount(pageSize ?? items.length)
    }, [value, pageSize, items.length])

    // Callback ref (no useRef+useEffect): corre cada vez que el div
    // centinela se monta o desmonta, incluyendo cuando reaparece tras haber
    // cargado todo y luego cambiar la búsqueda.
    const sentinelRef = useCallback((node: HTMLDivElement | null) => {
        observerRef.current?.disconnect()
        if (!node || !pageSize) return
        observerRef.current = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) {
                setVisibleCount((prev) => Math.min(prev + pageSize, items.length))
            }
        })
        observerRef.current.observe(node)
    }, [pageSize, items.length])

    const visibleItems = pageSize ? items.slice(0, visibleCount) : items

    return (
        <div>
            {label && variant !== 'tile' && (
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">{label}</label>
            )}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    {variant === 'chip' ? (
                        <button
                            ref={triggerRef}
                            type="button"
                            role="combobox"
                            aria-expanded={open}
                            disabled={disabled}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-blue-400 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60 dark:hover:border-blue-500"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            {chipLabel ?? placeholder}
                        </button>
                    ) : variant === 'tile' ? (
                        <button
                            ref={triggerRef}
                            type="button"
                            role="combobox"
                            aria-expanded={open}
                            disabled={disabled}
                            className={`flex w-full items-center gap-3 rounded-xl border border-border bg-background p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${tileColors.hoverBorder} ${tileColors.hoverBg}`}
                        >
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tileColors.badge}`}>
                                {TileIcon && <TileIcon className={`h-5 w-5 ${tileColors.icon}`} />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-foreground">{tileTitle}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {loading ? 'Cargando...' : tileDescription}
                                </p>
                            </div>
                            {loading ? (
                                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                            ) : (
                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                        </button>
                    ) : (
                        <Button
                            ref={triggerRef}
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            disabled={disabled}
                            className="w-full justify-start h-11 px-3 text-left font-normal text-sm hover:border-blue-400 dark:hover:border-blue-500"
                        >
                            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="truncate text-muted-foreground font-normal">{placeholder}</span>
                        </Button>
                    )}
                </PopoverTrigger>
                <PopoverContent
                    align="start"
                    className={variant === 'chip' ? 'w-80 p-0' : 'w-[var(--radix-popover-trigger-width)] p-0'}
                >
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder={placeholder}
                            value={value}
                            onValueChange={onValueChange}
                            autoFocus
                        />
                        <CommandList>
                            {loading ? (
                                <div className="space-y-2 p-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2.5">
                                            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                                            <div className="flex-1 space-y-1.5">
                                                <Skeleton className="h-3.5 w-3/5 rounded" />
                                                <Skeleton className="h-3 w-2/5 rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : items.length === 0 ? (
                                <CommandEmpty>{value ? emptyMessage : idleMessage}</CommandEmpty>
                            ) : (
                                <CommandGroup>
                                    {visibleItems.map((item) => {
                                        const itemDisabled = isItemDisabled?.(item) ?? false
                                        return (
                                            <CommandItem
                                                key={getKey(item)}
                                                value={getKey(item)}
                                                disabled={itemDisabled}
                                                onSelect={() => {
                                                    if (itemDisabled) return
                                                    onSelect(item)
                                                    setOpen(false)
                                                }}
                                                className="p-0"
                                            >
                                                {renderItem(item)}
                                            </CommandItem>
                                        )
                                    })}
                                    {pageSize && visibleCount < items.length && (
                                        <div ref={sentinelRef} className="py-3 text-center text-xs text-muted-foreground">
                                            Cargando más…
                                        </div>
                                    )}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}
