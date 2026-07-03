'use client'

import { useState } from 'react'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
    glosas:    string[]
    value:     string
    onChange:  (val: string) => void
    disabled?: boolean
}

export function GlosaComboBox({ glosas, value, onChange, disabled }: Props) {
    const [open, setOpen] = useState(false)

    const filtradas = glosas.filter(g => g.toLowerCase().includes(value.trim().toLowerCase()))

    return (
        <Popover open={open && !disabled}>
            <PopoverAnchor asChild>
                <Input
                    value={value}
                    onChange={e => { onChange(e.target.value); setOpen(true) }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setOpen(false)}
                    placeholder={disabled ? "Cargando…" : "Escribe o elige una glosa registrada…"}
                    autoComplete="off"
                    disabled={disabled}
                />
            </PopoverAnchor>
            <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
                onOpenAutoFocus={e => e.preventDefault()}
                onCloseAutoFocus={e => e.preventDefault()}
            >
                <Command shouldFilter={false}>
                    <CommandList>
                        <CommandEmpty className="px-3 py-2 text-xs text-muted-foreground">
                            Sin coincidencias, se usará el texto escrito.
                        </CommandEmpty>
                        <CommandGroup>
                            {filtradas.map(g => (
                                <CommandItem
                                    key={g}
                                    value={g}
                                    onMouseDown={e => e.preventDefault()}
                                    onSelect={() => { onChange(g); setOpen(false) }}
                                >
                                    <Check className={cn('mr-2 h-4 w-4', value === g ? 'opacity-100' : 'opacity-0')} />
                                    {g}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
