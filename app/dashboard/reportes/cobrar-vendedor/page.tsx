'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import React, { useEffect, useState } from "react"
import { balanceDocClientSellerRequest, searchClientsRequest } from "@/app/api/reports"
import { Search, User, ChevronDown, X, Check } from "lucide-react"
import { clientSchema } from "@/schemas/reports/documentoSchema"
import { z } from 'zod'
import { toast } from "@/hooks/use-toast"
import { ZoneReportSkeleton } from "@/components/skeleton/ZoneReportSkeleton"
import ZoneCollectSellerReport from "@/components/reporte/zoneCollectSellerReport"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Customer, Zone } from "@/interface/report/report-interface"
import { useAuth } from "@/context/authContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from "@/components/ui/command"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface IAutocompleteClient {
  RUC: string;
  Nombre: string;
}

export default function CollectSellerPage() {
  const [loadingClient, setLoadingClient] = useState(false)
  const [dataClientSeller, setDataClientSeller] = useState<Zone[]>([])
  const [activeTab, setActiveTab] = useState<string>("0")

  // Estados para el Autocomplete del Cliente
  const [fullName, setFullName] = useState<string>("")
  const [openClientAutocomplete, setOpenClientAutocomplete] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [clientOptions, setClientOptions] = useState<IAutocompleteClient[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  const auth = useAuth()

  // ----------------------------------------------------------------
  // EFECTO PARA BUSCAR CLIENTES (AUTOCOMPLETE) CON DEBOUNCE
  // ----------------------------------------------------------------
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

  const searchSeller = async () => {
    setLoadingClient(true)
    try {
      // Validación estricta: aquí sí es obligatorio el nombre/RUC
      // if (!fullName.trim()) {
      //   toast({ title: "Atención", description: "Debe seleccionar o ingresar un Cliente/RUC", variant: "destructive" })
      //   return;
      // }

      // Generar fecha actual YYYY-MM-DD
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const customer: Customer = {
        nombreApellido: fullName.trim().toLocaleUpperCase(),
        fechaCorte: todayStr // Siempre usa la fecha actual
      }

      try {
        clientSchema.parse(customer)
      } catch (zodErr) {
        // Manejo silencioso de validaciones de zod adicionales si las hubiera
      }

      const isSeller = auth.user?.idRol === 1;
      const vendedorCode = isSeller ? (auth.user?.codigo || null) : null;

      const response = await balanceDocClientSellerRequest(customer, vendedorCode)
      if (response.status !== 200) throw new Error("Error al consultar documento de cliente")

      const data = response?.data?.data
      setDataClientSeller(data)
      setActiveTab("0") // Reinicia la pestaña activa al hacer una nueva búsqueda
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({ title: "Cobrar Vendedor", description: error.errors[0]?.message, variant: "destructive" })
      } else {
        console.error("Error collection client", error)
        toast({ title: "Error", description: "Hubo un problema al buscar los datos.", variant: "destructive" })
      }
    } finally {
      setLoadingClient(false)
    }
  }

  const handleSearchSeller = async (e: React.FormEvent) => {
    e.preventDefault()
    await searchSeller()
  }

  return (
      <div className="grid gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Consulta Cobrar Vendedor</h1>
          <p className="text-gray-500">Gestiona la información de tus vendedores.</p>
        </div>

        <Card className="shadow-md">
          <CardHeader className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Filtros de búsqueda</h2>
              <p className="text-sm text-muted-foreground">
                Busca por cliente para visualizar su deuda agrupada por vendedor (Fecha actual).
              </p>
            </div>

            <div className="grid sm:grid-cols-12 gap-4 items-end">

              {/* AUTOCOMPLETE DE CLIENTE Ocupando 8 o 9 columnas */}
              <div className="flex flex-col gap-1 sm:col-span-9 relative">
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
                        {fullName ? fullName : "Buscar cliente o RUC..."}
                      </span>
                        {!fullName && <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                      </Button>
                    </PopoverTrigger>

                    {/* Botón flotante para limpiar el input */}
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

              {/* Botón Buscar Ocupando 3 columnas */}
              <div className="flex flex-col sm:col-span-3">
                <Button
                    className="bg-blue-600 hover:bg-blue-700 w-full h-10"
                    onClick={handleSearchSeller}
                    disabled={loadingClient}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </Button>
              </div>

            </div>
          </CardHeader>
          <CardContent>
            {/* Igual aquí, agregamos p-4 */}
            <div className="rounded-md border bg-white p-4">
              {loadingClient ? (
                  <ZoneReportSkeleton />
              ) : dataClientSeller.length > 0 ? (
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    {/* h-auto, gap-2 y p-1 */}
                    <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto gap-2 mb-6 p-1">
                      {dataClientSeller.map((zoneseller, index) => (
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

                    {dataClientSeller.map((zone, index) => (
                        <TabsContent key={index} value={index.toString()} className="mt-0">
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