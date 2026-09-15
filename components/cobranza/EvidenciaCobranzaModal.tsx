'use client'

import { useEffect, useState } from 'react'
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink, FileText, ImageOff, Maximize2 } from 'lucide-react'
import { publicApi } from '@/app/api/client'
import { CobranzaAsignada, EvidenciaCobranza } from '@/app/types/cobranza-types'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    cobranza: CobranzaAsignada | null
    obtenerEvidencia: (idAsignacion: number) => Promise<EvidenciaCobranza | null>
}

const esPdf = (ruta: string) => /\.pdf$/i.test(ruta)

export function EvidenciaCobranzaModal({ open, onOpenChange, cobranza, obtenerEvidencia }: Props) {
    const [evidencia, setEvidencia] = useState<EvidenciaCobranza | null>(null)
    const [cargando, setCargando] = useState(false)
    const [ampliada, setAmpliada] = useState(false)

    useEffect(() => {
        if (!open) setAmpliada(false)
    }, [open])

    useEffect(() => {
        if (!open || !cobranza) { setEvidencia(null); return }

        let cancelado = false
        setCargando(true)

        obtenerEvidencia(cobranza.id_asignacion)
            .then(e => { if (!cancelado) setEvidencia(e) })
            .finally(() => { if (!cancelado) setCargando(false) })

        return () => { cancelado = true }
    }, [open, cobranza, obtenerEvidencia])

    const url = evidencia ? `${publicApi}${evidencia.ruta}` : null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[95vh] max-w-lg overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">
                        Comprobante — {cobranza ? `${cobranza.serie}-${cobranza.numero}` : ''}
                    </DialogTitle>
                    <DialogDescription>
                        {cobranza?.cliente_denominacion || 'Evidencia de pago'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-[220px] items-center justify-center rounded-lg border bg-muted/40 p-2">
                    {cargando && <Skeleton className="h-[200px] w-full" />}

                    {!cargando && url && !esPdf(evidencia!.ruta) && (
                        <div className="relative">
                            <img
                                src={url}
                                alt={evidencia!.nombre_archivo}
                                onClick={() => setAmpliada(true)}
                                className="max-h-[320px] w-auto max-w-full cursor-zoom-in rounded object-contain"
                            />
                            <button
                                type="button"
                                onClick={() => setAmpliada(true)}
                                className="absolute right-1.5 top-1.5 rounded-md bg-black/60 p-1.5 text-white hover:bg-black/75"
                                aria-label="Maximizar comprobante"
                            >
                                <Maximize2 className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {!cargando && url && esPdf(evidencia!.ruta) && (
                        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                            <FileText className="h-12 w-12 text-red-600 dark:text-red-400" />
                            <p className="max-w-full truncate text-sm font-medium">{evidencia!.nombre_archivo}</p>
                            <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-xs font-medium text-sky-700 dark:text-sky-400 hover:underline"
                            >
                                <ExternalLink className="h-3.5 w-3.5" /> Abrir el PDF
                            </a>
                        </div>
                    )}

                    {!cargando && !url && (
                        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                            <ImageOff className="h-10 w-10 text-muted-foreground" />
                            <p className="text-sm font-medium">Esta cobranza no tiene comprobante</p>
                        </div>
                    )}
                </div>

                {evidencia && (
                    <p className="text-xs text-muted-foreground">
                        Subido por {evidencia.usuario || '—'}
                    </p>
                )}
            </DialogContent>

            {url && evidencia && !esPdf(evidencia.ruta) && (
                <Dialog open={ampliada} onOpenChange={setAmpliada}>
                    <DialogContent className="flex max-h-[96vh] max-w-[96vw] items-center justify-center border-none bg-transparent p-2 shadow-none sm:max-w-[96vw]">
                        <DialogTitle className="sr-only">
                            Comprobante ampliado — {cobranza ? `${cobranza.serie}-${cobranza.numero}` : ''}
                        </DialogTitle>
                        <img
                            src={url}
                            alt={evidencia.nombre_archivo}
                            className="max-h-[92vh] max-w-full rounded-lg object-contain"
                        />
                    </DialogContent>
                </Dialog>
            )}
        </Dialog>
    )
}
