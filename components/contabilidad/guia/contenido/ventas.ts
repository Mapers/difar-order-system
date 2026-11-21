import { CaminoGuia, PantallaGuia } from "../tipos"

// Guía IVAN · Ventas, Pedidos, Clientes y Productos (21/11/2026).
// Las tablas de cada dibujo están verificadas en el código y en los SP; lo que no se pudo verificar se omite.

export const pantallas: PantallaGuia[] = [
    // ─────────────────────────────────────────────────────────────────────
    {
        ruta: "/dashboard",
        nombre: "Panel de Control",
        grupo: "Inicio",
        resumen: "Es la pantalla de inicio: un resumen de clientes, productos, pedidos y ventas en S/.",
        diagrama: {
            titulo: "De dónde salen las cifras del Panel de Control",
            ficha: "Resumen",
            nodos: [
                {
                    quien: "Usuario", modulo: "Panel de Control", accion: "Entra al sistema y se abre el resumen del día.",
                    estado: "Abriendo", icono: "reporte", tono: "indigo",
                    tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Conteos", accion: "Cuenta clientes, productos y pedidos de hoy.",
                    estado: "Contando", icono: "calculo", tono: "ambar", modo: "lee",
                    tablas: [
                        { nombre: "mnombrerazsoc", nota: "clientes" },
                        { nombre: "marticulos", nota: "productos" },
                        { nombre: "pedidocab", nota: "pedidos" },
                    ],
                },
                {
                    quien: "Sistema", modulo: "Ventas facturadas", accion: "Suma las ventas en S/ por día y por mes, y los clientes frecuentes.",
                    estado: "Ventas sumadas", icono: "comprobante", tono: "celeste", modo: "lee",
                    tablas: [
                        { nombre: "vta_comprobante_cab", nota: "comprobantes emitidos" },
                        { nombre: "vta_comprobante_sunat", nota: "número y tipo del comprobante" },
                        { nombre: "vta_comprobante_anulado_sunat", nota: "los anulados no cuentan" },
                        { nombre: "kardex clientes", nota: "solo ventas ya registradas", contable: true },
                    ],
                },
                {
                    quien: "Usuario", modulo: "Tarjetas y gráficos", accion: "Lee las cifras. Aquí no se graba nada.",
                    estado: "Solo consulta", icono: "buscar", tono: "verde",
                    tablas: [],
                },
            ],
        },
        pasos: [],
    },
    // ─────────────────────────────────────────────────────────────────────
    {
        ruta: "/dashboard/tomar-pedido",
        nombre: "Tomar Pedido",
        grupo: "Pedidos",
        resumen: "Aquí registras el pedido de un cliente paso a paso: cliente, productos y resumen.",
        diagrama: {
            titulo: "Qué lee y qué graba el sistema al tomar un pedido",
            ficha: "Pedido",
            nodos: [
                {
                    quien: "Vendedor", modulo: "Elegir cliente", accion: "Busca al cliente y elige su condición de pago.",
                    estado: "Cliente elegido", icono: "cliente", tono: "indigo", modo: "lee",
                    tablas: [
                        { nombre: "mnombrerazsoc", nota: "datos del cliente" },
                        { nombre: "mcondisionesdocs", nota: "condiciones de pago" },
                    ],
                },
                {
                    quien: "Vendedor", modulo: "Agregar productos", accion: "Elige productos del almacén: ve precio, stock y promociones.",
                    estado: "Productos listos", icono: "producto", tono: "ambar", modo: "lee",
                    tablas: [
                        { nombre: "lista_precios", nota: "precio en S/" },
                        { nombre: "mkardexinventarios", nota: "stock por lote", contable: true },
                        { nombre: "vta_escalas", nota: "precio por cantidad" },
                        { nombre: "vta_bonificaciones", nota: "regalos por cantidad" },
                    ],
                },
                {
                    quien: "Sistema", modulo: "Borrador", accion: "Guarda el avance para retomarlo si se cierra la pantalla.",
                    estado: "Borrador", icono: "archivo", tono: "celeste",
                    tablas: [{ nombre: "pedido_borradores", nota: "pedido a medio hacer" }],
                },
                {
                    quien: "Vendedor", modulo: "Confirmar pedido", accion: "Revisa el resumen con el total en S/ y confirma.",
                    estado: "Pendiente", icono: "pedido", tono: "verde",
                    tablas: [
                        { nombre: "t_pedidocab", nota: "cabecera del pedido" },
                        { nombre: "t_pedidodet", nota: "cada producto pedido" },
                    ],
                },
                {
                    quien: "Sistema", modulo: "Aviso", accion: "Avisa del pedido nuevo; si lleva regalo, pide autorización.",
                    estado: "Avisado", icono: "enviar", tono: "violeta",
                    tablas: [],
                },
            ],
            tituloEfectos: "El pedido grabado llega a estos módulos",
            efectos: [
                { modulo: "Mis Pedidos", detalle: "aparece como Pendiente", icono: "pedido", desde: "t_pedidocab" },
                { modulo: "Estados de Pedidos", detalle: "ahí lo validan", icono: "validar", desde: "t_pedidocab" },
                { modulo: "Stock comprometido", detalle: "cuenta lo ya pedido", icono: "almacen", desde: "t_pedidodet" },
            ],
        },
        pasos: [],
    },
    // ─────────────────────────────────────────────────────────────────────
    {
        ruta: "/dashboard/tomar-pedido-alpha",
        nombre: "Tomar Pedido (Alpha)",
        grupo: "Pedidos",
        resumen: "Es la versión nueva de Tomar Pedido: cliente, productos y resumen en una sola pantalla.",
        diagrama: {
            titulo: "Tomar un pedido en una sola pantalla",
            ficha: "Pedido",
            nodos: [
                {
                    quien: "Vendedor", modulo: "Cliente", accion: "Busca al cliente y elige su condición de pago.",
                    estado: "Cliente elegido", icono: "cliente", tono: "indigo", modo: "lee",
                    tablas: [
                        { nombre: "mnombrerazsoc", nota: "datos del cliente" },
                        { nombre: "mcondisionesdocs", nota: "condiciones de pago" },
                    ],
                },
                {
                    quien: "Vendedor", modulo: "Productos", accion: "Agrega productos: ve precio, stock y promociones.",
                    estado: "Productos listos", icono: "producto", tono: "ambar", modo: "lee",
                    tablas: [
                        { nombre: "lista_precios", nota: "precio en S/" },
                        { nombre: "mkardexinventarios", nota: "stock por lote", contable: true },
                        { nombre: "vta_escalas", nota: "precio por cantidad" },
                        { nombre: "vta_bonificaciones", nota: "regalos por cantidad" },
                    ],
                },
                {
                    quien: "Vendedor", modulo: "Resumen al costado", accion: "Ve el total en S/ al lado, sin cambiar de paso.",
                    estado: "Total listo", icono: "calculo", tono: "celeste",
                    tablas: [],
                },
                {
                    quien: "Vendedor", modulo: "Confirmar pedido", accion: "Confirma y el pedido queda grabado.",
                    estado: "Pendiente", icono: "pedido", tono: "verde",
                    tablas: [
                        { nombre: "t_pedidocab", nota: "cabecera del pedido" },
                        { nombre: "t_pedidodet", nota: "cada producto pedido" },
                    ],
                },
            ],
            tituloEfectos: "El pedido grabado llega a estos módulos",
            efectos: [
                { modulo: "Mis Pedidos", detalle: "aparece como Pendiente", icono: "pedido", desde: "t_pedidocab" },
                { modulo: "Estados de Pedidos", detalle: "ahí lo validan", icono: "validar", desde: "t_pedidocab" },
                { modulo: "Stock comprometido", detalle: "cuenta lo ya pedido", icono: "almacen", desde: "t_pedidodet" },
            ],
        },
        pasos: [],
    },
    // ─────────────────────────────────────────────────────────────────────
    {
        ruta: "/dashboard/mis-pedidos",
        nombre: "Mis Pedidos",
        grupo: "Pedidos",
        resumen: "Aquí ves los pedidos tomados, su detalle y, si eres administrador, autorizas los que lo piden.",
        diagrama: {
            titulo: "Qué pasa con un pedido en Mis Pedidos",
            ficha: "Pedido",
            nodos: [
                {
                    quien: "Vendedor", modulo: "Mis Pedidos", accion: "Busca sus pedidos por fecha o por cliente.",
                    estado: "En la lista", icono: "buscar", tono: "indigo", modo: "lee",
                    tablas: [
                        { nombre: "t_pedidocab", nota: "pedidos tomados" },
                        { nombre: "pedidocab", nota: "pedidos ya validados" },
                        { nombre: "mnombrerazsoc", nota: "nombre del cliente" },
                    ],
                },
                {
                    quien: "Vendedor", modulo: "Ver detalle", accion: "Abre el pedido y revisa productos y totales en S/.",
                    estado: "Detalle abierto", icono: "documento", tono: "celeste", modo: "lee",
                    tablas: [{ nombre: "t_pedidodet", nota: "productos del pedido" }],
                },
                {
                    quien: "Vendedor", modulo: "Editar pedido", accion: "Cambia el cliente, la condición o los productos.",
                    estado: "Editado", icono: "pedido", tono: "ambar",
                    tablas: [
                        { nombre: "t_pedidocab", nota: "cliente y condición" },
                        { nombre: "t_pedidodet", nota: "productos corregidos" },
                    ],
                },
                {
                    quien: "Administrador", modulo: "Autorizar pedido", accion: "Aprueba o rechaza el pedido que pide autorización.",
                    estado: "Autorizado", icono: "validar", tono: "verde",
                    tablas: [{ nombre: "t_pedidocab", nota: "autorizado: sí o no" }],
                },
            ],
            tituloEfectos: "Después, el pedido sigue por aquí",
            efectos: [
                { modulo: "Estados de Pedidos", detalle: "ahí lo validan y avanza", icono: "validar", desde: "t_pedidocab" },
                { modulo: "Comprobantes", detalle: "se factura el pedido validado", icono: "comprobante", desde: "pedidocab" },
            ],
        },
        pasos: [],
    },
    // ─────────────────────────────────────────────────────────────────────
    {
        ruta: "/dashboard/estados-pedidos",
        nombre: "Gestión de Estados de Pedidos",
        grupo: "Pedidos",
        resumen: "Aquí haces avanzar cada pedido: de Pendiente a Validado, Listo para Despacho y Entregado.",
        diagrama: {
            titulo: "Qué se graba cuando un pedido cambia de estado",
            ficha: "Pedido",
            nodos: [
                {
                    quien: "Administrador", modulo: "Buscar pedidos", accion: "Busca los pedidos y los filtra por estado.",
                    estado: "Pendiente", icono: "filtro", tono: "indigo", modo: "lee",
                    tablas: [
                        { nombre: "t_pedidocab", nota: "pedidos tomados" },
                        { nombre: "vta_estado_pedido", nota: "lista de estados" },
                    ],
                },
                {
                    quien: "Administrador", modulo: "Validar pedido", accion: "Al validar, el pedido se copia a los pedidos definitivos.",
                    estado: "Validado", icono: "validar", tono: "ambar",
                    tablas: [
                        { nombre: "pedidocab", nota: "pedido definitivo" },
                        { nombre: "pedidodet", nota: "sus productos" },
                    ],
                },
                {
                    quien: "Administrador", modulo: "Cambiar estado", accion: "Pasa el pedido al siguiente estado, con una nota.",
                    estado: "Listo para Despacho", icono: "enviar", tono: "celeste",
                    tablas: [{ nombre: "t_pedidocab", nota: "estado nuevo" }],
                },
                {
                    quien: "Sistema", modulo: "Historial de estados", accion: "Anota cada cambio: estado, usuario, hora y nota.",
                    estado: "Anotado", icono: "libro", tono: "verde",
                    tablas: [{ nombre: "t_pedido_estado_historial", nota: "cada cambio de estado" }],
                },
            ],
            tituloEfectos: "El cambio de estado llega a estos módulos",
            efectos: [
                { modulo: "Comprobantes", detalle: "factura el pedido validado", icono: "comprobante", desde: "pedidocab" },
                { modulo: "Mis Pedidos", detalle: "el vendedor ve el estado", icono: "pedido", desde: "t_pedidocab" },
                { modulo: "Línea de tiempo", detalle: "quién cambió y cuándo", icono: "calendario", desde: "t_pedido_estado_historial" },
            ],
        },
        pasos: [],
    },
    // ─────────────────────────────────────────────────────────────────────
    {
        ruta: "/dashboard/clientes",
        nombre: "Clientes",
        grupo: "Clientes",
        resumen: "Aquí ves tu cartera de clientes, registras clientes nuevos y revisas sus documentos.",
        diagrama: {
            titulo: "Qué tablas toca la ficha de un cliente",
            ficha: "Cliente",
            nodos: [
                {
                    quien: "Vendedor", modulo: "Lista de Clientes", accion: "Busca en su cartera por nombre, documento o zona.",
                    estado: "En la lista", icono: "buscar", tono: "indigo", modo: "lee",
                    tablas: [
                        { nombre: "mnombrerazsoc", nota: "ficha del cliente" },
                        { nombre: "zona", nota: "zona del cliente" },
                        { nombre: "mvendedores", nota: "vendedor asignado" },
                    ],
                },
                {
                    quien: "Vendedor", modulo: "Solicitar cliente", accion: "Pide el alta de un cliente nuevo con su RUC.",
                    estado: "Solicitado", icono: "enviar", tono: "ambar",
                    tablas: [{ nombre: "solicitudes_cliente", nota: "pedidos de alta por RUC" }],
                },
                {
                    quien: "Usuario", modulo: "Nuevo / Editar cliente", accion: "Llena o corrige la ficha del cliente y la guarda.",
                    estado: "Guardado", icono: "cliente", tono: "celeste",
                    tablas: [{ nombre: "mnombrerazsoc", nota: "datos del cliente" }],
                },
                {
                    quien: "Evaluador", modulo: "Documentos del cliente", accion: "Revisa cada documento obligatorio y anota observaciones.",
                    estado: "Evaluado", icono: "validar", tono: "verde",
                    tablas: [{ nombre: "t_evaluacion_cliente_doc", nota: "documentos revisados" }],
                },
            ],
            tituloEfectos: "La ficha del cliente se usa en estos módulos",
            efectos: [
                { modulo: "Tomar Pedido", detalle: "ya se le puede vender", icono: "pedido", desde: "mnombrerazsoc" },
                { modulo: "Rutas Semanales", detalle: "entra a las rutas de su zona", icono: "ruta", desde: "mnombrerazsoc" },
                { modulo: "Comprobantes", detalle: "sus datos van en la factura", icono: "comprobante", desde: "mnombrerazsoc" },
            ],
        },
        pasos: [],
    },
    // ─────────────────────────────────────────────────────────────────────
    {
        ruta: "/dashboard/productos",
        nombre: "Productos",
        grupo: "Productos",
        resumen: "Aquí consultas la lista de productos con su stock y sus precios en S/ a una fecha.",
        diagrama: {
            titulo: "De dónde sale la lista de productos a una fecha",
            ficha: "Consulta",
            nodos: [
                {
                    quien: "Vendedor", modulo: "Productos", accion: "Elige la fecha de corte y pulsa Buscar.",
                    estado: "Fecha elegida", icono: "calendario", tono: "indigo",
                    tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Stock a la fecha", accion: "Suma entradas y salidas de cada producto hasta esa fecha.",
                    estado: "Stock calculado", icono: "almacen", tono: "ambar", modo: "lee",
                    tablas: [
                        { nombre: "mkardexinventarios", nota: "entradas y salidas", contable: true },
                        { nombre: "marticulos", nota: "nombre y unidad" },
                        { nombre: "mlote", nota: "grupo del producto" },
                    ],
                },
                {
                    quien: "Sistema", modulo: "Precios vigentes", accion: "Agrega los precios en S/ más recientes.",
                    estado: "Con precios", icono: "precio", tono: "celeste", modo: "lee",
                    tablas: [{ nombre: "lista_precios", nota: "precios en S/" }],
                },
                {
                    quien: "Vendedor", modulo: "Lista de Productos", accion: "Revisa la lista por páginas. Aquí no se graba nada.",
                    estado: "Solo consulta", icono: "producto", tono: "verde",
                    tablas: [],
                },
            ],
        },
        pasos: [],
    },
    // ─────────────────────────────────────────────────────────────────────
    {
        ruta: "/dashboard/lista-precios-lote",
        nombre: "Lista de Precios por Lote",
        grupo: "Productos",
        resumen: "Aquí ves precios y stock por lote, y el administrador cambia precios o crea productos.",
        diagrama: {
            titulo: "Qué lee y qué graba la Lista de Precios por Lote",
            ficha: "Precio",
            nodos: [
                {
                    quien: "Usuario", modulo: "Lista de Precios", accion: "Filtra por laboratorio o nombre: ve precio y stock por lote.",
                    estado: "En la lista", icono: "buscar", tono: "indigo", modo: "lee",
                    tablas: [
                        { nombre: "marticulos", nota: "productos" },
                        { nombre: "lista_precios", nota: "precios en S/" },
                        { nombre: "mkardexinventarios", nota: "stock por lote", contable: true },
                    ],
                },
                {
                    quien: "Administrador", modulo: "Editar precio", accion: "Cambia los precios en S/ de un producto.",
                    estado: "Precio nuevo", icono: "precio", tono: "ambar",
                    tablas: [
                        { nombre: "lista_precios", nota: "precio nuevo" },
                        { nombre: "preciosxtipo", nota: "precio por tipo" },
                    ],
                },
                {
                    quien: "Administrador", modulo: "Afectación de IGV", accion: "Marca si el producto lleva IGV o es inafecto.",
                    estado: "IGV definido", icono: "sunat", tono: "celeste",
                    tablas: [{ nombre: "vta_prod_inafectos", nota: "productos sin IGV" }],
                },
                {
                    quien: "Administrador", modulo: "Crear producto", accion: "Registra un producto nuevo con su código y precios.",
                    estado: "Producto creado", icono: "producto", tono: "verde",
                    tablas: [{ nombre: "marticulos", nota: "ficha del producto" }],
                },
                {
                    quien: "Usuario", modulo: "Exportar", accion: "Descarga la lista en Excel o PDF.",
                    estado: "Descargado", icono: "archivo", tono: "violeta",
                    tablas: [],
                },
            ],
            tituloEfectos: "El precio guardado llega a estos módulos",
            efectos: [
                { modulo: "Tomar Pedido", detalle: "vende con el precio nuevo", icono: "pedido", desde: "lista_precios" },
                { modulo: "Tomar Pedido", detalle: "sabe si lleva IGV", icono: "sunat", desde: "vta_prod_inafectos" },
                { modulo: "Promociones", detalle: "muestra el precio base", icono: "precio", desde: "lista_precios" },
            ],
        },
        pasos: [],
    },
    // ─────────────────────────────────────────────────────────────────────
    {
        ruta: "/dashboard/escalas-bonificaciones",
        nombre: "Gestión de Promociones",
        grupo: "Productos",
        resumen: "Aquí defines las escalas de precio y las bonificaciones (regalos) de cada producto.",
        diagrama: {
            titulo: "Dónde se guardan las escalas y las bonificaciones",
            ficha: "Promoción",
            nodos: [
                {
                    quien: "Administrador", modulo: "Promociones", accion: "Ve qué productos ya tienen escala o bonificación.",
                    estado: "En la lista", icono: "buscar", tono: "indigo", modo: "lee",
                    tablas: [
                        { nombre: "marticulos", nota: "productos" },
                        { nombre: "lista_precios", nota: "precio base en S/" },
                    ],
                },
                {
                    quien: "Administrador", modulo: "Escala de precios", accion: "Define el precio en S/ según la cantidad comprada.",
                    estado: "Escala guardada", icono: "precio", tono: "ambar",
                    tablas: [{ nombre: "vta_escalas", nota: "mínimo, máximo y precio" }],
                },
                {
                    quien: "Administrador", modulo: "Bonificación", accion: "Define qué producto se regala y por cuánta cantidad.",
                    estado: "Bono guardado", icono: "comision", tono: "celeste",
                    tablas: [{ nombre: "vta_bonificaciones", nota: "cantidad y regalo" }],
                },
                {
                    quien: "Administrador", modulo: "Quitar promoción", accion: "Borra las escalas y bonificaciones de un producto.",
                    estado: "Sin promoción", icono: "validar", tono: "violeta",
                    tablas: [
                        { nombre: "vta_escalas", nota: "se borran sus escalas" },
                        { nombre: "vta_bonificaciones", nota: "se borran sus bonos" },
                    ],
                },
            ],
            tituloEfectos: "La promoción guardada llega a estos módulos",
            efectos: [
                { modulo: "Tomar Pedido", detalle: "aplica el precio por cantidad", icono: "pedido", desde: "vta_escalas" },
                { modulo: "Tomar Pedido", detalle: "agrega el regalo", icono: "producto", desde: "vta_bonificaciones" },
                { modulo: "Lista de Precios", detalle: "muestra la promoción", icono: "precio", desde: "vta_escalas" },
            ],
        },
        pasos: [],
    },
    // ─────────────────────────────────────────────────────────────────────
    {
        ruta: "/dashboard/cronograma",
        nombre: "Calendario de Vencimientos",
        grupo: "Ventas",
        resumen: "Aquí ves en un calendario qué facturas y boletas vencen cada día y cuánto falta cobrar en S/.",
        diagrama: {
            titulo: "De dónde sale el Calendario de Vencimientos",
            ficha: "Vencimiento",
            nodos: [
                {
                    quien: "Usuario", modulo: "Calendario", accion: "Elige el mes y, si quiere, un vendedor o un cliente.",
                    estado: "Filtros listos", icono: "calendario", tono: "indigo",
                    tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Comprobantes emitidos", accion: "Trae facturas y boletas con su fecha de vencimiento.",
                    estado: "Comprobantes", icono: "comprobante", tono: "ambar", modo: "lee",
                    tablas: [
                        { nombre: "vta_comprobante_cab", nota: "comprobante y vencimiento" },
                        { nombre: "vta_comprobante_sunat", nota: "número del comprobante" },
                        { nombre: "pedidocab", nota: "pedido y vendedor" },
                        { nombre: "mcondisionesdocs", nota: "condición de pago" },
                    ],
                },
                {
                    quien: "Sistema", modulo: "Saldo pendiente", accion: "Deja solo los documentos que todavía deben en S/.",
                    estado: "Con saldo", icono: "calculo", tono: "celeste", modo: "lee",
                    tablas: [{ nombre: "kardex clientes", nota: "lo que falta cobrar", contable: true }],
                },
                {
                    quien: "Usuario", modulo: "Ver el día", accion: "Abre un día y revisa cada comprobante. No se graba nada.",
                    estado: "Solo consulta", icono: "buscar", tono: "verde",
                    tablas: [],
                },
            ],
        },
        pasos: [],
    },
    // ─────────────────────────────────────────────────────────────────────
    {
        ruta: "/dashboard/ruta-semanal",
        nombre: "Rutas Semanales",
        grupo: "Ventas",
        resumen: "Aquí se arman las rutas de visita de cada vendedor por día y se marca cada visita hecha.",
        diagrama: {
            titulo: "Qué se graba al armar y recorrer una ruta",
            ficha: "Ruta",
            nodos: [
                {
                    quien: "Usuario", modulo: "Nueva ruta", accion: "Crea la ruta con su nombre, día, vendedor y zona.",
                    estado: "Ruta creada", icono: "ruta", tono: "indigo",
                    tablas: [{ nombre: "ws_rutas", nota: "día, vendedor y zona" }],
                },
                {
                    quien: "Usuario", modulo: "Clientes de la ruta", accion: "Elige los clientes de la zona y el orden de visita.",
                    estado: "Con clientes", icono: "cliente", tono: "ambar",
                    tablas: [{ nombre: "ws_ruta_cliente", nota: "cliente y orden de visita" }],
                },
                {
                    quien: "Vendedor", modulo: "Registrar visita", accion: "Marca el resultado de cada visita, con un comentario.",
                    estado: "Visitado", icono: "validar", tono: "celeste",
                    tablas: [{ nombre: "ws_ruta_cliente", nota: "estado y comentario" }],
                },
                {
                    quien: "Usuario", modulo: "Mapa e historial", accion: "Ve la ruta en el mapa y las visitas de otras fechas.",
                    estado: "Solo consulta", icono: "buscar", tono: "verde", modo: "lee",
                    tablas: [
                        { nombre: "ws_rutas", nota: "rutas armadas" },
                        { nombre: "mcoordenadasclientes", nota: "ubicación del cliente" },
                    ],
                },
            ],
            tituloEfectos: "La ruta guardada también se usa aquí",
            efectos: [
                { modulo: "IVAN", detalle: "responde sobre tu ruta", icono: "chat", desde: "ws_rutas" },
            ],
        },
        pasos: [],
    },
    // ─────────────────────────────────────────────────────────────────────
    {
        ruta: "/dashboard/chat",
        nombre: "IVAN",
        grupo: "Asistente",
        resumen: "Aquí conversas con IVAN, el asistente del sistema, a pantalla completa.",
        diagrama: {
            titulo: "Qué hace el sistema cuando le preguntas a IVAN",
            ficha: "Consulta",
            nodos: [
                {
                    quien: "Usuario", modulo: "Chat con IVAN", accion: "Escribe su pregunta en palabras simples.",
                    estado: "Pregunta enviada", icono: "chat", tono: "indigo",
                    tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Permisos", accion: "Revisa qué menús tiene el usuario para saber qué puede ver.",
                    estado: "Permisos listos", icono: "validar", tono: "ambar", modo: "lee",
                    tablas: [
                        { nombre: "rol_menu", nota: "menús de cada rol" },
                        { nombre: "menus", nota: "pantallas del sistema" },
                    ],
                },
                {
                    quien: "IVAN", modulo: "Consulta el sistema", accion: "Busca la respuesta en los módulos que el usuario puede ver.",
                    estado: "Respondiendo", icono: "sistema", tono: "celeste",
                    tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Memoria", accion: "Guarda la conversación para seguirla después.",
                    estado: "Guardada", icono: "archivo", tono: "verde",
                    tablas: [{ nombre: "ivan_conversaciones", nota: "la conversación completa" }],
                },
            ],
        },
        pasos: [],
    },
]

export const caminos: CaminoGuia[] = []
