'use client'

import Link from 'next/link'
import { Scale } from 'lucide-react'
import { PaginaInformes } from '@/components/contabilidad/informes/PaginaInformes'
import { PESTANAS_PROVEEDORES } from '@/components/contabilidad/informes/definiciones'

/** Informes Proveedores (reemplaza Access "Informes Contables › Provedores"). */
export default function InformesProveedoresPage() {
    return (
        <PaginaInformes
            titulo="Informes Proveedores"
            descripcion="Cuenta corriente de proveedores, programa de pagos y detalle de compras por año."
            pestanas={PESTANAS_PROVEEDORES}
            aviso={
                <p className="text-sm text-muted-foreground">
                    <Scale className="inline h-4 w-4 mr-1 text-blue-600" />
                    El saldo de proveedores a una fecha de corte (SaldoProveedores / SaldoUnProveedor) está en{' '}
                    <Link href="/dashboard/reportes/saldo-proveedores" className="font-medium text-blue-700 underline dark:text-blue-400">
                        Saldo de Documentos por Pagar Proveedor
                    </Link>.
                </p>
            }
        />
    )
}
