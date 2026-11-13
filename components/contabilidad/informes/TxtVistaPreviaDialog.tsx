'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Copy, Download, FileText, Info, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { toast } from '@/app/hooks/useToast'
import { ArchivoSunat } from '@/app/types/informes-contables-types'
import { descargarBlob } from '@/app/services/contabilidad/InformesContablesService'

const MAX_LINEAS_VISTA = 400

function Seccion({ icono: Icono, titulo, children }: { icono: React.ElementType; titulo: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Icono className="h-3.5 w-3.5" /> {titulo}
            </p>
            {children}
        </div>
    )
}

const Dato = ({ t, v, mono }: { t: string; v: React.ReactNode; mono?: boolean }) => (
    <div className="flex items-start justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{t}</span>
        <span className={cn('text-right font-semibold text-foreground', mono && 'font-mono text-xs break-all')}>{v}</span>
    </div>
)

/**
 * Vista previa de un archivo TXT de SUNAT (PLE / SIRE) antes de descargarlo.
 * Mismo formato que el modal de vista previa de los PDF del sistema: datos a la izquierda,
 * contenido a la derecha y botones abajo. El archivo ya viene generado por el backend:
 * lo que se ve es exactamente lo que se descarga (Windows-1252, una línea por registro).
 */
export function TxtVistaPreviaDialog({ abierto, onCerrar, titulo, periodo, archivo }: {
    abierto: boolean
    onCerrar: () => void
    titulo: string
    periodo: string
    archivo: ArchivoSunat | null
}) {
    const [texto, setTexto] = useState('')
    const [buscar, setBuscar] = useState('')

    useEffect(() => {
        if (!abierto || !archivo) return
        setBuscar('')
        archivo.blob.arrayBuffer().then(b => setTexto(new TextDecoder('windows-1252').decode(b)))
    }, [abierto, archivo])

    const lineas = useMemo(() => texto.split(/\r?\n/).filter(l => l.length > 0), [texto])
    const campos = lineas[0] ? lineas[0].split('|').length - 1 : 0
    const filtradas = useMemo(() => {
        const q = buscar.trim().toUpperCase()
        const conNumero = lineas.map((l, i) => ({ n: i + 1, l }))
        return q ? conNumero.filter(x => x.l.toUpperCase().includes(q)) : conNumero
    }, [lineas, buscar])

    const copiar = async () => {
        try { await navigator.clipboard.writeText(texto); toast({ description: 'Contenido copiado al portapapeles.' }) }
        catch { toast({ title: 'No se pudo copiar', variant: 'destructive' }) }
    }

    const descargar = () => {
        if (!archivo) return
        descargarBlob(archivo.blob, archivo.nombre)
        toast({ title: 'Archivo descargado', description: `${archivo.nombre} · ${archivo.lineas} líneas` })
    }

    return (
        <Dialog open={abierto} onOpenChange={v => { if (!v) onCerrar() }}>
            <DialogContent className="flex h-[92vh] w-[96vw] max-w-6xl flex-col gap-0 overflow-hidden p-0" onOpenAutoFocus={e => e.preventDefault()}>
                <DialogHeader className="border-b px-5 py-4 text-left">
                    <DialogTitle className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white">
                            <FileText className="h-4 w-4" />
                        </span>
                        {titulo}
                    </DialogTitle>
                    <DialogDescription>Revisa el contenido del archivo antes de descargarlo para SUNAT.</DialogDescription>
                </DialogHeader>

                <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[auto_1fr] md:grid-cols-[320px_1fr] md:grid-rows-1">
                    {/* Datos del archivo */}
                    <div className="min-h-0 space-y-5 overflow-y-auto border-b p-5 md:border-b-0 md:border-r">
                        <Seccion icono={Info} titulo="Archivo">
                            <Dato t="Periodo" v={periodo} />
                            <Dato t="Nombre" v={archivo?.nombre ?? '-'} mono />
                            <Dato t="Registros (líneas)" v={(archivo?.lineas ?? 0).toLocaleString('en-US')} />
                            <Dato t="Campos por línea" v={campos || '-'} />
                            <Dato t="Indicador de contenido" v={archivo?.indicador === 1 ? '1 · con información' : '0 · sin operaciones'} />
                            <Dato t="Tamaño" v={`${((archivo?.blob.size ?? 0) / 1024).toFixed(1)} KB`} />
                            <Dato t="Codificación" v="Windows-1252 · CRLF" />
                        </Seccion>
                        <Seccion icono={Search} titulo="Buscar en el contenido">
                            <div className="space-y-1.5">
                                <Label className="text-xs">RUC, serie, número o nombre</Label>
                                <Input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Ej: F001-13080 o 20100047218" />
                                {buscar && <p className="text-xs text-muted-foreground">{filtradas.length} línea(s) coinciden</p>}
                            </div>
                        </Seccion>
                        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                            El nombre del archivo sigue el formato de SUNAT: no lo cambies al subirlo.
                        </p>
                    </div>

                    {/* Contenido */}
                    <div className="relative min-h-0 overflow-auto bg-muted/50">
                        {lineas.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
                                <FileText className="h-10 w-10 opacity-40" />
                                <p className="text-sm">Archivo vacío (indicador 0): el periodo no tiene operaciones.</p>
                            </div>
                        ) : (
                            <table className="w-full border-separate border-spacing-0 font-mono text-[11px] leading-5">
                                <tbody>
                                {filtradas.slice(0, MAX_LINEAS_VISTA).map(x => (
                                    <tr key={x.n} className="hover:bg-blue-50 dark:hover:bg-blue-950/40">
                                        <td className="sticky left-0 w-12 select-none whitespace-nowrap border-r bg-muted px-2 text-right align-top text-muted-foreground">{x.n}</td>
                                        <td className="whitespace-pre px-3 text-foreground">{x.l}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                        {filtradas.length > MAX_LINEAS_VISTA && (
                            <p className="sticky bottom-0 border-t bg-background/95 px-4 py-2 text-xs text-muted-foreground">
                                Se muestran {MAX_LINEAS_VISTA} de {filtradas.length} líneas. El archivo descargado tiene todas.
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 border-t bg-muted/30 px-4 py-3 sm:px-5">
                    <span className="hidden text-xs text-muted-foreground sm:inline">{archivo?.lineas ?? 0} líneas · {campos} campos</span>
                    <div className="ml-auto flex gap-2">
                        <Button variant="outline" onClick={onCerrar}>Cerrar</Button>
                        <Button variant="outline" className="hidden gap-1.5 md:inline-flex" disabled={!texto} onClick={copiar}>
                            <Copy className="h-4 w-4" /> Copiar
                        </Button>
                        <Button className="gap-1.5 bg-blue-600 text-white shadow-md shadow-blue-600/30 hover:bg-blue-700" disabled={!archivo} onClick={descargar}>
                            <Download className="h-4 w-4" /> Descargar<span className="hidden sm:inline"> TXT</span>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
