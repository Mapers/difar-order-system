'use client'

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Loader2, Save, Plus, Trash2, FolderOpen, Lock, AlertCircle, X, RefreshCw,
    BookOpen, Wallet, ChevronLeft, ChevronRight, Search, Receipt, CalendarDays,
    ListOrdered, ArrowUpRight, ArrowDownRight, Scale, type LucideIcon,
} from "lucide-react"
import { useLibroCaja, FilaEdicion } from "./useLibroCaja"
import { PersonaPicker } from "./PersonaPicker"

const money = (v: number) =>
    Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

/** 'YYYY-MM-DD' + n días -> 'YYYY-MM-DD'. En UTC para que el cambio de hora no mueva el día. */
const moverDia = (fecha: string, dias: number) => {
    const d = new Date(`${fecha}T00:00:00Z`)
    if (isNaN(d.getTime())) return fecha
    d.setUTCDate(d.getUTCDate() + dias)
    return d.toISOString().slice(0, 10)
}

const hoyISO = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 'YYYY-MM-DD...' -> 'Lunes 12/10/2026'. */
const fechaLarga = (fecha?: string) => {
    const iso = String(fecha ?? '').slice(0, 10)
    const d = new Date(`${iso}T00:00:00Z`)
    if (isNaN(d.getTime())) return ''
    return `${DIAS[d.getUTCDay()]} ${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
}

export default function LibroCajaBancosPage() {
    const c = useLibroCaja()
    const [confirmEliminarVoucher, setConfirmEliminarVoucher] = useState(false)
    const [confirmEliminarLineas, setConfirmEliminarLineas] = useState(false)

    const cat = c.catalogos
    const marcadas = c.filas.filter(f => f.eliminar && f.id !== null).length
    const diferencia = c.totales.ingresos - c.totales.egresos
    // Qué parte de los egresos cubren los ingresos, para la barra de Diferencia.
    const cobertura = c.totales.egresos > 0
        ? Math.min(100, Math.round((c.totales.ingresos / c.totales.egresos) * 100))
        : (c.totales.ingresos > 0 ? 100 : 0)

    return (
        <div className="grid grid-cols-1 gap-5 p-4 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/30">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                            Libro Caja y Bancos
                        </h1>
                        <p className="text-sm md:text-base text-muted-foreground">
                            Un voucher por caja y por día. Al guardar se regenera el asiento contable y el kardex.
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {c.cabecera && (c.cerrado ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                            <Lock className="h-3.5 w-3.5" /> Solo lectura
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Editable
                        </span>
                    ))}
                    {cat?.fechaCierre && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                            <Lock className="h-3.5 w-3.5" />
                            Cierre contable: {String(cat.fechaCierre).slice(0, 10)} · fechas anteriores son solo lectura
                        </span>
                    )}
                </div>
            </div>

            <Card className="border-t-[3px] border-t-blue-600 bg-gradient-to-b from-background to-muted/30 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                        <div className="flex flex-col gap-1.5 lg:w-80">
                            <Label className="text-xs font-semibold text-muted-foreground">Caja</Label>
                            <Select
                                value={c.caja != null ? String(c.caja) : ''}
                                onValueChange={v => c.setCaja(Number(v))}
                                disabled={c.cargandoCatalogos}
                            >
                                <SelectTrigger className="h-10">
                                    <span className="!flex min-w-0 items-center gap-2">
                                        <Wallet className="h-4 w-4 shrink-0 text-blue-600" />
                                        <SelectValue placeholder={c.cargandoCatalogos ? "Cargando..." : "Elegir caja..."} />
                                    </span>
                                </SelectTrigger>
                                <SelectContent>
                                    {(cat?.cajas ?? []).map(k => (
                                        <SelectItem key={k.IdCaja} value={String(k.IdCaja)}>
                                            {k.IdCaja} · {k.Descripcion}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground">Fecha</Label>
                            <div className="flex items-center gap-1.5">
                                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0"
                                        onClick={() => c.setFecha(moverDia(c.fecha, -1))} title="Día anterior">
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Input type="date" className="h-10 w-full min-w-0 sm:w-44" value={c.fecha} onChange={e => c.setFecha(e.target.value)} />
                                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0"
                                        onClick={() => c.setFecha(moverDia(c.fecha, 1))} title="Día siguiente">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" className="h-10 shrink-0 font-semibold" onClick={() => c.setFecha(hoyISO())}>
                                    Hoy
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 lg:ml-auto">
                            <Button onClick={() => c.abrir(false)} disabled={c.cargando} variant="outline" className="h-10 gap-1.5 font-semibold"
                                    title="Carga el voucher de esa caja y fecha, si ya existe">
                                {c.cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                Consultar
                            </Button>
                            <Button onClick={() => c.abrir(true)} disabled={c.cargando}
                                    className="h-10 gap-1.5 bg-blue-600 font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700"
                                    title="Crea el voucher del día; si ya existe, lo abre">
                                <Plus className="h-4 w-4" />
                                Nuevo voucher
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {c.error && (
                <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{c.error}</span>
                </div>
            )}

            {!c.cabecera && !c.error && (
                <Card className="shadow-sm">
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <FolderOpen className="h-12 w-12 mb-3 opacity-20" />
                        <p className="text-sm font-medium">Elige una caja y una fecha, y consulta el voucher</p>
                    </div>
                </Card>
            )}

            {c.cabecera && (
                <>
                    {/* Resumen del voucher. Los totales se recalculan al editar las líneas. */}
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                        <div className="rounded-xl bg-gradient-to-br from-blue-900 to-blue-600 p-3.5 text-white shadow-sm">
                            <Kpi etiqueta="Voucher" icono={Receipt} iconoCls="bg-white/20 text-white" etiquetaCls="text-blue-200" />
                            <p className="mt-1 font-mono text-base font-bold sm:text-lg">{c.cabecera.Numero || '—'}</p>
                            <p className="text-xs text-blue-100">Item {c.cabecera.Item} · {c.cabecera.CajaDescripcion}</p>
                        </div>
                        <KpiCard etiqueta="Periodo" icono={CalendarDays} iconoCls="bg-blue-50 text-blue-600 dark:bg-blue-950">
                            <p className="mt-1 text-lg font-bold">
                                {(c.cabecera.MesNombre || c.cabecera.Mes_Registro)} {c.cabecera.Year_Registro}
                            </p>
                            <p className="text-xs text-muted-foreground">{fechaLarga(c.cabecera.Fecha)}</p>
                        </KpiCard>
                        <KpiCard etiqueta="Líneas" icono={ListOrdered} iconoCls="bg-blue-50 text-blue-600 dark:bg-blue-950">
                            <p className="mt-1 text-lg font-bold">{c.totales.lineas}</p>
                            <p className="text-xs text-muted-foreground">
                                {marcadas > 0 ? `${marcadas} marcada${marcadas !== 1 ? 's' : ''} para eliminar` : 'Ninguna marcada'}
                            </p>
                        </KpiCard>
                        <KpiCard etiqueta="Ingresos" icono={ArrowUpRight} iconoCls="bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
                            <p className="mt-1 font-mono text-base font-bold sm:text-lg text-emerald-700 dark:text-emerald-400">S/ {money(c.totales.ingresos)}</p>
                        </KpiCard>
                        <KpiCard etiqueta="Egresos" icono={ArrowDownRight} iconoCls="bg-red-50 text-red-600 dark:bg-red-950">
                            <p className="mt-1 font-mono text-base font-bold sm:text-lg text-red-700 dark:text-red-400">S/ {money(c.totales.egresos)}</p>
                        </KpiCard>
                        <KpiCard etiqueta="Diferencia" icono={Scale} iconoCls="bg-amber-100 text-amber-700 dark:bg-amber-950"
                                 className="border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/40">
                            <p className="mt-1 font-mono text-base font-bold sm:text-lg text-amber-700 dark:text-amber-400">S/ {money(diferencia)}</p>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-amber-200 dark:bg-amber-900">
                                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${cobertura}%` }} />
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground">Ingresos cubren {cobertura}% de egresos</p>
                        </KpiCard>
                    </div>

                    <Card className="overflow-hidden shadow-sm">
                        {c.cerrado && (
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border-b border-red-200 text-red-700 text-sm">
                                <Lock className="h-4 w-4 shrink-0" />
                                <span>
                                    Este voucher está dentro del cierre contable: es de solo lectura.
                                </span>
                            </div>
                        )}

                        <div className="overflow-auto">
                            <table className="w-full min-w-[1100px] text-xs border-collapse">
                                <thead>
                                    <tr className="sticky top-0 z-10 bg-gradient-to-b from-muted/60 to-muted">
                                        <Th w="34"><Trash2 className="mx-auto h-3.5 w-3.5" /></Th>
                                        <Th w="28">#</Th>
                                        <Th w="90">Tipo doc</Th>
                                        <Th w="70">Serie</Th>
                                        <Th w="90">Nro doc</Th>
                                        <Th w="150">Persona / Empresa</Th>
                                        <Th>Detalle</Th>
                                        <Th w="100" right>Ingreso</Th>
                                        <Th w="100" right>Egreso</Th>
                                        <Th w="110">Tipo pago</Th>
                                        <Th w="120">Cta. contable</Th>
                                        <Th w="110">C. costos</Th>
                                        <Th w="40" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {c.filas.length === 0 ? (
                                        <tr>
                                            <td colSpan={13} className="text-center py-12 text-muted-foreground">
                                                El voucher no tiene líneas. Agrega una para empezar.
                                            </td>
                                        </tr>
                                    ) : c.filas.map((f, i) => (
                                        <Fila
                                            key={f.key}
                                            n={i + 1}
                                            f={f}
                                            cat={cat}
                                            cerrado={c.cerrado}
                                            setCampo={c.setCampo}
                                            setPersona={c.setPersona}
                                            quitar={c.quitarFilaNueva}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 p-4 border-t border-border bg-gradient-to-r from-background to-muted/30">
                            <Button
                                variant="outline" size="sm"
                                className="gap-1.5 border-dashed border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                onClick={c.agregarFila} disabled={c.cerrado}
                            >
                                <Plus className="h-4 w-4" /> Agregar línea
                            </Button>

                            <Button
                                variant="outline" size="sm" className="gap-1.5 text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
                                onClick={() => setConfirmEliminarLineas(true)}
                                disabled={c.cerrado || c.guardando || marcadas === 0}
                                title={marcadas === 0 ? 'Marca la casilla de las líneas que quieras eliminar' : undefined}
                            >
                                <Trash2 className="h-4 w-4" /> Eliminar marcadas ({marcadas})
                            </Button>

                            <Button
                                variant="ghost" size="sm" className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                                onClick={() => setConfirmEliminarVoucher(true)}
                                disabled={c.cerrado}
                            >
                                <X className="h-4 w-4" /> Eliminar voucher
                            </Button>

                            <div className="ml-auto flex flex-wrap items-center gap-2">
                                {c.hayCambios && !c.cerrado && (
                                    <span className="mr-1 inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                                        <span className="h-2 w-2 rounded-full bg-amber-500" /> Cambios sin guardar
                                    </span>
                                )}
                                <Button
                                    variant="outline" size="sm" className="gap-1.5"
                                    onClick={() => c.abrir(false)} disabled={c.cargando}
                                >
                                    <RefreshCw className="h-4 w-4" /> Actualizar
                                </Button>

                                <Button
                                    size="sm"
                                    className="gap-1.5 bg-emerald-600 text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700"
                                    onClick={c.guardar}
                                    disabled={c.guardando || c.cerrado || !c.hayCambios}
                                    title={!c.hayCambios ? 'No hay cambios por guardar' : undefined}
                                >
                                    {c.guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Guardar
                                </Button>
                            </div>
                        </div>
                    </Card>
                </>
            )}

            <AlertDialog open={confirmEliminarLineas} onOpenChange={setConfirmEliminarLineas}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar líneas marcadas</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se guardará el voucher y después se eliminarán {marcadas} línea
                            {marcadas !== 1 ? 's' : ''}, regenerando el asiento contable.
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => { setConfirmEliminarLineas(false); c.eliminarMarcadas() }}
                        >
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={confirmEliminarVoucher} onOpenChange={setConfirmEliminarVoucher}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar el voucher</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará el voucher {c.cabecera?.Numero} junto con su asiento contable.
                            Solo procede si el detalle no tiene importes. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => { setConfirmEliminarVoucher(false); c.eliminarVoucher() }}
                        >
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function Th({ children, w, right = false }: { children?: React.ReactNode; w?: string; right?: boolean }) {
    return (
        <th
            style={w ? { width: `${w}px` } : undefined}
            className={`py-2 px-2 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider border-b ${right ? 'text-right' : 'text-left'}`}
        >
            {children}
        </th>
    )
}

