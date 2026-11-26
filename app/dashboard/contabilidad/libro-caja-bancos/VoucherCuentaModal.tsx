'use client'

import { useEffect, useMemo, useState } from "react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Landmark, Sparkles, FileText, ImageOff } from "lucide-react"
import { CajaCtaBanco, CajaPlanillaPendiente, CajaVoucherCuenta } from "@/app/types/contabilidad-types"

const money = (v: number | string) =>
    Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Clave de agrupación: el depósito es por número de operación (un voucher paga varias facturas). */
const claveOp = (r: CajaPlanillaPendiente) =>
    (r.numero_operacion && r.numero_operacion.trim()) || `det-${r.id_detalle}`

interface GrupoDep {
    clave:     string
    operacion: string | null
    planilla:  string
    banco:     string | null
    cobros:    CajaPlanillaPendiente[]
    total:     number
    rutas:     string[]
    sugerida:  number | null   // cuenta contable que leyó la IA
    esBanco:   boolean         // false = efectivo / sin depósito (no necesita cuenta)
}

interface Props {
    abierto:    boolean
    cobros:     CajaPlanillaPendiente[]
    ctasBanco:  CajaCtaBanco[]
    lecturas:   Record<number, CajaVoucherCuenta>
    cargando:   boolean
    baseUrl:    string
    onCancel:   () => void
    onConfirm:  (ctaPorDetalle: Record<number, number | null>) => void
}

