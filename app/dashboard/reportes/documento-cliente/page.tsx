'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import React, { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { consultDocClientRequest, fetchTypeDocuments } from "@/app/api/reports"
import { IDocument, IDocClient, Zone } from "@/interface/report-interface"
import { normalizeDocumentCode } from "@/utils/normalizeDocumentCode"
import { documentoSchema } from '@/schemas/reports/documentoSchema'
import { toast } from "@/hooks/use-toast"
import ZoneReport from "@/components/zoneReport"
import { dataZone } from "@/data/data"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { z } from 'zod'
import ZoneReportSkeleton from "@/components/skeleton/ZoneReportSkeleton"



export default function DocumentClientPage() {
  const [typesDocuments, setTypesDocuments] = useState<IDocument[]>([])
  const [dataZoneClient, setDataZoneClient] = useState<Zone[]>([])
  // const [dataZoneClient, setDataZoneClient] = useState<Zone[]>(dataZone)
  const [loading, setLoading] = useState(false)
  const [loadingZone, setLoadingZone] = useState(false)
  const [isEmpty, setIsEmpty] = useState(false)
  const [selectedDocumentCode, setSelectedDocumentCode] = useState<string>("")
  const [documentCode, setDocumentCode] = useState<string>("")

  const [activeTab, setActiveTab] = useState<string>("0")

  const getTypesDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetchTypeDocuments()
      if (response.status !== 200) throw new Error("Error al obtener tipos de documentos")
      const data = response?.data?.data
      setTypesDocuments(data)
    } catch (error) {
      console.error("Error fetching clients:", error)
    } finally {
      setLoading(false)
    }
  }

  const searchDocument = async () => {
    setLoadingZone(true)
    try {
      if (!documentCode.trim()) {
        setIsEmpty(true)
        return;
      }
      setIsEmpty(false)
      const normalizedDocumenCode = normalizeDocumentCode(documentCode)
      const documento = `${selectedDocumentCode}-${normalizedDocumenCode}`
      documentoSchema.parse({ documento })
      const docClient: IDocClient = { documento }
      const response = await consultDocClientRequest(docClient, 1, 9)
      if (response.status !== 200) throw new Error("Error al consultar documento de cliente")
      console.log("response data:", response?.data?.data)
      const data = response?.data?.data
      setDataZoneClient(data)
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({ title: "Consultar Cliente", description: error.errors[0]?.message, variant: "error" })
      } else {
        console.error("Error search document")
      }
    }
    finally {
      setLoadingZone(false)
    }
  }

  const handleSearchDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    await searchDocument()
  }

  const handleDocumentSelect = (value: string) => {
    setSelectedDocumentCode(value)
  }



  useEffect(() => {
    getTypesDocuments()
    if (selectedDocumentCode && documentCode) {
      searchDocument()
    }
  }, [])


  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Consulta Documento Clientes</h1>
        <p className="text-gray-500">Gestiona la información de tus clientes.</p>
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <Select value={selectedDocumentCode} onValueChange={handleDocumentSelect} required>
              <SelectTrigger className="bg-white w-60">
                <SelectValue placeholder="Seleccionar Documento" />
              </SelectTrigger>
              <SelectContent>
                {loadingZone ? (
                  <div className="p-4">
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : typesDocuments.length > 0 ? (
                  typesDocuments.map((c) => (
                    <SelectItem key={c.Cod_Tipo} value={c.Cod_Tipo}>
                      {c.Descripcion}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-4 text-sm text-gray-500">
                    No se encontraron documentos
                  </div>
                )}
              </SelectContent>
            </Select>
            <div className="relative border-red">
              <Input
                type="search"
                placeholder="F000-0000"
                className={`pl-8 bg-white ${isEmpty ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                value={documentCode}
                onChange={(e) => {
                  setDocumentCode(e.target.value)
                }}
                required
              />
            </div>

            <Button className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSearchDocument}
            >
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-white">
            {loadingZone ? (
              < ZoneReportSkeleton />
            ) : dataZoneClient.length > 0 ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full mb-4">
                  {dataZoneClient.map((zone, index) => (
                    <TabsTrigger key={index} value={index.toString()}>
                      {zone.nomVend}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {dataZoneClient.map((zone, index) => (
                  <TabsContent key={index} value={index.toString()}>
                    <ZoneReport zone={zone} clients={zone.document_dislab} />
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

      </Card >
    </div >
  )
}