function Kpi({ etiqueta, icono: Icono, iconoCls, etiquetaCls = "text-muted-foreground" }: {
    etiqueta: string; icono: LucideIcon; iconoCls: string; etiquetaCls?: string
}) {
    return (
        <div className="flex items-center justify-between gap-2">
            <p className={`text-[11px] font-semibold uppercase tracking-wider ${etiquetaCls}`}>{etiqueta}</p>
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconoCls}`}>
                <Icono className="h-4 w-4" />
            </span>
        </div>
    )
}

function KpiCard({ etiqueta, icono, iconoCls, className = "", children }: {
    etiqueta: string; icono: LucideIcon; iconoCls: string; className?: string; children: React.ReactNode
}) {
    return (
        <div className={`rounded-xl border bg-background p-3.5 shadow-sm ${className}`}>
            <Kpi etiqueta={etiqueta} icono={icono} iconoCls={iconoCls} />
            {children}
        </div>
    )
}

function Fila({
    n, f, cat, cerrado, setCampo, setPersona, quitar,
}: {
    n: number
    f: FilaEdicion
    cat: ReturnType<typeof useLibroCaja>['catalogos']
    cerrado: boolean
    setCampo: (key: number, campo: keyof FilaEdicion, valor: string | boolean) => void
    setPersona: (key: number, codigo: string, nombre: string) => void
    quitar: (key: number) => void
}) {
    const ro = cerrado
    // Sin borde hasta pasar el mouse o editar, para que la tabla se lea limpia.
    const cls = "h-7 text-xs border-transparent bg-transparent shadow-none hover:border-input focus-visible:border-blue-400 focus-visible:bg-background"
    // Línea de color a la izquierda: verde si la fila es ingreso, roja si es egreso.
    const tipo = Number(f.ingreso) > 0 ? 'shadow-[inset_3px_0_0_#6ee7b7]' : Number(f.egreso) > 0 ? 'shadow-[inset_3px_0_0_#fca5a5]' : ''

    return (
        <tr className={`border-b border-border even:bg-muted/20 ${f.eliminar ? '!bg-red-50/60 line-through opacity-70 dark:!bg-red-950/40' : 'hover:bg-muted/40'}`}>
            <td className={`py-1 px-2 text-center ${tipo}`}>
                {f.id !== null ? (
                    <Checkbox
                        checked={f.eliminar}
                        disabled={ro}
                        onCheckedChange={v => setCampo(f.key, 'eliminar', v === true)}
                    />
                ) : (
                    <span className="text-[10px] text-muted-foreground">nueva</span>
                )}
            </td>

            <td className="py-1 px-1 text-center text-[11px] text-muted-foreground">{n}</td>

            <td className="py-1 px-1">
                <select
                    className={`${cls} w-full rounded border border-input bg-background px-1`}
                    value={f.tipoDoc} disabled={ro}
                    onChange={e => setCampo(f.key, 'tipoDoc', e.target.value)}
                >
                    <option value="">—</option>
                    {(cat?.tiposDoc ?? []).map(t => (
                        <option key={t.Cod_Tipo} value={t.Cod_Tipo}>{t.Abreviatura || t.Descripcion}</option>
                    ))}
                </select>
            </td>

            <td className="py-1 px-1">
                <Input className={cls} maxLength={6} value={f.serie} readOnly={ro}
                       onChange={e => setCampo(f.key, 'serie', e.target.value)} />
            </td>

            <td className="py-1 px-1">
                <Input className={`${cls} font-mono`} value={f.numeroDoc} readOnly={ro}
                       onChange={e => setCampo(f.key, 'numeroDoc', e.target.value)} />
            </td>

            <td className="py-1 px-1">
                <PersonaPicker
                    codigo={f.persona}
                    nombre={f.personaNombre}
                    disabled={ro}
                    onSelect={(codigo, nombre) => setPersona(f.key, codigo, nombre)}
                />
            </td>

            <td className="py-1 px-1">
                <Input className={cls} maxLength={255} value={f.concepto} readOnly={ro}
                       onChange={e => setCampo(f.key, 'concepto', e.target.value)} />
            </td>

            <td className="py-1 px-1">
                <Input className={`${cls} text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400`} type="number" step="0.01" min={0}
                       value={f.ingreso} readOnly={ro}
                       onChange={e => {
                           setCampo(f.key, 'ingreso', e.target.value)
                           if (Number(e.target.value) > 0) setCampo(f.key, 'egreso', '')
                       }} />
            </td>

            <td className="py-1 px-1">
                <Input className={`${cls} text-right font-mono font-semibold text-red-700 dark:text-red-400`} type="number" step="0.01" min={0}
                       value={f.egreso} readOnly={ro}
                       onChange={e => {
                           setCampo(f.key, 'egreso', e.target.value)
                           if (Number(e.target.value) > 0) setCampo(f.key, 'ingreso', '')
                       }} />
            </td>

            <td className="py-1 px-1">
                <select
                    className={`${cls} w-full rounded border border-input bg-background px-1`}
                    value={f.tipoPago} disabled={ro}
                    onChange={e => setCampo(f.key, 'tipoPago', e.target.value)}
                >
                    <option value="">—</option>
                    {(cat?.tiposPago ?? []).map(t => (
                        <option key={t.Cod_Tipo_Amort} value={t.Cod_Tipo_Amort}>
                            {t.Abreviatura || t.Descripcion}
                        </option>
                    ))}
                </select>
            </td>

            <td className="py-1 px-1">
                <select
                    className={`${cls} w-full rounded border border-input bg-background px-1 font-mono`}
                    value={f.ctaContable} disabled={ro}
                    onChange={e => setCampo(f.key, 'ctaContable', e.target.value)}
                >
                    <option value="">—</option>
                    {(cat?.cuentas ?? []).map(q => (
                        <option key={q.IdCtaContable} value={String(q.IdCtaContable)}>{q.Cod_Contab}</option>
                    ))}
                </select>
            </td>

            <td className="py-1 px-1">
                <select
                    className={`${cls} w-full rounded border border-input bg-background px-1`}
                    value={f.centroCostos} disabled={ro}
                    onChange={e => setCampo(f.key, 'centroCostos', e.target.value)}
                >
                    <option value="">—</option>
                    {(cat?.centrosCosto ?? []).map(cc => (
                        <option key={cc.Cod_CC} value={cc.Cod_CC}>{cc.Abreviado || cc.Descripcion}</option>
                    ))}
                </select>
            </td>

            <td className="py-1 px-1 text-center">
                {f.id === null && !ro && (
                    <button
                        type="button"
                        onClick={() => quitar(f.key)}
                        className="text-muted-foreground hover:text-red-600 p-1"
                        title="Quitar esta línea nueva"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </td>
        </tr>
    )
}
