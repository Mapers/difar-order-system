"use client"
import React, { useEffect, useState } from "react"
import { Smartphone, X } from "lucide-react"

// Los vendedores toman los pedidos desde la app DIFAR. En la web pueden armar
// y cotizar el pedido, pero el envío se hace desde el celular.

const CLAVE_CERRADO = "aviso-pedido-app-cerrado"

/** Franja discreta arriba de Tomar Pedido. Se puede cerrar (queda cerrada durante la sesión). */
export function AvisoPedidoApp() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        try { setVisible(sessionStorage.getItem(CLAVE_CERRADO) !== "1") } catch { setVisible(true) }
    }, [])

    if (!visible) return null

    const cerrar = () => {
        setVisible(false)
        try { sessionStorage.setItem(CLAVE_CERRADO, "1") } catch { /* sin almacenamiento */ }
    }

    return (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
            <Smartphone className="h-4 w-4 shrink-0 text-slate-400" />
            <p className="flex-1">
                Puedes cotizar aquí. Para <span className="font-medium text-slate-700 dark:text-slate-200">enviar el pedido</span>, usa la app DIFAR en tu celular.
            </p>
            <button type="button" onClick={cerrar} aria-label="Cerrar aviso"
                className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-600 dark:hover:bg-slate-800">
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    )
}

/** Reemplaza al botón "Confirmar Pedido" en el resumen. */
export function EnviarDesdeApp() {
    return (
        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-background px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400"
            title="Los pedidos de vendedores se envían desde la app DIFAR">
            <Smartphone className="h-4 w-4 text-slate-400" />
            <span className="hidden sm:inline">Envía este pedido desde la app DIFAR</span>
            <span className="sm:hidden">Envíalo desde la app</span>
        </div>
    )
}
