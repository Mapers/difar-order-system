'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { User, Save, X, MapPin, Calendar, ChevronDown, Check, Edit, Loader2 } from 'lucide-react'
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useAuth } from '@/context/authContext';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from '../ui/command';
import { toast } from '@/hooks/use-toast'
import { ClientService } from '@/app/services/client/ClientService'
import { useClientCreatedData } from '@/app/dashboard/clientes/hooks/useClientCreatedData'

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

interface ModalVerificationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  codClient?: string
}

const NuevoClienteForm: React.FC<ModalVerificationProps> = ({ open, onOpenChange, codClient }) => {
  const { typeDocuments, provincesCities, districts, zones, sunatStatus } = useClientCreatedData(open);
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)

  const [isPopoverProvinceOpen, setIsPopoverProvinceOpen] = useState(false);
  const [isPopoverZoneOpen, setIsPopoverZoneOpen] = useState(false);
  // const [isPopoverSunatOpen, setIsPopoverSunatOpen] = useState(false);
  const [isPopoverDistrictOpen, setIsPopoverDistrictOpen] = useState(false);

  const initialFormState = {
    codigo: '',
    codigoVed: '',
    nombre: '',
    nombreComercial: '',
    ruc: '',
    tipoDocIdent: '',
    tipoCliente: 'Activo',
    direccion: '',
    referenciaDireccion: '',
    telefono: '',
    correoElectronico: '',
    provincia: 0,
    idZona: '',
    idDistrito: 0,
    fechaInicio: new Date().toISOString().split('T')[0],
    estadoSUNAT: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (open) {
      if (codClient) {
        const fetchClientData = async () => {
          setIsLoadingData(true);
          try {
            const res = await ClientService.getClientBycod(codClient);

            if (res.success && res.data) {
              const client = Array.isArray(res.data) ? res.data[0] : res.data;

              setFormData({
                codigo: client.codigo || '',
                codigoVed: client.codigo_vendedor || user?.codigo || '',
                nombre: client.razon_social || '',
                nombreComercial: client.nombre_comercial || '',
                ruc: client.documento_numero || '',
                tipoDocIdent: client.tipoDocIdent,
                tipoCliente: client.estado === 'INACTIVO' ? 'Inactivo' : 'Activo',
                direccion: client.direccion || '',
                referenciaDireccion: client.referenciaDireccion || '',
                telefono: client.Telefono || '',
                correoElectronico: client.email || '',
                provincia: client.idProvincia || '',
                idZona: client.idZona || '',
                idDistrito: client.idDistrito || '',
                fechaInicio: client.FECHA_INICIO
                    ? new Date(client.FECHA_INICIO).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0],
                estadoSUNAT: client.estadoSUNAT,
              });
            }
          } catch (error) {
            console.error("Error cargando cliente:", error);
            toast({ title: "Error", description: "No se pudieron cargar los datos del cliente.", variant: "error" });
          } finally {
            setIsLoadingData(false);
          }
        };
        fetchClientData();
      } else {
        // Modo Creación: Limpiar formulario
        setFormData({ ...initialFormState, codigoVed: user?.codigo || '' });
      }
    }
  }, [open, codClient, user, provincesCities, districts, zones]);

  const handleInputChange = (field: string, value: any) => {
    if (field === 'ruc') {
      value = value.replace(/\D/g, '');
    }
    setFormData(prev => {
      const copy = { ...prev, [field]: value };
      if (field === 'ruc' && !codClient) {
        copy.codigo = value;
      }
      return copy;
    });
  }

  const handleSave = async () => {
    if (!formData.ruc || !formData.nombre || !formData.tipoDocIdent) {
      toast({ title: "Atención", description: "RUC/DNI, Nombre y Tipo de Documento son obligatorios.", variant: "warning" });
      return;
    }

    if (formData.ruc.length !== 8 && formData.ruc.length !== 11) {
      toast({ title: "Atención", description: "El documento debe tener exactamente 8 o 11 dígitos.", variant: "warning" });
      return;
    }

    setIsSubmitting(true);
    try {
      const dataPayload = {
        codigo: formData.codigo || formData.ruc,
        codigoVed: formData.codigoVed || user?.codigo || '',
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
        referenciaDireccion: formData.referenciaDireccion,
        estadoSUNAT: formData.estadoSUNAT,
      };

      const response = await ClientService.createUpdateCliente(dataPayload);

      if (response.success) {
        toast({
          title: "Éxito",
          description: codClient ? "Cliente actualizado correctamente" : "Cliente registrado correctamente",
          variant: "success"
        });
        onOpenChange(false);
      } else {
        toast({ title: "Error", description: "No se pudo guardar el cliente.", variant: "error" });
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      toast({ title: "Error", description: "Ocurrió un error inesperado al guardar.", variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto mx-2">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {codClient ? <Edit className="h-5 w-5 text-blue-600" /> : <User className="h-5 w-5 text-blue-600" />}
              {codClient ? 'Editar Cliente' : 'Nuevo Cliente'}
            </DialogTitle>
          </DialogHeader>

          {isLoadingData ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                <p className="text-slate-500 font-medium">Cargando datos del cliente...</p>
              </div>
          ) : (
              <div className="space-y-6">
                {/* Información básica */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    Datos Principales
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipoDocIdent">Tipo Documento *</Label>
                      <select
                          id="tipoDocIdent"
                          value={formData.tipoDocIdent}
                          onChange={(e) => handleInputChange("tipoDocIdent", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white h-10"
                          required
                      >
                        <option value="">Seleccionar tipo</option>
                        {typeDocuments?.map((tipo: any) => (
                            <option key={tipo.codigo} value={tipo.codigo}>
                              {tipo.abreviatura}
                            </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ruc">RUC / DNI *</Label>
                      <Input
                          id="ruc"
                          value={formData.ruc}
                          onChange={(e) => handleInputChange("ruc", e.target.value)}
                          placeholder="Ej. 20123456789"
                          maxLength={11}
                          required
                      />
                      <span className="text-[10px] text-gray-500">
                      {formData.ruc.length} / 11 caracteres
                    </span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="codigo">Código Interno</Label>
                      <Input
                          id="codigo"
                          value={formData.codigo}
                          placeholder="Se autocompleta con el RUC"
                          disabled
                          className="bg-slate-50"
                      />
                    </div>

                    <div className="space-y-2 lg:col-span-2">
                      <Label htmlFor="nombre">Razón Social o Nombres *</Label>
                      <Input
                          id="nombre"
                          value={formData.nombre}
                          onChange={(e) => handleInputChange("nombre", e.target.value)}
                          placeholder="Ej. ALVAREZ MANTILLA BALDOMERO"
                          required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nombreComercial">Nombre Comercial</Label>
                      <Input
                          id="nombreComercial"
                          value={formData.nombreComercial}
                          onChange={(e) => handleInputChange("nombreComercial", e.target.value)}
                          placeholder="Farmacia San Juan"
                      />
                    </div>

                    <div className="space-y-2 lg:col-span-2">
                      <Label htmlFor="direccion">Dirección *</Label>
                      <Input
                          id="direccion"
                          value={formData.direccion}
                          onChange={(e) => handleInputChange("direccion", e.target.value)}
                          placeholder="Av. Principal 123"
                          required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="referenciaDireccion">Referencia de Dirección</Label>
                      <Input
                          id="referenciaDireccion"
                          value={formData.referenciaDireccion}
                          onChange={(e) => handleInputChange("referenciaDireccion", e.target.value)}
                          placeholder="Frente al parque"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono *</Label>
                      <Input
                          id="telefono"
                          value={formData.telefono}
                          onChange={(e) => handleInputChange("telefono", e.target.value)}
                          placeholder="999 888 777"
                          required
                      />
                    </div>

                    <div className="space-y-2 lg:col-span-2">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="provincia">Provincia</Label>
                      <Popover open={isPopoverProvinceOpen} onOpenChange={setIsPopoverProvinceOpen}>
                        <PopoverTrigger asChild>
                          <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between h-10 font-normal"
                              aria-expanded={Boolean(formData.provincia)}
                          >
                        <span className="truncate">
                        {formData.provincia
                            ? provincesCities?.find((p: any) => p.id == formData.provincia)?.nombre
                            : 'Seleccionar provincia...'}
                        </span>
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar provincia..." />
                            <CommandList>
                              <CommandEmpty>No se encontraron provincias.</CommandEmpty>
                              <CommandGroup>
                                {provincesCities?.map((provincia: any) => (
                                    <CommandItem
                                        key={provincia.id}
                                        value={provincia.nombre}
                                        onSelect={() => {
                                          handleInputChange('provincia', provincia.id);
                                          setIsPopoverProvinceOpen(false)
                                        }}
                                    >
                                      <Check
                                          className={cn(
                                              'mr-2 h-4 w-4 flex-shrink-0',
                                              formData.provincia == provincia.id ? 'opacity-100' : 'opacity-0'
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
                      <Label htmlFor="distrito">Distrito</Label>
                      <Popover open={isPopoverDistrictOpen} onOpenChange={setIsPopoverDistrictOpen}>
                        <PopoverTrigger asChild>
                          <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between h-10 font-normal"
                              aria-expanded={Boolean(formData.idDistrito)}
                          >
                        <span className="truncate">
                        {formData.idDistrito
                            ? districts?.find((d: any) => d.id == formData.idDistrito)?.nombre
                            : 'Seleccionar distrito...'}
                        </span>
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar distrito..." />
                            <CommandList>
                              <CommandEmpty>No se encontraron distritos.</CommandEmpty>
                              <CommandGroup>
                                {districts?.map((district: any) => (
                                    <CommandItem
                                        key={district.id}
                                        value={district.nombre}
                                        onSelect={() => {
                                          handleInputChange('idDistrito', district.id);
                                          setIsPopoverDistrictOpen(false);
                                        }}
                                    >
                                      <Check
                                          className={cn(
                                              'mr-2 h-4 w-4 flex-shrink-0',
                                              formData.idDistrito == district.id ? 'opacity-100' : 'opacity-0'
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

                    <div className="space-y-2">
                      <Label htmlFor="zona">Zona Geográfica</Label>
                      <Popover open={isPopoverZoneOpen} onOpenChange={setIsPopoverZoneOpen}>
                        <PopoverTrigger asChild>
                          <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between h-10 font-normal"
                              aria-expanded={Boolean(formData.idZona)}
                          >
                        <span className="truncate">
                        {formData.idZona
                            ? zones?.find((z: any) => z.IdZona === formData.idZona)?.NombreZona
                            : 'Seleccionar zona...'}
                        </span>
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar zona..." />
                            <CommandList>
                              <CommandEmpty>No se encontraron zonas.</CommandEmpty>
                              <CommandGroup>
                                {zones?.map((zone: any) => (
                                    <CommandItem
                                        key={zone.IdZona}
                                        value={zone.NombreZona}
                                        onSelect={() => {
                                          handleInputChange('idZona', zone.IdZona);
                                          setIsPopoverZoneOpen(false);
                                        }}
                                    >
                                      <Check
                                          className={cn(
                                              'mr-2 h-4 w-4 flex-shrink-0',
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
                  </div>
                </div>

                <Separator />

                {/* Información del sistema */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    Configuración Comercial
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/*<div className="space-y-2">*/}
                    {/*  <Label htmlFor="estadoContribuyenteSunat">Estado SUNAT</Label>*/}
                    {/*  <Popover open={isPopoverSunatOpen} onOpenChange={setIsPopoverSunatOpen}>*/}
                    {/*    <PopoverTrigger asChild>*/}
                    {/*      <Button*/}
                    {/*          variant="outline"*/}
                    {/*          role="combobox"*/}
                    {/*          className="w-full justify-between h-10 font-normal"*/}
                    {/*          aria-expanded={Boolean(formData.estadoSUNAT)}*/}
                    {/*      >*/}
                    {/*    <span className="truncate">*/}
                    {/*    {formData.estadoSUNAT*/}
                    {/*        ? sunatStatus?.find((estado: any) => estado.nombre === formData.estadoSUNAT)?.nombre*/}
                    {/*        : 'Seleccionar estado...'}*/}
                    {/*    </span>*/}
                    {/*        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />*/}
                    {/*      </Button>*/}
                    {/*    </PopoverTrigger>*/}
                    {/*    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">*/}
                    {/*      <Command>*/}
                    {/*        <CommandInput placeholder="Buscar estado..." />*/}
                    {/*        <CommandList>*/}
                    {/*          <CommandEmpty>No se encontraron estados.</CommandEmpty>*/}
                    {/*          <CommandGroup>*/}
                    {/*            {sunatStatus?.map((estado: any) => (*/}
                    {/*                <CommandItem*/}
                    {/*                    key={estado.id}*/}
                    {/*                    value={estado.nombre}*/}
                    {/*                    onSelect={() => {*/}
                    {/*                      handleInputChange('estadoSUNAT', estado.nombre);*/}
                    {/*                      setIsPopoverSunatOpen(false);*/}
                    {/*                    }}*/}
                    {/*                >*/}
                    {/*                  <Check*/}
                    {/*                      className={cn(*/}
                    {/*                          'mr-2 h-4 w-4 flex-shrink-0',*/}
                    {/*                          formData.estadoSUNAT === estado.nombre ? 'opacity-100' : 'opacity-0'*/}
                    {/*                      )}*/}
                    {/*                  />*/}
                    {/*                  {estado.nombre}*/}
                    {/*                </CommandItem>*/}
                    {/*            ))}*/}
                    {/*          </CommandGroup>*/}
                    {/*        </CommandList>*/}
                    {/*      </Command>*/}
                    {/*    </PopoverContent>*/}
                    {/*  </Popover>*/}
                    {/*</div>*/}

                    <div className="space-y-2">
                      <Label htmlFor="tipoCliente">Tipo de Cliente</Label>
                      <select
                          id="tipoCliente"
                          value={formData.tipoCliente}
                          onChange={(e) => handleInputChange("tipoCliente", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white h-10"
                      >
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                    </div>

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
                      <Label>Vendedor Asignado</Label>
                      <Input
                          value={formData.codigoVed || user?.codigo || ''}
                          disabled
                          className="bg-slate-50"
                      />
                    </div>
                  </div>
                </div>
              </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-2 mt-6">
            <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
                disabled={isSubmitting || isLoadingData}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button
                onClick={handleSave}
                disabled={isSubmitting || isLoadingData}
                className={`w-full sm:w-auto bg-blue-600 hover:bg-blue-700`}
            >
              {isSubmitting ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Guardando...
                  </>
              ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {codClient ? 'Guardar Cambios' : 'Registrar Cliente'}
                  </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  )
}

export default NuevoClienteForm