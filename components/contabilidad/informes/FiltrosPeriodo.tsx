'use client'

import React from 'react'
import { Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FiltroInforme, TipoFiltro } from '@/app/types/informes-contables-types'
import { MESES } from './formato'

interface Props {
    tipo: TipoFiltro
    filtro: FiltroInforme
    onChange: (f: FiltroInforme) => void
    onBuscar: () => void
    cargando: boolean
    /** Botones extra a la derecha (exportar, descargar). */
    acciones?: React.ReactNode
}

const ANIOS = (() => {
    const actual = new Date().getFullYear()
    return Array.from({ length: 8 }, (_, i) => String(actual - i))
})()

/** Filtro de periodo: mes y año, solo año, o rango de fechas, según el reporte. */
export function FiltrosPeriodo({ tipo, filtro, onChange, onBuscar, cargando, acciones }: Props) {
    const set = (p: Partial<FiltroInforme>) => onChange({ ...filtro, ...p })
    return (
        <div className="grid grid-cols-2 md:grid-cols-12 gap-3 md:gap-4 items-end">
            {tipo === 'rango' ? (
                <>
                    <div className="flex flex-col gap-1.5 md:col-span-3">
                        <Label htmlFor="fdesde">Desde</Label>
                        <Input id="fdesde" type="date" className="bg-background" value={filtro.fechaDesde} onChange={e => set({ fechaDesde: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-3">
                        <Label htmlFor="fhasta">Hasta</Label>
                        <Input id="fhasta" type="date" className="bg-background" value={filtro.fechaHasta} onChange={e => set({ fechaHasta: e.target.value })} />
                    </div>
                </>
            ) : (
                <>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                        <Label>Año</Label>
                        <Select value={filtro.anio} onValueChange={v => set({ anio: v })}>
                            <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                            <SelectContent>{ANIOS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    {tipo === 'mes' && (
                        <div className="flex flex-col gap-1.5 md:col-span-3">
                            <Label>Mes</Label>
                            <Select value={filtro.mes} onValueChange={v => set({ mes: v })}>
                                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {MESES.map((m, i) => <SelectItem key={m} value={String(i + 1).padStart(2, '0')}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </>
            )}
            <div className="col-span-2 flex flex-col sm:flex-row gap-2 md:col-span-6 md:col-start-7 md:justify-end">
                <Button onClick={onBuscar} disabled={cargando} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                    {cargando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Consultar
                </Button>
                {acciones}
            </div>
        </div>
    )
}

/** Filtro inicial: mes anterior al actual (el que normalmente se declara). */
export function filtroInicial(): FiltroInforme {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - 1)
    const anio = String(d.getFullYear())
    const mes = String(d.getMonth() + 1).padStart(2, '0')
    const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    return { anio, mes, fechaDesde: `${anio}-${mes}-01`, fechaHasta: `${anio}-${mes}-${String(fin).padStart(2, '0')}` }
}
