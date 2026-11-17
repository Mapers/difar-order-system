'use client'

import { useEffect, useRef, useState } from "react"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronsUpDown, Loader2, SearchX, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/** Resalta en el texto lo que se escribió (sin distinguir mayúsculas ni tildes). */
export function Resaltado({ texto, busqueda }: { texto: string; busqueda: string }) {
    const q = busqueda.trim()
    if (!q) return <>{texto}</>
    const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    const i = norm(texto).indexOf(norm(q))
    if (i < 0) return <>{texto}</>
    return <>{texto.slice(0, i)}<mark className="rounded bg-yellow-200 px-0.5 text-inherit dark:bg-yellow-700/60">{texto.slice(i, i + q.length)}</mark>{texto.slice(i + q.length)}</>
}

/**
 * Combo que busca en el servidor mientras se escribe (artículos, proveedores, clientes).
 * Con `icono` se ve como tarjeta (igual que Proveedor en Registro de Compras / Cliente en Cobranza).
 */
export function BuscadorRemoto<T>({
    etiqueta, placeholder, buscar, getKey, getLabel, getSub, getExtra, onElegir, disabled, className,
    icono: Icono, valor, subValor, descripcion, error,
}: {
    etiqueta: string
    placeholder: string
    buscar: (texto: string) => Promise<T[]>
    getKey: (item: T) => string
    getLabel: (item: T) => string
    getSub?: (item: T) => string
    /** Etiqueta pequeña a la derecha de cada resultado (p. ej. la unidad). */
    getExtra?: (item: T) => string
    onElegir: (item: T) => void
    disabled?: boolean
    className?: string
    icono?: LucideIcon
    valor?: string
    subValor?: string
    descripcion?: string
    error?: boolean
}) {
    const [abierto, setAbierto] = useState(false)
    const [texto, setTexto] = useState("")
    const [items, setItems] = useState<T[]>([])
    const [cargando, setCargando] = useState(false)
    const turno = useRef(0)

    useEffect(() => {
        if (!abierto) return
        const q = texto.trim()
        if (q.length < 2) { setItems([]); setCargando(false); return }
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

    const cambiarAbierto = (v: boolean) => { setAbierto(v); if (!v) { setTexto(""); setItems([]) } }
    const q = texto.trim()

    return (
        <Popover open={abierto} onOpenChange={cambiarAbierto}>
            {Icono && valor ? (
                <PopoverAnchor asChild>
                    <div className={cn("flex min-h-[52px] items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-2 transition-colors dark:border-blue-900 dark:bg-blue-950/40", error && "almacen-campo-error", className)}>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 shadow-sm shadow-blue-600/30"><Icono className="h-4 w-4 text-white" /></div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold leading-tight text-blue-900 dark:text-blue-100" title={valor}>{valor}</p>
                            {subValor && <p className="truncate font-mono text-xs text-blue-600 dark:text-blue-400">{subValor}</p>}
                        </div>
                        {!disabled && (
                            <PopoverTrigger asChild>
                                <Button type="button" size="sm" variant="outline" className="h-7 shrink-0 border-blue-200 bg-background px-2.5 text-xs text-blue-600 hover:bg-blue-100 dark:border-blue-900">Cambiar</Button>
                            </PopoverTrigger>
                        )}
                    </div>
                </PopoverAnchor>
            ) : Icono ? (
                <PopoverTrigger asChild>
                    <button type="button" role="combobox" aria-expanded={abierto} disabled={disabled}
                            className={cn("flex min-h-[52px] w-full items-center gap-2.5 rounded-xl border border-dashed border-border bg-background p-2 text-left transition-colors hover:border-blue-400 hover:bg-blue-50/50 disabled:opacity-60 dark:hover:bg-blue-950/20", error && "almacen-campo-error", className)}>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40"><Icono className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold leading-tight">Buscar {etiqueta}</p>
                            <p className="truncate text-xs text-muted-foreground">{descripcion ?? placeholder}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                </PopoverTrigger>
            ) : (
                <PopoverTrigger asChild>
                    <Button type="button" variant="outline" role="combobox" disabled={disabled} title={valor || placeholder}
                            className={cn("h-9 w-full justify-between bg-background px-2.5 font-normal shadow-sm", !valor && "text-muted-foreground", error && "almacen-campo-error", className)}>
                        <span className="truncate text-left">{valor || placeholder}</span>
                        <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
            )}

            <PopoverContent className="w-[min(94vw,30rem)] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput placeholder={`Buscar ${etiqueta.toLowerCase()} por código, RUC o nombre...`} value={texto} onValueChange={setTexto} />
                    <CommandList className="max-h-80">
                        {cargando && <div className="flex items-center gap-2 px-3 py-4 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Buscando...</div>}
                        {!cargando && q.length < 2 && <p className="px-3 py-4 text-center text-xs text-muted-foreground">Escribe al menos 2 letras o números.</p>}
                        {!cargando && q.length >= 2 && items.length === 0 && (
                            <div className="flex flex-col items-center gap-1 px-3 py-5 text-xs text-muted-foreground"><SearchX className="h-5 w-5" /> Sin resultados para “{q}”.</div>
                        )}
                        {!cargando && items.length > 0 && (
                            <CommandGroup heading={`${items.length} resultado${items.length === 1 ? '' : 's'}`}>
                                {items.map(it => (
                                    <CommandItem key={getKey(it)} value={getKey(it)} onSelect={() => { onElegir(it); cambiarAbierto(false) }} className="items-start gap-2 py-2">
                                        <div className="flex min-w-0 flex-1 flex-col">
                                            <span className="truncate text-sm font-medium"><Resaltado texto={getLabel(it)} busqueda={q} /></span>
                                            {getSub && <span className="truncate font-mono text-[11px] text-muted-foreground"><Resaltado texto={getSub(it)} busqueda={q} /></span>}
                                        </div>
                                        {getExtra && getExtra(it) && <span className="shrink-0 rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{getExtra(it)}</span>}
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
