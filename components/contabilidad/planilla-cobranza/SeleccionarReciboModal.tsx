'use client'

import { useEffect, useMemo, useState } from 'react'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2, ExternalLink, FileText, FileWarning, Receipt, Search } from 'lucide-react'
import apiClient, { publicApi } from '@/app/api/client'
import { fmtFecha, fmtMoney } from '@/lib/planilla.helper'
import { ReciboCabecera } from '@/app/types/recibo-cliente-types'

/** Documento pagado dentro de un recibo (detalle de sp_ws_recibo_obtener_det). */
export interface ReciboDocumento {
    id_detalle:         number
    tipo_documento:     string
    abre_documento:     string
    serie:              string
    numero_doc:         string
    documento_completo: string
    importe:            number | string
    saldo_documento:    number | string | null
}

interface Props {
    open:           boolean
    onOpenChange:   (v: boolean) => void
    /** Usuario web del vendedor: solo se listan sus recibos. */
    idUsuarioWeb:   number | null | undefined
    /** Si ya hay un cliente elegido, se filtra por él (se puede desactivar). */
    codCliente?:    string
    onImportar:     (recibo: ReciboCabecera, documento: ReciboDocumento) => void
}

/**
 * Elegir un recibo de cuenta emitido por el vendedor, ver su PDF y escoger el
 * documento que se liquida en la planilla.
 */
