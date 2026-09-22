import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    AlertTriangle,
    Receipt,
    RefreshCw,
    Eye,
    Calendar,
    User,
    Wallet,
    Package,
    Clock,
    CheckCircle,
    Loader2,
    Trash2
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import {Pedido} from "@/app/types/order/order-interface";

interface PendientesGridProps {
    pedidos: Pedido[]
    loading: boolean
    onInvoice: (pedido: Pedido) => void
    onDelete: (pedido: Pedido) => void
    onViewDetail: (nroPedido: string) => void
}

// Vista alternativa a PendientesList: mismos datos y acciones, en tarjetas
// (3 por fila en desktop) en vez de una lista apilada de ancho completo.
export function PendientesGrid({ pedidos, loading, onInvoice, onDelete, onViewDetail }: PendientesGridProps) {
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
                <h3 className="text-lg font-medium text-foreground mb-2">¡Excelente!</h3>
                <p className="text-muted-foreground">No hay pedidos pendientes por facturar</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {pedidos.map((pedido) => (
                    <Card key={pedido.idPedidocab} className="flex flex-col overflow-hidden border border-orange-200 bg-orange-50 shadow-sm transition-shadow hover:shadow-md">
                        <CardContent className="flex flex-1 flex-col p-0">
                            <div className="flex items-start justify-between gap-2 border-b border-orange-200 bg-orange-100/60 p-4">
                                <div className="min-w-0 flex items-start gap-2.5">
                                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-200 text-orange-700">
                                        <Package className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-medium uppercase tracking-wide text-orange-700/80 truncate">Pedido</p>
                                        <p className="font-bold text-sm text-orange-900 truncate">{pedido.nroPedido}</p>
                                    </div>
                                </div>
                                {pedido.errorObservaciones ? (
                                    <Badge className="bg-red-100 text-red-800 text-[11px] shrink-0">
                                        <AlertTriangle className="h-3 w-3 mr-1" /> Error
                                    </Badge>
                                ) : (
                                    <Badge className="bg-green-100 text-green-800 text-[11px] shrink-0">Listo</Badge>
                                )}
                            </div>

                            <div className="flex flex-1 flex-col gap-3 p-4">
                                <div>
                                    <p className="font-semibold text-sm text-foreground line-clamp-2 leading-snug" title={pedido.nombreCliente}>
                                        {pedido.nombreCliente}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{pedido.codigoCliente}</p>
                                </div>

                                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">{format(parseISO(pedido.fechaPedido), "dd/MM/yyyy")}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Package className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">{pedido.cantidadPedidos} productos</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">{pedido.condicionPedido}</span>
                                    </div>
                                </div>

                                {pedido.errorObservaciones && (
                                    <div className="bg-red-100 border border-red-200 rounded-md p-2.5">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                                            <p className="font-medium text-red-800 text-xs">Error en facturación</p>
                                        </div>
                                        <p className="text-xs text-red-700 line-clamp-2">
                                            {pedido.errorObservaciones.split('|')[3]}
                                        </p>
                                    </div>
                                )}

                                <div className="mt-auto flex items-end justify-between gap-2 border-t border-orange-200 pt-3">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                                            <Wallet className="h-3 w-3" /> Total
                                        </p>
                                        <p className="text-lg font-bold text-green-600 leading-tight">
                                            {pedido.monedaPedido === 'PEN' ? 'S/ ' : '$ '}{Number(pedido.totalPedido).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon"
                                                className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-100"
                                                onClick={() => onDelete(pedido)} title="Eliminar">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon"
                                                className="h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={() => onViewDetail(pedido.nroPedido)} title="Detalles">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        {!pedido.errorObservaciones ? (
                                            <Button size="sm" className="h-9 gap-1.5 bg-green-600 hover:bg-green-700 text-xs px-2.5"
                                                    onClick={() => onInvoice(pedido)}>
                                                <Receipt className="h-3.5 w-3.5" /> Facturar
                                            </Button>
                                        ) : (
                                            <Button size="sm" variant="outline"
                                                    className="h-9 gap-1.5 text-red-700 border-red-300 hover:bg-red-100 text-xs px-2.5"
                                                    onClick={() => onInvoice(pedido)}>
                                                <RefreshCw className="h-3.5 w-3.5" /> Reintentar
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

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
