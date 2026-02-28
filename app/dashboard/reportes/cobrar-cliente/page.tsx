'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import React, { useEffect, useState } from "react"
import { balanceDocClientRequest, fetchAvailableZones, searchClientsRequest } from "@/app/api/reports"
import { Check, ChevronDown, MapPin, Search, User, X } from "lucide-react"
import { clientSchema } from "@/schemas/reports/documentoSchema"
import { z } from 'zod'
import { toast } from "@/hooks/use-toast"
import { ZoneReportSkeleton } from "@/components/skeleton/ZoneReportSkeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Customer, IArea, Zone } from "@/interface/report/report-interface"
import ZoneCollectClientReport from "@/components/reporte/zoneCollectClientReport"
import { Label } from "@radix-ui/react-label"
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover"
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/authContext";
import ExportCollectClientPdfButton from "@/components/reporte/exportCollectClientPdfButton";

interface IAutocompleteClient {
  RUC: string;
  Nombre: string;
}

export default function CollectClientPage() {
  const [loading, setLoading] = useState(false)
  const [loadingClient, setLoadingClient] = useState(false)
  const [dataClient, setDataClient] = useState<Zone[]>([])
  const [zonas, setZonas] = useState<IArea[]>([])
  const [activeTab, setActiveTab] = useState<string>("0")
  const [selectedZona, setSelectedZona] = useState<IArea | null>(null)
  const [openZona, setOpenZona] = useState(false)
  const [fullName, setFullName] = useState<string>("")
  const [openClientAutocomplete, setOpenClientAutocomplete] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [clientOptions, setClientOptions] = useState<IAutocompleteClient[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  const auth = useAuth()

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setLoadingOptions(true)
        try {
          const isSeller = auth.user?.idRol === 1;
          const vendedorCode = isSeller ? (auth.user?.codigo || null) : null;

          const res = await searchClientsRequest(searchQuery, vendedorCode);
          if (res.status === 200) {
            setClientOptions(res.data.data || []);
          }
        } catch (error) {
          console.error("Error buscando clientes:", error);
        } finally {
          setLoadingOptions(false)
        }
      } else {
        setClientOptions([])
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, auth.user]);

  const handleZonaSelected = (zona: IArea) => {
    const foundZona = zonas.find((z) => z.IdZona === zona.IdZona)
    if (foundZona) {
      setSelectedZona(foundZona)
      setOpenZona(false)
    }
  }

  const searchSeller = async () => {
    setLoadingClient(true)
    try {
      if (!fullName.trim() && !selectedZona) {
        toast({ title: "Atención", description: "Ingrese un Nombre/RUC o seleccione una Zona", variant: "warning" })
        return;
      }

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const customer: Customer = {
        nombreApellido: fullName.trim() ? fullName.toLocaleUpperCase() : "",
        fechaCorte: todayStr,
        idZona: selectedZona?.IdZona ?? null
      }

      try {
        clientSchema.parse(customer)
      } catch (zodErr) {
      }

      const isSeller = auth.user?.idRol === 1;
      const vendedorCode = isSeller ? (auth.user?.codigo || null) : null;

      const response = await balanceDocClientRequest(customer, vendedorCode)
      if (response.status !== 200) throw new Error("Error al consultar documento de cliente")

      const data = response?.data?.data
      setDataClient(data)
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({ title: "Cobrar Cliente", description: error.errors[0]?.message, variant: "destructive" })
      } else {
        console.error("Error collection client", error)
      }
    } finally {
      setLoadingClient(false)
    }
  }

  const getAvailableZones = async () => {
    try {
      setLoading(true)
      const response = await fetchAvailableZones();
      if (response.status !== 200) throw new Error("Error al obtener zonas disponibles")
      setZonas(response?.data?.data || [])
    } catch (error) {
      console.error("Error fetching zones:", error)
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
  }, [])

  return (
      <div className="grid gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Consulta Cobrar Cliente</h1>
          <p className="text-gray-500">Gestiona la información de tus clientes.</p>
        </div>

        <Card className="shadow-md">
          <CardHeader className="flex flex-col gap-6">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Filtros de búsqueda</h2>
                <p className="text-sm text-muted-foreground">
                  Utiliza los filtros para encontrar clientes específicos
                </p>
              </div>

              <div className="flex sm:w-auto w-full">
                <ExportCollectClientPdfButton
                    data={dataClient}
                    disabled={loadingClient || dataClient.length === 0}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-12 gap-4 items-end">

              <div className="flex flex-col gap-1 sm:col-span-5 relative">
                <div className="flex items-center gap-1.5 mb-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <Label>Nombre/Apellido o RUC</Label>
                </div>

                <Popover open={openClientAutocomplete} onOpenChange={setOpenClientAutocomplete}>
                  <div className="relative w-full">
                    <PopoverTrigger asChild>
                      <Button
                          variant="outline"
                          role="combobox"
                          className={cn("w-full justify-between h-10 font-normal overflow-hidden", fullName && "pr-8")}
                      >
                        <span className="truncate">
                          {fullName ? fullName : "Buscar cliente..."}
                        </span>
                        {!fullName && <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                      </Button>
                    </PopoverTrigger>

                    {fullName && (
                        <div
                            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-md z-10"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFullName("");
                              setSearchQuery("");
                            }}
                            title="Limpiar cliente"
                        >
                          <X className="h-4 w-4" />
                        </div>
                    )}
                  </div>

                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                          placeholder="Escriba Nombre o RUC..."
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                      />
                      <CommandList>
                        {loadingOptions && (
                            <div className="p-4 text-sm text-center text-muted-foreground">Buscando...</div>
                        )}

                        {!loadingOptions && clientOptions.length === 0 && searchQuery.length > 2 && (
                            <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                        )}

                        <CommandGroup>
                          {clientOptions.map((client) => (
                              <CommandItem
                                  key={client.RUC}
                                  value={client.Nombre}
                                  onSelect={() => {
                                    setFullName(client.Nombre)
                                    setOpenClientAutocomplete(false)
                                  }}
                              >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4 flex-shrink-0",
                                        fullName === client.Nombre ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                <span className="truncate">
                              {client.RUC} - {client.Nombre}
                            </span>
                              </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="relative space-y-2 sm:col-span-5">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="zona">Zona</Label>
                </div>
                <Popover open={openZona} onOpenChange={setOpenZona}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between h-10">
                    <span className="truncate">
                      {selectedZona ? selectedZona.NombreZona : 'Seleccionar zona...'}
                    </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50">
                    <Command>
                      <CommandInput placeholder="Buscar zona..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron zonas.</CommandEmpty>
                        <CommandGroup>
                          {zonas.map((zona: IArea) => (
                              <CommandItem
                                  key={zona.IdZona}
                                  value={`${zona.IdZona} ${zona.NombreZona}`}
                                  onSelect={() => handleZonaSelected(zona)}
                              >
                                <Check
                                    className={cn(
                                        'mr-2 h-4 w-4 flex-shrink-0',
                                        selectedZona?.IdZona === zona.IdZona ? 'opacity-100' : 'opacity-0',
                                    )}
                                />
                                <span className="truncate">{zona.NombreZona}</span>
                              </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col sm:col-span-2">
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
            <div className="rounded-md border bg-white p-4">
              {loadingClient ? (
                  <ZoneReportSkeleton />
              ) : dataClient.length > 0 ? (
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto gap-2 mb-6 p-1">
                      {dataClient.map((zoneseller, index) => (
                          <TabsTrigger
                              key={index}
                              value={index.toString()}
                              className="whitespace-normal h-auto py-2 text-xs sm:text-sm"
                          >
                            {zoneseller.nomVend.length > 15
                                ? zoneseller.nomVend.slice(0, 15) + '...'
                                : zoneseller.nomVend}
                          </TabsTrigger>
                      ))}
                    </TabsList>

                    {dataClient.map((zone, index) => (
                        <TabsContent key={index} value={index.toString()} className="mt-0">
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