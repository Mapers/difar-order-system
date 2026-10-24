'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Download, ExternalLink, FileText, Loader2, Palette, RotateCcw, Type, Printer, Paperclip } from 'lucide-react'
import { toast } from '@/app/hooks/useToast'
import { imprimirPdf } from '@/components/reporte/imprimirPdf'
import { OpcionesPdfReporte } from './pdfOpciones'
import { Opciones, Seccion, SelectorColor } from './PdfOpcionesControles'

/**
 * Modal de vista previa para los PDF de reportes: el mismo diseño que
 * "Exportar PDF" de Movimiento Sub Cuenta, con las opciones comunes (título,
 * nota, nombre del archivo, color y tamaño de letra). Cada reporte solo
 * entrega la función que arma su PDF con esas opciones.
 */
export function PdfVistaPreviaDialog({
    abierto, onCerrar, titulo, descripcion, defecto, archivoDefecto, generar, interruptores = [],
}: {
    abierto:        boolean
    onCerrar:       () => void
    /** Título del modal, p. ej. "Saldos vencidos por cobrar". */
    titulo:         string
    descripcion?:   string
    /** Opciones con las que el PDF sale igual que antes. */
    defecto:        OpcionesPdfReporte
    archivoDefecto: string
    generar:        (op: OpcionesPdfReporte) => Promise<Uint8Array>
    /** Opciones de sí/no propias del reporte; su valor llega en op.extras[k]. */
    interruptores?: { k: string; t: string; d?: string }[]
}) {
    const [op, setOp] = useState<OpcionesPdfReporte>(defecto)
    const [archivo, setArchivo] = useState(archivoDefecto)
    const [url, setUrl] = useState<string | null>(null)
    const [generando, setGenerando] = useState(false)
    const urlRef = useRef<string | null>(null)
    const generarRef = useRef(generar)
    generarRef.current = generar

    // Cada vez que se abre arranca con el diseño original.
    useEffect(() => {
        if (!abierto) return
        setOp(defecto)
        setArchivo(archivoDefecto)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [abierto])

    // Cada vez que cambia una opción se regenera la vista previa. Se espera
    // un momento para no generar el PDF por cada tecla del título.
    useEffect(() => {
        if (!abierto) return
        let cancelado = false
        setGenerando(true)
        const t = setTimeout(async () => {
            try {
                const bytes = await generarRef.current(op)
                if (cancelado) return
                const nueva = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }))
                if (urlRef.current) URL.revokeObjectURL(urlRef.current)
                urlRef.current = nueva
                setUrl(nueva)
            } catch (error) {
                console.error(`Error al generar el PDF (${titulo}):`, error)
                if (!cancelado) toast({ title: "Error", description: "No se pudo generar la vista previa.", variant: "destructive" })
            } finally {
                if (!cancelado) setGenerando(false)
            }
        }, 350)
        return () => { cancelado = true; clearTimeout(t) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [abierto, op])

    useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current) }, [])

    const set = <K extends keyof OpcionesPdfReporte>(k: K, v: OpcionesPdfReporte[K]) => setOp(p => ({ ...p, [k]: v }))

    const descargar = () => {
        if (!url) return
        const link = document.createElement('a')
        link.href = url
        link.download = `${(archivo.trim() || archivoDefecto).replace(/\.pdf$/i, '')}.pdf`
        link.click()
    }

    const listo = !!url && !generando

    return (
        <Dialog open={abierto} onOpenChange={v => { if (!v) onCerrar() }}>
            <DialogContent className="flex h-[92vh] w-[96vw] max-w-6xl flex-col gap-0 overflow-hidden p-0"
                           onOpenAutoFocus={e => e.preventDefault()}>
                <DialogHeader className="border-b px-5 py-4 text-left">
                    <DialogTitle className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white">
                            <FileText className="h-4 w-4" />
                        </span>
                        {titulo}
                    </DialogTitle>
                    <DialogDescription>
                        {descripcion ? `${descripcion}. ` : ''}Ajusta el diseño y revisa la vista previa antes de descargar o imprimir.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[1fr_auto] md:grid-cols-[320px_1fr] md:grid-rows-1">
                    {/* Opciones */}
                    <div className="min-h-0 space-y-5 overflow-y-auto border-b p-5 md:border-b-0 md:border-r">
                        <Seccion icono={Type} titulo="Textos">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Título del reporte</Label>
                                <Input value={op.titulo} maxLength={90} onChange={e => set('titulo', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Nota u observación <span className="text-muted-foreground">(opcional)</span></Label>
                                <Input value={op.nota} maxLength={140} placeholder="Ej: Revisado por contabilidad"
                                       onChange={e => set('nota', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Nombre del archivo</Label>
                                <div className="flex items-center gap-1.5">
                                    <Input value={archivo} onChange={e => setArchivo(e.target.value)} />
                                    <span className="text-xs text-muted-foreground">.pdf</span>
                                </div>
                            </div>
                        </Seccion>

                        {interruptores.length > 0 && (
                            <Seccion icono={Paperclip} titulo="Anexos">
                                {interruptores.map(it => (
                                    <label key={it.k} className="flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 hover:bg-muted/50">
                                        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-blue-600"
                                               checked={!!op.extras?.[it.k]}
                                               onChange={e => set('extras', { ...(op.extras ?? {}), [it.k]: e.target.checked })} />
                                        <span>
                                            <span className="block text-sm font-medium">{it.t}</span>
                                            {it.d && <span className="block text-xs text-muted-foreground">{it.d}</span>}
                                        </span>
                                    </label>
                                ))}
                            </Seccion>
                        )}

                        <Seccion icono={Palette} titulo="Color y formato">
                            <SelectorColor valor={op.color} onChange={v => set('color', v)} />
                            {defecto.orientacion && (
                                <Opciones
                                    etiqueta="Orientación"
                                    valor={op.orientacion ?? defecto.orientacion}
                                    onChange={v => set('orientacion', v)}
                                    opciones={[{ v: 'horizontal', t: 'Horizontal' }, { v: 'vertical', t: 'Vertical' }]}
                                />
                            )}
                            <Opciones
                                etiqueta="Tamaño de letra"
                                valor={op.tamanoLetra}
                                onChange={v => set('tamanoLetra', v)}
                                opciones={[{ v: 'pequena', t: 'Pequeña' }, { v: 'normal', t: 'Normal' }, { v: 'grande', t: 'Grande' }]}
                            />
                        </Seccion>
                    </div>

                    {/* Vista previa */}
                    <div className="relative bg-muted/50 md:min-h-[300px]">
                        {url && <iframe title="Vista previa del PDF" src={`${url}#toolbar=0&navpanes=0`} className="hidden h-full w-full md:block" />}
                        {/* En celulares el navegador no muestra PDF dentro de la página: se abre aparte. */}
                        <div className="flex items-center gap-3 border-t px-4 py-3 md:hidden">
                            <FileText className="h-6 w-6 shrink-0 text-blue-600/70" />
                            <p className="flex-1 text-xs text-muted-foreground">En el celular la vista previa se abre en otra pestaña.</p>
                            <Button variant="outline" size="sm" className="shrink-0 gap-1.5" disabled={!listo}
                                    onClick={() => url && window.open(url, '_blank')}>
                                <ExternalLink className="h-4 w-4" /> Ver
                            </Button>
                        </div>
                        {generando && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
                                <span className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm shadow-sm">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Actualizando vista previa…
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 border-t bg-muted/30 px-4 py-3 sm:px-5">
                    <Button variant="ghost" size="sm" className="gap-1.5 px-2 sm:px-3" title="Restablecer"
                            onClick={() => { setOp(defecto); setArchivo(archivoDefecto) }}>
                        <RotateCcw className="h-4 w-4" /> <span className="hidden sm:inline">Restablecer</span>
                    </Button>
                    <div className="ml-auto flex gap-2">
                        <Button variant="outline" onClick={onCerrar}>Cerrar</Button>
                        <Button variant="outline" size="icon" className="hidden md:inline-flex" disabled={!listo}
                                onClick={() => url && window.open(url, '_blank')}
                                title="Abrir en otra pestaña" aria-label="Abrir en otra pestaña">
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" className="hidden gap-1.5 md:inline-flex" disabled={!listo}
                                onClick={() => url && imprimirPdf(url)}
                                title="Abre el cuadro de impresión para elegir la impresora">
                            <Printer className="h-4 w-4" /> Imprimir
                        </Button>
                        <Button className="gap-1.5 bg-blue-600 text-white shadow-md shadow-blue-600/30 hover:bg-blue-700"
                                disabled={!listo} onClick={descargar}>
                            <Download className="h-4 w-4" /> Descargar<span className="hidden sm:inline"> PDF</span>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
