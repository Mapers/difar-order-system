'use client'

import { PaginaInformes } from '@/components/contabilidad/informes/PaginaInformes'
import { PESTANAS_MAYOR } from '@/components/contabilidad/informes/definiciones'

/** Libro Mayor (reemplaza Informes Contables › Mayor de Access: PorAño, PorMes, ResumenAño, ResumenAñoCtasPrincipales, Revisa). */
export default function LibroMayorPage() {
    return (
        <PaginaInformes
            titulo="Informes Libro Mayor"
            descripcion="Mayor auxiliar por año o por mes, resúmenes por sub cuenta y por cuenta principal, y revisión de documentos que no cuadran. El libro electrónico 6.1 está en la página PLE."
            pestanas={PESTANAS_MAYOR}
        />
    )
}
