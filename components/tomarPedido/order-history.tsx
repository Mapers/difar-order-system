import React, {useEffect, useState} from 'react';
import { FileText, Calendar, ChevronDown, Filter, Package, Search, Smartphone, Table as TableIcon } from 'lucide-react';
import { Label } from '@radix-ui/react-label';
import { IClient } from '@/interface/order/client-interface';
import apiClient from '@/app/api/client';
import { format } from 'date-fns';
import {Dialog, DialogTitle} from "@radix-ui/react-dialog";
import {DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTrigger} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface OrderHistoryProps {
    client: IClient;
}

interface OrderHistoryItem {
    documento: string;
    fecha_mvto: string;
    lote: string;
    vctoitem: string;
    nombreitem: string;
    presentacion: string;
    cantidad: string;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ client }) => {
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
    const [filteredHistory, setFilteredHistory] = useState<OrderHistoryItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [searchDescripcion, setSearchDescripcion] = useState('');

    const fetchOrderHistory = async () => {
        if (!client) return;

        setLoadingHistory(true);
        try {
            const params = new URLSearchParams({
                rucCliente: client.RUC,
                ...(fechaInicio && { fechaInicio }),
                ...(fechaFin && { fechaFin })
            });

            const response = await apiClient.get(`/pedidos/history-x-client?${params}`);
            const data = response.data?.data?.data || [];
            setOrderHistory(data);
            setFilteredHistory(data);
        } catch (error) {
            console.error("Error fetching order history:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (searchDescripcion.trim() === '') {
            setFilteredHistory(orderHistory);
        } else {
            const filtered = orderHistory.filter(item =>
                item.nombreitem.toLowerCase().includes(searchDescripcion.toLowerCase())
            );
            setFilteredHistory(filtered);
        }
    }, [searchDescripcion, orderHistory]);

    const handleHistoryClick = () => {
        setShowHistoryModal(true);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        setFechaInicio(format(startDate, 'yyyy-MM-dd'));
        setFechaFin(format(endDate, 'yyyy-MM-dd'));
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-ES');
    };

    const handleClearSearch = () => {
        setSearchDescripcion('');
    };

    useEffect(() => {
        if (fechaInicio != '' && fechaFin != '') {
            fetchOrderHistory()
        }
    }, [fechaFin, fechaInicio]);

    // Vista de tabla para desktop
    const TableView = () => (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>N° Documento</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead>Fecha Vcto</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Presentación</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredHistory.map((order, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    {order.documento}
                                </div>
                            </TableCell>
                            <TableCell>
                                {formatDate(order.fecha_mvto)}
                            </TableCell>
                            <TableCell>
                                {order.lote || 'N/A'}
                            </TableCell>
                            <TableCell>
                                {formatDate(order.vctoitem)}
                            </TableCell>
                            <TableCell className="max-w-xs">
                                <div className="truncate" title={order.nombreitem}>
                                    {order.nombreitem}
                                </div>
                            </TableCell>
                            <TableCell>
                                {order.presentacion}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                <div className="flex items-center justify-end gap-2">
                                    <Package className="w-4 h-4 text-green-600" />
                                    {Number(order.cantidad).toFixed(2)}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );

    // Vista de tarjetas para móvil
    const CardView = () => (
        <div className="space-y-4">
            {filteredHistory.map((order, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                {order.documento}
                            </CardTitle>
                            <Badge variant="secondary" className="text-xs">
                                {Number(order.cantidad).toFixed(2)} und
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <Label className="text-xs text-gray-500">Fecha</Label>
                                <p className="font-medium">{formatDate(order.fecha_mvto)}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-gray-500">Lote</Label>
                                <p className="font-medium">{order.lote || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <Label className="text-xs text-gray-500">Vence</Label>
                                <p className="font-medium">{formatDate(order.vctoitem)}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-gray-500">Presentación</Label>
                                <p className="font-medium">{order.presentacion}</p>
                            </div>
                        </div>

                        <div className="text-sm">
                            <Label className="text-xs text-gray-500">Descripción</Label>
                            <p className="font-medium line-clamp-2" title={order.nombreitem}>
                                {order.nombreitem}
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Package className="w-4 h-4 text-green-600" />
                                <span>Cantidad:</span>
                            </div>
                            <span className="font-bold text-green-700">
                                {Number(order.cantidad).toFixed(2)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    return (
        <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
            <DialogTrigger asChild>
                <div
                    className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={handleHistoryClick}
                >
                    <FileText className="w-6 h-6 text-blue-600" />
                    <div className="flex-1">
                        <Label className="text-sm font-medium text-gray-700">Historial de Pedidos de {client.Nombre}</Label>
                        <p className="text-xs text-blue-600 mt-1">Click para ver historial</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-blue-600 rotate-[-90deg]" />
                </div>
            </DialogTrigger>

            <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Historial de Pedidos - {client.Nombre}
                    </DialogTitle>
                    <DialogDescription>
                        Consulta el historial de pedidos del cliente
                    </DialogDescription>
                </DialogHeader>

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                        <Label htmlFor="fechaInicio" className="text-sm font-medium">
                            Fecha Inicio
                        </Label>
                        <Input
                            type="date"
                            id="fechaInicio"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className="bg-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fechaFin" className="text-sm font-medium">
                            Fecha Fin
                        </Label>
                        <Input
                            type="date"
                            id="fechaFin"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className="bg-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="searchDescripcion" className="text-sm font-medium">
                            Buscar por Descripción
                        </Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                type="text"
                                id="searchDescripcion"
                                placeholder="Buscar producto..."
                                value={searchDescripcion}
                                onChange={(e) => setSearchDescripcion(e.target.value)}
                                className="bg-white pl-8"
                            />
                            {searchDescripcion && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearSearch}
                                    className="absolute right-1 top-1 h-6 w-6 p-0"
                                >
                                    ×
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                        <Button
                            onClick={fetchOrderHistory}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            disabled={loadingHistory}
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Actualizar
                        </Button>
                    </div>
                </div>

                {/* Información de resultados y selector de vista */}
                {orderHistory.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-2 py-1 bg-blue-50 rounded text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-blue-700">
                                Mostrando {filteredHistory.length} de {orderHistory.length} registros
                            </span>
                            {searchDescripcion && (
                                <span className="text-blue-600 hidden sm:inline">
                                    Filtrado por: "{searchDescripcion}"
                                </span>
                            )}
                        </div>

                        {/* Selector de vista - solo visible en móvil */}
                        <div className="sm:hidden flex items-center gap-2 text-xs">
                            <span className="text-gray-600">Vista:</span>
                            <div className="flex bg-white border rounded-md p-1">
                                <div className="flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-700">
                                    <Smartphone className="w-3 h-3" />
                                    <span>Tarjetas</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {loadingHistory ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredHistory.length > 0 ? (
                    <>
                        {/* Vista desktop (hidden en móvil) */}
                        <div className="hidden sm:block">
                            <TableView />
                        </div>
                        {/* Vista móvil (hidden en desktop) */}
                        <div className="block sm:hidden">
                            <CardView />
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="font-medium text-gray-900 mb-2">
                            {searchDescripcion ? 'No se encontraron resultados' : 'No se encontraron pedidos'}
                        </h3>
                        <p className="text-sm">
                            {searchDescripcion
                                ? `No hay registros que coincidan con "${searchDescripcion}"`
                                : 'No hay pedidos registrados para este cliente en el período seleccionado.'
                            }
                        </p>
                        {searchDescripcion && (
                            <Button
                                variant="outline"
                                onClick={handleClearSearch}
                                className="mt-2"
                            >
                                Limpiar búsqueda
                            </Button>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowHistoryModal(false)}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default OrderHistory;