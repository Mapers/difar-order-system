'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { History, Loader2, RefreshCcw, Search, Undo2 } from "lucide-react"
import { useHistorialProcesoNc } from "@/app/hooks/useHistorialProcesoNc"
import { ProcesoNcHistorial } from "@/app/types/procesar-nota-credito-types"
import { RevertirProcesoDialog } from "./RevertirProcesoDialog"

const fmt = (n: string | number) =>
    Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtFecha = (fecha: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(fecha ?? ''))
    return m ? `${m[3]}/${m[2]}/${m[1]}` : String(fecha ?? '')
}

const fmtFechaHora = (fecha: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(String(fecha ?? ''))
    return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : fmtFecha(fecha)
}

const simbolo = (moneda: string | null) => (moneda === 'USD' ? '$' : 'S/')

export function HistorialProcesos({ habilitado }: { habilitado: boolean }) {
    const { procesos, cargando, revirtiendo, filtros, setFiltros, recargar, revertir } =
        useHistorialProcesoNc(habilitado)

    const [aRevertir, setARevertir] = useState<ProcesoNcHistorial | null>(null)

    async function confirmarReversion() {
        if (!aRevertir) return
        const ok = await revertir(aRevertir.item)
        if (ok) setARevertir(null)
    }

    const botonRevertir = (p: ProcesoNcHistorial, className = "") => (
        <Button
            variant="outline"
            size="sm"
            className={`gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 ${className}`}
            onClick={() => setARevertir(p)}
            disabled={revirtiendo === p.item}
        >
            {revirtiendo === p.item
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Undo2 className="h-4 w-4" />}
            Revertir
        </Button>
    )

    return (
        <>
            <Card>
                <CardHeader className="border-b pb-4">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase text-muted-foreground">Desde</Label>
                            <Input
                                type="date"
                                value={filtros.fechaDesde}
                                onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase text-muted-foreground">Hasta</Label>
                            <Input
                                type="date"
                                value={filtros.fechaHasta}
                                onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 space-y-1.5 md:col-span-3">
                            <Label className="text-xs uppercase text-muted-foreground">Buscar</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-8"
                                    placeholder="N.C., documento, cliente o voucher"
                                    value={filtros.busqueda}
                                    onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                                    onKeyDown={(e) => { if (e.key === 'Enter') recargar() }}
                                />
                            </div>
                        </div>

                        <div className="col-span-2 flex items-end md:col-span-1">
                            <Button variant="outline" onClick={recargar} disabled={cargando} className="w-full gap-1.5">
                                <RefreshCcw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
                                Actualizar
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {cargando && (
                        <div className="space-y-2 p-4">
                            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    )}

                    {!cargando && procesos.length === 0 && (
                        <div className="flex flex-col items-center gap-2 py-14 text-center text-muted-foreground">
                            <History className="h-8 w-8 opacity-40" />
                            <p className="text-sm">
                                No hay procesos registrados. Al revertir uno, deja de listarse.
                            </p>
                        </div>
                    )}

                    {!cargando && procesos.length > 0 && (
                        <>
                            <div className="hidden lg:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Asiento</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Nota de crédito</TableHead>
                                            <TableHead>Aplicada a</TableHead>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead className="text-right">Monto</TableHead>
                                            <TableHead>Procesado</TableHead>
                                            <TableHead className="w-28" />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {procesos.map((p) => (
                                            <TableRow key={p.id_historial} className="group">
                                                <TableCell className="whitespace-nowrap">
                                                    <div className="font-mono text-sm font-semibold">#{p.item}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Voucher {p.numero_voucher ?? '—'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-sm">
                                                    {fmtFecha(p.fecha_asiento)}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    <Badge variant="outline" className="font-mono text-[10px]">
                                                        {p.nc_documento ?? '—'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    <Badge variant="outline" className="font-mono text-[10px]">
                                                        {p.doc_aplicado ?? '—'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-[220px] truncate text-sm">{p.cliente ?? '—'}</div>
                                                    <div className="font-mono text-xs text-muted-foreground">{p.cod_cliente ?? ''}</div>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-right font-mono text-sm">
                                                    {simbolo(p.moneda)} {fmt(p.total_cargo)}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    <div className="text-xs">{fmtFechaHora(p.fecha_proceso)}</div>
                                                    <div className="text-xs text-muted-foreground">{p.usuario ?? '—'}</div>
                                                </TableCell>
                                                <TableCell>{botonRevertir(p)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="space-y-3 p-3 lg:hidden">
                                {procesos.map((p) => (
                                    <Card key={p.id_historial} className="border border-border">
                                        <CardContent className="p-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-mono text-sm font-bold text-blue-600">#{p.item}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {fmtFecha(p.fecha_asiento)} · Voucher {p.numero_voucher ?? '—'}
                                                    </p>
                                                </div>
                                                <Badge variant="secondary" className="font-mono">
                                                    {simbolo(p.moneda)} {fmt(p.total_cargo)}
                                                </Badge>
                                            </div>

                                            <div className="mt-3 space-y-1.5 border-t pt-2 text-xs">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className="text-muted-foreground">N.C.:</span>
                                                    <Badge variant="outline" className="font-mono text-[10px]">{p.nc_documento ?? '—'}</Badge>
                                                    <span className="text-muted-foreground">sobre</span>
                                                    <Badge variant="outline" className="font-mono text-[10px]">{p.doc_aplicado ?? '—'}</Badge>
                                                </div>
                                                <p className="break-words"><span className="text-muted-foreground">Cliente:</span> {p.cliente ?? '—'}</p>
                                                <p><span className="text-muted-foreground">Procesado:</span> {fmtFechaHora(p.fecha_proceso)} · {p.usuario ?? '—'}</p>
                                            </div>

                                            {botonRevertir(p, "mt-3 w-full")}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <RevertirProcesoDialog
                proceso={aRevertir}
                revirtiendo={revirtiendo !== null}
                onCancelar={() => setARevertir(null)}
                onConfirmar={confirmarReversion}
            />
        </>
    )
}
