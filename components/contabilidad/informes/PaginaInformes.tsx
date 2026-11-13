'use client'

import React, { useMemo, useState } from 'react'
import { FileSearch, Info } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { ClaveReporte, FiltroInforme } from '@/app/types/informes-contables-types'
import { DEFINICIONES } from './definiciones'
import { FiltrosPeriodo, filtroInicial } from './FiltrosPeriodo'
import { TablaInforme } from './TablaInforme'
import { ExportarExcelInforme } from './ExportarExcelInforme'
import { ExportarPdfInforme } from './ExportarPdfInforme'
import { useInforme } from './useInforme'
import { fmtFecha, MESES, simboloDe, textoTotal } from './formato'
import { DefinicionReporte } from '@/app/types/informes-contables-types'

/** Leyenda de la moneda de los importes, como "Expresado en Nuevos Soles" del reporte Access. */
function leyendaMoneda(def: DefinicionReporte) {
    const montos = def.columnas.filter(c => c.tipo === 'monto')
    if (!montos.length) return ''   // sin importes (p. ej. correlativos): no se indica moneda
    const originales = montos.filter(c => simboloDe(c, def.moneda) === '')
    if (montos.length && originales.length === montos.length) return 'Importes en la moneda de cada documento (columna Mon.)'
    if (originales.length) return 'Importes en la moneda de cada documento; la última columna, convertida a soles (S/)'
    return def.moneda === 'US$' ? 'Expresado en dólares americanos (US$)' : 'Expresado en soles (S/)'
}

interface Props {
    titulo: string
    descripcion: string
    pestanas: ClaveReporte[]
}

/** Texto del periodo consultado, para la cabecera del Excel y los avisos. */
function textoPeriodo(tipo: string, f: FiltroInforme) {
    if (tipo === 'rango') return `Del ${fmtFecha(f.fechaDesde)} al ${fmtFecha(f.fechaHasta)}`
    if (tipo === 'anio') return `Año ${f.anio}`
    return `${MESES[Number(f.mes) - 1]} ${f.anio}`
}

/**
 * Página con pestañas de informes (Registro de Ventas / Registro de Compras).
 * Todo sale de las definiciones: la página solo recibe la lista de pestañas.
 */
export function PaginaInformes({ titulo, descripcion, pestanas }: Props) {
    const [activa, setActiva] = useState<ClaveReporte>(pestanas[0])
    const [filtro, setFiltro] = useState<FiltroInforme>(filtroInicial())
    const { filas, cargando, consulta, cargar, limpiar } = useInforme()

    const def = DEFINICIONES[activa]
    const actuales = consulta?.clave === activa ? filas : null
    const kpis = useMemo(() => {
        if (!actuales) return []
        const montos = def.columnas.filter(c => c.total && c.tipo === 'monto').slice(-3)
        return [{ t: 'Registros', v: actuales.length.toLocaleString('en-US') },
            ...montos.map(c => ({ t: c.titulo, v: textoTotal(c, actuales, def.moneda) }))]
    }, [actuales, def])

    const cambiarPestana = (v: string) => { setActiva(v as ClaveReporte); limpiar() }
    const periodo = textoPeriodo(def.filtro, filtro)
    const nombreArchivo = `${activa}_${def.filtro === 'rango' ? `${filtro.fechaDesde}_${filtro.fechaHasta}` : filtro.anio + (def.filtro === 'mes' ? filtro.mes : '')}`

    return (
        <div className="grid grid-cols-1 gap-6 p-0 md:p-2">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{titulo}</h1>
                <p className="text-sm md:text-base text-muted-foreground">{descripcion}</p>
            </div>

            <Tabs value={activa} onValueChange={cambiarPestana}>
                <div className="overflow-x-auto pb-1">
                    <TabsList className="h-auto w-max gap-1 bg-muted p-1">
                        {pestanas.map(k => (
                            <TabsTrigger key={k} value={k} className="px-3 py-1.5 text-xs md:text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                                {DEFINICIONES[k].titulo}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>
            </Tabs>

            <Card className="shadow-md overflow-hidden">
                <CardHeader className="bg-muted border-b border-border p-4 gap-3">
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Info className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
                        <span>{def.descripcion} <span className="text-xs">(Access: {def.access})</span></span>
                    </div>
                    <FiltrosPeriodo
                        tipo={def.filtro} filtro={filtro} onChange={setFiltro} cargando={cargando}
                        onBuscar={() => cargar(activa, def.filtro, filtro)}
                        acciones={<>
                            <ExportarPdfInforme titulo={`${titulo} - ${def.titulo}`} subtitulo={[periodo, leyendaMoneda(def)].filter(Boolean).join(' · ')}
                                                nombreArchivo={nombreArchivo} columnas={def.columnas} filas={actuales} moneda={def.moneda} />
                            <ExportarExcelInforme titulo={`${titulo} - ${def.titulo}`} subtitulo={periodo}
                                                  nombreArchivo={nombreArchivo} columnas={def.columnas} filas={actuales} moneda={def.moneda} />
                        </>}
                    />
                </CardHeader>

                <CardContent className="p-0">
                    {!actuales && !cargando && (
                        <div className="flex flex-col items-center gap-2 py-14 text-muted-foreground">
                            <FileSearch className="h-10 w-10 opacity-40" />
                            <p className="text-sm">Elige el periodo y pulsa <b>Consultar</b>.</p>
                        </div>
                    )}
                    {actuales && (
                        <>
                            <div className={cn('grid gap-3 p-3 md:p-4', kpis.length > 2 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2')}>
                                {kpis.map((k, i) => (
                                    <div key={k.t} className="rounded-lg border border-border p-3 md:p-4">
                                        <p className="text-[10px] md:text-[11px] uppercase tracking-wider text-muted-foreground">{k.t}</p>
                                        <p className={cn('mt-1 text-lg md:text-2xl font-bold', i === kpis.length - 1 && i > 0 ? 'text-blue-700 dark:text-blue-400' : 'text-foreground')}>{k.v}</p>
                                    </div>
                                ))}
                            </div>
                            {actuales.length === 0
                                ? <p className="px-4 pb-8 pt-2 text-center text-sm text-muted-foreground">{def.vacio ?? `No hay registros para ${periodo}.`}</p>
                                : <div className="border-t border-border">
                                    <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/40 border-b">
                                        {[leyendaMoneda(def), periodo].filter(Boolean).join(' · ')}
                                    </p>
                                    <TablaInforme columnas={def.columnas} filas={actuales} moneda={def.moneda} />
                                </div>}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
