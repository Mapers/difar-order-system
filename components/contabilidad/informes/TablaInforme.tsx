'use client'

import React, { useMemo } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { ColumnaInforme, FilaInforme, FilaPie, GrupoInforme, ValoresFila } from '@/app/types/informes-contables-types'
import { armarRenglones, celdasEtiqueta, esNumerica, formatear, formatearCelda, textoTotal, textoValor, totales, valorDe } from './formato'

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
    /** Clic en una fila (por ejemplo, abrir la ficha de la cuenta). */
    onFila?: (fila: FilaInforme) => void
    /** Cortes de grupo (encabezado y subtotal), como los reportes de Access. */
    grupos?: GrupoInforme[]
    /** Filas del pie después del TOTAL. */
    pie?: FilaPie[]
    /** Sin fila TOTAL. */
    sinTotal?: boolean
}

/** Sangría del texto de un grupo según su nivel. */
const SANGRIA = ['pl-2.5', 'pl-5', 'pl-8', 'pl-11']

/**
 * Tabla genérica dirigida por las definiciones de columnas:
 * tabla con pie de totales en escritorio y tarjetas en el celular.
 * Si el reporte tiene grupos, intercala encabezados y subtotales (como Access).
 */
export function TablaInforme({ columnas, filas, campoId, seleccion, onSeleccion, limite = 500, moneda = 'S/', onFila, grupos, pie = [], sinTotal }: Props) {
    const t = useMemo(() => totales(columnas, filas), [columnas, filas])
    const visibles = useMemo(() => filas.slice(0, limite), [filas, limite])
    const renglones = useMemo(() => armarRenglones(columnas, visibles, grupos), [columnas, visibles, grupos])
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
    const conTotal = !sinTotal && columnas.some(x => x.total)
    const extra = seleccionable ? 1 : 0

    /** Fila de subtotal o de pie: el texto ocupa las columnas sin valor; los importes, su columna. */
    const filaEtiqueta = (texto: string, valores: ValoresFila | undefined, className: string, key: string, sangria = '') => {
        const { span, resto: cols } = celdasEtiqueta(columnas, valores)
        return (
            <tr key={key} className={className}>
                <td colSpan={span + extra} className={cn('px-2.5 py-1.5 whitespace-nowrap', sangria)}>{texto}</td>
                {cols.map(col => (
                    <td key={col.campo} className={cn('px-2.5 py-1.5 whitespace-nowrap', esNumerica(col.tipo) && 'text-right tabular-nums')}>
                        {textoValor(col, valores, moneda)}
                    </td>
                ))}
            </tr>
        )
    }

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
                    {renglones.map((r, k) => {
                        if (r.tipo === 'grupo') {
                            return r.valores
                                ? filaEtiqueta(r.texto, r.valores, 'bg-blue-50/70 font-semibold text-foreground dark:bg-blue-950/30', `g${k}`, SANGRIA[r.nivel])
                                : (
                                    <tr key={`g${k}`} className="bg-blue-50/70 dark:bg-blue-950/30">
                                        <td colSpan={columnas.length + extra} className={cn('px-2.5 py-1.5 font-semibold text-foreground', SANGRIA[r.nivel])}>{r.texto}</td>
                                    </tr>
                                )
                        }
                        if (r.tipo === 'subtotal') {
                            return filaEtiqueta(r.texto, r.valores, 'bg-muted/60 font-semibold text-foreground', `s${k}`, SANGRIA[r.nivel])
                        }
                        const f = r.fila
                        const id = campoId ? Number(f[campoId]) : r.indice
                        const marcada = seleccionable && seleccion!.has(id)
                        return (
                            <tr key={`${id}-${r.indice}`} onClick={onFila ? () => onFila(f) : undefined} className={cn('hover:bg-muted transition-colors', onFila && 'cursor-pointer', marcada && 'bg-blue-50 dark:bg-blue-950/40',
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
                    {(conTotal || pie.length > 0) && (
                        <tfoot className="sticky bottom-0 bg-muted">
                        {conTotal && (
                            <tr className="font-bold text-foreground">
                                {seleccionable && <td />}
                                {columnas.map((col, i) => (
                                    <td key={col.campo} className={cn('px-3 py-2 whitespace-nowrap', esNumerica(col.tipo) && 'text-right tabular-nums')}>
                                        {i === 0 ? `TOTAL (${filas.length})` : col.total ? (col.tipo === 'monto' ? textoTotal(col, filas, moneda) : t[col.campo].toLocaleString('en-US')) : ''}
                                    </td>
                                ))}
                            </tr>
                        )}
                        {pie.map((p, i) => filaEtiqueta(p.texto, p.valores,
                            cn('font-bold', p.destacada ? 'text-blue-700 dark:text-blue-300 border-t border-blue-300' : 'text-foreground'), `p${i}`))}
                        </tfoot>
                    )}
                </table>
            </div>

            {/* Celular */}
            <div className="grid grid-cols-1 gap-2 p-2.5 md:hidden">
                {renglones.slice(0, 160).map((r, k) => {
                    if (r.tipo === 'grupo') {
                        return <p key={`g${k}`} className={cn('px-1 pt-2 text-xs font-bold text-foreground', r.nivel > 0 && 'text-muted-foreground')}>{r.texto}</p>
                    }
                    if (r.tipo === 'subtotal') {
                        const col = importe && r.valores[importe.campo] !== undefined ? importe : columnas.find(c => r.valores[c.campo] !== undefined && r.valores[c.campo] !== null)
                        return (
                            <div key={`s${k}`} className="flex justify-between gap-2 rounded-md bg-muted px-3 py-1.5 text-xs font-semibold text-foreground">
                                <span className="truncate">{r.texto}</span>{col && <span className="whitespace-nowrap">{textoValor(col, r.valores, moneda)}</span>}
                            </div>
                        )
                    }
                    const f = r.fila
                    const id = campoId ? Number(f[campoId]) : r.indice
                    const marcada = seleccionable && seleccion!.has(id)
                    return (
                        <div key={`${id}-${r.indice}`} onClick={() => { if (seleccionable) alternar(id); else onFila?.(f) }}
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
                {conTotal && importe?.total && (
                    <div className="flex justify-between rounded-lg bg-blue-50 p-3 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        <span>Total ({filas.length})</span><span>{textoTotal(importe, filas, moneda)}</span>
                    </div>
                )}
                {pie.map((p, i) => (
                    <div key={`p${i}`} className={cn('rounded-lg p-3 text-xs font-bold flex flex-col gap-1',
                        p.destacada ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-muted text-foreground')}>
                        <span>{p.texto}</span>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-medium">
                            {columnas.filter(c => p.valores[c.campo] !== undefined && p.valores[c.campo] !== null).map(c => (
                                <span key={c.campo} className="flex justify-between gap-2"><span className="text-muted-foreground">{c.titulo}</span>{textoValor(c, p.valores, moneda)}</span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {filas.length > limite && (
                <p className="px-4 py-2 text-xs text-muted-foreground border-t">
                    Se muestran {limite.toLocaleString('en-US')} de {filas.length.toLocaleString('en-US')} filas. El Excel incluye todas.
                </p>
            )}
        </>
    )
}
