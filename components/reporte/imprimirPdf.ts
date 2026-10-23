/**
 * Abre el cuadro de impresión del navegador con el PDF ya cargado, para elegir
 * la impresora sin pasar por otra pestaña. La página no puede listar ni elegir
 * impresoras por su cuenta: eso lo decide el usuario en ese cuadro.
 *
 * En celulares el navegador no imprime un PDF incrustado, así que ahí se abre
 * en otra pestaña (desde donde se comparte o imprime).
 */
export function imprimirPdf(url: string) {
    const esTactil = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches
    if (esTactil) {
        window.open(url, '_blank')
        return
    }

    document.getElementById('marco-impresion-pdf')?.remove()
    const marco = document.createElement('iframe')
    marco.id = 'marco-impresion-pdf'
    // Fuera de la vista pero no con display:none: Chrome no imprime un visor de PDF oculto así.
    marco.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none'
    marco.src = url
    marco.onload = () => {
        // Un momento para que el visor de PDF termine de cargar antes de imprimir.
        setTimeout(() => {
            try {
                marco.contentWindow?.focus()
                marco.contentWindow?.print()
            } catch {
                window.open(url, '_blank')
            }
        }, 400)
    }
    document.body.appendChild(marco)
}
