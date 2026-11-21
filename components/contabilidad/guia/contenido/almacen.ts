import { CaminoGuia, PantallaGuia } from "../tipos"

// Guía IVAN · Almacén y Comprobantes (21/11/2026). Solo presentación con dibujo; los pasos se agregan después.
// Las tablas de cada dibujo están verificadas en los controllers y en el cuerpo de los SP:
//   Almacén      -> sp_ws_inv_ingreso_guardar / _kardex, sp_ws_inv_salida_guardar / _regenerar_kardex
//   Comprobantes -> pedidoController.generateCompr / generateNotaCredito y sus SP (_v2)
//   Procesar NC  -> asientosController.guardarAsiento -> sp_ws_diario_guardar_asiento

const RUTA_ALMACEN = "/dashboard/almacen"
const RUTA_INGRESOS = "/dashboard/almacen/ingresos"
const RUTA_SALIDAS = "/dashboard/almacen/salidas"
const RUTA_COMPROBANTES = "/dashboard/comprobantes"
const RUTA_PROCESAR_NC = "/dashboard/comprobantes/procesar-nota-credito"

export const pantallas: PantallaGuia[] = [
    // ─────────────────────────────────────────────────────────────────────
    {
        ruta: RUTA_ALMACEN,
        nombre: "Almacén",
        grupo: "Almacén",
        resumen: "Aquí eliges si vas a registrar un ingreso o una salida de mercadería del almacén.",
        diagrama: {
            titulo: "Cómo llega un movimiento de almacén al kardex",
            ficha: "Movimiento",
            nodos: [
                {
                    quien: "Almacenero", modulo: "Almacén", accion: "Elige qué va a registrar: un ingreso o una salida.",
                    estado: "Opción elegida", icono: "almacen", tono: "indigo",
                    tablas: [],
                },
                {
                    quien: "Almacenero", modulo: "Ingresos de Almacén", accion: "Registra lo que entra: compras, ajustes y otros ingresos.",
                    estado: "Nota de ingreso", icono: "proveedor", tono: "celeste",
                    tablas: [{ nombre: "mmovimientos ingreso", nota: "la nota de ingreso" }],
                },
                {
                    quien: "Almacenero", modulo: "Salidas de Almacén", accion: "Registra lo que sale y las transferencias entre almacenes.",
                    estado: "Nota de salida", icono: "enviar", tono: "ambar",
                    tablas: [{ nombre: "mmovimientos salidas", nota: "la nota de salida" }],
                },
                {
                    quien: "Sistema", modulo: "Kardex de inventario", accion: "Al guardar cada nota, anota el movimiento de cada producto.",
                    estado: "En el kardex", icono: "sistema", tono: "verde",
                    tablas: [
                        { nombre: "mkardexinventarios", nota: "entradas y salidas por lote", contable: true },
                        { nombre: "lotesxarticulo", nota: "lotes que ingresaron" },
                    ],
                },
            ],
            tituloEfectos: "El movimiento se ve en estos módulos",
            efectos: [
                { modulo: "Reporte Kardex Item", detalle: "muestra el movimiento", icono: "reporte", desde: "mkardexinventarios" },
                { modulo: "Toma de Inventario", detalle: "saldo por lote a contar", icono: "producto", desde: "mkardexinventarios" },
                { modulo: "Stock de pedidos", detalle: "compara pedido y saldo", icono: "pedido", desde: "mkardexinventarios" },
            ],
        },
        pasos: [],
    },

    // ─────────────────────────────────────────────────────────────────────
    {
        ruta: RUTA_INGRESOS,
        nombre: "Ingresos de Almacén",
        grupo: "Almacén",
        resumen: "Aquí registras las notas de ingreso de mercadería; al guardar se actualizan el kardex y los lotes.",
        diagrama: {
            titulo: "Qué tablas toca una nota de ingreso al guardarse",
            ficha: "Ingreso",
            nodos: [
                {
                    quien: "Almacenero", modulo: "Datos del ingreso", accion: "Elige concepto, documento, almacén, proveedor y fecha.",
                    estado: "Cabecera lista", icono: "documento", tono: "indigo",
                    tablas: [],
                },
                {
                    quien: "Almacenero", modulo: "Productos y lotes", accion: "Agrega cada producto con su cantidad, lote y vencimiento.",
                    estado: "Productos listos", icono: "producto", tono: "celeste", modo: "lee",
                    tablas: [{ nombre: "marticulos", nota: "catálogo de productos" }],
                },
                {
                    quien: "Almacenero", modulo: "Guardar nota", accion: "Guarda la nota. No deja si la fecha ya tiene cierre contable.",
                    estado: "Guardada", icono: "almacen", tono: "ambar",
                    tablas: [
                        { nombre: "mmovimientos ingreso", nota: "cabecera de la nota" },
                        { nombre: "mdetalle_mvto ingreso", nota: "cada producto ingresado" },
                    ],
                },
                {
                    quien: "Sistema", modulo: "Kardex y lotes", accion: "Suma lo ingresado al almacén y registra sus lotes.",
                    estado: "En el kardex", icono: "sistema", tono: "verde",
                    tablas: [
                        { nombre: "mkardexinventarios", nota: "entrada de cada producto", contable: true },
                        { nombre: "lotesxarticulo", nota: "lote y vencimiento" },
                    ],
                },
            ],
            tituloEfectos: "Lo ingresado se ve en estos módulos",
            efectos: [
                { modulo: "Reporte Kardex Item", detalle: "aparece la entrada", icono: "reporte", desde: "mkardexinventarios" },
                { modulo: "Toma de Inventario", detalle: "sube el saldo del lote", icono: "producto", desde: "mkardexinventarios" },
                { modulo: "Salidas de Almacén", detalle: "el lote ya tiene saldo", icono: "almacen", desde: "mkardexinventarios" },
            ],
        },
        pasos: [],
    },

    // ─────────────────────────────────────────────────────────────────────
    {
        ruta: RUTA_SALIDAS,
        nombre: "Salidas de Almacén",
        grupo: "Almacén",
        resumen: "Aquí registras las notas de salida y las transferencias entre almacenes; al guardar se actualiza el kardex.",
        diagrama: {
            titulo: "Qué tablas toca una nota de salida al guardarse",
            ficha: "Salida",
            nodos: [
                {
                    quien: "Almacenero", modulo: "Datos de la salida", accion: "Elige concepto, documento, almacén de origen y cliente.",
                    estado: "Cabecera lista", icono: "documento", tono: "indigo",
                    tablas: [],
                },
                {
                    quien: "Almacenero", modulo: "Productos y lotes", accion: "Elige el producto y el lote; ve el saldo que tiene cada lote.",
                    estado: "Productos listos", icono: "producto", tono: "celeste", modo: "lee",
                    tablas: [{ nombre: "mkardexinventarios", nota: "saldo de cada lote", contable: true }],
                },
                {
                    quien: "Almacenero", modulo: "Guardar nota", accion: "Guarda la nota. No deja si la fecha ya tiene cierre contable.",
                    estado: "Guardada", icono: "almacen", tono: "ambar",
                    tablas: [
                        { nombre: "mmovimientos salidas", nota: "cabecera de la nota" },
                        { nombre: "mdetalle_mvto salidas", nota: "cada producto que sale" },
                    ],
                },
                {
                    quien: "Sistema", modulo: "Kardex de inventario", accion: "Resta del almacén. Si es transferencia, suma en el destino.",
                    estado: "En el kardex", icono: "sistema", tono: "verde",
                    tablas: [{ nombre: "mkardexinventarios", nota: "salida (y entrada al destino)", contable: true }],
                },
            ],
            tituloEfectos: "Lo que salió se ve en estos módulos",
            efectos: [
                { modulo: "Reporte Kardex Item", detalle: "aparece la salida", icono: "reporte", desde: "mkardexinventarios" },
                { modulo: "Toma de Inventario", detalle: "baja el saldo del lote", icono: "producto", desde: "mkardexinventarios" },
                { modulo: "Stock de pedidos", detalle: "hay menos para vender", icono: "pedido", desde: "mkardexinventarios" },
            ],
        },
        pasos: [],
    },

    // ─────────────────────────────────────────────────────────────────────
    {
        ruta: RUTA_COMPROBANTES,
        nombre: "Gestión de Comprobantes",
        grupo: "Comprobantes",
        resumen: "Aquí facturas los pedidos, envías las facturas y boletas a SUNAT y emites notas de crédito y guías.",
        diagrama: {
            titulo: "Qué pasa al facturar un pedido",
            ficha: "Comprobante",
            nodos: [
                {
                    quien: "Facturación", modulo: "Pedidos por Facturar", accion: "Elige el pedido, el tipo de comprobante y las cuotas.",
                    estado: "Pedido elegido", icono: "pedido", tono: "indigo", modo: "lee",
                    tablas: [{ nombre: "pedidocab", nota: "pedidos listos para facturar" }],
                },
                {
                    quien: "Sistema", modulo: "Armar comprobante", accion: "Crea la factura o boleta con los productos y totales en S/.",
                    estado: "Comprobante creado", icono: "comprobante", tono: "ambar",
                    tablas: [{ nombre: "vta_comprobante_cab", nota: "el comprobante y su detalle" }],
                },
                {
                    quien: "Sistema", modulo: "Facturación electrónica", accion: "Lo envía a SUNAT y guarda la respuesta y el PDF.",
                    estado: "Aceptado por SUNAT", icono: "sunat", tono: "celeste",
                    tablas: [{ nombre: "vta_comprobante_sunat", nota: "respuesta de SUNAT, PDF y XML" }],
                },
                {
                    quien: "Sistema", modulo: "Kardex y ventas", accion: "Si SUNAT acepta: carga la deuda, descuenta stock y anota la venta.",
                    estado: "Registrado", icono: "libro", tono: "verde",
                    tablas: [
                        { nombre: "kardex clientes", nota: "la deuda del cliente en S/", contable: true },
                        { nombre: "mkardexinventarios", nota: "salida de los productos", contable: true },
                        { nombre: "registro de ventas", nota: "la venta del periodo", contable: true },
                    ],
                },
                {
                    quien: "Facturación", modulo: "Notas de Crédito", accion: "Si hay devolución o descuento, emite la nota de crédito.",
                    estado: "Nota de crédito", icono: "documento", tono: "violeta",
                    tablas: [
                        { nombre: "vta_comprobante_sunat", nota: "la nota de crédito enviada" },
                        { nombre: "kardex clientes", nota: "abono a favor del cliente", contable: true },
                        { nombre: "mkardexinventarios", nota: "devolución al almacén", contable: true },
                    ],
                },
            ],
            tituloEfectos: "El comprobante llega a estos módulos",
            efectos: [
                { modulo: "Registro de Ventas", detalle: "ya figura la venta", icono: "libro", desde: "registro de ventas" },
                { modulo: "Cliente Cobranza", detalle: "la factura queda por cobrar", icono: "cliente", desde: "kardex clientes" },
                { modulo: "Reporte Kardex Item", detalle: "aparece la salida", icono: "reporte", desde: "mkardexinventarios" },
            ],
        },
        pasos: [],
    },

    // ─────────────────────────────────────────────────────────────────────
    {
        ruta: RUTA_PROCESAR_NC,
        nombre: "Procesar Nota de Crédito",
        grupo: "Comprobantes",
        resumen: "Aquí registras el asiento contable que aplica una nota de crédito contra un comprobante del cliente.",
        diagrama: {
            titulo: "Qué tablas toca aplicar una nota de crédito",
            ficha: "Asiento",
            nodos: [
                {
                    quien: "Contabilidad", modulo: "Elegir nota de crédito", accion: "Busca la nota de crédito emitida que vas a aplicar.",
                    estado: "Nota elegida", icono: "buscar", tono: "indigo", modo: "lee",
                    tablas: [{ nombre: "vta_comprobante_sunat", nota: "notas de crédito emitidas" }],
                },
                {
                    quien: "Contabilidad", modulo: "Elegir comprobante", accion: "Elige la factura o boleta del cliente a la que se aplica.",
                    estado: "Comprobante elegido", icono: "comprobante", tono: "celeste", modo: "lee",
                    tablas: [{ nombre: "kardex clientes", nota: "documentos del cliente", contable: true }],
                },
                {
                    quien: "Contabilidad", modulo: "Asiento contable", accion: "Revisa las líneas: el debe y el haber deben cuadrar en S/.",
                    estado: "Asiento cuadrado", icono: "calculo", tono: "ambar",
                    tablas: [
                        { nombre: "diario encabezado", nota: "voucher, fecha y glosa", contable: true },
                        { nombre: "diario centralizacion", nota: "las líneas del asiento", contable: true },
                    ],
                },
                {
                    quien: "Sistema", modulo: "Aceptar y procesar", accion: "Aplica la nota: baja el saldo de la factura y pasa al mayor.",
                    estado: "Procesada", icono: "validar", tono: "verde",
                    tablas: [
                        { nombre: "kardex clientes", nota: "baja el saldo de la factura", contable: true },
                        { nombre: "mayor auxiliar", nota: "el asiento contable", contable: true },
                        { nombre: "cnt_asiento_nc_historial", nota: "quién la procesó y cuándo" },
                    ],
                },
            ],
            tituloEfectos: "Al procesar, llega a estos módulos",
            efectos: [
                { modulo: "Cliente Cobranza", detalle: "la factura debe menos", icono: "cliente", desde: "kardex clientes" },
                { modulo: "Libros Contables", detalle: "el asiento ya figura", icono: "libro", desde: "mayor auxiliar" },
                { modulo: "Historial de procesos", detalle: "se puede revertir", icono: "archivo", desde: "cnt_asiento_nc_historial" },
            ],
        },
        pasos: [],
    },
]

export const caminos: CaminoGuia[] = []
