'use client'

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ComboSelect } from "@/components/ui/combo-select"
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Search, AlertCircle, FileSearch, ChevronRight, X, Inbox } from "lucide-react"
import { ComprasService } from "@/app/services/contabilidad/ContabilidadService"
import type { ComprasCatalogos, ComprasResumen } from "@/app/types/contabilidad-types"

const money = (v: number) =>
    Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fecha = (v: string | null) => {
    if (!v) return '—'
    const d = new Date(v)
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-PE', { timeZone: 'UTC' })
}

const TODO_EL_ANIO = { Numero: '', Mes: 'Todo el año' }

/** Resalta en el texto lo que el usuario escribió en el buscador. */
const resaltar = (valor: string, buscado: string) => {
    const q = buscado.trim()
    if (!q) return valor
    const i = valor.toLowerCase().indexOf(q.toLowerCase())
    if (i < 0) return valor
    return (
        <>
            {valor.slice(0, i)}
            <mark className="rounded bg-amber-200/80 px-0.5 text-inherit dark:bg-amber-500/40">{valor.slice(i, i + q.length)}</mark>
            {valor.slice(i + q.length)}
        </>
    )
}

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

    const meses = [TODO_EL_ANIO, ...(catalogos?.meses ?? []).map(x => ({ Numero: String(x.Numero), Mes: x.Mes }))]
    const importe = (f: ComprasResumen) => `${f.Moneda === 'NSO' ? 'S/' : f.Moneda} ${money(f.ImporteTotal)}`
    const documento = (f: ComprasResumen) => `${f.SerieDoc}-${f.NumeroDoc}`

    return (
        <Dialog open={abierto} onOpenChange={(v) => { if (!v) onCerrar() }}>
            <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="shrink-0 border-b px-5 pb-4 pt-5 text-left sm:px-6">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-blue-600/30">
                            <FileSearch className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <DialogTitle>Buscar documento</DialogTitle>
                            <DialogDescription className="text-xs">
                                Elegí el período y, si hace falta, escribí proveedor, serie o número.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid shrink-0 grid-cols-2 gap-3 border-b bg-muted/40 px-5 py-3 sm:grid-cols-[110px_170px_1fr] sm:px-6">
                    <div className="flex min-w-0 flex-col gap-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">
                            Año<span className="ml-0.5 text-red-500">*</span>
                        </Label>
                        <ComboSelect
                            value={anio}
                            onChange={x => setAnio(String(x.Anio))}
                            items={catalogos?.anios ?? []}
                            getKey={x => String(x.Anio)}
                            getLabel={x => String(x.Anio)}
                            placeholder="Elegir" searchPlaceholder="Buscar..." emptyText="Sin resultados"
                            triggerClassName="h-9 bg-background"
                        />
                    </div>

                    <div className="flex min-w-0 flex-col gap-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Período</Label>
                        <ComboSelect
                            value={periodo}
                            onChange={x => setPeriodo(x.Numero)}
                            items={meses}
                            getKey={x => x.Numero}
                            getLabel={x => x.Mes}
                            placeholder="Todo el año" searchPlaceholder="Buscar..." emptyText="Sin resultados"
                            triggerClassName="h-9 bg-background"
                        />
                    </div>

                    <div className="col-span-2 flex min-w-0 flex-col gap-1.5 sm:col-span-1">
                        <Label className="text-xs font-medium text-muted-foreground">Proveedor, serie o número</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                className="h-9 bg-background pl-8 pr-8"
                                value={texto}
                                onChange={e => setTexto(e.target.value)}
                                placeholder="Escribí para filtrar"
                                autoFocus
                            />
                            {cargando ? (
                                <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-600" />
                            ) : texto && (
                                <button type="button" onClick={() => setTexto("")} title="Limpiar" aria-label="Limpiar"
                                        className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-auto px-3 py-3 sm:px-6 sm:py-4">
                    {cargando && filas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" /> Buscando…
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-10 text-center text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                            <AlertCircle className="h-6 w-6" /> {error}
                        </div>
                    ) : filas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                                <Inbox className="h-6 w-6 opacity-60" />
                            </span>
                            {buscado ? 'No hay documentos con ese criterio.' : 'Elegí un año para empezar.'}
                        </div>
                    ) : (
                        <>
                            {/* Escritorio: tabla */}
                            <div className="hidden overflow-hidden rounded-xl border sm:block">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="border-b bg-gradient-to-b from-muted/60 to-muted text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                                            <th className="px-3 py-2.5 font-semibold">Fecha</th>
                                            <th className="px-3 py-2.5 font-semibold">Documento</th>
                                            <th className="px-3 py-2.5 font-semibold">Proveedor</th>
                                            <th className="px-3 py-2.5 text-right font-semibold">Importe</th>
                                            <th className="px-3 py-2.5 text-right font-semibold">Nº reg.</th>
                                            <th className="w-8" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filas.map(f => (
                                            <tr
                                                key={f.Clave}
                                                onClick={() => onElegir(f.Clave)}
                                                className="group cursor-pointer border-t transition-colors first:border-t-0 hover:bg-blue-50/70 dark:hover:bg-blue-950/30"
                                            >
                                                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{fecha(f.Fecha_Emision)}</td>
                                                <td className="whitespace-nowrap px-3 py-2.5">
                                                    <span className="mr-1.5 rounded bg-blue-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                        {f.Tipo_Doc}
                                                    </span>
                                                    <span className="font-mono text-xs">{resaltar(documento(f), texto)}</span>
                                                </td>
                                                <td className="max-w-[240px] truncate px-3 py-2.5" title={f.ProveedorNombre ?? f.Cod_Prov}>
                                                    {resaltar(f.ProveedorNombre || f.Cod_Prov, texto)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums">{importe(f)}</td>
                                                <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                                                    {f.NroRegistro ?? '—'}
                                                </td>
                                                <td className="pr-2">
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Celular: tarjetas */}
                            <div className="space-y-2 sm:hidden">
                                {filas.map(f => (
                                    <button
                                        key={f.Clave}
                                        type="button"
                                        onClick={() => onElegir(f.Clave)}
                                        className="flex w-full items-center gap-3 rounded-xl border bg-background p-3 text-left shadow-sm transition active:bg-blue-50 dark:active:bg-blue-950/30"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                    {f.Tipo_Doc}
                                                </span>
                                                <span className="truncate font-mono text-xs font-semibold">{resaltar(documento(f), texto)}</span>
                                            </div>
                                            <p className="mt-1 truncate text-sm">{resaltar(f.ProveedorNombre || f.Cod_Prov, texto)}</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {fecha(f.Fecha_Emision)} · Reg. {f.NroRegistro ?? '—'}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1">
                                            <span className="text-sm font-semibold tabular-nums">{importe(f)}</span>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex shrink-0 items-center justify-between gap-2 border-t bg-muted/30 px-5 py-3 text-xs text-muted-foreground sm:px-6">
                    <span>
                        {filas.length > 0 && (
                            <span className="rounded-full border bg-background px-2.5 py-1 font-medium text-foreground">
                                {filas.length} documento{filas.length !== 1 ? 's' : ''}
                            </span>
                        )}
                        {cargando && filas.length > 0 && ' · actualizando…'}
                    </span>
                    <Button variant="outline" size="sm" onClick={onCerrar}>Cerrar</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
