"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShieldAlert } from "lucide-react"
import { useAuth } from "@/context/authContext"

/**
 * Guarda por menú (auditoría 14/11/2026, B1): las pantallas de contabilidad solo se abren si el rol tiene asignado
 * ese menú (y sus padres). Antes bastaba con escribir la URL. El backend aplica la misma regla (403).
 * Solo cubre /dashboard/contabilidad/*; el resto de la intranet no cambia.
 */
const PREFIJO = "/dashboard/contabilidad"

type MenuToken = { id: string | number; ruta?: string | null; id_padre?: string | number | null }

/**
 * Rutas asignadas al rol (vienen en el token). En el front basta con que la pantalla esté asignada; la cadena de
 * padres la exige el backend en los módulos nuevos (permisoMenu). Así no cambia nada para roles que hoy abren una
 * pantalla sin tener su menú padre (p. ej. el representante con Planilla de Cobranza).
 */
export function rutasPermitidas(menus: MenuToken[] | undefined): string[] {
    return (menus || []).filter((m) => m.ruta).map((m) => String(m.ruta))
}

export function puedeAbrir(pathname: string, rutas: string[]): boolean {
    if (!pathname.startsWith(PREFIJO)) return true
    return rutas.some((r) => r === pathname || (r !== PREFIJO && r.startsWith(PREFIJO) && pathname.startsWith(r + "/")))
}

export function GuardaMenu({ children }: { children: React.ReactNode }) {
    const pathname = usePathname() || ""
    const { user } = useAuth()
    if (!user || puedeAbrir(pathname, rutasPermitidas(user.menus as MenuToken[]))) return <>{children}</>
    return (
        <div className="mx-auto mt-10 max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
            <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="space-y-2">
                    <p className="font-semibold">No tienes acceso a esta pantalla</p>
                    <p className="text-sm">Tu rol no tiene asignada esta opción del menú. Si la necesitas, pide al administrador que te la asigne en Roles.</p>
                    <Link href="/dashboard" className="inline-block text-sm font-medium underline">Volver al inicio</Link>
                </div>
            </div>
        </div>
    )
}