export function VoucherCuentaModal({ abierto, cobros, ctasBanco, lecturas, cargando, baseUrl, onCancel, onConfirm }: Props) {
    const grupos = useMemo<GrupoDep[]>(() => {
        const mapa = new Map<string, GrupoDep>()
        for (const r of cobros) {
            const clave = claveOp(r)
            if (!mapa.has(clave)) {
                mapa.set(clave, {
                    clave, operacion: r.numero_operacion || null, planilla: r.numero_planilla,
                    banco: r.desc_banco || null, cobros: [], total: 0, rutas: [],
                    sugerida: null, esBanco: !!(r.cod_banco && String(r.cod_banco).trim()),
                })
            }
            const g = mapa.get(clave)!
            g.cobros.push(r)
            g.total += Number(r.importe_cobrado)
            const lec = lecturas[r.id_detalle]
            if (lec) {
                for (const ru of (lec.rutas || [])) if (!g.rutas.includes(ru)) g.rutas.push(ru)
                if (g.sugerida == null && lec.cuenta_banco?.id_cta_banco) g.sugerida = lec.cuenta_banco.id_cta_banco
            }
        }
        return [...mapa.values()]
    }, [cobros, lecturas])

    // Cuenta elegida por grupo (arranca con la sugerida por la IA).
    const [sel, setSel] = useState<Record<string, string>>({})
    useEffect(() => {
        if (!abierto) return
        setSel(prev => {
            const sig: Record<string, string> = {}
            for (const g of grupos) sig[g.clave] = prev[g.clave] ?? (g.sugerida != null ? String(g.sugerida) : '')
            return sig
        })
    }, [abierto, grupos])

    const total = cobros.reduce((s, r) => s + Number(r.importe_cobrado), 0)
    const gruposBanco = grupos.filter(g => g.esBanco)
    const faltan = gruposBanco.filter(g => !sel[g.clave]).length

    const confirmar = () => {
        const map: Record<number, number | null> = {}
        for (const g of grupos) {
            const cta = g.esBanco && sel[g.clave] ? Number(sel[g.clave]) : null
            for (const r of g.cobros) map[r.id_detalle] = cta
        }
        onConfirm(map)
    }

    return (
        <Dialog open={abierto} onOpenChange={v => { if (!v) onCancel() }}>
            <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col gap-0 p-0 overflow-hidden">
                <DialogHeader className="border-b px-5 py-4 text-left">
                    <DialogTitle className="flex items-center gap-2">
                        <Landmark className="h-5 w-5 text-blue-600" /> Depósito al banco por voucher
                    </DialogTitle>
                    <DialogDescription>
                        Confirma a qué cuenta de banco se depositó cada voucher. Al aceptar se genera la
                        línea del voucher de caja (DEP. PLAN) con esa cuenta. La IA la lee del voucher; puedes corregirla.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {cargando && (
                        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" /> Leyendo los vouchers con IA...
                        </div>
                    )}

                    {!cargando && grupos.map(g => (
                        <div key={g.clave} className="rounded-xl border bg-muted/30 p-3.5">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="font-mono text-sm font-bold">{g.planilla}</span>
                                {g.operacion
                                    ? <span className="rounded bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground border">Op. {g.operacion}</span>
                                    : <span className="rounded bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground border">Sin operación</span>}
                                {g.banco && <span className="text-[11px] text-muted-foreground">{g.banco}</span>}
                                <span className="ml-auto font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">S/ {money(g.total)}</span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {g.cobros.length} cobro{g.cobros.length !== 1 ? 's' : ''} con este voucher
                            </p>

                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[120px_1fr]">
                                {/* Foto del voucher */}
                                <div className="flex gap-2">
                                    {g.rutas.length === 0 ? (
                                        <div className="flex h-24 w-full items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                                            <ImageOff className="h-5 w-5" />
                                        </div>
                                    ) : g.rutas.slice(0, 2).map((ru, i) => (
                                        ru.toLowerCase().endsWith('.pdf') ? (
                                            <a key={i} href={`${baseUrl}${ru}`} target="_blank" rel="noopener noreferrer"
                                               className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border bg-background text-[10px] text-muted-foreground hover:bg-muted">
                                                <FileText className="h-6 w-6" /> PDF
                                            </a>
                                        ) : (
                                            <a key={i} href={`${baseUrl}${ru}`} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={`${baseUrl}${ru}`} alt="voucher"
                                                     className="h-24 w-24 rounded-lg border object-cover hover:opacity-90" />
                                            </a>
                                        )
                                    ))}
                                </div>

                                {/* Cuenta de banco */}
                                <div className="flex flex-col gap-1">
                                    {!g.esBanco ? (
                                        <p className="text-xs text-muted-foreground">Efectivo / sin depósito a banco — no genera línea de voucher.</p>
                                    ) : (
                                        <>
                                            <label className="text-[11px] font-semibold text-muted-foreground">Cuenta a la que se depositó</label>
                                            <select
                                                className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                                                value={sel[g.clave] ?? ''}
                                                onChange={e => setSel(s => ({ ...s, [g.clave]: e.target.value }))}
                                            >
                                                <option value="">Sin cuenta (no genera voucher)</option>
                                                {ctasBanco.map(c => (
                                                    <option key={c.CtaContable} value={String(c.CtaContable)}>
                                                        {c.Descripcion_Cta} · {c.Nro_Cta}
                                                    </option>
                                                ))}
                                            </select>
                                            {g.sugerida != null && String(g.sugerida) === sel[g.clave] && (
                                                <p className="flex items-center gap-1 text-[11px] text-blue-600">
                                                    <Sparkles className="h-3 w-3" /> Sugerida por la IA desde el voucher
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {!cargando && faltan > 0 && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-300">
                            {faltan} voucher{faltan !== 1 ? 's' : ''} sin cuenta: esos cobros se aceptarán igual, pero
                            no se generará su línea de depósito en el voucher de caja (se puede agregar luego).
                        </p>
                    )}
                </div>

                <DialogFooter className="border-t px-5 py-3">
                    <div className="mr-auto text-xs text-muted-foreground">
                        {cobros.length} cobro{cobros.length !== 1 ? 's' : ''} · <b>S/ {money(total)}</b>
                    </div>
                    <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={cargando} onClick={confirmar}>
                        Aceptar en el libro
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
