'use client'

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Check, ChevronDown, FlaskConical, Search, Users, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/context/authContext"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import apiClient from '@/app/api/client'

import { ExportLabSellerPdf, LabSellerReportData } from "@/components/reporte/exportLabSellerPdf"

export default function LabSellerReportPage() {
    const auth = useAuth()
    const isManagerOrAdmin = [2, 3].includes(auth.user?.idRol || 0);

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<LabSellerReportData[]>([]);

    const [catLaboratorios, setCatLaboratorios] = useState<any[]>([]);
    const [catVendedores, setCatVendedores] = useState<any[]>([]);

    const [selectedLabs, setSelectedLabs] = useState<number[]>([]);
    const [selectedVends, setSelectedVends] = useState<string[]>([]);

    const [openLab, setOpenLab] = useState(false);
    const [openVend, setOpenVend] = useState(false);

    useEffect(() => {
        const fetchCatalogs = async () => {
            try {
                const resLabs = await apiClient.get('/price/laboratories');
                setCatLaboratorios(resLabs.data?.data || []);

                if (isManagerOrAdmin) {
                    const resVends = await apiClient.get('/usuarios/listar/vendedores');
                    const vendsList = resVends.data?.data?.data || resVends.data?.data || [];
                    setCatVendedores(vendsList);
                } else {
                    if(auth.user?.codigo) setSelectedVends([auth.user.codigo]);
                }
            } catch (error) {
                console.error("Error cargando catálogos", error);
            }
        };

        fetchCatalogs();
    }, [isManagerOrAdmin, auth.user]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const payload = {
                laboratorios: selectedLabs.length > 0 ? selectedLabs : [],
                vendedores: selectedVends.length > 0 ? selectedVends : []
            };

            const response = await apiClient.post('/reportes/informe-laboratorio-vendedor', payload);
            setData(response.data?.data || []);

            if(response.data?.data?.length === 0) {
                toast({ description: "No se encontraron datos en este periodo" });
            }
        } catch (error) {
            console.error("Error buscando el reporte:", error);
            toast({ title: "Error", description: "No se pudo generar el reporte", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    const toggleLab = (id: number) => {
        setSelectedLabs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }

    const toggleVend = (cod: string) => {
        setSelectedVends(prev => prev.includes(cod) ? prev.filter(x => x !== cod) : [...prev, cod]);
    }

    return (
        <div className="grid gap-6 p-4 md:p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Informe por Laboratorio y Vendedor</h1>
                <p className="text-sm md:text-base text-gray-500">Consulta las ventas agrupadas por laboratorio y vendedor del mes actual.</p>
            </div>

            <Card className="shadow-md">
                <CardHeader className="bg-slate-50 border-b border-slate-200 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <div className="md:col-span-4 flex flex-col gap-2">
                            <label className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                                <FlaskConical className="w-4 h-4 "/> Laboratorios
                            </label>
                            <Popover open={openLab} onOpenChange={setOpenLab}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="justify-between w-full h-auto min-h-10 px-3 py-2 bg-white">
                                        <div className="flex flex-wrap gap-1 items-center">
                                            {selectedLabs.length > 0
                                                ? <span className="text-sm font-semibold text-blue-700">{selectedLabs.length} seleccionado(s)</span>
                                                : <span className="text-muted-foreground text-sm font-normal">Todos los laboratorios...</span>
                                            }
                                        </div>
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Buscar laboratorio..." />
                                        <CommandList>
                                            <CommandEmpty>No se encontró laboratorio.</CommandEmpty>
                                            <CommandGroup>
                                                {catLaboratorios.map((lab) => (
                                                    <CommandItem key={lab.IdLineaGe} onSelect={() => toggleLab(lab.IdLineaGe)}>
                                                        <Check className={cn("mr-2 h-4 w-4", selectedLabs.includes(lab.IdLineaGe) ? "opacity-100" : "opacity-0")}/>
                                                        {lab.Descripcion}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {selectedLabs.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {selectedLabs.map(id => {
                                        const found = catLaboratorios.find(l => l.IdLineaGe === id);
                                        return found ? (
                                            <Badge key={id} variant="secondary" className="text-[10px] md:text-xs px-2 py-0.5 font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
                                                {found.Descripcion}
                                                <X className="ml-1.5 h-3 w-3 cursor-pointer hover:text-red-500 hover:bg-red-100 rounded-full" onClick={() => toggleLab(id)} />
                                            </Badge>
                                        ) : null;
                                    })}
                                    <span className="text-xs text-slate-500 cursor-pointer hover:text-slate-800 hover:underline pt-1 ml-1 font-medium" onClick={() => setSelectedLabs([])}>Limpiar todo</span>
                                </div>
                            )}
                        </div>
                        {isManagerOrAdmin && (
                            <div className="md:col-span-4 flex flex-col gap-2">
                                <label className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                                    <Users className="w-4 h-4"/> Vendedores
                                </label>
                                <Popover open={openVend} onOpenChange={setOpenVend}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="justify-between w-full h-auto min-h-10 px-3 py-2 bg-white">
                                            <div className="flex flex-wrap gap-1 items-center">
                                                {selectedVends.length > 0
                                                    ? <span className="text-sm font-semibold text-orange-700">{selectedVends.length} seleccionado(s)</span>
                                                    : <span className="text-muted-foreground text-sm font-normal">Todos los vendedores...</span>
                                                }
                                            </div>
                                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Buscar vendedor..." />
                                            <CommandList>
                                                <CommandEmpty>No se encontró vendedor.</CommandEmpty>
                                                <CommandGroup>
                                                    {catVendedores.map((vend) => (
                                                        <CommandItem key={vend.Codigo_Vend || vend.codigo} onSelect={() => toggleVend(vend.Codigo_Vend || vend.codigo)}>
                                                            <Check className={cn("mr-2 h-4 w-4", selectedVends.includes(vend.Codigo_Vend || vend.codigo) ? "opacity-100" : "opacity-0")}/>
                                                            {vend.Nombres || vend.nombres} {vend.Apellidos || vend.apellidos}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {selectedVends.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {selectedVends.map(cod => {
                                            const found = catVendedores.find(v => (v.Codigo_Vend || v.codigo) === cod);
                                            return found ? (
                                                <Badge key={cod} variant="secondary" className="text-[10px] md:text-xs px-2 py-0.5 font-medium bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200">
                                                    {found.Nombres || found.nombres}
                                                    <X className="ml-1.5 h-3 w-3 cursor-pointer hover:text-red-500 hover:bg-red-100 rounded-full" onClick={() => toggleVend(cod)} />
                                                </Badge>
                                            ) : null;
                                        })}
                                        <span className="text-xs text-slate-500 cursor-pointer hover:text-slate-800 hover:underline pt-1 ml-1 font-medium" onClick={() => setSelectedVends([])}>Limpiar todo</span>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className={`flex flex-col sm:flex-row gap-3 pt-6 md:justify-end ${isManagerOrAdmin ? 'md:col-span-4' : 'md:col-span-8'}`}>
                            <Button onClick={handleSearch} disabled={loading} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto shadow-sm">
                                <Search className="mr-2 h-4 w-4" /> Buscar
                            </Button>
                            <ExportLabSellerPdf data={data} disabled={loading || data.length === 0} />
                        </div>

                    </div>
                </CardHeader>

                <CardContent className="p-4 md:p-6 bg-slate-100/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-slate-500 font-medium">Generando reporte, por favor espera...</p>
                        </div>
                    ) : data.length > 0 ? (
                        <div className="space-y-6">
                            {data.map((lab, idx) => (
                                <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white">
                                    <div className="bg-indigo-600 text-white p-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                        <span className="text-lg font-bold">{lab.Laboratorio}</span>
                                        <Badge className="text-[10px] sm:text-xs font-medium bg-indigo-800/60 hover:bg-indigo-800/60 text-indigo-50 border-none w-fit">
                                            Mes: {lab.Mes} | Año: {lab.Año}
                                        </Badge>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left text-gray-600">
                                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3 font-bold min-w-[120px]">Cód Vendedor</th>
                                                <th className="px-4 py-3 font-bold min-w-[200px]">Nombre Vendedor</th>
                                                <th className="px-4 py-3 font-bold text-right min-w-[150px]">Ventas (S/.)</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {lab.vendedores.map((vend, vIdx) => {
                                                const nombreLimpio = vend.Vendedor.substring(vend.Codigo_Vend.length).trim();
                                                return (
                                                    <tr key={vIdx} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-3 font-mono font-medium text-slate-900">{vend.Codigo_Vend}</td>
                                                        <td className="px-4 py-3 text-slate-700">{nombreLimpio}</td>
                                                        <td className="px-4 py-3 text-right font-semibold text-slate-800">
                                                            S/ {vend.SumaDeVta_Tot.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                            </tbody>
                                            <tfoot>
                                            <tr className="bg-emerald-50/50">
                                                <td colSpan={2} className="px-4 py-4 text-right text-emerald-800 uppercase tracking-wider text-xs font-bold">
                                                    Total Ventas:
                                                </td>
                                                <td className="px-4 py-4 text-right text-emerald-700 text-base font-bold">
                                                    S/ {lab.totalVentasLaboratorio.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border-2 border-dashed border-slate-200">
                            <p className="text-slate-500 font-medium text-center px-4">
                                No hay datos de ventas para mostrar con los filtros seleccionados.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}