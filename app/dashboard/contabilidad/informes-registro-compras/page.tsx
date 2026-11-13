'use client'

import { PaginaInformes } from '@/components/contabilidad/informes/PaginaInformes'
import { PESTANAS_COMPRAS } from '@/components/contabilidad/informes/definiciones'

/** Informes Registro de Compras (reemplaza el menú Access "INFORMES REGISTRO DE COMPRAS"). */
export default function InformesRegistroComprasPage() {
    return (
        <PaginaInformes
            titulo="Informes Registro de Compras"
            descripcion="Registro de compras en soles y dólares, percepciones, pendientes de SIRE y compras del año."
            pestanas={PESTANAS_COMPRAS}
        />
    )
}
