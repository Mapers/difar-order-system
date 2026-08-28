'use client'

import { useCallback, useEffect, useState } from 'react'
import apiClient from '@/app/api/client'
import { toast } from '@/app/hooks/useToast'

export interface Conformidad {
    id_sunat:       number
    ruta:           string
    nombre_archivo: string
    peso_bytes:     number | null
    id_usuario_web: number | null
    fecha_mod:      string
    usuario:        string | null
}

export const CONFORMIDAD_MAX_BYTES = 5 * 1024 * 1024
export const CONFORMIDAD_TIPOS = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf',
]

export function useConformidad(idSunat: number | null, abierto: boolean) {
    const [conformidad, setConformidad] = useState<Conformidad | null>(null)
    const [cargando, setCargando] = useState(false)
    const [subiendo, setSubiendo] = useState(false)
    const [borrando, setBorrando] = useState(false)

    const cargar = useCallback(async () => {
        if (!abierto || idSunat == null) { setConformidad(null); return }

        setCargando(true)
        try {
            const res = await apiClient.get(`/conformidades/${idSunat}`)
            setConformidad(res.data?.data?.data ?? null)
        } catch (error) {
            console.error('Error al cargar la conformidad:', error)
            setConformidad(null)
        } finally {
            setCargando(false)
        }
    }, [idSunat, abierto])

    useEffect(() => { cargar() }, [cargar])

    const subir = useCallback(async (archivo: File, idUsuarioWeb: number) => {
        if (idSunat == null) return false

        if (!CONFORMIDAD_TIPOS.includes(archivo.type)) {
            toast({ title: '', description: 'Solo se permiten imágenes JPG, PNG, WEBP o archivos PDF', variant: 'error' })
            return false
        }
        if (archivo.size > CONFORMIDAD_MAX_BYTES) {
            toast({ title: '', description: 'El archivo supera el tamaño máximo de 5 MB', variant: 'error' })
            return false
        }

        setSubiendo(true)
        try {
            const formData = new FormData()
            formData.append('id_usuario_web', String(idUsuarioWeb))
            formData.append('conformidad', archivo)

            await apiClient.post(`/conformidades/${idSunat}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })

            await cargar()
            toast({ title: '', description: 'Conformidad guardada', variant: 'success' })
            return true
        } catch (error: any) {
            toast({
                title: '',
                description: error?.response?.data?.message || 'No se pudo guardar la conformidad',
                variant: 'error',
            })
            return false
        } finally {
            setSubiendo(false)
        }
    }, [idSunat, cargar])

    const eliminar = useCallback(async (idUsuarioWeb: number) => {
        if (idSunat == null) return false

        setBorrando(true)
        try {
            await apiClient.delete(`/conformidades/${idSunat}`, {
                params: { id_usuario_web: idUsuarioWeb },
            })
            setConformidad(null)
            toast({ title: '', description: 'Conformidad eliminada', variant: 'success' })
            return true
        } catch (error: any) {
            toast({
                title: '',
                description: error?.response?.data?.message || 'No se pudo eliminar la conformidad',
                variant: 'error',
            })
            return false
        } finally {
            setBorrando(false)
        }
    }, [idSunat])

    return { conformidad, cargando, subiendo, borrando, cargar, subir, eliminar }
}
