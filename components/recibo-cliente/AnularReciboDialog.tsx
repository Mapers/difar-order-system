'use client'

import { useEffect, useState } from 'react'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle } from 'lucide-react'
import { ReciboCabecera } from '@/app/types/recibo-cliente-types'

interface Props {
    open: boolean
    onOpenChange: (v: boolean) => void
    recibo: ReciboCabecera | null
    onConfirmar: (motivo: string) => void
}

export function AnularReciboDialog({ open, onOpenChange, recibo, onConfirmar }: Props) {
    const [motivo, setMotivo] = useState('')

    useEffect(() => {
        if (open) setMotivo('')
    }, [open])

    const confirmar = () => {
        const m = motivo.trim()
        if (!m) return
        onConfirmar(m)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        Anular recibo {recibo?.numero_recibo}
                    </DialogTitle>
                    <DialogDescription>
                        El recibo no se borra: queda marcado como anulado y su PDF sale con la
                        marca de agua correspondiente.
                    </DialogDescription>
                </DialogHeader>

                <div>
                    <Label htmlFor="motivo-anulacion">
                        Motivo <span className="text-red-600">*</span>
                    </Label>
                    <Textarea
                        id="motivo-anulacion"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        className="mt-1"
                        rows={3}
                        placeholder="Por qué se anula este recibo"
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button variant="destructive" onClick={confirmar} disabled={!motivo.trim()}>
                        Anular recibo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
