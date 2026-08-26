'use client'

import { useCallback, useEffect, useState } from 'react'
import apiClient from '@/app/api/client'
import { toast } from '@/app/hooks/useToast'

export interface ReciboVoucher {
    id_voucher:     number
    id_recibo:      number
    ruta:           string
    nombre_archivo: string
    peso_bytes:     number | null
    id_usuario_web: number | null
    fecha_registro: string
    usuario:        string | null
}

export const VOUCHER_MAX = 3
export const VOUCHER_MAX_BYTES = 5 * 1024 * 1024
export const VOUCHER_TIPOS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']

export function useReciboVouchers(idRecibo: number | null, habilitado: boolean) {
    const [vouchers, setVouchers] = useState<ReciboVoucher[]>([])
    const [cargando, setCargando] = useState(false)
    const [subiendo, setSubiendo] = useState(false)
    const [borrando, setBorrando] = useState<number | null>(null)

    const cargar = useCallback(async () => {
        if (!habilitado || idRecibo == null) { setVouchers([]); return }

        setCargando(true)
        try {
            const res = await apiClient.get(`/recibos/${idRecibo}/vouchers`)
            setVouchers(res.data?.data?.data ?? [])
        } catch (error) {
            console.error('Error al cargar los vouchers:', error)
            setVouchers([])
        } finally {
            setCargando(false)
        }
    }, [idRecibo, habilitado])

    useEffect(() => { cargar() }, [cargar])

    const subir = useCallback(async (archivo: File, idUsuarioWeb: number) => {
        if (idRecibo == null) return false

        if (!VOUCHER_TIPOS.includes(archivo.type)) {
            toast({ title: '', description: 'Solo se permiten imágenes JPG, PNG, WEBP o archivos PDF', variant: 'error' })
            return false
        }
        if (archivo.size > VOUCHER_MAX_BYTES) {
            toast({ title: '', description: 'El archivo supera el tamaño máximo de 5 MB', variant: 'error' })
            return false
        }

        setSubiendo(true)
        try {
            const formData = new FormData()
            formData.append('id_usuario_web', String(idUsuarioWeb))
            formData.append('voucher', archivo)

            await apiClient.post(`/recibos/${idRecibo}/vouchers`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })

            await cargar()
            toast({ title: '', description: 'Voucher adjuntado', variant: 'success' })
            return true
        } catch (error: any) {
            toast({
                title: '',
                description: error?.response?.data?.message || 'No se pudo adjuntar el voucher',
                variant: 'error',
            })
            return false
        } finally {
            setSubiendo(false)
        }
    }, [idRecibo, cargar])

    const eliminar = useCallback(async (idVoucher: number, idUsuarioWeb: number) => {
        if (idRecibo == null) return false

        setBorrando(idVoucher)
        try {
            await apiClient.delete(`/recibos/${idRecibo}/vouchers/${idVoucher}`, {
                params: { id_usuario_web: idUsuarioWeb },
            })
            setVouchers(previo => previo.filter(v => v.id_voucher !== idVoucher))
            toast({ title: '', description: 'Voucher eliminado', variant: 'success' })
            return true
        } catch (error: any) {
            toast({
                title: '',
                description: error?.response?.data?.message || 'No se pudo eliminar el voucher',
                variant: 'error',
            })
            return false
        } finally {
            setBorrando(null)
        }
    }, [idRecibo])

    return { vouchers, cargando, subiendo, borrando, cargar, subir, eliminar }
}
