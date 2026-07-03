'use client'

import { useEffect, useMemo, useState } from "react"
import { toast } from "@/app/hooks/useToast"
import { useAuth } from "@/context/authContext"
import {
    fetchComboAnio, fetchComboGlosa, fetchComboMes, fetchComboTipoAsiento, guardarAsiento as guardarAsientoRequest,
} from "@/app/api/asientos"
import {
    AsientoCabecera,
    AsientoLinea,
    ComboAnioRow,
    ComboGlosaRow,
    ComboMesRow,
    ComboTipoAsientoRow,
} from "@/app/types/procesar-nota-credito-types"

const VOUCHER_INICIAL = 213
const TOLERANCIA_CUADRE = 0.005

function cabeceraInicial(): AsientoCabecera {
    const hoy = new Date().toISOString().slice(0, 10)
    return {
        fecha:        hoy,
        moneda:       'SOLES',
        mesRegistro:  String(Number(hoy.slice(5, 7))),
        anioRegistro: hoy.slice(0, 4),
        tipoAsiento:  'REGISTROS',
        destino:      false,
        glosa:        '',  // vacía a propósito: se busca/escribe, no se preselecciona
    }
}

interface Combos {
    glosas:        ComboGlosaRow[]
    tiposAsiento:  ComboTipoAsientoRow[]
    meses:         ComboMesRow[]
    anios:         ComboAnioRow[]
}

const COMBOS_VACIOS: Combos = { glosas: [], tiposAsiento: [], meses: [], anios: [] }

export function useProcesarNotaCredito() {
    const { user } = useAuth()
    const [cabecera, setCabecera]         = useState<AsientoCabecera>(cabeceraInicial())
    const [lineas, setLineas]             = useState<AsientoLinea[]>([])
    const [numeroVoucher, setNumeroVoucher] = useState(VOUCHER_INICIAL)
    const [editIndex, setEditIndex]       = useState<number | null>(null)
    const [procesando, setProcesando]     = useState(false)
    const [combos, setCombos]             = useState<Combos>(COMBOS_VACIOS)
    const [combosLoading, setCombosLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            fetchComboGlosa().then(res => res.data?.data?.data as ComboGlosaRow[] ?? []).catch(() => []),
            fetchComboTipoAsiento().then(res => res.data?.data?.data as ComboTipoAsientoRow[] ?? []).catch(() => []),
            fetchComboMes().then(res => res.data?.data?.data as ComboMesRow[] ?? []).catch(() => []),
            fetchComboAnio().then(res => res.data?.data?.data as ComboAnioRow[] ?? []).catch(() => []),
        ])
            .then(([glosasCrudas, tiposCrudos, mesesCrudos, aniosCrudos]) => {
                // El SP puede traer filas con la columna clave en NULL
                // (p.ej. encabezados de diario sin glosa) — se descartan aquí,
                // en el borde donde entran los datos, para que el resto del
                // formulario pueda asumir combos siempre limpios.
                const glosas       = glosasCrudas.filter((g): g is ComboGlosaRow => !!g?.Glosa)
                const tiposAsiento = tiposCrudos.filter((t): t is ComboTipoAsientoRow => !!t?.TipoRegistros)
                const meses        = mesesCrudos.filter((m): m is ComboMesRow => !!m?.Mes && m.Numero != null)
                const anios        = aniosCrudos.filter((a): a is ComboAnioRow => a?.Anio != null)

                setCombos({ glosas, tiposAsiento, meses, anios })

                // Al cargar, se posiciona cada combo en su primer registro disponible,
                // salvo la glosa: se deja vacía a propósito para buscar/escribir libremente.
                setCabecera(prev => ({
                    ...prev,
                    tipoAsiento:  tiposAsiento[0]?.TipoRegistros ?? prev.tipoAsiento,
                    mesRegistro:  meses[0] ? String(meses[0].Numero) : prev.mesRegistro,
                    anioRegistro: anios[0] ? String(anios[0].Anio)  : prev.anioRegistro,
                }))
            })
            .finally(() => setCombosLoading(false))
    }, [])

    const totalCargo = useMemo(
        () => lineas.reduce((s, l) => s + l.cargo, 0),
        [lineas]
    )
    const totalAbono = useMemo(
        () => lineas.reduce((s, l) => s + l.abono, 0),
        [lineas]
    )
    const diferencia = useMemo(() => totalCargo - totalAbono, [totalCargo, totalAbono])
    const cuadrado   = Math.abs(diferencia) < TOLERANCIA_CUADRE
    const puedeAceptar = cuadrado && lineas.length > 0

    function agregarLinea(linea: AsientoLinea) {
        setLineas(prev => [...prev, linea])
    }

    function editarLinea(index: number, linea: AsientoLinea) {
        setLineas(prev => prev.map((l, i) => (i === index ? linea : l)))
    }

    function eliminarLinea(index: number) {
        setLineas(prev => prev.filter((_, i) => i !== index))
    }

    async function reiniciarVoucher() {
        try {
            // TODO: reemplazar por endpoint real de correlativo cuando exista
            // (similar a generarCorrelativo de usePlanillaCobranza), p.ej.:
            // const { data } = await apiClient.get('/contabilidad/asientos/siguiente-voucher')
            const siguiente = numeroVoucher + 1
            setNumeroVoucher(siguiente)
            setLineas([])
            return true
        } catch (error: any) {
            const msg = error?.response?.data?.message || "No se pudo reiniciar el voucher"
            toast({ title: "Error", description: msg, variant: "destructive" })
            return false
        }
    }

    async function aplicarAsiento() {
        if (!puedeAceptar) return false
        setProcesando(true)
        try {
            await guardarAsientoRequest({
                fecha:         cabecera.fecha,
                numeroVoucher,
                moneda:        cabecera.moneda,
                mesRegistro:   cabecera.mesRegistro,
                anioRegistro:  cabecera.anioRegistro,
                glosa:         cabecera.glosa,
                destino:       cabecera.destino,
                tipoAsiento:   cabecera.tipoAsiento,
                usuario:       user?.idUsuarioWeb,
                lineas,
            })
            toast({ title: "Éxito", description: "Nota de crédito aplicada correctamente" })
            return true
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Error al procesar el asiento"
            toast({ title: "Error", description: msg, variant: "destructive" })
            return false
        } finally {
            setProcesando(false)
        }
    }

    return {
        cabecera, setCabecera,
        lineas,
        numeroVoucher,
        editIndex, setEditIndex,
        procesando,
        combos, combosLoading,

        totalCargo, totalAbono, diferencia, cuadrado, puedeAceptar,

        agregarLinea, editarLinea, eliminarLinea,
        reiniciarVoucher, aplicarAsiento,
    }
}
