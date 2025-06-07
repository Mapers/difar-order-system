'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import React, { useEffect, useState } from "react"
import { balanceDocClientSellerRequest } from "@/app/api/reports"
import { Search, Printer, } from "lucide-react"
import { clientSchema } from "@/schemas/reports/documentoSchema"
import { z } from 'zod'
import { toast } from "@/hooks/use-toast"
import ZoneReportSkeleton from "@/components/skeleton/ZoneReportSkeleton"
import ZoneCollectSellerReport from "@/components/reporte/zoneCollectSellerReport"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Customer, Zone } from "@/interface/report/report-interface"

export default function CollectSellerPage() {

  const [loading, setLoading] = useState(false)
  const [isEmpty, setIsEmpty] = useState(false)
  const [dateCut, setDateCut] = useState<string>("")
  const [fullName, setFullName] = useState<string>("")
  const [loadingClient, setLoadingClient] = useState(false)
  const [dataClientSeller, setDataClientSeller] = useState<Zone[]>([])
  const [activeTab, setActiveTab] = useState<string>("0")

  const searchSeller = async () => {
    setLoadingClient(true)
    try {
      if (!fullName.trim()) {
        setIsEmpty(true)
        return;
      }
      setIsEmpty(false)
      const customer: Customer = {
        nombreApellido: fullName.toLocaleUpperCase(),
        fechaCorte: dateCut
      }
      clientSchema.parse(customer)
      const response = await balanceDocClientSellerRequest(customer)
      if (response.status !== 200) throw new Error("Error al consultar documento de cliente")
      const data = response?.data?.data
      setDataClientSeller(data)
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({ title: "Cobrar Cliente", description: error.errors[0]?.message, variant: "error" })
      } else {
        console.error("Error collection client")
      }
    }
    finally {
      setLoadingClient(false)
    }
  }

  const handleSearchSeller = async (e: React.FormEvent) => {
    e.preventDefault()
    await searchSeller()
  }

  useEffect(() => {
    if (fullName && dateCut) {
      searchSeller()
    }
  }, [])


  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Consulta Cobrar Vendedor</h1>
        <p className="text-gray-500">Gestiona la información de tus vendedores.</p>
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
              onClick={handleSearchSeller}
            >
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSearchSeller}
            >
              <Printer className="mr-2 h-4 w-4" />
              Generar Reporte
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-white">
            {loadingClient ? (
              < ZoneReportSkeleton />
            ) : dataClientSeller.length > 0 ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full mb-4">
                  {dataClientSeller.map((zoneseller, index) => (
                    <TabsTrigger key={index} value={index.toString()}>
                      {zoneseller.nomVend.length > 15
                        ? zoneseller.nomVend.slice(0, 15) + '...'
                        : zoneseller.nomVend}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {dataClientSeller.map((zone, index) => (
                  <TabsContent key={index} value={index.toString()}>
                    <ZoneCollectSellerReport zone={zone} clients={zone.document_dislab} />
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <div className="text-center text-sm text-gray-500 py-6">
                No hay datos disponibles.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}