'use client'

import { useCallback, useEffect, useState } from 'react'
import apiClient from '@/app/api/client'
import { toast } from '@/app/hooks/useToast'
import {
    ClienteReferenciaImagen, REFERENCIA_MAX_BYTES, REFERENCIA_TIPOS,
} from '@/app/types/cliente-referencia-types'

export function useClienteReferenciasImagenes(
    codigoCliente: string | null,
    habilitado: boolean
) {
    const [imagenes, setImagenes] = useState<ClienteReferenciaImagen[]>([])
    const [cargando, setCargando] = useState(false)
    const [subiendo, setSubiendo] = useState(false)
    const [borrando, setBorrando] = useState<number | null>(null)

    const cargar = useCallback(async () => {
        if (!habilitado || !codigoCliente) { setImagenes([]); return }

        setCargando(true)
        try {
            const res = await apiClient.get(
                `/clientes/${encodeURIComponent(codigoCliente)}/referencias`
            )
            setImagenes(res.data?.data?.data ?? [])
        } catch (error) {
            console.error('Error al cargar las imágenes de referencia:', error)
            setImagenes([])
        } finally {
            setCargando(false)
        }
    }, [codigoCliente, habilitado])

    useEffect(() => { cargar() }, [cargar])

    const subir = useCallback(async (archivo: File, idUsuarioWeb: number) => {
        if (!codigoCliente) return false

        if (!REFERENCIA_TIPOS.includes(archivo.type)) {
            toast({ title: '', description: 'Solo se permiten imágenes JPG, PNG o WEBP', variant: 'error' })
            return false
        }
        if (archivo.size > REFERENCIA_MAX_BYTES) {
            toast({ title: '', description: 'La imagen supera el tamaño máximo de 2 MB', variant: 'error' })
            return false
        }

        setSubiendo(true)
        try {
            const formData = new FormData()
            formData.append('id_usuario_web', String(idUsuarioWeb))
            formData.append('imagen', archivo)

            await apiClient.post(
                `/clientes/${encodeURIComponent(codigoCliente)}/referencias`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            )

            await cargar()
            toast({ title: '', description: 'Imagen de referencia guardada', variant: 'success' })
            return true
        } catch (error: any) {
            toast({
                title: '',
                description: error?.response?.data?.message || 'No se pudo guardar la imagen',
                variant: 'error',
            })
            return false
        } finally {
            setSubiendo(false)
        }
    }, [codigoCliente, cargar])

    const eliminar = useCallback(async (idImagen: number, idUsuarioWeb: number) => {
        setBorrando(idImagen)
        try {
            await apiClient.delete(`/clientes/referencias/${idImagen}`, {
                params: { id_usuario_web: idUsuarioWeb },
            })
            setImagenes(previo => previo.filter(i => i.id_imagen !== idImagen))
            toast({ title: '', description: 'Imagen de referencia eliminada', variant: 'success' })
            return true
        } catch (error: any) {
            toast({
                title: '',
                description: error?.response?.data?.message || 'No se pudo eliminar la imagen',
                variant: 'error',
            })
            return false
        } finally {
            setBorrando(null)
        }
    }, [])

    return { imagenes, cargando, subiendo, borrando, cargar, subir, eliminar }
}
