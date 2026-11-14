'use client'

import React, { useEffect, useState } from 'react'
import { Check, ChevronsUpDown, Loader2, MousePointerClick, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { FiltroExtra, FiltroInforme, ProveedorBusqueda } from '@/app/types/informes-contables-types'
import { InformesContablesService } from '@/app/services/contabilidad/InformesContablesService'

/** Tipos de documento del Programa de Pagos (igual que el form Access [Selecc Doc Programa Pagos]). */
const TIPOS_DOC = [{ v: '00', t: 'Todos' }, { v: '01', t: 'Facturas' }, { v: '80', t: 'Letras' }]
/** Niveles del plan contable (largo del código). */
const NIVELES = [{ v: '', t: 'Todos' }, { v: '2', t: '2 · Cuenta principal' }, { v: '3', t: '3 · Sub cuenta' },
    { v: '5', t: '5 · Sub cuenta 2' }, { v: '7', t: '7 · Cuenta de registros' }]

/** Buscador de proveedores: consulta al servidor mientras se escribe (RUC o nombre). */
function BuscadorProveedor({ filtro, onChange, obligatorio, pedir = 0 }: { filtro: FiltroInforme; onChange: (p: Partial<FiltroInforme>) => void; obligatorio: boolean; pedir?: number }) {
    const [abierto, setAbierto] = useState(false)
    // "Consultar" sin proveedor: se marca el campo (ámbar, no rojo) y se abre la lista para elegir
    const falta = obligatorio && pedir > 0 && !filtro.codProveedor
    useEffect(() => { if (pedir > 0 && obligatorio && !filtro.codProveedor) setAbierto(true) }, [pedir]) // eslint-disable-line react-hooks/exhaustive-deps
    const [texto, setTexto] = useState('')
    const [items, setItems] = useState<ProveedorBusqueda[]>([])
    const [cargando, setCargando] = useState(false)

    useEffect(() => {
        if (!abierto) return
        const t = texto.trim()
        if (t.length < 2) { setItems([]); return }
        let vigente = true
        setCargando(true)
        const id = setTimeout(async () => {
            try {
                const r = await InformesContablesService.buscarProveedores(t)
                if (vigente) setItems(r)
            } catch { if (vigente) setItems([]) } finally { if (vigente) setCargando(false) }
        }, 300)
        return () => { vigente = false; clearTimeout(id) }
    }, [texto, abierto])

    return (
        <div className="flex flex-col gap-1.5 col-span-2 md:col-span-4">
            <Label>Proveedor {obligatorio ? <span className="text-red-600">*</span> : <span className="text-xs text-muted-foreground">(opcional)</span>}</Label>
            <div className="flex gap-1">
                <Popover open={abierto} onOpenChange={setAbierto}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-invalid={falta}
                                className={cn('flex-1 justify-between bg-background font-normal min-w-0 transition-shadow',
                                    falta && 'border-amber-400 ring-2 ring-amber-200 dark:border-amber-500 dark:ring-amber-900/60')}>
                            <span className={cn('truncate', !filtro.codProveedor && 'text-muted-foreground')}>
                                {filtro.nomProveedor || (obligatorio ? 'Elige un proveedor' : 'Todos los proveedores')}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[300px] p-0" align="start">
                        <Command shouldFilter={false}>
                            <CommandInput placeholder="RUC o nombre (mín. 2 letras)" value={texto} onValueChange={setTexto} />
                            <CommandList>
                                {cargando && <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Buscando…</div>}
                                {!cargando && <CommandEmpty>{texto.trim().length < 2 ? 'Escribe el RUC o el nombre' : 'Sin resultados'}</CommandEmpty>}
                                <CommandGroup>
                                    {items.map(p => (
                                        <CommandItem key={p.Codigo} value={p.Codigo}
                                                     onSelect={() => { onChange({ codProveedor: p.Codigo, nomProveedor: p.Proveedor }); setAbierto(false) }}>
                                            <Check className={cn('mr-2 h-4 w-4', filtro.codProveedor === p.Codigo ? 'opacity-100' : 'opacity-0')} />
                                            <span className="font-mono text-xs mr-2">{p.RUC}</span><span className="truncate">{p.Nombre}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                {filtro.codProveedor && (
                    <Button variant="ghost" size="icon" title="Quitar proveedor" onClick={() => onChange({ codProveedor: '', nomProveedor: '' })}>
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
            {falta && (
                <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 animate-in fade-in-0 slide-in-from-top-1 duration-300">
                    <MousePointerClick className="h-3.5 w-3.5 shrink-0" />
                    Elige un proveedor para ver este informe: escribe su RUC o nombre.
                </p>
            )}
        </div>
    )
}

interface Props {
    extras: FiltroExtra[]
    filtro: FiltroInforme
    onChange: (f: FiltroInforme) => void
    onEnter?: () => void
    /** Aumenta cada vez que se intenta consultar sin el proveedor obligatorio. */
    pedirProveedor?: number
}

/** Filtros adicionales al periodo, declarados por cada reporte en sus definiciones. */
export function FiltrosExtra({ extras, filtro, onChange, onEnter, pedirProveedor = 0 }: Props) {
    const set = (p: Partial<FiltroInforme>) => onChange({ ...filtro, ...p })
    const enter = (e: React.KeyboardEvent) => { if (e.key === 'Enter') onEnter?.() }
    return (
        <>
            {(extras.includes('proveedor') || extras.includes('proveedor-obligatorio')) && (
                <BuscadorProveedor filtro={filtro} onChange={set} obligatorio={extras.includes('proveedor-obligatorio')} pedir={pedirProveedor} />
            )}
            {extras.includes('documento') && (
                <div className="flex flex-col gap-1.5 col-span-2 md:col-span-3">
                    <Label htmlFor="fdoc">Documento <span className="text-xs text-muted-foreground">(opcional, TIPO-SERIE-NÚMERO)</span></Label>
                    <Input id="fdoc" className="bg-background font-mono" placeholder="80-08-2025018014" value={filtro.documento ?? ''}
                           onChange={e => set({ documento: e.target.value.toUpperCase() })} onKeyDown={enter} maxLength={30} />
                </div>
            )}
            {extras.includes('tipo-doc') && (
                <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label>Documentos</Label>
                    <Select value={filtro.tipoDoc || '00'} onValueChange={v => set({ tipoDoc: v })}>
                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>{TIPOS_DOC.map(x => <SelectItem key={x.v} value={x.v}>{x.t}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            )}
            {extras.includes('buscar') && (
                <div className="flex flex-col gap-1.5 col-span-2 md:col-span-4">
                    <Label htmlFor="fbuscar">Ingrese cuenta <span className="text-xs text-muted-foreground">(código o descripción)</span></Label>
                    <Input id="fbuscar" className="bg-background" placeholder="10401 o BANCO" value={filtro.buscar ?? ''}
                           onChange={e => set({ buscar: e.target.value })} onKeyDown={enter} maxLength={60} />
                </div>
            )}
            {extras.includes('cuenta') && (
                <div className="flex flex-col gap-1.5 col-span-2 md:col-span-3">
                    <Label htmlFor="fcuenta">Cuenta <span className="text-xs text-muted-foreground">(opcional: 10, 101 o 1010101)</span></Label>
                    <Input id="fcuenta" className="bg-background font-mono" placeholder="Todas las cuentas" inputMode="numeric" value={filtro.cuenta ?? ''}
                           onChange={e => set({ cuenta: e.target.value.replace(/\D/g, '') })} onKeyDown={enter} maxLength={12} />
                </div>
            )}
            {extras.includes('nivel') && (
                <div className="flex flex-col gap-1.5 md:col-span-3">
                    <Label>Nivel</Label>
                    <Select value={filtro.nivel || 'todos'} onValueChange={v => set({ nivel: v === 'todos' ? '' : v })}>
                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>{NIVELES.map(x => <SelectItem key={x.t} value={x.v || 'todos'}>{x.t}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            )}
        </>
    )
}
