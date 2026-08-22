'use client'

import {
    AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2 } from "lucide-react"
import { ProcesoNcHistorial } from "@/app/types/procesar-nota-credito-types"

interface Props {
    proceso:     ProcesoNcHistorial | null
    revirtiendo: boolean
    onCancelar:  () => void
    onConfirmar: () => void
}

export function RevertirProcesoDialog({ proceso, revirtiendo, onCancelar, onConfirmar }: Props) {
    return (
        <AlertDialog open={!!proceso}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader className="items-center text-center">
                    <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <AlertDialogTitle>¿Revertir el asiento #{proceso?.item}?</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3 text-center">
                            <p>
                                Se deshará la aplicación de{' '}
                                <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-medium text-foreground">
                                    {proceso?.nc_documento ?? '—'}
                                </span>{' '}
                                sobre{' '}
                                <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-medium text-foreground">
                                    {proceso?.doc_aplicado ?? '—'}
                                </span>.
                            </p>

                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-left">
                                <p className="text-xs font-medium text-red-800">
                                    Se eliminarán las filas del asiento en:
                                </p>
                                <ul className="mt-1.5 list-inside list-disc text-xs text-red-700">
                                    <li>diario encabezado y diario centralización</li>
                                    <li>mayor auxiliar</li>
                                    <li>kardex clientes y kardex proveedores</li>
                                </ul>
                                <p className="mt-2 text-xs text-red-700">
                                    Las provisiones originales de los documentos no se tocan.
                                    El proceso desaparecerá del historial y no se puede deshacer.
                                </p>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="mt-4 flex justify-center gap-2">
                    <Button variant="outline" onClick={onCancelar} disabled={revirtiendo}>
                        Cancelar
                    </Button>
                    <Button variant="destructive" onClick={onConfirmar} disabled={revirtiendo} className="gap-1.5">
                        {revirtiendo && <Loader2 className="h-4 w-4 animate-spin" />}
                        {revirtiendo ? "Revirtiendo…" : "Sí, revertir"}
                    </Button>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    )
}
