'use client'

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Search } from "lucide-react"
import { buscarNotasCredito } from "@/app/api/asientos"
import { DocumentoAplicable } from "@/app/types/procesar-nota-credito-types"

export type PickerModo = 'nc' | 'comp'

const fmt = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface SeleccionarDocumentoModalProps {
    open:         boolean
    modo:         PickerModo
    fechaAsiento: string
    onClose:      () => void
    onPick:       (doc: DocumentoAplicable) => void
}

function mapNotaCredito(row: any): DocumentoAplicable {
    return {
        tipDoc:           row.tipDoc,
        serie:            row.serie,
        numero:           String(row.numero),
        razonSocial:      row.razonSocial,
        motivo:           row.motivo,
        monto:            Number(row.monto) || 0,
        ctaContable:      '',
        fechaEmision:     row.fechaEmision ? String(row.fechaEmision).slice(0, 10) : '',
        fechaVencimiento: row.fechaVencimiento ? String(row.fechaVencimiento).slice(0, 10) : '',
    }
}

export function SeleccionarDocumentoModal({ open, modo, fechaAsiento, onClose, onPick }: SeleccionarDocumentoModalProps) {
    const [busqueda, setBusqueda]   = useState('')
    const [soloFecha, setSoloFecha] = useState(true)
    const [lista, setLista]         = useState<DocumentoAplicable[]>([])
    const [loading, setLoading]     = useState(false)

    // TODO: modo 'comp' (Factura/Boleta) aún no tiene buscador propio — pendiente.
    useEffect(() => {
        if (!open || modo !== 'nc') return
        setLoading(true)
        const timer = setTimeout(() => {
            buscarNotasCredito({
                fecha:    soloFecha ? (fechaAsiento || undefined) : undefined,
                busqueda: busqueda.trim() || undefined,
            })
                .then(res => setLista((res.data?.data?.data ?? []).map(mapNotaCredito)))
                .catch(() => setLista([]))
                .finally(() => setLoading(false))
        }, 300)
        return () => clearTimeout(timer)
    }, [open, modo, busqueda, soloFecha, fechaAsiento])

    useEffect(() => {
        if (!open) { setBusqueda(''); setSoloFecha(true) }
    }, [open])

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden p-0">
                <DialogHeader className="border-b px-5 py-4">
                    <DialogTitle>
                        {modo === 'nc' ? 'Notas de crédito disponibles' : 'Comprobantes disponibles (Factura/Boleta)'}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-wrap items-center gap-3 border-b px-5 py-3">
                    <div className="relative min-w-[220px] flex-1">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            placeholder="Buscar por serie, comprobante, razón social o motivo…"
                            className="pl-8"
                        />
                    </div>
                    <Label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
                        <Checkbox checked={soloFecha} onCheckedChange={v => setSoloFecha(!!v)} />
                        Solo de la fecha
                        <Badge variant="outline" className="font-mono">{fechaAsiento || '—'}</Badge>
                    </Label>
                </div>

                <div className="max-h-[50vh] overflow-auto">
                    {loading ? (
                        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Buscando…
                        </div>
                    ) : lista.length === 0 ? (
                        <div className="py-12 text-center text-sm text-muted-foreground">
                            No hay {modo === 'nc' ? 'notas de crédito' : 'comprobantes'} para los filtros seleccionados.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Serie</TableHead>
                                    <TableHead>Comprobante</TableHead>
                                    <TableHead>Razón social</TableHead>
                                    <TableHead>Motivo</TableHead>
                                    <TableHead className="text-right">Monto (S/)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lista.map((d, i) => (
                                    <TableRow key={`${d.serie}-${d.numero}-${i}`} className="cursor-pointer" onClick={() => onPick(d)}>
                                        <TableCell className="font-mono">{d.serie}</TableCell>
                                        <TableCell className="font-mono">{d.numero}</TableCell>
                                        <TableCell className="font-medium">{d.razonSocial}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{d.motivo}</TableCell>
                                        <TableCell className={modo === 'nc' ? "text-right font-mono font-semibold text-green-700" : "text-right font-mono font-semibold text-red-700"}>
                                            {fmt(d.monto)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
