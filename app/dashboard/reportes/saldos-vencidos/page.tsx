'use client'

import React, { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { getExpiredBalancesRequest } from "@/app/api/reports"
import { Check, ChevronDown, MapPin, RefreshCcw, Search, User, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { ExportExpiredBalancesPdf } from "@/components/reporte/exportExpiredBalancesPdf"
import { ZoneReportSkeleton } from "@/components/skeleton/ZoneReportSkeleton"
import { VendedorVencido, ZonaVencido, ClienteVencido } from "@/app/types/report-interface"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@radix-ui/react-label"
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover"
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from "@/components/ui/command"
import { cn } from "@/lib/utils"

interface FilterOptions {
    id: string;
    nombre: string;
    tipo: 'cliente' | 'zona';
}

export default function ExpiredBalancesPage() {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<VendedorVencido[]>([])
    const [filteredData, setFilteredData] = useState<VendedorVencido[]>([])
    const [activeTab, setActiveTab] = useState<string>("0")

    // Filtros
    const [selectedZona, setSelectedZona] = useState<string>("")
    const [openZona, setOpenZona] = useState(false)
    const [selectedCliente, setSelectedCliente] = useState<string>("")
    const [openCliente, setOpenCliente] = useState(false)
    const [searchClienteQuery, setSearchClienteQuery] = useState("")

    // Opciones para los filtros (extraídas de la data)
    const [zonasOptions, setZonasOptions] = useState<FilterOptions[]>([])
    const [clientesOptions, setClientesOptions] = useState<FilterOptions[]>([])

    // Extraer opciones únicas de la data
    useEffect(() => {
        if (data.length > 0) {
            const zonasSet = new Set<string>()
            const clientesSet = new Set<string>()
            const zonasMap = new Map<string, string>() // id -> nombre
            const clientesMap = new Map<string, string>() // id -> nombre

            data.forEach(vendedor => {
                vendedor.zonas.forEach(zona => {
                    // Para zona, usamos el nombre como identificador
                    if (!zonasSet.has(zona.NombreZona)) {
                        zonasSet.add(zona.NombreZona)
                        zonasMap.set(zona.NombreZona, zona.NombreZona)
                    }

                    zona.clientes.forEach(cliente => {
                        // Para cliente, creamos un ID único combinando nombre y dirección
                        const clienteId = `${cliente.Cliente}-${cliente.Direccion}`
                        if (!clientesSet.has(clienteId)) {
                            clientesSet.add(clienteId)
                            clientesMap.set(clienteId, cliente.Cliente)
                        }
                    })
                })
            })

            setZonasOptions(
                Array.from(zonasMap.entries()).map(([id, nombre]) => ({
                    id,
                    nombre,
                    tipo: 'zona'
                }))
            )

            setClientesOptions(
                Array.from(clientesMap.entries()).map(([id, nombre]) => ({
                    id,
                    nombre,
                    tipo: 'cliente'
                }))
            )
        }
    }, [data])

    // Aplicar filtros locales
    useEffect(() => {
        if (data.length === 0) {
            setFilteredData([])
            return
        }

        let filtered = [...data]

        // Filtrar por zona
        if (selectedZona) {
            filtered = filtered.map(vendedor => ({
                ...vendedor,
                zonas: vendedor.zonas.filter(zona => zona.NombreZona === selectedZona)
            })).filter(vendedor => vendedor.zonas.length > 0)
        }

        // Filtrar por cliente
        if (selectedCliente) {
            filtered = filtered.map(vendedor => ({
                ...vendedor,
                zonas: vendedor.zonas.map(zona => ({
                    ...zona,
                    clientes: zona.clientes.filter(cliente =>
                        cliente.Cliente === selectedCliente
                    )
                })).filter(zona => zona.clientes.length > 0)
            })).filter(vendedor => vendedor.zonas.length > 0)
        }

        setFilteredData(filtered)

        // Resetear active tab si el tab actual ya no existe
        if (filtered.length > 0 && parseInt(activeTab) >= filtered.length) {
            setActiveTab("0")
        }
    }, [data, selectedZona, selectedCliente, activeTab])

    const fetchReport = async () => {
        setLoading(true)
        try {
            const response = await getExpiredBalancesRequest();
            if (response.status === 200) {
                const reportData = response.data.data || [];
                setData(reportData);
                setFilteredData(reportData);
                if (reportData.length > 0) {
                    setActiveTab("0");
                }
                // Limpiar filtros
                setSelectedZona("")
                setSelectedCliente("")
                setSearchClienteQuery("")
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudo cargar el reporte", variant: "destructive" });
        } finally {
            setLoading(false)
        }
    }

    const handleClearFilters = () => {
        setSelectedZona("")
        setSelectedCliente("")
        setSearchClienteQuery("")
    }

    useEffect(() => {
        fetchReport();
    }, [])

    // Clientes filtrados para el autocomplete
    const filteredClientOptions = useMemo(() => {
        if (!searchClienteQuery) return clientesOptions;
        return clientesOptions.filter(cliente =>
            cliente.nombre.toLowerCase().includes(searchClienteQuery.toLowerCase())
        );
    }, [clientesOptions, searchClienteQuery]);

    return (
        <div className="grid gap-6 p-4 md:p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Saldos por Cobrar (Vencidos)</h1>
                <p className="text-sm md:text-base text-gray-500">Listado general de documentos vencidos agrupado por Vendedor, Zona y Cliente.</p>
            </div>

            <Card className="shadow-md">
                <CardHeader className="flex flex-col gap-6 bg-slate-50 border-b border-slate-200 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">Filtros de búsqueda</h2>
                        </div>

                        <div className="flex gap-3 w-full sm:w-auto">
                            <Button onClick={fetchReport} disabled={loading} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                                <RefreshCcw className="mr-2 h-4 w-4" />
                                Actualizar
                            </Button>
                            <ExportExpiredBalancesPdf data={filteredData} disabled={loading || filteredData.length === 0} />
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-12 gap-4 items-end">
                        {/* Filtro de Zona */}
                        <div className="relative space-y-2 sm:col-span-5">
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <Label htmlFor="zona">Zona</Label>
                            </div>
                            <Popover open={openZona} onOpenChange={setOpenZona}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between h-10">
                                        <span className="truncate">
                                            {selectedZona
                                                ? zonasOptions.find(z => z.id === selectedZona)?.nombre
                                                : 'Todas las zonas'}
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
                                                {zonasOptions.map((zona) => (
                                                    <CommandItem
                                                        key={zona.id}
                                                        value={zona.nombre}
                                                        onSelect={() => {
                                                            setSelectedZona(selectedZona === zona.id ? "" : zona.id)
                                                            setOpenZona(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                'mr-2 h-4 w-4 flex-shrink-0',
                                                                selectedZona === zona.id ? 'opacity-100' : 'opacity-0',
                                                            )}
                                                        />
                                                        <span className="truncate">{zona.nombre}</span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Filtro de Cliente */}
                        <div className="flex flex-col gap-1 sm:col-span-5 relative">
                            <div className="flex items-center gap-1.5 mb-1">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <Label>Cliente</Label>
                            </div>

                            <Popover open={openCliente} onOpenChange={setOpenCliente}>
                                <div className="relative w-full">
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn("w-full justify-between h-10 font-normal overflow-hidden", selectedCliente && "pr-8")}
                                        >
                                            <span className="truncate">
                                                {selectedCliente
                                                    ? clientesOptions.find(c => c.id === selectedCliente)?.nombre
                                                    : "Todos los clientes"}
                                            </span>
                                            {!selectedCliente && <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                                        </Button>
                                    </PopoverTrigger>

                                    {selectedCliente && (
                                        <div
                                            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-md z-10"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSelectedCliente("");
                                                setSearchClienteQuery("");
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
                                            placeholder="Buscar cliente..."
                                            value={searchClienteQuery}
                                            onValueChange={setSearchClienteQuery}
                                        />
                                        <CommandList>
                                            {filteredClientOptions.length === 0 && searchClienteQuery && (
                                                <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                                            )}

                                            <CommandGroup>
                                                {filteredClientOptions.map((cliente) => (
                                                    <CommandItem
                                                        key={cliente.id}
                                                        value={cliente.nombre}
                                                        onSelect={() => {
                                                            setSelectedCliente(selectedCliente === cliente.id ? "" : cliente.id)
                                                            setOpenCliente(false)
                                                            setSearchClienteQuery("")
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4 flex-shrink-0",
                                                                selectedCliente === cliente.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <span className="truncate">
                                                            {cliente.nombre}
                                                        </span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Indicador de resultados filtrados */}
                    {(selectedZona || selectedCliente) && (
                        <div className="text-sm text-muted-foreground mt-2">
                            Mostrando {filteredData.reduce((acc, v) => acc + v.zonas.reduce((acc2, z) => acc2 + z.clientes.length, 0), 0)} de {data.reduce((acc, v) => acc + v.zonas.reduce((acc2, z) => acc2 + z.clientes.length, 0), 0)} clientes
                        </div>
                    )}
                </CardHeader>

                <CardContent className="p-4 md:p-6">
                    {loading ? (
                        <div className="py-4"><ZoneReportSkeleton /></div>
                    ) : filteredData.length > 0 ? (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 w-full h-auto gap-2 mb-6 p-1 bg-slate-100/50">
                                {filteredData.map((vendedor, index) => (
                                    <TabsTrigger
                                        key={index}
                                        value={index.toString()}
                                        className="whitespace-normal h-auto py-2 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700"
                                    >
                                        {vendedor.Vendedor.length > 18
                                            ? vendedor.Vendedor.slice(0, 18) + '...'
                                            : vendedor.Vendedor}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            {filteredData.map((vendedor, vIdx) => (
                                <TabsContent key={vIdx} value={vIdx.toString()} className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                                    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                                        <div className="bg-indigo-600 text-white p-3 md:p-4 font-bold text-base md:text-lg flex items-center justify-between">
                                            <span>{vendedor.Vendedor}</span>
                                            <span className="text-xs bg-indigo-800/50 px-2 py-1 rounded-full font-medium">
                                                {vendedor.zonas.length} {vendedor.zonas.length === 1 ? 'Zona' : 'Zonas'}
                                            </span>
                                        </div>
                                        <div className="p-3 md:p-5 space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar">
                                            {vendedor.zonas.map((zona, zIdx) => (
                                                <div key={zIdx} className="bg-slate-50/50 rounded-lg p-3 md:p-4 border border-slate-100">
                                                    <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 text-sm md:text-base flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                        ZONA: {zona.NombreZona}
                                                    </h3>

                                                    <div className="space-y-4">
                                                        {zona.clientes.map((cliente, cIdx) => (
                                                            <div key={cIdx} className="bg-white p-3 md:p-4 rounded-md border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                                                <div className="mb-3">
                                                                    <p className="font-bold text-sm text-slate-900">{cliente.Cliente}</p>
                                                                    <p className="text-xs text-slate-500">{cliente.Direccion}</p>
                                                                </div>

                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-xs text-left">
                                                                        <thead className="text-slate-500 border-b border-slate-200 bg-slate-50">
                                                                        <tr>
                                                                            <th className="font-semibold py-2 px-2 whitespace-nowrap">Emisión</th>
                                                                            <th className="font-semibold py-2 px-2 whitespace-nowrap">Documento</th>
                                                                            <th className="font-semibold py-2 px-2 whitespace-nowrap">Tipo</th>
                                                                            <th className="font-semibold py-2 px-2 text-right whitespace-nowrap">Saldo (S/)</th>
                                                                        </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-100 font-mono">
                                                                        {cliente.documentos.map((doc, dIdx) => (
                                                                            <tr key={dIdx} className="hover:bg-slate-50/80">
                                                                                <td className="py-2 px-2 whitespace-nowrap">{doc.Fecha_Emision}</td>
                                                                                <td className="py-2 px-2 font-medium text-slate-700 whitespace-nowrap">{doc.Serie_Numero}</td>
                                                                                <td className="py-2 px-2 whitespace-nowrap">
                                                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] md:text-xs">
                                                                                            {doc.Abreviatura}
                                                                                        </span>
                                                                                </td>
                                                                                <td className="py-2 px-2 text-right font-bold text-red-600 whitespace-nowrap">
                                                                                    {doc.Saldo_Soles.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    ) : (
                        <div className="text-center text-sm text-gray-500 py-16 flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <RefreshCcw className="h-8 w-8 text-slate-300" />
                            </div>
                            <p className="font-medium text-slate-600">
                                {data.length > 0
                                    ? "No hay resultados con los filtros seleccionados"
                                    : "No hay documentos vencidos para mostrar"}
                            </p>
                            <p className="text-xs mt-1">
                                {data.length > 0
                                    ? "Intenta ajustar los filtros de búsqueda"
                                    : "Actualiza el reporte para cargar los datos"}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}