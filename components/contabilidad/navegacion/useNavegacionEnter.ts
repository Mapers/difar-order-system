"use client"

import { RefObject, useEffect, useRef } from "react"

/**
 * Navegación con teclado en los formularios y grillas de Contabilidad (pedido de los usuarios, 19/11/2026),
 * igual que en Access:
 *   - Enter:        pasa a la siguiente casilla editable (salta las bloqueadas o de solo lectura).
 *   - Shift+Enter:  vuelve a la casilla anterior.
 *   - Enter en la última casilla de la última línea: llama a `alFinal` (agrega una línea nueva si la
 *                   última tiene datos) y se para en la primera casilla de la línea nueva.
 *   - ↑ / ↓ en una casilla de texto o número de la grilla: misma columna, línea de arriba o de abajo.
 *   - Al llegar con el teclado, el texto queda seleccionado: lo que se escribe reemplaza el valor.
 *   - En un buscador con lista (Persona, Artículo, Cuenta...), Enter abre la lista; al elegir con
 *     Enter se pasa a la casilla siguiente. Escape cierra la lista y se queda en la casilla.
 * Tab y el mouse siguen funcionando igual.
 *
 * Escucha en el DOM (no con onKeyDown de React): así las teclas dentro de las listas desplegables,
 * que se dibujan fuera del contenedor (portal), no llegan aquí.
 */

const SELECTOR = 'input, select, textarea, button[aria-haspopup]'
const TIPOS_SIN_NAVEGAR = new Set(['checkbox', 'radio', 'hidden', 'file', 'button', 'submit', 'reset', 'range', 'color'])

function esEditable(el: Element): el is HTMLElement {
    const h = el as HTMLInputElement
    if (h.disabled || h.readOnly) return false
    if (el.tagName === 'INPUT' && TIPOS_SIN_NAVEGAR.has(h.type)) return false
    if (el.getAttribute('aria-disabled') === 'true' || el.closest('[data-sin-enter]')) return false
    // Visible: descarta las tarjetas de móvil ocultas y las secciones plegadas
    return (el as HTMLElement).getClientRects().length > 0
}

function casillas(cont: HTMLElement): HTMLElement[] {
    return Array.from(cont.querySelectorAll(SELECTOR)).filter(esEditable)
}

function enfocar(el: HTMLElement | undefined | null) {
    if (!el) return
    el.focus()
    if (el instanceof HTMLInputElement && ['text', 'number', 'search', 'tel', 'email', ''].includes(el.type)) {
        try { el.select() } catch { /* number en algunos navegadores */ }
    }
    el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
}

export interface OpcionesNavegacion {
    /** Enter al final de la última línea. Devuelve true si agregó una línea nueva. */
    alFinal?: () => boolean
    activo?: boolean
}

export function useNavegacionEnter(ref: RefObject<HTMLElement | null>, opciones: OpcionesNavegacion = {}) {
    const opts = useRef(opciones)
    opts.current = opciones

    useEffect(() => {
        const cont = ref.current
        if (!cont || opciones.activo === false) return

        // Buscador abierto con Enter: al cerrarse eligiendo, se avanza a la casilla siguiente.
        let celdaPendiente: Element | null = null

        const siguienteDe = (el: HTMLElement, paso: 1 | -1) => {
            const lista = casillas(cont)
            let i = lista.indexOf(el)
            if (i < 0) {
                // El disparador del buscador puede haberse re-dibujado: tomar su celda
                const celda = el.closest('td') ?? el.parentElement
                i = lista.findIndex(x => celda?.contains(x))
            }
            return { lista, i, destino: i >= 0 ? lista[i + paso] : undefined }
        }

        const enfocarNuevaLinea = (filasAntes: number) => {
            let intentos = 0
            const probar = () => {
                const filas = cont.querySelectorAll('tbody tr')
                if (filas.length > filasAntes) {
                    const nueva = filas[filas.length - 1]
                    enfocar(Array.from(nueva.querySelectorAll(SELECTOR)).find(esEditable) as HTMLElement | undefined)
                } else if (intentos++ < 10) {
                    setTimeout(probar, 16)
                }
            }
            setTimeout(probar, 16)
        }

        const alTeclear = (e: KeyboardEvent) => {
            const el = e.target as HTMLElement
            if (!el || !cont.contains(el) || e.defaultPrevented || e.isComposing) return
            if (e.altKey || e.ctrlKey || e.metaKey) return
            if (!el.matches(SELECTOR) || !esEditable(el)) return

            if (e.key === 'Enter') {
                if (el.tagName === 'TEXTAREA' && !e.shiftKey) return // en textos largos, Enter es salto de línea
                if (el.tagName === 'BUTTON') {
                    // Buscador con lista: Enter lo abre (comportamiento normal del botón)
                    if (!e.shiftKey) { celdaPendiente = el.closest('td') ?? el.parentElement; return }
                }
                e.preventDefault()
                const { lista, i, destino } = siguienteDe(el, e.shiftKey ? -1 : 1)
                if (destino) { enfocar(destino); return }
                if (!e.shiftKey && i === lista.length - 1 && el.closest('tbody tr') && opts.current.alFinal) {
                    const filasAntes = cont.querySelectorAll('tbody tr').length
                    if (opts.current.alFinal()) enfocarNuevaLinea(filasAntes)
                }
                return
            }

            if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && el.tagName === 'INPUT' && (el as HTMLInputElement).type !== 'date') {
                const td = el.closest('td'), tr = el.closest('tr')
                if (!td || !tr) return
                e.preventDefault() // en los importes, la flecha ya no suma ni resta 1
                const col = td.cellIndex
                let fila = (e.key === 'ArrowDown' ? tr.nextElementSibling : tr.previousElementSibling) as HTMLTableRowElement | null
                while (fila) {
                    const celda = fila.cells[col]
                    const destino = celda && Array.from(celda.querySelectorAll(SELECTOR)).find(esEditable) as HTMLElement | undefined
                    if (destino) { enfocar(destino); return }
                    fila = (e.key === 'ArrowDown' ? fila.nextElementSibling : fila.previousElementSibling) as HTMLTableRowElement | null
                }
            }
        }

        // Al cerrarse la lista eligiendo con Enter, el foco vuelve al botón: entonces se avanza.
        const alEnfocar = (e: FocusEvent) => {
            const el = e.target as HTMLElement
            if (!celdaPendiente || !celdaPendiente.contains(el) || el.getAttribute('aria-expanded') === 'true') return
            celdaPendiente = null
            const { destino } = siguienteDe(el, 1)
            if (destino) setTimeout(() => enfocar(destino), 0)
        }

        // Escape en la lista o un clic fuera: no se avanza
        const alEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') celdaPendiente = null }
        const alClic = (e: MouseEvent) => {
            const t = e.target as HTMLElement
            if (celdaPendiente && !t.closest('[role="dialog"], [cmdk-root]')) celdaPendiente = null
        }

        cont.addEventListener('keydown', alTeclear)
        cont.addEventListener('focusin', alEnfocar)
        document.addEventListener('keydown', alEscape, true)
        document.addEventListener('mousedown', alClic, true)
        return () => {
            cont.removeEventListener('keydown', alTeclear)
            cont.removeEventListener('focusin', alEnfocar)
            document.removeEventListener('keydown', alEscape, true)
            document.removeEventListener('mousedown', alClic, true)
        }
    }, [ref, opciones.activo])
}
