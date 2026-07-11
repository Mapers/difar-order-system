'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"
import {
  CronogramaComprobante,
  diasParaVencer,
  estadoDe,
  estadoLabel,
  fmtSoles,
  montoDe,
  parseFechaLocal,
  ESTADO_BADGE,
} from "./lib/cronograma-utils"

interface ComprobanteDetailModalProps {
  comprobante: CronogramaComprobante | null
  open: boolean
  onOpenChange: (open: boolean) => void
  hoy: Date
  onVerPdf: () => void
}

export function ComprobanteDetailModal({
  comprobante, open, onOpenChange, hoy, onVerPdf,
}: ComprobanteDetailModalProps) {
  if (!comprobante) return null

  const venc = parseFechaLocal(comprobante.fecha_vencimiento)
  const estado = estadoDe(venc, hoy)
  const dias = venc ? diasParaVencer(venc, hoy) : null

  let diasTexto = 'Sin fecha de vencimiento'
  if (dias != null) {
    if (dias < 0) diasTexto = `Vencida hace ${Math.abs(dias)} día(s)`
    else if (dias === 0) diasTexto = 'Vence hoy'
    else diasTexto = `Vence en ${dias} día(s)`
  }

  const fechaTexto = venc
    ? venc.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  const rows: Array<[string, string]> = [
    ['Cliente', comprobante.cliente_denominacion ?? '—'],
    ['Vendedor', comprobante.Vendedor ?? '—'],
    ['Fecha de vencimiento', fechaTexto],
    ['Días', diasTexto],
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span className="font-mono text-base">{comprobante.serie}-{comprobante.numero}</span>
            <Badge className={ESTADO_BADGE[estado]}>{estadoLabel(estado)}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="divide-y">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <span className="text-muted-foreground">{k}</span>
              <span className="text-right font-medium">{v}</span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 pt-3">
            <span className="font-semibold">Monto pendiente</span>
            <span className="text-lg font-bold tabular-nums">{fmtSoles(montoDe(comprobante))}</span>
          </div>
        </div>

        <Button
          onClick={onVerPdf}
          disabled={!comprobante.enlace_pdf}
          className="mt-2 w-full"
        >
          <FileText className="mr-2 h-4 w-4" />
          {comprobante.enlace_pdf ? 'Ver PDF' : 'PDF no disponible'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
