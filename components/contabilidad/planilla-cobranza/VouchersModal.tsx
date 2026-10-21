'use client'

import { useMemo, useState } from 'react'
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, Paperclip, Maximize2, Clock, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {fmtFecha, fmtHora} from "@/lib/planilla.helper";
import { ArchivoVisor, VisorArchivos } from './VisorArchivos'

export interface Voucher {
    id:            number
    id_detalle:    number
    ruta_archivo:  string
    fecha_subida:  string
}

interface Props {
    open:        boolean
    onOpenChange:(v: boolean) => void
    numeroPlanilla: string
    vouchers:    Voucher[]
    baseUrl?:    string
    /** Texto bajo el título, p. ej. el vendedor. */
    subtitulo?:  string
}

type Filtro = 'todos' | 'imagenes' | 'pdf'

function isPdf(ruta: string) {
    return ruta.toLowerCase().endsWith('.pdf')
}

const descargar = (url: string, nombre: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = nombre
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.click()
}

export function VouchersModal({ open, onOpenChange, numeroPlanilla, vouchers, baseUrl = '', subtitulo }: Props) {
    const [filtro, setFiltro] = useState<Filtro>('todos')
    const [visor, setVisor] = useState<number | null>(null)

    const archivos = useMemo(() => vouchers.map(v => {
        const nombre = v.ruta_archivo.split('/').pop() ?? 'voucher'
        const fecha = fmtFecha(v.fecha_subida)
        const hora = fmtHora(v.fecha_subida)
        return {
            voucher: v,
            url: `${baseUrl}${v.ruta_archivo}`,
            nombre,
            esPdf: isPdf(v.ruta_archivo),
            titulo: `Det. #${v.id_detalle}`,
            detalle: hora ? `${fecha} ${hora}` : fecha,
        }
    }), [vouchers, baseUrl])

    const visibles = archivos.filter(a =>
        filtro === 'todos' || (filtro === 'pdf' ? a.esPdf : !a.esPdf))
    const nPdf = archivos.filter(a => a.esPdf).length
    const nImg = archivos.length - nPdf
    const total = archivos.length

    const paraVisor: ArchivoVisor[] = visibles.map(a => ({
        url: a.url, nombre: a.nombre, titulo: a.titulo, detalle: a.detalle, esPdf: a.esPdf,
    }))

    return (
        <>
            <Dialog open={open} onOpenChange={v => { if (!v) setFiltro('todos'); onOpenChange(v) }}>
                <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0 text-left">
                        <DialogTitle className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-blue-600 text-white shadow-md shadow-sky-600/30">
                                <Paperclip className="h-5 w-5" />
                            </span>
                            <span>
                                Vouchers · Planilla {numeroPlanilla}
                                <span className="block text-xs font-normal text-muted-foreground">
                                    {subtitulo ? `${subtitulo} · ` : ''}
                                    {total === 0 ? 'sin archivos adjuntos' : `${total} archivo${total !== 1 ? 's' : ''} adjunto${total !== 1 ? 's' : ''}`}
                                </span>
                            </span>
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Vouchers adjuntos a la planilla {numeroPlanilla}
                        </DialogDescription>
                    </DialogHeader>

                    {total > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-6 py-2.5 text-xs text-muted-foreground">
                            <span>
                                {nImg} imagen{nImg !== 1 ? 'es' : ''} · {nPdf} PDF
                            </span>
                            {nImg > 0 && nPdf > 0 && (
                                <div className="flex rounded-lg border bg-muted p-0.5">
                                    {([['todos', 'Todos'], ['imagenes', 'Imágenes'], ['pdf', 'PDF']] as const).map(([v, t]) => (
                                        <button
                                            key={v}
                                            type="button"
                                            onClick={() => setFiltro(v)}
                                            className={cn(
                                                'rounded-md px-2.5 py-1 text-xs transition-colors',
                                                filtro === v ? 'bg-background font-semibold text-sky-700 shadow-sm dark:text-sky-400' : 'hover:text-foreground',
                                            )}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        {total === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                                <Paperclip className="h-10 w-10 opacity-30" />
                                <p className="text-sm">Sin vouchers para esta planilla</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {visibles.map((a, i) => (
                                    <div
                                        key={a.voucher.id}
                                        className="group flex flex-col overflow-hidden rounded-xl border bg-background shadow-sm transition hover:border-sky-300 hover:shadow-md"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setVisor(i)}
                                            className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-muted"
                                            title="Ver en grande"
                                        >
                                            {a.esPdf ? (
                                                <div className="flex flex-col items-center gap-1 px-2 text-red-600">
                                                    <FileText className="h-10 w-10" />
                                                    <span className="text-xs font-bold">PDF</span>
                                                    <span className="max-w-full truncate text-[10px] text-muted-foreground">{a.nombre}</span>
                                                </div>
                                            ) : (
                                                <img
                                                    src={a.url}
                                                    alt={a.nombre}
                                                    loading="lazy"
                                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none'
                                                    }}
                                                />
                                            )}
                                            <span className="absolute inset-0 flex items-center justify-center bg-slate-900/45 opacity-0 transition-opacity group-hover:opacity-100">
                                                <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-900">
                                                    <Maximize2 className="h-3.5 w-3.5" /> Ver en grande
                                                </span>
                                            </span>
                                        </button>

                                        <div className="space-y-1.5 px-3 pt-2.5">
                                            <div className="flex flex-wrap items-center gap-1">
                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                    Det. #{a.voucher.id_detalle}
                                                </Badge>
                                                {a.esPdf ? (
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:border-red-900">
                                                        PDF
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:border-sky-900 dark:text-sky-300">
                                                        <ImageIcon className="mr-1 h-2.5 w-2.5" /> Imagen
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                <Clock className="h-3 w-3" /> {a.detalle}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-1.5 p-3 pt-2">
                                            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => setVisor(i)}>
                                                <Maximize2 className="h-3.5 w-3.5" /> Abrir
                                            </Button>
                                            <Button variant="outline" size="sm"
                                                    className="h-8 gap-1 text-xs border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300"
                                                    onClick={() => descargar(a.url, a.nombre)}>
                                                <Download className="h-3.5 w-3.5" /> Descargar
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-2 px-6 py-3.5 border-t bg-muted/30 shrink-0">
                        {total > 1 ? (
                            <Button variant="outline" size="sm" className="gap-1.5"
                                    onClick={() => visibles.forEach(a => descargar(a.url, a.nombre))}>
                                <Download className="h-4 w-4" /> Descargar {filtro === 'todos' ? 'todos' : 'estos'}
                            </Button>
                        ) : <span />}
                        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                            Cerrar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <VisorArchivos archivos={paraVisor} indice={visor} onIndice={setVisor} />
        </>
    )
}
