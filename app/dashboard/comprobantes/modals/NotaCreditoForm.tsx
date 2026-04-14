'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Comprobante } from "@/app/types/order/order-interface"
import { Loader2, Save, FileDiff } from "lucide-react"
import apiClient from "@/app/api/client"
import { toast } from "@/components/ui/use-toast"
import {Sequential} from "@/app/types/config-types";

interface NotaCreditoFormProps {
    comprobante: Comprobante
    onClose: () => void
    onSuccess: () => void
}

interface FormErrors {
    selectedSerie?: string
    motivo?:        string
    idOperacion?:   string
    observaciones?: string
}

export function NotaCreditoForm({ comprobante, onClose, onSuccess }: NotaCreditoFormProps) {
    const [loading,        setLoading]        = useState(false)
    const [observaciones,  setObservaciones]  = useState("")
    const [motivo,         setMotivo]         = useState("01")
    const [tiposComprobante, setTiposComprobante] = useState<Sequential[]>([])
    const [selectedSerie,  setSelectedSerie]  = useState("")
    const [operaciones,    setOperaciones]    = useState<any[]>([])
    const [idOperacion,    setIdOperacion]    = useState<string>("")
    const [errors,         setErrors]         = useState<FormErrors>({})

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
                if (seriesNC.length > 0) setSelectedSerie(`${seriesNC[0].prefijo}|${seriesNC[0].tipo}`)

                const resOps = await apiClient.get('/admin/listar/operaciones')
                setOperaciones(resOps.data.data || [])
                if (resOps.data.data.length > 0) setIdOperacion(resOps.data.data[0].Codigo_Op)
            } catch (error) {
                console.error("Error cargando series:", error)
                toast({ title: "Error", description: "No se pudieron cargar las series", variant: "destructive" })
            }
        }
        fetchSeries()
    }, [])

    // ✅ Limpiar error del campo al modificarlo
    const clearError = (field: keyof FormErrors) => {
        setErrors(prev => ({ ...prev, [field]: undefined }))
    }

    // ✅ Validación completa antes de enviar
    const validate = (): boolean => {
        const newErrors: FormErrors = {}

        if (!selectedSerie)
            newErrors.selectedSerie = "Seleccione una serie para la nota de crédito"

        if (!motivo)
            newErrors.motivo = "Seleccione el motivo de la nota de crédito"

        if (!idOperacion)
            newErrors.idOperacion = "Seleccione el tipo de operación"

        if (!observaciones.trim())
            newErrors.observaciones = "Las observaciones son obligatorias"
        else if (observaciones.trim().length < 5)
            newErrors.observaciones = "Las observaciones deben tener al menos 5 caracteres"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validate()) return

        setLoading(true)
        try {
            const [prefijo, tipo] = selectedSerie.split('|')
            await apiClient.post(`/pedidos/generateNotaCredito`, {
                idComprobanteRef: comprobante.idComprobanteCab,
                nroPedido:        comprobante.nroPedido,
                motivo,
                observaciones:    observaciones.trim(),
                prefijo,
                tipoCompr:        tipo,
                codOperacion:     idOperacion
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

    // ✅ Helper para mostrar error bajo el campo
    const FieldError = ({ field }: { field: keyof FormErrors }) =>
        errors[field]
            ? <p className="text-xs text-red-500 mt-1">{errors[field]}</p>
            : null

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Documento original — sin cambios */}
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

                {/* Datos de la nota */}
                <Card>
                    <CardHeader className="bg-blue-50 py-3">
                        <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                            <FileDiff className="h-4 w-4" /> Datos de la Nota
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">

                        {/* Serie */}
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold uppercase text-gray-500">
                                Serie de Nota de Crédito <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={selectedSerie}
                                onValueChange={(v) => { setSelectedSerie(v); clearError('selectedSerie') }}
                            >
                                <SelectTrigger className={`bg-white ${errors.selectedSerie ? 'border-red-400 focus:ring-red-400' : ''}`}>
                                    <SelectValue placeholder="Seleccionar serie" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tiposComprobante.length > 0 ? (
                                        tiposComprobante.map(tipo => (
                                            <SelectItem key={tipo.prefijo} value={`${tipo.prefijo}|${tipo.tipo}`}>
                                                {tipo.prefijo} - {tipo.nombre || 'Nota de Crédito'}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-2 text-xs text-center text-gray-500">
                                            No hay series (07) disponibles
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                            <FieldError field="selectedSerie" />
                        </div>

                        {/* Motivo */}
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold uppercase text-gray-500">
                                Motivo SUNAT <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={motivo}
                                onValueChange={(v) => { setMotivo(v); clearError('motivo') }}
                            >
                                <SelectTrigger className={`bg-white ${errors.motivo ? 'border-red-400 focus:ring-red-400' : ''}`}>
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
                            <FieldError field="motivo" />
                        </div>

                        {/* Tipo operación */}
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold uppercase text-gray-500">
                                Tipo operación <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={idOperacion}
                                onValueChange={(v) => { setIdOperacion(v); clearError('idOperacion') }}
                            >
                                <SelectTrigger className={`bg-white ${errors.idOperacion ? 'border-red-400 focus:ring-red-400' : ''}`}>
                                    <SelectValue placeholder="Seleccione el tipo de operación" />
                                </SelectTrigger>
                                <SelectContent>
                                    {operaciones.map(op => (
                                        <SelectItem key={op.Codigo_Op} value={op.Codigo_Op}>
                                            <span className="font-mono text-gray-500 mr-2">{op.Operacion}</span>
                                            {op.descripcion}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError field="idOperacion" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Observaciones */}
            <div className="space-y-1">
                <Label htmlFor="obs" className="text-sm font-medium">
                    Observaciones / Sustento <span className="text-red-500">*</span>
                </Label>
                <Textarea
                    id="obs"
                    placeholder="Escriba el motivo detallado de la emisión de esta nota de crédito..."
                    value={observaciones}
                    onChange={(e) => { setObservaciones(e.target.value); clearError('observaciones') }}
                    className={`min-h-[100px] resize-none ${errors.observaciones ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                />
                <FieldError field="observaciones" />
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
                    {loading
                        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        : <Save className="mr-2 h-4 w-4" />
                    }
                    Emitir Nota de Crédito
                </Button>
            </div>
        </div>
    )
}