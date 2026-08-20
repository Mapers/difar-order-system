import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Eye, DollarSign, History, ImageIcon } from "lucide-react";
import { publicApi } from "@/app/api/client";
import {PriceMethodsService} from "@/app/dashboard/lista-precios-lote/services/priceMethodsService";
import { VentasSparkline } from "@/components/lista-precios-lote/VentasSparkline";

const Miniatura = ({ item, ruta, className = "", onOpenImagen }: any) => (
    <button
        type="button"
        onClick={() => onOpenImagen?.(item)}
        title={ruta ? "Ver imagen del producto" : "Sin imagen"}
        className={`flex items-center justify-center overflow-hidden rounded-md border bg-muted/40 transition hover:border-blue-400 hover:bg-muted ${className}`}
    >
        {ruta
            ? <img
                src={`${publicApi}${ruta}`}
                alt={item.prod_descripcion || item.prod_codigo}
                loading="lazy"
                className="h-full w-full object-cover"
            />
            : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
    </button>
);

export const PriceTable = ({ data, loading, onOpenLots, onOpenPrices, onOpenKardex, ventas, etiquetasVentas = [], imagenesActivas = false, imagenes, onOpenImagen }: any) => {
    const totalColumnas = imagenesActivas ? 12 : 11;

    const LoadingSkeletons = () => Array.from({length: 5}).map((_, i) => (
        <tr key={i} className="border-b"><td className="p-4" colSpan={totalColumnas}><Skeleton className="h-6 w-full"/></td></tr>
    ));


    return (
        <>
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                    <tr className="border-b bg-muted text-left">
                        {imagenesActivas && <th className="p-4 text-sm font-medium">Imagen</th>}
                        <th className="p-4 text-sm font-medium">Código</th>
                        <th className="p-4 text-sm font-medium">Laboratorio</th>
                        <th className="p-4 text-sm font-medium">Descripción</th>
                        <th className="p-4 text-sm font-medium">Presentación</th>
                        <th className="p-4 text-sm font-medium">Medida</th>
                        <th className="p-4 text-sm font-medium">Principio Activo</th>
                        <th className="p-4 text-sm font-medium">Stock</th>
                        <th className="p-4 text-sm font-medium">Ventas (3 meses)</th>
                        <th className="p-4 text-sm font-medium">P. Contado</th>
                        <th className="p-4 text-sm font-medium">P. Crédito</th>
                        <th className="p-4 text-sm font-medium">Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? <LoadingSkeletons /> : data.length > 0 ? data.map((item: any, idx: number) => (
                        <tr key={`${item.prod_codigo}-${idx}`} className="border-b hover:bg-muted">
                            {imagenesActivas && (
                                <td className="p-4">
                                    <Miniatura item={item} ruta={imagenes?.get(item.prod_codigo)} onOpenImagen={onOpenImagen} className="h-11 w-11" />
                                </td>
                            )}
                            <td className="p-4 text-sm font-mono">{item.prod_codigo}</td>
                            <td className="p-4"><div className="text-sm font-medium">{item.laboratorio_Descripcion}</div><div className="text-xs text-muted-foreground">{item.linea_lote_Descripcion}</div></td>
                            <td className="p-4"><div className="text-sm font-medium">{item.prod_descripcion}</div><div className="text-xs text-muted-foreground">{item.prod_principio}</div></td>
                            <td className="p-4 text-sm">{item.prod_presentacion}</td>
                            <td className="p-4 text-sm">{item.prod_medida}</td>
                            <td className="p-4 text-sm">{PriceMethodsService.truncateOrReplace(item.prod_principio, 10)}</td>
                            <td className="p-4 text-sm text-right">{Number(item.kardex_saldoCant).toLocaleString("es-ES", {minimumFractionDigits: 2})}</td>
                            <td className="p-4">
                                <VentasSparkline ventas={ventas?.get(item.prod_codigo)} etiquetas={etiquetasVentas} />
                            </td>
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
                    )) : <tr><td colSpan={totalColumnas} className="text-center py-8 text-muted-foreground">No se encontraron resultados</td></tr>}
                    </tbody>
                </table>
            </div>

            <div className="lg:hidden overflow-auto">
                {loading ? <div className="p-4"><Skeleton className="h-32 w-full"/></div> : data.map((item: any, idx: number) => (
                    <Card key={idx} className="border border-border mb-2 mx-2">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3 gap-3">
                                <div className="flex items-start gap-3 min-w-0">
                                    {imagenesActivas && <Miniatura item={item} ruta={imagenes?.get(item.prod_codigo)} onOpenImagen={onOpenImagen} className="h-12 w-12 shrink-0" />}
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-blue-600 text-sm">{item.prod_codigo}</h3>
                                        <p className="text-xs text-muted-foreground">{item.laboratorio_Descripcion}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 mb-3">
                                <div>
                                    <p className="font-medium text-sm truncate">{item.prod_descripcion}</p>
                                    <p className="text-xs text-muted-foreground">{item.prod_principio}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-xs text-muted-foreground">Presentación:</span>
                                        <p className="text-xs">{item.prod_presentacion}</p>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground">Ventas (3 meses):</span>
                                    <div className="mt-1"><VentasSparkline ventas={ventas?.get(item.prod_codigo)} etiquetas={etiquetasVentas} compacto /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><span className="text-xs text-muted-foreground">P. Contado:</span><p className="text-xs font-mono">S/ {item.precio_contado}</p></div>
                                    <div><span className="text-xs text-muted-foreground">P. Crédito:</span><p className="text-xs font-mono">S/ {item.precio_credito}</p></div>
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