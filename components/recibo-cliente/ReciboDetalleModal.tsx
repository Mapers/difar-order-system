'use client'

import { useEffect, useState } from 'react'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Download, FileText } from 'lucide-react'
import { publicApi } from '@/app/api/client'
import { useReciboCliente } from '@/app/hooks/useReciboCliente'
import {
    CONCEPTOS, TIPOS_LIQUIDACION, ReciboCabecera, ReciboDetalle, simboloMoneda,
} from '@/app/types/recibo-cliente-types'

interface Props {
    open: boolean
    onOpenChange: (v: boolean) => void
    idRecibo: number | null
}

function etiqueta(lista: { value: string; label: string }[], value?: string | null) {
    return lista.find(x => x.value === value)?.label ?? value ?? '—'
}

export function ReciboDetalleModal({ open, onOpenChange, idRecibo }: Props) {
    const { obtenerRecibo } = useReciboCliente()

    const [recibo, setRecibo] = useState<ReciboCabecera | null>(null)
    const [detalle, setDetalle] = useState<ReciboDetalle[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!open || idRecibo == null) return

        setLoading(true)
        setRecibo(null)
        setDetalle([])

        obtenerRecibo(idRecibo)
            .then(data => {
                if (!data) return
                setRecibo(data.recibo)
                setDetalle(data.detalle)
            })
            .finally(() => setLoading(false))
    }, [open, idRecibo, obtenerRecibo])

    const simbolo = simboloMoneda(recibo?.moneda)
    const urlPdf = recibo?.ruta_pdf ? `${publicApi}${recibo.ruta_pdf}` : null

    const dato = (etiquetaTexto: string, valor: React.ReactNode) => (
        <div>
            <p className="text-xs text-muted-foreground">{etiquetaTexto}</p>
            <p className="text-sm font-medium">{valor || '—'}</p>
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-sky-600" />
                        Recibo {recibo?.numero_recibo ?? ''}
                        {recibo && (
                            <Badge variant={recibo.estado === 'ANULADO' ? 'destructive' : 'default'}>
                                {recibo.estado}
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Detalle del recibo emitido y descarga del documento para firmar.
                    </DialogDescription>
                </DialogHeader>

                {loading && (
                    <div className="grid gap-3">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                )}

                {!loading && recibo && (
                    <div className="grid gap-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {dato('Fecha', recibo.fecha_emision?.slice(0, 10))}
                            {dato('Ciudad', recibo.ciudad)}
                            {dato('Vendedor', recibo.nombre_vendedor)}
                            {dato('Cliente', `${recibo.cod_cliente} — ${recibo.nombre_cliente}`)}
                            {dato('RUC', recibo.ruc_cliente)}
                            {dato('Zona', recibo.zona)}
                            {dato('Concepto', etiqueta(CONCEPTOS, recibo.concepto))}
                            {dato('Tipo de liquidación', etiqueta(TIPOS_LIQUIDACION, recibo.tipo_liquidacion))}
                            {recibo.tipo_liquidacion === 'PLANILLA' && dato('N° Planilla', recibo.numero_planilla)}
                        </div>

                        {recibo.detalle && dato('Por lo siguiente', recibo.detalle)}

                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>N°</TableHead>
                                        <TableHead className="text-right">Importe</TableHead>
                                        <TableHead>Observaciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {detalle.map(d => (
                                        <TableRow key={d.id_detalle}>
                                            <TableCell>{d.abre_documento || d.tipo_documento || '—'}</TableCell>
                                            <TableCell>{d.documento_completo || '—'}</TableCell>
                                            <TableCell className="text-right">
                                                {simbolo} {Number(d.importe).toFixed(2)}
                                            </TableCell>
                                            <TableCell>{d.observaciones || '—'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-right font-bold">TOTAL</TableCell>
                                        <TableCell className="text-right font-bold">
                                            {simbolo} {Number(recibo.total).toFixed(2)}
                                        </TableCell>
                                        <TableCell>{recibo.observacion || ''}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>

                        {dato('La cantidad de', recibo.total_letras)}

                        {recibo.estado === 'ANULADO' && (
                            <div className="rounded-md border border-red-200 bg-red-50 p-3">
                                <p className="text-xs font-semibold text-red-800">Motivo de anulación</p>
                                <p className="text-sm text-red-700">{recibo.motivo_anulacion}</p>
                            </div>
                        )}

                        {recibo.whatsapp_estado && recibo.whatsapp_estado !== 'OK' && (
                            <p className="text-xs text-amber-700">
                                WhatsApp: {recibo.whatsapp_detalle}
                            </p>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                    <Button
                        disabled={!urlPdf}
                        title={urlPdf ? undefined : 'El PDF no se pudo generar'}
                        onClick={() => urlPdf && window.open(urlPdf, '_blank')}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
