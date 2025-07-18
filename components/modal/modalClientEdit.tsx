'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { User, FileText, CheckCircle, Edit, X, MapPin, Calendar, ChevronDown, Check, Plus, Save } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useAuth } from '@/context/authContext';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from '../ui/command';
import { toast } from '@/hooks/use-toast'
import TabDireccionTecnica from '../cliente/tabDireccionTecnica'
import TabCalificacion from '../cliente/tabCalificacion'
import { ClientService } from '@/app/services/client/ClientService'
import { useClientEditData } from '@/app/dashboard/clientes/hooks/useClientEditData'
import ModalLoader from './modalLoader'

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

interface ModalVerificationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  codClient: string
}

const ModalClientEdit: React.FC<ModalVerificationProps> = ({ open, onOpenChange, codClient }) => {

  const { typeDocuments, evaluation, provincesCities, districts, zones, sunatStatus, evaluationClient, evaluacionCalificacion, loading, error } = useClientEditData(codClient);
  const { user, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPopoverProvinceOpen, setIsPopoverProvinceOpen] = useState(false);
  const [isPopoverZoneOpen, setIsPopoverZoneOpen] = useState(false);
  const [isPopoverSunatOpen, setIsPopoverSunatOpen] = useState(false);
  const [isPopoverDistrictOpen, setIsPopoverDistrictOpen] = useState(false);
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
        codigoVed: user?.codigo,
        nombre: formData.nombre,
        nombreComercial: formData.nombreComercial,
        ruc: formData.ruc,
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
        estadoSUNAT: formData.estadoSUNAT,
        representanteLegal: formData.representanteLegal,
        itemLista: formData.itemLista,
        aprobDirTecnica: ' ',
        aprobGerente: '',
        observaciones: '',
      };
      const response = await ClientService.createUpdateClienteEvaluacion(dataPayload);
      if (response.success) {
        toast({ title: "Evaluación", description: "Actualizada correctamente", variant: "success" })
      }
      else {
        toast({ title: "Evaluación", description: "Evaluación no actualizada.", variant: "error" })
      }
      console.log('Guardado exitoso:', response);
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setIsSubmitting(false);
    }
  };


  useEffect(() => {
    if (evaluation) {
      setFormData({
        codigo: codClient,
        codigoVed: user?.codigo || '',
        nombre: evaluation.razonSocial || '',
        nombreComercial: evaluation.nombreComercial || '',
        ruc: evaluation.ruc || '',
        tipoDocIdent: evaluation.tipoDocIdent || '',
        tipoCliente: evaluation.tipoCliente || '',
        direccion: evaluation.direccion || '',
        telefono: evaluation.telefono || '',
        correoElectronico: evaluation.correoElectronico || '',
        provincia: evaluation.provincia || 0,
        idZona: evaluation.idZona || '',
        idDistrito: evaluation.idDistrito || 0,
        fechaInicio: evaluation.fechaInicio || '',
        fechaEvaluacion: evaluation.fechaEvaluacion || '',
        categoria: evaluation.categoria || '',
        estadoSUNAT: evaluation.estadoSUNAT || '',
        representanteLegal: evaluation.representanteLegal || '',
        itemLista: evaluation.itemLista || '',
        aprobDirTecnica: evaluation.aprobDirTecnica || false,
        aprobGerente: evaluation.aprobGerente || false,
        observaciones: evaluation.observaciones || '',
      });
    }
  }, [evaluation, codClient, user?.codigo]);


  if (!open) return null;
  if (loading) {
    return (
      <ModalLoader open={open} onOpenChange={onOpenChange} />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}
    >
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto mx-2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-orange-600" />
            Editar Evaluación - {codClient}
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
                      disabled
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
                    <Input
                      id="categoria"
                      value={formData.categoria}
                      onChange={(e) => handleInputChange("categoria", e.target.value)}
                      placeholder="Ejm: A"
                      required
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-3">
                    <Label htmlFor="nombre">Razón Social *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => handleInputChange("nombre", e.target.value)}
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
                      {typeDocuments.map((tipo: any) => (
                        <option key={tipo.codigo} value={tipo.codigo}>
                          {tipo.abreviatura}
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
                    <Popover open={isPopoverSunatOpen} onOpenChange={setIsPopoverSunatOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between h-12"
                          aria-expanded={Boolean(formData.estadoSUNAT)}
                          aria-controls="sunat-listbox"
                          aria-haspopup="listbox"
                        >
                          {formData.estadoSUNAT
                            ? sunatStatus.find((estado: any) => estado.nombre === formData.estadoSUNAT)?.nombre
                            : 'Seleccionar estado...'}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Buscar estado..." />
                          <CommandList id="sunat-listbox" role="listbox" aria-label="Estados SUNAT">
                            <CommandEmpty>No se encontraron estados.</CommandEmpty>
                            <CommandGroup>
                              {sunatStatus.map((estado: any) => (
                                <CommandItem
                                  key={estado.id}
                                  value={estado.nombre}
                                  onSelect={() => {
                                    handleInputChange('estadoSUNAT', estado.nombre);
                                    setIsPopoverSunatOpen(false);
                                  }}
                                  aria-selected={formData.estadoSUNAT === estado.nombre}
                                  role="option"
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      formData.estadoSUNAT === estado.nombre ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  {estado.nombre}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
                    <Popover open={isPopoverProvinceOpen} onOpenChange={setIsPopoverProvinceOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between h-12"
                          aria-expanded={Boolean(formData.provincia)}
                          aria-controls="provincia-listbox"
                          aria-haspopup="listbox"
                        >
                          {formData.provincia
                            ? provincesCities.find((p: any) => p.id === formData.provincia)?.nombre
                            : 'Seleccionar provincia...'}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Buscar provincia..." />
                          <CommandList id="provincia-listbox" role="listbox" aria-label="Provincias">
                            <CommandEmpty>No se encontraron provincias.</CommandEmpty>
                            <CommandGroup>
                              {provincesCities.map((provincia: any) => (
                                <CommandItem
                                  key={provincia.id}
                                  value={provincia.nombre}
                                  onSelect={() => {
                                    handleInputChange('provincia', provincia.id);
                                    setIsPopoverProvinceOpen(false)
                                  }}
                                  aria-selected={formData.provincia === provincia.id}
                                  role="option"
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      formData.provincia === provincia.id ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  {provincia.nombre}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zona">Zona *</Label>
                    <Popover open={isPopoverZoneOpen} onOpenChange={setIsPopoverZoneOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between h-12"
                          aria-expanded={Boolean(formData.idZona)}
                          aria-controls="zona-listbox"
                          aria-haspopup="listbox"
                        >
                          {formData.idZona
                            ? zones.find((z: any) => z.IdZona === formData.idZona)?.NombreZona
                            : 'Seleccionar zona...'}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Buscar zona..." />
                          <CommandList id="zona-listbox" role="listbox" aria-label="Zonas">
                            <CommandEmpty>No se encontraron zonas.</CommandEmpty>
                            <CommandGroup>
                              {zones.map((zone: any) => (
                                <CommandItem
                                  key={zone.IdZona}
                                  value={zone.NombreZona}
                                  onSelect={() => {
                                    handleInputChange('idZona', zone.IdZona);
                                    setIsPopoverZoneOpen(false);
                                  }}
                                  aria-selected={formData.idZona === zone.IdZona}
                                  role="option"
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      formData.idZona === zone.IdZona ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  {zone.NombreZona}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="distrito">Distrito *</Label>
                    <Popover open={isPopoverDistrictOpen} onOpenChange={setIsPopoverDistrictOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between h-12"
                          aria-expanded={Boolean(formData.idDistrito)}
                          aria-controls="distrito-listbox"
                          aria-haspopup="listbox"
                        >
                          {formData.idDistrito
                            ? districts.find((d: any) => d.id === formData.idDistrito)?.nombre
                            : 'Seleccionar distrito...'}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Buscar distrito..." />
                          <CommandList id="distrito-listbox" role="listbox" aria-label="Distritos">
                            <CommandEmpty>No se encontraron distritos.</CommandEmpty>
                            <CommandGroup>
                              {districts.map((district: any) => (
                                <CommandItem
                                  key={district.id}
                                  value={district.nombre}
                                  onSelect={() => {
                                    handleInputChange('idDistrito', district.id);
                                    setIsPopoverDistrictOpen(false);
                                  }}
                                  aria-selected={formData.idDistrito === district.id}
                                  role="option"
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      formData.idDistrito === district.id ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  {district.nombre}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
                      value={user?.codigo}
                      disabled />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
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
                className={`w-full sm:w-auto bg-orange-600 hover:bg-orange-700`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Actualizar Evaluación
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Tab 2: Dirección Técnica */}
          <TabDireccionTecnica
            codClient={codClient}
            onClose={() => onOpenChange(false)}
            evaluationClient={evaluationClient}
          />

          <TabCalificacion
            onClose={() => onOpenChange(false)}
            evaluacionCalificacion={evaluacionCalificacion}
          />
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default ModalClientEdit