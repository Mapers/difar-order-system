'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { Eye, User, FileText, CheckCircle, XCircle, Edit, AlertCircle, Plus, Save, X, MapPin, Calendar } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { fetchCreateUpdateClienteEvaluacion } from '@/app/api/clients'

interface ModalVerificationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  codClient: string
}

const ModalClientEdit: React.FC<ModalVerificationProps> = ({
  open,
  onOpenChange,
  codClient
}) => {
  // Estados para controlar modales y formulario
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estado del formulario con estructura inicial
  const [formData, setFormData] = useState({
    // campos cliente
    codigo: '',
    codigoVed: '',
    nombre: '',
    nombreComercial: '',
    ruc: '',
    tipoDocIdent: '',
    tipoCliente: '',
    direccion: '',
    telefono: '',
    correoElectronico: '',
    provincia: 0,
    idZona: '',
    idDistrito: 0,
    fechaInicio: '',
    //campos de la evaluacion
    fechaEvaluacion: '',
    categoria: '',
    estadoSUNAT: '',
    representanteLegal: '',
    itemLista: '',
    aprobDirTecnica: false,
    aprobGerente: false,
    observaciones: '',
  });

  // Listas simuladas para selects
  const categorias = [{ value: 'cat1', label: 'Categoría 1' }, { value: 'cat2', label: 'Categoría 2' }]
  const tiposDocumento = [{ value: 'dni', label: 'DNI' }, { value: 'ruc', label: 'RUC' }]
  const estadosContribuyente = [{ value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }]
  const provincias = [{ id: 1, nombre: 'Provincia 1' }, { id: 2, nombre: 'Provincia 2' }]
  const zonas = [{ id: 'zona1', nombre: 'Zona 1' }, { id: 'zona2', nombre: 'Zona 2' }]
  const tiposCliente = [{ value: 'tipo1', label: 'Tipo 1' }, { value: 'tipo2', label: 'Tipo 2' }]

  // Manejo de cambios en inputs, soporta campos anidados con punto
  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const keys = field.split('.')
      setFormData(prev => {
        const copy = { ...prev }
        let obj: any = copy
        for (let i = 0; i < keys.length - 1; i++) {
          obj = obj[keys[i]]
        }
        obj[keys[keys.length - 1]] = value
        return copy
      })
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  // Simulación de guardar datos


  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const dataPayload = {
        codigo: codClient,
        codigoVed: '',
        nombre: ' ',
        nombreComercial: formData.nombreComercial,
        ruc: formData.ruc ?? '',
        tipoDocIdent: formData.tipoDocIdent,
        tipoCliente: formData.tipoCliente,
        direccion: formData.direccion,
        telefono: formData.telefono,
        correoElectronico: formData.correoElectronico,
        provincia: formData.provincia,
        idZona: formData.idZona,
        idDistrito: formData.idDistrito,
        fechaInicio: formData.fechaInicio,
        fechaEvaluacion: formData.fechaEvaluacion,
        categoria: formData.categoria,
        estadoSUNAT: '',
        representanteLegal: formData.representanteLegal,
        itemLista: formData.itemLista,
        aprobDirTecnica: ' ',
        aprobGerente: '',
        observaciones: '',
      };

      const response = await fetchCreateUpdateClienteEvaluacion(dataPayload);
      console.log('Guardado exitoso:', response);
      // Aquí puedes mostrar mensaje, cerrar modal, etc.
      setShowCreateModal(false);
      setShowEditModal(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error al guardar:', error);
      // Manejo de error, mostrar alerta, etc.
    } finally {
      setIsSubmitting(false);
    }
  };


  // Controla apertura del modal según prop open
  useEffect(() => {
    if (open) {
      setShowEditModal(true)
    } else {
      setShowEditModal(false)
      setShowCreateModal(false)
    }
  }, [open])

  return (
    <Dialog
      open={showCreateModal || showEditModal}
      onOpenChange={(open) => {
        setShowCreateModal(false)
        setShowEditModal(false)
        onOpenChange(open)
      }}
    >
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto mx-2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {showCreateModal ? (
              <>
                <Plus className="h-5 w-5 text-blue-600" />
                Nueva Evaluación de Cliente
              </>
            ) : (
              <>
                <Edit className="h-5 w-5 text-orange-600" />
                Editar Evaluación - {codClient}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="administrador" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="administrador" className="flex items-center gap-2 text-xs sm:text-sm">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">I. Administrador</span>
              <span className="sm:hidden">Admin</span>
            </TabsTrigger>
            <TabsTrigger value="direccion-tecnica" className="flex items-center gap-2 text-xs sm:text-sm">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">II. Dirección Técnica</span>
              <span className="sm:hidden">Dir. Téc.</span>
            </TabsTrigger>
            <TabsTrigger value="calificacion" className="flex items-center gap-2 text-xs sm:text-sm">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">III. Calificación</span>
              <span className="sm:hidden">Calif.</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Evaluación Administrador */}
          <TabsContent value="administrador" className="space-y-6 mt-6">
            <div className="space-y-6">
              {/* Información básica */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  Información Básica del Cliente
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigoInterno">Código Interno *</Label>
                    <Input
                      id="codigoInterno"
                      value={codClient}
                      onChange={(e) => handleInputChange("codigoInterno", e.target.value)}
                      placeholder="CLI001"
                      disabled={showEditModal}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nombreComercial">Nombre Comercial *</Label>
                    <Input
                      id="nombreComercial"
                      value={formData.nombreComercial}
                      onChange={(e) => handleInputChange("nombreComercial", e.target.value)}
                      placeholder="Farmacia San Juan"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoría *</Label>
                    <select
                      id="categoria"
                      value={formData.categoria}
                      onChange={(e) => handleInputChange("categoria", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      required
                    >
                      <option value="">Seleccionar categoría</option>
                      {categorias.map((categoria) => (
                        <option key={categoria.value} value={categoria.value}>
                          {categoria.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 lg:col-span-3">
                    <Label htmlFor="razonSocial">Razón Social *</Label>
                    <Input
                      id="razonSocial"
                      // value={formData.razonSocial}
                      onChange={(e) => handleInputChange("razonSocial", e.target.value)}
                      placeholder="ALVAREZ MANTILLA BALDOMERO"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ruc">RUC *</Label>
                    <Input
                      id="ruc"
                      value={formData.ruc}
                      onChange={(e) => handleInputChange("ruc", e.target.value)}
                      placeholder="10266256596"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipoDocIdent">Tipo Documento *</Label>
                    <select
                      id="tipoDocIdent"
                      value={formData.tipoDocIdent}
                      onChange={(e) => handleInputChange("tipoDocIdent", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      required
                    >
                      <option value="">Seleccionar tipo</option>
                      {tiposDocumento.map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono *</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => handleInputChange("telefono", e.target.value)}
                      placeholder="+57 300 123 4567"
                      required
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-3">
                    <Label htmlFor="direccion">Dirección según ficha RUC *</Label>
                    <Input
                      id="direccion"
                      value={formData.direccion}
                      onChange={(e) => handleInputChange("direccion", e.target.value)}
                      placeholder="Calle 45 #23-67, Barrio Centro"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estadoContribuyenteSunat">Estado Contribuyente SUNAT *</Label>
                    <select
                      id="estadoContribuyenteSunat"
                      value={formData.estadoSUNAT}
                      onChange={(e) => handleInputChange("estadoContribuyenteSunat", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      required
                    >
                      <option value="">Seleccionar estado</option>
                      {estadosContribuyente.map((estado) => (
                        <option key={estado.value} value={estado.value}>
                          {estado.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fechaEvaluacion">Fecha Evaluación *</Label>
                    <Input
                      id="fechaEvaluacion"
                      type="date"
                      value={formData.fechaEvaluacion}
                      onChange={(e) => handleInputChange("fechaEvaluacion", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="itemLista">Item Lista</Label>
                    <Input
                      id="itemLista"
                      value={formData.itemLista}
                      onChange={(e) => handleInputChange("itemLista", e.target.value)}
                      placeholder="ITEM001"
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <Label htmlFor="representanteLegal">Nombre del Representante Legal/Propietario</Label>
                    <Input
                      id="representanteLegal"
                      value={formData.representanteLegal}
                      onChange={(e) => handleInputChange("representanteLegal", e.target.value)}
                      placeholder="Nombre completo del representante"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="correoElectronico">Correo Electrónico</Label>
                    <Input
                      id="correoElectronico"
                      type="email"
                      value={formData.correoElectronico}
                      onChange={(e) => handleInputChange("correoElectronico", e.target.value)}
                      placeholder="cliente@email.com"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Información de ubicación */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-purple-600" />
                  Información de Ubicación
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="provincia">Provincia *</Label>
                    <select
                      id="provincia"
                      value={formData.provincia}
                      onChange={(e) => handleInputChange("provincia", Number.parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      required
                    >
                      <option value={0}>Seleccionar provincia</option>
                      {provincias.map((provincia) => (
                        <option key={provincia.id} value={provincia.id}>
                          {provincia.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idZona">Zona *</Label>
                    <select
                      id="idZona"
                      value={formData.idZona}
                      onChange={(e) => handleInputChange("idZona", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      required
                    >
                      <option value="">Seleccionar zona</option>
                      {zonas.map((zona) => (
                        <option key={zona.id} value={zona.id}>
                          {zona.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idDistrito">ID Distrito</Label>
                    <Input
                      id="idDistrito"
                      type="number"
                      value={formData.idDistrito}
                      onChange={(e) => handleInputChange("idDistrito", Number.parseInt(e.target.value) || 0)}
                      placeholder="11001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipoCliente">Tipo Cliente *</Label>
                    <select
                      id="tipoCliente"
                      value={formData.tipoCliente}
                      onChange={(e) => handleInputChange("tipoCliente", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      required
                    >
                      <option value="">Seleccionar tipo</option>
                      {tiposCliente.map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Información del sistema */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  Información del Sistema
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fechaInicio">Fecha de Inicio *</Label>
                    <Input
                      id="fechaInicio"
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) => handleInputChange("fechaInicio", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numRegistro">Número de Registro</Label>
                    <Input
                      id="numRegistro"
                      // value={formData.numRegistro}
                      onChange={(e) => handleInputChange("numRegistro", e.target.value)}
                      placeholder="REG001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="codigoVendedor">Código Vendedor</Label>
                    <Input id="codigoVendedor" 
                    // value={formData.codigoVendedor} 
                    disabled />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Dirección Técnica */}
          <TabsContent value="direccion-tecnica" className="space-y-6 mt-6">
            <div className="space-y-6">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-600" />
                Documentación Obligatoria
              </h4>

              {/* Documentos obligatorios */}
              <div className="space-y-6">
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
                          id="autorizacionSanitaria-detalle"
                          // value={formData.documentos.autorizacionSanitaria.detalle}
                          onChange={(e) =>
                            handleInputChange("documentos.autorizacionSanitaria.detalle", e.target.value)
                          }
                          placeholder="Número de autorización"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="autorizacionSanitaria-observaciones">Observaciones</Label>
                        <Textarea
                          id="autorizacionSanitaria-observaciones"
                          // value={formData.documentos.autorizacionSanitaria.observaciones}
                          onChange={(e) =>
                            handleInputChange("documentos.autorizacionSanitaria.observaciones", e.target.value)
                          }
                          placeholder="Observaciones sobre la autorización"
                          rows={2}
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
                          id="situacionFuncionamiento-detalle"
                          // value={formData.documentos.situacionFuncionamiento.detalle}
                          onChange={(e) =>
                            handleInputChange("documentos.situacionFuncionamiento.detalle", e.target.value)
                          }
                          placeholder="Estado de funcionamiento"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="situacionFuncionamiento-observaciones">Observaciones</Label>
                        <Textarea
                          id="situacionFuncionamiento-observaciones"
                          value={formData.observaciones}
                          onChange={(e) =>
                            handleInputChange("documentos.situacionFuncionamiento.observaciones", e.target.value)
                          }
                          placeholder="Observaciones sobre el funcionamiento"
                          rows={2}
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
                          id="numeroRegistro-detalle"
                          // value={formData.documentos.numeroRegistro.detalle}
                          onChange={(e) => handleInputChange("documentos.numeroRegistro.detalle", e.target.value)}
                          placeholder="Número de registro"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="numeroRegistro-observaciones">Observaciones</Label>
                        <Textarea
                          id="numeroRegistro-observaciones"
                          // value={formData.documentos.numeroRegistro.observaciones}
                          onChange={(e) =>
                            handleInputChange("documentos.numeroRegistro.observaciones", e.target.value)
                          }
                          placeholder="Observaciones sobre el registro"
                          rows={2}
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
                        <Label htmlFor="certificaciones-detalle">Detalle</Label>
                        <Input
                          id="certificaciones-detalle"
                          // value={formData.documentos.certificaciones.detalle}
                          onChange={(e) => handleInputChange("documentos.certificaciones.detalle", e.target.value)}
                          placeholder="Certificaciones obtenidas"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="certificaciones-observaciones">Observaciones</Label>
                        <Textarea
                          id="certificaciones-observaciones"
                          // value={formData.documentos.certificaciones.observaciones}
                          onChange={(e) =>
                            handleInputChange("documentos.certificaciones.observaciones", e.target.value)
                          }
                          placeholder="Observaciones sobre las certificaciones"
                          rows={2}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Calificación */}
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
                        onClick={() => handleInputChange("aprobadoDirTecnica", !formData.aprobadoDirTecnica)}
                        className={`w-full h-12 text-sm sm:text-base font-bold transition-all duration-200 ${formData.aprobadoDirTecnica
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-red-600 hover:bg-red-700 text-white"
                          }`}
                      >
                        {formData.aprobadoDirTecnica ? (
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
                        onClick={() => handleInputChange("aprobadoGerente", !formData.aprobadoGerente)}
                        className={`w-full h-12 text-sm sm:text-base font-bold transition-all duration-200 ${formData.aprobadoGerente
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-red-600 hover:bg-red-700 text-white"
                          }`}
                      >
                        {formData.aprobadoGerente ? (
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
                  value={formData.observacionesGlobal}
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
                    {formData.aprobadoDirTecnica && formData.aprobadoGerente ? (
                      <div className="flex items-center gap-3 text-green-700">
                        <CheckCircle className="h-8 w-8" />
                        <span className="text-xl font-bold">CLIENTE APROBADO</span>
                      </div>
                    ) : formData.aprobadoDirTecnica === false || formData.aprobadoGerente === false ? (
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
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setShowCreateModal(false)
              setShowEditModal(false)
              onOpenChange(false)
            }}
            className="w-full sm:w-auto"
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            className={`w-full sm:w-auto ${showCreateModal ? "bg-blue-600 hover:bg-blue-700" : "bg-orange-600 hover:bg-orange-700"}`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                {showCreateModal ? "Creando..." : "Actualizando..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {showCreateModal ? "Crear Evaluación" : "Actualizar Evaluación"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ModalClientEdit