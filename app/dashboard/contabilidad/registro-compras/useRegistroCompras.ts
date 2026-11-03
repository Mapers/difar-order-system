'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "@/app/hooks/useToast"
import { useAuth } from "@/context/authContext"
import { ComprasService } from "@/app/services/contabilidad/ContabilidadService"
import {
    CONDICION_CONTADO,
    ComprasCabecera,
    ComprasCabeceraPayload,
    ComprasCatalogos,
    ComprasDetalleFila,
    ComprasDetallePayload,
    ComprasTotales,
    LecturaFactura,
} from "@/app/types/contabilidad-types"

export interface CabeceraEdicion {
    codProv:               string
    proveedorNombre:       string
    tipoDoc:               string
    serie:                 string
    numero:                string
    fechaEmision:          string
    moneda:                string
    importeTotal:          string
    tasaIGV:               string
    condicion:             string
    almacen:               string
    periodo:               string
    anio:                  string
    exonerado:             string
    inafecto:              string
    icbper:                string
    tipoDocOriginal:       string
    fechaDocOriginal:      string
    serieDocOriginal:      string
    numeroDocOriginal:     string
    nroDepositoDetra:      string
    fechaDetra:            string
    fechaCancelacion:      string
    tipoPago:              string
    centroCostos:          string
    obsCancelacion:        string
    observaciones:         string
    entregadoPor:          string
    responsable:           string
    idClasificacionBienes: string
    fecIngreso:            string
    serieOC:               string
    nrOC:                  string
}

export interface FilaCompra {
    id:              number | null
    key:             number
    idArticulo:      string
    articulo:        string
    nombreItem:      string
    cantidad:        string
    lote:            string
    vctoArt:         string
    importeAfecto:   string
    importeNoAfecto: string
    cuentaContab:    string
    centroCostos:    string
    idGalpon:        string
    eliminar:        boolean
    /** Cómo venía en la factura leída, para ubicar el artículo si no se emparejó. */
    leidaComo?:      string
}

const CAB_VACIA: CabeceraEdicion = {
    codProv: '', proveedorNombre: '', tipoDoc: '', serie: '', numero: '',
    fechaEmision: new Date().toLocaleDateString('en-CA'), moneda: 'NSO',
    importeTotal: '', tasaIGV: '', condicion: '', almacen: '',
    periodo: String(new Date().getMonth() + 1).padStart(2, '0'),
    anio: String(new Date().getFullYear()),
    exonerado: '', inafecto: '', icbper: '',
    tipoDocOriginal: '', fechaDocOriginal: '', serieDocOriginal: '', numeroDocOriginal: '',
    nroDepositoDetra: '', fechaDetra: '',
    fechaCancelacion: '', tipoPago: '', centroCostos: '', obsCancelacion: '',
    observaciones: '', entregadoPor: '', responsable: '', idClasificacionBienes: '',
    fecIngreso: '', serieOC: '', nrOC: '',
}

const num = (v: string) => {
    const n = Number(v)
    return v.trim() !== '' && Number.isFinite(n) ? n : null
}
const num0 = (v: string) => Number(v) || 0
const x0 = (v: string) => (v.trim() === '' ? 'vacía' : v)
const txt = (v: string) => (v.trim() === '' ? null : v.trim())

const desdeBD = (d: ComprasDetalleFila): FilaCompra => ({
    id:              d.Id_Compras_Detalle,
    key:             d.Id_Compras_Detalle,
    idArticulo:      d.idArticulo != null ? String(d.idArticulo) : '',
    articulo:        d.Articulo ?? '',
    nombreItem:      d.NombreItem ?? '',
    cantidad:        d.Cantidad != null ? String(d.Cantidad) : '',
    lote:            d.Lote ?? '',
    vctoArt:         d.VctoArt ? String(d.VctoArt).slice(0, 10) : '',
    importeAfecto:   Number(d.ImporteAfecto) ? String(d.ImporteAfecto) : '',
    importeNoAfecto: Number(d.ImporteNoAfecto) ? String(d.ImporteNoAfecto) : '',
    cuentaContab:    d.CuentaContab != null ? String(d.CuentaContab) : '',
    centroCostos:    d.CentroCostos ?? '',
    idGalpon:        d.idGalpon != null ? String(d.idGalpon) : '',
    eliminar:        Number(d.EliminaRC) === 1,
})

