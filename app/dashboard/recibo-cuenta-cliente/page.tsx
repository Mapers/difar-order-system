'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/authContext'
import { ReciboForm } from '@/components/recibo-cliente/ReciboForm'
import { HistorialRecibos } from '@/components/recibo-cliente/HistorialRecibos'
import { ReciboDetalleModal } from '@/components/recibo-cliente/ReciboDetalleModal'

export default function ReciboCuentaClientePage() {
    const { user } = useAuth()

    const [tab, setTab] = useState('nuevo')
    const [reciboEmitido, setReciboEmitido] = useState<number | null>(null)

    if (!user?.recibo_cliente) {
        return (
            <div className="grid gap-6 p-4 md:p-6">
                <Card>
                    <CardContent className="py-16 text-center">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                            No tienes permisos para acceder a este módulo.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="grid gap-6 p-4 md:p-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    Recibo Cuenta Cliente
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Emite el recibo de cobranza del cliente; se envía a Gerencia por WhatsApp
                    y se imprime para firmar.
                </p>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                    <TabsTrigger value="nuevo">Nuevo recibo</TabsTrigger>
                    <TabsTrigger value="historial">Historial</TabsTrigger>
                </TabsList>

                <TabsContent value="nuevo" className="mt-4">
                    <ReciboForm onEmitido={(recibo) => setReciboEmitido(recibo.id_recibo)} />
                </TabsContent>

                <TabsContent value="historial" className="mt-4">
                    <HistorialRecibos />
                </TabsContent>
            </Tabs>

            <ReciboDetalleModal
                open={reciboEmitido != null}
                onOpenChange={(v) => { if (!v) setReciboEmitido(null) }}
                idRecibo={reciboEmitido}
            />
        </div>
    )
}
