'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Pencil, Trash2 } from "lucide-react"
import { AsientoLinea } from "@/app/types/procesar-nota-credito-types"
import { cn } from "@/lib/utils"

const fmt = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface DetalleAsientoTableProps {
    lineas:       AsientoLinea[]
    totalCargo:   number
    totalAbono:   number
    diferencia:   number
    cuadrado:     boolean
    onEditar:     (index: number) => void
    onEliminar:   (index: number) => void
}

export function DetalleAsientoTable({
    lineas, totalCargo, totalAbono, diferencia, cuadrado, onEditar, onEliminar,
}: DetalleAsientoTableProps) {
    return (
        <div>
            {lineas.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-14 text-center text-muted-foreground">
                    <FileText className="h-8 w-8 opacity-40" />
                    <p className="text-sm">
                        Sin líneas registradas. Usa <b>Agregar línea</b> para empezar.
                    </p>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Documento</TableHead>
                            <TableHead>Tercero / Concepto</TableHead>
                            <TableHead className="text-right">Cargo</TableHead>
                            <TableHead className="text-right">Abono</TableHead>
                            <TableHead>Cta. contable</TableHead>
                            <TableHead>C. costos</TableHead>
                            <TableHead>Amort. / Fechas</TableHead>
                            <TableHead className="w-20" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lineas.map((l, i) => (
                            <TableRow key={l.id} className="group">
                                <TableCell className="whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="font-mono text-[10px]">{l.tipDoc || '··'}</Badge>
                                        <span className="font-mono text-sm">{l.serie}{l.serie ? '-' : ''}{l.numero}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium leading-tight">
                                        {l.razonSocial || <span className="text-destructive">Sin tercero</span>}
                                    </div>
                                    <div className="max-w-[240px] truncate text-xs text-muted-foreground">{l.concepto}</div>
                                </TableCell>
                                <TableCell className={cn("text-right font-mono font-semibold", l.cargo > 0 ? "text-green-700" : "text-muted-foreground")}>
                                    {fmt(l.cargo)}
                                </TableCell>
                                <TableCell className={cn("text-right font-mono font-semibold", l.abono > 0 ? "text-red-700" : "text-muted-foreground")}>
                                    {fmt(l.abono)}
                                </TableCell>
                                <TableCell className="whitespace-nowrap font-mono text-xs">{l.ctaContable || '—'}</TableCell>
                                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{l.centroCostos || '—'}</TableCell>
                                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                    {l.tipoAmortizacion || '—'}
                                    <br />
                                    <span className="text-[11px]">{l.fechaEmision || '—'} → {l.fechaVencimiento || '—'}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditar(i)}>
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => onEliminar(i)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3 border-t p-4">
                <div className="min-w-[124px] rounded-lg border bg-card px-3.5 py-2.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Total cargos</div>
                    <div className="font-mono text-lg font-semibold text-green-700">{fmt(totalCargo)}</div>
                </div>
                <div className="min-w-[124px] rounded-lg border bg-card px-3.5 py-2.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Total abonos</div>
                    <div className="font-mono text-lg font-semibold text-red-700">{fmt(totalAbono)}</div>
                </div>
                <div className={cn(
                    "min-w-[124px] rounded-lg border-2 px-3.5 py-2.5",
                    cuadrado ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                )}>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Diferencia</div>
                    <div className={cn("font-mono text-lg font-semibold", cuadrado ? "text-green-700" : "text-red-700")}>
                        {fmt(diferencia)}
                    </div>
                    <div className={cn("text-[10px] font-semibold uppercase tracking-wide", cuadrado ? "text-green-700" : "text-red-700")}>
                        {cuadrado ? '✓ Cuadrado' : '✕ Descuadre'}
                    </div>
                </div>
            </div>
        </div>
    )
}
