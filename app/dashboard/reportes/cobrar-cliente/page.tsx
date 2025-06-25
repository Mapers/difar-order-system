'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import React, { useEffect, useState } from "react"
import { balanceDocClientRequest, fetchAvailableZones } from "@/app/api/reports"
import { Check, ChevronDown, MapPin, Search, User, X } from "lucide-react"
import { clientSchema } from "@/schemas/reports/documentoSchema"
import { z } from 'zod'
import { toast } from "@/hooks/use-toast"
import ZoneReportSkeleton from "@/components/skeleton/ZoneReportSkeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Customer, IArea, Zone } from "@/interface/report/report-interface"
import ZoneCollectClientReport from "@/components/reporte/zoneCollectClientReport"
import { Label } from "@radix-ui/react-label"
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover"
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from "@/components/ui/command"
import { cn } from "@/lib/utils"

export default function CollectClientPage() {

  const [loading, setLoading] = useState(false)
  const [isEmpty, setIsEmpty] = useState(false)
  const [dateCut, setDateCut] = useState<string>("")
  const [fullName, setFullName] = useState<string>("")
  const [loadingClient, setLoadingClient] = useState(false)
  const [dataClient, setDataClient] = useState<Zone[]>([])
  const [zonas, setZonas] = useState<IArea[]>([])
  const [activeTab, setActiveTab] = useState<string>("0")
  const [selectedZona, setSelectedZona] = useState<IArea | null>(null)
  const [open, setOpen] = useState(false)

  const handleZonaSelected = (zona: IArea) => {
    const selectedZona = zonas.find((z) => z.IdZona === zona.IdZona)
    if (selectedZona) {
      console.log("zona: ", selectedZona);
      setSelectedZona(selectedZona)
      setOpen(false)
    }
  }

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
        fechaCorte: dateCut,
        idZona: selectedZona?.IdZona ?? null
      }
      clientSchema.parse(customer)
      const response = await balanceDocClientRequest(customer)
      if (response.status !== 200) throw new Error("Error al consultar documento de cliente")
      const data = response?.data?.data
      setDataClient(data)
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

  const getAvailableZones = async () => {
    try {
      setLoading(true)
      const response = await fetchAvailableZones();
      if (response.status !== 200) throw new Error("Error al obtener zonas disponibles")
      const data = response?.data?.data
      setZonas(data || [])
    } catch (error) {
      console.error("Error fetching clients:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSeller = async (e: React.FormEvent) => {
    e.preventDefault()
    await searchSeller()
  }

  useEffect(() => {
    getAvailableZones()
    if (fullName && dateCut) {
      searchSeller()
    }
  }, [])


  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Consulta Cobrar Cliente</h1>
        <p className="text-gray-500">Gestiona la información de tus clientes.</p>
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Filtros de búsqueda </h2>
            <p className="text-sm text-muted-foreground">
              Utiliza los filtros para encontrar clientes específicos
            </p>
          </div>

          {/* Fila: Nombre y Fecha */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="search">Nombre/Apellido o RUC</Label>
              </div>
              <Input
                id="search"
                type="text"
                placeholder="Buscar por nombre, apellido o RUC"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="date">Fecha</Label>
              </div>
              <Input
                id="date"
                type="date"
                value={dateCut}
                onChange={(e) => setDateCut(e.target.value)}
              />
            </div>
          </div>

          {/* Fila: Zona y Botón buscar */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="relative space-y-2">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="search">Zona</Label>
              </div>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between h-12">
                    {selectedZona
                      ? zonas.find((c) => c.IdZona === selectedZona.IdZona)?.NombreZona
                      : 'Seleccionar zona...'}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full max-w-[450px] sm:max-w-[300px] max-h-[300px] p-0 z-50">
                  <Command>
                    <CommandInput placeholder="Buscar zona..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron condiciones.</CommandEmpty>
                      <CommandGroup>
                        {zonas.map((zona: IArea) => (
                          <CommandItem
                            key={zona.IdZona}
                            // value={zona.IdZona}
                            value={`${zona.IdZona} ${zona.NombreZona}`}
                            onSelect={() => handleZonaSelected(zona)}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedZona?.IdZona === zona.IdZona
                                  ? 'opacity-100'
                                  : 'opacity-0',
                              )}
                            />
                            {zona.NombreZona}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Botón Buscar */}
            <div className="flex flex-col justify-end gap-1">
              <Label className="invisible">.</Label>
              <Button
                className="bg-blue-600 hover:bg-blue-700 w-full h-10"
                onClick={handleSearchSeller}
              >
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-white">
            {loadingClient ? (
              < ZoneReportSkeleton />
            ) : dataClient.length > 0 ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full mb-4">
                  {dataClient.map((zoneseller, index) => (
                    <TabsTrigger key={index} value={index.toString()}>
                      {zoneseller.nomVend.length > 15
                        ? zoneseller.nomVend.slice(0, 15) + '...'
                        : zoneseller.nomVend}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {dataClient.map((zone, index) => (
                  <TabsContent key={index} value={index.toString()}>
                    <ZoneCollectClientReport zone={zone} clients={zone.document_dislab} />
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