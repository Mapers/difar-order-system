'use client'

import { useEffect, useState } from 'react'
import { Building2, CreditCard, FileText, MapPin, Package, Phone, Receipt, Truck, Wallet } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ComprobantePdfModal } from '@/app/dashboard/comprobantes/modals/ComprobantePdfModal'
import apiClient from '@/app/api/client'
import { cabeceraSesion } from '@/app/api/sesion'
import { fecha, soles, type ComprobanteMes, type DetalleComprobanteMes } from '@/app/types/cobranza-ventas-mes'
import { Situacion, Tardo } from './TablaMes'

type Props = {
    comprobante: ComprobanteMes | null
    periodo: { anio: number; mes: number }
    vendedor: string
    onCerrar: () => void
}

function Seccion({ icono: Icono, titulo, children }: { icono: typeof MapPin; titulo: string; children: React.ReactNode }) {
    return (
        <section className="rounded-xl border bg-card p-4">
            <h3 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Icono className="h-3.5 w-3.5" /> {titulo}
            </h3>
            {children}
        </section>
    )
}

function Dato({ etiqueta, valor, ancho }: { etiqueta: string; valor: React.ReactNode; ancho?: boolean }) {
    return (
        <div className={ancho ? 'col-span-2' : ''}>
            <div className="text-[11px] text-muted-foreground">{etiqueta}</div>
            <div className="text-sm font-medium leading-snug">{valor || '—'}</div>
        </div>
    )
}

