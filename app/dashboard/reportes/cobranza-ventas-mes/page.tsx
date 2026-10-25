'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, FileSpreadsheet, FileText, Loader2, Search, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Paginador } from '@/components/ui/paginador'
import { PdfVistaPreviaDialog } from '@/components/reporte/PdfVistaPreviaDialog'
import { ChipsFiltro } from '@/components/cobranza/vistaCobranza'
import { exportarExcel } from '@/components/ivan/exportar/excel'
import { generarPdfTabla } from '@/components/ivan/exportar/pdf'
import type { TablaIvan } from '@/components/ivan/nucleo/tipos'
import { TarjetasMes } from '@/components/cobranza-ventas-mes/TarjetasMes'
import { TablaMes } from '@/components/cobranza-ventas-mes/TablaMes'
import { DetalleMes } from '@/components/cobranza-ventas-mes/DetalleMes'
import { usePaginaServidor } from '@/app/hooks/usePaginaServidor'
import apiClient from '@/app/api/client'
import { cabeceraSesion } from '@/app/api/sesion'
import { toast } from '@/app/hooks/useToast'
import {
    FILTROS_VISTA, MESES, soles,
    type ComprobanteMes, type ResumenMes, type VistaMes,
} from '@/app/types/cobranza-ventas-mes'

const TODOS = '__todos__'

/** Mes anterior al actual: el que normalmente se revisa. */
function mesInicial() {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return { anio: d.getFullYear(), mes: d.getMonth() + 1 }
}

