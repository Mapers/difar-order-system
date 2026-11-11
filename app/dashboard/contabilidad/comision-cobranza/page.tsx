'use client'

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ComboSelect } from "@/components/ui/combo-select"
import {
    Loader2, Search, BadgePercent, AlertCircle, CalendarDays, Wallet, CheckCircle2, Clock, Percent, X, Users, Layers,
} from "lucide-react"
import { toast } from "@/app/hooks/useToast"
import { ComisionesService } from "@/app/services/comisiones/ComisionesService"
import {
    ComboItem, ComisionCobranzaDetalle, ComisionCobranzaFila, ComisionCobranzaResumen, EscalaCobranza, nombreMes,
} from "@/app/types/comisiones-types"
import { ExportComisionPdf } from "@/components/contabilidad/comisiones/ExportComisionPdf"
import { ColorCelda, ReportePdf } from "@/components/contabilidad/comisiones/pdfComision"
import { fechaDMY, KpiCard, money, pct, SelectorPeriodo, Th } from "@/components/contabilidad/comisiones/ui"

const TODOS: ComboItem = { valor: '', texto: 'Todos los vendedores' }

// Colores por tramo: 1 verde, 2 azul, 3 ámbar, otros violeta, fuera de plazo rojo.
const TRAMO = {
    1: { barra: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', borde: '#6ee7b7', pdf: 'verde' as ColorCelda },
    2: { barra: 'bg-sky-500', chip: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300', borde: '#7dd3fc', pdf: 'tema' as ColorCelda },
    3: { barra: 'bg-amber-500', chip: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', borde: '#fcd34d', pdf: 'ambar' as ColorCelda },
    4: { barra: 'bg-violet-500', chip: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300', borde: '#c4b5fd', pdf: 'tema' as ColorCelda },
    0: { barra: 'bg-red-400', chip: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300', borde: '#fca5a5', pdf: 'rojo' as ColorCelda },
} as const
const estiloTramo = (t: number) => TRAMO[(t >= 4 ? 4 : t) as 0 | 1 | 2 | 3 | 4]

export default function ComisionCobranzaPage() {
    const hoy = new Date()
    const [anio, setAnio] = useState(String(hoy.getFullYear()))
    const [mes, setMes] = useState(String(hoy.getMonth() + 1).padStart(2, '0'))
    const [vendedor, setVendedor] = useState('')
    const [vendedores, setVendedores] = useState<ComboItem[]>([TODOS])
    const [escalas, setEscalas] = useState<EscalaCobranza[]>([])

    const [resumen, setResumen] = useState<ComisionCobranzaResumen | null>(null)
    const [generando, setGenerando] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [seleccion, setSeleccion] = useState<ComisionCobranzaFila | null>(null)
    const [detalle, setDetalle] = useState<ComisionCobranzaDetalle | null>(null)
    const [cargandoDetalle, setCargandoDetalle] = useState(false)
    const [filtroTramo, setFiltroTramo] = useState<number | null>(null)

    useEffect(() => {
        ComisionesService.vendedores().then(v => setVendedores([TODOS, ...v])).catch(() => {})
        ComisionesService.escalas().then(setEscalas).catch(() => {})
    }, [])

    // Escala de la web que aplica al periodo elegido (la que tiene fecha de inicio y final).
    const escala = useMemo(() => {
        const ini = `${anio}-${mes}-01`
        return escalas.find(e => e.usa_web && e.fec_final && e.fec_inicio.slice(0, 10) <= ini && e.fec_final.slice(0, 10) >= ini) ?? null
    }, [escalas, anio, mes])

    const generar = useCallback(async () => {
        setGenerando(true)
        setError(null)
        setSeleccion(null)
        setDetalle(null)
        try {
            setResumen(await ComisionesService.cobranzaResumen(anio, mes, vendedor))
        } catch (e: any) {
            setResumen(null)
            setError(e?.response?.data?.message || "No se pudo generar el reporte.")
        } finally {
            setGenerando(false)
        }
    }, [anio, mes, vendedor])

    const verDetalle = async (fila: ComisionCobranzaFila) => {
        if (seleccion?.Codigo_Vend === fila.Codigo_Vend) { setSeleccion(null); setDetalle(null); return }
        setSeleccion(fila)
        setDetalle(null)
        setFiltroTramo(null)
        setCargandoDetalle(true)
        try {
            setDetalle(await ComisionesService.cobranzaDetalle(resumen!.periodo.anio, resumen!.periodo.mes, fila.Codigo_Vend))
        } catch (e: any) {
            toast({ title: "Error", description: e?.response?.data?.message || "No se pudo cargar el detalle.", variant: "destructive" })
        } finally {
            setCargandoDetalle(false)
        }
    }

    const t = resumen?.totales
    const periodoTxt = resumen ? `${nombreMes(resumen.periodo.mes)} ${resumen.periodo.anio}` : ''
    const dentro = t ? t.cobranza - t.cobranzaFueraDePlazo : 0
    const tramosEscala = escala?.tramos ?? []
    const etiquetaTramo = (n: number, ascii = false) => {
        if (n === 0) return `> ${tramosEscala.at(-1)?.hasta ?? 30} d`
        const tr = tramosEscala.find(x => x.tramo === n)
        if (!tr) return `Tramo ${n}`
        return tr.desde == null ? `${ascii ? '<=' : '≤'} ${tr.hasta} d` : `${tr.desde}${ascii ? '-' : '–'}${tr.hasta} d`
    }
    const filasDetalle = detalle?.filas.filter(d => filtroTramo === null || d.Tramo === filtroTramo) ?? []

    const pdfResumen = useMemo<ReportePdf | null>(() => resumen && ({
        recuadroTitulo: 'Comisión de cobranza por vendedor',
        recuadroDetalle: `${periodoTxt}  ·  Días contados desde el vencimiento  ·  ` +
            (tramosEscala.length ? tramosEscala.map(x => `${x.desde == null ? '<=' + x.hasta : x.desde + '-' + x.hasta} d: ${x.porcentaje}%`).join('  ·  ') + `  ·  > ${tramosEscala.at(-1)!.hasta} d: 0%` : ''),
        periodo: `${periodoTxt} · Soles`,
        tarjetas: [
            { etiqueta: 'Cobranza del mes', valor: `${money(resumen.totales.cobranza)}` },
            { etiqueta: 'Dentro de plazo', valor: `${money(resumen.totales.cobranza - resumen.totales.cobranzaFueraDePlazo)}`, color: 'verde' },
            { etiqueta: 'Fuera de plazo', valor: `${money(resumen.totales.cobranzaFueraDePlazo)}`, color: 'rojo' },
            { etiqueta: 'Comisión total', valor: `${money(resumen.totales.comision)}` },
        ],
        columnas: [
            { clave: 'cod', titulo: 'Código', ancho: 44, negrita: true },
            { clave: 'vend', titulo: 'Vendedor', ancho: 0 },
            { clave: 'cobros', titulo: 'Cobros', ancho: 40, derecha: true, opcional: true },
            { clave: 'cob', titulo: 'Cobranza', ancho: 72, derecha: true },
            { clave: 't1', titulo: etiquetaTramo(1, true), ancho: 66, derecha: true },
            { clave: 't2', titulo: etiquetaTramo(2, true), ancho: 66, derecha: true },
            { clave: 't3', titulo: etiquetaTramo(3, true), ancho: 66, derecha: true },
            { clave: 'fuera', titulo: etiquetaTramo(0, true), ancho: 66, derecha: true },
            { clave: 'dias', titulo: 'Prom. días', ancho: 48, derecha: true, opcional: true },
            { clave: 'com', titulo: 'Comisión', ancho: 64, derecha: true, negrita: true },
        ],
        filas: resumen.filas.map(f => ({
            valores: {
                cod: f.Codigo_Vend, vend: f.Vendedor + (f.TasaVendedor ? '' : ' (no cobra comisión)'), cobros: String(f.Cobros),
                cob: money(f.Cobranza), t1: money(f.CobranzaTramo1), t2: money(f.CobranzaTramo2), t3: money(f.CobranzaTramo3),
                fuera: money(f.CobranzaFueraDePlazo), dias: String(f.PromedioDiasVencido ?? ''), com: money(f.Comision),
            },
            colores: { t1: 'verde', t2: 'tema', t3: 'ambar', fuera: 'rojo', com: f.Comision ? 'verde' : 'gris', dias: 'gris', cobros: 'gris' },
        })),
        totales: {
            vend: 'Totales', cobros: String(resumen.totales.cobros), cob: money(resumen.totales.cobranza),
            t1: money(resumen.totales.cobranzaTramo1), t2: money(resumen.totales.cobranzaTramo2), t3: money(resumen.totales.cobranzaTramo3),
            fuera: money(resumen.totales.cobranzaFueraDePlazo), com: money(resumen.totales.comision),
        },
        pie: `Comisión de cobranza ${periodoTxt}`,
    }), [resumen, periodoTxt, tramosEscala])

    const pdfDetalle = useMemo<ReportePdf | null>(() => detalle && seleccion && ({
        recuadroTitulo: `${seleccion.Codigo_Vend} · ${seleccion.Vendedor}`,
        recuadroDetalle: `${periodoTxt}  ·  ${detalle.filas.length} cobros  ·  Días vencido = fecha de cobro - vencimiento del comprobante`,
        periodo: `${periodoTxt} · Soles`,
        tarjetas: [
            { etiqueta: 'Cobros', valor: String(detalle.totales.cobros) },
            { etiqueta: 'Cobranza', valor: `${money(detalle.totales.cobranza)}` },
            { etiqueta: 'Valor venta (sin IGV)', valor: `${money(detalle.totales.valorVenta)}`, color: 'verde' },
            { etiqueta: 'Comisión', valor: `${money(detalle.totales.comision)}` },
        ],
        columnas: [
            { clave: 'fcob', titulo: 'F. cobro', ancho: 50 },
            { clave: 'plla', titulo: 'Planilla', ancho: 42, opcional: true },
            { clave: 'doc', titulo: 'Comprobante', ancho: 74, negrita: true },
            { clave: 'cli', titulo: 'Cliente', ancho: 0 },
            { clave: 'cond', titulo: 'Cond.', ancho: 36, derecha: true, opcional: true },
            { clave: 'vcto', titulo: 'Vencimiento', ancho: 54 },
            { clave: 'dv', titulo: 'Días venc.', ancho: 44, derecha: true },
            { clave: 'cob', titulo: 'Cobrado', ancho: 62, derecha: true },
            { clave: 'vv', titulo: 'Valor venta', ancho: 62, derecha: true, opcional: true },
            { clave: 'tasa', titulo: 'Tasa', ancho: 40, derecha: true },
            { clave: 'com', titulo: 'Comisión', ancho: 54, derecha: true, negrita: true },
        ],
        filas: detalle.filas.map(d => ({
            valores: {
                fcob: fechaDMY(d.Fecha_Amortizacion), plla: d.NroPlanilla ?? '', doc: `${d.Tipo_Doc} ${d.SerieDoc}-${d.NumeroDoc}`,
                cli: d.Cliente, cond: `${d.PlazoCondicion} d`, vcto: fechaDMY(d.Fecha_Vcto), dv: String(d.DiasVencido),
                cob: money(d.Amortizacion), vv: money(d.ImporteVV), tasa: pct(d.TasaPorcentaje), com: money(d.Comision),
            },
            colores: { dv: estiloTramo(d.Tramo).pdf, com: d.Comision ? 'verde' : 'gris', tasa: 'gris', plla: 'gris', cond: 'gris' },
        })),
        totales: { cli: 'Totales', cob: money(detalle.totales.cobranza), vv: money(detalle.totales.valorVenta), com: money(detalle.totales.comision) },
        pie: `Comisión de cobranza ${seleccion.Codigo_Vend} ${periodoTxt}`,
    }), [detalle, seleccion, periodoTxt])

    return (
        <div className="grid grid-cols-1 gap-5 p-4 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/30">
                        <BadgePercent className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Comisión de Cobranza</h1>
                        <p className="text-sm md:text-base text-muted-foreground">
                            Comisión por vendedor según los días de atraso respecto al vencimiento del comprobante (condición de pago del cliente).
                        </p>
                    </div>
                </div>
                {resumen && (
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

                    {/* Escala vigente del periodo (solo consulta; se carga por script) */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3 text-xs">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground">
                            <Layers className="h-3.5 w-3.5" /> Escala del periodo:
                        </span>
                        {escala ? (
                            <>
                                {escala.tramos.map(x => (
                                    <span key={x.tramo} className={`rounded-full px-2.5 py-1 font-semibold ${estiloTramo(x.tramo).chip}`}>
                                        {x.desde == null ? `Hasta ${x.hasta} días` : `${x.desde} a ${x.hasta} días`}: {x.porcentaje} %
                                    </span>
                                ))}
                                <span className={`rounded-full px-2.5 py-1 font-semibold ${TRAMO[0].chip}`}>
                                    Más de {escala.tramos.at(-1)?.hasta} días: sin comisión
                                </span>
                                <span className="text-muted-foreground">
                                    · vigente {fechaDMY(escala.fec_inicio)} al {fechaDMY(escala.fec_final)}
                                </span>
                            </>
                        ) : (
                            <span className="text-amber-700 dark:text-amber-400">No hay escala registrada para este periodo.</span>
                        )}
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
                        <BadgePercent className="h-12 w-12 mb-3 opacity-20" />
                        <p className="text-sm font-medium">Selecciona el periodo y genera el reporte</p>
                    </div>
                </Card>
            )}

            {resumen && t && (
                <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1.1fr]">
                        <div className="rounded-xl bg-gradient-to-br from-blue-900 to-blue-600 p-4 text-white shadow-sm sm:col-span-2 xl:col-span-1">
                            <p className="text-[11px] uppercase tracking-wide text-blue-200">Comisión de cobranza</p>
                            <p className="mt-1.5 text-lg font-bold">{periodoTxt}</p>
                            <p className="text-sm text-blue-100">{t.cobros} cobro{t.cobros !== 1 ? 's' : ''} · {resumen.filas.length} vendedor{resumen.filas.length !== 1 ? 'es' : ''}</p>
                            <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-white/20">
                                {[1, 2, 3].map(n => {
                                    const v = n === 1 ? t.cobranzaTramo1 : n === 2 ? t.cobranzaTramo2 : t.cobranzaTramo3
                                    return <div key={n} className={`h-full ${estiloTramo(n).barra}`} style={{ width: `${t.cobranza ? (v / t.cobranza) * 100 : 0}%` }} />
                                })}
                                <div className="h-full bg-red-400" style={{ width: `${t.cobranza ? (t.cobranzaFueraDePlazo / t.cobranza) * 100 : 0}%` }} />
                            </div>
                        </div>
                        <KpiCard etiqueta="Cobranza del mes" icono={Wallet} iconoCls="bg-muted text-muted-foreground">
                            <p className="mt-1 font-mono text-lg font-bold sm:text-xl">{money(t.cobranza)}</p>
                            <p className="text-xs text-muted-foreground">{t.cobros} cobros en efectivo / depósito</p>
                        </KpiCard>
                        <KpiCard etiqueta="Dentro de plazo" icono={CheckCircle2} iconoCls="bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
                            <p className="mt-1 font-mono text-lg font-bold sm:text-xl text-emerald-700 dark:text-emerald-400">{money(dentro)}</p>
                            <p className="text-xs text-muted-foreground">{t.cobranza ? ((dentro / t.cobranza) * 100).toFixed(1) : '0.0'} % · genera comisión</p>
                        </KpiCard>
                        <KpiCard etiqueta="Fuera de plazo" icono={Clock} iconoCls="bg-red-50 text-red-600 dark:bg-red-950">
                            <p className="mt-1 font-mono text-lg font-bold sm:text-xl text-red-700 dark:text-red-400">{money(t.cobranzaFueraDePlazo)}</p>
                            <p className="text-xs text-muted-foreground">{t.cobranza ? ((t.cobranzaFueraDePlazo / t.cobranza) * 100).toFixed(1) : '0.0'} % · sin comisión</p>
                        </KpiCard>
                        <KpiCard etiqueta="Comisión total" icono={Percent} iconoCls="bg-blue-100 text-blue-700 dark:bg-blue-950"
                                 className="border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/40">
                            <p className="mt-1 font-mono text-lg font-bold sm:text-xl text-blue-700 dark:text-blue-400">{money(t.comision)}</p>
                            <p className="text-xs text-muted-foreground">Sobre el valor venta (sin IGV)</p>
                        </KpiCard>
                    </div>

                    <Card className="overflow-hidden shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                            <div>
                                <h2 className="text-sm font-semibold">Comisión por vendedor</h2>
                                <p className="text-xs text-muted-foreground">Cobranza del mes por tramo de atraso. Haz clic en un vendedor para ver sus cobros.</p>
                            </div>
                            {pdfResumen && (
                                <ExportComisionPdf reporte={pdfResumen} tituloDefecto="COMISIÓN DE COBRANZA POR VENDEDOR"
                                                   archivoDefecto={`comision-cobranza-${resumen.periodo.anio}-${resumen.periodo.mes}`}
                                                   descripcion={`Comisión de cobranza · ${periodoTxt}`}
                                                   columnasFijas="Código, vendedor, cobranza, tramos y comisión siempre se incluyen." />
                            )}
                        </div>
                        <div className="overflow-auto">
                            <table className="w-full min-w-[980px] text-xs border-collapse">
                                <thead>
                                    <tr className="sticky top-0 z-10 bg-gradient-to-b from-muted/60 to-muted">
                                        <Th>Código</Th>
                                        <Th>Vendedor</Th>
                                        <Th right>Cobros</Th>
                                        <Th right>Cobranza</Th>
                                        <Th right className="!text-emerald-700 dark:!text-emerald-400">{etiquetaTramo(1)}</Th>
                                        <Th right className="!text-sky-700 dark:!text-sky-400">{etiquetaTramo(2)}</Th>
                                        <Th right className="!text-amber-700 dark:!text-amber-400">{etiquetaTramo(3)}</Th>
                                        <Th right className="!text-red-700 dark:!text-red-400">{etiquetaTramo(0)}</Th>
                                        <Th right>Prom. días</Th>
                                        <Th right>Comisión</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resumen.filas.length === 0 ? (
                                        <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">Sin cobranza en el período</td></tr>
                                    ) : resumen.filas.map(f => {
                                        const activo = seleccion?.Codigo_Vend === f.Codigo_Vend
                                        const partes = [f.CobranzaTramo1, f.CobranzaTramo2, f.CobranzaTramo3, f.CobranzaOtrosTramos, f.CobranzaFueraDePlazo]
                                        const estilos = [estiloTramo(1), estiloTramo(2), estiloTramo(3), estiloTramo(4), estiloTramo(0)]
                                        return (
                                            <tr key={f.Codigo_Vend} onClick={() => verDetalle(f)}
                                                className={`cursor-pointer border-b border-border even:bg-muted/20 hover:bg-muted/60 ${activo ? '!bg-blue-50 dark:!bg-blue-950/40' : ''}`}>
                                                <td className={`py-2 px-3 font-mono font-semibold ${activo ? 'shadow-[inset_3px_0_0_#2563eb]' : ''}`}>{f.Codigo_Vend}</td>
                                                <td className="py-2 px-3">
                                                    <p className="font-medium">
                                                        {f.Vendedor}
                                                        {!f.TasaVendedor && (
                                                            <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800">no cobra comisión</span>
                                                        )}
                                                    </p>
                                                    <div className="mt-1 flex h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-muted">
                                                        {partes.map((v, i) => (
                                                            <div key={i} className={`h-full ${estilos[i].barra}`} style={{ width: `${f.Cobranza ? (v / f.Cobranza) * 100 : 0}%` }} />
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-2 px-3 text-right text-muted-foreground">{f.Cobros}</td>
                                                <td className="py-2 px-3 text-right font-mono font-semibold">{money(f.Cobranza)}</td>
                                                <CeldaTramo v={f.CobranzaTramo1} cls="text-emerald-700 dark:text-emerald-400" />
                                                <CeldaTramo v={f.CobranzaTramo2} cls="text-sky-700 dark:text-sky-400" />
                                                <CeldaTramo v={f.CobranzaTramo3} cls="text-amber-700 dark:text-amber-400" />
                                                <CeldaTramo v={f.CobranzaFueraDePlazo} cls="text-red-700 dark:text-red-400" />
                                                <td className="py-2 px-3 text-right text-muted-foreground">{f.PromedioDiasVencido}</td>
                                                <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                                    {f.Comision ? money(f.Comision) : <span className="text-muted-foreground/50">{money(0)}</span>}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                {resumen.filas.length > 0 && (
                                    <tfoot>
                                        <tr className="border-t-2 border-blue-200 bg-blue-50/60 font-bold dark:border-blue-900 dark:bg-blue-950/30">
                                            <td className="py-2.5 px-3" colSpan={2}>Totales</td>
                                            <td className="py-2.5 px-3 text-right">{t.cobros}</td>
                                            <td className="py-2.5 px-3 text-right font-mono">{money(t.cobranza)}</td>
                                            <td className="py-2.5 px-3 text-right font-mono text-emerald-700 dark:text-emerald-400">{money(t.cobranzaTramo1)}</td>
                                            <td className="py-2.5 px-3 text-right font-mono text-sky-700 dark:text-sky-400">{money(t.cobranzaTramo2)}</td>
                                            <td className="py-2.5 px-3 text-right font-mono text-amber-700 dark:text-amber-400">{money(t.cobranzaTramo3)}</td>
                                            <td className="py-2.5 px-3 text-right font-mono text-red-700 dark:text-red-400">{money(t.cobranzaFueraDePlazo)}</td>
                                            <td />
                                            <td className="py-2.5 px-3 text-right font-mono text-blue-700 dark:text-blue-400">{money(t.comision)}</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                        <div className="px-4 py-3 border-t border-border bg-muted/40 text-xs text-muted-foreground">
                            {resumen.filas.length} vendedor{resumen.filas.length !== 1 ? 'es' : ''} · Comisión = valor venta (sin IGV) × porcentaje del tramo · un cobro por fila (sin duplicar planillas)
                        </div>
                    </Card>

                    {seleccion && (
                        <Card className="overflow-hidden shadow-sm border-blue-200 dark:border-blue-900">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-blue-50/50 px-4 py-3 dark:bg-blue-950/20">
                                <div>
                                    <h2 className="text-sm font-semibold">Cobros de {seleccion.Codigo_Vend} · {seleccion.Vendedor}</h2>
                                    <p className="text-xs text-muted-foreground">{periodoTxt} · comisión {money(seleccion.Comision)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {pdfDetalle && (
                                        <ExportComisionPdf reporte={pdfDetalle} tituloDefecto="COMISIÓN DE COBRANZA - DETALLE DE COBROS"
                                                           archivoDefecto={`comision-cobranza-${seleccion.Codigo_Vend}-${resumen.periodo.anio}-${resumen.periodo.mes}`}
                                                           descripcion={`${seleccion.Codigo_Vend} · ${periodoTxt}`}
                                                           columnasFijas="Fecha de cobro, comprobante, cliente, vencimiento, días, cobrado, tasa y comisión siempre se incluyen." />
                                    )}
                                    <Button variant="ghost" size="icon" title="Cerrar detalle" onClick={() => { setSeleccion(null); setDetalle(null) }}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            {cargandoDetalle ? (
                                <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando cobros…
                                </div>
                            ) : detalle && (
                                <>
                                    <div className="flex flex-wrap gap-1.5 border-b px-4 py-2.5">
                                        <FiltroChip activo={filtroTramo === null} onClick={() => setFiltroTramo(null)} cls="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                            Todos ({detalle.filas.length})
                                        </FiltroChip>
                                        {[1, 2, 3, 0].map(n => (
                                            <FiltroChip key={n} activo={filtroTramo === n} onClick={() => setFiltroTramo(filtroTramo === n ? null : n)} cls={estiloTramo(n).chip}>
                                                {etiquetaTramo(n)} ({detalle.totales.porTramo[n] ?? 0})
                                            </FiltroChip>
                                        ))}
                                    </div>
                                    <div className="max-h-[520px] overflow-auto">
                                        <table className="w-full min-w-[1100px] text-xs border-collapse">
                                            <thead>
                                                <tr className="sticky top-0 z-10 bg-gradient-to-b from-muted/60 to-muted">
                                                    <Th>F. cobro</Th>
                                                    <Th>Planilla</Th>
                                                    <Th>Comprobante</Th>
                                                    <Th>Cliente</Th>
                                                    <Th right>Condición</Th>
                                                    <Th>Vencimiento</Th>
                                                    <Th right>Días venc.</Th>
                                                    <Th right>Cobrado</Th>
                                                    <Th right>Valor venta</Th>
                                                    <Th right>Tasa</Th>
                                                    <Th right>Comisión</Th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filasDetalle.length === 0 ? (
                                                    <tr><td colSpan={11} className="text-center py-10 text-muted-foreground">Sin cobros en este tramo</td></tr>
                                                ) : filasDetalle.map((d, i) => {
                                                    const e = estiloTramo(d.Tramo)
                                                    return (
                                                        <tr key={`${d.SerieDoc}-${d.NumeroDoc}-${i}`} className="border-b border-border even:bg-muted/20 hover:bg-muted/60">
                                                            <td className="py-2 px-3 whitespace-nowrap font-mono" style={{ boxShadow: `inset 3px 0 0 ${e.borde}` }}>{fechaDMY(d.Fecha_Amortizacion)}</td>
                                                            <td className="py-2 px-3 font-mono text-muted-foreground">{d.NroPlanilla ?? '—'}</td>
                                                            <td className="py-2 px-3 whitespace-nowrap">
                                                                <span className="mr-1.5 inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{d.Tipo_Doc}</span>
                                                                <span className="font-mono text-[11px]">{d.SerieDoc}-{d.NumeroDoc}</span>
                                                            </td>
                                                            <td className="py-2 px-3">{d.Cliente}</td>
                                                            <td className="py-2 px-3 text-right text-muted-foreground">{d.PlazoCondicion} d</td>
                                                            <td className="py-2 px-3 whitespace-nowrap font-mono">{fechaDMY(d.Fecha_Vcto)}</td>
                                                            <td className="py-2 px-3 text-right">
                                                                <span className={`inline-flex min-w-[2.5rem] justify-center rounded-md px-1.5 py-0.5 text-[11px] font-bold ${e.chip}`}>{d.DiasVencido}</span>
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-mono font-semibold">{money(d.Amortizacion)}</td>
                                                            <td className="py-2 px-3 text-right font-mono text-muted-foreground">{money(d.ImporteVV)}</td>
                                                            <td className="py-2 px-3 text-right">{pct(d.TasaPorcentaje)}</td>
                                                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                                                {d.Comision ? money(d.Comision) : <span className="text-muted-foreground/50">{money(0)}</span>}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex flex-wrap justify-between gap-2 px-4 py-3 border-t border-border bg-muted/40 text-xs text-muted-foreground">
                                        <span>{filasDetalle.length} de {detalle.filas.length} cobros</span>
                                        <span>
                                            Cobrado <b className="font-mono text-foreground">{money(detalle.totales.cobranza)}</b> · valor venta <b className="font-mono text-foreground">{money(detalle.totales.valorVenta)}</b> · comisión <b className="font-mono text-blue-700 dark:text-blue-400">{money(detalle.totales.comision)}</b>
                                        </span>
                                    </div>
                                </>
                            )}
                        </Card>
                    )}
                </>
            )}
        </div>
    )
}

function CeldaTramo({ v, cls }: { v: number; cls: string }) {
    return (
        <td className={`py-2 px-3 text-right font-mono ${v ? cls : ''}`}>
            {v ? money(v) : <span className="text-muted-foreground/50">—</span>}
        </td>
    )
}

function FiltroChip({ activo, onClick, cls, children }: { activo: boolean; onClick: () => void; cls: string; children: React.ReactNode }) {
    return (
        <button type="button" onClick={onClick}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${cls} ${activo ? 'ring-2 ring-blue-500/60 ring-offset-1 ring-offset-background' : 'opacity-70 hover:opacity-100'}`}>
            {children}
        </button>
    )
}
