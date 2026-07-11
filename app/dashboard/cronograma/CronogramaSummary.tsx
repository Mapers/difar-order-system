'use client'

import { Card, CardContent } from "@/components/ui/card"
import {
  CronogramaComprobante,
  estadoDe,
  fmtSoles,
  montoDe,
  parseFechaLocal,
} from "./lib/cronograma-utils"

interface CronogramaSummaryProps {
  comprobantes: CronogramaComprobante[]
  hoy: Date
}

export function CronogramaSummary({ comprobantes, hoy }: CronogramaSummaryProps) {
  const byEstado = (estado: 'vencida' | 'porvencer' | 'vigente') =>
    comprobantes.filter(c => estadoDe(parseFechaLocal(c.fecha_vencimiento), hoy) === estado)

  const vencidas = byEstado('vencida')
  const porVencer = byEstado('porvencer')
  const vigentes = byEstado('vigente')
  const suma = (arr: CronogramaComprobante[]) => arr.reduce((a, c) => a + montoDe(c), 0)

  const cards = [
    { label: 'Vencidas', accent: 'border-l-red-500', n: vencidas.length, monto: suma(vencidas) },
    { label: 'Por vencer (≤7d)', accent: 'border-l-amber-500', n: porVencer.length, monto: suma(porVencer) },
    { label: 'Vigentes', accent: 'border-l-emerald-500', n: vigentes.length, monto: suma(vigentes) },
    { label: 'Total del mes', accent: 'border-l-blue-600', n: comprobantes.length, monto: suma(comprobantes) },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(c => (
        <Card key={c.label} className={`border-l-4 ${c.accent}`}>
          <CardContent className="p-4">
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {c.label}
            </div>
            <div className="mt-1 text-2xl font-bold tabular-nums">{c.n} <span className="text-base font-medium text-muted-foreground">doc.</span></div>
            <div className="mt-0.5 text-xs tabular-nums text-muted-foreground">{fmtSoles(c.monto)}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
