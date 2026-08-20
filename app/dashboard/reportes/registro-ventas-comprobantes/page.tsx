'use client'

import React, { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar as CalendarIcon, FileText, Search, User } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import apiClient from "@/app/api/client"
import { toast } from "@/app/hooks/useToast"
import { useAuth } from "@/context/authContext"
import { ExportRegistroVentasComprobantesPdf } from "@/components/reporte/exportRegistroVentasComprobantesPdf"
import {
    RegistroVentaFila,
    agruparRegistroVentas,
    etiquetaTipo,
    fmtCantidad,
    fmtFechaCorta,
    fmtMonto,
    fmtPrecio,
} from "@/components/reporte/registroVentasShared"

const TODOS = "__todos__"

export default function RegistroVentasComprobantesPage() {
    const auth = useAuth()

    const [desde, setDesde] = useState<Date>(() => {
        const hoy = new Date()
        return new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    })
    const [hasta, setHasta] = useState<Date>(new Date())
    const [vendedor, setVendedor] = useState<string>(TODOS)
    const [busqueda, setBusqueda] = useState("")

    const [filas, setFilas] = useState<RegistroVentaFila[]>([])
    const [loading, setLoading] = useState(false)
    const [consultado, setConsultado] = useState(false)
    const [catVendedores, setCatVendedores] = useState<any[]>([])

    const puedeFiltrarVendedor = !auth.isVendedor()

    useEffect(() => {
        if (!puedeFiltrarVendedor) return

        const cargarVendedores = async () => {
            try {
                if (auth.isRepresentante()) {
                    setCatVendedores(auth.user?.vendedores || [])
                    return
                }
                const res = await apiClient.get('/usuarios/listar/vendedores')
                setCatVendedores(res.data?.data?.data || [])
            } catch (error) {
                console.error('Error cargando vendedores', error)
            }
        }
        cargarVendedores()
    }, [puedeFiltrarVendedor, auth.user])

    const buscar = async () => {
        if (desde > hasta) {
            toast({ title: "Rango inválido", description: "La fecha de inicio no puede ser mayor que la de fin.", variant: "warning" })
            return
        }

        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.append('fechaDesde', format(desde, 'yyyy-MM-dd'))
            params.append('fechaHasta', format(hasta, 'yyyy-MM-dd'))

            if (auth.isVendedor()) params.append('vendedor', auth.user?.codigo || '')
            else if (vendedor !== TODOS) params.append('vendedor', vendedor)

            if (auth.isRepresentante()) params.append('representante', auth.user?.codRepres || '')
            if (busqueda.trim()) params.append('busqueda', busqueda.trim())

            const res = await apiClient.get(`/pedidos/registro-ventas-comprobantes?${params.toString()}`)
            setFilas(res.data?.data?.data || [])
            setConsultado(true)
        } catch (error) {
            console.error('Error al consultar el registro de ventas:', error)
            toast({ title: "Error", description: "No se pudo cargar el registro de ventas.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const agrupado = useMemo(() => agruparRegistroVentas(filas), [filas])

    const nombreVendedorFiltro = useMemo(() => {
        if (auth.isVendedor()) return auth.user?.nombreCompleto || auth.user?.codigo || ''
        if (vendedor === TODOS) return ''
        const v = catVendedores.find((x: any) => (x.Codigo_Vend || x.codigo) === vendedor)
        return v ? `${v.Codigo_Vend || v.codigo} · ${v.Nombres || v.nombres || ''} ${v.Apellidos || v.apellidos || ''}`.trim() : vendedor
    }, [vendedor, catVendedores, auth])

    const selectorFecha = (etiqueta: string, valor: Date, onChange: (d: Date) => void) => (
        <div className="flex flex-col gap-2 lg:col-span-2">
            <Label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <CalendarIcon className="w-4 h-4" /> {etiqueta}
            </Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-background h-12", !valor && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                        {valor ? format(valor, "dd/MM/yyyy") : <span>Seleccionar</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50" align="start">
                    <Calendar mode="single" selected={valor} onSelect={(d) => d && onChange(d)} initialFocus locale={es} />
                </PopoverContent>
            </Popover>
        </div>
    )

    return (
        <div className="grid gap-6 p-4 md:p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    Registro de Ventas / Comprobantes de Pago
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                    Facturas y boletas emitidas, abiertas al detalle de productos. Expresado en Nuevos Soles (S/.).
                </p>
            </div>

            <Card className="shadow-md">
                <CardHeader className="bg-muted border-b border-border p-4 md:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
                        {selectorFecha("Fecha Inicio", desde, setDesde)}
                        {selectorFecha("Fecha Fin", hasta, setHasta)}

                        {puedeFiltrarVendedor && (
                            <div className="flex flex-col gap-2 lg:col-span-3">
                                <Label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                    <User className="w-4 h-4" /> Vendedor
                                </Label>
                                <Select value={vendedor} onValueChange={setVendedor}>
                                    <SelectTrigger className="h-12 bg-background">
                                        <SelectValue placeholder="Todos los vendedores" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={TODOS}>Todos los vendedores</SelectItem>
                                        {catVendedores.map((v: any) => {
                                            const cod = v.Codigo_Vend || v.codigo
                                            return (
                                                <SelectItem key={cod} value={cod}>
                                                    {cod} · {v.Nombres || v.nombres} {v.Apellidos || v.apellidos}
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className={cn("flex flex-col gap-2", puedeFiltrarVendedor ? "lg:col-span-2" : "lg:col-span-5")}>
                            <Label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                <Search className="w-4 h-4" /> Buscar
                            </Label>
                            <Input
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') buscar() }}
                                placeholder="Cliente, RUC o documento"
                                className="h-12 bg-background"
                            />
                        </div>

                        <div className="lg:col-span-3 flex flex-col sm:flex-row gap-3 md:justify-end">
                            <Button onClick={buscar} disabled={loading} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto h-12 shadow-sm">
                                <Search className="mr-2 h-4 w-4" /> Buscar
                            </Button>
                            <ExportRegistroVentasComprobantesPdf
                                data={agrupado}
                                desde={desde}
                                hasta={hasta}
                                filtroVendedor={nombreVendedorFiltro}
                                disabled={loading || agrupado.comprobantes.length === 0}
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0 bg-muted/30">
                    {loading && (
                        <div className="p-4 md:p-6 space-y-3">
                            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                        </div>
                    )}

                    {!loading && agrupado.comprobantes.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
                            <p className="text-sm font-medium">
                                {consultado ? "No se encontraron comprobantes en el rango" : "Elige un rango de fechas y presiona Buscar"}
                            </p>
                            <p className="mt-1 max-w-md text-xs text-muted-foreground">
                                Se listan las facturas y boletas aceptadas por SUNAT, con el detalle de productos de cada una.
                            </p>
                        </div>
                    )}

                    {!loading && agrupado.comprobantes.length > 0 && (
                        <>
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b bg-muted text-left">
                                            <th className="p-3 text-xs font-semibold">COMPROBANTE</th>
                                            <th className="p-3 text-xs font-semibold text-right">CANTIDAD</th>
                                            <th className="p-3 text-xs font-semibold">PRODUCTO</th>
                                            <th className="p-3 text-xs font-semibold text-right">PU</th>
                                            <th className="p-3 text-xs font-semibold text-right">NO AFECTO</th>
                                            <th className="p-3 text-xs font-semibold text-right">AFECTO</th>
                                            <th className="p-3 text-xs font-semibold text-right">IGV</th>
                                            <th className="p-3 text-xs font-semibold text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {agrupado.comprobantes.map((c) => (
                                            <React.Fragment key={c.idComprobanteCab}>
                                                <tr className="border-b bg-background">
                                                    <td className="p-3 align-top" colSpan={3}>
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                            <span className="text-xs font-semibold">{fmtFechaCorta(c.fecha_emision)}</span>
                                                            <span className="text-xs font-semibold font-mono">{c.tipo_cpe} : {c.documento}</span>
                                                            <span className="text-xs font-semibold">{c.cliente_numdoc} {c.cliente_denominacion}</span>
                                                            {c.anulado && (
                                                                <Badge variant="outline" className="border-red-200 bg-red-50 text-[10px] text-red-700">ANULADO</Badge>
                                                            )}
                                                        </div>
                                                        <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
                                                            <span>Vend: {c.codigo_vendedor || '—'}{c.vendedor ? ` · ${c.vendedor}` : ''}</span>
                                                            <span>{c.dias_credito > 0 ? `Créd: ${c.dias_credito} d` : 'Contado'}</span>
                                                            <span>{etiquetaTipo(c.tipo_cpe)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-right align-top" colSpan={5}>
                                                        <span className="font-mono text-[11px] text-muted-foreground break-all">{c.codigo_hash}</span>
                                                    </td>
                                                </tr>

                                                {c.lineas.map((l, i) => (
                                                    <tr key={`${c.idComprobanteCab}-${l.codigo_articulo}-${i}`} className="border-b bg-background/60 hover:bg-muted">
                                                        <td className="p-2" />
                                                        <td className="p-2 text-right text-xs font-mono">{fmtCantidad(l.cantidad)}</td>
                                                        <td className="p-2 text-xs">{l.unidad} {l.producto}</td>
                                                        <td className="p-2 text-right text-xs font-mono">{fmtPrecio(l.precio_unitario)}</td>
                                                        <td className="p-2 text-right text-xs font-mono">{fmtMonto(l.no_afecto)}</td>
                                                        <td className="p-2 text-right text-xs font-mono">{fmtMonto(l.afecto)}</td>
                                                        <td className="p-2 text-right text-xs font-mono">{fmtMonto(l.igv)}</td>
                                                        <td className="p-2 text-right text-xs font-mono">{fmtMonto(l.total)}</td>
                                                    </tr>
                                                ))}

                                                <tr className="border-b-2 bg-muted/50">
                                                    <td className="p-2" colSpan={4} />
                                                    <td className="p-2 text-right text-xs font-mono font-semibold">{fmtMonto(c.no_afecto)}</td>
                                                    <td className="p-2 text-right text-xs font-mono font-semibold">{fmtMonto(c.afecto)}</td>
                                                    <td className="p-2 text-right text-xs font-mono font-semibold">{fmtMonto(c.igv)}</td>
                                                    <td className="p-2 text-right text-xs font-mono font-semibold">{fmtMonto(c.total)}</td>
                                                </tr>
                                            </React.Fragment>
                                        ))}

                                        <tr className="bg-blue-600 text-white">
                                            <td className="p-3 text-xs font-bold" colSpan={4}>TOTAL GENERAL</td>
                                            <td className="p-3 text-right text-xs font-mono font-bold">{fmtMonto(agrupado.totales.no_afecto)}</td>
                                            <td className="p-3 text-right text-xs font-mono font-bold">{fmtMonto(agrupado.totales.afecto)}</td>
                                            <td className="p-3 text-right text-xs font-mono font-bold">{fmtMonto(agrupado.totales.igv)}</td>
                                            <td className="p-3 text-right text-xs font-mono font-bold">{fmtMonto(agrupado.totales.total)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="lg:hidden space-y-3 p-3">
                                {agrupado.comprobantes.map((c) => (
                                    <Card key={c.idComprobanteCab} className="border border-border">
                                        <CardContent className="p-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="font-mono text-sm font-bold text-blue-600">{c.tipo_cpe} : {c.documento}</p>
                                                    <p className="text-xs text-muted-foreground">{fmtFechaCorta(c.fecha_emision)}</p>
                                                </div>
                                                {c.anulado && (
                                                    <Badge variant="outline" className="border-red-200 bg-red-50 text-[10px] text-red-700">ANULADO</Badge>
                                                )}
                                            </div>

                                            <p className="mt-2 text-xs font-medium break-words">{c.cliente_numdoc} {c.cliente_denominacion}</p>
                                            <p className="text-[11px] text-muted-foreground">
                                                Vend: {c.codigo_vendedor || '—'} · {c.dias_credito > 0 ? `Créd: ${c.dias_credito} d` : 'Contado'}
                                            </p>

                                            <div className="mt-3 space-y-1.5 border-t pt-2">
                                                {c.lineas.map((l, i) => (
                                                    <div key={`${c.idComprobanteCab}-m-${l.codigo_articulo}-${i}`} className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="text-xs break-words">{l.unidad} {l.producto}</p>
                                                            <p className="text-[11px] text-muted-foreground font-mono">
                                                                {fmtCantidad(l.cantidad)} × {fmtPrecio(l.precio_unitario)}
                                                            </p>
                                                        </div>
                                                        <span className="shrink-0 text-xs font-mono">{fmtMonto(l.total)}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-2 grid grid-cols-2 gap-1 border-t pt-2 text-[11px]">
                                                <span className="text-muted-foreground">No afecto</span>
                                                <span className="text-right font-mono">{fmtMonto(c.no_afecto)}</span>
                                                <span className="text-muted-foreground">Afecto</span>
                                                <span className="text-right font-mono">{fmtMonto(c.afecto)}</span>
                                                <span className="text-muted-foreground">IGV</span>
                                                <span className="text-right font-mono">{fmtMonto(c.igv)}</span>
                                                <span className="font-semibold">Total</span>
                                                <span className="text-right font-mono font-semibold">{fmtMonto(c.total)}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                <div className="rounded-lg bg-blue-600 p-3 text-white">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold">TOTAL GENERAL</span>
                                        <span className="font-mono text-sm font-bold">{fmtMonto(agrupado.totales.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