const cabDesdeBD = (c: ComprasCabecera): CabeceraEdicion => ({
    codProv:               c.Cod_Prov ?? '',
    proveedorNombre:       c.ProveedorNombre ?? '',
    tipoDoc:               c.Tipo_Doc ?? '',
    serie:                 c.SerieDoc ?? '',
    numero:                c.NumeroDoc != null ? String(c.NumeroDoc) : '',
    fechaEmision:          c.Fecha_Emision ? String(c.Fecha_Emision).slice(0, 10) : '',
    moneda:                c.Moneda ?? 'NSO',
    importeTotal:          c.ImporteTotal != null ? String(c.ImporteTotal) : '',
    tasaIGV:               c.TasaIGV != null ? String(c.TasaIGV) : '',
    condicion:             c.Condision ?? '',
    almacen:               c.Almacen != null ? String(c.Almacen) : '',
    periodo:               c.PeriodoTributario ?? '',
    anio:                  c.Anio ?? '',
    exonerado:             c.Exonerado != null ? String(c.Exonerado) : '',
    inafecto:              c.Inafecto != null ? String(c.Inafecto) : '',
    icbper:                c.icbper != null ? String(c.icbper) : '',
    tipoDocOriginal:       c.TipoDocOriginal ?? '',
    fechaDocOriginal:      c.FechaDocOriginal ? String(c.FechaDocOriginal).slice(0, 10) : '',
    serieDocOriginal:      c.SerieDocOriginal ?? '',
    numeroDocOriginal:     c.NumeroDocOriginal != null ? String(c.NumeroDocOriginal) : '',
    nroDepositoDetra:      c.NroDpstoDetra ?? '',
    fechaDetra:            c.FechaDetra ? String(c.FechaDetra).slice(0, 10) : '',
    fechaCancelacion:      c.FechaCancelacion ? String(c.FechaCancelacion).slice(0, 10) : '',
    tipoPago:              c.TipoPago ?? '',
    centroCostos:          c.CentroCostos != null ? String(c.CentroCostos) : '',
    obsCancelacion:        c.ObsCancelacion ?? '',
    observaciones:         c.Observaciones ?? '',
    entregadoPor:          c.EntregadoPor ?? '',
    responsable:           c.Responsable ?? '',
    idClasificacionBienes: c.idClasificacionBienes != null ? String(c.idClasificacionBienes) : '',
    fecIngreso:            c.fecIngreso ? String(c.fecIngreso).slice(0, 10) : '',
    serieOC:               c.serieOC ?? '',
    nrOC:                  c.nrOC ?? '',
})

const aCabPayload = (c: CabeceraEdicion): ComprasCabeceraPayload => ({
    codProv:               c.codProv,
    tipoDoc:               c.tipoDoc,
    serie:                 c.serie,
    numero:                num(c.numero),
    fechaEmision:          c.fechaEmision,
    moneda:                c.moneda,
    importeTotal:          num0(c.importeTotal),
    tasaIGV:               num0(c.tasaIGV),
    condicion:             c.condicion,
    almacen:               num(c.almacen),
    periodo:               c.periodo,
    anio:                  c.anio,
    exonerado:             num0(c.exonerado),
    inafecto:              num0(c.inafecto),
    icbper:                num0(c.icbper),
    tipoDocOriginal:       txt(c.tipoDocOriginal),
    fechaDocOriginal:      txt(c.fechaDocOriginal),
    serieDocOriginal:      txt(c.serieDocOriginal),
    numeroDocOriginal:     num(c.numeroDocOriginal),
    nroDepositoDetra:      txt(c.nroDepositoDetra),
    fechaDetra:            txt(c.fechaDetra),
    fechaCancelacion:      txt(c.fechaCancelacion),
    tipoPago:              txt(c.tipoPago),
    centroCostos:          num(c.centroCostos),
    obsCancelacion:        txt(c.obsCancelacion),
    observaciones:         txt(c.observaciones),
    entregadoPor:          txt(c.entregadoPor),
    responsable:           txt(c.responsable),
    idClasificacionBienes: num(c.idClasificacionBienes),
    fecIngreso:            txt(c.fecIngreso),
    serieOC:               txt(c.serieOC),
    nrOC:                  txt(c.nrOC),
    revisadoSIRE:          false,
})

