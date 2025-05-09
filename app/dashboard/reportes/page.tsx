'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, UserPlus, Eye, Edit, Trash } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import apiClient from "@/app/api/client";
import { balanceDocClientRequest, balanceDocClientSellerRequest, consultDocClientRequest, fetchTypeDocuments } from "@/app/api/reports"
import { IDocument, IDocClient, IClient } from "@/interface/report-interface"




export default function ReportsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [typesDocuments, setTypesDocuments] = useState<IDocument[]>([])
  const [dataDocClient, setDataDocClient] = useState<any[]>([])
  const [dataDocClientSeller, setDataDocClientSeller] = useState<any[]>([])
  const [dataBalanceDocClient, setDataBalanceDocClient] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const docClient: IDocClient = {
    documento: "01-F001-9061"
  }
  const client: IClient = {
    nombreApellido: "PATRICK KEVIN LOYAGA ARTEAGA",
    fechaCorte: "2025-04-06"
  }



  const fetchClients = async (query = "", page = 1) => {
    try {
      setLoading(true)
      const url = query
        ? `/clientes/search?query=${encodeURIComponent(query)}&page=${page}`
        : `/clientes?page=${page}`

      const response = await apiClient(url)
      if (response.status !== 200) throw new Error("Error al obtener clientes")

      const data = await response.data
      setClients(data.data.data || data)
      setTotalPages(data.data.pagination.totalPages || 1)
    } catch (error) {
      console.error("Error fetching clients:", error)
    } finally {
      setLoading(false)
    }
  }


  const fetchConsultDocClient = async () => {
    try {
      setLoading(true)
      const response = await consultDocClientRequest(docClient)
      if (response.status !== 200) throw new Error("Error al consultar documento de cliente")
      const data = await response.data
      setDataDocClient(data.data.data || data)
    } catch (error) {
      console.error("Error fetching consult doc client:", error)
    } finally {
      setLoading(false)
    }
  }


  const fetchBalanceDocClientSeller = async () => {
    try {
      setLoading(true)
      const response = await balanceDocClientSellerRequest(client)
      if (response.status !== 200) throw new Error("Error al obtener saldo de cliente vendedor")
      const data = await response.data
      setDataDocClientSeller(data.data.data || data)
    } catch (error) {
      console.error("Error fetching client saller:", error)
    } finally {
      setLoading(false)
    }
  }


  const fetchBalanceDocClient = async () => {
    try {
      setLoading(true)
      const response = await balanceDocClientRequest(client)
      if (response.status !== 200) throw new Error("Error al obtener saldo de cliente")
      const data = await response.data
      setDataBalanceDocClient(data.data.data || data)
    } catch (error) {
      console.error("Error fetching client:", error)
    } finally {
      setLoading(false)
    }
  }



  const getTypesDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetchTypeDocuments()
      if (response.status !== 200) throw new Error("Error al obtener tipos de documentos")
      const data = await response.data
      setTypesDocuments(data.data.data || data)
    } catch (error) {
      console.error("Error fetching clients:", error)
    } finally {
      setLoading(false)
    }
  }



  useEffect(() => {
    fetchClients(searchQuery, currentPage)
    fetchConsultDocClient()
    fetchBalanceDocClientSeller()
    fetchBalanceDocClient()
    getTypesDocuments()
  }, [searchQuery, currentPage])

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
        <p className="text-gray-500">Gestiona la información de tus clientes.</p>
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
          <CardTitle className="text-xl font-semibold text-blue-700">Lista de Clientes</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar por código, nombre o RUC..."
                className="pl-8 bg-white"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700" disabled>
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre/Razón Social</TableHead>
                  <TableHead className="hidden md:table-cell">Nombre Comercial</TableHead>
                  <TableHead className="hidden md:table-cell">RUC</TableHead>
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
                  clients.map((client, index) => (
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
            </Table>

            {/* Paginación */}
            {!loading && clients.length > 0 && (
              <div className="mt-4 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={handlePreviousPage}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="px-4 py-2 text-sm font-medium">
                        Página {currentPage} de {totalPages}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        onClick={handleNextPage}
                        className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}