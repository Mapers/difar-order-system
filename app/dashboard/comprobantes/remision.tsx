import {useState} from "react";
import {ChevronDown, ChevronUp, FileText, Plus, Search, Trash2, Truck, UserPlus} from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible";
import {Textarea} from "@/components/ui/textarea";

interface ProductoItem {
  codigo: string
  descripcion: string
  cantidad: string
  unidadMedida: string
}

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

export const Remision = () => {
  const [datosTraslado, setDatosTraslado] = useState({
    fechaInicio: {dia: "1", mes: "ago", año: "2025"},
    pesoBruto: "",
    pesoUnidad: "KGM - KILOGRAMO",
    numeroBultos: "",
    indicadorSunat: "Tipo de indicador",
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

  const [datosGuia, setDatosGuia] = useState({
    cliente: "Buscar cliente",
    tipoDocumento: "GUÍA DE REMISIÓN REMITENTE ELECTRÓNICA",
    serie: "TTT1",
    numero: "2",
    fechaEmision: {dia: "1", mes: "ago", año: "2025"},
    formatoPdf: "POR DEFECTO",
    tipoTransporte: "Elegir",
    motivoTraslado: "01 - VENTA",
  })

  const [conductores, setConductores] = useState<Conductor[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([{placa: ""}])
  const [vehiculosSecundarios, setVehiculosSecundarios] = useState<Vehiculo[]>([])

  const [datosTransportista, setDatosTransportista] = useState({
    tipoDocumento: "Elegir",
    numeroDocumento: "",
    denominacion: "",
    registroMtc: "",
  })

  const [productos, setProductos] = useState<ProductoItem[]>([])
  const [observaciones, setObservaciones] = useState("")

  const [sectionsOpen, setSectionsOpen] = useState({
    traslado: true,
    observaciones: true,
    llegada: true,
    conductor: true,
    partida: true,
    transportista: true,
  })

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({...prev, [section]: !prev[section]}))
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

  const agregarVehiculoSecundario = () => {
    setVehiculosSecundarios([...vehiculosSecundarios, {placa: ""}])
  }

  const agregarProducto = () => {
    setProductos([
      ...productos,
      {
        codigo: "Buscar",
        descripcion: "",
        cantidad: "",
        unidadMedida: "Elegir",
      },
    ])
  }

  const eliminarProducto = (index: number) => {
    setProductos(productos.filter((_, i) => i !== index))
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center py-8">
        <div
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl mb-4 shadow-lg">
          <FileText className="h-8 w-8 text-white"/>
        </div>
        <h1
          className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
          Emitir Guía de Remisión
        </h1>
        <p className="text-gray-600 text-lg">Complete los datos para generar su guía electrónica</p>
      </div>

      {/* Formulario Principal */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="text-xl font-semibold flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4"/>
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
                  className="rounded-r-none border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-l-none border-l-0 bg-gray-50 hover:bg-gray-100 border-gray-300"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="link" className="text-blue-600 p-0 h-auto text-sm hover:text-blue-700">
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
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GUÍA DE REMISIÓN REMITENTE ELECTRÓNICA">
                    GUÍA DE REMISIÓN REMITENTE ELECTRÓNICA
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="serie" className="text-sm font-semibold text-gray-700">
                Serie
              </Label>
              <Select value={datosGuia.serie} onValueChange={(value) => setDatosGuia({ ...datosGuia, serie: value })}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TTT1">TTT1</SelectItem>
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
                className="bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">Fecha emisión</Label>
              <div className="flex gap-2">
                <Select
                  value={datosGuia.fechaEmision.dia}
                  onValueChange={(value) =>
                    setDatosGuia({ ...datosGuia, fechaEmision: { ...datosGuia.fechaEmision, dia: value } })
                  }
                >
                  <SelectTrigger className="w-16 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
                  <SelectTrigger className="w-20 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
                  <SelectTrigger className="w-20 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POR DEFECTO">POR DEFECTO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="tipoTransporte" className="text-sm font-semibold text-gray-700">
                Tipo de transporte
              </Label>
              <Select
                value={datosGuia.tipoTransporte}
                onValueChange={(value) => setDatosGuia({ ...datosGuia, tipoTransporte: value })}
              >
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Elegir">Elegir</SelectItem>
                  <SelectItem value="01 - TRANSPORTE PÚBLICO">01 - TRANSPORTE PÚBLICO</SelectItem>
                  <SelectItem value="02 - TRANSPORTE PRIVADO">02 - TRANSPORTE PRIVADO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="motivoTraslado" className="text-sm font-semibold text-gray-700">
                Motivo de traslado
              </Label>
              <Select
                value={datosGuia.motivoTraslado}
                onValueChange={(value) => setDatosGuia({ ...datosGuia, motivoTraslado: value })}
              >
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="01 - VENTA">01 - VENTA</SelectItem>
                  <SelectItem value="14 - VENTA SUJETA A CONFIRMACION DEL COMPRADOR">
                    14 - VENTA SUJETA A CONFIRMACION DEL COMPRADOR
                  </SelectItem>
                  <SelectItem value="02 - COMPRA">02 - COMPRA</SelectItem>
                  <SelectItem value="04 - TRASLADO ENTRE ESTABLECIMIENTOS DE LA MISMA EMPRESA">
                    04 - TRASLADO ENTRE ESTABLECIMIENTOS DE LA MISMA EMPRESA
                  </SelectItem>
                  <SelectItem value="18 - TRASLADO EMISOR ITINERANTE CP">18 - TRASLADO EMISOR ITINERANTE CP</SelectItem>
                  <SelectItem value="08 - IMPORTACION">08 - IMPORTACION</SelectItem>
                  <SelectItem value="09 - EXPORTACION">09 - EXPORTACION</SelectItem>
                  <SelectItem value="13 - OTROS">13 - OTROS</SelectItem>
                  <SelectItem value="05 - CONSIGNACION">05 - CONSIGNACION</SelectItem>
                  <SelectItem value="17 - TRASLADO DE BIENES PARA TRANSFORMACION">
                    17 - TRASLADO DE BIENES PARA TRANSFORMACION
                  </SelectItem>
                  <SelectItem value="03 - VENTA CON ENTREGA A TERCEROS">03 - VENTA CON ENTREGA A TERCEROS</SelectItem>
                  <SelectItem value="06 - DEVOLUCION">06 - DEVOLUCION</SelectItem>
                  <SelectItem value="07 - RECOJO DE BIENES TRANSFORMADOS">
                    07 - RECOJO DE BIENES TRANSFORMADOS
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabla de Productos */}
          <div className="space-y-6 border-t border-gray-200 pt-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Plus className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Productos / Servicios</h3>
            </div>

            {productos.length > 0 ? (
              <>
                <div className="hidden lg:grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border">
                  <div className="col-span-3">Producto - Servicio (CATÁLOGO)</div>
                  <div className="col-span-3">Detalle adicional</div>
                  <div className="col-span-2">Cantidad</div>
                  <div className="col-span-1">DAM</div>
                  <div className="col-span-2">U.M.</div>
                  <div className="col-span-1">Acción</div>
                </div>

                {productos.map((producto, index) => (
                  <Card key={index} className="shadow-md border-0 bg-white hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                        <div className="lg:col-span-3">
                          <Label className="text-sm font-medium text-gray-700 lg:hidden">Producto</Label>
                          <Select
                            value={producto.codigo}
                            onValueChange={(value) => {
                              const newProductos = [...productos]
                              newProductos[index].codigo = value
                              setProductos(newProductos)
                            }}
                          >
                            <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                              <SelectValue placeholder="Buscar producto..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Buscar">Buscar</SelectItem>
                              <SelectItem value="PROD001">Producto 1</SelectItem>
                              <SelectItem value="PROD002">Producto 2</SelectItem>
                              <SelectItem value="SERV001">Servicio 1</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="lg:col-span-3">
                          <Label className="text-sm font-medium text-gray-700 lg:hidden">Detalle adicional</Label>
                          <Input
                            value={producto.descripcion}
                            onChange={(e) => {
                              const newProductos = [...productos]
                              newProductos[index].descripcion = e.target.value
                              setProductos(newProductos)
                            }}
                            placeholder="Detalle adicional del producto..."
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="lg:col-span-2">
                          <Label className="text-sm font-medium text-gray-700 lg:hidden">Cantidad</Label>
                          <Input
                            type="number"
                            value={producto.cantidad}
                            onChange={(e) => {
                              const newProductos = [...productos]
                              newProductos[index].cantidad = e.target.value
                              setProductos(newProductos)
                            }}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="lg:col-span-1">
                          <Label className="text-sm font-medium text-gray-700 lg:hidden">DAM</Label>
                          <div className="text-center">
                            <span className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200">
                              DAM
                            </span>
                          </div>
                        </div>
                        <div className="lg:col-span-2">
                          <Label className="text-sm font-medium text-gray-700 lg:hidden">U.M.</Label>
                          <Select
                            value={producto.unidadMedida}
                            onValueChange={(value) => {
                              const newProductos = [...productos]
                              newProductos[index].unidadMedida = value
                              setProductos(newProductos)
                            }}
                          >
                            <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                              <SelectValue placeholder="Elegir..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Elegir">Elegir</SelectItem>
                              <SelectItem value="KGM">KGM - Kilogramo</SelectItem>
                              <SelectItem value="UNI">UNI - Unidad</SelectItem>
                              <SelectItem value="LTR">LTR - Litro</SelectItem>
                              <SelectItem value="MTR">MTR - Metro</SelectItem>
                              <SelectItem value="M2">M2 - Metro cuadrado</SelectItem>
                              <SelectItem value="M3">M3 - Metro cúbico</SelectItem>
                              <SelectItem value="TON">TON - Tonelada</SelectItem>
                              <SelectItem value="GRM">GRM - Gramo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="lg:col-span-1 flex justify-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => eliminarProducto(index)}
                            className="h-10 w-10 p-0 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="flex justify-start">
                  <Button
                    onClick={agregarProducto}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Agregar línea o ítem
                  </Button>
                </div>
              </>
            ) : (
              <Card className="border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100">
                <CardContent className="text-center py-12">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto">
                      <Plus className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay productos agregados</h3>
                  <p className="text-gray-600 mb-6">Haz clic en "Agregar línea o ítem" para comenzar</p>
                  <Button
                    onClick={agregarProducto}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Agregar línea o ítem
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resto de las secciones con estilos mejorados */}
      {/* Datos del Traslado */}
      <Collapsible open={sectionsOpen.traslado} onOpenChange={() => toggleSection("traslado")}>
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardTitle className="flex items-center justify-between text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Truck className="h-4 w-4" />
                  </div>
                  DATOS DEL TRASLADO
                </div>
                {sectionsOpen.traslado ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Fecha de inicio de traslado</Label>
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
                      <SelectTrigger className="w-16 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
                      <SelectTrigger className="w-20 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
                      <SelectTrigger className="w-20 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2025">2025</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="pesoBruto" className="text-sm font-semibold text-gray-700">
                    Peso bruto total
                  </Label>
                  <Input
                    id="pesoBruto"
                    value={datosTraslado.pesoBruto}
                    onChange={(e) => setDatosTraslado({ ...datosTraslado, pesoBruto: e.target.value })}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="pesoUnidad" className="text-sm font-semibold text-gray-700">
                    Peso - unidad de medida
                  </Label>
                  <Select
                    value={datosTraslado.pesoUnidad}
                    onValueChange={(value) => setDatosTraslado({ ...datosTraslado, pesoUnidad: value })}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KGM - KILOGRAMO">KGM - KILOGRAMO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="numeroBultos" className="text-sm font-semibold text-gray-700">
                    Número de bultos
                  </Label>
                  <Input
                    id="numeroBultos"
                    value={datosTraslado.numeroBultos}
                    onChange={(e) => setDatosTraslado({ ...datosTraslado, numeroBultos: e.target.value })}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6">
                <Label htmlFor="indicadorSunat" className="text-sm font-semibold text-gray-700">
                  Indicador de envío SUNAT
                </Label>
                <Select
                  value={datosTraslado.indicadorSunat}
                  onValueChange={(value) => setDatosTraslado({ ...datosTraslado, indicadorSunat: value })}
                >
                  <SelectTrigger className="w-full max-w-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tipo de indicador">Tipo de indicador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Datos del Transportista */}
      <Collapsible open={sectionsOpen.transportista} onOpenChange={() => toggleSection("transportista")}>
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardTitle className="flex items-center justify-between text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Truck className="h-4 w-4" />
                  </div>
                  DATOS DEL TRANSPORTISTA
                </div>
                {sectionsOpen.transportista ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Tipo de documento del transportista</Label>
                  <Select
                    value={datosTransportista.tipoDocumento}
                    onValueChange={(value) => setDatosTransportista({ ...datosTransportista, tipoDocumento: value })}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Elegir">Elegir</SelectItem>
                      <SelectItem value="RUC">RUC</SelectItem>
                      <SelectItem value="DNI">DNI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Documento número</Label>
                  <div className="flex">
                    <Input
                      value={datosTransportista.numeroDocumento}
                      onChange={(e) =>
                        setDatosTransportista({ ...datosTransportista, numeroDocumento: e.target.value })
                      }
                      className="rounded-r-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-l-none border-l-0 bg-gray-50 hover:bg-gray-100 border-gray-300"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Cliente/Proveedor</div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Transportista denominación</Label>
                  <Input
                    value={datosTransportista.denominacion}
                    onChange={(e) => setDatosTransportista({ ...datosTransportista, denominacion: e.target.value })}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Número de registro MTC (condicional)</Label>
                  <Input
                    value={datosTransportista.registroMtc}
                    onChange={(e) => setDatosTransportista({ ...datosTransportista, registroMtc: e.target.value })}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Vehículo Principal */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <CardTitle className="text-lg font-semibold text-gray-800">Datos del Vehículo Principal</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Transportista placa número</Label>
                    <Input
                      value={vehiculos[0]?.placa || ""}
                      onChange={(e) => {
                        const newVehiculos = [...vehiculos]
                        newVehiculos[0] = { placa: e.target.value }
                        setVehiculos(newVehiculos)
                      }}
                      className="max-w-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Vehículos Secundarios */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Datos del Vehículo Secundario (Máximo 2 Vehículos)
                    </CardTitle>
                    <Button
                      onClick={agregarVehiculoSecundario}
                      variant="outline"
                      size="sm"
                      className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {vehiculosSecundarios.map((vehiculo, index) => (
                    <Card key={index} className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-gray-700">Placa número</Label>
                          <Input
                            value={vehiculo.placa}
                            onChange={(e) => {
                              const newVehiculos = [...vehiculosSecundarios]
                              newVehiculos[index].placa = e.target.value
                              setVehiculosSecundarios(newVehiculos)
                            }}
                            className="max-w-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Datos del Conductor */}
      <Collapsible open={sectionsOpen.conductor} onOpenChange={() => toggleSection("conductor")}>
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardTitle className="flex items-center justify-between text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  DATOS DEL CONDUCTOR
                </div>
                {sectionsOpen.conductor ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-8 space-y-8">
              {/* Conductor Principal */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <CardTitle className="text-lg font-semibold text-gray-800">Datos del Conductor Principal</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700">Tipo de documento</Label>
                      <Select defaultValue="Elegir">
                        <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Elegir">Elegir</SelectItem>
                          <SelectItem value="DNI">DNI</SelectItem>
                          <SelectItem value="CE">CE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700">Documento número</Label>
                      <div className="flex">
                        <Input className="rounded-r-none border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-l-none border-l-0 bg-gray-50 hover:bg-gray-100 border-gray-300"
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Cliente/Proveedor</div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700">Nombre del conductor</Label>
                      <Input className="border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700">Apellidos del conductor</Label>
                      <Input className="border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700">Licencia de conducir</Label>
                      <Input className="border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conductores Secundarios */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Datos del Conductor Secundario (Máximo 2 Conductores)
                    </CardTitle>
                    <Button
                      onClick={agregarConductor}
                      variant="outline"
                      size="sm"
                      className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {conductores.map((conductor, index) => (
                    <Card key={index} className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                          <div className="space-y-3">
                            <Label className="text-sm font-semibold text-gray-700">Tipo de documento</Label>
                            <Select
                              value={conductor.tipoDocumento}
                              onValueChange={(value) => {
                                const newConductores = [...conductores]
                                newConductores[index].tipoDocumento = value
                                setConductores(newConductores)
                              }}
                            >
                              <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Elegir">Elegir</SelectItem>
                                <SelectItem value="DNI">DNI</SelectItem>
                                <SelectItem value="CE">CE</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-sm font-semibold text-gray-700">Documento número</Label>
                            <Input
                              value={conductor.numeroDocumento}
                              onChange={(e) => {
                                const newConductores = [...conductores]
                                newConductores[index].numeroDocumento = e.target.value
                                setConductores(newConductores)
                              }}
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>

                          <div className="space-y-3">
                            <Label className="text-sm font-semibold text-gray-700">Nombre</Label>
                            <Input
                              value={conductor.nombre}
                              onChange={(e) => {
                                const newConductores = [...conductores]
                                newConductores[index].nombre = e.target.value
                                setConductores(newConductores)
                              }}
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>

                          <div className="space-y-3">
                            <Label className="text-sm font-semibold text-gray-700">Apellidos</Label>
                            <Input
                              value={conductor.apellidos}
                              onChange={(e) => {
                                const newConductores = [...conductores]
                                newConductores[index].apellidos = e.target.value
                                setConductores(newConductores)
                              }}
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>

                          <div className="space-y-3">
                            <Label className="text-sm font-semibold text-gray-700">Licencia</Label>
                            <Input
                              value={conductor.licencia}
                              onChange={(e) => {
                                const newConductores = [...conductores]
                                newConductores[index].licencia = e.target.value
                                setConductores(newConductores)
                              }}
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Punto de Partida */}
      <Collapsible open={sectionsOpen.partida} onOpenChange={() => toggleSection("partida")}>
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardTitle className="flex items-center justify-between text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  PUNTO DE PARTIDA
                </div>
                {sectionsOpen.partida ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="ubiceoPartida" className="text-sm font-semibold text-gray-700">
                    UBIGEO dirección de partida
                  </Label>
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
                      className="rounded-r-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-l-none border-l-0 bg-gray-50 hover:bg-gray-100 border-gray-300"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="direccionPartida" className="text-sm font-semibold text-gray-700">
                    Dirección del punto de partida
                  </Label>
                  <Input
                    id="direccionPartida"
                    value={puntosUbicacion.partida.direccion}
                    onChange={(e) =>
                      setPuntosUbicacion({
                        ...puntosUbicacion,
                        partida: { ...puntosUbicacion.partida, direccion: e.target.value },
                      })
                    }
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="codigoPartida" className="text-sm font-semibold text-gray-700">
                    Código establecimiento Sunat
                  </Label>
                  <Input
                    id="codigoPartida"
                    value={puntosUbicacion.partida.codigoSunat}
                    onChange={(e) =>
                      setPuntosUbicacion({
                        ...puntosUbicacion,
                        partida: { ...puntosUbicacion.partida, codigoSunat: e.target.value },
                      })
                    }
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Punto de Llegada */}
      <Collapsible open={sectionsOpen.llegada} onOpenChange={() => toggleSection("llegada")}>
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardTitle className="flex items-center justify-between text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  PUNTO DE LLEGADA
                </div>
                {sectionsOpen.llegada ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="ubiceoLlegada" className="text-sm font-semibold text-gray-700">
                    UBIGEO dirección de llegada
                  </Label>
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
                      className="rounded-r-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-l-none border-l-0 bg-gray-50 hover:bg-gray-100 border-gray-300"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="direccionLlegada" className="text-sm font-semibold text-gray-700">
                    Dirección del punto de llegada
                  </Label>
                  <Input
                    id="direccionLlegada"
                    value={puntosUbicacion.llegada.direccion}
                    onChange={(e) =>
                      setPuntosUbicacion({
                        ...puntosUbicacion,
                        llegada: { ...puntosUbicacion.llegada, direccion: e.target.value },
                      })
                    }
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="codigoLlegada" className="text-sm font-semibold text-gray-700">
                    Código establecimiento Sunat
                  </Label>
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
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Observaciones */}
      <Collapsible open={sectionsOpen.observaciones} onOpenChange={() => toggleSection("observaciones")}>
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardTitle className="flex items-center justify-between text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-3 border border-white rounded-sm"></div>
                  </div>
                  OBSERVACIONES
                </div>
                {sectionsOpen.observaciones ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-8">
              <div className="space-y-3">
                <Label htmlFor="observaciones" className="text-sm font-semibold text-gray-700">
                  Observaciones
                </Label>
                <Textarea
                  id="observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={4}
                  className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                  placeholder="Ingrese observaciones adicionales..."
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
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Emitir Guía de Remisión
        </Button>
      </div>
    </div>
  )
}