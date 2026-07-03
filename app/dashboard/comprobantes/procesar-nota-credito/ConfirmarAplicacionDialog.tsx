'use client'

import {
    AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, HelpCircle, Loader2 } from "lucide-react"

export type FaseAplicacion = 'confirmar' | 'procesando' | 'exito'

interface ConfirmarAplicacionDialogProps {
    open:        boolean
    fase:        FaseAplicacion
    ncRef:       string
    facRef:      string
    onCancelar:  () => void
    onConfirmar: () => void
    onCerrar:    () => void
}

export function ConfirmarAplicacionDialog({
    open, fase, ncRef, facRef, onCancelar, onConfirmar, onCerrar,
}: ConfirmarAplicacionDialogProps) {
    return (
        <AlertDialog open={open}>
            <AlertDialogContent className="max-w-sm text-center">
                {fase === 'confirmar' && (
                    <>
                        <AlertDialogHeader className="items-center text-center">
                            <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                <HelpCircle className="h-6 w-6" />
                            </div>
                            <AlertDialogTitle>¿Desea proceder con la aplicación?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Se aplicará la nota de crédito <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-medium text-foreground">{ncRef}</span>{' '}
                                con la factura <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-medium text-foreground">{facRef}</span>.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="mt-4 flex justify-center gap-2">
                            <Button variant="outline" onClick={onCancelar}>Cancelar</Button>
                            <Button onClick={onConfirmar}>Aceptar</Button>
                        </div>
                    </>
                )}

                {fase === 'procesando' && (
                    <div className="py-4">
                        <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />
                        <h4 className="text-base font-semibold">Procesando…</h4>
                        <p className="mt-1 text-sm text-muted-foreground">Aplicando la nota de crédito al comprobante.</p>
                    </div>
                )}

                {fase === 'exito' && (
                    <>
                        <AlertDialogHeader className="items-center text-center">
                            <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <AlertDialogTitle>¡Procesado exitosamente!</AlertDialogTitle>
                            <AlertDialogDescription>
                                La nota de crédito <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-medium text-foreground">{ncRef}</span>{' '}
                                se aplicó correctamente a la factura <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-medium text-foreground">{facRef}</span>.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="mt-4 flex justify-center">
                            <Button onClick={onCerrar}>Aceptar</Button>
                        </div>
                    </>
                )}
            </AlertDialogContent>
        </AlertDialog>
    )
}
