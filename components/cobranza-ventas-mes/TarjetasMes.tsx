'use client'

import { AlertTriangle, CheckCircle2, Clock3, TrendingUp } from 'lucide-react'
import { montos, porcentaje, soles, type ResumenMes, type VistaMes } from '@/app/types/cobranza-ventas-mes'

type Props = {
    resumen: ResumenMes | null
    nombreMes: string
    vista: VistaMes
    onVista: (v: VistaMes) => void
}

const Esqueleto = () => <div className="mt-2 h-8 w-40 animate-pulse rounded bg-muted" />

/** Las tres cifras del mes y la barra de avance. Cobrado y Faltante abren su lista. */
export function TarjetasMes({ resumen: r, nombreMes, vista, onVista }: Props) {
    const total = r?.ventas.montos.PEN ?? 0
    const vencido = r?.faltante.vencido.montos.PEN ?? 0
    const porVencer = r?.faltante.porVencer.montos.PEN ?? 0
    const cobrado = r?.cobrado.montos.PEN ?? 0
    const base = cobrado + vencido + porVencer || 1

    const tarjeta = (activa: boolean, anillo: string) =>
        `group relative flex-1 rounded-2xl border bg-card p-4 text-left shadow-sm transition sm:p-5 ${
            activa ? `border-transparent ring-2 ${anillo}` : 'border-border hover:border-foreground/20 hover:shadow'
        }`

    return (
        <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
                <div className={tarjeta(false, '')}>
                    <div className="flex items-start justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ventas {nombreMes}</span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700"><TrendingUp className="h-4 w-4" /></span>
                    </div>
                    {r ? <div className="mt-1 text-2xl font-bold tabular-nums sm:text-3xl">{montos(r.ventas.montos)}</div> : <Esqueleto />}
                    <div className="mt-1 text-sm text-muted-foreground">{r ? `${r.ventas.cantidad} comprobantes emitidos` : ' '}</div>
                    <div className="mt-2 text-xs text-muted-foreground">Facturas y boletas, sin anulados</div>
                    {r && r.diferenciaKardex.cantidad > 0 && (
                        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800" title="Comprobantes por los que la cuenta corriente registra un importe mayor al facturado.">
                            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                            <span>La cuenta corriente registra {soles(r.diferenciaKardex.monto)} más en {r.diferenciaKardex.cantidad} comprobantes.</span>
                        </div>
                    )}
                </div>

                <button onClick={() => onVista('cobrado')} className={tarjeta(vista === 'cobrado', 'ring-emerald-500')}>
                    <div className="flex items-start justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cobrado</span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-4 w-4" /></span>
                    </div>
                    {r ? <div className="mt-1 text-2xl font-bold tabular-nums text-emerald-700 sm:text-3xl">{montos(r.cobrado.montos)}</div> : <Esqueleto />}
                    <div className="mt-1 text-sm text-muted-foreground">
                        {r ? <><b className="text-emerald-700">{porcentaje(cobrado, total)}</b> · {r.cobrado.pagados} comprobantes pagados</> : ' '}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">{r?.cobrado.parciales ? `Incluye abonos parciales de ${r.cobrado.parciales} comprobantes` : 'Pagos registrados hasta hoy'}</div>
                    <div className="mt-2 text-xs font-medium text-emerald-700">{vista === 'cobrado' ? '▼ Mostrando el detalle' : 'Ver comprobantes →'}</div>
                </button>

                <button onClick={() => onVista('faltante')} className={tarjeta(vista === 'faltante', 'ring-red-500')}>
                    <div className="flex items-start justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Faltante</span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-700"><Clock3 className="h-4 w-4" /></span>
                    </div>
                    {r ? <div className="mt-1 text-2xl font-bold tabular-nums text-red-700 sm:text-3xl">{montos(r.faltante.montos)}</div> : <Esqueleto />}
                    <div className="mt-1 text-sm text-muted-foreground">
                        {r ? <><b className="text-red-700">{porcentaje(vencido + porVencer, total)}</b> · {r.faltante.cantidad} comprobantes con deuda</> : ' '}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-red-700">{soles(vencido)} vencido</span> · {soles(porVencer)} por vencer
                    </div>
                    <div className="mt-2 text-xs font-medium text-red-700">{vista === 'faltante' ? '▼ Mostrando el detalle' : 'Ver comprobantes →'}</div>
                </button>
            </div>

            <div className="overflow-hidden rounded-full bg-muted" title={`Cobrado ${porcentaje(cobrado, base)} · Vencido ${porcentaje(vencido, base)} · Por vencer ${porcentaje(porVencer, base)}`}>
                <div className="flex h-2.5">
                    <div className="bg-emerald-500 transition-all" style={{ width: `${(cobrado / base) * 100}%` }} />
                    <div className="bg-red-500 transition-all" style={{ width: `${(vencido / base) * 100}%` }} />
                    <div className="bg-amber-400 transition-all" style={{ width: `${(porVencer / base) * 100}%` }} />
                </div>
            </div>
            <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-500" /> Cobrado</span>
                <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-red-500" /> Vencido</span>
                <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-amber-400" /> Por vencer</span>
            </div>
        </div>
    )
}
