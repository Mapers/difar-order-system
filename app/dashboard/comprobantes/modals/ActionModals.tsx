import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, MessageCircle, Loader2 } from "lucide-react"

interface EmailModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultEmail: string
    onSend: (email: string) => void
    loading: boolean
}

export function EmailModal({
                               open, onOpenChange, defaultEmail, onSend, loading,
}: EmailModalProps) {
    const [email, setEmail] = useState("")

    useEffect(() => {
        if (open) setEmail(defaultEmail || "")
    }, [open, defaultEmail])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Enviar por Correo</DialogTitle>
                    <DialogDescription>Ingrese el correo electrónico del destinatario.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@empresa.com" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={() => onSend(email)} disabled={loading || !email}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enviar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface WhatsAppModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultPhone: string
    onSend: (phone: string) => void
    loading: boolean
}

export function WhatsAppModal({ open, onOpenChange, defaultPhone, onSend, loading }: WhatsAppModalProps) {
    const [phone, setPhone] = useState("")

    useEffect(() => {
        if (open) setPhone(defaultPhone || "")
    }, [open, defaultPhone])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-green-600" /> Enviar por WhatsApp</DialogTitle>
                    <DialogDescription>Ingrese el número de celular (con código de país si es necesario).</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Número de Celular</Label>
                        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="999888777" type="tel" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={() => onSend(phone)} disabled={loading || !phone} className="bg-green-600 hover:bg-green-700">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enviar Mensaje
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}