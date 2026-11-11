'use client'

import { useCallback, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ComboSelect } from "@/components/ui/combo-select"
import {
    AlertCircle, BadgeCheck, Boxes, ChevronRight, FlaskConical, Loader2, Package, Percent, Receipt, Search, Info,
} from "lucide-react"
import { ComisionesService } from "@/app/services/comisiones/ComisionesService"
import { ComboItem, ComisionLaboratorios, LabGrupo, LabProducto, nombreMes } from "@/app/types/comisiones-types"
import { ExportComisionPdf } from "./ExportComisionPdf"
import { ReportePdf } from "./pdfComision"
import { KpiCard, money, SelectorPeriodo, Th } from "./ui"

const cajas = (v: number) => Number(v ?? 0).toLocaleString('es-PE', { maximumFractionDigits: 2 })
const r2 = (n: number) => Math.round(n * 100) / 100

/** Comisión del producto: el incentivo S/ por caja reemplaza a la comisión por tasa (2 %). */
const comisionDe = (p: LabProducto) => p.tarifaCaja != null ? p.cantidad * p.tarifaCaja : p.comision

interface Lab extends LabGrupo { cajas: number; ventasTotal: number; ventasNetas: number; comision: number; conTarifa: number }

/**
 * Vista GLOBAL de la comisión de ventas: laboratorio → productos, con cajas
 * vendidas, venta y comisión. Hoy la comisión es la tasa del vendedor (2 %);
 * cuando un producto tenga incentivo "S/ por caja" vigente, este la reemplaza.
 * Filtros: vendedor, producto y cliente. Referencia: Libro de Ventas (Fact − N/C).
 */
