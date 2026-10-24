'use client'

import {
    ArrowUpRight, Calculator, FileDown, CalendarDays, Coins, FileText, ListTree, MessageCircle, Package, User, Wallet,
} from 'lucide-react'
import type { AccionIvan } from '../nucleo/tipos'
import { DependenciasAccion, ejecutarAccion } from './ejecutores'

const ICONOS: Record<string, typeof FileText> = {
    cuenta: Wallet, comprobantes: FileText, saldo: Coins, cliente: User, calendario: CalendarDays,
    producto: Package, cotizar: Calculator, detalle: ListTree, abrir: ArrowUpRight, pdf: FileDown,
}

/** Botones de siguientes pasos que propone IVAN al terminar una respuesta. */
export function BotonesAccion({ acciones, deshabilitado, deps }: {
    acciones: AccionIvan[]
    deshabilitado: boolean
    deps: DependenciasAccion
}) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {acciones.map((a, i) => {
                const Icono = ICONOS[a.icono || ''] || (a.tipo === 'abrir' ? ArrowUpRight : MessageCircle)
                const esAbrir = a.tipo !== 'preguntar'
                return (
                    <button
                        key={`${a.etiqueta}-${i}`}
                        type="button"
                        disabled={deshabilitado}
                        onClick={() => ejecutarAccion(a, deps)}
                        title={a.tipo === 'preguntar' ? a.texto : a.tipo === 'pdf' ? `PDF de ${a.numero}` : `Ir a ${a.etiqueta.replace(/^Abrir /, '')}`}
                        style={{ animationDelay: `${i * 70}ms` }}
                        className={`group inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition-all duration-200
                            animate-in fade-in slide-in-from-bottom-1 fill-mode-both hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:opacity-50
                            ${esAbrir
                                ? 'border-slate-200 bg-background text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:text-slate-200'
                                : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300'}`}
                    >
                        <Icono className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-110" />
                        <span className="truncate">{a.etiqueta}</span>
                    </button>
                )
            })}
        </div>
    )
}
