'use client'

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, AlertCircle, Plus, Trash2, Save } from "lucide-react"
import { toast } from "@/app/hooks/useToast"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ComprasService } from "@/app/services/contabilidad/ContabilidadService"
import type { ComprasTransporteDatos, ComprasTransportePayload } from "@/app/types/contabilidad-types"

const money = (v: unknown) =>
    Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const selectCls = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm disabled:opacity-60"

type FilaTransp = ComprasTransportePayload & { key: string }

let secuencia = 0
const nuevaKey = () => `n${++secuencia}`

export function TransporteDialog({
    abierto, onCerrar, clave, titulo,
}: { abierto: boolean; onCerrar: () => void; clave: number | null; titulo: string }) {
    const [datos, setDatos]         = useState<ComprasTransporteDatos | null>(null)
    const [filas, setFilas]         = useState<FilaTransp[]>([])
    const [cargando, setCargando]   = useState(false)
    const [guardando, setGuardando] = useState(false)
    const [error, setError]         = useState<string | null>(null)

    const cargar = useCallback(async (c: number) => {
        setCargando(true); setError(null)
        try {
            const d = await ComprasService.transporteObtener(c)
            setDatos(d)
            setFilas(d.filas.map(f => ({
                key:           `t${f.idTransporte}`,
                id:            f.idTransporte,
                idUnd:         f.IdUndTransporte,
                ciudad:        f.ciudadTransporte,
                km:            f.kmTransporte,
                observaciones: f.observTransporte,
                idDetalle:     f.idDetalle,
                eliminar:      false,
            })))
        } catch (e: any) {
            setError(e?.response?.data?.message || "No se pudo cargar el transporte.")
            setDatos(null); setFilas([])
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => {
        if (abierto && clave) cargar(clave)
    }, [abierto, clave, cargar])

    const setCampo = (key: string, campo: keyof ComprasTransportePayload, valor: unknown) =>
        setFilas(fs => fs.map(f => f.key === key ? { ...f, [campo]: valor } as FilaTransp : f))

    const agregar = () => setFilas(fs => [...fs, {
        key: nuevaKey(), id: null,
        idUnd: datos?.unidades?.[0]?.IdUndTransporte ?? null,
        ciudad: null, km: null, observaciones: null,
        idDetalle: datos?.lineas?.[0]?.Id_Compras_Detalle ?? null,
        eliminar: false,
    }])

    const quitar = (f: FilaTransp) => f.id === null
        ? setFilas(fs => fs.filter(x => x.key !== f.key))
        : setCampo(f.key, 'eliminar', !f.eliminar)

    const egresoDe = (idDetalle: number | null) =>
        datos?.lineas.find(l => l.Id_Compras_Detalle === idDetalle)?.Egreso ?? 0

    const totalEgresos = filas.filter(f => !f.eliminar)
        .reduce((a, f) => a + Number(egresoDe(f.idDetalle)), 0)

    const [confirmGuardar, setConfirmGuardar] = useState(false)

    const guardar = async () => {
        if (!clave) return
        setGuardando(true)
        try {
            await ComprasService.transporteGuardar(clave, filas.map(({ key, ...f }) => f))
            toast({ title: "Transporte guardado" })
            await cargar(clave)
        } catch (e: any) {
            toast({
                title: "Error",
                description: e?.response?.data?.message || "No se pudo guardar el transporte.",
                variant: "destructive",
            })
        } finally {
            setGuardando(false)
        }
    }

    return (
        <>
        <Dialog open={abierto} onOpenChange={(v) => { if (!v) onCerrar() }}>
            <DialogContent className="max-w-5xl">
                <DialogHeader>
                    <DialogTitle>Transporte · {titulo}</DialogTitle>
                    <DialogDescription>
                        Unidad, ciudad y kilómetros por línea del detalle. El egreso sale de la línea elegida.
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
                ) : (datos?.lineas.length ?? 0) === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                        El documento no tiene líneas de detalle: no hay a qué asociar el transporte.
                    </div>
                ) : (
                    <>
                        <div className="max-h-[45vh] overflow-auto rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-muted/60 backdrop-blur">
                                    <tr className="text-left text-xs text-muted-foreground">
                                        <th className="px-2 py-2 font-medium">Unidad</th>
                                        <th className="px-2 py-2 font-medium">Ciudad</th>
                                        <th className="px-2 py-2 font-medium">Km</th>
                                        <th className="px-2 py-2 font-medium">Línea del detalle</th>
                                        <th className="px-2 py-2 font-medium">Observaciones</th>
                                        <th className="px-2 py-2 text-right font-medium">Egreso</th>
                                        <th className="w-10 px-2 py-2" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {filas.length === 0 ? (
                                        <tr><td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                                            Sin transporte registrado. Agregá la primera fila.
                                        </td></tr>
                                    ) : filas.map(f => (
                                        <tr key={f.key} className={`border-t ${f.eliminar ? 'bg-red-50/60 opacity-60' : ''}`}>
                                            <td className="px-2 py-1.5">
                                                <select className={selectCls} value={f.idUnd ?? ''} disabled={f.eliminar}
                                                        onChange={e => setCampo(f.key, 'idUnd', e.target.value ? Number(e.target.value) : null)}>
                                                    <option value="">—</option>
                                                    {(datos?.unidades ?? []).map(u => (
                                                        <option key={u.IdUndTransporte} value={u.IdUndTransporte}>
                                                            {u.NroPlaca}{u.MarcaUndTransp ? ` · ${u.MarcaUndTransp}` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <Input className="h-9" list="ciudades-transporte" value={f.ciudad ?? ''}
                                                       disabled={f.eliminar}
                                                       onChange={e => setCampo(f.key, 'ciudad', e.target.value)} />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <Input className="h-9 w-24 text-right tabular-nums" value={f.km ?? ''}
                                                       disabled={f.eliminar}
                                                       onChange={e => setCampo(f.key, 'km', e.target.value)} />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <select className={selectCls} value={f.idDetalle ?? ''} disabled={f.eliminar}
                                                        onChange={e => setCampo(f.key, 'idDetalle', e.target.value ? Number(e.target.value) : null)}>
                                                    <option value="">—</option>
                                                    {(datos?.lineas ?? []).map(l => (
                                                        <option key={l.Id_Compras_Detalle} value={l.Id_Compras_Detalle}>
                                                            {l.Articulo}{l.NombreItem ? ` · ${l.NombreItem}` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <Input className="h-9" value={f.observaciones ?? ''} disabled={f.eliminar}
                                                       onChange={e => setCampo(f.key, 'observaciones', e.target.value)} />
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-muted-foreground">
                                                {money(egresoDe(f.idDetalle))}
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

                        <datalist id="ciudades-transporte">
                            {(datos?.ciudades ?? []).map(c => <option key={c} value={c} />)}
                        </datalist>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" size="sm" className="gap-1.5" onClick={agregar}>
                                <Plus className="h-4 w-4" /> Agregar fila
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Egresos: <span className="font-semibold tabular-nums text-foreground">{money(totalEgresos)}</span>
                            </span>
                            <div className="ml-auto flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={onCerrar}>Cerrar</Button>
                                <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                                        onClick={() => setConfirmGuardar(true)} disabled={guardando}>
                                    {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Guardar transporte
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>

        <AlertDialog open={confirmGuardar} onOpenChange={setConfirmGuardar}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Guardar el transporte</AlertDialogTitle>
                    <AlertDialogDescription>
                        Quedan {filas.filter(f => !f.eliminar).length} fila{filas.filter(f => !f.eliminar).length !== 1 ? 's' : ''} de transporte
                        {filas.some(f => f.eliminar) && <> y se borran {filas.filter(f => f.eliminar).length} marcada{filas.filter(f => f.eliminar).length !== 1 ? 's' : ''}</>}.
                        Se graban los cambios de transporte de este documento.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction className="bg-emerald-600 hover:bg-emerald-700"
                                       onClick={() => { setConfirmGuardar(false); guardar() }}>
                        Sí, guardar transporte
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    )
}
