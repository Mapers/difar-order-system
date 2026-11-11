'use client'

import React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarDays, ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react"
import { MESES } from "@/app/types/comisiones-types"

/** Piezas de pantalla de las comisiones, con el mismo estilo de Contabilidad. */

export const ANIOS = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i))

export const monto = (v: number | string | null | undefined) =>
    Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Importe en soles con 2 decimales: "S/ 1,234.50". */
export const money = (v: number | string | null | undefined) => `S/ ${monto(v)}`

export const pct = (v: number | string | null | undefined) =>
    `${Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`

export const fechaDMY = (f: string | null | undefined) => {
    if (!f) return ''
    const [a, m, d] = String(f).slice(0, 10).split('-')
    return a && m && d ? `${d}/${m}/${a}` : String(f)
}

export function Th({ children, right = false, className = "" }: { children?: React.ReactNode; right?: boolean; className?: string }) {
    return (
        <th className={`py-2.5 px-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider border-b whitespace-nowrap ${right ? 'text-right' : 'text-left'} ${className}`}>
            {children}
        </th>
    )
}

export function KpiCard({ etiqueta, icono: Icono, iconoCls, className = "", children }: {
    etiqueta: string; icono: LucideIcon; iconoCls: string; className?: string; children: React.ReactNode
}) {
    return (
        <div className={`rounded-xl border bg-background p-3.5 shadow-sm ${className}`}>
            <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{etiqueta}</p>
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconoCls}`}>
                    <Icono className="h-4 w-4" />
                </span>
            </div>
            {children}
        </div>
    )
}

/** Mes y año con flechas, igual que Movimiento de Sub Cuenta. */
export function SelectorPeriodo({ anio, mes, onChange }: {
    anio: string; mes: string; onChange: (anio: string, mes: string) => void
}) {
    const anioMin = Number(ANIOS[ANIOS.length - 1])
    const anioMax = Number(ANIOS[0])
    const mover = (delta: number) => {
        let m = Number(mes) + delta
        let a = Number(anio)
        if (m < 1) { m = 12; a -= 1 }
        if (m > 12) { m = 1; a += 1 }
        if (a < anioMin || a > anioMax) return
        onChange(String(a), String(m).padStart(2, '0'))
    }
    return (
        <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Periodo</Label>
            <div className="flex items-center gap-1.5">
                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" title="Mes anterior"
                        onClick={() => mover(-1)} disabled={mes === '01' && Number(anio) <= anioMin}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Select value={mes} onValueChange={v => onChange(anio, v)}>
                    <SelectTrigger className="h-10 w-40">
                        <span className="!flex min-w-0 items-center gap-2">
                            <CalendarDays className="h-4 w-4 shrink-0 text-blue-600" />
                            <SelectValue />
                        </span>
                    </SelectTrigger>
                    <SelectContent>
                        {MESES.map(m => <SelectItem key={m.valor} value={m.valor}>{m.nombre}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={anio} onValueChange={v => onChange(v, mes)}>
                    <SelectTrigger className="h-10 w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {ANIOS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" title="Mes siguiente"
                        onClick={() => mover(1)} disabled={mes === '12' && Number(anio) >= anioMax}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
