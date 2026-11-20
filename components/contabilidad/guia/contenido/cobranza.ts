import { CaminoGuia, PantallaGuia } from "../tipos"

// Guía de Contabilidad · grupo Cobranza (20/11/2026).
// Todo lo que dice "se guarda" está verificado en el código y en los SP; si no se pudo verificar, se omite.

const RUTA_PLANILLA = "/dashboard/contabilidad/planilla-cobranza"
const RUTA_CLIENTE_COBRANZA = "/dashboard/contabilidad/datos-de-movimiento/cliente-cobranza"
const RUTA_ASIGNACION = "/dashboard/contabilidad/asignacion-cobranzas"
const RUTA_RECIBO = "/dashboard/recibo-cuenta-cliente"
const RUTA_LIBRO_CAJA = "/dashboard/contabilidad/libro-caja-bancos"

const SOLO_CONSULTA = "No guarda nada; solo consulta."

export const pantallas: PantallaGuia[] = [
    // ─────────────────────────────────────────────────────────────────────
    {
        ruta: RUTA_PLANILLA,
        nombre: "Planilla de Cobranza",
        grupo: "Cobranza",
        resumen: "Aquí revisas las planillas de cobranza de los vendedores, las validas y envías sus cobros a caja.",
        pasos: [
            {
                guia: "pestanas-admin",
                titulo: "Validar planillas / Crear planilla",
                queHace: "Elige qué vas a hacer: revisar las planillas que llegaron o crear una a nombre de un vendedor.",
                quePasa: "Solo ves las pestañas que tu usuario tiene permitidas.",
            },
            {
                guia: "resumen-dia",
                titulo: "Tarjetas del día",
                queHace: "Mira cuántas planillas llegaron hoy, el total cobrado en S/, cuántas validaste y cuántas devolviste.",
                quePasa: SOLO_CONSULTA,
            },
            {
                guia: "filtros-planillas",
                titulo: "Buscar planillas",
                queHace: "Escribe el vendedor, la zona o el N° de planilla, marca un estado y elige las fechas. Luego pulsa Buscar.",
                quePasa: "La lista se actualiza. El botón de las flechas recarga la lista y las tarjetas. " + SOLO_CONSULTA,
                tablas: "tmp_planilla_cabecera",
            },
            {
                guia: "fila-planilla",
                titulo: "Abrir una planilla",
                queHace: "Haz clic en una planilla para ver cada documento cobrado y sus totales en S/.",
                quePasa: "Las etiquetas te dicen dónde está: «En caja» espera a contabilidad, «Rechazados en caja» volvió con motivo y «En el libro» ya fue aceptada. El clip abre los vouchers que adjuntó el vendedor.",
                despues: "Revisa los registros y decide si la validas o la devuelves.",
            },
            {
                guia: "revisar-planilla",
                titulo: "Rechazar / observar",
                queHace: "Si algo está mal, escribe la observación y pulsa Rechazar / observar. Sin observación no se puede rechazar.",
                quePasa: "La planilla vuelve al vendedor como Observada, con tu comentario, para que la corrija y la reenvíe.",
                seGuarda: "En la planilla: estado Observada, tu observación, tu usuario y la hora.",
                tablas: "tmp_planilla_cabecera",
            },
            {
                guia: "validar-planilla",
                titulo: "Validar planilla",
                queHace: "Si todo cuadra, pulsa Validar planilla. Solo se pueden revisar planillas en estado Enviada.",
                quePasa: "La planilla queda Validada. Todavía no entra al libro ni baja la deuda del cliente.",
                seGuarda: "En la planilla: estado Validada, tu usuario y la hora.",
                tablas: "tmp_planilla_cabecera",
                despues: "Pulsa Enviar a caja.",
            },
            {
                guia: "enviar-caja",
                titulo: "Enviar a caja",
                queHace: "Pulsa Enviar a caja para mandar a contabilidad los cobros de la planilla. Los documentos con cobro en S/ 0.00 no se envían.",
                quePasa: "Los cobros quedan pendientes en Libro Caja y Bancos. Las facturas aún no bajan su saldo. Si contabilidad rechaza alguno, el botón cambia a «Reenviar rechazados a caja».",
                seGuarda: "En la bandeja de cobros pendientes de caja.",
                tablas: "planilla_detalle_caja (estado 'pendiente')",
                despues: "Contabilidad los acepta en Libro Caja y Bancos › Planillas de cobranza.",
            },
            {
                guia: "aviso-caja",
                titulo: "Ir a aceptar →",
                queHace: "Mientras haya cobros esperando, verás este aviso. Pulsa Ir a aceptar → para abrir directo la pestaña Planillas de cobranza del Libro Caja.",
                quePasa: "Cuando contabilidad acepta, aquí aparece «Ver en qué voucher entró cada cobro» con la caja, el voucher y la fecha. " + SOLO_CONSULTA,
            },
            {
                guia: "acciones-planilla",
                titulo: "Exportar planilla / Eliminar planilla",
                queHace: "Exportar planilla la muestra en el formato impreso. Eliminar planilla la borra con sus registros y vouchers.",
                quePasa: "No se puede eliminar si tiene cobros aceptados en Libro Caja: primero revierte esos cobros en Planillas de cobranza › Historial.",
                seGuarda: "Eliminar borra la planilla, sus registros, sus vouchers y sus envíos a caja. No se puede deshacer.",
                tablas: "tmp_planilla_cabecera, tmp_planilla_detalle, planilla_detalle_vouchers, planilla_detalle_caja",
            },
            {
                guia: "crear-elegir-vendedor",
                titulo: "Crear planilla",
                queHace: "En la pestaña Crear planilla elige el vendedor. Luego pon la fecha de ruta y la zona y pulsa Generar correlativo y continuar.",
                quePasa: "La planilla se crea en borrador a nombre del vendedor y queda registrado que tú la creaste. El vendedor la verá en Mis planillas.",
                seGuarda: "Planilla nueva en estado Borrador.",
                tablas: "tmp_planilla_cabecera",
            },
            {
                guia: "agregar-registro",
                titulo: "Agregar registro a la planilla",
                queHace: "Elige el cliente y su documento, pon el importe cobrado en S/ y la forma de pago, adjunta el voucher y pulsa Agregar registro a la planilla.",
                seGuarda: "Cada registro queda en la planilla, con sus vouchers adjuntos.",
                tablas: "tmp_planilla_detalle, planilla_detalle_vouchers",
            },
            {
                guia: "cerrar-y-enviar",
                titulo: "Cerrar y enviar",
                queHace: "Cuando termines, revisa los totales y pulsa Cerrar y enviar.",
                quePasa: "La planilla pasa a Enviada y aparece en Validar planillas para revisarla.",
                seGuarda: "En la planilla: estado Enviada.",
                tablas: "tmp_planilla_cabecera",
                despues: "Ve a Validar planillas y valídala.",
            },
        ],
    },

    // ─────────────────────────────────────────────────────────────────────
    {
        ruta: RUTA_CLIENTE_COBRANZA,
        nombre: "Cliente Cobranza",
        grupo: "Cobranza",
        resumen: "Aquí consultas los cobros (amortizaciones) ya registrados de cada cliente, con su kardex y su asiento en el mayor.",
        pasos: [
            {
                guia: "aviso-mantenimiento",
                titulo: "Aviso de mantenimiento",
                queHace: "Por ahora no se pueden grabar cobros nuevos desde aquí. Regístralos en el sistema anterior (Access).",
                quePasa: "Sí puedes buscar cobros y ver su kardex y su mayor.",
            },
            {
                guia: "buscar-cobros",
                titulo: "Buscar",
                queHace: "Pulsa Buscar para abrir la lista de cobros registrados.",
                quePasa: SOLO_CONSULTA,
            },
            {
                guia: "buscar-filtros",
                titulo: "Filtrar cobros",
                queHace: "Pon Fecha desde y Fecha hasta, o escribe el cliente, la planilla, el vendedor o el N° de documento. Luego pulsa Filtrar.",
                quePasa: SOLO_CONSULTA,
                tablas: "amortizaciones",
            },
            {
                guia: "buscar-tabla",
                titulo: "Kardex y L. Mayor",
                queHace: "En cada cobro, pulsa Kardex para ver el movimiento en la cuenta corriente del cliente, o L. Mayor para ver su asiento contable.",
                tablas: "kardex clientes, mayor auxiliar",
            },
            {
                titulo: "Eliminar",
                queHace: "Pulsa Eliminar en la fila del cobro que está mal y confirma.",
                quePasa: "Se borra el cobro junto con su movimiento en el kardex y su asiento en el mayor. No se puede deshacer.",
                seGuarda: "Se borra el cobro, su kardex y su asiento: el saldo de la factura vuelve a subir.",
                tablas: "amortizaciones, kardex clientes, mayor auxiliar",
            },
            {
                titulo: "Revertir planilla",
                queHace: "Solo aparece en cobros que vinieron de una Planilla de Cobranza. Quita de golpe todos los cobros de esa planilla.",
                quePasa: "Se borran sus cobros, su kardex y su asiento, y la planilla vuelve a quedar Validada.",
                seGuarda: "Se borran los cobros de la planilla; la planilla regresa a Validada.",
                tablas: "amortizaciones, kardex clientes, mayor auxiliar, tmp_planilla_cabecera",
                despues: "Después puedes enviarla a caja desde Planilla de Cobranza.",
            },
            {
                guia: "identificacion",
                titulo: "Identificación",
                queHace: "Elige el cliente; el vendedor se llena solo. El Nro. Planilla se asigna al guardar.",
                quePasa: "Si pulsaste Editar en la lista, el cobro se carga aquí en solo lectura. Para corregirlo, elimínalo y vuelve a cargarlo.",
            },
            {
                guia: "buscar-documento",
                titulo: "Buscar documento del cliente",
                queHace: "Con el cliente elegido, pulsa aquí y elige el documento que paga.",
                quePasa: "Se llenan solos el tipo, la serie, el número, la moneda y el saldo, tomados del kardex. " + SOLO_CONSULTA,
            },
            {
                guia: "cobro-amortizacion",
                titulo: "Cobro y amortización",
                queHace: "Pon la fecha del cobro y el importe en S/. Viene con el saldo del documento: bájalo si es un pago parcial.",
                quePasa: "Elige también el tipo de amortización, el N° del documento de pago, el banco y el vendedor.",
            },
            {
                guia: "observaciones",
                titulo: "Observaciones",
                queHace: "Escribe aquí cualquier nota del cobro. Es opcional, hasta 500 caracteres.",
            },
            {
                guia: "limpiar",
                titulo: "Limpiar",
                queHace: "Borra lo que escribiste en el formulario para empezar de nuevo.",
                quePasa: "No guarda nada.",
            },
            {
                guia: "guardar",
                titulo: "Guardar",
                queHace: "Graba el cobro nuevo. Hoy está desactivado mientras dure el mantenimiento.",
                quePasa: "Mientras tanto, registra el cobro en Access.",
            },
        ],
    },

    // ─────────────────────────────────────────────────────────────────────
    {
        ruta: RUTA_ASIGNACION,
        nombre: "Asignación de Cobranzas",
        grupo: "Cobranza",
        resumen: "Aquí repartes entre los vendedores las facturas pendientes de cobro y sigues cómo va cada gestión.",
        pasos: [
            {
                guia: "pestanas-asignacion",
                titulo: "Por asignar / Asignadas",
                queHace: "En Por asignar están las facturas con saldo que nadie está cobrando. En Asignadas ves las que ya repartiste.",
            },
            {
                guia: "tarjetas-resumen",
                titulo: "Tarjetas de resumen",
                queHace: "Mira cuántas facturas hay y por cuánto. Haz clic en una tarjeta, por ejemplo Vencidas o Pagadas, para filtrar la lista.",
                quePasa: SOLO_CONSULTA,
            },
            {
                guia: "filtros-asignacion",
                titulo: "Buscar y filtrar",
                queHace: "Busca por cliente, RUC, serie o número, elige el vendedor y marca el vencimiento. En Asignadas también filtras por estado.",
                quePasa: SOLO_CONSULTA,
            },
            {
                guia: "tabla-por-asignar",
                titulo: "Facturas por asignar",
                queHace: "Marca las facturas que quieres repartir: clic en la fila o en su casilla. Clic en el título de una columna para ordenar.",
                quePasa: "El saldo sale de la cuenta corriente del cliente, así que baja cuando el cobro se acepta en Libro Caja.",
                tablas: "vta_comprobante_sunat, kardex clientes",
            },
            {
                guia: "seleccionar-filtro",
                titulo: "Seleccionar las del filtro",
                queHace: "Pulsa este botón para marcar todas las facturas del filtro, no solo las de esta página.",
            },
            {
                guia: "barra-asignar",
                titulo: "Asignar a cobranza",
                queHace: "Con las facturas marcadas, pulsa Asignar a cobranza. Elige a qué vendedor va cada grupo y pulsa Confirmar y avisar.",
                quePasa: "Cada vendedor recibe un WhatsApp con sus facturas nuevas. Las facturas pasan a la pestaña Asignadas.",
                seGuarda: "En la asignación de cobranza de cada factura.",
                tablas: "t_cobranza_asignacion",
            },
            {
                guia: "tabla-asignadas",
                titulo: "Facturas asignadas",
                queHace: "Revisa a quién se asignó cada factura, su saldo actual, su vencimiento y su estado.",
                quePasa: "Los estados son Pendiente, En gestión, Promesa de pago, Vencido, Pagado e Incobrable. " + SOLO_CONSULTA,
                tablas: "t_cobranza_asignacion, kardex clientes",
            },
            {
                guia: "acciones-asignada",
                titulo: "Actualizar gestión",
                queHace: "Pulsa el lápiz para cambiar el estado, escribir un comentario y, si quieres, adjuntar el comprobante. Luego pulsa Guardar.",
                seGuarda: "En la asignación: el estado nuevo, el comentario en su historial y el comprobante adjunto.",
                tablas: "t_cobranza_asignacion, t_cobranza_comentario, t_cobranza_evidencia",
            },
            {
                titulo: "Ver comprobante",
                queHace: "Pulsa el ojo para ver el comprobante que subió el vendedor. Como administrador también puedes eliminarlo.",
                tablas: "t_cobranza_evidencia",
            },
            {
                titulo: "Retirar asignación",
                queHace: "Pulsa el tacho para quitarle la factura al vendedor y confirma con Retirar.",
                quePasa: "La factura vuelve a Por asignar. Se pierden sus comentarios y el comprobante adjunto. No se puede deshacer.",
                seGuarda: "Se borra la asignación de esa factura.",
                tablas: "t_cobranza_asignacion",
            },
            {
                titulo: "Exportar PDF",
                queHace: "En la pestaña Asignadas, pulsa Exportar PDF para sacar un reporte con los filtros que tengas puestos.",
                quePasa: SOLO_CONSULTA,
            },
        ],
    },

    // ─────────────────────────────────────────────────────────────────────
    {
        ruta: RUTA_RECIBO,
        nombre: "Recibo Cuenta Cliente",
        grupo: "Cobranza",
        resumen: "Aquí emites el recibo de cobranza que firma el cliente; se envía a Gerencia por WhatsApp y queda en el historial.",
        pasos: [
            {
                guia: "solicitar-permiso",
                titulo: "Solicitar permiso",
                queHace: "Si el formulario aparece bloqueado, pulsa Solicitar permiso y espera a que Gerencia te autorice.",
                quePasa: "Con el permiso aprobado verás «Permiso vigente» y una cuenta regresiva con el tiempo que te queda para emitir.",
                seGuarda: "En las solicitudes de permiso de recibos.",
                tablas: "vta_recibo_permiso",
            },
            {
                guia: "conceptos",
                titulo: "Concepto",
                queHace: "Marca el concepto del recibo: PAGO A CTA., DSCT P.P., GASTOS u OTROS. Es obligatorio.",
                quePasa: "Debajo puedes cambiar la ciudad y la fecha del recibo.",
            },
            {
                guia: "cliente",
                titulo: "Hemos recibido de",
                queHace: "Busca el cliente por nombre, código o RUC.",
                quePasa: "El RUC y la zona se llenan solos.",
            },
            {
                guia: "documentos",
                titulo: "Documentos que paga",
                queHace: "Pulsa + Buscar comprobante del cliente y elige los documentos pendientes. El importe viene con el saldo: bájalo si es un pago parcial.",
                quePasa: "Todos los documentos deben ser de la misma moneda. Para otra moneda, emite otro recibo.",
            },
            {
                guia: "tipo-liquidacion",
                titulo: "Tipo de liquidación",
                queHace: "Marca 1 CLIENTE, 2 PLANILLA o 3 ULT. LIQ. Si marcas PLANILLA, escribe el N° de planilla.",
            },
            {
                guia: "firmas",
                titulo: "Firmas",
                queHace: "Pide al cliente que firme y selle en su recuadro, y firma tú en el del vendedor. Las dos firmas son obligatorias.",
            },
            {
                guia: "limpiar-todo",
                titulo: "Limpiar todo",
                queHace: "Borra todo el formulario, firmas incluidas, para empezar de nuevo.",
                quePasa: "No guarda nada.",
            },
            {
                guia: "generar-recibo",
                titulo: "Generar recibo",
                queHace: "Cuando todo esté completo, pulsa Generar recibo.",
                quePasa: "Se asigna el N° de recibo, se arma el PDF y se envía por WhatsApp a Gerencia. El recibo no baja el saldo de las facturas: eso pasa cuando el cobro se acepta en Libro Caja.",
                seGuarda: "En el registro de recibos: cabecera, documentos y firmas.",
                tablas: "vta_recibo_cliente_cab, vta_recibo_cliente_det, vta_otros_correlativos",
            },
            {
                guia: "tab-historial",
                titulo: "Historial",
                queHace: "Abre la pestaña Historial para ver los recibos ya emitidos.",
            },
            {
                guia: "historial-filtros",
                titulo: "Buscar recibos",
                queHace: "Pon las fechas, elige el estado (Emitido o Anulado) o escribe el N° de recibo, el cliente o el RUC. Luego pulsa Buscar.",
                quePasa: SOLO_CONSULTA,
                tablas: "vta_recibo_cliente_cab",
            },
            {
                guia: "historial-acciones",
                titulo: "Ver detalle y Descargar PDF",
                queHace: "Pulsa el ojo para ver el recibo; ahí puedes adjuntar los vouchers con Adjuntar. La flecha descarga el PDF.",
                seGuarda: "Los vouchers adjuntos quedan con el recibo.",
                tablas: "vta_recibo_voucher",
            },
            {
                titulo: "Anular recibo",
                queHace: "Pulsa el botón rojo y escribe el motivo.",
                quePasa: "Si eres administrador, el recibo queda Anulado al momento. Si no, se envía una solicitud y verás «Por aprobar» hasta que Gerencia la apruebe.",
                seGuarda: "En el recibo (estado Anulado) o en la solicitud de anulación.",
                tablas: "vta_recibo_cliente_cab, vta_recibo_anulacion_solicitud",
            },
        ],
    },

    // ─────────────────────────────────────────────────────────────────────
    {
        ruta: RUTA_LIBRO_CAJA,
        nombre: "Libro Caja y Bancos",
        grupo: "Datos de Movimientos",
        resumen: "Aquí llevas el voucher diario de cada caja o banco y aceptas los cobros que llegan de las planillas de cobranza.",
        pasos: [
            {
                guia: "caja-fecha",
                titulo: "Caja y Fecha",
                queHace: "En la pestaña Vouchers, elige la caja o banco y la fecha. Usa las flechas o Hoy para moverte de día.",
                quePasa: "Hay un solo voucher por caja y por día. " + SOLO_CONSULTA,
            },
            {
                guia: "consultar",
                titulo: "Consultar",
                queHace: "Pulsa Consultar para abrir el voucher de esa caja y fecha, si ya existe.",
                quePasa: "Arriba verás el N° de voucher y los totales de Ingresos, Egresos y Diferencia en S/. " + SOLO_CONSULTA,
            },
            {
                guia: "nuevo-voucher",
                titulo: "Nuevo voucher",
                queHace: "Pulsa Nuevo voucher para crear el voucher del día de esa caja. Si ya existe, simplemente lo abre.",
                seGuarda: "La cabecera del voucher de caja.",
                tablas: "caja encabezado",
            },
            {
                guia: "lineas-voucher",
                titulo: "Líneas del voucher",
                queHace: "Llena cada línea: documento, persona, detalle, Ingreso o Egreso (nunca los dos), tipo de pago, cuenta contable y centro de costos. Usa Agregar línea o Enter para seguir.",
                quePasa: "Las líneas con la marca PLAN. vienen de una planilla de cobranza: no se cambian aquí, se quitan con Revertir en el Historial.",
            },
            {
                guia: "guardar-voucher",
                titulo: "Guardar",
                queHace: "Pulsa Guardar para grabar las líneas. Toda línea con importe necesita cuenta contable.",
                quePasa: "Se vuelve a armar el asiento contable del voucher y la cuenta corriente de clientes y proveedores. Si la fecha está dentro del cierre contable, no se guarda.",
                seGuarda: "Voucher de caja, asiento contable y kardex de clientes y proveedores.",
                tablas: "caja centralizacion, mayor auxiliar, kardex clientes, kardex proveedores",
            },
            {
                guia: "eliminar-marcadas",
                titulo: "Eliminar marcadas",
                queHace: "Marca la casilla de las líneas que sobran y pulsa Eliminar marcadas.",
                quePasa: "Se guarda el voucher, se borran esas líneas y se vuelve a armar el asiento. No se puede deshacer.",
                seGuarda: "Se borran las líneas y se regenera el asiento y el kardex.",
                tablas: "caja centralizacion, mayor auxiliar, kardex clientes, kardex proveedores",
            },
            {
                guia: "eliminar-voucher",
                titulo: "Eliminar voucher",
                queHace: "Borra el voucher completo junto con su asiento. Solo procede si sus líneas no tienen importes.",
                seGuarda: "Se borra el voucher, su asiento y sus movimientos de kardex.",
                tablas: "caja encabezado, caja centralizacion, mayor auxiliar, kardex clientes, kardex proveedores",
            },
            {
                guia: "tab-planillas",
                titulo: "Planillas de cobranza",
                queHace: "Abre esta pestaña para ver los cobros que el administrador mandó con Enviar a caja. El número azul dice cuántos esperan.",
                tablas: "planilla_detalle_caja",
            },
            {
                guia: "planilla-pendiente",
                titulo: "Revisar cada cobro",
                queHace: "Revisa cliente, documento, importe y forma de pago. Pon la fecha y elige la caja o banco donde entró el dinero: vienen sugeridas.",
                quePasa: "La caja debe ser de la misma moneda que el documento, y el cliente debe tener cuenta por cobrar en su ficha. Marca los cobros con su casilla o usa Aceptar todo para toda la planilla.",
            },
            {
                guia: "aceptar-seleccionados",
                titulo: "Aceptar seleccionados",
                queHace: "Con los cobros marcados, pulsa Aceptar seleccionados y confirma con Sí, aceptar.",
                quePasa: "Cada cobro entra como línea al voucher de esa caja y fecha (si no existe, se crea). Se arma el asiento y baja el saldo de la factura del cliente.",
                seGuarda: "Voucher de caja del día, asiento contable y kardex del cliente; el cobro queda Aceptado.",
                tablas: "planilla_detalle_caja, caja encabezado, caja centralizacion, mayor auxiliar, kardex clientes",
                despues: "En la pestaña Vouchers, abre esa caja y fecha para ver las líneas PLAN.",
            },
            {
                guia: "rechazar",
                titulo: "Rechazar",
                queHace: "Si un cobro no cuadra, márcalo, pulsa Rechazar y escribe el motivo. El motivo es obligatorio.",
                quePasa: "El cobro vuelve al administrador en Planilla de Cobranza con tu motivo, para que lo corrija y lo reenvíe. No toca el libro.",
                seGuarda: "En el cobro: estado Rechazado y el motivo.",
                tablas: "planilla_detalle_caja",
            },
            {
                guia: "pendientes-historial",
                titulo: "Historial y Revertir",
                queHace: "Pulsa Historial para ver lo aceptado y rechazado en unas fechas. Si un cobro aceptado estaba mal, pulsa Revertir.",
                quePasa: "Revertir saca el cobro del voucher, vuelve a armar el asiento y la deuda del cliente sube otra vez. El cobro queda de nuevo pendiente.",
                seGuarda: "Se borra la línea del voucher y se regenera el asiento y el kardex.",
                tablas: "caja centralizacion, mayor auxiliar, kardex clientes, planilla_detalle_caja",
            },
        ],
    },
]

