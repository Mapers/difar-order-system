import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Phone, Loader2, Save } from "lucide-react"

interface ContactConfirmModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialEmail: string
    initialPhone: string
    onConfirm: (email: string, phone: string) => void
    isProcessing: boolean
}

export function ContactConfirmModal({
                                        open,
                                        onOpenChange,
                                        initialEmail,
                                        initialPhone,
                                        onConfirm,
                                        isProcessing
                                    }: ContactConfirmModalProps) {
    const [email, setEmail] = useState(initialEmail)
    const [phone, setPhone] = useState(initialPhone)

    // Resetear valores cuando se abre el modal
    useEffect(() => {
        if (open) {
            setEmail(initialEmail || "")
            setPhone(initialPhone || "")
        }
    }, [open, initialEmail, initialPhone])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Confirmar Datos de Contacto</DialogTitle>
                    <DialogDescription>
                        Verifique o actualice los datos de envío del comprobante.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="h-4 w-4" /> Correo Electrónico
                        </Label>
                        <Input
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="cliente@ejemplo.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="h-4 w-4" /> WhatsApp / Teléfono
                        </Label>
                        <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="999888777"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                        Atrás
                    </Button>
                    <Button
                        onClick={() => onConfirm(email, phone)}
                        disabled={isProcessing}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isProcessing ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
                        ) : (
                            <><Save className="mr-2 h-4 w-4" /> Guardar y Facturar</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}