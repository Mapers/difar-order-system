'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Comprobante } from "@/app/types/order/order-interface"
import { Loader2, Save, FileDiff, Package } from "lucide-react"
import apiClient from "@/app/api/client"
import { Sequential } from "@/app/types/config-types"
import { toast } from "@/app/hooks/useToast"

interface ItemParcial {
    cod_item:    string
    descripcion: string
    cantidad:    number
    cantMax:     number
    precio:      number
}

interface NotaCreditoFormProps {
    comprobante:     Comprobante
    onClose:         () => void
    onSuccess:       () => void
    itemsParciales?: ItemParcial[]
}

interface FormErrors {
    selectedSerie?: string
    motivo?:        string
    idOperacion?:   string
    observaciones?: string
}

export function NotaCreditoForm({
                                    comprobante, onClose, onSuccess, itemsParciales
                                }: NotaCreditoFormProps) {
    const esParcial = !!itemsParciales && itemsParciales.length > 0

    const [loading,          setLoading]          = useState(false)
    const [observaciones,    setObservaciones]    = useState("")
    const [motivo,           setMotivo]           = useState(esParcial ? "06" : "01")
    const [tiposComprobante, setTiposComprobante] = useState<Sequential[]>([])
    const [selectedSerie,    setSelectedSerie]    = useState("")
    const [operaciones,      setOperaciones]      = useState<any[]>([])
    const [idOperacion,      setIdOperacion]      = useState<string>("")
    const [errors,           setErrors]           = useState<FormErrors>({})

    const motivosTotal = [
        { code: "01", label: "Anulación de la operación" },
        { code: "02", label: "Anulación por error en el RUC" },
        { code: "03", label: "Corrección por error en la descripción" },
        { code: "06", label: "Devolución total" },
        { code: "13", label: "Ajustes - montos y/o fechas de pago" },
    ]

    const motivosParcial = [
        { code: "06", label: "Devolución por ítem" },
        { code: "07", label: "Descuento por ítem" },
    ]

    const motivos = esParcial ? motivosParcial : motivosTotal

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resSeries, resOps] = await Promise.all([
                    apiClient.get('/admin/listar/secuenciales'),
                    apiClient.get('/admin/listar/operaciones'),
                ])

                const allSeries = resSeries.data.data
                const seriesNC  = allSeries.filter(
                    (s: Sequential) => s.tipo === '07' || s.tipo === '7'
                )
                setTiposComprobante(seriesNC)
                if (seriesNC.length > 0) {
                    setSelectedSerie(`${seriesNC[0].prefijo}|${seriesNC[0].tipo}`)
                }

                const ops = resOps.data.data || []
                setOperaciones(ops)
                if (ops.length > 0) setIdOperacion(ops[0].Codigo_Op)
            } catch (error) {
                console.error("Error cargando series:", error)
                toast({ title: "Error", description: "No se pudieron cargar las series", variant: "destructive" })
            }
        }
        fetchData()
    }, [])

    const clearError = (field: keyof FormErrors) => {
        setErrors(prev => ({ ...prev, [field]: undefined }))
    }

    const validate = (): boolean => {
        const newErrors: FormErrors = {}
        if (!selectedSerie)              newErrors.selectedSerie = "Seleccione una serie"
        if (!motivo)                     newErrors.motivo        = "Seleccione el motivo"
        if (!idOperacion)                newErrors.idOperacion   = "Seleccione el tipo de operación"
        if (!observaciones.trim())       newErrors.observaciones = "Las observaciones son obligatorias"
        else if (observaciones.trim().length < 5)
            newErrors.observaciones = "Mínimo 5 caracteres"
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validate()) return
        setLoading(true)
        try {
            const [prefijo, tipo] = selectedSerie.split('|')

            const body: any = {
                idComprobanteRef: comprobante.idComprobanteCab,
                nroPedido:        comprobante.nroPedido,
                motivo,
                observaciones:    observaciones.trim(),
                prefijo,
                tipoCompr:        tipo,
                codOperacion:     idOperacion,
            }

            if (esParcial) {
                body.items = itemsParciales!.map(i => ({
                    cod_item:  i.cod_item,
                    cantidad:  i.cantidad,
                }))
            }

            const response = await apiClient.post(`/pedidos/generateNotaCredito`, body)

            if (response.data.success) {
                toast({ title: "Éxito", description: "Nota de crédito generada correctamente" })
                onSuccess()
            } else {
                toast({ title: "Error", description: response.data.message || "Error al generar", variant: "destructive" })
            }
        } catch (error: any) {
            console.error(error)
            const msg = error?.response?.data?.message || "Error al generar la nota de crédito"
            toast({ title: "Error", description: msg, variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const FieldError = ({ field }: { field: keyof FormErrors }) =>
        errors[field] ? <p className="text-xs text-red-500 mt-1">{errors[field]}</p> : null

    const totalParcial = esParcial
        ? itemsParciales!.reduce((s, i) => s + i.cantidad * i.precio, 0)
        : 0

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <Card>
                    <CardHeader className="bg-gray-50 py-3">
                        <CardTitle className="text-sm font-medium text-gray-700">
                            Documento a Modificar
                        </CardTitle>
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

                        {esParcial && (
                            <div className="border-t pt-3 mt-2 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Package className="h-3.5 w-3.5 text-green-600" />
                                    <span className="text-xs font-semibold text-green-700">
                                        Items a devolver ({itemsParciales!.length})
                                    </span>
                                </div>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {itemsParciales!.map(i => (
                                        <div key={i.cod_item}
                                             className="flex justify-between items-center text-xs bg-green-50 rounded px-2 py-1">
                                            <span className="truncate max-w-[140px]" title={i.descripcion}>
                                                {i.descripcion}
                                            </span>
                                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                                    x{i.cantidad}
                                                </Badge>
                                                <span className="text-green-700 font-medium">
                                                    S/ {(i.cantidad * i.precio).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between font-bold text-sm pt-1 border-t">
                                    <span className="text-gray-700">Total a devolver:</span>
                                    <span className="text-green-700">
                                        S/ {totalParcial.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="py-3"
                                style={{ background: esParcial ? '#f0fdf4' : '#eff6ff' }}>
                        <CardTitle className="text-sm font-medium flex items-center gap-2"
                                   style={{ color: esParcial ? '#15803d' : '#1d4ed8' }}>
                            <FileDiff className="h-4 w-4" />
                            {esParcial ? 'NC Parcial — Datos' : 'NC Total — Datos'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold uppercase text-gray-500">
                                Serie NC <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedSerie}
                                    onValueChange={(v) => { setSelectedSerie(v); clearError('selectedSerie') }}>
                                <SelectTrigger className={`bg-white ${errors.selectedSerie ? 'border-red-400' : ''}`}>
                                    <SelectValue placeholder="Seleccionar serie" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tiposComprobante.length > 0
                                        ? tiposComprobante.map(tipo => (
                                            <SelectItem key={tipo.prefijo} value={`${tipo.prefijo}|${tipo.tipo}`}>
                                                {tipo.prefijo} - {tipo.nombre || 'Nota de Crédito'}
                                            </SelectItem>
                                        ))
                                        : <div className="p-2 text-xs text-center text-gray-500">Sin series disponibles</div>
                                    }
                                </SelectContent>
                            </Select>
                            <FieldError field="selectedSerie" />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold uppercase text-gray-500">
                                Motivo SUNAT <span className="text-red-500">*</span>
                            </Label>
                            <Select value={motivo}
                                    onValueChange={(v) => { setMotivo(v); clearError('motivo') }}>
                                <SelectTrigger className={`bg-white ${errors.motivo ? 'border-red-400' : ''}`}>
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

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold uppercase text-gray-500">
                                Tipo operación <span className="text-red-500">*</span>
                            </Label>
                            <Select value={idOperacion}
                                    onValueChange={(v) => { setIdOperacion(v); clearError('idOperacion') }}>
                                <SelectTrigger className={`bg-white ${errors.idOperacion ? 'border-red-400' : ''}`}>
                                    <SelectValue placeholder="Seleccione operación" />
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
                    className={esParcial ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
                >
                    {loading
                        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        : <Save className="mr-2 h-4 w-4" />
                    }
                    {esParcial ? 'Emitir NC Parcial' : 'Emitir NC Total'}
                </Button>
            </div>
        </div>
    )
}