const aFilaPayload = (f: FilaCompra): ComprasDetallePayload => ({
    id:              f.id,
    idArticulo:      num(f.idArticulo),
    articulo:        txt(f.articulo),
    cantidad:        num0(f.cantidad),
    lote:            txt(f.lote),
    vctoArt:         txt(f.vctoArt),
    importeAfecto:   num0(f.importeAfecto),
    importeNoAfecto: num0(f.importeNoAfecto),
    cuentaContab:    num(f.cuentaContab),
    centroCostos:    txt(f.centroCostos),
    idGalpon:        num(f.idGalpon),
    eliminar:        f.eliminar,
})

// Orden en que se van llenando los campos visibles al leer una factura.
const ORDEN_PINTADO: (keyof CabeceraEdicion)[] = [
    'codProv', 'tipoDoc', 'fechaEmision', 'serie', 'numero', 'moneda', 'tasaIGV',
    'importeTotal', 'exonerado', 'condicion', 'almacen', 'periodo', 'anio',
]

const OBLIGATORIOS: [keyof CabeceraEdicion, string][] = [
    ['codProv', 'Proveedor'], ['fechaEmision', 'Fecha de emisión'],
    ['tipoDoc', 'Tipo de documento'], ['serie', 'Serie'], ['numero', 'Número'],
    ['moneda', 'Moneda'], ['condicion', 'Condición'], ['tasaIGV', 'Tasa IGV'],
    ['almacen', 'Almacén'], ['periodo', 'Período'], ['anio', 'Año'],
]

const OBLIGATORIOS_CONTADO: [keyof CabeceraEdicion, string][] = [
    ['fechaCancelacion', 'Fecha de cancelación'], ['tipoPago', 'Tipo de pago'],
    ['centroCostos', 'Centro de costos'], ['obsCancelacion', 'Observación de cancelación'],
]

