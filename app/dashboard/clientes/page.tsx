'use client'

import {useEffect, useMemo, useState} from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Eye, Edit, Download, Plus, Filter, ChevronDown, FileText, Phone, Mail, Building, CheckCircle, User, MapPin, ChevronLeft, ChevronRight, CreditCard, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { useAuth } from '@/context/authContext';
import { IClient } from "@/interface/clients/client-interface"
import { mapClientFromApi } from "@/mappers/clients"
import { formatSafeDate } from "@/utils/date"
import { ClientService } from "@/app/services/client/ClientService"
import { ClientMethodsService } from "./services/clientMethodsService"
import ModalCreateEditions from "@/components/modal/modalCreateEvaluation"
import ModalClientEdit from "@/components/modal/modalClientEdit"
import ModalClientView from "@/components/modal/modalClientView"
import { SkeletonCardClient, SkeletonClientRow } from "@/components/skeleton/ClientSkeleton"

export default function ClientsPage() {
  const { user, isAuthenticated, globalConfigs } = useAuth();
  const [clients, setClients] = useState<IClient[]>([])
  const [filteredClients, setFilteredClients] = useState<IClient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [codClient, setCodClient] = useState<any>('')

  const handleEdit = (codClient: string) => {
    setCodClient(codClient)
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setCodClient('')
    setShowViewModal(false)
    setShowEditModal(false)
  }

  const handleView = (codClient: string) => {
    setCodClient(codClient)
    setShowViewModal(true)
  }

  const closeViewModal = () => {
    setCodClient('')
    setShowViewModal(false)
  }

  const vistaTablaClientes = useMemo(() => {
    const config = globalConfigs.find(c => c.cod_config === 'VISTA_TABLA_CLIENTES');
    return config ? config.llave_config : '1';
  }, [globalConfigs]);

  const getAllClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const codVendedor = user?.codigo;

      const response = await ClientService.getAllClientsByCodVendedor(user?.idRol === 1 ? codVendedor : '', vistaTablaClientes);
      const rawClients = response?.data || [];

      const mappedClients: IClient[] = rawClients.map(mapClientFromApi)

      setClients(mappedClients);
      setFilteredClients(mappedClients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setError("Error al cargar los clientes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewEvaluation = () => {
    setShowCreateModal(true);
  };

  useEffect(() => {
    if (!searchTerm) {
      setFilteredClients(clients);
      return;
    }
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = clients.filter(client =>
        client.codigoInterno?.toLowerCase().includes(lowerSearch) ||
        client.razonSocial?.toLowerCase().includes(lowerSearch) ||
        client.provincia?.toLowerCase().includes(lowerSearch)
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredClients.slice(startIndex, endIndex);
  }

  useEffect(() => {
    const total = Math.ceil(filteredClients.length / itemsPerPage);
    setTotalPages(total || 1);

    if (currentPage > total && total > 0) {
      setCurrentPage(total);
    }
  }, [filteredClients, itemsPerPage, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (isAuthenticated && user) {
      getAllClients();
    }
  }, [isAuthenticated, user])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  }

  const paginatedData = getPaginatedData();

  return (
      <div className="grid gap-6 w-full min-w-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Clientes</h1>
          <p className="text-gray-500">Sistema de evaluación y gestión de clientes DIFAR</p>
        </div>

        <Card className="shadow-md min-w-0">
          <CardHeader className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between gap-4 border-b bg-gray-50">
            <div className="space-y-1.5">
              <CardTitle className="text-xl font-semibold text-teal-700">
                Evaluación de Clientes
              </CardTitle>
              <CardDescription>
                Sistema de evaluación y gestión de clientes DIFAR
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
              <Button onClick={handleCreateNewEvaluation} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Evaluación
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 w-full">
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
            )}

            <Card className="bg-white shadow-sm mb-6">
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
                        id="search"
                        type="search"
                        placeholder="Ej: 10067929611, AMADO LOARTE BENITA, Condorcanqui..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-gray-600">
                  Mostrando {paginatedData.length} de {filteredClients.length} cliente{filteredClients.length !== 1 ? "s" : ""}
                  <span className="hidden sm:inline"> (Página {currentPage} de {totalPages})</span>
                </p>
              </div>

              {/* VISTA MOBILE (CARDS) */}
              <div className="block lg:hidden space-y-4">
                {loading || !isAuthenticated ? (
                    Array.from({ length: 5 }).map((_, index) => (
                        <SkeletonCardClient key={index} />
                    ))
                ) : paginatedData.length > 0 ? (
                    paginatedData.map((cliente: any) => {
                      const estadoAprobacion = ClientMethodsService.getEstadoAprobacion(cliente.estado);
                      const IconoEstado = estadoAprobacion.icon;

                      return (
                          <Card key={cliente.codigoInterno} className="border border-gray-200 hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="space-y-4">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                      <h3 className="font-bold text-blue-600 text-sm break-all">{cliente.codigoInterno}</h3>
                                      {vistaTablaClientes === '1' ? (
                                          <Badge className={`${estadoAprobacion.color} text-xs shrink-0`}>
                                            <IconoEstado className="w-3 h-3 mr-1" />
                                            {estadoAprobacion.estado}
                                          </Badge>
                                      ) : (
                                          <Badge variant="outline" className="bg-gray-50 text-xs shrink-0">
                                            {cliente.situacion || 'Activo'}
                                          </Badge>
                                      )}
                                    </div>
                                    <p className="font-medium text-gray-900 text-sm break-words line-clamp-2">
                                      {cliente.razonSocial}
                                    </p>
                                    <p className="text-xs text-gray-500 break-words line-clamp-1 mt-1">
                                      {cliente.nombreComercial}
                                    </p>
                                  </div>
                                </div>

                                {vistaTablaClientes === '1' ? (
                                    // --- CARD VISTA 1 (Resumida) ---
                                    <>
                                      <div className="bg-blue-50 rounded-lg p-3">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-3 w-3 text-blue-600 shrink-0" />
                                          <span className="text-xs break-words">
                                          <span className="font-medium">Doc:</span> {cliente.numeroDocumento}
                                        </span>
                                        </div>
                                      </div>
                                      <div className="bg-green-50 rounded-lg p-3">
                                        <div className="flex items-center gap-2">
                                          <Building className="h-3 w-3 text-green-600 shrink-0" />
                                          <span className="text-xs break-words">
                                          <span className="font-medium">Categoría:</span> {ClientMethodsService.getCategoriaLabel(cliente.categoria)}
                                        </span>
                                        </div>
                                      </div>
                                      <div className="bg-purple-50 rounded-lg p-3">
                                        <div className="flex items-start gap-2">
                                          <MapPin className="h-3 w-3 text-purple-600 mt-0.5 shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs break-words">
                                              {cliente.provincia} - Zona: {cliente.zona}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                          <Label className="text-xs text-gray-500">Fecha Evaluación</Label>
                                          <p className="font-medium break-words">{formatSafeDate(cliente.fechaEvaluacion)}</p>
                                        </div>
                                      </div>
                                    </>
                                ) : (
                                    // --- CARD VISTA 2 (Detallada) ---
                                    <div className="space-y-2">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-blue-50 rounded-md p-2 flex items-center gap-2">
                                          <FileText className="h-3 w-3 text-blue-600 shrink-0" />
                                          <span className="text-xs break-words">{cliente.numeroDocumento || '-'}</span>
                                        </div>
                                        <div className="bg-green-50 rounded-md p-2 flex items-center gap-2">
                                          <CreditCard className="h-3 w-3 text-green-600 shrink-0" />
                                          <span className="text-xs font-medium break-words text-green-700">
                                          S/ {cliente.lineaCredito ? Number(cliente.lineaCredito).toFixed(2) : '0.00'}
                                        </span>
                                        </div>
                                      </div>

                                      <div className="bg-gray-50 rounded-md p-2 space-y-2">
                                        <div className="flex items-start gap-2">
                                          <Phone className="h-3 w-3 text-gray-500 mt-0.5 shrink-0" />
                                          <span className="text-xs text-gray-700 break-words">{cliente.telefono || 'Sin teléfono'}</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <Mail className="h-3 w-3 text-gray-500 mt-0.5 shrink-0" />
                                          <span className="text-xs text-gray-700 break-words">{cliente.correoElectronico || 'Sin correo'}</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <MapPin className="h-3 w-3 text-gray-500 mt-0.5 shrink-0" />
                                          <span className="text-xs text-gray-700 break-words">{cliente.direccion || 'Sin dirección'}</span>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="border rounded-md p-2">
                                          <span className="block text-gray-500 mb-1">Estado SUNAT</span>
                                          <span className="font-medium">{cliente.estadoSunat || '-'}</span>
                                        </div>
                                        <div className="border rounded-md p-2">
                                          <span className="block text-gray-500 mb-1">Relación</span>
                                          <span className="font-medium">{cliente.relacion || '-'}</span>
                                        </div>
                                      </div>
                                    </div>
                                )}

                                <div className="flex gap-2 mt-4">
                                  <Button variant="outline" size="sm" className="flex-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100" onClick={() => handleView(cliente.codigoInterno)}>
                                    <Eye className="mr-1 h-3 w-3" /> Ver
                                  </Button>
                                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleEdit(cliente.codigoInterno)}>
                                    <Edit className="mr-1 h-3 w-3" /> Editar
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                      );
                    })
                ) : (
                    <div className="text-center py-12 border rounded-lg bg-gray-50">
                      <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay clientes</h3>
                      <p className="text-gray-500 mb-4 px-4 text-sm">
                        {searchTerm ? "No se encontraron clientes que coincidan con tu búsqueda." : "Aún no hay clientes en el sistema."}
                      </p>
                      <Button onClick={handleCreateNewEvaluation}>
                        <Plus className="mr-2 h-4 w-4" /> Agregar Primer Cliente
                      </Button>
                    </div>
                )}
              </div>

              {/* VISTA DESKTOP (TABLA RESPONSIVA) */}
              <div className="hidden lg:block w-full max-w-full rounded-lg border bg-white shadow-sm overflow-hidden">

                {/* CLAVE 4: El contenedor exacto donde vive el scroll horizontal */}
                <div className="w-full overflow-x-auto relative scrollbar-thin scrollbar-thumb-gray-300">
                  <Table className="w-full min-w-max">
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold whitespace-nowrap px-4">Código</TableHead>
                        <TableHead className="font-semibold whitespace-nowrap px-4">Cliente / Razón Social</TableHead>
                        <TableHead className="font-semibold whitespace-nowrap px-4">Documento</TableHead>

                        {vistaTablaClientes === '1' ? (
                            <>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Evaluación</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Ubicación</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Estado</TableHead>
                            </>
                        ) : (
                            <>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Nombre Comercial</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Dirección</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Referencia</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Teléfono</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Correo</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Provincia (ID)</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Distrito (ID)</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Zona</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Fecha Inicio</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Relación</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Cta. Contable</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Cód. Vendedor</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Línea Crédito</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Tipo Cliente</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Situación</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Nro. Registro</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Resultado</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Estado SUNAT</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Rep. Legal</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Aut. Sanitaria</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Sit. Funcionamiento</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Certificaciones</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Categoría</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Item Lista</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Otros</TableHead>
                              <TableHead className="font-semibold whitespace-nowrap px-4">Fecha Registro</TableHead>
                            </>
                        )}
                        <TableHead className="font-semibold text-right whitespace-nowrap sticky right-0 bg-gray-50 z-10 px-4 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading || !isAuthenticated ? (
                          Array.from({ length: 5 }).map((_, index) => <SkeletonClientRow key={index} />)
                      ) : paginatedData.length > 0 ? (
                          paginatedData.map((client: any, index: number) => {
                            const estadoAprobacion = ClientMethodsService.getEstadoAprobacion(client.estado);
                            const IconoEstado = estadoAprobacion.icon;

                            return (
                                <TableRow key={client.codigoInterno + index} className="border-b hover:bg-gray-50 transition-colors">
                                  <TableCell className="font-bold text-blue-600 font-mono text-sm whitespace-nowrap px-4">
                                    {client.codigoInterno}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap px-4">
                                    <div className="text-sm font-medium text-gray-900">{client.razonSocial || '-'}</div>
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap px-4">
                                    <div className="text-sm text-gray-900">{client.numeroDocumento || '-'}</div>
                                    <div className="text-xs text-gray-500">{client.tipoDocumento}</div>
                                  </TableCell>

                                  {vistaTablaClientes === '1' ? (
                                      <>
                                        <TableCell className="whitespace-nowrap px-4">
                                          <div className="text-sm text-gray-900">{ClientMethodsService.getCategoriaLabel(client.categoria)}</div>
                                          <div className="text-xs text-gray-500">{formatSafeDate(client.fechaEvaluacion)}</div>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap px-4">
                                          <div className="text-sm text-gray-900">{client.provincia || "Sin provincia"}</div>
                                          <div className="text-xs text-gray-500">Zona: {client.zona}</div>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap px-4">
                                          <Badge className={estadoAprobacion.color}>
                                            <IconoEstado className="w-3 h-3 mr-1" />
                                            {estadoAprobacion.estado}
                                          </Badge>
                                        </TableCell>
                                      </>
                                  ) : (
                                      <>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{client.nombreComercial || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{client.direccion || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{client.referenciaDireccion || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{client.telefono || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{client.correoElectronico || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{client.provinciaId || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{client.idDistrito || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{client.idZona || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{formatSafeDate(client.fechaInicio) || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{client.relacion || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{client.ctaContab || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{client.codigoVendedor || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm font-medium text-green-600 px-4">
                                          S/ {client.lineaCredito ? Number(client.lineaCredito).toFixed(2) : '0.00'}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{client.tipoCliente || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{client.situacion || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{client.nroRegistro || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{client.resultado || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{client.estadoSunat || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{client.nomRepLegal || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{client.nroResAutSani || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{client.situacionFuncionamiento || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{client.certificaciones || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{client.categoria || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{client.itemLista || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{client.otros || '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm px-4">{formatSafeDate(client.fechaRegistros) || '-'}</TableCell>
                                      </>
                                  )}

                                  <TableCell className="text-right whitespace-nowrap sticky right-0 bg-white z-10 px-4 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] group-hover:bg-gray-50 transition-colors border-l border-gray-100">
                                    <div className="flex justify-end gap-2">
                                      <Button variant="outline" size="sm" onClick={() => handleView(client.codigoInterno)} className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs">
                                        <Eye className="mr-1 h-3 w-3" /> Ver
                                      </Button>
                                      <Button variant="outline" size="sm" onClick={() => handleEdit(client.codigoInterno)} className="text-xs">
                                        <Edit className="mr-1 h-3 w-3" /> Editar
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                            );
                          })
                      ) : (
                          <TableRow>
                            <TableCell colSpan={vistaTablaClientes === '1' ? 7 : 30} className="text-center py-8 text-gray-500">
                              {error ? 'Error al cargar los clientes' : 'No se encontraron clientes'}
                            </TableCell>
                          </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* PAGINACIÓN */}
              {filteredClients.length > 0 && (
                  <div className="border-t bg-gray-50 px-4 py-3 mt-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex flex-col xs:flex-row xs:items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="itemsPerPage" className="text-sm text-gray-700 whitespace-nowrap">
                            Mostrar:
                          </Label>
                          <select
                              id="itemsPerPage"
                              value={itemsPerPage}
                              onChange={handleItemsPerPageChange}
                              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-20"
                          >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                        </div>
                        <div className="text-sm text-gray-700 whitespace-nowrap">
                          Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                          <Button
                              variant="outline"
                              size="sm"
                              onClick={goToPrevPage}
                              disabled={currentPage === 1}
                              className="flex items-center gap-1 flex-1 sm:flex-none justify-center"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="hidden xs:inline">Anterior</span>
                          </Button>

                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(totalPages <= 5 ? totalPages : 3, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 2) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 1) {
                                pageNum = totalPages - (totalPages <= 5 ? totalPages : 3) + i + 1;
                              } else {
                                pageNum = currentPage - 1 + i;
                              }

                              return (
                                  <Button
                                      key={pageNum}
                                      variant={currentPage === pageNum ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => goToPage(pageNum)}
                                      className="w-8 h-8 p-0 text-xs sm:text-sm"
                                  >
                                    {pageNum}
                                  </Button>
                              );
                            })}

                            {totalPages > 5 && currentPage < totalPages - 2 && (
                                <span className="px-2 text-sm text-gray-500">...</span>
                            )}

                            {totalPages > 5 && currentPage < totalPages - 1 && (
                                <Button
                                    variant={currentPage === totalPages ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => goToPage(totalPages)}
                                    className="w-8 h-8 p-0 text-xs sm:text-sm"
                                >
                                  {totalPages}
                                </Button>
                            )}
                          </div>

                          <Button
                              variant="outline"
                              size="sm"
                              onClick={goToNextPage}
                              disabled={currentPage === totalPages}
                              className="flex items-center gap-1 flex-1 sm:flex-none justify-center"
                          >
                            <span className="hidden xs:inline">Siguiente</span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>

                        {totalPages > 5 && (
                            <div className="flex items-center gap-2 sm:hidden w-full justify-center">
                              <Label htmlFor="pageSelect" className="text-sm text-gray-700 whitespace-nowrap">
                                Ir a:
                              </Label>
                              <select
                                  id="pageSelect"
                                  value={currentPage}
                                  onChange={(e) => goToPage(Number(e.target.value))}
                                  className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                      {i + 1}
                                    </option>
                                ))}
                              </select>
                            </div>
                        )}
                      </div>
                    </div>
                  </div>
              )}
            </div>
          </CardContent>

          <ModalCreateEditions
              open={showCreateModal}
              onOpenChange={setShowCreateModal}
          />

          <ModalClientView
              open={showViewModal}
              onOpenChange={(open) => { if (!open) closeViewModal(); }}
              codClient={codClient}
          />

          <ModalClientEdit
              open={showEditModal}
              onOpenChange={(open) => { if (!open) closeEditModal(); }}
              codClient={codClient}
          />
        </Card>
      </div>
  )
}