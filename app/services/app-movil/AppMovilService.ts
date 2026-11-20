import apiClient from "@/app/api/client"
import { AccionVersionApp, DispositivoApp, EstadoVersionApp, VersionApp } from "@/app/types/app-movil-types"

/** Configuraciones › Aplicación Móvil. El token lo agrega apiClient (ruta app-movil en RUTAS_CON_SESION). */
export const AppMovilService = {
    async listarVersiones(estado?: EstadoVersionApp | ''): Promise<VersionApp[]> {
        const res = await apiClient.get('/app-movil/versiones', { params: { plataforma: 'ANDROID', estado: estado || undefined } })
        return res.data?.data?.data || []
    },

    async listarDispositivos(): Promise<DispositivoApp[]> {
        const res = await apiClient.get('/app-movil/dispositivos', { params: { plataforma: 'ANDROID' } })
        return res.data?.data?.data || []
    },

    async subir(
        archivo: File,
        datos: { notas: string; obligatoria: boolean; publicar: boolean },
        alAvanzar?: (porcentaje: number) => void,
    ): Promise<{ mensaje: string; version_nombre: string; version_codigo: number; estado: EstadoVersionApp }> {
        const form = new FormData()
        form.append('apk', archivo)
        form.append('plataforma', 'ANDROID')
        form.append('notas', datos.notas)
        form.append('obligatoria', datos.obligatoria ? '1' : '0')
        form.append('publicar', datos.publicar ? '1' : '0')
        const res = await apiClient.post('/app-movil/versiones', form, {
            timeout: 0, // un APK de 40 MB puede tardar más de 2 minutos con internet lento
            onUploadProgress: (e) => { if (alAvanzar && e.total) alAvanzar(Math.round((e.loaded * 100) / e.total)) },
        })
        return { mensaje: res.data?.message, ...res.data?.data }
    },

    async cambiarEstado(idVersion: number, accion: AccionVersionApp): Promise<string> {
        const res = await apiClient.patch(`/app-movil/versiones/${idVersion}/estado`, { accion })
        return res.data?.message
    },

    async descargar(version: VersionApp): Promise<void> {
        const res = await apiClient.get(`/app-movil/versiones/${version.id_version}/descargar`, { responseType: 'blob', timeout: 0 })
        const url = URL.createObjectURL(res.data)
        const a = document.createElement('a')
        a.href = url
        a.download = `difar-ventas-${version.version_nombre}.apk`
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 5000)
    },
}

/** Mensaje del backend, también cuando la respuesta de error llega como blob (descargas). */
export async function mensajeDeError(error: any, porDefecto: string): Promise<string> {
    const data = error?.response?.data
    if (data instanceof Blob) {
        try { return JSON.parse(await data.text())?.message || porDefecto } catch { return porDefecto }
    }
    if (error?.response?.status === 413) return 'El servidor rechazó el archivo por su tamaño. Hay que ampliar el límite de subida.'
    return data?.message || porDefecto
}
