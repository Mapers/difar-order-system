'use client'

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, AlertCircle } from "lucide-react"
import { ComprasService } from "@/app/services/contabilidad/ContabilidadService"
import type { ComprasSaldoFila } from "@/app/types/contabilidad-types"

const money = (v: unknown) =>
    Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fecha = (v: unknown) => {
    if (!v) return '—'
    const d = new Date(String(v))
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-PE', { timeZone: 'UTC' })
}

export function SaldoDialog({
    abierto, onCerrar, clave, titulo,
}: { abierto: boolean; onCerrar: () => void; clave: number | null; titulo: string }) {
    const [filas, setFilas]       = useState<ComprasSaldoFila[]>([])
    const [cargando, setCargando] = useState(false)
    const [error, setError]       = useState<string | null>(null)

    useEffect(() => {
        if (!abierto || !clave) return
        let vivo = true
        setCargando(true); setError(null)
        ComprasService.saldoComprobante(clave)
            .then(r => { if (vivo) setFilas(r) })
            .catch(e => { if (vivo) setError(e?.response?.data?.message || "No se pudo obtener el saldo.") })
            .finally(() => { if (vivo) setCargando(false) })
        return () => { vivo = false }
    }, [abierto, clave])

    const totSoles   = filas.reduce((a, f) => a + Number(f.SaldoSoles   ?? 0), 0)
    const totDolares = filas.reduce((a, f) => a + Number(f.SaldoDolares ?? 0), 0)
    const cab = filas[0]

    return (
        <Dialog open={abierto} onOpenChange={(v) => { if (!v) onCerrar() }}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Saldo del comprobante {titulo}</DialogTitle>
                    <DialogDescription>
                        {cab
                            ? `${cab.Nombre ?? cab.Cod_Prov} · movimientos del kardex de proveedores`
                            : 'Movimientos del kardex de proveedores de este documento.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[55vh] overflow-auto rounded-md border">
                    {cargando ? (
                        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center gap-2 py-10 text-sm text-red-700">
                            <AlertCircle className="h-4 w-4" /> {error}
                        </div>
                    ) : filas.length === 0 ? (
                        <div className="py-10 text-center text-sm text-muted-foreground">
                            Este documento no tiene movimientos en el kardex de proveedores.
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-muted/60 backdrop-blur">
                                <tr className="text-left text-xs text-muted-foreground">
                                    <th className="px-3 py-2 font-medium">Fecha</th>
                                    <th className="px-3 py-2 font-medium">Concepto</th>
                                    <th className="px-3 py-2 text-right font-medium">Provisión</th>
                                    <th className="px-3 py-2 text-right font-medium">Amortización</th>
                                    <th className="px-3 py-2 text-right font-medium">Saldo S/</th>
                                    <th className="px-3 py-2 text-right font-medium">Saldo US$</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filas.map((f, i) => (
                                    <tr key={i} className="border-t">
                                        <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                                            {fecha(f.FechaAmortizacion)}
                                        </td>
                                        <td className="px-3 py-2">
                                            {String(f.Descripcion2 ?? f.TipoAmortizacion ?? '—').trim() || '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{money(f.Provision)}</td>
                                        <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{money(f.Amortizacion)}</td>
                                        <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{money(f.SaldoSoles)}</td>
                                        <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{money(f.SaldoDolares)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="sticky bottom-0 border-t-2 bg-muted/60 backdrop-blur">
                                <tr className="font-semibold">
                                    <td className="px-3 py-2" colSpan={4}>Saldo</td>
                                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{money(totSoles)}</td>
                                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{money(totDolares)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>

                <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={onCerrar}>Cerrar</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
