import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Receipt, RefreshCw, Eye, Calendar, User, Wallet, Package, Clock, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import {Pedido} from "@/interface/order/order-interface";

interface PendientesListProps {
    pedidos: Pedido[]
    loading: boolean
    onInvoice: (pedido: Pedido) => void
}

export function PendientesList({ pedidos, loading, onInvoice }: PendientesListProps) {
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (pedidos.length === 0) {
        return (
            <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">¡Excelente!</h3>
                <p className="text-gray-600">No hay pedidos pendientes por facturar</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {pedidos.map((pedido) => (
                <Card key={pedido.idPedidocab} className="border border-orange-200 bg-orange-50">
                    <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">{pedido.nroPedido}</h3>
                                    {pedido.errorObservaciones ? (
                                        <Badge className="bg-red-100 text-red-800 text-xs w-fit">
                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                            <span className="hidden sm:inline">Error en facturación</span>
                                            <span className="sm:hidden">Error</span>
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-green-100 text-green-800 text-xs w-fit">
                                            <span className="hidden sm:inline">Completado - Listo para facturar</span>
                                            <span className="sm:hidden">Listo</span>
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex flex-row gap-2">
                                    {!pedido.errorObservaciones ?
                                        <Button onClick={() => onInvoice(pedido)} className="bg-green-600 hover:bg-green-700 flex items-center gap-2 w-full sm:w-auto" size="sm">
                                            <Receipt className="h-4 w-4" />
                                            <span className="hidden sm:inline">Facturar Ahora</span>
                                            <span className="sm:hidden">Facturar</span>
                                        </Button> :
                                        <Button onClick={() => onInvoice(pedido)} variant="outline" size="sm" className="text-red-700 border-red-300 hover:bg-red-200 text-xs">
                                            <RefreshCw className="h-4 w-4" />
                                            <span className="hidden sm:inline">Reintentar Factura</span>
                                            <span className="sm:hidden">Reintentar</span>
                                        </Button>
                                    }
                                    <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" size="sm" asChild>
                                        <Link href={`/dashboard/comprobantes/${pedido.nroPedido}`} className='flex items-center gap-2'>
                                            <Eye className="h-4 w-4" />
                                            <span className="hidden sm:inline">Detalles</span>
                                            <span className="sm:hidden">Detalles</span>
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            {pedido.errorObservaciones && (
                                <div className="bg-red-100 border border-red-200 rounded-md p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="h-4 w-4 text-red-600" />
                                        <h4 className="font-medium text-red-800 text-sm">Error en facturación</h4>
                                    </div>
                                    <div className="text-xs text-red-700 space-y-1">
                                        <p><strong>Observación:</strong> {pedido.errorObservaciones.split('|')[3]}</p>
                                        {pedido.errorCodigo && <p><strong>Código error:</strong> {pedido.errorCodigo}</p>}
                                        {pedido.errorFecha && <p><strong>Fecha error:</strong> {format(parseISO(pedido.errorFecha), "dd/MM/yyyy HH:mm")}</p>}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                                    <span className="text-gray-600">Fecha:</span>
                                    <span className="font-medium">{format(parseISO(pedido.fechaPedido), "dd/MM/yyyy")}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                                    <span className="text-gray-600">Cliente:</span>
                                    <span className="font-medium truncate">{pedido.nombreCliente}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                                    <span className="text-gray-600">Total:</span>
                                    <span className="font-bold text-green-600">{pedido.monedaPedido === 'PEN' ? 'S/ ' : '$ '} {Number(pedido.totalPedido).toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Package className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                                    <span className="text-gray-600">Productos:</span>
                                    {pedido.cantidadPedidos}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                                <div className="flex items-center gap-2">
                                    <Receipt className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                                    <span className="text-gray-600">Documento:</span>
                                    <span className="font-medium">{pedido.codigoCliente}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                                    <span className="text-gray-600">Condición:</span>
                                    <span className="font-medium">{pedido.condicionPedido}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}

            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h4 className="font-medium text-blue-900 text-sm sm:text-base">Total Pendiente por Facturar</h4>
                            <p className="text-xs sm:text-sm text-blue-700">{pedidos.length} pedidos completados</p>
                        </div>
                        <div className="text-left sm:text-right">
                            <p className="text-xl sm:text-2xl font-bold text-blue-900">S/{pedidos.reduce((sum, p) => sum + Number(p.totalPedido), 0).toFixed(2)}</p>
                            <p className="text-xs sm:text-sm text-blue-700">Valor total</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}