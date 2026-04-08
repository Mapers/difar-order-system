'use client'

import React, { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { getExpiredBalancesRequest } from "@/app/api/reports"
import {Check, ChevronDown, MapPin, RefreshCcw, Search, User, X} from "lucide-react"

const calcDiasVencidos = (fechaVcto: string): number => {
    if (!fechaVcto) return 0
    try {
        const today = new Date()
        const vcto  = new Date(fechaVcto)
        if (isNaN(vcto.getTime())) return 0
        return Math.max(0, Math.floor((today.getTime() - vcto.getTime()) / 86_400_000))
    } catch { return 0 }
}
import { toast } from "@/app/hooks/useToast"
import { ExportExpiredBalancesPdf } from "@/components/reporte/exportExpiredBalancesPdf"
import { ZoneReportSkeleton } from "@/components/skeleton/ZoneReportSkeleton"
import { VendedorVencido } from "@/app/types/report-types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@radix-ui/react-label"
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover"
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import {useAuth} from "@/context/authContext";
import {fmtFecha} from "@/lib/planilla.helper";

interface FilterOptions {
    id: string;
    nombre: string;
    tipo: 'cliente' | 'zona';
}

export default function ExpiredBalancesPage() {
    const auth = useAuth();
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<VendedorVencido[]>([])
    const [activeTab, setActiveTab] = useState<string>("todos")
    const [selectedZona, setSelectedZona] = useState<string>("")
    const [openZona, setOpenZona] = useState(false)
    const [selectedCliente, setSelectedCliente] = useState<string>("")
    const [openCliente, setOpenCliente] = useState(false)
    const [searchClienteQuery, setSearchClienteQuery] = useState("")

    const [zonasOptions, setZonasOptions] = useState<FilterOptions[]>([])
    const [clientesOptions, setClientesOptions] = useState<FilterOptions[]>([])

    const tabFilteredData = useMemo(() => {
        if (activeTab === "todos") return data;
        return data.filter(v => v.Vendedor === activeTab);
    }, [data, activeTab]);

    useEffect(() => {
        if (tabFilteredData.length === 0) return;

        const zonasSet = new Set<string>()
        const clientesSet = new Set<string>()
        const zonasMap = new Map<string, string>()
        const clientesMap = new Map<string, string>()

        tabFilteredData.forEach(vendedor => {
            vendedor.zonas.forEach(zona => {
                if (!zonasSet.has(zona.NombreZona)) {
                    zonasSet.add(zona.NombreZona)
                    zonasMap.set(zona.NombreZona, zona.NombreZona)
                }

                if (!selectedZona || zona.NombreZona === selectedZona) {
                    zona.clientes.forEach(cliente => {
                        const clienteId = `${cliente.Cliente}-${cliente.Direccion}`
                        if (!clientesSet.has(clienteId)) {
                            clientesSet.add(clienteId)
                            clientesMap.set(clienteId, cliente.Cliente)
                        }
                    })
                }
            })
        })

        setZonasOptions(Array.from(zonasMap.entries()).map(([id, nombre]) => ({ id, nombre, tipo: 'zona' })))
        setClientesOptions(Array.from(clientesMap.entries()).map(([id, nombre]) => ({ id, nombre, tipo: 'cliente' })))

    }, [tabFilteredData, selectedZona]);

    const finalVisibleData = useMemo(() => {
        let filtered = [...tabFilteredData];

        if (selectedZona) {
            filtered = filtered.map(vendedor => ({
                ...vendedor,
                zonas: vendedor.zonas.filter(zona => zona.NombreZona === selectedZona)
            })).filter(vendedor => vendedor.zonas.length > 0)
        }

        if (selectedCliente) {
            filtered = filtered.map(vendedor => ({
                ...vendedor,
                zonas: vendedor.zonas.map(zona => ({
                    ...zona,
                    clientes: zona.clientes.filter(cliente => cliente.Cliente === selectedCliente)
                })).filter(zona => zona.clientes.length > 0)
            })).filter(vendedor => vendedor.zonas.length > 0)
        }

        return filtered;
    }, [tabFilteredData, selectedZona, selectedCliente]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        setSelectedZona("");
        setSelectedCliente("");
        setSearchClienteQuery("");
    };

    const fetchReport = async () => {
        setLoading(true)
        try {
            const response = await getExpiredBalancesRequest();
            if (response.status === 200) {
                let reportData = response.data.data || [];

                const user = auth.user;
                if (user) {
                    if (user.idRol === 1) {
                        reportData = reportData.filter((v: any) => v.codigoVendedor === user.codigo);
                    } else if (user.idRol === 7 && user.codRepres) {
                        const codigosPermitidos = user.vendedores?.map(vend => vend.codigo) || [];
                        reportData = reportData.filter((v: any) => {
                            const codigoVendedor = v.Vendedor.split(' ')[0];
                            return codigosPermitidos.includes(codigoVendedor);
                        });
                    }
                }

                setData(reportData);
                setActiveTab("todos");
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

    useEffect(() => {
        if (auth.user !== undefined) {
            fetchReport();
        }
    }, [auth.user])

    const filteredClientOptions = useMemo(() => {
        if (!searchClienteQuery) return clientesOptions;
        return clientesOptions.filter(cliente =>
            cliente.nombre.toLowerCase().includes(searchClienteQuery.toLowerCase())
        );
    }, [clientesOptions, searchClienteQuery]);

    const tabValues = ["todos", ...data.map(v => v.Vendedor)];

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
                            <ExportExpiredBalancesPdf data={finalVisibleData} disabled={loading || finalVisibleData.length === 0} />
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-12 gap-4 items-end">
                        <div className="relative space-y-2 sm:col-span-5">
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <Label htmlFor="zona">Zona</Label>
                            </div>
                            <Popover open={openZona} onOpenChange={setOpenZona}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between h-10">
                                        <span className="truncate">
                                            {selectedZona ? zonasOptions.find(z => z.id === selectedZona)?.nombre : 'Todas las zonas'}
                                        </span>
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50">
                                    <Command>
                                        <CommandInput placeholder="Buscar zona..." />
                                        <CommandList>
                                            <CommandEmpty>No se encontraron zonas en esta vista.</CommandEmpty>
                                            <CommandGroup>
                                                {zonasOptions.map((zona) => (
                                                    <CommandItem
                                                        key={zona.id}
                                                        value={zona.nombre}
                                                        onSelect={() => {
                                                            setSelectedZona(selectedZona === zona.id ? "" : zona.id)
                                                            setSelectedCliente("")
                                                            setOpenZona(false)
                                                        }}
                                                    >
                                                        <Check className={cn('mr-2 h-4 w-4 flex-shrink-0', selectedZona === zona.id ? 'opacity-100' : 'opacity-0')} />
                                                        <span className="truncate">{zona.nombre}</span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

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
                                                {selectedCliente ? clientesOptions.find(c => c.id === selectedCliente)?.nombre : "Todos los cliente-cobranza"}
                                            </span>
                                            {!selectedCliente && <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                                        </Button>
                                    </PopoverTrigger>

                                    {selectedCliente && (
                                        <div
                                            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-md z-10"
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedCliente(""); setSearchClienteQuery(""); }}
                                        >
                                            <X className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>

                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput placeholder="Buscar cliente..." value={searchClienteQuery} onValueChange={setSearchClienteQuery} />
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
                                                        <Check className={cn("mr-2 h-4 w-4 flex-shrink-0", selectedCliente === cliente.id ? "opacity-100" : "opacity-0")} />
                                                        <span className="truncate">{cliente.nombre}</span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {(selectedZona || selectedCliente || activeTab !== "todos") && (
                        <div className="text-sm text-muted-foreground mt-2">
                            Mostrando {finalVisibleData.reduce((acc, v) => acc + v.zonas.reduce((acc2, z) => acc2 + z.clientes.length, 0), 0)} de {data.reduce((acc, v) => acc + v.zonas.reduce((acc2, z) => acc2 + z.clientes.length, 0), 0)} clientes
                        </div>
                    )}
                </CardHeader>

                <CardContent className="p-4 md:p-6">
                    {loading ? (
                        <div className="py-4"><ZoneReportSkeleton /></div>
                    ) : finalVisibleData.length > 0 || tabFilteredData.length > 0 ? (
                        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                            <TabsList className="flex flex-wrap h-auto w-full gap-2 mb-6 p-1 bg-slate-100/50 justify-start">
                                <TabsTrigger value="todos" className="whitespace-normal h-auto py-2 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700">
                                    Todos
                                </TabsTrigger>
                                {data.map((vendedor, index) => (
                                    <TabsTrigger key={index} value={vendedor.Vendedor} className="whitespace-normal h-auto py-2 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700">
                                        {vendedor.Vendedor.length > 18 ? vendedor.Vendedor.slice(0, 18) + '...' : vendedor.Vendedor}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {tabValues.map((tabValue) => (
                                <TabsContent key={tabValue} value={tabValue} className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                                    {finalVisibleData.length > 0 ? (
                                        <div className="space-y-6">
                                            {finalVisibleData.map((vendedor, vIdx) => (
                                                <div key={vIdx} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                                                    <div className="bg-indigo-600 text-white p-3 md:p-4 font-bold text-base md:text-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
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
                                                                        <div key={cIdx} className="bg-white p-3 md:p-4 rounded-md border border-slate-200 shadow-sm">
                                                                            <div className="mb-3">
                                                                                <p className="font-bold text-sm text-slate-900">{cliente.Cliente}</p>
                                                                                <p className="text-xs text-slate-500">{cliente.Direccion}</p>
                                                                            </div>

                                                                            <div className="hidden md:block overflow-x-auto">
                                                                                <table className="w-full text-xs text-left">
                                                                                    <thead className="text-slate-500 border-b border-slate-200 bg-slate-50">
                                                                                    <tr>
                                                                                        <th className="font-semibold py-2 px-2 whitespace-nowrap">Emisión</th>
                                                                                        <th className="font-semibold py-2 px-2 whitespace-nowrap">F. Vcto.</th>
                                                                                        <th className="font-semibold py-2 px-2 text-center whitespace-nowrap">Días Venc.</th>
                                                                                        <th className="font-semibold py-2 px-2 whitespace-nowrap">Documento</th>
                                                                                        <th className="font-semibold py-2 px-2 whitespace-nowrap">Tipo</th>
                                                                                        <th className="font-semibold py-2 px-2 text-right whitespace-nowrap">Saldo (S/)</th>
                                                                                    </tr>
                                                                                    </thead>
                                                                                    <tbody className="divide-y divide-slate-100 font-mono">
                                                                                    {cliente.documentos.map((doc, dIdx) => {
                                                                                        const dias = calcDiasVencidos(doc.Fecha_Vcto)
                                                                                        return (
                                                                                            <tr key={dIdx} className="hover:bg-slate-50/80">
                                                                                                <td className="py-2 px-2 whitespace-nowrap">{fmtFecha(doc.Fecha_Emision)}</td>
                                                                                                <td className="py-2 px-2 whitespace-nowrap text-slate-600">{fmtFecha(doc.Fecha_Vcto)}</td>
                                                                                                <td className="py-2 px-2 text-center whitespace-nowrap">
                                                                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${dias > 90 ? 'bg-red-100 text-red-700' : dias > 30 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                                                        {dias}d
                                                                                                    </span>
                                                                                                </td>
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
                                                                                        )
                                                                                    })}
                                                                                    </tbody>
                                                                                    <tfoot>
                                                                                        <tr className="border-t-2 border-slate-200 bg-slate-50">
                                                                                            <td colSpan={5} className="py-1.5 px-2 text-[11px] font-bold text-slate-500 text-right">
                                                                                                Total cliente:
                                                                                            </td>
                                                                                            <td className="py-1.5 px-2 text-right font-bold text-red-600 whitespace-nowrap text-xs">
                                                                                                S/ {cliente.totalSolesCliente.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                                                                            </td>
                                                                                        </tr>
                                                                                    </tfoot>
                                                                                </table>
                                                                            </div>

                                                                            <div className="grid grid-cols-1 gap-2 md:hidden">
                                                                                {cliente.documentos.map((doc, dIdx) => {
                                                                                    const dias = calcDiasVencidos(doc.Fecha_Vcto)
                                                                                    return (
                                                                                        <div key={dIdx} className="flex justify-between items-start border border-slate-100 bg-slate-50 rounded p-2 gap-2">
                                                                                            <div className="space-y-1 flex-1">
                                                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                                                    <span className="font-mono font-bold text-sm text-slate-800">{doc.Serie_Numero}</span>
                                                                                                    <span className="bg-slate-200 px-1.5 py-0.5 rounded text-[10px] text-slate-600 font-medium">{doc.Abreviatura}</span>
                                                                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${dias > 90 ? 'bg-red-100 text-red-700' : dias > 30 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                                                        {dias}d venc.
                                                                                                    </span>
                                                                                                </div>
                                                                                                <p className="text-xs text-slate-500">Emisión: {fmtFecha(doc.Fecha_Emision)}</p>
                                                                                                <p className="text-xs text-slate-500">Vcto: {fmtFecha(doc.Fecha_Vcto)}</p>
                                                                                            </div>
                                                                                            <div className="text-right shrink-0">
                                                                                                <p className="text-[10px] uppercase text-slate-400 font-bold mb-0.5">Saldo</p>
                                                                                                <p className="font-bold text-red-600 text-sm">S/ {doc.Saldo_Soles.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                    )
                                                                                })}
                                                                                <div className="flex justify-between items-center bg-slate-100 border border-slate-200 rounded px-3 py-1.5 mt-1">
                                                                                    <span className="text-[11px] font-bold text-slate-500">Total cliente</span>
                                                                                    <span className="font-bold text-red-600 text-xs">S/ {cliente.totalSolesCliente.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                                                                                </div>
                                                                            </div>

                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Total vendedor */}
                                                    <div className="flex items-center justify-between bg-indigo-700 text-white px-4 py-2.5 rounded-b-lg">
                                                        <span className="text-sm font-bold tracking-wide uppercase">Total vencido</span>
                                                        <span className="font-mono font-bold text-base">
                                                            S/ {vendedor.totalSolesVendedor.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-sm text-gray-500 py-16 flex flex-col items-center">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                                <Search className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <p className="font-medium text-slate-600">No hay resultados con los filtros actuales</p>
                                            <p className="text-xs mt-1">Intenta ajustar los filtros de zona o cliente.</p>
                                        </div>
                                    )}
                                </TabsContent>
                            ))}
                        </Tabs>
                    ) : (
                        <div className="text-center text-sm text-gray-500 py-16 flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <RefreshCcw className="h-8 w-8 text-slate-300" />
                            </div>
                            <p className="font-medium text-slate-600">No hay documentos vencidos para mostrar</p>
                            <p className="text-xs mt-1">Actualiza el reporte para cargar los datos</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}