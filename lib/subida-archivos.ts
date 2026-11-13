/**
 * El nginx del servidor rechaza (413 "Payload Too Large") todo envío de más de 1 MB,
 * aunque el backend acepte vouchers de 5 MB. Se deja margen para los demás campos.
 * Puerto de `subida_archivos.dart` de la app.
 */
export const LIMITE_ENVIO_BYTES = 900 * 1024

export const MENSAJE_ARCHIVOS_PESADOS =
    'Los archivos pesan demasiado para enviarse (máximo 900 KB en total). Quita alguno o, en vez de un PDF, toma una foto.'

const esImagen = (f: File) =>
    /^image\/(jpe?g|png|webp)$/i.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name)

const comoJpg = (nombre: string) => `${nombre.replace(/\.[^.]+$/, '')}.jpg`

async function aJpg(bitmap: ImageBitmap, ancho: number, calidad: number): Promise<Blob | null> {
    const escala = Math.min(1, ancho / bitmap.width)
    const canvas = document.createElement('canvas')
    canvas.width  = Math.max(1, Math.round(bitmap.width * escala))
    canvas.height = Math.max(1, Math.round(bitmap.height * escala))
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', calidad))
}

/** JPG de a lo más `maximo` bytes (o null si no se puede leer o no llega ni chica). */
async function reducir(file: File, maximo: number): Promise<File | null> {
    let bitmap: ImageBitmap
    try { bitmap = await createImageBitmap(file) } catch { return null }
    try {
        let ancho = Math.min(1600, bitmap.width)
        let calidad = 0.85
        let salida = await aJpg(bitmap, ancho, calidad)
        while (salida && salida.size > maximo && calidad > 0.45 + 1e-9) {
            calidad = Math.max(0.45, calidad - 0.1)
            salida = await aJpg(bitmap, ancho, calidad)
        }
        while (salida && salida.size > maximo && ancho > 400) {
            ancho = Math.round(ancho * 0.75)
            salida = await aJpg(bitmap, ancho, calidad)
        }
        if (!salida || salida.size > maximo) return null
        return new File([salida], comoJpg(file.name), { type: 'image/jpeg', lastModified: Date.now() })
    } finally {
        bitmap.close()
    }
}

/**
 * Deja los archivos listos para un solo envío de `limite` bytes: si se pasan, las
 * imágenes se reducen (JPG, menos calidad y luego menos tamaño) repartiendo el
 * espacio que dejan los PDF, que no se tocan. Si ni así entran, lanza un Error con
 * MENSAJE_ARCHIVOS_PESADOS sin enviar nada.
 */
export async function prepararParaEnvio(archivos: File[], limite = LIMITE_ENVIO_BYTES): Promise<File[]> {
    const total = (l: File[]) => l.reduce((s, f) => s + f.size, 0)
    if (total(archivos) <= limite) return archivos
    const imagenes = archivos.filter(esImagen).length
    const fijos = total(archivos.filter(f => !esImagen(f)))
    if (imagenes === 0 || fijos >= limite) throw new Error(MENSAJE_ARCHIVOS_PESADOS)
    const cupo = Math.floor((limite - fijos) / imagenes)
    const salida: File[] = []
    for (const f of archivos) {
        if (!esImagen(f) || f.size <= cupo) { salida.push(f); continue }
        const r = await reducir(f, cupo)
        if (!r) throw new Error(MENSAJE_ARCHIVOS_PESADOS)
        salida.push(r)
    }
    if (total(salida) > limite) throw new Error(MENSAJE_ARCHIVOS_PESADOS)
    return salida
}
