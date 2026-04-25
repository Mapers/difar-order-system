'use client'
import { useState, useEffect, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sequential } from "@/app/types/config-types"
import { SunatTransaccion, TipoDocSunat } from "@/app/types/order/order-interface"
import {
    Dialog, DialogContent, DialogFooter,
    DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { FileText, Download, OctagonAlert, Link2, Loader2, RefreshCw } from "lucide-react"
import { Pedido, PedidoDet } from "@/app/dashboard/estados-pedidos/page"
import apiClient from "@/app/api/client"

interface ChangeStateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedOrder: Pedido | null
    pedidoHermano: Pedido | null
    detalle: PedidoDet[]
    loading: boolean
    pdfUrl: string
    getNextState: (state: number) => number
    getStateInfo: (stateId: number, porAutorizar: string, isAutorizado: string) => any
    onConfirm: () => void
    onCancel: () => void
    onDownload: () => void
    onPreview: (invoiceType: string, sunatTransaction: string, tipoSunat: string, selectedAlmacen: string) => void
    loadingPreview: boolean
    pdfPreviewBase64: string | null
    isPreviewOpen: boolean
    onClosePreview: () => void
    tiposComprobante: Sequential[]
    sunatTransacciones: SunatTransaccion[]
    tipoDocsSunat: TipoDocSunat[]
}

