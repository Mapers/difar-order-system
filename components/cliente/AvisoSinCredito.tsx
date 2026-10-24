'use client'

import { useEffect, useState } from 'react'
import { CreditCard } from 'lucide-react'
import {
    AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CreditoCliente, tieneCreditoActivo } from '@/app/hooks/useCreditoCliente'

/**
 * Aviso que sale apenas se elige un cliente sin línea de crédito activa. Es
 * informativo: el pedido puede seguir (por ejemplo al contado).
 */
export function AvisoSinCredito({ credito, nombreCliente }: { credito: CreditoCliente | null; nombreCliente?: string }) {
    const [abierto, setAbierto] = useState(false)

    // Una vez por cliente consultado.
    useEffect(() => {
        if (credito && !tieneCreditoActivo(credito)) setAbierto(true)
    }, [credito])

    return (
        <AlertDialog open={abierto} onOpenChange={setAbierto}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 sm:mx-0">
                        <CreditCard className="h-6 w-6" />
                    </div>
                    <AlertDialogTitle>Cliente sin línea de crédito activa</AlertDialogTitle>
                    <AlertDialogDescription>
                        {nombreCliente || credito?.nombre} no tiene una línea de crédito activa.
                        Comunícate con el administrador para que la habilite.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction>Entendido</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