export default function CobranzaVentasMesPage() {
    const [periodo, setPeriodo] = useState(mesInicial)
    const [vendedor, setVendedor] = useState('')
    const [vendedores, setVendedores] = useState<{ codigo: string; nombre: string }[]>([])
    const [vista, setVista] = useState<VistaMes>('faltante')
    const [filtro, setFiltro] = useState('todos')
    const [buscar, setBuscar] = useState('')
    const [busqueda, setBusqueda] = useState('')
    const [orden, setOrden] = useState<{ orden: string; direccion: 'asc' | 'desc' } | null>(null)
    const [tamano, setTamano] = useState(25)
    const [abierto, setAbierto] = useState<ComprobanteMes | null>(null)
    const [exportando, setExportando] = useState<'excel' | 'pdf' | null>(null)
    const [tablaPdf, setTablaPdf] = useState<TablaIvan | null>(null)

    useEffect(() => {
        const t = setTimeout(() => setBusqueda(buscar.trim()), 350)
        return () => clearTimeout(t)
    }, [buscar])

    useEffect(() => {
        apiClient.get('/usuarios/listar/vendedores')
            .then(res => setVendedores((res.data?.data?.data ?? []).map((v: any) => ({
                codigo: v.Codigo_Vend, nombre: `${v.Nombres ?? ''} ${v.Apellidos ?? ''}`.trim() || v.Codigo_Vend,
            }))))
            .catch(() => setVendedores([]))
    }, [])

    // Al cambiar de vista, cada una arranca con su filtro y orden por defecto.
    const cambiarVista = (v: VistaMes) => { setVista(v); setFiltro('todos'); setOrden(null) }

    // La página va atada a la consulta: cualquier cambio vuelve a la primera (un solo pedido).
    const consulta = JSON.stringify([periodo, vendedor, vista, filtro, busqueda, orden, tamano])
    const [paginaEn, setPaginaEn] = useState({ consulta, pagina: 1 })
    const pagina = paginaEn.consulta === consulta ? paginaEn.pagina : 1

    const params = {
        anio: periodo.anio, mes: periodo.mes, vendedor, vista, filtro, busqueda,
        orden: orden?.orden, direccion: orden?.direccion, pagina, tamano,
    }
    const datos = usePaginaServidor<ComprobanteMes, ResumenMes>(
        '/cobranza-ventas-mes', params, 'No se pudo cargar la cobranza del mes.', { conSesion: true },
    )
    const r = datos.resumen
    const soloPropio = !!datos.respuesta?.alcance?.soloPropio
    const ordenActual = { orden: datos.respuesta?.orden ?? '', direccion: (datos.respuesta?.direccion ?? 'desc') as 'asc' | 'desc' }
    const nombreMes = MESES[periodo.mes - 1]

    const moverMes = (delta: number) => setPeriodo(p => {
        const d = new Date(p.anio, p.mes - 1 + delta, 1)
        return { anio: d.getFullYear(), mes: d.getMonth() + 1 }
    })
    const hoy = new Date()
    const esMesActual = periodo.anio === hoy.getFullYear() && periodo.mes === hoy.getMonth() + 1

    const ordenarPor = (clave: string) => setOrden(o =>
        (o?.orden ?? ordenActual.orden) === clave
            ? { orden: clave, direccion: (o?.direccion ?? ordenActual.direccion) === 'asc' ? 'desc' : 'asc' }
            : { orden: clave, direccion: 'asc' })

    // ── Exportación: pide todas las filas del filtro y arma la tabla ─────────
    const exportar = async (formato: 'excel' | 'pdf') => {
        setExportando(formato)
        try {
            const res = await apiClient.get('/cobranza-ventas-mes', {
                params: { ...params, pagina: undefined, todo: '1' }, headers: cabeceraSesion(),
            })
            const filas: ComprobanteMes[] = res.data?.data?.data ?? []
            const deuda = vista === 'faltante'
            const etiquetaFiltro = FILTROS_VISTA[vista].find(f => f.valor === filtro)?.etiqueta
            const tabla: TablaIvan = {
                herramienta: 'cobranza_ventas_mes',
                titulo: `${deuda ? 'Comprobantes con deuda' : 'Comprobantes pagados'} · Ventas de ${nombreMes} ${periodo.anio}`,
                subtitulo: [vendedor && `Vendedor ${vendedor}`, filtro !== 'todos' && etiquetaFiltro, busqueda && `Búsqueda: ${busqueda}`].filter(Boolean).join(' · ') || undefined,
                columnas: [
                    { k: 'comprobante', t: 'Comprobante', tipo: 'texto' },
                    { k: 'cliente', t: 'Cliente', tipo: 'texto' },
                    { k: 'ruc', t: 'RUC', tipo: 'texto' },
                    { k: 'zona', t: 'Zona', tipo: 'texto' },
                    { k: 'vendedor', t: 'Vendedor', tipo: 'texto' },
                    { k: 'emision', t: 'Emisión', tipo: 'fecha' },
                    ...(deuda
                        ? [
                            { k: 'vencimiento', t: 'Vence', tipo: 'fecha' as const },
                            { k: 'diasVencido', t: 'Días vencido', tipo: 'numero' as const },
                            { k: 'total', t: 'Total', tipo: 'moneda' as const },
                            { k: 'abonado', t: 'Abonado', tipo: 'moneda' as const },
                            { k: 'saldo', t: 'Saldo', tipo: 'moneda' as const },
                        ]
                        : [
                            { k: 'ultimoPago', t: 'Pagado el', tipo: 'fecha' as const },
                            { k: 'tardo', t: 'Días en pagar', tipo: 'numero' as const },
                            { k: 'formaCobro', t: 'Cómo se cobró', tipo: 'texto' as const },
                            { k: 'total', t: 'Importe', tipo: 'moneda' as const },
                        ]),
                ],
                filas: filas.map(c => ({ ...c, cliente: c.nombreComercial || c.cliente })),
                totales: deuda
                    ? { comprobante: `${filas.length} comprobantes`, total: filas.reduce((s, c) => s + c.total, 0), abonado: filas.reduce((s, c) => s + c.abonado, 0), saldo: filas.reduce((s, c) => s + c.saldo, 0) }
                    : { comprobante: `${filas.length} comprobantes`, total: filas.reduce((s, c) => s + c.total, 0) },
            }
            if (formato === 'excel') exportarExcel(tabla)
            else setTablaPdf(tabla)
        } catch {
            toast({ title: '', description: 'No se pudo preparar la exportación.', variant: 'error' })
        } finally {
            setExportando(null)
        }
    }

    const deuda = vista === 'faltante'
    const chips = FILTROS_VISTA[vista].map(f => ({ ...f, cantidad: r?.filtros[vista][f.valor] ?? 0 }))

    return (
        <div className="grid w-full min-w-0 gap-5 [&>*]:min-w-0">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white">
                        <TrendingUp className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Cobranza de Ventas por Mes</h1>
                        <p className="text-sm text-muted-foreground">Lo vendido en el mes, cuánto ya se cobró y qué queda por cobrar, al día de hoy.</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center rounded-lg border bg-card p-1">
                        <button onClick={() => moverMes(-1)} className="rounded-md p-1.5 hover:bg-muted" aria-label="Mes anterior"><ChevronLeft className="h-4 w-4" /></button>
                        <span className="min-w-36 px-2 text-center text-sm font-semibold">{nombreMes} {periodo.anio}</span>
                        <button onClick={() => moverMes(1)} disabled={esMesActual} className="rounded-md p-1.5 hover:bg-muted disabled:opacity-30" aria-label="Mes siguiente"><ChevronRight className="h-4 w-4" /></button>
                    </div>
                    {!soloPropio && (
                        <Select value={vendedor || TODOS} onValueChange={v => setVendedor(v === TODOS ? '' : v)}>
                            <SelectTrigger className="w-full text-sm sm:w-60"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TODOS}>Todos los vendedores</SelectItem>
                                {vendedores.map(v => <SelectItem key={v.codigo} value={v.codigo}>{v.codigo} · {v.nombre}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            <TarjetasMes resumen={r} nombreMes={nombreMes.toLowerCase()} vista={vista} onVista={cambiarVista} />

            <Card className="overflow-hidden">
                <div className="space-y-3 border-b p-4 sm:p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <h2 className="font-semibold">
                                {deuda ? 'Comprobantes con deuda' : 'Comprobantes pagados'}
                                {r && <span className={deuda ? 'text-red-700' : 'text-emerald-700'}> · {soles(deuda ? r.faltante.montos.PEN : r.cobrado.montos.PEN)}</span>}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {deuda ? 'Clic en un comprobante para ver cliente, sucursal, crédito, productos y pagos.' : 'Con la fecha y la forma de pago. Clic en un comprobante para ver su detalle.'}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Cliente, RUC, zona o comprobante" className="pl-9 text-sm" />
                            </div>
                            <Button variant="outline" size="sm" className="gap-1.5" disabled={!!exportando || !datos.total} onClick={() => exportar('excel')}>
                                {exportando === 'excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 text-emerald-600" />} Excel
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1.5" disabled={!!exportando || !datos.total} onClick={() => exportar('pdf')}>
                                {exportando === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-red-600" />} PDF
                            </Button>
                        </div>
                    </div>
                    <ChipsFiltro chips={chips} activos={[filtro]} onCambiar={setFiltro} />
                </div>

                {deuda && !!r?.porVendedor.length && !vendedor && !soloPropio && (
                    <div className="grid grid-cols-2 gap-2 border-b bg-muted/40 p-3 sm:grid-cols-4 sm:p-4">
                        {r.porVendedor.slice(0, 4).map(v => (
                            <button key={v.codigo} onClick={() => setVendedor(v.codigo)} className="rounded-lg border bg-card px-3 py-2 text-left transition hover:border-foreground/30" title="Ver solo este vendedor">
                                <div className="truncate text-[11px] font-semibold text-muted-foreground">{v.vendedor}</div>
                                <div className="text-sm font-bold tabular-nums text-red-700">{soles(v.saldo)}</div>
                                <div className="text-[11px] text-muted-foreground">{v.cantidad} comprobantes</div>
                            </button>
                        ))}
                    </div>
                )}

                {datos.cargando && datos.data.length === 0 ? (
                    <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-11 animate-pulse rounded bg-muted" />)}</div>
                ) : datos.total === 0 ? (
                    <div className="py-14 text-center text-sm text-muted-foreground">
                        {deuda ? 'No hay comprobantes con deuda con estos filtros.' : 'No hay comprobantes pagados con estos filtros.'}
                    </div>
                ) : (
                    <div className={datos.cargando ? 'opacity-60 transition-opacity' : ''}>
                        <TablaMes vista={vista} filas={datos.data} orden={ordenActual.orden} direccion={ordenActual.direccion} onOrdenar={ordenarPor} onAbrir={setAbierto} />
                    </div>
                )}

                <div className="border-t p-3 sm:p-4">
                    <Paginador
                        pagina={datos.pagina} totalPaginas={datos.totalPaginas} total={datos.total}
                        tamano={tamano} onPagina={p => setPaginaEn({ consulta, pagina: p })} onTamano={setTamano}
                        etiqueta="comprobantes"
                    />
                </div>
            </Card>

            <DetalleMes comprobante={abierto} periodo={periodo} vendedor={vendedor} onCerrar={() => setAbierto(null)} />

            {tablaPdf && (
                <PdfVistaPreviaDialog
                    abierto={!!tablaPdf}
                    onCerrar={() => setTablaPdf(null)}
                    titulo={tablaPdf.titulo}
                    descripcion="Cobranza de Ventas por Mes"
                    defecto={{ titulo: tablaPdf.titulo.toUpperCase(), nota: '', color: '#163161', tamanoLetra: 'normal' }}
                    archivoDefecto={`cobranza-${nombreMes.toLowerCase()}-${periodo.anio}-${vista}`}
                    generar={op => generarPdfTabla(tablaPdf, op)}
                />
            )}
        </div>
    )
}
