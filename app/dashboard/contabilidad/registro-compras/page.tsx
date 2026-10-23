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
    ClipboardCheck, Wallet, Truck, Printer, ShoppingBag, Hash, FileText, ArrowRight,
    Receipt, Coins, Percent, Scale, Banknote, SlidersHorizontal, ListOrdered, PackagePlus,
    CalendarClock, Warehouse, CalendarDays, Calendar, Building2, Tags,
    type LucideIcon,
} from "lucide-react"
import { ComboSelect } from "@/components/ui/combo-select"
import { ComprasService } from "@/app/services/contabilidad/ContabilidadService"
import { toast } from "@/app/hooks/useToast"
import { useRegistroCompras, CabeceraEdicion, FilaCompra } from "./useRegistroCompras"
import { BuscadorRemoto } from "./BuscadorRemoto"
import { ComboTarjeta } from "./ComboTarjeta"
import { ImprimirCompraDialog } from "./ImprimirCompraDialog"
import { BuscadorDocumentos } from "./BuscadorDocumentos"
import { SaldoDialog } from "./SaldoDialog"
import { PagosDialog } from "./PagosDialog"
import { TransporteDialog } from "./TransporteDialog"

// La tasa llega como fracción (0.18) o como porcentaje (18).
const tasaTexto = (t: number) => `${Number(t) < 1 ? Math.round(Number(t) * 10000) / 100 : Number(t)}%`