export function useRegistroCompras() {
    const { user } = useAuth()
    const usuario = (user as any)?.idUsuarioWeb ?? null

    const [catalogos, setCatalogos] = useState<ComprasCatalogos | null>(null)
    const [cargandoCatalogos, setCargandoCatalogos] = useState(true)

    const [clave, setClave] = useState<number | null>(null)
    const [cab, setCab] = useState<CabeceraEdicion>(CAB_VACIA)
    const [filas, setFilas] = useState<FilaCompra[]>([])
    const [totales, setTotales] = useState<ComprasTotales | null>(null)
    const [cerrado, setCerrado] = useState(false)
    const [vecesRegistrado, setVecesRegistrado] = useState(0)

    const [cargando, setCargando] = useState(false)
    const [guardando, setGuardando] = useState(false)
    const [proximaKey, setProximaKey] = useState(-1)

    useEffect(() => {
        const cargar = async () => {
            try {
                const c = await ComprasService.catalogos()
                setCatalogos(c)
            } catch {
                toast({
                    title: "Error",
                    description: "No se pudieron cargar los catálogos de compras.",
                    variant: "destructive",
                })
            } finally {
                setCargandoCatalogos(false)
            }
        }
        cargar()
    }, [])

    const nuevo = useCallback(async () => {
        nroLectura.current++
        setLectura(null)
        setClave(null)
        setFilas([])
        setTotales(null)
        setCerrado(false)
        setVecesRegistrado(0)

        try {
            const v = await ComprasService.valoresIniciales(CAB_VACIA.anio, CAB_VACIA.periodo)
            setCab({
                ...CAB_VACIA,
                tasaIGV:   v?.TasaIGV   != null ? String(v.TasaIGV)   : '',
                condicion: v?.Condision ?? '',
                moneda:    v?.Moneda    ?? 'NSO',
                almacen:   v?.Almacen   != null ? String(v.Almacen)   : '',
                periodo:   v?.PeriodoTributario ?? CAB_VACIA.periodo,
                anio:      v?.Anio ?? CAB_VACIA.anio,
            })
        } catch {
            setCab(CAB_VACIA)
        }
    }, [])

    const abrir = useCallback(async (claveDoc: number) => {
        nroLectura.current++
        setLectura(null)
        setCargando(true)
        try {
            const d = await ComprasService.obtenerDocumento(claveDoc)
            if (!d.cabecera) {
                toast({ title: "No encontrado", description: "Ese documento no existe.", variant: "warning" })
                return
            }
            setClave(d.cabecera.Clave)
            setCab(cabDesdeBD(d.cabecera))
            setFilas(d.detalle.map(desdeBD))
            setTotales(d.totales)
            setCerrado(Number(d.cabecera.Cerrado) === 1)
            setVecesRegistrado(Number(d.cabecera.VecesRegistrado ?? 0))
        } catch (e: any) {
            toast({
                title: "Error",
                description: e?.response?.data?.message || "No se pudo abrir el documento.",
                variant: "destructive",
            })
        } finally {
            setCargando(false)
        }
    }, [])

    // ─── Lectura de la factura ───────────────────────────────────────────────
    // Los campos se van llenando uno por uno para que se vea qué se leyó.
    const [pintando, setPintando] = useState<string | null>(null)
    const [pintados, setPintados] = useState<Set<string>>(new Set())
    const [lineasLeidas, setLineasLeidas] = useState<Set<number>>(new Set())
    const [lectura, setLectura] = useState<Pick<LecturaFactura, 'avisos' | 'yaRegistrado' | 'productosNuevos'> | null>(null)
    const nroLectura = useRef(0)

    const aplicarLectura = useCallback(async (d: LecturaFactura) => {
        const mia = ++nroLectura.current
        const pausa = (ms: number) => new Promise(r => setTimeout(r, ms))
        const sigue = () => mia === nroLectura.current

        setClave(null)
        setTotales(null)
        setCerrado(false)
        setVecesRegistrado(0)
        setFilas([])
        setPintados(new Set())
        setLineasLeidas(new Set())
        setLectura({ avisos: d.avisos, yaRegistrado: d.yaRegistrado, productosNuevos: d.productosNuevos ?? [] })

        const leida: Partial<CabeceraEdicion> = { ...d.cabecera }
        // A crédito: la condición que tenga exactamente esos días, si existe.
        const conDias = d.diasCredito != null
            ? catalogos?.condiciones.find(x => Number(x.DiasCdto) === d.diasCredito)
            : null
        if (conDias) leida.condicion = conDias.CodigoCondicion

        const inicial = { ...CAB_VACIA }
        for (const [k, v] of Object.entries(leida) as [keyof CabeceraEdicion, string][]) {
            if (!ORDEN_PINTADO.includes(k) && v) inicial[k] = v
        }
        setCab(inicial)

        for (const k of ORDEN_PINTADO) {
            const v = leida[k]
            if (!v) continue
            await pausa(170)
            if (!sigue()) return
            setCab(prev => ({ ...prev, [k]: v, ...(k === 'codProv' ? { proveedorNombre: leida.proveedorNombre ?? '' } : {}) }))
            setPintando(k)
            setPintados(prev => new Set(prev).add(k))
        }

        let key = proximaKey
        for (const l of d.lineas) {
            await pausa(140)
            if (!sigue()) return
            const fila: FilaCompra = {
                id: null, key, idGalpon: '', eliminar: false,
                idArticulo: l.idArticulo, articulo: l.articulo, nombreItem: l.nombreItem,
                cantidad: l.cantidad, lote: l.lote, vctoArt: l.vctoArt,
                importeAfecto: l.importeAfecto, importeNoAfecto: l.importeNoAfecto,
                cuentaContab: l.cuentaContab, centroCostos: l.centroCostos || '001',
                leidaComo: l.descripcionFactura,
            }
            setFilas(prev => [...prev, fila])
            setLineasLeidas(prev => new Set(prev).add(fila.key))
            setPintando(`linea:${fila.key}`)
            key -= 1
        }
        setProximaKey(key)
        setPintando(null)

        await pausa(2500)
        if (sigue()) setPintados(new Set())
    }, [catalogos, proximaKey])

    const descartarLectura = () => setLectura(null)

    const setCampoCab = (campo: keyof CabeceraEdicion, valor: string) =>
        setCab(prev => ({ ...prev, [campo]: valor }))

    const setProveedor = (codigo: string, nombre: string) =>
        setCab(prev => ({ ...prev, codProv: codigo, proveedorNombre: nombre }))

    const setCampoFila = (key: number, campo: keyof FilaCompra, valor: string | boolean) =>
        setFilas(prev => prev.map(f => (f.key === key ? { ...f, [campo]: valor } : f)))

    const setArticulo = (key: number, idArticulo: string, codigo: string, nombre: string) =>
        setFilas(prev => prev.map(f =>
            f.key === key ? { ...f, idArticulo, articulo: codigo, nombreItem: nombre } : f))

    const agregarFila = () => {
        if (cerrado) return
        setFilas(prev => [...prev, {
            id: null, key: proximaKey,
            idArticulo: '', articulo: '', nombreItem: '', cantidad: '', lote: '', vctoArt: '',
            importeAfecto: '', importeNoAfecto: '', cuentaContab: '',
            // Default del esquema para el centro de costos del detalle.
            centroCostos: '001', idGalpon: '', eliminar: false,
        }])
        setProximaKey(k => k - 1)
    }

    const quitarFilaNueva = (key: number) => setFilas(prev => prev.filter(f => f.key !== key))

    const totalesEnVivo = useMemo(() => {
        const vivas = filas.filter(f => !f.eliminar)
        const tIncIGV = vivas.reduce((s, f) => s + num0(f.importeAfecto), 0)
        const tSinIGV = vivas.reduce((s, f) => s + num0(f.importeNoAfecto), 0)
        const total = num0(cab.importeTotal)
        const exonerado = num0(cab.exonerado)
        const tasa = num0(cab.tasaIGV)
        const diferencia = total - (tSinIGV + tIncIGV)
        const difNoAfectos = tSinIGV - exonerado
        return {
            tIncIGV, tSinIGV, diferencia, difNoAfectos,
            descuadrado: Math.abs(Math.round((difNoAfectos + diferencia) * 100) / 100) > 0,
            calculoIGV: tasa > 0 ? Math.round(((total - exonerado) / (1 + tasa)) * tasa * 100) / 100 : 0,
            lineas: vivas.length,
        }
    }, [filas, cab.importeTotal, cab.exonerado, cab.tasaIGV])

    const esContado = cab.condicion === CONDICION_CONTADO

    const faltante = (): string | null => {
        for (const [campo, etiqueta] of OBLIGATORIOS) {
            if (!String(cab[campo] ?? '').trim()) return etiqueta
        }
        if (esContado) {
            for (const [campo, etiqueta] of OBLIGATORIOS_CONTADO) {
                if (!String(cab[campo] ?? '').trim()) return etiqueta
            }
        }
        return null
    }

    const guardar = async () => {
        if (cerrado) {
            toast({
                title: "Cierre contable",
                description: "Este documento está dentro del cierre contable y no se puede modificar.",
                variant: "warning",
            })
            return
        }

        const falta = faltante()
        if (falta) {
            toast({
                title: "Datos incompletos",
                description: `Falta ${falta}.`,
                variant: "warning",
            })
            return
        }

        const aviso = (title: string, description: string) => toast({ title, description, variant: "warning" })

        // 1. El detalle tiene que cuadrar con el total del documento.
        if (totalesEnVivo.descuadrado) {
            aviso("No cuadra", `El detalle no cuadra con el total del documento (diferencia ${totalesEnVivo.diferencia.toFixed(2)}). Corrígelo antes de guardar.`)
            return
        }

        const vivas = filas.map((f, i) => ({ f, n: i + 1 })).filter(x => !x.f.eliminar)
        const nombre = (x: { f: FilaCompra; n: number }) => `Línea ${x.n}${x.f.nombreItem ? ` (${x.f.nombreItem.trim()})` : ''}`

        if (vivas.length === 0) {
            aviso("Sin detalle", "Agrega al menos una línea al detalle.")
            return
        }

        const nuevos = filas.filter(f => !f.eliminar && f.leidaComo && !f.idArticulo)
        if (nuevos.length > 0) {
            toast({
                title: "Hay productos nuevos",
                description: `${nuevos.map(f => f.leidaComo).join(' · ')} no existe(n) en el catálogo. Créalos o elige el artículo antes de guardar.`,
                variant: "warning",
            })
            return
        }

        // 2. Toda línea lleva artículo (los servicios usan su artículo de servicio).
        const sinArticulo = vivas.find(x => !x.f.idArticulo)
        if (sinArticulo) {
            aviso("Falta el artículo", `${nombre(sinArticulo)} no tiene artículo. Elígelo o quita la línea.`)
            return
        }

        // 4. Cantidad mayor a cero.
        const sinCantidad = vivas.find(x => !(Number(x.f.cantidad) > 0))
        if (sinCantidad) {
            aviso("Cantidad inválida", `${nombre(sinCantidad)} tiene cantidad ${x0(sinCantidad.f.cantidad)}. Debe ser mayor a 0.`)
            return
        }

        // 3. Un lote entra al kardex con su vencimiento.
        const sinVence = vivas.find(x => x.f.lote.trim() && !x.f.vctoArt)
        if (sinVence) {
            aviso("Falta el vencimiento", `${nombre(sinVence)} tiene el lote ${sinVence.f.lote} sin fecha de vencimiento.`)
            return
        }

        // 5. Que no se registre dos veces la misma factura.
        if (!clave) {
            try {
                const r = await ComprasService.buscarDocumentosPagina(cab.codProv, 1, 100)
                const numero = Number(cab.numero)
                const repetido = r.data.find(d =>
                    String(d.Cod_Prov) === cab.codProv && d.Tipo_Doc === cab.tipoDoc &&
                    String(d.SerieDoc ?? '').trim().toUpperCase() === cab.serie.trim().toUpperCase() &&
                    Number(d.NumeroDoc) === numero)
                if (repetido) {
                    aviso("Ya está registrada", `${cab.serie}-${cab.numero} de este proveedor ya existe (clave ${repetido.Clave}${repetido.NroRegistro != null ? `, registro Nº ${repetido.NroRegistro}` : ''}). Ábrela con Buscar en lugar de registrarla otra vez.`)
                    return
                }
            } catch {
                // Si no se pudo verificar, se deja guardar: el resto ya está validado.
            }
        }

        const sinCuenta = filas.find(f =>
            !f.eliminar && (num0(f.importeAfecto) || num0(f.importeNoAfecto)) && !f.cuentaContab)
        if (sinCuenta) {
            toast({
                title: "Falta la cuenta contable",
                description: "Hay una línea con importe y sin cuenta contable.",
                variant: "warning",
            })
            return
        }

        setGuardando(true)
        try {
            const res: any = await ComprasService.guardar(
                clave, aCabPayload(cab), filas.map(aFilaPayload), usuario,
            )
            const nuevaClave = Number(res?.Clave ?? res?.clave ?? clave)
            toast({
                title: "Guardado",
                description: "El documento se guardó y se regeneró el asiento, el kardex y los lotes.",
            })
            if (nuevaClave > 0) await abrir(nuevaClave)
        } catch (e: any) {
            toast({
                title: "Error al guardar",
                description: e?.response?.data?.message || "No se pudo guardar el documento.",
                variant: "destructive",
            })
        } finally {
            setGuardando(false)
        }
    }

    const eliminarMarcadas = async () => {
        if (!clave || cerrado) return
        setGuardando(true)
        try {
            await ComprasService.guardar(clave, aCabPayload(cab), filas.map(aFilaPayload), usuario)
            const res: any = await ComprasService.eliminarLineasMarcadas(clave, usuario)
            const eliminadas = Number(res?.Eliminadas ?? 0)

            toast(eliminadas > 0
                ? { title: "Líneas eliminadas", description: `Se quitaron ${eliminadas} línea${eliminadas !== 1 ? 's' : ''}.` }
                : { title: "No se eliminó nada", description: "Marca la casilla E de las líneas que quieras eliminar.", variant: "warning" })

            await abrir(clave)
        } catch (e: any) {
            toast({
                title: "Error",
                description: e?.response?.data?.message || "No se pudieron eliminar las líneas.",
                variant: "destructive",
            })
        } finally {
            setGuardando(false)
        }
    }

    const eliminarDocumento = async () => {
        if (!clave) return
        try {
            await ComprasService.eliminarDocumento(clave)
            toast({ title: "Documento eliminado", description: "Se eliminó junto con su asiento y kardex." })
            await nuevo()
        } catch (e: any) {
            toast({
                title: "Error",
                description: e?.response?.data?.message || "No se pudo eliminar el documento.",
                variant: "destructive",
            })
        }
    }

    return {
        catalogos, cargandoCatalogos,
        clave, cab, filas, totales, totalesEnVivo, cerrado, vecesRegistrado,
        cargando, guardando, esContado,
        pintando, pintados, lineasLeidas, lectura, aplicarLectura, descartarLectura,
        nuevo, abrir, setCampoCab, setProveedor, setCampoFila, setArticulo,
        agregarFila, quitarFilaNueva, guardar, eliminarMarcadas, eliminarDocumento,
    }
}
