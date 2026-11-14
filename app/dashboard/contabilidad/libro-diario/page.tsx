'use client'

import { PaginaInformes } from '@/components/contabilidad/informes/PaginaInformes'
import { PESTANAS_DIARIO } from '@/components/contabilidad/informes/definiciones'

/** Libro Diario (reemplaza Informes Contables › Diario de Access: DiarioGeneral, DiarioMes, RevisionAsientos, DiarioSimplificado). */
export default function LibroDiarioPage() {
    return (
        <PaginaInformes
            titulo="Informes Libro Diario"
            descripcion="Libro Diario General del año o del mes, revisión de asientos que no cuadran y Diario Simplificado. Los libros electrónicos 5.1 y 5.3 están en la página PLE."
            pestanas={PESTANAS_DIARIO}
        />
    )
}
