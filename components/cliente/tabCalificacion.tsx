'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DialogFooter } from "@/components/ui/dialog"
import { Save, X, FileText, CheckCircle, XCircle, User, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { TabsContent } from "@/components/ui/tabs"

interface DireccionTecnicaProps {
    onClose: () => void
    // onSave: (data: any) => Promise<void>
    // handleInputChange: any
    formData?: any
    setFormData?: any
    // onSave: (data:any) => Promise<void>
}

const TabCalificacion: React.FC<DireccionTecnicaProps> = ({ onClose, formData, setFormData }) => {
    // const [formData, setFormData] = useState({
    //     // campos cliente
    //     codigo: '',
    //     codigoVed: '',
    //     nombre: '',
    //     nombreComercial: '',
    //     ruc: '',
    //     tipoDocIdent: '',
    //     tipoCliente: '',
    //     direccion: '',
    //     telefono: '',
    //     correoElectronico: '',
    //     provincia: 0,
    //     idZona: '',
    //     idDistrito: 0,
    //     fechaInicio: '',
    //     //campos de la evaluacion
    //     fechaEvaluacion: '',
    //     categoria: '',
    //     estadoSUNAT: '',
    //     representanteLegal: '',
    //     itemLista: '',
    //     aprobDirTecnica: false,
    //     aprobGerente: false,
    //     observaciones: '',
    // });

    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {

    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            // await onSave(formData)
            toast({ title: 'Dirección Técnica', description: 'Datos guardados correctamente', variant: 'success' })
            onClose()
        } catch (error) {
            toast({ title: 'Error', description: 'Error al guardar datos', variant: 'error' })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <TabsContent value="calificacion" className="space-y-6 mt-6">
            <div className="space-y-6">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Calificación Final
                </h4>

                {/* Aprobaciones con botones toggle */}
                <div className="grid grid-cols-1 gap-6">
                    <Card className="bg-blue-50 border-blue-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Firma Dirección Técnica
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-4">Estado de aprobación:</p>
                                <Button
                                    onClick={() => handleInputChange("aprobadoDirTecnica", !formData.aprobDirTecnica)}
                                    className={`w-full h-12 text-sm sm:text-base font-bold transition-all duration-200 ${formData.aprobDirTecnica
                                        ? "bg-green-600 hover:bg-green-700 text-white"
                                        : "bg-red-600 hover:bg-red-700 text-white"
                                        }`}
                                >
                                    {formData.aprobDirTecnica ? (
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="hidden sm:inline">APROBADO</span>
                                            <span className="sm:hidden">✓ APROBADO</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="hidden sm:inline">NO APROBADO</span>
                                            <span className="sm:hidden">✗ NO APROBADO</span>
                                        </div>
                                    )}
                                </Button>
                                <p className="text-xs text-gray-500 mt-2">Haz clic para cambiar el estado</p>
                            </div>

                            {/* Línea de firma */}
                            <div className="border-t border-gray-300 pt-4 mt-6">
                                <div className="text-center">
                                    <div className="h-8 sm:h-12 border-b border-gray-400 mb-2"></div>
                                    <p className="text-xs font-medium text-gray-700">DIRECCIÓN TÉCNICA</p>
                                    <p className="text-xs text-gray-500">Firma y sello</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-green-50 border-green-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-green-900 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Firma Gerente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-4">Estado de aprobación:</p>
                                <Button
                                    // onClick={() => handleInputChange("aprobadoGerente", !formData.aprobadoGerente)}
                                    className={`w-full h-12 text-sm sm:text-base font-bold transition-all duration-200 ${formData.aprobadoGerente
                                        ? "bg-green-600 hover:bg-green-700 text-white"
                                        : "bg-red-600 hover:bg-red-700 text-white"
                                        }`}
                                >
                                    {formData.aprobGerente ? (
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="hidden sm:inline">APROBADO</span>
                                            <span className="sm:hidden">✓ APROBADO</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="hidden sm:inline">NO APROBADO</span>
                                            <span className="sm:hidden">✗ NO APROBADO</span>
                                        </div>
                                    )}
                                </Button>
                                <p className="text-xs text-gray-500 mt-2">Haz clic para cambiar el estado</p>
                            </div>

                            {/* Línea de firma */}
                            <div className="border-t border-gray-300 pt-4 mt-6">
                                <div className="text-center">
                                    <div className="h-8 sm:h-12 border-b border-gray-400 mb-2"></div>
                                    <p className="text-xs font-medium text-gray-700">GERENTE</p>
                                    <p className="text-xs text-gray-500">Firma y sello</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Observaciones globales */}
                <div className="space-y-4">
                    <Label htmlFor="observacionesGlobal">Observaciones Globales</Label>
                    <Textarea
                        id="observacionesGlobal"
                        // value={formData.observacionesGlobal}
                        onChange={(e) => handleInputChange("observacionesGlobal", e.target.value)}
                        placeholder="Observaciones generales sobre la evaluación del cliente..."
                        rows={4}
                        className="w-full"
                    />
                </div>

                {/* Resultado final */}
                <Card className="bg-gray-50 border-gray-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-900">Resultado de la Evaluación</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center p-6">
                            {formData.aprobDirTecnica && formData.aprobGerente ? (
                                <div className="flex items-center gap-3 text-green-700">
                                    <CheckCircle className="h-8 w-8" />
                                    <span className="text-xl font-bold">CLIENTE APROBADO</span>
                                </div>
                            ) : formData.aprobDirTecnica === false || formData.aprobGerente === false ? (
                                <div className="flex items-center gap-3 text-red-700">
                                    <XCircle className="h-8 w-8" />
                                    <span className="text-xl font-bold">CLIENTE NO APROBADO</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 text-yellow-700">
                                    <AlertCircle className="h-8 w-8" />
                                    <span className="text-xl font-bold">EVALUACIÓN PENDIENTE</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-2 mt-6">
                <Button
                    variant="outline"
                    onClick={onClose}
                    className="w-full sm:w-auto"
                >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className={`w-full sm:w-auto ${true ? "bg-blue-600 hover:bg-blue-700" : "bg-orange-600 hover:bg-orange-700"}`}
                >
                    {isSubmitting ? (
                        <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            {true ? "Creando..." : "Actualizando..."}
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            {true ? "Dirección Calificación" : "Actualizar Calificación"}
                        </>
                    )}
                </Button>
            </DialogFooter>
        </TabsContent>
    )
}

export default TabCalificacion