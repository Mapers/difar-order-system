'use client'

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, Clock } from "lucide-react"

export type TipoDocumentoAviso = 'comprobante' | 'guia'

export interface DocumentoAviso {
    nombre: string
    estado: string | number | null | undefined
    nota?: string | null
}

interface Aviso {
    tipo: TipoDocumentoAviso
    documentos: { nombre: string; estado: '101' | '103'; nota?: string | null }[]
}

const EVENTO = 'aviso-estado-sunat'

function resumirNota(nota: string | null | undefined): string | null {
    const limpia = String(nota ?? '').split(' - Detalle')[0].trim()
    return limpia === '' ? null : limpia
}

export function avisarEstadoSunat(tipo: TipoDocumentoAviso, documentos: DocumentoAviso[]): boolean {
    const conAviso: Aviso['documentos'] = []
    for (const d of documentos) {
        const estado = String(d.estado ?? '').trim()
        if (estado === '101' || (estado === '103' && tipo === 'comprobante')) {
            conAviso.push({ nombre: d.nombre, estado, nota: resumirNota(d.nota) })
        }
    }

    if (conAviso.length === 0) return false

    window.dispatchEvent(new CustomEvent<Aviso>(EVENTO, { detail: { tipo, documentos: conAviso } }))
    return true
}

export function AvisoEstadoSunat() {
    const [aviso, setAviso] = useState<Aviso | null>(null)

    useEffect(() => {
        const abrir = (e: Event) => setAviso((e as CustomEvent<Aviso>).detail)
        window.addEventListener(EVENTO, abrir)
        return () => window.removeEventListener(EVENTO, abrir)
    }, [])

    if (!aviso) return null

    const enProceso     = aviso.documentos.filter(d => d.estado === '101')
    const conObservacion = aviso.documentos.filter(d => d.estado === '103')
    const esGuia        = aviso.tipo === 'guia'
    const lista         = (docs: Aviso['documentos']) => docs.map(d => d.nombre).join(', ')

    return (
        <Dialog open onOpenChange={open => { if (!open) setAviso(null) }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {enProceso.length > 0
                            ? <><Clock className="h-5 w-5 text-amber-600" /> SUNAT todavía lo está procesando</>
                            : <><AlertCircle className="h-5 w-5 text-blue-600" /> Aceptado con observación</>}
                    </DialogTitle>
                    <DialogDescription>
                        {esGuia ? 'La guía ya quedó registrada.' : 'El comprobante ya quedó registrado.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 text-sm">
                    {enProceso.length > 0 && (
                        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                            <p className="font-medium">En proceso: {lista(enProceso)}</p>
                            <p className="mt-1">
                                {esGuia
                                    ? 'El PDF estará disponible cuando SUNAT la acepte. '
                                    : 'Ya puedes ver su PDF, pero es provisional. '}
                                El sistema vuelve a consultar a SUNAT cada hora y, cuando lo acepte, actualiza el
                                estado y {esGuia ? 'guarda el PDF' : 'cambia el PDF por el definitivo'}. No hace falta
                                volver a emitirlo.
                            </p>
                            <p className="mt-1">
                                Si lo necesitas antes, usa <span className="font-medium">Ver Estado SUNAT</span> en el listado
                                dentro de un rato.
                            </p>
                        </div>
                    )}

                    {conObservacion.length > 0 && (
                        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                            <p className="font-medium">Aceptado con observación: {lista(conObservacion)}</p>
                            <p className="mt-1">
                                Es válido y su PDF ya es el definitivo; no tienes que hacer nada más. SUNAT solo dejó
                                una observación para tenerla en cuenta en los siguientes.
                            </p>
                            {conObservacion.filter(d => d.nota).map(d => (
                                <p key={d.nombre} className="mt-1 text-xs">
                                    <span className="font-medium">{d.nombre}:</span> {d.nota}
                                </p>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={() => setAviso(null)}>Entendido</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function avisarNotaCredito(data: { serie?: string; numero?: string; estado_sunat?: string | null; sunat_note?: string | null } | null | undefined) {
    return avisarEstadoSunat('comprobante', [{
        nombre: `${data?.serie}-${data?.numero}`,
        estado: data?.estado_sunat,
        nota:   data?.sunat_note,
    }])
}
