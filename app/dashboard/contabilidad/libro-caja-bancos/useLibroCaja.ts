'use client'

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "@/app/hooks/useToast"
import { useAuth } from "@/context/authContext"
import { CajaBancosService } from "@/app/services/contabilidad/ContabilidadService"
import {
    CajaCatalogos,
    CajaDetalleFila,
    CajaDetallePayload,
    CajaVoucherCabecera,
    TIPO_PAGO_DEFECTO,
} from "@/app/types/contabilidad-types"
import { BorradorContableService, PendienteCaja } from "@/app/services/contabilidad/BorradorContableService"
import { aplicarBorrador, calcularCambios, resumir, LineaBorrador } from "@/lib/borradorContable"
import { useBorradorServidor } from "@/components/contabilidad/borrador/useBorradorServidor"

export interface FilaEdicion {
    id:            number | null
    key:           number
    tipoDoc:       string
    serie:         string
    numeroDoc:     string
    persona:       string
    personaNombre: string
    concepto:      string
    ingreso:       string
    egreso:        string
    tipoPago:      string
    ctaContable:   string
    centroCostos:  string
    idGalpon:      string
    idConcepto:    string
    eliminar:      boolean
    planilla:      string
}

const hoyISO = () => new Date().toLocaleDateString('en-CA')

const desdeBD = (d: CajaDetalleFila): FilaEdicion => ({
    id:            d.Id_Detalle_Caja,
    key:           d.Id_Detalle_Caja,
    tipoDoc:       d.TipoDoc ?? '',
    serie:         d.Serie ?? '',
    numeroDoc:     d.Numero_Doc != null ? String(d.Numero_Doc) : '',
    persona:       d.Persona ?? '',
    personaNombre: d.PersonaNombre ?? '',
    concepto:      d.Concepto ?? '',
    ingreso:       Number(d.Ingreso) ? String(d.Ingreso) : '',
    egreso:        Number(d.Egreso) ? String(d.Egreso) : '',
    tipoPago:      d.TipoPago ?? TIPO_PAGO_DEFECTO,
    ctaContable:   d.Cta_Contable != null ? String(d.Cta_Contable) : '',
    centroCostos:  d.Centro_Costos ?? '',
    idGalpon:      d.idGalpon != null ? String(d.idGalpon) : '',
    idConcepto:    d.idcajaconceptos != null ? String(d.idcajaconceptos) : '',
    eliminar:      Number(d.EliminaCja) === 1,
    planilla:      d.Planilla ?? '',
})

const numeroONull = (v: string) => {
    const n = Number(v)
    return v.trim() !== '' && Number.isFinite(n) ? n : null
}

const aPayload = (f: FilaEdicion): CajaDetallePayload => ({
    id:           f.id,
    tipoDoc:      f.tipoDoc || null,
    serie:        f.serie || null,
    numeroDoc:    numeroONull(f.numeroDoc),
    persona:      f.persona || null,
    concepto:     f.concepto || null,
    ingreso:      Number(f.ingreso) || 0,
    egreso:       Number(f.egreso) || 0,
    tipoPago:     f.tipoPago || null,
    ctaContable:  numeroONull(f.ctaContable),
    centroCostos: f.centroCostos || null,
    idGalpon:     numeroONull(f.idGalpon),
    idConcepto:   numeroONull(f.idConcepto),
    eliminar:     f.eliminar,
})

