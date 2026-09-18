'use client'

import { useEffect, useState } from 'react'
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink, FileText, ImageOff, Loader2, Maximize2, Trash2 } from 'lucide-react'
import { publicApi } from '@/app/api/client'
import { CobranzaAsignada, EvidenciaCobranza } from '@/app/types/cobranza-types'
import { ImagenAmpliadaModal } from './ImagenAmpliadaModal'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    cobranza: CobranzaAsignada | null
    obtenerEvidencia: (idAsignacion: number) => Promise<EvidenciaCobranza | null>
    onEliminar?: (idAsignacion: number) => Promise<boolean>
}

const esPdf = (ruta: string) => /\.pdf$/i.test(ruta)

export function EvidenciaCobranzaModal({ open, onOpenChange, cobranza, obtenerEvidencia, onEliminar }: Props) {
    const [evidencia, setEvidencia] = useState<EvidenciaCobranza | null>(null)
    const [cargando, setCargando] = useState(false)
    const [ampliada, setAmpliada] = useState(false)
    const [eliminando, setEliminando] = useState(false)
    const [confirmarEliminar, setConfirmarEliminar] = useState(false)

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

    const eliminar = async () => {
        if (!onEliminar || !cobranza || !evidencia) return
        setConfirmarEliminar(false)
        setEliminando(true)
        const ok = await onEliminar(cobranza.id_asignacion)
        setEliminando(false)
        if (ok) {
            setEvidencia(null)
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[95dvh] max-w-lg flex-col overflow-hidden p-0">
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
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
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                            Subido por {evidencia.usuario || '—'}
                        </p>
                        {onEliminar && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={eliminando}
                                onClick={() => setConfirmarEliminar(true)}
                                className="gap-1.5 text-destructive hover:text-destructive"
                            >
                                {eliminando
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <Trash2 className="h-3.5 w-3.5" />}
                                Eliminar comprobante
                            </Button>
                        )}
                    </div>
                )}
                </div>
            </DialogContent>

            <ImagenAmpliadaModal
                open={ampliada}
                onOpenChange={setAmpliada}
                src={url && evidencia && !esPdf(evidencia.ruta) ? url : null}
                alt={evidencia?.nombre_archivo}
                titulo={`Comprobante ampliado — ${cobranza ? `${cobranza.serie}-${cobranza.numero}` : ''}`}
            />

            <AlertDialog open={confirmarEliminar} onOpenChange={setConfirmarEliminar}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar el comprobante?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {cobranza ? `El comprobante de ${cobranza.serie}-${cobranza.numero}` : 'El comprobante'} se
                            borra y no se puede recuperar.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={eliminar}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    )
}
