'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import {
    Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Legend,
    PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { AlertTriangle, CheckCircle2, Info, Lightbulb, TrendingDown } from 'lucide-react'
import apiClient from '@/app/api/client'
import { cabeceraSesion } from '@/app/api/sesion'
import { fecha, soles, type GraficosMes as Datos } from '@/app/types/cobranza-ventas-mes'
import { CargandoMes } from './CargandoMes'

/* Paleta validada (validate_palette.js, claro y oscuro):
   - Series: ventas azul, cobrado aqua, faltante naranja (siempre las mismas).
   - Antigüedad: escala ordinal de un solo tono; en oscuro, más antigua = más clara. */
const PALETA = {
    light: {
        ventas: '#2a78d6', cobrado: '#1baf7a', faltante: '#eb6834',
        antiguedad: ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab', '#104281'],
        grilla: '#e7e5e0', eje: '#6b6a65',
    },
    dark: {
        ventas: '#3987e5', cobrado: '#199e70', faltante: '#d95926',
        antiguedad: ['#184f95', '#256abf', '#3987e5', '#6da7ec', '#9ec5f4'],
        grilla: '#2a3142', eje: '#9aa3b5',
    },
}

const compacto = (n: number) => (Math.abs(n) >= 1000 ? `S/ ${(n / 1000).toLocaleString('es-PE', { maximumFractionDigits: 1 })} mil` : `S/ ${Math.round(n)}`)
const corto = (t: string, n = 22) => (t.length > n ? `${t.slice(0, n - 1)}…` : t)
/** Eje de montos sin "S/" (el título ya dice que son soles): "220 mil". */
const ejeMonto = (n: number) => (Math.abs(n) >= 1000 ? `${(n / 1000).toLocaleString('es-PE', { maximumFractionDigits: 0 })} mil` : String(Math.round(n)))

/** Etiqueta de valor a la derecha de la barra, en una línea y con tinta neutra. */
function etiquetaDerecha(formato: (v: number) => string, colorTexto: string) {
    // eslint-disable-next-line react/display-name
    return (p: any) => {
        const { x, y, width, height, value } = p
        if (value == null) return null
        return (
            <text x={Number(x) + Number(width) + 6} y={Number(y) + Number(height) / 2} dominantBaseline="central" fontSize={11} fill={colorTexto} style={{ whiteSpace: 'pre' }}>
                {formato(Number(value))}
            </text>
        )
    }
}

/** Leyenda: la muestra lleva el color; el texto, la tinta normal. */
const textoLeyenda = (valor: string) => <span className="text-xs text-muted-foreground">{valor}</span>

/** Tarjeta con entrada escalonada (se apaga con "reducir movimiento"). */
function Tarjeta({ titulo, detalle, children, className = '', orden = 0 }: { titulo: string; detalle?: string; children: React.ReactNode; className?: string; orden?: number }) {
    return (
        <section
            className={`rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:fill-mode-both motion-safe:duration-500 sm:p-5 ${className}`}
            style={{ animationDelay: `${orden * 90}ms` }}
        >
            <h3 className="font-semibold">{titulo}</h3>
            {detalle && <p className="mt-0.5 text-xs text-muted-foreground">{detalle}</p>}
            <div className="mt-3">{children}</div>
        </section>
    )
}

/** Tooltip con tokens del tema (el texto nunca lleva el color de la serie). */
function Globo({ active, payload, label, formatoEtiqueta }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
            <div className="mb-1 font-semibold text-foreground">{formatoEtiqueta ? formatoEtiqueta(label) : label}</div>
            {payload.map((p: any) => (
                <div key={p.dataKey} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><i className="h-2 w-2 rounded-sm" style={{ background: p.color }} />{p.name}</span>
                    <span className="font-semibold tabular-nums text-foreground">{soles(Number(p.value))}</span>
                </div>
            ))}
        </div>
    )
}

const ICONO = { bien: CheckCircle2, atencion: AlertTriangle, alerta: TrendingDown, info: Info }
const TONO = {
    bien: 'text-emerald-700 bg-emerald-50',
    atencion: 'text-amber-800 bg-amber-50',
    alerta: 'text-red-700 bg-red-50',
    info: 'text-sky-700 bg-sky-50',
}

/** Si el sistema pide reducir movimiento, los gráficos aparecen sin animar. */
function useAnimar() {
    const [animar, setAnimar] = useState(true)
    useEffect(() => {
        const m = window.matchMedia('(prefers-reduced-motion: reduce)')
        setAnimar(!m.matches)
        const cambio = () => setAnimar(!m.matches)
        m.addEventListener('change', cambio)
        return () => m.removeEventListener('change', cambio)
    }, [])
    return animar
}

