'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, XCircle, FileText, User, Calendar } from "lucide-react"

interface AuthorizationModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    pedido: any
    action: 'authorize' | 'reject'
    onConfirm: () => void
    loading?: boolean
}

export function AuthorizationModal({
                                       open,
                                       onOpenChange,
                                       pedido,
                                       action,
                                       onConfirm,
                                       loading = false
                                   }: AuthorizationModalProps) {
    const isAuthorize = action === 'authorize'

    const getActionDetails = () => {
        if (isAuthorize) {
            return {
                title: "Autorizar Pedido",
                description: "¿Está seguro que desea autorizar este pedido?",
                icon: CheckCircle,
                iconColor: "text-green-600",
                buttonText: "Sí, Autorizar",
                buttonVariant: "default" as const,
                buttonClass: "bg-green-600 hover:bg-green-700"
            }
        } else {
            return {
                title: "Rechazar Pedido",
                description: "¿Está seguro que desea rechazar este pedido?",
                icon: XCircle,
                iconColor: "text-red-600",
                buttonText: "Sí, Rechazar",
                buttonVariant: "destructive" as const,
                buttonClass: ""
            }
        }
    }

    const details = getActionDetails()
    const Icon = details.icon

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${details.iconColor}`} />
                        <DialogTitle>{details.title}</DialogTitle>
                    </div>
                    <DialogDescription>
                        {details.description}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant={details.buttonVariant}
                        className={details.buttonClass}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? "Procesando..." : details.buttonText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}