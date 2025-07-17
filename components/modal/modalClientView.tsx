'use client'

import React from 'react'
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { Eye, User, FileText, CheckCircle } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent, } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ClientCardSkeleton, SkeletonState } from '../skeleton/ZoneReportSkeleton'
import { getEstadoVisual } from '@/utils/client'
import { ClientMethodsService } from '@/app/dashboard/clientes/services/clientMethodsService'
import { useClienViewtData } from '@/app/dashboard/clientes/hooks/useClientViewData'

interface ModalVerificationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  codClient: string
}

const ModalClientView: React.FC<ModalVerificationProps> = ({ open, onOpenChange, codClient }) => {

  const { client, evaluation, evaluationClient, docObligatorios, evaluacionCalificacion, loading, error } = useClienViewtData(codClient);

  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto mx-2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-600" />
            Evaluación de Cliente - {client?.codigoInterno ?? '.......'}
          </DialogTitle>
        </DialogHeader>
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
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center">
                    {loading ? (
                      <>
                        <SkeletonState />
                      </>
                    ) : client ? (
                      (() => {
                        const estadoAprobacion = ClientMethodsService.getEstadoAprobacion(client.estado);
                        const IconoEstado = estadoAprobacion.icon;
                        return (
                          <div className="flex items-center gap-3">
                            <IconoEstado className="h-12 w-12" />
                            <div className="text-center">
                              <Badge className={`${estadoAprobacion.color} text-lg px-4 py-2`}>
                                {estadoAprobacion.estado}
                              </Badge>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-center text-gray-500 font-medium">Estado de cliente no encontrado.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className={`grid grid-cols-1 ${loading ? "" : "md:grid-cols-2"} gap-6`}>
                {loading ? (
                  <ClientCardSkeleton />
                ) : !client ? (
                  <p className="col-span-full text-center text-gray-500 font-medium">
                    No existe información del cliente.
                  </p>
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
                          <p className="font-medium">{ClientMethodsService.getCategoriaLabel(client.categoria)}</p>
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
                  <p className="font-medium">{evaluation.codigoInterno ?? "nulll"}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Código Vendedor</Label>
                  <p className="font-medium">{client?.codigoVendedor}</p>
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
                  <p className="font-medium">{ClientMethodsService.getCategoriaLabel(evaluation.categoria)}</p>
                </div>
                <div className="">
                  <Label className="text-xs text-gray-500">Dirección según ficha RUC</Label>
                  <p className="font-medium">{evaluation.direccion}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Estado Contribuyente SUNAT</Label>
                  <p className="font-medium">
                    {evaluation.estadoContribuyente}
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
                {evaluationClient.length === 0 ? (
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-yellow-900">
                        Información
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 text-center">
                        Cliente no tiene evaluación.
                      </p>
                    </CardContent>
                  </Card>
                ) : docObligatorios?.length ? (
                  docObligatorios.map((doc: any) => {
                    const colors = ClientMethodsService.getColorDocument(doc);
                    const docEval = evaluationClient.find(
                      (evalDoc: any) => evalDoc.identificador === doc.id
                    );

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
                              {docEval?.detalle ?? "No especificado"}
                            </p>
                          </div>

                          <div>
                            <Label className="text-xs text-gray-500">Observaciones</Label>
                            <p className="font-medium text-sm">
                              {docEval?.observaciones ?? "Sin observaciones"}
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
                      const estadoAprobacion = ClientMethodsService.getEstadoAprobacion(evaluacionCalificacion.estado)
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

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ModalClientView