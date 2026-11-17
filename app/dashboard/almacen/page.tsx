'use client'

import Link from "next/link"
import { PackageMinus, PackagePlus } from "lucide-react"

/** Sección Almacén: entrada a Ingresos y Salidas (Access: SIE INVENTARIOS › Datos Movimientos). */
export default function AlmacenPage() {
    const opciones = [
        { href: '/dashboard/almacen/ingresos', titulo: 'Ingresos de Almacén', texto: 'Notas de ingreso: compras, ajustes de inventario y otros ingresos.', icono: PackagePlus },
        { href: '/dashboard/almacen/salidas', titulo: 'Salidas de Almacén', texto: 'Notas de egreso y transferencias entre almacenes.', icono: PackageMinus },
    ]
    return (
        <div className="grid gap-5 p-4 md:p-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Almacén</h1>
                <p className="text-sm text-muted-foreground md:text-base">Movimientos de inventario por almacén.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                {opciones.map(o => (
                    <Link key={o.href} href={o.href} className="flex items-start gap-3 rounded-xl border bg-background p-5 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40">
                        <o.icono className="mt-0.5 h-6 w-6 text-blue-600" />
                        <div><p className="font-semibold">{o.titulo}</p><p className="text-sm text-muted-foreground">{o.texto}</p></div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
