'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { Eye, User, FileText, MapPin, Calendar, CheckCircle, Clock, XCircle, Building, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ClientService } from '@/app/services/client/ClientService'
import moment from "moment"

interface ModalVerificationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  codClient: string
}

const ModalClientView: React.FC<ModalVerificationProps> = ({ open, onOpenChange, codClient }) => {
  const [clientData, setClientData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && codClient) {
      const fetchClientData = async () => {
        setLoading(true);
        try {
          const res = await ClientService.getClientBycod(codClient);
          if (res.success && res.data) {
            const data = Array.isArray(res.data) ? res.data[0] : res.data;
            setClientData(data);
          }
        } catch (error) {
          console.error("Error cargando cliente:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchClientData();
    } else {
      setClientData(null);
    }
  }, [open, codClient]);

  // Helper para pintar el estado de forma visual
  const renderEstadoBadge = (estado: string) => {
    const st = estado?.toUpperCase() || 'PENDIENTE';
    if (st === 'ACTIVO') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 px-3 py-1"><CheckCircle className="w-4 h-4 mr-1"/> {st}</Badge>;
    }
    if (st === 'INACTIVO' || st === 'BAJA') {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1"><XCircle className="w-4 h-4 mr-1"/> {st}</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 px-3 py-1"><Clock className="w-4 h-4 mr-1"/> {st}</Badge>;
  };

  if (!open) return null;

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto mx-2 bg-slate-50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-800 text-xl">
              <Eye className="h-6 w-6 text-blue-600" />
              Vista Detallada del Cliente
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                  <p className="text-slate-500 font-medium">Cargando información del cliente...</p>
                </div>
            ) : !clientData ? (
                <div className="py-10 text-center text-slate-500">
                  <p>No se encontró información para este cliente.</p>
                </div>
            ) : (
                <div className="space-y-6">

                  {/* CABECERA (ESTADO Y NOMBRE) */}
                  <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">{clientData.razon_social || '-'}</h2>
                      <p className="text-slate-500 font-medium mt-1">{clientData.tipo_descripcion || clientData.tipo_abreviado}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {renderEstadoBadge(clientData.estado)}
                      <span className="text-xs text-slate-400 font-mono">Cód: {clientData.codigo}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* DATOS PRINCIPALES */}
                    <Card className="border-blue-100 shadow-sm">
                      <CardHeader className="bg-blue-50/50 pb-4 border-b border-blue-100">
                        <CardTitle className="text-sm font-bold text-blue-800 flex items-center gap-2">
                          <User className="h-4 w-4" /> Datos Principales
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-slate-500 uppercase tracking-wider">Número Documento</Label>
                            <p className="font-semibold text-slate-800 font-mono">{clientData.documento_numero || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500 uppercase tracking-wider">Tipo Documento</Label>
                            <p className="font-medium text-slate-800">{clientData.tipo_abreviado || '-'}</p>
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs text-slate-500 uppercase tracking-wider">Nombre Comercial</Label>
                            <p className="font-medium text-slate-800">{clientData.nombre_comercial || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500 uppercase tracking-wider">Vendedor Asignado</Label>
                            <p className="font-medium text-slate-800 font-mono">{clientData.nombre_vendedor || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500 uppercase tracking-wider">Categoría</Label>
                            <p className="font-medium text-slate-800">{clientData.categoria_cliente || '-'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* CONTACTO Y UBICACIÓN */}
                    <Card className="border-purple-100 shadow-sm">
                      <CardHeader className="bg-purple-50/50 pb-4 border-b border-purple-100">
                        <CardTitle className="text-sm font-bold text-purple-800 flex items-center gap-2">
                          <MapPin className="h-4 w-4" /> Contacto y Ubicación
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <Label className="text-xs text-slate-500 uppercase tracking-wider">Dirección Fiscal</Label>
                            <p className="font-medium text-slate-800">{clientData.direccion || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500 uppercase tracking-wider">Distrito</Label>
                            <p className="font-medium text-slate-800">{clientData.distrito || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500 uppercase tracking-wider">Provincia</Label>
                            <p className="font-medium text-slate-800">{clientData.provincia || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500 uppercase tracking-wider">Zona Geográfica</Label>
                            <p className="font-medium text-slate-800">{clientData.zona || '-'}</p>
                          </div>
                          <div className="col-span-2 grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                            <div>
                              <Label className="text-xs text-slate-500 uppercase tracking-wider">Teléfono</Label>
                              <p className="font-medium text-slate-800">{clientData.Telefono || '-'}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-slate-500 uppercase tracking-wider">Correo Electrónico</Label>
                              <p className="font-medium text-slate-800">{clientData.email || '-'}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* INFORMACIÓN ADICIONAL */}
                    <Card className="border-orange-100 shadow-sm md:col-span-2">
                      <CardHeader className="bg-orange-50/50 pb-4 border-b border-orange-100">
                        <CardTitle className="text-sm font-bold text-orange-800 flex items-center gap-2">
                          <FileText className="h-4 w-4" /> Detalles Adicionales
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <Label className="text-xs text-slate-500 uppercase tracking-wider">Representante Legal</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Building className="h-4 w-4 text-slate-400" />
                              <p className="font-medium text-slate-800">{clientData.representante_lega || '-'}</p>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500 uppercase tracking-wider">Fecha de Inicio</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              <p className="font-medium text-slate-800">
                                {clientData.FECHA_INICIO ? moment(clientData.FECHA_INICIO).format('DD/MM/YYYY') : '-'}
                              </p>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500 uppercase tracking-wider">Fecha de Registro (Sistema)</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-4 w-4 text-slate-400" />
                              <p className="font-medium text-slate-800">
                                {clientData.FechaRegistros ? moment(clientData.FechaRegistros).format('DD/MM/YYYY HH:mm') : '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                  </div>
                </div>
            )}
          </div>

          <DialogFooter className="mt-6 border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cerrar Vista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  )
}

export default ModalClientView