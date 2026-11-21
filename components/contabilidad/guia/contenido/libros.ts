import { CaminoGuia, PantallaGuia, PasoGuia } from "../tipos"

// Grupo "Libros Contables". Todas estas pantallas son de consulta: leen el mayor auxiliar y el plan de cuentas
// y no graban nada. Libro Diario, Libro Mayor, Cuentas Contables y Estados Financieros usan la misma página de
// informes con pestañas (components/contabilidad/informes/PaginaInformes.tsx), por eso comparten los data-guia.

const GRUPO = "Libros Contables"
const MAYOR = "`mayor auxiliar`"
const PLAN = "mplancuentas (plan de cuentas)"

// ---- pasos comunes de la página de informes con pestañas
const descripcion: PasoGuia = {
    guia: "descripcion-informe",
    titulo: "Qué muestra la pestaña",
    queHace: "Aquí lees en una línea qué trae la pestaña que tienes abierta.",
    despues: "Revísala cada vez que cambies de pestaña: el periodo que pide cambia según el informe.",
}

const consultar = (que: string): PasoGuia => ({
    guia: "consultar",
    titulo: "Consultar",
    queHace: "Pulsa Consultar para traer el informe con el periodo que elegiste.",
    quePasa: `${que} No graba ni cambia nada.`,
    tablas: `${MAYOR}, ${PLAN}`,
    despues: "Si cambias el periodo, vuelve a pulsar Consultar para actualizar la tabla.",
})

const exportarPdf: PasoGuia = {
    guia: "exportar-pdf",
    titulo: "PDF",
    queHace: "Pulsa PDF para ver la vista previa del informe; desde ahí lo imprimes o lo descargas.",
    quePasa: "Se activa solo cuando hay filas. Usa el periodo de la última consulta, no el que acabas de elegir sin consultar.",
}

const exportarExcel: PasoGuia = {
    guia: "exportar-excel",
    titulo: "Excel",
    queHace: "Pulsa Excel para descargar el informe en una hoja de cálculo.",
    quePasa: "El Excel lleva todas las filas, aunque la pantalla muestre solo las primeras.",
}

const resumen = (texto: string): PasoGuia => ({
    guia: "resumen",
    titulo: "Recuadros de totales",
    queHace: texto,
})

const tabla = (texto: string, despues?: string): PasoGuia => ({
    guia: "tabla",
    titulo: "Tabla del informe",
    queHace: texto,
    quePasa: "Todos los importes están en soles (S/). Si hay muchas filas, abajo te avisa cuántas se muestran; el Excel las trae todas.",
    despues,
})

