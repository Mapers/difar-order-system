'use client'

import { useEffect, useRef, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Combo que busca en el servidor mientras se escribe (artículos, proveedores, clientes).
 * Muestra `etiqueta` cuando hay un valor elegido; al abrir, busca con lo que se escriba (mín. 2 letras).
 */
export function BuscadorRemoto<T>({
    etiqueta, placeholder, buscar, getKey, getLabel, getSub, onElegir, disabled, className,
}: {
    etiqueta: string
    placeholder: string
    buscar: (texto: string) => Promise<T[]>
    getKey: (item: T) => string
    getLabel: (item: T) => string
    getSub?: (item: T) => string
    onElegir: (item: T) => void
    disabled?: boolean
    className?: string
}) {
    const [abierto, setAbierto] = useState(false)
    const [texto, setTexto] = useState("")
    const [items, setItems] = useState<T[]>([])
    const [cargando, setCargando] = useState(false)
    const turno = useRef(0)

    useEffect(() => {
        if (!abierto) return
        const q = texto.trim()
        if (q.length < 2) { setItems([]); return }
        const mio = ++turno.current
        setCargando(true)
        const t = setTimeout(() => {
            buscar(q).then(r => { if (mio === turno.current) setItems(r) })
                .catch(() => { if (mio === turno.current) setItems([]) })
                .finally(() => { if (mio === turno.current) setCargando(false) })
        }, 300)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [texto, abierto])

    return (
        <Popover open={abierto} onOpenChange={(v) => { setAbierto(v); if (!v) setTexto("") }}>
            <PopoverTrigger asChild>
                <Button type="button" variant="outline" role="combobox" disabled={disabled}
                        className={cn("h-9 w-full justify-between px-2.5 font-normal", !etiqueta && "text-muted-foreground", className)}>
                    <span className="truncate text-left">{etiqueta || placeholder}</span>
                    <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[min(92vw,26rem)] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput placeholder="Escribe al menos 2 letras..." value={texto} onValueChange={setTexto} />
                    <CommandList>
                        {cargando && <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Buscando...</div>}
                        {!cargando && <CommandEmpty>{texto.trim().length < 2 ? "Escribe para buscar" : "Sin resultados"}</CommandEmpty>}
                        <CommandGroup>
                            {items.map(it => (
                                <CommandItem key={getKey(it)} value={getKey(it)} onSelect={() => { onElegir(it); setAbierto(false); setTexto("") }}>
                                    <div className="flex min-w-0 flex-col">
                                        <span className="truncate text-sm">{getLabel(it)}</span>
                                        {getSub && <span className="truncate text-[11px] text-muted-foreground">{getSub(it)}</span>}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
