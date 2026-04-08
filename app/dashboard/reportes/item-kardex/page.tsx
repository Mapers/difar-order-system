'use client'

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Search, Calendar as CalendarIcon, Package, FileText } from "lucide-react"
import { toast } from "@/app/hooks/useToast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

import apiClient from '@/app/api/client'
import { getProductsRequest } from "@/app/api/products"

import { ExportItemKardexPdf, KardexItemData } from "@/components/reporte/ExportItemKardexPdf"

interface Producto {
    IdArticulo: number;
    Codigo_Art: string;
    NombreItem: string;
    Stock: string;
    Presentacion: string;
    PUContado: string;
    PUCredito: string;
    PUPorMayor: string;
    PUPorMenor: string;
}

export default function ItemKardexReportPage() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<KardexItemData[]>([]);

    const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [endDate, setEndDate] = useState<Date>(new Date());

    const [allProducts, setAllProducts] = useState<Producto[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [productSearchQuery, setProductSearchQuery] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
    const [popoverOpen, setPopoverOpen] = useState(false);

    const fetchAllProducts = async () => {
        try {
            setProductsLoading(true);
            const response = await getProductsRequest();
            setAllProducts(response.data?.data?.data || response.data?.data || []);
        } catch (error) {
            console.error("Error fetching all products:", error);
            setAllProducts([]);
        } finally {
            setProductsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllProducts();
    }, []);

    const filteredAllProducts = allProducts.filter(product =>
        product.NombreItem.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        product.Codigo_Art.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        String(product?.Presentacion).toLowerCase().includes(productSearchQuery.toLowerCase())
    );

    const handleProductSelect = (product: Producto) => {
        setSelectedProduct(product);
        setPopoverOpen(false);
        setProductSearchQuery("");
    };

    const handleSearch = async () => {
        if (!selectedProduct) {
            toast({ title: "Atención", description: "Debes seleccionar un producto", variant: "warning" });
            return;
        }

        setLoading(true);
        try {
            const fechaIniStr = format(startDate, 'yyyy-MM-dd');
            const fechaFinStr = format(endDate, 'yyyy-MM-dd');

            const payload = {
                fecha_inicio: fechaIniStr,
                fecha_fin: fechaFinStr,
                codigo_articulo: selectedProduct.Codigo_Art
            };

            const response = await apiClient.post('/reportes/informe-kardex-item', payload);
            const reportData = response.data?.data || [];
            setData(reportData);

            if (reportData.length === 0) {
                toast({ description: "No se encontraron movimientos en este periodo.", variant: "warning" });
            }
        } catch (error) {
            console.error("Error buscando kardex:", error);
            toast({ title: "Error", description: "No se pudo generar el reporte", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const formatQty = (amount: number) => Number(amount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 4 });

    const totalIngresos = data.reduce((acc, curr) => acc + Number(curr.SumaDeCantidad_Ing || 0), 0);
    const totalSalidas = data.reduce((acc, curr) => acc + Number(curr.SumaDeCantidad_Sal || 0), 0);

    return (
        <div className="grid gap-6 p-4 md:p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Reporte Kardex Item</h1>
                <p className="text-sm md:text-base text-gray-500">
                    Registro de inventario permanente en unidades físicas por producto.
                </p>
            </div>

            <Card className="shadow-md">
                <CardHeader className="bg-slate-50 border-b border-slate-200 p-4 md:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
                        <div className="flex flex-col gap-2 lg:col-span-2">
                            <Label className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                                <CalendarIcon className="w-4 h-4 "/> Fecha Inicio
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-white h-12", !startDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                        {startDate ? format(startDate, "dd/MM/yyyy") : <span>Seleccionar</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 z-50" align="start">
                                    <Calendar mode="single" selected={startDate} onSelect={(date) => date && setStartDate(date)} initialFocus locale={es} />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex flex-col gap-2 lg:col-span-2">
                            <Label className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                                <CalendarIcon className="w-4 h-4 "/> Fecha Fin
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-white h-12", !endDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                        {endDate ? format(endDate, "dd/MM/yyyy") : <span>Seleccionar</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 z-50" align="start">
                                    <Calendar mode="single" selected={endDate} onSelect={(date) => date && setEndDate(date)} initialFocus locale={es} />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="lg:col-span-5 space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="product-search" className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                                    <Package className="w-4 h-4"/> Buscar Producto
                                </Label>
                                <div className="relative">
                                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={popoverOpen}
                                                className="w-full justify-between h-12 px-3 text-left font-normal text-sm min-h-12 bg-white"
                                            >
                                                {selectedProduct ? (
                                                    <div className="flex flex-col items-start min-w-0 flex-1 overflow-hidden">
                                                        <span className="font-bold text-slate-800 truncate w-full text-sm">
                                                            {selectedProduct.NombreItem}
                                                        </span>
                                                        <span className="text-xs text-gray-500 truncate w-full font-mono">
                                                            {selectedProduct.Codigo_Art} | {selectedProduct.Presentacion}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500 truncate">Buscar producto...</span>
                                                )}
                                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="p-0 w-[90vw] sm:w-[500px] max-w-[95vw] z-50"
                                            align="start"
                                            side="bottom"
                                        >
                                            <Command shouldFilter={false}>
                                                <CommandInput
                                                    placeholder="Buscar por código, nombre o laboratorio..."
                                                    value={productSearchQuery}
                                                    onValueChange={setProductSearchQuery}
                                                    className="text-sm h-11"
                                                />
                                                <CommandList className="max-h-[60vh] custom-scrollbar">
                                                    <CommandEmpty className="py-6 text-center text-slate-500">
                                                        {productsLoading ? "Buscando productos..." : "No se encontraron productos."}
                                                    </CommandEmpty>
                                                    <CommandGroup heading="Resultados" className="overflow-y-auto">
                                                        {filteredAllProducts.map((product) => (
                                                            <CommandItem
                                                                key={product.Codigo_Art}
                                                                value={product.Codigo_Art}
                                                                onSelect={() => handleProductSelect(product)}
                                                                className="py-2 sm:py-3 cursor-pointer"
                                                            >
                                                                <div className="flex items-start gap-2 w-full min-w-0">
                                                                    <div className="bg-blue-100 p-1.5 sm:p-2 rounded-md shrink-0 mt-0.5">
                                                                        <Package className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600"/>
                                                                    </div>
                                                                    <div className="flex flex-col flex-1 min-w-0">
                                                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start w-full gap-1 sm:gap-2">
                                                                            <span className="font-bold text-sm text-slate-800 break-words flex-1">
                                                                                {product.NombreItem}
                                                                            </span>
                                                                            <div className="flex flex-wrap gap-1 shrink-0">
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className="bg-green-50 text-green-700 text-xs"
                                                                                >
                                                                                    Stock: {product.Stock}
                                                                                </Badge>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center w-full mt-1 gap-1">
                                                                            <span className="text-xs text-slate-500 break-words font-mono">
                                                                                {product.Codigo_Art}
                                                                            </span>
                                                                            <span className="text-xs text-slate-500 break-words">
                                                                                Lab: {product.Presentacion}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex flex-col xs:flex-row xs:justify-between mt-2 text-xs gap-1">
                                                                            <span className="text-green-600 whitespace-nowrap font-medium">
                                                                                Contado: S/.{Number(product.PUContado).toFixed(2)}
                                                                            </span>
                                                                            <span className="text-blue-600 whitespace-nowrap font-medium">
                                                                                Crédito: S/.{Number(product.PUCredito).toFixed(2)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-3 flex flex-col sm:flex-row gap-3 md:justify-end">
                            <Button onClick={handleSearch} disabled={loading || !selectedProduct} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto h-12 shadow-sm">
                                <Search className="mr-2 h-4 w-4" /> Buscar
                            </Button>
                            <ExportItemKardexPdf
                                data={data}
                                startDate={startDate}
                                endDate={endDate}
                                disabled={loading || data.length === 0}
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0 bg-slate-100/30">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-slate-500 font-medium">Generando kardex, por favor espera...</p>
                        </div>
                    ) : data.length > 0 ? (
                        <div className="w-full">
                            <div className="bg-slate-800 text-slate-50 p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h3 className="font-bold text-lg">{data[0].NombreItem}</h3>
                                    <p className="text-slate-300 text-sm font-mono mt-1">Cód: {data[0].Codigo_Art} | U.M: {data[0].AbrevUnidMed || 'UND'}</p>
                                </div>
                                <div className="text-left sm:text-right">
                                    <p className="text-sm font-semibold text-slate-300 uppercase">Tipo de Existencia</p>
                                    <p className="text-sm font-medium">{data[0].DescripcionTipoExistencia || 'Mercadería'}</p>
                                </div>
                            </div>

                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm text-left text-slate-700">
                                    <thead className="text-xs text-slate-600 uppercase bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 font-bold whitespace-nowrap">Fecha</th>
                                        <th className="px-4 py-3 font-bold">Doc.</th>
                                        <th className="px-4 py-3 font-bold whitespace-nowrap">Serie Nro.</th>
                                        <th className="px-4 py-3 font-bold">Concepto</th>
                                        <th className="px-4 py-3 font-bold">Fórmula</th>
                                        <th className="px-4 py-3 font-bold text-right text-emerald-700">Ingreso</th>
                                        <th className="px-4 py-3 font-bold text-right text-red-700">Salida</th>
                                        <th className="px-4 py-3 font-bold text-right text-blue-800">Saldo</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {data.map((row, idx) => (
                                        <tr key={idx} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-medium whitespace-nowrap">
                                                {row.Fecha_Mvto ? row.Fecha_Mvto.split('-').reverse().join('/') : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-xs">{row.Abreviatura || '-'}</td>
                                            <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{row.SerieNumero || '-'}</td>
                                            <td className="px-4 py-3 text-xs max-w-[200px] truncate" title={row.OPERACION}>{row.OPERACION || '-'}</td>
                                            <td className="px-4 py-3 text-xs max-w-[150px] truncate" title={row.formula_ab || ''}>{row.formula_ab || '-'}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                                                {row.SumaDeCantidad_Ing > 0 ? formatQty(row.SumaDeCantidad_Ing) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-red-700">
                                                {row.SumaDeCantidad_Sal > 0 ? formatQty(row.SumaDeCantidad_Sal) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-blue-800 bg-blue-50/20">
                                                {formatQty(row.SumaDeSaldo)}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                    <tfoot>
                                    <tr className="bg-slate-800 text-white">
                                        <td colSpan={5} className="px-4 py-4 text-right uppercase tracking-wider text-xs font-bold">
                                            TOTAL ARTICULO:
                                        </td>
                                        <td className="px-4 py-4 text-right font-black text-emerald-400">
                                            {formatQty(totalIngresos)}
                                        </td>
                                        <td className="px-4 py-4 text-right font-black text-red-400">
                                            {formatQty(totalSalidas)}
                                        </td>
                                        <td className="px-4 py-4 text-right font-black text-blue-300">

                                        </td>
                                    </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className="md:hidden p-4 space-y-4">
                                {data.map((row, idx) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex flex-col gap-3">
                                        <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                                            <div>
                                                <span className="font-bold text-slate-800 text-sm">
                                                    {row.Fecha_Mvto ? row.Fecha_Mvto.split('-').reverse().join('/') : '-'}
                                                </span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-[10px] bg-slate-50">{row.Abreviatura || '-'}</Badge>
                                                    <span className="text-xs font-mono text-slate-500">{row.SerieNumero}</span>
                                                </div>
                                            </div>
                                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                                Saldo: {formatQty(row.SumaDeSaldo)}
                                            </Badge>
                                        </div>

                                        <div className="text-sm">
                                            <span className="font-semibold text-slate-700">Concepto: </span>
                                            <span className="text-slate-600">{row.OPERACION || '-'}</span>
                                        </div>

                                        {row.formula_ab && (
                                            <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                                                <span className="font-semibold">Fórmula: </span>{row.formula_ab}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold uppercase text-slate-400">Ingreso</span>
                                                <span className="font-bold text-emerald-600">
                                                    {row.SumaDeCantidad_Ing > 0 ? formatQty(row.SumaDeCantidad_Ing) : '-'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-bold uppercase text-slate-400">Salida</span>
                                                <span className="font-bold text-red-600">
                                                    {row.SumaDeCantidad_Sal > 0 ? formatQty(row.SumaDeCantidad_Sal) : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div className="bg-slate-800 text-white p-4 rounded-lg mt-6 shadow-md">
                                    <h4 className="text-center text-sm font-bold uppercase mb-4 text-slate-300 tracking-wider">Totales del Periodo</h4>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 uppercase">Ingresos</span>
                                            <span className="font-bold text-emerald-400">{formatQty(totalIngresos)}</span>
                                        </div>
                                        <div className="flex flex-col border-x border-slate-700">
                                            <span className="text-[10px] text-slate-400 uppercase">Salidas</span>
                                            <span className="font-bold text-red-400">{formatQty(totalSalidas)}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 uppercase">Saldo Final</span>
                                            <span className="font-bold text-blue-300">
                                                {data[data.length - 1] ? formatQty(data[data.length - 1].SumaDeSaldo) : '0.00'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 border-t border-slate-100 bg-white">
                            <FileText className="h-16 w-16 text-slate-200 mb-4" />
                            <p className="text-slate-500 font-medium text-center px-4 max-w-sm">
                                Selecciona un producto y un rango de fechas para visualizar los movimientos de inventario.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}