export const pantallas: PantallaGuia[] = [
    // ------------------------------------------------------------------ Libro Diario
    {
        ruta: "/dashboard/contabilidad/libro-diario",
        nombre: "Libro Diario",
        grupo: GRUPO,
        resumen: "Consulta el Libro Diario del año o del mes, los asientos que no cuadran y el Diario Simplificado. Solo muestra, no graba nada.",
        diagrama: {
            titulo: "De dónde sale el Libro Diario que ves en pantalla",
            ficha: "Libro",
            nodos: [
                {
                    quien: "Tú", modulo: "Pestaña y periodo", accion: "Eliges el informe, el año y, si toca, el mes.",
                    estado: "Filtros listos", icono: "filtro", tono: "indigo",
                    tablas: [],
                },
                {
                    quien: "Tú", modulo: "Consultar", accion: "Pulsas Consultar para pedir el informe.",
                    estado: "Consultando", icono: "buscar", tono: "ambar",
                    tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Leer los asientos", accion: "Trae los asientos del periodo y los ordena por glosa.",
                    estado: "Asientos leídos", icono: "sistema", tono: "celeste", modo: "lee",
                    tablas: [
                        { nombre: "mayor auxiliar", nota: "asientos del periodo", contable: true },
                        { nombre: "mplancuentas", nota: "nombre de cada cuenta" },
                    ],
                },
                {
                    quien: "Tú", modulo: "Tabla y totales", accion: "Ves Cargo, Abono y Diferencia en S/. No se graba nada.",
                    estado: "En pantalla", icono: "libro", tono: "verde",
                    tablas: [],
                },
            ],
            tituloEfectos: "Con el informe puedes",
            efectos: [
                { modulo: "PDF", detalle: "imprimirlo o descargarlo", icono: "documento" },
                { modulo: "Excel", detalle: "bajarlo con todas las filas", icono: "archivo" },
                { modulo: "Revisión Asientos", detalle: "ver los que no cuadran", icono: "validar", desde: "mayor auxiliar" },
            ],
        },
        pasos: [
            {
                guia: "pestanas",
                titulo: "Pestañas del Diario",
                queHace: "Elige aquí el informe: Diario General (todo el año), Diario Mes, Revisión Asientos o Diario Simplificado.",
                quePasa: "Al cambiar de pestaña se limpia la tabla; tienes que volver a consultar.",
            },
            descripcion,
            {
                guia: "filtros",
                titulo: "Año y Mes",
                queHace: "Elige el año. En Diario Mes y Diario Simplificado elige también el mes.",
                quePasa: "Al entrar, viene puesto el mes anterior al actual.",
            },
            consultar("Lee los asientos del mayor auxiliar del periodo y los ordena por mes, glosa, libro y cuenta."),
            resumen("Aquí ves cuántas filas trajo, el total de Cargo, el total de Abono y la Diferencia. Si la Diferencia no es S/ 0.00, algún asiento no cuadra."),
            tabla(
                "Cada asiento sale agrupado por glosa con su total. En Diario Mes, al final verás \"Vienen Mes Anterior\" y el \"Total Acumulado\".",
                "Si la Diferencia no es cero, abre la pestaña Revisión Asientos.",
            ),
            {
                guia: "pestanas",
                titulo: "Revisión Asientos",
                queHace: "Usa esta pestaña para encontrar los asientos del año donde el cargo no es igual al abono.",
                quePasa: "Un asiento es mes + glosa + libro. Si todo cuadra, te dice \"Todos los asientos del año cuadran\".",
                tablas: MAYOR,
                despues: "Para ver el documento que causa la diferencia, ve al Libro Mayor, pestaña Revisa.",
            },
            {
                guia: "pestanas",
                titulo: "Diario Simplificado",
                queHace: "Muestra una fila por glosa y una columna por cuenta, solo con las cuentas que tuvieron movimiento en el mes.",
                quePasa: "Una cuenta marcada con * no estaba en el formato de Access.",
                tablas: MAYOR,
            },
            exportarPdf,
            exportarExcel,
        ],
    },

    // ------------------------------------------------------------------ Libro Mayor
    {
        ruta: "/dashboard/contabilidad/libro-mayor",
        nombre: "Libro Mayor",
        grupo: GRUPO,
        resumen: "Consulta el mayor por cuenta, del año o del mes, con saldo corrido, sus resúmenes y los documentos que no cuadran. Solo muestra, no graba nada.",
        diagrama: {
            titulo: "De dónde sale el Libro Mayor que ves en pantalla",
            ficha: "Libro",
            nodos: [
                {
                    quien: "Tú", modulo: "Pestaña, año y cuenta", accion: "Eliges el informe, el periodo y la cuenta (o su inicio).",
                    estado: "Filtros listos", icono: "filtro", tono: "indigo",
                    tablas: [],
                },
                {
                    quien: "Tú", modulo: "Consultar", accion: "Pulsas Consultar para pedir el informe.",
                    estado: "Consultando", icono: "buscar", tono: "ambar",
                    tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Leer los movimientos", accion: "Trae los movimientos y calcula el saldo de cada cuenta.",
                    estado: "Saldos calculados", icono: "calculo", tono: "celeste", modo: "lee",
                    tablas: [
                        { nombre: "mayor auxiliar", nota: "movimientos de cada cuenta", contable: true },
                        { nombre: "mplancuentas", nota: "nombre de cada cuenta" },
                        { nombre: "mnombrerazsoc", nota: "cliente o proveedor" },
                    ],
                },
                {
                    quien: "Tú", modulo: "Mayor por cuenta", accion: "Ves fecha, glosa, cargo, abono y saldo en S/. No graba nada.",
                    estado: "En pantalla", icono: "libro", tono: "verde",
                    tablas: [],
                },
            ],
            tituloEfectos: "Con el informe puedes",
            efectos: [
                { modulo: "PDF", detalle: "imprimirlo o descargarlo", icono: "documento" },
                { modulo: "Excel", detalle: "bajarlo con todas las filas", icono: "archivo" },
                { modulo: "Revisa", detalle: "ver documentos que no cuadran", icono: "validar", desde: "mayor auxiliar" },
            ],
        },
        pasos: [
            {
                guia: "pestanas",
                titulo: "Pestañas del Mayor",
                queHace: "Elige aquí el informe: Por Año, Por Mes, Resumen Año, Resumen Año Ctas. Principales o Revisa.",
                quePasa: "Al cambiar de pestaña se limpia la tabla; tienes que volver a consultar.",
            },
            descripcion,
            {
                guia: "filtros",
                titulo: "Año y Mes",
                queHace: "Elige el año. En la pestaña Por Mes elige también el mes.",
            },
            {
                guia: "cuenta",
                titulo: "Cuenta",
                queHace: "En Por Año y Por Mes escribe una cuenta o su inicio (por ejemplo 10, 101 o 1010101) para ver solo esas.",
                quePasa: "Si la dejas vacía trae todas las cuentas, y el año completo son miles de líneas. Solo acepta números.",
            },
            consultar("Lee los movimientos del mayor auxiliar y calcula el saldo corrido de cada cuenta."),
            resumen("Aquí ves cuántas filas trajo, el total de Cargo, el total de Abono y la Diferencia entre ambos."),
            tabla(
                "Cada cuenta sale con sus movimientos (fecha, glosa, cargo, abono, saldo y libro) y al final su total y saldo. En Por Mes, la primera línea es \"Vienen Mes Anterior\" (desde febrero).",
            ),
            {
                guia: "pestanas",
                titulo: "Resúmenes del año",
                queHace: "Resumen Año agrupa por sub cuenta, mes y concepto. Resumen Año Ctas. Principales agrupa por cuenta de 2 dígitos.",
                tablas: MAYOR,
            },
            {
                guia: "pestanas",
                titulo: "Revisa",
                queHace: "Usa esta pestaña para ver los documentos del año cuyo cargo no es igual al abono.",
                quePasa: "Cada fila es mes + libro + cliente/proveedor + documento, con el saldo que queda. Si todo cuadra, te dice \"Todos los documentos del año cuadran\".",
                tablas: MAYOR,
                despues: "Para ver el detalle de una cuenta, abre Movimiento de Sub Cuenta.",
            },
            exportarPdf,
            exportarExcel,
        ],
    },

    // ------------------------------------------------------------------ Movimiento de Sub Cuenta
    {
        ruta: "/dashboard/contabilidad/movimiento-subcuenta",
        nombre: "Movimiento de Sub Cuenta Contable",
        grupo: GRUPO,
        resumen: "Muestra los movimientos de una sub cuenta en un mes o en todo el año, con saldo inicial y saldo final. Solo muestra, no graba nada.",
        diagrama: {
            titulo: "De dónde salen los movimientos de una sub cuenta",
            ficha: "Reporte",
            nodos: [
                {
                    quien: "Tú", modulo: "Sub cuenta contable", accion: "La eliges de la lista, por código o por descripción.",
                    estado: "Cuenta elegida", icono: "buscar", tono: "indigo", modo: "lee",
                    tablas: [{ nombre: "mplancuentas", nota: "lista de sub cuentas" }],
                },
                {
                    quien: "Tú", modulo: "Periodo y moneda", accion: "Eliges mes y año (o todo el ejercicio) y S/ o US$.",
                    estado: "Filtros listos", icono: "calendario", tono: "ambar",
                    tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Generar", accion: "Trae los movimientos de esa sub cuenta en el periodo.",
                    estado: "Movimientos leídos", icono: "sistema", tono: "celeste", modo: "lee",
                    tablas: [
                        { nombre: "mayor auxiliar", nota: "movimientos de la sub cuenta", contable: true },
                        { nombre: "mnombrerazsoc", nota: "personas y empresas" },
                    ],
                },
                {
                    quien: "Tú", modulo: "Saldos y movimientos", accion: "Ves saldo inicial, ingresos, salidas y saldo final.",
                    estado: "En pantalla", icono: "reporte", tono: "verde",
                    tablas: [],
                },
            ],
            tituloEfectos: "Con el reporte puedes",
            efectos: [
                { modulo: "Exportar PDF", detalle: "verlo y descargarlo", icono: "documento" },
                { modulo: "Libro Mayor", detalle: "buscar el documento que no cuadra", icono: "libro", desde: "mayor auxiliar" },
            ],
        },
        pasos: [
            {
                guia: "subcuenta",
                titulo: "Sub cuenta contable",
                queHace: "Elige aquí la sub cuenta. Puedes buscarla por código o por descripción.",
                quePasa: "La lista sale del plan de cuentas. Es obligatoria: sin ella no se genera el reporte.",
                tablas: PLAN,
            },
            {
                guia: "periodo",
                titulo: "Periodo",
                queHace: "Elige el mes y el año. Con las flechas pasas al mes anterior o al siguiente.",
                quePasa: "Si eliges \"Todo el ejercicio\" ves el año entero, y la tabla agrega las columnas L y Personas/Empresas.",
            },
            {
                guia: "moneda",
                titulo: "Moneda",
                queHace: "Elige S/ Soles o US$ Dólares.",
                quePasa: "En dólares solo salen los movimientos registrados en dólares, con su importe en US$.",
            },
            {
                guia: "generar",
                titulo: "Generar",
                queHace: "Pulsa Generar para ver el reporte.",
                quePasa: "Lee los movimientos del mayor auxiliar de esa sub cuenta en el periodo. No graba nada.",
                tablas: `${MAYOR}, ${PLAN}, mnombrerazsoc (personas y empresas)`,
            },
            {
                guia: "saldos",
                titulo: "Saldos del periodo",
                queHace: "Aquí ves la cuenta, el Saldo inicial, el Total ingreso (cargos), el Total salida (abonos) y el Saldo final.",
                quePasa: "El saldo inicial suma los meses anteriores del mismo año; en enero y en \"Todo el ejercicio\" empieza en S/ 0.00.",
            },
            {
                guia: "movimientos",
                titulo: "Movimientos del período",
                queHace: "Cada línea es un movimiento: fecha, libro, documento, concepto, ingreso, salida y el saldo que va quedando.",
                quePasa: "En la columna Libro, B es un movimiento de banco y O es otro libro.",
                despues: "Si un saldo no te cuadra, busca el documento en el Libro Mayor o en su registro de origen.",
            },
            {
                guia: "exportar-pdf",
                titulo: "Exportar PDF",
                queHace: "Pulsa Exportar PDF para ver la vista previa, ajustar el diseño y descargarlo.",
                quePasa: "Solo aparece después de generar el reporte.",
            },
        ],
    },

    // ------------------------------------------------------------------ Cuentas Contables
    {
        ruta: "/dashboard/contabilidad/cuentas-contables",
        nombre: "Cuentas Contables",
        grupo: GRUPO,
        resumen: "Consulta el saldo de cada cuenta a una fecha de corte y las sumas del mayor por mes. Solo muestra, no graba nada.",
        diagrama: {
            titulo: "De dónde salen los saldos de las cuentas",
            ficha: "Informe",
            nodos: [
                {
                    quien: "Tú", modulo: "Pestaña y fecha", accion: "Eliges Saldos Cuentas (fecha de corte) o Sumas Mayor (año).",
                    estado: "Filtros listos", icono: "filtro", tono: "indigo",
                    tablas: [],
                },
                {
                    quien: "Tú", modulo: "Consultar", accion: "Pulsas Consultar para pedir el informe.",
                    estado: "Consultando", icono: "buscar", tono: "ambar",
                    tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Sumar por cuenta", accion: "Suma los movimientos de cada cuenta desde el 1 de enero.",
                    estado: "Saldos calculados", icono: "calculo", tono: "celeste", modo: "lee",
                    tablas: [
                        { nombre: "mayor auxiliar", nota: "movimientos de cada cuenta", contable: true },
                        { nombre: "mplancuentas", nota: "nombre de cada cuenta" },
                    ],
                },
                {
                    quien: "Tú", modulo: "Saldos o sumas", accion: "Ves Deudor y Acreedor, o el Debe y Haber por mes, en S/.",
                    estado: "En pantalla", icono: "reporte", tono: "verde",
                    tablas: [],
                },
            ],
            tituloEfectos: "Con el informe puedes",
            efectos: [
                { modulo: "PDF", detalle: "imprimirlo o descargarlo", icono: "documento" },
                { modulo: "Excel", detalle: "bajarlo con todas las filas", icono: "archivo" },
                { modulo: "Movimiento de Sub Cuenta", detalle: "ver el detalle de una cuenta", icono: "libro", desde: "mayor auxiliar" },
            ],
        },
        pasos: [
            {
                guia: "pestanas",
                titulo: "Saldos Cuentas y Sumas Mayor",
                queHace: "Elige Saldos Cuentas para ver saldos a una fecha, o Sumas Mayor para ver el Debe y el Haber de cada mes del año.",
                quePasa: "Al cambiar de pestaña se limpia la tabla; tienes que volver a consultar.",
            },
            descripcion,
            {
                guia: "filtros",
                titulo: "Fecha de corte o Año",
                queHace: "En Saldos Cuentas elige la Fecha de corte. En Sumas Mayor elige el Año.",
                quePasa: "El saldo se calcula desde el 1 de enero hasta la fecha de corte.",
            },
            consultar("Lee los movimientos del mayor auxiliar y los suma por cuenta."),
            resumen("En Saldos Cuentas ves el total Deudor y el total Acreedor. En Sumas Mayor ves el Total Debe, el Total Haber y la Diferencia."),
            tabla(
                "En Saldos Cuentas cada cuenta sale agrupada por cuenta principal, sub cuenta y sub cuenta 2, con sus sumas. En Sumas Mayor ves una columna por mes.",
                "Para ver los movimientos de una cuenta, usa el enlace a Movimiento de Sub Cuenta que está bajo el título.",
            ),
            exportarPdf,
            exportarExcel,
        ],
    },

    // ------------------------------------------------------------------ Estados Financieros
    {
        ruta: "/dashboard/contabilidad/estados-financieros",
        nombre: "Estados Financieros y Balances",
        grupo: GRUPO,
        resumen: "Consulta el Balance General, el Estado de Resultados, los Balances de Comprobación, el Flujo de Efectivo y el Cambio en el Patrimonio. Solo muestra, no graba nada.",
        diagrama: {
            titulo: "De dónde salen los estados financieros",
            ficha: "Estado",
            nodos: [
                {
                    quien: "Tú", modulo: "Estado y periodo", accion: "Eliges el estado financiero, el año y, si toca, el mes.",
                    estado: "Filtros listos", icono: "filtro", tono: "indigo",
                    tablas: [],
                },
                {
                    quien: "Tú", modulo: "Consultar", accion: "Pulsas Consultar para pedir el estado.",
                    estado: "Consultando", icono: "buscar", tono: "ambar",
                    tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Leer y agrupar", accion: "Trae los saldos y los agrupa por cuenta y por concepto.",
                    estado: "Saldos agrupados", icono: "calculo", tono: "celeste", modo: "lee",
                    tablas: [
                        { nombre: "mayor auxiliar", nota: "saldos de cada cuenta", contable: true },
                        { nombre: "mplancuentas", nota: "nombre de cada cuenta" },
                        { nombre: "mconceptos estados financieros", nota: "concepto de cada cuenta" },
                    ],
                },
                {
                    quien: "Sistema", modulo: "Solo Flujo Efectivo", accion: "Esa pestaña sale de caja y diario. Está EN REVISIÓN.",
                    estado: "Flujo en revisión", icono: "caja", tono: "violeta", modo: "lee",
                    tablas: [
                        { nombre: "caja centralizacion", nota: "movimientos de caja", contable: true },
                        { nombre: "diario centralizacion", nota: "asientos del diario", contable: true },
                        { nombre: "estas_flujo" },
                    ],
                },
                {
                    quien: "Tú", modulo: "Estado en pantalla", accion: "Ves Activo, Pasivo, Patrimonio y Resultado en S/.",
                    estado: "En pantalla", icono: "reporte", tono: "verde",
                    tablas: [],
                },
            ],
            tituloEfectos: "Con el estado puedes",
            efectos: [
                { modulo: "PDF", detalle: "imprimirlo o descargarlo", icono: "documento" },
                { modulo: "Excel", detalle: "bajarlo con todas las filas", icono: "archivo" },
                { modulo: "Libro Diario y Mayor", detalle: "revisar si el balance no cuadra", icono: "libro", desde: "mayor auxiliar" },
            ],
        },
        pasos: [
            {
                guia: "pestanas",
                titulo: "Pestañas de estados financieros",
                queHace: "Elige aquí el estado: B. General, Resultado Mes, Resultado Anual, B. Comprobación, B. Comprobación SUNAT, B. Comprobación Mes, Flujo Efectivo, Cambio Patrimonio o Resultado Acumulado.",
                quePasa: "Al cambiar de pestaña se limpia la tabla; tienes que volver a consultar.",
            },
            descripcion,
            {
                guia: "filtros",
                titulo: "Año y Mes",
                queHace: "Elige el año y, en los estados mensuales, el mes.",
                quePasa: "El Balance General y los Balances de Comprobación son acumulados de enero al mes que elijas.",
            },
            consultar("Lee los saldos del mayor auxiliar y los agrupa por cuenta y por concepto de estados financieros."),
            resumen("En B. General ves Activo, Pasivo y Patrimonio. En los Resultados ves el Resultado. En los Balances de Comprobación ves la Suma Debe, la Suma Haber y la Diferencia."),
            {
                guia: "tabla",
                titulo: "Balance General",
                queHace: "Muestra Activo, Pasivo y Patrimonio por concepto, con TOTAL ACTIVO y TOTAL PASIVO Y PATRIMONIO al final.",
                quePasa: "El resultado del ejercicio se calcula al momento y va en Patrimonio. Si no cuadra, verás la fila \"Diferencia (el balance no cuadra)\".",
                tablas: `${MAYOR}, ${PLAN}, \`mconceptos estados financieros\``,
                despues: "Si hay diferencia, revisa el Libro Diario (Revisión Asientos) y el Libro Mayor (Revisa).",
            },
            {
                guia: "pestanas",
                titulo: "Resultado Acumulado",
                queHace: "Usa esta pestaña para ver ganancias y pérdidas de enero al mes elegido.",
                quePasa: "Es el resultado que cuadra con el Balance General del mismo mes.",
                tablas: `${MAYOR}, \`mconceptos estados financieros\``,
            },
            {
                guia: "pestanas",
                titulo: "Balances de Comprobación",
                queHace: "Muestran por cuenta el saldo inicial, el movimiento y las columnas Activo, Pasivo, Pérdida y Ganancia.",
                quePasa: "B. Comprobación va por cuenta de 2 dígitos; SUNAT y Mes van por sub cuenta. Al final salen el \"Resultado del ejercicio\" y \"Sumas iguales\".",
                tablas: `${MAYOR}, ${PLAN}`,
            },
            {
                guia: "advertencia",
                titulo: "Aviso en Flujo Efectivo",
                queHace: "En la pestaña Flujo Efectivo aparece un aviso amarillo: este estado está EN REVISIÓN.",
                quePasa: "No lo uses para decisiones ni para SUNAT. Hoy sale de la centralización de caja, no del Libro Mayor.",
                tablas: "`caja centralizacion`, `diario centralizacion`, estas_flujo, `mayor auxiliar`",
            },
            exportarPdf,
            exportarExcel,
        ],
    },
]

