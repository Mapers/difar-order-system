'use client'

import { useCallback, useEffect, useState } from "react"
import { toast } from "@/app/hooks/useToast"
import { listarHistorialNc, revertirProcesoNc } from "@/app/api/asientos"
import { ProcesoNcHistorial } from "@/app/types/procesar-nota-credito-types"

export interface FiltrosHistorialNc {
    fechaDesde: string
    fechaHasta: string
    busqueda:   string
}

export function useHistorialProcesoNc(habilitado: boolean) {
    const [procesos, setProcesos] = useState<ProcesoNcHistorial[]>([])
    const [cargando, setCargando] = useState(false)
    const [revirtiendo, setRevirtiendo] = useState<number | null>(null)
    const [filtros, setFiltros] = useState<FiltrosHistorialNc>({
        fechaDesde: '', fechaHasta: '', busqueda: '',
    })

    const cargar = useCallback(async () => {
        if (!habilitado) return

        setCargando(true)
        try {
            const res = await listarHistorialNc({
                fechaDesde: filtros.fechaDesde || undefined,
                fechaHasta: filtros.fechaHasta || undefined,
                busqueda:   filtros.busqueda.trim() || undefined,
            })
            setProcesos(res.data?.data?.data ?? [])
        } catch (error) {
            console.error('Error al cargar el historial de procesos:', error)
            toast({ title: "Error", description: "No se pudo cargar el historial", variant: "destructive" })
        } finally {
            setCargando(false)
        }
    }, [habilitado, filtros])

    useEffect(() => {
        if (!habilitado) {
            setProcesos([])
            return
        }
        cargar()
    }, [habilitado])

    const revertir = useCallback(async (item: number) => {
        setRevirtiendo(item)
        try {
            const res = await revertirProcesoNc(item)
            toast({
                title: "Proceso revertido",
                description: res.data?.data?.mensaje || `Asiento ${item} revertido correctamente`,
            })
            setProcesos(previo => previo.filter(p => p.item !== item))
            return true
        } catch (error: any) {
            const msg = error?.response?.data?.message || "No se pudo revertir el proceso"
            toast({ title: "Error", description: msg, variant: "destructive" })
            return false
        } finally {
            setRevirtiendo(null)
        }
    }, [])

    return { procesos, cargando, revirtiendo, filtros, setFiltros, recargar: cargar, revertir }
}
