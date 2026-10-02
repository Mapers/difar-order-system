'use client'

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ComboSelect } from "@/components/ui/combo-select"
import { Loader2, Search, BookOpen, AlertCircle } from "lucide-react"
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

    return (
        <div className="grid gap-6 p-4 md:p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    Movimiento de Sub Cuenta Contable
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                    Detalle del mayor auxiliar por sub cuenta y período, con saldo inicial y final.
                </p>
            </div>

            <Card className="shadow-md">
                <CardHeader className="bg-muted border-b border-border p-4">
                    <div className="grid sm:grid-cols-12 gap-4 items-end">
                        <div className="flex flex-col gap-1 sm:col-span-5">
                            <Label className="text-sm">
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

                        <div className="flex flex-col gap-1 sm:col-span-2">
                            <Label className="text-sm">Año</Label>
                            <Select value={params.anio} onValueChange={v => setParams(p => ({ ...p, anio: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {ANIOS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1 sm:col-span-2">
                            <Label className="text-sm">Mes</Label>
                            {/* '' no es un value válido para SelectItem, así que
                                "todo el ejercicio" viaja como '00' y el backend
                                lo traduce. */}
                            <Select
                                value={params.mes === '' ? '00' : params.mes}
                                onValueChange={v => setParams(p => ({ ...p, mes: v === '00' ? '' : v }))}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {MESES_CONTABLES.map(m => (
                                        <SelectItem key={m.valor || '00'} value={m.valor || '00'}>
                                            {m.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1 sm:col-span-2">
                            <Label className="text-sm">Moneda</Label>
                            <Select
                                value={params.moneda}
                                onValueChange={v => setParams(p => ({ ...p, moneda: v as 'NSO' | 'USD' }))}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NSO">Soles S/</SelectItem>
                                    <SelectItem value="USD">Dólares US$</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="sm:col-span-1">
                            <Button onClick={generar} disabled={generando} className="w-full gap-1.5">
                                {generando
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <Search className="h-4 w-4" />}
                                Generar
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {error && (
                        <div className="flex items-start gap-2 m-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {!cab && !error && (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <BookOpen className="h-12 w-12 mb-3 opacity-20" />
                            <p className="text-sm font-medium">Selecciona una sub cuenta y genera el reporte</p>
                        </div>
                    )}

                    {cab && (
                        <div className="flex flex-col">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-4 border-b border-border">
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">{cab.Empresa} · RUC {cab.Ruc}</p>
                                    <h2 className="text-base font-semibold text-foreground mt-0.5 truncate">
                                        {cab.SubCuenta}
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {cab.Periodo} · {cab.Moneda}
                                    </p>
                                </div>
                                <ExportSubctaMvtoPdf cabecera={cab} detalle={reporte!.detalle} />
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 border-b border-border bg-muted/40">
                                <Resumen etiqueta="Saldo inicial" valor={cab.SaldoInicial} />
                                <Resumen etiqueta="Total ingreso" valor={cab.TotalIngreso} color="text-emerald-600" />
                                <Resumen etiqueta="Total salida"  valor={cab.TotalSalida}  color="text-red-600" />
                                <Resumen etiqueta="Saldo final"   valor={cab.SaldoFinal}   color="text-blue-700" destacado />
                            </div>

                            <div className="overflow-auto">
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-muted sticky top-0 z-10">
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
                                        <tr className="border-b border-border bg-muted/30">
                                            <td colSpan={6} className="py-2 px-3 font-medium text-muted-foreground">
                                                Saldo inicial
                                            </td>
                                            <td className="py-2 px-3 text-right font-semibold">{money(cab.SaldoInicial)}</td>
                                            <td />
                                        </tr>

                                        {filas.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-12 text-muted-foreground">
                                                    Sin movimientos en el período
                                                </td>
                                            </tr>
                                        ) : filas.map(d => (
                                            <tr key={d.IdLibroMayor} className="hover:bg-muted/60 border-b border-border">
                                                <td className="py-2 px-3 whitespace-nowrap">{fechaDMY(d.Fecha)}</td>
                                                <td className="py-2 px-3">
                                                    <span
                                                        title={d.Libro === 'B' ? 'Banco' : 'Otros'}
                                                        className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${
                                                            d.Libro === 'B'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-slate-100 text-slate-600'
                                                        }`}
                                                    >
                                                        {d.Libro}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 font-mono text-[11px] whitespace-nowrap">{d.Documento}</td>
                                                <td className="py-2 px-3">{d.Concepto}</td>
                                                <td className="py-2 px-3 text-right text-emerald-600">
                                                    {Number(d.Ingreso) ? money(d.Ingreso) : '–'}
                                                </td>
                                                <td className="py-2 px-3 text-right text-red-600">
                                                    {Number(d.Salida) ? money(d.Salida) : '–'}
                                                </td>
                                                <td className="py-2 px-3 text-right font-medium">{money(d.acumulado)}</td>
                                                <td className="py-2 px-3 text-right text-muted-foreground">{d.Item}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-muted font-semibold">
                                            <td colSpan={4} className="py-2.5 px-3">Totales</td>
                                            <td className="py-2.5 px-3 text-right text-emerald-700">{money(cab.TotalIngreso)}</td>
                                            <td className="py-2.5 px-3 text-right text-red-700">{money(cab.TotalSalida)}</td>
                                            <td className="py-2.5 px-3 text-right text-blue-700">{money(cab.SaldoFinal)}</td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className="px-4 py-3 border-t border-border bg-muted text-xs text-muted-foreground">
                                {filas.length} movimiento{filas.length !== 1 ? 's' : ''}
                                {subcuentaSeleccionada ? ` · ${subcuentaSeleccionada.Descricpion}` : ''}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
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

function Resumen({
    etiqueta, valor, color = 'text-foreground', destacado = false,
}: { etiqueta: string; valor: number; color?: string; destacado?: boolean }) {
    return (
        <div className={`rounded-lg border p-3 bg-background ${destacado ? 'border-blue-200' : 'border-border'}`}>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{etiqueta}</p>
            <p className={`text-lg font-semibold mt-0.5 ${color}`}>{money(valor)}</p>
        </div>
    )
}
