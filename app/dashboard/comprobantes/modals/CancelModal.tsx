import {useEffect, useState} from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { XCircle, AlertTriangle, Loader2 } from "lucide-react"
import { Comprobante } from "@/interface/order/order-interface"
import apiClient from "@/app/api/client";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

interface CancelModalProps {
    open: boolean
    onOpenChange: (open: boolean, opera: string) => void
    comprobante: Comprobante | null
    tiposComprobante: any[]
    isCancelling: boolean
    onConfirm: (motivo: string) => void
}

export function CancelModal({ open, onOpenChange, comprobante, tiposComprobante, isCancelling, onConfirm }: CancelModalProps) {
    const [motivo, setMotivo] = useState("")
    const [idOperacion, setIdOperacion] = useState<string>("")
    const [operaciones, setOperaciones] = useState<any[]>([])
    const [loadingOps, setLoadingOps] = useState(false)

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) setMotivo("")
        onOpenChange(isOpen, idOperacion)
    }

    const getTipoDesc = (tipo: number) => {
        const t = tiposComprobante.find((tc: any) => tc.tipo === String(tipo) || tc.idTipoComprobante === tipo)
        return t ? t.descripcion : "Desconocido"
    }

    useEffect(() => {
        if (open) {
            const fetchOps = async () => {
                setLoadingOps(true)
                try {
                    const res = await apiClient.get('/admin/listar/operaciones')
                    setOperaciones(res.data.data || [])
                } finally { setLoadingOps(false) }
            }
            fetchOps()
        }
    }, [open])

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-600" /> Confirmar Anulación
                    </DialogTitle>
                </DialogHeader>

                {comprobante && (
                    <div className="space-y-4">
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                            <h4 className="font-medium text-gray-900 mb-2">Datos del Comprobante</h4>
                            <div className="text-sm space-y-1 text-gray-700">
                                <p><span className="font-semibold">Tipo:</span> {getTipoDesc(comprobante.tipo_comprobante)}</p>
                                <p><span className="font-semibold">Serie/Número:</span> {comprobante.serie}-{comprobante.numero}</p>
                                <p><span className="font-semibold">Cliente:</span> {comprobante.cliente_denominacion}</p>
                                <p><span className="font-semibold">Total:</span> {comprobante.moneda === 1 ? 'S/ ' : '$ '} {Number(comprobante.total).toFixed(2)}</p>
                            </div>
                        </div>

                        {comprobante.tieneGuia === 1 && (
                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 flex gap-3 items-start text-sm">
                                <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-orange-800">Guía de Remisión Asociada</p>
                                    <p className="text-orange-700">Este comprobante tiene una Guía de Remisión vinculada. Tenga en cuenta que al anularlo, deberá revisar el estado de la guía.</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label>Tipo de Operación *</Label>
                                <Select value={idOperacion} onValueChange={setIdOperacion}>
                                    <SelectTrigger className="border-red-200">
                                        <SelectValue placeholder={loadingOps ? "Cargando..." : "Seleccione motivo SUNAT"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {operaciones.map((op) => (
                                            <SelectItem key={op.Codigo_Op} value={op.Codigo_Op}>
                                                {op.Codigo_Op} - {op.Operacion}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="motivo">Sustento / Observación *</Label>
                                <Input
                                    id="motivo"
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value)}
                                    placeholder="Ej: Error en digitación de precio..."
                                />
                            </div>
                        </div>

                        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                            <p className="text-sm text-red-800 font-medium text-center">
                                ¿Estás seguro de anular este comprobante?
                                <br />
                                <span className="font-normal text-xs">Esta acción no se puede deshacer y generará una nota de crédito/baja.</span>
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCancelling} className="w-full sm:w-auto">Cancelar</Button>
                    <Button
                        onClick={() => onConfirm(motivo)}
                        disabled={isCancelling || !motivo.trim()}
                        variant="destructive"
                        className="w-full sm:w-auto"
                    >
                        {isCancelling ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Anulando...</> : <><XCircle className="mr-2 h-4 w-4" /> Confirmar Anulación</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}