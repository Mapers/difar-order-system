'use client'

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { Loader2, X } from "lucide-react"

export function BuscadorRemoto<T>({
    etiqueta, buscar, getKey, getTitulo, getSubtitulo,
    valor, disabled = false, onSelect, onLimpiar, ancho = 'w-[380px]',
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
