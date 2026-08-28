export interface ClienteReferenciaImagen {
    id_imagen:      number
    codigo_cliente: string
    ruta:           string
    nombre_archivo: string
    peso_bytes:     number | null
    id_usuario_web: number | null
    fecha_registro: string
    usuario:        string | null
}

export const REFERENCIA_MAX = 5
export const REFERENCIA_MAX_BYTES = 2 * 1024 * 1024
export const REFERENCIA_TIPOS = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
]
