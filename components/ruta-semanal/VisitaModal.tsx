'use client'

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CheckCircle, Locate, User } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface Direccion {
    id: string
    Nombre: string
    direccion: string
    NombreComercial: string
    latitud: number
    longitud: number
    telefono?: string
    estado: string
    comentario?: string
    ruta_cliente_id?: number
}

interface VisitaModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    selectedVisita: Direccion | null
    comentarioVisita: string
    setComentarioVisita: (value: string) => void
    onConfirmarVisita: () => void
}

export function VisitaModal({
                                isOpen,
                                onOpenChange,
                                selectedVisita,
                                comentarioVisita,
                                setComentarioVisita,
                                onConfirmarVisita,
                            }: VisitaModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Marcar Llegada</DialogTitle>
                    <DialogDescription>
                        Confirma tu llegada a {selectedVisita?.NombreComercial} y describe la visita
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-sm mb-1">{selectedVisita?.NombreComercial}</h4>
                        <p className="text-sm text-gray-600 flex items-center"><Locate className="h-4 w-4 mr-2 text-blue-600" /> {selectedVisita?.direccion}</p>
                        <p className="text-xs text-gray-500 flex items-center"><User className="h-4 w-4 mr-2 text-orange-600" /> {selectedVisita?.Nombre}</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="comentario">Comentario de la visita *</Label>
                        <Textarea
                            id="comentario"
                            placeholder="Describe los resultados obtenidos, observaciones, pedidos realizados, etc."
                            value={comentarioVisita}
                            onChange={(e) => setComentarioVisita(e.target.value)}
                            rows={4}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={onConfirmarVisita}
                        disabled={!comentarioVisita.trim()}
                        className="flex items-center gap-2"
                    >
                        <CheckCircle className="h-4 w-4" />
                        Confirmar Visita
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}