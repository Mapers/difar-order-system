'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { FileSearch, Info } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { ClaveReporte, FilaInforme, FiltroInforme } from '@/app/types/informes-contables-types'
import { DEFINICIONES } from './definiciones'
import { FiltrosPeriodo, filtroInicial } from './FiltrosPeriodo'
import { TablaInforme } from './TablaInforme'
import { ExportarExcelInforme } from './ExportarExcelInforme'
import { ExportarPdfInforme } from './ExportarPdfInforme'
import { useInforme } from './useInforme'
import { FiltrosExtra } from './FiltrosExtra'
import { AvisoInforme } from './AvisoInforme'
import { fmtFecha, MESES, simboloDe, textoTotal } from './formato'
import { DefinicionReporte } from '@/app/types/informes-contables-types'

/** Leyenda de la moneda de los importes, como "Expresado en Nuevos Soles" del reporte Access. */
function leyendaMoneda(def: DefinicionReporte) {
    if (def.leyenda !== undefined) return def.leyenda
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
    /** Contenido extra bajo el título (por ejemplo, enlace a una página relacionada o botones). */
    aviso?: React.ReactNode
    /** Clic en una fila de la tabla (por ejemplo, abrir la ficha de la cuenta). */
    onFila?: (fila: FilaInforme) => void
    /** Al cambiar este número se vuelve a consultar (después de guardar o eliminar). */
    recargar?: number
}

/** Texto del periodo consultado (y filtros extra), para la cabecera del PDF/Excel y los avisos. */
function textoPeriodo(def: DefinicionReporte, f: FiltroInforme) {
    const ex = def.extras ?? []
    const partes: string[] = []
    if (def.filtro === 'rango') partes.push(`Del ${fmtFecha(f.fechaDesde)} al ${fmtFecha(f.fechaHasta)}`)
    else if (def.filtro === 'fecha') partes.push(`Al ${fmtFecha(f.fechaCorte)}`)
    else if (def.filtro === 'anio') partes.push(`Año ${f.anio}`)
    else if (def.filtro === 'mes') partes.push(`${MESES[Number(f.mes) - 1]} ${f.anio}`)
    if ((ex.includes('proveedor') || ex.includes('proveedor-obligatorio')))
        partes.push(f.codProveedor ? `Proveedor ${f.nomProveedor || f.codProveedor}` : 'Todos los proveedores')
    if (ex.includes('documento') && f.documento) partes.push(`Documento ${f.documento}`)
    if (ex.includes('tipo-doc')) partes.push(({ '01': 'Solo facturas', '80': 'Solo letras' } as Record<string, string>)[f.tipoDoc || ''] ?? 'Todos los documentos')
    if (ex.includes('buscar') && f.buscar) partes.push(`Búsqueda "${f.buscar}"`)
    if (ex.includes('nivel') && f.nivel) partes.push(`Nivel ${f.nivel}`)
    if (ex.includes('cuenta')) partes.push(f.cuenta ? `Cuenta ${f.cuenta}` : 'Todas las cuentas')
    return partes.join(' · ') || 'Todo'
}

/**
 * Página con pestañas de informes (Registros, Proveedores, Plan contable, Diario, Mayor, Estados financieros...).
 * Todo sale de las definiciones: la página solo recibe la lista de pestañas.
 */