export function GlobalLaboratorio({ vendedores }: { vendedores: ComboItem[] }) {
    const hoy = new Date()
    const [anio, setAnio] = useState(String(hoy.getFullYear()))
    const [mes, setMes] = useState(String(hoy.getMonth() + 1).padStart(2, '0'))
    const [vendedor, setVendedor] = useState('')
    const [producto, setProducto] = useState('')
    const [cliente, setCliente] = useState('')

    const [datos, setDatos] = useState<ComisionLaboratorios | null>(null)
    const [generando, setGenerando] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [abiertos, setAbiertos] = useState<Set<number>>(new Set())

    const generar = useCallback(async () => {
        setGenerando(true)
        setError(null)
        setAbiertos(new Set())
        try {
            setDatos(await ComisionesService.ventasLaboratorios(anio, mes, { vendedor, producto, cliente }))
        } catch (e: any) {
            setDatos(null)
            setError(e?.response?.data?.message || "No se pudo generar el reporte.")
        } finally {
            setGenerando(false)
        }
    }, [anio, mes, vendedor, producto, cliente])

    const labs = useMemo<Lab[]>(() => (datos?.laboratorios ?? []).map(l => {
        const c = l.productos.reduce((s, p) => s + p.cantidad, 0)
        const vt = l.productos.reduce((s, p) => s + p.ventasTotal, 0)
        const v = l.productos.reduce((s, p) => s + p.ventasNetas, 0)
        const com = l.productos.reduce((s, p) => s + comisionDe(p), 0)
        return { ...l, cajas: c, ventasTotal: r2(vt), ventasNetas: r2(v), comision: r2(com), conTarifa: l.productos.filter(p => p.tarifaCaja != null).length }
    }).sort((a, b) => b.ventasNetas - a.ventasNetas), [datos])

    const tot = useMemo(() => ({
        labs: labs.length,
        productos: labs.reduce((s, l) => s + l.productos.length, 0),
        cajas: labs.reduce((s, l) => s + l.cajas, 0),
        ventasTotal: r2(labs.reduce((s, l) => s + l.ventasTotal, 0)),
        ventas: r2(labs.reduce((s, l) => s + l.ventasNetas, 0)),
        comision: Math.round(labs.reduce((s, l) => s + l.comision, 0) * 100) / 100,
    }), [labs])
    const maxVentas = Math.max(1, ...labs.map(l => l.ventasNetas))
    const periodoTxt = datos ? `${nombreMes(datos.periodo.mes)} ${datos.periodo.anio}` : ''
    const libro = datos ? r2(datos.referencia.ventas - datos.referencia.notasCredito) : 0
    const filtrado = !!(datos && (datos.filtros?.vendedor || datos.filtros?.producto || datos.filtros?.cliente))
    const diferencia = r2(tot.ventasTotal - libro)
    const cuadra = Math.abs(diferencia) < 0.01

    const alternar = (id: number) => setAbiertos(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

    const pdf = useMemo<ReportePdf | null>(() => datos && ({
        recuadroTitulo: 'Comisión de ventas · Global por laboratorio',
        recuadroDetalle: `${periodoTxt}  ·  ${tot.labs} laboratorios  ·  ${tot.productos} productos  ·  Comisión = ventas netas × tasa del vendedor (S/ por caja si tiene incentivo)`,
        periodo: `${periodoTxt} · Soles`,
        tarjetas: [
            { etiqueta: 'Libro de ventas (Fact - N/C)', valor: money(libro) },
            { etiqueta: 'Cajas vendidas', valor: cajas(tot.cajas) },
            { etiqueta: 'Ventas netas', valor: money(tot.ventas), color: 'verde' },
            { etiqueta: 'Comisión', valor: money(tot.comision) },
        ],
        columnas: [
            { clave: 'lab', titulo: 'Laboratorio / producto', ancho: 0 },
            { clave: 'cod', titulo: 'Código', ancho: 62, opcional: true },
            { clave: 'cant', titulo: 'Cajas', ancho: 56, derecha: true },
            { clave: 'venta', titulo: 'Ventas netas', ancho: 84, derecha: true },
            { clave: 'tarifa', titulo: 'S/ x caja', ancho: 60, derecha: true },
            { clave: 'com', titulo: 'Comisión', ancho: 72, derecha: true, negrita: true },
        ],
        filas: labs.flatMap(l => [
            { valores: { lab: l.laboratorio, cant: cajas(l.cajas), venta: money(l.ventasNetas), com: l.comision ? money(l.comision) : '' },
              colores: { lab: 'tema', com: 'verde' } },
            ...l.productos.map(p => ({
                valores: { lab: `    ${p.producto}`, cod: p.codigo, cant: `${cajas(p.cantidad)} ${p.unidad?.toLowerCase() ?? ''}`, venta: money(p.ventasNetas),
                           tarifa: p.tarifaCaja != null ? money(p.tarifaCaja) : '-', com: money(comisionDe(p)) },
                colores: { cod: 'gris', tarifa: 'gris', com: 'verde' } as const,
            })),
        ]),
        totales: { lab: 'Totales', cant: cajas(tot.cajas), venta: money(tot.ventas), com: money(tot.comision) },
        pie: `Comisión de ventas global ${periodoTxt}`,
    } as ReportePdf), [datos, labs, tot, periodoTxt, libro])

    return (
        <div className="grid grid-cols-1 gap-5">
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
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground">Producto</Label>
                            <Input className="h-10" value={producto} onChange={e => setProducto(e.target.value)} placeholder="Código o nombre (todos)" />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground">Cliente</Label>
                            <Input className="h-10" value={cliente} onChange={e => setCliente(e.target.value)} placeholder="RUC o razón social (todos)" />
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
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /><span>{error}</span>
                </div>
            )}

            {!datos && !error && (
                <Card className="shadow-sm">
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <FlaskConical className="h-12 w-12 mb-3 opacity-20" />
                        <p className="text-sm font-medium">Selecciona el periodo y genera la vista global por laboratorio</p>
                    </div>
                </Card>
            )}

            {datos && (
                <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1.1fr]">
                        {/* Referencia contra el Libro de Ventas (en el papel: "Ref. L.V. … Fact − N/C") */}
                        <div className="rounded-xl bg-gradient-to-br from-blue-900 to-blue-600 p-4 text-white shadow-sm sm:col-span-2 xl:col-span-1">
                            <p className="text-[11px] uppercase tracking-wide text-blue-200">Referencia · Libro de ventas</p>
                            <p className="mt-1.5 font-mono text-xl font-bold">{money(libro)}</p>
                            <p className="text-xs text-blue-100">
                                Fact./Bol. {money(datos.referencia.ventas)} − N/C {money(datos.referencia.notasCredito)}
                            </p>
                            {filtrado ? (
                                <p className="mt-1.5 text-[11px] text-blue-100">Libro completo del mes (no aplica los filtros)</p>
                            ) : (
                                <p className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cuadra ? 'bg-emerald-400/20 text-emerald-100' : 'bg-amber-400/20 text-amber-100'}`}
                                   title="Ventas del kardex que usa la comisión menos el Libro de Ventas (Fact − N/C)">
                                    <BadgeCheck className="h-3.5 w-3.5" /> {cuadra ? 'Cuadra con el detalle por laboratorio' : `Kardex − libro: ${money(diferencia)}`}
                                </p>
                            )}
                        </div>
                        <KpiCard etiqueta="Laboratorios" icono={FlaskConical} iconoCls="bg-muted text-muted-foreground">
                            <p className="mt-1 font-mono text-lg font-bold sm:text-xl">{tot.labs}</p>
                            <p className="text-xs text-muted-foreground">{tot.productos} productos vendidos</p>
                        </KpiCard>
                        <KpiCard etiqueta="Cajas vendidas" icono={Boxes} iconoCls="bg-violet-50 text-violet-600 dark:bg-violet-950">
                            <p className="mt-1 font-mono text-lg font-bold sm:text-xl text-violet-700 dark:text-violet-400">{cajas(tot.cajas)}</p>
                            <p className="text-xs text-muted-foreground">Unidades de venta del mes</p>
                        </KpiCard>
                        <KpiCard etiqueta="Ventas netas" icono={Receipt} iconoCls="bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
                            <p className="mt-1 font-mono text-lg font-bold sm:text-xl text-emerald-700 dark:text-emerald-400">{money(tot.ventas)}</p>
                            <p className="text-xs text-muted-foreground">Sin lo vendido por rep. de laboratorio</p>
                        </KpiCard>
                        <KpiCard etiqueta="Comisión" icono={Percent} iconoCls="bg-blue-100 text-blue-700 dark:bg-blue-950"
                                 className="border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/40">
                            <p className="mt-1 font-mono text-lg font-bold sm:text-xl text-blue-700 dark:text-blue-400">{money(tot.comision)}</p>
                            <p className="text-xs text-muted-foreground">Ventas netas × tasa del vendedor</p>
                        </KpiCard>
                    </div>

                    <Card className="overflow-hidden shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                            <div>
                                <h2 className="text-sm font-semibold">Global por laboratorio</h2>
                                <p className="text-xs text-muted-foreground">Haz clic en un laboratorio para ver sus productos, cajas y comisión por caja.</p>
                            </div>
                            {pdf && (
                                <ExportComisionPdf reporte={pdf} tituloDefecto="COMISIÓN DE VENTAS - GLOBAL POR LABORATORIO"
                                                   archivoDefecto={`comision-ventas-laboratorios-${datos.periodo.anio}-${datos.periodo.mes}`}
                                                   descripcion={`Global por laboratorio · ${periodoTxt}`}
                                                   columnasFijas="Laboratorio/producto, cajas, ventas, S/ x caja y comisión siempre se incluyen." />
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-xs border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-b from-muted/60 to-muted">
                                        <Th>Laboratorio</Th>
                                        <Th right>Productos</Th>
                                        <Th right>Cajas</Th>
                                        <Th right>Ventas netas</Th>
                                        <Th>Participación</Th>
                                        <Th right>Comisión</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {labs.map(l => {
                                        const abierto = abiertos.has(l.idLaboratorio)
                                        return (
                                            <LabFilas key={l.idLaboratorio} lab={l} abierto={abierto} onClick={() => alternar(l.idLaboratorio)}
                                                      pctVentas={tot.ventas ? (l.ventasNetas / tot.ventas) * 100 : 0} anchoBarra={(l.ventasNetas / maxVentas) * 100} />
                                        )
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-blue-200 bg-blue-50/60 font-bold dark:border-blue-900 dark:bg-blue-950/30">
                                        <td className="py-2.5 px-3">Totales · {tot.labs} laboratorios</td>
                                        <td className="py-2.5 px-3 text-right">{tot.productos}</td>
                                        <td className="py-2.5 px-3 text-right font-mono">{cajas(tot.cajas)}</td>
                                        <td className="py-2.5 px-3 text-right font-mono">{money(tot.ventas)}</td>
                                        <td />
                                        <td className="py-2.5 px-3 text-right font-mono text-blue-700 dark:text-blue-400">{money(tot.comision)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <div className="flex items-start gap-2 px-4 py-3 border-t border-border bg-muted/40 text-xs text-muted-foreground">
                            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <span>Comisión por producto = ventas netas × tasa del vendedor que hizo la venta (hoy 2 %). El incentivo
                                <b> S/ por caja</b> (reemplaza al 2 % en un rango de fechas) está <b>pendiente</b>. Usa los mismos
                                movimientos que la comisión por vendedor; puede diferir en céntimos porque aquí se redondea por producto.
                                Hoja en blanco, bonificaciones y donaciones: <b>por definir</b>.</span>
                        </div>
                    </Card>
                </>
            )}
        </div>
    )
}

function LabFilas({ lab: l, abierto, onClick, pctVentas, anchoBarra }: {
    lab: Lab; abierto: boolean; onClick: () => void; pctVentas: number; anchoBarra: number
}) {
    return (
        <>
            <tr onClick={onClick} className={`cursor-pointer border-b border-border hover:bg-muted/60 ${abierto ? 'bg-blue-50/70 dark:bg-blue-950/30' : 'even:bg-muted/20'}`}>
                <td className={`py-2.5 px-3 ${abierto ? 'shadow-[inset_3px_0_0_#2563eb]' : ''}`}>
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                        <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${abierto ? 'rotate-90 text-blue-600' : ''}`} />
                        <FlaskConical className="h-3.5 w-3.5 text-blue-600" />
                        {l.laboratorio}
                    </span>
                    {l.conTarifa > 0 && (
                        <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            {l.conTarifa} con S/ x caja
                        </span>
                    )}
                </td>
                <td className="py-2.5 px-3 text-right text-muted-foreground">{l.productos.length}</td>
                <td className="py-2.5 px-3 text-right font-mono">{cajas(l.cajas)}</td>
                <td className="py-2.5 px-3 text-right font-mono font-semibold">{money(l.ventasNetas)}</td>
                <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                            <div className="h-full bg-blue-500/70" style={{ width: `${anchoBarra}%` }} />
                        </div>
                        <span className="text-[11px] text-muted-foreground">{pctVentas.toFixed(1)} %</span>
                    </div>
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {l.comision ? money(l.comision) : <span className="font-normal text-muted-foreground/50">—</span>}
                </td>
            </tr>
            {abierto && (
                <tr className="border-b border-border bg-blue-50/30 dark:bg-blue-950/10">
                    <td colSpan={6} className="px-4 py-3">
                        <div className="overflow-hidden rounded-lg border bg-background">
                            <table className="w-full table-fixed text-[11px]">
                                <thead>
                                    <tr className="bg-muted/40 text-muted-foreground">
                                        <th className="w-28 px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider">Código</th>
                                        <th className="px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider">Producto</th>
                                        <th className="w-28 px-3 py-1.5 text-right text-[10px] font-semibold uppercase tracking-wider">Cajas</th>
                                        <th className="w-32 px-3 py-1.5 text-right text-[10px] font-semibold uppercase tracking-wider">Ventas netas</th>
                                        <th className="w-28 px-3 py-1.5 text-right text-[10px] font-semibold uppercase tracking-wider">S/ x caja</th>
                                        <th className="w-32 px-3 py-1.5 text-right text-[10px] font-semibold uppercase tracking-wider">Comisión</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {l.productos.map(p => (
                                        <tr key={p.codigo} className="border-t border-border/60">
                                            <td className="px-3 py-1.5 font-mono text-muted-foreground">{p.codigo}</td>
                                            <td className="truncate px-3 py-1.5" title={p.producto}>
                                                <Package className="mr-1.5 inline h-3 w-3 text-muted-foreground" />{p.producto}
                                            </td>
                                            <td className="px-3 py-1.5 text-right">{cajas(p.cantidad)} <span className="text-muted-foreground">{p.unidad?.toLowerCase()}</span></td>
                                            <td className="px-3 py-1.5 text-right font-mono">{money(p.ventasNetas)}</td>
                                            <td className="px-3 py-1.5 text-right font-mono text-muted-foreground">{p.tarifaCaja != null ? money(p.tarifaCaja) : '—'}</td>
                                            <td className="px-3 py-1.5 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                                                {money(comisionDe(p))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t bg-muted/40 font-semibold">
                                        <td className="px-3 py-1.5" colSpan={2}>Total {l.laboratorio}</td>
                                        <td className="px-3 py-1.5 text-right">{cajas(l.cajas)}</td>
                                        <td className="px-3 py-1.5 text-right font-mono">{money(l.ventasNetas)}</td>
                                        <td />
                                        <td className="px-3 py-1.5 text-right font-mono text-blue-700 dark:text-blue-400">{l.comision ? money(l.comision) : '—'}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </td>
                </tr>
            )}
        </>
    )
}
