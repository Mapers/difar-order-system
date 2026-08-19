const UNIDADES = [
    '', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
    'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE',
    'DIECIOCHO', 'DIECINUEVE', 'VEINTE',
]

const DECENAS = [
    '', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA',
    'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA',
]

const CENTENAS = [
    '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
    'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS',
]

function centenas(n: number): string {
    if (n === 0) return ''
    if (n === 100) return 'CIEN'

    let out = ''
    const c = Math.floor(n / 100)
    const r = n % 100

    if (c > 0) out += CENTENAS[c] + ' '

    if (r <= 20) {
        out += UNIDADES[r]
    } else {
        const d = Math.floor(r / 10)
        const u = r % 10

        if (d === 2) {
            out += 'VEINTI' + UNIDADES[u]
        } else {
            out += DECENAS[d]
            if (u > 0) out += ' Y ' + UNIDADES[u]
        }
    }

    return out.trim()
}

function entero(n: number): string {
    if (n === 0) return 'CERO'

    let out = ''
    const millones = Math.floor(n / 1000000)
    const miles = Math.floor((n % 1000000) / 1000)
    const resto = n % 1000

    if (millones > 0) {
        out += (millones === 1 ? 'UN MILLON' : centenas(millones) + ' MILLONES') + ' '
    }
    if (miles > 0) {
        out += (miles === 1 ? 'MIL' : centenas(miles).replace(/UNO$/, 'UN') + ' MIL') + ' '
    }
    if (resto > 0) {
        out += centenas(resto)
    }

    return out.trim()
}

export function numeroALetras(n: number, moneda: 1 | 2 = 1): string {
    const redondeado = Math.round((Number(n) || 0) * 100) / 100
    const abs = Math.abs(redondeado)
    const parteEntera = Math.floor(abs)
    const centavos = String(Math.round((abs - parteEntera) * 100)).padStart(2, '0')
    const unidad = moneda === 2 ? 'DOLARES' : 'SOLES'

    const texto = `${entero(parteEntera)} CON ${centavos}/100 ${unidad}`

    return redondeado < 0 ? `MENOS ${texto}` : texto
}