/** Panel con todo lo de un comprobante: cliente, sucursal, crédito, productos y pagos. */
export function DetalleMes({ comprobante: c, periodo, vendedor, onCerrar }: Props) {
    const [detalle, setDetalle] = useState<DetalleComprobanteMes | null>(null)
    const [error, setError] = useState(false)
    const [pdf, setPdf] = useState(false)

    useEffect(() => {
        if (!c) return
        let vigente = true
        setDetalle(null); setError(false)
        apiClient.get(`/cobranza-ventas-mes/comprobante/${c.id}`, {
            params: { anio: periodo.anio, mes: periodo.mes, vendedor: vendedor || undefined },
            headers: cabeceraSesion(),
        })
            .then(res => { if (vigente) setDetalle(res.data?.data ?? null) })
            .catch(() => { if (vigente) setError(true) })
        return () => { vigente = false }
    }, [c, periodo.anio, periodo.mes, vendedor])

    const d = detalle
    return (
        <Sheet open={!!c} onOpenChange={v => { if (!v) onCerrar() }}>
            <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl">
                {c && (
                    <>
                        <SheetHeader className="sticky top-0 z-10 border-b bg-background/95 px-5 py-4 text-left backdrop-blur">
                            <SheetTitle className="flex flex-wrap items-center gap-2 font-mono text-lg">
                                {c.comprobante}
                                {c.estado === 'deuda' ? <Situacion c={c} /> : <Tardo c={c} />}
                            </SheetTitle>
                            <SheetDescription className="text-left">{c.nombreComercial || c.cliente}</SheetDescription>
                            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                                <div className="rounded-lg bg-muted px-2 py-1.5"><div className="text-[10px] uppercase text-muted-foreground">Total</div><div className="text-sm font-bold tabular-nums">{soles(c.total, c.moneda)}</div></div>
                                <div className="rounded-lg bg-emerald-50 px-2 py-1.5"><div className="text-[10px] uppercase text-emerald-700">Cobrado</div><div className="text-sm font-bold tabular-nums text-emerald-700">{soles(c.abonado, c.moneda)}</div></div>
                                <div className="rounded-lg bg-red-50 px-2 py-1.5"><div className="text-[10px] uppercase text-red-700">Saldo</div><div className="text-sm font-bold tabular-nums text-red-700">{soles(c.saldo, c.moneda)}</div></div>
                            </div>
                            <Button variant="outline" size="sm" className="mt-2 w-full gap-1.5" onClick={() => setPdf(true)}>
                                <FileText className="h-4 w-4" /> Ver PDF del comprobante
                            </Button>
                        </SheetHeader>

                        <div className="space-y-3 p-5">
                            {c.diferenciaKardex > 0 && (
                                <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                    La cuenta corriente registra {soles(c.diferenciaKardex, c.moneda)} más que el comprobante.
                                </div>
                            )}

                            <Seccion icono={Receipt} titulo="Comprobante">
                                <div className="grid grid-cols-2 gap-3">
                                    <Dato etiqueta="Emisión" valor={fecha(c.emision)} />
                                    <Dato etiqueta="Vencimiento" valor={fecha(c.vencimiento)} />
                                    <Dato etiqueta="Condición" valor={c.contado ? 'Contado' : c.condicion} />
                                    <Dato etiqueta="Vendedor" valor={c.vendedor} />
                                    <Dato etiqueta="Pedido" valor={d?.sucursal.pedido ? `N° ${d.sucursal.pedido}${d.sucursal.fechaPedido ? ` · ${fecha(d.sucursal.fechaPedido)}` : ''}` : (c.pedido ? `N° ${c.pedido}` : null)} />
                                    <Dato etiqueta="Almacén" valor={d?.sucursal.almacen} />
                                    {!!d?.guias.length && <Dato ancho etiqueta="Guías de remisión" valor={d.guias.join(', ')} />}
                                    {!!d?.cuotas.length && d.cuotas.length > 1 && (
                                        <Dato ancho etiqueta="Cuotas" valor={d.cuotas.map(q => `${q.numero}: ${fecha(q.fecha)} · ${soles(q.monto, c.moneda)}`).join(' | ')} />
                                    )}
                                </div>
                            </Seccion>

                            {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">No se pudo cargar el detalle del comprobante.</div>}
                            {!d && !error && <div className="space-y-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>}

                            {d && (
                                <>
                                    <Seccion icono={Building2} titulo="Cliente">
                                        <div className="grid grid-cols-2 gap-3">
                                            <Dato ancho etiqueta="Razón social" valor={d.cliente.razonSocial} />
                                            <Dato etiqueta="RUC / DNI" valor={d.cliente.ruc} />
                                            <Dato etiqueta="Zona" valor={d.cliente.zona} />
                                            <Dato ancho etiqueta="Dirección fiscal" valor={[d.cliente.direccion, d.cliente.distrito].filter(Boolean).join(' · ')} />
                                            <Dato etiqueta="Teléfono" valor={d.cliente.telefono && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{d.cliente.telefono}</span>} />
                                            <Dato etiqueta="Correo" valor={d.cliente.correo} />
                                        </div>
                                    </Seccion>

                                    <Seccion icono={Truck} titulo="Sucursal de entrega">
                                        <div className="grid grid-cols-2 gap-3">
                                            <Dato ancho etiqueta="Dirección de entrega" valor={d.sucursal.direccionEntrega} />
                                            {d.sucursal.referencia && <Dato ancho etiqueta="Referencia" valor={d.sucursal.referencia} />}
                                            <Dato etiqueta="Contacto" valor={d.sucursal.contacto} />
                                            <Dato etiqueta="Teléfono" valor={d.sucursal.telefono} />
                                        </div>
                                    </Seccion>

                                    <Seccion icono={CreditCard} titulo="Línea de crédito">
                                        {d.credito ? (
                                            <>
                                                <div className="grid grid-cols-3 gap-2 text-center">
                                                    <div><div className="text-[11px] text-muted-foreground">Asignada</div><div className="text-sm font-bold tabular-nums">{soles(d.credito.linea)}</div></div>
                                                    <div><div className="text-[11px] text-muted-foreground">Usada</div><div className="text-sm font-bold tabular-nums text-amber-700">{soles(d.credito.usado)}</div></div>
                                                    <div><div className="text-[11px] text-muted-foreground">Disponible</div><div className={`text-sm font-bold tabular-nums ${d.credito.disponible < 0 ? 'text-red-700' : 'text-emerald-700'}`}>{soles(d.credito.disponible)}</div></div>
                                                </div>
                                                {d.credito.linea > 0 && (
                                                    <div className="mt-2 overflow-hidden rounded-full bg-muted">
                                                        <div className={`h-1.5 ${d.credito.usado > d.credito.linea ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, (d.credito.usado / d.credito.linea) * 100)}%` }} />
                                                    </div>
                                                )}
                                                <div className="mt-2 text-xs text-muted-foreground">
                                                    {d.credito.linea === 0 ? 'Sin línea de crédito asignada. ' : ''}{d.credito.documentosPendientes} documentos pendientes en total.
                                                </div>
                                            </>
                                        ) : <div className="text-sm text-muted-foreground">Sin información de crédito.</div>}
                                    </Seccion>

                                    <Seccion icono={Package} titulo={`Productos (${d.productos.length})`}>
                                        <div className="divide-y">
                                            {d.productos.map((p, i) => (
                                                <div key={i} className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0">
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium leading-snug">{p.producto}</div>
                                                        <div className="text-[11px] text-muted-foreground">
                                                            {[p.laboratorio, p.lote && `Lote ${p.lote}`, p.vencimientoLote && `vence ${p.vencimientoLote}`].filter(Boolean).join(' · ') || p.codigo}
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 text-right tabular-nums">
                                                        <div className="text-sm font-semibold">{soles(p.total, c.moneda)}</div>
                                                        <div className="text-[11px] text-muted-foreground">{p.cantidad} {p.unidad} × {p.precio.toFixed(2)}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Seccion>

                                    <Seccion icono={Wallet} titulo={`Pagos (${d.pagos.length})`}>
                                        {d.pagos.length ? (
                                            <div className="divide-y">
                                                {d.pagos.map((p, i) => (
                                                    <div key={i} className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0">
                                                        <div className="min-w-0 text-sm">
                                                            <div className="font-medium">{fecha(p.fecha)} · {p.forma}</div>
                                                            <div className="text-[11px] text-muted-foreground">
                                                                {[p.planilla && `Planilla ${p.planilla}`, p.banco, p.operacion && `Op. ${p.operacion}`].filter(Boolean).join(' · ')}
                                                            </div>
                                                        </div>
                                                        <div className="shrink-0 text-sm font-semibold tabular-nums text-emerald-700">{soles(p.importe, c.moneda)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-muted-foreground">
                                                {c.abonado > 0
                                                    ? `Registra ${soles(c.abonado, c.moneda)} cobrado en la cuenta corriente, sin detalle en las amortizaciones del período (por ejemplo, una nota de crédito o un pago al contado).`
                                                    : 'Todavía no registra pagos.'}
                                            </div>
                                        )}
                                    </Seccion>
                                </>
                            )}
                        </div>

                        <ComprobantePdfModal open={pdf} onOpenChange={setPdf} numeroComprobante={c.comprobante} />
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}
