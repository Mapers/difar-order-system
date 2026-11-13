'use client'

import { PaginaArchivosSunat } from '@/components/contabilidad/informes/PaginaArchivosSunat'
import { ARCHIVOS_SIRE } from '@/components/contabilidad/informes/definiciones'

/** SIRE - Ventas y Compras (reemplaza los botones SIREanexo03, 11, 12 y 8 de Access). */
export default function SirePage() {
    return (
        <PaginaArchivosSunat
            titulo="SIRE - Ventas y Compras"
            descripcion="Archivos de reemplazo de las propuestas SIRE: ventas (anexo 03) y compras (anexos 11, 12 y 8)."
            archivos={ARCHIVOS_SIRE}
        />
    )
}
