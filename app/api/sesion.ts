/**
 * Cabecera con el token de la sesión, para los endpoints que deciden en el
 * servidor qué puede ver cada usuario (por ejemplo, un vendedor solo lo suyo).
 */
export function cabeceraSesion(): Record<string, string> {
    if (typeof window === 'undefined') return {}
    try {
        const token = localStorage.getItem('token')
        return token ? { Authorization: `Bearer ${token}` } : {}
    } catch {
        return {}
    }
}
