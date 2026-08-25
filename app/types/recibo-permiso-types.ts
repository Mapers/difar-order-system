export interface EstadoPermisoRecibo {
    requiere:           number
    id_permiso:         number | null
    estado:             'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | null
    fecha_fin:          string | null
    resuelto_nombre:    string | null
    segundos_restantes: number
    segundos_espera:    number
    vigente:            number
    expirada:           number
}