const money = (v: number) =>
    Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function RegistroComprasPage() {
    const c = useRegistroCompras()
    const cat = c.catalogos
    const [confirmEliminarDoc, setConfirmEliminarDoc] = useState(false)
    const [imprimirAbierto, setImprimirAbierto] = useState(false)
    const [confirmRevisar, setConfirmRevisar] = useState(false)
    const [confirmEliminarLineas, setConfirmEliminarLineas] = useState(false)
    const [buscarClave, setBuscarClave] = useState("")
    const [otrosAbierto, setOtrosAbierto] = useState(false)
    const [buscadorAbierto, setBuscadorAbierto] = useState(false)
    const [saldoAbierto, setSaldoAbierto] = useState(false)
    const [pagosAbierto, setPagosAbierto] = useState(false)
    const [transpAbierto, setTranspAbierto] = useState(false)
    const [revisando, setRevisando] = useState(false)

    const marcadas = c.filas.filter(f => f.eliminar && f.id !== null).length
    const ro = c.cerrado
    const t = c.totalesEnVivo

    const campo = (k: keyof CabeceraEdicion) => ({
        value: c.cab[k],
        readOnly: ro,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => c.setCampoCab(k, e.target.value),
    })

    // Combos con buscador, con el mismo formato que el resto de Contabilidad.
    const comboCampo = <T,>({ k, items, getKey, getLabel, getSub, icono, titulo, descripcion }: {
        k: keyof CabeceraEdicion; items: T[]; getKey: (x: T) => string | number; getLabel: (x: T) => string
        getSub?: (x: T) => string; icono: LucideIcon; titulo: string; descripcion: string
    }) => (
        <ComboTarjeta<T>
            value={String(c.cab[k] ?? '')}
            onChange={x => c.setCampoCab(k, String(getKey(x)))}
            items={items}
            getKey={x => String(getKey(x))}
            getLabel={getLabel}
            getSub={getSub}
            icono={icono}
            titulo={titulo}
            descripcion={descripcion}
            disabled={ro}
        />
    )

    const docTitulo = c.cab.serie || c.cab.numero
        ? `${c.cab.serie}-${c.cab.numero}`
        : 'Sin número'

    const revisar = async () => {
        if (!c.clave) return
        setRevisando(true)
        try {
            const r = await ComprasService.revisar(c.clave)
            toast({
                title: "Documento revisado",
                description: r
                    ? `Registro de compras: ${r.RegistroCompras} · centros de costo: ${r.MvtosCentroCostos} · presupuesto: ${r.EjecucionPpto}`
                    : undefined,
            })
            await c.abrir(c.clave)
        } catch (e: any) {
            toast({
                title: "Error",
                description: e?.response?.data?.message || "No se pudo revisar el documento.",
                variant: "destructive",
            })
        } finally {
            setRevisando(false)
        }
    }


    return (
        <div className="grid grid-cols-1 pb-10">
            {/* Encabezado de la pantalla, igual que el resto de Contabilidad */}
            <div className="flex flex-col gap-3 pt-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/30">
                        <ShoppingBag className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                            Registro de Compras e Inventarios
                        </h1>
                        <p className="text-sm md:text-base text-muted-foreground">
                            Facturas de proveedores. Al guardar se genera el asiento contable, el kardex y los lotes.
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {c.clave && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                            <Hash className="h-3.5 w-3.5" /> Clave {c.clave}
                        </span>
                    )}
                    {ro ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                            <Lock className="h-3.5 w-3.5" /> Cerrado · solo lectura
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" /> {c.clave ? 'Editable' : 'Nueva compra'}
                        </span>
                    )}
                </div>
            </div>

            {/* Barra de acciones: queda fija arriba al bajar por el formulario */}
            <div className="sticky top-16 z-30 mt-5 md:top-14">
                <div className="rounded-xl border border-t-[3px] border-border border-t-blue-600 bg-background/95 px-4 py-3 shadow-sm backdrop-blur">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                        <div className="flex min-w-0 flex-1 basis-60 items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950">
                                <FileText className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                                <p className="truncate font-mono text-base font-bold">
                                    {c.clave ? docTitulo : 'Compra nueva'}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {c.cab.proveedorNombre || 'Elige el proveedor para empezar'}
                                </p>
                            </div>
                            <span className={`ml-1 hidden shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-flex ${
                                t.descuadrado
                                    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}>
                                {t.descuadrado ? <AlertCircle className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                                {t.descuadrado ? `No cuadra · ${money(t.diferencia)}` : 'Cuadra'}
                            </span>
                        </div>

                        <div className="flex w-full items-center gap-1.5 sm:w-auto sm:gap-2">
                            <div className="flex items-center gap-1">
                                <Input
                                    className="h-10 w-[64px] px-2 sm:w-[96px] sm:px-3" placeholder="Clave"
                                    value={buscarClave}
                                    onChange={e => setBuscarClave(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && Number(buscarClave) > 0) c.abrir(Number(buscarClave))
                                    }}
                                />
                                <Button
                                    variant="outline" size="icon" className="h-10 w-10"
                                    title="Abrir ese documento"
                                    disabled={c.cargando || !(Number(buscarClave) > 0)}
                                    onClick={() => c.abrir(Number(buscarClave))}
                                >
                                    {c.cargando
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : <ArrowRight className="h-4 w-4" />}
                                </Button>
                            </div>

                            <Button
                                onClick={() => setBuscadorAbierto(true)}
                                variant="outline" className="h-10 gap-1.5 px-3 font-semibold"
                                title="Buscar por período, proveedor, serie o número"
                                aria-label="Buscar"
                            >
                                <Search className="h-4 w-4" /> <span className="hidden sm:inline">Buscar</span>
                            </Button>

                            <Button onClick={c.nuevo} variant="outline" className="h-10 gap-1.5 px-3 font-semibold" title="Nueva compra" aria-label="Nueva">
                                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nueva</span>
                            </Button>

                        </div>
                    </div>
                </div>
            </div>

            {/* Totales en vivo */}
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                <div className={`col-span-2 rounded-xl p-3.5 text-white shadow-sm md:col-span-1 ${
                    t.descuadrado ? 'bg-gradient-to-br from-red-700 to-red-500' : 'bg-gradient-to-br from-emerald-700 to-emerald-500'
                }`}>
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">Cuadre</p>
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
                            {t.descuadrado ? <AlertCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </span>
                    </div>
                    <p className="mt-1 text-lg font-bold">{t.descuadrado ? 'No cuadra' : 'Cuadra'}</p>
                    <p className="text-xs text-white/80">{t.lineas} línea{t.lineas !== 1 ? 's' : ''} en el detalle</p>
                </div>
                <Cifra etiqueta="Con IGV" valor={t.tIncIGV} icono={Receipt} iconoCls="bg-blue-50 text-blue-600 dark:bg-blue-950" />
                <Cifra etiqueta="Sin IGV" valor={t.tSinIGV} icono={Coins} iconoCls="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" />
                <Cifra etiqueta="IGV calculado" valor={t.calculoIGV} icono={Percent} iconoCls="bg-violet-50 text-violet-600 dark:bg-violet-950" />
                <Cifra etiqueta="Diferencia" valor={t.diferencia} icono={Scale} alerta={t.descuadrado}
                       iconoCls={t.descuadrado ? 'bg-red-50 text-red-600 dark:bg-red-950' : 'bg-amber-50 text-amber-600 dark:bg-amber-950'} />
            </div>

            <div className="space-y-5 pt-5">
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

                <Grupo titulo="El documento" nota="Todos estos campos hacen falta para guardar." icono={FileText} acento="blue">
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
                                icono={Truck}
                                descripcion="Por RUC, código o razón social"
                                subValor={c.cab.codProv ? `Cód. ${c.cab.codProv}` : undefined}
                                ancho="w-[var(--radix-popover-trigger-width)] min-w-[300px]"
                            />
                        </Campo>

                        <Campo etiqueta="Tipo de documento" requerido>
                            {comboCampo({ k: 'tipoDoc', items: cat?.tiposDoc ?? [], getKey: x => x.Cod_Tipo, getLabel: x => String(x.Descripcion || x.Abreviatura), getSub: x => `${x.Cod_Tipo} · ${x.Abreviatura}`, icono: FileText, titulo: 'Elegir tipo', descripcion: 'Factura, boleta, nota…' })}
                        </Campo>

                        <Campo etiqueta="Fecha de emisión" requerido>
                            <Input type="date" className="h-[50px] rounded-xl" {...campo('fechaEmision')} />
                        </Campo>

                        <Campo etiqueta="Serie" requerido>
                            <Input className="h-[50px] rounded-xl font-mono" maxLength={10} placeholder="F001" {...campo('serie')} />
                        </Campo>

                        <Campo etiqueta="Número" requerido>
                            <Input className="h-[50px] rounded-xl font-mono tabular-nums" placeholder="1234" {...campo('numero')} />
                        </Campo>

                        <Campo etiqueta="Moneda" requerido>
                            {comboCampo({ k: 'moneda', items: cat?.monedas ?? [], getKey: x => x.Abreviatura, getLabel: x => String(x.Descripcion || x.Abreviatura), getSub: x => x.Abreviatura, icono: Coins, titulo: 'Elegir moneda', descripcion: 'Soles o dólares' })}
                        </Campo>

                        <Campo etiqueta="Tasa de IGV" requerido>
                            {comboCampo({ k: 'tasaIGV', items: cat?.tasasIgv ?? [], getKey: x => String(x.Tasa), getLabel: x => tasaTexto(x.Tasa), getSub: x => `Tasa ${x.Tasa}`, icono: Percent, titulo: 'Elegir tasa', descripcion: 'IGV del documento' })}
                        </Campo>

                        <Campo etiqueta="Importe total" requerido>
                            <Input type="number" step="0.01"
                                   className="h-[50px] rounded-xl text-right tabular-nums" {...campo('importeTotal')} />
                        </Campo>

                        <Campo etiqueta="Importe sin IGV">
                            <Input type="number" step="0.01"
                                   className="h-[50px] rounded-xl text-right tabular-nums" {...campo('exonerado')} />
                        </Campo>

                        <Campo etiqueta="Condición" requerido>
                            {comboCampo({ k: 'condicion', items: cat?.condiciones ?? [], getKey: x => x.CodigoCondicion, getLabel: x => String(x.Descripcion), getSub: x => `${x.CodigoCondicion} · ${Number(x.DiasCdto) || 0} días`, icono: CalendarClock, titulo: 'Elegir condición', descripcion: 'Contado o crédito' })}
                        </Campo>

                        <Campo etiqueta="Almacén" requerido>
                            {comboCampo({ k: 'almacen', items: cat?.almacenes ?? [], getKey: x => String(x.IdAlmacen), getLabel: x => String(x.Descripcion), getSub: x => `Cód. ${x.IdAlmacen}`, icono: Warehouse, titulo: 'Elegir almacén', descripcion: 'Dónde ingresa la mercadería' })}
                        </Campo>

                        <Campo etiqueta="Período" requerido>
                            {comboCampo({ k: 'periodo', items: cat?.meses ?? [], getKey: x => x.Numero, getLabel: x => String(x.Mes), getSub: x => `Mes ${x.Numero}`, icono: CalendarDays, titulo: 'Elegir período', descripcion: 'Mes tributario' })}
                        </Campo>

                        <Campo etiqueta="Año" requerido>
                            {comboCampo({ k: 'anio', items: cat?.anios ?? [], getKey: x => x.Anio, getLabel: x => String(x.Anio), getSub: () => 'Ejercicio', icono: Calendar, titulo: 'Elegir año', descripcion: 'Ejercicio contable' })}
                        </Campo>
                    </Campos>
                </Grupo>

                {c.esContado && (
                    <Grupo titulo="Cancelación" icono={Banknote} acento="emerald"
                           nota="La compra es al contado, así que estos cuatro datos pasan a ser obligatorios.">
                        <Campos>
                            <Campo etiqueta="Fecha de cancelación" requerido>
                                <Input type="date" className="h-[50px] rounded-xl" {...campo('fechaCancelacion')} />
                            </Campo>
                            <Campo etiqueta="Tipo de pago" requerido>
                                {comboCampo({ k: 'tipoPago', items: cat?.tiposPago ?? [], getKey: x => x.Cod_Tipo_Amort, getLabel: x => String(x.Descripcion), getSub: x => x.Cod_Tipo_Amort, icono: Wallet, titulo: 'Elegir tipo de pago', descripcion: 'Cómo se pagó' })}
                            </Campo>
                            <Campo etiqueta="Centro de costos" requerido>
                                {comboCampo({ k: 'centroCostos', items: cat?.centrosCosto ?? [], getKey: x => String(x.idCentroCostos), getLabel: x => String(x.Descripcion), getSub: x => x.Cod_CC, icono: Building2, titulo: 'Elegir centro', descripcion: 'Centro de costos' })}
                            </Campo>
                            <Campo etiqueta="Observación de cancelación" requerido>
                                <Input className="h-[50px] rounded-xl" {...campo('obsCancelacion')} />
                            </Campo>
                        </Campos>
                    </Grupo>
                )}

                <Collapsible open={otrosAbierto} onOpenChange={setOtrosAbierto}>
                    <CollapsibleTrigger asChild>
                        <button className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left shadow-sm transition-colors ${
                            otrosAbierto ? 'border-violet-200 bg-violet-50/60 dark:border-violet-900 dark:bg-violet-950/30' : 'border-border bg-background hover:bg-muted/50'
                        }`}>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-900 dark:bg-violet-950">
                                <SlidersHorizontal className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                                <span className="block text-sm font-semibold">Datos adicionales</span>
                                <span className="block text-xs text-muted-foreground">Detracción, clasificación, orden de compra y observaciones</span>
                            </span>
                            <span className="ml-auto flex shrink-0 items-center gap-2">
                                <span className="hidden rounded-full border bg-background px-2 py-0.5 text-[11px] text-muted-foreground sm:inline">Opcional</span>
                                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${otrosAbierto ? 'rotate-180' : ''}`} />
                            </span>
                        </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="pt-3">
                        <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
                        <Campos>
                            <Campo etiqueta="Clasificación de bienes">
                                {comboCampo({ k: 'idClasificacionBienes', items: cat?.clasificacionBienes ?? [], getKey: x => String(x.idClasificacionBienes), getLabel: x => String(x.DescripcionBienes), getSub: x => `Cód. ${x.idClasificacionBienes}`, icono: Tags, titulo: 'Elegir clasificación', descripcion: 'Tipo de bien' })}
                            </Campo>
                            <Campo etiqueta="Inafecto">
                                <Input type="number" step="0.01" className="h-[50px] rounded-xl text-right tabular-nums" {...campo('inafecto')} />
                            </Campo>
                            <Campo etiqueta="ICBPER">
                                <Input type="number" step="0.01" className="h-[50px] rounded-xl text-right tabular-nums" {...campo('icbper')} />
                            </Campo>
                            <Campo etiqueta="Fecha de ingreso">
                                <Input type="date" className="h-[50px] rounded-xl" {...campo('fecIngreso')} />
                            </Campo>

                            <Campo etiqueta="Nº de depósito de detracción">
                                <Input className="h-[50px] rounded-xl" {...campo('nroDepositoDetra')} />
                            </Campo>
                            <Campo etiqueta="Fecha de detracción">
                                <Input type="date" className="h-[50px] rounded-xl" {...campo('fechaDetra')} />
                            </Campo>
                            <Campo etiqueta="Serie de orden de compra">
                                <Input className="h-[50px] rounded-xl" {...campo('serieOC')} />
                            </Campo>
                            <Campo etiqueta="Nº de orden de compra">
                                <Input className="h-[50px] rounded-xl" {...campo('nrOC')} />
                            </Campo>

                            <Campo etiqueta="Entregado por">
                                <Input className="h-[50px] rounded-xl" {...campo('entregadoPor')} />
                            </Campo>
                            <Campo etiqueta="Responsable">
                                <Input className="h-[50px] rounded-xl" {...campo('responsable')} />
                            </Campo>
                            <Campo etiqueta="Observaciones" className="sm:col-span-2">
                                <Input className="h-[50px] rounded-xl" {...campo('observaciones')} />
                            </Campo>
                        </Campos>
                        </div>
                    </CollapsibleContent>
                </Collapsible>

                <section className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                    <div className="flex flex-wrap items-center gap-3 border-b border-border bg-gradient-to-b from-muted/40 to-transparent px-4 py-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-950">
                            <ListOrdered className="h-4 w-4" />
                        </span>
                        <div>
                            <h2 className="text-sm font-semibold">Detalle de la compra</h2>
                            <p className="text-xs text-muted-foreground">Una línea por cada ítem de la factura.</p>
                        </div>
                        <span className="rounded-full border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                            {c.filas.length} línea{c.filas.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="p-4">
                    {c.filas.length === 0 ? (
                        <div className="flex flex-col items-center rounded-lg border border-dashed border-border py-12 text-center">
                            <PackagePlus className="mb-3 h-10 w-10 text-muted-foreground/40" />
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
                                        <tr className="border-b border-border bg-gradient-to-b from-muted/60 to-muted">
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

                    </div>

                    {c.clave && (
                        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/20 px-4 py-2.5">
                            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Documento</span>
                            <Button variant="outline" size="sm" className="gap-1.5"
                                    onClick={() => setConfirmRevisar(true)} disabled={ro || revisando}
                                    title="Rehace el registro contable sumando el detalle">
                                {revisando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
                                Revisa
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1.5"
                                    onClick={() => setSaldoAbierto(true)}>
                                <Wallet className="h-4 w-4" /> Saldo
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1.5"
                                    onClick={() => setPagosAbierto(true)} disabled={ro || c.esContado}
                                    title={c.esContado ? 'El documento es al contado' : 'Pagos a cuenta'}>
                                <Banknote className="h-4 w-4" /> Pagos a cuenta
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1.5"
                                    onClick={() => setTranspAbierto(true)} disabled={ro}>
                                <Truck className="h-4 w-4" /> Transporte
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setImprimirAbierto(true)}>
                                <Printer className="h-4 w-4" /> Imprimir
                            </Button>
                        </div>
                    )}

                    {/* Acciones de edición y guardar, en el mismo orden que Libro Caja y Bancos */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-border bg-gradient-to-r from-background to-muted/30 p-4">
                        <Button
                            variant="outline" size="sm"
                            className="gap-1.5 border-dashed border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            onClick={c.agregarFila} disabled={ro}
                        >
                            <Plus className="h-4 w-4" /> Agregar línea
                        </Button>

                        <Button
                            variant="outline" size="sm"
                            className="gap-1.5 text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
                            onClick={() => setConfirmEliminarLineas(true)}
                            disabled={ro || c.guardando || !c.clave || marcadas === 0}
                            title={marcadas === 0 ? 'Marca la casilla de las líneas que quieras eliminar' : undefined}
                        >
                            <Trash2 className="h-4 w-4" /> Eliminar marcadas ({marcadas})
                        </Button>

                        {c.clave && !ro && (
                            <Button
                                variant="ghost" size="sm"
                                className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                                onClick={() => setConfirmEliminarDoc(true)}
                            >
                                <X className="h-4 w-4" /> Eliminar documento
                            </Button>
                        )}

                        <div className="ml-auto flex w-full items-center justify-end gap-2 sm:w-auto">
                            {t.descuadrado && !ro && (
                                <span className="mr-1 inline-flex items-center gap-1.5 text-xs text-red-700 dark:text-red-400">
                                    <span className="h-2 w-2 rounded-full bg-red-500" /> No cuadra
                                </span>
                            )}
                            <Button
                                size="sm"
                                className="w-full gap-1.5 bg-emerald-600 text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 sm:w-auto"
                                onClick={c.guardar}
                                disabled={c.guardando || ro}
                            >
                                {c.guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Guardar
                            </Button>
                        </div>
                    </div>
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
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700"
                                           onClick={() => { setConfirmEliminarLineas(false); c.eliminarMarcadas() }}>
                            Eliminar líneas
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <SaldoDialog
                abierto={saldoAbierto} onCerrar={() => setSaldoAbierto(false)}
                clave={c.clave} titulo={docTitulo}
            />

            <PagosDialog
                abierto={pagosAbierto} onCerrar={() => setPagosAbierto(false)}
                clave={c.clave} titulo={docTitulo}
                onGuardado={() => { if (c.clave) c.abrir(c.clave) }}
            />

            <TransporteDialog
                abierto={transpAbierto} onCerrar={() => setTranspAbierto(false)}
                clave={c.clave} titulo={docTitulo}
            />

            <BuscadorDocumentos
                abierto={buscadorAbierto}
                onCerrar={() => setBuscadorAbierto(false)}
                onElegir={(clave) => { setBuscadorAbierto(false); setBuscarClave(String(clave)); c.abrir(clave) }}
                catalogos={cat}
                anioInicial={c.cab.anio}
                periodoInicial={c.cab.periodo}
            />

            <ImprimirCompraDialog
                abierto={imprimirAbierto}
                onCerrar={() => setImprimirAbierto(false)}
                clave={c.clave}
                titulo={docTitulo}
                nombreTipo={cod => cat?.tiposDoc.find(x => x.Cod_Tipo === cod)?.Abreviatura || cod}
            />

            <AlertDialog open={confirmRevisar} onOpenChange={setConfirmRevisar}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Revisar la compra {docTitulo}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se vuelve a generar el registro contable de este documento a partir de las líneas
                            guardadas: registro de compras, movimientos de centros de costo y ejecución de
                            presupuesto. Los cambios que no hayas guardado no se toman en cuenta.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="bg-blue-600 hover:bg-blue-700"
                                           onClick={() => { setConfirmRevisar(false); revisar() }}>
                            Sí, revisar
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

const ACENTOS = {
    blue:    'border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-950',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950',
}

function Grupo({ titulo, nota, icono: Icono, acento = 'blue', children }: {
    titulo: string; nota?: string; icono: LucideIcon; acento?: keyof typeof ACENTOS; children: React.ReactNode
}) {
    return (
        <section className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
            <div className="flex items-center gap-3 border-b border-border bg-gradient-to-b from-muted/40 to-transparent px-4 py-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${ACENTOS[acento]}`}>
                    <Icono className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold">{titulo}</h2>
                    {nota && <p className="mt-0.5 text-xs text-muted-foreground">{nota}</p>}
                </div>
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

