'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertCircle, Check, Download, ExternalLink, FileText, Loader2, Palette, Printer, RotateCcw, Type } from 'lucide-react'
import { toast } from '@/app/hooks/useToast'
import { imprimirPdf } from '@/components/reporte/imprimirPdf'
import { cn } from '@/lib/utils'
import { ComprasService } from '@/app/services/contabilidad/ContabilidadService'
import { TEMAS_PDF } from '@/components/reporte/pdfOpciones'
import { Interruptor, Opciones, Seccion } from '@/components/reporte/PdfOpcionesControles'
import {
    ColumnaOpcionalCompra, generarPdfRegistroCompra, OPCIONES_PDF_COMPRA_DEFECTO, OpcionesPdfCompra,
} from './pdfRegistroCompra'

const COLUMNAS: { clave: ColumnaOpcionalCompra; nombre: string }[] = [
    { clave: 'und',   nombre: 'Unidad' },
    { clave: 'punit', nombre: 'Precio unitario' },
    { clave: 'lote',  nombre: 'Lote' },
    { clave: 'vence', nombre: 'Vencimiento' },
]

/**
 * Imprimir el documento de compra. Mismo modal que "Exportar PDF" de Movimiento
 * Sub Cuenta: vista previa en vivo y opciones para editar el PDF antes de
 * descargarlo o imprimirlo.
 */
