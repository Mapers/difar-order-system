'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, UserPlus, Eye, Edit, Trash, Download, Plus, Filter, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import debounce from 'lodash.debounce';
import ModalCreateEditions from "@/components/modal/modalCreateEditions"
import { Label } from "@radix-ui/react-label"
import { fetchGetClients } from "@/app/api/clients"
import { format, parseISO } from "date-fns"
import { useAuth } from '@/context/authContext';
import { IClient } from "@/interface/clients/client-interface"

export default function ClientsPage() {
  const { user, isAuthenticated } = useAuth();
  const [clients, setClients] = useState<IClient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Estado base de formData
  const [formData, setFormData] = useState<any>({
    codigoInterno: "",
    nombreComercial: "",
    categoria: "",
    razonSocial: "",
    ruc: "",
    tipoDocIdent: "",
    telefono: "",
    direccion: "",
    estadoContribuyenteSunat: "",
    fechaEvaluacion: "",
    itemLista: "",
    representanteLegal: "",
    correoElectronico: "",
    provincia: 0,
    idZona: "",
    idDistrito: 0,
    tipoCliente: "",
    fechaInicio: "",
    numRegistro: "",
    codigoVendedor: "",
    documentos: {
      autorizacionSanitaria: { detalle: "", observaciones: "" },
      situacionFuncionamiento: { detalle: "", observaciones: "" },
      numeroRegistro: { detalle: "", observaciones: "" },
      certificaciones: { detalle: "", observaciones: "" },
    },
    aprobadoDirTecnica: null,
    aprobadoGerente: null,
    observacionesGlobal: "",
  });

  // 🔵 Catálogos simulados
  const categorias = [
    { value: "cat1", label: "Categoría 1" },
    { value: "cat2", label: "Categoría 2" },
  ];
  const tiposDocumento = [
    { value: "dni", label: "DNI" },
    { value: "ruc", label: "RUC" },
  ];
  const estadosContribuyente = [
    { value: "activo", label: "Activo" },
    { value: "suspendido", label: "Suspendido" },
  ];
  const provincias = [
    { id: 1, nombre: "Lima" },
    { id: 2, nombre: "Ayacucho" },
  ];
  const zonas = [
    { id: "Z1", nombre: "Zona 1" },
    { id: "Z2", nombre: "Zona 2" },
  ];
  const tiposCliente = [
    { value: "mayorista", label: "Mayorista" },
    { value: "minorista", label: "Minorista" },
  ];

  // 🧠 Función de guardado
  const handleSave = async () => {
    try {
      console.log("Guardando datos:", formData);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error al guardar:", error);
    }
  };

  // ✅ Lista las condiciones con mejor manejo de errores
  const getClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const codVendedor = user?.codigo;
      if (!codVendedor) {
        setError("Código de vendedor no disponible");
        console.error("Código de vendedor no disponible");
        return;
      }
      const response = await fetchGetClients(codVendedor);
      setClients(response.data?.data?.data || response.data?.data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setError("Error al cargar los clientes");
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal de creación
  const handleCreate = () => {
    setShowCreateModal(true);
  };

  useEffect(() => {
    if (isAuthenticated && user?.codigo) {
      getClients();
    }
  }, [isAuthenticated, user?.codigo])

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Clientes</h1>
        <p className="text-gray-500">Sistema de evaluación y gestión de clientes DIFAR</p>
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">
              Evaluación de Clientes
            </CardTitle>
            <p className="text-sm sm:text-base text-gray-600">
              Sistema de evaluación y gestión de clientes DIFAR
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Button variant="outline" className="w-full sm:w-auto bg-transparent">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Evaluación
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* ✅ Mostrar errores */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-lg text-blue-600 flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros de Búsqueda
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="sm:hidden w-full"
                >
                  {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                </Button>
              </div>
            </CardHeader>

            <CardContent className={`space-y-4 ${showFilters ? "block" : "hidden sm:block"}`}>
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-medium">
                  Buscar por código, cliente o provincia
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="search"
                    placeholder="Ej: 10067929611, AMADO LOARTE BENITA, Condorcanqui..."
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between mt-3">
              <p className="text-sm text-gray-600">
                {clients.length} cliente{clients.length !== 1 ? "s" : ""} encontrado{clients.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="hidden lg:block">
              <Card className="bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="hidden md:table-cell">Documento</TableHead>
                        <TableHead className="hidden md:table-cell">Evaluación</TableHead>
                        <TableHead className="hidden md:table-cell">Ubicación</TableHead>
                        <TableHead className="hidden md:table-cell">Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading || !isAuthenticated ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[150px]" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[120px]" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[80px]" /></TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Skeleton className="h-8 w-8 rounded-md" />
                                <Skeleton className="h-8 w-8 rounded-md" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : clients.length > 0 ? (
                        clients.map((client: IClient, index: number) => (
                          <TableRow key={client.codigo + index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <TableCell className="font-bold text-blue-600">{client.codigo}</TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-900">{client.cliente_nombre}</div>
                              <div className="text-xs text-gray-500">{client.cliente_comercial}</div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="text-sm text-gray-900">{client.documento_numero}</div>
                              <div className="text-xs text-gray-500">{client.documento_abrev}</div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="text-sm text-gray-900">{client.categoria}</div>
                              <div className="text-xs text-gray-500">
                                {client.fecha_evaluacion ? format(parseISO(client.fecha_evaluacion), "dd/MM/yyyy") : "Sin evaluar"}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="text-sm text-gray-900">{client.provincia || "Sin provincia"}</div>
                              <div className="text-xs text-gray-500">Zona: {client.zona}</div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge
                                variant={client.estado === "PENDIENTE" ? "secondary" : "default"}
                                className={client.estado === "PENDIENTE" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}
                              >
                                {client.estado}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="mr-1 h-4 w-4" />
                                  Ver
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Edit className="mr-1 h-4 w-4" />
                                  Evaluar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            {error ? 'Error al cargar los clientes' : 'No se encontraron clientes'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          </div>
        </CardContent>

        <ModalCreateEditions
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          isCreate={true}
          formData={formData}
          setFormData={setFormData}
          handleSave={handleSave}
          isSubmitting={false}
          categorias={categorias}
          tiposDocumento={tiposDocumento}
          estadosContribuyente={estadosContribuyente}
          provincias={provincias}
          zonas={zonas}
          tiposCliente={tiposCliente}
        />
      </Card>
    </div>
  )
}