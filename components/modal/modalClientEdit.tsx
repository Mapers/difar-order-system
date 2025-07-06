'use client'

import React from 'react'
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { Eye, User, FileText, CheckCircle, XCircle, Edit, AlertCircle } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent, } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { parseISO, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { IClient, IClientEvaluation } from '@/interface/clients/client-interface'
import { ESTADO_APROBACION } from '@/constants/clients'
import { useEffect, useState } from "react"
import { fetchGetClientBycod } from '@/app/api/clients'
import { mapClientEvaluationFromApi } from '@/mappers/clients'
import { ClientCardSkeleton } from '../skeleton/ZoneReportSkeleton'

interface ModalVerificationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  codClient: any
  // client: any
}

const ModalClientEdit: React.FC<ModalVerificationProps> = ({
  open,
  onOpenChange,
  codClient
  // client,
}) => {

  const [loading, setLoading] = useState(false)
  const [client, setClient] = useState<any>({})

  const getEstadoAprobacion = (client: IClient) => {

    switch (client.estado) {
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

  const getProvinciaNombre = (provincia: string) => {
    const provincias: Record<string, string> = {
      Lima: "Lima",
      Cusco: "Cusco",
    }
    return provincias[provincia] ?? "Provincia Desconocida"
  }

  const getZonaNombre = (idZona: number) => {
    const zonas: Record<number, string> = {
      1: "Norte",
      2: "Sur",
    }
    return zonas[idZona] ?? "Zona Desconocida"
  }

  const handleEdit = (client: any) => {
    console.log(`Editando evaluación para cliente: ${client.codigoInterno}`)
  }

  // lista clinetes  con codigo de vendedor
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


  useEffect(() => {
    if (open && codClient) {
      getClientByCod(codClient)
    }
  }, [open, codClient])


  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando datos...</div>
  }

  // if (error) {
  //   return <div className="text-red-500 p-4">Error: {error}</div>
  // }


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
                        const estadoAprobacion = getEstadoAprobacion(client)
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
                    <p className="font-medium">{client.codigoInterno}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Código Vendedor</Label>
                    <p className="font-medium">{client.codigoVendedor}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-gray-500">Razón Social</Label>
                    <p className="font-medium">{client.razonSocial}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-gray-500">Nombre Comercial</Label>
                    <p className="font-medium">{client.nombreComercial}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">RUC</Label>
                    <p className="font-medium">{client.ruc}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Categoría</Label>
                    <p className="font-medium">{getCategoriaLabel(client.categoria)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-gray-500">Dirección según ficha RUC</Label>
                    <p className="font-medium">{client.direccion}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Estado Contribuyente SUNAT</Label>
                    <p className="font-medium">
                      {getEstadoContribuyenteLabel(client.estadoContribuyenteSunat)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Teléfono</Label>
                    <p className="font-medium">{client.telefono}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-gray-500">Representante Legal/Propietario</Label>
                    <p className="font-medium">{client.representanteLegal}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Fecha Evaluación</Label>
                    {/* <p className="font-medium">{format(parseISO(client.fechaEvaluacion), "dd/MM/yyyy")}</p> */}
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Item Lista</Label>
                    <p className="font-medium">{client.itemLista}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Correo Electrónico</Label>
                    <p className="font-medium">{client.email}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab Dirección Técnica */}
            <TabsContent value="direccion-tecnica" className="space-y-6 mt-6">
              <div className="space-y-6">
                {/* Documentos obligatorios */}
                {/* <div className="space-y-4">
                  {Object.entries(client.documentos).map(([key, doc]) => {
                    const titles = {
                      autorizacionSanitaria: "N° Resolución Directoral de Autorización Sanitaria",
                      situacionFuncionamiento: "Situación de Funcionamiento",
                      numeroRegistro: "Número de Registro",
                      certificaciones: "Certificaciones",
                    }

                    const colors = {
                      autorizacionSanitaria: "bg-blue-50 border-blue-200",
                      situacionFuncionamiento: "bg-green-50 border-green-200",
                      numeroRegistro: "bg-yellow-50 border-yellow-200",
                      certificaciones: "bg-purple-50 border-purple-200",
                    }

                    return (
                      <Card key={key} className={colors[key]}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">{titles[key]}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <Label className="text-xs text-gray-500">Detalle</Label>
                            <p className="font-medium text-sm">{doc.detalle || "No especificado"}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Observaciones</Label>
                            <p className="font-medium text-sm">{doc.observaciones || "Sin observaciones"}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div> */}
              </div>
            </TabsContent>

            {/* Tab Calificación */}
            <TabsContent value="calificacion" className="space-y-6 mt-6">
              <div className="space-y-6">
                {/* Aprobaciones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-blue-900">Dirección Técnica</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center p-4">
                        {client.aprobadoDirTecnica ? (
                          <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle className="h-6 w-6" />
                            <span className="font-bold">APROBADO</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-700">
                            <XCircle className="h-6 w-6" />
                            <span className="font-bold">NO APROBADO</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50 border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-green-900">Gerente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center p-4">
                        {client.aprobadoGerente ? (
                          <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle className="h-6 w-6" />
                            <span className="font-bold">APROBADO</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-700">
                            <XCircle className="h-6 w-6" />
                            <span className="font-bold">NO APROBADO</span>
                          </div>
                        )}
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
                        const estadoAprobacion = getEstadoAprobacion(client)
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
                {client.observacionesGlobal && (
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-yellow-900">Observaciones Globales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">{client.observacionesGlobal}</p>
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

export default ModalClientEdit