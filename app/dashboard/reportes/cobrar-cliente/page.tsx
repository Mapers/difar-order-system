'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import React, { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { balanceDocClientRequest, } from "@/app/api/reports"
import { IClient } from "@/interface/report-interface"
import { Search, } from "lucide-react"
import { clientSchema } from "@/schemas/reports/documentoSchema"
import { z } from 'zod'
import { toast } from "@/hooks/use-toast"


export default function CollectClientPage() {

  const [dataClient, setDataClient] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isEmpty, setIsEmpty] = useState(false)
  const [dateCut, setDateCut] = useState<string>("")
  const [fullName, setFullName] = useState<string>("")
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState<number>(1)
  const [perPage, setPerPage] = useState<number>(10)


  const searchClient = async () => {
    setLoading(true)
    try {
      const client: IClient = {
        nombreApellido: fullName.toLocaleUpperCase(),
        fechaCorte: dateCut
      }
      clientSchema.parse(client)
      const response = await balanceDocClientRequest(client, page, perPage)
      if (response.status !== 200) throw new Error("Error al consultar documento de cliente")
      const data = response?.data?.data?.data
      setDataClient(data)
      setTotalPages(response?.data?.data?.pagination.totalPages || 1)
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({ title: "Cobrar Cliente", description: error.errors[0]?.message, variant: "error" })
      } else {
        console.error("Error collection client")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearchClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    await searchClient()
  }

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1)
    }
  }

  useEffect(() => {
    if (fullName && dateCut) {
      searchClient()
    }
  }, [page])


  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Consulta Cobrar Clientes</h1>
        <p className="text-gray-500">Gestiona la información de tus clientes.</p>
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">

            <div className="relative">
              <Input
                type="search"
                placeholder="Nombre y Apellido"
                className={`pl-8 bg-white ${isEmpty ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                }}
                required
              />
            </div>
            <div className="relative">
              <Input
                type="date"
                placeholder="F000-0000"
                className={`pl-8 bg-white ${isEmpty ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                value={dateCut}
                onChange={(e) => {
                  setDateCut(e.target.value)
                }}
                required
              />
            </div>

            <Button className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSearchClient}
            >
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Código Vendedor</TableHead>
                  <TableHead>Nombre Vendedor</TableHead>
                  <TableHead className="hidden md:table-cell">RUC</TableHead>
                  <TableHead className="hidden md:table-cell">Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Nombre Comercial</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha Emisión</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha Vencimiento</TableHead>
                  <TableHead className="text-right">Tipo Documento</TableHead>
                  <TableHead className="text-right">Serie Documento</TableHead>
                  <TableHead className="text-right">Número Documento</TableHead>
                  <TableHead className="text-right">Tipo Moneda</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Skeleton loading
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-[40px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[70px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[70px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>


                    </TableRow>
                  ))
                ) : dataClient.length > 0 ? (
                  dataClient.map((doc, index) => (
                    <TableRow key={doc.CodVend + index} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{doc.CodVend}</TableCell>
                      <TableCell className="font-medium">{doc.nomVend}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doc.RUC || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doc.Nombre || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doc.NombreComercial || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doc.Fecha_Emision || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doc.Fecha_Vcto || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doc.Tipo_Doc || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doc.SerieDoc || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doc.NumeroDoc || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doc.Tipo_Moneda || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doc.saldoDoc || "-"}
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
            {!loading && dataClient.length > 0 && (
              <div className="mt-4 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={handlePreviousPage}
                        className={page === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="px-4 py-2 text-sm font-medium">
                        Página {page} de {totalPages}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        onClick={handleNextPage}
                        className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
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