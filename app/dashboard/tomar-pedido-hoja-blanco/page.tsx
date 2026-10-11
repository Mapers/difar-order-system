'use client'

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeftRight, BookOpen, Building2, CalendarClock, Coins, Eraser, FilePlus2, FileText, Hash, Loader2, MessageSquareText, Package, Percent, Plus, Printer, Receipt, Save, Search, Target, Trash2, User, UserCheck } from "lucide-react"
import InlineAutocomplete from "@/components/tomar-pedido/InlineAutocomplete"
import { cn } from "@/lib/utils"
import { toast } from "@/app/hooks/useToast"
import { useAuth } from "@/context/authContext"
import apiClient from "@/app/api/client"
import { fetchGetAllClients, fetchGetConditions } from "@/app/api/takeOrders"
import { getProductsLabRequest } from "@/app/api/products"
import { fetchTypeDocuments } from "@/app/api/reports"
import { TypeDocument } from "@/app/types/report/report-interface"
import { monedas } from "@/constants"
import { IClient, ICondicion } from "@/app/types/order/client-interface"
import { IAlmacen, IProduct } from "@/app/types/order/product-interface"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import ComprobantePreviewModal, { ComprobantePreviewData } from "@/components/tomar-pedido-hoja-blanco/ComprobantePreviewModal"
import AlmacenModal from "@/components/tomar-pedido/AlmacenModal"
import ProductSearchDialog from "@/components/tomar-pedido/product-step/ProductSearchDialog"

/**
 * Tomar Pedido Hoja en Blanco — Registro de Ventas (Facturas/Boleta/NC/ND).
 *
 * Formulario migrado del formulario "Facturas" de Access
 * (sieContable0623.accdb, menu Contabilidad > SIE CONTABLE > Datos
 * Movimientos > Operaciones Contables > Ventas). Detalle completo del
 * analisis, el VBA real extraido y los stored procedures propuestos en
 * opencode-difar/Hoja Blanco/.
 *
 * Catalogos reales reusados del modulo Tomar Pedido (mismos
 * microservicios, no duplicados):
 *   - Clientes      → fetchGetAllClients (app/api/takeOrders.ts)
 *   - Condiciones   → fetchGetConditions (app/api/takeOrders.ts)
 *   - Vendedores    → GET /usuarios/listar/vendedores
 *   - Almacenes     → GET /admin/listar/almacenes (AlmacenModal)
 *   - Productos     → getProductsLabRequest, filtrado por almacen (ProductSearchDialog)
 *   - Moneda        → constants/index.ts (monedas, PEN/USD como el resto de
 *                     la web); al guardar se convierte a NSO/USD
 *                     (mtipomoneda), igual que sp_ws_procesar_pedido_a_registro_ventas
 *   - Documento     → fetchTypeDocuments (mismo de Consulta Documento Clientes),
 *                     filtrado a los tipos de venta (codigos SUNAT)
 *   - Operación     → GET /admin/listar/operaciones (sp_GetTipoOperacion),
 *                     solo operaciones de venta (Motivo = 1)
 *   - IGV / Centro de costos → GET /contabilidad/compras/catalogos
 *                     (sp_ws_regcompras_catalogos: tasasIgv, centrosCosto)
 *
 * Serie, Número y Cuenta contable todavia no tienen endpoint en el backend
 * (no existe SP sobre serie_docs ni uno que devuelva las cuentas 70 con
 * IdCtaContable) — quedan con datos de prueba, claramente marcados abajo.
 *
 * Estado: en validación. El guardado del comprobante es simulado (no hay
 * endpoint real todavia). No confundir con "Hoja en Blanco"
 * (/dashboard/reportes/hoja-en-blanco), que es el reporte de despachos de
 * la serie 0800 ya existente: son pantallas distintas.
 */

// Codigos SUNAT de /reportes/typedocuments que aplican a Registro de Ventas
const DOC_FACTURA = "01"
const DOC_BOLETA = "03"
const DOC_NOTA_CREDITO = "07"
const DOC_NOTA_DEBITO = "08"
const TIPOS_DOC_VENTA = [DOC_FACTURA, DOC_BOLETA, DOC_NOTA_CREDITO, DOC_NOTA_DEBITO]

// mtipooperaciones: "01" = VENTA (Motivo 1 = venta)
const OPERACION_VENTA = "01"
const MOTIVO_VENTA = 1
const IGV_POR_DEFECTO = 0.18

// La web maneja PEN/USD (pedidocab, SUNAT); las tablas contables
// (reg ventas encabezado.Moneda → mtipomoneda) solo aceptan NSO/USD.
const MONEDA_CONTABLE: Record<string, string> = { PEN: "NSO", USD: "USD" }
const aMonedaContable = (moneda: string) => MONEDA_CONTABLE[moneda] ?? "NSO"

interface Operacion { Codigo_Op: string; Operacion: string; Motivo: number }
interface CentroCosto { Cod_CC: string; Descripcion: string }

// ---------------------------------------------------------------------
// Datos de prueba SOLO para lo que aun no tiene endpoint en el backend
// (ver Hoja Blanco/04_data_prueba/seed_data_prueba.sql)
// ---------------------------------------------------------------------
const SERIES_POR_DOC: Record<string, string[]> = {
    [DOC_FACTURA]: ["0001"],
    [DOC_BOLETA]: ["0002"],
    [DOC_NOTA_CREDITO]: ["0001"],
    [DOC_NOTA_DEBITO]: ["0001"],
}
const CUENTAS = [
    { IdCtaContable: 3, Cod_Contab: "701101", Descricpion: "Ventas - Mercaderias Afectas" },
    { IdCtaContable: 4, Cod_Contab: "701211", Descricpion: "Ventas - Mercaderias Exoneradas" },
]

// Cuenta contable por defecto segun si la linea es afecta o no al IGV
const CUENTA_AFECTA = "3"
const CUENTA_NO_AFECTA = "4"
const cuentaPorDefecto = (afecto: boolean) => (afecto ? CUENTA_AFECTA : CUENTA_NO_AFECTA)

// Centro de costos por defecto: el que se llama igual que el almacen (CHIMBOTE → CHIMBOTE)
const normalizar = (t: string) => (t || "").trim().toUpperCase()
const centroPorAlmacen = (almacen: IAlmacen | null, centros: CentroCosto[]) =>
    almacen ? centros.find((c) => normalizar(c.Descripcion) === normalizar(almacen.Descripcion))?.Cod_CC ?? "" : ""

