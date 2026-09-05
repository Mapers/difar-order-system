'use client'

import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/authContext'
import { SeccionAdminCobranza } from '@/components/cobranza/SeccionAdminCobranza'
import { SeccionVendedorCobranza } from '@/components/cobranza/SeccionVendedorCobranza'

export default function AsignacionCobranzasPage() {
    const { isVendedor, isAdmin } = useAuth()

    return (
        <div className="grid w-full min-w-0 gap-6 [&>*]:min-w-0">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Asignación de Cobranzas
                </h1>
                <p className="text-muted-foreground">
                    {isVendedor()
                        ? 'Gestiona las facturas que te asignaron para cobrar.'
                        : 'Reparte las facturas por vencer entre los vendedores y sigue su gestión.'}
                </p>
            </div>

            {isVendedor() && <SeccionVendedorCobranza />}

            {isAdmin() && <SeccionAdminCobranza />}

            {!isVendedor() && !isAdmin() && (
                <Card>
                    <CardContent className="py-16 text-center">
                        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">
                            No tienes permisos para acceder a este módulo.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
