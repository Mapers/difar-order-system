'use client'

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Eye, Edit, Download, Plus, Filter, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Label } from "@radix-ui/react-label"
import { useAuth } from '@/context/authContext';
import SkeletonClientRow from "@/components/skeleton/ClientListSkeleton"
import { IClient } from "@/interface/clients/client-interface"
import { mapClientFromApi } from "@/mappers/clients"
import { formatSafeDate } from "@/utils/date"
import { ClientService } from "@/app/services/client/ClientService"
import { ClientMethodsService } from "./services/clientMethodsService"
import ModalCreateEditions from "@/components/modal/modalCreateEvaluation"
import ModalClientEdit from "@/components/modal/modalClientEdit"
import ModalClientView from "@/components/modal/modalClientView"

export default function ClientsPage() {
  const { user, isAuthenticated } = useAuth();
  const [clients, setClients] = useState<IClient[]>([])
  const [filteredClients, setFilteredClients] = useState<IClient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [codClient, setCodClient] = useState<any>('')

  // Abrir modal de edición
  const handleEdit = (codClient: string) => {
    setCodClient(codClient)
    setShowEditModal(true)
  }

  // cierra modal de edición
  const closeEditModal = () => {
    setCodClient('')
    setShowViewModal(false)
    setShowEditModal(false)
  }

  // Abrir modal de visualización
  const handleView = (codClient: string) => {
    setCodClient(codClient)
    setShowViewModal(true)
  }

  // cierra modal de visualización
  const closeViewModal = () => {
    setCodClient('')
    setShowViewModal(false)
  }

  // lista clientes con codigo de vendedor
  const getAllClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const codVendedor = user?.codigo;
      if (!codVendedor) {
        setError("Código de vendedor no disponible");
        return;
      }
      const response = await ClientService.getAllClientsByCodVendedor(codVendedor);
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

  // Abre modal de crear evaluación
  const handleCreateNewEvaluation = () => {
    setShowCreateModal(true);
  };

  // Filtrar clientes cuando cambia searchTerm o clients
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

  useEffect(() => {
    if (isAuthenticated && user?.codigo) {
      getAllClients();
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
            <Button onClick={handleCreateNewEvaluation} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Evaluación
            </Button>
          </div>
        </CardHeader>

        <CardContent>
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
          <div className="space-y-4">
            <div className="flex items-center justify-between mt-3">
              <p className="text-sm text-gray-600">
                {filteredClients.length} cliente{filteredClients.length !== 1 ? "s" : ""} encontrado{filteredClients.length !== 1 ? "s" : ""}
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
                          <SkeletonClientRow key={index} />
                        ))
                      ) : filteredClients.length > 0 ? (
                        filteredClients.map((client: IClient, index: number) => {
                          const estadoAprobacion = ClientMethodsService.getEstadoAprobacion(client.estado);
                          const IconoEstado = estadoAprobacion.icon;

                          return (
                            <TableRow
                              key={client.codigoInterno + index}
                              className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                            >
                              <TableCell className="font-bold text-blue-600">{client.codigoInterno}</TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-900">{client.razonSocial}</div>
                                <div className="text-xs text-gray-500">{client.nombreComercial}</div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="text-sm text-gray-900">{client.numeroDocumento}</div>
                                <div className="text-xs text-gray-500">{client.tipoDocumento}</div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="text-sm text-gray-900">{ClientMethodsService.getCategoriaLabel(client.categoria)}</div>
                                <div className="text-xs text-gray-500">
                                  {formatSafeDate(client.fechaEvaluacion)}
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="text-sm text-gray-900">{client.provincia || "Sin provincia"}</div>
                                <div className="text-xs text-gray-500">Zona: {client.zona}</div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <Badge className={estadoAprobacion.color}>
                                  <IconoEstado className="w-3 h-3 mr-1" />
                                  {estadoAprobacion.estado}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleView(client.codigoInterno)}
                                  >
                                    <Eye className="mr-1 h-4 w-4" />
                                    Ver
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(client.codigoInterno)}
                                  >
                                    <Edit className="mr-1 h-4 w-4" />
                                    Editar
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
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
        />

        <ModalClientView
          open={showViewModal}
          onOpenChange={(open) => { if (!open) closeViewModal(); }}
          codClient={codClient}
        />

        <ModalClientEdit
          open={showEditModal}
          onOpenChange={(open) => {if(!open) closeEditModal();}}
          codClient={codClient}
        />

      </Card>
    </div>
  )
}