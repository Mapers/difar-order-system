'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

const PASOS = [
    'Leyendo las ventas del mes',
    'Cruzando los saldos de la cuenta corriente',
    'Revisando pagos y amortizaciones',
    'Calculando cobrado y faltante',
]
// Momento (en segundos) en que suele empezar cada paso: es una guía visual,
// la consulta es una sola y termina cuando termina.
const INICIO = [0, 2, 5, 9]

/** Loader de la primera carga de un mes: pasos, barra de avance y tiempo. */
export function CargandoMes({ mes }: { mes: string }) {
    const [segundos, setSegundos] = useState(0)
    useEffect(() => {
        const inicio = Date.now()
        const t = setInterval(() => setSegundos((Date.now() - inicio) / 1000), 200)
        return () => clearInterval(t)
    }, [])

    const actual = INICIO.filter(s => segundos >= s).length - 1
    // Avanza rápido al principio y se frena cerca del final, sin llegar al 100%.
    const avance = Math.min(95, 100 * (1 - Math.exp(-segundos / 6)))

    return (
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8" role="status" aria-live="polite">
            <div className="mx-auto max-w-md">
                <div className="flex items-center gap-3">
                    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </span>
                    <div>
                        <div className="font-semibold">Preparando la cobranza de {mes}</div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                            {segundos < 8 ? 'Esto toma unos segundos la primera vez.' : `Sigue trabajando… ${Math.floor(segundos)} s`}
                        </div>
                    </div>
                </div>
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 transition-[width] duration-200" style={{ width: `${avance}%` }} />
                </div>
                <ol className="mt-5 space-y-2.5">
                    {PASOS.map((paso, i) => {
                        const hecho = i < actual
                        const enCurso = i === actual
                        return (
                            <li key={paso} className={`flex items-center gap-2.5 text-sm transition ${hecho || enCurso ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                    hecho ? 'border-emerald-500 bg-emerald-500 text-white' : enCurso ? 'border-indigo-500' : 'border-border'
                                }`}>
                                    {hecho ? <Check className="h-3 w-3" /> : enCurso ? <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" /> : null}
                                </span>
                                {paso}
                            </li>
                        )
                    })}
                </ol>
            </div>
        </div>
    )
}

/** Barra fina animada para recargas (cambio de filtro o de mes con datos a la vista). */
export function BarraCarga({ activa }: { activa: boolean }) {
    return (
        <div className={`h-0.5 overflow-hidden rounded-full transition-opacity ${activa ? 'opacity-100' : 'opacity-0'}`} aria-hidden>
            <div className="h-full w-1/3 animate-[ivan-barrido_1.1s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-indigo-500 to-sky-400" />
        </div>
    )
}
