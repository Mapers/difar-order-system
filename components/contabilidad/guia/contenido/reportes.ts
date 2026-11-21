import { CaminoGuia, NodoDiagrama, PantallaGuia } from "../tipos"

// Guía de Reportes (21/11/2026): el dibujo de cada reporte muestra de qué tablas trae sus datos.
// Las tablas salen del SP o del SQL que usa cada pantalla; lo que no se pudo verificar se omite.
// /dashboard/reportes/saldo-proveedores no va aquí: ya tiene su entrada en otro archivo.

const GRUPO_COBRANZA = "Reportes · Cobranza"
const GRUPO_VENTAS = "Reportes · Ventas"
const GRUPO_INVENTARIO = "Reportes · Inventario"

/** Paso final de casi todos los reportes: sacar el archivo. No toca la base. */
const descargar = (accion: string): NodoDiagrama => ({
    quien: "Tú", modulo: "Descargar", accion, estado: "Archivo listo", icono: "archivo", tono: "verde", tablas: [],
})

export const pantallas: PantallaGuia[] = [
    // ───────────────────────────── Entrada del menú ─────────────────────────────
    {
        ruta: "/dashboard/reportes",
        nombre: "Reportes",
        grupo: GRUPO_COBRANZA,
        resumen: "Pantalla de entrada de Reportes: muestra la lista de clientes en orden alfabético.",
        diagrama: {
            titulo: "De dónde sale la lista de clientes",
            ficha: "Lista",
            nodos: [
                {
                    quien: "Tú", modulo: "Reportes", accion: "Entras a Reportes; puedes escribir un nombre para buscar.",
                    estado: "Búsqueda lista", icono: "buscar", tono: "indigo", tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Trae los clientes", accion: "Busca los clientes en orden alfabético, de 10 en 10.",
                    estado: "Trayendo datos", icono: "sistema", tono: "celeste", modo: "lee",
                    tablas: [{ nombre: "mnombrerazsoc", nota: "nombre y datos del cliente" }],
                },
                {
                    quien: "Tú", modulo: "Lista en pantalla", accion: "Revisas los clientes y pasas de página.",
                    estado: "En pantalla", icono: "cliente", tono: "verde", tablas: [],
                },
            ],
        },
        pasos: [],
    },

    // ───────────────────────────── Cobranza ─────────────────────────────
    {
        ruta: "/dashboard/reportes/cuenta-cliente",
        nombre: "Estado de Cuenta Cliente",
        grupo: GRUPO_COBRANZA,
        resumen: "Muestra todos los documentos de un cliente con sus pagos y el saldo que queda a una fecha.",
        diagrama: {
            titulo: "De dónde sale el estado de cuenta de un cliente",
            ficha: "Reporte",
            nodos: [
                {
                    quien: "Tú", modulo: "Filtros", accion: "Eliges el cliente y la fecha de corte, y pulsas Buscar.",
                    estado: "Filtros listos", icono: "filtro", tono: "indigo", tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Trae los movimientos", accion: "Junta los cargos y pagos del cliente hasta esa fecha.",
                    estado: "Trayendo datos", icono: "sistema", tono: "celeste", modo: "lee",
                    tablas: [
                        { nombre: "kardex clientes", nota: "cargos, pagos y saldo", contable: true },
                        { nombre: "mnombrerazsoc", nota: "nombre y dirección del cliente" },
                        { nombre: "mvendedores", nota: "vendedor del cliente" },
                        { nombre: "zona", nota: "zona del cliente" },
                        { nombre: "vta_comprobante_sunat", nota: "si el documento tiene PDF" },
                    ],
                },
                {
                    quien: "Tú", modulo: "Reporte en pantalla", accion: "Ves cada documento, sus pagos y el saldo en S/ y US$.",
                    estado: "En pantalla", icono: "reporte", tono: "violeta", tablas: [],
                },
                descargar("Exportas el estado de cuenta o abres un comprobante."),
            ],
            tituloEfectos: "Lo que puedes sacar",
            efectos: [
                { modulo: "PDF", detalle: "estado de cuenta del cliente", icono: "documento" },
                { modulo: "Comprobante", detalle: "clic en el número abre su PDF", icono: "comprobante", desde: "vta_comprobante_sunat" },
            ],
        },
        pasos: [],
    },
    {
        ruta: "/dashboard/reportes/saldos-cliente",
        nombre: "Saldo de Documentos por Cobrar",
        grupo: GRUPO_COBRANZA,
        resumen: "Muestra los documentos que los clientes aún deben, agrupados por vendedor y zona.",
        diagrama: {
            titulo: "De dónde salen los saldos por cobrar",
            ficha: "Reporte",
            nodos: [
                {
                    quien: "Tú", modulo: "Filtros", accion: "Eliges cliente, zonas, vendedor y la fecha de corte o el mes.",
                    estado: "Filtros listos", icono: "filtro", tono: "indigo", tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Trae los saldos", accion: "Suma cargos y pagos de cada documento en las dos bases.",
                    estado: "Trayendo datos", icono: "sistema", tono: "celeste", modo: "lee",
                    tablas: [
                        { nombre: "kardex clientes", nota: "saldo de cada documento", contable: true },
                        { nombre: "kardex clientes (difar-p2025)", nota: "saldos de Hoja en Blanco", contable: true },
                        { nombre: "mnombrerazsoc", nota: "nombre del cliente" },
                        { nombre: "zona", nota: "zona del cliente" },
                        { nombre: "mvendedores", nota: "nombre del vendedor" },
                    ],
                },
                {
                    quien: "Tú", modulo: "Reporte en pantalla", accion: "Ves la deuda en S/ por vendedor, zona y cliente.",
                    estado: "En pantalla", icono: "reporte", tono: "violeta", tablas: [],
                },
                descargar("Exportas el reporte o abres un comprobante."),
            ],
            tituloEfectos: "Lo que puedes sacar",
            efectos: [
                { modulo: "PDF", detalle: "saldos por vendedor y zona", icono: "documento" },
                { modulo: "Comprobante", detalle: "clic en el número abre su PDF", icono: "comprobante", desde: "vta_comprobante_sunat" },
            ],
        },
        pasos: [],
    },
    {
        ruta: "/dashboard/reportes/saldos-vencidos",
        nombre: "Saldos por Cobrar (Vencidos)",
        grupo: GRUPO_COBRANZA,
        resumen: "Muestra los documentos por cobrar que ya pasaron su fecha de vencimiento.",
        diagrama: {
            titulo: "De dónde salen los saldos vencidos",
            ficha: "Reporte",
            nodos: [
                {
                    quien: "Tú", modulo: "Abrir el reporte", accion: "Entras a la pantalla; no hace falta elegir nada antes.",
                    estado: "Abierto", icono: "buscar", tono: "indigo", tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Trae lo vencido", accion: "Busca los documentos con saldo que ya vencieron.",
                    estado: "Trayendo datos", icono: "sistema", tono: "celeste", modo: "lee",
                    tablas: [
                        { nombre: "kardex clientes", nota: "saldo y vencimiento", contable: true },
                        { nombre: "mnombrerazsoc", nota: "nombre del cliente" },
                        { nombre: "zona", nota: "zona del cliente" },
                        { nombre: "mvendedores", nota: "nombre del vendedor" },
                        { nombre: "pbl_config", nota: "regla de la fecha de corte" },
                    ],
                },
                {
                    quien: "Tú", modulo: "Filtrar en pantalla", accion: "Acotas por zona o cliente y revisas la deuda en S/.",
                    estado: "En pantalla", icono: "filtro", tono: "violeta", tablas: [],
                },
                descargar("Exportas lo que tienes filtrado en pantalla."),
            ],
            tituloEfectos: "Lo que puedes sacar",
            efectos: [
                { modulo: "PDF", detalle: "saldos vencidos filtrados", icono: "documento" },
            ],
        },
        pasos: [],
    },
    {
        ruta: "/dashboard/reportes/documento-cliente",
        nombre: "Consulta Documento Clientes",
        grupo: GRUPO_COBRANZA,
        resumen: "Busca un documento por su tipo y número y muestra a qué cliente pertenece y cuánto se ha pagado.",
        diagrama: {
            titulo: "De dónde sale la consulta de un documento",
            ficha: "Consulta",
            nodos: [
                {
                    quien: "Tú", modulo: "Filtros", accion: "Eliges el tipo de documento y escribes serie y número.",
                    estado: "Filtros listos", icono: "filtro", tono: "indigo", tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Trae el documento", accion: "Busca ese documento con su cargo y sus pagos.",
                    estado: "Trayendo datos", icono: "sistema", tono: "celeste", modo: "lee",
                    tablas: [
                        { nombre: "kardex clientes", nota: "cargo y pagos del documento", contable: true },
                        { nombre: "mnombrerazsoc", nota: "nombre del cliente" },
                        { nombre: "mvendedores", nota: "nombre del vendedor" },
                        { nombre: "mtipodocumento", nota: "tipo de documento" },
                        { nombre: "mtipomoneda", nota: "símbolo de la moneda" },
                    ],
                },
                {
                    quien: "Tú", modulo: "Consulta en pantalla", accion: "Ves el cliente, las fechas y lo cobrado en S/.",
                    estado: "En pantalla", icono: "reporte", tono: "violeta", tablas: [],
                },
                descargar("Exportas la consulta."),
            ],
            tituloEfectos: "Lo que puedes sacar",
            efectos: [
                { modulo: "PDF", detalle: "consulta del documento", icono: "documento" },
            ],
        },
        pasos: [],
    },
    {
        ruta: "/dashboard/reportes/cobranza-ventas-mes",
        nombre: "Cobranza de Ventas por Mes",
        grupo: GRUPO_COBRANZA,
        resumen: "Muestra cuánto de lo vendido en un mes ya se cobró y cuánto falta cobrar.",
        diagrama: {
            titulo: "De dónde sale la cobranza de las ventas del mes",
            ficha: "Reporte",
            nodos: [
                {
                    quien: "Tú", modulo: "Filtros", accion: "Eliges el mes y el vendedor; puedes buscar un comprobante.",
                    estado: "Filtros listos", icono: "filtro", tono: "indigo", tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Trae las ventas", accion: "Busca los comprobantes emitidos en ese mes.",
                    estado: "Ventas del mes", icono: "comprobante", tono: "celeste", modo: "lee",
                    tablas: [
                        { nombre: "vta_comprobante_cab", nota: "comprobantes del mes" },
                        { nombre: "pedidocab", nota: "pedido y vendedor" },
                        { nombre: "mkardexinventarios", nota: "productos del comprobante", contable: true },
                    ],
                },
                {
                    quien: "Sistema", modulo: "Trae deuda y pagos", accion: "Cruza cada comprobante con su saldo y sus pagos.",
                    estado: "Deuda y pagos", icono: "calculo", tono: "ambar", modo: "lee",
                    tablas: [
                        { nombre: "kardex clientes", nota: "saldo de cada comprobante", contable: true },
                        { nombre: "amortizaciones", nota: "pagos del cliente", contable: true },
                        { nombre: "mnombrerazsoc", nota: "nombre comercial y zona" },
                    ],
                },
                {
                    quien: "Tú", modulo: "Reporte en pantalla", accion: "Ves lo vendido, lo cobrado y lo que falta en S/.",
                    estado: "En pantalla", icono: "reporte", tono: "violeta", tablas: [],
                },
                descargar("Exportas la lista de comprobantes."),
            ],
            tituloEfectos: "Lo que puedes sacar",
            efectos: [
                { modulo: "Excel", detalle: "comprobantes del mes", icono: "archivo" },
                { modulo: "PDF", detalle: "comprobantes con deuda o pagados", icono: "documento" },
            ],
        },
        pasos: [],
    },

    // ───────────────────────────── Ventas ─────────────────────────────
    {
        ruta: "/dashboard/reportes/ventas-totales",
        nombre: "Reporte de Ventas Totales",
        grupo: GRUPO_VENTAS,
        resumen: "Muestra lo vendido en un mes por laboratorio, línea y producto, con su costo y utilidad.",
        diagrama: {
            titulo: "De dónde salen las ventas totales del mes",
            ficha: "Reporte",
            nodos: [
                {
                    quien: "Tú", modulo: "Filtros", accion: "Eliges el mes y, si quieres, laboratorios y vendedores.",
                    estado: "Filtros listos", icono: "filtro", tono: "indigo", tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Trae las ventas", accion: "Suma lo vendido por laboratorio, línea y producto.",
                    estado: "Trayendo datos", icono: "sistema", tono: "celeste", modo: "lee",
                    tablas: [
                        { nombre: "mkardexinventarios", nota: "cantidad y venta en S/", contable: true },
                        { nombre: "marticulos", nota: "nombre del producto" },
                        { nombre: "mlote", nota: "línea del producto" },
                        { nombre: "mlineagenetica", nota: "laboratorio" },
                        { nombre: "mcostoarticulo", nota: "costo para la utilidad" },
                    ],
                },
                {
                    quien: "Tú", modulo: "Reporte en pantalla", accion: "Ves cantidad, venta, costo y utilidad en S/.",
                    estado: "En pantalla", icono: "reporte", tono: "violeta", tablas: [],
                },
                descargar("Exportas el reporte completo."),
            ],
            tituloEfectos: "Lo que puedes sacar",
            efectos: [
                { modulo: "PDF", detalle: "ventas totales del mes", icono: "documento" },
            ],
        },
        pasos: [],
    },
    {
        ruta: "/dashboard/reportes/informe-laboratorio-vendedor",
        nombre: "Ventas por Vendedor",
        grupo: GRUPO_VENTAS,
        resumen: "Muestra cuánto vendió cada vendedor por laboratorio en un mes y lo compara con su cuota.",
        diagrama: {
            titulo: "De dónde salen las ventas por vendedor y laboratorio",
            ficha: "Reporte",
            nodos: [
                {
                    quien: "Tú", modulo: "Filtros", accion: "Eliges el mes, los laboratorios y los vendedores.",
                    estado: "Filtros listos", icono: "filtro", tono: "indigo", tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Trae las ventas", accion: "Suma lo vendido por cada vendedor en cada laboratorio.",
                    estado: "Ventas del mes", icono: "sistema", tono: "celeste", modo: "lee",
                    tablas: [
                        { nombre: "mkardexinventarios", nota: "ventas por producto en S/", contable: true },
                        { nombre: "mvendedores", nota: "nombre del vendedor" },
                        { nombre: "marticulos", nota: "producto vendido" },
                        { nombre: "mlote", nota: "línea del producto" },
                        { nombre: "mlineagenetica", nota: "laboratorio" },
                    ],
                },
                {
                    quien: "Sistema", modulo: "Trae las cuotas", accion: "Busca la cuota del mes para comparar con la venta.",
                    estado: "Cuotas del mes", icono: "calculo", tono: "ambar", modo: "lee",
                    tablas: [
                        { nombre: "pbl_meta_ciclo", nota: "ciclo de metas del mes" },
                        { nombre: "pbl_meta_laboratorio_vendedor_item", nota: "cuota por vendedor y producto" },
                    ],
                },
                {
                    quien: "Tú", modulo: "Reporte en pantalla", accion: "Comparas venta y cuota en S/ y abres el detalle.",
                    estado: "En pantalla", icono: "reporte", tono: "violeta", tablas: [],
                },
                descargar("Exportas el informe o el detalle de un laboratorio."),
            ],
            tituloEfectos: "Lo que puedes sacar",
            efectos: [
                { modulo: "PDF", detalle: "informe por vendedor", icono: "documento" },
                { modulo: "Excel del detalle", detalle: "ventas de un laboratorio", icono: "archivo" },
                { modulo: "PDF del detalle", detalle: "ventas de un laboratorio", icono: "documento" },
            ],
        },
        pasos: [],
    },
    {
        ruta: "/dashboard/reportes/metas",
        nombre: "Metas Comerciales",
        grupo: GRUPO_VENTAS,
        resumen: "Compara lo vendido en un ciclo contra la meta de cada vendedor, laboratorio y producto.",
        diagrama: {
            titulo: "De dónde sale el avance de las metas",
            ficha: "Reporte",
            nodos: [
                {
                    quien: "Tú", modulo: "Filtros", accion: "Eliges el ciclo y si cuentas solo lo facturado.",
                    estado: "Ciclo elegido", icono: "calendario", tono: "indigo", tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Trae las metas", accion: "Busca las fechas del ciclo y la meta de cada vendedor.",
                    estado: "Metas del ciclo", icono: "sistema", tono: "ambar", modo: "lee",
                    tablas: [
                        { nombre: "pbl_meta_ciclo", nota: "ciclo y sus fechas" },
                        { nombre: "pbl_meta_laboratorio_vendedor_item", nota: "meta por vendedor y producto" },
                    ],
                },
                {
                    quien: "Sistema", modulo: "Trae las ventas", accion: "Suma lo vendido en esas fechas para medir el avance.",
                    estado: "Ventas del ciclo", icono: "calculo", tono: "celeste", modo: "lee",
                    tablas: [
                        { nombre: "mkardexinventarios", nota: "lo vendido en el ciclo", contable: true },
                        { nombre: "mvendedores", nota: "nombre del vendedor" },
                        { nombre: "mlineagenetica", nota: "laboratorio" },
                        { nombre: "marticulos", nota: "producto vendido" },
                        { nombre: "mnombrerazsoc", nota: "clientes atendidos" },
                    ],
                },
                {
                    quien: "Tú", modulo: "Avance en pantalla", accion: "Ves meta, venta en S/ y avance por vendedor y laboratorio.",
                    estado: "En pantalla", icono: "reporte", tono: "violeta", tablas: [],
                },
                descargar("Exportas el avance de los vendedores."),
            ],
            tituloEfectos: "Lo que puedes sacar",
            efectos: [
                { modulo: "PDF", detalle: "metas y avance por vendedor", icono: "documento" },
            ],
        },
        pasos: [],
    },
    {
        ruta: "/dashboard/reportes/hoja-en-blanco",
        nombre: "Hoja en Blanco",
        grupo: GRUPO_VENTAS,
        resumen: "Muestra los documentos de Hoja en Blanco (serie 0800) de un mes, con sus montos.",
        diagrama: {
            titulo: "De dónde salen los documentos de Hoja en Blanco",
            ficha: "Reporte",
            nodos: [
                {
                    quien: "Tú", modulo: "Filtros", accion: "Eliges el mes y, si quieres, vendedores o un cliente.",
                    estado: "Filtros listos", icono: "filtro", tono: "indigo", tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Trae los documentos", accion: "Busca los documentos serie 0800 de ese mes.",
                    estado: "Trayendo datos", icono: "sistema", tono: "celeste", modo: "lee",
                    tablas: [
                        { nombre: "registro de ventas (difar-p2025)", nota: "documento y sus montos", contable: true },
                        { nombre: "kardex clientes (difar-p2025)", nota: "vendedor del documento", contable: true },
                        { nombre: "mvendedores", nota: "nombre del vendedor" },
                        { nombre: "mnombrerazsoc", nota: "nombre del cliente" },
                    ],
                },
                {
                    quien: "Tú", modulo: "Reporte en pantalla", accion: "Ves cada documento con su base, IGV y total en S/.",
                    estado: "En pantalla", icono: "reporte", tono: "violeta", tablas: [],
                },
            ],
        },
        pasos: [],
    },
    {
        ruta: "/dashboard/reportes/registro-ventas-comprobantes",
        nombre: "Registro de Ventas / Comprobantes de Pago",
        grupo: GRUPO_VENTAS,
        resumen: "Lista las facturas y boletas emitidas entre dos fechas, con el detalle de sus productos.",
        diagrama: {
            titulo: "De dónde sale el registro de ventas por comprobante",
            ficha: "Reporte",
            nodos: [
                {
                    quien: "Tú", modulo: "Filtros", accion: "Eliges las fechas y el vendedor; puedes buscar un cliente.",
                    estado: "Filtros listos", icono: "filtro", tono: "indigo", tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Trae los comprobantes", accion: "Busca las facturas y boletas emitidas en esas fechas.",
                    estado: "Comprobantes", icono: "comprobante", tono: "celeste", modo: "lee",
                    tablas: [
                        { nombre: "vta_comprobante_cab", nota: "facturas y boletas" },
                        { nombre: "vta_comprobante_sunat", nota: "número y estado en SUNAT" },
                        { nombre: "vta_comprobante_anulado_sunat", nota: "comprobantes anulados" },
                        { nombre: "pedidocab", nota: "pedido y vendedor" },
                        { nombre: "mcondisionesdocs", nota: "condición de pago" },
                    ],
                },
                {
                    quien: "Sistema", modulo: "Trae los productos", accion: "Abre cada comprobante al detalle de sus productos.",
                    estado: "Con productos", icono: "producto", tono: "ambar", modo: "lee",
                    tablas: [
                        { nombre: "mkardexinventarios", nota: "productos y montos en S/", contable: true },
                        { nombre: "lgt_guia_rem_cab", nota: "guía de remisión del pedido" },
                        { nombre: "marticulos", nota: "nombre del producto" },
                    ],
                },
                {
                    quien: "Tú", modulo: "Reporte en pantalla", accion: "Ves cada comprobante con sus productos y totales en S/.",
                    estado: "En pantalla", icono: "reporte", tono: "violeta", tablas: [],
                },
                descargar("Exportas el registro."),
            ],
            tituloEfectos: "Lo que puedes sacar",
            efectos: [
                { modulo: "PDF", detalle: "registro de ventas", icono: "documento" },
            ],
        },
        pasos: [],
    },

    // ───────────────────────────── Inventario ─────────────────────────────
    {
        ruta: "/dashboard/reportes/item-kardex",
        nombre: "Reporte Kardex Item",
        grupo: GRUPO_INVENTARIO,
        resumen: "Muestra las entradas, salidas y el saldo de un producto entre dos fechas.",
        diagrama: {
            titulo: "De dónde sale el kardex de un producto",
            ficha: "Reporte",
            nodos: [
                {
                    quien: "Tú", modulo: "Filtros", accion: "Eliges el producto y las fechas de inicio y fin.",
                    estado: "Filtros listos", icono: "filtro", tono: "indigo", tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Trae los movimientos", accion: "Arma el saldo inicial y cada entrada y salida.",
                    estado: "Trayendo datos", icono: "almacen", tono: "celeste", modo: "lee",
                    tablas: [
                        { nombre: "mkardexinventarios", nota: "entradas, salidas y costo", contable: true },
                        { nombre: "marticulos", nota: "nombre del producto" },
                        { nombre: "mtipooperaciones", nota: "tipo de operación" },
                        { nombre: "malmacenes", nota: "almacén del movimiento" },
                        { nombre: "mnombrerazsoc", nota: "cliente o proveedor" },
                    ],
                },
                {
                    quien: "Tú", modulo: "Kardex en pantalla", accion: "Ves cada movimiento con su lote y el saldo que queda.",
                    estado: "En pantalla", icono: "reporte", tono: "violeta", tablas: [],
                },
                descargar("Exportas el kardex o abres un comprobante."),
            ],
            tituloEfectos: "Lo que puedes sacar",
            efectos: [
                { modulo: "PDF", detalle: "kardex del producto", icono: "documento" },
                { modulo: "Comprobante", detalle: "clic en el número abre su PDF", icono: "comprobante", desde: "vta_comprobante_sunat" },
            ],
        },
        pasos: [],
    },
    {
        ruta: "/dashboard/reportes/toma-inventario",
        nombre: "Toma de Inventario",
        grupo: GRUPO_INVENTARIO,
        resumen: "Saca la lista de productos o de lotes para contar el almacén y guarda el conteo que anotas.",
        diagrama: {
            titulo: "De dónde sale la lista y dónde se guarda el conteo",
            ficha: "Toma",
            nodos: [
                {
                    quien: "Tú", modulo: "Filtros", accion: "Eliges listado o lotes, el laboratorio, el almacén y la fecha.",
                    estado: "Filtros listos", icono: "filtro", tono: "indigo", tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Trae la lista", accion: "Busca los productos y el saldo de cada lote a esa fecha.",
                    estado: "Lista para contar", icono: "almacen", tono: "celeste", modo: "lee",
                    tablas: [
                        { nombre: "marticulos", nota: "productos a contar" },
                        { nombre: "mlote", nota: "línea del producto" },
                        { nombre: "mlineagenetica", nota: "laboratorio" },
                        { nombre: "mkardexinventarios", nota: "lote, vence y saldo", contable: true },
                        { nombre: "malmacenes", nota: "nombre del almacén" },
                    ],
                },
                {
                    quien: "Tú", modulo: "Abrir una toma", accion: "Guardas la lista como una toma tuya, con una observación.",
                    estado: "Toma abierta", icono: "planilla", tono: "ambar", modo: "graba",
                    tablas: [
                        { nombre: "t_ws_toma_inventario_cabecera", nota: "la toma, tu usuario y estado" },
                        { nombre: "t_ws_toma_inventario_detalle", nota: "cada línea a contar" },
                    ],
                },
                {
                    quien: "Tú", modulo: "Anotar el conteo", accion: "Escribes lo contado por línea o por lote y cierras la toma.",
                    estado: "Conteo guardado", icono: "validar", tono: "verde", modo: "graba",
                    tablas: [
                        { nombre: "t_ws_toma_inventario_detalle", nota: "conteo de cada línea" },
                        { nombre: "t_ws_toma_inventario_conteo_lote", nota: "cantidad, lote y vencimiento" },
                    ],
                },
            ],
            tituloEfectos: "Lo que puedes sacar",
            efectos: [
                { modulo: "PDF de la lista", detalle: "hoja para anotar el conteo", icono: "documento" },
                { modulo: "PDF de la toma", detalle: "tu toma con lo contado", icono: "documento", desde: "t_ws_toma_inventario_detalle" },
            ],
        },
        pasos: [],
    },
    {
        ruta: "/dashboard/reportes/psicotropicos",
        nombre: "Libro de Control · Psicotrópicos y Estupefacientes",
        grupo: GRUPO_INVENTARIO,
        resumen: "Muestra el libro oficial de un año con los movimientos y saldos de los productos fiscalizados.",
        diagrama: {
            titulo: "De dónde sale el libro de psicotrópicos",
            ficha: "Libro",
            nodos: [
                {
                    quien: "Tú", modulo: "Filtros", accion: "Eliges el año del libro.",
                    estado: "Año elegido", icono: "calendario", tono: "indigo", tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Trae los productos", accion: "Busca los productos fiscalizados y los datos del libro.",
                    estado: "Productos", icono: "producto", tono: "celeste", modo: "lee",
                    tablas: [
                        { nombre: "marticulos", nota: "productos fiscalizados" },
                        { nombre: "art_fiscaliz_conceptos", nota: "lista de fiscalización" },
                        { nombre: "mlineagenetica", nota: "laboratorio" },
                        { nombre: "libro_psico_config", nota: "director técnico y folio" },
                    ],
                },
                {
                    quien: "Sistema", modulo: "Trae los movimientos", accion: "Busca las entradas y salidas del año y el saldo inicial.",
                    estado: "Movimientos", icono: "almacen", tono: "ambar", modo: "lee",
                    tablas: [
                        { nombre: "mkardexinventarios", nota: "entradas, salidas y saldo", contable: true },
                        { nombre: "mnombrerazsoc", nota: "cliente o proveedor" },
                        { nombre: "vta_comprobante_sunat", nota: "si el documento tiene PDF" },
                    ],
                },
                {
                    quien: "Tú", modulo: "Libro en pantalla", accion: "Ves cada producto con sus movimientos y su saldo.",
                    estado: "En pantalla", icono: "libro", tono: "violeta", tablas: [],
                },
                descargar("Exportas el libro del año."),
            ],
            tituloEfectos: "Lo que puedes sacar",
            efectos: [
                { modulo: "Excel", detalle: "hojas Movimientos y Saldos", icono: "archivo" },
                { modulo: "PDF", detalle: "libro de control del año", icono: "documento" },
            ],
        },
        pasos: [],
    },
]

export const caminos: CaminoGuia[] = []
