import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Eye, MoreHorizontal, XCircle, Loader2, FileJson, Code,
    AlertCircle, Info, Truck, MessageCircle, Mail, Activity, Lock, PenLine, CalendarClock, ArrowLeftRight, Warehouse,
    ClipboardCheck, CalendarDays, UserRound, FileText as FileTextIcon
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { addHours, format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { Comprobante } from "@/app/types/order/order-interface"
import { RelatedGuidesModal } from "@/app/dashboard/comprobantes/modals/RelatedGuidesModal"
import { Sequential } from "@/app/types/config-types"
import { getEstadoSunatDestacable } from "@/app/utils/sunat"

interface ComprobantesGridProps {
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
    onGestionarConformidad: (comprobante: Comprobante) => void
    puedeGestionarConformidad: boolean
}

// Vista alternativa a ComprobantesTable: mismas acciones y datos, en tarjetas
// (3 por fila en desktop) en vez de tabla. Mismo contrato de props para
// poder alternar entre ambas sin tocar la página que las usa.
export function ComprobantesGrid({
                                      comprobantes, loading, tiposComprobante, isAdmin, onViewPdf, onCancel,
                                      onSendEmail, onSendWhatsApp, onCheckStatus, onCorregirDescripcion,
                                      onModificarCuotas, onTransferirVendedor, onTransferirAlmacen,
                                      onGestionarConformidad, puedeGestionarConformidad
                                  }: ComprobantesGridProps) {
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

    const getEstadoConfig = (comprobante: Comprobante): {
        label: string
        badgeBg: string
        textColor: string
        icon?: React.ReactNode
        extra?: React.ReactNode
    } => {
        if (comprobante.estado_correlativo === 'LIBRE') {
            return {
                label: 'LIBRE',
                badgeBg: 'bg-muted',
                textColor: 'text-muted-foreground',
                icon: <Lock className="h-3 w-3 mr-1 opacity-60" />
            }
        }

        if (comprobante.tipo_comprobante === null) {
            return {
                label: comprobante?.estado || '',
                badgeBg: 'bg-muted',
                textColor: 'text-muted-foreground',
            }
        }

        if (comprobante.anulado) {
            return {
                label: 'Anulado',
                badgeBg: 'bg-red-50 border border-red-200',
                textColor: 'text-red-700',
                extra: comprobante.motivo_anulado ? (
                    <button
                        className="ml-1 text-red-400 hover:text-red-600"
                        onClick={() => handleViewReason(comprobante.motivo_anulado!)}
                        title="Ver motivo"
                    >
                        <AlertCircle className="h-3 w-3" />
                    </button>
                ) : undefined
            }
        }

        const estadoSunat = getEstadoSunatDestacable(comprobante.estado_sunat)
        if (estadoSunat) {
            const { Icon } = estadoSunat
            return {
                label: estadoSunat.label,
                badgeBg: `${estadoSunat.cellBg} border border-current/10`,
                textColor: estadoSunat.textColor,
                icon: <Icon className="h-3 w-3 mr-1" />,
                extra: comprobante.estado_sunat_desc ? (
                    <button
                        className="ml-1 opacity-60 hover:opacity-100"
                        onClick={() => handleViewReason(comprobante.estado_sunat_desc!)}
                        title="Ver detalle de SUNAT"
                    >
                        <AlertCircle className="h-3 w-3" />
                    </button>
                ) : undefined
            }
        }

        if (comprobante.tipoNC === 'nota_credito') {
            return {
                label: 'Nota de Crédito',
                badgeBg: 'bg-purple-50 border border-purple-200',
                textColor: 'text-purple-700',
            }
        }

        if (comprobante.tipoNC !== 'sin_nc') {
            return {
                label: `NC ${comprobante.tipoNC.toUpperCase()}`,
                badgeBg: 'bg-purple-50 border border-purple-200',
                textColor: 'text-purple-700',
            }
        }

        return {
            label: 'Activo',
            badgeBg: 'bg-green-50 border border-green-200',
            textColor: 'text-green-700',
            extra: (comprobante.tieneNCModificacion === 1) ? (
                <button
                    className="ml-1 text-blue-400 hover:text-blue-600"
                    onClick={() => handleViewReasonNC('ESTE DOCUMENTO TIENE MODIFICACIONES, REVISAR NOTAS DE CRÉDITO')}
                    title="Ver motivo"
                >
                    <AlertCircle className="h-3 w-3" />
                </button>
            ) : undefined
        }
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

    if (comprobantes.length === 0) {
        return <div className="text-center py-12 text-muted-foreground">No se encontraron comprobantes</div>
    }

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {comprobantes.map((comprobante) => {
                    const config = getEstadoConfig(comprobante)
                    const activo = comprobante.tipo_comprobante !== null && !esLibre(comprobante)

                    return (
                        <Card
                            key={`${comprobante.serie}-${comprobante.numero}`}
                            className={cn(
                                "flex flex-col overflow-hidden border shadow-sm transition-shadow hover:shadow-md",
                                esLibre(comprobante) && "opacity-60"
                            )}
                        >
                            <CardContent className="flex flex-1 flex-col p-0">
                                <div className="flex items-start justify-between gap-2 border-b border-border bg-muted/40 p-4">
                                    <div className="min-w-0 flex items-start gap-2.5">
                                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                            <FileTextIcon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground truncate">
                                                {getTipoComprobante(comprobante.serie)}
                                            </p>
                                            <p className="font-bold text-sm text-foreground truncate">
                                                {comprobante.serie}-{comprobante.numero}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`inline-flex shrink-0 items-center px-2 py-1 rounded-full text-[11px] font-semibold ${config.badgeBg} ${config.textColor}`}>
                                        {config.icon}
                                        {config.label}
                                        {config.extra}
                                    </span>
                                </div>

                                <div className="flex flex-1 flex-col gap-3 p-4">
                                    <div>
                                        <p
                                            className="font-semibold text-sm text-foreground line-clamp-2 leading-snug"
                                            title={comprobante.cliente_denominacion ?? ''}
                                        >
                                            {comprobante.cliente_denominacion ?? '—'}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {comprobante.cliente_numdoc ?? '—'}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate">
                                                {comprobante.fecha_envio
                                                    ? format(addHours(parseISO(comprobante.fecha_envio), 5), "dd/MM/yyyy HH:mm a")
                                                    : '—'}
                                            </span>
                                        </div>
                                        {comprobante.Vendedor && (
                                            <div className="flex items-center gap-1.5">
                                                <UserRound className="h-3.5 w-3.5 shrink-0" />
                                                <span className="truncate">{comprobante.Vendedor}</span>
                                            </div>
                                        )}
                                        {comprobante.Almacen && (
                                            <div className="flex items-center gap-1.5">
                                                <Warehouse className="h-3.5 w-3.5 shrink-0" />
                                                <span className="truncate">{comprobante.Almacen}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-auto flex items-end justify-between gap-2 border-t border-border pt-3">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</p>
                                            <p className="text-lg font-bold text-foreground leading-tight">
                                                {comprobante.total != null
                                                    ? `${comprobante.moneda === 1 ? 'S/ ' : '$ '}${Number(comprobante.total).toFixed(2)}`
                                                    : '—'}
                                            </p>
                                        </div>

                                        {activo && (
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon"
                                                        className="h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => handleVerPdf(comprobante)} title="Ver PDF">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {comprobante.tieneGuia === 1 && (
                                                    <Button variant="ghost" size="icon"
                                                            className="h-9 w-9 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                            onClick={() => handleViewGuides(comprobante)}
                                                            title="Ver Guías de Remisión">
                                                        <Truck className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {comprobante.tiene_conformidad === 1 && (
                                                    <Button variant="ghost" size="icon"
                                                            className="h-9 w-9 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                            onClick={() => onGestionarConformidad(comprobante)}
                                                            title="Ver conformidad de entrega">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9">
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
                                                        {puedeGestionarConformidad && comprobante.idSunat != null && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => onGestionarConformidad(comprobante)}>
                                                                    <ClipboardCheck className="mr-2 h-4 w-4 text-emerald-600" />
                                                                    {comprobante.tiene_conformidad === 1
                                                                        ? 'Cambiar conformidad'
                                                                        : 'Subir conformidad'}
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
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
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
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
