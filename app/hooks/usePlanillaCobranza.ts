import { useState, useCallback } from 'react'
import apiClient from '@/app/api/client'
import { toast } from '@/app/hooks/useToast'
import {
    AdminInfo,
    Catalogo,
    CatalogosBanco,
    NuevoDetalle,
    PlanillaCabecera,
    PlanillaDetalle,
    ResumenDia, VendedorInfo
} from "@/app/types/planilla-types";

export function usePlanillaCobranza() {
    const [tiposComprobante, setTiposComprobante] = useState<Catalogo[]>([])
    const [bancos,           setBancos]           = useState<CatalogosBanco[]>([])
    const [loadingCatalogos, setLoadingCatalogos] = useState(false)

    const [planillaActiva, setPlanillaActiva] = useState<PlanillaCabecera | null>(null)
    const [detalle,        setDetalle]        = useState<PlanillaDetalle[]>([])
    const [loadingDetalle, setLoadingDetalle] = useState(false)

    const [misPlanillas,        setMisPlanillas]        = useState<PlanillaCabecera[]>([])
    const [loadingMisPlanillas, setLoadingMisPlanillas] = useState(false)

    const [planillasAdmin, setPlanillasAdmin] = useState<PlanillaCabecera[]>([])
    const [resumenDia,     setResumenDia]     = useState<ResumenDia | null>(null)
    const [loadingAdmin,   setLoadingAdmin]   = useState(false)

    const fetchCatalogos = useCallback(async () => {
        setLoadingCatalogos(true)
        try {
            const res = await apiClient.get('/planilla-cobranza/catalogos')
            setTiposComprobante(res.data?.data?.tiposComprobante || [])
            setBancos(res.data?.data?.bancos || [])
        } catch {
            toast({ title: 'Error', description: 'No se pudieron cargar los catálogos.', variant: 'destructive' })
        } finally {
            setLoadingCatalogos(false)
        }
    }, [])

    const generarCorrelativo = useCallback(async (
        vendedor: VendedorInfo,
        fecha_ruta: string,
        zona: string
    ) => {
        try {
            const res = await apiClient.post('/planilla-cobranza/correlativo', {
                id_vendedor:     vendedor.id_vendedor,
                codigo_vendedor: vendedor.codigo_vendedor || null,
                nombre_vendedor: vendedor.nombre_vendedor || null,
                ciudad:          vendedor.ciudad          || null,
                fecha_ruta,
                zona,
            })
            const planilla = res.data?.data?.planilla
            setPlanillaActiva(planilla)
            setDetalle([])
            return planilla
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.response?.data?.message || 'No se pudo generar la planilla.',
                variant: 'destructive'
            })
            return null
        }
    }, [])

    const limpiarPlanillaActiva = useCallback(() => {
        setPlanillaActiva(null)
        setDetalle([])
    }, [])

    const cargarBorrador = useCallback((planilla: PlanillaCabecera, detalleRegs: PlanillaDetalle[]) => {
        setPlanillaActiva(planilla)
        setDetalle(detalleRegs)
    }, [])

    /**
     * Agrega un detalle a la planilla.
     * Si se proveen vouchers (File[]) los envía como multipart/form-data,
     * de lo contrario usa JSON normal.
     */
    const agregarDetalle = useCallback(async (
        id_planilla: number,
        registro: NuevoDetalle,
        vouchers: File[] = []
    ) => {
        setLoadingDetalle(true)
        try {
            let res: any

            if (vouchers.length > 0) {
                const form = new FormData()

                Object.entries(registro).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        form.append(key, String(value))
                    }
                })

                vouchers.forEach(file => form.append('vouchers', file))

                res = await apiClient.post(
                    `/planilla-cobranza/${id_planilla}/detalle`,
                    form,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                )
            } else {
                res = await apiClient.post(
                    `/planilla-cobranza/${id_planilla}/detalle`,
                    registro
                )
            }

            const nuevo = res.data?.data?.detalle
            setDetalle(prev => [...prev, nuevo])
            toast({
                title: 'Registro agregado',
                description: `${registro.nombre_cliente} — S/ ${Number(registro.importe).toFixed(2)}` +
                    (vouchers.length > 0 ? ` · ${vouchers.length} voucher${vouchers.length > 1 ? 's' : ''}` : '')
            })
            return nuevo
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.response?.data?.message || 'No se pudo agregar el registro.',
                variant: 'destructive'
            })
            return null
        } finally {
            setLoadingDetalle(false)
        }
    }, [])

    const eliminarDetalle = useCallback(async (id_planilla: number, id_detalle: number) => {
        try {
            await apiClient.delete(`/planilla-cobranza/${id_planilla}/detalle/${id_detalle}`)
            setDetalle(prev => prev.filter(d => d.id_detalle !== id_detalle))
            toast({ title: 'Registro eliminado' })
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.response?.data?.message || 'No se pudo eliminar el registro.',
                variant: 'destructive'
            })
        }
    }, [])

    const fetchDetalle = useCallback(async (id_planilla: number) => {
        setLoadingDetalle(true)
        try {
            const res = await apiClient.get(`/planilla-cobranza/${id_planilla}/detalle`)
            const { planilla, detalle: det } = res.data?.data || {}
            if (planilla) setPlanillaActiva(planilla)
            setDetalle(det || [])
            return { planilla, detalle: det }
        } catch {
            toast({ title: 'Error', description: 'No se pudo cargar el detalle.', variant: 'destructive' })
            return null
        } finally {
            setLoadingDetalle(false)
        }
    }, [])

    const enviarPlanilla = useCallback(async (
        id_planilla: number,
        vendedor: VendedorInfo
    ) => {
        try {
            const res = await apiClient.put(`/planilla-cobranza/${id_planilla}/enviar`, {
                id_vendedor: vendedor.id_vendedor,
            })
            const planilla = res.data?.data?.planilla
            setPlanillaActiva(planilla)
            toast({
                title: '✓ Planilla enviada',
                description: `${planilla?.numero_planilla} enviada al administrador.`
            })
            return planilla
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.response?.data?.message || 'No se pudo enviar la planilla.',
                variant: 'destructive'
            })
            return null
        }
    }, [])

    const reenviarPlanilla = useCallback(async (
        id_planilla: number,
        vendedor: VendedorInfo,
        registros: NuevoDetalle[]
    ) => {
        try {
            const res = await apiClient.put(`/planilla-cobranza/${id_planilla}/reenviar`, {
                id_vendedor: vendedor.id_vendedor,
                registros,
            })
            const { planilla, detalle: det } = res.data?.data || {}
            setMisPlanillas(prev =>
                prev.map(p => p.id_planilla === id_planilla ? { ...p, ...planilla } : p)
            )
            toast({
                title: '✓ Planilla reenviada',
                description: `${planilla?.numero_planilla} reenviada correctamente.`
            })
            return { planilla, detalle: det }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.response?.data?.message || 'No se pudo reenviar.',
                variant: 'destructive'
            })
            return null
        }
    }, [])

    const fetchMisPlanillas = useCallback(async (params: {
        id_vendedor:  number | string
        estado?:      string
        fecha_desde?: string
        fecha_hasta?: string
    }) => {
        setLoadingMisPlanillas(true)
        try {
            const qs = new URLSearchParams(
                Object.fromEntries(
                    Object.entries(params)
                        .filter(([, v]) => v != null && v !== '')
                        .map(([k, v]) => [k, String(v)])
                )
            ).toString()
            const res = await apiClient.get(`/planilla-cobranza/mis-planillas?${qs}`)
            const planillas = res.data?.data?.data || []
            setMisPlanillas(planillas)
            return planillas
        } catch {
            toast({
                title: 'Error',
                description: 'No se pudieron cargar tus planillas.',
                variant: 'destructive'
            })
            return []
        } finally {
            setLoadingMisPlanillas(false)
        }
    }, [])

    const fetchPlanillasAdmin = useCallback(async (params: {
        estado?:      string
        fecha_desde?: string
        fecha_hasta?: string
        busqueda?:    string
    } = {}) => {
        setLoadingAdmin(true)
        try {
            const qs = new URLSearchParams(
                Object.fromEntries(
                    Object.entries(params).filter(([, v]) => v != null && v !== '')
                )
            ).toString()
            const res = await apiClient.get(`/planilla-cobranza/admin/lista${qs ? `?${qs}` : ''}`)
            const planillas = res.data?.data?.data || []
            setPlanillasAdmin(planillas)
            return planillas
        } catch {
            toast({
                title: 'Error',
                description: 'No se pudieron cargar las planillas.',
                variant: 'destructive'
            })
            return []
        } finally {
            setLoadingAdmin(false)
        }
    }, [])

    const fetchResumenDia = useCallback(async (fecha?: string) => {
        try {
            const res = await apiClient.get(
                `/planilla-cobranza/admin/resumen${fecha ? `?fecha=${fecha}` : ''}`
            )
            const resumen = res.data?.data?.resumen || null
            setResumenDia(resumen)
            return resumen
        } catch {
            return null
        }
    }, [])

    const validarPlanilla = useCallback(async (
        id_planilla: number,
        admin: AdminInfo,
        accion: 'validado' | 'rechazado',
        observacion_admin?: string
    ) => {
        try {
            const res = await apiClient.put(`/planilla-cobranza/${id_planilla}/validar`, {
                id_admin:          admin.id_admin,
                accion,
                observacion_admin: observacion_admin || null,
            })
            const planilla = res.data?.data?.planilla
            setPlanillasAdmin(prev =>
                prev.map(p => p.id_planilla === id_planilla ? { ...p, ...planilla } : p)
            )
            toast({
                title: accion === 'validado' ? '✓ Planilla validada' : '⚠ Planilla rechazada',
                description: planilla?.numero_planilla,
            })
            await fetchResumenDia()
            return planilla
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.response?.data?.message || 'No se pudo procesar la acción.',
                variant: 'destructive'
            })
            return null
        }
    }, [fetchResumenDia])

    return {
        tiposComprobante, bancos, loadingCatalogos, fetchCatalogos,
        planillaActiva, detalle, loadingDetalle,
        generarCorrelativo, limpiarPlanillaActiva, cargarBorrador,
        agregarDetalle, eliminarDetalle, fetchDetalle,
        enviarPlanilla, reenviarPlanilla,
        misPlanillas, loadingMisPlanillas, fetchMisPlanillas,
        planillasAdmin, resumenDia, loadingAdmin,
        fetchPlanillasAdmin, fetchResumenDia, validarPlanilla,
    }
}