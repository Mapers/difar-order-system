'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import {
    Command, CommandEmpty, CommandGroup,
    CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { Check, ChevronDown, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import {ZonaOption} from "@/app/types/planilla-types";

interface Props {
    zones:    ZonaOption[]
    value:    string
    onChange: (val: string) => void
}

export default function ZonaCombobox({ zones, value, onChange }: Props) {
    const [open, setOpen] = useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className="justify-between w-full h-10 font-normal bg-white"
                >
          <span className="truncate flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              {value || 'Seleccionar zona...'}
          </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Buscar zona..." />
                    <CommandList>
                        <CommandEmpty>No se encontraron zonas.</CommandEmpty>
                        <CommandGroup>
                            {zones.map(z => (
                                <CommandItem
                                    key={z.IdZona}
                                    onSelect={() => { onChange(z.NombreZona); setOpen(false) }}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            value === z.NombreZona ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                    {z.NombreZona}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}