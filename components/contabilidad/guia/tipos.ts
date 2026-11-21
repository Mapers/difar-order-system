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
    /** Dibujo de módulos y tablas que se muestra en la presentación de la pantalla (opcional). */
    diagrama?: DiagramaGuia
    pasos: PasoGuia[]
}

export type IconoDiagrama =
    | "planilla" | "validar" | "enviar" | "caja" | "cliente" | "libro" | "reporte" | "filtro" | "buscar" | "sistema"
    | "calculo" | "archivo" | "documento" | "comprobante" | "pedido" | "almacen" | "producto" | "precio" | "proveedor"
    | "sunat" | "comision" | "ruta" | "calendario" | "chat"
export type TonoDiagrama = "indigo" | "ambar" | "celeste" | "verde" | "violeta"

/** Una tabla de la base que se graba en un paso del dibujo. */
export interface TablaDiagrama {
    nombre: string
    /** Aclaración corta: qué se guarda ahí. */
    nota?: string
    /** true = tabla contable (pago, kardex, mayor): se pinta en verde. */
    contable?: boolean
}

/** Un módulo del dibujo: quién actúa, dónde, y qué tablas graba. */
export interface NodoDiagrama {
    quien: string
    modulo: string
    accion: string
    /** Estado en que queda el dato en este paso; se ve en la ficha que viaja ("Enviada", "Filtros listos"...). Máx. ~20 letras. */
    estado?: string
    icono: IconoDiagrama
    tono: TonoDiagrama
    /** "graba" (por defecto): el paso escribe en esas tablas. "lee": solo trae datos de ellas (reportes, consultas). "borra": quita filas de ellas. */
    modo?: "graba" | "lee" | "borra"
    /** Tablas que toca este paso (0 a 5). Vacío si el paso no toca la base. */
    tablas: TablaDiagrama[]
}

export interface DiagramaGuia {
    titulo: string
    /** Nombre corto de lo que viaja por la línea: "Planilla", "Pedido", "Reporte"... */
    ficha?: string
    nodos: NodoDiagrama[]
    /** A dónde llega el dato al final: otros módulos, reportes o archivos (máx. 4). */
    tituloEfectos?: string
    /** `desde`: tabla de la que ese módulo lee el dato. */
    efectos?: { modulo: string; detalle: string; icono: IconoDiagrama; desde?: string }[]
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
