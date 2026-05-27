'use client'

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RefreshCcw, Eye, Loader2, CheckCircle, XCircle, Clock, Building, MapPin, User, Users, Briefcase } from "lucide-react"
import { toast } from "@/app/hooks/useToast"
import { ClientService } from "@/app/services/client/ClientService"
import { ISolicitudCliente, IRegistroDigemid } from "@/app/dashboard/clientes/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const ESTADO_CONFIG = {
    solicitando: { label: "Solicitando", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
    completado:  { label: "Completado",  color: "bg-green-100 text-green-800 border-green-200",  icon: CheckCircle },
    aprobado:    { label: "Aprobado",    color: "bg-blue-100 text-blue-800 border-blue-200",    icon: CheckCircle },
    rechazado:   { label: "Rechazado",   color: "bg-red-100 text-red-800 border-red-200",     icon: XCircle },
}

function formatFecha(fecha: string) {
    if (!fecha) return '-'
    try {
        return format(new Date(fecha), "dd/MM/yyyy HH:mm", { locale: es })
    } catch { return fecha }
}

function EstadoBadge({ estado }: { estado: ISolicitudCliente['estado'] }) {
    const cfg = ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.solicitando
    const Icon = cfg.icon
    return (
        <Badge variant="outline" className={`${cfg.color} flex items-center gap-1 w-fit`}>
            <Icon className="h-3 w-3" />
            {cfg.label}
        </Badge>
    )
}

