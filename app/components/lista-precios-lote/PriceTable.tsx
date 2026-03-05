import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Eye, DollarSign, History } from "lucide-react";
import {PriceMethodsService} from "@/app/dashboard/lista-precios-lote/services/priceMethodsService";

export const PriceTable = ({ data, loading, onOpenLots, onOpenPrices, onOpenKardex }: any) => {
    const LoadingSkeletons = () => Array.from({length: 5}).map((_, i) => (
        <tr key={i} className="border-b"><td className="p-4" colSpan={10}><Skeleton className="h-6 w-full"/></td></tr>
    ));

    return (
        <>
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                    <tr className="border-b bg-gray-50 text-left">
                        <th className="p-4 text-sm font-medium">Código</th>
                        <th className="p-4 text-sm font-medium">Laboratorio</th>
                        <th className="p-4 text-sm font-medium">Descripción</th>
                        <th className="p-4 text-sm font-medium">Presentación</th>
                        <th className="p-4 text-sm font-medium">Medida</th>
                        <th className="p-4 text-sm font-medium">Principio Activo</th>
                        <th className="p-4 text-sm font-medium">Stock</th>
                        <th className="p-4 text-sm font-medium">P. Contado</th>
                        <th className="p-4 text-sm font-medium">P. Crédito</th>
                        <th className="p-4 text-sm font-medium">Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? <LoadingSkeletons /> : data.length > 0 ? data.map((item: any, idx: number) => (
                        <tr key={`${item.prod_codigo}-${idx}`} className="border-b hover:bg-gray-50">
                            <td className="p-4 text-sm font-mono">{item.prod_codigo}</td>
                            <td className="p-4"><div className="text-sm font-medium">{item.laboratorio_Descripcion}</div><div className="text-xs text-gray-500">{item.linea_lote_Descripcion}</div></td>
                            <td className="p-4"><div className="text-sm font-medium">{item.prod_descripcion}</div><div className="text-xs text-gray-500">{item.prod_principio}</div></td>
                            <td className="p-4 text-sm">{item.prod_presentacion}</td>
                            <td className="p-4 text-sm">{item.prod_medida}</td>
                            <td className="p-4 text-sm">{PriceMethodsService.truncateOrReplace(item.prod_principio, 10)}</td>
                            <td className="p-4 text-sm text-right">{Number(item.kardex_saldoCant).toLocaleString("es-ES", {minimumFractionDigits: 2})}</td>
                            <td className="p-4 text-sm text-right font-mono">S/ {item.precio_contado}</td>
                            <td className="p-4 text-sm text-right font-mono">S/ {item.precio_credito}</td>
                            <td className="p-4">
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => onOpenLots(item)}><Eye className="h-4 w-4"/> Lotes</Button>
                                    <Button variant="outline" size="sm" onClick={() => onOpenPrices(item)}><DollarSign className="h-4 w-4"/> Precios</Button>
                                    <Button variant="outline" size="sm" onClick={() => onOpenKardex(item)}><History className="h-4 w-4"/> Kardex</Button>
                                </div>
                            </td>
                        </tr>
                    )) : <tr><td colSpan={10} className="text-center py-8 text-gray-500">No se encontraron resultados</td></tr>}
                    </tbody>
                </table>
            </div>

            <div className="lg:hidden overflow-auto">
                {loading ? <div className="p-4"><Skeleton className="h-32 w-full"/></div> : data.map((item: any, idx: number) => (
                    <Card key={idx} className="border border-gray-200 mb-2 mx-2">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div><h3 className="font-bold text-blue-600 text-sm">{item.prod_codigo}</h3><p className="text-xs text-gray-500">{item.laboratorio_Descripcion}</p></div>
                            </div>
                            <div className="space-y-2 mb-3">
                                <div>
                                    <p className="font-medium text-sm truncate">{item.prod_descripcion}</p>
                                    <p className="text-xs text-gray-500">{item.prod_principio}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-xs text-gray-500">Presentación:</span>
                                        <p className="text-xs">{item.prod_presentacion}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><span className="text-xs text-gray-500">P. Contado:</span><p className="text-xs font-mono">S/ {item.precio_contado}</p></div>
                                    <div><span className="text-xs text-gray-500">P. Crédito:</span><p className="text-xs font-mono">S/ {item.precio_credito}</p></div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpenLots(item)}><Eye className="h-4 w-4"/></Button>
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpenPrices(item)}><DollarSign className="h-4 w-4"/></Button>
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpenKardex(item)}><History className="h-4 w-4"/></Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </>
    );
};