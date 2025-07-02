import React, { useState } from "react";

// ────────────────────────────────────────────────────────────────────────────────
// UI components (shadcn/ui)
// ────────────────────────────────────────────────────────────────────────────────
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

// ────────────────────────────────────────────────────────────────────────────────
// Icons (lucide-react)
// ────────────────────────────────────────────────────────────────────────────────
import {
  Plus,
  Edit,
  User,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  X,
  MapPin,
  Calendar,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────────
// NOTE:  Extra UI catalogues (categorias, provincias, …) are expected to be
//        provided by the parent component.  Define *just* what is required for
//        this component to compile correctly.
//        Feel free to extend / tighten these types in your own code‑base.
// ------------------------------------------------------------------------------
interface SelectItem {
  value: string;
  label: string;
}

interface Province {
  id: number;
  nombre: string;
}

interface Zone {
  id: string;
  nombre: string;
}

interface FormData {
  /** TAB I */
  codigoInterno: string;
  nombreComercial: string;
  categoria: string;
  razonSocial: string;
  ruc: string;
  tipoDocIdent: string;
  telefono: string;
  direccion: string;
  estadoContribuyenteSunat: string;
  fechaEvaluacion: string; // ISO date «yyyy‑MM‑dd»
  itemLista: string;
  representanteLegal: string;
  correoElectronico: string;
  provincia: number;
  idZona: string;
  idDistrito: number;
  tipoCliente: string;
  fechaInicio: string; // ISO date
  numRegistro: string;
  codigoVendedor: string;

  /** TAB II */
  documentos: {
    autorizacionSanitaria: DocBlock;
    situacionFuncionamiento: DocBlock;
    numeroRegistro: DocBlock;
    certificaciones: DocBlock;
  };

  /** TAB III */
  aprobadoDirTecnica: boolean | null; // null = pending
  aprobadoGerente: boolean | null;    // null = pending
  observacionesGlobal: string;
}

interface DocBlock {
  detalle: string;
  observaciones: string;
}

interface ModalCreateEditionsProps {
  /** Controls the Dialog visibility */
  open: boolean;
  /** Parent handler to toggle the Dialog */
  onOpenChange: (open: boolean) => void;

  /** True ⇢ create / false ⇢ edit */
  isCreate: boolean;

  /** Controlled data & setters */
  formData: FormData;
  setFormData: (data: FormData) => void;

  /** Async‑save helpers */
  handleSave: () => void;
  isSubmitting?: boolean;

  /** Catalogues for selects */
  categorias: SelectItem[];
  tiposDocumento: SelectItem[];
  estadosContribuyente: SelectItem[];
  provincias: Province[];
  zonas: Zone[];
  tiposCliente: SelectItem[];
}

// ────────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────────
const ModalCreateEditions: React.FC<ModalCreateEditionsProps> = ({
  open,
  onOpenChange,
  isCreate,
  formData,
  setFormData,
  handleSave,
  isSubmitting = false,
  categorias,
  tiposDocumento,
  estadosContribuyente,
  provincias,
  zonas,
  tiposCliente,
}) => {
  /*------------------------------------------------------------------------─*
   | Controlled inputs utilities                                             |
   *------------------------------------------------------------------------─*/
  const handleInputChange = (key: string, value: unknown) => {
    setFormData({ ...formData, [key]: value } as FormData);
  };

  /*------------------------------------------------------------------------─*/
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto mx-2">
        {/* ───── Header ───── */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCreate ? (
              <>
                <Plus className="h-5 w-5 text-blue-600" />
                Nueva Evaluación de Cliente
              </>
            ) : (
              <>
                <Edit className="h-5 w-5 text-orange-600" />
                Editar Evaluación – {formData.codigoInterno}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* ───── Tabs ───── */}
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
              <span className="sm:hidden">Dir. Téc.</span>
            </TabsTrigger>
            <TabsTrigger value="calificacion" className="flex items-center gap-2 text-xs sm:text-sm">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">III. Calificación</span>
              <span className="sm:hidden">Calif.</span>
            </TabsTrigger>
          </TabsList>

          {/* ---------------------------------------------------------------- */}
          {/* TAB I – ADMINISTRADOR                                            */}
          {/* ---------------------------------------------------------------- */}
          <TabsContent value="administrador" className="space-y-6 mt-6">
            {/* Información básica */}
            <section className="space-y-6">
              <header className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  Información Básica del Cliente
                </h4>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Código interno */}
                  <Field label="Código Interno *" id="codigoInterno">
                    <Input
                      id="codigoInterno"
                      placeholder="CLI001"
                      value={formData.codigoInterno}
                      onChange={(e) => handleInputChange("codigoInterno", e.target.value)}
                      disabled={!isCreate}
                      required
                    />
                  </Field>

                  {/* Nombre comercial */}
                  <Field label="Nombre Comercial *" id="nombreComercial">
                    <Input
                      id="nombreComercial"
                      placeholder="Farmacia San Juan"
                      value={formData.nombreComercial}
                      onChange={(e) => handleInputChange("nombreComercial", e.target.value)}
                      required
                    />
                  </Field>

                  {/* Categoría */}
                  <Field label="Categoría *" id="categoria">
                    <select
                      id="categoria"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={formData.categoria}
                      onChange={(e) => handleInputChange("categoria", e.target.value)}
                      required
                    >
                      <option value="">Seleccionar categoría</option>
                      {categorias.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  {/* Razón social */}
                  <Field label="Razón Social *" id="razonSocial" className="lg:col-span-3">
                    <Input
                      id="razonSocial"
                      placeholder="ALVAREZ MANTILLA BALDOMERO"
                      value={formData.razonSocial}
                      onChange={(e) => handleInputChange("razonSocial", e.target.value)}
                      required
                    />
                  </Field>

                  {/* RUC */}
                  <Field label="RUC *" id="ruc">
                    <Input
                      id="ruc"
                      placeholder="10266256596"
                      value={formData.ruc}
                      onChange={(e) => handleInputChange("ruc", e.target.value)}
                      required
                    />
                  </Field>

                  {/* Tipo documento */}
                  <Field label="Tipo Documento *" id="tipoDocIdent">
                    <select
                      id="tipoDocIdent"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={formData.tipoDocIdent}
                      onChange={(e) => handleInputChange("tipoDocIdent", e.target.value)}
                      required
                    >
                      <option value="">Seleccionar tipo</option>
                      {tiposDocumento.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  {/* Teléfono */}
                  <Field label="Teléfono *" id="telefono">
                    <Input
                      id="telefono"
                      placeholder="+51 999 123 456"
                      value={formData.telefono}
                      onChange={(e) => handleInputChange("telefono", e.target.value)}
                      required
                    />
                  </Field>

                  {/* Dirección (col‑span‑3) */}
                  <Field label="Dirección según ficha RUC *" id="direccion" className="lg:col-span-3">
                    <Input
                      id="direccion"
                      placeholder="Av. Los Libertadores #123 – Trujillo"
                      value={formData.direccion}
                      onChange={(e) => handleInputChange("direccion", e.target.value)}
                      required
                    />
                  </Field>

                  {/* Estado contribuyente */}
                  <Field label="Estado Contribuyente SUNAT *" id="estadoContribuyenteSunat">
                    <select
                      id="estadoContribuyenteSunat"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={formData.estadoContribuyenteSunat}
                      onChange={(e) => handleInputChange("estadoContribuyenteSunat", e.target.value)}
                      required
                    >
                      <option value="">Seleccionar estado</option>
                      {estadosContribuyente.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  {/* Fecha evaluación */}
                  <Field label="Fecha Evaluación *" id="fechaEvaluacion">
                    <Input
                      id="fechaEvaluacion"
                      type="date"
                      value={formData.fechaEvaluacion}
                      onChange={(e) => handleInputChange("fechaEvaluacion", e.target.value)}
                      required
                    />
                  </Field>

                  {/* Item lista */}
                  <Field label="Item Lista" id="itemLista">
                    <Input
                      id="itemLista"
                      placeholder="ITEM001"
                      value={formData.itemLista}
                      onChange={(e) => handleInputChange("itemLista", e.target.value)}
                    />
                  </Field>

                  {/* Representante legal (col‑span‑2) */}
                  <Field label="Nombre del Representante Legal/Propietario" id="representanteLegal" className="lg:col-span-2">
                    <Input
                      id="representanteLegal"
                      placeholder="Nombre completo"
                      value={formData.representanteLegal}
                      onChange={(e) => handleInputChange("representanteLegal", e.target.value)}
                    />
                  </Field>

                  {/* Correo */}
                  <Field label="Correo Electrónico" id="correoElectronico">
                    <Input
                      id="correoElectronico"
                      type="email"
                      placeholder="cliente@email.com"
                      value={formData.correoElectronico}
                      onChange={(e) => handleInputChange("correoElectronico", e.target.value)}
                    />
                  </Field>
                </div>
              </header>

              <Separator />

              {/* Información de ubicación */}
              <header className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-purple-600" />
                  Información de Ubicación
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Provincia */}
                  <Field label="Provincia *" id="provincia">
                    <select
                      id="provincia"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={formData.provincia}
                      onChange={(e) => handleInputChange("provincia", Number(e.target.value))}
                      required
                    >
                      <option value={0}>Seleccionar provincia</option>
                      {provincias.map(({ id, nombre }) => (
                        <option key={id} value={id}>
                          {nombre}
                        </option>
                      ))}
                    </select>
                  </Field>

                  {/* Zona */}
                  <Field label="Zona *" id="idZona">
                    <select
                      id="idZona"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={formData.idZona}
                      onChange={(e) => handleInputChange("idZona", e.target.value)}
                      required
                    >
                      <option value="">Seleccionar zona</option>
                      {zonas.map(({ id, nombre }) => (
                        <option key={id} value={id}>
                          {nombre}
                        </option>
                      ))}
                    </select>
                  </Field>

                  {/* Distrito */}
                  <Field label="ID Distrito" id="idDistrito">
                    <Input
                      id="idDistrito"
                      type="number"
                      placeholder="11001"
                      value={formData.idDistrito}
                      onChange={(e) => handleInputChange("idDistrito", Number(e.target.value) || 0)}
                    />
                  </Field>

                  {/* Tipo cliente */}
                  <Field label="Tipo Cliente *" id="tipoCliente">
                    <select
                      id="tipoCliente"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={formData.tipoCliente}
                      onChange={(e) => handleInputChange("tipoCliente", e.target.value)}
                      required
                    >
                      <option value="">Seleccionar tipo</option>
                      {tiposCliente.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </header>

              <Separator />

              {/* Información del sistema */}
              <header className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  Información del Sistema
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Fecha inicio */}
                  <Field label="Fecha de Inicio *" id="fechaInicio">
                    <Input
                      id="fechaInicio"
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) => handleInputChange("fechaInicio", e.target.value)}
                      required
                    />
                  </Field>

                  {/* Número registro */}
                  <Field label="Número de Registro" id="numRegistro">
                    <Input
                      id="numRegistro"
                      placeholder="REG001"
                      value={formData.numRegistro}
                      onChange={(e) => handleInputChange("numRegistro", e.target.value)}
                    />
                  </Field>

                  {/* Código vendedor (readonly) */}
                  <Field label="Código Vendedor" id="codigoVendedor">
                    <Input id="codigoVendedor" value={formData.codigoVendedor} disabled />
                  </Field>
                </div>
              </header>
            </section>
          </TabsContent>

          {/* ---------------------------------------------------------------- */}
          {/* TAB II – DIRECCIÓN TÉCNICA                                       */}
          {/* ---------------------------------------------------------------- */}
          {/*  …                                                             */}
          {/*  (The remaining tabs are unchanged and omitted for brevity)    */}
          {/* ---------------------------------------------------------------- */}
        </Tabs>

        {/* ───── Footer ───── */}
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            className={`w-full sm:w-auto ${isCreate ? "bg-blue-600 hover:bg-blue-700" : "bg-orange-600 hover:bg-orange-700"}`}
          >
            {isSubmitting ? (
              <>
                {/* Tailwind loader */}
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                {isCreate ? "Creando…" : "Actualizando…"}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isCreate ? "Crear Evaluación" : "Actualizar Evaluación"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ────────────────────────────────────────────────────────────────────────────────
// Minor helpers
// ────────────────────────────────────────────────────────────────────────────────
interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  label: string;
  children: React.ReactNode;
}

/**
 * Thin wrapper that renders a <Label> + control with consistent spacing.
 */
const Field: React.FC<FieldProps> = ({ id, label, children, className = "", ...rest }) => (
  <div className={`space-y-2 ${className}`} {...rest}>
    <Label htmlFor={id}>{label}</Label>
    {children}
  </div>
);

export default ModalCreateEditions;
