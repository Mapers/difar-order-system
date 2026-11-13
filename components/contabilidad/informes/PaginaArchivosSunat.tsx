'use client'

import React, { useState } from 'react'
import { CheckCircle2, Eye, FileText, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { toast } from '@/app/hooks/useToast'
import { InformesContablesService, mensajeError } from '@/app/services/contabilidad/InformesContablesService'
import { ArchivoSunat, FiltroInforme } from '@/app/types/informes-contables-types'
import { DEFINICIONES, DefinicionArchivo } from './definiciones'
import { FiltrosPeriodo, filtroInicial } from './FiltrosPeriodo'
import { TablaInforme } from './TablaInforme'
import { useInforme } from './useInforme'
import { MESES } from './formato'
import { TxtVistaPreviaDialog } from './TxtVistaPreviaDialog'

interface Props {
    titulo: string
    descripcion: string
    archivos: DefinicionArchivo[]
}

interface Generado { nombre: string; lineas: number; indicador: number }

/**
 * Página de archivos TXT para SUNAT (PLE / SIRE).
 * Cada archivo tiene vista previa (las filas que van al TXT) y descarga.
 * Los anexos SIRE 12 y 8 piden elegir los documentos antes de descargar.
 */
export function PaginaArchivosSunat({ titulo, descripcion, archivos }: Props) {
    const [filtro, setFiltro] = useState<FiltroInforme>(filtroInicial())
    const [activo, setActivo] = useState<DefinicionArchivo>(archivos[0])
    const [seleccion, setSeleccion] = useState<Set<number>>(new Set())
    const [descargando, setDescargando] = useState<string | null>(null)
    const [generados, setGenerados] = useState<Record<string, Generado>>({})
    const [previa, setPrevia] = useState<{ titulo: string; archivo: ArchivoSunat } | null>(null)
    const { filas, cargando, consulta, cargar, limpiar } = useInforme()

    const periodo = `${MESES[Number(filtro.mes) - 1]} ${filtro.anio}`
    const def = activo.reporte ? DEFINICIONES[activo.reporte] : null
    const actuales = def && consulta?.clave === activo.reporte ? filas : null

    const elegir = (a: DefinicionArchivo) => { setActivo(a); setSeleccion(new Set()); limpiar() }
    const verPrevia = () => def && cargar(def.clave, 'mes', filtro)

    const descargar = async (a: DefinicionArchivo) => {
        if (a.seleccionable && seleccion.size === 0) {
            toast({ title: 'Elige documentos', description: 'Marca los documentos que van en el anexo.', variant: 'warning' })
            return
        }
        setDescargando(a.clave)
        try {
            // se genera el archivo y se abre la VISTA PREVIA; la descarga se hace desde el modal
            const r = await InformesContablesService.archivo(a.clave, filtro.anio, filtro.mes, a.seleccionable ? [...seleccion] : undefined)
            setGenerados(g => ({ ...g, [a.clave]: { nombre: r.nombre, lineas: r.lineas, indicador: r.indicador } }))
            setPrevia({ titulo: a.titulo, archivo: r })
        } catch (e) {
            toast({ title: 'No se pudo generar el archivo', description: await mensajeError(e, 'Intenta nuevamente.'), variant: 'destructive' })
        } finally {
            setDescargando(null)
        }
    }

    return (
        <div className="grid grid-cols-1 gap-6 p-0 md:p-2">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{titulo}</h1>
                <p className="text-sm md:text-base text-muted-foreground">{descripcion}</p>
            </div>

            <Card className="shadow-md">
                <CardHeader className="bg-muted border-b border-border p-4">
                    <FiltrosPeriodo tipo="mes" filtro={filtro} onChange={f => { setFiltro(f); limpiar(); setGenerados({}) }}
                                    cargando={cargando} onBuscar={verPrevia} />
                </CardHeader>
                <CardContent className="p-3 md:p-4">
                    <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3', archivos.length > 3 ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
                        {archivos.map(a => {
                            const g = generados[a.clave]
                            const sel = activo.clave === a.clave
                            return (
                                <div key={a.clave} onClick={() => elegir(a)}
                                     className={cn('cursor-pointer rounded-xl border p-4 flex flex-col gap-3 transition-all',
                                         sel ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-500 dark:bg-blue-950/40' : 'border-border hover:border-blue-300 hover:bg-muted/40')}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2.5">
                                            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', sel ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground')}>
                                                <FileText className="h-5 w-5" />
                                            </span>
                                            <div>
                                                <p className="text-sm font-bold text-foreground leading-tight">{a.titulo}</p>
                                                <p className="text-xs text-muted-foreground">{a.descripcion}</p>
                                            </div>
                                        </div>
                                        {a.seleccionable && <Badge variant="outline" className="shrink-0 text-[10px]">Elegir docs</Badge>}
                                    </div>
                                    {g && (
                                        <div className="rounded-md bg-emerald-50 px-2 py-1.5 text-[11px] text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                            <p className="flex items-center gap-1 font-semibold"><CheckCircle2 className="h-3.5 w-3.5" /> {g.lineas} líneas · indicador {g.indicador}</p>
                                            <p className="font-mono break-all">{g.nombre}</p>
                                        </div>
                                    )}
                                    <Button size="sm" className="mt-auto bg-blue-600 hover:bg-blue-700 text-white" disabled={descargando === a.clave}
                                            onClick={e => { e.stopPropagation(); setActivo(a); descargar(a) }}>
                                        {descargando === a.clave ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                                        {a.seleccionable ? `Vista previa TXT (${activo.clave === a.clave ? seleccion.size : 0})` : 'Vista previa TXT'}
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-md overflow-hidden">
                <CardHeader className="border-b border-border p-4 flex flex-row items-center justify-between gap-3 space-y-0">
                    <div>
                        <p className="font-bold text-foreground">{activo.titulo} · {periodo}</p>
                        <p className="text-xs text-muted-foreground">
                            {activo.seleccionable ? 'Marca los documentos que van en el archivo y pulsa Descargar.' : 'Registros que van en el archivo.'}
                        </p>
                    </div>
                    {def && (
                        <Button variant="outline" size="sm" onClick={verPrevia} disabled={cargando}>
                            {cargando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />} {activo.seleccionable ? 'Cargar documentos' : 'Vista previa'}
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    {!def && <p className="p-8 text-center text-sm text-muted-foreground">Este archivo no tiene operaciones: se descarga vacío con indicador 0, igual que en Access.</p>}
                    {def && !actuales && !cargando && <p className="p-8 text-center text-sm text-muted-foreground">Pulsa <b>{activo.seleccionable ? 'Cargar documentos' : 'Vista previa'}</b> para ver los registros del periodo.</p>}
                    {def && actuales && actuales.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Sin registros en {periodo}: el archivo saldrá vacío (indicador 0).</p>}
                    {def && actuales && actuales.length > 0 && (
                        <>
                            {activo.seleccionable && (
                                <div className="flex items-center justify-between border-b bg-blue-50 px-4 py-2 text-xs text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                    <span><b>{seleccion.size}</b> de {actuales.length} documentos elegidos</span>
                                </div>
                            )}
                            <TablaInforme columnas={def.columnas} filas={actuales} moneda={def.moneda}
                                          campoId={activo.seleccionable ? def.campoId : undefined}
                                          seleccion={activo.seleccionable ? seleccion : undefined}
                                          onSeleccion={activo.seleccionable ? setSeleccion : undefined} />
                        </>
                    )}
                </CardContent>
            </Card>

            <TxtVistaPreviaDialog
                abierto={previa !== null}
                onCerrar={() => setPrevia(null)}
                titulo={previa?.titulo ?? ''}
                periodo={periodo}
                archivo={previa?.archivo ?? null}
            />
        </div>
    )
}
