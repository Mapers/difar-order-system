import { CaminoGuia, PantallaGuia } from "../tipos"

// Grupos "Comisiones" y "Datos Fijos". Verificado contra las pantallas y los SP (20/11/2026).

export const pantallas: PantallaGuia[] = [
    // ======================================================= Comisiones
    {
        ruta: "/dashboard/contabilidad/comision-ventas",
        nombre: "Comisión de Ventas",
        grupo: "Comisiones",
        resumen: "Aquí ves cuánto gana cada vendedor por lo que vendió en el mes. Es solo consulta: no graba nada.",
        diagrama: {
            titulo: "De dónde sale la comisión de ventas del mes",
            ficha: "Comisión",
            nodos: [
                {
                    quien: "Tú", modulo: "Vendedor y periodo", accion: "Eliges el vendedor (o todos) y el mes. Pulsas Generar.",
                    estado: "Filtros listos", icono: "filtro", tono: "indigo",
                    tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Calcular la comisión", accion: "Suma las ventas del mes y aplica la tasa. No graba nada.",
                    estado: "Calculando", icono: "calculo", tono: "ambar", modo: "lee",
                    tablas: [
                        { nombre: "mkardexinventarios", nota: "las ventas del mes" },
                        { nombre: "mvendedores", nota: "la tasa de cada vendedor" },
                        { nombre: "marticulos", nota: "el producto vendido" },
                        { nombre: "mtipodocumento", nota: "factura, boleta, nota..." },
                    ],
                },
                {
                    quien: "Tú", modulo: "Comisión por vendedor", accion: "Ves ventas, tasa y comisión en S/. Un clic abre el detalle.",
                    estado: "En pantalla", icono: "comision", tono: "celeste",
                    tablas: [],
                },
                {
                    quien: "Tú", modulo: "Exportar PDF", accion: "Sacas el reporte del mes para entregarlo o archivarlo.",
                    estado: "Exportado", icono: "archivo", tono: "verde",
                    tablas: [],
                },
            ],
            tituloEfectos: "Lo que obtienes al final",
            efectos: [
                { modulo: "Comisión del mes", detalle: "en S/ por cada vendedor", icono: "comision" },
                { modulo: "Comprobantes", detalle: "detalle de cada vendedor", icono: "comprobante" },
                { modulo: "Reporte PDF", detalle: "para entregar o archivar", icono: "documento" },
            ],
        },
        pasos: [
            {
                guia: "vistas",
                titulo: "Por vendedor / Global por laboratorio",
                queHace: "Elige cómo quieres ver la comisión: por vendedor o agrupada por laboratorio y producto.",
                quePasa: "En «Global por laboratorio» también puedes filtrar por producto y por cliente.",
            },
            {
                guia: "filtros",
                titulo: "Vendedor y Periodo",
                queHace: "Elige un vendedor (o deja «Todos los vendedores») y el mes con las flechas o las listas de mes y año.",
                despues: "Luego pulsa Generar.",
            },
            {
                guia: "generar",
                titulo: "Generar",
                queHace: "Pulsa Generar para calcular la comisión del mes elegido.",
                quePasa: "Se suman las ventas del mes de cada vendedor y se multiplica la venta neta por su tasa. No se graba nada.",
                tablas: "mkardexinventarios, mvendedores (ComisionVend), marticulos, mtipodocumento · sp_ws_comision_vta_resumen",
            },
            {
                guia: "totales",
                titulo: "Tarjetas de totales",
                queHace: "Revisa aquí las Ventas totales, lo vendido por representantes de laboratorio, las Ventas netas y la Comisión total en S/.",
                quePasa: "Lo de «Rep. laboratorio» no genera comisión: se resta antes de calcular.",
            },
            {
                guia: "tabla-vendedores",
                titulo: "Comisión por vendedor",
                queHace: "Cada fila es un vendedor: ventas, tasa, comisión, costo de salidas y utilidad en S/.",
                quePasa: "Haz clic en un vendedor para ver sus comprobantes debajo.",
                despues: "Si la tasa de un vendedor sale en 0 %, no cobra comisión de ventas.",
            },
            {
                guia: "detalle-comprobantes",
                titulo: "Comprobantes del vendedor",
                queHace: "Aquí ves cada comprobante del vendedor en el mes, con cliente y venta neta.",
                quePasa: "Los montos en rojo son negativos. Pulsa la X para cerrar el detalle.",
                tablas: "sp_ws_comision_vta_detalle",
            },
            {
                guia: "exportar-pdf",
                titulo: "Exportar PDF",
                queHace: "Pulsa Exportar PDF para sacar el reporte del mes y entregarlo o archivarlo.",
                quePasa: "Puedes elegir qué columnas opcionales salen en el PDF.",
            },
        ],
    },
    {
        ruta: "/dashboard/contabilidad/comision-cobranza",
        nombre: "Comisión de Cobranza",
        grupo: "Comisiones",
        resumen: "Aquí ves la comisión de cada vendedor por lo que cobró en el mes, según cuántos días pasaron desde el vencimiento. Es solo consulta.",
        diagrama: {
            titulo: "De dónde sale la comisión de cobranza del mes",
            ficha: "Comisión",
            nodos: [
                {
                    quien: "Tú", modulo: "Vendedor y periodo", accion: "Eliges el vendedor (o todos) y el mes a revisar.",
                    estado: "Filtros listos", icono: "filtro", tono: "indigo",
                    tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Escala del periodo", accion: "Busca los tramos de días y su %. Sin escala no se genera.",
                    estado: "Escala lista", icono: "calendario", tono: "ambar", modo: "lee",
                    tablas: [{ nombre: "comisioncob", nota: "tramos de días y su %" }],
                },
                {
                    quien: "Sistema", modulo: "Calcular la comisión", accion: "Toma los cobros en efectivo o depósito. No graba nada.",
                    estado: "Calculando", icono: "calculo", tono: "celeste", modo: "lee",
                    tablas: [
                        { nombre: "kardex clientes", nota: "los cobros del mes", contable: true },
                        { nombre: "amortizaciones", nota: "el pago de cada cobro", contable: true },
                        { nombre: "registro de ventas", nota: "valor venta, sin IGV", contable: true },
                        { nombre: "mvendedores", nota: "la tasa de cobranza" },
                        { nombre: "mtipoamortizacion", nota: "efectivo o depósito" },
                    ],
                },
                {
                    quien: "Tú", modulo: "Comisión y PDF", accion: "Ves lo cobrado por tramo y la comisión en S/. Exportas el PDF.",
                    estado: "En pantalla", icono: "comision", tono: "verde",
                    tablas: [],
                },
            ],
            tituloEfectos: "Lo que obtienes al final",
            efectos: [
                { modulo: "Comisión del mes", detalle: "en S/ por cada vendedor", icono: "comision" },
                { modulo: "Cobros del vendedor", detalle: "con sus días vencidos", icono: "cliente" },
                { modulo: "Reporte PDF", detalle: "con los tramos de la escala", icono: "documento" },
            ],
        },
        pasos: [
            {
                guia: "filtros",
                titulo: "Vendedor y Periodo",
                queHace: "Elige un vendedor (o «Todos los vendedores») y el mes que quieres revisar.",
                despues: "Antes de generar, mira la escala del periodo justo debajo.",
            },
            {
                guia: "escala",
                titulo: "Escala del periodo",
                queHace: "Muestra los tramos de días y el % de comisión de cada tramo para el mes elegido.",
                quePasa: "Si dice «No hay escala registrada para este periodo», el reporte no se podrá generar.",
                despues: "La escala se registra en Catálogos › Vendedores, con fecha Desde y Hasta.",
                tablas: "comisioncob · sp_ws_comision_cob_escala_listar",
            },
            {
                guia: "generar",
                titulo: "Generar",
                queHace: "Pulsa Generar para calcular la comisión de cobranza del mes.",
                quePasa: "Solo cuentan los cobros en efectivo o depósito. La comisión se calcula sobre el valor venta, sin IGV.",
                tablas: "kardex clientes, mvendedores (ComisionCobranza), mtipoamortizacion (Efectivo = 1), comisioncob · sp_ws_comision_cob_resumen",
            },
            {
                guia: "totales",
                titulo: "Tarjetas de totales",
                queHace: "Revisa la Cobranza del mes, lo cobrado Dentro de plazo y Fuera de plazo, y la Comisión total en S/.",
                quePasa: "Lo cobrado fuera de plazo no genera comisión.",
            },
            {
                guia: "tabla-vendedores",
                titulo: "Comisión por vendedor",
                queHace: "Cada fila es un vendedor con lo cobrado en cada tramo de días y su comisión en S/.",
                quePasa: "Si ves «no cobra comisión», ese vendedor no tiene tasa de cobranza. Haz clic en una fila para ver sus cobros.",
            },
            {
                guia: "detalle-cobros",
                titulo: "Cobros del vendedor",
                queHace: "Aquí ves cada cobro: fecha, planilla, comprobante, vencimiento, días vencidos, lo cobrado y la comisión.",
                tablas: "sp_ws_comision_cob_detalle",
            },
            {
                guia: "filtro-tramo",
                titulo: "Filtro por tramo",
                queHace: "Toca un tramo para ver solo esos cobros. Toca «Todos» para volver a ver la lista completa.",
            },
            {
                guia: "exportar-pdf",
                titulo: "Exportar PDF",
                queHace: "Pulsa Exportar PDF para sacar el reporte del mes con los tramos de la escala.",
            },
        ],
    },

    // ======================================================= Datos Fijos
    {
        ruta: "/dashboard/contabilidad/plan-contable",
        nombre: "Plan Contable",
        grupo: "Datos Fijos",
        resumen: "Aquí mantienes el plan de cuentas. Todas las demás pantallas eligen sus cuentas de esta lista.",
        diagrama: {
            titulo: "Dónde se graba una cuenta y quién la usa después",
            ficha: "Cuenta",
            nodos: [
                {
                    quien: "Tú", modulo: "Nueva cuenta", accion: "Escribes el código, la descripción y los cargos y abonos.",
                    estado: "En la ficha", icono: "documento", tono: "indigo",
                    tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Listas de la ficha", accion: "Te muestra las opciones que puedes elegir en la ficha.",
                    estado: "Opciones cargadas", icono: "buscar", tono: "ambar", modo: "lee",
                    tablas: [
                        { nombre: "tipo_cta_contable", nota: "tipos de cuenta" },
                        { nombre: "mconceptos estados financieros", nota: "conceptos de EEFF" },
                        { nombre: "mplanctasdestinocargos", nota: "destinos para cargos" },
                        { nombre: "mplanctasdestinoabonos", nota: "destinos para abonos" },
                        { nombre: "sunat_cuentas", nota: "códigos SUNAT" },
                    ],
                },
                {
                    quien: "Sistema", modulo: "Guardar la cuenta", accion: "Revisa los datos y graba la cuenta en el plan.",
                    estado: "Guardada", icono: "validar", tono: "celeste",
                    tablas: [{ nombre: "mplancuentas", nota: "la cuenta y dónde se usa" }],
                },
                {
                    quien: "Todos", modulo: "Elegir la cuenta", accion: "Aparece solo en los libros que marcaste en Disponible en.",
                    estado: "Disponible", icono: "libro", tono: "verde",
                    tablas: [],
                },
            ],
            tituloEfectos: "La cuenta nueva se usa aquí",
            efectos: [
                { modulo: "Libros y registros", detalle: "caja, bancos, compras, ventas", icono: "libro", desde: "mplancuentas" },
                { modulo: "Datos Fijos", detalle: "personas, artículos, IGV, cajas", icono: "cliente", desde: "mplancuentas" },
                { modulo: "PLE 5.3", detalle: "detalle del plan contable", icono: "sunat", desde: "mplancuentas" },
            ],
        },
        pasos: [
            {
                titulo: "Lista de cuentas",
                queHace: "Busca una cuenta por código o nombre. Puedes filtrar por nivel y exportar a PDF o Excel.",
                quePasa: "Haz clic en una cuenta para abrir su ficha.",
                tablas: "mplancuentas · sp_ws_contabilidad_plan_cuentas_listar",
            },
            {
                guia: "nueva-cuenta",
                titulo: "Nueva cuenta",
                queHace: "Pulsa aquí para crear una cuenta. Llena Código cta., Descripción, Tipo cuenta, Estado flujo, Concepto EEFF, Cargos y Abonos.",
                quePasa: "Pulsa «Guardar y nuevo» para grabarla y seguir con otra. Si abriste una cuenta existente, el botón dice «Modificar».",
                seGuarda: "Plan de cuentas",
                tablas: "mplancuentas · sp_ws_contabilidad_plan_cuentas_guardar",
            },
            {
                titulo: "Destino automático (Cargos y Abonos)",
                queHace: "En la ficha, elige las cuentas que se generan solas en el libro diario cuando se registra un movimiento en esta cuenta.",
            },
            {
                titulo: "Disponible en",
                queHace: "En la ficha, marca en qué libros y registros se podrá elegir esta cuenta: Caja control, Ctas. bancos, Libro caja, Libro bancos, Reg. compras, Reg. ventas.",
                despues: "Si una cuenta no aparece en un libro, revisa aquí si está marcada.",
            },
            {
                titulo: "Eliminar registro",
                queHace: "En la ficha puedes eliminar una cuenta que ya no se usa.",
                quePasa: "Solo se elimina si no tiene movimientos, subcuentas ni es amarre de otra cuenta. Si está en uso, verás dónde.",
                tablas: "sp_ws_contabilidad_plan_cuentas_eliminar, sp_ws_contabilidad_plan_cuentas_uso",
            },
            {
                guia: "tipo-cuenta",
                titulo: "Tipo Cuenta",
                queHace: "Abre la lista de tipos de cuenta que eliges en la ficha.",
                tablas: "tipo_cta_contable",
            },
            {
                guia: "concepto-eeff",
                titulo: "Concepto EEFF",
                queHace: "Abre la lista de conceptos de estados financieros que eliges en la ficha.",
                tablas: "mconceptos estados financieros",
            },
            {
                guia: "amarre-cargo",
                titulo: "Amarre Cargo",
                queHace: "Abre la lista de cuentas de destino para cargos.",
                tablas: "mplanctasdestinocargos",
            },
            {
                guia: "amarre-abono",
                titulo: "Amarre Abono",
                queHace: "Abre la lista de cuentas de destino para abonos.",
                tablas: "mplanctasdestinoabonos",
            },
            {
                guia: "sunat",
                titulo: "SUNAT",
                queHace: "Abre la lista de códigos SUNAT para el balance de comprobación del PDT.",
                tablas: "sunat_cuentas",
            },
        ],
    },
    {
        ruta: "/dashboard/contabilidad/personas-empresas",
        nombre: "Personas y Empresas",
        grupo: "Datos Fijos",
        resumen: "Aquí registras clientes, proveedores, trabajadores y control interno. Cada uno lleva su cuenta contable.",
        diagrama: {
            titulo: "Dónde se graba una persona y quién usa ese dato",
            ficha: "Persona",
            nodos: [
                {
                    quien: "Tú", modulo: "Nueva persona", accion: "Llenas el documento, el nombre y el Tipo de Relacion.",
                    estado: "En la ficha", icono: "cliente", tono: "indigo",
                    tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Revisar los datos", accion: "Pone la cuenta del tipo y valida vendedor y zona del cliente.",
                    estado: "Revisada", icono: "validar", tono: "ambar", modo: "lee",
                    tablas: [
                        { nombre: "mtiporelacion", nota: "cuenta de cada tipo" },
                        { nombre: "mplancuentas", nota: "cuenta 12, 41 o 42" },
                        { nombre: "mvendedores", nota: "vendedor del cliente" },
                        { nombre: "zona", nota: "zona del cliente" },
                    ],
                },
                {
                    quien: "Sistema", modulo: "Guardar la ficha", accion: "Graba la persona con su cuenta contable.",
                    estado: "Guardada", icono: "sistema", tono: "celeste",
                    tablas: [{ nombre: "mnombrerazsoc", nota: "la ficha de la persona" }],
                },
                {
                    quien: "Todos", modulo: "Elegir la persona", accion: "Ya puedes elegirla en las demás pantallas.",
                    estado: "Disponible", icono: "buscar", tono: "verde",
                    tablas: [],
                },
            ],
            tituloEfectos: "La persona se usa aquí",
            efectos: [
                { modulo: "Ventas y cobranza", detalle: "como cliente", icono: "cliente", desde: "mnombrerazsoc" },
                { modulo: "Compras y pagos", detalle: "como proveedor", icono: "proveedor", desde: "mnombrerazsoc" },
                { modulo: "Informes y SUNAT", detalle: "su nombre y su RUC o DNI", icono: "reporte", desde: "mnombrerazsoc" },
            ],
        },
        pasos: [
            {
                guia: "relaciones",
                titulo: "Filtro por relación",
                queHace: "Toca Cliente, Proveedor, Trabajador o Control Interno para ver solo ese grupo. «Todas» muestra a todos.",
            },
            {
                guia: "busqueda",
                titulo: "Buscar",
                queHace: "Escribe código, RUC / DNI, nombre o nombre comercial y pulsa Buscar.",
            },
            {
                guia: "lista",
                titulo: "Lista",
                queHace: "Revisa código, nombre, documento, relación y cuenta contable (Cta). Haz clic en una fila para abrir su ficha.",
                tablas: "mnombrerazsoc · sp_ws_contabilidad_personas_listar",
            },
            {
                guia: "nueva-persona",
                titulo: "Nueva persona",
                queHace: "Pulsa aquí para registrar una persona o empresa nueva. Los campos con * son obligatorios.",
                quePasa: "Pulsa «Guardar y nuevo». Si el Nro. Doc. Identidad queda vacío, se copia el código.",
                seGuarda: "Ficha de la persona",
                tablas: "mnombrerazsoc · sp_ws_contabilidad_personas_guardar",
            },
            {
                titulo: "Tipo de Relacion y Cta Contable",
                queHace: "Al elegir el Tipo de Relacion se pone sola la cuenta contable de ese tipo. Puedes cambiarla.",
                quePasa: "La cuenta debe ser una 12, 41 o 42 de registros; si no, no se graba.",
                tablas: "mtiporelacion (idCtaContable), mplancuentas",
            },
            {
                titulo: "Vendedor y Zona (clientes)",
                queHace: "Si es Cliente, elige su Vendedor y su Zona: son obligatorios.",
                despues: "Las zonas se mantienen en Catálogos › Zonas.",
                tablas: "mvendedores, zona",
            },
            {
                titulo: "Avisos al guardar",
                queHace: "Si falta nombre comercial o dirección, o el RUC/DNI no tiene los dígitos correctos, te avisa antes de grabar.",
                quePasa: "Puedes corregir o pulsar «Guardar igual». También te avisa si otro código tiene el mismo documento.",
            },
            {
                titulo: "Eliminar registro",
                queHace: "En la ficha puedes eliminar a una persona que no tenga uso.",
                quePasa: "No se elimina si tiene documentos, cuenta corriente, pedidos o datos de la app de ventas.",
                tablas: "sp_ws_contabilidad_personas_eliminar, sp_ws_contabilidad_personas_uso",
            },
        ],
    },
    {
        ruta: "/dashboard/contabilidad/articulos",
        nombre: "Bienes y Servicios",
        grupo: "Datos Fijos",
        resumen: "Aquí mantienes la ficha contable de cada artículo: sub-grupo, unidad, tipo de existencia, cuentas contables y código OSCE.",
        diagrama: {
            titulo: "Dónde se graba un artículo y quién usa ese dato",
            ficha: "Artículo",
            nodos: [
                {
                    quien: "Tú", modulo: "Nuevo artículo", accion: "Llenas sub-grupo, descripción, unidad y tipo de existencia.",
                    estado: "En la ficha", icono: "producto", tono: "indigo",
                    tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Revisar cuentas", accion: "Solo acepta cuentas de registros del plan contable.",
                    estado: "Revisado", icono: "validar", tono: "ambar", modo: "lee",
                    tablas: [{ nombre: "mplancuentas", nota: "cuentas del artículo" }],
                },
                {
                    quien: "Sistema", modulo: "Guardar la ficha", accion: "Graba el artículo. Si no pusiste código, pone uno.",
                    estado: "Guardado", icono: "sistema", tono: "celeste",
                    tablas: [
                        { nombre: "marticulos", nota: "la ficha del artículo" },
                        { nombre: "lista_precios", nota: "su fila de precios" },
                    ],
                },
                {
                    quien: "Todos", modulo: "Usar el artículo", accion: "Ya se puede elegir en compras, ventas y almacén.",
                    estado: "Disponible", icono: "almacen", tono: "verde",
                    tablas: [],
                },
            ],
            tituloEfectos: "El artículo se usa aquí",
            efectos: [
                { modulo: "Compras y ventas", detalle: "en cada ítem del documento", icono: "comprobante", desde: "marticulos" },
                { modulo: "Kardex y pedidos", detalle: "entradas, salidas y pedidos", icono: "almacen", desde: "marticulos" },
                { modulo: "Comisión de Ventas", detalle: "ventas por producto", icono: "comision", desde: "marticulos" },
            ],
        },
        pasos: [
            {
                guia: "pestanas",
                titulo: "Bienes y servicios / OSCE",
                queHace: "En «Bienes y servicios» está la lista completa. En «OSCE» asignas el código OSCE a los artículos.",
            },
            {
                guia: "filtros",
                titulo: "Buscar y sub-grupo",
                queHace: "Busca por código (empieza con) o descripción, y si quieres elige un sub-grupo.",
            },
            {
                guia: "lista",
                titulo: "Lista",
                queHace: "Revisa código, descripción, sub-grupo, unidad, tipo de existencia, cuentas y OSCE. Haz clic en una fila para abrir su ficha.",
                tablas: "marticulos · sp_ws_contabilidad_articulos_listar",
            },
            {
                guia: "nuevo-articulo",
                titulo: "Nuevo artículo",
                queHace: "Pulsa aquí para crear un artículo. Son obligatorios SubGrupo, Descripcion del Item, Unidad Medida y TipoExistencia.",
                quePasa: "Si dejas vacío el Codigo Item, se pone uno automático. No se acepta una descripción repetida.",
                seGuarda: "Ficha del artículo",
                tablas: "marticulos · sp_ws_contabilidad_articulos_guardar",
            },
            {
                titulo: "Cuentas contables del artículo",
                queHace: "En la ficha eliges las cuentas del artículo: cargos (90 a 95), abonos (79), costo de ventas (69), existencias (2), producción (71) y ventas (7).",
                quePasa: "Solo se aceptan cuentas de registros que empiecen así.",
                tablas: "mplancuentas",
            },
            {
                titulo: "Cambiar el código",
                queHace: "El código de un artículo con movimientos (compras, kardex, lotes, pedidos o ventas) ya no se puede cambiar.",
            },
            {
                titulo: "Eliminar registro",
                queHace: "En la ficha puedes eliminar un artículo sin uso.",
                quePasa: "No se elimina si tiene compras, ventas, kardex, pedidos u otros usos. Al eliminarlo se borran también sus precios.",
                tablas: "marticulos, preciosxtipo, lista_precios · sp_ws_contabilidad_articulos_eliminar",
            },
        ],
    },
    {
        ruta: "/dashboard/contabilidad/tipo-cambio",
        nombre: "Tipo de Cambio",
        grupo: "Datos Fijos",
        resumen: "Aquí registras el tipo de cambio del dólar de cada día (compra y venta). Lo necesitan las compras, ventas y cajas en dólares.",
        diagrama: {
            titulo: "Dónde se graba el tipo de cambio y quién lo usa",
            ficha: "Tipo de cambio",
            nodos: [
                {
                    quien: "Sistema", modulo: "Fechas sin tipo cambio", accion: "Avisa qué días tienen compras o ventas en dólares sin cambio.",
                    estado: "Faltantes", icono: "buscar", tono: "ambar", modo: "lee",
                    tablas: [
                        { nombre: "reg compras encabezado", nota: "compras en dólares" },
                        { nombre: "registro de ventas", nota: "ventas en dólares", contable: true },
                    ],
                },
                {
                    quien: "Tú", modulo: "Fecha, Compra y Venta", accion: "Escribes la fecha y el tipo de cambio de compra y de venta.",
                    estado: "En la ficha", icono: "calendario", tono: "indigo",
                    tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Guardar el día", accion: "Graba el tipo de cambio de ese día (o lo modifica).",
                    estado: "Guardado", icono: "sistema", tono: "celeste",
                    tablas: [{ nombre: "mtipocambiousd", nota: "compra y venta del día" }],
                },
                {
                    quien: "Todos", modulo: "Documentos en dólares", accion: "Las compras, ventas y cajas en dólares ya tienen su cambio.",
                    estado: "Disponible", icono: "precio", tono: "verde",
                    tablas: [],
                },
            ],
            tituloEfectos: "El tipo de cambio se usa aquí",
            efectos: [
                { modulo: "Compras y ventas", detalle: "documentos en dólares", icono: "comprobante", desde: "mtipocambiousd" },
                { modulo: "Cajas en dólares", detalle: "movimientos en US$", icono: "caja", desde: "mtipocambiousd" },
                { modulo: "Informes de ventas", detalle: "pasa los dólares a S/", icono: "reporte", desde: "mtipocambiousd" },
            ],
        },
        pasos: [
            {
                guia: "ficha",
                titulo: "Fecha, Compra y Venta",
                queHace: "Escribe la fecha y el tipo de cambio de compra y de venta del día.",
                quePasa: "Los dos deben ser mayores a cero. Si la compra es mayor que la venta, te pide confirmar.",
            },
            {
                guia: "guardar",
                titulo: "Guardar y nuevo / Modificar",
                queHace: "Pulsa «Guardar y nuevo» para grabar el día. Si elegiste un día de la lista, el botón dice «Modificar».",
                quePasa: "Al modificar, la fecha no se cambia; para otra fecha usa Limpiar.",
                seGuarda: "Tipo de cambio del día",
                tablas: "mtipocambiousd · sp_ws_contabilidad_tipo_cambio_guardar",
            },
            {
                guia: "faltantes",
                titulo: "Fechas sin tipo de cambio",
                queHace: "Este aviso lista los días que tienen compras o ventas en dólares pero no tienen tipo de cambio.",
                quePasa: "Toca una fecha para cargarla en la ficha y regístrala.",
                tablas: "reg compras encabezado, registro de ventas · sp_ws_contabilidad_tipo_cambio_faltantes",
            },
            {
                guia: "rango",
                titulo: "Desde / Hasta",
                queHace: "Elige el rango de fechas y pulsa Buscar para ver la lista y los faltantes de ese rango.",
            },
            {
                guia: "lista",
                titulo: "Lista",
                queHace: "Cada fila es un día con su compra, venta y cuántos documentos en dólares tiene. Haz clic para modificarlo.",
                quePasa: "La compra sale en ámbar si es mayor que la venta.",
            },
            {
                titulo: "Eliminar registro",
                queHace: "Con un día elegido, pulsa el botón del tacho para eliminarlo.",
                quePasa: "No se elimina si hay compras o ventas en dólares con esa fecha.",
                tablas: "sp_ws_contabilidad_tipo_cambio_eliminar",
            },
        ],
    },
    {
        ruta: "/dashboard/contabilidad/igv",
        nombre: "IGV",
        grupo: "Datos Fijos",
        resumen: "Aquí mantienes las tasas de IGV con su vigencia y sus cuentas contables.",
        diagrama: {
            titulo: "Dónde se graba una tasa de IGV y quién la usa",
            ficha: "Tasa",
            nodos: [
                {
                    quien: "Tú", modulo: "Nueva tasa", accion: "Escribes la tasa (%), el concepto, la vigencia y las cuentas.",
                    estado: "En la ficha", icono: "precio", tono: "indigo",
                    tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Revisar cuentas", accion: "Las dos cuentas deben ser 40101 de registros.",
                    estado: "Revisada", icono: "validar", tono: "ambar", modo: "lee",
                    tablas: [{ nombre: "mplancuentas", nota: "cuentas de débito y crédito" }],
                },
                {
                    quien: "Sistema", modulo: "Guardar la tasa", accion: "Graba la tasa. No se puede repetir una que ya existe.",
                    estado: "Guardada", icono: "sistema", tono: "celeste",
                    tablas: [{ nombre: "migv", nota: "tasa, vigencia y cuentas" }],
                },
                {
                    quien: "Todos", modulo: "Usar la tasa", accion: "Las compras, ventas y guías eligen esta tasa de IGV.",
                    estado: "Disponible", icono: "calculo", tono: "verde",
                    tablas: [],
                },
            ],
            tituloEfectos: "La tasa de IGV se usa aquí",
            efectos: [
                { modulo: "Compras", detalle: "IGV de cada factura", icono: "proveedor", desde: "migv" },
                { modulo: "Ventas y guías", detalle: "IGV de cada comprobante", icono: "comprobante", desde: "migv" },
            ],
        },
        pasos: [
            {
                guia: "tasas",
                titulo: "Tarjetas de tasas",
                queHace: "Cada tarjeta es una tasa: porcentaje, concepto, vigencia, cuentas de débito y crédito y cuántos documentos la usan.",
                quePasa: "Haz clic en una tarjeta para abrir su ficha. Un aviso ámbar indica fechas invertidas o cuentas faltantes.",
                tablas: "migv · sp_ws_contabilidad_igv_listar",
            },
            {
                guia: "nueva-tasa",
                titulo: "Nueva tasa",
                queHace: "Pulsa aquí para crear una tasa. Escribe la Tasa (%), el Concepto, la vigencia y las cuentas CtaIGV Debito y CtaIGV Credito.",
                quePasa: "Las dos cuentas deben ser 40101 de registros. No se puede repetir una tasa que ya existe.",
                seGuarda: "Tasa de IGV",
                tablas: "migv, mplancuentas · sp_ws_contabilidad_igv_guardar",
            },
            {
                titulo: "Modificar",
                queHace: "En la ficha cambias concepto, fechas y cuentas.",
                quePasa: "Si la tasa ya tiene documentos, no puedes cambiar el porcentaje: crea una tasa nueva.",
            },
            {
                titulo: "Eliminar registro",
                queHace: "En la ficha puedes eliminar una tasa sin uso.",
                quePasa: "No se elimina si alguna compra, venta, guía o comprobante usa esa tasa.",
                tablas: "sp_ws_contabilidad_igv_eliminar",
            },
        ],
    },
    {
        ruta: "/dashboard/contabilidad/anio-meses",
        nombre: "Año y Meses",
        grupo: "Datos Fijos",
        resumen: "Aquí mantienes los años (ejercicios) y los nombres y días de los meses que usan los libros y registros.",
        diagrama: {
            titulo: "Dónde se graban los años y meses y quién los usa",
            ficha: "Año",
            nodos: [
                {
                    quien: "Tú", modulo: "Año nuevo", accion: "Escribes el año (4 dígitos) y pulsas Guardar y nuevo.",
                    estado: "Por guardar", icono: "calendario", tono: "indigo",
                    tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Guardar el año", accion: "Lo agrega a la lista. No acepta un año que ya existe.",
                    estado: "Año guardado", icono: "sistema", tono: "ambar",
                    tablas: [{ nombre: "year", nota: "la lista de años" }],
                },
                {
                    quien: "Tú", modulo: "Meses", accion: "Corriges el nombre o los días de un mes y guardas la fila.",
                    estado: "Mes guardado", icono: "documento", tono: "celeste",
                    tablas: [{ nombre: "meses", nota: "nombre y días de cada mes" }],
                },
                {
                    quien: "Todos", modulo: "Elegir el periodo", accion: "Los libros y registros muestran esos años y meses.",
                    estado: "Disponible", icono: "libro", tono: "verde",
                    tablas: [],
                },
            ],
            tituloEfectos: "Los años y meses se usan aquí",
            efectos: [
                { modulo: "Libros contables", detalle: "mayor y diario por año", icono: "libro", desde: "year" },
                { modulo: "Compras y ventas", detalle: "registros de cada año", icono: "comprobante", desde: "year" },
                { modulo: "Informes", detalle: "nombre del mes en el reporte", icono: "reporte", desde: "meses" },
            ],
        },
        pasos: [
            {
                guia: "nuevo-anio",
                titulo: "Año · Guardar y nuevo",
                queHace: "Escribe el año nuevo (4 dígitos) y pulsa «Guardar y nuevo».",
                quePasa: "No se acepta un año que ya existe.",
                seGuarda: "Lista de años",
                tablas: "year · sp_ws_contabilidad_anio_guardar",
            },
            {
                guia: "lista-anios",
                titulo: "Lista de años",
                queHace: "Cada año muestra cuántos registros tiene en mayor, diario, compras y ventas. El año en curso tiene la marca «en curso».",
                quePasa: "El tacho elimina el año solo si no tiene registros contables y no es el año en curso.",
                tablas: "sp_ws_contabilidad_anio_listar, sp_ws_contabilidad_anio_eliminar",
            },
            {
                guia: "meses",
                titulo: "Meses",
                queHace: "Corrige el nombre o los días de un mes y pulsa el botón de guardar de esa fila.",
                quePasa: "Los días deben estar entre 28 y 31. Los meses no se crean ni se eliminan.",
                seGuarda: "Nombre y días del mes",
                tablas: "meses · sp_ws_contabilidad_meses_guardar",
            },
        ],
    },
    {
        ruta: "/dashboard/contabilidad/catalogos",
        nombre: "Catálogos",
        grupo: "Datos Fijos",
        resumen: "Aquí mantienes las listas de apoyo (los botones de Datos de Control de Access): zonas, series, cajas, cuentas de banco y más.",
        diagrama: {
            titulo: "Dónde se graba cada catálogo y quién lo usa",
            ficha: "Registro",
            nodos: [
                {
                    quien: "Tú", modulo: "Elegir catálogo", accion: "Pulsas el botón del catálogo y luego Nuevo (o un registro).",
                    estado: "Catálogo abierto", icono: "buscar", tono: "indigo",
                    tablas: [],
                },
                {
                    quien: "Tú", modulo: "Llenar la ficha", accion: "Escribes los datos del registro y lo guardas.",
                    estado: "En la ficha", icono: "documento", tono: "ambar",
                    tablas: [],
                },
                {
                    quien: "Sistema", modulo: "Guardar en su tabla", accion: "Cada catálogo graba en su propia tabla. Por ejemplo:",
                    estado: "Guardado", icono: "sistema", tono: "celeste",
                    tablas: [
                        { nombre: "zona", nota: "zonas de los clientes" },
                        { nombre: "serie_docs", nota: "series de comprobantes" },
                        { nombre: "cajas control", nota: "moneda y cuenta de la caja" },
                        { nombre: "ctas de banco", nota: "cuentas corrientes" },
                        { nombre: "comisioncob", nota: "escala de cobranza" },
                    ],
                },
                {
                    quien: "Todos", modulo: "Usar el dato", accion: "Las demás pantallas ya muestran el registro en sus listas.",
                    estado: "Disponible", icono: "libro", tono: "verde",
                    tablas: [],
                },
            ],
            tituloEfectos: "Estos datos se usan aquí",
            efectos: [
                { modulo: "Personas y Empresas", detalle: "zona de cada cliente", icono: "cliente", desde: "zona" },
                { modulo: "Libro Caja y Bancos", detalle: "caja, moneda y su cuenta", icono: "caja", desde: "cajas control" },
                { modulo: "Comisión de Cobranza", detalle: "tramos de días y su %", icono: "comision", desde: "comisioncob" },
            ],
        },
        pasos: [
            {
                guia: "botones",
                titulo: "Botones de catálogos",
                queHace: "Pulsa un botón para abrir su catálogo. La pantalla recuerda el último que usaste.",
                quePasa: "Algunos botones solo te llevan a otra pantalla (por ejemplo, vendedores y representantes están en Usuarios).",
            },
            {
                guia: "pestanas",
                titulo: "Pestañas del catálogo",
                queHace: "Algunos botones tienen varias listas (por ejemplo, Documentos o CentroCostos). Toca la pestaña que necesitas.",
            },
            {
                guia: "buscar",
                titulo: "Buscar en la lista",
                queHace: "Escribe para filtrar la lista al momento.",
            },
            {
                guia: "actualizar",
                titulo: "Actualizar",
                queHace: "Pulsa Actualizar para volver a cargar la lista.",
            },
            {
                guia: "nuevo",
                titulo: "Nuevo",
                queHace: "Pulsa Nuevo para agregar un registro al catálogo abierto.",
                quePasa: "No aparece en los catálogos marcados «Solo consulta» o «Solo modificar».",
                seGuarda: "El catálogo elegido",
            },
            {
                guia: "lista",
                titulo: "Lista",
                queHace: "Haz clic en un registro para ver su ficha y modificarlo. El tacho lo elimina.",
                quePasa: "Si el registro está en uso, no se deja eliminar.",
            },
            {
                titulo: "CajasControl",
                queHace: "Cada caja lleva su Moneda y su Cuenta contable.",
                quePasa: "Cambiar la cuenta contable afecta las centralizaciones que se hagan desde ahora.",
                tablas: "cajas control",
            },
            {
                titulo: "Vendedores › Comisión de cobranza",
                queHace: "Aquí registras la escala de comisión de cobranza: tasa, Desde, Hasta y los días y factor de cada tramo.",
                quePasa: "Los periodos no pueden cruzarse. Para que Comisión de Cobranza la use, llena también la fecha Hasta.",
                tablas: "comisioncob",
                despues: "Luego genera el reporte en Comisión de Cobranza.",
            },
        ],
    },
]

