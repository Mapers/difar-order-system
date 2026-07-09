import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Eye, MoreHorizontal, XCircle, Loader2, FileJson, Code,
    AlertCircle, Info, Truck, MessageCircle, Mail, Activity, Lock, PenLine, CalendarClock, ArrowLeftRight, Warehouse
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { addHours, format, parseISO } from "date-fns"
import { Comprobante } from "@/app/types/order/order-interface"
import { RelatedGuidesModal } from "@/app/dashboard/comprobantes/modals/RelatedGuidesModal"
import { Sequential } from "@/app/types/config-types"

interface ComprobantesTableProps {
    comprobantes: Comprobante[]
    loading: boolean
    tiposComprobante: Sequential[]
    isAdmin: boolean
    onViewPdf: (url: string) => void
    onCancel: (comprobante: Comprobante) => void
    onSendEmail: (comprobante: Comprobante) => void
    onSendWhatsApp: (comprobante: Comprobante) => void
    onCheckStatus: (comprobante: Comprobante) => void
    onCorregirDescripcion: (comprobante: Comprobante) => void
    onModificarCuotas: (comprobante: Comprobante) => void
    onTransferirVendedor: (comprobante: Comprobante) => void
    onTransferirAlmacen: (comprobante: Comprobante) => void
}

