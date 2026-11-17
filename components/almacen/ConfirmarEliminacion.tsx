'use client'

import { useState } from "react"
import { AlertTriangle, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

/**
 * Modal de confirmación para eliminar (nota, filas). Se pinta por encima del modal de la nota
 * (z más alto) y muestra qué se va a borrar. El botón espera a que termine la operación.
 */
export function ConfirmarEliminacion({ abierto, titulo, descripcion, detalle, textoAccion = 'Eliminar', onAceptar, onCancelar }: {
    abierto: boolean
    titulo: string
    descripcion: string
    /** Líneas que se van a borrar (artículo, cantidad…), para revisarlas antes de aceptar. */
    detalle?: string[]
    textoAccion?: string
    onAceptar: () => Promise<void> | void
    onCancelar: () => void
}) {
    const [trabajando, setTrabajando] = useState(false)
    const aceptar = async () => {
        setTrabajando(true)
        try { await onAceptar() } finally { setTrabajando(false) }
    }
    return (
        <Dialog open={abierto} onOpenChange={o => { if (!o && !trabajando) onCancelar() }}>
            <DialogContent className="z-[80] max-w-md gap-0 overflow-hidden p-0 sm:rounded-2xl" closeClassName="text-white opacity-90 hover:opacity-100">
                <DialogHeader className="bg-gradient-to-br from-red-500 via-red-600 to-rose-700 px-5 py-4 text-left text-white">
                    <div className="flex items-center gap-3">
                        <span className="almacen-exito flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/10">
                            <AlertTriangle className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 pr-6">
                            <DialogTitle className="text-base font-bold leading-tight">{titulo}</DialogTitle>
                            <DialogDescription className="mt-0.5 text-xs text-red-50">No se puede deshacer.</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <div className="space-y-3 px-5 py-4 text-sm">
                    <p className="text-muted-foreground">{descripcion}</p>
                    {detalle && detalle.length > 0 && (
                        <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-red-200 bg-red-50/60 p-2.5 text-xs dark:border-red-900 dark:bg-red-950/30">
                            {detalle.map((d, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-red-900 dark:text-red-200">
                                    <Trash2 className="mt-0.5 h-3 w-3 shrink-0 opacity-70" /> <span className="min-w-0 break-words">{d}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="flex gap-2 border-t bg-muted/30 px-5 py-3 sm:justify-end">
                    <Button variant="outline" className="flex-1 sm:flex-none" disabled={trabajando} onClick={onCancelar}>Cancelar</Button>
                    <Button className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/25 hover:from-red-700 hover:to-rose-700 sm:flex-none"
                            disabled={trabajando} onClick={aceptar}>
                        {trabajando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} {textoAccion}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
