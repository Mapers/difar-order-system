'use client'

import { PaginaInformes } from '@/components/contabilidad/informes/PaginaInformes'
import { PESTANAS_VENTAS } from '@/components/contabilidad/informes/definiciones'

/** Informes Registro de Ventas (reemplaza el menú Access "INFORMES REGISTRO DE VENTAS"). */
export default function InformesRegistroVentasPage() {
    return (
        <PaginaInformes
            titulo="Informes Registro de Ventas"
            descripcion="Registro de ventas por mes, boletas resumidas, correlativos, guías facturadas y ventas del año."
            pestanas={PESTANAS_VENTAS}
        />
    )
}
