'use client'

import { useEffect, useState } from 'react'
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink, FileText, FileWarning } from 'lucide-react'
import { VouchersRecibo } from './VouchersRecibo'
import { publicApi } from '@/app/api/client'
import { useReciboCliente } from '@/app/hooks/useReciboCliente'
import {
    CONCEPTOS, TIPOS_LIQUIDACION, ReciboCabecera, simboloMoneda,
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
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!open || idRecibo == null) return

        setLoading(true)
        setRecibo(null)

        obtenerRecibo(idRecibo)
            .then(data => {
                if (!data) return
                setRecibo(data.recibo)
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
                        Detalle del recibo, vouchers adjuntos y vista previa del documento.
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
                            {dato('Total', `${simbolo} ${Number(recibo.total).toFixed(2)}`)}
                        </div>

                        {recibo.detalle && dato('Por lo siguiente', recibo.detalle)}

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

                        <VouchersRecibo
                            idRecibo={idRecibo}
                            anulado={recibo.estado === 'ANULADO'}
                            idEmisor={recibo.id_usuario_web ?? null}
                            abierto={open}
                        />

                        {urlPdf ? (
                            <div className="rounded-lg border">
                                <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
                                    <span className="text-sm font-semibold">Documento</span>
                                    <a
                                        href={urlPdf}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline sm:hidden"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Abrir el PDF
                                    </a>
                                </div>
                                <iframe
                                    src={urlPdf}
                                    title={`Recibo ${recibo.numero_recibo}`}
                                    className="h-[420px] w-full rounded-b-lg sm:h-[520px]"
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center">
                                <FileWarning className="h-8 w-8 text-muted-foreground" />
                                <p className="text-sm font-medium">El PDF de este recibo no se generó</p>
                                <p className="text-xs text-muted-foreground">
                                    El recibo está guardado; solo falta el documento.
                                </p>
                            </div>
                        )}
                    </div>
                )}

            </DialogContent>
        </Dialog>
    )
}