function RegistroCard({ registro }: { registro: IRegistroDigemid }) {
    const [expanded, setExpanded] = useState(false)
    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                    <p className="font-bold text-sm text-slate-800">{registro.nombreComercial}</p>
                    <p className="text-xs text-slate-500">{registro.razonSocial}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs">{registro.categoria}</Badge>
                    <Badge variant="outline" className={registro.situacion === 'ACTIVO' ? 'bg-green-50 text-green-700 border-green-200 text-xs' : 'text-xs'}>
                        {registro.situacion}
                    </Badge>
                </div>
            </div>

            <div className="px-4 py-3 space-y-2 text-sm">
                <div className="flex items-start gap-2 text-slate-600">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
                    <span>{registro.direccion}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                    <Building className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>{registro.ubigeo}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium">Nro. Registro:</span>
                    <span>{registro.nroRegistro}</span>
                    <span className="mx-1">·</span>
                    <span className="font-medium">RUC:</span>
                    <span>{registro.ruc}</span>
                </div>
            </div>

            {registro.detalle && (
                <>
                    <div className="px-4 pb-3">
                        <button
                            className="text-xs text-blue-600 hover:underline"
                            onClick={() => setExpanded(!expanded)}
                        >
                            {expanded ? "Ocultar detalle" : "Ver detalle completo"}
                        </button>
                    </div>

                    {expanded && (
                        <div className="border-t border-slate-200 px-4 py-3 space-y-4 bg-slate-50/50">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                                <div><span className="font-semibold text-slate-500 block">Lugar de registro</span>{registro.detalle.lugarRegistro || '-'}</div>
                                <div><span className="font-semibold text-slate-500 block">Fecha inicio</span>{registro.detalle.fechaInicio || '-'}</div>
                                <div><span className="font-semibold text-slate-500 block">Horario</span>{registro.detalle.horario || '-'}</div>
                                <div><span className="font-semibold text-slate-500 block">Empadronado</span>{registro.empadronado || '-'}</div>
                            </div>

                            {registro.detalle.representantes?.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-600 flex items-center gap-1 mb-2">
                                        <User className="h-3 w-3" /> Representantes
                                    </p>
                                    <div className="space-y-1">
                                        {registro.detalle.representantes.map((rep, i) => (
                                            <div key={i} className="text-xs text-slate-700 bg-white border border-slate-100 rounded px-3 py-2 flex flex-wrap gap-x-4">
                                                {Object.entries(rep).map(([k, v]) => (
                                                    <span key={k}><span className="text-slate-400">{k}:</span> {v}</span>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {registro.detalle.personal?.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-600 flex items-center gap-1 mb-2">
                                        <Users className="h-3 w-3" /> Personal
                                    </p>
                                    <div className="space-y-1">
                                        {registro.detalle.personal.map((p, i) => (
                                            <div key={i} className="text-xs text-slate-700 bg-white border border-slate-100 rounded px-3 py-2 flex flex-wrap gap-x-4">
                                                {Object.entries(p).map(([k, v]) => (
                                                    <span key={k}><span className="text-slate-400">{k}:</span> {v}</span>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

function DetalleSolicitudModal({
    solicitud,
    open,
    onOpenChange,
    onAccion,
}: {
    solicitud: ISolicitudCliente | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onAccion: (tipo: 'aprobar' | 'rechazar') => Promise<void>
}) {
    const [actionLoading, setActionLoading] = useState<'aprobar' | 'rechazar' | null>(null)

    if (!solicitud) return null

    const resultado = solicitud.resultado
    const puedeAccionar = solicitud.estado === 'completado'

    const handleAccion = async (tipo: 'aprobar' | 'rechazar') => {
        setActionLoading(tipo)
        try {
            await onAccion(tipo)
            onOpenChange(false)
        } finally {
            setActionLoading(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!actionLoading) onOpenChange(v) }}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-blue-600" />
                        Resultado de Solicitud
                        <span className="font-mono text-base text-slate-500">— RUC: {solicitud.ruc}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-1 space-y-3 py-2">
                    {!resultado || resultado.total === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-sm">
                            No se encontraron registros para este RUC en DIGEMID.
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-slate-500">
                                Se encontraron <span className="font-semibold text-slate-700">{resultado.total}</span> registro{resultado.total !== 1 ? 's' : ''}.
                            </p>
                            {resultado.registros.map((reg, i) => (
                                <RegistroCard key={reg.idRegistro ?? i} registro={reg} />
                            ))}
                        </>
                    )}
                </div>

                {puedeAccionar && (
                    <DialogFooter className="border-t pt-4 gap-2">
                        <Button
                            variant="destructive"
                            onClick={() => handleAccion('rechazar')}
                            disabled={!!actionLoading}
                        >
                            {actionLoading === 'rechazar' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                            Rechazar
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleAccion('aprobar')}
                            disabled={!!actionLoading}
                        >
                            {actionLoading === 'aprobar' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                            Aprobar
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default function SolicitudesTab() {
    const [solicitudes, setSolicitudes] = useState<ISolicitudCliente[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedSolicitud, setSelectedSolicitud] = useState<ISolicitudCliente | null>(null)
    const [showDetalle, setShowDetalle] = useState(false)

    const cargarSolicitudes = useCallback(async () => {
        setLoading(true)
        try {
            const res = await ClientService.getSolicitudesClientes()
            setSolicitudes(res?.data || res || [])
        } catch {
            toast({ title: "Error", description: "No se pudieron cargar las solicitudes.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { cargarSolicitudes() }, [cargarSolicitudes])

    const handleVerDetalle = (solicitud: ISolicitudCliente) => {
        setSelectedSolicitud(solicitud)
        setShowDetalle(true)
    }

    const handleAccion = async (tipo: 'aprobar' | 'rechazar') => {
        if (!selectedSolicitud) return
        try {
            if (tipo === 'aprobar') {
                await ClientService.aprobarSolicitud(selectedSolicitud.id)
                toast({ description: "Solicitud aprobada correctamente." })
            } else {
                await ClientService.rechazarSolicitud(selectedSolicitud.id)
                toast({ description: "Solicitud rechazada." })
            }
            cargarSolicitudes()
        } catch {
            toast({ title: "Error", description: `No se pudo ${tipo} la solicitud.`, variant: "destructive" })
            throw new Error()
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                    {solicitudes.length} solicitud{solicitudes.length !== 1 ? 'es' : ''} registrada{solicitudes.length !== 1 ? 's' : ''}
                </p>
                <Button variant="outline" size="sm" onClick={cargarSolicitudes} disabled={loading}>
                    <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
            </div>

            <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                <TableHead className="font-semibold whitespace-nowrap px-4">RUC</TableHead>
                                <TableHead className="font-semibold whitespace-nowrap px-4">Solicitado por</TableHead>
                                <TableHead className="font-semibold whitespace-nowrap px-4">Fecha</TableHead>
                                <TableHead className="font-semibold whitespace-nowrap px-4">Estado</TableHead>
                                <TableHead className="font-semibold text-right whitespace-nowrap px-4">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 5 }).map((_, j) => (
                                            <TableCell key={j} className="px-4">
                                                <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : solicitudes.length > 0 ? (
                                solicitudes.map((sol) => (
                                    <TableRow key={sol.id} className="hover:bg-gray-50 transition-colors">
                                        <TableCell className="font-mono font-semibold text-sm px-4">{sol.ruc}</TableCell>
                                        <TableCell className="text-sm px-4 text-gray-600">{sol.solicitadoPor || '-'}</TableCell>
                                        <TableCell className="text-sm px-4 text-gray-600 whitespace-nowrap">{formatFecha(sol.fechaSolicitud)}</TableCell>
                                        <TableCell className="px-4"><EstadoBadge estado={sol.estado} /></TableCell>
                                        <TableCell className="text-right px-4">
                                            {(sol.estado === 'completado' || sol.estado === 'aprobado' || sol.estado === 'rechazado') && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleVerDetalle(sol)}
                                                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs"
                                                >
                                                    <Eye className="mr-1 h-3 w-3" /> Ver resultado
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                                        No hay solicitudes registradas.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <DetalleSolicitudModal
                solicitud={selectedSolicitud}
                open={showDetalle}
                onOpenChange={setShowDetalle}
                onAccion={handleAccion}
            />
        </div>
    )
}
