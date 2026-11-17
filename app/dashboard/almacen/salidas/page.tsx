'use client'

import { NotaAlmacen } from "@/components/almacen/NotaAlmacen"

/** Almacén › Salidas (Access: SIE INVENTARIOS › Datos Movimientos › Salidas, incluye transferencias). */
export default function SalidasAlmacenPage() {
    return <NotaAlmacen tipo="salidas" />
}
