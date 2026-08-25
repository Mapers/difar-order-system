'use client'

import { Button } from '@/components/ui/button'
import { Lock, Loader2, Clock, ShieldCheck, XCircle } from 'lucide-react'

const mmss = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

interface Props {
    pendiente:      boolean
    expirada:       boolean
    rechazada:      boolean
    resueltoNombre: string | null
    segundosEspera: number
    solicitando:    boolean
    onSolicitar:    () => void
}

export function BloqueoReciboOverlay({
    pendiente, expirada, rechazada, resueltoNombre, segundosEspera, solicitando, onSolicitar,
}: Props) {
    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-[2px]">
            <div className="mx-4 w-full max-w-sm rounded-lg border bg-card p-6 text-center shadow-lg">
                {pendiente ? (
                    <>
                        <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-blue-600" />
                        <h3 className="text-base font-semibold">Esperando aprobación</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Tu solicitud fue enviada a Gerencia.
                        </p>
                        <p className="mt-3 flex items-center justify-center gap-1.5 font-mono text-sm font-semibold">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {mmss(segundosEspera)}
                        </p>
                    </>
                ) : (
                    <>
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            {rechazada
                                ? <XCircle className="h-6 w-6 text-red-600" />
                                : <Lock className="h-6 w-6 text-muted-foreground" />}
                        </div>

                        <h3 className="text-base font-semibold">
                            {rechazada
                                ? 'Solicitud rechazada'
                                : expirada
                                    ? 'Nadie respondió a tiempo'
                                    : 'Formulario bloqueado'}
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                            {rechazada
                                ? `${resueltoNombre || 'Gerencia'} rechazó tu solicitud. Puedes volver a pedirlo.`
                                : expirada
                                    ? 'Tu solicitud expiró sin respuesta. Puedes volver a pedirlo.'
                                    : 'Necesitas autorización de Gerencia para emitir recibos.'}
                        </p>

                        <Button onClick={onSolicitar} disabled={solicitando} className="mt-4 w-full gap-1.5">
                            {solicitando
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <ShieldCheck className="h-4 w-4" />}
                            Solicitar permiso
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}
