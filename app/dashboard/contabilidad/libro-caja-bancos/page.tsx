'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
} from "lucide-react"
import { useLibroCaja, FilaEdicion } from "./useLibroCaja"
import { PersonaPicker } from "./PersonaPicker"

const money = (v: number) =>
    Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function LibroCajaBancosPage() {
    const c = useLibroCaja()
    const [confirmEliminarVoucher, setConfirmEliminarVoucher] = useState(false)
    const [confirmEliminarLineas, setConfirmEliminarLineas] = useState(false)

    const cat = c.catalogos
    const marcadas = c.filas.filter(f => f.eliminar && f.id !== null).length

    return (
        <div className="grid gap-6 p-4 md:p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    Libro Caja y Bancos
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                    Un voucher por caja y por día. Al guardar se regenera el asiento contable y el kardex.
                </p>
            </div>

            <Card className="shadow-md">
                <CardHeader className="bg-muted border-b border-border p-4">
                    <div className="grid sm:grid-cols-12 gap-4 items-end">
                        <div className="flex flex-col gap-1 sm:col-span-4">
                            <Label className="text-sm">Caja Control</Label>
                            <Select
                                value={c.caja != null ? String(c.caja) : ''}
                                onValueChange={v => c.setCaja(Number(v))}
                                disabled={c.cargandoCatalogos}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={c.cargandoCatalogos ? "Cargando..." : "Elegir caja..."} />
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

                        <div className="flex flex-col gap-1 sm:col-span-3">
                            <Label className="text-sm">Fecha</Label>
                            <Input type="date" value={c.fecha} onChange={e => c.setFecha(e.target.value)} />
                        </div>

                        <div className="sm:col-span-5 flex flex-wrap gap-2">
                            <Button onClick={() => c.abrir(false)} disabled={c.cargando} variant="outline" className="gap-1.5">
                                {c.cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
                                Abrir
                            </Button>
                            <Button onClick={() => c.abrir(true)} disabled={c.cargando} className="gap-1.5">
                                <Plus className="h-4 w-4" />
                                Abrir o crear
                            </Button>
                        </div>
                    </div>

                    {cat?.fechaCierre && (
                        <p className="text-xs text-muted-foreground mt-3">
                            Cierre contable: {String(cat.fechaCierre).slice(0, 10)} — los vouchers con fecha anterior o igual son de solo lectura.
                        </p>
                    )}
                </CardHeader>

                <CardContent className="p-0">
                    {c.error && (
                        <div className="flex items-start gap-2 m-4 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>{c.error}</span>
                        </div>
                    )}

                    {!c.cabecera && !c.error && (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <FolderOpen className="h-12 w-12 mb-3 opacity-20" />
                            <p className="text-sm font-medium">Elige una caja y una fecha, y abre el voucher</p>
                        </div>
                    )}

                    {c.cabecera && (
                        <div className="flex flex-col">
                            {/* Cabecera del voucher: todo solo lectura, como en Access */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 border-b border-border bg-muted/40">
                                <Dato etiqueta="Item"        valor={String(c.cabecera.Item)} />
                                <Dato etiqueta="Nro Voucher" valor={c.cabecera.Numero} mono />
                                <Dato etiqueta="Caja"        valor={c.cabecera.CajaDescripcion} />
                                <Dato etiqueta="Mes"         valor={c.cabecera.MesNombre || c.cabecera.Mes_Registro} />
                                <Dato etiqueta="Año"         valor={c.cabecera.Year_Registro} />
                            </div>

                            {c.cerrado && (
                                <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border-b border-red-200 text-red-700 text-sm">
                                    <Lock className="h-4 w-4 shrink-0" />
                                    <span>
                                        Este voucher está dentro del cierre contable: es de solo lectura.
                                    </span>
                                </div>
                            )}

                            <div className="overflow-auto">
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-muted sticky top-0 z-10">
                                            <Th w="34">E</Th>
                                            <Th w="90">TipoDoc</Th>
                                            <Th w="70">Serie</Th>
                                            <Th w="90">NroDoc</Th>
                                            <Th w="150">Personas / Empresas</Th>
                                            <Th>Detalle</Th>
                                            <Th w="100" right>Ingreso</Th>
                                            <Th w="100" right>Egreso</Th>
                                            <Th w="110">Tipo de pago</Th>
                                            <Th w="120">Cuenta contable</Th>
                                            <Th w="110">Centro costos</Th>
                                            <Th w="40" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {c.filas.length === 0 ? (
                                            <tr>
                                                <td colSpan={12} className="text-center py-12 text-muted-foreground">
                                                    El voucher no tiene líneas. Agrega una para empezar.
                                                </td>
                                            </tr>
                                        ) : c.filas.map(f => (
                                            <Fila
                                                key={f.key}
                                                f={f}
                                                cat={cat}
                                                cerrado={c.cerrado}
                                                setCampo={c.setCampo}
                                                setPersona={c.setPersona}
                                                quitar={c.quitarFilaNueva}
                                            />
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-muted font-semibold">
                                            <td colSpan={6} className="py-2.5 px-2">
                                                Totales ({c.totales.lineas} línea{c.totales.lineas !== 1 ? 's' : ''})
                                            </td>
                                            <td className="py-2.5 px-2 text-right text-emerald-700">{money(c.totales.ingresos)}</td>
                                            <td className="py-2.5 px-2 text-right text-red-700">{money(c.totales.egresos)}</td>
                                            <td colSpan={4} className="py-2.5 px-2 text-right text-muted-foreground">
                                                Diferencia: {money(c.totales.ingresos - c.totales.egresos)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 p-4 border-t border-border">
                                <Button
                                    variant="outline" size="sm" className="gap-1.5"
                                    onClick={c.agregarFila} disabled={c.cerrado}
                                >
                                    <Plus className="h-4 w-4" /> Agregar línea
                                </Button>

                                <Button
                                    variant="outline" size="sm" className="gap-1.5 text-amber-700 border-amber-200 hover:bg-amber-50"
                                    onClick={() => setConfirmEliminarLineas(true)}
                                    disabled={c.cerrado || c.guardando || marcadas === 0}
                                    title={marcadas === 0 ? 'Marca la casilla E de las líneas que quieras eliminar' : undefined}
                                >
                                    <Trash2 className="h-4 w-4" /> Eliminar marcadas ({marcadas})
                                </Button>

                                <Button
                                    variant="outline" size="sm" className="gap-1.5 text-red-700 border-red-200 hover:bg-red-50"
                                    onClick={() => setConfirmEliminarVoucher(true)}
                                    disabled={c.cerrado}
                                >
                                    <X className="h-4 w-4" /> Eliminar voucher
                                </Button>

                                <Button
                                    variant="outline" size="sm" className="gap-1.5 ml-auto"
                                    onClick={() => c.abrir(false)} disabled={c.cargando}
                                >
                                    <RefreshCw className="h-4 w-4" /> Actualizar
                                </Button>

                                <Button
                                    size="sm"
                                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                                    onClick={c.guardar}
                                    disabled={c.guardando || c.cerrado || !c.hayCambios}
                                    title={!c.hayCambios ? 'No hay cambios por guardar' : undefined}
                                >
                                    {c.guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Guardar
                                </Button>
                            </div>

                            {c.hayCambios && !c.cerrado && (
                                <p className="px-4 pb-4 -mt-2 text-xs text-amber-700">
                                    Hay cambios sin guardar.
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

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

function Dato({ etiqueta, valor, mono = false }: { etiqueta: string; valor: string; mono?: boolean }) {
    return (
        <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{etiqueta}</p>
            <p className={`text-sm font-semibold mt-0.5 ${mono ? 'font-mono' : ''}`}>{valor || '—'}</p>
        </div>
    )
}

function Fila({
    f, cat, cerrado, setCampo, setPersona, quitar,
}: {
    f: FilaEdicion
    cat: ReturnType<typeof useLibroCaja>['catalogos']
    cerrado: boolean
    setCampo: (key: number, campo: keyof FilaEdicion, valor: string | boolean) => void
    setPersona: (key: number, codigo: string, nombre: string) => void
    quitar: (key: number) => void
}) {
    const ro = cerrado
    const cls = "h-7 text-xs"

    return (
        <tr className={`border-b border-border ${f.eliminar ? 'bg-red-50/60 line-through opacity-70' : 'hover:bg-muted/40'}`}>
            <td className="py-1 px-2 text-center">
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
                <Input className={`${cls} text-right`} type="number" step="0.01" min={0}
                       value={f.ingreso} readOnly={ro}
                       onChange={e => {
                           setCampo(f.key, 'ingreso', e.target.value)
                           if (Number(e.target.value) > 0) setCampo(f.key, 'egreso', '')
                       }} />
            </td>

            <td className="py-1 px-1">
                <Input className={`${cls} text-right`} type="number" step="0.01" min={0}
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
