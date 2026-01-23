import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Truck, AlertCircle, FileText, Eye } from "lucide-react"
import { format, parseISO } from "date-fns"
import apiClient from "@/app/api/client"
import { GuiaReferencia } from "./GuidesSelectorModal"
import { Comprobante } from "@/interface/order/order-interface"

interface RelatedGuidesModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    comprobante: Comprobante | null
    onViewPdf: (url: string) => void
}

export function RelatedGuidesModal({ open, onOpenChange, comprobante, onViewPdf }: RelatedGuidesModalProps) {
    const [loading, setLoading] = useState(false)
    const [guias, setGuias] = useState<GuiaReferencia[]>([])

    useEffect(() => {
        if (open && comprobante) {
            fetchGuiasDelComprobante()
        }
    }, [open, comprobante])

    const fetchGuiasDelComprobante = async () => {
        if (!comprobante) return
        setLoading(true)
        try {
            const response = await apiClient.get(`/pedidos/guiasRelacionadas?nroPedido=${comprobante.nroPedido}`)
            const data = response.data.data.data || []
            setGuias(data)
        } catch (error) {
            console.error("Error cargando guías:", error)
            setGuias([])
        } finally {
            setLoading(false)
        }
    }

    const handleViewGuidePdf = (base64: string) => {
        const dataUrl = `data:application/pdf;base64,${base64}`;
        onViewPdf(dataUrl);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-blue-600" />
                        Guías de Remisión Asociadas
                    </DialogTitle>
                    <DialogDescription>
                        Comprobante: <strong>{comprobante?.serie}-{comprobante?.numero}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        </div>
                    ) : guias.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg bg-gray-50">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">No se encontraron guías asociadas a este comprobante.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Guías Referenciadas ({guias.length})</p>
                            <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2">
                                {guias.map((guia) => (
                                    <div
                                        key={guia.idGuiaRemCab}
                                        className="flex items-center justify-between border p-3 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-100 p-2 rounded-full">
                                                <FileText className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm text-gray-900">{guia.serie}-{guia.numero}</p>
                                                <p className="text-xs text-gray-500">{format(parseISO(guia.fecha_emision), "dd/MM/yyyy")}</p>
                                            </div>
                                        </div>

                                        {guia.pdf_zip_base64 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={() => handleViewGuidePdf(guia.pdf_zip_base64)}
                                                title="Ver Guía PDF"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
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