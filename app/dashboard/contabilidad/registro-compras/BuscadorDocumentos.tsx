'use client'

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Paginador } from "@/components/ui/paginador"
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
    abierto, onCerrar, onElegir, catalogos,
}: {
    abierto:   boolean
    onCerrar:  () => void
    onElegir:  (clave: number) => void
    catalogos: ComprasCatalogos | null
}) {
    // Como en el sistema anterior: sin año ni período, se busca en todo el
    // registro por proveedor (RUC o nombre), serie o número.
    const [texto, setTexto]       = useState("")
    const [pagina, setPagina]     = useState(1)
    const [tamano, setTamano]     = useState(25)
    const [filas, setFilas]       = useState<ComprasResumen[]>([])
    const [total, setTotal]       = useState(0)
    const [totalPaginas, setTotalPaginas] = useState(1)
    const [cargando, setCargando] = useState(false)
    const [error, setError]       = useState<string | null>(null)
    const [buscado, setBuscado]   = useState(false)

    const nroBusqueda = useRef(0)

    const buscar = useCallback(async (t: string, p: number, tam: number) => {
        const mio = ++nroBusqueda.current
        setCargando(true)
        setError(null)
        try {
            const r = await ComprasService.buscarDocumentosPagina(t, p, tam)
            if (mio !== nroBusqueda.current) return
            setFilas(r.data)
            setTotal(r.total)
            setTotalPaginas(r.totalPaginas)
            setPagina(r.pagina)
            setBuscado(true)
        } catch (e: any) {
            if (mio !== nroBusqueda.current) return
            setError(e?.response?.data?.message || "No se pudieron buscar los documentos.")
            setFilas([])
            setTotal(0)
            setBuscado(true)
        } finally {
            if (mio === nroBusqueda.current) setCargando(false)
        }
    }, [])

    useEffect(() => {
        if (!abierto) return
        setTexto("")
        setPagina(1)
    }, [abierto])

    // Mientras se escribe se espera un poco; cambiar de página va directo.
    const ultimoTexto = useRef("")
    useEffect(() => {
        if (!abierto) return
        const espera = texto !== ultimoTexto.current && texto ? 350 : 0
        ultimoTexto.current = texto
        const t = setTimeout(() => buscar(texto, pagina, tamano), espera)
        return () => clearTimeout(t)
    }, [abierto, texto, pagina, tamano, buscar])

    const importe = (f: ComprasResumen) => `${f.Moneda === 'NSO' ? 'S/' : f.Moneda} ${money(f.ImporteTotal)}`
    // El documento trae solo el código del tipo (01, 07…); el nombre sale del catálogo que ya se cargó.
    const tipoDoc = (cod: string) => catalogos?.tiposDoc.find(x => x.Cod_Tipo === cod)
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
                                Busca en todo el registro por proveedor (RUC o nombre), serie o número.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="shrink-0 border-b bg-muted/40 px-5 py-3 sm:px-6">
                    <div className="flex min-w-0 flex-col gap-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Proveedor (RUC o nombre), serie o número</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                className="h-9 bg-background pl-8 pr-8"
                                value={texto}
                                onChange={e => { setTexto(e.target.value); setPagina(1) }}
                                placeholder="Escribí para filtrar"
                                autoFocus
                            />
                            {cargando ? (
                                <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-600" />
                            ) : texto && (
                                <button type="button" onClick={() => { setTexto(""); setPagina(1) }} title="Limpiar" aria-label="Limpiar"
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
                            {buscado ? 'No hay documentos con ese criterio.' : 'Buscando…'}
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
                                                    <span title={tipoDoc(f.Tipo_Doc)?.Descripcion} className="mr-1.5 rounded bg-blue-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                        {tipoDoc(f.Tipo_Doc)?.Abreviatura || f.TipoDocAbrev || f.Tipo_Doc}
                                                    </span>
                                                    <span className="font-mono text-xs">{resaltar(documento(f), texto)}</span>
                                                </td>
                                                <td className="max-w-[240px] truncate px-3 py-2.5" title={f.Proveedor ?? f.Cod_Prov}>
                                                    {resaltar(f.Proveedor || f.Cod_Prov, texto)}
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
                                                <span title={tipoDoc(f.Tipo_Doc)?.Descripcion} className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                    {tipoDoc(f.Tipo_Doc)?.Abreviatura || f.TipoDocAbrev || f.Tipo_Doc}
                                                </span>
                                                <span className="truncate font-mono text-xs font-semibold">{resaltar(documento(f), texto)}</span>
                                            </div>
                                            <p className="mt-1 truncate text-sm">{resaltar(f.Proveedor || f.Cod_Prov, texto)}</p>
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

                <div className="flex shrink-0 flex-col gap-3 border-t bg-muted/30 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="min-w-0 flex-1">
                        <Paginador
                            pagina={pagina} totalPaginas={totalPaginas} total={total} tamano={tamano}
                            onPagina={setPagina}
                            onTamano={t => { setTamano(t); setPagina(1) }}
                            etiqueta="documentos"
                        />
                    </div>
                    <Button variant="outline" size="sm" onClick={onCerrar} className="self-end sm:self-auto">Cerrar</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