function Cifra({ etiqueta, valor, icono: Icono, iconoCls, alerta = false }: {
    etiqueta: string; valor: number; icono: LucideIcon; iconoCls: string; alerta?: boolean
}) {
    return (
        <div className={`rounded-xl border p-3.5 shadow-sm ${alerta ? 'border-red-200 bg-red-50/70 dark:border-red-900 dark:bg-red-950/40' : 'bg-background'}`}>
            <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{etiqueta}</p>
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconoCls}`}>
                    <Icono className="h-4 w-4" />
                </span>
            </div>
            <p className={`mt-1 font-mono text-base font-bold tabular-nums sm:text-lg ${alerta ? 'text-red-700 dark:text-red-400' : ''}`}>
                {money(valor)}
            </p>
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
        <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-sm ${tonos[tono]}`}>
            <Icono className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{children}</span>
        </div>
    )
}

function Th({ children, w, right = false }: { children?: React.ReactNode; w?: string; right?: boolean }) {
    return (
        <th style={w ? { width: `${w}px` } : undefined}
            className={`px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${right ? 'text-right' : 'text-left'}`}>
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
const comboFila = "h-7 px-2 text-xs"

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
        <ComboSelect
            value={f.cuentaContab}
            onChange={q => setCampo(f.key, 'cuentaContab', String(q.IdCtaContable))}
            items={cat?.cuentas ?? []}
            getKey={q => String(q.IdCtaContable)}
            getLabel={q => q.Cod_Contab}
            placeholder="Elegir"
            searchPlaceholder="Buscar cuenta..."
            emptyText="Sin resultados"
            disabled={ro}
            triggerClassName={comboFila + " font-mono"}
            contentClassName="min-w-[220px]"
        />
    )
}

function SelectCentroCostos({ f, cat, ro, setCampo }: Pick<PropsFila, 'f' | 'cat' | 'ro' | 'setCampo'>) {
    return (
        <ComboSelect
            value={f.centroCostos}
            onChange={cc => setCampo(f.key, 'centroCostos', cc.Cod_CC)}
            items={cat?.centrosCosto ?? []}
            getKey={cc => cc.Cod_CC}
            getLabel={cc => cc.Cod_CC}
            placeholder="Elegir"
            searchPlaceholder="Buscar..."
            emptyText="Sin resultados"
            disabled={ro}
            triggerClassName={comboFila}
            contentClassName="min-w-[220px]"
        />
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
        <div className={`rounded-xl border p-3 shadow-sm ${f.eliminar ? 'border-red-200 bg-red-50/60' : 'border-border bg-background'}`}>
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
