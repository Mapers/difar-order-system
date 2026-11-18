'use client'

import { useCallback, useEffect, useRef, useState } from "react"
import apiClient from "@/app/api/client"

/**
 * Guarda solo el borrador en el servidor (tablas tmp_*) mientras el usuario edita.
 *
 * - `clave`: identifica el documento (voucher, compra). Si cambia, lo pendiente del anterior se envía antes.
 * - `cuerpo`: lo que se guarda. `null` = no hay cambios -> se borra el borrador que hubiera.
 * - `habilitado`: false mientras carga, si el documento está cerrado o si hay un borrador anterior sin
 *   decidir (Recuperar/Descartar), para no pisarlo.
 * Espera `esperaMs` sin cambios antes de enviar. Si la pestaña se oculta o se cierra, envía en el acto
 * (fetch keepalive, que sobrevive al cierre de la página).
 */
export type EstadoBorrador = 'inactivo' | 'pendiente' | 'guardando' | 'guardado' | 'error'

interface Opciones {
    ruta: string | null              // p. ej. /contabilidad/borradores/caja/645
    cuerpo: unknown | null
    habilitado: boolean
    esperaMs?: number
}

const tokenActual = () => { try { return localStorage.getItem("token") } catch { return null } }

export function useBorradorServidor({ ruta, cuerpo, habilitado, esperaMs = 1500 }: Opciones) {
    const [estado, setEstado] = useState<EstadoBorrador>('inactivo')
    const [guardadoEn, setGuardadoEn] = useState<Date | null>(null)
    const temporizador = useRef<number | null>(null)
    const pendiente = useRef<{ ruta: string; texto: string | null } | null>(null)
    const ultimoEnviado = useRef<Map<string, string | null>>(new Map())

    const enviar = useCallback(async (p: { ruta: string; texto: string | null }, alCerrar = false) => {
        if (ultimoEnviado.current.get(p.ruta) === p.texto) return
        if (alCerrar) {
            // Al cerrar la pestaña axios no alcanza: fetch keepalive con el mismo token.
            const token = tokenActual()
            const base = String(apiClient.defaults.baseURL ?? "").replace(/\/$/, "")
            try {
                fetch(`${base}${p.ruta}`, {
                    method: p.texto == null ? "DELETE" : "PUT", keepalive: true,
                    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    body: p.texto ?? undefined,
                })
                ultimoEnviado.current.set(p.ruta, p.texto)
            } catch { /* nada más que hacer al cerrar */ }
            return
        }
        setEstado('guardando')
        try {
            if (p.texto == null) await apiClient.delete(p.ruta)
            else await apiClient.put(p.ruta, JSON.parse(p.texto))
            ultimoEnviado.current.set(p.ruta, p.texto)
            if (pendiente.current?.ruta === p.ruta && pendiente.current.texto === p.texto) pendiente.current = null
            setEstado(p.texto == null ? 'inactivo' : 'guardado')
            if (p.texto != null) setGuardadoEn(new Date())
        } catch {
            setEstado('error') // se reintenta con el próximo cambio o al ocultar la pestaña
        }
    }, [])

    const vaciar = useCallback((alCerrar = false) => {
        if (temporizador.current) { window.clearTimeout(temporizador.current); temporizador.current = null }
        const p = pendiente.current
        if (p) enviar(p, alCerrar)
    }, [enviar])

    // Cada cambio reinicia la espera
    const texto = cuerpo == null ? null : JSON.stringify(cuerpo)
    useEffect(() => {
        if (!habilitado || !ruta) return
        if (ultimoEnviado.current.get(ruta) === texto && !pendiente.current) return
        // Sin borrador previo conocido y sin cambios: nada que borrar
        if (texto == null && !ultimoEnviado.current.has(ruta)) { ultimoEnviado.current.set(ruta, null); return }
        pendiente.current = { ruta, texto }
        setEstado('pendiente')
        if (temporizador.current) window.clearTimeout(temporizador.current)
        temporizador.current = window.setTimeout(() => vaciar(), esperaMs)
    }, [ruta, texto, habilitado, esperaMs, vaciar])

    // Al cambiar de documento o salir de la pantalla: enviar lo pendiente del anterior
    useEffect(() => () => vaciar(), [ruta, vaciar])

    useEffect(() => {
        const oculto = () => { if (document.visibilityState === 'hidden') vaciar(true) }
        const cerrar = () => vaciar(true)
        document.addEventListener('visibilitychange', oculto)
        window.addEventListener('pagehide', cerrar)
        return () => {
            document.removeEventListener('visibilitychange', oculto)
            window.removeEventListener('pagehide', cerrar)
        }
    }, [vaciar])

    /** Tras grabar, eliminar o descartar: borra el borrador y olvida lo pendiente. */
    const borrar = useCallback(async (rutaABorrar: string | null = ruta) => {
        if (temporizador.current) { window.clearTimeout(temporizador.current); temporizador.current = null }
        if (pendiente.current?.ruta === rutaABorrar) pendiente.current = null
        if (!rutaABorrar) return
        try {
            await apiClient.delete(rutaABorrar)
            ultimoEnviado.current.set(rutaABorrar, null)
            setEstado('inactivo')
        } catch {
            // Queda como "hay borrador en el servidor": el próximo ciclo sin cambios lo vuelve a intentar borrar.
            ultimoEnviado.current.set(rutaABorrar, '__servidor__')
        }
    }, [ruta])

    /** Marca como ya guardado lo que hay en el servidor (al abrir un documento que trae borrador). */
    const conocerServidor = useCallback((r: string, hay: boolean) => {
        ultimoEnviado.current.set(r, hay ? '__servidor__' : null)
    }, [])

    return { estado, guardadoEn, borrar, conocerServidor }
}