/** Medidor circular del % cobrado, con la cifra al centro. */
function Medidor({ avance, color, fondo, animar }: { avance: number; color: string; fondo: string; animar: boolean }) {
    return (
        <div className="relative h-40 w-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="78%" outerRadius="100%" data={[{ valor: Math.min(100, avance) }]} startAngle={90} endAngle={-270}>
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar dataKey="valor" cornerRadius={10} fill={color} background={{ fill: fondo }} isAnimationActive={animar} animationDuration={1400} animationEasing="ease-out" />
                </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold tabular-nums">{avance}%</span>
                <span className="text-[11px] text-muted-foreground">cobrado</span>
            </div>
        </div>
    )
}

type Props = { periodo: { anio: number; mes: number }; vendedor: string; nombreMes: string }

/** Gráficos del mes elegido: se recalculan al cambiar de mes o de vendedor. */
export function GraficosMes({ periodo, vendedor, nombreMes }: Props) {
    const { resolvedTheme } = useTheme()
    const c = PALETA[resolvedTheme === 'dark' ? 'dark' : 'light']
    const animar = useAnimar()
    // Cada gráfico arranca un poco después del anterior, en cascada.
    const anim = (orden: number) => ({ isAnimationActive: animar, animationBegin: 150 + orden * 120, animationDuration: 1100, animationEasing: 'ease-out' as const })
    const [datos, setDatos] = useState<Datos | null>(null)
    const [error, setError] = useState(false)

    useEffect(() => {
        let vigente = true
        setError(false)
        apiClient.get('/cobranza-ventas-mes/graficos', {
            params: { anio: periodo.anio, mes: periodo.mes, vendedor: vendedor || undefined }, headers: cabeceraSesion(),
        })
            .then(res => { if (vigente) setDatos(res.data?.data ?? null) })
            .catch(() => { if (vigente) setError(true) })
        return () => { vigente = false }
    }, [periodo.anio, periodo.mes, vendedor])

    if (error) return <div className="rounded-2xl border bg-card p-8 text-center text-sm text-red-700">No se pudieron armar los gráficos del mes.</div>
    const vigentes = datos && datos.periodo.anio === periodo.anio && datos.periodo.mes === periodo.mes
    if (!vigentes) return <CargandoMes mes={nombreMes} />
    const d = datos!

    const eje = { fontSize: 11, fill: c.eje }
    const altoBarras = (n: number) => Math.max(160, n * 38 + 40)

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <Tarjeta titulo="Lo que dicen los números" detalle={`Ventas de ${nombreMes} ${d.periodo.anio}, cobranza al ${fecha(d.periodo.corte)}.`} className="lg:col-span-2" orden={0}>
                <div className="flex flex-col items-center gap-5 md:flex-row md:items-start">
                <div className="flex flex-col items-center gap-2">
                    <Medidor avance={d.totales.avance} color={c.cobrado} fondo={c.grilla} animar={animar} />
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-center text-[11px] text-muted-foreground">
                        <span className="flex items-center justify-center gap-1"><i className="h-2 w-2 rounded-sm" style={{ background: c.cobrado }} />Cobrado</span>
                        <span className="flex items-center justify-center gap-1"><i className="h-2 w-2 rounded-sm" style={{ background: c.faltante }} />Faltante</span>
                        <b className="tabular-nums text-foreground">{compacto(d.totales.cobrado)}</b>
                        <b className="tabular-nums text-foreground">{compacto(d.totales.faltante)}</b>
                    </div>
                </div>
                <ul className="grid w-full flex-1 gap-2 sm:grid-cols-2">
                    {d.conclusiones.map((x, i) => {
                        const Icono = ICONO[x.tono] ?? Lightbulb
                        return (
                            <li key={i} className="flex items-start gap-2.5 rounded-xl border p-3 text-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2 motion-safe:fill-mode-both motion-safe:duration-500" style={{ animationDelay: `${250 + i * 110}ms` }}>
                                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${TONO[x.tono]}`}><Icono className="h-4 w-4" /></span>
                                <span className="leading-snug">{x.texto}</span>
                            </li>
                        )
                    })}
                </ul>
                </div>
            </Tarjeta>

            <Tarjeta
                titulo="Ventas y cobranza acumuladas"
                detalle="Ventas por fecha de emisión; cobranza por fecha de pago registrada (los abonos sin fecha, como notas de crédito, no aparecen en la curva)."
                className="lg:col-span-2"
                orden={1}
            >
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={d.curva} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
                            <defs>
                                <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={c.ventas} stopOpacity={0.28} />
                                    <stop offset="100%" stopColor={c.ventas} stopOpacity={0.02} />
                                </linearGradient>
                                <linearGradient id="gradCobrado" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={c.cobrado} stopOpacity={0.32} />
                                    <stop offset="100%" stopColor={c.cobrado} stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke={c.grilla} strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="fecha" tick={eje} tickLine={false} axisLine={{ stroke: c.grilla }} tickFormatter={f => fecha(f).slice(0, 5)} minTickGap={24} />
                            <YAxis tick={eje} tickLine={false} axisLine={false} tickFormatter={ejeMonto} width={56} label={{ value: 'Soles', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: c.eje } }} />
                            <Tooltip content={<Globo formatoEtiqueta={fecha} />} cursor={{ stroke: c.eje, strokeDasharray: '3 3' }} />
                            <Legend iconType="plainline" formatter={textoLeyenda} />
                            <Area type="monotone" dataKey="ventasAcum" name="Ventas acumuladas" stroke={c.ventas} strokeWidth={2} fill="url(#gradVentas)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))' }} {...anim(1)} animationDuration={1600} />
                            <Area type="monotone" dataKey="cobradoAcum" name="Cobrado acumulado" stroke={c.cobrado} strokeWidth={2} fill="url(#gradCobrado)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))' }} {...anim(2)} animationDuration={1600} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Tarjeta>

            <Tarjeta orden={2} titulo="Antigüedad de la deuda" detalle="Saldo pendiente según los días de atraso. Más oscuro, más antiguo.">
                <div style={{ height: altoBarras(d.antiguedad.length) }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={d.antiguedad} layout="vertical" margin={{ top: 0, right: 96, bottom: 0, left: 0 }} barCategoryGap={6}>
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="etiqueta" tick={eje} tickLine={false} axisLine={false} width={104} />
                            <Tooltip content={<Globo />} cursor={{ fill: c.grilla, opacity: 0.4 }} />
                            <Bar dataKey="monto" name="Saldo" radius={[0, 4, 4, 0]} maxBarSize={26} {...anim(3)}>
                                {d.antiguedad.map((_, i) => <Cell key={i} fill={c.antiguedad[i]} />)}
                                <LabelList dataKey="monto" content={etiquetaDerecha(v => compacto(v), c.eje)} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    {d.antiguedad.map(t => <span key={t.clave}>{t.etiqueta}: <b className="text-foreground">{t.cantidad}</b> comp.</span>)}
                </div>
            </Tarjeta>

            <Tarjeta orden={3} titulo="Avance de cobranza por vendedor" detalle="Cobrado y faltante de lo que vendió cada uno en el mes.">
                <div style={{ height: altoBarras(d.porVendedor.length) }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={d.porVendedor} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 0 }} barCategoryGap={6}>
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="nombre" tick={eje} tickLine={false} axisLine={false} width={132} tickFormatter={t => corto(t, 20)} />
                            <Tooltip content={<Globo />} cursor={{ fill: c.grilla, opacity: 0.4 }} />
                            <Legend iconType="square" formatter={textoLeyenda} />
                            <Bar dataKey="cobrado" name="Cobrado" stackId="a" fill={c.cobrado} maxBarSize={26} stroke="hsl(var(--card))" strokeWidth={2} {...anim(4)} />
                            <Bar dataKey="faltante" name="Faltante" stackId="a" fill={c.faltante} radius={[0, 4, 4, 0]} maxBarSize={26} stroke="hsl(var(--card))" strokeWidth={2} {...anim(5)}>
                                <LabelList dataKey="avance" content={etiquetaDerecha(v => `${v}%`, c.eje)} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Tarjeta>

            <Tarjeta orden={4} titulo="Deuda por zona" detalle="Las zonas con más saldo pendiente.">
                <div style={{ height: altoBarras(d.porZona.length) }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={d.porZona} layout="vertical" margin={{ top: 0, right: 96, bottom: 0, left: 0 }} barCategoryGap={6}>
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="nombre" tick={eje} tickLine={false} axisLine={false} width={132} tickFormatter={t => corto(t, 20)} />
                            <Tooltip content={<Globo />} cursor={{ fill: c.grilla, opacity: 0.4 }} />
                            <Bar dataKey="faltante" name="Faltante" fill={c.faltante} radius={[0, 4, 4, 0]} maxBarSize={26} {...anim(6)}>
                                <LabelList dataKey="faltante" content={etiquetaDerecha(v => compacto(v), c.eje)} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Tarjeta>

            <Tarjeta orden={5} titulo="Clientes con más deuda" detalle="Los 10 saldos pendientes más altos del mes.">
                <div style={{ height: altoBarras(d.topClientes.length) }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={d.topClientes} layout="vertical" margin={{ top: 0, right: 96, bottom: 0, left: 0 }} barCategoryGap={6}>
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="nombre" tick={eje} tickLine={false} axisLine={false} width={150} tickFormatter={t => corto(t, 24)} />
                            <Tooltip content={<Globo />} cursor={{ fill: c.grilla, opacity: 0.4 }} />
                            <Bar dataKey="faltante" name="Faltante" fill={c.faltante} radius={[0, 4, 4, 0]} maxBarSize={22} {...anim(7)}>
                                <LabelList dataKey="faltante" content={etiquetaDerecha(v => compacto(v), c.eje)} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Tarjeta>
        </div>
    )
}