export function ChangeStateDialog({
                                      open, onOpenChange, selectedOrder, pedidoHermano,
                                      detalle, loading, pdfUrl, getNextState, getStateInfo,
                                      onConfirm, onCancel, onDownload,
                                      onPreview, loadingPreview, pdfPreviewBase64, isPreviewOpen, onClosePreview,
                                      tiposComprobante, sunatTransacciones, tipoDocsSunat,
                                  }: ChangeStateDialogProps) {
    const [invoiceType,      setInvoiceType]      = useState("")
    const [sunatTransaction, setSunatTransaction] = useState("")
    const [tipoSunat,        setTipoSunat]        = useState("")
    const [selectedAlmacen,  setSelectedAlmacen]  = useState("")
    const [previewExistente, setPreviewExistente] = useState<{
        serie: string
        numero: string
        tipo_cpe: string
    } | null>(null)
    const [loadingPreviewData, setLoadingPreviewData] = useState(false)

    useEffect(() => {
        if (!open || !selectedOrder) return

        const fetchPreviewExistente = async () => {
            setLoadingPreviewData(true)
            try {
                const res = await apiClient.get(
                    `/pedidos/getPreviewCompr?nroPedido=${selectedOrder.nroPedido}`
                )
                const data = res.data?.data
                if (data?.idPreview) {
                    setPreviewExistente({
                        serie:    data.serie    || '',
                        numero:   data.numero   || '',
                        tipo_cpe: data.tipo_cpe || '',
                    })

                    const matchTipo = tiposComprobante.find(
                        t => t.prefijo === data.serie
                    )
                    if (matchTipo) {
                        setInvoiceType(`${matchTipo.prefijo}|${matchTipo.tipo}`)
                        if (matchTipo.id_almacen) setSelectedAlmacen(String(matchTipo.id_almacen))
                    }

                    if (data.tipo_cpe === '01') setTipoSunat('6')
                    else if (data.tipo_cpe === '03') setTipoSunat('1')
                    if (data.idTransaction) {
                        setSunatTransaction(data.idTransaction)
                    }
                    if (data.idAlmacen) {
                        setSelectedAlmacen(data.idAlmacen)
                    }
                } else {
                    setPreviewExistente(null)
                    initDefaults()
                }
            } catch {
                setPreviewExistente(null)
                initDefaults()
            } finally {
                setLoadingPreviewData(false)
            }
        }

        fetchPreviewExistente()
    }, [open, selectedOrder?.nroPedido])

    const initDefaults = () => {
        if (tiposComprobante.length > 0) {
            const first = tiposComprobante.find(t => t.tipo !== '8' && t.tipo !== '7')
            if (first) {
                setInvoiceType(`${first.prefijo}|${first.tipo}`)
                if (first.id_almacen) setSelectedAlmacen(String(first.id_almacen))
                if (first.tipo === '1') setTipoSunat('6')
                else if (first.tipo === '3') setTipoSunat('1')
            }
        }
        if (sunatTransacciones.length > 0) {
            setSunatTransaction(String(sunatTransacciones[0].idTransaction))
        }
        if (tipoDocsSunat.length > 0 && !tipoSunat) {
            setTipoSunat(tipoDocsSunat[0].codigo)
        }
    }

    useEffect(() => {
        if (!previewExistente && !invoiceType) initDefaults()
    }, [tiposComprobante, sunatTransacciones, tipoDocsSunat])

    const almacenesDisponibles = useMemo(() => {
        const seen = new Set<string>()
        return tiposComprobante
            .filter(t => t.id_almacen && t.desc_almacen)
            .reduce<{ id: string; desc: string }[]>((acc, t) => {
                const key = String(t.id_almacen)
                if (!seen.has(key)) {
                    seen.add(key)
                    acc.push({ id: key, desc: t.desc_almacen! })
                }
                return acc
            }, [])
    }, [tiposComprobante])

    const handleInvoiceTypeChange = (val: string) => {
        if (previewExistente) return
        setInvoiceType(val)
        const seq = tiposComprobante.find(t => `${t.prefijo}|${t.tipo}` === val)
        if (seq?.id_almacen) setSelectedAlmacen(String(seq.id_almacen))
        const tipo = val.split('|')[1]
        if (tipo === '1') setTipoSunat('6')
        else if (tipo === '3') setTipoSunat('1')
    }

    const canPreview = !!invoiceType && !!sunatTransaction && !!tipoSunat && !!selectedAlmacen

    if (!selectedOrder) return null

    const currentStateInfo = getStateInfo(
        selectedOrder.estadodePedido, selectedOrder.por_autorizar, selectedOrder.is_autorizado
    )
    const nextStateInfo = getStateInfo(
        getNextState(selectedOrder.estadodePedido), selectedOrder.por_autorizar, selectedOrder.is_autorizado
    )
    const hermanoNextStateInfo = pedidoHermano
        ? getStateInfo(getNextState(pedidoHermano.estadodePedido), pedidoHermano.por_autorizar, pedidoHermano.is_autorizado)
        : null

    const handleDownloadPreview = () => {
        if (!pdfPreviewBase64) return
        const link = document.createElement('a')
        link.href = `data:application/pdf;base64,${pdfPreviewBase64}`
        link.download = `preview_${selectedOrder.nroPedido}.pdf`
        link.click()
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Cambiar Estado del Pedido</DialogTitle>
                        <DialogDescription>
                            Pedido: {selectedOrder.nroPedido} - {selectedOrder.nombreCliente}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs text-gray-500">Estado Actual</Label>
                                <div className="mt-1">
                                    <Badge className={currentStateInfo?.color}>{currentStateInfo?.name}</Badge>
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs text-gray-500">Nuevo Estado</Label>
                                <div className="mt-1">
                                    <Badge className={nextStateInfo?.color}>{nextStateInfo?.name}</Badge>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">{nextStateInfo?.description}</p>

                        {detalle.length > 0 && [1, 2, 4].includes(selectedOrder.estadodePedido) && (
                            <div className="border rounded-md p-3 space-y-3 bg-gray-50">
                                <p className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                                    <FileText className="h-3.5 w-3.5" /> Datos para Comprobante
                                </p>

                                {loadingPreviewData ? (
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Loader2 className="h-3 w-3 animate-spin" /> Verificando correlativo...
                                    </div>
                                ) : previewExistente && (
                                    <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-md flex gap-2 items-start">
                                        <RefreshCw className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                        <div className="text-xs text-amber-800">
                                            <span className="font-semibold block">
                                                Ya existe correlativo {previewExistente.serie}-{previewExistente.numero}
                                            </span>
                                            Al generar el preview se regenerará el pedido y sus detalles con este mismo correlativo.
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-500">
                                            Tipo Comprobante
                                            {previewExistente && (
                                                <span className="ml-1 text-amber-600">(bloqueado)</span>
                                            )}
                                        </Label>
                                        <Select
                                            value={invoiceType}
                                            onValueChange={handleInvoiceTypeChange}
                                            disabled={!!previewExistente || loadingPreviewData}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Seleccionar" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {tiposComprobante
                                                    .filter(t => t.tipo !== '8' && t.tipo !== '7')
                                                    .map(t => (
                                                        <SelectItem key={t.prefijo} value={`${t.prefijo}|${t.tipo}`} className="text-xs">
                                                            {t.prefijo} - {t.nombre}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-500">Transacción SUNAT</Label>
                                        <Select value={sunatTransaction} onValueChange={setSunatTransaction} disabled={loadingPreviewData}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Seleccionar" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sunatTransacciones.map(t => (
                                                    <SelectItem key={t.idTransaction} value={String(t.idTransaction)} className="text-xs">
                                                        {t.descripcion}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-500">Tipo Doc. Cliente</Label>
                                        <Select value={tipoSunat} onValueChange={setTipoSunat} disabled={loadingPreviewData}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Seleccionar" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {tipoDocsSunat.map(t => (
                                                    <SelectItem key={t.codigo} value={t.codigo} className="text-xs">
                                                        {t.descripcion}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-500">Almacén</Label>
                                        <Select value={selectedAlmacen} onValueChange={setSelectedAlmacen} disabled={loadingPreviewData}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Seleccionar" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {almacenesDisponibles.map(a => (
                                                    <SelectItem key={a.id} value={a.id} className="text-xs">
                                                        {a.desc}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {pedidoHermano && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex gap-3 items-start">
                                <Link2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-sm text-amber-800">
                                    <span className="font-semibold block mb-1">Pedido vinculado detectado</span>
                                    El pedido <b>#{pedidoHermano.nroPedido}</b>{' '}
                                    ({pedidoHermano.tipo_afectacion || 'GRAVADO'}) también cambiará
                                    a <b>{hermanoNextStateInfo?.name}</b> automáticamente.
                                </div>
                            </div>
                        )}

                        {(selectedOrder.continue === 0 && !previewExistente) && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex gap-3 items-start">
                                <OctagonAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-sm text-amber-800">
                                    <span className="font-semibold block mb-1">Acción requerida</span>
                                    El pedido no tiene su comprobante generado o enlazado.
                                    Por favor, haga clic en <b>Generar Comprobante</b> para generar.
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={onCancel} disabled={loading}>
                            Cancelar
                        </Button>
                        {detalle.length > 0 && [1, 2, 4].includes(selectedOrder.estadodePedido) && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 bg-transparent text-xs"
                                onClick={() => onPreview(invoiceType, sunatTransaction, tipoSunat, selectedAlmacen)}
                                disabled={loadingPreview || !canPreview || loadingPreviewData}
                            >
                                {loadingPreview
                                    ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Generando...</>
                                    : <><FileText className="h-3 w-3 mr-1" /> {previewExistente ? 'Regenerar Comprobante' : 'Generar comprobante'}</>
                                }
                            </Button>
                        )}
                        <Button onClick={onConfirm} disabled={loading || selectedOrder.continue === 0}>
                            {loading ? 'Procesando...' : pedidoHermano ? 'Confirmar (2 pedidos)' : 'Confirmar Cambio'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isPreviewOpen} onOpenChange={onClosePreview}>
                <DialogContent className="min-w-[90vw] h-[95vh] p-0 overflow-hidden">
                    <DialogHeader className="px-4 py-3 border-b absolute bg-white w-full z-10">
                        <div className="flex items-center justify-between">
                            <DialogTitle>
                                Preview — {String(selectedOrder.nroPedido).padStart(10, '0')}
                                {previewExistente && (
                                    <span className="ml-2 text-sm font-normal text-gray-500">
                                        {previewExistente.serie}-{previewExistente.numero}
                                    </span>
                                )}
                            </DialogTitle>
                            <Button size="sm" onClick={handleDownloadPreview} disabled={!pdfPreviewBase64}>
                                <Download className="w-4 h-4 mr-2" /> Descargar
                            </Button>
                        </div>
                    </DialogHeader>
                    <div className="w-full h-full mt-16">
                        {pdfPreviewBase64
                            ? <iframe title="Preview PDF" src={`data:application/pdf;base64,${pdfPreviewBase64}`} className="w-full h-full border-0" />
                            : <div className="flex items-center justify-center h-full gap-2 text-gray-500">
                                <Loader2 className="h-5 w-5 animate-spin" /> Cargando preview...
                            </div>
                        }
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}