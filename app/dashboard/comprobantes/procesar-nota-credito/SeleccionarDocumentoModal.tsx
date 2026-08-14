'use client'

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Search } from "lucide-react"
import { buscarComprobantes, buscarNotasCredito } from "@/app/api/asientos"
import { DocumentoAplicable } from "@/app/types/procesar-nota-credito-types"

export type PickerModo = 'nc' | 'comp'

const fmt = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface SeleccionarDocumentoModalProps {
    open:         boolean
    modo:         PickerModo
    fechaAsiento: string
    codCliente:   string
    onClose:      () => void
    onPick:       (doc: DocumentoAplicable) => void
}

function mapDocumento(row: any): DocumentoAplicable {
    return {
        tipDoc:           row.tipDoc,
        tipo:             row.tipo || undefined,
        serie:            row.serie,
        numero:           String(row.numero),
        codCliente:       row.codCliente,
        razonSocial:      row.razonSocial,
        motivo:           row.motivo || '',
        monto:            Number(row.monto) || 0,
        idCtaContable:    row.idCtaContable != null ? Number(row.idCtaContable) : null,
        codContable:      row.codContable || '',
        codVend:          row.codVend || '',
        fechaEmision:     row.fechaEmision ? String(row.fechaEmision).slice(0, 10) : '',
        fechaVencimiento: row.fechaVencimiento ? String(row.fechaVencimiento).slice(0, 10) : '',
    }
}

export function SeleccionarDocumentoModal({ open, modo, fechaAsiento, codCliente, onClose, onPick }: SeleccionarDocumentoModalProps) {
    const [busqueda, setBusqueda]   = useState('')
    const [soloFecha, setSoloFecha] = useState(true)
    const [lista, setLista]         = useState<DocumentoAplicable[]>([])
    const [loading, setLoading]     = useState(false)
    const [error, setError]         = useState<string | null>(null)

    const esNC = modo === 'nc'

    useEffect(() => {
        if (!open) return
        // Las facturas se buscan siempre contra el cliente de la N.C.: sin ese
        // dato el backend responde 400, así que ni se consulta.
        if (!esNC && !codCliente) { setLista([]); return }

        setLoading(true)
        setError(null)
        const timer = setTimeout(() => {
            const req = esNC
                ? buscarNotasCredito({
                    fecha:    soloFecha ? (fechaAsiento || undefined) : undefined,
                    busqueda: busqueda.trim() || undefined,
                })
                : buscarComprobantes({
                    codCliente,
                    busqueda: busqueda.trim() || undefined,
                })

            req
                .then(res => {
                    setLista((res.data?.data?.data ?? []).map(mapDocumento))
                    setError(null)
                })
                .catch(err => {
                    setLista([])
                    const status = err?.response?.status
                    const msg    = err?.response?.data?.message || err?.message || 'Error desconocido'
                    setError(status ? `${status} · ${msg}` : msg)
                })
                .finally(() => setLoading(false))
        }, 300)
        return () => clearTimeout(timer)
    }, [open, esNC, codCliente, busqueda, soloFecha, fechaAsiento])

    useEffect(() => {
        if (!open) { setBusqueda(''); setSoloFecha(true) }
    }, [open])

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden p-0">
                <DialogHeader className="border-b px-5 py-4">
                    <DialogTitle>
                        {esNC ? 'Notas de crédito disponibles' : 'Comprobantes disponibles (Factura/Boleta)'}
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
                    {esNC ? (
                        <Label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
                            <Checkbox checked={soloFecha} onCheckedChange={v => setSoloFecha(!!v)} />
                            Solo de la fecha
                            <Badge variant="outline" className="font-mono">{fechaAsiento || '—'}</Badge>
                        </Label>
                    ) : (
                        <span className="whitespace-nowrap text-sm text-muted-foreground">
                            Cliente <Badge variant="outline" className="font-mono">{codCliente || '—'}</Badge>
                        </span>
                    )}
                </div>

                <div className="max-h-[50vh] overflow-auto">
                    {loading ? (
                        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Buscando…
                        </div>
                    ) : error ? (
                        <div className="px-5 py-12 text-center">
                            <p className="text-sm font-medium text-destructive">
                                No se pudo consultar {esNC ? 'las notas de crédito' : 'los comprobantes'}.
                            </p>
                            <p className="mt-1.5 font-mono text-xs text-muted-foreground">{error}</p>
                        </div>
                    ) : !esNC && !codCliente ? (
                        <div className="py-12 text-center text-sm text-muted-foreground">
                            Primero agrega la línea de la nota de crédito: define el cliente contra el que se buscan los comprobantes.
                        </div>
                    ) : lista.length === 0 ? (
                        <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                            No hay {esNC ? 'notas de crédito' : 'comprobantes'} con saldo pendiente para los filtros seleccionados.
                            {esNC && soloFecha && (
                                <span className="mt-1.5 block text-xs">
                                    Estás filtrando por la fecha del asiento ({fechaAsiento || '—'}).
                                    Destilda <b>Solo de la fecha</b> para ver todas.
                                </span>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Serie</TableHead>
                                    <TableHead>Comprobante</TableHead>
                                    <TableHead>Razón social</TableHead>
                                    <TableHead>Motivo</TableHead>
                                    <TableHead className="text-right">Saldo (S/)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lista.map((d, i) => (
                                    <TableRow key={`${d.serie}-${d.numero}-${i}`} className="cursor-pointer" onClick={() => onPick(d)}>
                                        <TableCell className="font-mono">
                                            {d.tipo && (
                                                <Badge variant="secondary" className="mr-1.5 text-[10px]">{d.tipo}</Badge>
                                            )}
                                            {d.serie}
                                        </TableCell>
                                        <TableCell className="font-mono">{d.numero}</TableCell>
                                        <TableCell className="font-medium">{d.razonSocial}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{d.motivo}</TableCell>
                                        <TableCell className={esNC ? "text-right font-mono font-semibold text-green-700" : "text-right font-mono font-semibold text-red-700"}>
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
