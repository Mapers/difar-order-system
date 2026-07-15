'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

/**
 * Selector de Mes y Año.
 *
 * Existe porque el Calendar de react-day-picker muestra la grilla de días
 * aunque el consumidor solo use mes y año: deja elegir el 15 y filtra todo
 * el mes. Este componente muestra exactamente lo que el filtro hace.
 *
 * La fecha devuelta siempre tiene día = 1. Además de ser el primer día del
 * periodo, evita el desborde de fijar mes sobre un día 29-31 (31/ene -> feb).
 */

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

interface MonthYearPickerProps {
    value:      Date
    onChange:   (date: Date) => void
    /** Año mínimo navegable. */
    fromYear?:  number
    /** Año máximo navegable. */
    toYear?:    number
    className?: string
    disabled?:  boolean
}

export function MonthYearPicker({
    value,
    onChange,
    fromYear = 2020,
    toYear   = new Date().getFullYear() + 1,
    className,
    disabled = false,
}: MonthYearPickerProps) {
    const [open, setOpen] = React.useState(false)
    // Año que se está navegando en el popover. No es el seleccionado:
    // permite mirar 2025 sin haber elegido todavía un mes de 2025.
    const [year, setYear] = React.useState(value.getFullYear())

    // Al reabrir, volver al año del valor vigente en vez de dejar el último
    // año que el usuario estuvo hojeando sin elegir nada.
    React.useEffect(() => {
        if (open) setYear(value.getFullYear())
    }, [open, value])

    const seleccionar = (mesIdx: number) => {
        onChange(new Date(year, mesIdx, 1))
        setOpen(false)
    }

    const label = format(value, "MMMM yyyy", { locale: es })
        .replace(/^\w/, c => c.toUpperCase())

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal bg-background h-10",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50 shrink-0" />
                    <span className="truncate">{label}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3 z-50" align="start">
                <div className="flex items-center justify-between mb-3 gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        disabled={year <= fromYear}
                        onClick={() => setYear(y => y - 1)}
                        aria-label="Año anterior"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-semibold tabular-nums select-none">{year}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        disabled={year >= toYear}
                        onClick={() => setYear(y => y + 1)}
                        aria-label="Año siguiente"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                    {MESES_CORTOS.map((mes, i) => {
                        const activo = value.getFullYear() === year && value.getMonth() === i
                        return (
                            <Button
                                key={mes}
                                variant={activo ? "default" : "ghost"}
                                size="sm"
                                // h-9/w-16: objetivo táctil cómodo en móvil.
                                className={cn("h-9 w-16 text-xs font-medium", !activo && "hover:bg-muted")}
                                onClick={() => seleccionar(i)}
                            >
                                {mes}
                            </Button>
                        )
                    })}
                </div>
            </PopoverContent>
        </Popover>
    )
}