export function useLibroCaja() {
    const { user } = useAuth()
    const usuario = (user as any)?.idUsuarioWeb ?? null

    const [catalogos, setCatalogos] = useState<CajaCatalogos | null>(null)
    const [cargandoCatalogos, setCargandoCatalogos] = useState(true)

    const [caja, setCaja]   = useState<number | null>(null)
    const [fecha, setFecha] = useState<string>(hoyISO())

    const [cabecera, setCabecera] = useState<CajaVoucherCabecera | null>(null)
    const [filas, setFilas]       = useState<FilaEdicion[]>([])
    const [filasOriginales, setFilasOriginales] = useState<string>('[]')

    const [cargando, setCargando] = useState(false)
    const [guardando, setGuardando] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [proximaKey, setProximaKey] = useState(-1)

    // ─── Borrador en el servidor (tmp_caja_centralizacion) ───
    // baseFilas = cómo estaba el voucher en la base al abrirlo; los cambios se calculan contra eso.
    const [baseFilas, setBaseFilas] = useState<FilaEdicion[]>([])
    const [borradorRevisado, setBorradorRevisado] = useState(false)
    const [borradorPendiente, setBorradorPendiente] = useState<{ lineas: LineaBorrador<FilaEdicion>[]; actualizado: string | null } | null>(null)
    const [conflictosBorrador, setConflictosBorrador] = useState<string[]>([])
    const [pendientes, setPendientes] = useState<PendienteCaja[]>([])
    const cargarPendientes = useCallback(() => {
        BorradorContableService.cajaPendientes().then(setPendientes).catch(() => setPendientes([]))
    }, [])
    useEffect(() => { cargarPendientes() }, [cargarPendientes])

    useEffect(() => {
        const cargar = async () => {
            try {
                const c = await CajaBancosService.catalogos()
                setCatalogos(c)
                if (c.cajas.length > 0) setCaja(c.cajas[0].IdCaja)
            } catch {
                toast({
                    title: "Error",
                    description: "No se pudieron cargar los catálogos de caja.",
                    variant: "destructive",
                })
            } finally {
                setCargandoCatalogos(false)
            }
        }
        cargar()
    }, [])

    const hayCambios = useMemo(
        () => JSON.stringify(filas.map(aPayload)) !== filasOriginales,
        [filas, filasOriginales],
    )

    const cerrado = Number(cabecera?.Cerrado ?? 0) === 1

    const cambiosBorrador = useMemo(() => calcularCambios(baseFilas, filas, aPayload), [baseFilas, filas])
    const rutaBorrador = cabecera ? BorradorContableService.ruta("caja", cabecera.Item) : null
    const borrador = useBorradorServidor({
        ruta: rutaBorrador,
        cuerpo: cambiosBorrador.length ? { lineas: cambiosBorrador } : null,
        habilitado: !!cabecera && !cerrado && !cargando && !guardando && borradorRevisado && !borradorPendiente,
    })

    const abrir = useCallback(async (crear: boolean, otraCaja?: number, otraFecha?: string) => {
        const caja_ = otraCaja ?? caja, fecha_ = otraFecha ?? fecha
        if (!caja_ || !fecha_) {
            toast({ title: "Atención", description: "Elige la caja y la fecha.", variant: "warning" })
            return
        }
        setCargando(true)
        setError(null)
        setBorradorRevisado(false)
        setBorradorPendiente(null)
        setConflictosBorrador([])
        try {
            const v = await CajaBancosService.obtenerVoucher(caja_, fecha_, usuario, crear)
            setCabecera(v.cabecera)
            const nuevas = v.detalle.map(desdeBD)
            setFilas(nuevas)
            setBaseFilas(nuevas)
            setFilasOriginales(JSON.stringify(nuevas.map(aPayload)))
            // ¿Quedaron cambios sin grabar de este voucher? Se ofrece recuperarlos (no se aplican solos).
            if (v.cabecera) {
                const ruta = BorradorContableService.ruta("caja", v.cabecera.Item)
                try {
                    const b = await BorradorContableService.cajaObtener<FilaEdicion>(v.cabecera.Item)
                    const hay = (b?.lineas ?? []).length > 0
                    borrador.conocerServidor(ruta, hay)
                    if (hay) setBorradorPendiente(b)
                } catch {
                    borrador.conocerServidor(ruta, false)
                }
            }
            if (!v.cabecera) {
                setError('No hay voucher para esa caja y fecha. Usa "Nuevo voucher" para generarlo.')
            }
        } catch (e: any) {
            setCabecera(null)
            setFilas([])
            setError(e?.response?.data?.message || "No se pudo abrir el voucher.")
        } finally {
            setCargando(false)
            setBorradorRevisado(true)
        }
    }, [caja, fecha, usuario, borrador.conocerServidor])

    const recuperarBorrador = () => {
        if (!borradorPendiente) return
        const r = aplicarBorrador(baseFilas, borradorPendiente.lineas, aPayload, proximaKey)
        setFilas(r.filas)
        setProximaKey(r.proximaKey)
        setConflictosBorrador(r.conflictos.map(x =>
            `${x.linea.datos?.concepto || "Línea sin detalle"} (${x.linea.accion}): ${x.tipo === "ya-no-existe" ? "la línea ya no existe" : "otra persona la modificó"}`))
        setBorradorPendiente(null)
        const a = r.aplicado
        toast({
            title: "Cambios recuperados",
            description: `Se recuperaron ${a.nuevas} nueva(s), ${a.editadas} editada(s) y ${a.eliminadas} para eliminar.`
                + (r.yaGrabadas ? ` ${r.yaGrabadas} ya estaban grabadas y no se repitieron.` : "")
                + " Revisa y pulsa Guardar.",
        })
    }

    const descartarBorrador = async () => {
        setBorradorPendiente(null)
        await borrador.borrar(rutaBorrador)
        cargarPendientes()
    }

    const abrirPendiente = (p: PendienteCaja) => {
        setCaja(p.Caja)
        setFecha(p.Fecha)
        abrir(false, p.Caja, p.Fecha)
    }

    const setCampo = (key: number, campo: keyof FilaEdicion, valor: string | boolean) => {
        setFilas(prev => prev.map(f => (f.key === key ? { ...f, [campo]: valor } : f)))
    }

    const setPersona = (key: number, codigo: string, nombre: string) => {
        setFilas(prev => prev.map(f =>
            f.key === key ? { ...f, persona: codigo, personaNombre: nombre } : f))
    }

    const agregarFila = () => {
        if (cerrado) return
        // Como en Access: la línea nueva toma el Tipo doc y la Serie de la línea anterior.
        setFilas(prev => [...prev, {
            id: null, key: proximaKey,
            tipoDoc: prev[prev.length - 1]?.tipoDoc ?? '', serie: prev[prev.length - 1]?.serie ?? '', numeroDoc: '', persona: '', personaNombre: '',
            concepto: '', ingreso: '', egreso: '', tipoPago: TIPO_PAGO_DEFECTO,
            ctaContable: '', centroCostos: '', idGalpon: '', idConcepto: '',
            eliminar: false, planilla: '',
        }])
        setProximaKey(k => k - 1)
    }

    const quitarFilaNueva = (key: number) => {
        setFilas(prev => prev.filter(f => f.key !== key))
    }

    const totales = useMemo(() => {
        const vivas = filas.filter(f => !f.eliminar)
        return {
            ingresos: vivas.reduce((s, f) => s + (Number(f.ingreso) || 0), 0),
            egresos:  vivas.reduce((s, f) => s + (Number(f.egreso) || 0), 0),
            lineas:   vivas.length,
        }
    }, [filas])

    const guardar = async () => {
        if (!cabecera) return
        if (cerrado) {
            toast({
                title: "Cierre contable",
                description: "Este voucher está dentro del cierre contable y no se puede modificar.",
                variant: "warning",
            })
            return
        }

        const sinCuenta = filas.find(f =>
            !f.eliminar && (Number(f.ingreso) || Number(f.egreso)) && !f.ctaContable)
        if (sinCuenta) {
            toast({
                title: "Falta la cuenta contable",
                description: "Hay una línea con importe y sin cuenta contable.",
                variant: "warning",
            })
            return
        }

        const ambosImportes = filas.find(f =>
            !f.eliminar && Number(f.ingreso) > 0 && Number(f.egreso) > 0)
        if (ambosImportes) {
            toast({
                title: "Ingreso y Egreso en la misma línea",
                description: "Cada línea es un ingreso o un egreso, no las dos cosas. Separalas en dos líneas.",
                variant: "warning",
            })
            return
        }

        setGuardando(true)
        try {
            await CajaBancosService.guardar(cabecera.Item, usuario, filas.map(aPayload))
            toast({ title: "Guardado", description: "El voucher se guardó y el asiento se regeneró." })
            await borrador.borrar(rutaBorrador) // ya está en la base: el borrador sobra
            cargarPendientes()
            await abrir(false)
        } catch (e: any) {
            toast({
                title: "Error al guardar",
                description: e?.response?.data?.message || "No se pudo guardar el voucher.",
                variant: "destructive",
            })
        } finally {
            setGuardando(false)
        }
    }

    const eliminarMarcadas = async () => {
        if (!cabecera) return
        if (cerrado) {
            toast({
                title: "Cierre contable",
                description: "Este voucher está dentro del cierre contable y no se puede modificar.",
                variant: "warning",
            })
            return
        }

        setGuardando(true)
        try {
            await CajaBancosService.guardar(cabecera.Item, usuario, filas.map(aPayload))

            const res: any = await CajaBancosService.eliminarLineasMarcadas(cabecera.Item, usuario)
            const eliminadas = Number(res?.Eliminadas ?? 0)
            await borrador.borrar(rutaBorrador)
            cargarPendientes()

            if (eliminadas > 0) {
                toast({
                    title: "Líneas eliminadas",
                    description: `Se quitaron ${eliminadas} línea${eliminadas !== 1 ? 's' : ''} y se regeneró el asiento.`,
                })
            } else {
                toast({
                    title: "No se eliminó nada",
                    description: "Marca la casilla E de las líneas que quieras eliminar.",
                    variant: "warning",
                })
            }
            await abrir(false)
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

    const eliminarVoucher = async () => {
        if (!cabecera) return
        try {
            await CajaBancosService.eliminarVoucher(cabecera.Item)
            await borrador.borrar(rutaBorrador)
            cargarPendientes()
            toast({ title: "Voucher eliminado", description: `Se eliminó el voucher ${cabecera.Numero}.` })
            setCabecera(null)
            setFilas([])
            setFilasOriginales('[]')
        } catch (e: any) {
            toast({
                title: "Error",
                description: e?.response?.data?.message || "No se pudo eliminar el voucher.",
                variant: "destructive",
            })
        }
    }

    return {
        catalogos, cargandoCatalogos,
        caja, setCaja, fecha, setFecha,
        cabecera, filas, cerrado, hayCambios,
        cargando, guardando, error,
        abrir, setCampo, setPersona, agregarFila, quitarFilaNueva,
        totales, guardar, eliminarMarcadas, eliminarVoucher,
        usuario,
        // borrador en el servidor
        borradorEstado: borrador.estado, borradorGuardadoEn: borrador.guardadoEn,
        borradorPendiente, borradorResumen: borradorPendiente ? resumir(borradorPendiente.lineas) : null,
        recuperarBorrador, descartarBorrador,
        conflictosBorrador, cerrarConflictos: () => setConflictosBorrador([]),
        pendientes: pendientes.filter(p => p.Item !== cabecera?.Item), abrirPendiente,
    }
}
