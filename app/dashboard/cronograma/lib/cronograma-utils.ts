import { Comprobante } from "@/app/types/order/order-interface"

export type EstadoVencimiento = 'vencida' | 'porvencer' | 'vigente'

export type CronogramaComprobante = Comprobante & {
  fecha_vencimiento: string | null
  dias_credito: number | null
}

export const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

/** Convierte 'YYYY-MM-DD' (o ISO) a Date en horario local, sin desfase de zona. */
export function parseFechaLocal(f: string | null | undefined): Date | null {
  if (!f) return null
  const soloFecha = String(f).slice(0, 10)
  const [y, m, d] = soloFecha.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function truncarDia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function diasParaVencer(venc: Date, hoy: Date): number {
  return Math.round((truncarDia(venc).getTime() - truncarDia(hoy).getTime()) / 86400000)
}

export function estadoDe(venc: Date | null, hoy: Date): EstadoVencimiento {
  if (!venc) return 'vigente'
  const diff = diasParaVencer(venc, hoy)
  if (diff < 0) return 'vencida'
  if (diff <= 7) return 'porvencer'
  return 'vigente'
}

export function estadoLabel(e: EstadoVencimiento): string {
  return e === 'vencida' ? 'Vencida' : e === 'porvencer' ? 'Por vencer' : 'Vigente'
}

export function fmtSoles(n: number): string {
  return 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function montoDe(c: CronogramaComprobante): number {
  return Number(c.total) || 0
}

/** Discrimina factura/boleta por la serie (F.. = factura, B.. = boleta). */
export function tipoDoc(c: CronogramaComprobante): 'factura' | 'boleta' | 'otro' {
  const s = (c.serie || '').toUpperCase()
  if (s.startsWith('F')) return 'factura'
  if (s.startsWith('B')) return 'boleta'
  return 'otro'
}

export const ESTADO_BADGE: Record<EstadoVencimiento, string> = {
  vencida: 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
  porvencer: 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
  vigente: 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
}

export const ESTADO_CELL: Record<EstadoVencimiento, string> = {
  vencida: 'bg-red-500 text-white',
  porvencer: 'bg-amber-500 text-white',
  vigente: 'bg-emerald-500 text-white',
}