export function PaginaInformes({ titulo, descripcion, pestanas, aviso, onFila, recargar }: Props) {
    const [activa, setActiva] = useState<ClaveReporte>(pestanas[0])
    const [filtro, setFiltro] = useState<FiltroInforme>(filtroInicial())
    const { filas, cargando, consulta, cargar, limpiar, aviso: avisoCarga, setAviso } = useInforme()
    // validación del filtro (no es un error): marca el campo que falta y abre su lista
    const [pedirProveedor, setPedirProveedor] = useState(0)

    const def = DEFINICIONES[activa]
    const base = consulta?.clave === activa ? filas : null
    // forma final de las filas y columnas (el Diario Simplificado se pivotea en el front)
    const vista = useMemo(() => {
        if (!base) return null
        return def.transformar ? def.transformar(base) : { filas: base, columnas: def.columnas }
    }, [base, def])
    const actuales = vista?.filas ?? null
    const columnas = vista?.columnas ?? def.columnas
    const pie = useMemo(() => {
        if (!actuales || !def.pie || !consulta || actuales.length === 0) return []
        const f = consulta.filtro
        return def.pie(actuales, { anio: f.anio, mes: f.mes, fechaCorte: f.fechaCorte })
    }, [actuales, def, consulta])

    const kpis = useMemo(() => {
        if (!actuales) return []
        const registros = { t: 'Registros', v: actuales.length.toLocaleString('en-US') }
        if (def.kpis) return [registros, ...(actuales.length ? def.kpis(actuales) : [])]
        const montos = columnas.filter(c => c.total && c.tipo === 'monto').slice(-3)
        return [registros, ...montos.map(c => ({ t: c.titulo, v: textoTotal(c, actuales, def.moneda) }))]
    }, [actuales, def, columnas])

    const cambiarPestana = (v: string) => { setActiva(v as ClaveReporte); limpiar(); setPedirProveedor(0) }
    // B6 (auditoría 14/11/2026): con datos en pantalla, el periodo de la cabecera, del PDF/Excel y del nombre del
    // archivo es el de la consulta HECHA, no el que se acaba de elegir en los filtros sin volver a consultar.
    const fd: FiltroInforme = actuales && consulta && consulta.clave === activa ? consulta.filtro : filtro
    const periodo = textoPeriodo(def, fd)
    const extras = def.extras ?? []
    const sufijo = def.filtro === 'rango' ? `${fd.fechaDesde}_${fd.fechaHasta}`
        : def.filtro === 'fecha' ? (fd.fechaCorte ?? '')
            : def.filtro === 'ninguno' ? new Date().toISOString().slice(0, 10)
                : fd.anio + (def.filtro === 'mes' ? fd.mes : '')
    const nombreArchivo = [activa, sufijo, extras.some(e => e.startsWith('proveedor')) ? fd.codProveedor : '', extras.includes('cuenta') ? fd.cuenta : '']
        .filter(Boolean).join('_')

    const consultar = () => {
        if (extras.includes('proveedor-obligatorio') && !filtro.codProveedor) {
            setPedirProveedor(n => n + 1)
            return
        }
        if (def.filtro === 'fecha' && !filtro.fechaCorte) {
            setAviso('Elige la fecha de corte para ver los saldos.')
            return
        }
        if (extras.includes('cuenta') && filtro.cuenta && !/^\d{1,12}$/.test(filtro.cuenta)) {
            setAviso('La cuenta solo lleva números (por ejemplo 10 o 1010101). Déjala vacía para ver todas.')
            return
        }
        cargar(activa, def.filtro, filtro, extras)
    }

    // recarga la consulta actual (si hay una) cuando el padre lo pide
    useEffect(() => {
        if (recargar && consulta) cargar(consulta.clave, DEFINICIONES[consulta.clave].filtro, consulta.filtro, DEFINICIONES[consulta.clave].extras ?? [])
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recargar])

    const exportar = { nombreArchivo, columnas, filas: actuales, moneda: def.moneda, grupos: def.grupos, pie, sinTotal: def.sinTotal }

    return (
        <div className="grid grid-cols-1 gap-6 p-0 md:p-2">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{titulo}</h1>
                <p className="text-sm md:text-base text-muted-foreground">{descripcion}</p>
                {aviso}
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
                    {def.advertencia && (
                        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                            <Info className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{def.advertencia}</span>
                        </div>
                    )}
                    <FiltrosPeriodo
                        tipo={def.filtro} filtro={filtro} onChange={f => { setFiltro(f); setAviso(null) }} cargando={cargando}
                        onBuscar={consultar}
                        extras={extras.length ? <FiltrosExtra extras={extras} filtro={filtro} onChange={setFiltro} onEnter={consultar} pedirProveedor={pedirProveedor} /> : undefined}
                        acciones={<>
                            <ExportarPdfInforme titulo={`${titulo} - ${def.titulo}`} subtitulo={[periodo, leyendaMoneda(def)].filter(Boolean).join(' · ')} {...exportar} />
                            <ExportarExcelInforme titulo={`${titulo} - ${def.titulo}`} subtitulo={periodo} {...exportar} />
                        </>}
                    />
                    <AvisoInforme texto={avisoCarga} onCerrar={() => setAviso(null)} />
                </CardHeader>

                <CardContent className="p-0">
                    {!actuales && !cargando && (
                        <div className="flex flex-col items-center gap-2 py-14 text-muted-foreground">
                            <FileSearch className="h-10 w-10 opacity-40" />
                            <p className="text-sm">{def.filtro === 'ninguno' ? 'Escribe una cuenta o deja vacío para ver todo, y'
                                : def.filtro === 'fecha' ? 'Elige la fecha de corte y' : 'Elige el periodo y'} pulsa <b>Consultar</b>.</p>
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
                                    <TablaInforme columnas={columnas} filas={actuales} moneda={def.moneda} onFila={onFila}
                                                  grupos={def.grupos} pie={pie} sinTotal={def.sinTotal} limite={def.limite} />
                                </div>}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
