'use client'

import { PaginaInformes } from '@/components/contabilidad/informes/PaginaInformes'
import { PESTANAS_EEFF } from '@/components/contabilidad/informes/definiciones'

/** Estados Financieros (reemplaza Informes Contables › InventBalances de Access). */
export default function EstadosFinancierosPage() {
    return (
        <PaginaInformes
            titulo="Inventarios y Balances"
            descripcion="Balance General, Ganancias y Pérdidas (mes y anual), Balances de Comprobación, Flujo de Efectivo y Cambios en el Patrimonio."
            pestanas={PESTANAS_EEFF}
        />
    )
}
