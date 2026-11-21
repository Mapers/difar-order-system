import { CaminoGuia, PantallaGuia } from "../tipos"
import * as cobranza from "./cobranza"
import * as movimientos from "./movimientos"
import * as libros from "./libros"
import * as informes from "./informes"
import * as maestros from "./maestros"
import * as ventas from "./ventas"
import * as almacen from "./almacen"
import * as reportes from "./reportes"

const grupos = [cobranza, movimientos, libros, informes, maestros, ventas, almacen, reportes]

export const PANTALLAS: PantallaGuia[] = grupos.flatMap(g => g.pantallas)
export const CAMINOS: CaminoGuia[] = grupos.flatMap(g => g.caminos)

/** Pantallas sin guía a propósito: configuración, roles y usuarios. */
const SIN_GUIA = ["/dashboard/configuraciones", "/dashboard/roles", "/dashboard/usuarios"]

/** Rutas donde se ofrece la guía: todo el sistema (escritorio), menos configuración, roles y usuarios. */
export function esRutaContable(ruta: string): boolean {
    return ruta.startsWith("/dashboard") && !SIN_GUIA.some(r => ruta.startsWith(r))
}

/**
 * Pantallas donde el recorrido se abre solo la primera vez: las de Contabilidad, como siempre.
 * En el resto del sistema (pedidos, almacén, reportes...) se abre con el botón "IVAN te guía",
 * para no interrumpir a quien entra a trabajar.
 */
export function abreSola(ruta: string): boolean {
    return ruta.startsWith("/dashboard/contabilidad")
        || ruta.startsWith("/dashboard/recibo-cuenta-cliente")
        || ruta.startsWith("/dashboard/reportes/saldo-proveedores")
}

export function pantallaDe(ruta: string): PantallaGuia | undefined {
    const limpia = ruta.replace(/\/$/, "")
    return PANTALLAS.find(p => p.ruta === limpia)
}
