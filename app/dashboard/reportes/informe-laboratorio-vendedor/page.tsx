'use client'

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Check, ChevronDown, FlaskConical, Search, Users, X, Calendar as CalendarIcon, Eye, Loader2 } from "lucide-react"
import { toast } from "@/app/hooks/use-toast"
import { useAuth } from "@/context/authContext"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import apiClient from '@/app/api/client'

import { ExportLabSellerPdf, LabSellerReportData } from "@/components/reporte/exportLabSellerPdf"
import { ExportDetalleLabVendedorPdf } from "@/components/reporte/exportDetalleLabVendedorPdf"
import {Laboratorio} from "@/app/types/user-types";

export default function LabSellerReportPage() {
    const auth = useAuth()
    const isManagerOrAdmin = auth.isAdmin();
    const isRepresentative = auth.isRepresentante();
    const isVendor = auth.isVendedor();

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<LabSellerReportData[]>([]);

    const [catLaboratorios, setCatLaboratorios] = useState<Laboratorio[]>([]);
    const [catVendedores, setCatVendedores] = useState<any[]>([]);

    const [selectedLabs, setSelectedLabs] = useState<number[]>([]);
    const [selectedVends, setSelectedVends] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const [openLab, setOpenLab] = useState(false);
    const [openVend, setOpenVend] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailData, setDetailData] = useState<any>(null);

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
            const anioSeleccionado = selectedDate.getFullYear();
            const mesSeleccionado = selectedDate.getMonth() + 1;

            let vendorsToQuery: string[] = [];

            if (selectedVends.length > 0) {
                vendorsToQuery = selectedVends;
            } else {
                if (isManagerOrAdmin) {
                    vendorsToQuery = [];
                } else if (isRepresentative) {
                    vendorsToQuery = auth.user?.vendedores?.map(v => v.codigo) || [];
                    if (vendorsToQuery.length === 0) vendorsToQuery = ['SIN_VENDEDORES'];
                } else if (isVendor) {
                    vendorsToQuery = auth.user?.codigo ? [auth.user.codigo] : [];
                }
            }

            const payload = {
                laboratorios: selectedLabs.length > 0 ? selectedLabs : [],
                vendedores: vendorsToQuery,
                anio: anioSeleccionado,
                mes: mesSeleccionado
            };

            const response = await apiClient.post('/reportes/informe-laboratorio-vendedor', payload);

            let reportData = response.data?.data || [];
            if (isRepresentative && vendorsToQuery.length > 0 && vendorsToQuery[0] !== 'SIN_VENDEDORES') {
                reportData = reportData.map((lab: any) => ({
                    ...lab,
                    vendedores: lab.vendedores.filter((v: any) => vendorsToQuery.includes(v.Codigo_Vend))
                })).map((lab: any) => ({
                    ...lab,
                    totalVentasLaboratorio: lab.vendedores.reduce((acc: number, v: any) => acc + v.SumaDeVta_Tot, 0)
                })).filter((lab: any) => lab.vendedores.length > 0);
            } else if (isVendor && auth.user?.codigo) {
                reportData = reportData.map((lab: any) => ({
                    ...lab,
                    vendedores: lab.vendedores.filter((v: any) => v.Codigo_Vend === auth.user?.codigo)
                })).map((lab: any) => ({
                    ...lab,
                    totalVentasLaboratorio: lab.vendedores.reduce((acc: number, v: any) => acc + v.SumaDeVta_Tot, 0)
                })).filter((lab: any) => lab.vendedores.length > 0);
            }

            setData(reportData);

            if(reportData.length === 0) {
                toast({ description: "No se encontraron datos en este periodo" });
            }
        } catch (error) {
            console.error("Error buscando el reporte:", error);
            toast({ title: "Error", description: "No se pudo generar el reporte", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    const openDetailModal = async (labName: string, vendCodigo: string) => {
        const foundLab = catLaboratorios.find(l => `${l.Codigo_Linea} ${l.Descripcion}` === labName);
        if (!foundLab) {
            toast({ description: "Error al identificar el laboratorio.", variant: "destructive" });
            return;
        }

        setModalOpen(true);
        setDetailLoading(true);
        setDetailData(null);

        try {
            const anio = selectedDate.getFullYear();
            const mes = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const fechaStr = `${anio}-${mes}-01`;

            const res = await apiClient.post('/reportes/detalle-laboratorio-vendedor', {
                fecha: fechaStr,
                id_laboratorio: foundLab.IdLineaGe,
                codigo_vendedor: vendCodigo
            });

            if (res.data?.data && res.data.data.length > 0) {
                setDetailData(res.data.data);
            } else {
                toast({ description: "No hay detalle de ítems para mostrar." });
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudo cargar el detalle", variant: "destructive" });
        } finally {
            setDetailLoading(false);
        }
    };

    const toggleLab = (id: number) => setSelectedLabs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const toggleVend = (cod: string) => setSelectedVends(prev => prev.includes(cod) ? prev.filter(x => x !== cod) : [...prev, cod]);

    const formatMoney = (amount: number) => amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="grid gap-6 p-4 md:p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Ventas por Vendedor</h1>
                <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">Consulta las ventas agrupadas por laboratorio y vendedor del mes seleccionado.</p>
            </div>

            <Card className="shadow-md">
                <CardHeader className="bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <div className={`flex flex-col gap-2 ${isManagerOrAdmin ? 'md:col-span-3' : 'md:col-span-4'}`}>
                            <label className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-gray-300">
                                <CalendarIcon className="w-4 h-4 "/> Periodo (Mes y Año)
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-white dark:bg-gray-900 h-10", !selectedDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                        {selectedDate ? format(selectedDate, "MMMM yyyy", { locale: es }).replace(/^\w/, (c) => c.toUpperCase()) : <span>Seleccionar mes</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 z-50" align="start">
                                    <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} initialFocus locale={es} />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className={`flex flex-col gap-2 ${isManagerOrAdmin ? 'md:col-span-3' : 'md:col-span-4'}`}>
                            <label className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-gray-300">
                                <FlaskConical className="w-4 h-4 "/> Laboratorios
                            </label>
                            <Popover open={openLab} onOpenChange={setOpenLab}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="justify-between w-full h-auto min-h-10 px-3 py-2 bg-white dark:bg-gray-900">
                                        <div className="flex flex-wrap gap-1 items-center">
                                            {selectedLabs.length > 0 ? <span className="text-sm font-semibold text-blue-700">{selectedLabs.length} seleccionado(s)</span> : <span className="text-muted-foreground text-sm font-normal">Todos...</span>}
                                        </div>
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0 z-50" align="start">
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
                                                {found.Descripcion} <X className="ml-1.5 h-3 w-3 cursor-pointer hover:text-red-500 hover:bg-red-100 rounded-full" onClick={() => toggleLab(id)} />
                                            </Badge>
                                        ) : null;
                                    })}
                                    <span className="text-xs text-slate-500 dark:text-gray-400 cursor-pointer hover:text-slate-800 dark:hover:text-gray-200 hover:underline pt-1 ml-1 font-medium" onClick={() => setSelectedLabs([])}>Limpiar</span>
                                </div>
                            )}
                        </div>

                        {isManagerOrAdmin && (
                            <div className="md:col-span-3 flex flex-col gap-2">
                                <label className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-gray-300">
                                    <Users className="w-4 h-4"/> Vendedores
                                </label>
                                <Popover open={openVend} onOpenChange={setOpenVend}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="justify-between w-full h-auto min-h-10 px-3 py-2 bg-white dark:bg-gray-900">
                                            <div className="flex flex-wrap gap-1 items-center">
                                                {selectedVends.length > 0 ? <span className="text-sm font-semibold text-orange-700">{selectedVends.length} seleccionado(s)</span> : <span className="text-muted-foreground text-sm font-normal">Todos...</span>}
                                            </div>
                                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0 z-50" align="start">
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
                                                    {found.Nombres || found.nombres} <X className="ml-1.5 h-3 w-3 cursor-pointer hover:text-red-500 hover:bg-red-100 rounded-full" onClick={() => toggleVend(cod)} />
                                                </Badge>
                                            ) : null;
                                        })}
                                        <span className="text-xs text-slate-500 dark:text-gray-400 cursor-pointer hover:text-slate-800 dark:hover:text-gray-200 hover:underline pt-1 ml-1 font-medium" onClick={() => setSelectedVends([])}>Limpiar</span>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className={`flex flex-col sm:flex-row gap-3 pt-6 md:justify-end ${isManagerOrAdmin ? 'md:col-span-3' : 'md:col-span-4'}`}>
                            <Button onClick={handleSearch} disabled={loading} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto shadow-sm h-10">
                                <Search className="mr-2 h-4 w-4" /> Buscar
                            </Button>
                            <ExportLabSellerPdf data={data} disabled={loading || data.length === 0} />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4 md:p-6 bg-slate-100/50 dark:bg-gray-800/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-slate-500 dark:text-gray-400 font-medium">Generando reporte, por favor espera...</p>
                        </div>
                    ) : data.length > 0 ? (
                        <div className="space-y-6">
                            {data.map((lab, idx) => (
                                <div key={idx} className="border border-slate-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-900">
                                    <div className="bg-indigo-600 text-white p-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                        <span className="text-lg font-bold text-center sm:text-left">{lab.Laboratorio}</span>
                                        <Badge className="text-[10px] sm:text-xs font-medium bg-indigo-800/60 hover:bg-indigo-800/60 text-indigo-50 border-none w-fit mx-auto sm:mx-0">
                                            Mes: {lab.Mes} | Año: {lab.Año}
                                        </Badge>
                                    </div>

                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
                                            <thead className="text-xs text-slate-500 dark:text-gray-400 uppercase bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
                                            <tr>
                                                <th className="px-4 py-3 font-bold min-w-[120px]">Cód Vendedor</th>
                                                <th className="px-4 py-3 font-bold min-w-[200px]">Nombre Vendedor</th>
                                                <th className="px-4 py-3 font-bold text-right min-w-[150px]">Ventas (S/.)</th>
                                                <th className="px-4 py-3 font-bold text-center w-[120px]">Acciones</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {lab.vendedores.map((vend, vIdx) => {
                                                const nombreLimpio = vend.Vendedor.substring(vend.Codigo_Vend.length).trim();
                                                return (
                                                    <tr key={vIdx} className="bg-white dark:bg-gray-900 border-b border-slate-100 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                                        <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-gray-100">{vend.Codigo_Vend}</td>
                                                        <td className="px-4 py-3 text-slate-700 dark:text-gray-300">{nombreLimpio}</td>
                                                        <td className="px-4 py-3 text-right font-semibold text-slate-800 dark:text-gray-200">
                                                            S/ {formatMoney(vend.SumaDeVta_Tot)}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Button size="sm" variant="ghost" className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50" onClick={() => openDetailModal(lab.Laboratorio, vend.Codigo_Vend)}>
                                                                <Eye className="w-4 h-4 mr-1"/> Detalle
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                            </tbody>
                                            <tfoot>
                                            <tr className="bg-emerald-50/50 dark:bg-emerald-900/20">
                                                <td colSpan={2} className="px-4 py-4 text-right text-emerald-800 dark:text-emerald-300 uppercase tracking-wider text-xs font-bold">
                                                    Total Ventas:
                                                </td>
                                                <td className="px-4 py-4 text-right text-emerald-700 dark:text-emerald-400 text-base font-bold">
                                                    S/ {formatMoney(lab.totalVentasLaboratorio)}
                                                </td>
                                                <td></td>
                                            </tr>
                                            </tfoot>
                                        </table>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 p-4 md:hidden bg-slate-50 dark:bg-gray-800">
                                        {lab.vendedores.map((vend, vIdx) => {
                                            const nombreLimpio = vend.Vendedor.substring(vend.Codigo_Vend.length).trim();
                                            return (
                                                <div key={vIdx} className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-slate-200 dark:border-gray-700 shadow-sm flex flex-col gap-2">
                                                    <div className="flex justify-between items-start">
                                                        <span className="font-bold text-sm text-slate-800 dark:text-gray-200 pr-2">{nombreLimpio}</span>
                                                        <span className="font-mono text-[10px] text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-gray-800 px-2 py-1 rounded font-bold whitespace-nowrap">
                                                            {vend.Codigo_Vend}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center border-t border-slate-100 dark:border-gray-700 pt-2 mt-1">
                                                        <span className="text-xs uppercase text-slate-400 dark:text-gray-500 font-bold">Ventas:</span>
                                                        <span className="font-bold text-indigo-700 text-sm">
                                                            S/ {formatMoney(vend.SumaDeVta_Tot)}
                                                        </span>
                                                    </div>
                                                    <Button variant="outline" size="sm" className="w-full mt-2 text-indigo-600 border-indigo-200 bg-indigo-50/50" onClick={() => openDetailModal(lab.Laboratorio, vend.Codigo_Vend)}>
                                                        <Eye className="w-4 h-4 mr-2"/> Ver Detalle
                                                    </Button>
                                                </div>
                                            )
                                        })}

                                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 rounded-lg p-3 mt-2 flex flex-col items-center shadow-sm">
                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Total Ventas Laboratorio</span>
                                            <span className="font-black text-emerald-800 dark:text-emerald-300 text-lg">
                                                S/ {formatMoney(lab.totalVentasLaboratorio)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-900 rounded-lg border-2 border-dashed border-slate-200 dark:border-gray-700">
                            <p className="text-slate-500 dark:text-gray-400 font-medium text-center px-4">
                                No hay datos de ventas para mostrar con los filtros seleccionados.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col bg-slate-50 dark:bg-gray-800 p-0">
                    <DialogHeader className="p-4 md:p-6 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700 flex-shrink-0">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <DialogTitle className="text-xl text-indigo-800">Detalle de Ventas por Laboratorio</DialogTitle>
                                {detailData && detailData.length > 0 && (
                                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 font-medium">{detailData[0].Vendedor} | {detailData[0].Laboratorios[0].Laboratorio}</p>
                                )}
                            </div>
                            <ExportDetalleLabVendedorPdf data={detailData} disabled={detailLoading || !detailData} />
                        </div>
                    </DialogHeader>

                    <div className="overflow-y-auto p-4 md:p-6 flex-1 custom-scrollbar">
                        {detailLoading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
                                <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Cargando detalle...</p>
                            </div>
                        ) : detailData && detailData.length > 0 ? (
                            <div className="space-y-6">
                                {detailData[0].Laboratorios[0].Clientes.map((cli: any, cIdx: number) => (
                                    <div key={cIdx} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
                                        <div className="bg-slate-100 dark:bg-gray-800 p-3 border-b border-slate-200 dark:border-gray-700">
                                            <p className="text-sm font-bold text-slate-800 dark:text-gray-200">{cli.Codigo} | {cli.Nombre}</p>
                                            {cli.NombreComercial && <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{cli.NombreComercial}</p>}
                                        </div>
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full text-xs text-left text-slate-600 dark:text-gray-400">
                                                <thead className="bg-white dark:bg-gray-900 border-b border-slate-100 dark:border-gray-700">
                                                <tr>
                                                    <th className="px-3 py-2 font-semibold">Cód. Art</th>
                                                    <th className="px-3 py-2 font-semibold text-center">Cant</th>
                                                    <th className="px-3 py-2 font-semibold text-center">U.M.</th>
                                                    <th className="px-3 py-2 font-semibold">Descripción</th>
                                                    <th className="px-3 py-2 font-semibold text-right">Total S/.</th>
                                                </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                {cli.Items.map((item: any, iIdx: number) => (
                                                    <tr key={iIdx} className="hover:bg-slate-50">
                                                        <td className="px-3 py-2 font-mono text-slate-500">{item.Codigo_Art}</td>
                                                        <td className="px-3 py-2 text-center font-medium">{item.Cantidad_Sal}</td>
                                                        <td className="px-3 py-2 text-center text-[10px] uppercase">{item.AbrevUnidMed}</td>
                                                        <td className="px-3 py-2">{item.NombreItem}</td>
                                                        <td className="px-3 py-2 text-right font-semibold text-slate-800">{formatMoney(item.SumaDeVta_Tot)}</td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                                <tfoot className="bg-indigo-50/50">
                                                <tr>
                                                    <td colSpan={4} className="px-3 py-2 text-right text-indigo-800 text-xs font-bold uppercase tracking-wider">Total Cliente:</td>
                                                    <td className="px-3 py-2 text-right text-indigo-700 font-bold">{formatMoney(cli.TotalCliente)}</td>
                                                </tr>
                                                </tfoot>
                                            </table>
                                        </div>

                                        <div className="md:hidden grid grid-cols-1 gap-2 p-3 bg-slate-50">
                                            {cli.Items.map((item: any, iIdx: number) => (
                                                <div key={iIdx} className="bg-white border border-slate-100 rounded p-2 flex flex-col gap-1">
                                                    <span className="text-xs font-medium text-slate-700">{item.NombreItem}</span>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <div className="flex gap-2">
                                                            <Badge variant="outline" className="text-[10px] bg-slate-100">{item.Cantidad_Sal} {item.AbrevUnidMed}</Badge>
                                                        </div>
                                                        <span className="text-sm font-bold text-indigo-700">S/ {formatMoney(item.SumaDeVta_Tot)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="flex justify-between items-center pt-2 mt-1 border-t border-indigo-100">
                                                <span className="text-xs font-bold text-indigo-800 uppercase">Total Cliente</span>
                                                <span className="text-sm font-black text-indigo-700">S/ {formatMoney(cli.TotalCliente)}</span>
                                            </div>
                                        </div>

                                    </div>
                                ))}

                                <div className="flex flex-col sm:flex-row justify-end gap-4 border-t border-slate-200 pt-4 mt-4">
                                    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-right">
                                        <p className="text-[10px] font-bold text-indigo-500 uppercase">Total Vendedor</p>
                                        <p className="text-lg font-black text-indigo-900">S/ {formatMoney(detailData[0].TotalVendedor)}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16">
                                <p className="text-slate-500 font-medium">No se encontraron detalles para este vendedor.</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}