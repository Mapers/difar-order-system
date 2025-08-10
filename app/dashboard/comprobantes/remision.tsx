import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, FileText, Plus, Search, Trash2, Truck, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import {toast, useToast} from "@/components/ui/use-toast";
import { Pedido } from "@/app/dashboard/comprobantes/page";
import apiClient from "@/app/api/client";

interface PedidoDet {
  idPedidodet: number
  idPedidocab: number
  codigoitemPedido: string
  cantPedido: string
  precioPedido: string
  productoNombre?: string
  productoUnidad?: string
}

interface Conductor {
  tipoDocumento: string;
  numeroDocumento: string;
  nombre: string;
  apellidos: string;
  licencia: string;
}

interface Vehiculo {
  placa: string;
}

interface RemisionModalProps {
  pedido: Pedido | null;
  detalles: PedidoDet[];
  onOpenChange: (open: boolean) => void
}

interface ReasonTrasGuide {
  codigo: string
  motivo_descr: string
}

export const Remision = ({ pedido, detalles, onOpenChange }: RemisionModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [serie, setSerie] = useState('');
  const [datosGuia, setDatosGuia] = useState({
    cliente: pedido?.nombreCliente || "",
    clienteTipoDoc: "6",
    clienteNumDoc: pedido?.codigoCliente || "",
    clienteDenominacion: pedido?.nombreCliente || "",
    clienteDireccion: pedido?.direccionCliente || "",
    clienteEmail: "",
    fechaEmision: new Date().toISOString().split('T')[0],
    formatoPdf: "A4",
    tipoTransporte: "01",
    motivoTraslado: "",
    observaciones: "",
  });

  const [datosTraslado, setDatosTraslado] = useState({
    fechaInicio: new Date().toISOString().split('T')[0],
    pesoBruto: "",
    pesoUnidad: "KGM", // KGM = Kilogramo
    numeroBultos: "1",
  });

  const [puntosUbicacion, setPuntosUbicacion] = useState({
    partida: {
      ubigeo: "021801",
      direccion: "Manuel Villavicencio 783, Chimbote",
      codigoSunat: "",
    },
    llegada: {
      ubigeo: "",
      direccion: "",
      codigoSunat: "",
    },
  });
  const [reasonTrasGuide, setReasonTrasGuide] = useState<ReasonTrasGuide[]>([])
  const [conductores, setConductores] = useState<Conductor[]>([
    {
      tipoDocumento: "1", // 1 = DNI por defecto
      numeroDocumento: "",
      nombre: "",
      apellidos: "",
      licencia: "",
    },
  ]);

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([{ placa: "" }]);

  const [datosTransportista, setDatosTransportista] = useState({
    tipoDocumento: "6", // 6 = RUC por defecto
    numeroDocumento: "",
    denominacion: "",
    registroMtc: "",
  });

  const [productos, setProductos] = useState<PedidoDet[]>(detalles.map(item => ({
    ...item,
    productoUnidad: item.productoUnidad || 'KGM'
  })));

  const showToast = (title: string, description: string, variant: "default" | "destructive" = "default") => {
    toast({
      title,
      description,
      variant,
    });
  };

  const validarCampos = () => {
    if (!datosTraslado.pesoBruto) {
      showToast("Error", "El peso bruto total es obligatorio", "destructive");
      return false;
    }

    if (datosGuia.tipoTransporte === '01') {
      if (!datosTransportista.numeroDocumento) {
        showToast("Error", "El número de documento del transportista es obligatorio", "destructive");
        return false;
      }
      if (!datosTransportista.denominacion) {
        showToast("Error", "La razón social/nombre del transportista es obligatoria", "destructive");
        return false;
      }
    }

    if (!vehiculos[0].placa || vehiculos[0].placa.length !== 6) {
      showToast("Error", "La placa del vehículo debe tener 6 caracteres", "destructive");
      return false;
    }

    for (const [index, conductor] of conductores.entries()) {
      if (!conductor.numeroDocumento) {
        showToast("Error", `El número de documento del conductor ${index + 1} es obligatorio`, "destructive");
        return false;
      }
      if (!conductor.nombre) {
        showToast("Error", `El nombre del conductor ${index + 1} es obligatorio`, "destructive");
        return false;
      }
      if (!conductor.apellidos) {
        showToast("Error", `Los apellidos del conductor ${index + 1} son obligatorios`, "destructive");
        return false;
      }
      if (!conductor.licencia || conductor.licencia.length < 9 || conductor.licencia.length > 10) {
        showToast("Error", `La licencia del conductor ${index + 1} debe tener entre 9 y 10 caracteres`, "destructive");
        return false;
      }
    }

    if (!puntosUbicacion.llegada.direccion) {
      showToast("Error", "La dirección de llegada es obligatoria", "destructive");
      return false;
    }

    if (!datosGuia.observaciones) {
      showToast("Error", "Las observaciones son obligatorias", "destructive");
      return false;
    }

    return true;
  };

  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    const newVehiculos = [...vehiculos];
    newVehiculos[index].placa = value;
    setVehiculos(newVehiculos);
  };

  const handleLicenciaChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    const newConductores = [...conductores];
    newConductores[index].licencia = value;
    setConductores(newConductores);
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (pedido) {
      setDatosGuia(prev => ({
        ...prev,
        cliente: pedido.nombreCliente || "",
        clienteTipoDoc: "6",
        clienteNumDoc: pedido.codigoCliente || "",
        clienteDenominacion: pedido.nombreCliente || "",
        clienteDireccion: pedido.direccionCliente || "",
      }));
    }
  }, [pedido]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tiposResponse, guiaResponse] = await Promise.all([
          apiClient.get('/tomarPedido/motivosTrasGuia'),
          apiClient.get('/tomarPedido/tipoDocsGuia'),
        ]);

        setReasonTrasGuide(tiposResponse.data.data.data);

        if (tiposResponse.data.data.data && tiposResponse.data.data.data.length > 0) {
          setDatosGuia(prev => ({
            ...prev,
            motivoTraslado: tiposResponse.data.data.data[0].codigo.toString(),
          }));
        }

        if (guiaResponse.data.data.data && guiaResponse.data.data.data.length > 0) {
          setSerie(guiaResponse.data.data.data.find(item => item.idTipoGuia === 1).prefijoSerie);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los tipos de comprobante",
          variant: "destructive"
        })
      }
    };

    fetchData();
  }, []);

  const eliminarConductor = (index: number) => {
    if (conductores.length > 1) { // No eliminar el último conductor
      setConductores(conductores.filter((_, i) => i !== index));
    }
  };

  // Función para enviar la guía
  const emitirGuia = async () => {
    setLoading(true);

    if (!validarCampos()) {
      setLoading(false);
      return;
    }

    try {
      if (!datosTransportista.numeroDocumento || !vehiculos[0].placa ||
        !conductores[0].numeroDocumento || !puntosUbicacion.partida.direccion) {
        toast({
          title: "Error",
          description: "Complete los campos obligatorios",
          variant: "destructive",
        });
        return;
      }

      const guiaCabData = {
        p_nroPedido: pedido?.idPedidocab || null,
        p_operacion: "generar",
        p_tipo_comprobante: "7",
        p_serie: serie,
        p_numero: "",
        p_cliente_tipo_doc: datosGuia.clienteTipoDoc,
        p_cliente_num_doc: datosGuia.clienteNumDoc,
        p_cliente_denominacion: datosGuia.clienteDenominacion,
        p_cliente_direccion: datosGuia.clienteDireccion,
        p_cliente_email: datosGuia.clienteEmail,
        p_fecha_emision: datosGuia.fechaEmision,
        p_observaciones: datosGuia.observaciones,
        p_motivo_traslado: datosGuia.motivoTraslado,
        p_peso_bruto_total: datosTraslado.pesoBruto,
        p_peso_bruto_unidad_medida: datosTraslado.pesoUnidad,
        p_numero_bultos: datosTraslado.numeroBultos,
        p_tipo_transporte: datosGuia.tipoTransporte,
        p_fecha_inicio_traslado: datosTraslado.fechaInicio,
        p_transportista_doc_tipo: datosTransportista.tipoDocumento,
        p_transportista_doc_numero: datosTransportista.numeroDocumento,
        p_transportista_denominacion: datosTransportista.denominacion,
        p_transportista_placa_numero: vehiculos[0].placa,
        p_conductor_doc_tipo: conductores[0].tipoDocumento,
        p_conductor_doc_numero: conductores[0].numeroDocumento,
        p_conductor_nombre: conductores[0].nombre,
        p_conductor_apellidos: conductores[0].apellidos,
        p_conductor_num_licencia: conductores[0].licencia,
        p_punto_partida_ubigeo: puntosUbicacion.partida.ubigeo,
        p_punto_partida_direccion: puntosUbicacion.partida.direccion,
        p_punto_partida_cod_estab_sunat: puntosUbicacion.partida.codigoSunat,
        p_punto_llegada_ubigeo: puntosUbicacion.llegada.ubigeo,
        p_punto_llegada_direccion: puntosUbicacion.llegada.direccion,
        p_punto_llegada_cod_estab_sunat: puntosUbicacion.llegada.codigoSunat,
        p_formato_de_pdf: datosGuia.formatoPdf,
        detalles: productos.map(producto => ({
          p_unidad_de_medida: producto.productoUnidad || "KGM",
          p_codigo: producto.codigoitemPedido,
          p_descripcion: producto.productoNombre || "Producto sin descripción",
          p_cantidad: producto.cantPedido,
        }))
      };

      await apiClient.post("/pedidos/generateGuia", guiaCabData);
      toast({
        title: "Éxito",
        description: "Guía de remisión generada correctamente",
      });
      onOpenChange(false);
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
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl mb-4 shadow-lg">
          <FileText className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
          Guía de Remisión Electrónica
        </h1>
        <p className="text-gray-600">Complete los datos requeridos para generar la guía</p>
      </div>

      {/* Sección principal en 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda */}
        <div className="space-y-6">
          {/* Información de la guía */}
          <Card className="shadow-sm">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Información de la Guía
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Serie</Label>
                  <Input
                    disabled
                    value={serie}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de emisión</Label>
                  <Input
                    type="date"
                    value={datosGuia.fechaEmision}
                    onChange={(e) => setDatosGuia({...datosGuia, fechaEmision: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Motivo de traslado</Label>
                <Select
                  value={datosGuia.motivoTraslado}
                  onValueChange={(value) => setDatosGuia({...datosGuia, motivoTraslado: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {reasonTrasGuide.map((trans) => (
                      <SelectItem
                        key={trans.codigo}
                        value={trans.codigo}
                      >
                        {trans.motivo_descr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de transporte</Label>
                <Select
                  value={datosGuia.tipoTransporte}
                  onValueChange={(value) => {
                    setDatosGuia({...datosGuia, tipoTransporte: value})
                    if (value === '02') {
                      setDatosTransportista({
                        tipoDocumento: "6",
                        numeroDocumento: "",
                        denominacion: "",
                        registroMtc: "",
                      })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="01">01 - Transporte público</SelectItem>
                    <SelectItem value="02">02 - Transporte privado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Datos del cliente */}
          <Card className="shadow-sm">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                Datos del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Input
                  disabled
                  value={datosGuia.cliente}
                  onChange={(e) => setDatosGuia({...datosGuia, cliente: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de documento</Label>
                  <Select
                    disabled
                    value={datosGuia.clienteTipoDoc}
                    onValueChange={(value) => setDatosGuia({...datosGuia, clienteTipoDoc: value})}
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
                  <Input
                    disabled
                    value={datosGuia.clienteNumDoc}
                    onChange={(e) => setDatosGuia({...datosGuia, clienteNumDoc: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input
                  disabled
                  value={datosGuia.clienteDireccion}
                  onChange={(e) => setDatosGuia({...datosGuia, clienteDireccion: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Correo electrónico</Label>
                <Input
                  type="email"
                  value={datosGuia.clienteEmail}
                  onChange={(e) => setDatosGuia({...datosGuia, clienteEmail: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Puntos de partida y llegada */}
          <Card className="shadow-sm">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
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
                      disabled
                      value={puntosUbicacion.partida.ubigeo}
                      onChange={(e) => setPuntosUbicacion({
                        ...puntosUbicacion,
                        partida: {...puntosUbicacion.partida, ubigeo: e.target.value}
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input
                    disabled
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
          {/* Datos del traslado */}
          <Card className="shadow-sm">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
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
                      {/*<SelectItem value="TNE">TNE - Tonelada</SelectItem>*/}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Número de bultos</Label>
                <Input
                  type="number"
                  value={datosTraslado.numeroBultos}
                  onChange={(e) => setDatosTraslado({...datosTraslado, numeroBultos: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Datos del transportista */}
          <Card className="shadow-sm">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                Datos del Transportista
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de documento</Label>
                  <Select
                    disabled={datosGuia.tipoTransporte === '02'}
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
                  <div className="flex gap-2">
                    <Input
                      disabled={datosGuia.tipoTransporte === '02'}
                      value={datosTransportista.numeroDocumento}
                      onChange={(e) => setDatosTransportista({...datosTransportista, numeroDocumento: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Razón social / Nombre</Label>
                <Input
                  disabled={datosGuia.tipoTransporte === '02'}
                  value={datosTransportista.denominacion}
                  onChange={(e) => setDatosTransportista({...datosTransportista, denominacion: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Registro MTC (opcional)</Label>
                <Input
                  disabled={datosGuia.tipoTransporte === '02'}
                  value={datosTransportista.registroMtc}
                  onChange={(e) => setDatosTransportista({...datosTransportista, registroMtc: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="text-lg font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  Vehículos
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Vehículo principal (Placa)</Label>
                <Input
                  value={vehiculos[0].placa}
                  onChange={(e) => handlePlacaChange(e, 0)}
                  placeholder="ABC123"
                  maxLength={6}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="text-lg font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                  Conductores
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {conductores.map((conductor, index) => (
                <div key={index} className="space-y-4 border-b pb-4 last:border-b-0 last:pb-0">
                  {index > 0 && (
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Conductor {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarConductor(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de documento</Label>
                      <Select
                        value={conductor.tipoDocumento}
                        onValueChange={(value) => {
                          const newConductores = [...conductores];
                          newConductores[index].tipoDocumento = value;
                          setConductores(newConductores);
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
                      <Input
                        value={conductor.numeroDocumento}
                        onChange={(e) => {
                          const newConductores = [...conductores];
                          newConductores[index].numeroDocumento = e.target.value;
                          setConductores(newConductores);
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombres</Label>
                      <Input
                        value={conductor.nombre}
                        onChange={(e) => {
                          const newConductores = [...conductores];
                          newConductores[index].nombre = e.target.value;
                          setConductores(newConductores);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Apellidos</Label>
                      <Input
                        value={conductor.apellidos}
                        onChange={(e) => {
                          const newConductores = [...conductores];
                          newConductores[index].apellidos = e.target.value;
                          setConductores(newConductores);
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Número de licencia</Label>
                    <Input
                      value={conductores[0].licencia}
                      onChange={(e) => handleLicenciaChange(e, 0)}
                      placeholder="123456789"
                      minLength={9}
                      maxLength={10}
                    />
                  </div>
                </div>
              ))}

            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-blue-50 border-b">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Productos
          </CardTitle>
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
                        {/*<SelectItem value="NIU">NIU - Unidad</SelectItem>*/}
                        <SelectItem value="KGM">KGM - Kilogramo</SelectItem>
                        {/*<SelectItem value="LTR">LTR - Litro</SelectItem>*/}
                        {/*<SelectItem value="MTR">MTR - Metro</SelectItem>*/}
                        {/*<SelectItem value="TNE">TNE - Tonelada</SelectItem>*/}
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

      {/* Observaciones */}
      <Card className="shadow-sm">
        <CardHeader className="bg-blue-50 border-b">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Observaciones <span className='text-red-500'>*</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Textarea
            value={datosGuia.observaciones}
            onChange={(e) => setDatosGuia({...datosGuia, observaciones: e.target.value})}
            placeholder="Ingrese observaciones adicionales..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex justify-end gap-4 py-6">
        <Button
          onClick={emitirGuia}
          disabled={loading}
        >
          {loading ? "Generando..." : "Emitir Guía de Remisión"}
        </Button>
      </div>
    </div>
  );
};