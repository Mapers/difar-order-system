/**
 * Borradores en el servidor (18/11/2026): lógica pura, sin React, para poder probarla sola.
 *
 * Solo se guardan los CAMBIOS respecto de lo que había en la base al abrir el documento:
 *   nueva     -> línea que aún no existe (id = null)
 *   editada   -> línea existente con algún campo distinto
 *   eliminada -> línea existente marcada con E (aunque además se haya editado)
 * Cada cambio sobre una línea existente lleva `base` (cómo estaba en la base) para detectar, al recuperar,
 * si otra persona la cambió o la borró mientras tanto. En ese caso NO se pisa: se avisa como conflicto.
 */
export type AccionBorrador = 'nueva' | 'editada' | 'eliminada'

export interface FilaConId {
    id: number | null
    key: number
    eliminar: boolean
}

export interface LineaBorrador<T> {
    orden?: number
    accion: AccionBorrador
    id: number | null
    datos: T
    base?: T | null
    actualizado?: string
}

export interface ConflictoBorrador<T> {
    tipo: 'ya-no-existe' | 'cambio-en-la-base'
    linea: LineaBorrador<T>
}

export interface ResumenBorrador { nuevas: number; editadas: number; eliminadas: number }

const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** Cambios de `actuales` frente a `base` (lo que había en la base al abrir). */
export function calcularCambios<T extends FilaConId>(base: T[], actuales: T[], comparable: (f: T) => unknown): LineaBorrador<T>[] {
    const porId = new Map(base.filter(b => b.id != null).map(b => [b.id as number, b]))
    const cambios: LineaBorrador<T>[] = []
    for (const f of actuales) {
        if (f.id == null) {
            cambios.push({ accion: 'nueva', id: null, datos: f })
            continue
        }
        const b = porId.get(f.id)
        if (!b) continue // no debería pasar: toda línea con id vino de la base
        if (f.eliminar && !b.eliminar) cambios.push({ accion: 'eliminada', id: f.id, datos: f, base: b })
        else if (!igual(comparable(f), comparable(b))) cambios.push({ accion: 'editada', id: f.id, datos: f, base: b })
    }
    return cambios.map((c, i) => ({ ...c, orden: i + 1 }))
}

export function resumir<T>(lineas: LineaBorrador<T>[]): ResumenBorrador {
    return {
        nuevas: lineas.filter(l => l.accion === 'nueva').length,
        editadas: lineas.filter(l => l.accion === 'editada').length,
        eliminadas: lineas.filter(l => l.accion === 'eliminada').length,
    }
}

/**
 * Aplica un borrador sobre lo que hay HOY en la base.
 * - nueva: se agrega al final con una key negativa nueva.
 * - editada / eliminada: solo si la línea sigue existiendo y nadie la cambió desde que se hizo el borrador.
 *   Si no, queda como conflicto y se conserva lo de la base.
 */
export function aplicarBorrador<T extends FilaConId>(
    actualesBD: T[],
    lineas: LineaBorrador<T>[],
    comparable: (f: T) => unknown,
    primeraKeyLibre: number,
): { filas: T[]; conflictos: ConflictoBorrador<T>[]; proximaKey: number; aplicado: ResumenBorrador; yaGrabadas: number } {
    const filas = actualesBD.map(f => ({ ...f }))
    const conflictos: ConflictoBorrador<T>[] = []
    const aplicado: ResumenBorrador = { nuevas: 0, editadas: 0, eliminadas: 0 }
    let yaGrabadas = 0
    let key = Math.min(primeraKeyLibre, -1, ...filas.map(f => f.key - 1))
    const sinId = (f: T) => { const c = comparable(f); return c && typeof c === 'object' ? { ...(c as object), id: null } : c }
    // Líneas de la base que ya "explican" una línea nueva del borrador (para no duplicarla)
    const usadas = new Set<number>()

    for (const l of [...lineas].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))) {
        if (l.accion === 'nueva') {
            // Si "Guardar" grabó pero el borrador no alcanzó a borrarse, la línea ya está en la base: no se duplica.
            const yaEsta = actualesBD.find(f => f.id != null && !usadas.has(f.id) && igual(sinId(f), sinId(l.datos)))
            if (yaEsta) { usadas.add(yaEsta.id as number); yaGrabadas++; continue }
            filas.push({ ...l.datos, id: null, key, eliminar: !!l.datos?.eliminar } as T)
            key -= 1
            aplicado.nuevas++
            continue
        }
        const i = filas.findIndex(f => f.id === l.id)
        if (i < 0) { conflictos.push({ tipo: 'ya-no-existe', linea: l }); continue }
        // La base ya tiene exactamente lo del borrador (se grabó): nada que hacer.
        if (igual(comparable(filas[i]), comparable(l.datos))) { yaGrabadas++; continue }
        if (!l.base || !igual(comparable(filas[i]), comparable(l.base))) { conflictos.push({ tipo: 'cambio-en-la-base', linea: l }); continue }
        filas[i] = { ...l.datos, id: filas[i].id, key: filas[i].key }
        if (l.accion === 'eliminada') aplicado.eliminadas++
        else aplicado.editadas++
    }
    return { filas, conflictos, proximaKey: key, aplicado, yaGrabadas }
}

/** Campos de cabecera: aplica solo los que cambió el usuario y nadie más tocó. */
export function aplicarCabecera<C extends Record<string, unknown>>(
    actualBD: C, borrador: C, baseBorrador: C | null,
): { cabecera: C; conflictos: string[] } {
    if (!baseBorrador) return { cabecera: { ...actualBD, ...borrador }, conflictos: [] }
    const cabecera = { ...actualBD }
    const conflictos: string[] = []
    for (const k of Object.keys(borrador) as (keyof C)[]) {
        if (igual(borrador[k], baseBorrador[k])) continue // el usuario no lo cambió
        if (!igual(actualBD[k], baseBorrador[k])) { conflictos.push(String(k)); continue } // alguien más lo cambió
        cabecera[k] = borrador[k]
    }
    return { cabecera, conflictos }
}
