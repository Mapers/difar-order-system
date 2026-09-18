import { useCallback, useEffect, useRef } from 'react'

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
    /** Se llama cada vez que un guardado automático termina bien (ej: avisarle al usuario con un toast). */
    onSaved?: () => void
}

/**
 * Guardado del borrador del tomador de pedidos al detectar que la pestaña
 * se va a segundo plano (minimizar, cambiar de app, contestar una llamada,
 * apagar pantalla, cerrar la pestaña).
 *
 * Antes esto guardaba con un debounce de 1.5s tras cada cambio. El problema:
 * en el celular, apenas la pestaña pasa a segundo plano el navegador frena o
 * congela los temporizadores, así que ese debounce muchas veces no llegaba a
 * dispararse — la última acción del pedido se perdía igual. Ahora, en lugar
 * de esperar un tiempo fijo, se escucha directamente el momento en que el
 * navegador oculta la pestaña (evento `visibilitychange` / `pagehide`, la
 * Page Visibility API) y se guarda ahí mismo, sin esperar nada.
 *
 * Dos cosas que no son obvias y por las que sigue existiendo este hook:
 *
 * 1. Compara el JSON serializado del estado contra el último guardado, para
 *    no mandar un PUT si no hay nada nuevo que persistir.
 *
 * 2. Serializa los envíos (inFlight): si el usuario oculta y vuelve a
 *    mostrar la pestaña rápido, dos guardados no deben pisarse fuera de
 *    orden.
 */
export function useAutoSaveDraft<T>({
    state,
    enabled,
    draftId,
    upsert,
    onCreated,
    onSaved,
}: UseAutoSaveDraftArgs<T>) {
    const lastSaved  = useRef<string | null>(null)
    const inFlight    = useRef(false)
    const cancelado    = useRef(false)

    // Refs para leer los valores frescos dentro del listener sin tener que
    // reprogramarlo cada vez que cambia algo.
    const upsertRef    = useRef(upsert)
    const onCreatedRef = useRef(onCreated)
    const onSavedRef   = useRef(onSaved)
    const stateRef      = useRef(state)
    const draftIdRef    = useRef(draftId)
    const enabledRef    = useRef(enabled)
    upsertRef.current    = upsert
    onCreatedRef.current = onCreated
    onSavedRef.current   = onSaved
    stateRef.current     = state
    draftIdRef.current   = draftId
    enabledRef.current   = enabled

    const guardarAhora = useCallback(async () => {
        if (cancelado.current || !enabledRef.current || inFlight.current) return
        const json = JSON.stringify(stateRef.current)
        if (lastSaved.current === json) return

        inFlight.current = true
        try {
            const id = await upsertRef.current(draftIdRef.current, stateRef.current)
            if (id) {
                lastSaved.current = json
                // Comparar contra el id vigente, no solo chequear que había uno:
                // si el borrador desapareció y upsert lo recreó, el id cambió y
                // hay que propagarlo.
                if (id !== draftIdRef.current) onCreatedRef.current(id)
                onSavedRef.current?.()
            }
        } finally {
            inFlight.current = false
        }
    }, [])

    useEffect(() => {
        const onHidden = () => {
            if (document.visibilityState === 'hidden') guardarAhora()
        }
        document.addEventListener('visibilitychange', onHidden)
        // pagehide cubre el caso en que la pestaña se cierra directamente,
        // sin pasar antes por "hidden" (algunos navegadores móviles).
        window.addEventListener('pagehide', guardarAhora)
        return () => {
            document.removeEventListener('visibilitychange', onHidden)
            window.removeEventListener('pagehide', guardarAhora)
            // OJO: a propósito NO se guarda acá en el cleanup del efecto.
            // Este efecto se re-ejecuta en CUALQUIER remount del componente
            // (navegar a otra sección y volver, hot-reload en desarrollo,
            // etc.), y draftId vive en useState del componente — se resetea
            // a null en cada remount. Guardar acá con draftId en null creaba
            // un borrador NUEVO en cada remount en vez de actualizar el que
            // ya existía, y los borradores se iban acumulando.
        }
    }, [guardarAhora])

    /**
     * Marca un estado como ya persistido sin llamar a la API.
     * Se usa al cargar un borrador: lo que se acaba de traer de la BD no hay
     * que volver a mandarlo.
     */
    const markSaved = (s: T) => {
        lastSaved.current = JSON.stringify(s)
    }

    /** Corta cualquier guardado futuro (ej: el pedido ya se confirmó). */
    const cancel = () => {
        cancelado.current = true
    }

    return { markSaved, cancel, guardarAhora }
}
