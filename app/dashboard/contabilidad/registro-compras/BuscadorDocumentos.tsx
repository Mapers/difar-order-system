'use client'

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Search, AlertCircle } from "lucide-react"
import { ComprasService } from "@/app/services/contabilidad/ContabilidadService"
import type { ComprasCatalogos, ComprasResumen } from "@/app/types/contabilidad-types"

const money = (v: number) =>
    Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fecha = (v: string | null) => {
    if (!v) return '—'
    const d = new Date(v)
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-PE', { timeZone: 'UTC' })
}

const selectCls = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm"

export function BuscadorDocumentos({
    abierto, onCerrar, onElegir, catalogos, anioInicial, periodoInicial,
}: {
    abierto:        boolean
    onCerrar:       () => void
    onElegir:       (clave: number) => void
    catalogos:      ComprasCatalogos | null
    anioInicial:    string
    periodoInicial: string
}) {
    const [anio, setAnio]       = useState(anioInicial)
    const [periodo, setPeriodo] = useState(periodoInicial)
    const [texto, setTexto]     = useState("")
    const [filas, setFilas]     = useState<ComprasResumen[]>([])
    const [cargando, setCargando] = useState(false)
    const [error, setError]     = useState<string | null>(null)
    const [buscado, setBuscado] = useState(false)

    const nroBusqueda = useRef(0)

    const buscar = useCallback(async (a: string, p: string, t: string) => {
        if (!a) { setFilas([]); setBuscado(false); return }
        const mio = ++nroBusqueda.current
        setCargando(true)
        setError(null)
        try {
            const r = await ComprasService.buscarDocumentos(a, p || undefined, t || undefined)
            if (mio !== nroBusqueda.current) return
            setFilas(r)
            setBuscado(true)
        } catch (e: any) {
            if (mio !== nroBusqueda.current) return
            setError(e?.response?.data?.message || "No se pudieron buscar los documentos.")
            setFilas([])
            setBuscado(true)
        } finally {
            if (mio === nroBusqueda.current) setCargando(false)
        }
    }, [])

    useEffect(() => {
        if (!abierto) return
        setAnio(anioInicial)
        setPeriodo(periodoInicial)
        setTexto("")
        buscar(anioInicial, periodoInicial, "")
    }, [abierto, anioInicial, periodoInicial, buscar])

    useEffect(() => {
        if (!abierto) return
        const t = setTimeout(() => buscar(anio, periodo, texto), texto ? 350 : 0)
        return () => clearTimeout(t)
    }, [abierto, anio, periodo, texto, buscar])

    return (
        <Dialog open={abierto} onOpenChange={(v) => { if (!v) onCerrar() }}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Buscar documento</DialogTitle>
                    <DialogDescription>
                        Elegí el período y, si hace falta, escribí proveedor, serie o número.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[120px_160px_1fr]">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">
                            Año<span className="ml-0.5 text-red-500">*</span>
                        </Label>
                        <select className={selectCls} value={anio} onChange={e => setAnio(e.target.value)}>
                            {(catalogos?.anios ?? []).map(x => (
                                <option key={x.Anio} value={x.Anio}>{x.Anio}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Período</Label>
                        <select className={selectCls} value={periodo} onChange={e => setPeriodo(e.target.value)}>
                            <option value="">Todo el año</option>
                            {(catalogos?.meses ?? []).map(x => (
                                <option key={x.Numero} value={x.Numero}>{x.Mes}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Proveedor, serie o número</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                className="h-9 pl-8"
                                value={texto}
                                onChange={e => setTexto(e.target.value)}
                                placeholder="Escribí para filtrar"
                                autoFocus
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-1 max-h-[55vh] overflow-auto rounded-md border">
                    {cargando && filas.length === 0 ? (
                        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Buscando…
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center gap-2 py-10 text-sm text-red-700">
                            <AlertCircle className="h-4 w-4" /> {error}
                        </div>
                    ) : filas.length === 0 ? (
                        <div className="py-10 text-center text-sm text-muted-foreground">
                            {buscado ? 'No hay documentos con ese criterio.' : 'Elegí un año para empezar.'}
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-muted/60 backdrop-blur">
                                <tr className="text-left text-xs text-muted-foreground">
                                    <th className="px-3 py-2 font-medium">Fecha</th>
                                    <th className="px-3 py-2 font-medium">Documento</th>
                                    <th className="px-3 py-2 font-medium">Proveedor</th>
                                    <th className="px-3 py-2 text-right font-medium">Importe</th>
                                    <th className="px-3 py-2 text-right font-medium">Nº reg.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filas.map(f => (
                                    <tr
                                        key={f.Clave}
                                        onClick={() => onElegir(f.Clave)}
                                        className="cursor-pointer border-t hover:bg-accent/60"
                                    >
                                        <td className="whitespace-nowrap px-3 py-2 tabular-nums">{fecha(f.Fecha_Emision)}</td>
                                        <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                                            {f.Tipo_Doc} {f.SerieDoc}-{f.NumeroDoc}
                                        </td>
                                        <td className="max-w-[260px] truncate px-3 py-2" title={f.ProveedorNombre ?? f.Cod_Prov}>
                                            {f.ProveedorNombre || f.Cod_Prov}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                                            {f.Moneda === 'NSO' ? 'S/ ' : `${f.Moneda} `}{money(f.ImporteTotal)}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-muted-foreground">
                                            {f.NroRegistro ?? '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                        {filas.length > 0 && `${filas.length} documento${filas.length !== 1 ? 's' : ''}`}
                        {cargando && filas.length > 0 && ' · actualizando…'}
                    </span>
                    <Button variant="ghost" size="sm" onClick={onCerrar}>Cerrar</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
