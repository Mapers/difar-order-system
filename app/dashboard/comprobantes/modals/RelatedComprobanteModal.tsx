import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Eye, Receipt } from "lucide-react"
import { GuiaRemision } from "@/app/types/order/order-interface"

interface RelatedComprobanteModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    guia: GuiaRemision | null
    onViewPdf: (url: string) => void
}

export function RelatedComprobanteModal({
                                            open, onOpenChange, guia, onViewPdf
                                        }: RelatedComprobanteModalProps) {
    const tipoLabel = (tipo?: number | null) => {
        if (tipo === 1) return { label: 'Factura',    color: 'bg-blue-100 text-blue-800'  }
        if (tipo === 3) return { label: 'Boleta',     color: 'bg-green-100 text-green-800' }
        return             { label: 'Comprobante', color: 'bg-gray-100 text-gray-800'  }
    }
    const tipoInfo = tipoLabel(guia?.comprobante_tipo)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-blue-600" />
                        Comprobante Asociado
                    </DialogTitle>
                    <DialogDescription>
                        Guía: <strong>{guia?.serie}-{guia?.numero}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {(guia?.idComprobanteCab && guia.comprobante_serie != null) ? (
                        <div className="space-y-3">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                Comprobante Referenciado
                            </p>
                            <div className="flex items-center justify-between border p-3 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 p-2 rounded-full">
                                        <FileText className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-sm text-gray-900">
                                                {guia.comprobante_serie}-{String(guia.comprobante_numero ?? '').padStart(8, '0')}
                                            </p>
                                            <Badge className={tipoInfo.color}>{tipoInfo.label}</Badge>
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <p className="text-xs text-gray-500">Pedido: #{guia.nroPedido}</p>
                                            <p className="text-xs text-gray-500 truncate max-w-[160px]">{guia.cliente_denominacion}</p>
                                        </div>
                                    </div>
                                </div>
                                {guia.comprobante_enlace && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 shrink-0"
                                        onClick={() => {
                                            onViewPdf(guia.comprobante_enlace!)
                                            onOpenChange(false)
                                        }}
                                        title="Ver PDF del Comprobante"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg bg-gray-50">
                            <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm font-medium">Sin comprobante asociado</p>
                            <p className="text-xs text-gray-400 mt-1">Esta guía no tiene un comprobante vinculado aún</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}