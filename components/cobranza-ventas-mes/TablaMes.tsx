'use client'

import { Th } from '@/components/cobranza/vistaCobranza'
import { fecha, soles, type ComprobanteMes, type VistaMes } from '@/app/types/cobranza-ventas-mes'

type Props = {
    vista: VistaMes
    filas: ComprobanteMes[]
    orden: string
    direccion: 'asc' | 'desc'
    onOrdenar: (clave: string) => void
    onAbrir: (c: ComprobanteMes) => void
}

/** Situación de un comprobante con deuda: vencido N días, vence hoy o por vencer. */
export function Situacion({ c }: { c: ComprobanteMes }) {
    const [texto, color] = c.diasVencido > 30
        ? [`Vencido ${c.diasVencido} d`, 'bg-red-100 text-red-700']
        : c.diasVencido > 0
            ? [`Vencido ${c.diasVencido} d`, 'bg-amber-100 text-amber-800']
            : c.diasParaVencer === 0
                ? ['Vence hoy', 'bg-sky-100 text-sky-700']
                : [`Por vencer ${c.diasParaVencer ?? '—'} d`, 'bg-sky-50 text-sky-700']
    return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${color}`}>{texto}</span>
}

/** Cuánto tardó en pagarse un comprobante cobrado. */
export function Tardo({ c }: { c: ComprobanteMes }) {
    if (c.tardo == null) return <span className="text-xs text-muted-foreground">—</span>
    const texto = c.tardo === 0 ? 'Al momento' : `${c.tardo} días`
    return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${c.atrasoPago ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>{texto}</span>
}

function Cliente({ c }: { c: ComprobanteMes }) {
    return (
        <div className="min-w-0">
            <div className="line-clamp-2 font-medium leading-snug" title={c.cliente}>{c.nombreComercial || c.cliente}</div>
            <div className="text-[11px] text-muted-foreground">RUC {c.ruc}{c.zona ? ` · ${c.zona}` : ''}</div>
        </div>
    )
}

/** Lista de comprobantes del mes: tabla en pantallas grandes, tarjetas en el celular. */
export function TablaMes({ vista, filas, orden, direccion, onOrdenar, onAbrir }: Props) {
    const th = (titulo: string, clave?: string, derecha?: boolean) =>
        <Th titulo={titulo} clave={clave} orden={orden} direccion={direccion} onOrdenar={onOrdenar} derecha={derecha} />
    const deuda = vista === 'faltante'

    return (
        <>
            <div className="hidden overflow-x-auto lg:block">
                <table className="w-full table-fixed text-sm [&_td]:align-middle">
                    <colgroup>
                        <col className="w-36" /><col /><col className="w-32" /><col className="w-32" /><col className="w-28" />
                        {deuda ? <><col className="w-32" /><col className="w-28" /></> : <><col className="w-48" /><col className="w-28" /></>}
                    </colgroup>
                    <thead className="border-b bg-muted">
                        <tr>
                            {th('Comprobante', 'comprobante')}
                            {th('Cliente', 'cliente')}
                            {th('Vendedor', 'vendedor')}
                            {deuda ? th('Emisión / vence', 'vence') : th('Emisión / pago', 'pagado')}
                            {deuda ? th('Situación', 'atraso') : th('Tardó', 'tardo')}
                            {deuda
                                ? <>{th('Total / abonado', 'total', true)}{th('Saldo', 'saldo', true)}</>
                                : <>{th('Cómo se cobró')}{th('Importe', 'total', true)}</>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filas.map(c => (
                            <tr key={c.id} onClick={() => onAbrir(c)} className="cursor-pointer transition-colors hover:bg-muted/50">
                                <td className="px-3 py-2.5">
                                    <div className="font-mono text-[13px] font-semibold text-blue-700">{c.comprobante}</div>
                                    <div className="truncate text-[11px] text-muted-foreground">{c.tipo} · {c.contado ? 'Contado' : c.condicion}</div>
                                </td>
                                <td className="px-3 py-2.5"><Cliente c={c} /></td>
                                <td className="px-3 py-2.5 text-xs"><div className="line-clamp-2">{c.vendedor}</div></td>
                                <td className="px-3 py-2.5 tabular-nums">
                                    <div className="text-xs text-muted-foreground">{fecha(c.emision)}</div>
                                    <div>{fecha(deuda ? c.vencimiento : c.ultimoPago)}</div>
                                </td>
                                <td className="px-3 py-2.5">{deuda ? <Situacion c={c} /> : <Tardo c={c} />}</td>
                                {deuda ? (
                                    <>
                                        <td className="px-3 py-2.5 text-right tabular-nums">
                                            <div>{soles(c.total, c.moneda)}</div>
                                            {c.abonado > 0 && <div className="text-[11px] text-emerald-700">abonó {soles(c.abonado, c.moneda)}</div>}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-red-700">{soles(c.saldo, c.moneda)}</td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-3 py-2.5 text-xs text-muted-foreground"><div className="line-clamp-2" title={c.formaCobro ?? ''}>{c.formaCobro || 'Sin detalle del pago'}</div></td>
                                        <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-emerald-700">{soles(c.total, c.moneda)}</td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="divide-y divide-border lg:hidden">
                {filas.map(c => (
                    <button key={c.id} onClick={() => onAbrir(c)} className="block w-full px-4 py-3 text-left transition hover:bg-muted/50">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="font-mono text-[13px] font-semibold text-blue-700">{c.comprobante}</div>
                                <div className="text-sm font-medium leading-snug">{c.nombreComercial || c.cliente}</div>
                                <div className="text-[11px] text-muted-foreground">{c.vendedor}{c.zona ? ` · ${c.zona}` : ''}</div>
                            </div>
                            <div className="shrink-0 text-right">
                                <div className={`font-bold tabular-nums ${deuda ? 'text-red-700' : 'text-emerald-700'}`}>{soles(deuda ? c.saldo : c.total, c.moneda)}</div>
                                {deuda ? <Situacion c={c} /> : <Tardo c={c} />}
                            </div>
                        </div>
                        <div className="mt-1.5 flex flex-wrap justify-between gap-x-3 text-[11px] text-muted-foreground tabular-nums">
                            <span>Emitido {fecha(c.emision)} · {deuda ? `vence ${fecha(c.vencimiento)}` : `pagado ${fecha(c.ultimoPago)}`}</span>
                            {deuda && c.abonado > 0 && <span>Total {soles(c.total, c.moneda)} · abonó {soles(c.abonado, c.moneda)}</span>}
                        </div>
                    </button>
                ))}
            </div>
        </>
    )
}
