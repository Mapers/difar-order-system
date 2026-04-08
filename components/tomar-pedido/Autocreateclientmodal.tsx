'use client'
import React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog"
import { DialogTitle } from "@radix-ui/react-dialog"
import { Bot, Search, RefreshCw } from "lucide-react"

interface AutoCreateClientModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    documentNumber: string
    isCreating: boolean
    onAutoCreate: () => void
}

export default function AutoCreateClientModal({ open, onOpenChange, documentNumber, isCreating, onAutoCreate }: AutoCreateClientModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-indigo-700">
                        <Bot className="h-5 w-5" /> Auto-Completar desde SUNAT/RENIEC
                    </DialogTitle>
                    <DialogDescription className="pt-2">
                        El documento <strong className="text-gray-900">{documentNumber}</strong> no está registrado en el sistema.
                        <br /><br />
                        ¿Deseas buscarlo en línea y registrarlo automáticamente?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
                        Cancelar
                    </Button>
                    <Button type="button" className="bg-indigo-600 hover:bg-indigo-700" onClick={onAutoCreate} disabled={isCreating}>
                        {isCreating ? (
                            <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Buscando...</>
                        ) : (
                            <><Search className="h-4 w-4 mr-2" /> Buscar y Crear</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}