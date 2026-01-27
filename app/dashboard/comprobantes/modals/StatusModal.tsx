import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, XCircle, AlertCircle, Clock, FileText, Hash } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface StatusData {
    estado_documento: string
    estado_descripcion: string
    sunat_responsecode: string
    sunat_description: string
    serie_cpe: string
    correlativo_cpe: string
    tipo_cpe: string
    codigo_hash: string
    errors?: string
    cadena_para_codigo_qr?: string
}

interface StatusModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    data: StatusData | null
    loading: boolean
}

export function StatusModal({ open, onOpenChange, data, loading }: StatusModalProps) {

    const getStatusConfig = (estado: string) => {
        switch (estado) {
            case "102": // ACEPTADO
                return { color: "bg-green-100 text-green-800 border-green-200", icon: <CheckCircle2 className="h-12 w-12 text-green-600" />, label: "ACEPTADO" }
            case "103": // ACEPTADO CON OBS
                return { color: "bg-blue-100 text-blue-800 border-blue-200", icon: <AlertCircle className="h-12 w-12 text-blue-600" />, label: "ACEPTADO CON OBS." }
            case "101": // EN PROCESO
                return { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <Clock className="h-12 w-12 text-yellow-600" />, label: "EN PROCESO" }
            case "104": // RECHAZADO
            case "105": // ANULADO
                return { color: "bg-red-100 text-red-800 border-red-200", icon: <XCircle className="h-12 w-12 text-red-600" />, label: "RECHAZADO / ANULADO" }
            default:
                return { color: "bg-gray-100 text-gray-800 border-gray-200", icon: <AlertCircle className="h-12 w-12 text-gray-600" />, label: "DESCONOCIDO" }
        }
    }

    const statusConfig = data ? getStatusConfig(data.estado_documento) : null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Estado del Documento</DialogTitle>
                    <DialogDescription>Detalle de la respuesta de SUNAT/OSE</DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-sm text-muted-foreground">Consultando estado...</p>
                    </div>
                ) : data && statusConfig ? (
                    <div className="flex flex-col space-y-6">
                        <div className={`flex flex-col items-center justify-center p-6 rounded-lg border ${statusConfig.color} bg-opacity-50`}>
                            {statusConfig.icon}
                            <h3 className="mt-2 font-bold text-lg">{data.estado_descripcion || statusConfig.label}</h3>
                            <p className="text-xs opacity-75 mt-1">Cód. Interno: {data.estado_documento}</p>
                        </div>

                        {/*<div className="grid grid-cols-2 gap-4 text-sm">*/}
                        {/*    <div className="space-y-1">*/}
                        {/*        <span className="text-xs text-muted-foreground font-medium">Documento</span>*/}
                        {/*        <div className="flex items-center font-medium">*/}
                        {/*            <FileText className="h-4 w-4 mr-2 text-blue-500" />*/}
                        {/*            {data.serie_cpe}-{data.correlativo_cpe}*/}
                        {/*        </div>*/}
                        {/*    </div>*/}
                        {/*    <div className="space-y-1">*/}
                        {/*        <span className="text-xs text-muted-foreground font-medium">Código Hash</span>*/}
                        {/*        <div className="flex items-center text-xs break-all" title={data.codigo_hash}>*/}
                        {/*            <Hash className="h-3 w-3 mr-1 text-gray-500" />*/}
                        {/*            <span className="truncate w-32">{data.codigo_hash || "-"}</span>*/}
                        {/*        </div>*/}
                        {/*    </div>*/}
                        {/*</div>*/}

                        {/*<Separator />*/}

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <h4 className="text-sm font-semibold">Respuesta SUNAT</h4>
                                <Badge variant="outline" className={data.sunat_responsecode === "0" ? "border-green-500 text-green-700" : "border-orange-500 text-orange-700"}>
                                    Cód: {data.sunat_responsecode || "---"}
                                </Badge>
                            </div>
                            <ScrollArea className="h-[80px] w-full rounded-md border p-3 bg-slate-50">
                                <p className="text-xs text-gray-700">
                                    {data.sunat_description || "Sin descripción disponible."}
                                </p>
                                {data.errors && (
                                    <p className="text-xs text-red-600 mt-2 font-medium">
                                        Error: {data.errors}
                                    </p>
                                )}
                            </ScrollArea>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        No se pudo cargar la información.
                    </div>
                )}

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}