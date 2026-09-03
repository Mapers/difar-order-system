'use client'

import { useCallback, useRef, useState } from 'react'
import apiClient from '@/app/api/client'
import { toast } from '@/app/hooks/useToast'
import {
    CobranzaAsignada, ComentarioCobranza, EvidenciaCobranza, FacturaPorAsignar,
    PAGINA_COBRANZA, VendedorNotificar, EVIDENCIA_MAX_BYTES, EVIDENCIA_TIPOS,
} from '@/app/types/cobranza-types'

interface FiltrosPorAsignar {
    busqueda?: string
    vendedor?: string
    fechaDesde?: string
    fechaHasta?: string
}

interface FiltrosAsignadas {
    busqueda?: string
    vendedor?: string
    estado?: string
}

export function useCobranzaAsignacion() {
    const [porAsignar, setPorAsignar] = useState<FacturaPorAsignar[]>([])
    const [totalPorAsignar, setTotalPorAsignar] = useState(0)
    const [cargandoPorAsignar, setCargandoPorAsignar] = useState(false)

    const [asignadas, setAsignadas] = useState<CobranzaAsignada[]>([])
    const [totalAsignadas, setTotalAsignadas] = useState(0)
    const [cargandoAsignadas, setCargandoAsignadas] = useState(false)

    const [guardando, setGuardando] = useState(false)

    const offsetPorAsignar = useRef(0)
    const offsetAsignadas = useRef(0)
    const enVuelo = useRef(false)

    const fetchPorAsignar = useCallback(async (filtros: FiltrosPorAsignar, reiniciar: boolean) => {
        if (enVuelo.current) return
        enVuelo.current = true

        if (reiniciar) offsetPorAsignar.current = 0
        setCargandoPorAsignar(true)

        try {
            const params: Record<string, string> = {
                limit: String(PAGINA_COBRANZA),
                offset: String(offsetPorAsignar.current),
            }
            Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = String(v) })

            const res = await apiClient.get(`/cobranza/por-asignar?${new URLSearchParams(params)}`)
            const data: FacturaPorAsignar[] = res.data?.data?.data ?? []
            const total: number = res.data?.data?.total ?? 0

            setPorAsignar(prev => (reiniciar ? data : [...prev, ...data]))
            setTotalPorAsignar(total)
            offsetPorAsignar.current += data.length
        } catch (error) {
            console.error('Error al listar facturas por asignar:', error)
            toast({ title: '', description: 'No se pudieron cargar las facturas por asignar.', variant: 'error' })
        } finally {
            setCargandoPorAsignar(false)
            enVuelo.current = false
        }
    }, [])

    const fetchAsignadas = useCallback(async (filtros: FiltrosAsignadas, reiniciar: boolean) => {
        if (enVuelo.current) return
        enVuelo.current = true

        if (reiniciar) offsetAsignadas.current = 0
        setCargandoAsignadas(true)

        try {
            const params: Record<string, string> = {
                limit: String(PAGINA_COBRANZA),
                offset: String(offsetAsignadas.current),
            }
            Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = String(v) })

            const res = await apiClient.get(`/cobranza/asignadas?${new URLSearchParams(params)}`)
            const data: CobranzaAsignada[] = res.data?.data?.data ?? []
            const total: number = res.data?.data?.total ?? 0

            setAsignadas(prev => (reiniciar ? data : [...prev, ...data]))
            setTotalAsignadas(total)
            offsetAsignadas.current += data.length
        } catch (error) {
            console.error('Error al listar cobranzas asignadas:', error)
            toast({ title: '', description: 'No se pudieron cargar las cobranzas asignadas.', variant: 'error' })
        } finally {
            setCargandoAsignadas(false)
            enVuelo.current = false
        }
    }, [])

    const consultarVendedores = useCallback(async (codigos: string[]): Promise<VendedorNotificar[]> => {
        try {
            const res = await apiClient.post('/cobranza/vendedores-notificar', { codigos })
            return res.data?.data?.data ?? []
        } catch (error) {
            console.error('Error al consultar vendedores:', error)
            return []
        }
    }, [])

    const asignar = useCallback(async (
        asignaciones: { id_sunat: number; cod_vendedor: string }[],
        idUsuarioWeb: number
    ) => {
        setGuardando(true)
        try {
            const res = await apiClient.post('/cobranza/asignar', { asignaciones, id_usuario_web: idUsuarioWeb })
            const d = res.data?.data ?? {}

            if (Array.isArray(d.rechazadas) && d.rechazadas.length > 0) {
                toast({
                    title: '',
                    description: `${d.asignadas} asignada(s). ${d.rechazadas.length} no se pudieron: ${d.rechazadas[0].mensaje}`,
                    variant: 'error',
                })
            } else {
                toast({ title: '', description: `${d.asignadas} factura(s) asignada(s) a cobranza.`, variant: 'success' })
            }
            return true
        } catch (error: any) {
            toast({
                title: '',
                description: error?.response?.data?.message || 'No se pudieron asignar las cobranzas.',
                variant: 'error',
            })
            return false
        } finally {
            setGuardando(false)
        }
    }, [])

    const retirar = useCallback(async (idAsignacion: number, idUsuarioWeb: number) => {
        setGuardando(true)
        try {
            await apiClient.delete(`/cobranza/${idAsignacion}`, { params: { id_usuario_web: idUsuarioWeb } })
            setAsignadas(prev => prev.filter(a => a.id_asignacion !== idAsignacion))
            toast({ title: '', description: 'Asignación retirada.', variant: 'success' })
            return true
        } catch (error: any) {
            toast({
                title: '',
                description: error?.response?.data?.message || 'No se pudo retirar la asignación.',
                variant: 'error',
            })
            return false
        } finally {
            setGuardando(false)
        }
    }, [])

    const actualizarGestion = useCallback(async (
        idAsignacion: number, idUsuarioWeb: number, estado: string, comentario: string
    ) => {
        setGuardando(true)
        try {
            await apiClient.put(`/cobranza/${idAsignacion}/gestion`, {
                id_usuario_web: idUsuarioWeb, estado, comentario,
            })
            toast({ title: '', description: 'Gestión actualizada.', variant: 'success' })
            return true
        } catch (error: any) {
            toast({
                title: '',
                description: error?.response?.data?.message || 'No se pudo actualizar la gestión.',
                variant: 'error',
            })
            return false
        } finally {
            setGuardando(false)
        }
    }, [])

    const subirEvidencia = useCallback(async (idAsignacion: number, archivo: File, idUsuarioWeb: number) => {
        if (!EVIDENCIA_TIPOS.includes(archivo.type)) {
            toast({ title: '', description: 'Solo se permiten imágenes JPG, PNG, WEBP o archivos PDF', variant: 'error' })
            return false
        }
        if (archivo.size > EVIDENCIA_MAX_BYTES) {
            toast({ title: '', description: 'El archivo supera el tamaño máximo de 5 MB', variant: 'error' })
            return false
        }

        setGuardando(true)
        try {
            const formData = new FormData()
            formData.append('id_usuario_web', String(idUsuarioWeb))
            formData.append('evidencia', archivo)

            await apiClient.post(`/cobranza/${idAsignacion}/evidencia`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            toast({ title: '', description: 'Evidencia guardada.', variant: 'success' })
            return true
        } catch (error: any) {
            toast({
                title: '',
                description: error?.response?.data?.message || 'No se pudo guardar la evidencia.',
                variant: 'error',
            })
            return false
        } finally {
            setGuardando(false)
        }
    }, [])

    const obtenerComentarios = useCallback(async (idAsignacion: number): Promise<ComentarioCobranza[]> => {
        try {
            const res = await apiClient.get(`/cobranza/${idAsignacion}/comentarios`)
            return res.data?.data?.data ?? []
        } catch {
            return []
        }
    }, [])

    const obtenerEvidencia = useCallback(async (idAsignacion: number): Promise<EvidenciaCobranza | null> => {
        try {
            const res = await apiClient.get(`/cobranza/${idAsignacion}/evidencia`)
            return res.data?.data?.data ?? null
        } catch {
            return null
        }
    }, [])

    return {
        porAsignar, totalPorAsignar, cargandoPorAsignar, fetchPorAsignar,
        asignadas, totalAsignadas, cargandoAsignadas, fetchAsignadas,
        guardando,
        consultarVendedores, asignar, retirar, actualizarGestion,
        subirEvidencia, obtenerComentarios, obtenerEvidencia,
    }
}
