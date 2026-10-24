import type { AccionIvan } from '../nucleo/tipos'

/** Lo que una acción puede hacer en la aplicación. */
export interface DependenciasAccion {
    enviar: (texto: string) => void
    navegar: (ruta: string) => void
    verPdf: (numeroComprobante: string) => void
}

type Ejecutor = (accion: AccionIvan, deps: DependenciasAccion) => void

/**
 * Qué hace cada tipo de botón (patrón comando). Un tipo nuevo de acción se
 * agrega con registrarAccion sin tocar los componentes.
 */
const EJECUTORES = new Map<AccionIvan['tipo'], Ejecutor>([
    ['preguntar', (a, d) => { if (a.tipo === 'preguntar') d.enviar(a.texto) }],
    ['abrir', (a, d) => { if (a.tipo === 'abrir') d.navegar(a.ruta) }],
    ['pdf', (a, d) => { if (a.tipo === 'pdf') d.verPdf(a.numero) }],
])

export function registrarAccion(tipo: AccionIvan['tipo'], ejecutor: Ejecutor) {
    EJECUTORES.set(tipo, ejecutor)
}

export function ejecutarAccion(accion: AccionIvan, deps: DependenciasAccion) {
    EJECUTORES.get(accion.tipo)?.(accion, deps)
}
