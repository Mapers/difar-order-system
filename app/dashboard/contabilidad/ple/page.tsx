'use client'

import { PaginaArchivosSunat } from '@/components/contabilidad/informes/PaginaArchivosSunat'
import { ARCHIVOS_PLE } from '@/components/contabilidad/informes/definiciones'

/** PLE - Libros Electrónicos (reemplaza el botón "PLE" de Access, que generaba los 3 archivos). */
export default function PlePage() {
    return (
        <PaginaArchivosSunat
            titulo="PLE - Libros Electrónicos"
            descripcion="Archivos TXT del Registro de Ventas (14.1) y del Registro de Compras (8.1 y 8.2) para el PLE de SUNAT."
            archivos={ARCHIVOS_PLE}
        />
    )
}
