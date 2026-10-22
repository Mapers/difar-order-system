'use client'

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ComboSelect } from "@/components/ui/combo-select"
import {
    Loader2, Search, BookOpen, AlertCircle, BarChart3, CalendarDays, Coins, ChevronLeft, ChevronRight,
    Clock, ArrowUpRight, ArrowDownRight, Scale, type LucideIcon,
} from "lucide-react"
import { toast } from "@/app/hooks/useToast"
import { ContabilidadService } from "@/app/services/contabilidad/ContabilidadService"
import {
    MESES_CONTABLES,
    SubcuentaContable,
    SubctaMvtoDetalle,
    SubctaMvtoParams,
    SubctaMvtoReporte,
} from "@/app/types/contabilidad-types"
import ExportSubctaMvtoPdf from "@/app/dashboard/contabilidad/movimiento-subcuenta/export-pdf-button"

const ANIOS = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i))

const money = (v: number | string | null | undefined) =>
    Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fechaDMY = (f: string) => {
    if (!f) return ''
    const soloFecha = String(f).slice(0, 10)
    const [a, m, d] = soloFecha.split('-')
    return a && m && d ? `${d}/${m}/${a}` : soloFecha
}

export default function MovimientoSubcuentaPage() {
    const [subcuentas, setSubcuentas] = useState<SubcuentaContable[]>([])
    const [cargandoSubcuentas, setCargandoSubcuentas] = useState(false)

    const [params, setParams] = useState<SubctaMvtoParams>({
        cuenta: '',
        anio:   String(new Date().getFullYear()),
        mes:    String(new Date().getMonth() + 1).padStart(2, '0'),
        moneda: 'NSO',
    })

    const [reporte, setReporte] = useState<SubctaMvtoReporte | null>(null)
    const [generando, setGenerando] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const cargar = async () => {
            setCargandoSubcuentas(true)
            try {
                setSubcuentas(await ContabilidadService.listarSubcuentas())
            } catch {
                toast({
                    title: "Error",
                    description: "No se pudieron cargar las sub cuentas contables.",
                    variant: "destructive",
                })
            } finally {
                setCargandoSubcuentas(false)
            }
        }
        cargar()
    }, [])

    const generar = useCallback(async () => {
        if (!params.cuenta) {
            toast({ title: "Atención", description: "Selecciona una sub cuenta contable.", variant: "warning" })
            return
        }
        setGenerando(true)
        setError(null)
        try {
            setReporte(await ContabilidadService.reporteSubcuentaMovimiento(params))
        } catch (e: any) {
            setReporte(null)
            setError(e?.response?.data?.message || "No se pudo generar el reporte.")
        } finally {
            setGenerando(false)
        }
    }, [params])

    const cab = reporte?.cabecera ?? null

    const filas = useMemo(() => {
        if (!reporte?.cabecera) return [] as (SubctaMvtoDetalle & { acumulado: number })[]
        let acum = Number(reporte.cabecera.SaldoInicial ?? 0)
        return reporte.detalle.map(d => {
            acum += Number(d.Ingreso ?? 0) - Number(d.Salida ?? 0)
            return { ...d, acumulado: acum }
        })
    }, [reporte])

    const subcuentaSeleccionada = subcuentas.find(s => s.Cod_Contab === params.cuenta)

    // Flechas de periodo: pasan al mes anterior o siguiente, cambiando de año
    // si hace falta. Con "Todo el ejercicio" no aplican.
    const anioMin = Number(ANIOS[ANIOS.length - 1])
    const anioMax = Number(ANIOS[0])
    const moverMes = (delta: number) => {
        if (!params.mes) return
        let m = Number(params.mes) + delta
        let a = Number(params.anio)
        if (m < 1) { m = 12; a -= 1 }
        if (m > 12) { m = 1; a += 1 }
        if (a < anioMin || a > anioMax) return
        setParams(p => ({ ...p, mes: String(m).padStart(2, '0'), anio: String(a) }))
    }
    const enPrimerMes = params.mes === '01' && Number(params.anio) <= anioMin
    const enUltimoMes = params.mes === '12' && Number(params.anio) >= anioMax

    const variacion = cab ? Number(cab.SaldoFinal) - Number(cab.SaldoInicial) : 0
    const pctVariacion = cab && Number(cab.SaldoInicial) !== 0 ? (variacion / Math.abs(Number(cab.SaldoInicial))) * 100 : null
    // Barra del saldo final: qué parte es saldo inicial y qué parte movimiento del período.
    const pctBase = cab && Number(cab.SaldoFinal) > 0
        ? Math.max(0, Math.min(100, (Number(cab.SaldoInicial) / Number(cab.SaldoFinal)) * 100))
        : 100
    const nIngresos = filas.filter(d => Number(d.Ingreso) > 0).length
    const nSalidas = filas.filter(d => Number(d.Salida) > 0).length

    return (
        <div className="grid grid-cols-1 gap-5 p-4 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/30">
                        <BarChart3 className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                            Movimiento de Sub Cuenta Contable
                        </h1>
                        <p className="text-sm md:text-base text-muted-foreground">
                            Detalle del mayor auxiliar por sub cuenta y período, con saldo inicial y final.
                        </p>
                    </div>
                </div>
                {cab && (
                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" /> {cab.Periodo}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                            <Coins className="h-3.5 w-3.5" /> {cab.Moneda}
                        </span>
                    </div>
                )}
            </div>

            <Card className="border-t-[3px] border-t-blue-600 bg-gradient-to-b from-background to-muted/30 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground">
                                Sub cuenta contable <span className="text-red-500">*</span>
                            </Label>
                            <ComboSelect<SubcuentaContable>
                                value={params.cuenta}
                                onChange={s => setParams(p => ({ ...p, cuenta: s.Cod_Contab }))}
                                items={subcuentas}
                                getKey={s => s.Cod_Contab}
                                getLabel={s => `${s.Cod_Contab} · ${s.Descricpion}`}
                                placeholder={cargandoSubcuentas ? "Cargando..." : "Seleccionar sub cuenta..."}
                                searchPlaceholder="Buscar por código o descripción..."
                                emptyText="No se encontraron sub cuentas"
                                disabled={cargandoSubcuentas}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground">Periodo</Label>
                            <div className="flex items-center gap-1.5">
                                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" title="Mes anterior"
                                        onClick={() => moverMes(-1)} disabled={!params.mes || enPrimerMes}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                {/* '' no es un value válido para SelectItem, así que
                                    "todo el ejercicio" viaja como '00' y el backend
                                    lo traduce. */}
                                <Select
                                    value={params.mes === '' ? '00' : params.mes}
                                    onValueChange={v => setParams(p => ({ ...p, mes: v === '00' ? '' : v }))}
                                >
                                    <SelectTrigger className="h-10 w-40">
                                        <span className="!flex min-w-0 items-center gap-2">
                                            <CalendarDays className="h-4 w-4 shrink-0 text-blue-600" />
                                            <SelectValue />
                                        </span>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MESES_CONTABLES.map(m => (
                                            <SelectItem key={m.valor || '00'} value={m.valor || '00'}>
                                                {m.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={params.anio} onValueChange={v => setParams(p => ({ ...p, anio: v }))}>
                                    <SelectTrigger className="h-10 w-24"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {ANIOS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" title="Mes siguiente"
                                        onClick={() => moverMes(1)} disabled={!params.mes || enUltimoMes}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground">Moneda</Label>
                            <div className="flex h-10 rounded-lg border bg-muted p-0.5" role="group" aria-label="Moneda">
                                {([['NSO', 'S/ Soles'], ['USD', 'US$ Dólares']] as const).map(([valor, texto]) => (
                                    <button
                                        key={valor}
                                        type="button"
                                        onClick={() => setParams(p => ({ ...p, moneda: valor }))}
                                        aria-pressed={params.moneda === valor}
                                        className={`rounded-md px-3.5 text-sm whitespace-nowrap transition-colors ${
                                            params.moneda === valor
                                                ? 'bg-background font-semibold text-blue-700 shadow-sm dark:text-blue-400'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {texto}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button onClick={generar} disabled={generando}
                                className="h-10 gap-1.5 bg-blue-600 font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700">
                            {generando
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Search className="h-4 w-4" />}
                            Generar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {!cab && !error && (
                <Card className="shadow-sm">
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mb-3 opacity-20" />
                        <p className="text-sm font-medium">Selecciona una sub cuenta y genera el reporte</p>
                    </div>
                </Card>
            )}

            {cab && (
                <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1.1fr]">
                        <div className="rounded-xl bg-gradient-to-br from-blue-900 to-blue-600 p-4 text-white shadow-sm sm:col-span-2 xl:col-span-1">
                            <p className="text-[11px] uppercase tracking-wide text-blue-200 line-clamp-2">{cab.Empresa} · RUC {cab.Ruc}</p>
                            <p className="mt-1.5 font-mono text-lg font-bold">{cab.Cuenta}</p>
                            <p className="text-sm text-blue-100 line-clamp-2">
                                {subcuentaSeleccionada?.Descricpion || cab.CuentaDescripcion || cab.SubCuenta}
                            </p>
                        </div>
                        <KpiCard etiqueta="Saldo inicial" icono={Clock} iconoCls="bg-muted text-muted-foreground">
                            <p className="mt-1 font-mono text-lg font-bold sm:text-xl">{money(cab.SaldoInicial)}</p>
                        </KpiCard>
                        <KpiCard etiqueta="Total ingreso" icono={ArrowUpRight} iconoCls="bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
                            <p className="mt-1 font-mono text-lg font-bold sm:text-xl text-emerald-700 dark:text-emerald-400">{money(cab.TotalIngreso)}</p>
                            <p className="text-xs text-muted-foreground">{nIngresos} movimiento{nIngresos !== 1 ? 's' : ''}</p>
                        </KpiCard>
                        <KpiCard etiqueta="Total salida" icono={ArrowDownRight} iconoCls="bg-red-50 text-red-600 dark:bg-red-950">
                            <p className="mt-1 font-mono text-lg font-bold sm:text-xl text-red-700 dark:text-red-400">{money(cab.TotalSalida)}</p>
                            <p className="text-xs text-muted-foreground">{nSalidas} movimiento{nSalidas !== 1 ? 's' : ''}</p>
                        </KpiCard>
                        <KpiCard etiqueta="Saldo final" icono={Scale} iconoCls="bg-blue-100 text-blue-700 dark:bg-blue-950"
                                 className="border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/40">
                            <p className="mt-1 font-mono text-lg font-bold sm:text-xl text-blue-700 dark:text-blue-400">{money(cab.SaldoFinal)}</p>
                            <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-muted">
                                <div className="h-full bg-slate-400" style={{ width: `${pctBase}%` }} />
                                <div className="h-full bg-emerald-500" style={{ width: `${100 - pctBase}%` }} />
                            </div>
                            <p className={`mt-1 text-[11px] ${variacion >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                                {variacion >= 0 ? '▲ +' : '▼ '}{money(variacion)} en el período
                                {pctVariacion !== null && ` (${pctVariacion >= 0 ? '+' : ''}${pctVariacion.toFixed(1)}%)`}
                            </p>
                        </KpiCard>
                    </div>

                    <Card className="overflow-hidden shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                            <h2 className="text-sm font-semibold">Movimientos del período</h2>
                            <ExportSubctaMvtoPdf cabecera={cab} detalle={reporte!.detalle} />
                        </div>

                        <div className="overflow-auto">
                            <table className="w-full min-w-[820px] text-xs border-collapse">
                                <thead>
                                    <tr className="sticky top-0 z-10 bg-gradient-to-b from-muted/60 to-muted">
                                        <Th>Fecha</Th>
                                        <Th>Libro</Th>
                                        <Th>Documento</Th>
                                        <Th>Concepto del registro</Th>
                                        <Th right>Ingreso</Th>
                                        <Th right>Salida</Th>
                                        <Th right>Saldo</Th>
                                        <Th right>Item</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-border bg-muted/40">
                                        <td colSpan={6} className="py-2 px-3 font-semibold italic text-muted-foreground">
                                            Saldo inicial
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono font-bold italic">{money(cab.SaldoInicial)}</td>
                                        <td />
                                    </tr>

                                    {filas.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-12 text-muted-foreground">
                                                Sin movimientos en el período
                                            </td>
                                        </tr>
                                    ) : filas.map(d => {
                                        const esIngreso = Number(d.Ingreso) > 0
                                        const esSalida = Number(d.Salida) > 0
                                        return (
                                            <tr key={d.IdLibroMayor} className="border-b border-border even:bg-muted/20 hover:bg-muted/60">
                                                <td className={`py-2 px-3 whitespace-nowrap font-mono ${
                                                    esIngreso ? 'shadow-[inset_3px_0_0_#6ee7b7]' : esSalida ? 'shadow-[inset_3px_0_0_#fca5a5]' : ''
                                                }`}>
                                                    {fechaDMY(d.Fecha)}
                                                </td>
                                                <td className="py-2 px-3">
                                                    <span
                                                        title={d.Libro === 'B' ? 'Banco' : 'Otros'}
                                                        className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold ${
                                                            d.Libro === 'B'
                                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                                        }`}
                                                    >
                                                        {d.Libro}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 font-mono text-[11px] whitespace-nowrap">{d.Documento}</td>
                                                <td className="py-2 px-3">{d.Concepto}</td>
                                                <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                                                    {esIngreso ? `+ ${money(d.Ingreso)}` : <span className="text-muted-foreground/50">—</span>}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono font-semibold text-red-700 dark:text-red-400">
                                                    {esSalida ? `− ${money(d.Salida)}` : <span className="text-muted-foreground/50">—</span>}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono font-bold">{money(d.acumulado)}</td>
                                                <td className="py-2 px-3 text-right text-muted-foreground">{d.Item}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-4 py-3 border-t border-border bg-muted/40 text-xs text-muted-foreground">
                            {filas.length} movimiento{filas.length !== 1 ? 's' : ''}
                            {subcuentaSeleccionada ? ` · ${subcuentaSeleccionada.Descricpion}` : ''}
                        </div>
                    </Card>
                </>
            )}
        </div>
    )
}

function Th({ children, right = false }: { children: React.ReactNode; right?: boolean }) {
    return (
        <th className={`py-2.5 px-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider border-b ${right ? 'text-right' : 'text-left'}`}>
            {children}
        </th>
    )
}

function KpiCard({ etiqueta, icono: Icono, iconoCls, className = "", children }: {
    etiqueta: string; icono: LucideIcon; iconoCls: string; className?: string; children: React.ReactNode
}) {
    return (
        <div className={`rounded-xl border bg-background p-3.5 shadow-sm ${className}`}>
            <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{etiqueta}</p>
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconoCls}`}>
                    <Icono className="h-4 w-4" />
                </span>
            </div>
            {children}
        </div>
    )
}
