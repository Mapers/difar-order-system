'use client'

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, AlertCircle, Plus, Trash2, Save } from "lucide-react"
import { toast } from "@/app/hooks/useToast"
import { ComprasService } from "@/app/services/contabilidad/ContabilidadService"
import type {
    ComprasPagosDatos, ComprasPagoPayload,
} from "@/app/types/contabilidad-types"

const money = (v: number) =>
    Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const selectCls = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm disabled:opacity-60"

type FilaPago = ComprasPagoPayload & { key: string }

let secuencia = 0
const nuevaKey = () => `n${++secuencia}`

export function PagosDialog({
    abierto, onCerrar, clave, titulo, onGuardado,
}: {
    abierto:     boolean
    onCerrar:    () => void
    clave:       number | null
    titulo:      string
    onGuardado?: () => void
}) {
    const [datos, setDatos]       = useState<ComprasPagosDatos | null>(null)
    const [filas, setFilas]       = useState<FilaPago[]>([])
    const [cargando, setCargando] = useState(false)
    const [guardando, setGuardando] = useState(false)
    const [error, setError]       = useState<string | null>(null)

    const cargar = useCallback(async (c: number) => {
        setCargando(true); setError(null)
        try {
            const d = await ComprasService.pagosObtener(c)
            setDatos(d)
            setFilas(d.pagos.map(p => ({
                key:           `p${p.idregcompraspagos}`,
                id:            p.idregcompraspagos,
                fecha:         String(p.compFechapago ?? '').slice(0, 10),
                tipoPago:      p.compTipopago ?? '',
                centroCosto:   p.compCentroCosto,
                observaciones: p.compObservaciones,
                importe:       Number(p.compImporte ?? 0),
                eliminar:      false,
            })))
        } catch (e: any) {
            setError(e?.response?.data?.message || "No se pudieron cargar los pagos.")
            setDatos(null); setFilas([])
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => {
        if (abierto && clave) cargar(clave)
    }, [abierto, clave, cargar])

    const setCampo = (key: string, campo: keyof ComprasPagoPayload, valor: unknown) =>
        setFilas(fs => fs.map(f => f.key === key ? { ...f, [campo]: valor } as FilaPago : f))

    const agregar = () => setFilas(fs => [...fs, {
        key: nuevaKey(), id: null,
        fecha: new Date().toISOString().slice(0, 10),
        tipoPago: datos?.tiposPago?.[0]?.Cod_Tipo_Amort ?? '',
        centroCosto: null, observaciones: null, importe: 0, eliminar: false,
    }])

    const quitar = (f: FilaPago) => f.id === null
        ? setFilas(fs => fs.filter(x => x.key !== f.key))
        : setCampo(f.key, 'eliminar', !f.eliminar)

    const vivas    = filas.filter(f => !f.eliminar)
    const sumaPagos = vivas.reduce((a, f) => a + Number(f.importe || 0), 0)
    const total    = Number(datos?.cabecera?.ImporteTotal ?? 0)
    const yaPagado = Number(datos?.cabecera?.SumaDeAmortizacion ?? 0)
    const saldo    = total - sumaPagos
    const excede   = sumaPagos - total > 0.005

    const guardar = async () => {
        if (!clave) return
        setGuardando(true)
        try {
            await ComprasService.pagosGuardar(clave, filas.map(({ key, ...p }) => p))
            toast({ title: "Pagos guardados", description: "Se recentralizó el documento." })
            onGuardado?.()
            await cargar(clave)
        } catch (e: any) {
            toast({
                title: "Error",
                description: e?.response?.data?.message || "No se pudieron guardar los pagos.",
                variant: "destructive",
            })
        } finally {
            setGuardando(false)
        }
    }

    return (
        <Dialog open={abierto} onOpenChange={(v) => { if (!v) onCerrar() }}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Pagos a cuenta · {titulo}</DialogTitle>
                    <DialogDescription>
                        {datos?.cabecera
                            ? `${datos.cabecera.Proveedor ?? datos.cabecera.Cod_Prov} · ${datos.cabecera.Moneda === 'NSO' ? 'S/' : datos.cabecera.Moneda} ${money(total)}`
                            : 'Pagos parciales de este documento a crédito.'}
                    </DialogDescription>
                </DialogHeader>

                {cargando ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
                    </div>
                ) : error ? (
                    <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3 rounded-md border bg-muted/40 p-3 text-sm sm:grid-cols-4">
                            <Resumen etiqueta="Importe total" valor={money(total)} />
                            <Resumen etiqueta="Amortizado en kardex" valor={money(yaPagado)} />
                            <Resumen etiqueta="Suma de pagos" valor={money(sumaPagos)} />
                            <Resumen
                                etiqueta="Saldo"
                                valor={money(saldo)}
                                tono={excede ? 'text-red-700' : saldo < 0.005 ? 'text-emerald-700' : ''}
                            />
                        </div>

                        {excede && (
                            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                <AlertCircle className="h-4 w-4" />
                                Los pagos superan el importe del documento.
                            </div>
                        )}

                        <div className="max-h-[42vh] overflow-auto rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-muted/60 backdrop-blur">
                                    <tr className="text-left text-xs text-muted-foreground">
                                        <th className="px-2 py-2 font-medium">Fecha</th>
                                        <th className="px-2 py-2 font-medium">Tipo de pago</th>
                                        <th className="px-2 py-2 font-medium">Centro de costos</th>
                                        <th className="px-2 py-2 font-medium">Observaciones</th>
                                        <th className="px-2 py-2 text-right font-medium">Importe</th>
                                        <th className="w-10 px-2 py-2" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {filas.length === 0 ? (
                                        <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                                            Sin pagos registrados. Agregá el primero.
                                        </td></tr>
                                    ) : filas.map(f => (
                                        <tr key={f.key} className={`border-t ${f.eliminar ? 'bg-red-50/60 opacity-60' : ''}`}>
                                            <td className="px-2 py-1.5">
                                                <Input type="date" className="h-9" value={f.fecha} disabled={f.eliminar}
                                                       onChange={e => setCampo(f.key, 'fecha', e.target.value)} />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <select className={selectCls} value={f.tipoPago} disabled={f.eliminar}
                                                        onChange={e => setCampo(f.key, 'tipoPago', e.target.value)}>
                                                    <option value="">Elegir</option>
                                                    {(datos?.tiposPago ?? []).map(t => (
                                                        <option key={t.Cod_Tipo_Amort} value={t.Cod_Tipo_Amort}>{t.Descripcion}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <select className={selectCls} value={f.centroCosto ?? ''} disabled={f.eliminar}
                                                        onChange={e => setCampo(f.key, 'centroCosto', e.target.value ? Number(e.target.value) : null)}>
                                                    <option value="">—</option>
                                                    {(datos?.centrosCosto ?? []).map(cc => (
                                                        <option key={cc.idCentroCostos} value={cc.idCentroCostos}>{cc.Descripcion}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <Input className="h-9" value={f.observaciones ?? ''} disabled={f.eliminar}
                                                       onChange={e => setCampo(f.key, 'observaciones', e.target.value)} />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <Input type="number" step="0.01" className="h-9 text-right tabular-nums"
                                                       value={f.importe} disabled={f.eliminar}
                                                       onChange={e => setCampo(f.key, 'importe', Number(e.target.value))} />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <Button variant="ghost" size="icon" className="h-9 w-9"
                                                        title={f.id === null ? 'Quitar' : f.eliminar ? 'No eliminar' : 'Eliminar al guardar'}
                                                        onClick={() => quitar(f)}>
                                                    <Trash2 className={`h-4 w-4 ${f.eliminar ? 'text-muted-foreground' : 'text-red-600'}`} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" size="sm" className="gap-1.5" onClick={agregar}>
                                <Plus className="h-4 w-4" /> Agregar pago
                            </Button>
                            <div className="ml-auto flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={onCerrar}>Cerrar</Button>
                                <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                                        onClick={guardar} disabled={guardando}>
                                    {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Guardar pagos
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}

function Resumen({ etiqueta, valor, tono = '' }: { etiqueta: string; valor: string; tono?: string }) {
    return (
        <div className="flex min-w-0 flex-col">
            <span className="text-[11px] text-muted-foreground">{etiqueta}</span>
            <span className={`font-semibold tabular-nums ${tono}`}>{valor}</span>
        </div>
    )
}