interface LineaDetalle {
    idArticulo: string
    Articulo: string
    Cantidad: number
    PU: number
    Afecto: boolean
    CuentaContab: string
    CentroCostos: string
    // true cuando el usuario eligio el valor a mano: ya no se reasigna automaticamente
    CuentaManual: boolean
    CentroManual: boolean
}
const lineaVacia = (centro = ""): LineaDetalle => ({
    idArticulo: "", Articulo: "", Cantidad: 1, PU: 0, Afecto: true,
    CuentaContab: cuentaPorDefecto(true), CentroCostos: centro, CuentaManual: false, CentroManual: false,
})
const hoy = () => new Date().toISOString().slice(0, 10)

function fmt(n: number) {
    return n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function TomarPedidoHojaBlancoPage() {
    const auth = useAuth()

    // ── Catalogos reales ──
    const [clientes, setClientes] = useState<IClient[]>([])
    const [condicionesReal, setCondicionesReal] = useState<ICondicion[]>([])
    const [vendedoresReal, setVendedoresReal] = useState<any[]>([])
    const [tiposDocumento, setTiposDocumento] = useState<TypeDocument[]>([])
    const [operaciones, setOperaciones] = useState<Operacion[]>([])
    const [tasasIgv, setTasasIgv] = useState<{ Tasa: number }[]>([])
    const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>([])
    const [almacenes, setAlmacenes] = useState<IAlmacen[]>([])
    const [loadingAlmacenes, setLoadingAlmacenes] = useState(false)
    const [selectedAlmacen, setSelectedAlmacen] = useState<IAlmacen | null>(null)
    const [almacenModalOpen, setAlmacenModalOpen] = useState(false)

    useEffect(() => {
        const sellerCode = auth.isAdmin() ? "" : (auth.user?.codigo || "")
        const representante = auth.isAdmin() ? "" : (auth.user?.codRepres || "")
        fetchGetAllClients(sellerCode, auth.isAdmin(), representante)
            .then((res) => setClientes(res.data?.data?.data || res.data?.data || []))
            .catch(() => toast({ title: "Error", description: "No se pudo cargar la lista de clientes.", variant: "destructive" }))

        fetchTypeDocuments()
            .then((res) => {
                const todos: TypeDocument[] = res.data?.data || []
                setTiposDocumento(todos.filter((t) => TIPOS_DOC_VENTA.includes(t.Cod_Tipo)))
            })
            .catch(() => toast({ title: "Error", description: "No se pudo cargar los tipos de documento.", variant: "destructive" }))

        fetchGetConditions("")
            .then((res) => setCondicionesReal(res.data?.data?.data || res.data?.data || []))
            .catch(() => toast({ title: "Error", description: "No se pudo cargar las condiciones de pago.", variant: "destructive" }))

        // sp_listar_vendedores trae tambien los inactivos: solo Estado = 'A'
        apiClient.get("/usuarios/listar/vendedores")
            .then((res) => {
                const todos: any[] = res.data?.data?.data || res.data?.data || []
                setVendedoresReal(todos.filter((v) => v.Estado === "A"))
            })
            .catch(() => toast({ title: "Error", description: "No se pudo cargar la lista de vendedores.", variant: "destructive" }))

        apiClient.get("/admin/listar/operaciones")
            .then((res) => {
                const todas: Operacion[] = res.data?.data?.data || res.data?.data || []
                setOperaciones(todas.filter((o) => Number(o.Motivo) === MOTIVO_VENTA))
            })
            .catch(() => toast({ title: "Error", description: "No se pudo cargar las operaciones.", variant: "destructive" }))

        apiClient.get("/contabilidad/compras/catalogos")
            .then((res) => {
                const c = res.data?.data?.data || res.data?.data || {}
                setTasasIgv((c.tasasIgv || []).map((t: any) => ({ Tasa: Number(t.Tasa) })))
                setCentrosCosto(c.centrosCosto || [])
            })
            .catch(() => toast({ title: "Error", description: "No se pudo cargar las tasas de IGV y centros de costo.", variant: "destructive" }))

        setLoadingAlmacenes(true)
        apiClient.get("/admin/listar/almacenes")
            .then((res) => setAlmacenes(res.data?.data?.data || res.data?.data || []))
            .catch(() => toast({ title: "Error", description: "No se pudo cargar la lista de almacenes.", variant: "destructive" }))
            .finally(() => setLoadingAlmacenes(false))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ── Cabecera ──
    const [tipoDoc, setTipoDoc] = useState(DOC_FACTURA)
    const [serie, setSerie] = useState("0001")
    const [numero] = useState(1) // simulado: en produccion vendria de sp_ventas_siguiente_numero
    const [fecha, setFecha] = useState(hoy())
    const [codCliente, setCodCliente] = useState("")
    const [codVendedor, setCodVendedor] = useState("")
    const [condicion, setCondicion] = useState("")
    const [operacion, setOperacion] = useState(OPERACION_VENTA)
    const [moneda, setMoneda] = useState("PEN")
    // null = sin seleccionar (0 es una tasa valida: exonerado/inafecto)
    const [tasaIgv, setTasaIgv] = useState<number | null>(IGV_POR_DEFECTO)
    const tasaIgvCalculo = tasaIgv ?? 0
    const [observaciones, setObservaciones] = useState("Venta")
    const [tipoDocOriginal, setTipoDocOriginal] = useState("")
    const [serieDocOriginal, setSerieDocOriginal] = useState("")
    const [numeroDocOriginal, setNumeroDocOriginal] = useState("")
    const [fechaDocOriginal, setFechaDocOriginal] = useState("")
    const [detalle, setDetalle] = useState<LineaDetalle[]>([lineaVacia()])
    const [guardando, setGuardando] = useState(false)

    const esNotaCreditoDebito = tipoDoc === DOC_NOTA_CREDITO || tipoDoc === DOC_NOTA_DEBITO
    const diasCredito = condicionesReal.find((c) => c.CodigoCondicion === condicion)?.DiasCdto ?? 0

    // ── Buscador de productos real (mismo componente de Tomar Pedido) ──
    const [productSearchOpen, setProductSearchOpen] = useState(false)
    const [productSearchQuery, setProductSearchQuery] = useState("")
    const [filteredProducts, setFilteredProducts] = useState<IProduct[]>([])
    const [loadingProducts, setLoadingProducts] = useState(false)
    const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null)
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleSearchQueryChange = (val: string) => {
        setProductSearchQuery(val)
        if (searchTimer.current) clearTimeout(searchTimer.current)
        if (!val || !selectedAlmacen) { setFilteredProducts([]); return }
        setLoadingProducts(true)
        searchTimer.current = setTimeout(async () => {
            try {
                const res = await getProductsLabRequest(undefined, val, selectedAlmacen.IdAlmacen)
                setFilteredProducts(res.data?.data?.data || res.data?.data || [])
            } catch {
                setFilteredProducts([])
            } finally {
                setLoadingProducts(false)
            }
        }, 350)
    }

    const abrirBuscadorItem = (idx: number) => {
        setActiveRowIndex(idx)
        setProductSearchQuery("")
        setFilteredProducts([])
        setProductSearchOpen(true)
    }

    const handleProductSelect = (product: IProduct) => {
        if (activeRowIndex === null) return
        cambiarAfecto(activeRowIndex, product.afecto_igv !== 0, {
            idArticulo: String(product.IdArticulo),
            Articulo: `${product.Codigo_Art} - ${product.NombreItem}`,
            PU: Number(product.PUContado),
        })
        setProductSearchOpen(false)
    }

    const setLinea = (idx: number, patch: Partial<LineaDetalle>) => {
        setDetalle((prev) => {
            const copia = [...prev]
            copia[idx] = { ...copia[idx], ...patch }
            return copia
        })
    }
    // Cambia el afecto de la linea y, si la cuenta no fue elegida a mano, la ajusta
    // (afecto → cuenta de afectas; no afecto → cuenta de exoneradas).
    // Igual que Tomar Pedido: si el buscador no trae afecto_igv, el producto es gravado.
    const cambiarAfecto = (idx: number, afecto: boolean, extra: Partial<LineaDetalle> = {}) => {
        setDetalle((prev) => prev.map((l, i) => (i !== idx ? l : {
            ...l,
            ...extra,
            Afecto: afecto,
            CuentaContab: l.CuentaManual ? l.CuentaContab : cuentaPorDefecto(afecto),
        })))
    }

    // Centro de costos del almacen seleccionado; se aplica a las lineas que no fueron cambiadas a mano
    const centroAlmacen = centroPorAlmacen(selectedAlmacen, centrosCosto)
    useEffect(() => {
        if (!centroAlmacen) return
        setDetalle((prev) => prev.map((l) => (l.CentroManual ? l : { ...l, CentroCostos: centroAlmacen })))
    }, [centroAlmacen])

    const agregarLinea = () => setDetalle((prev) => [...prev, lineaVacia(centroAlmacen)])
    const quitarLinea = (idx: number) => setDetalle((prev) => prev.filter((_, i) => i !== idx))

    const totales = useMemo(() => {
        let afecto = 0
        let noAfecto = 0
        detalle.forEach((l) => {
            const importe = Number(l.Cantidad || 0) * Number(l.PU || 0)
            if (l.Afecto) afecto += importe
            else noAfecto += importe
        })
        const vva = Math.round((afecto / (1 + tasaIgvCalculo)) * 100) / 100
        const igv = Math.round((afecto - vva) * 100) / 100
        const vvna = Math.round(noAfecto * 100) / 100
        return { vva, igv, vvna, total: Math.round((vva + igv + vvna) * 100) / 100 }
    }, [detalle, tasaIgvCalculo])

    const simbolo = moneda === "USD" ? "US$" : "S/"
    const itemsConProducto = detalle.filter((l) => l.idArticulo).length
    const docSeleccionado = tiposDocumento.find((t) => t.Cod_Tipo === tipoDoc)

    // ── Vista previa / impresión ──
    const [previewOpen, setPreviewOpen] = useState(false)
    const previewData = useMemo<ComprobantePreviewData>(() => {
        const cliente = clientes.find((c) => c.codigo === codCliente)
        const vendedor = vendedoresReal.find((v) => (v.Codigo_Vend || v.codigo) === codVendedor)
        const docOriginal = tiposDocumento.find((t) => t.Cod_Tipo === tipoDocOriginal)
        return {
            documento: docSeleccionado?.Descripcion ?? "",
            serie,
            numero: String(numero).padStart(6, "0"),
            fecha,
            clienteNombre: cliente?.Nombre ?? "",
            clienteDocumento: cliente?.RUC ?? "",
            clienteDireccion: cliente?.["Dirección"] ?? "",
            clienteTelefono: cliente?.telefono ?? "",
            vendedor: vendedor ? `${vendedor.Nombres || vendedor.nombres} ${vendedor.Apellidos || vendedor.apellidos}` : "",
            condicion: condicionesReal.find((c) => c.CodigoCondicion === condicion)?.Descripcion ?? "",
            diasCredito: Number(diasCredito) || 0,
            moneda: monedas.find((m) => m.value === moneda)?.label ?? "",
            monedaCodigo: moneda,
            simbolo,
            operacion: operaciones.find((o) => o.Codigo_Op === operacion)?.Operacion ?? "",
            almacen: selectedAlmacen ? `${selectedAlmacen.Codigo_Alm} - ${selectedAlmacen.Descripcion}` : "",
            observaciones,
            referencia: esNotaCreditoDebito && (docOriginal || serieDocOriginal || numeroDocOriginal)
                ? `${docOriginal?.Descripcion ?? ""} ${serieDocOriginal}-${numeroDocOriginal}${fechaDocOriginal ? ` del ${fechaDocOriginal.split("-").reverse().join("/")}` : ""}`.trim()
                : undefined,
            tasaIgv: tasaIgvCalculo,
            lineas: detalle.filter((l) => l.idArticulo).map((l) => {
                const [codigo, ...resto] = l.Articulo.split(" - ")
                return {
                    codigo,
                    descripcion: resto.join(" - ") || l.Articulo,
                    cantidad: Number(l.Cantidad || 0),
                    precio: Number(l.PU || 0),
                    afecto: l.Afecto,
                }
            }),
            totales,
        }
    }, [clientes, codCliente, vendedoresReal, codVendedor, tiposDocumento, tipoDocOriginal, docSeleccionado, serie, numero, fecha,
        condicionesReal, condicion, diasCredito, moneda, simbolo, operacion, selectedAlmacen, observaciones, esNotaCreditoDebito,
        serieDocOriginal, numeroDocOriginal, fechaDocOriginal, tasaIgv, detalle, totales, operaciones])

    // ── Cambio de almacén: si ya hay productos, confirmar antes (se limpia el detalle) ──
    const [confirmAlmacenOpen, setConfirmAlmacenOpen] = useState(false)
    const solicitarCambioAlmacen = () => {
        if (selectedAlmacen && itemsConProducto > 0) setConfirmAlmacenOpen(true)
        else setAlmacenModalOpen(true)
    }

    // ── Limpiar (hoja en blanco) ──
    const [confirmLimpiarOpen, setConfirmLimpiarOpen] = useState(false)
    const limpiarFormulario = () => {
        setTipoDoc(DOC_FACTURA)
        setSerie(SERIES_POR_DOC[DOC_FACTURA][0])
        setFecha(hoy())
        setCodCliente("")
        setCodVendedor("")
        setCondicion("")
        setOperacion(OPERACION_VENTA)
        setMoneda("PEN")
        setTasaIgv(IGV_POR_DEFECTO)
        setObservaciones("Venta")
        setTipoDocOriginal("")
        setSerieDocOriginal("")
        setNumeroDocOriginal("")
        setFechaDocOriginal("")
        setSelectedAlmacen(null)
        setDetalle([lineaVacia()])
        toast({ title: "Formulario limpio", description: "Puedes empezar un nuevo comprobante." })
    }

    async function handleGuardar() {
        if (!tipoDoc || !serie || !codCliente || !codVendedor || !condicion || !operacion || !moneda || tasaIgv === null) {
            toast({ title: "Complete informacion", description: "Documento, serie, cliente, vendedor, condicion, operacion, moneda e IGV son obligatorios.", variant: "destructive" })
            return
        }
        if (detalle.every((l) => !l.idArticulo)) {
            toast({ title: "Falta el detalle", description: "Agregue al menos un item.", variant: "destructive" })
            return
        }
        if (detalle.some((l) => l.idArticulo && !(l.Cantidad > 0))) {
            toast({ title: "Cantidad inválida", description: "Todos los items deben tener una cantidad mayor a 0.", variant: "destructive" })
            return
        }
        setGuardando(true)
        // Cuerpo con los nombres y codigos de `reg ventas encabezado` / `reg ventas detalle`.
        // La moneda va convertida a codigo contable (PEN → NSO).
        const payload = {
            Tipo_Doc: tipoDoc,
            Serie: serie,
            Numero: numero,
            Fecha_Emision: fecha,
            Cod_Clie: codCliente,
            CodVend: codVendedor,
            Condision: condicion,
            ConceptoSalida: operacion,
            Moneda: aMonedaContable(moneda),
            TasaIGV: tasaIgv,
            Observaciones: observaciones,
            Almacen: selectedAlmacen?.IdAlmacen ?? null,
            TipoDocOriginal: esNotaCreditoDebito ? tipoDocOriginal || null : null,
            SerieDocOriginal: esNotaCreditoDebito ? serieDocOriginal || null : null,
            NumeroDocOriginal: esNotaCreditoDebito ? numeroDocOriginal || null : null,
            FechaDocOriginal: esNotaCreditoDebito ? fechaDocOriginal || null : null,
            detalle: detalle.filter((l) => l.idArticulo).map((l) => ({
                idArticulo: Number(l.idArticulo),
                Articulo: l.Articulo,
                Cantidad: l.Cantidad,
                PU: l.PU,
                Afecto: l.Afecto ? 1 : 0,
                CuentaContab: l.CuentaContab ? Number(l.CuentaContab) : null,
                CentroCostos: l.CentroCostos || null,
            })),
        }
        // TODO: reemplazar por la llamada real cuando exista el endpoint
        // (equivalente a sp_ventas_guardar_completo, ver Hoja Blanco/03_sp/06_sp_ventas_guardar_completo.sql):
        //   await apiClient.post("<endpoint guardar>", payload)
        void payload
        await new Promise((r) => setTimeout(r, 500))
        setGuardando(false)
        toast({
            title: "Comprobante guardado (demo)",
            description: `${tipoDoc} ${serie}-${String(numero).padStart(6, "0")} · Total ${fmt(totales.total)} — centralizacion simulada, pendiente conectar al backend real.`,
        })
    }

    return (
        <div className="grid gap-6 p-4 md:p-6">
            <div className="flex flex-col gap-2">
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                    <FilePlus2 className="h-6 w-6 text-blue-600" /> Tomar Pedido Hoja en Blanco
                </h1>
                <p className="text-sm text-muted-foreground md:text-base">
                    Registro de Ventas — formulario migrado de Access (Facturas/Boleta/NC/ND). En validación, catálogos reales de Tomar Pedido.
                </p>
            </div>

            {/* ── Cabecera ── */}
            <Card className="shadow-md">
                <CardHeader className="border-b border-border bg-muted p-4 md:p-5">
                    <CardTitle className="text-base">Datos del comprobante</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 p-4 md:p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <ComboTile
                            label="Documento"
                            required
                            value={tipoDoc}
                            items={tiposDocumento}
                            getKey={(i) => i.Cod_Tipo}
                            getLabel={(i) => i.Descripcion}
                            onSelect={(it) => { setTipoDoc(it.Cod_Tipo); setSerie(SERIES_POR_DOC[it.Cod_Tipo]?.[0] || "") }}
                            onClear={() => { setTipoDoc(""); setSerie("") }}
                            icon={FileText}
                            accent="violet"
                            title="Tipo de documento"
                            description="Factura, boleta o nota"
                        />
                        <ComboTile
                            label="Serie"
                            required
                            value={serie}
                            items={SERIES_POR_DOC[tipoDoc] || []}
                            getKey={(i) => i}
                            getLabel={(i) => `Serie ${i}`}
                            onSelect={(it) => setSerie(it)}
                            onClear={() => setSerie("")}
                            icon={Hash}
                            accent="violet"
                            title="Serie"
                            description={tipoDoc ? "Serie del comprobante" : "Elige primero el documento"}
                        />
                        <Campo label="Número">
                            <Input value={String(numero).padStart(6, "0")} disabled className="bg-muted font-mono" />
                        </Campo>
                        <Campo label="Fecha (*)">
                            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                        </Campo>
                    </div>

                    <ComboTile
                        label="Cliente"
                        required
                        value={codCliente}
                        items={clientes}
                        getKey={(i) => i.codigo}
                        getLabel={(i) => i.Nombre}
                        getSub={(i) => `${i.codigo}${i.RUC ? ` · RUC ${i.RUC}` : ""}`}
                        onSelect={(it) => setCodCliente(it.codigo)}
                        onClear={() => setCodCliente("")}
                        icon={User}
                        accent="blue"
                        title="Cliente"
                        description="Buscar por código, nombre o RUC"
                        placeholder="Buscar cliente por código, nombre o RUC..."
                        pageSize={30}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <ComboTile
                            label="Vendedor"
                            required
                            value={codVendedor}
                            items={vendedoresReal}
                            getKey={(i) => i.Codigo_Vend || i.codigo}
                            getLabel={(i) => `${i.Nombres || i.nombres} ${i.Apellidos || i.apellidos}`}
                            onSelect={(it) => setCodVendedor(it.Codigo_Vend || it.codigo)}
                            onClear={() => setCodVendedor("")}
                            icon={UserCheck}
                            accent="blue"
                            title="Vendedor"
                            description="Responsable de la venta"
                        />
                        <ComboTile
                            label="Condición"
                            required
                            value={condicion}
                            items={condicionesReal}
                            getKey={(i) => i.CodigoCondicion}
                            getLabel={(i) => i.Descripcion}
                            onSelect={(it) => setCondicion(it.CodigoCondicion)}
                            onClear={() => setCondicion("")}
                            icon={CalendarClock}
                            accent="violet"
                            title="Condición de pago"
                            description="Contado o crédito"
                        />
                        <ComboTile
                            label="Operación"
                            required
                            value={operacion}
                            items={operaciones}
                            getKey={(i) => i.Codigo_Op}
                            getLabel={(i) => i.Operacion}
                            loading={operaciones.length === 0}
                            onSelect={(it) => setOperacion(it.Codigo_Op)}
                            onClear={() => setOperacion("")}
                            icon={ArrowLeftRight}
                            accent="violet"
                            title="Operación"
                            description="Tipo de operación"
                        />
                        <ComboTile
                            label="Moneda"
                            required
                            value={moneda}
                            items={monedas}
                            getKey={(i) => i.value}
                            getLabel={(i) => i.label}
                            onSelect={(it) => setMoneda(it.value)}
                            onClear={() => setMoneda("")}
                            icon={Coins}
                            accent="blue"
                            title="Moneda"
                            description="Soles o dólares"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <ComboTile
                            label="IGV"
                            required
                            value={tasaIgv === null ? "" : String(tasaIgv)}
                            items={tasasIgv}
                            getKey={(i) => String(i.Tasa)}
                            getLabel={(i) => `${(i.Tasa * 100).toFixed(2)}%`}
                            getSub={(i) => (i.Tasa === 0 ? "Exonerado / inafecto" : "Tasa IGV")}
                            loading={tasasIgv.length === 0}
                            onSelect={(it) => setTasaIgv(it.Tasa)}
                            onClear={() => setTasaIgv(null)}
                            icon={Percent}
                            accent="blue"
                            title="Tasa de IGV"
                            description="Impuesto aplicado"
                        />
                        <div className="flex min-w-0 flex-col gap-1.5">
                            <Label className="text-sm font-semibold text-foreground">Días crédito</Label>
                            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 p-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800">
                                    <CalendarClock className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold leading-tight text-foreground">{diasCredito} {Number(diasCredito) === 1 ? "día" : "días"}</p>
                                    <p className="text-xs text-muted-foreground">Según la condición</p>
                                </div>
                            </div>
                        </div>
                        {/* reg ventas encabezado.Observaciones es varchar(100) */}
                        <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="observaciones" className="text-sm font-semibold text-foreground">Observaciones</Label>
                                <span className={cn("text-xs tabular-nums", observaciones.length >= 90 ? "font-semibold text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                                    {observaciones.length}/100
                                </span>
                            </div>
                            <div className="relative">
                                <MessageSquareText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <textarea
                                    id="observaciones"
                                    value={observaciones}
                                    maxLength={100}
                                    rows={2}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                    placeholder="Notas del comprobante (opcional)"
                                    className="block w-full resize-none rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm leading-relaxed text-foreground shadow-sm transition-colors placeholder:text-muted-foreground hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:hover:border-blue-800"
                                />
                            </div>
                        </div>
                    </div>

                    {esNotaCreditoDebito && (
                        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
                            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                                Documento referencia de Nota de Crédito / Débito
                            </p>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <ComboTile
                                    label="Documento"
                                    value={tipoDocOriginal}
                                    items={tiposDocumento.filter((t) => t.Cod_Tipo === DOC_FACTURA || t.Cod_Tipo === DOC_BOLETA)}
                                    getKey={(i) => i.Cod_Tipo}
                                    getLabel={(i) => i.Descripcion}
                                    onSelect={(it) => setTipoDocOriginal(it.Cod_Tipo)}
                                    onClear={() => setTipoDocOriginal("")}
                                    icon={FileText}
                                    accent="violet"
                                    title="Documento origen"
                                    description="Factura o boleta"
                                />
                                <Campo label="Fecha">
                                    <Input type="date" value={fechaDocOriginal} onChange={(e) => setFechaDocOriginal(e.target.value)} />
                                </Campo>
                                <Campo label="Serie">
                                    <Input value={serieDocOriginal} onChange={(e) => setSerieDocOriginal(e.target.value)} />
                                </Campo>
                                <Campo label="Número">
                                    <Input value={numeroDocOriginal} onChange={(e) => setNumeroDocOriginal(e.target.value)} />
                                </Campo>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Detalle ── */}
            <Card className="shadow-md">
                <CardHeader className="border-b border-border bg-muted p-4 md:p-5">
                    <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-base">Detalle de items</CardTitle>
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            {itemsConProducto} {itemsConProducto === 1 ? "item" : "items"}
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 p-4 md:p-6">
                    {/* Almacén: obligatorio antes de poder buscar/agregar productos */}
                    <div className={cn(
                        "flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between",
                        selectedAlmacen ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30" : "border-amber-300 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30",
                    )}>
                        <div className="flex min-w-0 items-center gap-3">
                            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", selectedAlmacen ? "bg-emerald-600" : "bg-amber-500")}>
                                <Building2 className="h-5 w-5 text-white" />
                            </div>
                            <div className="min-w-0">
                                <p className={cn("text-sm font-semibold", selectedAlmacen ? "text-emerald-900 dark:text-emerald-200" : "text-amber-900 dark:text-amber-200")}>
                                    {selectedAlmacen ? `${selectedAlmacen.Codigo_Alm} - ${selectedAlmacen.Descripcion}` : "Selecciona el almacén"}
                                </p>
                                <p className={cn("text-xs", selectedAlmacen ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400")}>
                                    {selectedAlmacen ? "Almacén de despacho de esta venta" : "Chimbote / Trujillo — necesario para buscar y agregar items"}
                                </p>
                            </div>
                        </div>
                        <Button type="button" size="sm" variant="outline" onClick={solicitarCambioAlmacen} className="shrink-0 bg-background">
                            <Building2 className="mr-2 h-4 w-4" /> {selectedAlmacen ? "Cambiar almacén" : "Seleccionar almacén"}
                        </Button>
                    </div>

                    {/* Sin almacén el detalle queda deshabilitado (fieldset deshabilita todos los controles internos) */}
                    <fieldset disabled={!selectedAlmacen} className={cn("m-0 flex min-w-0 flex-col gap-3 border-0 p-0", !selectedAlmacen && "opacity-50")}>
                        {detalle.map((l, idx) => {
                            const importe = Number(l.Cantidad || 0) * Number(l.PU || 0)
                            const [codigoArt, ...resto] = l.Articulo.split(" - ")
                            const nombreArt = resto.join(" - ")
                            return (
                                <div key={idx} className="rounded-xl border border-border bg-background p-3 shadow-sm transition-colors hover:border-blue-300 dark:hover:border-blue-800 md:p-4">
                                    {/* Fila 1: producto + afecto + eliminar */}
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{idx + 1}</span>
                                            <button
                                                type="button"
                                                onClick={() => abrirBuscadorItem(idx)}
                                                className={cn(
                                                    "flex min-w-0 flex-1 items-center gap-3 rounded-xl border p-2.5 text-left transition-colors disabled:cursor-not-allowed",
                                                    l.idArticulo
                                                        ? "border-violet-200 bg-violet-50 hover:bg-violet-100 dark:border-violet-900/60 dark:bg-violet-950/30"
                                                        : "border-dashed border-border hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-950/20",
                                                )}
                                            >
                                                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", l.idArticulo ? "bg-violet-600" : "bg-violet-100 dark:bg-violet-900/40")}>
                                                    <Package className={cn("h-4 w-4", l.idArticulo ? "text-white" : "text-violet-600 dark:text-violet-400")} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    {l.idArticulo ? (
                                                        <>
                                                            <p className="truncate text-sm font-semibold text-violet-900 dark:text-violet-200">{nombreArt || l.Articulo}</p>
                                                            <p className="truncate font-mono text-xs text-violet-600 dark:text-violet-400">{codigoArt}</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="text-sm font-semibold text-foreground">Buscar producto</p>
                                                            <p className="text-xs text-muted-foreground">Por código o nombre en el almacén seleccionado</p>
                                                        </>
                                                    )}
                                                </div>
                                                <span className="hidden shrink-0 text-xs font-medium text-violet-600 dark:text-violet-400 sm:inline">
                                                    {l.idArticulo ? "Cambiar" : <Search className="h-4 w-4" />}
                                                </span>
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 md:justify-end">
                                            <button
                                                type="button"
                                                onClick={() => cambiarAfecto(idx, !l.Afecto)}
                                                title="Afecto al IGV"
                                                className={cn(
                                                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed",
                                                    l.Afecto
                                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400"
                                                        : "border-border bg-muted text-muted-foreground hover:bg-muted/70",
                                                )}
                                            >
                                                <span className={cn("h-2 w-2 rounded-full", l.Afecto ? "bg-emerald-500" : "bg-muted-foreground/50")} />
                                                {l.Afecto ? "Afecto IGV" : "No afecto"}
                                            </button>
                                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40" onClick={() => quitarLinea(idx)} aria-label="Quitar item">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Fila 2: cantidad, precio, contabilidad, importe */}
                                    <div className="mt-3 grid grid-cols-2 gap-3 md:pl-10 lg:grid-cols-[110px_140px_minmax(0,1fr)_minmax(0,1fr)_160px] lg:items-end">
                                        <div className="flex min-w-0 flex-col gap-1.5">
                                            <Label className="text-xs font-semibold text-muted-foreground">Cantidad</Label>
                                            <Input
                                                type="number"
                                                inputMode="numeric"
                                                min={1}
                                                step={1}
                                                value={l.Cantidad}
                                                onKeyDown={(e) => { if ([".", ",", "-", "e", "E", "+"].includes(e.key)) e.preventDefault() }}
                                                onChange={(e) => {
                                                    // Cantidad en unidades enteras (sin decimales ni negativos)
                                                    const n = Math.floor(Number(e.target.value))
                                                    setLinea(idx, { Cantidad: Number.isFinite(n) && n > 0 ? n : 0 })
                                                }}
                                                className="h-10 text-right font-mono"
                                            />
                                        </div>
                                        <div className="flex min-w-0 flex-col gap-1.5">
                                            <Label className="text-xs font-semibold text-muted-foreground">{l.Afecto ? "PU con IGV" : "PU sin IGV"} ({simbolo})</Label>
                                            <Input type="number" min={0} step="0.01" value={l.PU} onChange={(e) => setLinea(idx, { PU: Number(e.target.value) })} className="h-10 text-right font-mono" />
                                        </div>
                                        <div className="col-span-2 lg:col-span-1">
                                            <ComboTile
                                                label="Cuenta contable"
                                                value={l.CuentaContab}
                                                items={CUENTAS}
                                                getKey={(i) => String(i.IdCtaContable)}
                                                getLabel={(i) => i.Descricpion}
                                                getSub={(i) => i.Cod_Contab}
                                                onSelect={(it) => setLinea(idx, { CuentaContab: String(it.IdCtaContable), CuentaManual: true })}
                                                onClear={() => setLinea(idx, { CuentaContab: "" })}
                                                confirmarCambio={{
                                                    titulo: "¿Cambiar la cuenta contable?",
                                                    descripcion: `Se asignó automáticamente la cuenta de ventas ${l.Afecto ? "afectas" : "exoneradas"} según el IGV del item. Si la cambias, ya no se ajustará sola.`,
                                                }}
                                                icon={BookOpen}
                                                accent="blue"
                                                title="Cuenta contable"
                                                description="Cuenta de ventas"
                                            />
                                        </div>
                                        <div className="col-span-2 lg:col-span-1">
                                            <ComboTile
                                                label="Centro de costos"
                                                value={l.CentroCostos}
                                                items={centrosCosto}
                                                getKey={(i) => i.Cod_CC}
                                                getLabel={(i) => i.Descripcion}
                                                loading={centrosCosto.length === 0}
                                                onSelect={(it) => setLinea(idx, { CentroCostos: it.Cod_CC, CentroManual: true })}
                                                onClear={() => setLinea(idx, { CentroCostos: "" })}
                                                confirmarCambio={{
                                                    titulo: "¿Cambiar el centro de costos?",
                                                    descripcion: `Se asignó automáticamente según el almacén${selectedAlmacen ? ` (${selectedAlmacen.Descripcion})` : ""}. Si lo cambias, ya no se ajustará solo.`,
                                                }}
                                                icon={Target}
                                                accent="violet"
                                                title="Centro de costos"
                                                description="Sucursal"
                                            />
                                        </div>
                                        <div className="col-span-2 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 dark:border-blue-900/60 dark:bg-blue-950/30 lg:col-span-1 lg:flex-col lg:items-end lg:justify-center">
                                            <span className="text-[11px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">Importe</span>
                                            <span className="font-mono text-lg font-bold text-blue-800 dark:text-blue-200">{simbolo} {fmt(importe)}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        <button
                            type="button"
                            onClick={agregarLinea}
                            className="group flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-blue-200 p-4 text-sm font-semibold text-blue-600 transition-colors hover:border-blue-400 hover:bg-blue-50/60 disabled:cursor-not-allowed dark:border-blue-900/60 dark:text-blue-400 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
                        >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition-transform group-hover:scale-110 group-disabled:scale-100">
                                <Plus className="h-4 w-4" />
                            </span>
                            Agregar otro item
                        </button>
                    </fieldset>
                </CardContent>
            </Card>

            {/* ── Resumen: totales + acciones ── */}
            <Card className="overflow-hidden shadow-md">
                <div className="grid lg:grid-cols-[1fr_minmax(300px,380px)]">
                    <div className="flex flex-col gap-4 p-4 md:p-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-400">
                                <Receipt className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-sm font-semibold leading-none text-foreground">Resumen del comprobante</h2>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {itemsConProducto} {itemsConProducto === 1 ? "item" : "items"} · {monedas.find((m) => m.value === moneda)?.label ?? "Sin moneda"}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <TotalCard label="VVNA" hint="Valor venta no afecto" valor={`${simbolo} ${fmt(totales.vvna)}`} />
                            <TotalCard label="VVA" hint="Valor venta afecto" valor={`${simbolo} ${fmt(totales.vva)}`} />
                            <TotalCard label="IGV" hint={tasaIgv === null ? "Sin tasa" : `Impuesto ${(tasaIgv * 100).toFixed(tasaIgv * 100 % 1 ? 1 : 0)}%`} valor={`${simbolo} ${fmt(totales.igv)}`} />
                        </div>
                    </div>

                    <div className="flex flex-col justify-center bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white md:p-6">
                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">Total a pagar</p>
                        <p className="mt-1 font-mono text-3xl font-bold tracking-tight md:text-4xl">{simbolo} {fmt(totales.total)}</p>
                        <p className="mt-1 truncate text-xs text-blue-100">
                            {docSeleccionado?.Descripcion ?? "Sin documento"} {serie && `· ${serie}-${String(numero).padStart(6, "0")}`}
                        </p>
                    </div>
                </div>

                {/* Acciones: Guardar / Imprimir a la izquierda, Limpiar a la derecha */}
                <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button type="button" onClick={handleGuardar} disabled={guardando} className="bg-blue-600 font-semibold shadow-sm hover:bg-blue-700 sm:min-w-[140px]">
                            {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {guardando ? "Guardando..." : "Guardar"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)} className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-900/60 dark:text-blue-400 dark:hover:bg-blue-950/40 sm:min-w-[140px]">
                            <Printer className="mr-2 h-4 w-4" /> Imprimir
                        </Button>
                    </div>
                    <Button type="button" variant="outline" onClick={() => setConfirmLimpiarOpen(true)} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40 sm:min-w-[140px]">
                        <Eraser className="mr-2 h-4 w-4" /> Limpiar
                    </Button>
                </div>
            </Card>

            {/* Confirmaciones animadas */}
            <ConfirmacionAnimada
                open={confirmLimpiarOpen}
                onOpenChange={setConfirmLimpiarOpen}
                icon={Eraser}
                titulo="¿Limpiar el comprobante?"
                descripcion={`Se borrarán la cabecera, el almacén y los ${itemsConProducto} ${itemsConProducto === 1 ? "item" : "items"} del detalle. Esta acción no se puede deshacer.`}
                textoConfirmar="Sí, limpiar todo"
                onConfirm={limpiarFormulario}
            />
            <ConfirmacionAnimada
                open={confirmAlmacenOpen}
                onOpenChange={setConfirmAlmacenOpen}
                icon={Building2}
                titulo="¿Cambiar de almacén?"
                descripcion={`Si cambias de almacén se limpiará el detalle del pedido (${itemsConProducto} ${itemsConProducto === 1 ? "item" : "items"}), porque los productos y su stock dependen del almacén.`}
                textoConfirmar="Sí, cambiar almacén"
                onConfirm={() => setAlmacenModalOpen(true)}
            />

            <ComprobantePreviewModal open={previewOpen} onOpenChange={setPreviewOpen} data={previewData} />

            {/* Modales reusados tal cual del modulo Tomar Pedido */}
            <AlmacenModal
                open={almacenModalOpen}
                onOpenChange={setAlmacenModalOpen}
                almacenes={almacenes}
                selectedAlmacen={selectedAlmacen}
                onSelectAlmacen={(alm) => {
                    // Cambio real de almacén → el detalle del almacén anterior ya no aplica
                    if (selectedAlmacen && alm.IdAlmacen !== selectedAlmacen.IdAlmacen) {
                        setDetalle([lineaVacia(centroPorAlmacen(alm, centrosCosto))])
                        toast({ title: "Almacén cambiado", description: `Detalle limpiado. Ahora despachando desde ${alm.Descripcion}.` })
                    }
                    setSelectedAlmacen(alm)
                    setAlmacenModalOpen(false)
                }}
                loading={loadingAlmacenes}
            />
            <ProductSearchDialog
                open={productSearchOpen}
                onOpenChange={setProductSearchOpen}
                searchQuery={productSearchQuery}
                onSearchQueryChange={handleSearchQueryChange}
                filteredProducts={filteredProducts}
                onProductSelect={handleProductSelect}
                currency={monedas.find((m) => m.value === moneda) || null}
                loadingProducts={loadingProducts}
            />
        </div>
    )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex min-w-0 flex-col gap-1.5">
            <Label className="text-sm font-semibold text-foreground">{label}</Label>
            {children}
        </div>
    )
}

function TotalCard({ label, hint, valor }: { label: string; hint: string; valor: string }) {
    return (
        <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-foreground">{label}</span>
                <span className="truncate text-[11px] text-muted-foreground">{hint}</span>
            </div>
            <div className="mt-2 font-mono text-xl font-bold text-blue-700 dark:text-blue-400">{valor}</div>
        </div>
    )
}

// Combo con el mismo diseño de Cliente Cobranza: tarjeta con ícono que abre
// el buscador (InlineAutocomplete variant="tile") y, una vez elegido, tarjeta
// de color con el valor seleccionado y botón "Cambiar".
const TILE_ACCENTS = {
    blue: { card: "border-blue-200 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/30", badge: "bg-blue-600", title: "text-blue-900 dark:text-blue-200", sub: "text-blue-600 dark:text-blue-400", button: "text-blue-600 border-blue-200 hover:bg-blue-100 dark:border-blue-900/60", itemBadge: "bg-blue-100 dark:bg-blue-900/40", itemIcon: "text-blue-600 dark:text-blue-400" },
    violet: { card: "border-violet-200 bg-violet-50 dark:border-violet-900/60 dark:bg-violet-950/30", badge: "bg-violet-600", title: "text-violet-900 dark:text-violet-200", sub: "text-violet-600 dark:text-violet-400", button: "text-violet-600 border-violet-200 hover:bg-violet-100 dark:border-violet-900/60", itemBadge: "bg-violet-100 dark:bg-violet-900/40", itemIcon: "text-violet-600 dark:text-violet-400" },
}

function ComboTile<T>({
    label, required, value, items, getKey, getLabel, getSub, onSelect, onClear,
    icon: Icon, accent = "blue", title, description, placeholder, loading, pageSize, confirmarCambio,
}: {
    label: string
    required?: boolean
    value: string
    items: T[]
    getKey: (item: T) => string
    getLabel: (item: T) => string
    getSub?: (item: T) => string
    onSelect: (item: T) => void
    onClear: () => void
    icon: React.ComponentType<{ className?: string }>
    accent?: keyof typeof TILE_ACCENTS
    title: string
    description: string
    placeholder?: string
    loading?: boolean
    pageSize?: number
    /** Si se pasa, "Cambiar" pide confirmacion antes de liberar el valor */
    confirmarCambio?: { titulo: string; descripcion: string }
}) {
    const [search, setSearch] = useState("")
    const [confirmOpen, setConfirmOpen] = useState(false)
    const liberar = () => { setSearch(""); onClear() }
    const colors = TILE_ACCENTS[accent]
    const selected = items.find((i) => getKey(i) === value)
    const subDe = getSub ?? getKey

    const filtrados = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return items
        return items.filter((i) => getLabel(i).toLowerCase().includes(q) || subDe(i).toLowerCase().includes(q))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, search])

    return (
        <div className="flex min-w-0 flex-col gap-1.5">
            <Label className="text-sm font-semibold text-foreground">
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            {selected ? (
                <div className={cn("flex items-center gap-2 rounded-xl border p-2.5", colors.card)}>
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", colors.badge)}>
                        <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className={cn("truncate text-sm font-semibold leading-tight", colors.title)}>{getLabel(selected)}</p>
                        <p className={cn("truncate font-mono text-xs", colors.sub)}>{subDe(selected)}</p>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => (confirmarCambio ? setConfirmOpen(true) : liberar())}
                        className={cn("h-7 shrink-0 bg-background px-2.5 text-xs", colors.button)}
                    >
                        Cambiar
                    </Button>
                </div>
            ) : (
                <InlineAutocomplete<T>
                    variant="tile"
                    tileAccent={accent}
                    tileIcon={Icon}
                    tileTitle={title}
                    tileDescription={description}
                    placeholder={placeholder ?? `Buscar ${label.toLowerCase()}...`}
                    value={search}
                    onValueChange={setSearch}
                    items={filtrados}
                    loading={loading}
                    pageSize={pageSize}
                    getKey={getKey}
                    getItemLabel={getLabel}
                    onSelect={onSelect}
                    emptyMessage="No se encontraron resultados"
                    idleMessage="Sin opciones disponibles"
                    renderItem={(i) => (
                        <div className="flex items-center gap-3 px-3 py-2.5">
                            <div className={cn("shrink-0 rounded-full p-2", colors.itemBadge)}>
                                <Icon className={cn("h-4 w-4", colors.itemIcon)} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-foreground">{getLabel(i)}</p>
                                <p className="font-mono text-xs text-muted-foreground">{subDe(i)}</p>
                            </div>
                        </div>
                    )}
                />
            )}
            {confirmarCambio && (
                <ConfirmacionAnimada
                    open={confirmOpen}
                    onOpenChange={setConfirmOpen}
                    icon={Icon}
                    tono="aviso"
                    titulo={confirmarCambio.titulo}
                    descripcion={confirmarCambio.descripcion}
                    textoConfirmar="Sí, cambiar"
                    onConfirm={liberar}
                />
            )}
        </div>
    )
}

// Confirmación con ícono animado (onda + balanceo), usada para Limpiar y
// para Cambiar almacén.
function ConfirmacionAnimada({
    open, onOpenChange, icon: Icon, titulo, descripcion, textoConfirmar, onConfirm, tono = "peligro",
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    icon: React.ComponentType<{ className?: string }>
    titulo: string
    descripcion: string
    textoConfirmar: string
    onConfirm: () => void
    /** peligro (rojo): borra datos · aviso (ámbar): cambia un valor asignado automáticamente */
    tono?: "peligro" | "aviso"
}) {
    const c = tono === "aviso"
        ? { onda: "bg-amber-400/40", fondo: "bg-amber-100 dark:bg-amber-950/60", icono: "text-amber-600 dark:text-amber-400", boton: "bg-amber-500 hover:bg-amber-600" }
        : { onda: "bg-red-400/40", fondo: "bg-red-100 dark:bg-red-950/60", icono: "text-red-600 dark:text-red-400", boton: "bg-red-600 hover:bg-red-700" }
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md overflow-hidden">
                <div className="flex flex-col items-center gap-3 pt-2 text-center">
                    <div className="relative flex h-16 w-16 items-center justify-center">
                        <span className={cn("absolute inset-0 animate-ping rounded-full", c.onda)} />
                        <span className={cn("relative flex h-16 w-16 items-center justify-center rounded-full", c.fondo)}>
                            <Icon className={cn("h-7 w-7 animate-[wiggle_0.9s_ease-in-out_infinite]", c.icono)} />
                        </span>
                    </div>
                    <AlertDialogHeader className="items-center sm:text-center">
                        <AlertDialogTitle>{titulo}</AlertDialogTitle>
                        <AlertDialogDescription>{descripcion}</AlertDialogDescription>
                    </AlertDialogHeader>
                </div>
                <AlertDialogFooter className="gap-2 sm:justify-center">
                    <AlertDialogCancel className="mt-0">Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className={cn("text-white", c.boton)}>
                        {textoConfirmar}
                    </AlertDialogAction>
                </AlertDialogFooter>
                <style>{`@keyframes wiggle { 0%,100% { transform: rotate(0deg) } 25% { transform: rotate(-14deg) } 75% { transform: rotate(14deg) } }`}</style>
            </AlertDialogContent>
        </AlertDialog>
    )
}
