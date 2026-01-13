import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Download, MoreHorizontal, XCircle, Loader2, FileJson, Code } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { format, parseISO } from "date-fns"
import { Comprobante, TipoComprobante } from "@/interface/order/order-interface";

interface ComprobantesTableProps {
    comprobantes: Comprobante[]
    loading: boolean
    tiposComprobante: TipoComprobante[]
    onViewPdf: (url: string) => void
    onCancel: (comprobante: Comprobante) => void
}

export function ComprobantesTable({ comprobantes, loading, tiposComprobante, onViewPdf, onCancel }: ComprobantesTableProps) {
    const [showJsonModal, setShowJsonModal] = useState(false)
    const [jsonContent, setJsonContent] = useState("")
    const [jsonTitle, setJsonTitle] = useState("")

    const getTipoComprobante = (tipo: number) => {
        const tipoObj = tiposComprobante.find(t => t.idTipoComprobante === tipo)
        return tipoObj ? tipoObj.descripcion : "Desconocido"
    }

    const getEstadoBadge = (comprobante: Comprobante) => {
        if (comprobante.anulado) return <Badge variant="destructive">Anulado</Badge>
        return <Badge variant="success">Activo</Badge>
    }

    const handleViewJson = (title: string, content: string) => {
        setJsonTitle(title)
        try {
            const parsed = typeof content === 'string' ? JSON.parse(content) : content
            setJsonContent(JSON.stringify(parsed, null, 2))
        } catch (error) {
            setJsonContent(content || "Sin contenido disponible")
        }
        setShowJsonModal(true)
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
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serie/Número</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {comprobantes.length > 0 ? (
                                comprobantes.map((comprobante) => (
                                    <tr key={comprobante.nroPedido} className="hover:bg-gray-50">
                                        <td className="p-4 text-sm">{format(parseISO(comprobante.fecha_envio), "dd/MM/yyyy")}</td>
                                        <td className="p-4 text-sm">{getTipoComprobante(comprobante.tipo_comprobante)}</td>
                                        <td className="p-4 font-medium text-sm">{comprobante.serie}-{comprobante.numero}</td>
                                        <td className="p-4"><div className="font-medium text-sm">{comprobante.cliente_denominacion}</div></td>
                                        <td className="p-4 text-sm">{comprobante.cliente_numdoc}</td>
                                        <td className="p-4 font-medium text-sm">{comprobante.moneda === 1 ? 'S/ ' : '$ '} {Number(comprobante.total).toFixed(2)}</td>
                                        <td className="p-4">{getEstadoBadge(comprobante)}</td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onViewPdf(comprobante.enlace)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56">
                                                        <DropdownMenuItem onClick={() => handleViewJson('JSON Solicitud (Request)', comprobante.raw_request)}>
                                                            <Code className="mr-2 h-4 w-4 text-gray-500" /> JSON Solicitud
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleViewJson('JSON Respuesta (Response)', comprobante.raw_response)}>
                                                            <FileJson className="mr-2 h-4 w-4 text-gray-500" /> JSON Respuesta
                                                        </DropdownMenuItem>

                                                        {!comprobante.anulado && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="text-red-600" onClick={() => onCancel(comprobante)}>
                                                                    <XCircle className="mr-2 h-4 w-4" /> Anular Comprobante
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={8} className="text-center py-8 text-gray-500">No se encontraron comprobantes</td></tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            <div className="lg:hidden space-y-3">
                {comprobantes.length > 0 ? (
                    comprobantes.map((comprobante) => (
                        <Card key={comprobante.idComprobanteCab} className="border border-gray-200">
                            <CardContent className="p-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-gray-900">{getTipoComprobante(comprobante.tipo_comprobante)} {comprobante.serie}-{comprobante.numero}</span>
                                                {getEstadoBadge(comprobante)}
                                            </div>
                                            <p className="text-sm text-gray-600">{format(parseISO(comprobante.fecha_envio), "dd/MM/yyyy")}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-900">{comprobante.moneda === 1 ? 'S/ ' : '$ '} {Number(comprobante.total).toFixed(2)}</p>
                                            <p className="text-xs text-gray-500">Total</p>
                                        </div>
                                    </div>
                                    <div className="border-t pt-3">
                                        <p className="font-medium text-gray-900 truncate">{comprobante.cliente_denominacion}</p>
                                        <p className="text-sm text-gray-600">{comprobante.cliente_numdoc}</p>
                                    </div>
                                    <div className="border-t pt-3 flex gap-2">
                                        <Button variant="outline" size="sm" className="text-xs bg-transparent" onClick={() => onViewPdf(comprobante.enlace)}>
                                            <Eye className="h-3 w-3 mr-1" /> Ver
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm" className="text-xs bg-transparent"><MoreHorizontal className="h-3 w-3 mr-1" /> Más</Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56">
                                                <DropdownMenuItem onClick={() => handleViewJson('JSON Solicitud (Request)', comprobante.raw_request)}>
                                                    <Code className="mr-2 h-4 w-4 text-gray-500" /> JSON Solicitud
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleViewJson('JSON Respuesta (Response)', comprobante.raw_response)}>
                                                    <FileJson className="mr-2 h-4 w-4 text-gray-500" /> JSON Respuesta
                                                </DropdownMenuItem>
                                                {!comprobante.anulado && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600" onClick={() => onCancel(comprobante)}>
                                                            <XCircle className="mr-2 h-4 w-4" /> Anular
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500">No se encontraron comprobantes</div>
                )}
            </div>

            <Dialog open={showJsonModal} onOpenChange={setShowJsonModal}>
                <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileJson className="h-5 w-5 text-blue-600" />
                            {jsonTitle}
                        </DialogTitle>
                        <DialogDescription>
                            Visualización de datos crudos de la transacción.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 w-full overflow-hidden rounded-md border bg-slate-950 p-4 text-white">
                        <pre className="h-full w-full overflow-auto text-xs font-mono">
                            {jsonContent}
                        </pre>
                    </div>
                    <div className="flex justify-end">
                        <Button variant="outline" onClick={() => setShowJsonModal(false)}>Cerrar</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}