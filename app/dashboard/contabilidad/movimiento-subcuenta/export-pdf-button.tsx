'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Check, Download, ExternalLink, FileText, Loader2, Palette, RotateCcw, Type, Printer } from 'lucide-react'
import { toast } from '@/app/hooks/useToast'
import { imprimirPdf } from '@/components/reporte/imprimirPdf'
import { Interruptor, Opciones, Seccion } from '@/components/reporte/PdfOpcionesControles'
import { cn } from '@/lib/utils'
import { SubctaMvtoCabecera, SubctaMvtoDetalle } from '@/app/types/contabilidad-types'
import {
    ColumnaOpcional, generarPdfSubcta, OPCIONES_PDF_DEFECTO, OpcionesPdfSubcta, TEMAS_PDF,
} from './pdfSubcuenta'

interface Props {
    cabecera: SubctaMvtoCabecera
    detalle:  SubctaMvtoDetalle[]
}

const COLUMNAS: { clave: ColumnaOpcional; nombre: string }[] = [
    { clave: 'libro',     nombre: 'Libro' },
    { clave: 'documento', nombre: 'Documento' },
    { clave: 'saldo',     nombre: 'Saldo acumulado' },
    { clave: 'item',      nombre: 'Item' },
]

const nombrePorDefecto = (cab: SubctaMvtoCabecera) =>
    `mvto-subcuenta-${cab.Cuenta}-${new Date().toISOString().split('T')[0]}`

/**
 * Exportar PDF del movimiento de sub cuenta. Abre un modal con la vista
 * previa del PDF y opciones para editarlo (título, nota, color, orientación,
 * tamaño de letra, columnas) antes de descargarlo o imprimirlo.
 */
const ExportSubctaMvtoPdf: React.FC<Props> = ({ cabecera, detalle }) => {
    const [open, setOpen] = useState(false)
    const [op, setOp] = useState<OpcionesPdfSubcta>(OPCIONES_PDF_DEFECTO)
    const [archivo, setArchivo] = useState(() => nombrePorDefecto(cabecera))
    const [url, setUrl] = useState<string | null>(null)
    const [generando, setGenerando] = useState(false)
    const urlRef = useRef<string | null>(null)

    // Cada vez que cambia una opción se regenera la vista previa. Se espera
    // un momento para no generar el PDF por cada tecla del título.
    useEffect(() => {
        if (!open) return
        let cancelado = false
        setGenerando(true)
        const t = setTimeout(async () => {
            try {
                const bytes = await generarPdfSubcta(cabecera, detalle, op)
                if (cancelado) return
                const nueva = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
                if (urlRef.current) URL.revokeObjectURL(urlRef.current)
                urlRef.current = nueva
                setUrl(nueva)
            } catch (error) {
                console.error('Error al generar el PDF del movimiento de sub cuenta:', error)
                if (!cancelado) toast({ title: "Error", description: "No se pudo generar la vista previa.", variant: "destructive" })
            } finally {
                if (!cancelado) setGenerando(false)
            }
        }, 350)
        return () => { cancelado = true; clearTimeout(t) }
    }, [open, op, cabecera, detalle])

    useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current) }, [])

    const set = <K extends keyof OpcionesPdfSubcta>(k: K, v: OpcionesPdfSubcta[K]) => setOp(p => ({ ...p, [k]: v }))

    const descargar = () => {
        if (!url) return
        const link = document.createElement('a')
        link.href = url
        link.download = `${(archivo.trim() || nombrePorDefecto(cabecera)).replace(/\.pdf$/i, '')}.pdf`
        link.click()
    }

    const restablecer = () => {
        setOp(OPCIONES_PDF_DEFECTO)
        setArchivo(nombrePorDefecto(cabecera))
    }

    return (
        <>
            <Button
                variant="outline"
                onClick={() => setOpen(true)}
                className="shrink-0 gap-2 text-blue-700 border-blue-200 hover:bg-blue-50 bg-background"
            >
                <FileText className="h-4 w-4" />
                Exportar PDF
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="flex h-[92vh] w-[96vw] max-w-6xl flex-col gap-0 overflow-hidden p-0">
                    <DialogHeader className="border-b px-5 py-4 text-left">
                        <DialogTitle className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white">
                                <FileText className="h-4 w-4" />
                            </span>
                            Exportar PDF
                        </DialogTitle>
                        <DialogDescription>
                            {cabecera.SubCuenta} · {cabecera.Periodo}. Ajusta el diseño y revisa la vista previa antes de descargar.
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
                                    <Input value={op.nota} maxLength={140} placeholder="Ej: Conciliado con estado de cuenta"
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
                                    opciones={[{ v: 'horizontal', t: 'Horizontal' }, { v: 'vertical', t: 'Vertical' }]}
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
                                        {COLUMNAS.map(c => (
                                            <label key={c.clave} className="flex cursor-pointer items-center gap-2 text-sm">
                                                <Checkbox
                                                    checked={op.columnas[c.clave]}
                                                    onCheckedChange={v => set('columnas', { ...op.columnas, [c.clave]: v === true })}
                                                />
                                                {c.nombre}
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">Fecha, concepto, ingreso y salida siempre se incluyen.</p>
                                </div>
                                <Interruptor etiqueta="Resumen de saldos arriba" valor={op.mostrarResumen} onChange={v => set('mostrarResumen', v)} />
                                <Interruptor etiqueta="Ingresos y salidas en color" valor={op.colorImportes} onChange={v => set('colorImportes', v)} />
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
                                <Button variant="outline" size="sm" className="shrink-0 gap-1.5" disabled={!url || generando}
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
                        <Button variant="ghost" size="sm" className="gap-1.5 px-2 sm:px-3" onClick={restablecer} title="Restablecer">
                            <RotateCcw className="h-4 w-4" /> <span className="hidden sm:inline">Restablecer</span>
                        </Button>
                        <div className="ml-auto flex gap-2">
                            <Button variant="outline" onClick={() => setOpen(false)}>Cerrar</Button>
                            <Button variant="outline" size="icon" className="hidden md:inline-flex" disabled={!url || generando}
                                    onClick={() => url && window.open(url, '_blank')}
                                    title="Abrir en otra pestaña" aria-label="Abrir en otra pestaña">
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" className="hidden gap-1.5 md:inline-flex" disabled={!url || generando}
                                    onClick={() => url && imprimirPdf(url)}
                                    title="Abre el cuadro de impresión para elegir la impresora">
                                <Printer className="h-4 w-4" /> Imprimir
                            </Button>
                            <Button className="gap-1.5 bg-blue-600 text-white shadow-md shadow-blue-600/30 hover:bg-blue-700"
                                    disabled={!url || generando} onClick={descargar}>
                                <Download className="h-4 w-4" /> Descargar<span className="hidden sm:inline"> PDF</span>
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default ExportSubctaMvtoPdf
