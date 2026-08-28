export interface GrupoExportacion {
    titulo: string
    zonas: string[]
}

export const GRUPOS_EXPORTACION_CLIENTES: GrupoExportacion[] = [
    {
        titulo: 'DIANA',
        zonas: [
            '014', // LA ESPERANZA
            '022', // EL MILAGRO
            '035', // ALTO TRUJILLO
                   //   OJO: la tabla `zona` tiene cuatro filas con este mismo
                   //   nombre — 035, 055, 056 y 057 (las dos ultimas difieren
                   //   solo en un espacio: '- LA LIBERTAD' vs '-LA LIBERTAD').
                   //   Por decision del negocio aqui solo cuenta 035. Los
                   //   clientes que esten en 055/056/057 apareceran en SIN
                   //   GRUPO, que es justo como se detecta que hay que
                   //   reasignarlos o fusionar las filas duplicadas.
            '016', // OTUZCO
            '026', // SANTIAGO DE CHUCO
            // PENDIENTE — MANSICHE: no existe ninguna zona con ese nombre en la
            // tabla `zona`. Cuando se cree, agregar aqui su IdZona. Mientras
            // tanto sus clientes salen en SIN GRUPO.
        ],
    },
    {
        titulo: 'DANI',
        zonas: [
            '013', // EL PORVENIR
            '015', // LAREDO
            '025', // SANTO DOMINGUITO-LA NORIA- BOSQUE
            '003', // COISHCO - SANTA - RINCONADA  (la "Rinconada" del listado)
            '038', // SANTA MARIA  (la "La Perla - Santa Maria" del listado)
            '023', // VIRU - CHAO
            '021', // HUAMACHUCO
        ],
    },
    {
        titulo: 'LIBRE',
        zonas: [
            '031', // PALERMO
                   //   Existe tambien 034 'NORIA-PALERMO'. Aqui solo va 031.
            '033', // MOCHE            (cubre tambien "Alto Moche")
            '048', // HUANCHACO        (cubre tambien "Ramon Castilla")
            '030', // FLORENCIA DE MORA
            '039', // CENTRO HISTORICO
            '024', // VICTOR LARCO
            // PENDIENTE — VALLE CHICAMA: la unica candidata es 019, cuyo nombre
            // en la tabla es ' VALLE' (con un espacio al inicio). Sin confirmar
            // que sea la misma, se deja fuera.
            // PENDIENTE — VALLE JEQUETEPEQUE: sin zona equivalente. Las
            // candidatas serian las de Pacasmayo: 054 y '51' (esta ultima
            // registrada sin el cero inicial, a diferencia del resto).
        ],
    },
]

export const TITULO_SIN_GRUPO = 'SIN GRUPO ASIGNADO'
