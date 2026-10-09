'use client'

import { useCallback, useEffect, useMemo, useState } from "react"
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
}

const CAB_VACIA: CabeceraEdicion = {
    codProv: '', proveedorNombre: '', tipoDoc: '', serie: '', numero: '',
    fechaEmision: new Date().toISOString().slice(0, 10), moneda: 'NSO',
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
        nuevo, abrir, setCampoCab, setProveedor, setCampoFila, setArticulo,
        agregarFila, quitarFilaNueva, guardar, eliminarMarcadas, eliminarDocumento,
    }
}
