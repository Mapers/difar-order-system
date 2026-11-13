'use client'

import React, { useMemo } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { ColumnaInforme, FilaInforme } from '@/app/types/informes-contables-types'
import { esNumerica, formatear, formatearCelda, textoTotal, totales, valorDe } from './formato'

interface Props {
    columnas: ColumnaInforme[]
    filas: FilaInforme[]
    /** Selección de documentos (anexos SIRE 12 y 8). */
    campoId?: string
    seleccion?: Set<number>
    /** Setter de React: recibe una función para partir siempre de la selección más reciente. */
    onSeleccion?: React.Dispatch<React.SetStateAction<Set<number>>>
    /** Máximo de filas que se pintan (el Excel lleva todas). */
    limite?: number
    /** Moneda de los importes del reporte ('S/' o 'US$'). */
    moneda?: string
}

/**
 * Tabla genérica dirigida por las definiciones de columnas:
 * tabla con pie de totales en escritorio y tarjetas en el celular.
 */
export function TablaInforme({ columnas, filas, campoId, seleccion, onSeleccion, limite = 500, moneda = 'S/' }: Props) {
    const t = useMemo(() => totales(columnas, filas), [columnas, filas])
    const visibles = filas.slice(0, limite)
    const seleccionable = !!(campoId && seleccion && onSeleccion)
    const todas = seleccionable && filas.length > 0 && filas.every(f => seleccion!.has(Number(f[campoId!])))

    const alternar = (id: number) => {
        if (!onSeleccion) return
        onSeleccion(prev => {
            const n = new Set(prev)
            n.has(id) ? n.delete(id) : n.add(id)
            return n
        })
    }
    const alternarTodas = () => onSeleccion?.(todas ? new Set() : new Set(filas.map(f => Number(f[campoId!]))))

    const titulo = columnas.find(x => x.movil === 'titulo')
    const subtitulo = columnas.find(x => x.movil === 'subtitulo')
    const importe = columnas.find(x => x.movil === 'importe')
    const resto = columnas.filter(x => !x.movil).slice(0, 6)
    const primeraTotal = columnas.findIndex(x => x.total)

    return (
        <>
            {/* Escritorio */}
            <div className="hidden md:block overflow-x-auto max-h-[62vh]">
                <table className="w-full text-[11px] 2xl:text-xs text-left text-muted-foreground">
                    <thead className="sticky top-0 z-10 bg-background text-[10px] uppercase border-b border-border shadow-sm">
                    <tr>
                        {seleccionable && <th className="px-3 py-2 w-8"><Checkbox checked={todas} onCheckedChange={alternarTodas} aria-label="Elegir todos" /></th>}
                        {columnas.map(col => (
                            <th key={col.campo} className={cn('px-2.5 py-2 font-bold whitespace-nowrap', esNumerica(col.tipo) && 'text-right')}>{col.titulo}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                    {visibles.map((f, i) => {
                        const id = campoId ? Number(f[campoId]) : i
                        const marcada = seleccionable && seleccion!.has(id)
                        return (
                            <tr key={`${id}-${i}`} className={cn('hover:bg-muted transition-colors', marcada && 'bg-blue-50 dark:bg-blue-950/40',
                                Number(f[importe?.campo ?? '']) < 0 && 'text-red-600')}>
                                {seleccionable && <td className="px-3 py-1.5"><Checkbox checked={marcada} onCheckedChange={() => alternar(id)} aria-label="Elegir documento" /></td>}
                                {columnas.map(col => (
                                    <td key={col.campo} className={cn('px-2.5 py-1.5 whitespace-nowrap',
                                        esNumerica(col.tipo) && 'text-right tabular-nums',
                                        col.tipo === 'mono' && 'font-mono text-foreground',
                                        col.movil === 'subtitulo' && 'min-w-[140px] max-w-[230px] whitespace-normal leading-tight',
                                        col.movil === 'importe' && 'font-bold text-foreground',
                                        col.alerta?.(f) && 'bg-red-50 font-bold text-red-600 dark:bg-red-950/40')}>
                                        {formatearCelda(col, f, moneda)}
                                    </td>
                                ))}
                            </tr>
                        )
                    })}
                    </tbody>
                    {primeraTotal >= 0 && (
                        <tfoot className="sticky bottom-0 bg-muted">
                        <tr className="font-bold text-foreground">
                            {seleccionable && <td />}
                            {columnas.map((col, i) => (
                                <td key={col.campo} className={cn('px-3 py-2 whitespace-nowrap', esNumerica(col.tipo) && 'text-right tabular-nums')}>
                                    {i === 0 ? `TOTAL (${filas.length})` : col.total ? (col.tipo === 'monto' ? textoTotal(col, filas, moneda) : t[col.campo].toLocaleString('en-US')) : ''}
                                </td>
                            ))}
                        </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            {/* Celular */}
            <div className="grid grid-cols-1 gap-2 p-2.5 md:hidden">
                {visibles.slice(0, 100).map((f, i) => {
                    const id = campoId ? Number(f[campoId]) : i
                    const marcada = seleccionable && seleccion!.has(id)
                    return (
                        <div key={`${id}-${i}`} onClick={() => seleccionable && alternar(id)}
                             className={cn('rounded-lg border p-3 flex flex-col gap-2', marcada ? 'border-blue-300 bg-blue-50 dark:bg-blue-950/40' : 'border-border bg-muted/30')}>
                            <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0 flex items-start gap-2">
                                    {seleccionable && <Checkbox checked={marcada} className="mt-0.5" />}
                                    <div className="min-w-0">
                                        {titulo && <p className="font-mono font-bold text-sm text-foreground">{formatear(titulo.tipo, valorDe(titulo, f))}</p>}
                                        {subtitulo && <p className="text-xs text-muted-foreground truncate">{formatear(subtitulo.tipo, valorDe(subtitulo, f))}</p>}
                                    </div>
                                </div>
                                {importe && <span className={cn('text-sm font-bold whitespace-nowrap', importe.alerta?.(f) ? 'text-red-600' : 'text-blue-700 dark:text-blue-400')}>
                                    {formatearCelda(importe, f, moneda)}</span>}
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-[11px]">
                                {resto.map(col => (
                                    <div key={col.campo} className="min-w-0">
                                        <span className="text-muted-foreground">{col.titulo}</span>
                                        <p className="font-medium text-foreground truncate">{formatearCelda(col, f, moneda)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
                {importe?.total && (
                    <div className="flex justify-between rounded-lg bg-blue-50 p-3 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        <span>Total ({filas.length})</span><span>{textoTotal(importe, filas, moneda)}</span>
                    </div>
                )}
            </div>

            {filas.length > limite && (
                <p className="px-4 py-2 text-xs text-muted-foreground border-t">
                    Se muestran {limite} de {filas.length} filas. El Excel incluye todas.
                </p>
            )}
        </>
    )
}
