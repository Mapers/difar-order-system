import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Download, MoreHorizontal, AlertTriangle, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format, parseISO } from "date-fns"
import { GuiaRemision } from "@/interface/order/order-interface";

interface GuiasListProps {
    guias: GuiaRemision[]
    loading: boolean
    onViewPdf: (base64: string) => void
    onErrorView: (guia: GuiaRemision) => void
}

export function GuiasList({ guias, loading, onViewPdf, onErrorView }: GuiasListProps) {

    const getEstadoGuiaBadge = (guia: GuiaRemision) => {
        if (guia.anulado) return <Badge variant="destructive">Anulado</Badge>
        return <Badge variant="success">Activo</Badge>
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <>
            <div className="hidden lg:block">
                <Card className="bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guía</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {guias.length > 0 ? (
                                guias.map((guia) => (
                                    <tr key={guia.idGuiaRemCab} className="hover:bg-gray-50">
                                        <td className="p-4 text-sm">{format(parseISO(guia.fecha_emision), "dd/MM/yyyy")}</td>
                                        <td className="p-4 font-medium text-sm">{guia.serie}-{guia.numero}</td>
                                        <td className="p-4"><div className="font-medium text-sm">{guia.cliente_denominacion}</div></td>
                                        <td className="p-4 text-sm">{guia.cliente_num_doc}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1 items-start">
                                                {guia.sunat_responsecode !== '0' ? (
                                                    <Button variant="ghost" size="sm" onClick={() => onErrorView(guia)} className="h-auto p-0 hover:bg-transparent text-red-600 hover:text-red-700 font-normal text-xs flex items-center gap-1 mt-1">
                                                        <AlertTriangle className="h-3 w-3" /> <span className="underline decoration-dotted underline-offset-2">Ver Error SUNAT</span>
                                                    </Button>
                                                ) : getEstadoGuiaBadge(guia)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onViewPdf(guia.pdf_zip_base64)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuItem className="text-green-600" onClick={() => window.open(guia.enlace_pdf, '_blank')}>
                                                            <Download className="mr-2 h-4 w-4" /> Descargar PDF
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={7} className="text-center py-8 text-gray-500">No se encontraron guías de remisión</td></tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            <div className="lg:hidden space-y-3">
                {guias.length > 0 ? (
                    guias.map((guia) => (
                        <Card key={guia.idGuiaRemCab} className="border border-gray-200">
                            <CardContent className="p-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-gray-900">{guia.serie}-{guia.numero}</span>
                                                {getEstadoGuiaBadge(guia)}
                                            </div>
                                            <p className="text-sm text-gray-600">{format(parseISO(guia.fecha_emision), "dd/MM/yyyy")}</p>
                                        </div>
                                    </div>
                                    <div className="border-t pt-3">
                                        <p className="font-medium text-gray-900 truncate">{guia.cliente_denominacion}</p>
                                        <p className="text-sm text-gray-600">{guia.cliente_num_doc}</p>
                                    </div>
                                    {guia.sunat_responsecode !== "0" && (
                                        <div className="bg-red-100 border border-red-200 rounded-md p-3 mt-2">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertTriangle className="h-4 w-4 text-red-600" /><h4 className="font-medium text-red-800 text-sm">Error SUNAT</h4>
                                            </div>
                                            <div className="text-xs text-red-700 space-y-1">
                                                {guia.sunat_description && <p><strong>Descripción:</strong> {guia.sunat_description}</p>}
                                            </div>
                                        </div>
                                    )}
                                    <div className="border-t pt-3 flex gap-2">
                                        <Button variant="outline" size="sm" className="text-xs bg-transparent" onClick={() => onViewPdf(guia.pdf_zip_base64)}>
                                            <Eye className="h-3 w-3 mr-1" /> Ver PDF
                                        </Button>
                                        <Button variant="outline" size="sm" className="text-xs bg-transparent" onClick={() => window.open(guia.enlace_pdf, '_blank')}>
                                            <Download className="h-3 w-3 mr-1" /> Descargar
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500">No se encontraron guías de remisión</div>
                )}
            </div>
        </>
    )
}