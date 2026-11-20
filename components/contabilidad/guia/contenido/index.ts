import { CaminoGuia, PantallaGuia } from "../tipos"
import * as cobranza from "./cobranza"
import * as movimientos from "./movimientos"
import * as libros from "./libros"
import * as informes from "./informes"
import * as maestros from "./maestros"

const grupos = [cobranza, movimientos, libros, informes, maestros]

export const PANTALLAS: PantallaGuia[] = grupos.flatMap(g => g.pantallas)
export const CAMINOS: CaminoGuia[] = grupos.flatMap(g => g.caminos)

/** Rutas donde se ofrece la guía (todo Contabilidad y las dos pantallas suyas que viven fuera de /contabilidad). */
export function esRutaContable(ruta: string): boolean {
    return ruta.startsWith("/dashboard/contabilidad")
        || ruta.startsWith("/dashboard/recibo-cuenta-cliente")
        || ruta.startsWith("/dashboard/reportes/saldo-proveedores")
}

export function pantallaDe(ruta: string): PantallaGuia | undefined {
    const limpia = ruta.replace(/\/$/, "")
    return PANTALLAS.find(p => p.ruta === limpia)
}
