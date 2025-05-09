'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import React, { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Search, } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { IDate } from "@/interface/product-interface"
import { dateSchema } from "@/schemas/products/productSchema"
import { getDateProductsRequest } from "@/app/api/products"
import { z } from 'zod'


export default function CollectSellerPage() {

  const [dataSeller, setDataSeller] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [date, setDateCut] = useState<string>("")
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState<number>(1)
  const [perPage, setPerPage] = useState<number>(10)

  const searchSeller = async () => {
    setLoading(true)
    try {
      const sendDate: IDate = {
        fecha: date
      }
      dateSchema.parse(sendDate)
      const response = await getDateProductsRequest(sendDate, page, perPage)
      if (response.status !== 200) throw new Error("Error al consultar documento de cliente")
      const data = response?.data?.data?.data
      setDataSeller(data)
      setTotalPages(response?.data?.data?.pagination.totalPages || 1)
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({ title: "Productos", description: error.errors[0]?.message, variant: "error" })
      } else {
        console.error("Error collection client")
      }
    }
    finally {
      setLoading(false)
    }
  }

  const handleSearchSeller = async (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    await searchSeller()
  }

  useEffect(() => {
    if (date) {
      searchSeller()
    }
  }, [page])


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

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Consulta Cobrar Vendedor</h1>
        <p className="text-gray-500">Gestiona la información de tus clientes.</p>
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex flex-col sm:flex-row justify-start gap-4 sm:items-center">

          <CardTitle className="text-xl font-semibold text-indigo-700">Lista de Productos</CardTitle> <div className="flex flex-col sm:flex-row gap-4 sm:items-center">

            <div className="relative">
              <Input
                type="date"
                placeholder="F000-0000"
                // className={`pl-8 bg-white ${isEmpty ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                className={"pl-8 bg-white"}
                value={date}
                onChange={(e) => {
                  setDateCut(e.target.value)
                }}
                required
              />
            </div>

            <Button className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSearchSeller}
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
                  <TableHead>Código Arctículo</TableHead>
                  <TableHead>Línea De Descripción</TableHead>
                  <TableHead className="hidden md:table-cell">Lote De Descripción</TableHead>
                  <TableHead className="hidden md:table-cell">Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Unidad</TableHead>
                  <TableHead className="hidden md:table-cell">Saldo Cantidad</TableHead>
                  <TableHead className="hidden md:table-cell">PU_Inc_IGV</TableHead>
                  <TableHead className="text-right">Tipo PU_No_Afecto_IGV</TableHead>
                  <TableHead className="text-right">Pago Al Contado</TableHead>
                  <TableHead className="text-right">Pago Al Crédito</TableHead>
                  <TableHead className="text-right">Mayor</TableHead>
                  <TableHead className="text-right">Menor</TableHead>
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
                ) : dataSeller.length > 0 ? (
                  dataSeller.map((doc, index) => (
                    <TableRow key={doc.Codigo_Art + index} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{doc.Codigo_Art || '-'}</TableCell>
                      <TableCell className="font-medium">{doc.DescripcionLinea}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doc.DescripcionLote || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doc.NombreItem || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doc.Unidad || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doc.saldoCant || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doc.PU_Inc_IGV || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doc.PU_No_Afecto_IGV || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doc.PUContado || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doc.PUCredito || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doc.PUPorMayor || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doc.PUPorMenor || "-"}
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
            {!loading && dataSeller.length > 0 && (
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