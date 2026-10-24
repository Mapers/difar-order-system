'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import type { ConsultaIvan, EstadoMensaje } from './nucleo/tipos'

/** Puntos que saltan mientras IVAN piensa, antes de consultar o escribir. */
export function PensandoIvan() {
    return (
        <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground animate-in fade-in duration-300">
            <span className="flex gap-1">
                {[0, 1, 2].map(i => (
                    <span key={i} className="ivan-punto h-1.5 w-1.5 rounded-full bg-indigo-500" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
            </span>
            Pensando…
        </div>
    )
}

/** Una consulta en curso: sus pasos avanzan uno a uno; al terminar queda como chip. */
function Consulta({ consulta }: { consulta: ConsultaIvan }) {
    const [paso, setPaso] = useState(0)
    const total = consulta.pasos.length

    useEffect(() => {
        if (consulta.terminada || total < 2) return
        const t = setInterval(() => setPaso(p => Math.min(p + 1, total - 1)), 1100)
        return () => clearInterval(t)
    }, [consulta.terminada, total])

    if (consulta.terminada) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 animate-in fade-in zoom-in-95 duration-300 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Check className="h-3 w-3" /> {consulta.etiqueta.replace(/\.\.\.$|…$/, '')}
            </span>
        )
    }

    return (
        <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-sky-50/60 p-3 animate-in fade-in slide-in-from-bottom-2 duration-300 dark:border-indigo-900/60 dark:from-indigo-950/40 dark:to-sky-950/20">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent ivan-barrido dark:via-white/10" />
            <p className="relative flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> {consulta.etiqueta}
            </p>
            {total > 0 && (
                <ol className="relative mt-2 space-y-1">
                    {consulta.pasos.map((p, i) => (
                        <li key={p} className={`flex items-center gap-2 text-[11px] transition-colors duration-300 ${i < paso ? 'text-emerald-700 dark:text-emerald-400' : i === paso ? 'font-medium text-foreground' : 'text-muted-foreground/60'}`}>
                            <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${i < paso ? 'border-emerald-500 bg-emerald-500 text-white' : i === paso ? 'border-indigo-500' : 'border-muted-foreground/30'}`}>
                                {i < paso ? <Check className="h-2.5 w-2.5" /> : i === paso ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" /> : null}
                            </span>
                            {p}
                        </li>
                    ))}
                </ol>
            )}
        </div>
    )
}

/** Lo que IVAN está haciendo en esta respuesta, en vivo. */
export function ActividadIvan({ consultas, estado }: { consultas?: ConsultaIvan[]; estado?: EstadoMensaje }) {
    if (!consultas?.length) return estado === 'pensando' ? <PensandoIvan /> : null
    const enCurso = consultas.filter(c => !c.terminada)
    const hechas = consultas.filter(c => c.terminada)
    return (
        <div className="space-y-2">
            {hechas.length > 0 && (
                <div className="flex flex-wrap gap-1.5">{hechas.map((c, i) => <Consulta key={`h${i}`} consulta={c} />)}</div>
            )}
            {enCurso.map((c, i) => <Consulta key={`c${i}`} consulta={c} />)}
            {estado === 'consultando' && enCurso.length === 0 && <PensandoIvan />}
        </div>
    )
}
