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
}

const hoyISO = () => new Date().toISOString().slice(0, 10)

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

    const abrir = useCallback(async (crear: boolean) => {
        if (!caja || !fecha) {
            toast({ title: "Atención", description: "Elige la caja y la fecha.", variant: "warning" })
            return
        }
        setCargando(true)
        setError(null)
        try {
            const v = await CajaBancosService.obtenerVoucher(caja, fecha, usuario, crear)
            setCabecera(v.cabecera)
            const nuevas = v.detalle.map(desdeBD)
            setFilas(nuevas)
            setFilasOriginales(JSON.stringify(nuevas.map(aPayload)))
            if (!v.cabecera) {
                setError('No hay voucher para esa caja y fecha. Usa "Abrir o crear" para generarlo.')
            }
        } catch (e: any) {
            setCabecera(null)
            setFilas([])
            setError(e?.response?.data?.message || "No se pudo abrir el voucher.")
        } finally {
            setCargando(false)
        }
    }, [caja, fecha, usuario])

    const setCampo = (key: number, campo: keyof FilaEdicion, valor: string | boolean) => {
        setFilas(prev => prev.map(f => (f.key === key ? { ...f, [campo]: valor } : f)))
    }

    const setPersona = (key: number, codigo: string, nombre: string) => {
        setFilas(prev => prev.map(f =>
            f.key === key ? { ...f, persona: codigo, personaNombre: nombre } : f))
    }

    const agregarFila = () => {
        if (cerrado) return
        setFilas(prev => [...prev, {
            id: null, key: proximaKey,
            tipoDoc: '', serie: '', numeroDoc: '', persona: '', personaNombre: '',
            concepto: '', ingreso: '', egreso: '', tipoPago: TIPO_PAGO_DEFECTO,
            ctaContable: '', centroCostos: '', idGalpon: '', idConcepto: '',
            eliminar: false,
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
    }
}
