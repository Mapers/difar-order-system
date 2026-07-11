'use client'

import { cn } from "@/lib/utils"
import {
  CronogramaComprobante,
  estadoDe,
  fmtSoles,
  montoDe,
  parseFechaLocal,
  ESTADO_BADGE,
} from "./lib/cronograma-utils"

interface CronogramaCalendarProps {
  year: number
  month: number
  comprobantes: CronogramaComprobante[]
  hoy: Date
  selectedDay: number | null
  onSelectDay: (day: number) => void
  onSelectComprobante: (c: CronogramaComprobante) => void
}

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MAX_VISIBLE = 3

export function CronogramaCalendar({
  year, month, comprobantes, hoy, selectedDay, onSelectDay, onSelectComprobante,
}: CronogramaCalendarProps) {
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const diaDe = (c: CronogramaComprobante) => {
    const v = parseFechaLocal(c.fecha_vencimiento)
    return v ? v.getDate() : null
  }

  const cells: React.ReactNode[] = []
  for (let i = 0; i < firstDow; i++) {
    cells.push(<div key={`empty-${i}`} className="min-h-[72px] border-b border-r bg-muted/30 sm:min-h-[110px]" />)
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const delDia = comprobantes
      .filter(c => diaDe(c) === d)
      .sort((a, b) => montoDe(a) - montoDe(b))
    const isToday = year === hoy.getFullYear() && month === hoy.getMonth() && d === hoy.getDate()
    const isSelected = selectedDay === d

    cells.push(
      <div
        key={d}
        onClick={() => delDia.length && onSelectDay(d)}
        className={cn(
          "min-h-[72px] border-b border-r p-1.5 transition-colors sm:min-h-[110px] sm:p-2",
          delDia.length && "cursor-pointer hover:bg-accent/50",
          isSelected && "bg-accent ring-2 ring-inset ring-blue-500",
        )}
      >
        <div
          className={cn(
            "inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1 text-sm font-semibold",
            isToday && "bg-blue-600 text-white",
          )}
        >
          {d}
        </div>
        {delDia.length > 0 && (
          <div className="mt-1.5 flex flex-col gap-1">
            {delDia.slice(0, MAX_VISIBLE).map(c => {
              const estado = estadoDe(parseFechaLocal(c.fecha_vencimiento), hoy)
              return (
                <button
                  key={`${c.serie}-${c.numero}`}
                  onClick={(e) => { e.stopPropagation(); onSelectComprobante(c) }}
                  title={`${c.cliente_denominacion ?? ''} · ${fmtSoles(montoDe(c))}`}
                  className={cn(
                    "block truncate rounded px-1.5 py-0.5 text-left font-mono text-[10px] hover:brightness-95",
                    ESTADO_BADGE[estado],
                  )}
                >
                  {c.serie}-{c.numero}
                </button>
              )
            })}
            {delDia.length > MAX_VISIBLE && (
              <button
                onClick={(e) => { e.stopPropagation(); onSelectDay(d) }}
                className="px-1.5 text-left font-mono text-[10px] text-muted-foreground hover:text-foreground"
              >
                +{delDia.length - MAX_VISIBLE} más
              </button>
            )}
          </div>
        )}
      </div>,
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="grid grid-cols-7 bg-blue-600">
        {WEEKDAYS.map(w => (
          <div key={w} className="py-2 text-center font-mono text-[9px] uppercase tracking-wide text-white sm:py-2.5 sm:text-[11px]">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">{cells}</div>
    </div>
  )
}
