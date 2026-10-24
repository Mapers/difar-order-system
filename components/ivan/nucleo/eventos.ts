import type { EventoIvan, Mensaje } from './tipos'

/**
 * Cómo cambia la respuesta de IVAN con cada evento (una estrategia por tipo).
 * Para soportar un evento nuevo basta con agregar su función aquí.
 */
type Aplicar<T extends EventoIvan['type']> = (m: Mensaje, e: Extract<EventoIvan, { type: T }>) => Mensaje

const ESTRATEGIAS: { [T in EventoIvan['type']]: Aplicar<T> } = {
    token: (m, e) => ({ ...m, texto: m.texto + e.content, estado: 'escribiendo' }),
    tool: (m, e) => ({
        ...m,
        estado: 'consultando',
        consultas: [...(m.consultas ?? []), { nombre: e.name, etiqueta: e.etiqueta, pasos: e.pasos ?? [], terminada: false }],
    }),
    tool_fin: (m, e) => {
        const consultas = [...(m.consultas ?? [])]
        const i = consultas.findIndex(c => c.nombre === e.name && !c.terminada)
        if (i >= 0) consultas[i] = { ...consultas[i], terminada: true }
        return { ...m, consultas }
    },
    opciones: (m, e) => ({ ...m, opciones: e.opciones }),
    cotizacion: (m, e) => ({ ...m, cotizacion: e.cotizacion }),
    acciones: (m, e) => ({ ...m, acciones: e.acciones }),
    tabla: (m, e) => ({ ...m, tablas: [...(m.tablas ?? []), e.tabla] }),
    done: (m) => ({ ...m, estado: 'listo' }),
    error: (m, e) => ({ ...m, texto: e.content, estado: 'error' }),
}

export function aplicarEvento(mensaje: Mensaje, evento: EventoIvan): Mensaje {
    const estrategia = ESTRATEGIAS[evento.type] as Aplicar<typeof evento.type> | undefined
    return estrategia ? estrategia(mensaje, evento as never) : mensaje
}
