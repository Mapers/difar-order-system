'use client'

import { cn } from "@/lib/utils"
import {
  CronogramaComprobante,
  estadoDe,
  fmtSoles,
  montoDe,
  parseFechaLocal,
  ESTADO_CELL,
} from "./lib/cronograma-utils"

interface CronogramaClientViewProps {
  year: number
  month: number
  comprobantes: CronogramaComprobante[]
  hoy: Date
  search: string
  sort: 'urgencia' | 'monto' | 'nombre'
  selectedCell: { cliente: string; day: number } | null
  onSelectCell: (cliente: string, day: number) => void
}

export function CronogramaClientView({
  year, month, comprobantes, hoy, search, sort, selectedCell, onSelectCell,
}: CronogramaClientViewProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const dias = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const diaDe = (c: CronogramaComprobante) => parseFechaLocal(c.fecha_vencimiento)?.getDate() ?? null

  // Agrupar por cliente
  const groups: Record<string, CronogramaComprobante[]> = {}
  for (const c of comprobantes) {
    const nombre = c.cliente_denominacion ?? 'Sin cliente'
    ;(groups[nombre] ??= []).push(c)
  }

  const searchLower = search.toLowerCase()
  let clientes = Object.keys(groups)
    .filter(nombre => nombre.toLowerCase().includes(searchLower))
    .map(nombre => {
      const facs = groups[nombre].slice().sort((a, b) => {
        const va = parseFechaLocal(a.fecha_vencimiento)?.getTime() ?? 0
        const vb = parseFechaLocal(b.fecha_vencimiento)?.getTime() ?? 0
        return va - vb
      })
      const total = facs.reduce((a, c) => a + montoDe(c), 0)
      const proximo = parseFechaLocal(facs[0]?.fecha_vencimiento)?.getTime() ?? Infinity
      return { nombre, facturas: facs, total, proximo }
    })

  if (sort === 'urgencia') clientes.sort((a, b) => a.proximo - b.proximo)
  else if (sort === 'monto') clientes.sort((a, b) => b.total - a.total)
  else clientes.sort((a, b) => a.nombre.localeCompare(b.nombre))

  if (!clientes.length) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
        No se encontraron clientes.
      </div>
    )
  }

  const peorEstado = (facs: CronogramaComprobante[]) => {
    const estados = facs.map(f => estadoDe(parseFechaLocal(f.fecha_vencimiento), hoy))
    return estados.includes('vencida') ? 'vencida' : estados.includes('porvencer') ? 'porvencer' : 'vigente'
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
      <table className="min-w-max border-separate border-spacing-0 text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 top-0 z-10 min-w-[170px] border-b bg-blue-600 px-3 py-2 text-left font-mono text-[10.5px] text-white">
              Cliente
            </th>
            {dias.map(d => {
              const isToday = year === hoy.getFullYear() && month === hoy.getMonth() && d === hoy.getDate()
              return (
                <th
                  key={d}
                  className={cn(
                    "min-w-[28px] border-b bg-blue-600 px-1 py-2 text-center font-mono text-[10.5px] text-white",
                    isToday && "bg-blue-800",
                  )}
                >
                  {d}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {clientes.map(c => (
            <tr key={c.nombre} className="even:bg-muted/30">
              <th className="sticky left-0 z-[1] min-w-[170px] whitespace-nowrap border-b border-r bg-inherit px-3 py-2 text-left align-top font-semibold">
                {c.nombre}
                <span className="mt-0.5 block font-mono text-[10px] font-normal text-muted-foreground">
                  {c.facturas.length} doc. · {fmtSoles(c.total)}
                </span>
              </th>
              {dias.map(d => {
                const delDia = c.facturas.filter(f => diaDe(f) === d)
                if (!delDia.length) return <td key={d} className="border-b px-1 py-1" />
                const estado = peorEstado(delDia)
                const isSel = selectedCell?.cliente === c.nombre && selectedCell?.day === d
                return (
                  <td key={d} className="border-b px-1 py-1 text-center">
                    <button
                      onClick={() => onSelectCell(c.nombre, d)}
                      className={cn(
                        "mx-auto flex h-5 w-5 items-center justify-center rounded font-mono text-[9.5px] font-semibold",
                        ESTADO_CELL[estado],
                        isSel && "outline outline-2 outline-offset-1 outline-foreground",
                      )}
                    >
                      {delDia.length > 1 ? delDia.length : ''}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
