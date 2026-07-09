'use client'

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { X, ChevronDown } from "lucide-react"

export interface OptionItem {
    value: string
    label: string
}

interface MultiSelectFilterProps {
    options: OptionItem[]
    selected: string[]
    onChange: (vals: string[]) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    loading?: boolean
}

// Máximo de opciones renderizadas a la vez (los clientes pueden ser miles).
const MAX_VISIBLE = 100

export default function MultiSelectFilter({
    options,
    selected,
    onChange,
    placeholder = "Seleccionar...",
    searchPlaceholder = "Buscar...",
    emptyText = "Sin resultados",
    loading = false,
}: MultiSelectFilterProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    const term = searchTerm.toLowerCase()
    const filtered = options.filter(
        (o) => o.label.toLowerCase().includes(term) || o.value.toLowerCase().includes(term)
    )

    const toggle = (v: string) => {
        if (selected.includes(v)) onChange(selected.filter((x) => x !== v))
        else onChange([...selected, v])
    }

    const remove = (v: string) => onChange(selected.filter((x) => x !== v))
    const labelOf = (v: string) => options.find((o) => o.value === v)?.label || v

    return (
        <div className="relative">
            <div
                className="min-h-10 border border-border rounded-md p-2 bg-background cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex flex-wrap gap-1 pr-6">
                    {selected.map((v) => (
                        <Badge key={v} variant="secondary" className="text-xs">
                            {labelOf(v)}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    remove(v)
                                }}
                                className="ml-1 hover:bg-muted rounded-full p-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </Badge>
                    ))}
                    {selected.length === 0 && <span className="text-muted-foreground text-sm">{placeholder}</span>}
                </div>
                <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-muted-foreground" />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    <div className="p-2 border-b sticky top-0 bg-background">
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="text-sm"
                        />
                    </div>
                    <div className="py-1">
                        {loading ? (
                            <div className="px-3 py-2 text-muted-foreground text-sm">Cargando...</div>
                        ) : filtered.length === 0 ? (
                            <div className="px-3 py-2 text-muted-foreground text-sm">{emptyText}</div>
                        ) : (
                            <>
                                {filtered.slice(0, MAX_VISIBLE).map((o) => (
                                    <div
                                        key={o.value}
                                        className="px-3 py-2 hover:bg-muted cursor-pointer flex items-center gap-2 text-sm"
                                        onClick={() => toggle(o.value)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selected.includes(o.value)}
                                            onChange={() => {}}
                                            className="rounded"
                                        />
                                        <span className="truncate">{o.label}</span>
                                    </div>
                                ))}
                                {filtered.length > MAX_VISIBLE && (
                                    <div className="px-3 py-2 text-muted-foreground text-xs">
                                        Mostrando {MAX_VISIBLE} de {filtered.length}. Refina la búsqueda…
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