export function ComprobantesTable({
                                      comprobantes, loading, tiposComprobante, isAdmin, onViewPdf, onCancel,
                                      onSendEmail, onSendWhatsApp, onCheckStatus, onCorregirDescripcion,
                                      onModificarCuotas, onTransferirVendedor, onTransferirAlmacen
                                  }: ComprobantesTableProps) {
    const [showJsonModal,    setShowJsonModal]    = useState(false)
    const [jsonContent,      setJsonContent]      = useState("")
    const [jsonTitle,        setJsonTitle]        = useState("")
    const [showReasonModal,  setShowReasonModal]  = useState(false)
    const [showMotivoNCModal, setShowMotivoNCModal] = useState(false)
    const [selectedReason,   setSelectedReason]   = useState("")
    const [showGuidesModal,  setShowGuidesModal]  = useState(false)
    const [selectedComprobanteForGuides, setSelectedComprobanteForGuides] = useState<Comprobante | null>(null)

    const getTipoComprobante = (serie: string) => {
        const tipoObj = tiposComprobante.find(t => t.prefijo == serie)
        return tipoObj ? tipoObj.nombre : "Desconocido"
    }

    const handleVerPdf = (comprobante: Comprobante) => {
        if (comprobante.enlace) {
            onViewPdf(comprobante.enlace)
        } else if (comprobante.enlace_pdf) {
            onViewPdf(`data:application/pdf;base64,${comprobante.enlace_pdf}`)
        }
    }

    const handleViewReason = (reason: string) => {
        setSelectedReason(reason || "Sin motivo especificado.")
        setShowReasonModal(true)
    }

    const handleViewReasonNC = (reason: string) => {
        setSelectedReason(reason || "Sin motivo especificado.")
        setShowMotivoNCModal(true)
    }

    const handleViewGuides = (comprobante: Comprobante) => {
        setSelectedComprobanteForGuides(comprobante)
        setShowGuidesModal(true)
    }

    const getEstadoConfig = (comprobante: Comprobante): {
        label: string
        cellBg: string
        textColor: string
        icon?: React.ReactNode
        extra?: React.ReactNode
    } => {
        if (comprobante.estado_correlativo === 'LIBRE') {
            return {
                label: 'LIBRE',
                cellBg: 'bg-muted',
                textColor: 'text-muted-foreground',
                icon: <Lock className="h-3.5 w-3.5 mr-1 opacity-60" />
            }
        }

        if (comprobante.tipo_comprobante === null) {
            return {
                label: comprobante?.estado || '',
                cellBg: 'bg-muted',
                textColor: 'text-muted-foreground',
            }
        }

        if (comprobante.tipoNC !== 'sin_nc') {
            return {
                label: `NC ${comprobante.tipoNC.toUpperCase()}`,
                cellBg: 'bg-purple-50',
                textColor: 'text-purple-700',
            }
        }

        if (comprobante.aceptada_por_sunat != null && comprobante.aceptada_por_sunat === 104) {
            return {
                label: 'Rechazado',
                cellBg: 'bg-orange-50',
                textColor: 'text-orange-700',
            }
        }

        if (comprobante.anulado) {
            return {
                label: 'Anulado',
                cellBg: 'bg-red-50',
                textColor: 'text-red-700',
                extra: comprobante.motivo_anulado ? (
                    <button
                        className="ml-1 text-red-400 hover:text-red-600"
                        onClick={() => handleViewReason(comprobante.motivo_anulado!)}
                        title="Ver motivo"
                    >
                        <AlertCircle className="h-3.5 w-3.5" />
                    </button>
                ) : undefined
            }
        }

        return {
            label: 'Activo',
            cellBg: 'bg-green-50',
            textColor: 'text-green-700',
            extra: (comprobante.tieneNCModificacion === 1) ? (
                <button
                    className="ml-1 text-blue-400 hover:text-blue-600"
                    onClick={() => handleViewReasonNC('ESTE DOCUMENTO TIENE MODIFICACIONES, REVISAR NOTAS DE CRÉDITO')}
                    title="Ver motivo"
                >
                    <AlertCircle className="h-3.5 w-3.5" />
                </button>
            ) : undefined
        }
    }

    const EstadoCell = ({ comprobante, mobile = false }: { comprobante: Comprobante; mobile?: boolean }) => {
        const config = getEstadoConfig(comprobante)
        if (mobile) {
            return (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${config.cellBg} ${config.textColor}`}>
                    {config.icon}
                    {config.label}
                    {config.extra}
                </span>
            )
        }
        return (
            <div className={`absolute inset-0 flex items-center px-3 ${config.cellBg}`}>
                <span className={`flex items-center text-xs font-semibold ${config.textColor}`}>
                    {config.icon}
                    {config.label}
                    {config.extra}
                </span>
            </div>
        )
    }

    const handleViewJson = (title: string, content: string) => {
        setJsonTitle(title)
        try {
            const parsed = typeof content === 'string' ? JSON.parse(content) : content
            setJsonContent(JSON.stringify(parsed, null, 2))
        } catch {
            setJsonContent(content || "Sin contenido disponible")
        }
        setShowJsonModal(true)
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 flex-col">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <div>Procesando esto puede tomar unos segundos...</div>
            </div>
        )
    }

    const esLibre = (c: Comprobante) => c.estado_correlativo === 'LIBRE'

    return (
        <>
            <div className="hidden lg:block">
                <Card className="bg-background shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted">
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Fecha</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Tipo</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Serie/Número</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Almacén</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Vendedor</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Cliente</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Documento</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Total</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Estado</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="bg-background divide-y divide-border">
                            {comprobantes.length > 0 ? (
                                comprobantes.map((comprobante) => (
                                    <tr key={`${comprobante.serie}-${comprobante.numero}`}
                                        className={`hover:brightness-95 transition-all ${esLibre(comprobante) ? 'opacity-60' : ''}`}>
                                        <td className="p-4 text-sm">
                                            {comprobante.fecha_envio
                                                ? format(addHours(parseISO(comprobante.fecha_envio), 5), "dd/MM/yyyy HH:mm a")
                                                : '—'}
                                        </td>
                                        <td className="p-4 text-sm">{getTipoComprobante(comprobante.serie)}</td>
                                        <td className="p-4 font-medium text-sm">{comprobante.serie}-{comprobante.numero}</td>
                                        <td className="p-4 text-sm">{comprobante.Almacen ?? '—'}</td>
                                        <td className="p-4 text-sm">{comprobante.Vendedor ?? '—'}</td>
                                        <td className="p-4">
                                            <div className="font-medium text-sm">
                                                {comprobante.cliente_denominacion ?? '—'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm">{comprobante.cliente_numdoc ?? '—'}</td>
                                        <td className="p-4 font-medium text-sm">
                                            {comprobante.total != null
                                                ? `${comprobante.moneda === 1 ? 'S/ ' : '$ '}${Number(comprobante.total).toFixed(2)}`
                                                : '—'}
                                        </td>
                                        <td className="relative p-0 min-w-[100px]">
                                            <EstadoCell comprobante={comprobante} />
                                        </td>
                                        <td className="p-4">
                                            {(comprobante.tipo_comprobante !== null && !esLibre(comprobante)) && (
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="icon"
                                                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            onClick={() => handleVerPdf(comprobante)} title="Ver PDF">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {comprobante.tieneGuia === 1 && (
                                                        <Button variant="ghost" size="icon"
                                                                className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                                onClick={() => handleViewGuides(comprobante)}
                                                                title="Ver Guías de Remisión">
                                                            <Truck className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-56">
                                                            <DropdownMenuItem onClick={() => handleViewJson('JSON Solicitud (Request)', comprobante.raw_request!)}>
                                                                <Code className="mr-2 h-4 w-4 text-muted-foreground" /> JSON Solicitud
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleViewJson('JSON Respuesta (Response)', comprobante.raw_response!)}>
                                                                <FileJson className="mr-2 h-4 w-4 text-muted-foreground" /> JSON Respuesta
                                                            </DropdownMenuItem>
                                                            {isAdmin && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem onClick={() => onSendEmail(comprobante)}>
                                                                        <Mail className="mr-2 h-4 w-4 text-blue-500" /> Enviar por Correo
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => onSendWhatsApp(comprobante)}>
                                                                        <MessageCircle className="mr-2 h-4 w-4 text-green-500" /> Enviar por WhatsApp
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => onCheckStatus(comprobante)}>
                                                                        <Activity className="mr-2 h-4 w-4 text-orange-500" /> Ver Estado SUNAT
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}

                                                            {isAdmin && !comprobante.anulado && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem onClick={() => onTransferirVendedor(comprobante)}>
                                                                        <ArrowLeftRight className="mr-2 h-4 w-4 text-indigo-500" /> Transferir Vendedor
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => onTransferirAlmacen(comprobante)}>
                                                                        <Warehouse className="mr-2 h-4 w-4 text-indigo-500" /> Transferir Almacén
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}

                                                            {isAdmin && (!comprobante.anulado && comprobante.tipoNC === 'sin_nc') && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem onClick={() => onCorregirDescripcion(comprobante)}>
                                                                        <PenLine className="mr-2 h-4 w-4 text-blue-500" /> Corregir Descripción
                                                                    </DropdownMenuItem>
                                                                    {comprobante.condicionCredito === '1' && (
                                                                        <DropdownMenuItem onClick={() => onModificarCuotas(comprobante)}>
                                                                            <CalendarClock className="mr-2 h-4 w-4 text-purple-500" /> Modificar Cuotas
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                </>
                                                            )}

                                                            {isAdmin && (!comprobante.anulado && comprobante.tipoNC === 'sin_nc') && (
                                                                <DropdownMenuItem className="text-red-600" onClick={() => onCancel(comprobante)}>
                                                                    <XCircle className="mr-2 h-4 w-4" /> Anular Comprobante
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={10} className="text-center py-8 text-muted-foreground">No se encontraron comprobantes</td></tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            <div className="lg:hidden space-y-3">
                {comprobantes.length > 0 ? (
                    comprobantes.map((comprobante) => (
                        <Card key={`${comprobante.serie}-${comprobante.numero}`}
                              className={`border border-border ${esLibre(comprobante) ? 'opacity-60' : ''}`}>
                            <CardContent className="p-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-card-foreground">
                                                    {getTipoComprobante(comprobante.serie)} {comprobante.serie}-{comprobante.numero}
                                                </span>
                                                <EstadoCell comprobante={comprobante} mobile />
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {comprobante.fecha_envio
                                                    ? format(parseISO(comprobante.fecha_envio), "dd/MM/yyyy")
                                                    : '—'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-card-foreground">
                                                {comprobante.total != null
                                                    ? `${comprobante.moneda === 1 ? 'S/ ' : '$ '}${Number(comprobante.total).toFixed(2)}`
                                                    : '—'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Total</p>
                                        </div>
                                    </div>

                                    {(comprobante.tipo_comprobante !== null && !esLibre(comprobante)) && (
                                        <>
                                            <div className="border-t pt-3 w-full overflow-hidden">
                                                {comprobante.Almacen && (
                                                    <p className="text-xs text-muted-foreground mb-0.5">Almacén: {comprobante.Almacen}</p>
                                                )}
                                                {comprobante.Vendedor && (
                                                    <p className="text-xs text-muted-foreground mb-0.5">Vend: {comprobante.Vendedor}</p>
                                                )}
                                                <p className="font-medium text-card-foreground break-words line-clamp-2"
                                                   title={comprobante.cliente_denominacion ?? ''}>
                                                    {comprobante.cliente_denominacion ?? '—'}
                                                </p>
                                                <p className="text-sm text-muted-foreground break-words mt-0.5">
                                                    {comprobante.cliente_numdoc ?? '—'}
                                                </p>
                                            </div>
                                            <div className="border-t pt-3 flex gap-2">
                                                <Button variant="outline" size="sm" className="text-xs bg-transparent"
                                                        onClick={() => handleVerPdf(comprobante)}>
                                                    <Eye className="h-3 w-3 mr-1" /> Ver PDF
                                                </Button>
                                                {comprobante.tieneGuia === 1 && (
                                                    <Button variant="outline" size="sm"
                                                            className="text-xs bg-transparent text-orange-700"
                                                            onClick={() => handleViewGuides(comprobante)}>
                                                        <Truck className="h-3 w-3 mr-1" /> Guías
                                                    </Button>
                                                )}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="sm" className="text-xs bg-transparent">
                                                            <MoreHorizontal className="h-3 w-3 mr-1" /> Opciones
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56">
                                                        {(comprobante.anulado && comprobante.motivo_anulado) && (
                                                            <DropdownMenuItem onClick={() => handleViewReason(comprobante.motivo_anulado!)}>
                                                                <Info className="mr-2 h-4 w-4 text-red-500" /> Ver Motivo Anulación
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={() => handleViewJson('JSON Solicitud', comprobante.raw_request!)}>
                                                            <Code className="mr-2 h-4 w-4 text-muted-foreground" /> JSON Solicitud
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleViewJson('JSON Respuesta', comprobante.raw_response!)}>
                                                            <FileJson className="mr-2 h-4 w-4 text-muted-foreground" /> JSON Respuesta
                                                        </DropdownMenuItem>
                                                        {isAdmin && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => onSendEmail(comprobante)}>
                                                                    <Mail className="mr-2 h-4 w-4 text-blue-500" /> Enviar por Correo
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => onSendWhatsApp(comprobante)}>
                                                                    <MessageCircle className="mr-2 h-4 w-4 text-green-500" /> Enviar por WhatsApp
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => onCheckStatus(comprobante)}>
                                                                    <Activity className="mr-2 h-4 w-4 text-orange-500" /> Ver Estado SUNAT
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        {isAdmin && !comprobante.anulado && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => onTransferirVendedor(comprobante)}>
                                                                    <ArrowLeftRight className="mr-2 h-4 w-4 text-indigo-500" /> Transferir Vendedor
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => onTransferirAlmacen(comprobante)}>
                                                                    <Warehouse className="mr-2 h-4 w-4 text-indigo-500" /> Transferir Almacén
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        {isAdmin && (!comprobante.anulado && comprobante.tipoNC === 'sin_nc') && (
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
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-8 text-muted-foreground">No se encontraron comprobantes</div>
                )}
            </div>

            <Dialog open={showJsonModal} onOpenChange={setShowJsonModal}>
                <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileJson className="h-5 w-5 text-blue-600" /> {jsonTitle}
                        </DialogTitle>
                        <DialogDescription>Visualización de datos crudos de la transacción.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 w-full overflow-hidden rounded-md border bg-slate-950 p-4 text-white">
                        <pre className="h-full w-full overflow-auto text-xs font-mono">{jsonContent}</pre>
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
                            <AlertCircle className="h-5 w-5" /> Motivo de Anulación
                        </DialogTitle>
                    </DialogHeader>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-2">
                        <p className="text-sm text-red-900 whitespace-pre-wrap leading-relaxed">{selectedReason}</p>
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

            <RelatedGuidesModal
                open={showGuidesModal}
                onOpenChange={setShowGuidesModal}
                comprobante={selectedComprobanteForGuides}
                onViewPdf={onViewPdf}
            />
        </>
    )
}