'use client'

import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface Ruta {
    id: number
    nombre: string
    dia: string
    vendedorId: number
    vendedorNombre: string
    clientes: any[]
    fechaCreacion: string
    activa: boolean
    zona: string
    zonaNombre: string
    fechaCrea: string
    estado: string
}

interface DeleteRutaModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    rutaEditando: Ruta | null
    onEliminarRuta: (rutaId: number) => void
}

export function DeleteRutaModal({
                                    isOpen,
                                    onOpenChange,
                                    rutaEditando,
                                    onEliminarRuta,
                                }: DeleteRutaModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-blue-600" />
                        Está seguro que quiere eliminar?
                    </DialogTitle>
                    <DialogDescription>
                        Se eliminará el registro, todas sus direcciones y progresos
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="flex-1"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => onEliminarRuta(rutaEditando?.id || 0)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                        Eliminar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}