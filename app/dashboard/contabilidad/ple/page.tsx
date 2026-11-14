'use client'

import { PaginaArchivosSunat } from '@/components/contabilidad/informes/PaginaArchivosSunat'
import { ARCHIVOS_PLE } from '@/components/contabilidad/informes/definiciones'

/** PLE - Libros Electrónicos (reemplaza el botón "PLE" de Access y el botón LibroElectronico de Diario y Mayor). */
export default function PlePage() {
    return (
        <PaginaArchivosSunat
            titulo="PLE - Libros Electrónicos"
            descripcion="Archivos TXT del Registro de Ventas (14.1), del Registro de Compras (8.1 y 8.2), del Libro Diario (5.1 y 5.3) y del Libro Mayor (6.1) para el PLE de SUNAT."
            archivos={ARCHIVOS_PLE}
        />
    )
}
