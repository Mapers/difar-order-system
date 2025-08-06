import { useState, useEffect } from "react";
import {ChevronDown, ChevronUp, Plus, Search, Trash2, Truck, UserPlus} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import apiClient from "@/app/api/client";
import {Pedido} from "@/app/dashboard/comprobantes/page";

interface Conductor {
  tipoDocumento: string;
  numeroDocumento: string;
  nombre: string;
  apellidos: string;
  licencia: string;
}

interface PedidoDet {
  codigoitemPedido: string;
  cantPedido: string;
  productoNombre?: string;
  productoUnidad?: string;
}

interface Vehiculo {
  placa: string;
  tuc?: string;
}

interface GuiaTransportistaModalProps {
  pedido: Pedido | null;
  detalles: PedidoDet[];
}

export function GuiaTransportista({
                                pedido,
                                detalles
                                  }: GuiaTransportistaModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Estado inicial
  const [datosGuia, setDatosGuia] = useState({
    tipoDocumento: "09", // 09 = Guía de remisión transportista
    serie: "T001",
    numero: "",
    fechaEmision: new Date().toISOString().split('T')[0],
    formatoPdf: "A4",
  });

  const [datosDestinatario, setDatosDestinatario] = useState({
    tipoDocumento: "6", // 6 = RUC por defecto
    numeroDocumento: "",
    nombre: "",
    direccion: "",
  });

  const [datosTransportista, setDatosTransportista] = useState({
    tipoDocumento: "6", // 6 = RUC por defecto
    numeroDocumento: "",
    denominacion: "",
    registroMtc: "",
  });

  const [vehiculoPrincipal, setVehiculoPrincipal] = useState<Vehiculo>({
    placa: "",
    tuc: "",
  });

  const [vehiculosSecundarios, setVehiculosSecundarios] = useState<Vehiculo[]>([]);

  const [conductorPrincipal, setConductorPrincipal] = useState<Conductor>({
    tipoDocumento: "1", // 1 = DNI por defecto
    numeroDocumento: "",
    nombre: "",
    apellidos: "",
    licencia: "",
  });

  const [conductoresSecundarios, setConductoresSecundarios] = useState<Conductor[]>([]);

  const [puntosUbicacion, setPuntosUbicacion] = useState({
    partida: {
      ubigeo: "150101", // Código de Lima por defecto
      direccion: "",
      codigoSunat: "0000",
    },
    llegada: {
      ubigeo: "",
      direccion: "",
      codigoSunat: "0000",
    },
  });

  const [datosTraslado, setDatosTraslado] = useState({
    fechaInicio: new Date().toISOString().split('T')[0],
    pesoBruto: "",
    pesoUnidad: "KGM", // KGM = Kilogramo
    indicadorSunat: "",
  });

  const [productos, setProductos] = useState<PedidoDet[]>(detalles);
  const [observaciones, setObservaciones] = useState("");

  // Funciones para manejar conductores
  const agregarConductorSecundario = () => {
    if (conductoresSecundarios.length < 2) { // Máximo 2 conductores secundarios
      setConductoresSecundarios([
        ...conductoresSecundarios,
        {
          tipoDocumento: "1",
          numeroDocumento: "",
          nombre: "",
          apellidos: "",
          licencia: "",
        },
      ]);
    }
  };

  const eliminarConductorSecundario = (index: number) => {
    setConductoresSecundarios(conductoresSecundarios.filter((_, i) => i !== index));
  };

  // Funciones para manejar vehículos
  const agregarVehiculoSecundario = () => {
    if (vehiculosSecundarios.length < 2) { // Máximo 2 vehículos secundarios
      setVehiculosSecundarios([...vehiculosSecundarios, { placa: "" }]);
    }
  };

  const eliminarVehiculoSecundario = (index: number) => {
    setVehiculosSecundarios(vehiculosSecundarios.filter((_, i) => i !== index));
  };

  // Función para agregar producto
  const agregarProducto = () => {
    setProductos([
      ...productos,
      {
        codigoitemPedido: "",
        productoNombre: "",
        cantPedido: "",
        productoUnidad: "NIU",
      },
    ]);
  };

  // Función para eliminar producto
  const eliminarProducto = (index: number) => {
    setProductos(productos.filter((_, i) => i !== index));
  };

  // Función para enviar la guía
  const emitirGuia = async () => {
    setLoading(true);

    try {
      // Validaciones básicas
      if (!datosTransportista.numeroDocumento || !vehiculoPrincipal.placa ||
        !conductorPrincipal.numeroDocumento || !puntosUbicacion.partida.direccion ||
        productos.length === 0) {
        toast({
          title: "Error",
          description: "Complete los campos obligatorios",
          variant: "destructive",
        });
        return;
      }

      // Preparar datos para el endpoint de cabecera
      const guiaCabData = {
        p_tipo_comprobante: datosGuia.tipoDocumento,
        p_serie: datosGuia.serie,
        p_numero: datosGuia.numero,
        p_cliente_tipo_doc: datosDestinatario.tipoDocumento,
        p_cliente_num_doc: datosDestinatario.numeroDocumento,
        p_cliente_denominacion: datosDestinatario.nombre,
        p_cliente_direccion: datosDestinatario.direccion,
        p_fecha_emision: datosGuia.fechaEmision,
        p_observaciones: observaciones,
        p_motivo_traslado: "14", // 14 = Traslado por transportista
        p_peso_bruto_total: datosTraslado.pesoBruto,
        p_peso_bruto_unidad_medida: datosTraslado.pesoUnidad,
        p_tipo_transporte: "01", // 01 = Transporte público
        p_fecha_inicio_traslado: datosTraslado.fechaInicio,
        p_transportista_doc_tipo: datosTransportista.tipoDocumento,
        p_transportista_doc_numero: datosTransportista.numeroDocumento,
        p_transportista_denominacion: datosTransportista.denominacion,
        p_transportista_placa_numero: vehiculoPrincipal.placa,
        p_conductor_doc_tipo: conductorPrincipal.tipoDocumento,
        p_conductor_doc_numero: conductorPrincipal.numeroDocumento,
        p_conductor_nombre: conductorPrincipal.nombre,
        p_conductor_apellidos: conductorPrincipal.apellidos,
        p_conductor_num_licencia: conductorPrincipal.licencia,
        p_punto_partida_ubigeo: puntosUbicacion.partida.ubigeo,
        p_punto_partida_direccion: puntosUbicacion.partida.direccion,
        p_punto_partida_cod_estab_sunat: puntosUbicacion.partida.codigoSunat,
        p_punto_llegada_ubigeo: puntosUbicacion.llegada.ubigeo,
        p_punto_llegada_direccion: puntosUbicacion.llegada.direccion,
        p_punto_llegada_cod_estab_sunat: puntosUbicacion.llegada.codigoSunat,
        p_formato_de_pdf: datosGuia.formatoPdf,
        p_destinatario_documento_tipo: datosDestinatario.tipoDocumento,
        p_destinatario_documento_numero: datosDestinatario.numeroDocumento,
        p_destinatario_denominacion: datosDestinatario.nombre,
        p_registro_mtc: datosTransportista.registroMtc,
        p_tuc_vehiculo: vehiculoPrincipal.tuc,
      };

      // Enviar cabecera
      const responseCab = await apiClient.post("/pedidos/generateGuiaCab", guiaCabData);
      const idGuiaRemCab = responseCab.data.id; // Asumiendo que la respuesta incluye el ID

      // Enviar detalles
      for (const producto of productos) {
        const guiaDetData = {
          p_idGuiaRemCab: idGuiaRemCab,
          p_unidad_de_medida: producto.productoUnidad,
          p_codigo: producto.codigoitemPedido,
          p_descripcion: producto.productoNombre,
          p_cantidad: producto.cantPedido,
        };

        await apiClient.post("/pedidos/generateGuiaDet", guiaDetData);
      }

      toast({
        title: "Éxito",
        description: "Guía de transportista generada correctamente",
      });
    } catch (error) {
      console.error("Error al generar guía:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al generar la guía",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl mb-4 shadow-lg">
          <Truck className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
          Guía de Transportista Electrónica
        </h1>
        <p className="text-gray-600">Complete los datos requeridos para generar la guía</p>
      </div>

      {/* Sección principal en 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda */}
        <div className="space-y-6">
          {/* Información de la guía */}
          <Card className="shadow-sm">
            <CardHeader className="bg-orange-50 border-b">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-600" />
                Información de la Guía
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Serie</Label>
                  <Select
                    value={datosGuia.serie}
                    onValueChange={(value) => setDatosGuia({...datosGuia, serie: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="T001">T001</SelectItem>
                      <SelectItem value="T002">T002</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input
                    value={datosGuia.numero}
                    onChange={(e) => setDatosGuia({...datosGuia, numero: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fecha de emisión</Label>
                <Input
                  type="date"
                  value={datosGuia.fechaEmision}
                  onChange={(e) => setDatosGuia({...datosGuia, fechaEmision: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Datos del destinatario */}
          <Card className="shadow-sm">
            <CardHeader className="bg-orange-50 border-b">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-orange-600" />
                Datos del Destinatario
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de documento</Label>
                  <Select
                    value={datosDestinatario.tipoDocumento}
                    onValueChange={(value) => setDatosDestinatario({...datosDestinatario, tipoDocumento: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">RUC</SelectItem>
                      <SelectItem value="1">DNI</SelectItem>
                      <SelectItem value="4">Carné de extranjería</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Número de documento</Label>
                  <div className="flex">
                    <Input
                      value={datosDestinatario.numeroDocumento}
                      onChange={(e) => setDatosDestinatario({...datosDestinatario, numeroDocumento: e.target.value})}
                      className="rounded-r-none"
                    />
                    <Button variant="outline" size="icon" className="rounded-l-none border-l-0">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nombre/Razón social</Label>
                <Input
                  value={datosDestinatario.nombre}
                  onChange={(e) => setDatosDestinatario({...datosDestinatario, nombre: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input
                  value={datosDestinatario.direccion}
                  onChange={(e) => setDatosDestinatario({...datosDestinatario, direccion: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Puntos de partida y llegada */}
          <Card className="shadow-sm">
            <CardHeader className="bg-orange-50 border-b">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-600" />
                Ubicaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Punto de Partida</h3>
                <div className="space-y-2">
                  <Label>Ubigeo</Label>
                  <div className="flex gap-2">
                    <Input
                      value={puntosUbicacion.partida.ubigeo}
                      onChange={(e) => setPuntosUbicacion({
                        ...puntosUbicacion,
                        partida: {...puntosUbicacion.partida, ubigeo: e.target.value}
                      })}
                    />
                    <Button variant="outline" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input
                    value={puntosUbicacion.partida.direccion}
                    onChange={(e) => setPuntosUbicacion({
                      ...puntosUbicacion,
                      partida: {...puntosUbicacion.partida, direccion: e.target.value}
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Código SUNAT</Label>
                  <Input
                    value={puntosUbicacion.partida.codigoSunat}
                    onChange={(e) => setPuntosUbicacion({
                      ...puntosUbicacion,
                      partida: {...puntosUbicacion.partida, codigoSunat: e.target.value}
                    })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Punto de Llegada</h3>
                <div className="space-y-2">
                  <Label>Ubigeo</Label>
                  <div className="flex gap-2">
                    <Input
                      value={puntosUbicacion.llegada.ubigeo}
                      onChange={(e) => setPuntosUbicacion({
                        ...puntosUbicacion,
                        llegada: {...puntosUbicacion.llegada, ubigeo: e.target.value}
                      })}
                    />
                    <Button variant="outline" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input
                    value={puntosUbicacion.llegada.direccion}
                    onChange={(e) => setPuntosUbicacion({
                      ...puntosUbicacion,
                      llegada: {...puntosUbicacion.llegada, direccion: e.target.value}
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Código SUNAT</Label>
                  <Input
                    value={puntosUbicacion.llegada.codigoSunat}
                    onChange={(e) => setPuntosUbicacion({
                      ...puntosUbicacion,
                      llegada: {...puntosUbicacion.llegada, codigoSunat: e.target.value}
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha */}
        <div className="space-y-6">
          {/* Datos del transportista */}
          <Card className="shadow-sm">
            <CardHeader className="bg-orange-50 border-b">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-600" />
                Datos del Transportista
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de documento</Label>
                  <Select
                    value={datosTransportista.tipoDocumento}
                    onValueChange={(value) => setDatosTransportista({...datosTransportista, tipoDocumento: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">RUC</SelectItem>
                      <SelectItem value="1">DNI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Número de documento</Label>
                  <div className="flex">
                    <Input
                      value={datosTransportista.numeroDocumento}
                      onChange={(e) => setDatosTransportista({...datosTransportista, numeroDocumento: e.target.value})}
                      className="rounded-r-none"
                    />
                    <Button variant="outline" size="icon" className="rounded-l-none border-l-0">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Razón social / Nombre</Label>
                <Input
                  value={datosTransportista.denominacion}
                  onChange={(e) => setDatosTransportista({...datosTransportista, denominacion: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Registro MTC (opcional)</Label>
                <Input
                  value={datosTransportista.registroMtc}
                  onChange={(e) => setDatosTransportista({...datosTransportista, registroMtc: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Vehículos */}
          <Card className="shadow-sm">
            <CardHeader className="bg-orange-50 border-b">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-600" />
                Vehículos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">Vehículo principal</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Placa</Label>
                    <Input
                      value={vehiculoPrincipal.placa}
                      onChange={(e) => setVehiculoPrincipal({...vehiculoPrincipal, placa: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>TUC (opcional)</Label>
                    <Input
                      value={vehiculoPrincipal.tuc || ""}
                      onChange={(e) => setVehiculoPrincipal({...vehiculoPrincipal, tuc: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Vehículos secundarios (Máximo 2)</h4>
                  <Button
                    onClick={agregarVehiculoSecundario}
                    variant="outline"
                    size="sm"
                    disabled={vehiculosSecundarios.length >= 2}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>

                {vehiculosSecundarios.map((vehiculo, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
                    <div className="space-y-2">
                      <Label>Placa</Label>
                      <Input
                        value={vehiculo.placa}
                        onChange={(e) => {
                          const newVehiculos = [...vehiculosSecundarios];
                          newVehiculos[index].placa = e.target.value;
                          setVehiculosSecundarios(newVehiculos);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>TUC (opcional)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={vehiculo.tuc || ""}
                          onChange={(e) => {
                            const newVehiculos = [...vehiculosSecundarios];
                            newVehiculos[index].tuc = e.target.value;
                            setVehiculosSecundarios(newVehiculos);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => eliminarVehiculoSecundario(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Conductores */}
          <Card className="shadow-sm">
            <CardHeader className="bg-orange-50 border-b">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-orange-600" />
                Conductores
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Conductor principal */}
              <div className="space-y-4">
                <h4 className="font-medium">Conductor principal</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de documento</Label>
                    <Select
                      value={conductorPrincipal.tipoDocumento}
                      onValueChange={(value) => setConductorPrincipal({...conductorPrincipal, tipoDocumento: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">DNI</SelectItem>
                        <SelectItem value="4">Carné de extranjería</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Número de documento</Label>
                    <div className="flex">
                      <Input
                        value={conductorPrincipal.numeroDocumento}
                        onChange={(e) => setConductorPrincipal({...conductorPrincipal, numeroDocumento: e.target.value})}
                        className="rounded-r-none"
                      />
                      <Button variant="outline" size="icon" className="rounded-l-none border-l-0">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombres</Label>
                    <Input
                      value={conductorPrincipal.nombre}
                      onChange={(e) => setConductorPrincipal({...conductorPrincipal, nombre: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Apellidos</Label>
                    <Input
                      value={conductorPrincipal.apellidos}
                      onChange={(e) => setConductorPrincipal({...conductorPrincipal, apellidos: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Número de licencia</Label>
                  <Input
                    value={conductorPrincipal.licencia}
                    onChange={(e) => setConductorPrincipal({...conductorPrincipal, licencia: e.target.value})}
                  />
                </div>
              </div>

              {/* Conductores secundarios */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Conductores secundarios (Máximo 2)</h4>
                  <Button
                    onClick={agregarConductorSecundario}
                    variant="outline"
                    size="sm"
                    disabled={conductoresSecundarios.length >= 2}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>

                {conductoresSecundarios.map((conductor, index) => (
                  <div key={index} className="space-y-4 p-4 bg-gray-50 rounded">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo de documento</Label>
                        <Select
                          value={conductor.tipoDocumento}
                          onValueChange={(value) => {
                            const newConductores = [...conductoresSecundarios];
                            newConductores[index].tipoDocumento = value;
                            setConductoresSecundarios(newConductores);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">DNI</SelectItem>
                            <SelectItem value="4">Carné de extranjería</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Número de documento</Label>
                        <div className="flex">
                          <Input
                            value={conductor.numeroDocumento}
                            onChange={(e) => {
                              const newConductores = [...conductoresSecundarios];
                              newConductores[index].numeroDocumento = e.target.value;
                              setConductoresSecundarios(newConductores);
                            }}
                            className="rounded-r-none"
                          />
                          <Button variant="outline" size="icon" className="rounded-l-none border-l-0">
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nombres</Label>
                        <Input
                          value={conductor.nombre}
                          onChange={(e) => {
                            const newConductores = [...conductoresSecundarios];
                            newConductores[index].nombre = e.target.value;
                            setConductoresSecundarios(newConductores);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Apellidos</Label>
                        <Input
                          value={conductor.apellidos}
                          onChange={(e) => {
                            const newConductores = [...conductoresSecundarios];
                            newConductores[index].apellidos = e.target.value;
                            setConductoresSecundarios(newConductores);
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Número de licencia</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={conductor.licencia}
                          onChange={(e) => {
                            const newConductores = [...conductoresSecundarios];
                            newConductores[index].licencia = e.target.value;
                            setConductoresSecundarios(newConductores);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => eliminarConductorSecundario(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Datos del traslado */}
          <Card className="shadow-sm">
            <CardHeader className="bg-orange-50 border-b">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-600" />
                Datos del Traslado
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Fecha de inicio de traslado</Label>
                <Input
                  type="date"
                  value={datosTraslado.fechaInicio}
                  onChange={(e) => setDatosTraslado({...datosTraslado, fechaInicio: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Peso bruto total</Label>
                  <Input
                    type="number"
                    value={datosTraslado.pesoBruto}
                    onChange={(e) => setDatosTraslado({...datosTraslado, pesoBruto: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidad de medida</Label>
                  <Select
                    value={datosTraslado.pesoUnidad}
                    onValueChange={(value) => setDatosTraslado({...datosTraslado, pesoUnidad: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KGM">KGM - Kilogramo</SelectItem>
                      <SelectItem value="TNE">TNE - Tonelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Indicador SUNAT (opcional)</Label>
                <Input
                  value={datosTraslado.indicadorSunat}
                  onChange={(e) => setDatosTraslado({...datosTraslado, indicadorSunat: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-orange-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-600" />
              Productos
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidad</th>
              </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {productos.map((producto, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {producto.codigoitemPedido}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {producto.productoNombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {producto.cantPedido}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <Select
                      value={producto.productoUnidad}
                      onValueChange={(value) => {
                        const newProductos = [...productos];
                        newProductos[index].productoUnidad = value;
                        setProductos(newProductos);
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NIU">NIU - Unidad</SelectItem>
                        <SelectItem value="KGM">KGM - Kilogramo</SelectItem>
                        <SelectItem value="LTR">LTR - Litro</SelectItem>
                        <SelectItem value="MTR">MTR - Metro</SelectItem>
                        <SelectItem value="TNE">TNE - Tonelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="bg-orange-50 border-b">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Truck className="h-5 w-5 text-orange-600" />
            Observaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ingrese observaciones adicionales..."
            rows={3}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4 py-6">
        <Button
          onClick={emitirGuia}
          disabled={loading}
          className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
        >
          {loading ? "Generando..." : "Emitir Guía de Transportista"}
        </Button>
      </div>
    </div>
  );
}