export function SeleccionarReciboModal({ open, onOpenChange, idUsuarioWeb, codCliente, onImportar }: Props) {
    const [recibos,   setRecibos]   = useState<ReciboCabecera[]>([])
    const [cargando,  setCargando]  = useState(false)
    const [busqueda,  setBusqueda]  = useState('')
    const [soloCliente, setSoloCliente] = useState(true)
    const [elegido,   setElegido]   = useState<ReciboCabecera | null>(null)
    const [documentos, setDocumentos] = useState<ReciboDocumento[]>([])
    const [cargandoDet, setCargandoDet] = useState(false)
    const [docElegido, setDocElegido] = useState<number | null>(null)

    useEffect(() => {
        if (!open) return
        setElegido(null); setDocumentos([]); setDocElegido(null); setBusqueda(''); setSoloCliente(true)
        if (idUsuarioWeb == null) { setRecibos([]); return }
        let vivo = true
        setCargando(true)
        apiClient.get('/recibos', { params: { id_usuario_web: idUsuarioWeb, estado: 'EMITIDO' } })
            .then(res => { if (vivo) setRecibos(res.data?.data?.data ?? []) })
            .catch(() => { if (vivo) setRecibos([]) })
            .finally(() => { if (vivo) setCargando(false) })
        return () => { vivo = false }
    }, [open, idUsuarioWeb])

    const elegir = async (r: ReciboCabecera) => {
        setElegido(r); setDocumentos([]); setDocElegido(null); setCargandoDet(true)
        try {
            const res = await apiClient.get(`/recibos/${r.id_recibo}`)
            const det: ReciboDocumento[] = res.data?.data?.detalle ?? []
            setDocumentos(det)
            if (det.length === 1) setDocElegido(det[0].id_detalle)
        } catch {
            setDocumentos([])
        } finally {
            setCargandoDet(false)
        }
    }

    const filtrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase()
        return recibos.filter(r =>
            r.estado !== 'ANULADO'
            && (!soloCliente || !codCliente || r.cod_cliente === codCliente || r.ruc_cliente === codCliente)
            && (!q || `${r.prefijo}${r.numero_recibo} ${r.nombre_cliente} ${r.ruc_cliente ?? ''}`.toLowerCase().includes(q)))
    }, [recibos, busqueda, soloCliente, codCliente])

    const urlPdf = elegido?.ruta_pdf ? `${publicApi}${elegido.ruta_pdf}` : null
    const doc = documentos.find(d => d.id_detalle === docElegido) ?? null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[92vh] w-[96vw] max-w-5xl flex-col gap-0 overflow-hidden p-0" onOpenAutoFocus={e => e.preventDefault()}>
                <DialogHeader className="border-b px-5 py-4 text-left">
                    <DialogTitle className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-white">
                            <Receipt className="h-4 w-4" />
                        </span>
                        Seleccionar recibo de cuenta
                    </DialogTitle>
                    <DialogDescription>
                        Tus recibos emitidos. Revisa el PDF y elige el documento que se liquida en la planilla.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[340px_1fr]">
                    {/* Lista de recibos */}
                    <div className={`min-h-0 flex-col border-b md:flex md:border-b-0 md:border-r ${elegido ? 'hidden' : 'flex'}`}>
                        <div className="space-y-2 border-b p-3">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                                       placeholder="N° de recibo, cliente o RUC" className="pl-8" />
                            </div>
                            {codCliente && (
                                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <input type="checkbox" checked={soloCliente} onChange={e => setSoloCliente(e.target.checked)} />
                                    Solo del cliente seleccionado
                                </label>
                            )}
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto p-2">
                            {cargando ? (
                                <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
                            ) : filtrados.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
                                    <Receipt className="h-8 w-8 opacity-40" />
                                    No hay recibos emitidos{soloCliente && codCliente ? ' para este cliente' : ''}.
                                </div>
                            ) : filtrados.map(r => (
                                <button key={r.id_recibo} type="button" onClick={() => elegir(r)}
                                        className={`mb-1.5 w-full rounded-lg border p-2.5 text-left transition-colors
                                            ${elegido?.id_recibo === r.id_recibo ? 'border-sky-400 bg-sky-50 dark:bg-sky-950/40' : 'hover:bg-muted/60'}`}>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-mono text-sm font-semibold">{r.prefijo}-{r.numero_recibo}</span>
                                        <span className="font-mono text-sm font-semibold text-emerald-700">{fmtMoney(r.total)}</span>
                                    </div>
                                    <p className="truncate text-xs text-foreground">{r.nombre_cliente}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                        {fmtFecha(r.fecha_emision)} · {r.total_documentos ?? 0} doc. · {r.concepto}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recibo elegido: documentos y PDF */}
                    <div className={`min-h-0 flex-col overflow-y-auto md:flex ${elegido ? 'flex' : 'hidden'}`}>
                        {!elegido ? (
                            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
                                <FileText className="h-10 w-10 opacity-30" />
                                Elige un recibo para ver su PDF.
                            </div>
                        ) : (
                            <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <Button variant="link" size="sm" className="h-auto p-0 text-xs md:hidden" onClick={() => setElegido(null)}>
                                            ← Volver a la lista
                                        </Button>
                                        <p className="font-mono text-base font-bold">{elegido.prefijo}-{elegido.numero_recibo}</p>
                                        <p className="text-xs text-muted-foreground">{elegido.nombre_cliente} · {fmtFecha(elegido.fecha_emision)}</p>
                                    </div>
                                    {urlPdf && (
                                        <a href={urlPdf} target="_blank" rel="noreferrer"
                                           className="flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline">
                                            <ExternalLink className="h-3.5 w-3.5" /> Abrir PDF
                                        </a>
                                    )}
                                </div>

                                <div className="rounded-lg border">
                                    <p className="border-b px-3 py-2 text-xs font-semibold">
                                        {documentos.length > 1 ? 'Elige el documento que se liquida' : 'Documento del recibo'}
                                    </p>
                                    {cargandoDet ? <Skeleton className="m-3 h-8" /> : documentos.map(d => (
                                        <label key={d.id_detalle}
                                               className={`flex cursor-pointer items-center gap-3 border-b px-3 py-2 last:border-b-0
                                                   ${docElegido === d.id_detalle ? 'bg-sky-50 dark:bg-sky-950/40' : 'hover:bg-muted/50'}`}>
                                            <input type="radio" name="doc-recibo" checked={docElegido === d.id_detalle}
                                                   onChange={() => setDocElegido(d.id_detalle)} />
                                            <span className="flex-1 font-mono text-xs">{d.abre_documento} {d.serie}-{d.numero_doc}</span>
                                            <span className="font-mono text-xs font-semibold text-emerald-700">{fmtMoney(d.importe)}</span>
                                        </label>
                                    ))}
                                </div>

                                {urlPdf ? (
                                    <>
                                        <iframe src={urlPdf} title={`Recibo ${elegido.numero_recibo}`}
                                                className="hidden min-h-[360px] w-full flex-1 rounded-lg border bg-muted md:block" />
                                        {/* En el celular el navegador no muestra PDF dentro de la página: se abre aparte. */}
                                        <a href={urlPdf} target="_blank" rel="noreferrer"
                                           className="flex items-center gap-3 rounded-lg border bg-muted/40 p-4 md:hidden">
                                            <FileText className="h-8 w-8 shrink-0 text-sky-600" />
                                            <span className="flex-1">
                                                <span className="block text-sm font-semibold">Ver PDF del recibo</span>
                                                <span className="block text-xs text-muted-foreground">Se abre en otra pestaña</span>
                                            </span>
                                            <ExternalLink className="h-4 w-4 text-sky-600" />
                                        </a>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center">
                                        <FileWarning className="h-8 w-8 text-muted-foreground" />
                                        <p className="text-sm font-medium">Este recibo no tiene PDF</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="border-t bg-muted/30 px-5 py-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button className="gap-1.5 bg-sky-600 text-white hover:bg-sky-700" disabled={!elegido || !doc}
                            onClick={() => { if (elegido && doc) { onImportar(elegido, doc); onOpenChange(false) } }}>
                        <CheckCircle2 className="h-4 w-4" /> Importar datos del recibo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
