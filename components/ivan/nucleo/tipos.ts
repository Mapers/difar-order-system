import type { Cotizacion } from '@/components/ivan/CotizacionCard'

export interface OpcionIvan {
    codigo?: string
    ruc?: string
    nombre?: string
    nombre_comercial?: string
    producto?: string
    presentacion?: string
}

/** Botón de siguiente paso que propone IVAN. */
export type AccionIvan =
    | { tipo: 'preguntar'; etiqueta: string; texto: string; icono?: string }
    | { tipo: 'abrir'; etiqueta: string; ruta: string; icono?: string }
    | { tipo: 'pdf'; etiqueta: string; numero: string; icono?: string }

/** Tabla de datos de una consulta, exportable a Excel y PDF. */
export interface ColumnaTabla {
    k: string
    t: string
    tipo: 'texto' | 'moneda' | 'numero' | 'fecha'
}

export interface TablaIvan {
    herramienta: string
    titulo: string
    subtitulo?: string
    columnas: ColumnaTabla[]
    filas: Record<string, unknown>[]
    totales?: Record<string, unknown>
}

/** Una consulta que IVAN está haciendo o ya hizo en este mensaje. */
export interface ConsultaIvan {
    nombre: string
    etiqueta: string
    pasos: string[]
    terminada: boolean
}

export type EstadoMensaje = 'pensando' | 'consultando' | 'escribiendo' | 'listo' | 'error' | 'detenido'

export interface Mensaje {
    id: string
    rol: 'user' | 'ivan'
    texto: string
    estado?: EstadoMensaje
    consultas?: ConsultaIvan[]
    opciones?: OpcionIvan[]
    cotizacion?: Cotizacion
    acciones?: AccionIvan[]
    tablas?: TablaIvan[]
    /** Qué consultó IVAN y con qué parámetros (vuelve en el historial). */
    contexto?: { herramienta: string; parametros: Record<string, unknown> }[]
}

/** Eventos que llegan del backend (/api/ivan/stream). */
export type EventoIvan =
    | { type: 'token'; content: string }
    | { type: 'tool'; name: string; etiqueta: string; pasos?: string[] }
    | { type: 'tool_fin'; name: string }
    | { type: 'opciones'; opciones: OpcionIvan[] }
    | { type: 'cotizacion'; cotizacion: Cotizacion }
    | { type: 'acciones'; acciones: AccionIvan[] }
    | { type: 'tabla'; tabla: TablaIvan }
    | { type: 'contexto'; consultas: { herramienta: string; parametros: Record<string, unknown> }[] }
    | { type: 'done' }
    | { type: 'error'; content: string }
