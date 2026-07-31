'use client'

import {
    AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface ReiniciarVoucherDialogProps {
    open:             boolean
    onOpenChange:     (open: boolean) => void
    numeroVoucher:    number | null
    onConfirmar:      () => void
}

export function ReiniciarVoucherDialog({ open, onOpenChange, numeroVoucher, onConfirmar }: ReiniciarVoucherDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-sm text-center">
                <AlertDialogHeader className="items-center text-center">
                    <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <AlertDialogTitle>¿Descartar el asiento en curso?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Se borrarán todas las líneas del detalle y se volverá a consultar el correlativo
                        del voucher{' '}
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-medium text-foreground">
                            {numeroVoucher ?? '—'}
                        </span>. El asiento aún no está guardado, así que no se elimina nada de la base de datos.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="sm:justify-center">
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <Button variant="destructive" onClick={onConfirmar}>Descartar y reiniciar</Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
