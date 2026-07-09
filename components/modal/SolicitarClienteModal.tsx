'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Search } from "lucide-react"
import { toast } from "@/app/hooks/useToast"
import { ClientService } from "@/app/services/client/ClientService"

interface SolicitarClienteModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSolicitudCreada?: () => void
    user: string
}

export default function SolicitarClienteModal({ open, onOpenChange, onSolicitudCreada, user }: SolicitarClienteModalProps) {
    const [ruc, setRuc] = useState("")
    const [loading, setLoading] = useState(false)

    const handleClose = () => {
        if (loading) return
        setRuc("")
        onOpenChange(false)
    }

    const handleEnviar = async () => {
        const rucLimpio = ruc.trim()
        if (rucLimpio.length !== 11 || !/^\d+$/.test(rucLimpio)) {
            toast({ title: "RUC inválido", description: "El RUC debe tener exactamente 11 dígitos.", variant: "destructive" })
            return
        }
        setLoading(true)
        try {
            await ClientService.crearSolicitudCliente(rucLimpio, user)
            toast({ description: "Solicitud enviada correctamente. El resultado estará disponible en unos minutos." })
            setRuc("")
            onOpenChange(false)
            onSolicitudCreada?.()
        } catch (error) {
            toast({ title: "Error", description: "No se pudo enviar la solicitud. Intente de nuevo.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Solicitar Nuevo Cliente</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="ruc-solicitud">RUC del establecimiento</Label>
                        <Input
                            id="ruc-solicitud"
                            type="text"
                            inputMode="numeric"
                            maxLength={11}
                            placeholder="Ej: 20613786768"
                            value={ruc}
                            onChange={(e) => setRuc(e.target.value.replace(/\D/g, ""))}
                            disabled={loading}
                            onKeyDown={(e) => e.key === "Enter" && handleEnviar()}
                        />
                        {/*<p className="text-xs text-muted-foreground">*/}
                        {/*    Se consultará la información del establecimiento en DIGEMID. El resultado puede demorar entre 4 y 5 minutos.*/}
                        {/*</p>*/}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleEnviar} disabled={loading || ruc.length !== 11} className="bg-blue-600 hover:bg-blue-700">
                        {loading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                        ) : (
                            <><Search className="mr-2 h-4 w-4" /> Enviar</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
