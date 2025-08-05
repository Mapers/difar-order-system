import {useState} from "react";
import {ChevronDown, ChevronUp, Plus, Search, Truck, UserPlus} from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible";
import {Textarea} from "@/components/ui/textarea";

interface Conductor {
  tipoDocumento: string
  numeroDocumento: string
  nombre: string
  apellidos: string
  licencia: string
}

interface Vehiculo {
  placa: string
}

export function GuiaTransportista() {
  const [datosGuia, setDatosGuia] = useState({
    cliente: "Buscar cliente",
    tipoDocumento: "GUÍA DE REMISIÓN TRANSPORTISTA ELECTRÓNICA",
    serie: "VVV1",
    numero: "1",
    fechaEmision: { dia: "1", mes: "ago", año: "2025" },
    formatoPdf: "POR DEFECTO",
  })

  const [datosDestinatario, setDatosDestinatario] = useState({
    tipoDocumento: "Elegir",
    numeroDocumento: "",
    nombre: "",
  })

  const [datosTransportista, setDatosTransportista] = useState({
    registroMtc: "",
  })

  const [vehiculoPrincipal, setVehiculoPrincipal] = useState({
    placa: "",
    tuc: "",
  })

  const [vehiculosSecundarios, setVehiculosSecundarios] = useState<Vehiculo[]>([])

  const [conductores, setConductores] = useState<Conductor[]>([])

  const [conductorPrincipal, setConductorPrincipal] = useState({
    tipoDocumento: "Elegir",
    numeroDocumento: "",
    nombre: "",
    apellidos: "",
    licencia: "",
  })

  const [puntosUbicacion, setPuntosUbicacion] = useState({
    partida: {
      ubicacion: "",
      direccion: "",
      codigoSunat: "0000",
    },
    llegada: {
      ubicacion: "Buscar Ubigeo",
      direccion: "",
      codigoSunat: "Por defecto '0000'",
    },
  })

  const [datosTraslado, setDatosTraslado] = useState({
    fechaInicio: { dia: "1", mes: "ago", año: "2025" },
    pesoBruto: "",
    pesoUnidad: "KGM - KILOGRAMO",
    indicadorSunat: "Tipo de indicador",
  })

  const [observaciones, setObservaciones] = useState("")

  const [sectionsOpen, setSectionsOpen] = useState({
    destinatario: true,
    transportista: true,
    conductor: true,
    partida: true,
    llegada: true,
    traslado: true,
    observaciones: true,
  })

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const agregarVehiculoSecundario = () => {
    setVehiculosSecundarios([...vehiculosSecundarios, { placa: "", tuc: "" }])
  }

  const agregarConductor = () => {
    setConductores([
      ...conductores,
      {
        tipoDocumento: "Elegir",
        numeroDocumento: "",
        nombre: "",
        apellidos: "",
        licencia: "",
      },
    ])
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl mb-4 shadow-lg">
          <Truck className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
          Emitir Guía de Transportista
        </h1>
        <p className="text-gray-600 text-lg">Complete los datos para generar su guía de transportista</p>
      </div>

      {/* Formulario Principal */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
          <CardTitle className="text-xl font-semibold flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Truck className="h-4 w-4" />
            </div>
            Información Principal
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="space-y-3">
              <Label htmlFor="cliente" className="text-sm font-semibold text-gray-700">
                Cliente
              </Label>
              <div className="flex">
                <Input
                  id="cliente"
                  value={datosGuia.cliente}
                  onChange={(e) => setDatosGuia({ ...datosGuia, cliente: e.target.value })}
                  className="rounded-r-none border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-l-none border-l-0 bg-gray-50 hover:bg-gray-100 border-gray-300"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="link" className="text-orange-600 p-0 h-auto text-sm hover:text-orange-700">
                + Nuevo cliente
              </Button>
            </div>

            <div className="space-y-3">
              <Label htmlFor="tipoDocumento" className="text-sm font-semibold text-gray-700">
                Tipo documento
              </Label>
              <Select
                value={datosGuia.tipoDocumento}
                onValueChange={(value) => setDatosGuia({ ...datosGuia, tipoDocumento: value })}
              >
                <SelectTrigger className="border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GUÍA DE REMISIÓN TRANSPORTISTA ELECTRÓNICA">
                    GUÍA DE REMISIÓN TRANSPORTISTA ELECTRÓNICA
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="serie" className="text-sm font-semibold text-gray-700">
                Serie
              </Label>
              <Select value={datosGuia.serie} onValueChange={(value) => setDatosGuia({ ...datosGuia, serie: value })}>
                <SelectTrigger className="border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VVV1">VVV1</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="numero" className="text-sm font-semibold text-gray-700">
                Número (Referencial)
              </Label>
              <Input
                id="numero"
                value={datosGuia.numero}
                onChange={(e) => setDatosGuia({ ...datosGuia, numero: e.target.value })}
                className="bg-gray-50 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">Fecha emisión</Label>
              <div className="flex gap-2">
                <Select
                  value={datosGuia.fechaEmision.dia}
                  onValueChange={(value) =>
                    setDatosGuia({ ...datosGuia, fechaEmision: { ...datosGuia.fechaEmision, dia: value } })
                  }
                >
                  <SelectTrigger className="w-16 border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={datosGuia.fechaEmision.mes}
                  onValueChange={(value) =>
                    setDatosGuia({ ...datosGuia, fechaEmision: { ...datosGuia.fechaEmision, mes: value } })
                  }
                >
                  <SelectTrigger className="w-20 border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ene">ene</SelectItem>
                    <SelectItem value="feb">feb</SelectItem>
                    <SelectItem value="mar">mar</SelectItem>
                    <SelectItem value="abr">abr</SelectItem>
                    <SelectItem value="may">may</SelectItem>
                    <SelectItem value="jun">jun</SelectItem>
                    <SelectItem value="jul">jul</SelectItem>
                    <SelectItem value="ago">ago</SelectItem>
                    <SelectItem value="sep">sep</SelectItem>
                    <SelectItem value="oct">oct</SelectItem>
                    <SelectItem value="nov">nov</SelectItem>
                    <SelectItem value="dic">dic</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={datosGuia.fechaEmision.año}
                  onValueChange={(value) =>
                    setDatosGuia({ ...datosGuia, fechaEmision: { ...datosGuia.fechaEmision, año: value } })
                  }
                >
                  <SelectTrigger className="w-20 border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="formatoPdf" className="text-sm font-semibold text-gray-700">
                Formato de PDF
              </Label>
              <Select
                value={datosGuia.formatoPdf}
                onValueChange={(value) => setDatosGuia({ ...datosGuia, formatoPdf: value })}
              >
                <SelectTrigger className="border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POR DEFECTO">POR DEFECTO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botón para agregar línea o ítem */}
          <div className="border-t border-gray-200 pt-8">
            <Button
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Agregar línea o ítem
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resto de secciones con estilos similares pero con colores orange/red para diferenciación */}
      {/* Por brevedad, mantendré el patrón pero con los colores de tema naranja/rojo */}
      {/* Datos del Destinatario */}
      <Collapsible open={sectionsOpen.destinatario} onOpenChange={() => toggleSection("destinatario")}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer">
              <CardTitle className="flex items-center justify-between text-blue-600">
                DATOS DEL DESTINATARIO
                {sectionsOpen.destinatario ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de documento del destinatario</Label>
                  <Select
                    value={datosDestinatario.tipoDocumento}
                    onValueChange={(value) => setDatosDestinatario({ ...datosDestinatario, tipoDocumento: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Elegir">Elegir</SelectItem>
                      <SelectItem value="RUC">RUC</SelectItem>
                      <SelectItem value="DNI">DNI</SelectItem>
                      <SelectItem value="CE">CE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Documento número</Label>
                  <div className="flex">
                    <Input
                      value={datosDestinatario.numeroDocumento}
                      onChange={(e) => setDatosDestinatario({ ...datosDestinatario, numeroDocumento: e.target.value })}
                      className="rounded-r-none"
                    />
                    <Button variant="outline" size="icon" className="rounded-l-none border-l-0 bg-transparent">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Cliente/Proveedor</div>
                </div>

                <div className="space-y-2">
                  <Label>Nombre del destinatario</Label>
                  <Input
                    value={datosDestinatario.nombre}
                    onChange={(e) => setDatosDestinatario({ ...datosDestinatario, nombre: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Datos del Transportista */}
      <Collapsible open={sectionsOpen.transportista} onOpenChange={() => toggleSection("transportista")}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer">
              <CardTitle className="flex items-center justify-between text-blue-600">
                DATOS DEL TRANSPORTISTA
                {sectionsOpen.transportista ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-6">
              <div className="space-y-2">
                <Label>Número de registro MTC (condicional)</Label>
                <Input
                  value={datosTransportista.registroMtc}
                  onChange={(e) => setDatosTransportista({ ...datosTransportista, registroMtc: e.target.value })}
                  className="w-64"
                />
              </div>

              {/* Vehículo Principal */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-4">Datos del Vehículo Principal</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Transportista placa número</Label>
                    <Input
                      value={vehiculoPrincipal.placa}
                      onChange={(e) => setVehiculoPrincipal({ ...vehiculoPrincipal, placa: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>TUC Vehículo Principal (condicional)</Label>
                    <div className="flex">
                      <Input
                        value={vehiculoPrincipal.tuc}
                        onChange={(e) => setVehiculoPrincipal({ ...vehiculoPrincipal, tuc: e.target.value })}
                        className="rounded-r-none"
                      />
                      <Button variant="outline" size="icon" className="rounded-l-none border-l-0 bg-blue-100">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehículos Secundarios */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Datos del Vehículo Secundario (Máximo 2 Vehículos)</h4>
                  <Button onClick={agregarVehiculoSecundario} variant="outline" size="sm">
                    Agregar
                  </Button>
                </div>

                {vehiculosSecundarios.map((vehiculo, index) => (
                  <div key={index} className="mb-4 p-4 bg-gray-50 rounded">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Placa número</Label>
                        <Input
                          value={vehiculo.placa}
                          onChange={(e) => {
                            const newVehiculos = [...vehiculosSecundarios]
                            newVehiculos[index].placa = e.target.value
                            setVehiculosSecundarios(newVehiculos)
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>TUC Vehículo (condicional)</Label>
                        <Input
                          value={vehiculo.tuc || ""}
                          onChange={(e) => {
                            const newVehiculos = [...vehiculosSecundarios]
                            newVehiculos[index].tuc = e.target.value
                            setVehiculosSecundarios(newVehiculos)
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Datos del Conductor */}
      <Collapsible open={sectionsOpen.conductor} onOpenChange={() => toggleSection("conductor")}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer">
              <CardTitle className="flex items-center justify-between text-blue-600">
                DATOS DEL CONDUCTOR
                {sectionsOpen.conductor ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-6">
              {/* Conductor Principal */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-4">Datos del Conductor Principal</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de documento</Label>
                    <Select
                      value={conductorPrincipal.tipoDocumento}
                      onValueChange={(value) => setConductorPrincipal({ ...conductorPrincipal, tipoDocumento: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Elegir">Elegir</SelectItem>
                        <SelectItem value="DNI">DNI</SelectItem>
                        <SelectItem value="CE">CE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Documento número</Label>
                    <div className="flex">
                      <Input
                        value={conductorPrincipal.numeroDocumento}
                        onChange={(e) =>
                          setConductorPrincipal({ ...conductorPrincipal, numeroDocumento: e.target.value })
                        }
                        className="rounded-r-none"
                      />
                      <Button variant="outline" size="icon" className="rounded-l-none border-l-0 bg-transparent">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Cliente/Proveedor</div>
                  </div>

                  <div className="space-y-2">
                    <Label>Nombre del conductor</Label>
                    <Input
                      value={conductorPrincipal.nombre}
                      onChange={(e) => setConductorPrincipal({ ...conductorPrincipal, nombre: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Apellidos del conductor</Label>
                    <Input
                      value={conductorPrincipal.apellidos}
                      onChange={(e) => setConductorPrincipal({ ...conductorPrincipal, apellidos: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Licencia de conducir</Label>
                    <Input
                      value={conductorPrincipal.licencia}
                      onChange={(e) => setConductorPrincipal({ ...conductorPrincipal, licencia: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Conductores Secundarios */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Datos del Conductor Secundario (Máximo 2 Conductores)</h4>
                  <Button onClick={agregarConductor} variant="outline" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>

                {conductores.map((conductor, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 bg-gray-50 rounded">
                    <div className="space-y-2">
                      <Label>Tipo de documento</Label>
                      <Select
                        value={conductor.tipoDocumento}
                        onValueChange={(value) => {
                          const newConductores = [...conductores]
                          newConductores[index].tipoDocumento = value
                          setConductores(newConductores)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Elegir">Elegir</SelectItem>
                          <SelectItem value="DNI">DNI</SelectItem>
                          <SelectItem value="CE">CE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Documento número</Label>
                      <Input
                        value={conductor.numeroDocumento}
                        onChange={(e) => {
                          const newConductores = [...conductores]
                          newConductores[index].numeroDocumento = e.target.value
                          setConductores(newConductores)
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Nombre</Label>
                      <Input
                        value={conductor.nombre}
                        onChange={(e) => {
                          const newConductores = [...conductores]
                          newConductores[index].nombre = e.target.value
                          setConductores(newConductores)
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Apellidos</Label>
                      <Input
                        value={conductor.apellidos}
                        onChange={(e) => {
                          const newConductores = [...conductores]
                          newConductores[index].apellidos = e.target.value
                          setConductores(newConductores)
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Licencia</Label>
                      <Input
                        value={conductor.licencia}
                        onChange={(e) => {
                          const newConductores = [...conductores]
                          newConductores[index].licencia = e.target.value
                          setConductores(newConductores)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Punto de Partida */}
      <Collapsible open={sectionsOpen.partida} onOpenChange={() => toggleSection("partida")}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer">
              <CardTitle className="flex items-center justify-between text-blue-600">
                PUNTO DE PARTIDA
                {sectionsOpen.partida ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ubiceoPartida">UBIGEO dirección de partida</Label>
                  <div className="flex">
                    <Input
                      id="ubiceoPartida"
                      value={puntosUbicacion.partida.ubicacion}
                      onChange={(e) =>
                        setPuntosUbicacion({
                          ...puntosUbicacion,
                          partida: { ...puntosUbicacion.partida, ubicacion: e.target.value },
                        })
                      }
                      className="rounded-r-none"
                    />
                    <Button variant="outline" size="icon" className="rounded-l-none border-l-0 bg-transparent">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccionPartida">Dirección del punto de partida</Label>
                  <Input
                    id="direccionPartida"
                    value={puntosUbicacion.partida.direccion}
                    onChange={(e) =>
                      setPuntosUbicacion({
                        ...puntosUbicacion,
                        partida: { ...puntosUbicacion.partida, direccion: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigoPartida">Código establecimiento Sunat</Label>
                  <Input
                    id="codigoPartida"
                    value={puntosUbicacion.partida.codigoSunat}
                    onChange={(e) =>
                      setPuntosUbicacion({
                        ...puntosUbicacion,
                        partida: { ...puntosUbicacion.partida, codigoSunat: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Punto de Llegada */}
      <Collapsible open={sectionsOpen.llegada} onOpenChange={() => toggleSection("llegada")}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer">
              <CardTitle className="flex items-center justify-between text-blue-600">
                PUNTO DE LLEGADA
                {sectionsOpen.llegada ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ubiceoLlegada">UBIGEO dirección de llegada</Label>
                  <div className="flex">
                    <Input
                      id="ubiceoLlegada"
                      value={puntosUbicacion.llegada.ubicacion}
                      onChange={(e) =>
                        setPuntosUbicacion({
                          ...puntosUbicacion,
                          llegada: { ...puntosUbicacion.llegada, ubicacion: e.target.value },
                        })
                      }
                      className="rounded-r-none"
                    />
                    <Button variant="outline" size="icon" className="rounded-l-none border-l-0 bg-transparent">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccionLlegada">Dirección del punto de llegada</Label>
                  <Input
                    id="direccionLlegada"
                    value={puntosUbicacion.llegada.direccion}
                    onChange={(e) =>
                      setPuntosUbicacion({
                        ...puntosUbicacion,
                        llegada: { ...puntosUbicacion.llegada, direccion: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigoLlegada">Código establecimiento Sunat</Label>
                  <Input
                    id="codigoLlegada"
                    value={puntosUbicacion.llegada.codigoSunat}
                    onChange={(e) =>
                      setPuntosUbicacion({
                        ...puntosUbicacion,
                        llegada: { ...puntosUbicacion.llegada, codigoSunat: e.target.value },
                      })
                    }
                    placeholder="Por defecto '0000'"
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Datos del Traslado */}
      <Collapsible open={sectionsOpen.traslado} onOpenChange={() => toggleSection("traslado")}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer">
              <CardTitle className="flex items-center justify-between text-blue-600">
                DATOS DEL TRASLADO
                {sectionsOpen.traslado ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de inicio de traslado</Label>
                  <div className="flex gap-2">
                    <Select
                      value={datosTraslado.fechaInicio.dia}
                      onValueChange={(value) =>
                        setDatosTraslado({
                          ...datosTraslado,
                          fechaInicio: { ...datosTraslado.fechaInicio, dia: value },
                        })
                      }
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 31 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>
                            {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={datosTraslado.fechaInicio.mes}
                      onValueChange={(value) =>
                        setDatosTraslado({
                          ...datosTraslado,
                          fechaInicio: { ...datosTraslado.fechaInicio, mes: value },
                        })
                      }
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ago">ago</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={datosTraslado.fechaInicio.año}
                      onValueChange={(value) =>
                        setDatosTraslado({
                          ...datosTraslado,
                          fechaInicio: { ...datosTraslado.fechaInicio, año: value },
                        })
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2025">2025</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pesoBruto">Peso bruto total</Label>
                  <Input
                    id="pesoBruto"
                    value={datosTraslado.pesoBruto}
                    onChange={(e) => setDatosTraslado({ ...datosTraslado, pesoBruto: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pesoUnidad">Peso - unidad de medida</Label>
                  <Select
                    value={datosTraslado.pesoUnidad}
                    onValueChange={(value) => setDatosTraslado({ ...datosTraslado, pesoUnidad: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KGM - KILOGRAMO">KGM - KILOGRAMO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="indicadorSunat">Indicador de envío SUNAT</Label>
                  <Select
                    value={datosTraslado.indicadorSunat}
                    onValueChange={(value) => setDatosTraslado({ ...datosTraslado, indicadorSunat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tipo de indicador">Tipo de indicador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Observaciones */}
      <Collapsible open={sectionsOpen.observaciones} onOpenChange={() => toggleSection("observaciones")}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer">
              <CardTitle className="flex items-center justify-between text-blue-600">
                OBSERVACIONES
                {sectionsOpen.observaciones ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={4}
                  className="w-full"
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Botones de Acción */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 py-8">
        <Button
          variant="outline"
          size="lg"
          className="px-8 py-3 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 font-semibold transition-all duration-200 bg-transparent"
        >
          Cancelar
        </Button>
        <Button
          size="lg"
          className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Emitir Guía de Transportista
        </Button>
      </div>
    </div>
  )
}
