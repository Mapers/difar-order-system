'use client'

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { Loader2, X } from "lucide-react"
import { CajaBancosService } from "@/app/services/contabilidad/ContabilidadService"
import { PersonaEmpresa } from "@/app/types/contabilidad-types"

export function PersonaPicker({
    codigo, nombre, disabled = false, onSelect,
}: {
    codigo: string
    nombre: string
    disabled?: boolean
    onSelect: (codigo: string, nombre: string) => void
}) {
    const [open, setOpen] = useState(false)
    const [busqueda, setBusqueda] = useState("")
    const [items, setItems] = useState<PersonaEmpresa[]>([])
    const [cargando, setCargando] = useState(false)

    useEffect(() => {
        if (!open) return
        setCargando(true)
        const t = setTimeout(async () => {
            try {
                setItems(await CajaBancosService.buscarPersonas(busqueda))
            } catch {
                setItems([])
            } finally {
                setCargando(false)
            }
        }, 350)
        return () => clearTimeout(t)
    }, [busqueda, open])

    const etiqueta = nombre || codigo

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    title={etiqueta || 'Elegir persona o empresa'}
                    className="h-7 w-full justify-start px-2 text-xs font-normal"
                >
                    <span className={`truncate ${etiqueta ? '' : 'text-muted-foreground'}`}>
                        {etiqueta || '— elegir —'}
                    </span>
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[360px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Buscar por nombre o código..."
                        value={busqueda}
                        onValueChange={setBusqueda}
                    />
                    <CommandList>
                        {cargando && (
                            <div className="flex items-center gap-2 px-3 py-4 text-xs text-muted-foreground">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Buscando...
                            </div>
                        )}

                        {!cargando && items.length === 0 && (
                            <CommandEmpty>No se encontraron personas ni empresas</CommandEmpty>
                        )}

                        {!cargando && (
                            <CommandGroup>
                                {codigo && (
                                    <CommandItem
                                        value="__limpiar__"
                                        onSelect={() => { onSelect('', ''); setOpen(false) }}
                                        className="text-muted-foreground"
                                    >
                                        <X className="mr-2 h-3.5 w-3.5" />
                                        Dejar la línea sin persona
                                    </CommandItem>
                                )}
                                {items.map(p => (
                                    <CommandItem
                                        key={p.Codigo}
                                        value={p.Codigo}
                                        onSelect={() => { onSelect(p.Codigo, p.Nombre); setOpen(false) }}
                                    >
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-medium truncate">{p.Nombre}</span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {p.Codigo}
                                                {p.RelacionDescripcion ? ` · ${p.RelacionDescripcion}` : ''}
                                            </span>
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
