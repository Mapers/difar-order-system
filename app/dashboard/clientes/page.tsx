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
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import apiClient from "@/app/api/client";
import ModalCreateEditions from "@/components/modal/modalCreateEditions"
import { Label } from "@radix-ui/react-label"
import { fetchGetClients } from "@/app/api/clients"
import { format, parseISO } from "date-fns"

interface IClient {
  Codigo: string
  Nombre: string
  NombreComercial: string
  RUC: string
  Dirección: string
  TipoCliente: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<any>([])
  // const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Estados para modales

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  // Estados para escalas
  const [showScalesModal, setShowScalesModal] = useState(false)
  // const [currentScales, setCurrentScales] = useState<ICurrentScales | null>(null)
  const [search, setSearch] = useState({
    client: "",
    product: "",
  })
  const [loading, setLoading] = useState({
    clients: false,
    conditions: true,
    products: false
  })
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



  // 🔵 Catálogos simulados (puedes obtenerlos de un fetch en `useEffect`)
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
      // Aquí podrías llamar a tu API para guardar
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error al guardar:", error);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch((prev) => ({ ...prev, client: value }));
    if (value === '') {
      // setSelectedClient(null);
    }
  }

  // lista clientes  con funcion debouse 
  const debouncedFetchClients = debounce(async () => {
    if (search.client.length >= 4) {
      setLoading(prev => ({ ...prev, clients: true }));
      try {
        const response = await fetchGetClients(search.client);
        if (response.data?.data?.data.length === 0) {
          setClients([]);
        } else {
          setClients(response.data?.data?.data || []);
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
      } finally {
        setLoading(prev => ({ ...prev, clients: false }));
      }
    } else {
      setClients([]);
    }
  }, 500);


  // const fetchClients = async (query = "", page = 1) => {
  //   try {
  //     setLoading(true)
  //     const url = query
  //       ? `/clientes/search?query=${encodeURIComponent(query)}&page=${page}`
  //       : `/clientes?page=${page}`

  //     const response = await apiClient(url)
  //     if (response.status !== 200) throw new Error("Error al obtener clientes")

  //     const data = await response.data
  //     setClients(data.data.data || data)
  //     setTotalPages(data.data.pagination.totalPages || 1)
  //   } catch (error) {
  //     console.error("Error fetching clients:", error)
  //   } finally {
  //     setLoading(false)
  //   }
  // }


  // Abrir modal de creación
  const handleCreate = () => {
    setShowCreateModal(true)
    // setFormData({
    //   ...clienteVacio,
    //   codigoInterno: `CLI${String(clientes.length + 1).padStart(3, "0")}`,
    //   numRegistro: `REG${String(clientes.length + 1).padStart(3, "0")}`,
    //   fechaInicio: new Date().toISOString().split("T")[0],
    //   fechaEvaluacion: new Date().toISOString().split("T")[0],
    // })
    // setShowCreateModal(true)
  }

  useEffect(() => {
    debouncedFetchClients();
    return () => debouncedFetchClients.cancel();
  }, [search.client]);

  // useEffect(() => {
  //   fetchClients(searchQuery, currentPage)
  // }, [searchQuery, currentPage])

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Clientes</h1>
        <p className="text-gray-500">Sistema de evaluación y gestión de clientes DIFAR</p>
      </div>
      <Card className="shadow-md">
        <CardHeader className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Título y descripción */}
          <div className="space-y-1.5">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">
              Evaluación de Clientes
            </CardTitle>
            <p className="text-sm sm:text-base text-gray-600">
              Sistema de evaluación y gestión de clientes DIFAR
            </p>
          </div>

          {/* Buscador y botones */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            {/* Botón exportar */}
            <Button variant="outline" className="w-full sm:w-auto bg-transparent">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>

            {/* Botón nueva evaluación */}
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Evaluación
            </Button>
          </div>
        </CardHeader>

        <CardContent>
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
                  // onClick={() => setShowFilters(!showFilters)}
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
                  Buscar por código, razón social, RUC o nombre comercial
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Ej: CLI001, ALVAREZ MANTILLA, 10266256596..."
                    // value={searchTerm}
                    // onChange={(e) => setSearchTerm(e.target.value)}
                    value={search.client}
                    onChange={handleSearchChange}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>


          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {/* {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? "s" : ""} encontrado
                {clientesFiltrados.length !== 1 ? "s" : ""} */}
                3 clientes encontrados
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
                      {loading.clients ? (
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
                        clients.map((client: any, index: number) => (
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
                                {client.fecha_evaluacion ? format(parseISO(client.fecha_evaluacion), "dd/MM/yyyy") : "-"}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="text-sm text-gray-900">{client.provincia || "-"}</div>
                              <div className="text-xs text-gray-500">Zona {client.zona}</div>
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
                                <Button variant="outline" size="sm"
                                // onClick={() => handleView(client)}
                                >
                                  <Eye className="mr-1 h-4 w-4" />
                                  Ver
                                </Button>
                                <Button variant="outline" size="sm"
                                // onClick={() => handleEdit(client)}
                                >
                                  <Edit className="mr-1 h-4 w-4" />
                                  Editar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            No se encontraron clientes
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  {/* <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="hidden md:table-cell">Documento</TableHead>
                        <TableHead className="hidden md:table-cell">Evaluación</TableHead>
                        <TableHead className="hidden md:table-cell">Educación</TableHead>
                        <TableHead className="hidden md:table-cell">Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        // Skeleton loading
                        Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Skeleton className="h-4 w-[150px]" />
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Skeleton className="h-4 w-[120px]" />
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Skeleton className="h-4 w-[100px]" />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Skeleton className="h-8 w-8 rounded-md" />
                                <Skeleton className="h-8 w-8 rounded-md" />
                                <Skeleton className="h-8 w-8 rounded-md" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : clients.length > 0 ? (
                        clients.map((client:any, index:any) => (
                          <TableRow key={client.Codigo + index} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{client.Codigo}</TableCell>
                            <TableCell className="font-medium">{client.Nombre}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              {client.NombreComercial || "-"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {client.RUC || "-"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {client.TipoCliente ? <Badge
                                variant={client.TipoCliente === "Activo" ? "default" : "secondary"}
                                className={
                                  client.TipoCliente === "Activo"
                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                    : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                }
                              >
                                {client.TipoCliente}
                              </Badge> : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  disabled
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">Ver</span>
                                </Button>
                                <Button
                                  disabled
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Editar</span>
                                </Button>
                                <Button
                                  disabled
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash className="h-4 w-4" />
                                  <span className="sr-only">Eliminar</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            No se encontraron clientes
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table> */}

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