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
 *   - Al llegar con el teclado, el texto queda seleccionado: lo que se escribe reemplaza el valor,
 *     y la casilla da un pequeño "latido" azul para ver a dónde se pasó.
 *   - En un buscador con lista (Persona, Artículo, Cuenta...), Enter abre la lista; al elegir con
 *     Enter se pasa a la casilla siguiente. Escape cierra la lista y se queda en la casilla.
 *   - Autocompletado en línea, como los combos de Access: al escribir en una casilla de texto de la
 *     grilla, si en la misma columna ya hay un valor que empieza igual, se completa y la parte
 *     agregada queda seleccionada (seguir escribiendo la reemplaza; Retroceso la quita).
 *   - En un buscador con lista, escribir una letra lo abre y empieza a buscar con esa letra.
 *   - El foco no se pierde: la casilla activa se resalta y, si se re-dibuja la grilla (guardar,
 *     borrador, elegir en una lista, clic en un espacio vacío), el foco vuelve a la misma casilla.
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

// Casillas de texto que se autocompletan: texto libre (no importes, fechas ni códigos numéricos).
function autocompletable(el: HTMLElement): el is HTMLInputElement {
    if (el.tagName !== 'INPUT') return false
    const i = el as HTMLInputElement
    if (!['text', ''].includes(i.type) || i.readOnly || i.disabled) return false
    if (i.inputMode === 'decimal' || i.inputMode === 'numeric' || i.classList.contains('font-mono')) return false
    if (el.closest('[data-sin-autocompletar]')) return false
    return !!el.closest('td')
}

// Asigna el valor como si lo hubiera escrito el usuario (React se entera por el evento input).
const asignarValor = (el: HTMLInputElement, valor: string) => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    set?.call(el, valor)
    el.dispatchEvent(new Event('input', { bubbles: true }))
}

function enfocar(el: HTMLElement | undefined | null) {
    if (!el) return
    el.focus()
    // Efecto al pasar con el teclado: la casilla destino da un "latido" azul (ver globals.css)
    el.classList.remove('nav-salto'); void el.offsetWidth; el.classList.add('nav-salto')
    el.addEventListener('animationend', () => el.classList.remove('nav-salto'), { once: true })
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
        cont.setAttribute('data-nav-contable', '')

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

            // Buscador con lista: escribir una letra lo abre y busca con ella
            if (el.tagName === 'BUTTON' && e.key.length === 1 && e.key !== ' ' && el.getAttribute('aria-expanded') !== 'true') {
                e.preventDefault()
                celdaPendiente = el.closest('td') ?? el.parentElement
                const letra = e.key
                el.click()
                let intentos = 0
                const escribir = () => {
                    const a = document.activeElement as HTMLInputElement | null
                    if (a && a.tagName === 'INPUT' && !cont.contains(a)) { asignarValor(a, letra); return }
                    if (intentos++ < 15) setTimeout(escribir, 20)
                }
                setTimeout(escribir, 20)
                return
            }

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

        // ── Autocompletado en línea por columna (como Access) ──────────────────────────────
        const alEscribir = (e: Event) => {
            const ie = e as InputEvent
            const el = e.target as HTMLElement
            if (!ie.isTrusted || !ie.inputType?.startsWith('insert') || !autocompletable(el)) return
            const escrito = el.value
            if (!escrito || el.selectionStart !== escrito.length) return
            const td = el.closest('td')!, tr = el.closest('tr'), tbody = el.closest('tbody')
            if (!tr || !tbody) return
            const bajo = escrito.toLocaleLowerCase()
            // Valores de la misma columna, de la fila más cercana hacia arriba primero
            const filas = Array.from(tbody.rows), propia = filas.indexOf(tr as HTMLTableRowElement)
            const orden = [...filas.slice(0, propia).reverse(), ...filas.slice(propia + 1)]
            let sugerencia = ''
            for (const f of orden) {
                const c = f.cells[td.cellIndex]
                const otro = c?.querySelector('input') as HTMLInputElement | null
                const v = otro?.value?.trim() ?? ''
                if (v.length > escrito.length && v.toLocaleLowerCase().startsWith(bajo)) { sugerencia = v; break }
            }
            if (!sugerencia) return
            const completo = escrito + sugerencia.slice(escrito.length)
            asignarValor(el, completo)
            requestAnimationFrame(() => { try { el.setSelectionRange(escrito.length, completo.length) } catch { /* */ } })
        }

        // ── El foco no se pierde ─────────────────────────────────────────────────────────────
        // Se recuerda la última casilla (fila y columna) y, si el foco cae al <body> (la casilla se
        // re-dibujó, se cerró una lista o se hizo clic en un espacio vacío), vuelve a esa posición.
        let ultima: { fila: number; col: number; idx: number } | null = null
        const posicion = (el: HTMLElement) => {
            const td = el.closest('td'), tr = el.closest('tr') as HTMLTableRowElement | null
            if (!td || !tr || !tr.parentElement) return null
            const fila = Array.from(tr.parentElement.children).indexOf(tr)
            const idx = Array.from(td.querySelectorAll(SELECTOR)).indexOf(el)
            return { fila, col: td.cellIndex, idx: Math.max(0, idx) }
        }
        const alEntrarFoco = (e: FocusEvent) => {
            const el = e.target as HTMLElement
            if (el.matches?.(SELECTOR)) ultima = posicion(el) ?? ultima
        }
        const alSalirFoco = () => {
            setTimeout(() => {
                const a = document.activeElement
                if (!ultima || !cont.isConnected || (a && a !== document.body)) return
                if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return
                const tbody = cont.querySelector('tbody')
                const tr = tbody?.children[Math.min(ultima.fila, (tbody?.children.length ?? 1) - 1)] as HTMLTableRowElement | undefined
                const celda = tr?.cells[ultima.col]
                const destino = celda && (Array.from(celda.querySelectorAll(SELECTOR)).filter(esEditable)[ultima.idx]
                    ?? Array.from(celda.querySelectorAll(SELECTOR)).find(esEditable)) as HTMLElement | undefined
                if (destino) destino.focus({ preventScroll: true })
            }, 60)
        }

        cont.addEventListener('keydown', alTeclear)
        cont.addEventListener('focusin', alEnfocar)
        cont.addEventListener('input', alEscribir)
        cont.addEventListener('focusin', alEntrarFoco)
        cont.addEventListener('focusout', alSalirFoco)
        document.addEventListener('keydown', alEscape, true)
        document.addEventListener('mousedown', alClic, true)
        return () => {
            cont.removeEventListener('keydown', alTeclear)
            cont.removeEventListener('focusin', alEnfocar)
            cont.removeEventListener('input', alEscribir)
            cont.removeEventListener('focusin', alEntrarFoco)
            cont.removeEventListener('focusout', alSalirFoco)
            cont.removeAttribute('data-nav-contable')
            document.removeEventListener('keydown', alEscape, true)
            document.removeEventListener('mousedown', alClic, true)
        }
    }, [ref, opciones.activo])
}
