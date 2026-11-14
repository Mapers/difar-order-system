'use client'

import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { PaginaInformes } from '@/components/contabilidad/informes/PaginaInformes'
import { PESTANAS_CUENTAS } from '@/components/contabilidad/informes/definiciones'

/** Cuentas Contables (reemplaza Informes Contables › CtasContables de Access: SaldosCuentas y SumasMayor). */
export default function CuentasContablesPage() {
    return (
        <PaginaInformes
            titulo="Informes Cuentas Contables"
            descripcion="Saldos de las cuentas a una fecha de corte y sumas del mayor por mes."
            pestanas={PESTANAS_CUENTAS}
            aviso={
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5 shrink-0" />
                    Los botones SubCuentaPorAño y SubCuentaPorMes de Access están en
                    <Link href="/dashboard/contabilidad/movimiento-subcuenta" className="font-medium text-blue-600 hover:underline">Movimiento de Sub Cuenta</Link>.
                </p>
            }
        />
    )
}
