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
    FileDiff, Info, Ban
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { format, parseISO } from "date-fns"
import { Comprobante } from "@/app/types/order/order-interface";
import {Sequential} from "@/app/types/config-types";

interface CreditNotesTableProps {
    notas: Comprobante[]
    loading: boolean
    tiposComprobante: Sequential[]
    isAdmin: boolean
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
                                     isAdmin,
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
    const [showMotivoNCModal, setShowMotivoNCModal] = useState(false)
    const [selectedReason, setSelectedReason] = useState("")

    const esNoUtilizado = (nota: Comprobante) =>
        nota.estado === 'No utilizado' || nota.idSunat == null

    const formatFecha = (fecha?: string | null) => {
        if (!fecha) return "—"
        try {
            return format(parseISO(fecha), "dd/MM/yyyy")
        } catch {
            return "—"
        }
    }

    const getTipoComprobante = (prefijo: string) => {
        const tipoObj = tiposComprobante.find(t => t.prefijo == prefijo && t.tipo === '7')
        return tipoObj ? tipoObj.nombre : "Nota de Crédito"
    }

    const handleViewReason = (reason: string) => {
        setSelectedReason(reason || "Sin motivo especificado.")
        setShowReasonModal(true)
    }

    const handleViewReasonNC = (reason: string) => {
        setSelectedReason(reason || "Sin motivo especificado.")
        setShowMotivoNCModal(true)
    }

    const getEstadoBadge = (nota: Comprobante) => {
        if (esNoUtilizado(nota)) {
            return (
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                    No utilizado
                </Badge>
            )
        }

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
        return <div className="flex items-center gap-1">
            <Badge className='bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200'>Emitido</Badge>
            {nota.motivo_descripcion && nota.motivo_descripcion !== 'Nota de Crédito' && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => handleViewReasonNC(nota.motivo_descripcion!)}
                    title="Ver motivo"
                >
                    <AlertCircle className="h-4 w-4" />
                </Button>
            )}
        </div>
    }

    const handleViewJson = (title: string, content: string | null) => {
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
                <Card className="bg-background shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted">
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Fecha Emisión</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Tipo</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Serie/Número</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Vendedor</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Cliente</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Documento</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Total</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Estado</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="bg-background divide-y divide-border">
                            {notas.length > 0 ? (
                                notas.map((nota) => {
                                    const noUtilizado = esNoUtilizado(nota)
                                    return (
                                        <tr
                                            key={`${nota.serie}-${nota.numero}-${nota.idSunat ?? 'libre'}`}
                                        >
                                            <td className="p-4 text-sm">{formatFecha(nota.fecha_envio)}</td>
                                            <td className="p-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    {noUtilizado ? "—" : getTipoComprobante(nota.serie)}
                                                </div>
                                            </td>
                                            <td className="p-4 font-medium text-sm">{nota.serie}-{nota.numero}</td>
                                            <td className="p-4 text-sm">{nota.Vendedor ?? '—'}</td>
                                            <td className="p-4">
                                                <div className={`font-medium text-sm`}>
                                                    {nota.cliente_denominacion}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm">{nota.cliente_numdoc ?? "—"}</td>
                                            <td className="p-4 font-medium text-sm text-red-600">
                                                {noUtilizado
                                                    ? <span className="text-muted-foreground">—</span>
                                                    : <>{nota.moneda === 1 ? 'S/ ' : '$ '} -{Number(nota.total ?? 0).toFixed(2)}</>
                                                }
                                            </td>
                                            <td className="p-4">{getEstadoBadge(nota)}</td>
                                            <td className="p-4">
                                                {noUtilizado ? (
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Ban className="h-3 w-3" /> Sin acciones
                                                </span>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => { if (nota.enlace) onViewPdf(nota.enlace); else if (nota.enlace_pdf) onViewPdf(`data:application/pdf;base64,${nota.enlace_pdf}`); }} disabled={!nota.enlace && !nota.enlace_pdf} title="Ver PDF">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-56">
                                                                <DropdownMenuItem onClick={() => handleViewJson('JSON Solicitud (Request)', nota.raw_request)}>
                                                                    <Code className="mr-2 h-4 w-4 text-muted-foreground" /> JSON Solicitud
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleViewJson('JSON Respuesta (Response)', nota.raw_response)}>
                                                                    <FileJson className="mr-2 h-4 w-4 text-muted-foreground" /> JSON Respuesta
                                                                </DropdownMenuItem>

                                                                {isAdmin && (
                                                                    <>
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
                                                                    </>
                                                                )}

                                                                {isAdmin && !nota.anulado && (
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
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">No se encontraron notas de crédito</td></tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            <div className="lg:hidden space-y-3">
                {notas.length > 0 ? (
                    notas.map((nota) => {
                        const noUtilizado = esNoUtilizado(nota)
                        return (
                            <Card
                                key={`${nota.serie}-${nota.numero}-${nota.idSunat ?? 'libre'}`}
                            >
                                <CardContent className="p-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <FileDiff className={`h-4 w-4 ${noUtilizado ? 'text-amber-500' : 'text-blue-500'}`} />
                                                    <span className="font-semibold text-card-foreground">{nota.serie}-{nota.numero}</span>
                                                    {getEstadoBadge(nota)}
                                                </div>
                                                <p className="text-sm text-muted-foreground">{formatFecha(nota.fecha_envio)}</p>
                                            </div>
                                            <div className="text-right">
                                                {noUtilizado ? (
                                                    <p className="text-sm font-medium text-amber-600">Correlativo libre</p>
                                                ) : (
                                                    <>
                                                        <p className="text-lg font-bold text-red-600">
                                                            {nota.moneda === 1 ? 'S/ ' : '$ '} -{Number(nota.total ?? 0).toFixed(2)}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">Total Devuelto</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="border-t pt-3">
                                            {nota.Vendedor && (
                                                <p className="text-xs text-muted-foreground mb-0.5">Vend: {nota.Vendedor}</p>
                                            )}
                                            <p className={`font-medium truncate ${noUtilizado ? 'italic text-amber-700' : 'text-card-foreground'}`}>
                                                {nota.cliente_denominacion}
                                            </p>
                                            <p className="text-sm text-muted-foreground">{nota.cliente_numdoc ?? "—"}</p>
                                        </div>

                                        {!noUtilizado && (
                                            <div className="border-t pt-3 flex gap-2">
                                                <Button variant="outline" size="sm" className="text-xs bg-transparent" onClick={() => nota.enlace && onViewPdf(nota.enlace)} disabled={!nota.enlace}>
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
                                                            <Code className="mr-2 h-4 w-4 text-muted-foreground" /> JSON Solicitud
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleViewJson('JSON Respuesta (Response)', nota.raw_response)}>
                                                            <FileJson className="mr-2 h-4 w-4 text-muted-foreground" /> JSON Respuesta
                                                        </DropdownMenuItem>

                                                        {isAdmin && (
                                                            <>
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
                                                            </>
                                                        )}

                                                        {isAdmin && !nota.anulado && (
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
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                ) : (
                    <div className="text-center py-8 text-muted-foreground">No se encontraron notas de crédito</div>
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
                            {selectedReason.toUpperCase()}
                        </p>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReasonModal(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showMotivoNCModal} onOpenChange={setShowMotivoNCModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Motivo de NC
                        </DialogTitle>
                    </DialogHeader>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-2">
                        <p className="text-sm text-blue-900 whitespace-pre-wrap leading-relaxed">
                            {selectedReason.toUpperCase()}
                        </p>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowMotivoNCModal(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}