import { useState, useCallback, useEffect } from 'react'
import apiClient from '@/app/api/client'
import { toast } from '@/app/hooks/useToast'
import {
    FiltrosHistorial,
    NuevoRecibo,
    ReciboCabecera,
    ReciboDetalle,
} from '@/app/types/recibo-cliente-types'

export interface ReciboEmitido {
    recibo: ReciboCabecera
    detalle: ReciboDetalle[]
    pdf_url: string | null
}

export function useReciboCliente() {
    const [historial, setHistorial] = useState<ReciboCabecera[]>([])
    const [loadingHistorial, setLoadingHistorial] = useState(false)
    const [emitiendo, setEmitiendo] = useState(false)
    const [siguienteNumero, setSiguienteNumero] = useState<string | null>(null)

    const cargarSiguienteNumero = useCallback(async () => {
        try {
            const res = await apiClient.get('/recibos/siguiente-correlativo')
            setSiguienteNumero(res.data?.data?.numero ?? null)
        } catch {
            setSiguienteNumero(null)
        }
    }, [])

    useEffect(() => { cargarSiguienteNumero() }, [cargarSiguienteNumero])

    useEffect(() => {
        const alVolver = () => {
            if (document.visibilityState === 'visible') cargarSiguienteNumero()
        }
        document.addEventListener('visibilitychange', alVolver)
        window.addEventListener('focus', alVolver)
        return () => {
            document.removeEventListener('visibilitychange', alVolver)
            window.removeEventListener('focus', alVolver)
        }
    }, [cargarSiguienteNumero])

    const fetchHistorial = useCallback(async (
        filtros: FiltrosHistorial,
        idUsuarioWeb: number | null
    ) => {
        setLoadingHistorial(true)
        try {
            const params: Record<string, string> = {}

            if (idUsuarioWeb != null) params.id_usuario_web = String(idUsuarioWeb)

            Object.entries(filtros).forEach(([k, v]) => {
                if (v != null && v !== '') params[k] = String(v)
            })

            const qs = new URLSearchParams(params).toString()
            const res = await apiClient.get(`/recibos${qs ? `?${qs}` : ''}`)
            const data: ReciboCabecera[] = res.data?.data?.data || []

            setHistorial(data)
            return data
        } catch {
            toast({
                title: 'Error',
                description: 'No se pudo cargar el historial de recibos.',
                variant: 'destructive',
            })
            return []
        } finally {
            setLoadingHistorial(false)
        }
    }, [])

    const emitirRecibo = useCallback(async (payload: NuevoRecibo): Promise<ReciboEmitido | null> => {
        setEmitiendo(true)
        try {
            const res = await apiClient.post('/recibos', payload)
            const data: ReciboEmitido | undefined = res.data?.data

            if (!data?.recibo) {
                toast({
                    title: 'Error',
                    description: 'El servidor no devolvió el recibo generado.',
                    variant: 'destructive',
                })
                return null
            }

            const wp = data.recibo.whatsapp_estado

            const aviso =
                wp === 'OK' ? 'Enviado a Gerencia por WhatsApp.'
                    : wp === 'PARCIAL' ? 'Enviado a Gerencia con el enlace al PDF; no se pudo adjuntar el archivo.'
                        : wp === 'SIN_DESTINO' ? 'No hay números configurados en el módulo RECIBO.'
                            : 'No se pudo enviar el WhatsApp; el recibo quedó guardado.'

            toast({
                title: `✓ Recibo ${data.recibo.numero_recibo} generado`,
                description: aviso,
                variant: wp === 'OK' ? 'success' : 'warning',
            })

            return data
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.response?.data?.message || 'No se pudo generar el recibo.',
                variant: 'destructive',
            })
            return null
        } finally {
            setEmitiendo(false)
            cargarSiguienteNumero()
        }
    }, [cargarSiguienteNumero])

    const obtenerRecibo = useCallback(async (idRecibo: number) => {
        try {
            const res = await apiClient.get(`/recibos/${idRecibo}`)
            const data = res.data?.data

            if (!data?.recibo) return null

            return {
                recibo: data.recibo as ReciboCabecera,
                detalle: (data.detalle || []) as ReciboDetalle[],
            }
        } catch {
            toast({
                title: 'Error',
                description: 'No se pudo cargar el recibo.',
                variant: 'destructive',
            })
            return null
        }
    }, [])

    const anularRecibo = useCallback(async (
        idRecibo: number,
        motivo: string,
        idUsuarioWeb: number
    ) => {
        try {
            const res = await apiClient.put(`/recibos/${idRecibo}/anular`, {
                motivo,
                id_usuario_web: idUsuarioWeb,
            })

            const recibo = res.data?.data?.recibo as ReciboCabecera

            setHistorial(prev =>
                prev.map(r => (r.id_recibo === idRecibo ? { ...r, ...recibo } : r))
            )

            toast({
                title: '⚠ Recibo anulado',
                description: recibo?.numero_recibo,
                variant: 'warning',
            })

            return recibo
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.response?.data?.message || 'No se pudo anular el recibo.',
                variant: 'destructive',
            })
            return null
        }
    }, [])

    return {
        historial,
        loadingHistorial,
        emitiendo,
        siguienteNumero,
        cargarSiguienteNumero,
        fetchHistorial,
        emitirRecibo,
        obtenerRecibo,
        anularRecibo,
    }
}
