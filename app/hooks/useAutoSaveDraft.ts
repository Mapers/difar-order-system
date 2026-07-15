import { useEffect, useRef } from 'react'

interface UseAutoSaveDraftArgs<T> {
    /** Estado a persistir. Se serializa para detectar cambios reales. */
    state: T
    /** Mientras sea false no se guarda nada (ej: todavía no hay cliente). */
    enabled: boolean
    /** Id del borrador vigente, o null si aún no se creó. */
    draftId: string | null
    /** Crea o pisa. Debe devolver el id vigente, o null si falló. */
    upsert: (id: string | null, state: T) => Promise<string | null>
    /** Se llama con el id la primera vez que se crea el borrador. */
    onCreated: (id: string) => void
    /** ms de espera tras el último cambio. */
    delay?: number
}

/**
 * Autoguardado con debounce para el tomador de pedidos.
 *
 * Tres cosas que no son obvias y por las que este hook existe:
 *
 * 1. Compara el JSON serializado, no la referencia. getOrderStateForDraft()
 *    devuelve un objeto nuevo en cada render, así que un useEffect sobre el
 *    objeto dispararía en cada render aunque nada haya cambiado.
 *
 * 2. Guarda una firma del estado ya persistido (lastSaved). Sirve para no
 *    re-guardar un borrador recién cargado, que es idéntico a lo que está
 *    en la BD.
 *
 * 3. Serializa los envíos (inFlight). Sin eso, dos PUT concurrentes pueden
 *    llegar fuera de orden y dejar guardado un estado viejo.
 */
export function useAutoSaveDraft<T>({
    state,
    enabled,
    draftId,
    upsert,
    onCreated,
    delay = 1500,
}: UseAutoSaveDraftArgs<T>) {
    const lastSaved = useRef<string | null>(null)
    const inFlight  = useRef(false)
    const pending   = useRef<string | null>(null)
    const timer     = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Refs para leer los valores frescos dentro del timeout sin reprogramarlo
    // cada vez que cambia una función.
    const upsertRef    = useRef(upsert)
    const onCreatedRef = useRef(onCreated)
    const stateRef     = useRef(state)
    const draftIdRef   = useRef(draftId)
    upsertRef.current    = upsert
    onCreatedRef.current = onCreated
    stateRef.current     = state
    draftIdRef.current   = draftId

    const json = JSON.stringify(state)

    useEffect(() => {
        if (!enabled) return
        if (lastSaved.current === json) return

        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(async () => {
            if (inFlight.current) {
                // Ya hay un guardado en vuelo: lo dejamos anotado y el propio
                // guardado en curso se encarga al terminar.
                pending.current = json
                return
            }

            const run = async (snapshot: string) => {
                inFlight.current = true
                try {
                    const id = await upsertRef.current(draftIdRef.current, stateRef.current)
                    if (id) {
                        lastSaved.current = snapshot
                        // Comparar contra el id vigente, no solo chequear que
                        // había uno: si el borrador desapareció y upsert lo
                        // recreó, el id cambió y hay que propagarlo. Con un
                        // `if (!draftIdRef.current)` el id viejo quedaría fijo
                        // y cada autoguardado recrearía el borrador de nuevo.
                        if (id !== draftIdRef.current) onCreatedRef.current(id)
                    }
                } finally {
                    inFlight.current = false
                }
                // Si entró un cambio mientras guardábamos, lo persistimos ahora.
                if (pending.current && pending.current !== lastSaved.current) {
                    const next = pending.current
                    pending.current = null
                    await run(next)
                }
            }

            await run(json)
        }, delay)

        return () => {
            if (timer.current) clearTimeout(timer.current)
        }
    }, [json, enabled, delay])

    /**
     * Marca un estado como ya persistido sin llamar a la API.
     * Se usa al cargar un borrador: lo que se acaba de traer de la BD no hay
     * que volver a mandarlo.
     */
    const markSaved = (s: T) => {
        lastSaved.current = JSON.stringify(s)
    }

    /** Corta cualquier guardado pendiente (ej: el pedido ya se confirmó). */
    const cancel = () => {
        if (timer.current) clearTimeout(timer.current)
        pending.current = null
    }

    return { markSaved, cancel }
}
