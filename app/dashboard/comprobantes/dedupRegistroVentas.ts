export function claveDocumento(serie: unknown, numero: unknown): string | null {
    const s = String(serie ?? '').trim().toUpperCase()
    const bruto = String(numero ?? '').trim()
    if (!s || !bruto) return null

    const n = bruto.replace(/^0+/, '') || '0'
    return `${s}-${n}`
}

export function crearFiltroDuplicados() {
    const vistos = new Set<string>()
    let omitidos = 0

    return {
        aceptar(serie: unknown, numero: unknown): boolean {
            const clave = claveDocumento(serie, numero)
            if (!clave) return true
            if (vistos.has(clave)) { omitidos++; return false }
            vistos.add(clave)
            return true
        },
        get omitidos() { return omitidos },
    }
}
