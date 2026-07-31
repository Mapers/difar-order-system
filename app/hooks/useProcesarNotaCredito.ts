'use client'

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "@/app/hooks/useToast"
import {
    fetchComboAnio, fetchComboCentroCostos, fetchComboGlosa, fetchComboMes,
    fetchComboTipoAsiento, fetchSiguienteVoucher,
    guardarAsiento as guardarAsientoRequest,
} from "@/app/api/asientos"
import {
    AsientoCabecera,
    AsientoLinea,
    ComboAnioRow,
    ComboCentroCostosRow,
    ComboGlosaRow,
    ComboMesRow,
    ComboTipoAsientoRow,
} from "@/app/types/procesar-nota-credito-types"

const TOLERANCIA_CUADRE = 0.005

function cabeceraInicial(): AsientoCabecera {
    const hoy = new Date().toISOString().slice(0, 10)
    return {
        fecha:        hoy,
        moneda:       'SOLES',
        mesRegistro:  hoy.slice(5, 7),   // Meses.Numero lleva cero: '07', no '7'
        anioRegistro: hoy.slice(0, 4),
        tipoAsiento:  '0',               // doc_registros: 0 = REGISTROS
        destino:      false,
        glosa:        '',  // vacía a propósito: se busca/escribe, no se preselecciona
    }
}

interface Combos {
    glosas:        ComboGlosaRow[]
    tiposAsiento:  ComboTipoAsientoRow[]
    meses:         ComboMesRow[]
    anios:         ComboAnioRow[]
    centrosCosto:  ComboCentroCostosRow[]
}

const COMBOS_VACIOS: Combos = { glosas: [], tiposAsiento: [], meses: [], anios: [], centrosCosto: [] }

export function useProcesarNotaCredito() {
    const [cabecera, setCabecera]         = useState<AsientoCabecera>(cabeceraInicial())
    const [lineas, setLineas]             = useState<AsientoLinea[]>([])
    const [numeroVoucher, setNumeroVoucher] = useState<number | null>(null)
    const [procesando, setProcesando]     = useState(false)
    const [combos, setCombos]             = useState<Combos>(COMBOS_VACIOS)
    const [combosLoading, setCombosLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            fetchComboGlosa().then(res => res.data?.data?.data as ComboGlosaRow[] ?? []).catch(() => []),
            fetchComboTipoAsiento().then(res => res.data?.data?.data as ComboTipoAsientoRow[] ?? []).catch(() => []),
            fetchComboMes().then(res => res.data?.data?.data as ComboMesRow[] ?? []).catch(() => []),
            fetchComboAnio().then(res => res.data?.data?.data as ComboAnioRow[] ?? []).catch(() => []),
            fetchComboCentroCostos().then(res => res.data?.data?.data as ComboCentroCostosRow[] ?? []).catch(() => []),
        ])
            .then(([glosasCrudas, tiposCrudos, mesesCrudos, aniosCrudos, centrosCrudos]) => {
                // El SP puede traer filas con la columna clave en NULL
                // (p.ej. encabezados de diario sin glosa) — se descartan aquí,
                // en el borde donde entran los datos, para que el resto del
                // formulario pueda asumir combos siempre limpios.
                const glosas       = glosasCrudas.filter((g): g is ComboGlosaRow => !!g?.Glosa)
                const tiposAsiento = tiposCrudos.filter((t): t is ComboTipoAsientoRow => t?.Id_Doc_Registros != null)
                const meses        = mesesCrudos.filter((m): m is ComboMesRow => !!m?.Mes && !!m.Numero)
                const anios        = aniosCrudos.filter((a): a is ComboAnioRow => a?.Anio != null)
                const centrosCosto = centrosCrudos.filter((c): c is ComboCentroCostosRow => !!c?.CodCentroCostos)

                setCombos({ glosas, tiposAsiento, meses, anios, centrosCosto })
            })
            .finally(() => setCombosLoading(false))
    }, [])

    // El correlativo se reserva por año contable. Es solo la vista previa:
    // el número definitivo lo recalcula el SP al insertar la cabecera.
    const cargarVoucher = useCallback(async (anio: string) => {
        try {
            const { data } = await fetchSiguienteVoucher(anio)
            setNumeroVoucher(data?.data?.numeroVoucher ?? null)
            return true
        } catch (error: any) {
            setNumeroVoucher(null)
            const msg = error?.response?.data?.message || "No se pudo obtener el correlativo de voucher"
            toast({ title: "Error", description: msg, variant: "destructive" })
            return false
        }
    }, [])

    useEffect(() => {
        cargarVoucher(cabecera.anioRegistro)
    }, [cabecera.anioRegistro, cargarVoucher])

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
    const puedeAceptar = cuadrado && lineas.length > 0 && !!cabecera.glosa.trim() && !procesando

    // La N.C. define el cliente del asiento: las facturas aplicables se
    // buscan contra ese mismo cliente.
    const clienteAsiento = useMemo(
        () => lineas.find(l => l.tipDoc === '07')?.codCliente ?? lineas[0]?.codCliente ?? '',
        [lineas]
    )

    function agregarLinea(linea: AsientoLinea) {
        setLineas(prev => [...prev, linea])
    }

    function editarLinea(index: number, linea: AsientoLinea) {
        setLineas(prev => prev.map((l, i) => (i === index ? linea : l)))
    }

    function eliminarLinea(index: number) {
        setLineas(prev => prev.filter((_, i) => i !== index))
    }

    // Nada se persiste hasta "Aceptar y procesar", así que reiniciar es
    // limpiar el detalle y volver a pedir el correlativo por si otro
    // usuario grabó un asiento mientras tanto.
    async function reiniciarVoucher() {
        setLineas([])
        return cargarVoucher(cabecera.anioRegistro)
    }

    async function aplicarAsiento() {
        if (!puedeAceptar) return false
        setProcesando(true)
        try {
            await guardarAsientoRequest({
                fecha:         cabecera.fecha,
                moneda:        cabecera.moneda,
                mesRegistro:   cabecera.mesRegistro,
                anioRegistro:  cabecera.anioRegistro,
                glosa:         cabecera.glosa,
                destino:       cabecera.destino,
                tipoAsientoId: Number(cabecera.tipoAsiento),
                lineas,
            })
            toast({ title: "Éxito", description: "Nota de crédito aplicada correctamente" })
            // Se limpia el detalle y se pide el siguiente correlativo: sin esto,
            // volver a pulsar "Aceptar" grabaría un segundo asiento idéntico.
            setLineas([])
            await cargarVoucher(cabecera.anioRegistro)
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
        procesando,
        combos, combosLoading,
        clienteAsiento,

        totalCargo, totalAbono, diferencia, cuadrado, puedeAceptar,

        agregarLinea, editarLinea, eliminarLinea,
        reiniciarVoucher, aplicarAsiento,
    }
}
