'use client'

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ComboSelect } from "@/components/ui/combo-select"
import {
    Loader2, Search, HandCoins, AlertCircle, CalendarDays, ShoppingCart, FlaskConical, Receipt, Percent, X, Users,
} from "lucide-react"
import { toast } from "@/app/hooks/useToast"
import { ComisionesService } from "@/app/services/comisiones/ComisionesService"
import {
    ComboItem, ComisionVentaDetalle, ComisionVentaFila, ComisionVentaResumen, nombreMes,
} from "@/app/types/comisiones-types"
import { ExportComisionPdf } from "@/components/contabilidad/comisiones/ExportComisionPdf"
import { ReportePdf } from "@/components/contabilidad/comisiones/pdfComision"
import { fechaDMY, KpiCard, money, pct, SelectorPeriodo, Th } from "@/components/contabilidad/comisiones/ui"
import { GlobalLaboratorio } from "@/components/contabilidad/comisiones/GlobalLaboratorio"

const TODOS: ComboItem = { valor: '', texto: 'Todos los vendedores' }

export default function ComisionVentasPage() {
    const hoy = new Date()
    const [anio, setAnio] = useState(String(hoy.getFullYear()))
    const [mes, setMes] = useState(String(hoy.getMonth() + 1).padStart(2, '0'))
    const [vendedor, setVendedor] = useState('')
    const [vendedores, setVendedores] = useState<ComboItem[]>([TODOS])
    const [vista, setVista] = useState<'vendedor' | 'global'>('vendedor')

    const [resumen, setResumen] = useState<ComisionVentaResumen | null>(null)
    const [generando, setGenerando] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [seleccion, setSeleccion] = useState<ComisionVentaFila | null>(null)
    const [detalle, setDetalle] = useState<ComisionVentaDetalle | null>(null)
    const [cargandoDetalle, setCargandoDetalle] = useState(false)

    useEffect(() => {
        ComisionesService.vendedores()
            .then(v => setVendedores([TODOS, ...v]))
            .catch(() => toast({ title: "Error", description: "No se pudieron cargar los vendedores.", variant: "destructive" }))
    }, [])

    const generar = useCallback(async () => {
        setGenerando(true)
        setError(null)
        setSeleccion(null)
        setDetalle(null)
        try {
            setResumen(await ComisionesService.ventasResumen(anio, mes, vendedor))
        } catch (e: any) {
            setResumen(null)
            setError(e?.response?.data?.message || "No se pudo generar el reporte.")
        } finally {
            setGenerando(false)
        }
    }, [anio, mes, vendedor])

    const verDetalle = async (fila: ComisionVentaFila) => {
        if (seleccion?.Codigo_Vend === fila.Codigo_Vend) { setSeleccion(null); setDetalle(null); return }
        setSeleccion(fila)
        setDetalle(null)
        setCargandoDetalle(true)
        try {
            setDetalle(await ComisionesService.ventasDetalle(resumen!.periodo.anio, resumen!.periodo.mes, fila.Codigo_Vend))
        } catch (e: any) {
            toast({ title: "Error", description: e?.response?.data?.message || "No se pudo cargar el detalle.", variant: "destructive" })
        } finally {
            setCargandoDetalle(false)
        }
    }

    const t = resumen?.totales
    const periodoTxt = resumen ? `${nombreMes(resumen.periodo.mes)} ${resumen.periodo.anio}` : ''
    const conComision = resumen?.filas.filter(f => f.Comision > 0).length ?? 0
    const maxNetas = Math.max(1, ...(resumen?.filas.map(f => f.VentasNetas) ?? [1]))

    const pdfResumen = useMemo<ReportePdf | null>(() => resumen && ({
        recuadroTitulo: 'Comisión de ventas por vendedor',
        recuadroDetalle: `${periodoTxt}  ·  ${resumen.filas.length} vendedor${resumen.filas.length !== 1 ? 'es' : ''}  ·  Comisión = ventas netas × tasa del vendedor`,
        periodo: `${periodoTxt} · Soles`,
        tarjetas: [
            { etiqueta: 'Ventas totales', valor: `${money(resumen.totales.ventasTotal)}` },
            { etiqueta: 'Rep. laboratorio', valor: `${money(resumen.totales.ventasRepLab)}`, color: 'rojo' },
            { etiqueta: 'Ventas netas', valor: `${money(resumen.totales.ventasNetas)}`, color: 'verde' },
            { etiqueta: 'Comisión total', valor: `${money(resumen.totales.comision)}` },
        ],
        columnas: [
            { clave: 'cod', titulo: 'Código', ancho: 46, negrita: true },
            { clave: 'vend', titulo: 'Vendedor', ancho: 0 },
            { clave: 'total', titulo: 'Ventas total', ancho: 82, derecha: true },
            { clave: 'replab', titulo: 'Rep. lab.', ancho: 70, derecha: true, opcional: true },
            { clave: 'netas', titulo: 'Ventas netas', ancho: 82, derecha: true },
            { clave: 'tasa', titulo: 'Tasa', ancho: 46, derecha: true },
            { clave: 'com', titulo: 'Comisión', ancho: 72, derecha: true, negrita: true },
            { clave: 'costo', titulo: 'Costo salidas', ancho: 78, derecha: true, opcional: true },
            { clave: 'util', titulo: 'Utilidad', ancho: 78, derecha: true, opcional: true },
        ],
        filas: resumen.filas.map(f => ({
            valores: {
                cod: f.Codigo_Vend, vend: f.Vendedor, total: money(f.VentasTotal), replab: money(f.VentasRepLab),
                netas: money(f.VentasNetas), tasa: pct(f.TasaPorcentaje), com: money(f.Comision),
                costo: money(f.CostoSalidas), util: money(f.Utilidad),
            },
            colores: { replab: f.VentasRepLab ? 'rojo' : 'gris', com: f.Comision ? 'verde' : 'gris', tasa: 'gris' },
        })),
        totales: {
            vend: 'Totales', total: money(resumen.totales.ventasTotal), replab: money(resumen.totales.ventasRepLab),
            netas: money(resumen.totales.ventasNetas), com: money(resumen.totales.comision),
            costo: money(resumen.filas.reduce((s, f) => s + f.CostoSalidas, 0)),
            util: money(resumen.filas.reduce((s, f) => s + f.Utilidad, 0)),
        },
        pie: `Comisión de ventas ${periodoTxt}`,
    }), [resumen, periodoTxt])

    const pdfDetalle = useMemo<ReportePdf | null>(() => detalle && seleccion && ({
        recuadroTitulo: `${seleccion.Codigo_Vend} · ${seleccion.Vendedor}`,
        recuadroDetalle: `${periodoTxt}  ·  ${detalle.filas.length} comprobantes  ·  Tasa ${pct(seleccion.TasaPorcentaje)}  ·  Comisión ${money(seleccion.Comision)}`,
        periodo: `${periodoTxt} · Soles`,
        tarjetas: [
            { etiqueta: 'Comprobantes', valor: String(detalle.totales.comprobantes) },
            { etiqueta: 'Ventas totales', valor: `${money(detalle.totales.ventasTotal)}` },
            { etiqueta: 'Ventas netas', valor: `${money(detalle.totales.ventasNetas)}`, color: 'verde' },
            { etiqueta: 'Comisión', valor: `${money(seleccion.Comision)}` },
        ],
        columnas: [
            { clave: 'fecha', titulo: 'Fecha', ancho: 52 },
            { clave: 'doc', titulo: 'Comprobante', ancho: 92, negrita: true },
            { clave: 'op', titulo: 'Operación', ancho: 92, opcional: true },
            { clave: 'cli', titulo: 'Cliente', ancho: 0 },
            { clave: 'total', titulo: 'Ventas total', ancho: 76, derecha: true },
            { clave: 'replab', titulo: 'Rep. lab.', ancho: 64, derecha: true, opcional: true },
            { clave: 'netas', titulo: 'Ventas netas', ancho: 76, derecha: true },
            { clave: 'items', titulo: 'Ítems', ancho: 36, derecha: true, opcional: true },
        ],
        filas: detalle.filas.map(d => ({
            valores: {
                fecha: fechaDMY(d.Fecha_Mvto), doc: `${d.TipoDocumento || d.Codigo_Doc} ${d.Serie_Doc}-${d.Nro_Doc}`,
                op: d.Operacion, cli: d.Cliente, total: money(d.VentasTotal), replab: money(d.VentasRepLab),
                netas: money(d.VentasNetas), items: String(d.Items ?? ''),
            },
            colores: { netas: d.VentasNetas < 0 ? 'rojo' : 'texto', replab: d.VentasRepLab ? 'rojo' : 'gris', items: 'gris', op: 'gris' },
        })),
        totales: {
            cli: 'Totales', total: money(detalle.totales.ventasTotal), replab: money(detalle.totales.ventasRepLab),
            netas: money(detalle.totales.ventasNetas),
        },
        pie: `Comisión de ventas ${seleccion.Codigo_Vend} ${periodoTxt}`,
    }), [detalle, seleccion, periodoTxt])

    return (
        <div className="grid grid-cols-1 gap-5 p-4 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/30">
                        <HandCoins className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Comisión de Ventas</h1>
                        <p className="text-sm md:text-base text-muted-foreground">
                            Comisión por vendedor sobre la venta neta del mes (venta total menos lo vendido por representantes de laboratorio).
                        </p>
                    </div>
                </div>
                {resumen && vista === 'vendedor' && (
                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" /> {periodoTxt}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                            <Users className="h-3.5 w-3.5" /> {resumen.filas.length} vendedor{resumen.filas.length !== 1 ? 'es' : ''}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex h-10 w-fit rounded-lg border bg-muted p-0.5" role="tablist" aria-label="Vista">
                {([['vendedor', 'Por vendedor', Users], ['global', 'Global por laboratorio', FlaskConical]] as const).map(([v, t, Icono]) => (
                    <button key={v} type="button" role="tab" aria-selected={vista === v} onClick={() => setVista(v)}
                            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 text-sm whitespace-nowrap transition-colors ${
                                vista === v ? 'bg-background font-semibold text-blue-700 shadow-sm dark:text-blue-400' : 'text-muted-foreground hover:text-foreground'}`}>
                        <Icono className="h-4 w-4" /> {t}
                    </button>
                ))}
            </div>

            {vista === 'global' ? <GlobalLaboratorio vendedores={vendedores} /> : (<>
            <Card className="border-t-[3px] border-t-blue-600 bg-gradient-to-b from-background to-muted/30 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground">Vendedor</Label>
                            <ComboSelect<ComboItem>
                                value={vendedor}
                                onChange={v => setVendedor(v.valor)}
                                items={vendedores}
                                getKey={v => v.valor}
                                getLabel={v => v.valor ? `${v.valor} · ${v.texto}` : v.texto}
                                placeholder="Todos los vendedores"
                                searchPlaceholder="Buscar por código o nombre..."
                                emptyText="No se encontraron vendedores"
                            />
                        </div>
                        <SelectorPeriodo anio={anio} mes={mes} onChange={(a, m) => { setAnio(a); setMes(m) }} />
                        <Button onClick={generar} disabled={generando}
                                className="h-10 gap-1.5 bg-blue-600 font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700">
                            {generando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
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

            {!resumen && !error && (
                <Card className="shadow-sm">
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <HandCoins className="h-12 w-12 mb-3 opacity-20" />
                        <p className="text-sm font-medium">Selecciona el periodo y genera el reporte</p>
                    </div>
                </Card>
            )}

            {resumen && t && (
                <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1.1fr]">
                        <div className="rounded-xl bg-gradient-to-br from-blue-900 to-blue-600 p-4 text-white shadow-sm sm:col-span-2 xl:col-span-1">
                            <p className="text-[11px] uppercase tracking-wide text-blue-200 line-clamp-2">
                                {resumen.filas[0]?.NombreRazSocial || 'DIFAR'} · RUC {resumen.filas[0]?.RUC || ''}
                            </p>
                            <p className="mt-1.5 text-lg font-bold">Comisión de ventas</p>
                            <p className="text-sm text-blue-100">{periodoTxt} · {conComision} de {resumen.filas.length} vendedor{resumen.filas.length !== 1 ? 'es' : ''} con comisión</p>
                        </div>
                        <KpiCard etiqueta="Ventas totales" icono={ShoppingCart} iconoCls="bg-muted text-muted-foreground">
                            <p className="mt-1 font-mono text-lg font-bold sm:text-xl">{money(t.ventasTotal)}</p>
                        </KpiCard>
                        <KpiCard etiqueta="Rep. laboratorio" icono={FlaskConical} iconoCls="bg-red-50 text-red-600 dark:bg-red-950">
                            <p className="mt-1 font-mono text-lg font-bold sm:text-xl text-red-700 dark:text-red-400">{money(t.ventasRepLab)}</p>
                            <p className="text-xs text-muted-foreground">No genera comisión</p>
                        </KpiCard>
                        <KpiCard etiqueta="Ventas netas" icono={Receipt} iconoCls="bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
                            <p className="mt-1 font-mono text-lg font-bold sm:text-xl text-emerald-700 dark:text-emerald-400">{money(t.ventasNetas)}</p>
                            <p className="text-xs text-muted-foreground">Base de la comisión</p>
                        </KpiCard>
                        <KpiCard etiqueta="Comisión total" icono={Percent} iconoCls="bg-blue-100 text-blue-700 dark:bg-blue-950"
                                 className="border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/40">
                            <p className="mt-1 font-mono text-lg font-bold sm:text-xl text-blue-700 dark:text-blue-400">{money(t.comision)}</p>
                            <p className="text-xs text-muted-foreground">
                                {t.ventasNetas ? `${((t.comision / t.ventasNetas) * 100).toFixed(2)} % de las ventas netas` : '—'}
                            </p>
                        </KpiCard>
                    </div>

                    <Card className="overflow-hidden shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                            <div>
                                <h2 className="text-sm font-semibold">Comisión por vendedor</h2>
                                <p className="text-xs text-muted-foreground">Haz clic en un vendedor para ver sus comprobantes.</p>
                            </div>
                            {pdfResumen && (
                                <ExportComisionPdf reporte={pdfResumen} tituloDefecto="COMISIÓN DE VENTAS POR VENDEDOR"
                                                   archivoDefecto={`comision-ventas-${resumen.periodo.anio}-${resumen.periodo.mes}`}
                                                   descripcion={`Comisión de ventas · ${periodoTxt}`}
                                                   columnasFijas="Código, vendedor, ventas total, ventas netas, tasa y comisión siempre se incluyen." />
                            )}
                        </div>
                        {/* Celular: una tarjeta por vendedor */}
                        <div className="divide-y md:hidden">
                            {resumen.filas.length === 0 ? (
                                <p className="py-12 text-center text-sm text-muted-foreground">Sin ventas en el período</p>
                            ) : resumen.filas.map(f => {
                                const activo = seleccion?.Codigo_Vend === f.Codigo_Vend
                                return (
                                    <button key={f.Codigo_Vend} type="button" onClick={() => verDetalle(f)}
                                            className={`block w-full px-4 py-3 text-left active:bg-muted/60 ${activo ? 'bg-blue-50 shadow-[inset_3px_0_0_#2563eb] dark:bg-blue-950/40' : ''}`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold leading-tight">{f.Vendedor}</p>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    <span className="font-mono">{f.Codigo_Vend}</span> · tasa {pct(f.TasaPorcentaje)}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="text-[10px] uppercase text-muted-foreground">Comisión</p>
                                                <p className="font-mono text-base font-bold text-emerald-700 dark:text-emerald-400">{money(f.Comision)}</p>
                                            </div>
                                        </div>
                                        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                                            <div className="h-full bg-blue-500/70" style={{ width: `${Math.max(0, (f.VentasNetas / maxNetas) * 100)}%` }} />
                                        </div>
                                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                                            <div><p className="text-muted-foreground">Total</p><p className="font-mono">{money(f.VentasTotal)}</p></div>
                                            <div><p className="text-muted-foreground">Rep. lab.</p><p className="font-mono text-red-700 dark:text-red-400">{f.VentasRepLab ? money(f.VentasRepLab) : '—'}</p></div>
                                            <div className="text-right"><p className="text-muted-foreground">Netas</p><p className="font-mono font-semibold">{money(f.VentasNetas)}</p></div>
                                        </div>
                                    </button>
                                )
                            })}
                            {resumen.filas.length > 0 && (
                                <div className="flex items-center justify-between bg-blue-50/60 px-4 py-3 text-sm font-bold dark:bg-blue-950/30">
                                    <span>Totales · netas {money(t.ventasNetas)}</span>
                                    <span className="font-mono text-blue-700 dark:text-blue-400">{money(t.comision)}</span>
                                </div>
                            )}
                        </div>
                        <div className="hidden overflow-auto md:block">
                            <table className="w-full min-w-[900px] text-xs border-collapse">
                                <thead>
                                    <tr className="sticky top-0 z-10 bg-gradient-to-b from-muted/60 to-muted">
                                        <Th>Código</Th>
                                        <Th>Vendedor</Th>
                                        <Th right>Ventas total</Th>
                                        <Th right>Rep. lab.</Th>
                                        <Th right>Ventas netas</Th>
                                        <Th right>Tasa</Th>
                                        <Th right>Comisión</Th>
                                        <Th right>Costo salidas</Th>
                                        <Th right>Utilidad</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resumen.filas.length === 0 ? (
                                        <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">Sin ventas en el período</td></tr>
                                    ) : resumen.filas.map(f => {
                                        const activo = seleccion?.Codigo_Vend === f.Codigo_Vend
                                        return (
                                            <tr key={f.Codigo_Vend} onClick={() => verDetalle(f)}
                                                className={`cursor-pointer border-b border-border even:bg-muted/20 hover:bg-muted/60 ${activo ? '!bg-blue-50 dark:!bg-blue-950/40' : ''}`}>
                                                <td className={`py-2 px-3 font-mono font-semibold ${activo ? 'shadow-[inset_3px_0_0_#2563eb]' : ''}`}>{f.Codigo_Vend}</td>
                                                <td className="py-2 px-3">
                                                    <p className="font-medium">{f.Vendedor}</p>
                                                    <div className="mt-1 h-1 w-full max-w-[220px] overflow-hidden rounded-full bg-muted">
                                                        <div className="h-full bg-blue-500/70" style={{ width: `${Math.max(0, (f.VentasNetas / maxNetas) * 100)}%` }} />
                                                    </div>
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono">{money(f.VentasTotal)}</td>
                                                <td className="py-2 px-3 text-right font-mono text-red-700 dark:text-red-400">
                                                    {f.VentasRepLab ? money(f.VentasRepLab) : <span className="text-muted-foreground/50">—</span>}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono font-semibold">{money(f.VentasNetas)}</td>
                                                <td className="py-2 px-3 text-right">
                                                    <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${f.TasaPorcentaje ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                                                        {pct(f.TasaPorcentaje)}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                                    {f.Comision ? money(f.Comision) : <span className="text-muted-foreground/50">{money(0)}</span>}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono text-muted-foreground">{money(f.CostoSalidas)}</td>
                                                <td className="py-2 px-3 text-right font-mono">{money(f.Utilidad)}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                {resumen.filas.length > 0 && (
                                    <tfoot>
                                        <tr className="border-t-2 border-blue-200 bg-blue-50/60 font-bold dark:border-blue-900 dark:bg-blue-950/30">
                                            <td className="py-2.5 px-3" colSpan={2}>Totales</td>
                                            <td className="py-2.5 px-3 text-right font-mono">{money(t.ventasTotal)}</td>
                                            <td className="py-2.5 px-3 text-right font-mono text-red-700 dark:text-red-400">{money(t.ventasRepLab)}</td>
                                            <td className="py-2.5 px-3 text-right font-mono">{money(t.ventasNetas)}</td>
                                            <td />
                                            <td className="py-2.5 px-3 text-right font-mono text-blue-700 dark:text-blue-400">{money(t.comision)}</td>
                                            <td className="py-2.5 px-3 text-right font-mono">{money(resumen.filas.reduce((s, f) => s + f.CostoSalidas, 0))}</td>
                                            <td className="py-2.5 px-3 text-right font-mono">{money(resumen.filas.reduce((s, f) => s + f.Utilidad, 0))}</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                        <div className="px-4 py-3 border-t border-border bg-muted/40 text-xs text-muted-foreground">
                            {resumen.filas.length} vendedor{resumen.filas.length !== 1 ? 'es' : ''} · Comisión = ventas netas × tasa del vendedor (redondeo bancario, igual que Access)
                        </div>
                    </Card>

                    {seleccion && (
                        <Card className="overflow-hidden shadow-sm border-blue-200 dark:border-blue-900">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-blue-50/50 px-4 py-3 dark:bg-blue-950/20">
                                <div>
                                    <h2 className="text-sm font-semibold">
                                        Comprobantes de {seleccion.Codigo_Vend} · {seleccion.Vendedor}
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        {periodoTxt} · tasa {pct(seleccion.TasaPorcentaje)} · comisión {money(seleccion.Comision)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {pdfDetalle && (
                                        <ExportComisionPdf reporte={pdfDetalle} tituloDefecto="COMISIÓN DE VENTAS - DETALLE DE COMPROBANTES"
                                                           archivoDefecto={`comision-ventas-${seleccion.Codigo_Vend}-${resumen.periodo.anio}-${resumen.periodo.mes}`}
                                                           descripcion={`${seleccion.Codigo_Vend} · ${periodoTxt}`}
                                                           columnasFijas="Fecha, comprobante, cliente, ventas total y ventas netas siempre se incluyen." />
                                    )}
                                    <Button variant="ghost" size="icon" title="Cerrar detalle" onClick={() => { setSeleccion(null); setDetalle(null) }}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            {cargandoDetalle ? (
                                <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando comprobantes…
                                </div>
                            ) : detalle && (
                                <>
                                    {/* Celular: una tarjeta por comprobante */}
                                    <div className="divide-y md:hidden">
                                        {detalle.filas.map((d, i) => {
                                            const negativo = d.VentasNetas < 0
                                            return (
                                                <div key={`m-${d.Codigo_Doc}-${d.Serie_Doc}-${d.Nro_Doc}-${i}`}
                                                     className={`px-4 py-2.5 ${negativo ? 'shadow-[inset_3px_0_0_#fca5a5]' : 'shadow-[inset_3px_0_0_#6ee7b7]'}`}>
                                                    <div className="flex items-center justify-between gap-2 text-xs">
                                                        <span>
                                                            <span className="mr-1.5 inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{d.Codigo_Doc}</span>
                                                            <span className="font-mono">{d.Serie_Doc}-{d.Nro_Doc}</span>
                                                        </span>
                                                        <span className="font-mono text-muted-foreground">{fechaDMY(d.Fecha_Mvto)}</span>
                                                    </div>
                                                    <p className="mt-1 text-sm leading-tight">{d.Cliente}</p>
                                                    <div className="mt-1 flex items-center justify-between text-xs">
                                                        <span className="text-muted-foreground">{d.Operacion} · {d.Items} ítem{d.Items !== 1 ? 's' : ''}</span>
                                                        <span className={`font-mono font-semibold ${negativo ? 'text-red-700 dark:text-red-400' : ''}`}>{money(d.VentasNetas)}</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className="hidden overflow-x-auto md:block">
                                        <table className="w-full min-w-[900px] text-xs border-collapse">
                                            <thead>
                                                <tr className="sticky top-0 z-10 bg-gradient-to-b from-muted/60 to-muted">
                                                    <Th>Fecha</Th>
                                                    <Th>Comprobante</Th>
                                                    <Th>Operación</Th>
                                                    <Th>Cliente</Th>
                                                    <Th right>Ventas total</Th>
                                                    <Th right>Rep. lab.</Th>
                                                    <Th right>Ventas netas</Th>
                                                    <Th right>Ítems</Th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detalle.filas.map((d, i) => {
                                                    const negativo = d.VentasNetas < 0
                                                    return (
                                                        <tr key={`${d.Codigo_Doc}-${d.Serie_Doc}-${d.Nro_Doc}-${i}`} className="border-b border-border even:bg-muted/20 hover:bg-muted/60">
                                                            <td className={`py-2 px-3 whitespace-nowrap font-mono ${negativo ? 'shadow-[inset_3px_0_0_#fca5a5]' : 'shadow-[inset_3px_0_0_#6ee7b7]'}`}>{fechaDMY(d.Fecha_Mvto)}</td>
                                                            <td className="py-2 px-3 whitespace-nowrap">
                                                                <span className="mr-1.5 inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{d.Codigo_Doc}</span>
                                                                <span className="font-mono text-[11px]">{d.Serie_Doc}-{d.Nro_Doc}</span>
                                                            </td>
                                                            <td className="py-2 px-3 text-muted-foreground">{d.Operacion}</td>
                                                            <td className="py-2 px-3">{d.Cliente}</td>
                                                            <td className="py-2 px-3 text-right font-mono">{money(d.VentasTotal)}</td>
                                                            <td className="py-2 px-3 text-right font-mono text-red-700 dark:text-red-400">
                                                                {d.VentasRepLab ? money(d.VentasRepLab) : <span className="text-muted-foreground/50">—</span>}
                                                            </td>
                                                            <td className={`py-2 px-3 text-right font-mono font-semibold ${negativo ? 'text-red-700 dark:text-red-400' : ''}`}>{money(d.VentasNetas)}</td>
                                                            <td className="py-2 px-3 text-right text-muted-foreground">{d.Items}</td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex flex-wrap justify-between gap-2 px-4 py-3 border-t border-border bg-muted/40 text-xs text-muted-foreground">
                                        <span>{detalle.totales.comprobantes} comprobantes</span>
                                        <span>
                                            Ventas netas <b className="font-mono text-foreground">{money(detalle.totales.ventasNetas)}</b>
                                            {' '}× {pct(seleccion.TasaPorcentaje)} = <b className="font-mono text-blue-700 dark:text-blue-400">{money(seleccion.Comision)}</b>
                                        </span>
                                    </div>
                                </>
                            )}
                        </Card>
                    )}
                </>
            )}
            </>)}
        </div>
    )
}
