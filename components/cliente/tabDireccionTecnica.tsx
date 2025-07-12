import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DialogFooter } from "@/components/ui/dialog"
import { Save, X, FileText } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { TabsContent } from "@/components/ui/tabs"
import { fetchCreateEvaluationDocument } from '@/app/api/clients'

interface DocumentoData {
    codigo: string
    tipoId: number
    detalle: string
    observaciones: string
}

interface DireccionTecnicaProps {
    onClose: () => void
    // initialData?: {
    //     autorizacion: DocumentoData
    //     situacion: DocumentoData
    //     registro: DocumentoData
    //     certificaciones: DocumentoData
    // }
    initialData: any
}


const TabDireccionTecnica: React.FC<DireccionTecnicaProps> = ({ onClose, initialData }) => {
    // Estados separados para cada card, inicializados con datos iniciales o vacíos
    const [autorizacion, setAutorizacion] = useState<DocumentoData>(initialData.autorizacion)
    const [situacion, setSituacion] = useState<DocumentoData>(initialData?.situacion)
    const [registro, setRegistro] = useState<DocumentoData>(initialData?.registro)
    const [certificaciones, setCertificaciones] = useState<DocumentoData>(initialData?.certificaciones)

    const [isSubmitting, setIsSubmitting] = useState(false)

    // Función para comparar si dos documentos son iguales
    const isEqual = (a: DocumentoData, b: DocumentoData) => {
        return a.detalle === b.detalle && a.observaciones === b.observaciones
    }

    // Función para guardar solo los documentos modificados
    const handleSaveAll = async () => {
        setIsSubmitting(true)
        try {
            const promises = []

            if (!initialData || !isEqual(autorizacion, initialData.autorizacion)) {
                promises.push(fetchCreateEvaluationDocument(autorizacion))
            }
            if (!initialData || !isEqual(situacion, initialData.situacion)) {
                promises.push(fetchCreateEvaluationDocument(situacion))
            }
            if (!initialData || !isEqual(registro, initialData.registro)) {
                promises.push(fetchCreateEvaluationDocument(registro))
            }
            if (!initialData || !isEqual(certificaciones, initialData.certificaciones)) {
                promises.push(fetchCreateEvaluationDocument(certificaciones))
            }

            const results = await Promise.all(promises)

            let successCount = 0
            results.forEach(res => {
                if (res.status === 201 && res.data.success) successCount++
            })

            if (successCount === results.length) {
                toast({ title: 'Éxito', description: 'Todos los documentos guardados correctamente', variant: 'success' })
                onClose()
            } else {
                toast({ title: 'Atención', description: 'Algunos documentos no se guardaron correctamente', variant: 'warning' })
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Error al guardar documentos', variant: 'error' })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <TabsContent value="direccion-tecnica" className="space-y-6 mt-6">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-600" />
                Documentación Obligatoria
            </h4>

            {/* Autorización Sanitaria */}
            <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-blue-900">
                        N° Resolución Directoral de Autorización Sanitaria
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="autorizacionSanitaria-detalle">Detalle</Label>
                            <Input
                                id="autorizacionDetalle"
                                placeholder="Número de autorización"
                                value={autorizacion.detalle}
                                onChange={e => setAutorizacion({ ...autorizacion, detalle: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="autorizacionSanitaria-observaciones">Observaciones</Label>
                            <Textarea
                                id="autorizacionObservaciones"
                                placeholder="Observaciones sobre la autorización"
                                rows={2}
                                value={autorizacion.observaciones}
                                onChange={e => setAutorizacion({ ...autorizacion, observaciones: e.target.value })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Situación de Funcionamiento */}
            <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-green-900">Situación de Funcionamiento</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="situacionFuncionamiento-detalle">Detalle</Label>
                            <Input
                                id="situacionDetalle"
                                placeholder="Estado de funcionamiento"
                                value={situacion.detalle}
                                onChange={e => setSituacion({ ...situacion, detalle: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="autorizacionSanitaria-observaciones">Observaciones</Label>
                            <Textarea
                                id="situacionObservaciones"
                                placeholder="Observaciones sobre el funcionamiento"
                                rows={2}
                                value={situacion.observaciones}
                                onChange={e => setSituacion({ ...situacion, observaciones: e.target.value })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Número de Registro */}
            <Card className="bg-yellow-50 border-yellow-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-yellow-900">Número de Registro</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="numeroRegistro-detalle">Detalle</Label>
                            <Input
                                id="numeroRegistroDetalle"
                                placeholder="Número de registro"
                                value={registro.detalle}
                                onChange={e => setRegistro({ ...registro, detalle: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="autorizacionSanitaria-observaciones">Observaciones</Label>
                            <Textarea
                                id="numeroRegistroObservaciones"
                                placeholder="Observaciones sobre el registro"
                                rows={2}
                                value={registro.observaciones}
                                onChange={e => setRegistro({ ...registro, observaciones: e.target.value })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Certificaciones */}
            <Card className="bg-purple-50 border-purple-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-purple-900">Certificaciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="certificaciones-detall">Detalle</Label>
                            <Input
                                id="certificacionesDetalle"
                                placeholder="Certificaciones obtenidas"
                                value={certificaciones.detalle}
                                onChange={e => setCertificaciones({ ...certificaciones, detalle: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="autorizacionSanitaria-observaciones">Observaciones</Label>
                            <Textarea
                                id="certificacionesObservaciones"
                                placeholder="Observaciones sobre las certificaciones"
                                rows={2}
                                value={certificaciones.observaciones}
                                onChange={e => setCertificaciones({ ...certificaciones, observaciones: e.target.value })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-2 mt-6">
                <Button
                    variant="outline"
                    onClick={onClose}
                    className="w-full sm:w-auto"
                    disabled={isSubmitting}
                >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                </Button>
                <Button
                    onClick={handleSaveAll}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                >
                    {isSubmitting ? (
                        <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Guardar Dirección Técnica
                        </>
                    )}
                </Button>
            </DialogFooter>
        </TabsContent>
    )
}

export default TabDireccionTecnica