export const caminos: CaminoGuia[] = [
    {
        id: "comisiones-del-mes",
        titulo: "Sacar las comisiones del mes",
        descripcion: "Cómo revisar la comisión de ventas y de cobranza de un mes y entregar el reporte. Ninguna de las dos graba nada.",
        etapas: [
            {
                titulo: "Revisar la escala de cobranza",
                ruta: "/dashboard/contabilidad/catalogos",
                quien: "Contabilidad",
                queHace: "En Catálogos › Vendedores revisa que exista una escala de comisión de cobranza con Desde y Hasta que cubra el mes.",
                seGuarda: "Escala de comisión de cobranza",
                despues: "Sin escala, Comisión de Cobranza no genera el reporte.",
            },
            {
                titulo: "Comisión de ventas",
                ruta: "/dashboard/contabilidad/comision-ventas",
                quien: "Contabilidad",
                queHace: "Elige el mes y pulsa Generar. Revisa la venta neta y la comisión de cada vendedor.",
                despues: "Haz clic en un vendedor para ver sus comprobantes.",
            },
            {
                titulo: "Comisión de cobranza",
                ruta: "/dashboard/contabilidad/comision-cobranza",
                quien: "Contabilidad",
                queHace: "Elige el mismo mes y pulsa Generar. Revisa lo cobrado por tramo de días y la comisión.",
                despues: "Haz clic en un vendedor para ver cada cobro y filtrar por tramo.",
            },
            {
                titulo: "Exportar los PDF",
                quien: "Contabilidad",
                queHace: "En cada pantalla pulsa Exportar PDF para entregar el reporte del mes (resumen o detalle de un vendedor).",
            },
        ],
    },
    {
        id: "tipo-cambio-dolares",
        titulo: "Tipo de cambio para documentos en dólares",
        descripcion: "Antes de trabajar con compras, ventas o cajas en dólares, el día debe tener su tipo de cambio.",
        etapas: [
            {
                titulo: "Registrar el tipo de cambio del día",
                ruta: "/dashboard/contabilidad/tipo-cambio",
                quien: "Contabilidad",
                queHace: "Escribe la fecha, la compra y la venta, y pulsa «Guardar y nuevo».",
                seGuarda: "Tipo de cambio del día",
            },
            {
                titulo: "Revisar fechas faltantes",
                ruta: "/dashboard/contabilidad/tipo-cambio",
                quien: "Contabilidad",
                queHace: "Si aparece el aviso de fechas sin tipo de cambio, toca cada fecha y regístrala.",
                despues: "El aviso desaparece cuando todas las compras y ventas en dólares del rango tienen su tipo de cambio.",
            },
            {
                titulo: "Caja en dólares",
                ruta: "/dashboard/contabilidad/catalogos",
                quien: "Contabilidad",
                queHace: "En Catálogos › CajasControl revisa que la caja tenga la moneda y la cuenta contable correctas.",
            },
        ],
    },
    {
        id: "alta-cliente-proveedor",
        titulo: "Dar de alta un cliente o proveedor",
        descripcion: "La persona necesita una cuenta contable válida (12, 41 o 42 de registros) y, si es cliente, vendedor y zona.",
        etapas: [
            {
                titulo: "Revisar la cuenta en el plan",
                ruta: "/dashboard/contabilidad/plan-contable",
                quien: "Contabilidad",
                queHace: "Verifica que exista la cuenta 12, 41 o 42 de registros que usará la persona. Si no existe, créala con «Nueva cuenta».",
                seGuarda: "Plan de cuentas",
            },
            {
                titulo: "Revisar la zona (clientes)",
                ruta: "/dashboard/contabilidad/catalogos",
                quien: "Contabilidad",
                queHace: "Si es cliente, verifica en Catálogos › Zonas que exista su zona.",
            },
            {
                titulo: "Registrar la persona",
                ruta: "/dashboard/contabilidad/personas-empresas",
                quien: "Contabilidad",
                queHace: "Pulsa «Nueva persona», elige el Tipo de Relacion (pone su cuenta por defecto) y llena los campos con *.",
                seGuarda: "Ficha de la persona",
                despues: "Ya puedes elegirla en las demás pantallas.",
            },
        ],
    },
    {
        id: "nueva-cuenta-contable",
        titulo: "Crear una cuenta contable y usarla",
        descripcion: "Una cuenta nueva solo aparece donde la marcas en «Disponible en».",
        etapas: [
            {
                titulo: "Crear la cuenta",
                ruta: "/dashboard/contabilidad/plan-contable",
                quien: "Contabilidad",
                queHace: "Pulsa «Nueva cuenta» y llena código, descripción, tipo, estado flujo, concepto EEFF y amarres de Cargos y Abonos.",
                seGuarda: "Plan de cuentas",
            },
            {
                titulo: "Marcar dónde se usa",
                ruta: "/dashboard/contabilidad/plan-contable",
                quien: "Contabilidad",
                queHace: "En «Disponible en» marca Caja control, Ctas. bancos, Libro caja, Libro bancos, Reg. compras o Reg. ventas según corresponda.",
            },
            {
                titulo: "Asignarla en los datos fijos",
                quien: "Contabilidad",
                queHace: "Elígela donde haga falta: en la ficha de la persona, del artículo, de la tasa de IGV o de la caja.",
                despues: "Mientras una cuenta esté en uso, no se puede eliminar.",
            },
        ],
    },
]
