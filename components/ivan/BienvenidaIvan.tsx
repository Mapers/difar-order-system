'use client'

import { BarChart3, Calculator, Coins, FileSearch, PackageSearch, Wallet } from 'lucide-react'
import { useAuth } from '@/context/authContext'
import { AvatarIvan } from './AvatarIvan'

const normalizar = (r?: string) => String(r || '').trim().replace(/\/+$/, '').toLowerCase()

// Sugerencias de inicio; solo se muestran las de los módulos que el usuario tiene.
const SUGERENCIAS = [
    { menus: ['/dashboard/reportes/cuenta-cliente'], icono: Wallet, titulo: 'Estado de cuenta', texto: 'Quiero ver el estado de cuenta de un cliente' },
    { menus: ['/dashboard/reportes/ventas-totales'], icono: BarChart3, titulo: 'Ventas del mes', texto: '¿Cuánto se vendió este mes? Dame el detalle por laboratorio' },
    { menus: ['/dashboard/tomar-pedido', '/dashboard/tomar-pedido-alpha'], icono: Calculator, titulo: 'Cotizar un pedido', texto: 'Quiero cotizar un pedido' },
    { menus: ['/dashboard/reportes/saldos-cliente', '/dashboard/reportes/saldos-vencidos'], icono: Coins, titulo: 'Saldos por cobrar', texto: '¿Qué clientes tienen saldo por cobrar vencido?' },
    { menus: ['/dashboard/comprobantes', '/dashboard/mis-pedidos'], icono: FileSearch, titulo: 'Comprobantes', texto: 'Muéstrame los comprobantes emitidos esta semana' },
    { menus: ['/dashboard/reportes/item-kardex'], icono: PackageSearch, titulo: 'Kardex de producto', texto: 'Quiero ver el kardex de un producto' },
]

export function BienvenidaIvan({ enviar, amplio }: { enviar: (texto: string) => void; amplio?: boolean }) {
    const { user } = useAuth()
    const propios = new Set((user?.menus ?? []).map((m: { ruta?: string }) => normalizar(m.ruta)))
    const sugerencias = SUGERENCIAS.filter(s => s.menus.some(m => propios.has(normalizar(m)))).slice(0, 4)
    const nombre = (user?.nombreCompleto || '').split(' ')[0]
    const capitalizado = nombre ? nombre.charAt(0) + nombre.slice(1).toLowerCase() : ''

    return (
        <div className="flex flex-col items-center px-2 py-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
            <AvatarIvan tamano="lg" activo />
            <h2 className="mt-3 text-base font-semibold text-foreground">
                {capitalizado ? `Hola, ${capitalizado}` : 'Hola'} 👋
            </h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Soy IVAN. Pregúntame por clientes, ventas, cobranzas o productos y te respondo con los datos del sistema.
            </p>
            {sugerencias.length > 0 && (
                <div className={`mt-5 grid w-full gap-2 ${amplio ? 'max-w-xl sm:grid-cols-2' : 'grid-cols-1'}`}>
                    {sugerencias.map((s, i) => (
                        <button key={s.titulo} type="button" onClick={() => enviar(s.texto)}
                                style={{ animationDelay: `${150 + i * 80}ms` }}
                                className="group flex items-center gap-3 rounded-xl border border-border bg-background p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 dark:hover:border-indigo-900">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/50 dark:text-indigo-300">
                                <s.icono className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                                <span className="block text-sm font-medium text-foreground">{s.titulo}</span>
                                <span className="block truncate text-xs text-muted-foreground">{s.texto}</span>
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
