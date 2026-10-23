'use client'

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { ChevronRight, Loader2, X, type LucideIcon } from "lucide-react"

export function BuscadorRemoto<T>({
    etiqueta, buscar, getKey, getTitulo, getSubtitulo,
    valor, disabled = false, onSelect, onLimpiar, ancho = 'w-[380px]',
    icono: Icono, descripcion, subValor,
}: {
    etiqueta: string
    buscar: (q: string) => Promise<T[]>
    getKey: (item: T) => string
    getTitulo: (item: T) => string
    getSubtitulo?: (item: T) => string
    valor: string
    disabled?: boolean
    onSelect: (item: T) => void
    onLimpiar?: () => void
    ancho?: string
    /** Con ícono se muestra como tarjeta (mismo formato que Cliente Cobranza). */
    icono?: LucideIcon
    descripcion?: string
    subValor?: string
}) {
    const [open, setOpen] = useState(false)
    const [q, setQ] = useState("")
    const [items, setItems] = useState<T[]>([])
    const [cargando, setCargando] = useState(false)

    useEffect(() => {
        if (!open) return
        setCargando(true)
        const t = setTimeout(async () => {
            try { setItems(await buscar(q)) } catch { setItems([]) } finally { setCargando(false) }
        }, 350)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q, open])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            {Icono && valor ? (
                <PopoverAnchor asChild>
                    <div className="flex min-h-[50px] items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-2 dark:border-blue-900 dark:bg-blue-950/40">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
                            <Icono className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold leading-tight text-blue-900 dark:text-blue-100" title={valor}>{valor}</p>
                            {subValor && <p className="truncate font-mono text-xs text-blue-600 dark:text-blue-400">{subValor}</p>}
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
            ) : Icono ? (
                <PopoverTrigger asChild>
                    <button
                        type="button" role="combobox" aria-expanded={open} disabled={disabled}
                        className="flex min-h-[50px] w-full items-center gap-2.5 rounded-xl border border-border bg-background p-2 text-left transition-colors hover:border-blue-400 hover:bg-blue-50/50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:border-blue-500 dark:hover:bg-blue-950/20"
                    >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                            <Icono className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold leading-tight text-foreground">Buscar {etiqueta}</p>
                            <p className="truncate text-xs text-muted-foreground">{descripcion}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                </PopoverTrigger>
            ) : (
                <PopoverTrigger asChild>
                <Button
                    type="button" variant="outline" disabled={disabled}
                    title={valor || etiqueta}
                    className="h-8 w-full justify-start px-2 text-xs font-normal"
                >
                    <span className={`truncate ${valor ? '' : 'text-muted-foreground'}`}>
                        {valor || `— ${etiqueta} —`}
                    </span>
                </Button>
            </PopoverTrigger>

            )}

            <PopoverContent className={`${ancho} p-0`} align="start">
                <Command shouldFilter={false}>
                    <CommandInput placeholder={`Buscar ${etiqueta.toLowerCase()}...`} value={q} onValueChange={setQ} />
                    <CommandList>
                        {cargando && (
                            <div className="flex items-center gap-2 px-3 py-4 text-xs text-muted-foreground">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Buscando...
                            </div>
                        )}
                        {!cargando && items.length === 0 && <CommandEmpty>Sin resultados</CommandEmpty>}
                        {!cargando && (
                            <CommandGroup>
                                {onLimpiar && valor && (
                                    <CommandItem
                                        value="__limpiar__"
                                        onSelect={() => { onLimpiar(); setOpen(false) }}
                                        className="text-muted-foreground"
                                    >
                                        <X className="mr-2 h-3.5 w-3.5" /> Quitar
                                    </CommandItem>
                                )}
                                {items.map(it => (
                                    <CommandItem
                                        key={getKey(it)} value={getKey(it)}
                                        onSelect={() => { onSelect(it); setOpen(false) }}
                                    >
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-medium truncate">{getTitulo(it)}</span>
                                            {getSubtitulo && (
                                                <span className="text-[10px] text-muted-foreground truncate">
                                                    {getSubtitulo(it)}
                                                </span>
                                            )}
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
