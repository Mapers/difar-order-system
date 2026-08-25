'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import apiClient from '@/app/api/client'
import socket from '@/app/api/socket'
import { toast } from '@/app/hooks/useToast'
import { useAuth } from '@/context/authContext'
import { EstadoPermisoRecibo } from '@/app/types/recibo-permiso-types'

export function useReciboPermiso(idUsuarioWeb: number | null | undefined) {
    const { isAdmin } = useAuth()

    const esGerencia = isAdmin()

    const [estado, setEstado] = useState<EstadoPermisoRecibo | null>(null)
    const [cargando, setCargando] = useState(true)
    const [solicitando, setSolicitando] = useState(false)
    const [segundosRestantes, setSegundosRestantes] = useState(0)
    const [segundosEspera, setSegundosEspera] = useState(0)

    const idRef = useRef(idUsuarioWeb)
    idRef.current = idUsuarioWeb

    const gerenciaRef = useRef(esGerencia)
    gerenciaRef.current = esGerencia

    const refrescar = useCallback(async () => {
        if (gerenciaRef.current || !idRef.current) { setCargando(false); return }
        try {
            const res = await apiClient.get('/recibos/permiso/estado', {
                params: { id_usuario_web: idRef.current },
            })
            const data: EstadoPermisoRecibo | null = res.data?.data ?? null
            setEstado(data)
            setSegundosRestantes(Number(data?.segundos_restantes ?? 0))
            setSegundosEspera(Number(data?.segundos_espera ?? 0))
        } catch {
            setEstado(null)
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => { refrescar() }, [refrescar, idUsuarioWeb])

    useEffect(() => {
        const alVolver = () => {
            if (document.visibilityState === 'visible') refrescar()
        }
        document.addEventListener('visibilitychange', alVolver)
        window.addEventListener('focus', alVolver)
        return () => {
            document.removeEventListener('visibilitychange', alVolver)
            window.removeEventListener('focus', alVolver)
        }
    }, [refrescar])

    useEffect(() => {
        const alResolver = (payload: any) => {
            if (!idRef.current) return
            if (payload?.destinatario_codigo !== `U${idRef.current}`) return
            refrescar()
        }
        socket.on('notification:reciboPermisoResuelto', alResolver)
        return () => { socket.off('notification:reciboPermisoResuelto', alResolver) }
    }, [refrescar])

    const corriendo = segundosRestantes > 0 || segundosEspera > 0
    useEffect(() => {
        if (!corriendo) return
        const t = setInterval(() => {
            setSegundosRestantes(s => (s > 0 ? s - 1 : 0))
            setSegundosEspera(s => (s > 0 ? s - 1 : 0))
        }, 1000)
        return () => clearInterval(t)
    }, [corriendo])

    const solicitar = useCallback(async (
        codVendedor?: string | null,
        nombreVendedor?: string | null,
    ) => {
        if (!idRef.current) return false
        setSolicitando(true)
        try {
            await apiClient.post('/recibos/permiso/solicitar', {
                id_usuario_web: idRef.current,
                cod_vendedor: codVendedor ?? null,
                nombre_vendedor: nombreVendedor ?? null,
            })
            await refrescar()
            return true
        } catch (error: any) {
            toast({
                title: 'Permiso',
                description: error?.response?.data?.message || 'No se pudo enviar la solicitud',
                variant: 'destructive',
            })
            return false
        } finally {
            setSolicitando(false)
        }
    }, [refrescar])

    const vigente   = Number(estado?.vigente ?? 0) === 1 && segundosRestantes > 0
    const pendiente = estado?.estado === 'PENDIENTE' && segundosEspera > 0
    const expirada  = estado?.estado === 'PENDIENTE' && segundosEspera <= 0

    return {
        requiere: !esGerencia && Number(estado?.requiere ?? 1) === 1,
        estado: estado?.estado ?? null,
        resueltoNombre: estado?.resuelto_nombre ?? null,
        vigente, pendiente, expirada,
        segundosRestantes, segundosEspera,
        cargando, solicitando,
        solicitar, refrescar,
    }
}
