import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Eye,
    MoreHorizontal,
    XCircle,
    Loader2,
    FileJson,
    Code,
    AlertCircle,
    Mail,
    MessageCircle,
    Activity,
    FileDiff, Info
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { format, parseISO } from "date-fns"
import { Comprobante } from "@/interface/order/order-interface";
import { Sequential } from "@/app/dashboard/configuraciones/page";

interface CreditNotesTableProps {
    notas: Comprobante[]
    loading: boolean
    tiposComprobante: Sequential[]
    onViewPdf: (url: string) => void
    onCancel: (nota: Comprobante) => void
    onSendEmail: (nota: Comprobante) => void
    onSendWhatsApp: (nota: Comprobante) => void
    onCheckStatus: (nota: Comprobante) => void
}

export function CreditNotesTable({
                                     notas,
                                     loading,
                                     tiposComprobante,
                                     onViewPdf,
                                     onCancel,
                                     onSendEmail,
                                     onSendWhatsApp,
                                     onCheckStatus
                                 }: CreditNotesTableProps) {
    const [showJsonModal, setShowJsonModal] = useState(false)
    const [jsonContent, setJsonContent] = useState("")
    const [jsonTitle, setJsonTitle] = useState("")

    const [showReasonModal, setShowReasonModal] = useState(false)
    const [selectedReason, setSelectedReason] = useState("")

    const getTipoComprobante = (tipo: number) => {
        const tipoObj = tiposComprobante.find(t => Number(t.tipo) == tipo)
        return tipoObj ? tipoObj.nombre : "Nota de Crédito"
    }

    const handleViewReason = (reason: string) => {
        setSelectedReason(reason || "Sin motivo especificado.")
        setShowReasonModal(true)
    }

    const getEstadoBadge = (nota: Comprobante) => {
        if (nota.anulado) {
            return (
                <div className="flex items-center gap-1">
                    <Badge variant="destructive">Anulado</Badge>
                    {nota.motivo_anulado && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleViewReason(nota.motivo_anulado!)}
                            title="Ver motivo"
                        >
                            <AlertCircle className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )
        }
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">Emitido</Badge>
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
            {/* VISTA DESKTOP */}
            <div className="hidden lg:block">
                <Card className="bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Emisión</th>
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
                            {notas.length > 0 ? (
                                notas.map((nota) => (
                                    <tr key={nota.idComprobanteCab} className="hover:bg-gray-50">
                                        <td className="p-4 text-sm">{format(parseISO(nota.fecha_envio), "dd/MM/yyyy")}</td>
                                        <td className="p-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <FileDiff className="h-4 w-4 text-blue-500" />
                                                {getTipoComprobante(nota.tipo_comprobante)}
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium text-sm">{nota.serie}-{nota.numero}</td>
                                        <td className="p-4"><div className="font-medium text-sm">{nota.cliente_denominacion}</div></td>
                                        <td className="p-4 text-sm">{nota.cliente_numdoc}</td>
                                        <td className="p-4 font-medium text-sm text-red-600">
                                            {nota.moneda === 1 ? 'S/ ' : '$ '} -{Number(nota.total).toFixed(2)}
                                        </td>
                                        <td className="p-4">{getEstadoBadge(nota)}</td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onViewPdf(nota.enlace)} title="Ver PDF">
                                                    <Eye className="h-4 w-4" />
                                                </Button>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56">
                                                        <DropdownMenuItem onClick={() => handleViewJson('JSON Solicitud (Request)', nota.raw_request)}>
                                                            <Code className="mr-2 h-4 w-4 text-gray-500" /> JSON Solicitud
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleViewJson('JSON Respuesta (Response)', nota.raw_response)}>
                                                            <FileJson className="mr-2 h-4 w-4 text-gray-500" /> JSON Respuesta
                                                        </DropdownMenuItem>

                                                        <DropdownMenuSeparator />

                                                        <DropdownMenuItem onClick={() => onSendEmail(nota)}>
                                                            <Mail className="mr-2 h-4 w-4 text-blue-500" /> Enviar por Correo
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onSendWhatsApp(nota)}>
                                                            <MessageCircle className="mr-2 h-4 w-4 text-green-500" /> Enviar por WhatsApp
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onCheckStatus(nota)}>
                                                            <Activity className="mr-2 h-4 w-4 text-orange-500" /> Ver Estado SUNAT
                                                        </DropdownMenuItem>

                                                        <DropdownMenuSeparator />

                                                        {!nota.anulado && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="text-red-600" onClick={() => onCancel(nota)}>
                                                                    <XCircle className="mr-2 h-4 w-4" /> Dar de Baja (Anular)
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
                                <tr><td colSpan={8} className="text-center py-8 text-gray-500">No se encontraron notas de crédito</td></tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* VISTA MOBILE */}
            <div className="lg:hidden space-y-3">
                {notas.length > 0 ? (
                    notas.map((nota) => (
                        <Card key={nota.idComprobanteCab} className="border border-gray-200">
                            <CardContent className="p-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <FileDiff className="h-4 w-4 text-blue-500" />
                                                <span className="font-semibold text-gray-900">{nota.serie}-{nota.numero}</span>
                                                {getEstadoBadge(nota)}
                                            </div>
                                            <p className="text-sm text-gray-600">{format(parseISO(nota.fecha_envio), "dd/MM/yyyy")}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-red-600">
                                                {nota.moneda === 1 ? 'S/ ' : '$ '} -{Number(nota.total).toFixed(2)}
                                            </p>
                                            <p className="text-xs text-gray-500">Total Devuelto</p>
                                        </div>
                                    </div>
                                    <div className="border-t pt-3">
                                        <p className="font-medium text-gray-900 truncate">{nota.cliente_denominacion}</p>
                                        <p className="text-sm text-gray-600">{nota.cliente_numdoc}</p>
                                    </div>
                                    <div className="border-t pt-3 flex gap-2">
                                        <Button variant="outline" size="sm" className="text-xs bg-transparent" onClick={() => onViewPdf(nota.enlace)}>
                                            <Eye className="h-3 w-3 mr-1" /> Ver PDF
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm" className="text-xs bg-transparent"><MoreHorizontal className="h-3 w-3 mr-1" /> Opciones</Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56">
                                                {(nota.anulado && nota.motivo_anulado) && (
                                                    <DropdownMenuItem onClick={() => handleViewReason(nota.motivo_anulado!)}>
                                                        <Info className="mr-2 h-4 w-4 text-red-500" /> Ver Motivo Anulación
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => handleViewJson('JSON Solicitud (Request)', nota.raw_request)}>
                                                    <Code className="mr-2 h-4 w-4 text-gray-500" /> JSON Solicitud
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleViewJson('JSON Respuesta (Response)', nota.raw_response)}>
                                                    <FileJson className="mr-2 h-4 w-4 text-gray-500" /> JSON Respuesta
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />

                                                <DropdownMenuItem onClick={() => onSendEmail(nota)}>
                                                    <Mail className="mr-2 h-4 w-4 text-blue-500" /> Enviar por Correo
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onSendWhatsApp(nota)}>
                                                    <MessageCircle className="mr-2 h-4 w-4 text-green-500" /> Enviar por WhatsApp
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onCheckStatus(nota)}>
                                                    <Activity className="mr-2 h-4 w-4 text-orange-500" /> Ver Estado SUNAT
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />

                                                {!nota.anulado && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600" onClick={() => onCancel(nota)}>
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
                    <div className="text-center py-8 text-gray-500">No se encontraron notas de crédito</div>
                )}
            </div>

            {/* Modales Reutilizados (JSON y Motivo) */}
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

            <Dialog open={showReasonModal} onOpenChange={setShowReasonModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Motivo de Baja
                        </DialogTitle>
                    </DialogHeader>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-2">
                        <p className="text-sm text-red-900 whitespace-pre-wrap leading-relaxed">
                            {selectedReason}
                        </p>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReasonModal(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}