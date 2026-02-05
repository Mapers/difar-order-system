import {useState, useEffect, useRef} from "react";
import {
  AlertCircle,
  FileText,
  Loader2,
  Truck,
  UserPlus,
  Trash2, Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast, useToast } from "@/components/ui/use-toast";
import apiClient from "@/app/api/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {Pedido} from "@/interface/order/order-interface";

interface PedidoDet {
  idPedidodet: number
  idPedidocab: number
  codigoitemPedido: string
  cantPedido: string
  precioPedido: string
  productoNombre?: string
  productoUnidad?: string
  fec_venc_lote?: string
  cod_lote?: string
  laboratorio?: string
}

interface Conductor {
  tipoDocumento: string;
  numeroDocumento: string;
  nombre: string;
  apellidos: string;
  licencia: string;
}

interface UbigeoResult {
  id: string;
  texto_mostrar: string;
}

interface EmpresaTransporte {
  IdEmpTransporte: number;
  nomempTransp: string;
  emptranspRUC: string;
  tipdocempTransp: string;
  nroregMTC: string;
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

interface Guide {
  prefijo: string
  id: number
  tipo_documento: string
}

const UbigeoSearchInput = ({
                             value,
                             onSelect,
                             disabled = false
                           }: {
  value: string,
  onSelect: (codigo: string, texto: string) => void,
  disabled?: boolean
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<UbigeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  useEffect(() => {
    const timeOutId = setTimeout(async () => {
      if (query.length >= 3 && showResults) {
        setLoading(true);
        try {
          const response = await apiClient.get(`/admin/ubigeo/search?q=${query}`);
          if (response.data.success) {
            setResults(response.data.data);
          } else {
            setResults([]);
          }
        } catch (error) {
          console.error("Error buscando ubigeo", error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else if (query.length < 3) {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timeOutId);
  }, [query, showResults]);

  const handleSelect = (item: UbigeoResult) => {
    setQuery(item.id);
    onSelect(item.id, item.texto_mostrar);
    setShowResults(false);
  };

  return (
      <div className="relative w-full" ref={wrapperRef}>
        <div className="relative">
          <Input
              disabled={disabled}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="Buscar Dpto, Prov, Dist..."
              className={results.length > 0 && showResults ? "rounded-b-none" : ""}
          />
          {loading && (
              <div className="absolute right-3 top-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
          )}
        </div>

        {showResults && results.length > 0 && (
            <div className="absolute z-50 w-full bg-white border border-t-0 border-gray-200 rounded-b-md shadow-lg max-h-60 overflow-y-auto">
              {results.map((item) => (
                  <div
                      key={item.id}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-b-0 border-gray-100"
                      onClick={() => handleSelect(item)}
                  >
                    <span className="font-bold text-blue-600 mr-2">{item.id}</span>
                    <span className="text-gray-700">{item.texto_mostrar}</span>
                  </div>
              ))}
            </div>
        )}
      </div>
  );
};

const TransportistaSearchInput = ({
                                    onSelect
                                  }: {
  onSelect: (empresa: EmpresaTransporte) => void
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EmpresaTransporte[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cargarInicial = async () => {
      try {
        const response = await apiClient.get(`/admin/listar/empresas-transporte?q=`);
        if (response.data.success) {
          setResults(response.data.data);
        }
      } catch (error) {
        console.error("Error cargando lista inicial", error);
      }
    };
    cargarInicial();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  useEffect(() => {
    const timeOutId = setTimeout(async () => {
      if ((query.length >= 3 || query === '') && showResults) {
        setLoading(true);
        try {
          const response = await apiClient.get(`/admin/listar/empresas-transporte?q=${query}`);
          if (response.data.success) {
            setResults(response.data.data);
          } else {
            setResults([]);
          }
        } catch (error) {
          console.error("Error buscando empresa", error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      }
      else if (query.length > 0 && query.length < 3) {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timeOutId);
  }, [query, showResults]);

  const handleSelect = (item: EmpresaTransporte) => {
    setQuery(`${item.emptranspRUC} - ${item.nomempTransp}`);
    onSelect(item);
    setShowResults(false);
  };

  return (
      <div className="relative w-full" ref={wrapperRef}>
        <div className="relative">
          <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="Buscar por RUC o Nombre..."
              className={results.length > 0 && showResults ? "rounded-b-none border-blue-500 ring-1 ring-blue-500" : ""}
          />
          <div className="absolute right-3 top-2.5 text-gray-400">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </div>
        </div>

        {showResults && results.length > 0 && (
            <div className="absolute z-50 w-full bg-white border border-t-0 border-gray-200 rounded-b-md shadow-lg max-h-60 overflow-y-auto">
              {results.map((item) => (
                  <div
                      key={item.IdEmpTransporte}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-b-0 border-gray-100 flex flex-col"
                      onClick={() => handleSelect(item)}
                  >
                    <span className="font-bold text-gray-900">{item.nomempTransp}</span>
                    <span className="text-gray-500 text-xs">RUC: {item.emptranspRUC}</span>
                  </div>
              ))}
            </div>
        )}
        {showResults && query.length >= 3 && !loading && results.length === 0 && (
            <div className="absolute z-50 w-full bg-white border border-t-0 border-gray-200 rounded-b-md shadow-lg p-2 text-center text-sm text-gray-500">
              No se encontraron empresas
            </div>
        )}
      </div>
  );
};

export const Remision = ({ pedido, detalles, onOpenChange }: RemisionModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [series, setSeries] = useState<Guide[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [serie, setSerie] = useState('');

  const getFechaLocal = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [datosGuia, setDatosGuia] = useState({
    cliente: pedido?.nombreCliente || "",
    clienteTipoDoc: "6",
    clienteNumDoc: pedido?.codigoCliente || "",
    clienteDenominacion: pedido?.nombreCliente || "",
    clienteDireccion: pedido?.direccionCliente || "",
    clienteEmail: "",
    fechaEmision: getFechaLocal(),
    formatoPdf: "A4",
    tipoTransporte: "02",
    motivoTraslado: "",
    observaciones: "",
  });

  const [datosTraslado, setDatosTraslado] = useState({
    fechaInicio: getFechaLocal(),
    pesoBruto: "",
    pesoUnidad: "KGM",
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
      tipoDocumento: "1",
      numeroDocumento: "",
      nombre: "",
      apellidos: "",
      licencia: "",
    },
  ]);

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([{ placa: "" }]);

  const [datosTransportista, setDatosTransportista] = useState({
    tipoDocumento: "6",
    numeroDocumento: "",
    denominacion: "",
    registroMtc: "",
  });

  const [productos, setProductos] = useState<PedidoDet[]>(detalles.map(item => ({
    ...item,
    productoUnidad: 'KGM', //item.productoUnidad || 'KGM'
  })));

  const setValidationError = (message: string) => {
    setError(message);
    toast({
      title: "Error de validación",
      description: message,
      variant: "destructive",
    });
  };

  const validarCampos = () => {
    try {
      setError(null);

      if (!datosTraslado.pesoBruto) {
        setValidationError("El peso bruto total es obligatorio");
        return false;
      }

      if (datosGuia.tipoTransporte === '01') {
        if (!datosTransportista.numeroDocumento) {
          setValidationError("Debe seleccionar una empresa de transporte");
          return false;
        }
      }

      if (!vehiculos[0].placa || vehiculos[0].placa.length !== 6) {
        setValidationError("La placa del vehículo debe tener 6 caracteres alfanuméricos");
        return false;
      }

      const licenciaRegex = /^([A-Z]\d{8}|\d{9})$/;

      for (const [index, conductor] of conductores.entries()) {
        if (!conductor.numeroDocumento) {
          setValidationError(`El número de documento del conductor ${index + 1} es obligatorio`);
          return false;
        }
        if (!conductor.nombre) {
          setValidationError(`El nombre del conductor ${index + 1} es obligatorio`);
          return false;
        }
        if (!conductor.apellidos) {
          setValidationError(`Los apellidos del conductor ${index + 1} son obligatorios`);
          return false;
        }

        if (!conductor.licencia) {
          setValidationError(`La licencia del conductor ${index + 1} es obligatoria`);
          return false;
        }

        if (!licenciaRegex.test(conductor.licencia)) {
          setValidationError(`La licencia del conductor ${index + 1} es inválida. Debe ser una letra seguida de 8 dígitos (Ej: Q12345678) o 9 dígitos numéricos.`);
          return false;
        }
      }

      if (!puntosUbicacion.llegada.direccion) {
        setValidationError("La dirección de llegada es obligatoria");
        return false;
      }

      if (!datosGuia.observaciones) {
        setValidationError("Las observaciones son obligatorias");
        return false;
      }

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    const newVehiculos = [...vehiculos];
    newVehiculos[index].placa = value;
    setVehiculos(newVehiculos);
  };

  const handleLicenciaChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9);

    const newConductores = [...conductores];
    newConductores[index].licencia = value;
    setConductores(newConductores);
    setError(null);
  };

  const handleTransportistaSelect = (empresa: EmpresaTransporte) => {
    setDatosTransportista({
      tipoDocumento: "6",
      numeroDocumento: empresa.emptranspRUC,
      denominacion: empresa.nomempTransp,
      registroMtc: empresa.nroregMTC || "",
    });
  };

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
          apiClient.get('/admin/listar/guias'),
        ]);

        setReasonTrasGuide(tiposResponse.data.data.data);

        if (tiposResponse.data.data.data && tiposResponse.data.data.data.length > 0) {
          setDatosGuia(prev => ({
            ...prev,
            motivoTraslado: tiposResponse.data.data.data[0].codigo.toString(),
          }));
        }
        if (guiaResponse.data.data && guiaResponse.data.data.length > 0) {
          setSeries(guiaResponse.data.data);
          setSerie(guiaResponse.data.data[0].prefijo.toString());
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
    if (conductores.length > 1) {
      setConductores(conductores.filter((_, i) => i !== index));
    }
  };

  const emitirGuia = async () => {
    setLoading(true);

    if (!validarCampos()) {
      setLoading(false);
      return;
    }

    try {
      const guiaCabData = {
        p_nroPedido: pedido?.nroPedido || null,
        p_operacion: "generar",
        p_tipo_comprobante: "7",
        p_serie: serie,
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
          p_unidad_de_medida: producto.productoUnidad,
          p_codigo: producto.codigoitemPedido,
          p_descripcion: producto.productoNombre || "Producto sin descripción",
          p_cantidad: producto.cantPedido,
          p_laboratorio: producto.laboratorio,
          p_lote: producto.cod_lote,
          p_vencimiento: producto.fec_venc_lote
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
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl mb-4 shadow-lg">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            Guía de Remisión Electrónica
          </h1>
          <p className="text-gray-600">Complete los datos requeridos para generar la guía</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
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
                    <Select
                        value={serie}
                        onChange={(value: string) => setSerie(value)}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-20"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione prefijo" />
                      </SelectTrigger>
                      <SelectContent>
                        {series.map((item) => (
                            <SelectItem key={item.id} value={item.prefijo}>{item.prefijo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      disabled
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="02">02 - Transporte privado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
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
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Punto de Llegada</h3>
                  <div className="space-y-2">
                    <Label>Ubigeo</Label>
                    <div className="flex gap-2">
                      <UbigeoSearchInput
                          value={puntosUbicacion.llegada.ubigeo}
                          onSelect={(codigo, texto) => setPuntosUbicacion({
                            ...puntosUbicacion,
                            llegada: {...puntosUbicacion.llegada, ubigeo: codigo}
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
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
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

            <Card className="shadow-sm">
              <CardHeader className="bg-blue-50 border-b">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  Datos del Transportista
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="font-semibold">Buscar Empresa de Transporte</Label>
                  <TransportistaSearchInput onSelect={handleTransportistaSelect} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de documento</Label>
                    <Select
                        disabled
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
                          disabled
                          value={datosTransportista.numeroDocumento}
                          onChange={(e) => setDatosTransportista({...datosTransportista, numeroDocumento: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Razón social / Nombre</Label>
                  <Input
                      disabled
                      value={datosTransportista.denominacion}
                      onChange={(e) => setDatosTransportista({...datosTransportista, denominacion: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Registro MTC</Label>
                  <Input
                      disabled
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
                            placeholder="Q12345678 o 123456789"
                            maxLength={9}
                        />
                        <p className="text-xs text-muted-foreground">Formato: Letra+8 dígitos (Q12345678) o 9 dígitos.</p>
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
                            <SelectItem value="KGM">KGM - Kilogramo</SelectItem>
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

        {error && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error de Validación</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
        )}

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