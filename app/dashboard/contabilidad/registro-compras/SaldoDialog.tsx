'use client'

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, AlertCircle, Wallet, Inbox, ArrowDownCircle, ArrowUpCircle, CheckCircle2, Clock, type LucideIcon } from "lucide-react"
import { ComprasService } from "@/app/services/contabilidad/ContabilidadService"
import type { ComprasSaldoFila } from "@/app/types/contabilidad-types"

const money = (v: unknown) =>
    Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fecha = (v: unknown) => {
    if (!v) return '—'
    const d = new Date(String(v))
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-PE', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function SaldoDialog({
    abierto, onCerrar, clave, titulo,
}: { abierto: boolean; onCerrar: () => void; clave: number | null; titulo: string }) {
    const [filas, setFilas]       = useState<ComprasSaldoFila[]>([])
    const [cargando, setCargando] = useState(false)
    const [error, setError]       = useState<string | null>(null)

    useEffect(() => {
        if (!abierto || !clave) return
        let vivo = true
        setCargando(true); setError(null)
        ComprasService.saldoComprobante(clave)
            .then(r => { if (vivo) setFilas(r) })
            .catch(e => { if (vivo) setError(e?.response?.data?.message || "No se pudo obtener el saldo.") })
            .finally(() => { if (vivo) setCargando(false) })
        return () => { vivo = false }
    }, [abierto, clave])

    const totSoles   = filas.reduce((a, f) => a + Number(f.SaldoSoles   ?? 0), 0)
    const totDolares = filas.reduce((a, f) => a + Number(f.SaldoDolares ?? 0), 0)
    const totProv    = filas.reduce((a, f) => a + Number(f.Provision    ?? 0), 0)
    const totAmort   = filas.reduce((a, f) => a + Number(f.Amortizacion ?? 0), 0)
    const cab = filas[0]
    const cancelado = filas.length > 0 && Math.abs(totSoles) < 0.005 && Math.abs(totDolares) < 0.005
    const concepto = (f: ComprasSaldoFila) => String(f.Descripcion2 ?? f.TipoAmortizacion ?? '').trim() || '—'

    return (
        <Dialog open={abierto} onOpenChange={(v) => { if (!v) onCerrar() }}>
            <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="shrink-0 border-b px-5 pb-4 pt-5 text-left sm:px-6">
                    <div className="flex items-center gap-3 pr-6">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-blue-600/30">
                            <Wallet className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <DialogTitle className="leading-snug sm:truncate">Saldo del comprobante <span className="font-mono">{titulo}</span></DialogTitle>
                            <DialogDescription className="text-xs sm:truncate">
                                {cab
                                    ? `${cab.Nombre ?? cab.Cod_Prov} · movimientos del kardex de proveedores`
                                    : 'Movimientos del kardex de proveedores de este documento.'}
                            </DialogDescription>
                        </div>
                        {filas.length > 0 && !cargando && (
                            <span className={`hidden shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-flex ${
                                cancelado
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                                {cancelado ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                                {cancelado ? 'Cancelado' : 'Pendiente de pago'}
                            </span>
                        )}
                    </div>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-auto px-3 py-4 sm:px-6">
                    {cargando ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" /> Cargando…
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-10 text-center text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                            <AlertCircle className="h-6 w-6" /> {error}
                        </div>
                    ) : filas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                                <Inbox className="h-6 w-6 opacity-60" />
                            </span>
                            Este documento no tiene movimientos en el kardex de proveedores.
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                                <Cifra etiqueta="Provisión" valor={totProv} icono={ArrowUpCircle} iconoCls="bg-blue-50 text-blue-600 dark:bg-blue-950" />
                                <Cifra etiqueta="Amortizado" valor={totAmort} icono={ArrowDownCircle} iconoCls="bg-violet-50 text-violet-600 dark:bg-violet-950" />
                                <div className={`col-span-2 rounded-xl p-3.5 text-white shadow-sm ${
                                    cancelado ? 'bg-gradient-to-br from-emerald-700 to-emerald-500' : 'bg-gradient-to-br from-amber-600 to-amber-500'
                                }`}>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">Saldo</p>
                                        {cancelado ? <CheckCircle2 className="h-5 w-5 text-white/90" /> : <Clock className="h-5 w-5 text-white/90" />}
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                                        <p className="font-mono text-lg font-bold tabular-nums">S/ {money(totSoles)}</p>
                                        <p className="font-mono text-sm font-semibold tabular-nums text-white/85">US$ {money(totDolares)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Escritorio: tabla */}
                            <div className="hidden overflow-hidden rounded-xl border sm:block">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-gradient-to-b from-muted/60 to-muted text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                                            <th className="px-3 py-2.5 font-semibold">Fecha</th>
                                            <th className="px-3 py-2.5 font-semibold">Concepto</th>
                                            <th className="px-3 py-2.5 text-right font-semibold">Provisión</th>
                                            <th className="px-3 py-2.5 text-right font-semibold">Amortización</th>
                                            <th className="px-3 py-2.5 text-right font-semibold">Saldo S/</th>
                                            <th className="px-3 py-2.5 text-right font-semibold">Saldo US$</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filas.map((f, i) => (
                                            <tr key={i} className="border-t transition-colors first:border-t-0 hover:bg-muted/40">
                                                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{fecha(f.FechaAmortizacion)}</td>
                                                <td className="px-3 py-2.5">
                                                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                        {concepto(f)}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">{money(f.Provision)}</td>
                                                <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">{money(f.Amortizacion)}</td>
                                                <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums">{money(f.SaldoSoles)}</td>
                                                <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-muted-foreground">{money(f.SaldoDolares)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 bg-muted/50 font-semibold">
                                            <td className="px-3 py-2.5" colSpan={2}>Total</td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">{money(totProv)}</td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">{money(totAmort)}</td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-blue-700 dark:text-blue-400">{money(totSoles)}</td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">{money(totDolares)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Celular: tarjetas */}
                            <div className="space-y-2 sm:hidden">
                                {filas.map((f, i) => (
                                    <div key={i} className="rounded-xl border bg-background p-3 shadow-sm">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                {concepto(f)}
                                            </span>
                                            <span className="text-xs tabular-nums text-muted-foreground">{fecha(f.FechaAmortizacion)}</span>
                                        </div>
                                        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                                            <span className="text-muted-foreground">Provisión</span>
                                            <span className="text-right tabular-nums">{money(f.Provision)}</span>
                                            <span className="text-muted-foreground">Amortización</span>
                                            <span className="text-right tabular-nums">{money(f.Amortizacion)}</span>
                                            <span className="text-muted-foreground">Saldo S/</span>
                                            <span className="text-right font-semibold tabular-nums">{money(f.SaldoSoles)}</span>
                                            <span className="text-muted-foreground">Saldo US$</span>
                                            <span className="text-right tabular-nums">{money(f.SaldoDolares)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex shrink-0 items-center justify-between gap-2 border-t bg-muted/30 px-5 py-3 text-xs text-muted-foreground sm:px-6">
                    <span>
                        {filas.length > 0 && (
                            <span className="rounded-full border bg-background px-2.5 py-1 font-medium text-foreground">
                                {filas.length} movimiento{filas.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </span>
                    <Button variant="outline" size="sm" onClick={onCerrar}>Cerrar</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function Cifra({ etiqueta, valor, icono: Icono, iconoCls }: {
    etiqueta: string; valor: number; icono: LucideIcon; iconoCls: string
}) {
    return (
        <div className="rounded-xl border bg-background p-3.5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{etiqueta}</p>
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconoCls}`}>
                    <Icono className="h-4 w-4" />
                </span>
            </div>
            <p className="mt-1 font-mono text-base font-bold tabular-nums">{money(valor)}</p>
        </div>
    )
}
