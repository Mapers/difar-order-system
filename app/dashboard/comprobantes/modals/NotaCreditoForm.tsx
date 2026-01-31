'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Comprobante } from "@/interface/order/order-interface"
import { Loader2, Save, FileDiff } from "lucide-react"
import apiClient from "@/app/api/client"
import { toast } from "@/components/ui/use-toast"
import { Sequential } from "@/app/dashboard/configuraciones/page"

interface NotaCreditoFormProps {
    comprobante: Comprobante
    onClose: () => void
    onSuccess: () => void
}

export function NotaCreditoForm({ comprobante, onClose, onSuccess }: NotaCreditoFormProps) {
    const [loading, setLoading] = useState(false)
    const [observaciones, setObservaciones] = useState("")
    const [motivo, setMotivo] = useState("01")

    const [tiposComprobante, setTiposComprobante] = useState<Sequential[]>([])
    const [selectedSerie, setSelectedSerie] = useState("")

    const motivos = [
        { code: "01", label: "Anulación de la operación" },
        { code: "02", label: "Anulación por error en el RUC" },
        { code: "03", label: "Corrección por error en la descripción" },
        { code: "06", label: "Devolución total" },
        { code: "07", label: "Devolución por ítem" },
        { code: "13", label: "Ajustes - montos y/o fechas de pago" },
    ]

    useEffect(() => {
        const fetchSeries = async () => {
            try {
                const response = await apiClient.get('/admin/listar/secuenciales')
                const allSeries = response.data.data

                const seriesNC = allSeries.filter((s: Sequential) => s.tipo === '07' || s.tipo === '7')
                setTiposComprobante(seriesNC)

                if (seriesNC.length > 0) {
                    setSelectedSerie(`${seriesNC[0].prefijo}|${seriesNC[0].tipo}`)
                }
            } catch (error) {
                console.error("Error cargando series:", error)
                toast({ title: "Error", description: "No se pudieron cargar las series", variant: "destructive" })
            }
        }
        fetchSeries()
    }, [])

    const handleSubmit = async () => {
        if (!selectedSerie) {
            toast({ title: "Requerido", description: "Seleccione una serie para la nota de crédito", variant: "destructive" })
            return
        }

        if (!observaciones && motivo === "01") {
            toast({ title: "Requerido", description: "Ingrese una observación para la anulación", variant: "destructive" })
            return
        }

        setLoading(true)
        try {
            const [prefijo, tipo] = selectedSerie.split('|')

            await apiClient.post(`/pedidos/generateNotaCredito`, {
                idComprobanteRef: comprobante.idComprobanteCab,
                nroPedido: comprobante.nroPedido,
                motivo: motivo,
                observaciones: observaciones,
                prefijo: prefijo,
                tipoCompr: tipo
            })

            toast({ title: "Éxito", description: "Nota de crédito generada correctamente" })
            onSuccess()
        } catch (error: any) {
            console.error(error)
            const msg = error.response?.data?.message || "Error al generar la nota de crédito"
            toast({ title: "Error", description: msg, variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="bg-gray-50 py-3">
                        <CardTitle className="text-sm font-medium text-gray-700">Documento a Modificar</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Documento:</span>
                            <span className="font-bold">{comprobante.serie}-{comprobante.numero}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Tipo:</span>
                            <span>{comprobante.tipo_comprobante === 1 ? 'Factura' : 'Boleta'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Cliente:</span>
                            <span className="truncate max-w-[200px]" title={comprobante.cliente_denominacion}>
                                {comprobante.cliente_denominacion}
                            </span>
                        </div>
                        <div className="flex justify-between border-t pt-2 mt-2">
                            <span className="text-gray-900 font-semibold">Total Original:</span>
                            <span className="font-bold text-blue-600">
                                {comprobante.moneda === 1 ? 'S/' : '$'} {Number(comprobante.total).toFixed(2)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="bg-blue-50 py-3">
                        <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                            <FileDiff className="h-4 w-4" /> Datos de la Nota
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="serieSelect" className="text-xs font-semibold uppercase text-gray-500">
                                Serie de Nota de Crédito
                            </Label>
                            <Select value={selectedSerie} onValueChange={setSelectedSerie}>
                                <SelectTrigger id="serieSelect" className="bg-white">
                                    <SelectValue placeholder="Seleccionar serie" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tiposComprobante.length > 0 ? (
                                        tiposComprobante.map((tipo) => (
                                            <SelectItem key={tipo.prefijo} value={tipo.prefijo + '|' + tipo.tipo}>
                                                {tipo.prefijo} - {tipo.nombre || 'Nota de Crédito'}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-2 text-xs text-center text-gray-500">No hay series (07) disponibles</div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="motivoSelect" className="text-xs font-semibold uppercase text-gray-500">
                                Motivo SUNAT
                            </Label>
                            <Select value={motivo} onValueChange={setMotivo}>
                                <SelectTrigger id="motivoSelect" className="bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {motivos.map(m => (
                                        <SelectItem key={m.code} value={m.code}>
                                            <span className="font-mono text-gray-500 mr-2">{m.code}</span>
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-2">
                <Label htmlFor="obs" className="text-sm font-medium">
                    Observaciones / Sustento <span className="text-red-500">*</span>
                </Label>
                <Textarea
                    id="obs"
                    placeholder="Escriba el motivo detallado de la emisión de esta nota de crédito (obligatorio para anulación)..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className="min-h-[100px] resize-none"
                />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={onClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading || !selectedSerie}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Emitir Nota de Crédito
                </Button>
            </div>
        </div>
    )
}