export function ImprimirCompraDialog({
    abierto, onCerrar, clave, titulo, nombreTipo,
}: {
    abierto:    boolean
    onCerrar:   () => void
    clave:      number | null
    /** Serie-número del documento, para el nombre del archivo. */
    titulo:     string
    nombreTipo: (cod: string) => string
}) {
    const porDefecto = `compra-${titulo || clave}`
    const [filas, setFilas] = useState<Record<string, unknown>[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [op, setOp] = useState<OpcionesPdfCompra>(OPCIONES_PDF_COMPRA_DEFECTO)
    const [archivo, setArchivo] = useState(porDefecto)
    const [url, setUrl] = useState<string | null>(null)
    const [generando, setGenerando] = useState(false)
    const urlRef = useRef<string | null>(null)

    // Al abrir se traen los datos de impresión una sola vez.
    useEffect(() => {
        if (!abierto || !clave) return
        let vivo = true
        setFilas(null); setError(null); setUrl(null); setArchivo(porDefecto)
        ComprasService.datosImpresion(clave)
            .then(r => {
                if (!vivo) return
                if (r.length === 0) setError('El documento no tiene líneas para imprimir.')
                else setFilas(r as Record<string, unknown>[])
            })
            .catch(e => { if (vivo) setError(e?.response?.data?.message || 'No se pudieron obtener los datos de impresión.') })
        return () => { vivo = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [abierto, clave])

    // Cada vez que cambia una opción se regenera la vista previa. Se espera
    // un momento para no generar el PDF por cada tecla del título.
    useEffect(() => {
        if (!abierto || !filas) return
        let cancelado = false
        setGenerando(true)
        const t = setTimeout(async () => {
            try {
                const bytes = await generarPdfRegistroCompra(filas, nombreTipo, op)
                if (cancelado) return
                const nueva = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }))
                if (urlRef.current) URL.revokeObjectURL(urlRef.current)
                urlRef.current = nueva
                setUrl(nueva)
            } catch (e) {
                console.error('Error al generar el PDF de la compra:', e)
                if (!cancelado) toast({ title: "Error", description: "No se pudo generar la vista previa.", variant: "destructive" })
            } finally {
                if (!cancelado) setGenerando(false)
            }
        }, 350)
        return () => { cancelado = true; clearTimeout(t) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [abierto, filas, op])

    useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current) }, [])

    const set = <K extends keyof OpcionesPdfCompra>(k: K, v: OpcionesPdfCompra[K]) => setOp(p => ({ ...p, [k]: v }))

    const descargar = () => {
        if (!url) return
        const link = document.createElement('a')
        link.href = url
        link.download = `${(archivo.trim() || porDefecto).replace(/\.pdf$/i, '')}.pdf`
        link.click()
    }

    const restablecer = () => {
        setOp(OPCIONES_PDF_COMPRA_DEFECTO)
        setArchivo(porDefecto)
    }

    const listo = !!url && !generando

    return (
        <Dialog open={abierto} onOpenChange={v => { if (!v) onCerrar() }}>
            <DialogContent className="flex h-[92vh] w-[96vw] max-w-6xl flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="border-b px-5 py-4 text-left">
                    <DialogTitle className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white">
                            <Printer className="h-4 w-4" />
                        </span>
                        Imprimir compra
                    </DialogTitle>
                    <DialogDescription>
                        {titulo ? `${titulo}. ` : ''}Ajusta el diseño y revisa la vista previa antes de descargar o imprimir.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[1fr_auto] md:grid-cols-[320px_1fr] md:grid-rows-1">
                    {/* Opciones */}
                    <div className="min-h-0 space-y-5 overflow-y-auto border-b p-5 md:border-b-0 md:border-r">
                        <Seccion icono={Type} titulo="Textos">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Título del reporte</Label>
                                <Input value={op.titulo} maxLength={80} onChange={e => set('titulo', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Nota u observación <span className="text-muted-foreground">(opcional)</span></Label>
                                <Input value={op.nota} maxLength={140} placeholder="Ej: Recibido conforme en almacén"
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

                        <Seccion icono={Palette} titulo="Color y formato">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Color</Label>
                                <div className="flex flex-wrap items-center gap-2">
                                    {TEMAS_PDF.map(t => (
                                        <button
                                            key={t.color}
                                            type="button"
                                            title={t.nombre}
                                            onClick={() => set('color', t.color)}
                                            className={cn(
                                                'flex h-8 w-8 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition',
                                                op.color.toLowerCase() === t.color ? 'ring-2 ring-foreground/60' : 'hover:scale-110',
                                            )}
                                            style={{ backgroundColor: t.color }}
                                        >
                                            {op.color.toLowerCase() === t.color && <Check className="h-4 w-4 text-white" />}
                                        </button>
                                    ))}
                                    <label title="Otro color" className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-dashed text-xs text-muted-foreground">
                                        +
                                        <input type="color" value={op.color} onChange={e => set('color', e.target.value)}
                                               className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                                    </label>
                                </div>
                            </div>

                            <Opciones
                                etiqueta="Orientación"
                                valor={op.orientacion}
                                onChange={v => set('orientacion', v)}
                                opciones={[{ v: 'vertical', t: 'Vertical' }, { v: 'horizontal', t: 'Horizontal' }]}
                            />
                            <Opciones
                                etiqueta="Tamaño de letra"
                                valor={op.tamanoLetra}
                                onChange={v => set('tamanoLetra', v)}
                                opciones={[{ v: 'pequena', t: 'Pequeña' }, { v: 'normal', t: 'Normal' }, { v: 'grande', t: 'Grande' }]}
                            />
                        </Seccion>

                        <Seccion icono={FileText} titulo="Contenido">
                            <div className="space-y-2">
                                <Label className="text-xs">Columnas</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {COLUMNAS.map(x => (
                                        <label key={x.clave} className="flex cursor-pointer items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={op.columnas[x.clave]}
                                                onCheckedChange={v => set('columnas', { ...op.columnas, [x.clave]: v === true })}
                                            />
                                            {x.nombre}
                                        </label>
                                    ))}
                                </div>
                                <p className="text-[11px] text-muted-foreground">Artículo, cantidad y total siempre se incluyen.</p>
                            </div>
                            <Interruptor etiqueta="Recuadro con datos del documento" valor={op.mostrarDatos} onChange={v => set('mostrarDatos', v)} />
                            <Interruptor etiqueta="Filas alternadas (cebra)" valor={op.zebra} onChange={v => set('zebra', v)} />
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
                        {error ? (
                            <div className="absolute inset-0 flex items-center justify-center p-6">
                                <span className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                                </span>
                            </div>
                        ) : (!filas || generando) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
                                <span className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm shadow-sm">
                                    <Loader2 className="h-4 w-4 animate-spin" /> {filas ? 'Actualizando vista previa…' : 'Cargando datos…'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 border-t bg-muted/30 px-4 py-3 sm:px-5">
                    <Button variant="ghost" size="sm" className="gap-1.5 px-2 sm:px-3" onClick={restablecer} title="Restablecer">
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
