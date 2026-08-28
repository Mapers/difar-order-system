'use client'

import { useEffect, useRef, useState } from 'react'
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink, FileText, ImageOff, Loader2, Trash2, Upload } from 'lucide-react'
import { publicApi } from '@/app/api/client'
import { Comprobante } from '@/app/types/order/order-interface'
import { useConformidad } from '@/app/hooks/useConformidades'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    comprobante: Comprobante | null
    puedeGestionar: boolean
    idUsuarioWeb: number | null
    onCambio: (idSunat: number, tiene: boolean) => void
}

const esPdf = (ruta: string) => /\.pdf$/i.test(ruta)

export function ConformidadModal({
    open, onOpenChange, comprobante, puedeGestionar, idUsuarioWeb, onCambio,
}: Props) {
    const idSunat = comprobante?.idSunat ?? null

    const { conformidad, cargando, subiendo, borrando, subir, eliminar } =
        useConformidad(idSunat, open)

    const inputRef = useRef<HTMLInputElement>(null)
    const [confirmando, setConfirmando] = useState(false)
    const [arrastrando, setArrastrando] = useState(false)

    useEffect(() => {
        if (!open) { setConfirmando(false); setArrastrando(false) }
    }, [open])

    const url = conformidad ? `${publicApi}${conformidad.ruta}` : null
    const ocupado = subiendo || borrando
    const puedeSoltar = puedeGestionar && !ocupado

    const documento = comprobante ? `${comprobante.serie}-${comprobante.numero}` : 'Comprobante'

    const alSubir = async (archivo?: File) => {
        if (!archivo || idSunat == null || !idUsuarioWeb) return
        const ok = await subir(archivo, idUsuarioWeb)
        if (ok) onCambio(idSunat, true)
    }

    const alEliminar = async () => {
        if (idSunat == null || !idUsuarioWeb) return
        const ok = await eliminar(idUsuarioWeb)
        if (ok) { setConfirmando(false); onCambio(idSunat, false) }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!ocupado) onOpenChange(v) }}>
            <DialogContent className="max-h-[95vh] max-w-lg overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">
                        Conformidad de {documento}
                    </DialogTitle>
                    <DialogDescription>
                        {comprobante?.cliente_denominacion || 'Cargo de entrega firmado por el cliente'}
                    </DialogDescription>
                </DialogHeader>

                <div
                    onDragEnter={(e) => { if (puedeSoltar) { e.preventDefault(); setArrastrando(true) } }}
                    onDragLeave={(e) => { e.preventDefault(); setArrastrando(false) }}
                    onDragOver={(e) => { if (puedeSoltar) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' } }}
                    onDrop={(e) => {
                        if (!puedeSoltar) return
                        e.preventDefault()
                        setArrastrando(false)
                        alSubir(e.dataTransfer.files?.[0])
                    }}
                    onClick={() => { if (puedeSoltar && !url && !cargando) inputRef.current?.click() }}
                    className={`relative flex min-h-[240px] items-center justify-center overflow-hidden rounded-lg border p-2 transition
                        ${arrastrando
                            ? 'border-2 border-dashed border-blue-500 bg-blue-50'
                            : puedeGestionar && !url && !cargando
                                ? 'cursor-pointer border-dashed bg-muted/40 hover:border-blue-400 hover:bg-muted'
                                : 'bg-muted/40'}`}
                >
                    {cargando && <Skeleton className="h-[220px] w-full" />}

                    {!cargando && url && !esPdf(conformidad!.ruta) && (
                        <img
                            src={url}
                            alt={conformidad!.nombre_archivo}
                            className="max-h-[320px] w-auto max-w-full rounded object-contain"
                        />
                    )}

                    {!cargando && url && esPdf(conformidad!.ruta) && (
                        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                            <FileText className="h-12 w-12 text-red-600" />
                            <p className="max-w-full truncate text-sm font-medium">
                                {conformidad!.nombre_archivo}
                            </p>
                            <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline"
                            >
                                <ExternalLink className="h-3.5 w-3.5" /> Abrir el PDF
                            </a>
                        </div>
                    )}

                    {!cargando && !url && (
                        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                            <ImageOff className="h-10 w-10 text-muted-foreground" />
                            <p className="text-sm font-medium">Este comprobante no tiene conformidad</p>
                            {puedeGestionar && (
                                <p className="text-xs text-muted-foreground">
                                    Arrastra el cargo aquí o haz clic para elegirlo.
                                    <br />
                                    JPG, PNG, WEBP o PDF de hasta 5 MB.
                                </p>
                            )}
                        </div>
                    )}

                    {arrastrando && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-blue-50/90 text-center">
                            <Upload className="h-10 w-10 text-blue-600" />
                            <p className="text-sm font-medium text-blue-800">
                                {url ? 'Suelta para reemplazar la conformidad' : 'Suelta el archivo aquí'}
                            </p>
                        </div>
                    )}

                    {subiendo && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <p className="text-sm font-medium">Subiendo conformidad...</p>
                        </div>
                    )}
                </div>

                {conformidad && (
                    <p className="text-xs text-muted-foreground">
                        Subida por {conformidad.usuario || '—'}
                    </p>
                )}

                {puedeGestionar && (
                    <>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                                const archivo = e.target.files?.[0]
                                e.target.value = ''
                                alSubir(archivo)
                            }}
                        />

                        {confirmando ? (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                                <p className="text-sm font-medium text-red-800">
                                    ¿Eliminar la conformidad de {documento}?
                                </p>
                                <p className="mt-1 text-xs text-red-700">
                                    El archivo se borra del servidor y no se puede recuperar.
                                </p>
                                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={alEliminar}
                                        disabled={borrando}
                                        className="flex items-center gap-1.5"
                                    >
                                        {borrando
                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                            : <Trash2 className="h-4 w-4" />}
                                        Sí, eliminar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setConfirmando(false)}
                                        disabled={borrando}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button
                                    onClick={() => inputRef.current?.click()}
                                    disabled={ocupado || cargando}
                                    className="flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 sm:flex-1"
                                >
                                    {subiendo
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : <Upload className="h-4 w-4" />}
                                    {subiendo ? 'Subiendo...' : url ? 'Reemplazar conformidad' : 'Subir conformidad'}
                                </Button>

                                {url && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setConfirmando(true)}
                                        disabled={ocupado}
                                        className="flex items-center gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4" /> Eliminar
                                    </Button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
