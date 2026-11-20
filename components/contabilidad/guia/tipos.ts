// Guía de Contabilidad (20/11/2026): recorrido paso a paso por cada pantalla del módulo.
// Solo escritorio. El contenido de cada pantalla vive en ./contenido/*.ts.

/** Un paso del recorrido. Se ilumina el elemento que tenga `data-guia="<guia>"` en la pantalla. */
export interface PasoGuia {
    /** Valor del atributo data-guia del elemento a iluminar. Sin él (o si no está visible) la tarjeta sale al centro. */
    guia?: string
    /** Nombre del botón o sección, tal como se ve en pantalla. */
    titulo: string
    /** Para qué sirve, en una o dos frases. */
    queHace: string
    /** Qué ocurre al usarlo (opcional). */
    quePasa?: string
    /** Dónde queda guardado, en palabras simples ("Voucher de caja", "Asiento contable"...). Omitir si no guarda nada. */
    seGuarda?: string
    /** Tablas de la base, para quien da soporte (se muestran en letra pequeña). */
    tablas?: string
    /** Qué sigue después de este paso. */
    despues?: string
}

/** Una pantalla del módulo con su recorrido. */
export interface PantallaGuia {
    /** Ruta exacta de la pantalla, p. ej. "/dashboard/contabilidad/libro-caja-bancos". */
    ruta: string
    /** Nombre como aparece en el menú. */
    nombre: string
    /** Grupo del menú: "Cobranza", "Datos de Movimientos", "Libros Contables", "Registros e Informes", "SUNAT", "Comisiones", "Datos Fijos". */
    grupo: string
    /** Qué es esta pantalla, en una frase. Se muestra en el primer paso. */
    resumen: string
    pasos: PasoGuia[]
}

/** Un paso del "camino completo": una tarea que cruza varias pantallas. */
export interface EtapaCamino {
    titulo: string
    /** Pantalla donde se hace (ruta). Al hacer clic, se abre con su recorrido. */
    ruta?: string
    /** Quién lo hace: "Vendedor", "Administrador", "Contabilidad", "Automático"... */
    quien: string
    queHace: string
    seGuarda?: string
    despues?: string
}

export interface CaminoGuia {
    id: string
    titulo: string
    descripcion: string
    etapas: EtapaCamino[]
}
