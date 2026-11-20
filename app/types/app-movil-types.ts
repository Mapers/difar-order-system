// Configuraciones › Aplicación Móvil (20/11/2026)

export type EstadoVersionApp = 'BORRADOR' | 'PUBLICADA' | 'RETIRADA' | 'ANULADA'
export type AccionVersionApp = 'PUBLICAR' | 'RETIRAR' | 'ANULAR'

export interface VersionApp {
    id_version: number
    aplicacion: string
    plataforma: string
    paquete: string | null
    version_nombre: string
    version_codigo: number
    archivo_nombre: string
    peso_bytes: number
    sha256: string
    notas: string | null
    obligatoria: number
    estado: EstadoVersionApp
    /** Fechas ya en hora de Perú (el backend las graba así). */
    fecha_publicacion: string | null
    fecha_registro: string
    fecha_modifica: string | null
    usuario_registro: string | null
    usuario_modifica: string | null
}

export interface DispositivoApp {
    id_dispositivo: number
    dispositivo_id: string
    id_usuario_web: number | null
    usuario: string | null
    version_codigo: number
    version_nombre: string | null
    modelo: string | null
    so_version: string | null
    primera_conexion: string
    ultima_conexion: string
}

export const APK_PESO_MAXIMO = 150 * 1024 * 1024
