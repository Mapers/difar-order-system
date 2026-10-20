// ─── Formatters ───────────────────────────────────────────────────────────────

export function fmtMoney(v: number | string | null | undefined): string {
    // Con separador de miles: S/ 1,350.78.
    return `S/ ${Number(v ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Sigla corta del banco para mostrarla como etiqueta: lo que va después del
 * último " - " ("De Credito del Peru - BCP" -> "BCP") o la primera palabra si
 * ya es una sigla ("BBVA Continental" -> "BBVA").
 */
export function siglaBanco(nombre: string | null | undefined): string {
    const n = (nombre ?? '').trim()
    if (!n) return ''
    const tras = n.split(' - ').pop()!.trim()
    if (tras !== n && tras.length <= 8) return tras.toUpperCase()
    const primera = n.split(/\s+/)[0]
    return /^[A-Z0-9]{2,6}$/.test(primera) ? primera : ''
}

export function fmtFecha(d: string | null | undefined): string {
    if (!d) return '—'
    try {
        const date = new Date(d.includes('T') ? d : `${d}T12:00:00`)
        if (isNaN(date.getTime())) return d
        return date.toLocaleDateString('es-PE', {
            day:   '2-digit',
            month: '2-digit',
            year:  'numeric',
        })
    } catch {
        return d
    }
}

export function fmtHora(d: string | null | undefined): string {
    if (!d) return ''
    try {
        return new Date(d).toLocaleTimeString('es-PE', {
            hour:   '2-digit',
            minute: '2-digit',
        })
    } catch {
        return ''
    }
}

export function fmtRel(d: string | null | undefined): string {
    if (!d) return ''
    const s = (Date.now() - new Date(d).getTime()) / 1000
    if (s < 60)    return 'hace un momento'
    if (s < 3600)  return `hace ${Math.floor(s / 60)} min`
    if (s < 86400) return `hace ${Math.floor(s / 3600)} h`
    return fmtFecha(d.split('T')[0])
}

export function getInitials(name: string): string {
    return name
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}