export const caminos: CaminoGuia[] = [
    {
        id: "cobranza-planilla-a-caja",
        titulo: "De la planilla de cobranza al Libro Caja",
        descripcion: "Cómo un cobro del vendedor llega al voucher de caja, genera el asiento y baja el saldo de la factura.",
        etapas: [
            {
                titulo: "Registrar la planilla",
                ruta: RUTA_PLANILLA,
                quien: "Vendedor",
                queHace: "El vendedor crea la planilla del día, agrega cada documento cobrado con su importe en S/ y su voucher, y pulsa Cerrar y enviar. Un administrador también puede hacerlo en Crear planilla.",
                seGuarda: "Planilla de cobranza en estado Enviada.",
                despues: "La planilla aparece en Validar planillas.",
            },
            {
                titulo: "Validar la planilla",
                ruta: RUTA_PLANILLA,
                quien: "Administrador",
                queHace: "Abre la planilla, revisa los registros y pulsa Validar planilla. Si algo está mal, la devuelve con Rechazar / observar.",
                seGuarda: "Planilla en estado Validada (u Observada, si se devolvió).",
            },
            {
                titulo: "Enviar a caja",
                ruta: RUTA_PLANILLA,
                quien: "Administrador",
                queHace: "Pulsa Enviar a caja. Solo van los cobros con importe.",
                seGuarda: "Bandeja de cobros pendientes de caja. La factura todavía no baja su saldo.",
                despues: "Contabilidad ve los cobros en Libro Caja y Bancos › Planillas de cobranza.",
            },
            {
                titulo: "Aceptar en caja",
                ruta: RUTA_LIBRO_CAJA,
                quien: "Contabilidad",
                queHace: "En Planillas de cobranza revisa cada cobro, elige la fecha y la caja o banco, y pulsa Aceptar seleccionados. Si no cuadra, usa Rechazar con un motivo.",
                seGuarda: "El cobro queda Aceptado.",
            },
            {
                titulo: "Asiento y saldo",
                quien: "Automático",
                queHace: "Al aceptar, cada cobro entra como línea al voucher del día de esa caja. Se arma el asiento contable y baja el saldo de la factura en la cuenta corriente del cliente.",
                seGuarda: "Voucher de caja, asiento contable (mayor auxiliar) y kardex de clientes.",
            },
            {
                titulo: "Dónde se ve",
                ruta: RUTA_LIBRO_CAJA,
                quien: "Contabilidad",
                queHace: "En Libro Caja y Bancos › Vouchers abre esa caja y fecha: verás las líneas PLAN. En Planilla de Cobranza la planilla dice «En el libro» y en qué voucher entró cada cobro. En Asignación de Cobranzas el saldo de la factura ya sale rebajado.",
            },
            {
                titulo: "Si hay que corregir",
                ruta: RUTA_LIBRO_CAJA,
                quien: "Contabilidad",
                queHace: "En Planillas de cobranza › Historial pulsa Revertir. El cobro sale del voucher, se rearma el asiento y la deuda del cliente vuelve a subir.",
                seGuarda: "El cobro vuelve a quedar pendiente en caja.",
                despues: "Se puede volver a aceptar, o el administrador puede eliminar la planilla si ya no tiene cobros aceptados.",
            },
        ],
    },
    {
        id: "cobranza-rechazo-en-caja",
        titulo: "Cobro rechazado en caja",
        descripcion: "Qué pasa cuando contabilidad rechaza un cobro de planilla y cómo se vuelve a enviar.",
        etapas: [
            {
                titulo: "Rechazar con motivo",
                ruta: RUTA_LIBRO_CAJA,
                quien: "Contabilidad",
                queHace: "En Planillas de cobranza marca el cobro que no cuadra, pulsa Rechazar y escribe el motivo.",
                seGuarda: "El cobro queda Rechazado con su motivo. No toca el libro.",
            },
            {
                titulo: "Ver el rechazo",
                ruta: RUTA_PLANILLA,
                quien: "Administrador",
                queHace: "La planilla muestra «Rechazados en caja». Al abrirla ve cada cobro rechazado con el motivo de contabilidad.",
            },
            {
                titulo: "Reenviar",
                ruta: RUTA_PLANILLA,
                quien: "Administrador",
                queHace: "Después de revisar, pulsa Reenviar rechazados a caja.",
                seGuarda: "Los cobros rechazados vuelven a quedar pendientes en caja.",
                despues: "Contabilidad los vuelve a ver en Libro Caja y Bancos › Planillas de cobranza.",
            },
        ],
    },
    {
        id: "cobranza-asignacion",
        titulo: "Asignar facturas por cobrar",
        descripcion: "Cómo se reparten las facturas pendientes entre los vendedores y cómo se sigue su cobro.",
        etapas: [
            {
                titulo: "Elegir facturas",
                ruta: RUTA_ASIGNACION,
                quien: "Administrador",
                queHace: "En Por asignar filtra por vencimiento o vendedor y marca las facturas que se deben cobrar.",
            },
            {
                titulo: "Asignar y avisar",
                ruta: RUTA_ASIGNACION,
                quien: "Administrador",
                queHace: "Pulsa Asignar a cobranza, elige el vendedor de cada grupo y pulsa Confirmar y avisar.",
                seGuarda: "Asignación de cobranza de cada factura. El vendedor recibe un WhatsApp.",
            },
            {
                titulo: "Gestionar el cobro",
                ruta: RUTA_ASIGNACION,
                quien: "Vendedor",
                queHace: "El vendedor actualiza el estado (En gestión, Promesa de pago, Pagado…), deja comentarios y sube el comprobante.",
                seGuarda: "Estado, comentarios y comprobante de la asignación.",
            },
            {
                titulo: "El saldo baja",
                ruta: RUTA_LIBRO_CAJA,
                quien: "Contabilidad",
                queHace: "Cuando el cobro llega por planilla y se acepta en Libro Caja, el saldo actual de la factura baja también en Asignadas.",
            },
        ],
    },
]
