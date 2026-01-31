'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { FileDiff, ArrowRight, ArrowLeft, Search, CheckCircle, Calendar, FileText, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { format, addDays, parseISO } from "date-fns"
import { Comprobante } from "@/interface/order/order-interface"
import { NotaCreditoForm } from "./NotaCreditoForm"
import apiClient from "@/app/api/client"
import { useAuth } from "@/context/authContext"

interface GenerarNotaCreditoModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onGenerar: () => void
}

export function GenerarNotaCreditoModal({
                                            open,
                                            onOpenChange,
                                            onGenerar
                                        }: GenerarNotaCreditoModalProps) {
    const auth = useAuth()
    const [step, setStep] = useState(1)
    const [selectedComprobante, setSelectedComprobante] = useState<Comprobante | null>(null)

    const today = new Date()
    const [fechaDesde, setFechaDesde] = useState(format(today, 'yyyy-MM-dd'))
    const [fechaHasta, setFechaHasta] = useState(format(addDays(today, 1), 'yyyy-MM-dd'))
    const [searchQuery, setSearchQuery] = useState("")

    const [comprobantes, setComprobantes] = useState<Comprobante[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open && step === 1) {
            fetchComprobantes()
        }
    }, [open, step])

    const fetchComprobantes = async () => {
        setLoading(true)
        try {
            let url = `/pedidos/comprobantes?`
            const params = new URLSearchParams()

            if (auth.user?.idRol === 1) params.append('vendedor', auth.user?.codigo || '')

            params.append('fechaDesde', fechaDesde)
            params.append('fechaHasta', fechaHasta)

            if (searchQuery) params.append('busqueda', searchQuery)

            url += params.toString()

            const response = await apiClient.get(url)
            const data = response.data.data.data || []

            setComprobantes(data)
        } catch (error) {
            console.error("Error buscando comprobantes para NC:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleNextStep = () => {
        if (selectedComprobante) {
            setStep(2)
        }
    }

    const handleBack = () => {
        setStep(1)
        setSelectedComprobante(null)
    }

    const handleSuccess = () => {
        onGenerar()
        onOpenChange(false)
        setStep(1)
        setSelectedComprobante(null)
        setSearchQuery("")
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`${step === 1 ? "max-w-5xl h-[700px]" : "max-w-4xl h-auto"} flex flex-col transition-all duration-300`}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <FileDiff className="h-5 w-5 text-blue-600" />
                        {step === 1 ? "Seleccionar Comprobante para Nota de Crédito" : `Nota de Crédito para ${selectedComprobante?.serie}-${selectedComprobante?.numero}`}
                    </DialogTitle>
                    {step === 1 && (
                        <DialogDescription>
                            Busque y seleccione la Factura o Boleta a la cual desea aplicar la nota de crédito.
                        </DialogDescription>
                    )}
                </DialogHeader>

                {step === 1 && (
                    <div className="flex-1 flex flex-col gap-4 overflow-hidden">

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-gray-50 rounded-lg border">
                            <div className="md:col-span-3 space-y-1">
                                <Label className="text-xs">Fecha Desde</Label>
                                <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="bg-white h-8 text-xs"/>
                            </div>
                            <div className="md:col-span-3 space-y-1">
                                <Label className="text-xs">Fecha Hasta</Label>
                                <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="bg-white h-8 text-xs"/>
                            </div>
                            <div className="md:col-span-4 space-y-1">
                                {/*<Label className="text-xs">Buscar (Serie, Número, Cliente)</Label>*/}
                                {/*<div className="relative">*/}
                                {/*    <Search className="absolute left-2 top-1.5 h-4 w-4 text-gray-400" />*/}
                                {/*    <Input*/}
                                {/*        placeholder="F001, Cliente..."*/}
                                {/*        value={searchQuery}*/}
                                {/*        onChange={(e) => setSearchQuery(e.target.value)}*/}
                                {/*        onKeyDown={(e) => e.key === 'Enter' && fetchComprobantes()}*/}
                                {/*        className="pl-8 bg-white h-8 text-xs"*/}
                                {/*    />*/}
                                {/*</div>*/}
                            </div>
                            <div className="md:col-span-2 flex items-end">
                                <Button onClick={fetchComprobantes} disabled={loading} size="sm" className="w-full h-8 text-xs">
                                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Buscar"}
                                </Button>
                            </div>
                        </div>

                        <ScrollArea className="flex-1 border rounded-md p-4 bg-white">
                            {loading ? (
                                <div className="flex justify-center items-center h-40">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                </div>
                            ) : comprobantes.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {comprobantes.map((item) => (
                                        <Card
                                            key={item.idComprobanteCab}
                                            className={`cursor-pointer transition-all hover:border-blue-400 ${selectedComprobante?.idComprobanteCab === item.idComprobanteCab
                                                ? "border-blue-600 ring-1 ring-blue-600 bg-blue-50"
                                                : "border-gray-200"
                                            }`}
                                            onClick={() => setSelectedComprobante(item)}
                                        >
                                            <CardContent className="p-3">
                                                <div className="flex justify-between items-start mb-2">
                                                    <Badge variant="outline" className="bg-white font-bold text-xs">
                                                        {item.serie}-{item.numero}
                                                    </Badge>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-gray-500">{format(parseISO(item.fecha_envio), "dd/MM/yyyy")}</span>
                                                        {selectedComprobante?.idComprobanteCab === item.idComprobanteCab && (
                                                            <CheckCircle className="h-4 w-4 text-blue-600" />
                                                        )}
                                                    </div>
                                                </div>
                                                <h4 className="font-semibold text-xs truncate mb-1" title={item.cliente_denominacion}>{item.cliente_denominacion}</h4>
                                                <div className="space-y-1 text-xs text-gray-500">
                                                    <div className="flex justify-between items-center mt-2">
                                                        <div className="flex items-center gap-1">
                                                            <FileText className="h-3 w-3" />
                                                            <span>{item.tipo_comprobante === 1 ? 'Factura' : 'Boleta'}</span>
                                                        </div>
                                                        <span className="font-bold text-gray-700">
                                      {item.moneda === 1 ? 'S/' : '$'} {Number(item.total).toFixed(2)}
                                    </span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <FileText className="h-10 w-10 mb-2 opacity-50" />
                                    <p>No se encontraron comprobantes con esos filtros.</p>
                                </div>
                            )}
                        </ScrollArea>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleNextStep}
                                disabled={!selectedComprobante}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Continuar <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {step === 2 && selectedComprobante && (
                    <>
                        <div className="flex items-center justify-between mb-2 px-1">
                            <Button variant="ghost" size="sm" onClick={handleBack} className="text-gray-500 hover:text-blue-600 pl-0">
                                <ArrowLeft className="mr-1 h-4 w-4" /> Cambiar Comprobante
                            </Button>
                        </div>

                        <div className="flex-1 p-1">
                            <NotaCreditoForm
                                comprobante={selectedComprobante}
                                onClose={() => onOpenChange(false)}
                                onSuccess={handleSuccess}
                            />
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}