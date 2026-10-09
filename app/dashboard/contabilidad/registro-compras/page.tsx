'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Loader2, Save, Plus, Trash2, Lock, AlertCircle, X, Search, ChevronDown, Check,
} from "lucide-react"
import { ComprasService } from "@/app/services/contabilidad/ContabilidadService"
import { useRegistroCompras, CabeceraEdicion, FilaCompra } from "./useRegistroCompras"
import { BuscadorRemoto } from "./BuscadorRemoto"

const money = (v: number) =>
    Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function RegistroComprasPage() {
    const c = useRegistroCompras()
    const cat = c.catalogos
    const [confirmEliminarDoc, setConfirmEliminarDoc] = useState(false)
    const [confirmEliminarLineas, setConfirmEliminarLineas] = useState(false)
    const [buscarClave, setBuscarClave] = useState("")
    const [otrosAbierto, setOtrosAbierto] = useState(false)

    const marcadas = c.filas.filter(f => f.eliminar && f.id !== null).length
    const ro = c.cerrado
    const t = c.totalesEnVivo

    const campo = (k: keyof CabeceraEdicion) => ({
        value: c.cab[k],
        readOnly: ro,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => c.setCampoCab(k, e.target.value),
    })

    const opciones = (k: keyof CabeceraEdicion) => ({
        value: c.cab[k],
        disabled: ro,
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => c.setCampoCab(k, e.target.value),
        className: "h-9 w-full rounded-md border border-input bg-background px-2 text-sm disabled:opacity-60",
    })

    const docTitulo = c.cab.serie || c.cab.numero
        ? `${c.cab.serie}-${c.cab.numero}`
        : 'Sin número'

    return (
        <div className="pb-10">
            <div className="sticky top-16 z-30 -mx-4 bg-background/95 backdrop-blur md:top-14 md:-mx-8">
                <header className="border-b border-border px-4 py-3 md:px-8">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="truncate text-lg font-semibold">
                                {c.clave ? docTitulo : 'Compra nueva'}
                            </h1>
                            {c.clave && <Badge variant="outline" className="shrink-0">Clave {c.clave}</Badge>}
                            {ro && (
                                <Badge className="shrink-0 gap-1 bg-red-100 text-red-700 hover:bg-red-100">
                                    <Lock className="h-3 w-3" /> Cerrado
                                </Badge>
                            )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                            {c.cab.proveedorNombre || 'Elige el proveedor para empezar'}
                        </p>
                    </div>

                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1">
                            <Input
                                className="h-9 w-[92px]" placeholder="Clave"
                                value={buscarClave}
                                onChange={e => setBuscarClave(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && Number(buscarClave) > 0) c.abrir(Number(buscarClave))
                                }}
                            />
                            <Button
                                variant="ghost" size="icon" className="h-9 w-9"
                                title="Abrir ese documento"
                                disabled={c.cargando || !(Number(buscarClave) > 0)}
                                onClick={() => c.abrir(Number(buscarClave))}
                            >
                                {c.cargando
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <Search className="h-4 w-4" />}
                            </Button>
                        </div>

                        <Button onClick={c.nuevo} variant="outline" size="sm" className="gap-1.5">
                            <Plus className="h-4 w-4" /> Nueva
                        </Button>

                        <Button
                            size="sm"
                            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                            onClick={c.guardar}
                            disabled={c.guardando || ro}
                        >
                            {c.guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Guardar
                        </Button>
                    </div>
                </div>
                </header>

                <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 border-b px-4 py-2.5 md:px-8
                                 ${t.descuadrado
                                     ? 'border-red-200 bg-red-50/80'
                                     : 'border-border bg-muted/40'}`}>
                    <div className="flex items-center gap-2">
                        {t.descuadrado
                            ? <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                            : <Check className="h-4 w-4 shrink-0 text-emerald-600" />}
                        <span className={`text-sm font-semibold ${t.descuadrado ? 'text-red-700' : 'text-emerald-700'}`}>
                            {t.descuadrado ? 'No cuadra' : 'Cuadra'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {t.lineas} línea{t.lineas !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                        <Cifra etiqueta="Diferencia" valor={t.diferencia} alerta={t.descuadrado} />
                        <span className="hidden sm:contents">
                            <Cifra etiqueta="Con IGV" valor={t.tIncIGV} />
                            <Cifra etiqueta="Sin IGV" valor={t.tSinIGV} />
                            <Cifra etiqueta="IGV calculado" valor={t.calculoIGV} />
                        </span>
                    </dl>
                </div>
            </div>

            <div className="space-y-6 pt-5">
                {ro && (
                    <Aviso tono="rojo" icono={Lock}>
                        Este documento cayó dentro del cierre contable. Se puede consultar, no modificar.
                    </Aviso>
                )}

                {c.vecesRegistrado > 1 && (
                    <Aviso tono="ambar" icono={AlertCircle}>
                        Hay {c.vecesRegistrado} documentos con el mismo proveedor, tipo, serie y número.
                        Revisá antes de guardar.
                    </Aviso>
                )}

                <Grupo titulo="El documento" nota="Todos estos campos hacen falta para guardar.">
                    <Campos>
                        <Campo etiqueta="Proveedor" requerido className="sm:col-span-2">
                            <BuscadorRemoto
                                etiqueta="proveedor"
                                valor={c.cab.proveedorNombre || c.cab.codProv}
                                disabled={ro}
                                buscar={ComprasService.buscarProveedores}
                                getKey={p => p.Codigo}
                                getTitulo={p => p.Nombre}
                                getSubtitulo={p => `${p.Codigo}${p.RUC ? `  RUC ${p.RUC}` : ''}`}
                                onSelect={p => c.setProveedor(p.Codigo, p.Nombre)}
                                onLimpiar={() => c.setProveedor('', '')}
                            />
                        </Campo>

                        <Campo etiqueta="Tipo de documento" requerido>
                            <select {...opciones('tipoDoc')}>
                                <option value="">Elegir</option>
                                {(cat?.tiposDoc ?? []).map(x => (
                                    <option key={x.Cod_Tipo} value={x.Cod_Tipo}>{x.Abreviatura || x.Descripcion}</option>
                                ))}
                            </select>
                        </Campo>

                        <Campo etiqueta="Fecha de emisión" requerido>
                            <Input type="date" className="h-9" {...campo('fechaEmision')} />
                        </Campo>

                        <Campo etiqueta="Serie" requerido>
                            <Input className="h-9 font-mono" maxLength={10} placeholder="F001" {...campo('serie')} />
                        </Campo>

                        <Campo etiqueta="Número" requerido>
                            <Input className="h-9 font-mono tabular-nums" placeholder="1234" {...campo('numero')} />
                        </Campo>

                        <Campo etiqueta="Moneda" requerido>
                            <select {...opciones('moneda')}>
                                {(cat?.monedas ?? []).map(x => (
                                    <option key={x.Abreviatura} value={x.Abreviatura}>{x.Abreviatura}</option>
                                ))}
                            </select>
                        </Campo>

                        <Campo etiqueta="Tasa de IGV" requerido>
                            <select {...opciones('tasaIGV')}>
                                <option value="">Elegir</option>
                                {(cat?.tasasIgv ?? []).map(x => (
                                    <option key={String(x.Tasa)} value={String(x.Tasa)}>{x.Tasa}</option>
                                ))}
                            </select>
                        </Campo>

                        <Campo etiqueta="Importe total" requerido>
                            <Input type="number" step="0.01"
                                   className="h-9 text-right tabular-nums" {...campo('importeTotal')} />
                        </Campo>

                        <Campo etiqueta="Importe sin IGV">
                            <Input type="number" step="0.01"
                                   className="h-9 text-right tabular-nums" {...campo('exonerado')} />
                        </Campo>

                        <Campo etiqueta="Condición" requerido>
                            <select {...opciones('condicion')}>
                                <option value="">Elegir</option>
                                {(cat?.condiciones ?? []).map(x => (
                                    <option key={x.CodigoCondicion} value={x.CodigoCondicion}>{x.Descripcion}</option>
                                ))}
                            </select>
                        </Campo>

                        <Campo etiqueta="Almacén" requerido>
                            <select {...opciones('almacen')}>
                                <option value="">Elegir</option>
                                {(cat?.almacenes ?? []).map(x => (
                                    <option key={x.IdAlmacen} value={String(x.IdAlmacen)}>{x.Descripcion}</option>
                                ))}
                            </select>
                        </Campo>

                        <Campo etiqueta="Período" requerido>
                            <select {...opciones('periodo')}>
                                <option value="">Elegir</option>
                                {(cat?.meses ?? []).map(x => (
                                    <option key={x.Numero} value={x.Numero}>{x.Mes}</option>
                                ))}
                            </select>
                        </Campo>

                        <Campo etiqueta="Año" requerido>
                            <select {...opciones('anio')}>
                                <option value="">Elegir</option>
                                {(cat?.anios ?? []).map(x => (
                                    <option key={x.Anio} value={x.Anio}>{x.Anio}</option>
                                ))}
                            </select>
                        </Campo>
                    </Campos>
                </Grupo>

                {c.esContado && (
                    <Grupo titulo="Cancelación"
                           nota="La compra es al contado, así que estos cuatro datos pasan a ser obligatorios.">
                        <Campos>
                            <Campo etiqueta="Fecha de cancelación" requerido>
                                <Input type="date" className="h-9" {...campo('fechaCancelacion')} />
                            </Campo>
                            <Campo etiqueta="Tipo de pago" requerido>
                                <select {...opciones('tipoPago')}>
                                    <option value="">Elegir</option>
                                    {(cat?.tiposPago ?? []).map(x => (
                                        <option key={x.Cod_Tipo_Amort} value={x.Cod_Tipo_Amort}>{x.Descripcion}</option>
                                    ))}
                                </select>
                            </Campo>
                            <Campo etiqueta="Centro de costos" requerido>
                                <select {...opciones('centroCostos')}>
                                    <option value="">Elegir</option>
                                    {(cat?.centrosCosto ?? []).map(x => (
                                        <option key={x.idCentroCostos} value={String(x.idCentroCostos)}>
                                            {x.Descripcion}
                                        </option>
                                    ))}
                                </select>
                            </Campo>
                            <Campo etiqueta="Observación de cancelación" requerido>
                                <Input className="h-9" {...campo('obsCancelacion')} />
                            </Campo>
                        </Campos>
                    </Grupo>
                )}

                <Collapsible open={otrosAbierto} onOpenChange={setOtrosAbierto}>
                    <CollapsibleTrigger asChild>
                        <button className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-left hover:bg-muted">
                            <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${otrosAbierto ? 'rotate-180' : ''}`} />
                            <span className="text-sm font-medium">Detracción, clasificación, orden de compra y observaciones</span>
                            <span className="ml-auto text-xs text-muted-foreground">Opcional</span>
                        </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="pt-4">
                        <Campos>
                            <Campo etiqueta="Clasificación de bienes">
                                <select {...opciones('idClasificacionBienes')}>
                                    <option value="">Elegir</option>
                                    {(cat?.clasificacionBienes ?? []).map(x => (
                                        <option key={x.idClasificacionBienes} value={String(x.idClasificacionBienes)}>
                                            {x.DescripcionBienes}
                                        </option>
                                    ))}
                                </select>
                            </Campo>
                            <Campo etiqueta="Inafecto">
                                <Input type="number" step="0.01" className="h-9 text-right tabular-nums" {...campo('inafecto')} />
                            </Campo>
                            <Campo etiqueta="ICBPER">
                                <Input type="number" step="0.01" className="h-9 text-right tabular-nums" {...campo('icbper')} />
                            </Campo>
                            <Campo etiqueta="Fecha de ingreso">
                                <Input type="date" className="h-9" {...campo('fecIngreso')} />
                            </Campo>

                            <Campo etiqueta="Nº de depósito de detracción">
                                <Input className="h-9" {...campo('nroDepositoDetra')} />
                            </Campo>
                            <Campo etiqueta="Fecha de detracción">
                                <Input type="date" className="h-9" {...campo('fechaDetra')} />
                            </Campo>
                            <Campo etiqueta="Serie de orden de compra">
                                <Input className="h-9" {...campo('serieOC')} />
                            </Campo>
                            <Campo etiqueta="Nº de orden de compra">
                                <Input className="h-9" {...campo('nrOC')} />
                            </Campo>

                            <Campo etiqueta="Entregado por">
                                <Input className="h-9" {...campo('entregadoPor')} />
                            </Campo>
                            <Campo etiqueta="Responsable">
                                <Input className="h-9" {...campo('responsable')} />
                            </Campo>
                            <Campo etiqueta="Observaciones" className="sm:col-span-2">
                                <Input className="h-9" {...campo('observaciones')} />
                            </Campo>
                        </Campos>
                    </CollapsibleContent>
                </Collapsible>

                <section>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-semibold">Detalle de la compra</h2>
                        <div className="ml-auto flex flex-wrap items-center gap-2">
                            <Button variant="outline" size="sm" className="gap-1.5"
                                    onClick={c.agregarFila} disabled={ro}>
                                <Plus className="h-4 w-4" /> Agregar línea
                            </Button>
                            {marcadas > 0 && (
                                <Button
                                    variant="outline" size="sm"
                                    className="gap-1.5 text-amber-700 border-amber-200 hover:bg-amber-50"
                                    onClick={() => setConfirmEliminarLineas(true)}
                                    disabled={ro || c.guardando || !c.clave}
                                >
                                    <Trash2 className="h-4 w-4" /> Eliminar {marcadas}
                                </Button>
                            )}
                        </div>
                    </div>

                    {c.filas.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border py-14 text-center">
                            <p className="text-sm font-medium">Todavía no hay líneas</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Agregá una por cada ítem de la factura.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Tabla en escritorio */}
                            <div className="hidden overflow-x-auto rounded-lg border border-border lg:block">
                                <table className="w-full border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/60">
                                            <Th w="36" />
                                            <Th w="210">Artículo</Th>
                                            <Th w="84" right>Cantidad</Th>
                                            <Th w="84">Lote</Th>
                                            <Th w="120">Vence</Th>
                                            <Th w="104" right>Con IGV</Th>
                                            <Th w="104" right>Sin IGV</Th>
                                            <Th w="118">Cuenta</Th>
                                            <Th w="96">C. costos</Th>
                                            <Th w="40" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {c.filas.map(f => (
                                            <FilaTabla key={f.key} f={f} cat={cat} ro={ro}
                                                       setCampo={c.setCampoFila}
                                                       setArticulo={c.setArticulo}
                                                       quitar={c.quitarFilaNueva} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Tarjetas en móvil y tablet: una tabla de diez columnas
                                no se puede usar en un teléfono. */}
                            <div className="space-y-3 lg:hidden">
                                {c.filas.map(f => (
                                    <FilaTarjeta key={f.key} f={f} cat={cat} ro={ro}
                                                 setCampo={c.setCampoFila}
                                                 setArticulo={c.setArticulo}
                                                 quitar={c.quitarFilaNueva} />
                                ))}
                            </div>
                        </>
                    )}

                    {c.clave && !ro && (
                        <div className="mt-4 flex justify-end">
                            <Button
                                variant="ghost" size="sm"
                                className="gap-1.5 text-red-700 hover:bg-red-50 hover:text-red-800"
                                onClick={() => setConfirmEliminarDoc(true)}
                            >
                                <X className="h-4 w-4" /> Eliminar este documento
                            </Button>
                        </div>
                    )}
                </section>
            </div>

            <AlertDialog open={confirmEliminarLineas} onOpenChange={setConfirmEliminarLineas}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar {marcadas} línea{marcadas !== 1 ? 's' : ''}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Primero se guarda el documento y después se quitan las líneas marcadas.
                            El asiento contable, el kardex y los lotes se regeneran con lo que quede.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { setConfirmEliminarLineas(false); c.eliminarMarcadas() }}>
                            Eliminar líneas
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={confirmEliminarDoc} onOpenChange={setConfirmEliminarDoc}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar la compra {docTitulo}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se borran también su asiento contable, el kardex de proveedores,
                            el de inventarios y los lotes. No se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700"
                                           onClick={() => { setConfirmEliminarDoc(false); c.eliminarDocumento() }}>
                            Eliminar compra
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

/* ── Piezas de layout ─────────────────────────────────────────────────────── */

function Grupo({ titulo, nota, children }: { titulo: string; nota?: string; children: React.ReactNode }) {
    return (
        <section className="rounded-lg border border-border bg-background">
            <div className="border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold">{titulo}</h2>
                {nota && <p className="mt-0.5 text-xs text-muted-foreground">{nota}</p>}
            </div>
            <div className="p-4">{children}</div>
        </section>
    )
}

function Campos({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
}

function Campo({
    etiqueta, requerido = false, className = '', children,
}: { etiqueta: string; requerido?: boolean; className?: string; children: React.ReactNode }) {
    return (
        <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
            <Label className="text-xs font-medium text-muted-foreground">
                {etiqueta}{requerido && <span className="ml-0.5 text-red-500">*</span>}
            </Label>
            {children}
        </div>
    )
}

function Cifra({ etiqueta, valor, alerta = false }: { etiqueta: string; valor: number; alerta?: boolean }) {
    return (
        <div className="flex items-baseline gap-2">
            <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
            <dd className={`font-semibold tabular-nums ${alerta ? 'text-red-600' : ''}`}>{money(valor)}</dd>
        </div>
    )
}

function Aviso({
    tono, icono: Icono, children,
}: { tono: 'rojo' | 'ambar'; icono: React.ElementType; children: React.ReactNode }) {
    const tonos = {
        rojo:  'border-red-200 bg-red-50 text-red-800',
        ambar: 'border-amber-200 bg-amber-50 text-amber-900',
    }
    return (
        <div className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${tonos[tono]}`}>
            <Icono className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{children}</span>
        </div>
    )
}

function Th({ children, w, right = false }: { children?: React.ReactNode; w?: string; right?: boolean }) {
    return (
        <th style={w ? { width: `${w}px` } : undefined}
            className={`px-2 py-2 text-[11px] font-medium text-muted-foreground ${right ? 'text-right' : 'text-left'}`}>
            {children}
        </th>
    )
}

interface PropsFila {
    f: FilaCompra
    cat: ReturnType<typeof useRegistroCompras>['catalogos']
    ro: boolean
    setCampo: (key: number, campo: keyof FilaCompra, valor: string | boolean) => void
    setArticulo: (key: number, idArticulo: string, codigo: string, nombre: string) => void
    quitar: (key: number) => void
}

const inputFila = "h-7 text-xs"
const selectFila = "h-7 w-full rounded border border-input bg-background px-1 text-xs disabled:opacity-60"

function BuscadorArticulo({ f, ro, setArticulo }: Pick<PropsFila, 'f' | 'ro' | 'setArticulo'>) {
    return (
        <BuscadorRemoto
            etiqueta="artículo"
            valor={f.nombreItem || f.articulo}
            disabled={ro}
            buscar={ComprasService.buscarArticulos}
            getKey={a => String(a.IdArticulo)}
            getTitulo={a => a.NombreItem}
            getSubtitulo={a => `${a.Codigo_Art}${Number(a.Kardex) === 0 ? '  entra al kardex' : ''}`}
            onSelect={a => setArticulo(f.key, String(a.IdArticulo), a.Codigo_Art, a.NombreItem)}
            onLimpiar={() => setArticulo(f.key, '', '', '')}
        />
    )
}

function SelectCuenta({ f, cat, ro, setCampo }: Pick<PropsFila, 'f' | 'cat' | 'ro' | 'setCampo'>) {
    return (
        <select className={`${selectFila} font-mono`} value={f.cuentaContab} disabled={ro}
                onChange={e => setCampo(f.key, 'cuentaContab', e.target.value)}>
            <option value="">Elegir</option>
            {(cat?.cuentas ?? []).map(q => (
                <option key={q.IdCtaContable} value={String(q.IdCtaContable)}>{q.Cod_Contab}</option>
            ))}
        </select>
    )
}

function SelectCentroCostos({ f, cat, ro, setCampo }: Pick<PropsFila, 'f' | 'cat' | 'ro' | 'setCampo'>) {
    return (
        <select className={selectFila} value={f.centroCostos} disabled={ro}
                onChange={e => setCampo(f.key, 'centroCostos', e.target.value)}>
            <option value="">Elegir</option>
            {(cat?.centrosCosto ?? []).map(cc => (
                <option key={cc.Cod_CC} value={cc.Cod_CC}>{cc.Cod_CC}</option>
            ))}
        </select>
    )
}

function FilaTabla({ f, cat, ro, setCampo, setArticulo, quitar }: PropsFila) {
    return (
        <tr className={`border-b border-border last:border-0 ${f.eliminar ? 'bg-red-50/60 opacity-60' : 'hover:bg-muted/40'}`}>
            <td className="px-2 py-1 text-center">
                {f.id !== null ? (
                    <Checkbox checked={f.eliminar} disabled={ro}
                              title="Marcar para eliminar"
                              onCheckedChange={v => setCampo(f.key, 'eliminar', v === true)} />
                ) : (
                    <Badge variant="outline" className="px-1 py-0 text-[9px]">nueva</Badge>
                )}
            </td>
            <td className="px-1 py-1"><BuscadorArticulo f={f} ro={ro} setArticulo={setArticulo} /></td>
            <td className="px-1 py-1">
                <Input className={`${inputFila} text-right tabular-nums`} type="number" step="0.0001"
                       value={f.cantidad} readOnly={ro}
                       onChange={e => setCampo(f.key, 'cantidad', e.target.value)} />
            </td>
            <td className="px-1 py-1">
                <Input className={inputFila} value={f.lote} readOnly={ro}
                       onChange={e => setCampo(f.key, 'lote', e.target.value)} />
            </td>
            <td className="px-1 py-1">
                <Input className={inputFila} type="date" value={f.vctoArt} readOnly={ro}
                       onChange={e => setCampo(f.key, 'vctoArt', e.target.value)} />
            </td>
            <td className="px-1 py-1">
                <Input className={`${inputFila} text-right tabular-nums`} type="number" step="0.01"
                       value={f.importeAfecto} readOnly={ro}
                       onChange={e => setCampo(f.key, 'importeAfecto', e.target.value)} />
            </td>
            <td className="px-1 py-1">
                <Input className={`${inputFila} text-right tabular-nums`} type="number" step="0.01"
                       value={f.importeNoAfecto} readOnly={ro}
                       onChange={e => setCampo(f.key, 'importeNoAfecto', e.target.value)} />
            </td>
            <td className="px-1 py-1"><SelectCuenta f={f} cat={cat} ro={ro} setCampo={setCampo} /></td>
            <td className="px-1 py-1"><SelectCentroCostos f={f} cat={cat} ro={ro} setCampo={setCampo} /></td>
            <td className="px-1 py-1 text-center">
                {f.id === null && !ro && (
                    <button type="button" onClick={() => quitar(f.key)}
                            title="Quitar esta línea"
                            className="p-1 text-muted-foreground hover:text-red-600">
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </td>
        </tr>
    )
}

function FilaTarjeta({ f, cat, ro, setCampo, setArticulo, quitar }: PropsFila) {
    return (
        <div className={`rounded-lg border p-3 ${f.eliminar ? 'border-red-200 bg-red-50/60' : 'border-border bg-background'}`}>
            <div className="mb-3 flex items-start gap-2">
                <div className="min-w-0 flex-1">
                    <BuscadorArticulo f={f} ro={ro} setArticulo={setArticulo} />
                </div>
                {f.id !== null ? (
                    <label className="flex shrink-0 items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
                        <Checkbox checked={f.eliminar} disabled={ro}
                                  onCheckedChange={v => setCampo(f.key, 'eliminar', v === true)} />
                        Quitar
                    </label>
                ) : !ro && (
                    <button type="button" onClick={() => quitar(f.key)}
                            className="shrink-0 p-1 text-muted-foreground hover:text-red-600" title="Quitar esta línea">
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <CampoTarjeta etiqueta="Cantidad">
                    <Input className={`${inputFila} text-right tabular-nums`} type="number" step="0.0001"
                           value={f.cantidad} readOnly={ro}
                           onChange={e => setCampo(f.key, 'cantidad', e.target.value)} />
                </CampoTarjeta>
                <CampoTarjeta etiqueta="Lote">
                    <Input className={inputFila} value={f.lote} readOnly={ro}
                           onChange={e => setCampo(f.key, 'lote', e.target.value)} />
                </CampoTarjeta>
                <CampoTarjeta etiqueta="Con IGV">
                    <Input className={`${inputFila} text-right tabular-nums`} type="number" step="0.01"
                           value={f.importeAfecto} readOnly={ro}
                           onChange={e => setCampo(f.key, 'importeAfecto', e.target.value)} />
                </CampoTarjeta>
                <CampoTarjeta etiqueta="Sin IGV">
                    <Input className={`${inputFila} text-right tabular-nums`} type="number" step="0.01"
                           value={f.importeNoAfecto} readOnly={ro}
                           onChange={e => setCampo(f.key, 'importeNoAfecto', e.target.value)} />
                </CampoTarjeta>
                <CampoTarjeta etiqueta="Cuenta">
                    <SelectCuenta f={f} cat={cat} ro={ro} setCampo={setCampo} />
                </CampoTarjeta>
                <CampoTarjeta etiqueta="Centro de costos">
                    <SelectCentroCostos f={f} cat={cat} ro={ro} setCampo={setCampo} />
                </CampoTarjeta>
                <CampoTarjeta etiqueta="Vence" className="col-span-2">
                    <Input className={inputFila} type="date" value={f.vctoArt} readOnly={ro}
                           onChange={e => setCampo(f.key, 'vctoArt', e.target.value)} />
                </CampoTarjeta>
            </div>
        </div>
    )
}

function CampoTarjeta({
    etiqueta, className = '', children,
}: { etiqueta: string; className?: string; children: React.ReactNode }) {
    return (
        <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
            <span className="text-[11px] text-muted-foreground">{etiqueta}</span>
            {children}
        </div>
    )
}
