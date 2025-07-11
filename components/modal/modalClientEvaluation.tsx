'use client'

import React from 'react'
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { Eye, User, FileText, CheckCircle, XCircle, Edit, AlertCircle } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent, } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IClient, IClientEvaluation, IEvaluacionCalif, IEvaluation } from '@/interface/clients/client-interface'
import { DOCUMENTO, ESTADO_APROBACION } from '@/constants/clients'
import { useEffect, useState } from "react"
import { fetchEvaluationByCodClient, fetchEvaluationCalifByCodClient, fetchGetClientBycod, fetchGetDocObligatorios } from '@/app/api/clients'
import { mapClientEvaluationFromApi, mapEvaluacionCalificacionFromApi, mapEvaluationFromApi } from '@/mappers/clients'
import { ClientCardSkeleton } from '../skeleton/ZoneReportSkeleton'
import { getEstadoVisual } from '@/utils/client'

interface ModalVerificationProps {
  open: boolean
  openModalEdit: (open: boolean) => void
  onOpenChange: (open: boolean) => void
  codClient: string
}

const ModalClientEvaluation: React.FC<ModalVerificationProps> = ({
  open,
  openModalEdit,
  onOpenChange,
  codClient
}) => {

  const [loading, setLoading] = useState(false)
  const [client, setClient] = useState<IClientEvaluation | null>(null)
  const [evaluation, setEvaluation] = useState<any>({})
  const [docObligatorios, setDocObligatorios] = useState<any>({})
  const [evaluacionCalificacion, setEvaluacionCalificacion] = useState<any>({})

  const getEstadoAprobacion = (estado: string) => {
    switch (estado) {
      case ESTADO_APROBACION.APROBADO:
        return { icon: CheckCircle, color: "bg-green-100 text-green-800", estado: "APROBADO" }
      case ESTADO_APROBACION.RECHAZADO:
        return { icon: XCircle, color: "bg-red-100 text-red-800", estado: "RECHAZADO" }
      case ESTADO_APROBACION.PENDIENTE:
        return { icon: AlertCircle, color: "bg-yellow-100 text-yellow-800", estado: "PENDIENTE" }
      default:
        return { icon: AlertCircle, color: "bg-gray-100 text-gray-800", estado: "DESCONOCIDO" }
    }
  }

  const getColorDocument = (doc: any): string => {
    switch (doc.nombre) {
      case DOCUMENTO.AUTORIZACION_SANITARIA:
        return "bg-blue-50 border-blue-200"
      case DOCUMENTO.SITUACION_FUNCIONAMIENTO:
        return "bg-green-50 border-green-200"
      case DOCUMENTO.NUMERO_REGISTRO:
        return "bg-yellow-50 border-yellow-200"
      case DOCUMENTO.CERTIFICACIONES:
        return "bg-purple-50 border-purple-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  const getCategoriaLabel = (categoria: string) => {
    const categorias: Record<string, string> = {
      A: "Categoría A",
      B: "Categoría B",
      C: "Categoría C",
    }
    return categorias[categoria] ?? "Categoría Desconocida"
  }

  const getEstadoContribuyenteLabel = (estado: string) => {
    const estados: Record<string, string> = {
      Activo: "Activo",
      Inactivo: "Inactivo",
    }
    return estados[estado] ?? "Desconocido"
  }

  const handleEdit = (client: any) => {
    console.log(`Editando evaluación para cliente: ${client.codigoInterno}`)
    onOpenChange(false)
    openModalEdit(true)
  } 


  // lista documentos obligatorios
  const getDocObligatorios = async () => {
    try {
      setLoading(true);
      const response = await fetchGetDocObligatorios();
      if (response && response.data.success && response.status === 200) {
        setDocObligatorios(response.data?.data || [])
      }
      else if (!response.success) {
        setDocObligatorios([])
      }
    } catch (error) {
      console.error("Error fetching client:", error);
    } finally {
      setLoading(false);
    }
  };

  // lista clientescon codigo de vendedor
  const getClientByCod = async (codClient: string) => {
    try {
      setLoading(true);
      const response = await fetchGetClientBycod(codClient);
      const rawClient = response.data?.data || {}
      const mappedClient: IClientEvaluation = mapClientEvaluationFromApi(rawClient);
      setClient(mappedClient);
    } catch (error) {
      console.error("Error fetching client:", error);
    } finally {
      setLoading(false);
    }
  };

  // lista clientescon codigo de vendedor
  const getEvaluationCalifByCodClient = async (codClient: string) => {
    try {
      setLoading(true);
      const response = await fetchEvaluationCalifByCodClient(codClient);
      if (response && response.data.success && response.status === 200) {
        const rawClient = response.data?.data || []
        const mappedEvalCalif: IEvaluacionCalif = mapEvaluacionCalificacionFromApi(rawClient);
        setEvaluacionCalificacion(mappedEvalCalif);
      }
      else if (!response.success) {
        // mostrar toas de  no hay doc obligatorios
        setDocObligatorios([])
      }

    } catch (error) {
      console.error("Error fetching client:", error);
    } finally {
      setLoading(false);
    }
  };

  // obtiene evaluación de un cliente
  const getEvaluationnBycodCliente = async (codClient: string) => {
    try {
      setLoading(true);
      const response = await fetchEvaluationByCodClient(codClient);
      const rawClient = response.data?.data || {}
      const evaluation: IEvaluation = mapEvaluationFromApi(rawClient);
      setEvaluation(evaluation);
    } catch (error) {
      console.error("Error fetching client:", error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (open && codClient) {
      getDocObligatorios()
      getClientByCod(codClient)
      getEvaluationnBycodCliente(codClient)
      getEvaluationCalifByCodClient(codClient)
    }
  }, [open, codClient])


  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando datos...</div>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto mx-2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-600" />
            Evaluación de Cliente - {client?.codigoInterno}
          </DialogTitle>
        </DialogHeader>
        {client && (
          <Tabs defaultValue="resumen" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="resumen" className="flex items-center gap-1 text-xs sm:text-sm">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Resumen</span>
                <span className="sm:hidden">Res.</span>
              </TabsTrigger>
              <TabsTrigger value="administrador" className="flex items-center gap-1 text-xs sm:text-sm">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Administrador</span>
                <span className="sm:hidden">Admin</span>
              </TabsTrigger>
              <TabsTrigger value="direccion-tecnica" className="flex items-center gap-1 text-xs sm:text-sm">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Dir. Técnica</span>
                <span className="sm:hidden">Dir.</span>
              </TabsTrigger>
              <TabsTrigger value="calificacion" className="flex items-center gap-1 text-xs sm:text-sm">
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Calificación</span>
                <span className="sm:hidden">Calif.</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Resumen */}
            <TabsContent value="resumen" className="space-y-6 mt-6">
              <div className="space-y-6">
                {/* Estado de aprobación */}
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center">
                      {(() => {
                        const estadoAprobacion = getEstadoAprobacion(client.estado)
                        const IconoEstado = estadoAprobacion.icon
                        return (
                          <div className="flex items-center gap-3">
                            <IconoEstado className="h-12 w-12" />
                            <div className="text-center">
                              <Badge className={`${estadoAprobacion.color} text-lg px-4 py-2`}>
                                {estadoAprobacion.estado}
                              </Badge>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </CardContent>
                </Card>
                {/* Información básica resumida */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {loading ? (
                    <ClientCardSkeleton />
                  ) : (
                    <>
                      <Card className="bg-blue-50 border-blue-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-blue-900">Información del Cliente</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div>
                            <Label className="text-xs text-blue-600">Código Interno</Label>
                            <p className="font-medium">{client.codigoInterno}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-blue-600">Razón Social</Label>
                            <p className="font-medium">{client.razonSocial}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-blue-600">Nombre Comercial</Label>
                            <p className="font-medium">{client.nombreComercial}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-blue-600">RUC</Label>
                            <p className="font-medium">{client.ruc}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-blue-600">Categoría</Label>
                            <p className="font-medium">{getCategoriaLabel(client.categoria)}</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-50 border-green-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-green-900">Estado y Contacto</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div>
                            <Label className="text-xs text-green-600">Representante Legal</Label>
                            <p className="font-medium">{client.representanteLegal}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-green-600">Teléfono</Label>
                            <p className="font-medium">{client.telefono}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-green-600">Email</Label>
                            <p className="font-medium">{client.email}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-green-600">Ubicación</Label>
                            <p className="font-medium">
                              {client.provincia} - Zona {client.zona}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab Administrador */}
            <TabsContent value="administrador" className="space-y-6 mt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-gray-500">Código Interno</Label>
                    <p className="font-medium">{evaluation.codigoInterno}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Código Vendedoriuyiyuguuv</Label>
                    <p className="font-medium">{client.codigoVendedor}</p>
                  </div>
                  <div className="">
                    <Label className="text-xs text-gray-500">Razón Social</Label>
                    <p className="font-medium">{evaluation.razonSocial}</p>
                  </div>
                  <div className="">
                    <Label className="text-xs text-gray-500">Nombre Comercial</Label>
                    <p className="font-medium">{evaluation.nombreComercial}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">RUC</Label>
                    <p className="font-medium">{evaluation.ruc}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Categoría</Label>
                    <p className="font-medium">{getCategoriaLabel(evaluation.categoria)}</p>
                  </div>
                  <div className="">
                    <Label className="text-xs text-gray-500">Dirección según ficha RUC</Label>
                    <p className="font-medium">{evaluation.direccion}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Estado Contribuyente SUNAT</Label>
                    <p className="font-medium">
                      {getEstadoContribuyenteLabel(evaluation.estadoContribuyenteSunat)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Teléfono</Label>
                    <p className="font-medium">{evaluation.telefono}</p>
                  </div>
                  <div className="">
                    <Label className="text-xs text-gray-500">Representante Legal/Propietario</Label>
                    <p className="font-medium">{evaluation.representanteLegal}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Fecha Evaluación</Label>
                    <p className="font-medium">{evaluation.fechaEvaluacion}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Item Lista</Label>
                    <p className="font-medium">{evaluation.itemLista ? evaluation.itemLista : "No asignado"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Correo Electrónico</Label>
                    <p className="font-medium">{evaluation.correoElectronico}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab Dirección Técnica */}
            <TabsContent value="direccion-tecnica" className="space-y-6 mt-6">
              <div className="space-y-6">
                <p className="text-sm font-medium text-gray-700">
                  Documentos obligatorios
                </p>

                <div className="space-y-4">
                  {docObligatorios?.length ? (
                    docObligatorios.map((doc: any) => {
                      const colors = getColorDocument(doc)
                      return (
                        <Card key={doc.id} className={colors}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">
                              {doc.descripcion}
                            </CardTitle>
                          </CardHeader>

                          <CardContent className="space-y-3">
                            <div>
                              <Label className="text-xs text-gray-500">Detalle</Label>
                              <p className="font-medium text-sm">
                                {doc.detalle ? doc.detalle : "No especificado"}
                              </p>
                            </div>

                            <div>
                              <Label className="text-xs text-gray-500">
                                Observaciones
                              </Label>
                              <p className="font-medium text-sm">
                                {doc.observaciones ? doc.observaciones : "Sin observaciones"}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500">
                      No se han registrado documentos para este cliente.
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab Calificación */}
            <TabsContent value="calificacion" className="space-y-6 mt-6">
              <div className="space-y-6">
                {/* Aprobaciones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-green-900">
                        Dirección técnica
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center justify-center p-4">
                        {(() => {
                          // Obtén icono, color y etiqueta según el estado
                          const { icon: Icono, color, label } = getEstadoVisual(
                            evaluacionCalificacion?.gerenteEstado
                          );

                          return (
                            <div className={`flex items-center gap-2 ${color}`}>
                              <Icono className="h-6 w-6" />
                              <span className="font-bold">{label}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-green-900">
                        Gerente
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center justify-center p-4">
                        {(() => {
                          const { icon: Icono, color, label } = getEstadoVisual(
                            evaluacionCalificacion?.gerenteEstado
                          );

                          return (
                            <div className={`flex items-center gap-2 ${color}`}>
                              <Icono className="h-6 w-6" />
                              <span className="font-bold">{label}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>

                </div>

                {/* Resultado final */}
                <Card className="bg-gray-50 border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-900">
                      Resultado Final de la Evaluación
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center p-6">
                      {(() => {
                        const estadoAprobacion = getEstadoAprobacion(evaluacionCalificacion.estado)
                        const IconoEstado = estadoAprobacion.icon
                        return (
                          <div className="flex items-center gap-3">
                            <IconoEstado className="h-12 w-12" />
                            <span className="text-2xl font-bold">{estadoAprobacion.estado}</span>
                          </div>
                        )
                      })()}
                    </div>
                  </CardContent>
                </Card>

                {/* Observaciones globales */}
                {evaluacionCalificacion?.observacionesGlobal ? (
                  /* ───── Con observaciones ───── */
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-yellow-900">
                        Observaciones Globales
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">
                        {evaluacionCalificacion.observacionesGlobal}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  /* ───── Sin observaciones ───── */
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-yellow-900">
                        Observaciones Globales
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">
                        No existen observaciones globales
                      </p>
                    </CardContent>
                  </Card>
                )}

              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cerrar
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false)
              handleEdit(client)
            }}
            className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar Evaluación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ModalClientEvaluation