export const caminos: CaminoGuia[] = [
    {
        id: "libros-cierre-mes",
        titulo: "Revisar los libros y sacar los estados financieros del mes",
        descripcion: "Del mayor auxiliar a los libros y al balance: qué revisar, en qué orden y dónde.",
        etapas: [
            {
                titulo: "Pasar las ventas del APP al mayor",
                ruta: "/dashboard/contabilidad/actualiza-ventas-app",
                quien: "Contabilidad",
                queHace: "En Actualiza Ventas APP pasas las ventas y notas de crédito de la web al Registro de Ventas y al Mayor (libro 14).",
                seGuarda: "Registro de ventas y mayor auxiliar",
                despues: "Las ventas ya aparecen en el Libro Diario y en el Libro Mayor.",
            },
            {
                titulo: "Comprobar que el mayor esté completo",
                ruta: "/dashboard/contabilidad/actualizacion-contable",
                quien: "Contabilidad",
                queHace: "En Actualización Contable comparas lo que debería haber en kardex, mayor y registros con lo que hay. Revisar no graba nada.",
                despues: "Si hay copias duplicadas, solo el botón Arreglar las quita (antes las respalda).",
            },
            {
                titulo: "Ver si algún asiento no cuadra",
                ruta: "/dashboard/contabilidad/libro-diario",
                quien: "Contabilidad",
                queHace: "En el Libro Diario abre Revisión Asientos y consulta el año. Si todo cuadra, no sale ninguna fila.",
                despues: "Si hay asientos descuadrados, busca el documento en el Libro Mayor.",
            },
            {
                titulo: "Ubicar el documento que no cuadra",
                ruta: "/dashboard/contabilidad/libro-mayor",
                quien: "Contabilidad",
                queHace: "En el Libro Mayor abre Revisa para ver qué documento tiene cargo distinto de abono, o Por Mes para ver una cuenta.",
            },
            {
                titulo: "Revisar una sub cuenta en detalle",
                ruta: "/dashboard/contabilidad/movimiento-subcuenta",
                quien: "Contabilidad",
                queHace: "En Movimiento de Sub Cuenta eliges la sub cuenta y el mes, y ves cada movimiento con su saldo inicial y final.",
            },
            {
                titulo: "Ver los saldos de las cuentas",
                ruta: "/dashboard/contabilidad/cuentas-contables",
                quien: "Contabilidad",
                queHace: "En Cuentas Contables, pestaña Saldos Cuentas, ves el saldo de cada cuenta al último día del mes.",
            },
            {
                titulo: "Sacar el balance y el resultado",
                ruta: "/dashboard/contabilidad/estados-financieros",
                quien: "Contabilidad",
                queHace: "En Estados Financieros consulta B. Comprobación, B. General y Resultado Acumulado del mismo mes, y descárgalos en PDF o Excel.",
                despues: "Si el B. General muestra \"Diferencia (el balance no cuadra)\", vuelve a revisar el Libro Diario y el Libro Mayor.",
            },
        ],
    },
    {
        id: "libros-balance-no-cuadra",
        titulo: "El Balance General no cuadra: cómo encontrar la causa",
        descripcion: "Pasos para encontrar el asiento o documento que descuadra el balance.",
        etapas: [
            {
                titulo: "Ver la diferencia",
                ruta: "/dashboard/contabilidad/estados-financieros",
                quien: "Contabilidad",
                queHace: "En B. General consulta el mes. Si Activo no es igual a Pasivo + Patrimonio, al final sale \"Diferencia (el balance no cuadra)\" con el importe en S/.",
            },
            {
                titulo: "Buscar asientos descuadrados",
                ruta: "/dashboard/contabilidad/libro-diario",
                quien: "Contabilidad",
                queHace: "En Revisión Asientos consulta el año: verás cada asiento (mes, glosa y libro) donde el cargo no es igual al abono.",
            },
            {
                titulo: "Buscar documentos descuadrados",
                ruta: "/dashboard/contabilidad/libro-mayor",
                quien: "Contabilidad",
                queHace: "En Revisa consulta el año: verás el libro, el cliente o proveedor y el documento que no cuadra.",
            },
            {
                titulo: "Ver los movimientos de la cuenta",
                ruta: "/dashboard/contabilidad/movimiento-subcuenta",
                quien: "Contabilidad",
                queHace: "Elige la sub cuenta afectada y el mes para ver cada movimiento y en qué momento cambia el saldo.",
                despues: "Corrige el documento en su pantalla de origen y vuelve a consultar el balance.",
            },
        ],
    },
]
